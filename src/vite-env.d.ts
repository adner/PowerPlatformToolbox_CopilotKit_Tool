/// <reference types="vite/client" />
/// <reference types="@pptb/types" />

interface ImportMetaEnv {
    readonly VITE_COPILOTKIT_PUBLIC_API_KEY?: string;
    readonly VITE_OPENAI_API_KEY?: string;
    readonly VITE_OPENAI_MODEL?: string;
    readonly VITE_OPENAI_BASE_URL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

declare global {
    interface Window {
        toolboxAPI: typeof import('@pptb/types').toolboxAPI;
        dataverseAPI: typeof import('@pptb/types').dataverseAPI;
    }
}

export {};
