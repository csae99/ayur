const fetch = require('node-fetch');

async function testCancel() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await fetch('http://localhost/api/identity/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'test_patient_01', password: 'password123', type: 'patient' })
        });
        const loginText = await loginRes.text();
        console.log('Login Status:', loginRes.status);
        console.log('Login Response:', loginText);

        const loginData = JSON.parse(loginText);
        if (!loginRes.ok) throw new Error(JSON.stringify(loginData));
        console.log('Login successful. Token:', loginData.token.substring(0, 20) + '...');

        // 2. Cancel Order 15
        console.log('Cancelling order 15...');
        const cancelRes = await fetch('http://localhost/api/orders/orders/15/cancel', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${loginData.token}`,
                'Content-Type': 'application/json'
            }
        });

        const text = await cancelRes.text();
        console.log('Status:', cancelRes.status);
        console.log('Raw Response:', text);

        // Also test the -test endpoint
        console.log('\n\nTesting /cancel-test endpoint...');
        const testRes = await fetch('http://localhost/api/orders/orders/15/cancel-test', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${loginData.token}` }
        });
        const testText = await testRes.text();
        console.log('Test Status:', testRes.status);
        console.log('Test Response:', testText);

        // Test hitting service directly (bypass nginx)
        console.log('\n\nTesting direct to service (bypass nginx)...');
        const directRes = await fetch('http://localhost:3003/orders/15/cancel-test', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${loginData.token}` }
        });
        const directText = await directRes.text();
        console.log('Direct Status:', directRes.status);
        console.log('Direct Response:', directText);

    } catch (err) {
        console.error('Error:', err);
    }
}

testCancel();
