const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const practitionerRoutes = require('./routes/practitioners');
const prescriptionRoutes = require('./routes/prescriptions'); // Added prescriptionRoutes

const app = express();
const PORT = process.env.PORT || 3001;

// app.use(cors()); // CORS handled by API Gateway
app.use(express.json());

// Serve static files
const path = require('path');
const fs = require('fs');
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Debug Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (req.method === 'POST') console.log('Body:', JSON.stringify(req.body));
    next();
});

// Routes
// Routes
// Support both direct and gateway-proxied paths
app.use('/auth', authRoutes);
app.use('/api/identity/auth', authRoutes);

app.use('/admin', adminRoutes);
app.use('/api/identity/admin', adminRoutes);

app.use('/practitioners', practitionerRoutes);
app.use('/api/identity/practitioners', practitionerRoutes);

// Internal route for fetching patient details (used by other services)
const patientRoutes = require('./routes/patients');
app.use('/patients', patientRoutes);
app.use('/api/identity/patients', patientRoutes);

try {
    console.log('Mounting /availability routes');
    app.use('/availability', require('./routes/availability'));
    console.log('Mounting /availability routes - DONE');

    console.log('Mounting /appointments routes');
    app.use('/appointments', require('./routes/appointments'));
    console.log('Mounting /appointments routes - DONE');

    console.log('Mounting /prescriptions routes');
    app.use('/prescriptions', prescriptionRoutes);
    console.log('Mounting /prescriptions routes - DONE');
} catch (err) {
    console.error('CRITICAL ERROR MOUNTING ROUTES:', err);
    process.exit(1);
}

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
            await sequelize.sync({ alter: true }); // Ensure tables exist
            console.log('Database connected and synced...');
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
