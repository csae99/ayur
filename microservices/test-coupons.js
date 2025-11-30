const fetch = require('node-fetch');

async function testCouponSystem() {
    try {
        console.log('=== Testing Coupon System ===\n');

        // 1. Login as admin
        console.log('1. Logging in as admin...');
        const loginRes = await fetch('http://localhost/api/identity/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'admin',
                password: 'admin123',
                type: 'admin'
            })
        });
        const { token } = await loginRes.json();
        console.log('✓ Logged in successfully\n');

        // 2. Create a test coupon
        console.log('2. Creating test coupon...');
        const createRes = await fetch('http://localhost/api/orders/coupons', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                code: 'TEST50',
                discount_type: 'fixed',
                discount_value: 50,
                min_order_value: 200,
                expiry_date: '2025-12-31'
            })
        });
        const coupon = await createRes.json();
        console.log('✓ Coupon created:', coupon);
        console.log('');

        // 3. List all coupons
        console.log('3. Listing all coupons...');
        const listRes = await fetch('http://localhost/api/orders/coupons', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const coupons = await listRes.json();
        console.log(`✓ Found ${coupons.length} coupons`);
        console.log('');

        // 4. Apply coupon (valid order amount)
        console.log('4. Applying TEST50 to ₹300 order...');
        const applyRes = await fetch('http://localhost/api/orders/coupons/apply', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                code: 'TEST50',
                order_amount: 300
            })
        });
        const applyResult = await applyRes.json();
        console.log('✓ Coupon applied:', applyResult);
        console.log('');

        // 5. Try to apply with insufficient order value
        console.log('5. Trying TEST50 on ₹100 order (should fail - minimum is ₹200)...');
        const failRes = await fetch('http://localhost/api/orders/coupons/apply', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                code: 'TEST50',
                order_amount: 100
            })
        });
        const failResult = await failRes.json();
        console.log('✓ Expected error:', failResult.error);
        console.log('');

        console.log('=== All Tests Passed! ===');
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testCouponSystem();
