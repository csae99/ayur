const express = require('express');
console.log('--- STARTING NEW VERSION V2 ---');
const cors = require('cors');
const sequelize = require('./config/database');
const catalogRoutes = require('./routes/catalog');
const adminRoutes = require('./routes/admin');

const reviewRoutes = require('./routes/reviews');
const translateRoutes = require('./routes/translate');

const app = express();
const PORT = process.env.PORT || 3002;

// app.use(cors()); // CORS handled by API Gateway
app.use(express.json());

// Request logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/', translateRoutes); // Translation with Redis caching
app.use('/', reviewRoutes); // Handles /items/:itemId/reviews directly
app.use('/', catalogRoutes);
app.use('/admin', adminRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP' });
});

// Database Connection and Server Start
const connectWithRetry = async () => {
    const maxRetries = 10;
    let retries = 0;
    while (retries < maxRetries) {
        try {
            await sequelize.authenticate();
            console.log('Database connected...');
            app.listen(PORT, () => {
                console.log(`Catalog Service running on port ${PORT}`);
            });
            return;
        } catch (err) {
            retries++;
            console.error(`Error connecting to database (Attempt ${retries}/${maxRetries}):`, err.message);
            await new Promise(res => setTimeout(res, 5000));
        }
    }
    console.error('Could not connect to database after multiple attempts. Exiting.');
    process.exit(1);
};

connectWithRetry();
