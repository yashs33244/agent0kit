#!/bin/bash

# 🚀 AI Agent System - Quick Setup Script

set -e  # Exit on error

echo "🤖 AI Agent System - Installation"
echo "=================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker Desktop first."
    echo "   Visit: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not available. Please install it."
    exit 1
fi

echo "✅ Docker is installed"
echo ""

# Step 1: Install Node dependencies
echo "📦 Step 1: Installing Node dependencies..."
if command -v pnpm &> /dev/null; then
    pnpm install
elif command -v npm &> /dev/null; then
    npm install
else
    echo "❌ Neither npm nor pnpm found. Please install Node.js."
    exit 1
fi

echo "✅ Dependencies installed"
echo ""

# Step 2: Setup environment file
echo "🔧 Step 2: Setting up environment..."
if [ ! -f ".env.local" ]; then
    echo "Creating .env.local from template..."
    cp env.example .env.local
    echo "⚠️  IMPORTANT: You need to configure .env.local with your API keys!"
    echo "   Required keys:"
    echo "   - ANTHROPIC_API_KEY"
    echo "   - TAVILY_API_KEY"
    echo "   - TELEGRAM_JOB_AGENT_BOT_TOKEN (and other Telegram tokens)"
    echo "   - TELEGRAM_CHAT_ID"
    echo "   - X_API_KEY, X_API_SECRET_KEY, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET"
    echo ""
    read -p "Press Enter after you've configured .env.local, or Ctrl+C to exit..."
else
    echo "✅ .env.local already exists"
fi

echo ""

# Step 3: Start Docker services
echo "🐳 Step 3: Starting Docker services (PostgreSQL, Redis, Qdrant)..."
docker-compose up -d postgres redis qdrant

echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "postgres.*Up"; then
    echo "✅ PostgreSQL is running"
else
    echo "❌ PostgreSQL failed to start"
    docker-compose logs postgres
    exit 1
fi

if docker-compose ps | grep -q "redis.*Up"; then
    echo "✅ Redis is running"
else
    echo "❌ Redis failed to start"
    exit 1
fi

if docker-compose ps | grep -q "qdrant.*Up"; then
    echo "✅ Qdrant is running"
else
    echo "❌ Qdrant failed to start"
    exit 1
fi

echo ""

# Step 4: Generate Prisma Client
echo "🔨 Step 4: Generating Prisma client..."
npx prisma generate

echo "✅ Prisma client generated"
echo ""

# Step 5: Run database migrations
echo "💾 Step 5: Running database migrations..."
npx prisma migrate dev --name init

echo "✅ Database initialized"
echo ""

# Step 6: Test connections
echo "🧪 Step 6: Testing connections..."

# Test PostgreSQL
if docker exec agent-postgres psql -U agent_user -d agent_db -c "SELECT version();" &> /dev/null; then
    echo "✅ PostgreSQL connection successful"
else
    echo "⚠️  PostgreSQL connection test failed"
fi

# Test Redis
if docker exec agent-redis redis-cli ping | grep -q "PONG"; then
    echo "✅ Redis connection successful"
else
    echo "⚠️  Redis connection test failed"
fi

# Test Qdrant
if curl -s http://localhost:6333/collections &> /dev/null; then
    echo "✅ Qdrant connection successful"
else
    echo "⚠️  Qdrant connection test failed"
fi

echo ""
echo "🎉 Installation Complete!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Start the development server:"
echo "   npm run dev"
echo ""
echo "2. Open your browser:"
echo "   http://localhost:3000"
echo ""
echo "3. View the agents dashboard:"
echo "   http://localhost:3000/agents"
echo ""
echo "4. Open Prisma Studio (database GUI):"
echo "   npm run prisma:studio"
echo "   (Opens at http://localhost:5555)"
echo ""
echo "5. View Qdrant dashboard:"
echo "   http://localhost:6333/dashboard"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 Documentation:"
echo "   - Setup Guide: SETUP_GUIDE.md"
echo "   - Implementation Status: IMPLEMENTATION_STATUS.md"
echo "   - Job Search Guide: README_JOB_SEARCH.md"
echo ""
echo "🔧 Useful Commands:"
echo "   npm run docker:up      - Start all Docker services"
echo "   npm run docker:down    - Stop all Docker services"
echo "   npm run docker:logs    - View Docker logs"
echo "   npm run prisma:studio  - Open database GUI"
echo ""
echo "⚠️  Don't forget to:"
echo "   1. Create Telegram bots with @BotFather"
echo "   2. Get your chat ID from @userinfobot"
echo "   3. Add all tokens to .env.local"
echo ""
echo "Happy coding! 🚀"

