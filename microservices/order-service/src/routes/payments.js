const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { Order, OrderStatusHistory } = require('../models');
const authMiddleware = require('../middleware/auth');

// Initialize Razorpay with environment variables
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Get Razorpay public key for frontend
router.get('/config', (req, res) => {
    res.json({
        key_id: process.env.RAZORPAY_KEY_ID
    });
});

// Create Razorpay Order
router.post('/create-order', authMiddleware, async (req, res) => {
    try {
        const { amount, currency = 'INR', receipt } = req.body;

        const options = {
            amount: amount * 100, // Amount in paise
            currency,
            receipt,
            payment_capture: 1
        };

        const response = await razorpay.orders.create(options);

        // Can optionally create a local Pending Order here if needed, 
        // or wait for payment verification to create the actual Order record.
        // For this flow, we assume the Frontend calls create-order just to get the ID, 
        // and then creates the actual Order record + verify payment.

        res.json({
            id: response.id,
            currency: response.currency,
            amount: response.amount
        });
    } catch (error) {
        console.error('Razorpay Create Order Error:', error);
        res.status(500).json({ error: 'Failed to create payment order' });
    }
});

// Verify Payment and Update Order
router.post('/verify', authMiddleware, async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_ids } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            // Payment Success
            // Update All Associated Orders to Confirmed (1)

            // Handle both single ID and array
            const idsToUpdate = Array.isArray(order_ids) ? order_ids : [req.body.order_id];

            const orders = await Order.findAll({ where: { id: idsToUpdate } });

            if (!orders || orders.length === 0) {
                return res.status(404).json({ error: 'Orders not found' });
            }

            // Update all found orders
            await Promise.all(orders.map(async (order) => {
                await order.update({
                    order_status: 1, // Confirmed
                    razorpay_order_id,
                    razorpay_payment_id,
                    razorpay_signature,
                    payment_method: 'Online'
                });

                // Add history entry
                await OrderStatusHistory.create({
                    order_id: order.id,
                    status: 1,
                    status_name: 'Confirmed',
                    notes: `Payment Successful via Razorpay (ID: ${razorpay_payment_id})`,
                    created_by: req.user.id
                });
            }));

            res.json({ status: 'success', message: 'Payment verified and orders confirmed' });
        } else {
            res.status(400).json({ status: 'failure', message: 'Invalid signature' });
        }
    } catch (error) {
        console.error('Razorpay Verify Error:', error);
        res.status(500).json({ error: 'Payment verification failed' });
    }
});

module.exports = router;
