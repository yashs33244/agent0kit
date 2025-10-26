# 🎯 AI-Powered Job Search System

## Overview

Your personalized AI job search assistant that uses **Claude AI** to find the best SDE roles for you (Yash Singh - 2026 passout). This system analyzes your resume, matches jobs based on your skills, and provides actionable insights with proper citations.

---

## 🚀 What Changed

### ❌ Removed: LinkedIn Tool
- **Old**: Generic LinkedIn scraper that just found posts
- **Why Removed**: Didn't analyze job fit, no resume matching, basic keyword search

### ✅ New: AI-Powered Job Search Tool
- **Resume-aware**: Knows your entire profile, skills, and preferences
- **Smart Matching**: 0-100 match score for every job
- **Multi-source**: Searches LinkedIn, Naukri, Instahyre, and more
- **PPO Detection**: Automatically identifies PPO opportunities
- **Skill Analysis**: Shows which of YOUR skills match each job
- **Citations**: Direct links to every job posting

---

## 📋 Your Profile (Auto-Loaded)

The system automatically uses your resume stored in `/lib/resume-profile.ts`:

```typescript
{
  name: "Yash Singh",
  education: "B.Tech CSE, IIIT Una (GPA: 8.3, graduating 2026)",
  experience: [
    "SDE Intern at Binocs (Python, FastAPI, AWS, Docker)",
    "SWE Intern at ViewR (React, Kubernetes, AWS)",
    "Research Assistant at IIT Mandi (ML, NLP, GNN)"
  ],
  skills: {
    languages: ["Python", "JavaScript", "TypeScript", "C++"],
    frameworks: ["React", "Next.js", "Node.js", "FastAPI"],
    devops: ["Docker", "Kubernetes", "AWS", "CI/CD"],
    ml: ["TensorFlow", "PyTorch", "NLP", "GNN"]
  },
  preferences: {
    targetRoles: ["SDE", "SDE Intern", "Backend Engineer", "Full Stack Engineer"],
    minStipend: 50000, // ₹50k/month
    mustHave: ["2026 passout", "PPO", "full-time opportunity"]
  }
}
```

---

## 🎯 How It Works

### 1. **Job Discovery**
```
Searches multiple platforms:
├── LinkedIn Jobs (premium listings)
├── Naukri.com (Indian market)
├── Instahyre (tech startups)
└── Wellfound (startup jobs)
```

### 2. **AI Analysis**
For each job, Claude analyzes:
- ✅ Match with YOUR specific skills
- ✅ Graduation year requirement (2026)
- ✅ PPO opportunity mention
- ✅ Compensation range
- ✅ Company reputation
- ✅ Location preference

### 3. **Scoring System**
```
Match Score Breakdown:
+30 points: Specifically mentions "2026 passout"
+25 points: Role matches your target (SDE/Backend/Full Stack)
+20 points: PPO opportunity mentioned
+2-3 points per matched skill (Python, React, AWS, etc.)
+10 points: Preferred location (Remote, Bangalore, etc.)
-20 points: Red flags (contract, part-time)
```

### 4. **Results Categorization**
```
🔥 High Match (70-100): Apply ASAP
👍 Medium Match (40-69): Consider carefully
⚠️ Low Match (0-39): Not recommended
```

---

## 💻 Usage

### **Option 1: Chat Interface** (http://localhost:3000)
```
You: "Find me the best SDE jobs for 2026 passouts with good PPO"

AI: 🤖 Searching across LinkedIn, Naukri, and more...

[Shows results with]:
- Match Score: 87/100
- Matched Skills: Python, React, AWS, Docker, Kubernetes
- Why Recommended: Strong PPO opportunity, matches your DevOps experience
- Salary: ₹60,000-80,000/month
- Apply: https://linkedin.com/jobs/...
```

### **Option 2: Agents Dashboard** (http://localhost:3000/agents)
1. Find "🎯 AI-Powered Job Matcher" card
2. Click **"Run Now"**
3. Get results in dashboard

