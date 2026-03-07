# Feature Stripping Guide

**For Bob's personal fork of Cherry Studio.**

This document catalogues every significant feature that is a candidate for removal from the upstream build. Each feature is described — what it does, what it touches in the codebase, how heavy it is, and a recommendation on whether to keep it for a personal AI workflow.

Use this as a reference checklist before stripping anything. Read through carefully — some features overlap (e.g., Knowledge Base hooks into Export; API Server hooks into multiple services).

---

## How to Read This Doc

Each entry contains:

- **What it does** — plain language description of the user-facing feature
- **Why it exists in upstream** — who the typical upstream user is
- **Files** — key files and directories involved
- **Dependencies** — npm packages that exist *only* for this feature
- **Size** — rough complexity indicator
- **Recommendation** — Keep / Strip / Evaluate
- **If kept** — what to consider if you decide to keep it
- **If stripped** — what else breaks or needs cleanup

---

## Tier 1 — Strip First

These are the highest-impact removals: heavyweight dependency chains, large file counts, and near-zero personal value for a solo AI workflow user.

---

### 1. Knowledge Base / RAG

**What it does**

Turns Cherry Studio into a local RAG (Retrieval-Augmented Generation) system. You can upload documents — PDFs, CSVs, Word files, web pages, sitemaps, markdown files, images — and have the AI answer questions grounded in that content. Cherry Studio chunks the documents, generates vector embeddings using an embedding model, stores them in a local SQLite-based vector database (`libsql`), and retrieves relevant chunks when you send a message.

**Why it exists in upstream**

Enterprise and power users who want a fully offline knowledge management system — think "ChatGPT over your own documents."

**Files**

| Location | Description |
|----------|-------------|
| `src/main/services/KnowledgeService.ts` | Core service — 763 LOC. Manages ingestion, chunking, embedding, retrieval |
| `src/main/knowledge/` | 29 files — loaders for each document type (PDF, CSV, HTML, sitemap, office, images, etc.) |
| `src/renderer/src/pages/knowledge/` | 28 UI files — Knowledge Base management pages |
| `src/renderer/src/store/knowledge.ts` | Redux state slice |
| `src/renderer/src/components/` | Several knowledge-specific components |

**Dependencies** (would be safe to remove)

```
@cherrystudio/embedjs
@cherrystudio/embedjs-loader-csv
@cherrystudio/embedjs-loader-markdown
@cherrystudio/embedjs-loader-msoffice
@cherrystudio/embedjs-loader-pdf
@cherrystudio/embedjs-loader-sitemap
@cherrystudio/embedjs-loader-web
@cherrystudio/embedjs-loader-xml
@cherrystudio/embedjs-loader-youtube
@cherrystudio/embedjs-libsql
@langchain/core
@langchain/openai
@libsql/client
```

**Size** → **Very High** — 57+ files, 13 npm packages, native SQLite binaries

**Recommendation: Evaluate carefully before stripping**

> You said you might use Knowledge Base. The key question is: do you need *document ingestion + vector search*, or do you just want to *paste context manually* into the chat?
>
> - If you paste docs manually or use Claude's/Gemini's large context window → **strip it**
> - If you genuinely upload and query your own PDFs/notes → **keep it**
>
> Even if you keep it, consider keeping only specific loaders (e.g., PDF + markdown only) and removing YouTube, sitemap, XML, office loaders.

**If stripped** — Also remove the sidebar `knowledge` icon entry, the `knowledge` route in the router, and the Knowledge Base button in assistants.

---

### 2. Paintings / Image Generation

**What it does**

A dedicated image generation page supporting 8+ AI image providers: SiliconFlow, DMXAPI, TokenFlux, PPIO, Aihubmix, Zhipu Visual, OVMS (Intel OpenVINO local), and a generic custom endpoint. Includes a full gallery view, image history, prompt management, and parameter controls (steps, CFG scale, resolution, sampler, etc.).

**Why it exists in upstream**

Users who want a one-stop creative AI tool for both chat and image generation.

**Files**

