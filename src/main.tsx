import { StrictMode, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { CopilotKit } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";
import { OpenAIAgent } from './lib/openai-agent';
import { useAgentSettings, type AgentSettings } from './hooks/useAgentSettings';
import App from './App';
import './index.css';

/**
 * Determines whether to use the OpenAI direct agent (browser-side, no server)
 * or CopilotKit Cloud, based on the resolved settings.
 */
function CopilotKitWrapper({ settings, children }: { settings: AgentSettings; children: React.ReactNode }) {
    const selfManagedAgents = useMemo(() => {
        if (!settings.openaiApiKey) return undefined;
        return {
            default: new OpenAIAgent({
                apiKey: settings.openaiApiKey,
                model: settings.openaiModel,
                baseUrl: settings.openaiBaseUrl,
            }),
        };
    }, [settings.openaiApiKey, settings.openaiModel, settings.openaiBaseUrl]);

    if (selfManagedAgents) {
        return (
            <CopilotKit
                runtimeUrl="__unused__"
                selfManagedAgents={selfManagedAgents}
            >
                {children}
            </CopilotKit>
        );
    }

    return (
        <CopilotKit publicApiKey={settings.copilotKitPublicApiKey}>
            {children}
        </CopilotKit>
    );
}

/**
 * Root component that loads settings before mounting CopilotKit.
 * Uses a key derived from settings values to force a clean remount
 * if settings change across reloads.
 */
function Root() {
    const { settings, isLoading } = useAgentSettings();

    if (isLoading || !settings) return null;

    const settingsKey = [
        settings.openaiApiKey,
        settings.copilotKitPublicApiKey,
        settings.openaiModel,
        settings.openaiBaseUrl,
    ].join("|");

    return (
        <CopilotKitWrapper key={settingsKey} settings={settings}>
            <App settings={settings} />
        </CopilotKitWrapper>
    );
}

// Ensure DOM is ready and root element exists
const rootElement = document.getElementById('root');
if (rootElement && !rootElement.hasAttribute('data-reactroot-initialized')) {
    // Mark as initialized to prevent double rendering
    rootElement.setAttribute('data-reactroot-initialized', 'true');

    createRoot(rootElement).render(
        <StrictMode>
            <Root />
        </StrictMode>
    );
} else if (!rootElement) {
    console.error('Root element not found. Make sure the HTML contains <div id="root"></div>');
}
