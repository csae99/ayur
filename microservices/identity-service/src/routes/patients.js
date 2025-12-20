const express = require('express');
const { Patient } = require('../models');

const router = express.Router();

// GET /patients/:id - Get patient by ID (internal service use)
// This endpoint is used by other services (e.g., order-service) to get user details
router.get('/:id', async (req, res) => {
    try {
        const patient = await Patient.findByPk(req.params.id, {
            attributes: ['id', 'username', 'email', 'phone', 'fname', 'lname', 'address']
        });

        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        res.json(patient);
    } catch (error) {
        console.error('Error fetching patient:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
