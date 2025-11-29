const fetch = require('node-fetch');

async function quickTest() {
    const res = await fetch('http://localhost/api/orders/cancel-order-test/15', {
        method: 'POST'
    });
    console.log('Status:', res.status);
    console.log('Response:', await res.text());
}

quickTest();
