# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Power Platform Tool Box (PPTB) React sample tool — an AI-powered Dataverse assistant that runs inside the PPTB desktop application's iframe environment. Built with CopilotKit v2 for the AI chat interface and 45+ frontend tools for interacting with Dataverse and the host platform. The `toolboxAPI` and `dataverseAPI` globals are injected by the platform at runtime and are not available in standalone dev mode.

## Build & Dev Commands

- `npm run build` — TypeScript check (`tsc`) + Vite build (output to `dist/`)
- `npm run dev` — Vite dev server with HMR (UI only; platform APIs unavailable outside PPTB)
- `npm run watch` — Vite build in watch mode
- `npm run preview` — Preview the production build locally

No test runner is configured.

## Architecture

**Entry flow:** `index.html` → `src/main.tsx` (CopilotKit provider + env key) → `src/App.tsx` (chat UI + hooks)

**Build constraints (PPTB iframe embedding):**
- Bundle format is **IIFE** (not ESM) — required for `file://` URL loading in the host app
- Single-file output with no code splitting (`inlineDynamicImports: true`, base `./`)
- A custom Vite plugin (`fixHtmlForPPTB` in `vite.config.ts`) post-processes the HTML: removes `type="module"` and `crossorigin` attributes, moves `<script>` tags to end of `<body>`

**Platform APIs:** Two global objects injected at runtime (typed via `@pptb/types`, augmented in `src/vite-env.d.ts`):
- `window.toolboxAPI` — notifications, clipboard, theme, file dialogs, terminal, settings, connections
- `window.dataverseAPI` — FetchXML/OData queries, CRUD, metadata, solutions, bulk ops, function execution

**CopilotKit integration (`@copilotkit/react-core/v2`):**
- `CopilotKit` provider wraps the app with a public API key from `VITE_COPILOTKIT_PUBLIC_API_KEY`
- `useFrontendTool()` — registers tools with Zod-validated parameters and async handlers
- `useRenderTool()` — registers custom React UI renderers for specific tool calls (shows inline cards/tables instead of raw text)
- `useAgentContext()` — injects system instructions and connection state into the agent
- `CopilotChat` — the chat UI component

**Key hooks:**
- `src/hooks/useFrontendTools.ts` — all 45+ `useFrontendTool` registrations grouped by category (notifications, filesystem, terminal, connections, Dataverse queries/CRUD/metadata/solutions, time, weather)
- `src/hooks/useToolRenderers.tsx` — `useRenderTool` registrations that render graphical UI (data tables, record cards, file listings, time/weather cards) for tool results. Tools with renderers should not have their results repeated in agent text.
- `src/hooks/usePlatformContext.ts` — `useConnection()` for Dataverse connection state, `useToolboxEvents()` for platform events
- `src/hooks/useToolboxAPI.ts` — lower-level hooks (`useConnection`, `useToolboxEvents`, `useEventLog`)

**Components:**
- `src/components/TimeCard.tsx` — live animated clock with analog SVG face, timezone support via `Intl.DateTimeFormat`
- `src/components/WeatherCard.tsx` — weather display with condition-based gradients, animated SVG icons, stat cards

**System prompt** in `App.tsx` (`SYSTEM_INSTRUCTIONS`) — defines agent behavior, capabilities, and guidelines. Lists which tools have visual renderers so the agent keeps text responses brief for those.

**Styling:** All in `src/index.css` — dark theme, CopilotKit v2 overrides, tool renderer styles (query tables, record cards, directory listings, time/weather cards). No Tailwind; uses plain CSS classes.

## TypeScript

Strict mode is enabled. The project uses `react-jsx` automatic runtime (no React import needed in components). Linting flags unused locals/parameters and fallthrough cases. Target ES2022.

## Environment

- `VITE_COPILOTKIT_PUBLIC_API_KEY` — required for CopilotKit Cloud (set in `.env`)
- CSP exceptions in `package.json` for `api.cloud.copilotkit.ai` and `wttr.in`

## Key Patterns

- When adding a new frontend tool: add `useFrontendTool()` in `useFrontendTools.ts`, optionally add `useRenderTool()` in `useToolRenderers.tsx`, and if it has a renderer, add it to the renderer tool list in the system prompt in `App.tsx`.
- Tool parameter schemas use Zod (`z.object(...)`) — these are shared between `useFrontendTool` and `useRenderTool` registrations.
- Render functions receive `{ status, parameters, result }` where status is `"inProgress" | "executing" | "complete"` — parameters may be partial during `inProgress`.
