const express = require('express');
const { Appointment } = require('../models');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Book an appointment
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { practitioner_id, date, time, notes } = req.body;
        const patient_id = req.user.id;

        const appointment = await Appointment.create({
            patient_id,
            practitioner_id,
            date,
            time,
            notes,
            status: 'Pending'
        });

        res.status(201).json(appointment);
    } catch (error) {
        console.error('Error booking appointment:', error);
        res.status(500).json({ error: 'Failed to book appointment' });
    }
});

// Get appointments for a patient
router.get('/patient', authMiddleware, async (req, res) => {
    try {
        const patient_id = req.user.id;
        const appointments = await Appointment.findAll({
            where: { patient_id },
            order: [['date', 'DESC'], ['time', 'DESC']]
        });
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch appointments' });
    }
});

// Get appointments for a practitioner
router.get('/practitioner', authMiddleware, async (req, res) => {
    try {
        const practitioner_id = req.user.id;
        const appointments = await Appointment.findAll({
            where: { practitioner_id },
            order: [['date', 'ASC'], ['time', 'ASC']]
        });
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch appointments' });
    }
});

// Update appointment status (For practitioners: Accept/Reject, For patients: Cancel)
router.put('/:id/status', authMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        const appointment = await Appointment.findByPk(req.params.id);

        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        await appointment.update({ status });
        res.json(appointment);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update appointment' });
    }
});

// Reschedule appointment (Update date/time) - MUST come after /:id/status
router.put('/:id', authMiddleware, async (req, res) => {
    console.log('=== RESCHEDULE ROUTE HIT ===');
    console.log('ID:', req.params.id);
    console.log('Body:', req.body);
    console.log('User:', req.user);

    try {
        const { date, time, status } = req.body;
        const appointment = await Appointment.findByPk(req.params.id);

        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        if (appointment.patient_id !== req.user.id) {
            return res.status(403).json({ error: 'You can only reschedule your own appointments' });
        }

        await appointment.update({ date, time, status: status || 'Pending' });
        res.json(appointment);
    } catch (error) {
        console.error('Reschedule error:', error);
        res.status(500).json({ error: 'Failed to reschedule appointment' });
    }
});

module.exports = router;
