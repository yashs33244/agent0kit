# 🚀 Complete Setup Guide - AI Agent System with Database

## Overview

This guide will help you set up the complete AI agent system with:
- ✅ PostgreSQL database for chat history and agent runs
- ✅ Redis for caching and rate limiting
- ✅ Qdrant vector database for chat memory
- ✅ Telegram notifications (separate bots for each agent)
- ✅ Configurable cron job schedules
- ✅ Docker containerization

---

## Prerequisites

- Docker & Docker Compose installed
- Node.js 20+ (if running without Docker)
- Telegram account (for notifications)
- API keys (Anthropic, Tavily, Twitter, etc.)

---

## Quick Start (Docker - Recommended)

### Step 1: Clone and Setup Environment

```bash
cd /Users/tanishqsingh/Desktop/MY_DEV/agent0kit/agent-test

# Copy environment template
cp env.example .env.local

# Edit .env.local with your credentials
nano .env.local
```

### Step 2: Configure Environment Variables

```bash
# Database (auto-configured by Docker)
DATABASE_URL="postgresql://agent_user:agent_password@localhost:5432/agent_db"
POSTGRES_USER=agent_user
POSTGRES_PASSWORD=agent_password
POSTGRES_DB=agent_db

# AI APIs
ANTHROPIC_API_KEY="sk-ant-your-key"
TAVILY_API_KEY="tvly-your-key"

# Twitter
X_API_KEY="your-api-key"
X_API_SECRET_KEY="your-api-secret"
X_ACCESS_TOKEN="your-access-token"
X_ACCESS_TOKEN_SECRET="your-access-secret"

# Telegram Bots (GET THESE FROM @BotFather)
TELEGRAM_JOB_AGENT_BOT_TOKEN="bot123456:ABC-DEF..."
TELEGRAM_TWITTER_AGENT_BOT_TOKEN="bot789012:GHI-JKL..."
TELEGRAM_GITHUB_AGENT_BOT_TOKEN="bot345678:MNO-PQR..."
TELEGRAM_WEB_AGENT_BOT_TOKEN="bot901234:STU-VWX..."

# Your Telegram Chat ID (GET THIS FROM @userinfobot)
TELEGRAM_CHAT_ID="123456789"

# Cron Schedules (CUSTOMIZE AS NEEDED)
CRON_JOB_SEARCH="0 8,12,18 * * *"     # 8 AM, 12 PM, 6 PM
CRON_TWITTER="0 8,14,20 * * *"         # 8 AM, 2 PM, 8 PM
CRON_GITHUB="0 10 * * *"               # 10 AM daily
CRON_WEB_RESEARCH="0 7 * * *"          # 7 AM daily
```

### Step 3: Start All Services

```bash
# Start PostgreSQL, Redis, Qdrant, and the app
npm run docker:up

# Check logs
npm run docker:logs

# The app will be available at:
# - App: http://localhost:3000
# - PostgreSQL: localhost:5432
# - Redis: localhost:6379
# - Qdrant: http://localhost:6333
```

### Step 4: Initialize Database

```bash
# Run migrations (first time only)
npm run prisma:migrate

# Generate Prisma client
npm run prisma:generate

# Open Prisma Studio (database GUI)
npm run prisma:studio
```

---

## Setting Up Telegram Bots

### 1. Create Telegram Bots

