const nodemailer = require('nodemailer');

// Create reusable transporter object using the default SMTP transport
// For development, we use Ethereal Email (fake SMTP)
const createTransporter = async () => {
    try {
        // Generate test SMTP service account from ethereal.email with timeout
        // Only needed if you don't have a real mail account for testing
        const testAccount = await Promise.race([
            nodemailer.createTestAccount(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout connecting to api.nodemailer.com')), 10000)
            )
        ]);

        const transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: testAccount.user, // generated ethereal user
                pass: testAccount.pass, // generated ethereal password
            },
        });

        console.log('Email Transporter Configured');
        console.log('Ethereal User:', testAccount.user);

        return transporter;
    } catch (error) {
        console.error('Error creating Ethereal test account:', error.message);
        console.log('Falling back to console-only mode (emails will be logged, not sent)');

        // Return a mock transporter that just logs
        return {
            sendMail: async (mailOptions) => {
                console.log('=== EMAIL (NOT SENT - Ethereal unavailable) ===');
                console.log('To:', mailOptions.to);
                console.log('Subject:', mailOptions.subject);
                console.log('From:', mailOptions.from);
                console.log('===============================================');
                return {
                    messageId: 'mock-' + Date.now(),
                    accepted: [mailOptions.to],
                    response: '250 Message queued (mocked)'
                };
            }
        };
    }
};

module.exports = { createTransporter };
