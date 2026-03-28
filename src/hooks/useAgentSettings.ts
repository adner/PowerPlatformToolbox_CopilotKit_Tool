import { useState, useEffect } from "react";

export interface AgentSettings {
    openaiApiKey: string | undefined;
    openaiModel: string;
    openaiBaseUrl: string | undefined;
    copilotKitPublicApiKey: string | undefined;
}

/** Treat empty strings as undefined. */
function nonEmpty(value: unknown): string | undefined {
    if (typeof value === "string" && value.trim() !== "") return value.trim();
    return undefined;
}

function buildSettingsFromEnv(): AgentSettings {
    return {
        openaiApiKey: nonEmpty(import.meta.env.VITE_OPENAI_API_KEY),
        openaiModel: nonEmpty(import.meta.env.VITE_OPENAI_MODEL) ?? "gpt-4o",
        openaiBaseUrl: nonEmpty(import.meta.env.VITE_OPENAI_BASE_URL),
        copilotKitPublicApiKey: nonEmpty(import.meta.env.VITE_COPILOTKIT_PUBLIC_API_KEY),
    };
}

/**
 * Loads agent configuration from PPTB settings with env-var fallback.
 *
 * Priority: PPTB setting → VITE_* env var → default/undefined
 * Outside PPTB (no toolboxAPI), falls back to env vars immediately.
 */
export function useAgentSettings(): {
    settings: AgentSettings | null;
    isLoading: boolean;
} {
    const [settings, setSettings] = useState<AgentSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!window.toolboxAPI?.settings) {
            setSettings(buildSettingsFromEnv());
            setIsLoading(false);
            return;
        }

        let cancelled = false;

        window.toolboxAPI.settings.getAll().then((stored) => {
            if (cancelled) return;

            const env = buildSettingsFromEnv();

            setSettings({
                openaiApiKey: nonEmpty(stored.openai_api_key) ?? env.openaiApiKey,
                openaiModel: nonEmpty(stored.openai_model) ?? env.openaiModel,
                openaiBaseUrl: nonEmpty(stored.openai_base_url) ?? env.openaiBaseUrl,
                copilotKitPublicApiKey: nonEmpty(stored.copilotkit_public_api_key) ?? env.copilotKitPublicApiKey,
            });
            setIsLoading(false);
        }).catch(() => {
            if (cancelled) return;
            setSettings(buildSettingsFromEnv());
            setIsLoading(false);
        });

        return () => { cancelled = true; };
    }, []);

    return { settings, isLoading };
}
