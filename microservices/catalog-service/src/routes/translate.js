/**
 * Translation Routes with Redis Caching
 * Proxies translation requests to LibreTranslate with Redis caching
 */

const express = require('express');
const router = express.Router();
const Redis = require('ioredis');

// Initialize Redis client
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new Redis(redisUrl);

const LIBRETRANSLATE_URL = process.env.LIBRETRANSLATE_URL || 'http://libretranslate:5000';
const CACHE_TTL = 60 * 60 * 24 * 7; // 7 days in seconds

// Test Redis connection
redis.on('connect', () => {
    console.log('✅ Connected to Redis for translation caching');
});

redis.on('error', (err) => {
    console.error('❌ Redis connection error:', err.message);
});

/**
 * POST /translate
 * Translates text with Redis caching
 */
router.post('/translate', async (req, res) => {
    try {
        const { q, source = 'en', target, format = 'text' } = req.body;

        if (!q || !target) {
            return res.status(400).json({ error: 'Missing required fields: q, target' });
        }

        // Create cache key
        const cacheKey = `translate:${source}:${target}:${q}`;

        // Check cache first
        try {
            const cached = await redis.get(cacheKey);
            if (cached) {
                console.log(`📦 Cache HIT: ${cacheKey.substring(0, 50)}...`);
                return res.json({ translatedText: cached, cached: true });
            }
        } catch (cacheErr) {
            console.error('Cache read error:', cacheErr.message);
            // Continue without cache
        }

        console.log(`🔄 Cache MISS: ${cacheKey.substring(0, 50)}... - calling LibreTranslate`);

        // Call LibreTranslate
        const response = await fetch(`${LIBRETRANSLATE_URL}/translate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ q, source, target, format })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('LibreTranslate error:', errorText);
            return res.status(response.status).json({ error: 'Translation service error' });
        }

        const data = await response.json();
        const translatedText = data.translatedText;

        // Cache the result
        try {
            await redis.setex(cacheKey, CACHE_TTL, translatedText);
            console.log(`💾 Cached translation: ${cacheKey.substring(0, 50)}...`);
        } catch (cacheErr) {
            console.error('Cache write error:', cacheErr.message);
        }

        res.json({ translatedText, cached: false });

    } catch (error) {
        console.error('Translation error:', error);
        res.status(500).json({ error: 'Translation failed' });
    }
});

/**
 * GET /translate/stats
 * Returns cache statistics
 */
router.get('/translate/stats', async (req, res) => {
    try {
        const keys = await redis.keys('translate:*');
        const info = await redis.info('memory');

        res.json({
            cachedTranslations: keys.length,
            memoryInfo: info.split('\n').filter(line => line.startsWith('used_memory_human')).join('')
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get stats' });
    }
});

/**
 * DELETE /translate/cache
 * Clears translation cache
 */
router.delete('/translate/cache', async (req, res) => {
    try {
        const keys = await redis.keys('translate:*');
        if (keys.length > 0) {
            await redis.del(...keys);
        }
        res.json({ message: `Cleared ${keys.length} cached translations` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to clear cache' });
    }
});

module.exports = router;
