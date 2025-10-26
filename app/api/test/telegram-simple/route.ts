import { NextResponse } from 'next/server';

/**
 * Simple Telegram Bot Test
 * 
 * This tests basic connectivity and helps you get your chat ID
 */
export async function GET() {
    const botToken = process.env.TELEGRAM_JOB_AGENT_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    console.log('\n🧪 TESTING TELEGRAM BOT CONNECTION');
    console.log('═══════════════════════════════════════');
    console.log(`Bot Token: ${botToken ? '✅ Set' : '❌ Missing'}`);
    console.log(`Chat ID: ${chatId || '❌ Missing'}`);
    console.log('═══════════════════════════════════════\n');

    if (!botToken) {
        return NextResponse.json({
            success: false,
            error: 'TELEGRAM_JOB_AGENT_BOT_TOKEN not set in .env.local',
            help: 'Get your bot token from @BotFather on Telegram',
        }, { status: 400 });
    }

    // Test 1: Get bot info
    console.log('1️⃣ Testing bot authentication...');
    const botInfoUrl = `https://api.telegram.org/bot${botToken}/getMe`;
    const botInfoResponse = await fetch(botInfoUrl);
    const botInfo = await botInfoResponse.json();

    if (!botInfo.ok) {
        console.error('❌ Bot authentication failed:', botInfo);
        return NextResponse.json({
            success: false,
            error: 'Invalid bot token',
            details: botInfo.description,
            help: 'Check your TELEGRAM_JOB_AGENT_BOT_TOKEN in .env.local',
        }, { status: 400 });
    }

    console.log(`✅ Bot authenticated: @${botInfo.result.username}`);
    console.log(`   Bot name: ${botInfo.result.first_name}`);
    console.log(`   Bot ID: ${botInfo.result.id}`);

    // Test 2: Get updates to find chat ID
    console.log('\n2️⃣ Checking for recent messages...');
    const updatesUrl = `https://api.telegram.org/bot${botToken}/getUpdates`;
    const updatesResponse = await fetch(updatesUrl);
    const updates = await updatesResponse.json();

    let foundChatId: string | null = null;
    if (updates.ok && updates.result.length > 0) {
        const latestMessage = updates.result[updates.result.length - 1];
        if (latestMessage.message?.chat?.id) {
            foundChatId = latestMessage.message.chat.id.toString();
            console.log(`✅ Found chat ID from recent message: ${foundChatId}`);
            console.log(`   From: ${latestMessage.message.from.first_name} (@${latestMessage.message.from.username || 'no username'})`);
        }
    } else {
        console.log('⚠️ No recent messages found');
        console.log('   💡 Send any message to your bot to get your chat ID');
    }

    // Test 3: Send test message if chat ID is available
    let messageSent = false;
    let messageError = null;
    const testChatId = chatId || foundChatId;

    if (testChatId) {
        console.log(`\n3️⃣ Sending test message to chat ID: ${testChatId}...`);
        const sendUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

        const sendResponse = await fetch(sendUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: testChatId,
                text: `🧪 <b>Test Message</b>\n\n✅ Your Telegram bot is working!\n\n<i>Sent at: ${new Date().toLocaleString()}</i>`,
                parse_mode: 'HTML',
            }),
        });

        const sendResult = await sendResponse.json();

        if (sendResult.ok) {
            messageSent = true;
            console.log('✅ Test message sent successfully!');
        } else {
            messageError = sendResult.description;
            console.error('❌ Failed to send message:', sendResult.description);
        }
    } else {
        console.log('\n3️⃣ Cannot send test message - no chat ID available');
        console.log('   💡 Send /start to your bot first!');
    }

    // Final results
    console.log('\n═══════════════════════════════════════');
    console.log('📊 TEST RESULTS:');
    console.log(`   Bot Valid: ✅`);
    console.log(`   Chat ID: ${testChatId ? '✅ ' + testChatId : '❌ Not found'}`);
    console.log(`   Message Sent: ${messageSent ? '✅ Yes' : '❌ No'}`);
    console.log('═══════════════════════════════════════\n');

    return NextResponse.json({
        success: messageSent,
        bot: {
            username: botInfo.result.username,
            name: botInfo.result.first_name,
            id: botInfo.result.id,
        },
        chatId: testChatId,
        messageSent,
        messageError,
        instructions: !testChatId ? [
            '1. Open Telegram and search for your bot',
            `2. Search: @${botInfo.result.username}`,
            '3. Click Start or send any message',
            '4. Run this test again to get your chat ID',
        ] : !messageSent ? [
            'Message failed to send. Check:',
            '1. Chat ID is correct',
            '2. You started the bot (sent /start)',
            '3. Bot is not blocked',
        ] : [
            '✅ Everything works!',
            'Check your Telegram for the test message',
        ],
    });
}


