const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3001;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.POSTGRES_USER || 'user',
  password: process.env.POSTGRES_PASSWORD || 'password',
  database: process.env.POSTGRES_DB || 'ayur_db',
  port: 5432,
});

app.get('/', (req, res) => {
  res.json({ service: 'Identity Service', status: 'Active' });
});

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT NOW()');
    res.json({ status: 'UP', db: 'Connected' });
  } catch (err) {
    res.status(500).json({ status: 'DOWN', db: err.message });
  }
});

app.get('/auth/practitioner/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const result = await pool.query('SELECT * FROM practitioners WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Practitioner not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Identity Service running on port ${port}`);
});
