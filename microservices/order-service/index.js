const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3003;

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.POSTGRES_USER || 'user',
    password: process.env.POSTGRES_PASSWORD || 'password',
    database: process.env.POSTGRES_DB || 'ayur_db',
    port: 5432,
});

app.get('/', (req, res) => {
    res.json({ service: 'Order Service', status: 'Active' });
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
    console.log(`Order Service running on port ${port}`);
});