### **Option 3: Scheduled (Automatic)**
- Runs **3x daily** (8 AM, 12 PM, 6 PM)
- Sends notifications for high-match jobs
- Configured in `vercel.json`

---

## 🔧 Configuration

### Update Your Resume
Edit `/lib/resume-profile.ts`:
```typescript
export const RESUME_PROFILE = {
  // Update your info here
  personalInfo: { name, email, phone, linkedin },
  education: { /* ... */ },
  experience: [ /* ... */ ],
  skills: { /* ... */ },
  preferences: {
    minStipend: 50000,  // Change minimum salary
    targetRoles: ["SDE", "ML Engineer"],  // Add/remove roles
    locationPreference: ["Remote", "Bangalore"]  // Update locations
  }
}
```

### Adjust Match Scoring
Edit `/lib/resume-profile.ts` → `calculateJobMatchScore()`:
```typescript
// Example: Increase weight for PPO mentions
if (lowerDesc.includes('ppo')) {
    score += 30;  // Increase from 20 to 30
}
```

---

## 📊 API Reference

### **Tool Name**: `jobSearch`

### **Input Parameters**:
```typescript
{
  searchQuery: string,        // e.g., "SDE 2026 passout"
  location: string,           // e.g., "India", "Bangalore"
  limit: number,              // Max jobs to analyze (default: 15)
  minMatchScore: number,      // Filter threshold (default: 40)
  sources: ['linkedin' | 'naukri' | 'all']  // Job sources
}
```

### **Output Structure**:
```typescript
{
  success: true,
  totalJobs: 15,
  highMatchJobs: [
    {
      id: "linkedin_12345",
      title: "SDE Intern - 2026 Batch",
      company: "Google India",
      location: "Bangalore",
      salary: "₹80,000/month",
      url: "https://linkedin.com/jobs/...",
      matchScore: 92,
      matchedSkills: ["Python", "AWS", "Docker", "React"],
      relevanceFactors: [
        "✅ Specifically hiring 2026 passouts",
        "✅ PPO opportunity mentioned",
        "Strong skill match (15 skills)"
      ],
      warnings: [],
      aiRecommendation: "🔥 Highly Recommended - Apply ASAP!"
    }
  ],
  summary: {
    averageMatchScore: 78,
    topSkillsRequired: ["Python", "AWS", "Docker"],
    topCompanies: ["Google", "Microsoft", "Amazon"],
    recommendedActions: [
      "🎯 Apply immediately to 5 high-match opportunities",
      "📚 Focus on highlighting: Python, AWS, Docker"
    ]
  },
  citations: [
    "[1] SDE Intern at Google - https://linkedin.com/jobs/12345",
    "[2] Backend Engineer at Microsoft - https://linkedin.com/jobs/67890"
  ]
}
```

---

## 🎨 Example Queries

### In Chat:
```
1. "Find SDE jobs with PPO for 2026 graduates"
2. "Search for backend engineer roles in Bangalore with ₹60k+ stipend"
3. "Show me ML engineer positions at startups"
4. "Find remote SDE internships for 2026 passouts"
5. "What are the best tech companies hiring 2026 batch?"
```

### Smart AI Understands Context:
```
You: "Find jobs for me"
AI: Uses YOUR resume automatically

You: "What about ML roles?"
AI: Filters for ML positions matching YOUR ML skills

You: "Only show remote"
AI: Filters for remote + YOUR preferences
```

---

## 📈 Match Score Examples

### Example 1: Perfect Match (Score: 95)
```
Job: "SDE Intern - 2026 Batch | Python, AWS, Docker | PPO | ₹70k"
Your Profile: Python ✅, AWS ✅, Docker ✅, 2026 ✅, PPO priority ✅
Result: 🔥 HIGHLY RECOMMENDED
```

### Example 2: Good Match (Score: 72)
```
Job: "Backend Developer | Node.js, PostgreSQL | Bangalore"
Your Profile: Node.js ✅, PostgreSQL ✅, Bangalore ✅
Result: 👍 RECOMMENDED
```

