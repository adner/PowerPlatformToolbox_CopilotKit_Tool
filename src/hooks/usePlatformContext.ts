import { useAgentContext } from "@copilotkit/react-core/v2";
import { useConnection } from "./useToolboxAPI";

export function usePlatformContext() {
    const { connection, isLoading } = useConnection();

    useAgentContext({
        description: "Current Dataverse connection status and details for the Power Platform Tool Box environment",
        value: isLoading
            ? { status: "loading" }
            : connection
              ? {
                    status: "connected",
                    name: connection.name,
                    url: connection.url,
                    environment: connection.environment,
                    id: connection.id,
                }
              : { status: "disconnected", message: "No active Dataverse connection" },
    });

    return { connection, isLoading };
}
