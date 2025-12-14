const express = require('express');
const { Appointment, Patient, Practitioner } = require('../models');

const router = express.Router();

// Book an appointment (Patient)
router.post('/book', async (req, res) => {
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

        const { practitioner_id, appointment_date, appointment_time, notes } = req.body;

        const appointment = await Appointment.create({
            patient_id: decoded.id, // Assuming token has patient id
            practitioner_id,
            appointment_date,
            appointment_time,
            notes
        });

        res.status(201).json(appointment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get appointments for a practitioner
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

        const appointments = await Appointment.findAll({
            where: { practitioner_id: decoded.id },
            include: [{ model: Patient, attributes: ['fname', 'lname', 'email', 'phone'] }],
            order: [['appointment_date', 'ASC'], ['appointment_time', 'ASC']]
        });

        res.json(appointments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get appointments for a patient
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

        const appointments = await Appointment.findAll({
            where: { patient_id: decoded.id },
            include: [{ model: Practitioner, attributes: ['fname', 'lname', 'office_name', 'professionality'] }],
            order: [['appointment_date', 'ASC'], ['appointment_time', 'ASC']]
        });

        res.json(appointments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update appointment status (Practitioner: Confirm/Cancel, Patient: Cancel)
router.put('/:id/status', async (req, res) => {
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

        const { status } = req.body;
        const appointmentId = req.params.id;

        const appointment = await Appointment.findByPk(appointmentId);
        if (!appointment) return res.status(404).json({ error: 'Appointment not found' });

        // Authorization check
        const userRole = decoded.role || decoded.type;
        let isAuthorized = false;
        if (userRole === 'practitioner' && appointment.practitioner_id === decoded.id) {
            isAuthorized = true;
        } else if (appointment.patient_id === decoded.id) {
            // Patients can only cancel
            if (status.toLowerCase() === 'cancelled') {
                isAuthorized = true;
            } else {
                return res.status(403).json({ error: 'Patients can only cancel appointments' });
            }
        }

        if (!isAuthorized) {
            return res.status(403).json({ error: 'Not authorized to update this appointment' });
        }

        appointment.status = status;
        await appointment.save();

        res.json(appointment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reschedule appointment (Patient only)
router.put('/:id', async (req, res) => {
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

        const { date, time, status } = req.body; // Frontend sends 'date', 'time'
        const appointmentId = req.params.id;

        const appointment = await Appointment.findByPk(appointmentId);
        if (!appointment) return res.status(404).json({ error: 'Appointment not found' });

        // Authorization check: Only patient can reschedule their own appointment
        if (appointment.patient_id !== decoded.id) {
            return res.status(403).json({ error: 'Not authorized to reschedule this appointment' });
        }

        // Update fields
        // Frontend sends 'date', 'time' but DB has 'appointment_date', 'appointment_time'
        if (date) appointment.appointment_date = date;
        if (time) appointment.appointment_time = time;
        if (status) appointment.status = status; // Reset to 'pending'

        await appointment.save();

        res.json(appointment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