### Example 3: Poor Match (Score: 28)
```
Job: "Frontend Contract - React | 3+ years exp | Part-time"
Your Profile: React ✅, but "Contract" ❌, "Part-time" ❌
Result: ⚠️ NOT RECOMMENDED
```

---

## 🔔 Notifications (Coming Soon)

Configure in `/app/api/cron/agent-runner/route.ts`:

### Slack Integration:
```typescript
const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL;
await fetch(SLACK_WEBHOOK, {
  body: JSON.stringify({
    text: `🎯 Found ${highMatchJobs.length} high-match jobs!`
  })
});
```

### Email Notifications:
```typescript
// Via AWS SES, SendGrid, or Resend
await sendEmail({
  to: "yashs3324@gmail.com",
  subject: "New SDE Jobs Found!",
  html: formatJobEmail(highMatchJobs)
});
```

---

## 🚀 Deployment

### Vercel (Recommended):
```bash
# 1. Push to GitHub
git add .
git commit -m "Add AI job search system"
git push

# 2. Deploy to Vercel
vercel --prod

# 3. Set Environment Variables in Vercel Dashboard:
ANTHROPIC_API_KEY=sk-ant-...
LINKEDIN_COOKIE=your_li_at_cookie
X_API_KEY=your_twitter_key
X_API_SECRET_KEY=your_twitter_secret
X_ACCESS_TOKEN=your_access_token
X_ACCESS_TOKEN_SECRET=your_access_secret
TAVILY_API_KEY=tvly-...
```

### Cron Jobs Auto-Configure:
Vercel reads `vercel.json` and sets up cron automatically:
```json
{
  "crons": [{
    "path": "/api/cron/agent-runner",
    "schedule": "0 8,12,18 * * *"  // 8 AM, 12 PM, 6 PM daily
  }]
}
```

---

## 📝 Environment Variables

Required:
```bash
ANTHROPIC_API_KEY=sk-ant-...          # Claude AI (get from console.anthropic.com)
TAVILY_API_KEY=tvly-...               # Web search (get from tavily.com)
```

Optional (for full functionality):
```bash
LINKEDIN_COOKIE=your_li_at_cookie     # For LinkedIn access
X_API_KEY=...                         # Twitter posting
X_API_SECRET_KEY=...                  # Twitter posting
X_ACCESS_TOKEN=...                    # Twitter posting
X_ACCESS_TOKEN_SECRET=...             # Twitter posting
```

---

## 🎯 Next Steps

1. **Test the system**:
   ```bash
   npm run dev
   # Visit http://localhost:3000
   # Ask: "Find me SDE jobs for 2026 passouts"
   ```

2. **Customize your resume**:
   - Edit `/lib/resume-profile.ts`
   - Add more skills, projects, achievements

3. **Set up notifications**:
   - Add Slack webhook
   - Configure email alerts

4. **Deploy to production**:
   - Push to GitHub
   - Deploy on Vercel
   - Enable cron jobs

---

## 🤝 Support

**Questions?** Check:
- Agent Dashboard: http://localhost:3000/agents
- Chat Interface: http://localhost:3000
- API Docs: `/app/api/tools/jobSearch.ts`

**Issues?** Common fixes:
- LinkedIn not working → Set `LINKEDIN_COOKIE` in `.env.local`
- No jobs found → Check internet connection, try different search terms
- Match scores too low → Update preferences in `/lib/resume-profile.ts`

---

## 🎉 Success!

You now have an AI-powered job search system that:
- ✅ Knows YOUR resume and skills
- ✅ Searches multiple job boards automatically
- ✅ Provides 0-100 match scores
- ✅ Detects PPO opportunities
- ✅ Shows direct application links
- ✅ Runs 24/7 on autopilot
- ✅ Sends notifications for high-match jobs

**Go find your dream job! 🚀**

