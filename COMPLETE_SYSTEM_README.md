# 🤖 AI Agent System - Complete Setup

## 🎯 What You Have Now

### Infrastructure ✅
- **PostgreSQL** - Chat history, agent runs, job results
- **Redis** - Caching and rate limiting
- **Qdrant** - Vector database for chat memory
- **Docker** - Complete containerization
- **Telegram** - Multi-bot notification system (one bot per agent)

### Features ✅
- **AI-Powered Job Search** - Resume-aware, multi-source, match scoring
- **Twitter Agent** - Generate and post tweets automatically
- **GitHub Agent** - Track trending repositories
- **Web Research Agent** - Daily tech news aggregation
- **Configurable Cron Jobs** - Customize schedule for each agent
- **Chat Memory** - Long-term context with vector embeddings
- **Auto-Summarization** - Condense long conversations

---

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# Run the install script
./install.sh

# Follow the prompts to:
# 1. Install dependencies
# 2. Configure .env.local
# 3. Start Docker services
# 4. Initialize database

# Then start the app
npm run dev
```

### Option 2: Manual Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy environment template
cp env.example .env.local

# 3. Edit .env.local with your API keys
nano .env.local

# 4. Start Docker services
docker-compose up -d

# 5. Initialize database
npm run prisma:generate
npm run prisma:migrate

# 6. Start development server
npm run dev
```

---

## 📋 Environment Configuration

### Required API Keys

```bash
# AI Services
ANTHROPIC_API_KEY="sk-ant-your-key"      # Get from console.anthropic.com
TAVILY_API_KEY="tvly-your-key"           # Get from tavily.com

# Twitter/X (for posting tweets)
X_API_KEY="your-key"
X_API_SECRET_KEY="your-secret"
X_ACCESS_TOKEN="your-token"
X_ACCESS_TOKEN_SECRET="your-secret"
```

### Telegram Configuration (4 Separate Bots)

