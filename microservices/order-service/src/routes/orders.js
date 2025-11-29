const express = require('express');
const { Order } = require('../models');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// TEST ENDPOINT - Remove after debugging
router.post('/orders/:id/cancel-test', (req, res) => {
    console.log('[TEST] Cancel test endpoint hit!', req.params.id);
    res.json({ message: 'Test endpoint works', orderId: req.params.id });
});

// Catch-all test
router.all('*', (req, res, next) => {
    console.log(`[CATCH-ALL] ${req.method} ${req.path}`);
    next(); // Continue to other routes
});


// TEST with different pattern
router.post('/cancel-order-test/:id', (req, res) => {
    console.log('[TEST2] Different pattern works!', req.params.id);
    res.json({ message: 'Test2 works', orderId: req.params.id });
});



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

// Update order status (Practitioner/Admin)
router.patch('/orders/:id/status', authMiddleware, async (req, res) => {
    try {
        const { status, tracking_number } = req.body;
        const order = await Order.findByPk(req.params.id);

        if (!order) return res.status(404).json({ error: 'Order not found' });

        // Authorization check
        if (req.user.type === 'practitioner') {
            // Future: Check if order.practitioner_id === req.user.id
            // For now, allow if they are a practitioner (assuming shared inventory or single pharmacy)
        } else if (req.user.type !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const updates = { order_status: status };

        // Handle specific status changes
        if (status === 4) { // Shipped
            if (!tracking_number) {
                return res.status(400).json({ error: 'Tracking number required for shipping' });
            }
            updates.tracking_number = tracking_number;
            updates.shipped_date = new Date();
        }

        if (status === 6) { // Delivered
            updates.delivered_date = new Date();
        }

        await order.update(updates);
        res.json(order);
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(400).json({ error: error.message });
    }
});

// Cancel order (Patient/Admin)
router.post('/orders/:id/cancel', authMiddleware, async (req, res) => {
    console.log(`[DEBUG] Cancel request for order ${req.params.id} by user ${req.user.id}`);
    try {
        const order = await Order.findByPk(req.params.id);
        if (!order) return res.status(404).json({ error: 'Order not found' });

        // Authorization
        if (order.user_id !== req.user.id && req.user.type !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        // Validation: Can only cancel if status <= 3 (Packed)
        if (order.order_status > 3 && req.user.type !== 'admin') {
            return res.status(400).json({ error: 'Cannot cancel order after it has been shipped' });
        }

        await order.update({ order_status: 7 }); // 7 = Cancelled
        res.json({ message: 'Order cancelled successfully', order });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Legacy DELETE (Admin only - hard delete)
router.delete('/orders/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.type !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        const order = await Order.findByPk(req.params.id);
        if (!order) return res.status(404).json({ error: 'Order not found' });
        await order.destroy();
        res.json({ message: 'Order deleted permanently' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

console.log('[ROUTES] Orders module loaded. All routes registered.');

module.exports = router;
