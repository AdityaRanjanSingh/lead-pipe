# Dockerfile for LangGraph Agent
# Uses langgraph build to create production-ready image

FROM node:20-alpine AS base

WORKDIR /app

# Copy package files and langgraph configuration
COPY package*.json ./
COPY tsconfig.json ./
COPY langgraph.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src

# Build TypeScript to JavaScript
RUN npm run build

# Install LangGraph CLI globally
RUN npm install -g @langchain/langgraph-cli

# Expose the port
EXPOSE 8123

# Set NODE_ENV to production
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8123/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))" || exit 1

# Start the LangGraph server using the dev command (doesn't require Docker)
# Environment variables (REDIS_URI, DATABASE_URI, LANGSMITH_API_KEY, etc.)
# should be passed at runtime via docker run -e or --env-file
# The start script uses langgraphjs dev which works without Docker-in-Docker
CMD ["npm", "start"]
