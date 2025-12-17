const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const orderRoutes = require('./routes/orders');
// appointmentRoutes removed

const app = express();
const PORT = process.env.PORT || 3003;

app.use(express.json());

// Request logging for debug
app.use((req, res, next) => {
    console.log(`[OrderService] ${req.method} ${req.url}`);
    next();
});

// Health Check (Top priority)
const healthHandler = (req, res) => res.status(200).json({ status: 'UP' });
app.get('/health', healthHandler);
app.get('/api/orders/health', healthHandler);

// Routes
// Support both direct and gateway-proxied paths
const analyticsRoutes = require('./routes/analytics');
app.use('/analytics', analyticsRoutes);
app.use('/api/orders/analytics', analyticsRoutes);

const cartRoutes = require('./routes/cart');
app.use('/cart', cartRoutes);
app.use('/api/orders/cart', cartRoutes);

const checkoutRoutes = require('./routes/checkout');
app.use('/checkout', checkoutRoutes);
app.use('/api/orders/checkout', checkoutRoutes);

const couponRoutes = require('./routes/coupons');
app.use('/coupons', couponRoutes);
app.use('/api/orders/coupons', couponRoutes);

const wishlistRoutes = require('./routes/wishlist');
app.use('/wishlist', wishlistRoutes);
app.use('/api/orders/wishlist', wishlistRoutes);

// Orders routes (mounted at root as default handler, must be last)
// Also support explicit paths
app.use('/orders', orderRoutes);
app.use('/api/orders', orderRoutes);

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

                // Start scheduled jobs
                require('./jobs/autoDelivery');
                console.log('Scheduled jobs initialized...');
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
