# LinkedIn Agent Setup Guide

## ✅ Agent is Working!

Your LinkedIn agent is successfully implemented and working! Here's what it does:

### Features
1. **LinkedIn Tool**: Searches LinkedIn for HR posts and job opportunities
2. **Web Search Fallback**: Automatically searches the web if LinkedIn is unavailable
3. **Smart Job Filtering**: Finds positions for 2026 passouts, internships, and SDE roles

## How to Set Up LinkedIn Cookie

The LinkedIn tool requires authentication via cookie. Follow these steps:

### Step 1: Get Your LinkedIn Cookie
1. Log into LinkedIn in your browser
2. Open Developer Tools (Press F12)
3. Go to the **Application** tab (Chrome) or **Storage** tab (Firefox)
4. Navigate to **Cookies** > **https://www.linkedin.com**
5. Find the cookie named **`li_at`**
6. Copy the **Value** of this cookie

### Step 2: Add Cookie to Environment Variables
Open your `.env.local` file and add:

```bash
LINKEDIN_COOKIE="your_li_at_cookie_value_here"
```

### Step 3: Restart the Server
```bash
npm run dev
```

## Testing the Agent

### Method 1: Using the Test Script
```bash
./test-agent.sh
```

### Method 2: Using curl
```bash
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "parts": [
          {
            "type": "text",
            "text": "Check LinkedIn for HR posts hiring 2026 passouts"
          }
        ]
      }
    ]
  }' \
  --no-buffer
```

### Method 3: Using the Frontend
Open http://localhost:3000 in your browser and type:
- "Check LinkedIn for HR posts hiring 2026 passouts"
- "Find SDE openings for 2026 graduates"
- "Search for internship opportunities"

## What the Agent Can Do

1. **LinkedIn Analysis** (with cookie):
   - Search for HR hiring posts
   - Find SDE openings
   - Identify 2026 passout opportunities
   - Get real-time job postings

2. **Web Search** (always available):
   - Find current job openings
   - Get company hiring news
   - Discover internship opportunities
   - Track placement drives

## Example Queries

Try these queries with your agent:
- "Check LinkedIn for HR posts hiring 2026 passouts"
- "Find SDE openings for 2026 graduates"
- "Search for internship opportunities for 2026 batch"
- "What companies are hiring 2026 passouts?"

## Technical Details

### Tools Available
- **linkedin**: Analyzes LinkedIn feed for job posts
- **websearch**: Searches the web using Tavily API
- **github**: Checks GitHub repositories (bonus tool)

### API Endpoint
- **POST** `/api/agent`
- **Body**: `{ messages: UIMessage[] }`
- **Response**: Server-Sent Events stream

## Next Steps

1. Add your `LINKEDIN_COOKIE` to `.env.local`
2. Restart the development server
3. Test the agent with LinkedIn queries
4. The agent will automatically use real LinkedIn data!

## Important Notes

- ⚠️ LinkedIn cookies expire - you may need to refresh them periodically
- ✅ The web search tool works immediately without additional setup
- 🔄 The agent automatically falls back to web search if LinkedIn fails
- 🎯 All queries about jobs, hiring, and opportunities are automatically routed to the appropriate tool

---

**Status**: ✅ Fully Functional
**Last Updated**: October 25, 2025