**Create bots with [@BotFather](https://t.me/BotFather):**

1. Job Search Bot:
   ```
   /newbot
   Name: My Job Search Agent
   Username: my_job_search_bot
   ```
   → Copy token to `TELEGRAM_JOB_AGENT_BOT_TOKEN`

2. Twitter Bot:
   ```
   /newbot
   Name: My Twitter Agent
   Username: my_twitter_agent_bot
   ```
   → Copy token to `TELEGRAM_TWITTER_AGENT_BOT_TOKEN`

3. GitHub Bot:
   ```
   /newbot
   Name: My GitHub Agent
   Username: my_github_agent_bot
   ```
   → Copy token to `TELEGRAM_GITHUB_AGENT_BOT_TOKEN`

4. Web Research Bot:
   ```
   /newbot
   Name: My Web Research Agent
   Username: my_web_research_bot
   ```
   → Copy token to `TELEGRAM_WEB_AGENT_BOT_TOKEN`

**Get your Chat ID:**
- Message [@userinfobot](https://t.me/userinfobot)
- Copy the `Id` number to `TELEGRAM_CHAT_ID`

**Start each bot:**
- Find each bot in Telegram
- Click "Start" or send `/start`

### Cron Schedules (Fully Customizable)

```bash
# Format: "second minute hour day month weekday"

# Job Search Agent (default: 8 AM, 12 PM, 6 PM daily)
CRON_JOB_SEARCH="0 8,12,18 * * *"

# Twitter Agent (default: 8 AM, 2 PM, 8 PM daily)
CRON_TWITTER="0 8,14,20 * * *"

# GitHub Agent (default: 10 AM daily)
CRON_GITHUB="0 10 * * *"

# Web Research Agent (default: 7 AM daily)
CRON_WEB_RESEARCH="0 7 * * *"
```

**Customization Examples:**
```bash
# Every 2 hours
"0 */2 * * *"

# Weekdays only at 9 AM
"0 9 * * 1-5"

# Every 30 minutes during work hours
"0 */30 9-17 * * *"
```

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Next.js Application                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │   Chat   │  │  Agents  │  │   API    │  │  Cron   │ │
│  │    UI    │  │Dashboard │  │ Routes   │  │  Jobs   │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘ │
└───────┼─────────────┼─────────────┼─────────────┼──────┘
        │             │             │             │
        ▼             ▼             ▼             ▼
┌──────────────────────────────────────────────────────────┐
│                    Prisma ORM Layer                       │
└──────────────┬───────────────┬───────────────┬───────────┘
               │               │               │
        ┌──────▼──────┐ ┌─────▼──────┐ ┌─────▼──────┐
        │  PostgreSQL │ │   Redis    │ │   Qdrant   │
        │  (Chat &    │ │  (Cache)   │ │  (Vector)  │
        │  Agent Runs)│ │            │ │   (Memory) │
        └─────────────┘ └────────────┘ └────────────┘
               │               │               │
        ┌──────▼───────────────▼───────────────▼──────┐
        │         Telegram Notification System         │
        │  ┌──────┐ ┌──────┐ ┌──────┐ ┌───────────┐  │
        │  │ Job  │ │Twitter│ │GitHub│ │    Web    │  │
        │  │ Bot  │ │  Bot  │ │ Bot  │ │    Bot    │  │
        │  └──────┘ └──────┘ └──────┘ └───────────┘  │
        └──────────────────────────────────────────────┘
```

---

## 🎨 Features Breakdown

### 1. AI-Powered Job Search
- **Resume-aware matching** (80+ match score)
- **Multi-source search** (LinkedIn, Naukri, etc.)
- **PPO detection**
- **Skill analysis**
- **Direct application links**
- **Telegram notifications** for high-match jobs

### 2. Chat with Memory
- **Persistent history** in PostgreSQL
- **Vector embeddings** for semantic search
- **Auto-summarization** after 50 messages
- **Context retrieval** from past conversations

### 3. Agent Dashboard
- **Real-time status** for all agents
- **Run history** from database
- **Manual execution** ("Run Now" button)
- **Success rate tracking**
- **Notification logs**

### 4. Telegram Notifications
- **Separate bot per agent**
- **Job opportunities** (with match scores)
- **Tweet confirmations**
- **Agent run summaries**
- **Error alerts**

### 5. Cron Jobs
- **Fully configurable** via env variables
- **Per-agent schedules**
- **Automatic execution**
- **Notification on completion**

---

## 📁 Key Files

### Configuration
- `prisma/schema.prisma` - Database schema
- `docker-compose.yml` - Docker services
- `Dockerfile` - App containerization
- `.env.local` - Environment variables

### Core Libraries
- `lib/prisma.ts` - Database client & helpers
- `lib/telegram.ts` - Multi-bot notifications
- `lib/vector-db.ts` - Qdrant integration
- `lib/resume-profile.ts` - Your profile for job matching

### API Routes
- `app/api/agent/route.ts` - Main chat endpoint
- `app/api/agents/run/route.ts` - Manual agent execution
- `app/api/cron/agent-runner/route.ts` - Scheduled execution
- `app/api/tools/jobSearch.ts` - Job search tool
- `app/api/tools/twitter.ts` - Twitter tool

### UI Components
- `app/page.tsx` - Chat interface
- `app/agents/page.tsx` - Agents dashboard

---

## 🧪 Testing

### Test Database Connection
```bash
# PostgreSQL
docker exec -it agent-postgres psql -U agent_user -d agent_db -c "SELECT version();"

# Redis
docker exec -it agent-redis redis-cli ping

# Qdrant
curl http://localhost:6333/collections
```

### Test Telegram Bots
Visit: http://localhost:3000/api/test/telegram
(You'll need to create this endpoint based on `lib/telegram.ts`)

### Test Job Search
```bash
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","parts":[{"type":"text","text":"Find SDE jobs for 2026 passouts"}]}]}'
```

### View Database
```bash
npm run prisma:studio
# Opens at http://localhost:5555
```

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
# 1. Push to GitHub
git add .
git commit -m "Complete AI agent system"
git push

# 2. Deploy to Vercel
vercel --prod

# 3. Configure environment in Vercel Dashboard
#    - Add all variables from .env.local
#    - Set DATABASE_URL to hosted PostgreSQL (Vercel Postgres/Supabase)
#    - Set QDRANT_URL to Qdrant Cloud
```

### Database Hosting Options

**Option A: Vercel Postgres**
```bash
vercel postgres create agent-db
# Copy connection string
```

**Option B: Supabase**
- Create project at supabase.com
- Copy Postgres URL
- Enable pgvector extension

**Option C: Railway**
- Deploy PostgreSQL + Redis
- Copy connection strings

### Vector DB Hosting

**Qdrant Cloud:**
- Sign up at cloud.qdrant.io
- Create cluster
- Copy URL and API key

---

## 📊 Database Tables

### Conversations & Messages
- `Conversation` - Chat sessions
- `Message` - Individual messages
- `MessageEmbedding` - Vector embeddings
- `ConversationSummary` - Long-context summaries

### Agents & Runs
- `Agent` - Agent definitions
- `AgentRun` - Execution history
- `AgentNotification` - Notification logs

### Job Search
- `JobSearchResult` - Cached job listings

### Preferences
- `UserPreference` - User settings

---

## 🛠️ Useful Commands

```bash
# Docker
npm run docker:up          # Start all services
npm run docker:down        # Stop all services
npm run docker:logs        # View logs

# Database
npm run prisma:generate    # Generate Prisma client
npm run prisma:migrate     # Run migrations
npm run prisma:studio      # Open database GUI

# Development
npm run dev                # Start Next.js dev server
npm run build              # Build for production
npm run start              # Start production server
```

---

## 🔧 Troubleshooting

### Services Not Starting
```bash
# Check Docker status
docker ps

# Restart all services
docker-compose restart

# View specific service logs
docker-compose logs postgres
docker-compose logs redis
docker-compose logs qdrant
```

### Database Errors
```bash
# Reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d
npm run prisma:migrate
```

### Telegram Not Working
1. Verify bot tokens in `.env.local`
2. Ensure you clicked "Start" on each bot
3. Check chat ID is correct
4. Test with API endpoint

---

## 📚 Documentation

- **Setup Guide**: `SETUP_GUIDE.md`
- **Implementation Status**: `IMPLEMENTATION_STATUS.md`
- **Job Search Features**: `README_JOB_SEARCH.md`
- **This File**: `COMPLETE_SYSTEM_README.md`

---

## 🎉 You're All Set!

Your AI agent system is ready to:
- ✅ Find you the best SDE jobs (with Telegram alerts)
- ✅ Post tweets automatically
- ✅ Track GitHub trends
- ✅ Aggregate tech news
- ✅ Remember past conversations
- ✅ Run on custom schedules
- ✅ Send notifications to Telegram

**Start the system:**
```bash
npm run docker:up && npm run dev
```

**Visit:**
- Chat: http://localhost:3000
- Agents: http://localhost:3000/agents
- Database: http://localhost:5555 (run `npm run prisma:studio`)

**Need help?** Check the documentation files above!

Happy coding! 🚀

