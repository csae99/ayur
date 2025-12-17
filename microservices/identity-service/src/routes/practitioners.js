const express = require('express');
const { Practitioner, Appointment, Prescription, Patient } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Get Practitioner Analytics (Authenticated)
router.get('/stats', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'No token provided' });

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

        const practitionerId = decoded.id;

        // 1. Total Appointments
        const totalAppointments = await Appointment.count({
            where: { practitioner_id: practitionerId }
        });

        // 2. Pending Appointments
        const pendingAppointments = await Appointment.count({
            where: {
                practitioner_id: practitionerId,
                status: 'pending'
            }
        });

        // 3. Total Prescriptions
        const totalPrescriptions = await Prescription.count({
            where: { practitioner_id: practitionerId }
        });

        // 4. Total Unique Patients
        // Patients can come from Appointments OR Prescriptions
        const appointmentPatients = await Appointment.findAll({
            where: { practitioner_id: practitionerId },
            attributes: ['patient_id'],
            group: ['patient_id']
        });

        const prescriptionPatients = await Prescription.findAll({
            where: { practitioner_id: practitionerId },
            attributes: ['patient_id'],
            group: ['patient_id']
        });

        const uniquePatientIds = new Set([
            ...appointmentPatients.map(a => a.patient_id).filter(id => id),
            ...prescriptionPatients.map(p => p.patient_id).filter(id => id)
        ]);
        const totalPatients = uniquePatientIds.size;

        // 5. Appointments Last 7 Days (for Chart)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const appointmentsLast7Days = await Appointment.findAll({
            where: {
                practitioner_id: practitionerId,
                appointment_date: {
                    [Op.gte]: sevenDaysAgo
                }
            },
            attributes: [
                'appointment_date',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['appointment_date'],
            order: [['appointment_date', 'ASC']],
            raw: true
        });

        res.json({
            totalAppointments,
            pendingAppointments,
            totalPrescriptions,
            totalPatients,
            appointmentsLast7Days
        });

    } catch (error) {
        console.error('Error fetching practitioner stats:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all verified practitioners (Public)
router.get('/public', async (req, res) => {
    try {
        const practitioners = await Practitioner.findAll({
            where: { verified: true },
            attributes: [
                'id', 'fname', 'lname', 'email', 'phone',
                'office_name', 'address', 'profile',
                'professionality', 'bio', 'facebook', 'twitter'
            ]
        });
        res.json(practitioners);
    } catch (error) {
        console.error('Error fetching practitioners:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get specific practitioner details (Public)
router.get('/public/:id', async (req, res) => {
    try {
        const practitioner = await Practitioner.findOne({
            where: {
                id: req.params.id,
                verified: true
            },
            attributes: [
                'id', 'fname', 'lname', 'email', 'phone',
                'office_name', 'address', 'profile',
                'professionality', 'bio', 'facebook', 'twitter'
            ]
        });

        if (!practitioner) {
            return res.status(404).json({ error: 'Practitioner not found' });
        }

        res.json(practitioner);
    } catch (error) {
        console.error('Error fetching practitioner:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