| Location | Description |
|----------|-------------|
| `src/renderer/src/pages/paintings/` | 25 UI files — full paintings page and provider-specific panels |
| `src/renderer/src/pages/paintings/config/` | 8 provider configuration files |
| `src/renderer/src/store/paintings.ts` | Redux state (97 LOC) |
| `src/main/services/OvmsManager.ts` | Intel OVMS local model manager (577 LOC) |

**Dependencies**

No exclusive npm packages (uses existing AI SDK providers), but `OvmsManager.ts` downloads and manages Intel OpenVINO binaries at runtime.

**Size** → **High** — 33+ files, 577 LOC heavyweight service

**Recommendation: Strip**

> Pure image generation is a different workflow from AI chat. If you want to generate images, use a dedicated tool. Removing this also kills the OVMS manager which is Intel-GPU–specific and not needed unless you're running OpenVINO locally.

**If stripped** — Remove `paintings` sidebar icon, `paintings` store slice, `paintings` route, and `OvmsManager.ts`. Clean up `electron-builder.yml` if it packages OVMS binaries.

---

### 3. API Server

**What it does**

Runs an Express HTTP server *inside* the Electron app that exposes Cherry Studio's chat functionality as an OpenAI-compatible REST API with Swagger documentation. Other apps or scripts on the same machine (or network) can call it like a local LLM endpoint. Includes authentication via API key.

**Why it exists in upstream**

Developers who want to use Cherry Studio as a local AI proxy — pipe requests from other tools through it.

**Files**

| Location | Description |
|----------|-------------|
| `src/main/apiServer/` | 33 files — Express routes, controllers, middleware, Swagger spec |
| `src/main/services/ApiServerService.ts` | Service entrypoint (115 LOC) |
| `src/renderer/src/store/settings.ts` | `apiServer` settings block |
| Settings UI | API Server enable/port/key settings in GeneralSettings |

**Dependencies**

```
express
@types/express
swagger-jsdoc
swagger-ui-express
cors
```

**Size** → **High** — 33 files + 5 packages

**Recommendation: Strip**

> You're the only user of your fork. You don't need an HTTP endpoint inside your desktop chat app. Removing this simplifies startup, eliminates an open port, and removes a security surface.

**If stripped** — Remove `apiServer` from settings state and UI, remove API Server menu items, remove `express`/`swagger` deps.

---

### 4. OCR (Optical Character Recognition)

**What it does**

Extracts text from images using two separate OCR engines: `tesseract.js` (WebAssembly, works on all platforms) and `@napi-rs/system-ocr` (uses OS-native OCR — Windows OCR, macOS Vision). Allows users to right-click an image in chat and extract text from it, or use it during file attachment processing.

**Why it exists in upstream**

Users who receive screenshots or image-heavy documents and want to extract text for further AI processing.

**Files**

| Location | Description |
|----------|-------------|
| `src/main/services/ocr/` | 6 files — OCR orchestration, engine selection |
| `src/renderer/src/store/ocr.ts` | Redux state (86 LOC) |

**Dependencies**

```
tesseract.js          # ~15MB WASM binary
@napi-rs/system-ocr   # Native binary per platform
```

**Size** → **Medium** files, but **Very Heavy** binaries (WASM + native, adds significant bundle size)

**Recommendation: Strip**

> Modern LLMs (GPT-4o, Gemini, Claude) can read text in images directly via vision. You don't need a separate OCR engine — just attach the image and ask the model to extract the text. Removing this eliminates the largest binary payload in the app.

**If stripped** — Remove OCR menu items from image context menus, remove `ocr` store slice, remove both OCR packages from `package.json`.

---

### 5. LAN Transfer

**What it does**

Discovers other Cherry Studio instances on the same local network using Bonjour/mDNS (the same protocol Apple uses for AirDrop discovery), then transfers data (conversations, files, settings) between them over a custom binary protocol via TCP.

**Why it exists in upstream**

Teams or households where multiple people run Cherry Studio and want to share conversations or configurations without cloud sync.

**Files**

| Location | Description |
|----------|-------------|
| `src/main/services/lanTransfer/` | 13 files — mDNS discovery, TCP transfer, binary framing protocol |
| `src/main/services/LocalTransferService.ts` | Service orchestration (208 LOC) |

**Dependencies**

```
bonjour-service   # mDNS/Bonjour discovery
```

**Size** → **High** — 13 files + custom binary protocol implementation

