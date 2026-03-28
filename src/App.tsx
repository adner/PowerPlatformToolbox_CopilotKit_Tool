import { useState } from "react";
import { CopilotChat, useAgentContext } from "@copilotkit/react-core/v2";
import dataverseLogo from "./assets/dataverse-logo.png";
import { usePlatformTools } from "./hooks/useFrontendTools";
import { useToolRenderers } from "./hooks/useToolRenderers";
import { usePlatformContext } from "./hooks/usePlatformContext";
import { SettingsPanel, SettingsButton } from "./components/SettingsPanel";
import type { AgentSettings } from "./hooks/useAgentSettings";

const SYSTEM_INSTRUCTIONS = `You are a Power Platform assistant running inside the Power Platform Tool Box (PPTB) desktop application. You have full access to the connected Microsoft Dataverse environment through the platform APIs.

Your capabilities include:
- Querying Dataverse records using FetchXML or OData syntax
- Creating, reading, updating, and deleting records in any Dataverse table
- Retrieving entity metadata, attributes, relationships, and keys
- Executing Dataverse functions and actions (e.g., WhoAmI)
- Managing solutions and publishing customizations
- Bulk create/update operations
- Showing notifications and copying text to clipboard
- Reading and writing files on the local filesystem
- Creating and managing terminal instances
- Managing tool settings

Guidelines:
- Always check the connection status before attempting Dataverse operations. If not connected, inform the user.
- When querying data, prefer FetchXML for complex queries with filters and joins, and OData for simple selects.
- For CRUD operations, always confirm destructive actions (delete) with the user before proceeding.
- When creating records, ask what fields to set if the user hasn't specified them.
- The following tools have visual UI renderers that display results directly to the user: fetchxml_query, odata_query, get_solutions, create_record, retrieve_record, create_multiple_records, write_file, list_directory, create_terminal, get_active_connection, get_current_time, get_weather. When any of these tools are called, do NOT repeat, summarize, or reformat the tool results in your text response. Keep your reply brief — a short acknowledgement and an offer to help further is enough.
- When calling retrieve_record, always supply a short list of relevant columns rather than omitting the columns parameter. This keeps the result card focused and readable.
- If an operation fails, explain the error and suggest corrections.
- Use get_entity_metadata and get_entity_related_metadata to discover table schemas before querying unknown entities.
- Use get_entity_set_name to resolve OData collection names from logical entity names.`;

function App({ settings }: { settings: AgentSettings }) {
    usePlatformTools();
    useToolRenderers();
    const { connection } = usePlatformContext();
    const [settingsOpen, setSettingsOpen] = useState(false);

    useAgentContext({
        description: "System instructions for the Power Platform assistant",
        value: SYSTEM_INSTRUCTIONS,
    });

    return (
        <div className="app-shell dark">
            <header className="app-header">
                <div className="header-left">
                    <img className="header-icon" src={dataverseLogo} alt="Dataverse" />
                    <div>
                        <h1 className="header-title">Power Platform Assistant</h1>
                        <span className="header-subtitle">AI-powered Dataverse companion</span>
                    </div>
                </div>
                <div className="header-right">
                    <div className="connection-badge" data-status={connection ? "connected" : "disconnected"}>
                        <span className="status-dot" />
                        {connection ? connection.name : "Not connected"}
                    </div>
                    <SettingsButton onClick={() => setSettingsOpen(true)} />
                </div>
            </header>
            <div className="chat-container">
                <CopilotChat
                    labels={{
                        welcomeMessageText: "Hello! I'm your Power Platform assistant. I can query data, manage records, explore metadata, and more. What would you like to do?",
                        chatInputPlaceholder: "Ask me about your Dataverse environment...",
                    }}
                />
            </div>
            <SettingsPanel
                open={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                settings={settings}
            />
        </div>
    );
}

export default App;
