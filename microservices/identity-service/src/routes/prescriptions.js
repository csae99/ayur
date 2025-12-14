const express = require('express');
const { Prescription, Patient, Practitioner } = require('../models');

const router = express.Router();

// Create a prescription (Practitioner only)
router.post('/', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'No token provided' });

        const jwt = require('jsonwebtoken');
        const SECRET_KEY = process.env.JWT_SECRET || 'your_jwt_secret';

        let decoded;
        try {
            decoded = jwt.verify(token, SECRET_KEY);
        } catch (err) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const userRole = decoded.role || decoded.type;
        if (userRole !== 'practitioner') {
            return res.status(403).json({ error: 'Access denied: Only practitioners can write prescriptions' });
        }

        const { patient_id, medicines, notes } = req.body;

        if (!patient_id || !medicines) {
            return res.status(400).json({ error: 'Patient ID and Medicines are required' });
        }

        const prescription = await Prescription.create({
            practitioner_id: decoded.id,
            patient_id,
            medicines,
            notes
        });

        res.status(201).json(prescription);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get prescriptions for a patient (Logged in patient)
router.get('/patient', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'No token provided' });

        const jwt = require('jsonwebtoken');
        const SECRET_KEY = process.env.JWT_SECRET || 'your_jwt_secret';

        let decoded;
        try {
            decoded = jwt.verify(token, SECRET_KEY);
        } catch (err) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const prescriptions = await Prescription.findAll({
            where: { patient_id: decoded.id },
            include: [
                { model: Practitioner, attributes: ['fname', 'lname', 'office_name'] }
            ],
            order: [['created_at', 'DESC']]
        });

        res.json(prescriptions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get prescriptions written by a practitioner
router.get('/practitioner', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'No token provided' });

        const jwt = require('jsonwebtoken');
        const SECRET_KEY = process.env.JWT_SECRET || 'your_jwt_secret';

        let decoded;
        try {
            decoded = jwt.verify(token, SECRET_KEY);
        } catch (err) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const userRole = decoded.role || decoded.type;
        if (userRole !== 'practitioner') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const prescriptions = await Prescription.findAll({
            where: { practitioner_id: decoded.id },
            include: [
                { model: Patient, attributes: ['fname', 'lname', 'email'] }
            ],
            order: [['created_at', 'DESC']]
        });

        res.json(prescriptions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
