import { prisma, getOrCreateConversation, saveMessage, getConversationMessages } from '../lib/prisma';

async function testDatabase() {
    console.log('🧪 Testing Database Connection...\n');

    try {
        // Test 1: Create conversation
        console.log('1️⃣ Creating conversation...');
        const conversationId = await getOrCreateConversation('test-user');
        console.log(`✅ Conversation created: ${conversationId}\n`);

        // Test 2: Save messages
        console.log('2️⃣ Saving messages...');
        await saveMessage(conversationId, 'user', 'Hello, this is a test message');
        await saveMessage(conversationId, 'assistant', 'Hello! I received your test message.');
        console.log('✅ Messages saved\n');

        // Test 3: Retrieve messages
        console.log('3️⃣ Retrieving messages...');
        const messages = await getConversationMessages(conversationId);
        console.log(`✅ Retrieved ${messages.length} messages:`);
        messages.forEach(msg => {
            console.log(`   - [${msg.role}]: ${msg.content.substring(0, 50)}...`);
        });
        console.log('');

        // Test 4: Check agents
        console.log('4️⃣ Checking agents...');
        const agents = await prisma.agent.findMany();
        console.log(`✅ Found ${agents.length} agents:`);
        agents.forEach(agent => {
            console.log(`   - ${agent.icon} ${agent.name} (${agent.status})`);
        });
        console.log('');

        // Test 5: Database stats
        console.log('5️⃣ Database statistics:');
        const conversationCount = await prisma.conversation.count();
        const messageCount = await prisma.message.count();
        const agentCount = await prisma.agent.count();
        const runCount = await prisma.agentRun.count();
        
        console.log(`   - Conversations: ${conversationCount}`);
        console.log(`   - Messages: ${messageCount}`);
        console.log(`   - Agents: ${agentCount}`);
        console.log(`   - Agent Runs: ${runCount}`);
        console.log('');

        console.log('✅ All database tests passed!');
    } catch (error) {
        console.error('❌ Database test failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

testDatabase();

