import { StrictMode, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { CopilotKit } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";
import { OpenAIAgent } from './lib/openai-agent';
import App from './App';
import './index.css';

/**
 * Determines whether to use the OpenAI direct agent (browser-side, no server)
 * or CopilotKit Cloud. Set VITE_OPENAI_API_KEY to use OpenAI directly.
 */
function CopilotKitWrapper({ children }: { children: React.ReactNode }) {
    const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    const copilotKitApiKey = import.meta.env.VITE_COPILOTKIT_PUBLIC_API_KEY;

    const selfManagedAgents = useMemo(() => {
        if (!openaiApiKey) return undefined;
        return {
            default: new OpenAIAgent({
                apiKey: openaiApiKey,
                model: import.meta.env.VITE_OPENAI_MODEL || "gpt-4o",
                baseUrl: import.meta.env.VITE_OPENAI_BASE_URL || undefined,
            }),
        };
    }, [openaiApiKey]);

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
        <CopilotKit publicApiKey={copilotKitApiKey}>
            {children}
        </CopilotKit>
    );
}

// Ensure DOM is ready and root element exists
const rootElement = document.getElementById('root');
if (rootElement && !rootElement.hasAttribute('data-reactroot-initialized')) {
    // Mark as initialized to prevent double rendering
    rootElement.setAttribute('data-reactroot-initialized', 'true');

    createRoot(rootElement).render(
        <StrictMode>
            <CopilotKitWrapper>
                <App />
            </CopilotKitWrapper>
        </StrictMode>
    );
} else if (!rootElement) {
    console.error('Root element not found. Make sure the HTML contains <div id="root"></div>');
}
