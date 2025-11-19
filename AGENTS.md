# Repository Guidelines

## Project Structure & Module Organization
Lead Pipe stitches a Next.js App Router UI with a standalone LangGraph worker. UI sources live in `src/app` (routes, API handlers, layout) with shared helpers in `src/lib` and static files in `public`. The agent stays isolated in `agent/` with its own `tsconfig`, `langgraph.json`, and main graph in `agent/src/agent.ts`. Keep helper automation inside `scripts/` and avoid cross-pollinating UI code inside the agent package.

## Build, Test, and Development Commands
- `npm run dev` — starts `next dev` plus `langgraph-cli dev --port 8123`; requires `agent/.env` with `OPENAI_API_KEY`.
- `npm run dev:ui` / `npm run dev:agent` — run either surface individually while debugging.
- `npm run dev:studio` / `npm run dev:agent:studio` — same as above but also opens LangGraph Studio traces.
- `npm run build && npm run start` — compile/serve the UI for production; pair with `cd agent && npm run build` for the worker bundle.
- `npm run lint` — ESLint via `eslint-config-next`; fix violations before pushing.

## Coding Style & Naming Conventions
Write TypeScript with 2-space indentation, semicolons, and focused modules. React components stay functional, PascalCase named, colocated with hooks (see `src/app/page.tsx`), and rely on Tailwind utilities ordered layout→spacing→color. Favor camelCase for variables/state, kebab-case file names under `src/app`, and minimal inline styles. Agent files export named nodes/tools, register them through arrays, and keep tool schemas in concise `z.object` declarations.

## Testing Guidelines
Automated tests are not preconfigured, so log manual validation: preview UI changes via `npm run dev:ui` and hit the agent at `http://localhost:8123` or Studio to confirm tool routing. When adding coverage, follow a colocated pattern (`Component.test.tsx`, `agent/src/foo.test.ts`) and stub CopilotKit state for deterministic runs. Never merge shared-state or tool work without describing how both services were exercised.

## Commit & Pull Request Guidelines
Use short, imperative commit subjects similar to the existing history ("Add deployment steps"), optionally scoped (`ui:`, `agent:`). Rebase or squash noisy fixups locally. Pull requests should describe intent, list tests/commands executed, link the relevant issue, and attach screenshots or logs for UI or agent behavior changes. Call out config or env additions so reviewers can update their setups.

## Security & Configuration Tips
Secrets belong in untracked `.env` files (`agent/.env`, optional root `.env.local`); do not commit API keys. Prefer environment variables or `langgraph.json` values for runtime tweaks instead of hard-coding model names or ports in TypeScript.
