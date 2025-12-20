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

// ==================== ADMIN MANAGEMENT ====================

const bcrypt = require('bcrypt');

// GET /admins - List all admins
router.get('/admins', adminAuth, async (req, res) => {
    try {
        const admins = await Admin.findAll();

        // Remove passwords
        const adminsData = admins.map(a => {
            const { password, ...data } = a.toJSON();
            return data;
        });

        res.json(adminsData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /admins - Create new admin
router.post('/admins', adminAuth, async (req, res) => {
    try {
        const { username, password, firstname, lastname } = req.body;

        if (!username || !password || !firstname || !lastname) {
            return res.status(400).json({ error: 'All fields are required: username, password, firstname, lastname' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if username already exists
        const existing = await Admin.findOne({ where: { username } });
        if (existing) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const admin = await Admin.create({
            username,
            password: hashedPassword,
            firstname,
            lastname,
            status: 'active'
        });

        const { password: pwd, ...adminData } = admin.toJSON();
        res.status(201).json({ message: 'Admin created successfully', admin: adminData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /admins/:id - Update admin details
router.put('/admins/:id', adminAuth, async (req, res) => {
    try {
        const admin = await Admin.findByPk(req.params.id);

        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' });
        }

        const { firstname, lastname } = req.body;
        const updates = {};

        if (firstname) updates.firstname = firstname;
        if (lastname) updates.lastname = lastname;

        await admin.update(updates);

        const { password, ...adminData } = admin.toJSON();
        res.json({ message: 'Admin updated successfully', admin: adminData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /admins/:id/status - Activate/deactivate admin
router.put('/admins/:id/status', adminAuth, async (req, res) => {
    try {
        const { status } = req.body;

        if (!['active', 'inactive'].includes(status)) {
            return res.status(400).json({ error: 'Status must be "active" or "inactive"' });
        }

        const admin = await Admin.findByPk(req.params.id);

        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' });
        }

        // Prevent self-deactivation (get current user from token)
        const jwt = require('jsonwebtoken');
        const token = req.headers.authorization?.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');

        if (decoded.id === admin.id && status === 'inactive') {
            return res.status(400).json({ error: 'Cannot deactivate your own account' });
        }

        await admin.update({ status });

        const { password, ...adminData } = admin.toJSON();
        res.json({ message: `Admin ${status === 'active' ? 'activated' : 'deactivated'} successfully`, admin: adminData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

