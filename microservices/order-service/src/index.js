const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const orderRoutes = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

// Routes
app.use('/', orderRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP' });
});

// Database Connection and Server Start
sequelize.authenticate()
    .then(() => {
        console.log('Database connected...');
        app.listen(PORT, () => {
            console.log(`Order Service running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Error connecting to database:', err);
    });
