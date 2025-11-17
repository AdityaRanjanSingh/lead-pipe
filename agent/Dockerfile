# Multi-stage build for LangGraph Agent
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Development dependencies for build
FROM base AS dev-deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Production image
FROM base AS runner
WORKDIR /app

# Set to production environment
ENV NODE_ENV=production
ENV PORT=8123

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 langraph

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY --chown=langraph:nodejs . .

# Create directories for LangGraph runtime
RUN mkdir -p .langgraph_api && chown -R langraph:nodejs .langgraph_api

# Switch to non-root user
USER langraph

# Expose the agent port
EXPOSE 8123

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8123/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the LangGraph agent
CMD ["npx", "@langchain/langgraph-cli", "dev", "--port", "8123", "--host", "0.0.0.0"]
