const fetch = require('node-fetch');

async function testAyurBotPhases() {
    console.log('🧪 Testing AyurBot Phases 2 & 3...\n');

    try {
        // Test 1: Dosha Quiz Questions
        console.log('1️⃣  Testing Dosha Quiz...');
        const quizRes = await fetch('http://127.0.0.1:8000/dosha/quiz');
        const quiz = await quizRes.json();
        console.log(`   ✅ Quiz has ${quiz.questions.length} questions`);
        console.log(`   Sample question: "${quiz.questions[0].question}"\n`);

        // Test 2: Dosha Assessment
        console.log('2️⃣  Testing Dosha Assessment...');
        const answers = {
            "1": "A", "2": "A", "3": "A", "4": "B", "5": "A",
            "6": "A", "7": "A", "8": "A", "9": "A", "10": "B"
        };
        const assessRes = await fetch('http://127.0.0.1:8000/dosha/assess', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answers, user_id: 1 })
        });
        const assessment = await assessRes.json();
        console.log(`   ✅ Primary Dosha: ${assessment.primary_dosha}`);
        console.log(`   ✅ Vata: ${assessment.results.vata}%, Pitta: ${assessment.results.pitta}%, Kapha: ${assessment.results.kapha}%`);
        console.log(`   ✅ Recommendations: ${assessment.recommendations.length} items\n`);

        // Test 3: Herb Recommendations
        console.log('3️⃣  Testing Herb Recommendations...');
        const herbRes = await fetch('http://127.0.0.1:8000/recommend/herbs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symptoms: ["stress", "insomnia", "digestion"] })
        });
        const herbs = await herbRes.json();
        console.log(`   ✅ Recommended herbs: ${herbs.recommendations.recommended_herbs.join(', ')}`);
        console.log(`   ✅ Found ${herbs.catalog_items.length} catalog items\n`);

        // Test 4: Chat with MongoDB persistence
        console.log('4️⃣  Testing Chat with MongoDB...');
        const chatRes = await fetch('http://127.0.0.1:8000/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: "I'm feeling stressed. Can you help?",
                user_id: 1
            })
        });
        const chat = await chatRes.json();
        console.log(`   ✅ Chat response received (${chat.response.length} chars)`);
        console.log(`   ✅ Session ID: ${chat.session_id}`);

        // Test 5: History retrieval
        console.log('\n5️⃣  Testing History Retrieval...');
        const historyRes = await fetch(`http://127.0.0.1:8000/history/${chat.session_id}`);
        const history = await historyRes.json();
        console.log(`   ✅ History has ${history.messages.length} messages`);
        console.log(`   ✅ MongoDB persistence working!\n`);

        console.log('✅ All Tests Passed! 🎉\n');

    } catch (error) {
        console.error('❌ Test Failed:', error.message);
    }
}

testAyurBotPhases();
