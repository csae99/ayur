const express = require('express');
const { Coupon } = require('../models');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Create coupon (Admin only)
router.post('/', authMiddleware, async (req, res) => {
    try {
        // Only admins can create coupons
        if (req.user.type !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const {
            code,
            discount_type,
            discount_value,
            min_order_value,
            max_discount,
            expiry_date,
            usage_limit
        } = req.body;

        // Validate required fields
        if (!code || !discount_type || !discount_value) {
            return res.status(400).json({
                error: 'Missing required fields: code, discount_type, discount_value'
            });
        }

        // Validate discount type
        if (!['percentage', 'fixed'].includes(discount_type)) {
            return res.status(400).json({
                error: 'discount_type must be either "percentage" or "fixed"'
            });
        }

        // Validate percentage discount
        if (discount_type === 'percentage' && (discount_value < 0 || discount_value > 100)) {
            return res.status(400).json({
                error: 'Percentage discount must be between 0 and 100'
            });
        }

        // Create coupon with uppercase code
        const coupon = await Coupon.create({
            code: code.toUpperCase(),
            discount_type,
            discount_value,
            min_order_value: min_order_value || 0,
            max_discount,
            expiry_date: expiry_date ? new Date(expiry_date) : null,
            usage_limit,
            used_count: 0,
            is_active: true
        });

        res.status(201).json(coupon);
    } catch (error) {
        console.error('Error creating coupon:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ error: 'Coupon code already exists' });
        }
        res.status(400).json({ error: error.message });
    }
});

// Get all coupons (Admin only)
router.get('/', authMiddleware, async (req, res) => {
    try {
        if (req.user.type !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const coupons = await Coupon.findAll({
            order: [['created_at', 'DESC']]
        });

        res.json(coupons);
    } catch (error) {
        console.error('Error fetching coupons:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get available coupons for patients (active, not expired, within usage limit)
router.get('/available', authMiddleware, async (req, res) => {
    try {
        const { Op } = require('sequelize');
        const now = new Date();

        const coupons = await Coupon.findAll({
            where: {
                is_active: true,
                [Op.or]: [
                    { expiry_date: null },
                    { expiry_date: { [Op.gt]: now } }
                ],
                [Op.or]: [
                    { usage_limit: null },
                    { used_count: { [Op.lt]: require('sequelize').col('usage_limit') } }
                ]
            },
            attributes: ['id', 'code', 'discount_type', 'discount_value', 'min_order_value', 'max_discount', 'expiry_date'],
            order: [['discount_value', 'DESC']]
        });

        res.json(coupons);
    } catch (error) {
        console.error('Error fetching available coupons:', error);
        res.status(500).json({ error: error.message });
    }
});

// Apply/Validate coupon (Any authenticated user)
router.post('/apply', authMiddleware, async (req, res) => {
    try {
        const { code, order_amount } = req.body;

        if (!code || !order_amount) {
            return res.status(400).json({
                error: 'Missing required fields: code, order_amount'
            });
        }

        // Find coupon by code
        const coupon = await Coupon.findOne({
            where: { code: code.toUpperCase() }
        });

        if (!coupon) {
            return res.status(404).json({ error: 'Invalid coupon code' });
        }

        // Validate coupon is active
        if (!coupon.is_active) {
            return res.status(400).json({ error: 'This coupon is no longer active' });
        }

        // Check expiry date
        if (coupon.expiry_date && new Date() > new Date(coupon.expiry_date)) {
            return res.status(400).json({ error: 'This coupon has expired' });
        }

        // Check usage limit
        if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
            return res.status(400).json({ error: 'This coupon has reached its usage limit' });
        }

        // Check minimum order value
        if (coupon.min_order_value && order_amount < parseFloat(coupon.min_order_value)) {
            return res.status(400).json({
                error: `Minimum order value of ₹${coupon.min_order_value} required to use this coupon`
            });
        }

        // Calculate discount
        let discount_amount = 0;
        if (coupon.discount_type === 'percentage') {
            discount_amount = (order_amount * parseFloat(coupon.discount_value)) / 100;

            // Apply max discount cap if set
            if (coupon.max_discount && discount_amount > parseFloat(coupon.max_discount)) {
                discount_amount = parseFloat(coupon.max_discount);
            }
        } else if (coupon.discount_type === 'fixed') {
            discount_amount = parseFloat(coupon.discount_value);

            // Ensure discount doesn't exceed order amount
            if (discount_amount > order_amount) {
                discount_amount = order_amount;
            }
        }

        // Round to 2 decimal places
        discount_amount = Math.round(discount_amount * 100) / 100;
        const final_amount = Math.max(0, order_amount - discount_amount);

        res.json({
            valid: true,
            coupon: {
                code: coupon.code,
                discount_type: coupon.discount_type,
                discount_value: coupon.discount_value
            },
            discount_amount,
            original_amount: order_amount,
            final_amount
        });
    } catch (error) {
        console.error('Error applying coupon:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update coupon (Admin only)
router.patch('/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.type !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const coupon = await Coupon.findByPk(req.params.id);
        if (!coupon) {
            return res.status(404).json({ error: 'Coupon not found' });
        }

        const { is_active, expiry_date, usage_limit } = req.body;
        const updates = {};

        if (is_active !== undefined) updates.is_active = is_active;
        if (expiry_date !== undefined) updates.expiry_date = expiry_date ? new Date(expiry_date) : null;
        if (usage_limit !== undefined) updates.usage_limit = usage_limit;

        await coupon.update(updates);
        res.json(coupon);
    } catch (error) {
        console.error('Error updating coupon:', error);
        res.status(400).json({ error: error.message });
    }
});

// Delete coupon (Admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.type !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const coupon = await Coupon.findByPk(req.params.id);
        if (!coupon) {
            return res.status(404).json({ error: 'Coupon not found' });
        }

        await coupon.destroy();
        res.json({ message: 'Coupon deleted successfully' });
    } catch (error) {
        console.error('Error deleting coupon:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
