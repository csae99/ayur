const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const catalogRoutes = require('./routes/catalog');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// Routes
app.use('/', catalogRoutes);
app.use('/admin', adminRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP' });
});

// Database Connection and Server Start
sequelize.authenticate()
    .then(() => {
        console.log('Database connected...');
        app.listen(PORT, () => {
            console.log(`Catalog Service running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Error connecting to database:', err);
    });
