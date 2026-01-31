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

        // Try to get pending edits count, default to 0 if column doesn't exist yet
        let pendingEdits = 0;
        try {
            pendingEdits = await Item.count({ where: { has_pending_edits: true } });
        } catch (e) {
            console.log('has_pending_edits column may not exist yet:', e.message);
        }

        res.json({
            totalMedicines,
            pendingMedicines,
            approvedMedicines,
            rejectedMedicines,
            pendingEdits
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all items (with filters)
router.get('/items', adminAuth, async (req, res) => {
    try {
        const { status, search } = req.query;
        const { Op } = require('sequelize');
        let where = {};
        let usePendingEditsFilter = false;

        // Filter by status
        if (status && status !== 'all') {
            if (status === 'PendingEdits') {
                // Special filter for items with pending edits
                usePendingEditsFilter = true;
                where.has_pending_edits = true;
            } else {
                where.status = status;
            }
        }

        // Search by title, brand, or category
        if (search) {
            where = {
                ...where,
                [Op.or]: [
                    { item_title: { [Op.iLike]: `%${search}%` } },
                    { item_brand: { [Op.iLike]: `%${search}%` } },
                    { item_cat: { [Op.iLike]: `%${search}%` } }
                ]
            };
        }

        let items;
        try {
            items = await Item.findAll({ where });
        } catch (error) {
            // If has_pending_edits column doesn't exist, return empty array for that filter
            if (usePendingEditsFilter && error.message.includes('has_pending_edits')) {
                items = [];
            } else {
                throw error;
            }
        }
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

// ==================== PENDING EDITS MANAGEMENT ====================

// GET /pending-edits - Get all items with pending edits
router.get('/pending-edits', adminAuth, async (req, res) => {
    try {
        const items = await Item.findAll({
            where: { has_pending_edits: true },
            order: [['id', 'DESC']]
        });
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /pending-edits/:id/approve - Approve pending edits (merge into main fields)
router.put('/pending-edits/:id/approve', adminAuth, async (req, res) => {
    try {
        const item = await Item.findByPk(req.params.id);

        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        if (!item.has_pending_edits || !item.pending_edits) {
            return res.status(400).json({ error: 'No pending edits to approve' });
        }

        const pendingEdits = item.pending_edits;

        // Merge pending edits into main fields
        await item.update({
            item_title: pendingEdits.item_title || item.item_title,
            item_brand: pendingEdits.item_brand || item.item_brand,
            item_cat: pendingEdits.item_cat || item.item_cat,
            item_price: pendingEdits.item_price || item.item_price,
            item_quantity: pendingEdits.item_quantity !== undefined ? pendingEdits.item_quantity : item.item_quantity,
            item_details: pendingEdits.item_details || item.item_details,
            item_tags: pendingEdits.item_tags || item.item_tags,
            // Clear pending edits
            pending_edits: null,
            has_pending_edits: false
        });

        res.json({
            message: 'Pending edits approved and applied successfully',
            item
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /pending-edits/:id/reject - Reject pending edits (discard them)
router.put('/pending-edits/:id/reject', adminAuth, async (req, res) => {
    try {
        const item = await Item.findByPk(req.params.id);

        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        if (!item.has_pending_edits) {
            return res.status(400).json({ error: 'No pending edits to reject' });
        }

        // Clear pending edits without applying them
        await item.update({
            pending_edits: null,
            has_pending_edits: false
        });

        res.json({
            message: 'Pending edits rejected and discarded',
            item
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