**Recommendation: Strip**

> Solo use. There's no other Cherry Studio instance to transfer to.

**If stripped** — Remove the LAN Transfer page/button from sidebar or settings, remove `bonjour-service` dep.

---

## Tier 2 — Strip Next

Medium effort, mostly isolated integrations. Each one is self-contained enough to remove without breaking core functionality.

---

### 6. Export: Notion

**What it does**

Exports conversations or individual messages to a Notion database. Requires a Notion API key and database ID. Converts Cherry Studio's markdown content into Notion blocks, preserving headings, code blocks, and inline formatting.

**Files** — `src/renderer/src/utils/export.ts` (Notion section ~200 LOC), settings fields in `settings.ts`

**Dependencies**

```
@notionhq/client       # Official Notion API client
notion-helper          # Notion block builder utilities
@tryfabric/martian     # Markdown-to-Notion block converter
```

**Recommendation: Strip** (unless you actively use Notion as your notes system)

---

### 7. Export: Yuque

**What it does**

Exports markdown content to [Yuque](https://www.yuque.com/) — a Chinese collaborative documentation platform by Alibaba. Requires a Yuque API token and repository target.

**Files** — `src/renderer/src/utils/export.ts` (Yuque section ~80 LOC), settings fields

**Dependencies** — None exclusive (uses `axios`)

**Recommendation: Strip** (Yuque is China-market-specific)

---

### 8. Export: Joplin

**What it does**

Exports conversations to [Joplin](https://joplinapp.org/) — an open-source markdown note-taking app. Connects to Joplin's local REST API (the Joplin desktop app must already be running with Web Clipper enabled).

**Files** — `src/renderer/src/utils/export.ts` (Joplin section ~70 LOC), settings fields

**Dependencies** — None exclusive

**Recommendation: Strip** (unless Joplin is your daily notes tool)

---

### 9. Export: Obsidian

**What it does**

Exports conversations to an [Obsidian](https://obsidian.md/) vault — writes markdown files directly into your Obsidian vault directory on disk, with YAML frontmatter. Also includes vault discovery and management.

**Files** — `src/renderer/src/utils/export.ts` (Obsidian section ~110 LOC), `src/main/services/ObsidianVaultService.ts` (222 LOC), settings fields

**Dependencies** — None exclusive (direct filesystem write)

**Recommendation: Evaluate** — If you use Obsidian heavily for notes, this is actually useful and lightweight (no npm packages, just file writes).

---

### 10. Export: Siyuan

**What it does**

Exports conversations to [Siyuan Note](https://b3log.org/siyuan/) — a Chinese self-hosted knowledge management app. Connects via Siyuan's local REST API.

**Files** — `src/renderer/src/utils/export.ts` (Siyuan section ~115 LOC), settings fields

**Dependencies** — None exclusive

**Recommendation: Strip** (Siyuan is niche, China-market focused)

---

### 11. Export: DOCX (Microsoft Word)

**What it does**

Exports conversations to a `.docx` Word document. Converts the chat history into formatted Word paragraphs with proper heading styles, code blocks as monospace, and assistant/user attribution.

**Files** — `src/main/services/ExportService.ts` (partial, ~410 LOC total), `src/renderer/src/utils/export.ts`

**Dependencies**

```
docx   # Word document generation library
```

**Recommendation: Evaluate** — Useful if you share conversations with non-technical people or need to embed them in reports. The `docx` package is small and self-contained.

---

### 12. Backup: WebDAV

**What it does**

Backs up your entire Cherry Studio data directory (conversations, settings, assistants) to a WebDAV server. Supports auto-sync on a schedule. Restore from backup is also supported.

**Files** — `src/main/services/WebDav.ts` (138 LOC), `src/main/services/BackupManager.ts` (843 LOC shared with other backup types), settings fields

**Dependencies**

```
webdav   # WebDAV client
```

**Recommendation: Strip** (unless you self-host a WebDAV server like Nextcloud)

---

### 13. Backup: S3

**What it does**

Same as WebDAV backup but targets Amazon S3 or any S3-compatible object storage (MinIO, Cloudflare R2, etc.).

**Files** — `src/main/services/S3Storage.ts` (185 LOC), settings fields

**Dependencies**

```
@aws-sdk/client-s3   # AWS SDK (heavy, even tree-shaken)
```

**Recommendation: Strip** (removes an AWS SDK dependency which has significant size)

---

### 14. Backup: Nutstore

**What it does**

Syncs Cherry Studio data to [Nutstore](https://www.jianguoyun.com/) (坚果云) — a Chinese cloud storage service — using WebDAV under the hood, with OAuth SSO login.

**Files** — `src/main/services/NutstoreService.ts` (140 LOC), `src/main/integration/nutstore/` (3 files), `src/renderer/src/store/nutstore.ts` (87 LOC)

**Dependencies** — None exclusive (uses WebDAV internally)

**Recommendation: Strip** (China-market service)

---

### 15. MinApps Marketplace

**What it does**

An embedded mini web app browser built into Cherry Studio's sidebar. Loads a curated list of web apps (web versions of AI tools, utilities, etc.) inside Electron WebViews. Users can "install" mini apps that persist in the sidebar as quick-launch icons.

**Files**

| Location | Description |
|----------|-------------|
| `src/renderer/src/pages/minapps/` | 10 files — MinApps browser, grid, AppCard components |
| `src/renderer/src/store/minapps.ts` | Redux state (56 LOC) |

**Dependencies** — None exclusive (uses Electron WebView)

**Recommendation: Strip** — You have a browser for this. Removes the `minapp` sidebar icon and reduces sidebar clutter.

---

### 16. OpenClaw Gateway

**What it does**

A local AI gateway/proxy that installs itself via `npm` at runtime. It intercepts AI API calls and routes them through a channel management system — useful for load balancing across multiple API keys or working around rate limits. Has its own management UI.

**Files**

| Location | Description |
|----------|-------------|
| `src/main/services/OpenClawService.ts` | The gateway service — **1024 LOC** |
| `src/renderer/src/pages/openclaw/` | 2 UI files |
| `src/renderer/src/store/openclaw.ts` | Redux state (71 LOC) |

**Dependencies** — None exclusive (installs its own package at runtime via npm)

**Recommendation: Strip** — You're a single user with direct API access. No need for proxy middleware.

---

### 17. Notes Editor

**What it does**

A full-featured rich text + markdown editor built into Cherry Studio's sidebar. Powered by TipTap (ProseMirror-based), it supports live markdown rendering, code blocks with syntax highlighting, tables, images, and even real-time collaborative editing via Yjs CRDT (designed for multi-user, though unused in the desktop context).

**Files**

| Location | Description |
|----------|-------------|
| `src/renderer/src/pages/notes/` | 14 files — editor, toolbar, note list, sidebar |
| `src/renderer/src/store/note.ts` | Redux state |

**Dependencies**

```
# 15+ TipTap packages
@tiptap/core  @tiptap/react  @tiptap/pm
@tiptap/extension-*  (collaboration, color, highlight, link, etc.)
# Collaboration
yjs
y-protocols
y-indexeddb
```

**Recommendation: Strip** (unless you actively use the notes editor daily)

> The TipTap + Yjs dependency tree is heavy and adds significant bundle weight. If you need notes, Obsidian or any external editor is better.

---

### 18. CherryIN OAuth

**What it does**

OAuth 2.0 login flow for Cherry Studio's own cloud service — "CherryIN." Allows users to authenticate with a Cherry Studio account to access cloud-synced features, a subscription dashboard, or community features hosted by the upstream team.

**Files** — `src/main/services/CherryINOAuthService.ts` (498 LOC), associated URL handlers

**Dependencies** — None exclusive

**Recommendation: Strip** — This connects to the upstream team's infrastructure. As a fork user, you don't have a CherryIN account, and none of this is relevant to your personal workflow.

---

### 19. Analytics / Telemetry

**What it does**

Tracks token usage statistics and sends aggregated analytics data to `@cherrystudio/analytics-client` (Cherry Studio's proprietary analytics service). Covers per-model token counts, conversation frequencies, etc.

**Files** — `src/main/services/AnalyticsService.ts` (47 LOC)

**Dependencies**

```
@cherrystudio/analytics-client
```

**Recommendation: Strip immediately** — You should not be sending usage data to the upstream team's servers from your personal fork.

---

### 20. YouTube Integration

**What it does**

Fetches YouTube video transcripts/metadata so they can be used as context in AI conversations. A user can paste a YouTube URL and the app extracts the transcript for the AI to reference.

**Files** — Used inside `src/main/knowledge/` (Knowledge Base loader)

**Dependencies**

```
youtubei.js   # YouTube private API client (no official API key needed)
```

**Recommendation: Strip** — Already bundled with Knowledge Base. If you strip Knowledge Base, this goes with it. If you keep KB, evaluate whether you want YouTube transcript loading.

---

### 21. React Player / Media Embeds

**What it does**

Renders embedded media players (video, audio) inside chat messages when a message contains a media URL. Uses `react-player` which supports YouTube, Vimeo, SoundCloud, Twitch, and direct video/audio files.

**Files** — Used in message rendering components

**Dependencies**

```
react-player   # Multi-platform media player component
```

**Recommendation: Strip** — Media embeds in chat are a niche UX feature. Clicking a link to open in browser is sufficient.

---

## Tier 3 — Evaluate Carefully

These features have legitimate personal utility. Read the descriptions and decide based on your actual workflow.

---

### 22. Translate Page

**What it does**

A dedicated translation UI — separate from the main chat — optimized for translating text. You paste text on the left, select source and target languages, and get the translation on the right. Uses your configured AI providers as the translation engine. Also supports auto-translate-on-spacebar (types and translates inline).

**Files** — `src/renderer/src/pages/translate/` (3 files), `src/renderer/src/store/translate.ts` (57 LOC)

**Dependencies** — None exclusive

**Size** → **Low**

**Recommendation: Keep** — It's tiny (3 files, 57 LOC state), and a dedicated translation UI is genuinely useful even for personal workflows. Cost to keep: near zero.

---

### 23. Code Tools

**What it does**

Detects and manages AI-powered CLI coding tools installed on your machine — specifically tools like Claude Code (`claude`), Qwen-Coder, and similar CLI agents. Provides a UI to launch them, manage their configuration, detect their version, and set up their environment. Also includes a terminal detection system to find your installed shells.

**Files**

| Location | Description |
|----------|-------------|
| `src/main/services/CodeToolsService.ts` | Core service — **1170 LOC** |
| `src/renderer/src/pages/code/` | 3 UI files |
| `src/renderer/src/store/codeTools.ts` | Redux state (173 LOC) |

**Dependencies** — None exclusive

**Size** → **High** (1170 LOC service)

**Recommendation: Evaluate** — If you use Claude Code or similar CLI agents, this gives you a convenient launcher. If you run those tools purely from a terminal yourself, strip it.

---

### 24. Memory System

**What it does**

Gives the AI "long-term memory" across conversations. After each conversation, an AI model extracts key facts (user preferences, names, recurring topics) and stores them in a structured memory store. On subsequent conversations, relevant memories are retrieved and injected into the system prompt — so the AI "remembers" things about you across sessions.

**Files**

| Location | Description |
|----------|-------------|
| `src/main/services/memory/` | 2 files — memory extraction and recall |
| `src/renderer/src/store/memory.ts` | Redux state (136 LOC) |

**Dependencies** — None exclusive (uses existing AI providers)

**Size** → **Low-Medium**

**Recommendation: Keep** — This is a high-value personal AI feature. Automatic cross-conversation memory is exactly the kind of thing that makes an AI feel personalized. Low cost to keep.

---

### 25. DXT Extensions

**What it does**

A Desktop Extension system — users can install `.dxt` extension packages that add new capabilities to Cherry Studio (new AI providers, custom tools, UI panels, MCP servers). Extensions are installed from a marketplace or local `.dxt` files.

**Files** — `src/main/services/DxtService.ts` (480 LOC)

**Dependencies** — None exclusive

**Size** → **Medium**

**Recommendation: Evaluate** — If you use MCP (Model Context Protocol) heavily, DXT is the mechanism for packaging MCP servers as installable extensions. If you configure MCP manually in settings, you don't need DXT.

---

### 26. Agents DB (Drizzle ORM)

**What it does**

A structured database layer for managing AI Agents (more complex than basic Assistants). Uses Drizzle ORM with a SQLite database to store agent definitions, tools, capabilities, sessions, and execution history. Powers the Agent Session scope in the input bar.

**Files**

| Location | Description |
|----------|-------------|
| `src/main/services/agents/` | 36 files — Drizzle schema, migrations, CRUD services, agent executor |

**Dependencies**

```
drizzle-orm
drizzle-kit
better-sqlite3   # (shared with main app DB)
```

**Size** → **High** — 36 files

**Recommendation: Keep** — The Agent system underlies assistant management and the slash command system you're already using. Removing it would require significant refactoring of core chat functionality that isn't worth the effort.

---

## Summary Table

| # | Feature | Tier | Size | Status |
|---|---------|------|------|--------|
| 1 | Knowledge Base / RAG | 1 | Very High | ✅ **Trimmed** (sitemap loader removed; PDF, Markdown, CSV retained) |
| 2 | Paintings / Image Gen | 1 | High | ✅ **Stripped** |
| 3 | API Server | 1 | High | ✅ **Stripped** (minimal stubs kept for agent compat) |
| 4 | OCR | 1 | Medium+heavy deps | ✅ **Stripped** |
| 5 | LAN Transfer | 1 | High | ✅ **Stripped** |
| 6 | Export: Notion | 2 | Medium | ✅ **Kept** |
| 7 | Export: Yuque | 2 | Low | ✅ **Stripped** |
| 8 | Export: Joplin | 2 | Low | ✅ **Stripped** |
| 9 | Export: Obsidian | 2 | Low | ✅ **Kept** |
| 10 | Export: Siyuan | 2 | Low | ✅ **Stripped** |
| 11 | Export: DOCX | 2 | Low | Evaluate |
| 12 | Backup: WebDAV | 2 | Medium | Evaluate |
| 13 | Backup: S3 | 2 | Medium | Evaluate |
| 14 | Backup: Nutstore | 2 | Low | ✅ **Stripped** |
| 15 | MinApps Marketplace | 2 | Medium | Evaluate |
| 16 | OpenClaw Gateway | 2 | High | ✅ **Stripped** |
| 17 | Notes Editor | 2 | High | Evaluate |
| 18 | CherryIN OAuth | 2 | Medium | Evaluate |
| 19 | Analytics / Telemetry | 2 | Low | ✅ **Stripped** (no-op stub) |
| 20 | YouTube Integration | 2 | Low | Evaluate |
| 21 | React Player | 2 | Low | Evaluate |
| 22 | Translate Page | 3 | Low | **Keep** |
| 23 | Code Tools | 3 | High | Evaluate |
| 24 | Memory System | 3 | Low | **Keep** |
| 25 | DXT Extensions | 3 | Medium | ✅ **Stripped** |
| 26 | Agents DB (Drizzle) | 3 | High | **Keep** |

### Also stripped in Tier 2:

| Feature | Status |
|---------|--------|
| Launchpad Page | ✅ Stripped — page deleted; default tab → `/` |
| Files Manager Page | ✅ Stripped — pages deleted; `FileItem` extracted to shared component |
| Selection Assistant | ✅ Kept — small, deeply integrated |
| Quick Assistant | ✅ Kept — ~660 LOC, already lean |
| Quick Phrases | ✅ Kept — ~270 LOC, barebones |

---

## Stripping Checklist

When removing any feature, always follow this order:

1. **Remove sidebar icon** — `src/renderer/src/config/sidebar.ts`
2. **Remove route** — `src/renderer/src/Router.tsx`
3. **Remove page files** — `src/renderer/src/pages/<feature>/`
4. **Remove Redux slice** — `src/renderer/src/store/<feature>.ts`
5. **Remove IPC handlers** — any `ipcMain.handle('<feature>:*')` calls
6. **Remove service** — `src/main/services/<FeatureService>.ts`
7. **Remove from main entrypoint** — `src/main/index.ts` service instantiation
8. **Remove i18n keys** — search and delete from all `src/renderer/src/i18n/` locale files
9. **Remove npm packages** — `pnpm remove <package-name>`
10. **Run** `pnpm build:check` — verify nothing is broken

> **Never** skip step 10. Incomplete removal causes TypeScript errors that are easy to miss.
