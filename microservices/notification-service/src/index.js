const express = require('express');
const cors = require('cors');
const { createTransporter } = require('./config/email');
const { sendSMS } = require('./config/sms');
const { renderEmailTemplate } = require('./utils/templates');
const { getSMSTemplate } = require('./templates/sms-templates');

const app = express();
const PORT = process.env.PORT || 3004;

app.use(cors());
app.use(express.json());

let transporter;

// Initialize transporter with error handling
createTransporter()
    .then(t => {
        transporter = t;
        console.log('Email transporter initialized successfully');
    })
    .catch(err => {
        console.warn('Failed to initialize email transporter on startup:', err.message);
        console.warn('Email functionality will be initialized on first email send attempt');
    });

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'notification-service' });
});

// ==================== EMAIL ENDPOINTS ====================

// Send Email Endpoint (generic)
app.post('/send-email', async (req, res) => {
    try {
        const { to, subject, html } = req.body;

        if (!to || !subject || !html) {
            return res.status(400).json({ error: 'Missing required fields: to, subject, html' });
        }

        if (!transporter) {
            transporter = await createTransporter();
        }

        const info = await transporter.sendMail({
            from: `"Ayurveda Platform" <${process.env.SMTP_USER || 'noreply@ayurveda.com'}>`,
            to,
            subject,
            html,
        });

        console.log("Message sent: %s", info.messageId);
        const previewUrl = require('nodemailer').getTestMessageUrl(info);
        if (previewUrl) console.log("Preview URL: %s", previewUrl);

        res.json({
            message: 'Email sent successfully',
            messageId: info.messageId,
            previewUrl
        });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: error.message });
    }
});

// Send Order Confirmation Email
app.post('/send-order-confirmation', async (req, res) => {
    try {
        const { to, orderData } = req.body;

        if (!to || !orderData) {
            return res.status(400).json({ error: 'Missing required fields: to, orderData' });
        }

        const html = await renderEmailTemplate('order-confirmation', orderData);

        if (!transporter) {
            transporter = await createTransporter();
        }

        const info = await transporter.sendMail({
            from: `"Ayurveda Platform" <${process.env.SMTP_USER || 'noreply@ayurveda.com'}>`,
            to,
            subject: `✅ Order Confirmed - #${orderData.orderNumber}`,
            html,
        });

        console.log("Order confirmation sent: %s", info.messageId);
        const previewUrl = require('nodemailer').getTestMessageUrl(info);
        if (previewUrl) console.log("Preview URL: %s", previewUrl);

        res.json({
            message: 'Order confirmation email sent',
            messageId: info.messageId,
            previewUrl
        });
    } catch (error) {
        console.error('Error sending order confirmation:', error);
        res.status(500).json({ error: error.message });
    }
});

// Send Order Status Update Email
app.post('/send-status-update', async (req, res) => {
    try {
        const { to, orderData } = req.body;

        if (!to || !orderData) {
            return res.status(400).json({ error: 'Missing required fields: to, orderData' });
        }

        // Add status-specific styling data
        const enhancedData = addStatusStyling(orderData);
        const html = await renderEmailTemplate('order-status-update', enhancedData);

        if (!transporter) {
            transporter = await createTransporter();
        }

        const subjectEmoji = getStatusEmoji(orderData.statusCode);
        const info = await transporter.sendMail({
            from: `"Ayurveda Platform" <${process.env.SMTP_USER || 'noreply@ayurveda.com'}>`,
            to,
            subject: `${subjectEmoji} Order ${orderData.statusName} - #${orderData.orderNumber}`,
            html,
        });

        console.log("Status update sent: %s", info.messageId);
        const previewUrl = require('nodemailer').getTestMessageUrl(info);
        if (previewUrl) console.log("Preview URL: %s", previewUrl);

        res.json({
            message: 'Status update email sent',
            messageId: info.messageId,
            previewUrl
        });
    } catch (error) {
        console.error('Error sending status update:', error);
        res.status(500).json({ error: error.message });
    }
});

