import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import type { AgentSettings } from "../hooks/useAgentSettings";

interface SettingsPanelProps {
    open: boolean;
    onClose: () => void;
    settings: AgentSettings;
}

const SETTINGS_KEYS = {
    openaiApiKey: "openai_api_key",
    openaiModel: "openai_model",
    openaiBaseUrl: "openai_base_url",
    copilotKitPublicApiKey: "copilotkit_public_api_key",
} as const;

export function SettingsPanel({ open, onClose, settings }: SettingsPanelProps) {
    const [openaiApiKey, setOpenaiApiKey] = useState("");
    const [openaiModel, setOpenaiModel] = useState("");
    const [openaiBaseUrl, setOpenaiBaseUrl] = useState("");
    const [copilotKitKey, setCopilotKitKey] = useState("");
    const [showOpenaiKey, setShowOpenaiKey] = useState(false);
    const [showCopilotKitKey, setShowCopilotKitKey] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Sync form state when panel opens
    useEffect(() => {
        if (open) {
            setOpenaiApiKey(settings.openaiApiKey ?? "");
            setOpenaiModel(settings.openaiModel === "gpt-4o" ? "" : settings.openaiModel);
            setOpenaiBaseUrl(settings.openaiBaseUrl ?? "");
            setCopilotKitKey(settings.copilotKitPublicApiKey ?? "");
            setSaved(false);
        }
    }, [open, settings]);

    // Escape key closes panel
    useEffect(() => {
        if (!open) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [open, onClose]);

    const handleSave = useCallback(async () => {
        if (!window.toolboxAPI?.settings) return;

        setSaving(true);
        try {
            const entries: [string, string][] = [
                [SETTINGS_KEYS.openaiApiKey, openaiApiKey.trim()],
                [SETTINGS_KEYS.openaiModel, openaiModel.trim()],
                [SETTINGS_KEYS.openaiBaseUrl, openaiBaseUrl.trim()],
                [SETTINGS_KEYS.copilotKitPublicApiKey, copilotKitKey.trim()],
            ];
            for (const [key, value] of entries) {
                await window.toolboxAPI.settings.set(key, value);
            }
            setSaved(true);
        } finally {
            setSaving(false);
        }
    }, [openaiApiKey, openaiModel, openaiBaseUrl, copilotKitKey]);

    // Determine active provider
    const activeProvider = openaiApiKey.trim()
        ? "OpenAI Direct"
        : copilotKitKey.trim()
          ? "CopilotKit Cloud"
          : "Not configured";

    if (!open) return null;

    const hasToolboxAPI = !!window.toolboxAPI?.settings;

    return createPortal(
        <div className="settings-overlay" onClick={onClose}>
            <div
                className="settings-panel"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="settings-panel-header">
                    <h2 className="settings-panel-title">Settings</h2>
                    <button
                        className="settings-close-btn"
                        onClick={onClose}
                        aria-label="Close settings"
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                <div className="settings-provider-badge" data-provider={openaiApiKey.trim() ? "openai" : copilotKitKey.trim() ? "copilotkit" : "none"}>
                    <span className="settings-provider-dot" />
                    {activeProvider}
                </div>

                <div className="settings-panel-body">
                    <div className="settings-section">
                        <h3 className="settings-section-title">OpenAI Direct</h3>

                        <label className="settings-field">
                            <span className="settings-label">API Key</span>
                            <div className="settings-input-wrap">
                                <input
                                    className="settings-input"
                                    type={showOpenaiKey ? "text" : "password"}
                                    value={openaiApiKey}
                                    onChange={(e) => setOpenaiApiKey(e.target.value)}
                                    placeholder="sk-..."
                                    autoComplete="off"
                                />
                                <button
                                    className="settings-toggle-btn"
                                    onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                                    type="button"
                                    aria-label={showOpenaiKey ? "Hide" : "Show"}
                                >
                                    {showOpenaiKey ? "Hide" : "Show"}
                                </button>
                            </div>
                        </label>

                        <label className="settings-field">
                            <span className="settings-label">Model</span>
                            <input
                                className="settings-input"
                                type="text"
                                value={openaiModel}
                                onChange={(e) => setOpenaiModel(e.target.value)}
                                placeholder="gpt-4o"
                            />
                        </label>

                        <label className="settings-field">
                            <span className="settings-label">Base URL</span>
                            <input
                                className="settings-input"
                                type="text"
                                value={openaiBaseUrl}
                                onChange={(e) => setOpenaiBaseUrl(e.target.value)}
                                placeholder="https://api.openai.com/v1"
                            />
                        </label>
                    </div>

                    <div className="settings-section">
                        <h3 className="settings-section-title">CopilotKit Cloud</h3>

                        <label className="settings-field">
                            <span className="settings-label">Public API Key</span>
                            <div className="settings-input-wrap">
                                <input
                                    className="settings-input"
                                    type={showCopilotKitKey ? "text" : "password"}
                                    value={copilotKitKey}
                                    onChange={(e) => setCopilotKitKey(e.target.value)}
                                    placeholder="ck_pub_..."
                                    autoComplete="off"
                                />
                                <button
                                    className="settings-toggle-btn"
                                    onClick={() => setShowCopilotKitKey(!showCopilotKitKey)}
                                    type="button"
                                    aria-label={showCopilotKitKey ? "Hide" : "Show"}
                                >
                                    {showCopilotKitKey ? "Hide" : "Show"}
                                </button>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="settings-panel-footer">
                    {!hasToolboxAPI && (
                        <p className="settings-note settings-note-warn">
                            Settings API unavailable outside PPTB. Using .env values.
                        </p>
                    )}
                    {saved && (
                        <p className="settings-note settings-note-success">
                            Saved. Changes take effect after reload.
                        </p>
                    )}
                    <button
                        className="settings-save-btn"
                        onClick={handleSave}
                        disabled={saving || !hasToolboxAPI}
                    >
                        {saving ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}

/** Gear icon button for the header. */
export function SettingsButton({ onClick }: { onClick: () => void }) {
    return (
        <button className="settings-btn" onClick={onClick} aria-label="Settings">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path
                    d="M10 13a3 3 0 100-6 3 3 0 000 6z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                />
                <path
                    d="M8.28 2.485a1.5 1.5 0 013.44 0l.1.434a1.5 1.5 0 002.07.87l.392-.2a1.5 1.5 0 011.72 2.45l-.292.235a1.5 1.5 0 000 2.352l.292.235a1.5 1.5 0 01-1.72 2.45l-.393-.2a1.5 1.5 0 00-2.069.87l-.1.434a1.5 1.5 0 01-3.44 0l-.1-.434a1.5 1.5 0 00-2.07-.87l-.392.2a1.5 1.5 0 01-1.72-2.45l.292-.235a1.5 1.5 0 000-2.352l-.292-.235a1.5 1.5 0 011.72-2.45l.393.2a1.5 1.5 0 002.069-.87l.1-.434z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                />
            </svg>
        </button>
    );
}
