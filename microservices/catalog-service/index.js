const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3002;

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.POSTGRES_USER || 'user',
    password: process.env.POSTGRES_PASSWORD || 'password',
    database: process.env.POSTGRES_DB || 'ayur_db',
    port: 5432,
});

app.get('/', (req, res) => {
    res.json({ service: 'Catalog Service', status: 'Active' });
});

app.get('/items', async (req, res) => {
    try {
        const { search } = req.query;
        let queryText = 'SELECT * FROM items';
        let queryParams = [];

        if (search) {
            queryText += ' WHERE item_title ILIKE $1 OR item_tags ILIKE $1';
            queryParams.push(`%${search}%`);
        }

        const result = await pool.query(queryText, queryParams);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/items/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM items WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/items/practitioner/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const result = await pool.query('SELECT * FROM items WHERE added_by = $1', [username]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/items', async (req, res) => {
    try {
        const { item_title, item_brand, item_cat, item_details, item_tags, item_image, item_quantity, item_price, added_by } = req.body;
        const result = await pool.query(
            'INSERT INTO items (item_title, item_brand, item_cat, item_details, item_tags, item_image, item_quantity, item_price, added_by, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
            [item_title, item_brand, item_cat, item_details, item_tags, item_image, item_quantity, item_price, added_by, 'Pending']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/items/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { item_title, item_brand, item_cat, item_details, item_tags, item_image, item_quantity, item_price, status } = req.body;

        const result = await pool.query(
            'UPDATE items SET item_title=$1, item_brand=$2, item_cat=$3, item_details=$4, item_tags=$5, item_image=$6, item_quantity=$7, item_price=$8, status=$9 WHERE id=$10 RETURNING *',
            [item_title, item_brand, item_cat, item_details, item_tags, item_image, item_quantity, item_price, status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/health', async (req, res) => {
    try {
        await pool.query('SELECT NOW()');
        res.json({ status: 'UP', db: 'Connected' });
    } catch (err) {
        res.status(500).json({ status: 'DOWN', db: err.message });
    }
});

app.listen(port, () => {
    console.log(`Catalog Service running on port ${port}`);
});
