const express = require('express');
const { Item } = require('../models');

const router = express.Router();

// Get all items
router.get('/items', async (req, res) => {
    try {
        const items = await Item.findAll();
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get items by practitioner username (MUST come before /items/:id)
router.get('/items/practitioner/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const items = await Item.findAll({ where: { added_by: username } });
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get item by ID
router.get('/items/:id', async (req, res) => {
    try {
        const item = await Item.findByPk(req.params.id);
        if (!item) return res.status(404).json({ error: 'Item not found' });
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add new item
router.post('/items', async (req, res) => {
    try {
        const item = await Item.create(req.body);
        res.status(201).json(item);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update item
router.put('/items/:id', async (req, res) => {
    try {
        const item = await Item.findByPk(req.params.id);
        if (!item) return res.status(404).json({ error: 'Item not found' });
        await item.update(req.body);
        res.json(item);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete item
router.delete('/items/:id', async (req, res) => {
    try {
        const item = await Item.findByPk(req.params.id);
        if (!item) return res.status(404).json({ error: 'Item not found' });
        await item.destroy();
        res.json({ message: 'Item deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
