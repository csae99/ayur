const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const practitionerRoutes = require('./routes/practitioners');

const app = express();
const PORT = process.env.PORT || 3001;

// app.use(cors()); // CORS handled by API Gateway
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/practitioners', practitionerRoutes);

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
                console.log(`Identity Service running on port ${PORT}`);
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
