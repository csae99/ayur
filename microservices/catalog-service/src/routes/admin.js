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

module.exports = router;
