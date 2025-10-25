# 🤖 Agent0Kit - Complete Guide

## Table of Contents
1. [Overview](#overview)
2. [LinkedIn Agent](#linkedin-agent)
3. [Twitter Agent](#twitter-agent)
4. [Agents Dashboard](#agents-dashboard)
5. [Cron Jobs](#cron-jobs)
6. [Notifications](#notifications)
7. [Setup Instructions](#setup-instructions)

---

## Overview

Agent0Kit is a comprehensive AI-powered automation platform featuring:
- **LinkedIn Job Hunter**: Automatically scrapes LinkedIn for job opportunities
- **Twitter Tech Poster**: Generates and posts tweets about tech, coding, and DevOps
- **Agents Dashboard**: Beautiful UI to manage and monitor all agents
- **Cron Jobs**: Automated execution on schedules
- **Notifications**: Slack and WhatsApp integration (coming soon)

---

## LinkedIn Agent

### Features
✅ **Stealth Mode**: Uses `puppeteer-extra-plugin-stealth` to avoid bot detection
✅ **Smart Scraping**: Extracts posts with engagement metrics
✅ **Keyword Matching**: Intelligently scores posts based on relevance
✅ **Company Tracking**: Identifies hiring companies
✅ **Hashtag Analysis**: Tracks trending job-related hashtags
✅ **Engagement Metrics**: Analyzes likes, comments, and engagement levels

### Setup

1. **Get Your LinkedIn Cookie**:
   ```bash
   # 1. Log into LinkedIn
   # 2. Open DevTools (F12)
   # 3. Application > Cookies > https://www.linkedin.com
   # 4. Find "li_at" cookie
   # 5. Copy the value
   ```

2. **Add to Environment Variables**:
   ```bash
   # .env.local
   LINKEDIN_COOKIE="your_li_at_cookie_value"
   ```

3. **Test the Agent**:
   ```bash
   curl -X POST http://localhost:3000/api/agent \
     -H "Content-Type: application/json" \
     -d '{
       "messages": [{
         "role": "user",
         "parts": [{"type": "text", "text": "Search LinkedIn for 2026 passout jobs"}]
       }]
     }'
   ```

### How It Works

1. **Browser Initialization**: Launches Chromium with stealth mode
2. **Authentication**: Sets LinkedIn cookies for authenticated access
3. **Intelligent Scrolling**: Gradually scrolls to load more posts
4. **Data Extraction**: Scrapes posts with all metadata
5. **Relevance Scoring**: Ranks posts based on keywords and engagement
6. **Insights Generation**: Provides actionable recommendations

### Anti-Detection Features

- ✅ Puppeteer Extra with Stealth Plugin
- ✅ Random delays between actions
- ✅ Realistic mouse movements
- ✅ Browser fingerprint masking
- ✅ Multiple cookie support
- ✅ Retry logic with exponential backoff

---

## Twitter Agent

### Features
✅ **AI-Generated Tweets**: Smart content about tech, coding, DevOps
✅ **Engagement Optimization**: Predicts engagement score
✅ **Smart Hashtags**: Automatically selects relevant hashtags
✅ **Optimal Timing**: Recommends best times to post
✅ **Category-Based**: Tech trends, coding tips, DevOps insights, career advice

### Setup

1. **Twitter API Credentials** (Optional for now):
   ```bash
   # .env.local
   TWITTER_API_KEY="your_api_key"
   TWITTER_API_SECRET="your_api_secret"
   TWITTER_ACCESS_TOKEN="your_access_token"
   TWITTER_ACCESS_SECRET="your_access_secret"
   ```

2. **Generate a Tweet**:
   ```javascript
   // Via chat or API
   "Generate a tweet about the latest tech trends"
   "Post a coding tip tweet"
   "Schedule a DevOps insight for optimal time"
   ```

### Tweet Categories

1. **Tech** 🚀
   - Latest trends in 2025
   - New frameworks and tools
   - Industry insights

2. **Coding** 💻
   - Code tips and best practices
   - Programming tricks
   - Clean code principles

3. **DevOps** 🔧
   - CI/CD best practices
   - Container wisdom
   - Security tips

4. **Career** 📈
   - Job search advice
   - Interview tips
   - Career growth strategies

### Content Strategy

- **Morning (8-10 AM)**: Tech news and trends
- **Afternoon (2 PM)**: Coding tips and tutorials
- **Evening (8 PM)**: Career advice and motivation

---

## Agents Dashboard

### Features
✅ **Beautiful UI**: Modern, responsive dashboard
✅ **Real-time Status**: Monitor agent health and status
✅ **Manual Control**: Start/stop agents on demand
✅ **Performance Metrics**: Success rates and run history
✅ **Schedule Management**: View next run times
✅ **Notification Toggle**: Enable/disable alerts

### Access

Navigate to: `http://localhost:3000/agents`

### Agent Card Information

Each agent shows:
- **Status**: Active, Paused, Running, Error
- **Schedule**: Cron expression in human-readable format
- **Last Run**: Timestamp of last execution
- **Next Run**: Countdown to next scheduled run
- **Success Rate**: Percentage of successful runs
- **Total Runs**: Historical execution count

### Actions

- **Play/Pause**: Activate or pause an agent
- **Run Now**: Manually trigger execution
- **Settings**: Configure agent parameters (coming soon)

---

## Cron Jobs

### Vercel Cron Setup

The system uses Vercel Cron Jobs for automated execution:

```json
{
  "crons": [{
    "path": "/api/cron/agent-runner",
    "schedule": "0 9,17 * * *"  // 9 AM and 5 PM daily
  }]
}
```

### Schedule Patterns

- **9 AM, 5 PM Daily**: `0 9,17 * * *` (LinkedIn Job Hunter)
- **8 AM, 2 PM, 8 PM**: `0 8,14,20 * * *` (Twitter Poster)
- **10 AM Daily**: `0 10 * * *` (GitHub Trending)
- **7 AM Daily**: `0 7 * * *` (News Aggregator)

### Manual Triggering

```bash
# GET request (same as cron)
curl http://localhost:3000/api/cron/agent-runner

# POST request with custom tasks
curl -X POST http://localhost:3000/api/cron/agent-runner \
  -H "Content-Type: application/json" \
  -d '{
    "tasks": [{
      "id": "custom-linkedin",
      "type": "linkedin",
      "prompt": "Search for remote SDE jobs for 2026 passouts",
      "notifyOn": "success"
    }]
  }'
```

### Security

Add a cron secret for security:

```bash
# .env.local
CRON_SECRET="your_secret_token"

# Then call with:
curl -H "Authorization: Bearer your_secret_token" \
  http://localhost:3000/api/cron/agent-runner
```

---

## Notifications

### Slack Integration

1. **Create Slack Webhook**:
   - Go to https://api.slack.com/messaging/webhooks
   - Create new webhook
   - Copy webhook URL

2. **Add to Environment**:
   ```bash
   SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
   ```

3. **Notification Format**:
   ```
   ✅ Agent linkedin-job-hunter - Success
   
   Type: linkedin
   Time: 2025-01-15 09:00:00
   Result: Found 15 relevant job posts...
   ```

### WhatsApp Integration

1. **Setup WhatsApp Business API**:
   - Sign up at https://business.whatsapp.com
   - Get API credentials
   - Configure webhook

2. **Add to Environment**:
   ```bash
   WHATSAPP_API_KEY="your_api_key"
   WHATSAPP_PHONE_NUMBER="+1234567890"
   ```

3. **Notification Format**:
   ```
   ✅ Agent linkedin-job-hunter
   Status: Success
   Time: 09:00 AM
   Found 15 job opportunities...
   ```

### Email Notifications (SendGrid)

```bash
SENDGRID_API_KEY="your_sendgrid_api_key"
NOTIFICATION_EMAIL="your@email.com"
```

---

## Setup Instructions

### 1. Install Dependencies

```bash
npm install puppeteer-extra puppeteer-extra-plugin-stealth lucide-react
```

### 2. Environment Variables

Create `.env.local`:

```bash
# Required
ANTHROPIC_API_KEY="your_anthropic_key"
TAVILY_API_KEY="your_tavily_key"

# LinkedIn Agent
LINKEDIN_COOKIE="your_li_at_cookie"

# Twitter Agent (Optional)
TWITTER_API_KEY="your_key"
TWITTER_API_SECRET="your_secret"
TWITTER_ACCESS_TOKEN="your_token"
TWITTER_ACCESS_SECRET="your_secret"

# Notifications (Optional)
SLACK_WEBHOOK_URL="your_webhook"
WHATSAPP_API_KEY="your_key"
SENDGRID_API_KEY="your_key"

# Cron Security (Optional)
CRON_SECRET="your_secret_token"
```

### 3. Run Development Server

```bash
npm run dev
```

### 4. Access the Application

- **Chat Interface**: http://localhost:3000
- **Agents Dashboard**: http://localhost:3000/agents
- **Cron Endpoint**: http://localhost:3000/api/cron/agent-runner

### 5. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
# Vercel will automatically set up cron jobs from vercel.json
```

---

## Troubleshooting

### LinkedIn Agent Issues

**Error**: `net::ERR_TOO_MANY_REDIRECTS`
- **Solution**: Cookie expired, get a fresh LinkedIn cookie

**Error**: `Timeout waiting for selector`
- **Solution**: LinkedIn changed their DOM structure, update selectors

### Twitter Agent Issues

**Error**: `Twitter API credentials not configured`
- **Solution**: Add Twitter API keys to `.env.local` or use generate-only mode

### Cron Jobs Not Running

**Issue**: Cron jobs not triggering on Vercel
- **Solution**: Ensure `vercel.json` is in root directory
- **Solution**: Check Vercel dashboard > Project > Cron Jobs

### Notification Failures

**Issue**: Notifications not sending
- **Solution**: Verify webhook URLs and API keys
- **Solution**: Check agent configuration `notifyOn` setting

---

## Best Practices

1. **LinkedIn Cookie**: Refresh every 30 days
2. **Rate Limiting**: Don't run LinkedIn agent more than 4x per day
3. **Tweet Timing**: Post during peak engagement hours
4. **Monitoring**: Check agents dashboard regularly
5. **Notifications**: Use `success` for important agents, `failure` for all

---

## Roadmap

- [ ] Add more social media platforms (Reddit, HackerNews)
- [ ] Email digest feature
- [ ] Advanced filtering and search
- [ ] Machine learning-based recommendation system
- [ ] Mobile app for notifications
- [ ] Calendar integration for interview scheduling

---

## Support

For issues or questions:
- Check the [Troubleshooting](#troubleshooting) section
- Review environment variables setup
- Test agents individually before running cron jobs

---

**Built with ❤️ using Next.js, AI SDK 6 Beta, Puppeteer, and Anthropic Claude**

