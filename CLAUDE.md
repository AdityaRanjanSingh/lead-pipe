# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a CopilotKit + LangGraph starter template combining a Next.js 15 UI (App Router) with a TypeScript-based LangGraph agent. The UI runs on port 3000 and the agent server runs on port 8123. They communicate through CopilotKit's runtime bridge configured in `src/app/api/copilotkit/route.ts`.

## Architecture

**Two-Service Architecture:**
- **Next.js UI** (`src/`): React 19 frontend with CopilotKit integration for chat interface, frontend actions, shared state, and generative UI
- **LangGraph Agent** (`agent/`): TypeScript-based agent using LangChain with OpenAI GPT-4o, running as a separate service via `@langchain/langgraph-cli`

**Key Integration Points:**
- `src/app/api/copilotkit/route.ts`: CopilotKit runtime with LangGraphAgent adapter connecting to `http://localhost:8123`
- `agent/langgraph.json`: Defines the graph export (`starterAgent` from `./src/agent.ts:graph`) and HTTP app (`./src/app.ts:app`)
- `agent/src/agent.ts`: Core agent graph with state, tools, nodes, and conditional routing logic
- `agent/src/app.ts`: Hono HTTP server providing health check endpoints (`/health`, `/ok`)

**State Flow:**
- Agent state extends `CopilotKitStateAnnotation` with custom fields (e.g., `proverbs: string[]`)
- Frontend uses `useCoAgent<AgentState>()` to sync shared state bidirectionally
- Agent receives frontend actions via `convertActionsToDynamicStructuredTools()` and can call them as tools
- Tool routing logic in `shouldContinue()` distinguishes between frontend actions (handled by CopilotKit) and backend tools (routed to `tool_node`)

**Graph Structure:**
- `chat_node`: Invokes ChatOpenAI with bound tools (frontend + backend), returns AI message
- `tool_node`: ToolNode executing backend tools (e.g., `getWeather`)
- Conditional edges: Routes to `tool_node` if tool call is backend, else ends

## Development Commands

**Start both services:**
```bash
npm run dev  # Runs UI (port 3000) + agent (port 8123) concurrently
```

**Individual services:**
```bash
npm run dev:ui          # Next.js only
npm run dev:agent       # LangGraph agent only (no Studio)
npm run dev:agent:studio # Agent with LangGraph Studio UI
npm run dev:studio      # UI + agent with Studio
```

**Build and production:**
```bash
npm run build           # Build Next.js UI
npm run start           # Start production UI server
cd agent && npm run build  # Compile agent TypeScript
```

**Linting:**
```bash
npm run lint  # ESLint via eslint-config-next
```

## Environment Setup

**Required:**
- `agent/.env` with `OPENAI_API_KEY=...` (agent crashes without this)

**Optional:**
- Root `.env.local` for Next.js env vars
- `LANGGRAPH_DEPLOYMENT_URL` in root `.env.local` to override `http://localhost:8123`
- `LANGSMITH_API_KEY` for LangSmith tracing

**Examples available:**
- `agent/.env.example` and `agent/.env.production.example`
- Root `.env.example` and `.env.production.example`

## Key Files

**UI:**
- `src/app/page.tsx`: Main page with `CopilotSidebar`, frontend actions (`setThemeColor`, `addProverb`, `getWeather`), and shared state rendering
- `src/app/layout.tsx`: Root layout with CopilotKit provider
- `src/app/api/copilotkit/route.ts`: API route connecting to LangGraph agent

**Agent:**
- `agent/src/agent.ts`: Graph definition, agent state, tools, nodes, edges
- `agent/src/app.ts`: Hono HTTP server for health checks
- `agent/langgraph.json`: LangGraph CLI configuration
- `agent/package.json`: Independent dependencies including `@langchain/*` packages

## Adding New Features

**Frontend Action:**
1. Add `useCopilotAction()` in `src/app/page.tsx` with name, description, parameters, handler/render
2. Agent automatically receives it via `state.copilotkit.actions`

**Backend Tool:**
1. Define tool in `agent/src/agent.ts` using `tool()` from `@langchain/core/tools`
2. Add to `tools` array
3. Update `shouldContinue()` if special routing needed (default routes to `tool_node`)

