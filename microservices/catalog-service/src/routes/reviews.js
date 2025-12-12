const express = require('express');
const router = express.Router();
const { Item, Review } = require('../models');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

// Middleware to verify token for adding reviews
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Invalid token format' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token' });
        req.user = user;
        next();
    });
};

// GET /items/:itemId/reviews - Get all reviews for an item
router.get('/items/:itemId/reviews', async (req, res) => {
    try {
        const { itemId } = req.params;
        const reviews = await Review.findAll({
            where: { item_id: itemId },
            order: [['created_at', 'DESC']]
        });

        // Calculate average
        const count = reviews.length;
        const average = count > 0
            ? (reviews.reduce((sum, rev) => sum + rev.rating, 0) / count).toFixed(1)
            : 0;

        res.json({ reviews, average, count });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

// POST /items/:itemId/reviews - Add a review
router.post('/items/:itemId/reviews', verifyToken, async (req, res) => {
    try {
        const { itemId } = req.params;
        const { rating, comment, userName } = req.body;
        const userId = req.user.id;

        // Check if item exists
        const item = await Item.findByPk(itemId);
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        // Check if user already reviewed (optional logic, keeping simple for now)
        const existingReview = await Review.findOne({
            where: { item_id: itemId, user_id: userId }
        });

        if (existingReview) {
            return res.status(400).json({ error: 'You have already reviewed this item' });
        }

        const newReview = await Review.create({
            item_id: itemId,
            user_id: userId,
            user_name: userName || req.user.username || 'Anonymous', // Fallback
            rating,
            comment
        });

        res.status(201).json(newReview);
    } catch (error) {
        console.error('Error adding review:', error);
        res.status(500).json({ error: 'Failed to add review' });
    }
});

module.exports = router;
