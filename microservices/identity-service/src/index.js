const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP' });
});

// Database Connection and Server Start
sequelize.authenticate()
    .then(() => {
        console.log('Database connected...');
        app.listen(PORT, () => {
            console.log(`Identity Service running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Error connecting to database:', err);
    });
