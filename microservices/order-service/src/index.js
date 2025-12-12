const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const orderRoutes = require('./routes/orders');
const appointmentRoutes = require('./routes/appointments');

const app = express();
const PORT = process.env.PORT || 3003;

// app.use(cors()); // CORS handled by API Gateway
app.use(express.json());

// Routes
app.use('/appointments', appointmentRoutes);
app.use('/cart', require('./routes/cart'));
app.use('/checkout', require('./routes/checkout'));
app.use('/coupons', require('./routes/coupons'));
app.use('/wishlist', require('./routes/wishlist'));

// Orders routes (mounted at root as default handler, must be last to avoid capturing other routes)
app.use('/orders', orderRoutes); // Keep for backward compatibility
app.use('/', orderRoutes);

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

            // Sync models with database
            await sequelize.sync({ alter: true });
            console.log('Database models synced...');

            app.listen(PORT, () => {
                console.log(`Order Service running on port ${PORT}`);
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
