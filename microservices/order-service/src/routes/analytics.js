const express = require('express');
const { Order } = require('../models');
const Sequelize = require('sequelize');
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
            group: [Sequelize.literal('order_status')],
            raw: true
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
                ['order_date', 'date'],
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
            ],
            group: [Sequelize.literal('order_date')],
            order: [['order_date', 'ASC']],
            raw: true
        });

        res.json({
            totalOrders,
            ordersByStatus,
            recentOrders,
            ordersLast7Days
        });
    } catch (error) {
        console.error('Error fetching analytics FULL DETAILS:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
        res.status(500).json({ error: error.message });
    }
});

// Get Practitioner Sales Analytics (Practitioner only)
router.get('/practitioner/stats', authMiddleware, async (req, res) => {
    try {
        const userRole = req.user.role || req.user.type;
        if (userRole !== 'practitioner') {
            return res.status(403).json({ error: 'Unauthorized: Only practitioners can access sales stats' });
        }

        const practitionerId = req.user.id;

        // 1. Total Revenue (Only Confirmed to Delivered: 1-6)
        const totalRevenueResult = await Order.sum('final_amount', {
            where: {
                practitioner_id: practitionerId,
                order_status: {
                    [Sequelize.Op.between]: [1, 6] // 1=Confirmed...6=Delivered
                }
            }
        });
        const totalRevenue = totalRevenueResult || 0;

        // 2. Total Orders Fulfilled (Status 1-6)
        const totalOrders = await Order.count({
            where: {
                practitioner_id: practitionerId,
                order_status: {
                    [Sequelize.Op.between]: [1, 6]
                }
            }
        });

        // 3. Average Order Value
        const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0;

        // 4. Order Status Distribution (All statuses for visibility)
        const ordersByStatus = await Order.findAll({
            where: { practitioner_id: practitionerId },
            attributes: ['order_status', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
            group: [Sequelize.literal('order_status')],
            raw: true
        });

        // 5. Daily Revenue (Last 7 Days - Only Valid Sales)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const revenueLast7Days = await Order.findAll({
            where: {
                practitioner_id: practitionerId,
                order_status: {
                    [Sequelize.Op.between]: [1, 6]
                },
                order_date: {
                    [Sequelize.Op.gte]: sevenDaysAgo
                }
            },
            attributes: [
                ['order_date', 'date'],
                [Sequelize.fn('SUM', Sequelize.col('final_amount')), 'revenue']
            ],
            group: [Sequelize.literal('order_date')],
            order: [['order_date', 'ASC']],
            raw: true
        });

        res.json({
            totalRevenue,
            totalOrders,
            avgOrderValue,
            ordersByStatus,
            revenueLast7Days
        });

    } catch (error) {
        console.error('Error fetching practitioner sales stats:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
