const nodemailer = require('nodemailer');

// Create reusable transporter object
const createTransporter = async () => {
    try {
        // 1. Check for real SMTP configuration first
        if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
            console.log('Using Real SMTP Configuration');
            console.log('Host:', process.env.SMTP_HOST);
            console.log('User:', process.env.SMTP_USER);

            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT || 587,
                secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });

            // Verify connection configuration
            await transporter.verify();
            console.log('Real SMTP connection verified');
            return transporter;
        }

        // 2. Fallback to Ethereal (Mock)
        console.log('No SMTP config found. Generating Ethereal mock account...');
        const testAccount = await Promise.race([
            nodemailer.createTestAccount(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout connecting to api.nodemailer.com')), 10000)
            )
        ]);

        const transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });

        console.log('Email Transporter Configured (Ethereal Mock)');
        console.log('Ethereal User:', testAccount.user);

        return transporter;
    } catch (error) {
        console.error('Error configuring email transporter:', error.message);
        console.log('Falling back to console-only mode');

        return {
            sendMail: async (mailOptions) => {
                console.log('=== EMAIL (NOT SENT - Config Failed) ===');
                console.log('To:', mailOptions.to);
                console.log('Subject:', mailOptions.subject);
                console.log('========================================');
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
