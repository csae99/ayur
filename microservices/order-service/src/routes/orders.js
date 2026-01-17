const express = require('express');
const { Order, OrderStatusHistory } = require('../models');
const authMiddleware = require('../middleware/auth');
const {
    sendOrderConfirmation,
    sendStatusUpdate,
    sendCancellationEmail,
    getStatusName,
    getStatusMessage
} = require('../utils/notifications');

const router = express.Router();

const { Op } = require('sequelize');
const fetch = require('node-fetch');

// Get all orders (Practitioner/Admin only)
router.get('/', authMiddleware, async (req, res) => {
    try {
        // Only practitioners and admins can view all orders
        if (req.user.type !== 'practitioner' && req.user.type !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const where = {};

        // If practitioner, only show orders for their items
        if (req.user.type === 'practitioner') {
            try {
                // Fetch items for this practitioner from catalog service
                const catalogResponse = await fetch(`http://catalog-service:3002/items/practitioner/${req.user.username}`);

                if (!catalogResponse.ok) {
                    throw new Error(`Failed to fetch practitioner items: ${catalogResponse.status}`);
                }

                const items = await catalogResponse.json();
                const itemIds = items.map(item => item.id);

                // Filter orders by these item IDs
                where.item_id = { [Op.in]: itemIds };
            } catch (err) {
                console.error('Error fetching practitioner items:', err);
                // Return empty list or error? 
                // Let's return empty list if we can't find their items to be safe (don't show all orders)
                return res.json([]);
            }
        }

        const orders = await Order.findAll({
            where: where,
            order: [['order_date', 'DESC']],
        });
        res.json(orders);
    } catch (error) {
        console.error('Error fetching all orders:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create new order (protected)
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { item_id, order_quantity } = req.body;
        const user_id = req.user.id; // Get user ID from JWT token

        const order = await Order.create({
            item_id,
            user_id,
            order_quantity,
            order_date: new Date(),
            order_status: 1, // Changed from 0 to 1 (Confirmed)
            estimated_delivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days from now
        });

        // Add to history
        await OrderStatusHistory.create({
            order_id: order.id,
            status: 1,
            status_name: getStatusName(1),
            notes: 'Order placed successfully',
            created_by: user_id
        });

        // Send order confirmation email (async, don't wait)
        sendOrderConfirmation(order).catch(err =>
            console.error('Failed to send order confirmation:', err)
        );

        res.status(201).json(order);
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(400).json({ error: error.message });
    }
});

// Get all orders for a user (protected)
router.get('/user/:userId', authMiddleware, async (req, res) => {
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
router.get('/user/:userId/detailed', authMiddleware, async (req, res) => {
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
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id, {
            include: [{
                model: OrderStatusHistory,
                as: 'statusHistory',
                attributes: ['status', 'status_name', 'notes', 'created_at']
            }],
            order: [[{ model: OrderStatusHistory, as: 'statusHistory' }, 'created_at', 'ASC']]
        });
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
router.patch('/:id/status', authMiddleware, async (req, res) => {
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

        // Add to history
        await OrderStatusHistory.create({
            order_id: order.id,
            status: status,
            status_name: getStatusName(status),
            notes: `Status updated to ${getStatusName(status)}`,
            created_by: req.user.id
        });

        // Send status update email for important statuses (Shipped, Delivered)
        if (status === 4 || status === 6) {
            const statusName = getStatusName(status);
            const statusMessage = getStatusMessage(status);
            sendStatusUpdate(order, statusName, statusMessage).catch(err =>
                console.error('Failed to send status update email:', err)
            );
        }

        res.json(order);
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(400).json({ error: error.message });
    }
});

// Cancel order (Patient/Admin)
router.post('/:id/cancel', authMiddleware, async (req, res) => {
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

        // Add to history
        await OrderStatusHistory.create({
            order_id: order.id,
            status: 7,
            status_name: getStatusName(7),
            notes: 'Order cancelled by user',
            created_by: req.user.id
        });

        // Send cancellation email
        sendCancellationEmail(order).catch(err =>
            console.error('Failed to send cancellation email:', err)
        );

        res.json({ message: 'Order cancelled successfully', order });
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
