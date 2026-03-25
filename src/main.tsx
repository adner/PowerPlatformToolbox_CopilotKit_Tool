import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CopilotKit } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";
import App from './App';
import './index.css';

// Ensure DOM is ready and root element exists
const rootElement = document.getElementById('root');
if (rootElement && !rootElement.hasAttribute('data-reactroot-initialized')) {
    // Mark as initialized to prevent double rendering
    rootElement.setAttribute('data-reactroot-initialized', 'true');

    createRoot(rootElement).render(
        <StrictMode>
            <CopilotKit publicApiKey={import.meta.env.VITE_COPILOTKIT_PUBLIC_API_KEY}>
                <App />
            </CopilotKit>
        </StrictMode>
    );
} else if (!rootElement) {
    console.error('Root element not found. Make sure the HTML contains <div id="root"></div>');
}
