import { AbstractAgent, type AgentConfig } from "@ag-ui/client";
import {
    EventType,
    type BaseEvent,
    type RunAgentInput,
    type Message,
    type Tool,
} from "@ag-ui/core";
import { Observable } from "rxjs";

/** OpenAI chat completion message format. */
interface OpenAIMessage {
    role: "system" | "developer" | "user" | "assistant" | "tool";
    content?: string | null;
    tool_calls?: OpenAIToolCall[];
    tool_call_id?: string;
}

interface OpenAIToolCall {
    id: string;
    type: "function";
    function: { name: string; arguments: string };
}

interface OpenAITool {
    type: "function";
    function: {
        name: string;
        description: string;
        parameters?: Record<string, unknown>;
    };
}

/** Streaming SSE chunk from OpenAI. */
interface OpenAIChunkDelta {
    content?: string | null;
    tool_calls?: Array<{
        index: number;
        id?: string;
        function?: { name?: string; arguments?: string };
    }>;
}

interface OpenAIChunk {
    id: string;
    choices: Array<{
        index: number;
        delta: OpenAIChunkDelta;
        finish_reason: string | null;
    }>;
}

export interface OpenAIAgentConfig extends AgentConfig {
    /** OpenAI API key. */
    apiKey: string;
    /** Model identifier, e.g. "gpt-4o". */
    model?: string;
    /** Base URL for the OpenAI-compatible API. Defaults to https://api.openai.com/v1 */
    baseUrl?: string;
}

/**
 * An AG-UI agent that calls the OpenAI Chat Completions API directly
 * from the browser — no backend server required.
 */
export class OpenAIAgent extends AbstractAgent {
    private apiKey: string;
    private model: string;
    private baseUrl: string;
    private abortController: AbortController | null = null;

    constructor(config: OpenAIAgentConfig) {
        super(config);
        this.apiKey = config.apiKey;
        this.model = config.model ?? "gpt-4o";
        this.baseUrl = (config.baseUrl ?? "https://api.openai.com/v1").replace(
            /\/$/,
            "",
        );
        this.description =
            config.description ?? "OpenAI direct agent (browser-side)";
    }

