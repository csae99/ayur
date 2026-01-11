const express = require('express');
const { Item } = require('../models');

const router = express.Router();

// Get all items
// Get all items with filtering
router.get('/items', async (req, res) => {
    try {
        const { q, category, min_price, max_price } = req.query;
        const { Op } = require('sequelize');
        const where = { status: 'Approved' };

        if (q) {
            // Case-insensitive search for title
            where.item_title = { [Op.iLike]: `%${q}%` };
        }

        if (category && category !== 'All') {
            where.item_cat = { [Op.iLike]: category };
        }

        if (min_price || max_price) {
            where.item_price = {};
            if (min_price) where.item_price[Op.gte] = parseFloat(min_price);
            if (max_price) where.item_price[Op.lte] = parseFloat(max_price);
        }

        const items = await Item.findAll({ where });
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
        if (!item || item.status !== 'Approved') return res.status(404).json({ error: 'Item not found' });
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Configure Multer for memory storage (S3 upload)
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// S3 Client Configuration
const s3Client = new S3Client({
    region: process.env.S3_REGION,
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY
    },
    forcePathStyle: true
});

// Upload Images Route
router.post('/upload', upload.array('images', 5), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const bucketName = process.env.S3_BUCKET_NAME;
        const uploadPromises = req.files.map(async (file) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const filename = 'med-' + uniqueSuffix + path.extname(file.originalname);

            const command = new PutObjectCommand({
                Bucket: bucketName,
                Key: filename,
                Body: file.buffer,
                ContentType: file.mimetype,
                ACL: 'public-read'
            });

            await s3Client.send(command);

            const projectId = 'mdbkdbfztsfhzfjhlper';
            return `https://${projectId}.supabase.co/storage/v1/object/public/${bucketName}/${filename}`;
        });

        const urls = await Promise.all(uploadPromises);
        res.json({ urls });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: 'Failed to upload images: ' + error.message });
    }
});

// Add new item
router.post('/items', async (req, res) => {
    try {
        // item_image will be a JSON string of URLs
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

// Delete item (Protected: Only owner can delete)
router.delete('/items/:id', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'No token provided' });

        const jwt = require('jsonwebtoken');
        const SECRET_KEY = process.env.JWT_SECRET || 'your_jwt_secret';

        let decoded;
        try {
            decoded = jwt.verify(token, SECRET_KEY);
        } catch (err) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const item = await Item.findByPk(req.params.id);
        if (!item) return res.status(404).json({ error: 'Item not found' });

        // Check ownership
        // Allow admin to delete any item, or practitioner to delete their own
        if (decoded.type !== 'admin' && item.added_by !== decoded.username) {
            return res.status(403).json({ error: 'You can only delete items you added' });
        }

        await item.destroy();
        res.json({ message: 'Item deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
