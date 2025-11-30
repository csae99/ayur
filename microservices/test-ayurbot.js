const fetch = require('node-fetch');

async function testAyurBot() {
    console.log('🤖 Testing AyurBot Service...');

    // 1. Health Check
    try {
        console.log('\n1. Checking Health...');
        const healthRes = await fetch('http://127.0.0.1:8000/health');
        const healthData = await healthRes.json();
        console.log('✅ Health Status:', healthData);
    } catch (error) {
        console.error('❌ Health Check Failed:', error.message);
        return;
    }

    // 2. Chat Test
    try {
        console.log('\n2. Testing Chat (Gemini Integration)...');
        const chatRes = await fetch('http://127.0.0.1:8000/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: "I'm feeling very stressed and having trouble sleeping. What Ayurvedic remedies can help?",
                user_id: 1
            })
        });

        if (!chatRes.ok) {
            const errText = await chatRes.text();
            throw new Error(`API Error (${chatRes.status}): ${errText}`);
        }

        const chatData = await chatRes.json();
        console.log('✅ Chat Response Received:');
        console.log('----------------------------------------');
        console.log(chatData.response);
        console.log('----------------------------------------');
        console.log('Suggestions:', chatData.suggestions);
        console.log('Session ID:', chatData.session_id);

        // 3. History Test
        console.log('\n3. Checking Conversation History...');
        const historyRes = await fetch(`http://127.0.0.1:8000/history/${chatData.session_id}`);
        const historyData = await historyRes.json();
        console.log(`✅ History retrieved: ${historyData.messages.length} messages`);

    } catch (error) {
        console.error('❌ Chat Test Failed:', error.message);
    }
}

testAyurBot();
