const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Patient, Practitioner, Admin, RefreshToken } = require('../models');

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || 'your_jwt_secret';
const ACCESS_TOKEN_EXPIRY = '1h';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

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
        const { username, password, type, rememberMe } = req.body;
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

        const token = jwt.sign({ id: user.id, username: user.username, type }, SECRET_KEY, { expiresIn: ACCESS_TOKEN_EXPIRY });

        // Remove password and set correct role
        const userData = user.toJSON();
        delete userData.password;
        userData.role = type;

        const response = { token, user: userData };

        // Generate refresh token if "Remember Me" is checked
        if (rememberMe) {
            try {
                const refreshTokenValue = crypto.randomBytes(64).toString('hex');
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

                await RefreshToken.create({
                    user_id: user.id,
                    user_type: type,
                    token: refreshTokenValue,
                    expires_at: expiresAt
                });

                response.refreshToken = refreshTokenValue;
                response.refreshTokenExpiresAt = expiresAt;
            } catch (refreshError) {
                console.error('Failed to create refresh token:', refreshError);
                // Continue without refresh token
            }
        }

        res.json(response);
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Refresh Token
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token required' });
        }

        const tokenRecord = await RefreshToken.findOne({ where: { token: refreshToken } });

        if (!tokenRecord) {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }

        if (new Date() > new Date(tokenRecord.expires_at)) {
            await tokenRecord.destroy();
            return res.status(401).json({ error: 'Refresh token expired' });
        }

        let user;
        if (tokenRecord.user_type === 'patient') {
            user = await Patient.findByPk(tokenRecord.user_id);
        } else if (tokenRecord.user_type === 'practitioner') {
            user = await Practitioner.findByPk(tokenRecord.user_id);
        } else if (tokenRecord.user_type === 'admin') {
            user = await Admin.findByPk(tokenRecord.user_id);
        }

        if (!user) {
            await tokenRecord.destroy();
            return res.status(401).json({ error: 'User not found' });
        }

        const accessToken = jwt.sign(
            { id: user.id, username: user.username, type: tokenRecord.user_type },
            SECRET_KEY,
            { expiresIn: ACCESS_TOKEN_EXPIRY }
        );

        const userData = user.toJSON();
        delete userData.password;
        userData.role = tokenRecord.user_type;

        res.json({ token: accessToken, user: userData });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Logout
router.post('/logout', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (refreshToken) {
            await RefreshToken.destroy({ where: { token: refreshToken } });
        }
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Current User
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

// Get Practitioner Details
router.get('/practitioner/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const practitioner = await Practitioner.findOne({ where: { username } });
        if (!practitioner) {
            return res.status(404).json({ error: 'Practitioner not found' });
        }
        const { password, ...practitionerData } = practitioner.toJSON();
        res.json(practitionerData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== PROFILE MANAGEMENT ====================

// Middleware to get current user from token
const getCurrentUser = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.currentUser = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// GET /profile - Get current user's full profile
router.get('/profile', getCurrentUser, async (req, res) => {
    try {
        const { id, type } = req.currentUser;
        let user;

        if (type === 'patient') {
            user = await Patient.findByPk(id);
        } else if (type === 'practitioner') {
            user = await Practitioner.findByPk(id);
        } else if (type === 'admin') {
            user = await Admin.findByPk(id);
        }

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { password, ...userData } = user.toJSON();
        userData.role = type;
        res.json(userData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /profile - Update current user's profile
router.put('/profile', getCurrentUser, async (req, res) => {
    try {
        const { id, type } = req.currentUser;
        let user;
        let allowedFields;

        if (type === 'patient') {
            user = await Patient.findByPk(id);
            allowedFields = ['fname', 'lname', 'phone', 'address', 'email', 'profile'];
        } else if (type === 'practitioner') {
            user = await Practitioner.findByPk(id);
            allowedFields = ['fname', 'lname', 'phone', 'office_name', 'address', 'bio', 'facebook', 'twitter', 'email', 'profile'];
        } else if (type === 'admin') {
            user = await Admin.findByPk(id);
            allowedFields = ['firstname', 'lastname'];
        }

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Filter to only allowed fields
        const updates = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        await user.update(updates);

        const { password, ...userData } = user.toJSON();
        userData.role = type;
        res.json({ message: 'Profile updated successfully', user: userData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /profile/password - Change password
router.put('/profile/password', getCurrentUser, async (req, res) => {
    try {
        const { id, type } = req.currentUser;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters' });
        }

        let user;
        if (type === 'patient') {
            user = await Patient.findByPk(id);
        } else if (type === 'practitioner') {
            user = await Practitioner.findByPk(id);
        } else if (type === 'admin') {
            user = await Admin.findByPk(id);
        }

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Hash and update new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await user.update({ password: hashedPassword });

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