**Shared State Field:**
1. Add to `AgentStateAnnotation` in `agent/src/agent.ts` using `Annotation<Type>`
2. Update `useCoAgent<AgentState>()` initial state in `src/app/page.tsx`
3. Agent can read/write via state object, UI syncs automatically

**Generative UI:**
1. Create `useCopilotAction()` with `render` function in `src/app/page.tsx`
2. Set `available: "disabled"` to prevent direct user invocation
3. Agent calls the action name as a tool to trigger UI rendering

## Testing

No automated test suite is configured. Manual testing workflow:
1. Start both services: `npm run dev`
2. Open http://localhost:3000
3. Verify agent connection in CopilotSidebar (should see initial greeting, not connection error)
4. Test frontend actions: "Set the theme to orange"
5. Test shared state: "Write a proverb about AI"
6. Test generative UI: "Get the weather in SF"
7. Verify agent logs in terminal for tool calls and state updates
8. Optional: Use `npm run dev:studio` to inspect graph execution in LangGraph Studio

## Code Style

- **TypeScript:** 2-space indentation, semicolons
- **React:** Functional components, PascalCase names, hooks at top of component
- **Tailwind:** Utility-first CSS, order: layout → spacing → color
- **File naming:** kebab-case for `src/app/` routes, camelCase for variables
- **Agent:** Named exports for nodes/tools, `z.object()` for tool schemas

## Package Management

Lock files are gitignored to support multiple package managers (pnpm, npm, yarn, bun). Each developer generates their own lock file. Use pnpm where possible (faster, more efficient). After generating a lock file, remove it from `.gitignore` if you want to commit it.

## Common Issues

**"I'm having trouble connecting to my tools":**
- Check agent is running on port 8123
- Verify `OPENAI_API_KEY` is set in `agent/.env`
- Check terminal for agent startup errors

**Agent not receiving frontend actions:**
- Ensure `CopilotKitStateAnnotation.spec` is spread into `AgentStateAnnotation`
- Verify `convertActionsToDynamicStructuredTools(state.copilotkit?.actions ?? [])` is in `modelWithTools`

**Shared state not syncing:**
- Agent must return updated fields in node return object
- UI must use `setState()` from `useCoAgent()`, not local `useState()`
- State field must be defined in `AgentStateAnnotation`

## Deployment

### Agent Deployment (Render)

The agent uses Docker for production deployments. The Dockerfile uses `langgraphjs dev` (not `langgraphjs up`) to avoid Docker-in-Docker requirements.

**Local Testing with Docker:**
```bash
cd agent
docker build -t lead-pipe-agent .
docker run \
  --env-file .env \
  -p 8123:8123 \
  -e REDIS_URI="redis://username:password@host:port" \
  -e DATABASE_URI="postgresql://username:password@host:port/database" \
  -e LANGSMITH_API_KEY="your_key" \
  lead-pipe-agent
```

**Render Deployment (Docker):**
1. Create a new Web Service on Render
2. Select "Docker" as the runtime
3. Set Dockerfile path to `agent/Dockerfile`
4. Configure environment variables:
   - `OPENAI_API_KEY` (required): OpenAI API key for GPT-4o
   - `REDIS_URI` (optional): Redis connection string for LangGraph checkpointing
   - `DATABASE_URI` (optional): PostgreSQL connection string for persistent state
   - `LANGSMITH_API_KEY` (optional): LangSmith API key for tracing
   - `PORT` (optional): Server port, defaults to 8123 (Render auto-sets this)

**Important Notes:**
- The Dockerfile uses `npm start` which runs `langgraphjs dev --port ${PORT:-8123} --host 0.0.0.0 --no-browser`
- This approach uses `langgraphjs dev` instead of `langgraphjs up` because `up` requires Docker-in-Docker
- The `dev` command provides full LangGraph server functionality without Docker dependencies
- Render's environment variables like `REDIS_URI` and `DATABASE_URI` follow Render's naming convention
- If `REDIS_URI` and `DATABASE_URI` are not provided, the agent uses in-memory storage (MemorySaver)

**Docker Compose (local testing):**
```bash
cd agent
docker-compose up
```

### UI Deployment

1. Build UI: `npm run build && npm run start`
2. Set `LANGGRAPH_DEPLOYMENT_URL` in UI environment to agent URL (e.g., `https://your-agent.onrender.com`)
