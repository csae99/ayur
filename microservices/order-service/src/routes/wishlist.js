const express = require('express');
const router = express.Router();
const { Wishlist } = require('../models');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

// Middleware
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};

// GET /wishlist - Get all wishlist items for user
router.get('/', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const wishlistItems = await Wishlist.findAll({
            where: { user_id: userId }
        });
        // Return only item_ids, frontend will fetch details
        res.json(wishlistItems.map(w => w.item_id));
    } catch (error) {
        console.error('Error fetching wishlist:', error);
        res.status(500).json({ error: 'Failed to fetch wishlist' });
    }
});

// POST /wishlist - Add item
router.post('/', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { item_id } = req.body;

        if (!item_id) return res.status(400).json({ error: 'Item ID required' });

        const [item, created] = await Wishlist.findOrCreate({
            where: { user_id: userId, item_id },
            defaults: { user_id: userId, item_id }
        });

        if (created) {
            res.status(201).json(item);
        } else {
            res.json(item); // Already exists
        }
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        res.status(500).json({ error: 'Failed to add to wishlist' });
    }
});

// DELETE /wishlist/:itemId - Remove item
router.delete('/:itemId', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { itemId } = req.params;

        const deleted = await Wishlist.destroy({
            where: { user_id: userId, item_id: itemId }
        });

        if (deleted) {
            res.json({ message: 'Removed from wishlist' });
        } else {
            res.status(404).json({ error: 'Item not found in wishlist' });
        }
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        res.status(500).json({ error: 'Failed to remove from wishlist' });
    }
});

module.exports = router;
