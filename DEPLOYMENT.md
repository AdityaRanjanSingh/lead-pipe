# Deployment Guide

This guide provides detailed instructions for deploying the Lead Pipe application to production using Vercel (UI) and Render (Agent).

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Database Setup](#database-setup)
- [Agent Deployment](#agent-deployment)
- [UI Deployment](#ui-deployment)
- [CI/CD Setup](#cicd-setup)
- [Monitoring and Logging](#monitoring-and-logging)
- [Troubleshooting](#troubleshooting)
- [Rollback Procedures](#rollback-procedures)

## Architecture Overview

The application consists of two main components:

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│             │         │             │         │             │
│   Vercel    │────────▶│   Render    │────────▶│ PostgreSQL  │
│   (UI)      │  HTTPS  │   (Agent)   │         │ (State DB)  │
│             │         │             │         │             │
└─────────────┘         └─────────────┘         └─────────────┘
     Next.js              LangGraph Agent         Checkpoint Store
```

### Component Roles

- **UI (Next.js on Vercel)**: Serves the web interface and proxies requests to the agent
- **Agent (LangGraph on Render)**: Processes AI agent requests and manages conversation state
- **Database (PostgreSQL)**: Stores persistent agent conversation state and checkpoints

## Prerequisites

Before deploying, ensure you have:

- [ ] GitHub account with repository access
- [ ] Vercel account ([sign up](https://vercel.com/signup))
- [ ] Render account ([sign up](https://render.com/))
- [ ] OpenAI API key ([get one](https://platform.openai.com/api-keys))
- [ ] Sentry account (optional, for error tracking - [sign up](https://sentry.io/signup/))
- [ ] LangSmith account (optional, for agent tracing - [sign up](https://smith.langchain.com/))

## Database Setup

### Option 1: Render PostgreSQL

1. Log in to [Render](https://render.com/)
2. Click "New" → "PostgreSQL"
3. Choose a name and region
4. Select the free tier or paid plan
5. Click "Create Database"
6. Copy the "Internal Database URL" from the database dashboard

### Option 2: External PostgreSQL (Neon, Supabase, AWS RDS, etc.)

If using an external PostgreSQL provider:
1. Create a PostgreSQL database (version 12+)
2. Note the connection string in the format: `postgresql://user:password@host:port/database`
3. Ensure the database is accessible from your deployment platform
4. Create a database user with full permissions

## Agent Deployment

### Render Deployment

#### Step 1: Create Web Service

1. Log in to Render
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: leadpipe-agent
   - **Region**: Choose closest to your users
   - **Branch**: main
   - **Root Directory**: agent
   - **Runtime**: Docker
   - **Docker Command**: (leave empty, uses Dockerfile CMD)

#### Step 2: Configure Environment Variables

Add the following in the "Environment" tab:

```bash
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://user:pass@host:port/db
NODE_ENV=production
PORT=8123
LANGSMITH_API_KEY=
LANGCHAIN_TRACING_V2=false
SENTRY_DSN=
SENTRY_ENVIRONMENT=production
```

#### Step 3: Deploy

1. Click "Create Web Service"
2. Render will build and deploy automatically
3. Note the service URL (e.g., `https://leadpipe-agent.onrender.com`)

#### Step 4: Configure Health Checks

1. Go to "Settings" → "Health & Alerts"
2. Set health check path to `/health`
3. Enable notifications for failures

### Verify Agent Deployment

Test your agent deployment:

```bash
# Replace with your actual agent URL
curl https://your-agent-url.onrender.com/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-01-17T...",
  "version": "1.0.0",
  "uptime": 123,
  "checks": {
    "database": {
      "status": "connected",
      "latency": 45
    }
  }
}
```

## UI Deployment

### Vercel Deployment

#### Step 1: Connect Repository

1. Log in to [Vercel](https://vercel.com/)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js

#### Step 2: Configure Build Settings

Vercel should auto-detect the following (verify):
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

#### Step 3: Configure Environment Variables

Add the following environment variables in Vercel project settings:

```bash
# Required
LANGGRAPH_DEPLOYMENT_URL=https://your-agent-url.onrender.com

# Optional
LANGSMITH_API_KEY=
NODE_ENV=production
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_ENVIRONMENT=production
SENTRY_AUTH_TOKEN=
SENTRY_ORG=your-org
SENTRY_PROJECT=leadpipe-ui
```

**Important**: Make sure to set these for all environments (Production, Preview, Development).

#### Step 4: Deploy

1. Click "Deploy"
2. Vercel will build and deploy your application
3. Note the deployment URL (e.g., `https://your-app.vercel.app`)

#### Step 5: Configure Custom Domain (Optional)

1. Go to "Settings" → "Domains"
2. Add your custom domain
3. Follow DNS configuration instructions

### Verify UI Deployment

Test your UI deployment:

```bash
# Replace with your actual UI URL
curl https://your-app.vercel.app/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-01-17T...",
  "version": "0.1.0",
  "uptime": 456,
  "checks": {
    "agent": {
      "status": "connected",
      "url": "https://your-agent-url.onrender.com",
      "latency": 123
    }
  }
}
```

## CI/CD Setup

### GitHub Secrets Configuration

Add the following secrets to your GitHub repository (Settings → Secrets and variables → Actions):

#### For Render Deployment

```
RENDER_DEPLOY_HOOK_URL=<your-render-deploy-hook>
LANGGRAPH_DEPLOYMENT_URL=https://your-agent.onrender.com
```

To get your Render deploy hook:
1. Go to your Render service
2. Settings → Deploy Hook
3. Copy the URL

#### For Vercel Deployment

```
VERCEL_TOKEN=<your-vercel-token>
VERCEL_ORG_ID=<your-org-id>
VERCEL_PROJECT_ID=<your-project-id>
VERCEL_URL=your-app.vercel.app
```

To get Vercel credentials:
```bash
# Install Vercel CLI
npm install -g vercel

# Login and link project
vercel login
cd /path/to/project
vercel link

# Get org and project IDs from .vercel/project.json
cat .vercel/project.json

# Create token at: https://vercel.com/account/tokens
```

#### Optional Secrets

```
LANGSMITH_API_KEY=<your-langsmith-key>
NEXT_PUBLIC_SENTRY_DSN=<your-sentry-dsn>
SENTRY_AUTH_TOKEN=<your-sentry-token>
DOCKER_USERNAME=<dockerhub-username>
DOCKER_PASSWORD=<dockerhub-password>
SLACK_WEBHOOK_URL=<slack-webhook>
```

### GitHub Variables Configuration

No repository variables are needed for Render deployment. All configuration is handled through secrets.

### Workflow Configuration

The repository includes two GitHub Actions workflows:

1. **`.github/workflows/deploy.yml`**: Automated deployment on push to main
2. **`.github/workflows/smoke.yml`**: Continuous testing and smoke tests

#### Enabling Auto-Deployment

By default, deployments require manual approval. To enable automatic deployment:

1. Go to your repository's Actions settings
2. Under "Deployment branches", add `main` as an allowed branch
3. Deployments will now trigger automatically on push to main

#### Manual Deployment Trigger

To manually trigger a deployment:

1. Go to "Actions" tab in your repository
2. Select "Deploy to Production" workflow
3. Click "Run workflow"
4. Select the branch and confirm

## Monitoring and Logging

### Health Check Monitoring

Set up automated health checks using a monitoring service:

**Option 1: UptimeRobot (Free)**

1. Sign up at [UptimeRobot](https://uptimerobot.com/)
2. Add monitors for:
   - `https://your-app.vercel.app/api/health` (UI)
   - `https://your-agent.onrender.com/health` (Agent)
3. Configure alert settings

**Option 2: Better Uptime**

1. Sign up at [Better Uptime](https://betteruptime.com/)
2. Create monitors with 1-minute intervals
3. Set up incident escalation

### Application Logs

**Vercel Logs:**
```bash
# Install Vercel CLI
npm install -g vercel

# View logs
vercel logs [deployment-url]

# Real-time logs
vercel logs --follow
```

**Render Logs:**
- Available in the Render dashboard under "Logs" tab
- Can be filtered by severity and time range

### Error Tracking with Sentry

If you configured Sentry:

1. Go to your Sentry dashboard
2. View errors by project (UI and Agent are separate)
3. Set up alert rules for critical errors
4. Configure Slack/email notifications

### Agent Tracing with LangSmith

If you configured LangSmith:

1. Go to [LangSmith](https://smith.langchain.com/)
2. Select your project
3. View traces for agent executions
4. Analyze performance and costs
5. Debug failed agent runs

## Troubleshooting

### Common Issues

#### 1. Agent Not Connecting to Database

**Symptoms:**
- Agent logs show "PostgreSQL connection failed"
- Health check returns database status: "disconnected"

**Solutions:**
```bash
# Verify DATABASE_URL format
echo $DATABASE_URL
# Should be: postgresql://user:pass@host:port/db

# Test connection manually
psql $DATABASE_URL -c "SELECT NOW();"

# Check if database accepts connections from deployment IP
# Railway/Render IPs may need to be allowlisted
```

#### 2. UI Cannot Reach Agent

**Symptoms:**
- UI health check shows agent status: "disconnected"
- Browser console shows CORS errors

**Solutions:**
```bash
# Verify LANGGRAPH_DEPLOYMENT_URL is correct
# It should be the PUBLIC URL of your agent

# Test agent from UI's perspective
curl https://your-agent.onrender.com/health

# Ensure agent is publicly accessible in Render settings
# Render: Check if service is private or public
```

#### 3. Build Failures

**Symptoms:**
- GitHub Actions workflow fails
- Vercel build fails
- Docker build fails

**Solutions:**

For Next.js build failures:
```bash
# Clear Vercel build cache
vercel --prod --force

# Check for TypeScript errors locally
npm run build

# Verify environment variables are set in Vercel
```

For Docker build failures:
```bash
# Test Docker build locally
cd agent
docker build -t test .

# Check Dockerfile for syntax errors
# Verify all dependencies are in package.json
```

#### 4. High Memory Usage

**Symptoms:**
- Services crashing with OOM (Out of Memory)
- Slow response times

**Solutions:**

For Agent (LangGraph):
```bash
# Reduce connection pool size in production
DB_POOL_MAX=10
DB_POOL_MIN=2

# Check for memory leaks in LangGraph nodes
# Monitor in Render dashboard logs
```

For UI (Next.js):
```bash
# Enable Next.js production mode
NODE_ENV=production

# Reduce memory usage in vercel.json
"functions": {
  "src/app/api/**/*.ts": {
    "memory": 1024
  }
}
```

### Performance Optimization

#### 1. Database Connection Pooling

Update agent database configuration:

```typescript
// agent/src/agent.ts
const pool = new Pool({
  connectionString: databaseUrl,
  max: 20,        // Maximum connections
  min: 2,         // Minimum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

#### 2. Caching Strategy

Add response caching in Next.js:

```typescript
// src/app/api/copilotkit/route.ts
export const runtime = 'edge'; // Use Edge runtime for faster cold starts
export const maxDuration = 60;
```

#### 3. Agent Response Time

Monitor and optimize LangGraph agent:

```typescript
// Use faster models for simple tasks
const model = new ChatOpenAI({
  temperature: 0,
  model: "gpt-4o-mini" // Faster, cheaper
});
```

## Rollback Procedures

### Render Rollback

Via Dashboard only:
1. Go to Render service
2. Click "Events" tab
3. Find previous successful deploy
4. Click "Rollback to this deploy"

### Vercel Rollback

```bash
# View deployments
vercel ls

# Promote previous deployment to production
vercel promote <deployment-url>
```

Via Dashboard:
1. Go to Vercel project
2. Click "Deployments" tab
3. Find previous working deployment
4. Click "•••" → "Promote to Production"

### Database Rollback

**Warning:** Database changes are harder to rollback. Always backup before major migrations.

```bash
# Backup before changes
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup if needed
psql $DATABASE_URL < backup_20250117_120000.sql
```

## Security Best Practices

### 1. Environment Variables

- Never commit `.env` files
- Rotate API keys regularly (every 90 days)
- Use different keys for development and production
- Audit access to secrets regularly

### 2. Network Security

- Enable HTTPS only (no HTTP)
- Use Render private networking where possible
- Restrict database access to deployment IPs only
- Enable Vercel's DDoS protection

### 3. Monitoring

- Set up alerts for failed health checks
- Monitor error rates in Sentry
- Track API usage and costs
- Review logs for suspicious activity

## Cost Optimization

### Estimated Monthly Costs

**Free Tier Usage:**
- Vercel: Free (hobby plan)
- Render: Free (with limitations on PostgreSQL + Agent)
- Total: Free (with usage limits)

**Production Usage:**
- Vercel Pro: $20/month
- Render: ~$15-30/month (depending on usage)
- OpenAI API: Variable (depends on usage)
- Total: ~$35-50/month

### Cost Saving Tips

1. **Use GPT-4O-mini** for simple tasks (10x cheaper than GPT-4)
2. **Implement request caching** to reduce API calls
3. **Monitor LangSmith** to track token usage
4. **Use Render's free tier** for development and testing
5. **Enable Vercel's edge caching** to reduce compute time

## Maintenance Checklist

### Weekly
- [ ] Check error rates in Sentry
- [ ] Review application logs
- [ ] Monitor API costs
- [ ] Verify health checks are passing

### Monthly
- [ ] Update dependencies (`npm update`)
- [ ] Review and rotate API keys if needed
- [ ] Analyze performance metrics
- [ ] Check database size and cleanup old data
- [ ] Review and optimize LangSmith traces

### Quarterly
- [ ] Security audit of dependencies
- [ ] Performance load testing
- [ ] Cost optimization review
- [ ] Backup and disaster recovery test

## Support and Resources

- **CopilotKit Discord**: [discord.gg/copilotkit](https://discord.gg/copilotkit)
- **LangChain Discord**: [discord.gg/langchain](https://discord.gg/langchain)
- **Render Community**: [community.render.com](https://community.render.com)
- **Vercel Support**: [vercel.com/support](https://vercel.com/support)

## Appendix

### Environment Variable Reference

#### UI (.env)
```bash
# Required
LANGGRAPH_DEPLOYMENT_URL=https://agent.onrender.com

# Optional
LANGSMITH_API_KEY=
NODE_ENV=production
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_ENVIRONMENT=production
```

#### Agent (agent/.env)
```bash
# Required
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://user:pass@host:port/db

# Optional
NODE_ENV=production
PORT=8123
LANGSMITH_API_KEY=
LANGCHAIN_TRACING_V2=false
SENTRY_DSN=
SENTRY_ENVIRONMENT=production
DB_POOL_MAX=20
DB_POOL_MIN=2
```

### Useful Commands

```bash
# Check deployment status
vercel ls

# View logs
vercel logs --follow
# Render logs: Available in Render dashboard under "Logs" tab

# Run database migrations
psql $DATABASE_URL -f migrations/001_init.sql

# Test endpoints
curl -X GET https://your-app.vercel.app/api/health
curl -X GET https://your-agent.onrender.com/health

# Monitor resource usage
# Available in Render dashboard under "Metrics" tab
```

---

**Last Updated**: 2025-01-17
**Version**: 1.0.0
