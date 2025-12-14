const express = require('express');
const { Order, Sequelize } = require('../models');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get Order Analytics (Admin only)
router.get('/stats', authMiddleware, async (req, res) => {
    try {
        if (req.user.type !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // Total Orders
        const totalOrders = await Order.count();

        // Orders by Status
        // Status mapping: 0=Pending, 1=Confirmed, 2=Processing, 3=Shipped, 4=Out for Delivery, 5=Delivered, 6=Cancelled
        const ordersByStatus = await Order.findAll({
            attributes: ['order_status', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
            group: ['order_status']
        });

        // Recent Orders (Last 5)
        const recentOrders = await Order.findAll({
            limit: 5,
            order: [['order_date', 'DESC']]
        });

        // Orders Last 7 Days (for graph)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const ordersLast7Days = await Order.findAll({
            where: {
                order_date: {
                    [Sequelize.Op.gte]: sevenDaysAgo
                }
            },
            attributes: [
                [Sequelize.fn('DATE', Sequelize.col('order_date')), 'date'],
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
            ],
            group: [Sequelize.fn('DATE', Sequelize.col('order_date'))],
            order: [[Sequelize.fn('DATE', Sequelize.col('order_date')), 'ASC']]
        });

        res.json({
            totalOrders,
            ordersByStatus,
            recentOrders,
            ordersLast7Days
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
