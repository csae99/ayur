// Twilio SMS Configuration
const twilio = require('twilio');

let twilioClient = null;

const initializeTwilio = () => {
    if (twilioClient) return twilioClient;

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
        console.log('Twilio credentials not configured. SMS functionality disabled.');
        return null;
    }

    try {
        twilioClient = twilio(accountSid, authToken);
        console.log('Twilio SMS client initialized successfully');
        return twilioClient;
    } catch (error) {
        console.error('Failed to initialize Twilio client:', error.message);
        return null;
    }
};

const sendSMS = async (to, message) => {
    const client = initializeTwilio();

    if (!client) {
        console.log('=== SMS (NOT SENT - Twilio not configured) ===');
        console.log('To:', to);
        console.log('Message:', message);
        console.log('==============================================');
        return {
            success: false,
            reason: 'Twilio not configured',
            mock: true,
            to,
            message
        };
    }

    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    if (!fromNumber) {
        console.error('TWILIO_PHONE_NUMBER not configured');
        return { success: false, reason: 'No sender phone number configured' };
    }

    try {
        const result = await client.messages.create({
            body: message,
            from: fromNumber,
            to: to
        });

        console.log('SMS sent successfully:', result.sid);
        return {
            success: true,
            sid: result.sid,
            status: result.status
        };
    } catch (error) {
        console.error('Failed to send SMS:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
};

module.exports = { initializeTwilio, sendSMS };
