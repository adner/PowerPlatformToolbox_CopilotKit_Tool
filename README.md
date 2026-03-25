# Power Platform Assistant — CopilotKit Tool for PPTB

An AI chat assistant for [Power Platform Tool Box](https://powerplatformtoolbox.com) that lets you talk to your Dataverse environment. Built with [CopilotKit](https://copilotkit.ai) v2, React, and TypeScript.

Ask it to query records, create data, explore metadata, manage solutions — it handles the FetchXML/OData/API calls and shows results in interactive UI components right in the chat.

## What it does

- **Query data** — FetchXML and OData queries with results rendered as sortable tables
- **CRUD operations** — create, retrieve, update, delete records with visual confirmation cards
- **Metadata exploration** — browse entity schemas, attributes, relationships
- **Solutions** — list solutions, publish customizations
- **Bulk operations** — create/update multiple records in one go
- **File system** — read, write, list files via the PPTB host
- **Terminal** — create and manage terminal sessions
- **Extras** — time and weather cards for demo purposes

45+ tools total, many with custom renderers that display results graphically instead of dumping JSON.

## Setup

```bash
npm install
```

Create a `.env` file:
```
VITE_COPILOTKIT_PUBLIC_API_KEY=your_key_here
```

Get a key from [cloud.copilotkit.ai](https://cloud.copilotkit.ai).

## Build

```bash
npm run build        # typecheck + production build → dist/
npm run dev          # dev server (chat UI works, platform APIs won't)
npm run watch        # rebuild on changes
```

The build outputs a single IIFE bundle — no ES modules, no code splitting. This is required for PPTB's iframe + `file://` loading.

## Install in PPTB

1. Build the project
2. In Power Platform Tool Box, go to Tools → Install Tool
3. Point it at the `dist/` directory

The `toolboxAPI` and `dataverseAPI` globals are injected by PPTB at runtime. They don't exist in standalone dev mode.

## License

GPL-3.0
