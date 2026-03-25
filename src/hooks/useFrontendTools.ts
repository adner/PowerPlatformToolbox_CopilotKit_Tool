import { useFrontendTool } from "@copilotkit/react-core/v2";
import { z } from "zod";

export function usePlatformTools() {
    // ── ToolboxAPI: Notifications & Utils ──

    useFrontendTool({
        name: "show_notification",
        description: "Show a notification to the user in the PPTB desktop app",
        parameters: z.object({
            title: z.string().describe("Notification title"),
            body: z.string().describe("Notification body text"),
            type: z.enum(["info", "success", "warning", "error"]).default("info").describe("Notification type"),
            duration: z.number().optional().describe("Duration in milliseconds, 0 for persistent"),
        }),
        handler: async (args) => {
            await window.toolboxAPI.utils.showNotification({
                title: args.title,
                body: args.body,
                type: args.type,
                duration: args.duration,
            });
            return `Notification shown: "${args.title}"`;
        },
    });

    useFrontendTool({
        name: "copy_to_clipboard",
        description: "Copy text to the system clipboard",
        parameters: z.object({
            text: z.string().describe("Text to copy to clipboard"),
        }),
        handler: async (args) => {
            await window.toolboxAPI.utils.copyToClipboard(args.text);
            return "Text copied to clipboard.";
        },
    });

    useFrontendTool({
        name: "get_current_theme",
        description: "Get the current UI theme (light or dark)",
        parameters: z.object({}),
        handler: async () => {
            const theme = await window.toolboxAPI.utils.getCurrentTheme();
            return `Current theme: ${theme}`;
        },
    });

    // ── ToolboxAPI: File System ──

    useFrontendTool({
        name: "save_file",
        description: "Open a save file dialog and write content to the chosen location",
        parameters: z.object({
            defaultPath: z.string().describe("Default file path/name for the save dialog"),
            content: z.string().describe("File content to save"),
        }),
        handler: async (args) => {
            const result = await window.toolboxAPI.fileSystem.saveFile(args.defaultPath, args.content);
            return result ? `File saved to: ${result}` : "Save cancelled by user.";
        },
    });

    useFrontendTool({
        name: "read_file",
        description: "Read a file as UTF-8 text from the local filesystem",
        parameters: z.object({
            path: z.string().describe("Absolute file path to read"),
        }),
        handler: async (args) => {
            const content = await window.toolboxAPI.fileSystem.readText(args.path);
            return content;
        },
    });

    useFrontendTool({
        name: "write_file",
        description: "Write text content to a file on the local filesystem",
        parameters: z.object({
            path: z.string().describe("Absolute file path to write"),
            content: z.string().describe("Text content to write"),
        }),
        handler: async (args) => {
            await window.toolboxAPI.fileSystem.writeText(args.path, args.content);
            return `File written: ${args.path}`;
        },
    });

    useFrontendTool({
        name: "list_directory",
        description: "List contents of a directory",
        parameters: z.object({
            path: z.string().describe("Absolute directory path to list"),
        }),
        handler: async (args) => {
            const entries = await window.toolboxAPI.fileSystem.readDirectory(args.path);
            return JSON.stringify(entries, null, 2);
        },
    });

    useFrontendTool({
        name: "select_path",
        description: "Open a native dialog to select a file or folder path",
        parameters: z.object({
            type: z.enum(["file", "folder"]).optional().describe("Whether to select a file or folder"),
            title: z.string().optional().describe("Dialog title"),
        }),
        handler: async (args) => {
            const result = await window.toolboxAPI.fileSystem.selectPath({
                type: args.type,
                title: args.title,
            });
            return result ? `Selected: ${result}` : "Selection cancelled by user.";
        },
    });

    // ── ToolboxAPI: Connections ──

    useFrontendTool({
        name: "get_active_connection",
        description: "Get the currently active Dataverse connection details",
        parameters: z.object({}),
        handler: async () => {
            const conn = await window.toolboxAPI.connections.getActiveConnection();
            if (!conn) return "No active Dataverse connection.";
            return JSON.stringify(conn, null, 2);
        },
    });

    // ── ToolboxAPI: Terminal ──

    useFrontendTool({
        name: "create_terminal",
        description: "Create a new terminal instance in PPTB",
        parameters: z.object({
            name: z.string().describe("Terminal display name"),
            shell: z.string().optional().describe("Shell to use (e.g. powershell, cmd, bash)"),
            cwd: z.string().optional().describe("Working directory for the terminal"),
        }),
        handler: async (args) => {
            const terminal = await window.toolboxAPI.terminal.create({
                name: args.name,
                shell: args.shell,
                cwd: args.cwd,
            });
            return JSON.stringify(terminal, null, 2);
        },
    });

    useFrontendTool({
        name: "execute_terminal_command",
        description: "Execute a command in an existing terminal",
        parameters: z.object({
            terminalId: z.string().describe("ID of the terminal to execute in"),
            command: z.string().describe("Command to execute"),
        }),
        handler: async (args) => {
            const result = await window.toolboxAPI.terminal.execute(args.terminalId, args.command);
            return JSON.stringify(result, null, 2);
        },
    });

    useFrontendTool({
        name: "close_terminal",
        description: "Close a terminal instance",
        parameters: z.object({
            terminalId: z.string().describe("ID of the terminal to close"),
        }),
        handler: async (args) => {
            await window.toolboxAPI.terminal.close(args.terminalId);
            return `Terminal ${args.terminalId} closed.`;
        },
    });

    useFrontendTool({
        name: "list_terminals",
        description: "List all terminal instances for this tool",
        parameters: z.object({}),
        handler: async () => {
            const terminals = await window.toolboxAPI.terminal.list();
            return JSON.stringify(terminals, null, 2);
        },
    });

    // ── ToolboxAPI: Settings ──

    useFrontendTool({
        name: "get_setting",
        description: "Get a tool setting value by key",
        parameters: z.object({
            key: z.string().describe("Setting key to retrieve"),
        }),
        handler: async (args) => {
            const value = await window.toolboxAPI.settings.get(args.key);
            return value !== undefined ? JSON.stringify(value) : `Setting "${args.key}" not found.`;
        },
    });

    useFrontendTool({
        name: "set_setting",
        description: "Set a tool setting value",
        parameters: z.object({
            key: z.string().describe("Setting key"),
            value: z.string().describe("Setting value (JSON string for complex values)"),
        }),
        handler: async (args) => {
            let parsed: unknown;
            try {
                parsed = JSON.parse(args.value);
            } catch {
                parsed = args.value;
            }
            await window.toolboxAPI.settings.set(args.key, parsed);
            return `Setting "${args.key}" updated.`;
        },
    });

    // ── DataverseAPI: Queries ──

    useFrontendTool({
        name: "fetchxml_query",
        description: "Execute a FetchXML query against Dataverse. Use this for complex queries with filters, joins, and aggregations.",
        parameters: z.object({
            fetchXml: z.string().describe("Complete FetchXML query string"),
        }),
        handler: async (args) => {
            const result = await window.dataverseAPI.fetchXmlQuery(args.fetchXml);
            return JSON.stringify(result.value, null, 2);
        },
    });

    useFrontendTool({
        name: "odata_query",
        description: "Query Dataverse using OData syntax. The query should include the entity set name and OData parameters like $select, $filter, $orderby, $top, $expand.",
        parameters: z.object({
            odataQuery: z.string().describe("OData query string (e.g. 'accounts?$select=name&$top=10&$filter=statecode eq 0')"),
        }),
        handler: async (args) => {
            const result = await window.dataverseAPI.queryData(args.odataQuery);
            return JSON.stringify(result.value, null, 2);
        },
    });

    // ── DataverseAPI: CRUD ──

    useFrontendTool({
        name: "create_record",
        description: "Create a new record in a Dataverse table",
        parameters: z.object({
            entityLogicalName: z.string().describe("Logical name of the entity (e.g. 'account', 'contact')"),
            data: z.string().describe("JSON string of field-value pairs for the new record"),
        }),
        handler: async (args) => {
            const record = JSON.parse(args.data) as Record<string, unknown>;
            const result = await window.dataverseAPI.create(args.entityLogicalName, record);
            return `Record created. ID: ${result.id}`;
        },
    });

    useFrontendTool({
        name: "retrieve_record",
        description: "Retrieve a single Dataverse record by ID",
        parameters: z.object({
            entityLogicalName: z.string().describe("Logical name of the entity"),
            id: z.string().describe("GUID of the record"),
            columns: z.string().optional().describe("Comma-separated column names to retrieve. ALWAYS supply a short list of columns."),
        }),
        handler: async (args) => {
            const columns = args.columns ? args.columns.split(",").map((c) => c.trim()) : undefined;
            const result = await window.dataverseAPI.retrieve(args.entityLogicalName, args.id, columns);
            return JSON.stringify(result, null, 2);
        },
    });

    useFrontendTool({
        name: "update_record",
        description: "Update an existing Dataverse record",
        parameters: z.object({
            entityLogicalName: z.string().describe("Logical name of the entity"),
            id: z.string().describe("GUID of the record to update"),
            data: z.string().describe("JSON string of field-value pairs to update"),
        }),
        handler: async (args) => {
            const record = JSON.parse(args.data) as Record<string, unknown>;
            await window.dataverseAPI.update(args.entityLogicalName, args.id, record);
            return `Record ${args.id} updated successfully.`;
        },
    });

    useFrontendTool({
        name: "delete_record",
        description: "Delete a Dataverse record. This action is irreversible - always confirm with the user before proceeding.",
        parameters: z.object({
            entityLogicalName: z.string().describe("Logical name of the entity"),
            id: z.string().describe("GUID of the record to delete"),
        }),
        handler: async (args) => {
            await window.dataverseAPI.delete(args.entityLogicalName, args.id);
            return `Record ${args.id} deleted successfully.`;
        },
    });

    // ── DataverseAPI: Execute ──

    useFrontendTool({
        name: "execute_operation",
        description: "Execute a Dataverse Web API action or function (e.g. WhoAmI, CalculateRollupField)",
        parameters: z.object({
            operationName: z.string().describe("Name of the action or function (e.g. 'WhoAmI')"),
            operationType: z.enum(["action", "function"]).describe("Whether this is an action or function"),
            entityName: z.string().optional().describe("Entity logical name for bound operations"),
            entityId: z.string().optional().describe("Record ID for bound operations"),
            parameters: z.string().optional().describe("JSON string of parameters to pass to the operation"),
        }),
        handler: async (args) => {
            const params = args.parameters ? (JSON.parse(args.parameters) as Record<string, unknown>) : undefined;
            const result = await window.dataverseAPI.execute({
                operationName: args.operationName,
                operationType: args.operationType,
                entityName: args.entityName,
                entityId: args.entityId,
                parameters: params,
            });
            return JSON.stringify(result, null, 2);
        },
    });

    // ── DataverseAPI: Metadata ──

    useFrontendTool({
        name: "get_entity_metadata",
        description: "Get metadata for a specific Dataverse entity/table (display name, entity set name, etc.)",
        parameters: z.object({
            entityLogicalName: z.string().describe("Logical name of the entity (e.g. 'account')"),
            selectColumns: z.string().optional().describe("Comma-separated metadata columns to retrieve (e.g. 'LogicalName,DisplayName,EntitySetName')"),
        }),
        handler: async (args) => {
            const columns = args.selectColumns ? args.selectColumns.split(",").map((c) => c.trim()) : undefined;
            const result = await window.dataverseAPI.getEntityMetadata(args.entityLogicalName, true, columns);
            return JSON.stringify(result, null, 2);
        },
    });

    useFrontendTool({
        name: "get_all_entities_metadata",
        description: "Get metadata for all entities/tables in the Dataverse environment",
        parameters: z.object({
            selectColumns: z.string().optional().describe("Comma-separated metadata columns (defaults to LogicalName, DisplayName, MetadataId)"),
        }),
        handler: async (args) => {
            const columns = args.selectColumns ? args.selectColumns.split(",").map((c) => c.trim()) : undefined;
            const result = await window.dataverseAPI.getAllEntitiesMetadata(columns);
            return JSON.stringify(result.value, null, 2);
        },
    });

    useFrontendTool({
        name: "get_entity_related_metadata",
        description: "Get related metadata for an entity: attributes, relationships, keys, or privileges. Use relatedPath like 'Attributes', 'OneToManyRelationships', 'ManyToOneRelationships', 'ManyToManyRelationships', 'Keys', 'Privileges', or drill into a specific attribute like \"Attributes(LogicalName='name')\"",
        parameters: z.object({
            entityLogicalName: z.string().describe("Logical name of the entity"),
            relatedPath: z.string().describe("Related metadata path (e.g. 'Attributes', 'OneToManyRelationships', \"Attributes(LogicalName='name')\")"),
            selectColumns: z.string().optional().describe("Comma-separated columns to retrieve"),
        }),
        handler: async (args) => {
            const columns = args.selectColumns ? args.selectColumns.split(",").map((c) => c.trim()) : undefined;
            const result = await window.dataverseAPI.getEntityRelatedMetadata(
                args.entityLogicalName,
                args.relatedPath as DataverseAPI.EntityRelatedMetadataBasePath,
                columns,
            );
            if ("value" in result) {
                return JSON.stringify(result.value, null, 2);
            }
            return JSON.stringify(result, null, 2);
        },
    });

    // ── DataverseAPI: Solutions ──

    useFrontendTool({
        name: "get_solutions",
        description: "Get solutions from the Dataverse environment",
        parameters: z.object({
            selectColumns: z.string().describe("Comma-separated columns to retrieve (e.g. 'solutionid,uniquename,friendlyname,version,ismanaged')"),
        }),
        handler: async (args) => {
            const columns = args.selectColumns.split(",").map((c) => c.trim());
            const result = await window.dataverseAPI.getSolutions(columns);
            return JSON.stringify(result.value, null, 2);
        },
    });

    useFrontendTool({
        name: "publish_customizations",
        description: "Publish customizations. Optionally publish only a specific table, or publish all if no table is specified.",
        parameters: z.object({
            tableLogicalName: z.string().optional().describe("Table logical name to publish (omit to publish all)"),
        }),
        handler: async (args) => {
            await window.dataverseAPI.publishCustomizations(args.tableLogicalName);
            return args.tableLogicalName
                ? `Customizations published for table: ${args.tableLogicalName}`
                : "All customizations published.";
        },
    });

    // ── DataverseAPI: Bulk Operations ──

    useFrontendTool({
        name: "create_multiple_records",
        description: "Create multiple records in a Dataverse table in a single operation",
        parameters: z.object({
            entityLogicalName: z.string().describe("Logical name of the entity"),
            records: z.string().describe("JSON string of array of record objects. Each must include '@odata.type' (e.g. 'Microsoft.Dynamics.CRM.account')"),
        }),
        handler: async (args) => {
            const records = JSON.parse(args.records) as Record<string, unknown>[];
            const ids = await window.dataverseAPI.createMultiple(args.entityLogicalName, records);
            return `Created ${ids.length} records. IDs: ${JSON.stringify(ids)}`;
        },
    });

    useFrontendTool({
        name: "update_multiple_records",
        description: "Update multiple records in a Dataverse table in a single operation",
        parameters: z.object({
            entityLogicalName: z.string().describe("Logical name of the entity"),
            records: z.string().describe("JSON string of array of record objects. Each must include the primary key field and '@odata.type'"),
        }),
        handler: async (args) => {
            const records = JSON.parse(args.records) as Record<string, unknown>[];
            await window.dataverseAPI.updateMultiple(args.entityLogicalName, records);
            return `Updated ${records.length} records successfully.`;
        },
    });

    // ── DataverseAPI: Utilities ──

    useFrontendTool({
        name: "get_entity_set_name",
        description: "Get the OData entity set (collection) name for a table logical name. Useful for building OData queries.",
        parameters: z.object({
            entityLogicalName: z.string().describe("Logical name of the entity (e.g. 'account')"),
        }),
        handler: async (args) => {
            const entitySetName = await window.dataverseAPI.getEntitySetName(args.entityLogicalName);
            return `Entity set name for '${args.entityLogicalName}': ${entitySetName}`;
        },
    });

    // ── Utility: Time & Weather ──

    useFrontendTool({
        name: "get_current_time",
        description: "Get the current date and time in a given timezone. Use this when the user asks what time it is.",
        parameters: z.object({
            timezone: z.string().default("Europe/Stockholm").describe("IANA timezone (e.g. 'America/New_York', 'Europe/Stockholm')"),
        }),
        handler: async (args) => {
            const now = new Date();
            const formatted = now.toLocaleString("en-US", { timeZone: args.timezone, dateStyle: "full", timeStyle: "long" });
            return JSON.stringify({ timezone: args.timezone, datetime: formatted });
        },
    });

    useFrontendTool({
        name: "get_weather",
        description: "Get the current weather for a location. Use this when the user asks about weather conditions.",
        parameters: z.object({
            location: z.string().describe("City or location name (e.g. 'Stockholm', 'New York')"),
        }),
        handler: async (args) => {
            // Fetch weather from wttr.in (no API key needed)
            const resp = await fetch(`https://wttr.in/${encodeURIComponent(args.location)}?format=j1`);
            if (!resp.ok) return JSON.stringify({ error: `Could not fetch weather for ${args.location}` });
            const data = await resp.json();
            const current = data.current_condition?.[0];
            if (!current) return JSON.stringify({ error: "No weather data available" });
            return JSON.stringify({
                temperature: `${current.temp_C}°C`,
                conditions: current.weatherDesc?.[0]?.value ?? "Unknown",
                humidity: `${current.humidity}%`,
                windSpeed: `${current.windspeedKmph} km/h`,
                feelsLike: `${current.FeelsLikeC}°C`,
            });
        },
    });
}
