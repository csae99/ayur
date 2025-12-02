const express = require('express');
const cors = require('cors');
const { createTransporter } = require('./config/email');
const { renderEmailTemplate } = require('./utils/templates');

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
            from: '"Ayurveda Platform" <noreply@ayurveda.com>',
            to,
            subject,
            html,
        });

        console.log("Message sent: %s", info.messageId);
        console.log("Preview URL: %s", require('nodemailer').getTestMessageUrl(info));

        res.json({
            message: 'Email sent successfully',
            messageId: info.messageId,
            previewUrl: require('nodemailer').getTestMessageUrl(info)
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
            from: '"Ayurveda Platform" <noreply@ayurveda.com>',
            to,
            subject: `Order Confirmed - #${orderData.orderNumber}`,
            html,
        });

        console.log("Order confirmation sent: %s", info.messageId);
        console.log("Preview URL: %s", require('nodemailer').getTestMessageUrl(info));

        res.json({
            message: 'Order confirmation email sent',
            messageId: info.messageId,
            previewUrl: require('nodemailer').getTestMessageUrl(info)
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

        const html = await renderEmailTemplate('order-status-update', orderData);

        if (!transporter) {
            transporter = await createTransporter();
        }

        const info = await transporter.sendMail({
            from: '"Ayurveda Platform" <noreply@ayurveda.com>',
            to,
            subject: `Order Update - ${orderData.statusName} - #${orderData.orderNumber}`,
            html,
        });

        console.log("Status update sent: %s", info.messageId);
        console.log("Preview URL: %s", require('nodemailer').getTestMessageUrl(info));

        res.json({
            message: 'Status update email sent',
            messageId: info.messageId,
            previewUrl: require('nodemailer').getTestMessageUrl(info)
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
            from: '"Ayurveda Platform" <noreply@ayurveda.com>',
            to,
            subject: `Order Cancelled - #${orderData.orderNumber}`,
            html,
        });

        console.log("Cancellation email sent: %s", info.messageId);
        console.log("Preview URL: %s", require('nodemailer').getTestMessageUrl(info));

        res.json({
            message: 'Cancellation email sent',
            messageId: info.messageId,
            previewUrl: require('nodemailer').getTestMessageUrl(info)
        });
    } catch (error) {
        console.error('Error sending cancellation email:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Notification Service running on port ${PORT}`);
});
