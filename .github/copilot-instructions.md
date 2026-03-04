# Copilot Workspace Instructions

These instructions apply to ALL interactions in this workspace.

## Communication

- Always greet owner by name on every opening messages
- Be direct, concise, skip unnecessary framing
- Never announce tool names — describe actions naturally
- After completing file operations, confirm briefly instead of explaining what was done
- Use tables for comparisons, bullet lists for steps

## Project Context

This is **Owner's fork** of [Cherry Studio](https://github.com/CherryHQ/cherry-studio) — a lightweight, customized build focused on Owner's personal AI workflow. We strip unused features and add custom ones (e.g., Intelligent Context Condensing).

- **Stack**: Electron + React + Redux Toolkit + Vercel AI SDK + Vite
- **Package Manager**: `pnpm` (monorepo with workspaces)
- **Runtime**: Node.js ≥ 20, Electron
- **AI Core**: `packages/aiCore/` — plugin-based middleware pipeline
- **Renderer**: `src/renderer/` — React UI with Redux state
- **Main Process**: `src/main/` — Node.js services (MCP, Knowledge, etc.)

## Code Style

- Match the project's existing patterns, indentation, and naming conventions before writing new code
- Prefer readability over cleverness — write code a junior dev can understand
- Add comments only for "why", never for "what" (the code itself should explain what)
- Use descriptive variable names; avoid single-letter names outside loops
- Keep functions under ~40 lines; extract when longer
- Route all logging through `loggerService` — no `console.log`
- Use `definePlugin` / `registerTool` patterns for new AI plugins and input tools

## Git Discipline

### Branching
- Work directly on `main` for small, safe changes (single-file tweaks, version bumps, doc updates)
- Use feature branches (`git checkout -b feature/description`) for multi-file or risky changes
- Branch naming: `feature/`, `fix/`, `refactor/`, `docs/` prefixes

### Commit Messages
- Format: `type: Short imperative summary` (Conventional Commits)
- Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`
- Good: `feat: Add intelligent context condensing middleware`, `fix: Correct threshold validation`
- Bad: `fixed stuff`, `update`, `wip`, `bump`
- One logical change per commit — don't mix unrelated changes
- Commit after each working milestone, not in huge batches
- **Atomic commits**: When making large multi-system changes (e.g., stripping features), commit each system/feature separately — never combine everything into one giant commit

### Versioning
- This fork starts from `0.x.y` — independent of upstream Cherry Studio versioning
- `0.MINOR.0` — new feature (e.g., `0.1.0` = context condensing)
- `0.MINOR.PATCH` — hotfix on that feature (e.g., `0.1.1`)
- Bump version in `package.json`
- Tag releases when publishing: `git tag v0.X.Y && git push --tags`
- Current version: **0.1.0**

### Things to Never Commit
- Debug/test files, `.env` files, secrets
- `node_modules/`, build artifacts, `dist/`
- Temporary or scratch files (`.conversation`, `*.tmp`)

## Build & Deploy

- Install: `pnpm install`
- Dev: `pnpm dev` (Electron + Vite HMR)
- Build: `pnpm build` (production)
- Build Windows: `pnpm build:win`
- Build check: `pnpm build:check` (lint + test + typecheck)
- Format: `pnpm format` (Biome)

## Testing (TDD Workflow)

- Write tests first when adding new features
- Run tests after every code change: `pnpm test`
- Scoped tests: `pnpm test:main`, `pnpm test:renderer`, `pnpm test:aicore`
- Tests use Vitest
- Always verify backward compatibility when refactoring
- Coding tasks are only complete after tests pass

## Error Handling

- Investigate root cause — don't patch symptoms
- Check actual schemas, file contents, and runtime behavior before assuming
- Verify fixes work (test output, CLI check) before declaring done

## Security Defaults

- Never hardcode credentials, API keys, or secrets in source files
- Use environment variables or `.env` files (gitignored) for sensitive config
- Sanitize user inputs

## Custom Features (Owner's Fork)

| Feature | Status | Location |
|---------|--------|----------|
| Intelligent Context Condensing | ✅ Done | `packages/aiCore/src/core/middleware/condense.ts` + `src/renderer/src/aiCore/plugins/condenseContextPlugin.ts` |
| Condense Toolbar Button | ✅ Done | `src/renderer/src/pages/home/Inputbar/tools/condenseMessagesTool.tsx` |
| /condense Slash Command | ✅ Done | QuickPanel integration in condenseMessagesTool |
| Settings Toggle | ✅ Done | `src/renderer/src/pages/settings/GeneralSettings.tsx` |

## Stripped Features (Tier 1 — Completed)

| Feature | Status | Approach |
|---------|--------|----------|
| Paintings/Image Generation | ✅ Stripped | Pages, store, OVMS, hooks deleted; sidebar/router cleaned |
| API Server REST API | ✅ Stripped | Routes/middleware/services deleted; minimal stubs in `src/main/apiServer/` for agent compat |
| OCR | ✅ Stripped | Services, store, hooks, types, settings UI, config deleted |
| LAN Transfer | ✅ Stripped | Services, IPC handlers, popup deleted |
| Analytics/Telemetry | ✅ Stripped | Service deleted; `utils/analytics.ts` is a no-op stub |
| Knowledge Base (partial) | ✅ Trimmed | Sitemap loader removed; PDF, Markdown, CSV retained |

## Feature Stripping Plan

When removing upstream features not needed by Owner:
- Remove all entry points (UI buttons, context menus, shortcuts, sidebar icons)
- Remove associated Redux state, reducers, and selectors
- Remove corresponding services and IPC handlers
- Delete test files for deleted services (don't leave orphaned tests)
- Clean up i18n keys
- For `migrate.ts`: add `@ts-ignore -- stripped feature` before references to stripped state — never delete migrations
- For cross-cutting dependencies (agent services importing API server utils): create minimal stubs that preserve type signatures
- Run `pnpm build:check` to verify nothing breaks
- Commit each stripped feature/system separately

## Known Pitfalls (Lessons Learned)

### pnpm
- `pnpm remove <pkg>` can hang indefinitely on Windows — edit `package.json` manually + `pnpm install --no-frozen-lockfile` instead

### Path Handling
- Never mix `path.normalize()` with `path.resolve()` — `normalize` converts `/` to `\` on Windows but `resolve` may not, causing string comparison mismatches
- Use `path.relative()` for containment checks instead of `startsWith()` — it's separator-agnostic
- Tests with hardcoded POSIX paths (e.g., `/home/user/mcp/...`) behave differently on Windows because `path.resolve` adds drive letters

### Migrations (`migrate.ts`)
- Never delete migration functions — they run on existing user databases
- Use `@ts-ignore` before references to stripped state slices
- Keep stripped config imports either via `@ts-ignore` or minimal stub files

### JSON Editing
- Be careful with `replace_string_in_file` on `package.json` — literal `\n` and escaped `\"` can corrupt the file
- Always validate JSON after editing: `node -e "JSON.parse(require('fs').readFileSync('package.json','utf-8'))"`
