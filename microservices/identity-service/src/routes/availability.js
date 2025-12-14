const express = require('express');
const { Availability, Practitioner, Appointment } = require('../models');

const router = express.Router();

// Get available slots for a specific date
router.get('/:practitionerId/slots', async (req, res) => {
    try {
        const { practitionerId } = req.params;
        const { date } = req.query; // YYYY-MM-DD

        if (!date) return res.status(400).json({ error: 'Date is required' });

        const searchDate = new Date(date);
        const dayOfWeek = searchDate.toLocaleDateString('en-US', { weekday: 'long' }); // 'Monday'

        // 1. Get Schedule
        const schedule = await Availability.findOne({
            where: { practitioner_id: practitionerId, day_of_week: dayOfWeek }
        });

        if (!schedule || !schedule.is_available) {
            return res.json([]); // No availability for this day
        }

        // 2. Get Bookings
        const bookings = await Appointment.findAll({
            where: { practitioner_id: practitionerId, appointment_date: date }
        });
        const bookedTimes = bookings.map(b => b.appointment_time.substring(0, 5)); // HH:mm

        // 3. Generate Slots (Hourly)
        const slots = [];
        let current = new Date(`${date}T${schedule.start_time}`);
        const end = new Date(`${date}T${schedule.end_time}`);

        while (current < end) {
            const timeString = current.toTimeString().substring(0, 5); // HH:mm

            // Basic conflict check
            if (!bookedTimes.includes(timeString)) {
                slots.push(timeString);
            }

            // Increment by 1 hour
            current.setHours(current.getHours() + 1);
        }

        res.json(slots);
    } catch (error) {
        console.error('Error fetching slots:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get availability configuration (existing)
router.get('/:practitionerId', async (req, res) => {
    try {
        const { practitionerId } = req.params;
        const availabilities = await Availability.findAll({
            where: { practitioner_id: practitionerId }
        });
        res.json(availabilities);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Set/Update availability (Clear previous and add new)
router.post('/', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'No token provided' });

        const jwt = require('jsonwebtoken');
        const SECRET_KEY = process.env.JWT_SECRET || 'your_jwt_secret';

        let decoded;
        try {
            decoded = jwt.verify(token, SECRET_KEY);
            console.log('Available Route Decoded Token:', JSON.stringify(decoded));
        } catch (err) {
            console.error('Token verification failed:', err.message);
            return res.status(401).json({ error: 'Invalid token' });
        }

        const userRole = decoded.role || decoded.type;
        console.log('User Role:', userRole);
        if (userRole !== 'practitioner' && userRole !== 'admin') {
            return res.status(403).json({ error: 'Only practitioners can set availability' });
        }

        // If practitioner, ensure they are setting their own
        const practitionerId = decoded.id; // Assuming token has id

        // Data should be an array of slots
        // body: { slots: [{ day_of_week: 'Monday', start_time: '10:00', end_time: '12:00' }, ...] }
        const { slots } = req.body;

        if (!Array.isArray(slots)) {
            return res.status(400).json({ error: 'Slots must be an array' });
        }

        // Transactional update: Delete all existing for this practitioner and insert new
        // Note: In a real app, might update diffs, but this is simpler
        await Availability.destroy({ where: { practitioner_id: practitionerId } });

        const newSlots = slots.map(slot => ({
            ...slot,
            practitioner_id: practitionerId
        }));

        await Availability.bulkCreate(newSlots);

        res.json({ message: 'Availability updated successfully' });
    } catch (error) {
        console.error('Error saving availability:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
