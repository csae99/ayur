const express = require('express');
const { Patient, Practitioner, Admin } = require('../models');
const { adminAuth } = require('../middleware/adminAuth');

const router = express.Router();

// Get admin statistics
router.get('/stats', adminAuth, async (req, res) => {
    try {
        const totalPractitioners = await Practitioner.count();
        const verifiedPractitioners = await Practitioner.count({ where: { verified: true } });
        const pendingPractitioners = await Practitioner.count({ where: { verified: false } });
        const totalPatients = await Patient.count();
        const totalAdmins = await Admin.count();

        res.json({
            totalPractitioners,
            verifiedPractitioners,
            pendingPractitioners,
            totalPatients,
            totalAdmins
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all practitioners (with filters)
router.get('/practitioners', adminAuth, async (req, res) => {
    try {
        const { status, search } = req.query;
        let where = {};

        // Filter by verification status
        if (status === 'pending') {
            where.verified = false;
        } else if (status === 'verified') {
            where.verified = true;
        }
        // 'all' or no status = no filter

        // Search by name, username, or profession
        if (search) {
            const { Op } = require('sequelize');
            where = {
                ...where,
                [Op.or]: [
                    { fname: { [Op.iLike]: `%${search}%` } },
                    { lname: { [Op.iLike]: `%${search}%` } },
                    { username: { [Op.iLike]: `%${search}%` } },
                    { professionality: { [Op.iLike]: `%${search}%` } }
                ]
            };
        }

        const practitioners = await Practitioner.findAll({ where });

        // Remove passwords from response
        const practitionersData = practitioners.map(p => {
            const { password, ...data } = p.toJSON();
            return data;
        });

        res.json(practitionersData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get practitioner by ID
router.get('/practitioners/:id', adminAuth, async (req, res) => {
    try {
        const practitioner = await Practitioner.findByPk(req.params.id);

        if (!practitioner) {
            return res.status(404).json({ error: 'Practitioner not found' });
        }

        const { password, ...practitionerData } = practitioner.toJSON();
        res.json(practitionerData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update practitioner verification status
router.put('/practitioners/:id/verify', adminAuth, async (req, res) => {
    try {
        const { verified } = req.body;

        if (typeof verified !== 'boolean') {
            return res.status(400).json({ error: 'verified must be a boolean' });
        }

        const practitioner = await Practitioner.findByPk(req.params.id);

        if (!practitioner) {
            return res.status(404).json({ error: 'Practitioner not found' });
        }

        await practitioner.update({ verified });

        const { password, ...practitionerData } = practitioner.toJSON();
        res.json(practitionerData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all patients (with search)
router.get('/patients', adminAuth, async (req, res) => {
    try {
        const { search } = req.query;
        let where = {};

        if (search) {
            const { Op } = require('sequelize');
            where = {
                [Op.or]: [
                    { fname: { [Op.iLike]: `%${search}%` } },
                    { lname: { [Op.iLike]: `%${search}%` } },
                    { username: { [Op.iLike]: `%${search}%` } },
                    { email: { [Op.iLike]: `%${search}%` } }
                ]
            };
        }

        const patients = await Patient.findAll({ where });

        // Remove passwords
        const patientsData = patients.map(p => {
            const { password, ...data } = p.toJSON();
            return data;
        });

        res.json(patientsData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
