const express = require('express');
const { Order } = require('../models');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Create new order (protected)
router.post('/orders', authMiddleware, async (req, res) => {
    try {
        const { item_id, order_quantity } = req.body;
        const user_id = req.user.id; // Get user ID from JWT token

        const order = await Order.create({
            item_id,
            user_id,
            order_quantity,
            order_date: new Date(),
            order_status: 0,
        });
        res.status(201).json(order);
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(400).json({ error: error.message });
    }
});

// Get all orders for a user (protected)
router.get('/orders/user/:userId', authMiddleware, async (req, res) => {
    try {
        // Ensure user can only view their own orders (unless admin)
        if (req.user.id !== parseInt(req.params.userId) && req.user.type !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const orders = await Order.findAll({
            where: { user_id: req.params.userId },
            order: [['order_date', 'DESC']],
        });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get orders with item details (protected)
router.get('/orders/user/:userId/detailed', authMiddleware, async (req, res) => {
    try {
        // Ensure user can only view their own orders
        if (req.user.id !== parseInt(req.params.userId) && req.user.type !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const orders = await Order.findAll({
            where: { user_id: req.params.userId },
            order: [['order_date', 'DESC']],
        });

        // Fetch item details from catalog service
        const ordersWithDetails = await Promise.all(
            orders.map(async (order) => {
                try {
                    const response = await fetch(`http://catalog-service:3002/items/${order.item_id}`);
                    const item = await response.json();
                    return {
                        ...order.toJSON(),
                        item: item
                    };
                } catch (error) {
                    return {
                        ...order.toJSON(),
                        item: null
                    };
                }
            })
        );

        res.json(ordersWithDetails);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get order by ID (protected)
router.get('/orders/:id', authMiddleware, async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id);
        if (!order) return res.status(404).json({ error: 'Order not found' });

        // Ensure user can only view their own orders
        if (order.user_id !== req.user.id && req.user.type !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update order status (admin only)
router.put('/orders/:id/status', authMiddleware, async (req, res) => {
    try {
        if (req.user.type !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const order = await Order.findByPk(req.params.id);
        if (!order) return res.status(404).json({ error: 'Order not found' });

        await order.update({ order_status: req.body.order_status });
        res.json(order);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Cancel/Delete order (protected)
router.delete('/orders/:id', authMiddleware, async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id);
        if (!order) return res.status(404).json({ error: 'Order not found' });

        // Ensure user can only delete their own orders
        if (order.user_id !== req.user.id && req.user.type !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        await order.destroy();
        res.json({ message: 'Order cancelled successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
