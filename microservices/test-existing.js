const fetch = require('node-fetch');

async function testExisting() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await fetch('http://localhost/api/identity/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'test_patient_01', password: 'password123', type: 'patient' })
        });
        const loginData = await loginRes.json();
        console.log('Login:', loginRes.status);

        // 2. Test existing GET endpoint
        console.log('\nTesting GET /orders/user/X...');
        const userId = loginData.user.id;
        const getRes = await fetch(`http://localhost/api/orders/orders/user/${userId}`, {
            headers: { 'Authorization': `Bearer ${loginData.token}` }
        });
        console.log('GET Status:', getRes.status);
        const getText = await getRes.text();
        console.log('GET Response:', getText.substring(0, 200));

    } catch (err) {
        console.error('Error:', err.message);
    }
}

testExisting();
