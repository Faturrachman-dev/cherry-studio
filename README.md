<h1 align="center">
  <img src="https://github.com/CherryHQ/cherry-studio/blob/main/build/icon.png?raw=true" width="100" height="100" alt="icon" /><br>
  Cherry Studio Lite
</h1>

<p align="center">
  <strong>Bob’s personal fork of <a href="https://github.com/CherryHQ/cherry-studio">Cherry Studio</a></strong><br>
  A stripped-down, customized Electron AI desktop client optimized for a solo personal AI workflow.
</p>

<p align="center">
  <a href="./docs/en/guides/development.md">Development Guide</a> ·
  <a href="./docs/en/guides/feature-stripping.md">Feature Stripping Guide</a> ·
  <a href="https://github.com/CherryHQ/cherry-studio">Upstream Repo</a>
</p>

---

## What This Is

This is a **personal fork** of Cherry Studio — not a general-purpose distribution. The goal is a lean, fast AI chat client with only the features I actually use, with some custom additions on top.

- All community-facing features (marketplace, telemetry, OAuth, enterprise support) are stripped
- China-market integrations (Nutstore, Yuque, Siyuan) are removed
- Heavy optional subsystems (OCR, image generation, LAN transfer, API server gateway) are gone
- The codebase is ~6,000+ lines lighter than upstream

Built on: **Electron + React + Redux Toolkit + Vercel AI SDK + Vite**

---

## ✨ Custom Features (Added in This Fork)

### Intelligent Context Condensing
Automatically (or manually) condenses long conversation histories into a compact summary before sending to the model — lets you keep context without burning tokens.

- **Toolbar button** in the input bar to condense on demand
- **`/condense` slash command** via the QuickPanel
- **Auto-condense toggle** in General Settings
- Configurable threshold and model selection

### Topic Tabs
Tabbed interface for managing multiple conversation topics side-by-side — switch between topics without losing your place in any of them.

---

## 🔧 What’s Still Here (Upstream Features Retained)

| Feature | Notes |
|---------|-------|
| Multi-provider LLM support | OpenAI, Anthropic, Gemini, Ollama, and 30+ others |
| AI Assistants & conversations | 300+ presets, custom assistants, multi-model chat |
| Knowledge Base (RAG) | PDF, Markdown, CSV loaders retained; sitemap loader removed |
| MCP (Model Context Protocol) | JSON-based server config; marketplace/DXT removed |
| Memory System | Cross-conversation AI memory |
| Notes Editor | TipTap-based rich markdown editor |
| Translate Page | Dedicated AI translation UI |
| Code Tools | Claude Code / Qwen-Coder launcher |
| Export to Notion / Obsidian | Lightweight export targets retained |
| Export to DOCX / Markdown | Standard document exports |
| WebDAV / S3 backup | Backup integrations |
| Selection Assistant | Quick context selection overlay |
| Quick Assistant | Floating assistant window |
| Quick Phrases | Saved prompt shortcuts |
| Themes | Light/dark + custom CSS themes |
| Markdown rendering | Full GFM + math (KaTeX) + diagrams (Mermaid) |

---

## 🗑️ Stripped Features

These were removed to reduce bundle size, startup time, and maintenance surface:

| Feature | Reason |
|---------|--------|
| Paintings / Image Generation | Different workflow — use a dedicated image tool |
| API Server (REST gateway) | Single user — no need for an HTTP endpoint inside the app |
| OCR | Modern vision LLMs handle this natively |
| LAN Transfer | Solo use — no other instances to transfer to |
| Analytics / Telemetry | Should not send usage data to upstream servers |
| Launchpad Page | Unused start page |
| Files Manager Page | Redundant with OS file management |
| Joplin / Siyuan / Yuque Export | Niche / China-market targets |
| Nutstore Sync | China-market cloud service |
| DXT Plugin System | MCP configured manually in JSON |
| OpenClaw Gateway | Single-user direct API access — no proxy needed |

> See [docs/en/guides/feature-stripping.md](docs/en/guides/feature-stripping.md) for the full catalogue and decision reasoning.

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 20
- pnpm

### Install & Run

```bash
pnpm install
pnpm dev          # Electron + Vite HMR
```

### Build

```bash
pnpm build:win    # Windows (x64 + arm64)
pnpm build        # Vite bundle only
```

### Tests & Quality

```bash
pnpm test         # All tests (Vitest)
pnpm build:check  # lint + test + typecheck
pnpm format       # Biome formatter
```

---

## 📦 Releases

| File | Description |
|------|-------------|
| `Cherry-Studio-Lite-x.y.z-x64-setup.exe` | Windows installer |
| `Cherry-Studio-Lite-x.y.z-x64-portable.exe` | Windows portable |

Current version: **0.2.1**

---

## 📜 License

Based on [Cherry Studio](https://github.com/CherryHQ/cherry-studio), licensed under [AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0).
