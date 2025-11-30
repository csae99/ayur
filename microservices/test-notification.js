const fetch = require('node-fetch');

async function testNotificationService() {
    try {
        console.log('Testing Notification Service...\n');

        // Test health endpoint
        const healthRes = await fetch('http://localhost:3004/health');
        const health = await healthRes.json();
        console.log('Health Check:', health);

        // Test sending email
        const emailRes = await fetch('http://localhost:3004/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                to: 'customer@example.com',
                subject: 'Test Email from Ayurveda Platform',
                html: '<h1>Hello!</h1><p>This is a test email from the notification service.</p>'
            })
        });

        const emailResult = await emailRes.json();
        console.log('\nEmail Sent:', emailResult);
        console.log('\nPreview URL:', emailResult.previewUrl);
        console.log('\nOpen the preview URL in your browser to see the email!');
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testNotificationService();
