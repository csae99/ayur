const express = require('express');
const router = express.Router();
const { Cart, CartItem } = require('../models/cart');
const { Order } = require('../models');
const Address = require('../models/address');
const verifyToken = require('../middleware/auth');
const { estimateDelivery } = require('../utils/pricing');

// Create Payment Intent (Mock Stripe)
router.post('/payment-intent', verifyToken, async (req, res) => {
    try {
        const { amount, currency } = req.body;
        // In a real app, you would call Stripe API here.
        // For now, we return a mock client secret.
        res.json({
            clientSecret: 'mock_client_secret_' + Date.now(),
            amount: amount,
            currency: currency || 'inr'
        });
    } catch (err) {
        console.error('Error creating payment intent:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Place Order
router.post('/', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { address_id, payment_method, payment_id } = req.body;

        // 1. Get Cart
        const cart = await Cart.findOne({
            where: { user_id: userId },
            include: [{ model: CartItem }]
        });

        if (!cart || cart.CartItems.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        // 2. Validate Address
        const address = await Address.findOne({ where: { id: address_id, user_id: userId } });
        if (!address) {
            return res.status(400).json({ message: 'Invalid address' });
        }

        // 3. Create Orders (One per item for now, as per existing schema structure which seems to be item-based)
        // Note: The existing Order model seems to be per-item based on `item_id` and `order_quantity`.
        // A better design would be Order -> OrderItems, but to stick to existing pattern or minimal changes:
        // We will create multiple Order entries or refactor Order to have items.
        // Looking at `models/index.js`, Order has `item_id`. This implies one row per item order.
        // We will create multiple rows.

        // 3. Calculate estimated delivery
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + 5); // 5 days from now

        const orders = [];
        for (const item of cart.CartItems) {
            const order = await Order.create({
                user_id: userId,
                item_id: item.item_id,
                order_quantity: item.quantity,
                order_status: 1, // 1 = Confirmed
                address_id: address_id,
                estimated_delivery: deliveryDate
            });
            orders.push(order);
        }

        // 4. Clear Cart
        await CartItem.destroy({ where: { cart_id: cart.id } });

        res.json({ message: 'Order placed successfully', orderIds: orders.map(o => o.id) });

    } catch (err) {
        console.error('Error placing order:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get/Add Addresses
router.get('/addresses', verifyToken, async (req, res) => {
    try {
        const addresses = await Address.findAll({ where: { user_id: req.user.id } });
        res.json(addresses);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/addresses', verifyToken, async (req, res) => {
    try {
        const address = await Address.create({
            user_id: req.user.id,
            ...req.body
        });
        res.json(address);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
