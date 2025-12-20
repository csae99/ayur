const express = require('express');
const { Order, OrderStatusHistory } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { sendStatusUpdate, sendCancellationEmail, getStatusName, getStatusMessage } = require('../utils/notifications');

const router = express.Router();

// Admin auth middleware
const adminAuth = (req, res, next) => {
    const jwt = require('jsonwebtoken');
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        if (decoded.type !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        req.admin = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// Status names mapping
const STATUS_NAMES = {
    0: 'Pending Payment',
    1: 'Confirmed',
    2: 'Processing',
    3: 'Packed',
    4: 'Shipped',
    5: 'Out for Delivery',
    6: 'Delivered',
    7: 'Cancelled',
    8: 'Returned',
    9: 'Refunded'
};

// GET /admin/orders - All orders with filters
router.get('/orders', adminAuth, async (req, res) => {
    try {
        const { status, from_date, to_date, search, limit = 50, offset = 0 } = req.query;
        const where = {};

        // Status filter
        if (status !== undefined && status !== 'all') {
            where.order_status = parseInt(status);
        }

        // Date range filter
        if (from_date) {
            where.order_date = { ...where.order_date, [Op.gte]: from_date };
        }
        if (to_date) {
            where.order_date = { ...where.order_date, [Op.lte]: to_date };
        }

        const orders = await Order.findAndCountAll({
            where,
            order: [['order_date', 'DESC'], ['id', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        // Fetch item details from catalog for each order
        const ordersWithDetails = await Promise.all(
            orders.rows.map(async (order) => {
                try {
                    const response = await fetch(`http://catalog-service:3002/items/${order.item_id}`);
                    const item = await response.json();
                    return {
                        ...order.toJSON(),
                        item,
                        status_name: STATUS_NAMES[order.order_status]
                    };
                } catch (error) {
                    return {
                        ...order.toJSON(),
                        item: null,
                        status_name: STATUS_NAMES[order.order_status]
                    };
                }
            })
        );

        res.json({
            orders: ordersWithDetails,
            total: orders.count,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Admin orders error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /admin/orders/stats - Order statistics
router.get('/orders/stats', adminAuth, async (req, res) => {
    try {
        // Total orders by status
        const ordersByStatus = await Order.findAll({
            attributes: [
                'order_status',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
                [sequelize.fn('SUM', sequelize.col('final_amount')), 'revenue']
            ],
            group: ['order_status']
        });

        // Today's orders
        const today = new Date().toISOString().split('T')[0];
        const todayOrders = await Order.count({
            where: { order_date: today }
        });

        const todayRevenue = await Order.sum('final_amount', {
            where: {
                order_date: today,
                order_status: { [Op.notIn]: [0, 7, 8, 9] } // Exclude pending, cancelled, returned, refunded
            }
        });

        // This month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        const monthRevenue = await Order.sum('final_amount', {
            where: {
                order_date: { [Op.gte]: startOfMonth.toISOString().split('T')[0] },
                order_status: { [Op.notIn]: [0, 7, 8, 9] }
            }
        });

        const monthOrders = await Order.count({
            where: { order_date: { [Op.gte]: startOfMonth.toISOString().split('T')[0] } }
        });

        // Total revenue (all time, excluding cancelled/refunded)
        const totalRevenue = await Order.sum('final_amount', {
            where: { order_status: { [Op.notIn]: [0, 7, 8, 9] } }
        });

        const totalOrders = await Order.count();

        // Pending shipments (confirmed + processing + packed)
        const pendingShipments = await Order.count({
            where: { order_status: { [Op.in]: [1, 2, 3] } }
        });

        res.json({
            today: { orders: todayOrders, revenue: todayRevenue || 0 },
            thisMonth: { orders: monthOrders, revenue: monthRevenue || 0 },
            total: { orders: totalOrders, revenue: totalRevenue || 0 },
            pendingShipments,
            byStatus: ordersByStatus.map(s => ({
                status: s.order_status,
                status_name: STATUS_NAMES[s.order_status],
                count: parseInt(s.dataValues.count),
                revenue: parseFloat(s.dataValues.revenue) || 0
            }))
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /admin/orders/reports - Sales reports (daily breakdown)
router.get('/orders/reports', adminAuth, async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        // Daily breakdown
        const dailyOrders = await Order.findAll({
            attributes: [
                'order_date',
                [sequelize.fn('COUNT', sequelize.col('id')), 'orders'],
                [sequelize.fn('SUM', sequelize.col('final_amount')), 'revenue']
            ],
            where: {
                order_date: { [Op.gte]: startDate.toISOString().split('T')[0] },
                order_status: { [Op.notIn]: [0, 7, 8, 9] }
            },
            group: ['order_date'],
            order: [['order_date', 'ASC']]
        });

        // Top selling items
        const topItems = await Order.findAll({
            attributes: [
                'item_id',
                [sequelize.fn('COUNT', sequelize.col('id')), 'order_count'],
                [sequelize.fn('SUM', sequelize.col('order_quantity')), 'total_quantity'],
                [sequelize.fn('SUM', sequelize.col('final_amount')), 'total_revenue']
            ],
            where: { order_status: { [Op.notIn]: [0, 7, 8, 9] } },
            group: ['item_id'],
            order: [[sequelize.fn('SUM', sequelize.col('order_quantity')), 'DESC']],
            limit: 10
        });

        // Fetch item details for top selling
        const topItemsWithDetails = await Promise.all(
            topItems.map(async (item) => {
                try {
                    const response = await fetch(`http://catalog-service:3002/items/${item.item_id}`);
                    const itemDetails = await response.json();
                    return {
                        item_id: item.item_id,
                        item_title: itemDetails.item_title,
                        item_image: itemDetails.item_image,
                        order_count: parseInt(item.dataValues.order_count),
                        total_quantity: parseInt(item.dataValues.total_quantity),
                        total_revenue: parseFloat(item.dataValues.total_revenue) || 0
                    };
                } catch (error) {
                    return {
                        item_id: item.item_id,
                        item_title: 'Unknown',
                        order_count: parseInt(item.dataValues.order_count),
                        total_quantity: parseInt(item.dataValues.total_quantity),
                        total_revenue: parseFloat(item.dataValues.total_revenue) || 0
                    };
                }
            })
        );

        res.json({
            dailyBreakdown: dailyOrders.map(d => ({
                date: d.order_date,
                orders: parseInt(d.dataValues.orders),
                revenue: parseFloat(d.dataValues.revenue) || 0
            })),
            topSellingItems: topItemsWithDetails
        });
    } catch (error) {
        console.error('Admin reports error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /admin/orders/:id - Single order details
router.get('/orders/:id', adminAuth, async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id, {
            include: [{
                model: OrderStatusHistory,
                as: 'statusHistory',
                order: [['created_at', 'ASC']]
            }]
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Fetch item details
        try {
            const response = await fetch(`http://catalog-service:3002/items/${order.item_id}`);
            const item = await response.json();
            res.json({
                ...order.toJSON(),
                item,
                status_name: STATUS_NAMES[order.order_status]
            });
        } catch (err) {
            res.json({
                ...order.toJSON(),
                item: null,
                status_name: STATUS_NAMES[order.order_status]
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PATCH /admin/orders/:id - Update order
router.patch('/orders/:id', adminAuth, async (req, res) => {
    try {
        const { status, tracking_number, notes } = req.body;
        const order = await Order.findByPk(req.params.id);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const updates = {};

        if (status !== undefined) {
            updates.order_status = status;

            // Auto-set dates
            if (status === 4 && tracking_number) { // Shipped
                updates.tracking_number = tracking_number;
                updates.shipped_date = new Date();
            }
            if (status === 6) { // Delivered
                updates.delivered_date = new Date();
            }
        }

        if (tracking_number) {
            updates.tracking_number = tracking_number;
        }

        await order.update(updates);

        // Add to history
        if (status !== undefined) {
            await OrderStatusHistory.create({
                order_id: order.id,
                status: status,
                status_name: STATUS_NAMES[status],
                notes: notes || `Status updated by admin`,
                created_by: req.admin.id
            });

            // Send email and SMS notifications
            const statusName = getStatusName(status);
            const statusMessage = getStatusMessage(status);

            if (status === 7) {
                // Cancellation
                sendCancellationEmail(order).catch(err =>
                    console.error('Failed to send cancellation notification:', err)
                );
            } else {
                // Status update
                sendStatusUpdate(order, statusName, statusMessage).catch(err =>
                    console.error('Failed to send status notification:', err)
                );
            }
        }

        res.json({
            ...order.toJSON(),
            status_name: STATUS_NAMES[order.order_status]
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
