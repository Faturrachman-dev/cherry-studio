# Copilot Workspace Instructions

These instructions apply to ALL interactions in this workspace.
Owner: **Bob**

## Communication

- Always greet Bob by name in opening messages
- Be direct, concise, skip unnecessary framing
- Never announce tool names — describe actions naturally
- After completing file operations, confirm briefly instead of explaining what was done
- Use tables for comparisons, bullet lists for steps

## Project Context

This is **Bob's fork** of [Cherry Studio](https://github.com/CherryHQ/cherry-studio) — a lightweight, customized build focused on Bob's personal AI workflow. We strip unused features and add custom ones (e.g., Intelligent Context Condensing).

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

### Versioning
- Use semantic `MAJOR.MINOR.PATCH` format (e.g. `1.7.22`)
- Bump version in `package.json`
- Tag releases when publishing: `git tag vX.Y.Z && git push --tags`

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

## Custom Features (Bob's Fork)

| Feature | Status | Location |
|---------|--------|----------|
| Intelligent Context Condensing | ✅ Done | `src/renderer/src/aiCore/plugins/condenseContextPlugin.ts` |
| Condense Toolbar Button | ✅ Done | `src/renderer/src/pages/home/Inputbar/tools/condenseMessagesTool.tsx` |
| /condense Slash Command | ✅ Done | QuickPanel integration in condenseMessagesTool |
| Settings Toggle | ✅ Done | `src/renderer/src/pages/settings/GeneralSettings.tsx` |

## Feature Stripping Plan

When removing upstream features not needed by Bob:
- Remove all entry points (UI buttons, context menus, shortcuts, sidebar icons)
- Remove associated Redux state, reducers, and selectors
- Remove corresponding services and IPC handlers
- Clean up i18n keys
- Run `pnpm build:check` to verify nothing breaks
