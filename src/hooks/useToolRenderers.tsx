import { useRenderTool } from "@copilotkit/react-core/v2";
import { z } from "zod";
import { TimeCard } from "../components/TimeCard";
import { WeatherCard, type WeatherToolResult } from "../components/WeatherCard";

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Shared result-table renderer used by both query tools. */
function renderQueryResult(result: string, queryLabel: string, queryText: string) {
    let rows: Record<string, unknown>[];
    try {
        rows = JSON.parse(result);
    } catch {
        return (
            <div className="query-render">
                <div className="query-header query-complete">
                    <span>Query complete</span>
                </div>
                <pre className="query-code">{result}</pre>
            </div>
        );
    }

    if (!Array.isArray(rows) || rows.length === 0) {
        return (
            <div className="query-render">
                <div className="query-header query-complete">
                    <span>No results returned</span>
                </div>
                <details className="query-details">
                    <summary>{queryLabel}</summary>
                    <pre className="query-code">{queryText}</pre>
                </details>
            </div>
        );
    }

    // Derive columns from the first row, filtering out OData metadata keys
    const columns = Object.keys(rows[0]).filter(
        (k) => !k.startsWith("@") && !k.startsWith("_") && !k.endsWith("@OData.Community.Display.V1.FormattedValue"),
    );

    // Helper to get the display value for a cell
    const cellValue = (row: Record<string, unknown>, col: string): string => {
        const formatted = row[`${col}@OData.Community.Display.V1.FormattedValue`];
        if (formatted !== undefined) return String(formatted);
        const val = row[col];
        if (val === null || val === undefined) return "";
        if (typeof val === "object") return JSON.stringify(val);
        return String(val);
    };

    return (
        <div className="query-render">
            <div className="query-header query-complete">
                <span>{rows.length} record{rows.length !== 1 ? "s" : ""} returned</span>
            </div>
            <details className="query-details" open>
                <summary>Results</summary>
                <div className="query-table-wrap">
                    <table className="query-table">
                        <thead>
                            <tr>
                                {columns.map((col) => (
                                    <th key={col}>{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, i) => (
                                <tr key={i}>
                                    {columns.map((col) => (
                                        <td key={col}>{cellValue(row, col)}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </details>
            <details className="query-details">
                <summary>{queryLabel}</summary>
                <pre className="query-code">{queryText}</pre>
            </details>
        </div>
    );
}

export function useToolRenderers() {
    useRenderTool(
        {
            name: "fetchxml_query",
            parameters: z.object({
                fetchXml: z.string().describe("Complete FetchXML query string"),
            }),
            render: ({ status, parameters, result }) => {
                if (status === "inProgress") {
                    return (
                        <div className="query-render">
                            <div className="query-header">
                                <span className="query-spinner" />
                                <span>Preparing FetchXML query...</span>
                            </div>
                        </div>
                    );
                }
                if (status === "executing") {
                    return (
                        <div className="query-render">
                            <div className="query-header">
                                <span className="query-spinner" />
                                <span>Executing FetchXML query...</span>
                            </div>
                            <details className="query-details">
                                <summary>FetchXML</summary>
                                <pre className="query-code">{parameters.fetchXml}</pre>
                            </details>
                        </div>
                    );
                }
                return renderQueryResult(result, "FetchXML", parameters.fetchXml);
            },
        },
        [],
    );

    useRenderTool(
        {
            name: "odata_query",
            parameters: z.object({
                odataQuery: z.string().describe("OData query string"),
            }),
            render: ({ status, parameters, result }) => {
                if (status === "inProgress") {
                    return (
                        <div className="query-render">
                            <div className="query-header">
                                <span className="query-spinner" />
                                <span>Preparing OData query...</span>
                            </div>
                        </div>
                    );
                }
                if (status === "executing") {
                    return (
                        <div className="query-render">
                            <div className="query-header">
                                <span className="query-spinner" />
                                <span>Executing OData query...</span>
                            </div>
                            <details className="query-details">
                                <summary>OData Query</summary>
                                <pre className="query-code">{parameters.odataQuery}</pre>
                            </details>
                        </div>
                    );
                }
                return renderQueryResult(result, "OData Query", parameters.odataQuery);
            },
        },
        [],
    );

    // ── write_file ──

    useRenderTool(
        {
            name: "write_file",
            parameters: z.object({
                path: z.string().describe("Absolute file path to write"),
                content: z.string().describe("Text content to write"),
            }),
            render: ({ status, parameters, result }) => {
                const fileName = parameters.path?.split(/[/\\]/).pop() ?? parameters.path;
                if (status === "inProgress") {
                    return (
                        <div className="tool-render">
                            <div className="tool-render-header">
                                <span className="query-spinner" />
                                <span>Preparing to write file...</span>
                            </div>
                        </div>
                    );
                }
                if (status === "executing") {
                    return (
                        <div className="tool-render">
                            <div className="tool-render-header">
                                <span className="query-spinner" />
                                <span>Writing <code className="tool-render-code">{fileName}</code>...</span>
                            </div>
                        </div>
                    );
                }
                return (
                    <div className="tool-render">
                        <div className="tool-render-header tool-render-success">
                            <span className="tool-render-icon">&#x2713;</span>
                            <span>{result}</span>
                        </div>
                        <details className="query-details">
                            <summary>File content ({parameters.content.split("\n").length} lines)</summary>
                            <pre className="query-code">{parameters.content}</pre>
                        </details>
                    </div>
                );
            },
        },
        [],
    );

    // ── list_directory ──

    useRenderTool(
        {
            name: "list_directory",
            parameters: z.object({
                path: z.string().describe("Absolute directory path to list"),
            }),
            render: ({ status, parameters, result }) => {
                if (status === "inProgress") {
                    return (
                        <div className="tool-render">
                            <div className="tool-render-header">
                                <span className="query-spinner" />
                                <span>Preparing to list directory...</span>
                            </div>
                        </div>
                    );
                }
                if (status === "executing") {
                    return (
                        <div className="tool-render">
                            <div className="tool-render-header">
                                <span className="query-spinner" />
                                <span>Listing <code className="tool-render-code">{parameters.path}</code>...</span>
                            </div>
                        </div>
                    );
                }

                let entries: { name: string; type?: string; size?: number }[];
                try {
                    entries = JSON.parse(result);
                } catch {
                    return (
                        <div className="tool-render">
                            <div className="tool-render-header tool-render-success">
                                <span>Directory listed</span>
                            </div>
                            <pre className="query-code">{result}</pre>
                        </div>
                    );
                }

                if (!Array.isArray(entries) || entries.length === 0) {
                    return (
                        <div className="tool-render">
                            <div className="tool-render-header tool-render-success">
                                <span>Empty directory</span>
                            </div>
                        </div>
                    );
                }

                return (
                    <div className="tool-render">
                        <div className="tool-render-header tool-render-success">
                            <span>{entries.length} item{entries.length !== 1 ? "s" : ""} in <code className="tool-render-code">{parameters.path}</code></span>
                        </div>
                        <div className="dir-list">
                            {entries.map((entry, i) => (
                                <div key={i} className="dir-entry">
                                    <span className="dir-entry-icon">{entry.type === "directory" ? "\u{1F4C1}" : "\u{1F4C4}"}</span>
                                    <span className="dir-entry-name">{entry.name}</span>
                                    {entry.size !== undefined && (
                                        <span className="dir-entry-size">{formatSize(entry.size)}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            },
        },
        [],
    );

    // ── create_terminal ──

    useRenderTool(
        {
            name: "create_terminal",
            parameters: z.object({
                name: z.string().describe("Terminal display name"),
                shell: z.string().optional().describe("Shell to use"),
                cwd: z.string().optional().describe("Working directory"),
            }),
            render: ({ status, parameters, result }) => {
                if (status === "inProgress") {
                    return (
                        <div className="tool-render">
                            <div className="tool-render-header">
                                <span className="query-spinner" />
                                <span>Preparing terminal...</span>
                            </div>
                        </div>
                    );
                }
                if (status === "executing") {
                    return (
                        <div className="tool-render">
                            <div className="tool-render-header">
                                <span className="query-spinner" />
                                <span>Creating terminal <code className="tool-render-code">{parameters.name}</code>...</span>
                            </div>
                        </div>
                    );
                }

                let terminal: { id?: string; name?: string };
                try {
                    terminal = JSON.parse(result);
                } catch {
                    terminal = {};
                }

                return (
                    <div className="tool-render">
                        <div className="tool-render-header tool-render-success">
                            <span className="tool-render-icon">&#x2713;</span>
                            <span>Terminal created: <code className="tool-render-code">{parameters.name}</code></span>
                        </div>
                        <div className="terminal-info">
                            {terminal.id && <div className="terminal-info-row"><span className="terminal-info-label">ID</span><span>{terminal.id}</span></div>}
                            {parameters.shell && <div className="terminal-info-row"><span className="terminal-info-label">Shell</span><span>{parameters.shell}</span></div>}
                            {parameters.cwd && <div className="terminal-info-row"><span className="terminal-info-label">CWD</span><span>{parameters.cwd}</span></div>}
                        </div>
                    </div>
                );
            },
        },
        [],
    );

    // ── get_solutions ──

    useRenderTool(
        {
            name: "get_solutions",
            parameters: z.object({
                selectColumns: z.string().describe("Comma-separated columns to retrieve"),
            }),
            render: ({ status, parameters, result }) => {
                if (status === "inProgress") {
                    return (
                        <div className="tool-render">
                            <div className="tool-render-header">
                                <span className="query-spinner" />
                                <span>Preparing to fetch solutions...</span>
                            </div>
                        </div>
                    );
                }
                if (status === "executing") {
                    return (
                        <div className="tool-render">
                            <div className="tool-render-header">
                                <span className="query-spinner" />
                                <span>Fetching solutions...</span>
                            </div>
                        </div>
                    );
                }

                let solutions: Record<string, unknown>[];
                try {
                    solutions = JSON.parse(result);
                } catch {
                    return (
                        <div className="tool-render">
                            <div className="tool-render-header tool-render-success">
                                <span>Solutions retrieved</span>
                            </div>
                            <pre className="query-code">{result}</pre>
                        </div>
                    );
                }

                if (!Array.isArray(solutions) || solutions.length === 0) {
                    return (
                        <div className="tool-render">
                            <div className="tool-render-header tool-render-success">
                                <span>No solutions found</span>
                            </div>
                        </div>
                    );
                }

                const columns = parameters.selectColumns.split(",").map((c) => c.trim());

                return (
                    <div className="query-render">
                        <div className="query-header query-complete">
                            <span>{solutions.length} solution{solutions.length !== 1 ? "s" : ""}</span>
                        </div>
                        <div className="query-table-wrap">
                            <table className="query-table">
                                <thead>
                                    <tr>
                                        {columns.map((col) => (
                                            <th key={col}>{col}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {solutions.map((sol, i) => (
                                        <tr key={i}>
                                            {columns.map((col) => {
                                                const val = sol[col];
                                                return (
                                                    <td key={col}>
                                                        {val === null || val === undefined
                                                            ? ""
                                                            : typeof val === "object"
                                                              ? JSON.stringify(val)
                                                              : String(val)}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            },
        },
        [],
    );

    // ── create_multiple_records ──

    useRenderTool(
        {
            name: "create_multiple_records",
            parameters: z.object({
                entityLogicalName: z.string().describe("Logical name of the entity"),
                records: z.string().describe("JSON string of array of record objects"),
            }),
            render: ({ status, parameters, result }) => {
                let recordCount = 0;
                try {
                    if (parameters.records) {
                        recordCount = (JSON.parse(parameters.records) as unknown[]).length;
                    }
                } catch { /* ignore */ }

                if (status === "inProgress") {
                    return (
                        <div className="tool-render">
                            <div className="tool-render-header">
                                <span className="query-spinner" />
                                <span>Preparing bulk create...</span>
                            </div>
                        </div>
                    );
                }
                if (status === "executing") {
                    return (
                        <div className="tool-render">
                            <div className="tool-render-header">
                                <span className="query-spinner" />
                                <span>Creating {recordCount} <code className="tool-render-code">{parameters.entityLogicalName}</code> record{recordCount !== 1 ? "s" : ""}...</span>
                            </div>
                        </div>
                    );
                }

                // Parse created IDs from the result string
                let ids: string[] = [];
                const idsMatch = result.match(/IDs:\s*(\[.*\])/);
                if (idsMatch) {
                    try {
                        ids = JSON.parse(idsMatch[1]);
                    } catch { /* ignore */ }
                }

                return (
                    <div className="tool-render">
                        <div className="tool-render-header tool-render-success">
                            <span className="tool-render-icon">&#x2713;</span>
                            <span>Created {ids.length || recordCount} <code className="tool-render-code">{parameters.entityLogicalName}</code> record{(ids.length || recordCount) !== 1 ? "s" : ""}</span>
                        </div>
                        {ids.length > 0 && (
                            <details className="query-details">
                                <summary>Record IDs</summary>
                                <div className="bulk-ids">
                                    {ids.map((id, i) => (
                                        <div key={i} className="bulk-id-row">
                                            <span className="bulk-id-index">{i + 1}</span>
                                            <code className="tool-render-code">{id}</code>
                                        </div>
                                    ))}
                                </div>
                            </details>
                        )}
                        <details className="query-details">
                            <summary>Records payload</summary>
                            <pre className="query-code">{parameters.records ? JSON.stringify(JSON.parse(parameters.records), null, 2) : ""}</pre>
                        </details>
                    </div>
                );
            },
        },
        [],
    );

    // ── create_record ──

    useRenderTool(
        {
            name: "create_record",
            parameters: z.object({
                entityLogicalName: z.string().describe("Logical name of the entity"),
                data: z.string().describe("JSON string of field-value pairs for the new record"),
            }),
            render: ({ status, parameters, result }) => {
                if (status === "inProgress") {
                    return (
                        <div className="tool-render">
                            <div className="tool-render-header">
                                <span className="query-spinner" />
                                <span>Preparing to create record...</span>
                            </div>
                        </div>
                    );
                }
                if (status === "executing") {
                    return (
                        <div className="tool-render">
                            <div className="tool-render-header">
                                <span className="query-spinner" />
                                <span>Creating <code className="tool-render-code">{parameters.entityLogicalName}</code> record...</span>
                            </div>
                        </div>
                    );
                }

                // Extract ID from result like "Record created. ID: <guid>"
                const idMatch = result.match(/ID:\s*(.+)/);
                const recordId = idMatch?.[1]?.trim();

                let prettyData = "";
                try {
                    if (parameters.data) {
                        prettyData = JSON.stringify(JSON.parse(parameters.data), null, 2);
                    }
                } catch {
                    prettyData = parameters.data ?? "";
                }

                return (
                    <div className="tool-render">
                        <div className="tool-render-header tool-render-success">
                            <span className="tool-render-icon">&#x2713;</span>
                            <span><code className="tool-render-code">{parameters.entityLogicalName}</code> record created</span>
                        </div>
                        {recordId && (
                            <div className="terminal-info">
                                <div className="terminal-info-row">
                                    <span className="terminal-info-label">ID</span>
                                    <code className="tool-render-code">{recordId}</code>
                                </div>
                            </div>
                        )}
                        <details className="query-details">
                            <summary>Record data</summary>
                            <pre className="query-code">{prettyData}</pre>
                        </details>
                    </div>
                );
            },
        },
        [],
    );

    // ── get_active_connection ──

    useRenderTool(
        {
            name: "get_active_connection",
            parameters: z.object({}),
            render: ({ status, result }) => {
                if (status === "inProgress" || status === "executing") {
                    return (
                        <div className="tool-render">
                            <div className="tool-render-header">
                                <span className="query-spinner" />
                                <span>Checking connection...</span>
                            </div>
                        </div>
                    );
                }

                if (result === "No active Dataverse connection.") {
                    return (
                        <div className="tool-render">
                            <div className="tool-render-header tool-render-disconnected">
                                <span className="tool-render-icon">&#x2717;</span>
                                <span>No active connection</span>
                            </div>
                        </div>
                    );
                }

                let conn: Record<string, unknown>;
                try {
                    conn = JSON.parse(result);
                } catch {
                    return (
                        <div className="tool-render">
                            <div className="tool-render-header tool-render-success">
                                <span>Connection info retrieved</span>
                            </div>
                            <pre className="query-code">{result}</pre>
                        </div>
                    );
                }

                const entries = Object.entries(conn).filter(
                    ([k]) => !k.startsWith("@") && !k.startsWith("_"),
                );

                return (
                    <div className="tool-render">
                        <div className="tool-render-header tool-render-success">
                            <span className="status-dot-inline connected" />
                            <span>Connected{conn.name ? `: ${conn.name}` : ""}</span>
                        </div>
                        <div className="terminal-info">
                            {entries.map(([key, val]) => (
                                <div key={key} className="terminal-info-row">
                                    <span className="terminal-info-label">{key}</span>
                                    <span>{val === null || val === undefined ? "" : String(val)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            },
        },
        [],
    );

    // ── get_current_time ──

    useRenderTool(
        {
            name: "get_current_time",
            parameters: z.object({
                timezone: z.string().default("Europe/Stockholm"),
            }),
            render: ({ status, parameters, result }) => {
                let timezone = parameters.timezone || "Europe/Stockholm";
                if (status === "complete" && result) {
                    try {
                        const parsed = JSON.parse(result);
                        if (parsed.timezone) timezone = parsed.timezone;
                    } catch { /* ignore */ }
                }
                return <TimeCard status={status} result={result} timezone={timezone} />;
            },
        },
        [],
    );

    // ── get_weather ──

    useRenderTool(
        {
            name: "get_weather",
            parameters: z.object({
                location: z.string(),
            }),
            render: ({ status, parameters, result }) => {
                const isLoading = status !== "complete";
                let weatherResult: WeatherToolResult | undefined;
                if (!isLoading && result) {
                    try {
                        const parsed = JSON.parse(result);
                        if (!parsed.error) weatherResult = parsed;
                    } catch { /* ignore */ }
                }
                return <WeatherCard isLoading={isLoading} result={weatherResult} location={parameters.location} />;
            },
        },
        [],
    );

    // ── retrieve_record ──

    useRenderTool(
        {
            name: "retrieve_record",
            parameters: z.object({
                entityLogicalName: z.string().describe("Logical name of the entity"),
                id: z.string().describe("GUID of the record"),
                columns: z.string().optional().describe("Comma-separated column names"),
            }),
            render: ({ status, parameters, result }) => {
                if (status === "inProgress") {
                    return (
                        <div className="tool-render">
                            <div className="tool-render-header">
                                <span className="query-spinner" />
                                <span>Preparing to retrieve record...</span>
                            </div>
                        </div>
                    );
                }
                if (status === "executing") {
                    return (
                        <div className="tool-render">
                            <div className="tool-render-header">
                                <span className="query-spinner" />
                                <span>Retrieving <code className="tool-render-code">{parameters.entityLogicalName}</code> record...</span>
                            </div>
                        </div>
                    );
                }

                let record: Record<string, unknown>;
                try {
                    record = JSON.parse(result);
                } catch {
                    return (
                        <div className="tool-render">
                            <div className="tool-render-header tool-render-success">
                                <span>Record retrieved</span>
                            </div>
                            <pre className="query-code">{result}</pre>
                        </div>
                    );
                }

                const fields = Object.entries(record).filter(
                    ([k]) => !k.startsWith("@") && !k.startsWith("_") && !k.endsWith("@OData.Community.Display.V1.FormattedValue"),
                );

                const displayValue = (key: string, val: unknown): string => {
                    const formatted = record[`${key}@OData.Community.Display.V1.FormattedValue`];
                    if (formatted !== undefined) return String(formatted);
                    if (val === null || val === undefined) return "\u2014";
                    if (typeof val === "object") return JSON.stringify(val);
                    return String(val);
                };

                return (
                    <div className="record-card">
                        <div className="record-card-header">
                            <div className="record-card-entity">{parameters.entityLogicalName}</div>
                            <code className="record-card-id">{parameters.id}</code>
                        </div>
                        <div className="record-card-fields">
                            {fields.map(([key, val]) => (
                                <div key={key} className="record-card-field">
                                    <span className="record-card-label">{key}</span>
                                    <span className="record-card-value">{displayValue(key, val)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            },
        },
        [],
    );
}
