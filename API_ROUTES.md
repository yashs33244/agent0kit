# API Routes Reference

## Conversations

### GET /api/conversations
List all conversations
- Query params: `limit` (default: 20), `userId`
- Returns: Array of conversations with message counts

### POST /api/conversations
Create new conversation
- Body: `{ userId?, title? }`
- Returns: Created conversation

### GET /api/conversations/[id]
Get conversation with all messages
- Returns: Conversation with messages array

### DELETE /api/conversations/[id]
Delete conversation (cascades to messages)

---

## Messages

### GET /api/messages
Get messages for a conversation
- Query params: `conversationId` (required)
- Returns: Array of messages

### POST /api/messages
Save new message (auto-stores embedding)
- Body: `{ conversationId, role, content, toolCalls?, toolResults? }`
- Returns: Created message

---

## Agent Runs

### GET /api/agents/runs
List agent runs with filters
- Query params: `agentId`, `limit` (default: 20), `status`
- Returns: Runs array + stats

### GET /api/agents/runs/[id]
Get specific run details
- Returns: Run with notifications

### POST /api/agents/run
Execute agent manually
- Body: `{ agentId, userMessage? }`
- Returns: Execution result

---

## Jobs

### GET /api/jobs
Search job results
- Query params: `minScore` (default: 70), `limit`, `notified`, `source`
- Returns: Jobs + stats + companies + sources

### POST /api/jobs
Mark job as notified
- Body: `{ jobId }`

---

## System

### GET /api/health
Health check (200 if healthy, 503 if degraded)
- Returns: Service statuses

### GET /api/stats
System statistics
- Returns: DB counts, agent stats, job stats, costs, vector DB info

### GET /api/costs
Cost tracking report
- Returns: Total, by service, by operation, recommendations

### POST /api/costs/reset
Reset cost tracking

### GET /api/test/system
Comprehensive system test
- Returns: All services, DB tables, costs

---

## Usage Examples

```bash
# Health check
curl http://localhost:3000/api/health

# Get stats
curl http://localhost:3000/api/stats

# List conversations
curl http://localhost:3000/api/conversations?limit=10

# Create conversation
curl -X POST http://localhost:3000/api/conversations \
  -H "Content-Type: application/json" \
  -d '{"title":"My Chat"}'

# Save message
curl -X POST http://localhost:3000/api/messages \
  -H "Content-Type: application/json" \
  -d '{"conversationId":"xxx","role":"user","content":"Hello"}'

# Get agent runs
curl "http://localhost:3000/api/agents/runs?agentId=ai-job-search&limit=5"

# Run agent
curl -X POST http://localhost:3000/api/agents/run \
  -H "Content-Type: application/json" \
  -d '{"agentId":"ai-job-search"}'

# Get jobs
curl "http://localhost:3000/api/jobs?minScore=80&limit=10"

# Get costs
curl http://localhost:3000/api/costs
```

