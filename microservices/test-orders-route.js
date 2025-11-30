const fetch = require('node-fetch');

async function testOrdersEndpoint() {
    try {
        // 1. Login as practitioner
        const loginRes = await fetch('http://localhost/api/identity/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'dr_rajesh', password: 'password123', type: 'practitioner' })
        });
        const loginData = await loginRes.json();
        console.log('Login:', loginRes.status);

        if (!loginRes.ok) {
            console.error('Login failed:', loginData);
            return;
        }

        // 2. Test /api/orders/orders
        console.log('\nTesting /api/orders/orders ...');
        const res1 = await fetch('http://localhost/api/orders/orders', {
            headers: { 'Authorization': `Bearer ${loginData.token}` }
        });
        console.log('Status:', res1.status);
        if (res1.ok) {
            const data = await res1.json();
            console.log('Success! Found', data.length, 'orders');
        } else {
            console.log('Failed:', await res1.text());
        }

        // 3. Test /api/orders
        console.log('\nTesting /api/orders ...');
        const res2 = await fetch('http://localhost/api/orders', {
            headers: { 'Authorization': `Bearer ${loginData.token}` }
        });
        console.log('Status:', res2.status);
        if (res2.ok) {
            const data = await res2.json();
            console.log('Success! Found', data.length, 'orders');
        } else {
            console.log('Failed:', await res2.text());
        }

    } catch (err) {
        console.error('Error:', err.message);
    }
}

testOrdersEndpoint();
