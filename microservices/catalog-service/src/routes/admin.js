const express = require('express');
const { Item } = require('../models');
const { adminAuth } = require('../middleware/adminAuth');

const router = express.Router();

// Get medicine statistics
router.get('/stats', adminAuth, async (req, res) => {
    try {
        const totalMedicines = await Item.count();
        const pendingMedicines = await Item.count({ where: { status: 'Pending' } });
        const approvedMedicines = await Item.count({ where: { status: 'Approved' } });
        const rejectedMedicines = await Item.count({ where: { status: 'Rejected' } });

        res.json({
            totalMedicines,
            pendingMedicines,
            approvedMedicines,
            rejectedMedicines
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all items (with filters)
router.get('/items', adminAuth, async (req, res) => {
    try {
        const { status, search } = req.query;
        let where = {};

        // Filter by status
        if (status && status !== 'all') {
            where.status = status;
        }

        // Search by title, brand, or category
        if (search) {
            const { Op } = require('sequelize');
            where = {
                ...where,
                [Op.or]: [
                    { item_title: { [Op.iLike]: `%${search}%` } },
                    { item_brand: { [Op.iLike]: `%${search}%` } },
                    { item_cat: { [Op.iLike]: `%${search}%` } }
                ]
            };
        }

        const items = await Item.findAll({ where });
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get item by ID (admin view)
router.get('/items/:id', adminAuth, async (req, res) => {
    try {
        const item = await Item.findByPk(req.params.id);

        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        res.json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update item status (approve/reject)
router.put('/items/:id/status', adminAuth, async (req, res) => {
    try {
        const { status } = req.body;

        if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status. Must be Pending, Approved, or Rejected' });
        }

        const item = await Item.findByPk(req.params.id);

        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        await item.update({ status });
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== INVENTORY MANAGEMENT ====================

// GET /inventory - All items with stock levels
router.get('/inventory', adminAuth, async (req, res) => {
    try {
        const { search, low_stock } = req.query;
        const { Op } = require('sequelize');
        let where = { status: 'Approved' }; // Only show approved items in inventory

        if (search) {
            where = {
                ...where,
                [Op.or]: [
                    { item_title: { [Op.iLike]: `%${search}%` } },
                    { item_brand: { [Op.iLike]: `%${search}%` } }
                ]
            };
        }

        if (low_stock === 'true') {
            where.item_quantity = { [Op.lte]: 10 }; // Low stock threshold
        }

        const items = await Item.findAll({
            where,
            attributes: ['id', 'item_title', 'item_brand', 'item_cat', 'item_image', 'item_quantity', 'item_price', 'status'],
            order: [['item_quantity', 'ASC']]
        });

        res.json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /inventory/stats - Inventory statistics
router.get('/inventory/stats', adminAuth, async (req, res) => {
    try {
        const { Op } = require('sequelize');
        const sequelize = require('../config/database');

        const totalItems = await Item.count({ where: { status: 'Approved' } });
        const lowStockItems = await Item.count({
            where: {
                status: 'Approved',
                item_quantity: { [Op.lte]: 10 }
            }
        });
        const outOfStock = await Item.count({
            where: {
                status: 'Approved',
                item_quantity: 0
            }
        });

        // Total inventory value
        const items = await Item.findAll({
            where: { status: 'Approved' },
            attributes: ['item_quantity', 'item_price']
        });
        const totalValue = items.reduce((sum, item) => sum + (item.item_quantity * item.item_price), 0);

        res.json({
            totalItems,
            lowStockItems,
            outOfStock,
            totalValue
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /items/:id/stock - Update item quantity
router.put('/items/:id/stock', adminAuth, async (req, res) => {
    try {
        const { quantity, adjustment } = req.body;
        const item = await Item.findByPk(req.params.id);

        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        let newQuantity;
        if (quantity !== undefined) {
            // Set absolute quantity
            newQuantity = parseInt(quantity);
        } else if (adjustment !== undefined) {
            // Relative adjustment (+/-)
            newQuantity = item.item_quantity + parseInt(adjustment);
        } else {
            return res.status(400).json({ error: 'Provide either quantity or adjustment' });
        }

        if (newQuantity < 0) {
            return res.status(400).json({ error: 'Quantity cannot be negative' });
        }

        await item.update({ item_quantity: newQuantity });
        res.json({
            message: 'Stock updated successfully',
            item_id: item.id,
            item_title: item.item_title,
            old_quantity: item.item_quantity - (adjustment || 0),
            new_quantity: newQuantity
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