Open Telegram and chat with [@BotFather](https://t.me/BotFather):

```
You: /newbot
BotFather: Alright, a new bot. How are we going to call it?

You: Job Search Agent
BotFather: Good. Now let's choose a username for your bot.

You: my_job_search_bot
BotFather: Done! Keep your token secure...
123456789:ABCdefGHIjklMNOpqrSTUvwxYZ12345678
```

**Repeat for each agent:**
- Job Search Agent → `TELEGRAM_JOB_AGENT_BOT_TOKEN`
- Twitter Agent → `TELEGRAM_TWITTER_AGENT_BOT_TOKEN`
- GitHub Agent → `TELEGRAM_GITHUB_AGENT_BOT_TOKEN`
- Web Research Agent → `TELEGRAM_WEB_AGENT_BOT_TOKEN`

### 2. Get Your Chat ID

1. Chat with [@userinfobot](https://t.me/userinfobot)
2. It will reply with your `Id: 123456789`
3. Copy this to `TELEGRAM_CHAT_ID`

### 3. Start Each Bot

For each bot you created:
1. Find it in Telegram search
2. Click **"Start"** or send `/start`
3. The bot is now ready to send you notifications!

---

## Cron Job Schedule Format

The cron format is: `second minute hour day month weekday`

### Examples:

```bash
# Every day at specific times
"0 8 * * *"           # 8 AM daily
"0 8,12,18 * * *"     # 8 AM, 12 PM, 6 PM daily
"0 */2 * * *"         # Every 2 hours
"0 9 * * 1-5"         # 9 AM on weekdays only
"0 0 * * 0"           # Midnight every Sunday

# More complex
"30 8 * * 1,3,5"      # 8:30 AM on Mon, Wed, Fri
"0 */3 9-17 * * *"    # Every 3 hours from 9 AM to 5 PM
```

### Customize in .env.local:

```bash
# Run job search 3x daily
CRON_JOB_SEARCH="0 8,12,18 * * *"

# Tweet every 4 hours during work hours
CRON_TWITTER="0 8,12,16 * * *"

# GitHub check twice daily
CRON_GITHUB="0 9,21 * * *"

# Web research every morning
CRON_WEB_RESEARCH="0 7 * * *"
```

---

## Database Schema

The system uses the following tables:

### Core Tables:
- **Conversation** - Chat sessions
- **Message** - Individual chat messages
- **MessageEmbedding** - Vector embeddings for memory
- **ConversationSummary** - Long-context summaries

### Agent Tables:
- **Agent** - Agent definitions and config
- **AgentRun** - Historical agent execution logs
- **AgentNotification** - Notification delivery status

### Job Search:
- **JobSearchResult** - Cached job listings with match scores
- **UserPreference** - User notification and cron preferences

---

## Testing

### Test Database Connection:

```bash
# Check PostgreSQL
docker exec -it agent-postgres psql -U agent_user -d agent_db -c "SELECT version();"

# Check Redis
docker exec -it agent-redis redis-cli ping
# Should return: PONG

# Check Qdrant
curl http://localhost:6333/collections
```

### Test Telegram Bots:

Visit: http://localhost:3000/api/test/telegram

This will test all configured bots and show their status.

### Test Agent Run:

```bash
# Manual test
curl -X POST http://localhost:3000/api/agents/run \
  -H "Content-Type: application/json" \
  -d '{"agentId":"ai-job-search"}'
```

---

## Viewing Data

### Prisma Studio (Database GUI):

```bash
npm run prisma:studio
# Opens at http://localhost:5555
```

### Qdrant Dashboard:

Open http://localhost:6333/dashboard

### View Logs:

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f postgres
docker-compose logs -f qdrant
```

---

## Production Deployment

### 1. Vercel Deployment:

```bash
# Push to GitHub
git add .
git commit -m "Complete agent system with DB"
git push

# Deploy to Vercel
vercel --prod

# Set environment variables in Vercel Dashboard
# (Copy from .env.local)
```

### 2. Database Hosting:

**Option A: Vercel Postgres**
```bash
vercel postgres create agent-db
# Copy connection string to DATABASE_URL
```

**Option B: Supabase**
- Create project at supabase.com
- Copy Postgres connection string
- Enable pgvector extension

**Option C: Railway**
- Deploy PostgreSQL + Redis on Railway
- Copy connection strings

### 3. Vector DB Hosting:

**Qdrant Cloud:**
```bash
# Sign up at cloud.qdrant.io
# Create cluster
# Copy QDRANT_URL and QDRANT_API_KEY
```

---

## Troubleshooting

### Database Connection Issues:

```bash
# Check if Postgres is running
docker ps | grep postgres

# Restart services
docker-compose restart

# Check logs
docker-compose logs postgres
```

### Telegram Not Working:

1. Verify bot tokens in `.env.local`
2. Ensure you clicked "Start" on each bot
3. Check chat ID is correct
4. Test with: `/api/test/telegram`

### Vector DB Issues:

```bash
# Check Qdrant health
curl http://localhost:6333/health

# Recreate collection
curl -X DELETE http://localhost:6333/collections/chat_messages
# Restart app to recreate
```

### Agent Not Running:

```bash
# Check cron config
cat .env.local | grep CRON

# Check agent status in database
npm run prisma:studio
# Navigate to Agent table
```

---

## Stopping Services

```bash
# Stop all containers
npm run docker:down

# Stop and remove volumes (WARNING: deletes all data)
docker-compose down -v
```

---

## Development Workflow

### Local Development (without Docker):

```bash
# Install dependencies
npm install

# Start PostgreSQL, Redis, Qdrant via Docker
docker-compose up -d postgres redis qdrant

# Run migrations
npm run prisma:migrate

# Start Next.js dev server
npm run dev
```

### Making Database Changes:

```bash
# 1. Edit prisma/schema.prisma
nano prisma/schema.prisma

# 2. Create migration
npm run prisma:migrate

# 3. Generate Prisma client
npm run prisma:generate

# 4. Restart app
```

---

## Next Steps

1. ✅ Complete `.env.local` configuration
2. ✅ Set up Telegram bots
3. ✅ Start Docker services: `npm run docker:up`
4. ✅ Run migrations: `npm run prisma:migrate`
5. ✅ Test agents at http://localhost:3000/agents
6. ✅ Check chat interface at http://localhost:3000
7. ✅ Monitor with Prisma Studio: `npm run prisma:studio`

**Your AI agent system is now fully operational! 🎉**