    run(input: RunAgentInput): Observable<BaseEvent> {
        return new Observable<BaseEvent>((subscriber) => {
            this.abortController = new AbortController();
            const signal = this.abortController.signal;

            const process = async () => {
                // Emit RUN_STARTED
                subscriber.next({
                    type: EventType.RUN_STARTED,
                    threadId: input.threadId,
                    runId: input.runId,
                } as BaseEvent);

                try {
                    const messages = this.convertMessages(input);
                    const tools = this.convertTools(input.tools);

                    const body: Record<string, unknown> = {
                        model: this.model,
                        messages,
                        stream: true,
                    };
                    if (tools.length > 0) {
                        body.tools = tools;
                    }

                    const response = await fetch(
                        `${this.baseUrl}/chat/completions`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${this.apiKey}`,
                            },
                            body: JSON.stringify(body),
                            signal,
                        },
                    );

                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(
                            `OpenAI API error ${response.status}: ${errorText}`,
                        );
                    }

                    await this.processStream(
                        response,
                        input,
                        subscriber,
                        signal,
                    );

                    // Emit RUN_FINISHED
                    subscriber.next({
                        type: EventType.RUN_FINISHED,
                        threadId: input.threadId,
                        runId: input.runId,
                    } as BaseEvent);

                    subscriber.complete();
                } catch (err) {
                    if (signal.aborted) {
                        subscriber.complete();
                        return;
                    }
                    const message =
                        err instanceof Error ? err.message : String(err);
                    subscriber.next({
                        type: EventType.RUN_ERROR,
                        message,
                    } as BaseEvent);
                    subscriber.error(err);
                }
            };

            process();

            // Teardown: abort fetch if the Observable is unsubscribed
            return () => {
                this.abortController?.abort();
            };
        });
    }

    override abortRun(): void {
        this.abortController?.abort();
    }

    override clone(): OpenAIAgent {
        return new OpenAIAgent({
            apiKey: this.apiKey,
            model: this.model,
            baseUrl: this.baseUrl,
            agentId: this.agentId,
            description: this.description,
            threadId: this.threadId,
            initialMessages: [...this.messages],
            initialState: this.state,
        });
    }

    // ── Message conversion ──

    private convertMessages(input: RunAgentInput): OpenAIMessage[] {
        const result: OpenAIMessage[] = [];

        // Inject agent context as system messages
        if (input.context?.length) {
            for (const ctx of input.context) {
                result.push({ role: "system", content: ctx.value });
            }
        }

        for (const msg of input.messages) {
            const converted = this.convertMessage(msg);
            if (converted) result.push(converted);
        }

        return result;
    }

    private convertMessage(msg: Message): OpenAIMessage | null {
        switch (msg.role) {
            case "system":
                return { role: "system", content: msg.content };
            case "developer":
                return { role: "developer", content: msg.content };
            case "user":
                return { role: "user", content: msg.content as string };
            case "assistant": {
                const openaiMsg: OpenAIMessage = {
                    role: "assistant",
                    content: msg.content ?? null,
                };
                if (msg.toolCalls?.length) {
                    openaiMsg.tool_calls = msg.toolCalls.map((tc) => ({
                        id: tc.id,
                        type: "function" as const,
                        function: {
                            name: tc.function.name,
                            arguments: tc.function.arguments,
                        },
                    }));
                }
                return openaiMsg;
            }
            case "tool":
                return {
                    role: "tool",
                    tool_call_id: msg.toolCallId,
                    content: msg.content,
                };
            default:
                // Skip activity, reasoning, etc.
                return null;
        }
    }

    // ── Tool conversion ──

    private convertTools(tools: Tool[]): OpenAITool[] {
        return tools.map((tool) => ({
            type: "function" as const,
            function: {
                name: tool.name,
                description: tool.description,
                ...(tool.parameters ? { parameters: tool.parameters } : {}),
            },
        }));
    }

    // ── Stream processing ──

    private async processStream(
        response: Response,
        input: RunAgentInput,
        subscriber: {
            next: (event: BaseEvent) => void;
        },
        signal: AbortSignal,
    ): Promise<void> {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        // Track state for text message and tool calls
        let textMessageId: string | null = null;
        const activeToolCalls = new Map<
            number,
            { id: string; name: string; started: boolean }
        >();

        try {
            while (true) {
                if (signal.aborted) break;

                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // Process complete SSE lines
                const lines = buffer.split("\n");
                // Keep the last potentially incomplete line in the buffer
                buffer = lines.pop() ?? "";

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || !trimmed.startsWith("data: ")) continue;

                    const data = trimmed.slice(6);
                    if (data === "[DONE]") continue;

                    let chunk: OpenAIChunk;
                    try {
                        chunk = JSON.parse(data);
                    } catch {
                        continue;
                    }

                    const choice = chunk.choices?.[0];
                    if (!choice) continue;

                    const delta = choice.delta;

                    // Handle text content
                    if (delta.content) {
                        if (!textMessageId) {
                            textMessageId = `msg-${input.runId}`;
                            subscriber.next({
                                type: EventType.TEXT_MESSAGE_START,
                                messageId: textMessageId,
                                role: "assistant",
                            } as BaseEvent);
                        }
                        subscriber.next({
                            type: EventType.TEXT_MESSAGE_CONTENT,
                            messageId: textMessageId,
                            delta: delta.content,
                        } as BaseEvent);
                    }

                    // Handle tool calls
                    if (delta.tool_calls) {
                        for (const tc of delta.tool_calls) {
                            let active = activeToolCalls.get(tc.index);

                            if (tc.id && !active) {
                                // New tool call starting
                                active = {
                                    id: tc.id,
                                    name: tc.function?.name ?? "",
                                    started: false,
                                };
                                activeToolCalls.set(tc.index, active);
                            }

                            if (!active) continue;

                            // Update name if provided
                            if (tc.function?.name) {
                                active.name = tc.function.name;
                            }

                            // Emit TOOL_CALL_START once we have both id and name
                            if (!active.started && active.id && active.name) {
                                // Close any open text message first
                                if (textMessageId) {
                                    subscriber.next({
                                        type: EventType.TEXT_MESSAGE_END,
                                        messageId: textMessageId,
                                    } as BaseEvent);
                                    textMessageId = null;
                                }

                                active.started = true;
                                subscriber.next({
                                    type: EventType.TOOL_CALL_START,
                                    toolCallId: active.id,
                                    toolCallName: active.name,
                                } as BaseEvent);
                            }

                            // Stream arguments
                            if (tc.function?.arguments && active.started) {
                                subscriber.next({
                                    type: EventType.TOOL_CALL_ARGS,
                                    toolCallId: active.id,
                                    delta: tc.function.arguments,
                                } as BaseEvent);
                            }
                        }
                    }

                    // Handle finish
                    if (choice.finish_reason) {
                        // Close any open text message
                        if (textMessageId) {
                            subscriber.next({
                                type: EventType.TEXT_MESSAGE_END,
                                messageId: textMessageId,
                            } as BaseEvent);
                            textMessageId = null;
                        }

                        // Close all open tool calls
                        for (const [, active] of activeToolCalls) {
                            if (active.started) {
                                subscriber.next({
                                    type: EventType.TOOL_CALL_END,
                                    toolCallId: active.id,
                                } as BaseEvent);
                            }
                        }
                        activeToolCalls.clear();
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
    }
}
