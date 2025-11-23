const express = require('express');
const { Practitioner } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

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