// Send Order Cancellation Email
app.post('/send-cancellation', async (req, res) => {
    try {
        const { to, orderData } = req.body;

        if (!to || !orderData) {
            return res.status(400).json({ error: 'Missing required fields: to, orderData' });
        }

        const html = await renderEmailTemplate('order-cancellation', orderData);

        if (!transporter) {
            transporter = await createTransporter();
        }

        const info = await transporter.sendMail({
            from: `"Ayurveda Platform" <${process.env.SMTP_USER || 'noreply@ayurveda.com'}>`,
            to,
            subject: `❌ Order Cancelled - #${orderData.orderNumber}`,
            html,
        });

        console.log("Cancellation email sent: %s", info.messageId);
        const previewUrl = require('nodemailer').getTestMessageUrl(info);
        if (previewUrl) console.log("Preview URL: %s", previewUrl);

        res.json({
            message: 'Cancellation email sent',
            messageId: info.messageId,
            previewUrl
        });
    } catch (error) {
        console.error('Error sending cancellation email:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==================== SMS ENDPOINTS ====================

// Send Generic SMS
app.post('/send-sms', async (req, res) => {
    try {
        const { to, message } = req.body;

        if (!to || !message) {
            return res.status(400).json({ error: 'Missing required fields: to, message' });
        }

        const result = await sendSMS(to, message);

        if (result.success) {
            res.json({
                message: 'SMS sent successfully',
                sid: result.sid,
                status: result.status
            });
        } else if (result.mock) {
            res.json({
                message: 'SMS logged (Twilio not configured)',
                mock: true,
                sentTo: to
            });
        } else {
            res.status(500).json({ error: result.error || result.reason });
        }
    } catch (error) {
        console.error('Error sending SMS:', error);
        res.status(500).json({ error: error.message });
    }
});

// Send Order Status SMS
app.post('/send-order-sms', async (req, res) => {
    try {
        const { to, orderData, statusCode } = req.body;

        if (!to || !orderData) {
            return res.status(400).json({ error: 'Missing required fields: to, orderData' });
        }

        const message = getSMSTemplate(statusCode || orderData.statusCode, orderData);
        const result = await sendSMS(to, message);

        if (result.success) {
            res.json({
                message: 'Order SMS sent successfully',
                sid: result.sid,
                status: result.status
            });
        } else if (result.mock) {
            res.json({
                message: 'Order SMS logged (Twilio not configured)',
                mock: true,
                sentTo: to,
                smsContent: message
            });
        } else {
            res.status(500).json({ error: result.error || result.reason });
        }
    } catch (error) {
        console.error('Error sending order SMS:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==================== HELPER FUNCTIONS ====================

function getStatusEmoji(statusCode) {
    const emojis = {
        0: '⏳',
        1: '✅',
        2: '🔄',
        3: '📦',
        4: '🚚',
        5: '🏃',
        6: '🎉',
        7: '❌'
    };
    return emojis[statusCode] || '📦';
}

function addStatusStyling(orderData) {
    const statusCode = orderData.statusCode || 0;

    const statusStyles = {
        0: { color: '#6b7280', colorDark: '#4b5563', icon: '⏳' },
        1: { color: '#10b981', colorDark: '#059669', icon: '✅' },
        2: { color: '#3b82f6', colorDark: '#2563eb', icon: '🔄' },
        3: { color: '#8b5cf6', colorDark: '#7c3aed', icon: '📦' },
        4: { color: '#f59e0b', colorDark: '#d97706', icon: '🚚' },
        5: { color: '#ef4444', colorDark: '#dc2626', icon: '🏃' },
        6: { color: '#10b981', colorDark: '#059669', icon: '🎉' },
        7: { color: '#ef4444', colorDark: '#dc2626', icon: '❌' }
    };

    const style = statusStyles[statusCode] || statusStyles[0];

    // Progress step classes
    const progressClasses = {
        confirmedClass: statusCode >= 1 ? (statusCode === 1 ? 'current' : 'active') : '',
        confirmedIcon: statusCode >= 1 ? '✓' : '1',
        processingClass: statusCode >= 2 ? (statusCode === 2 || statusCode === 3 ? 'current' : 'active') : '',
        processingIcon: statusCode >= 2 ? '✓' : '2',
        shippedClass: statusCode >= 4 ? (statusCode === 4 || statusCode === 5 ? 'current' : 'active') : '',
        shippedIcon: statusCode >= 4 ? '✓' : '3',
        deliveredClass: statusCode >= 6 ? 'current' : '',
        deliveredIcon: statusCode >= 6 ? '✓' : '4'
    };

    return {
        ...orderData,
        statusColor: style.color,
        statusColorDark: style.colorDark,
        statusIcon: style.icon,
        ...progressClasses
    };
}

app.listen(PORT, () => {
    console.log(`Notification Service running on port ${PORT}`);
    console.log(`Email: ${process.env.SMTP_HOST ? 'Configured' : 'Using mock/Ethereal'}`);
    console.log(`SMS: ${process.env.TWILIO_ACCOUNT_SID ? 'Configured' : 'Disabled (mock mode)'}`);
});
