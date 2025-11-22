const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Patient, Practitioner, Admin } = require('../models');

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || 'your_jwt_secret';

// Register Patient
router.post('/register/patient', async (req, res) => {
    try {
        const { username, password, email, ...otherData } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const patient = await Patient.create({
            username,
            password: hashedPassword,
            email,
            ...otherData,
        });
        res.status(201).json({ message: 'Patient registered successfully', patientId: patient.id });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Register Practitioner
router.post('/register/practitioner', async (req, res) => {
    try {
        const { username, password, email, ...otherData } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const practitioner = await Practitioner.create({
            username,
            password: hashedPassword,
            email,
            ...otherData,
        });
        res.status(201).json({ message: 'Practitioner registered successfully', practitionerId: practitioner.id });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password, type } = req.body; // type: 'patient', 'practitioner', 'admin'
        let user;

        if (type === 'patient') {
            user = await Patient.findOne({ where: { username } });
        } else if (type === 'practitioner') {
            user = await Practitioner.findOne({ where: { username } });
        } else if (type === 'admin') {
            user = await Admin.findOne({ where: { username } });
        } else {
            return res.status(400).json({ error: 'Invalid user type' });
        }

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, username: user.username, type }, SECRET_KEY, { expiresIn: '1h' });

        // Remove password and set correct role
        const userData = user.toJSON();
        delete userData.password;  // Remove password
        userData.role = type;       // Override database role with actual type

        res.json({ token, user: userData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Current User (Protected)
router.get('/me', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        res.json({ user: decoded });
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

// Get Practitioner Details (Public/Protected?)
router.get('/practitioner/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const practitioner = await Practitioner.findOne({ where: { username } });
        if (!practitioner) {
            return res.status(404).json({ error: 'Practitioner not found' });
        }
        // Exclude password
        const { password, ...practitionerData } = practitioner.toJSON();
        res.json(practitionerData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
