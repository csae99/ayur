const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Patient, Practitioner, Admin, RefreshToken, PasswordResetToken } = require('../models');

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || 'your_jwt_secret';
const ACCESS_TOKEN_EXPIRY = '1h';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

// Configure Multer for memory storage (S3 upload)
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// S3 Client Configuration
const s3Client = new S3Client({
    region: process.env.S3_REGION,
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY
    },
    forcePathStyle: true
});

// Upload Document Route
router.post('/upload-document', upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const bucketName = process.env.S3_BUCKET_NAME;
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = 'doc-' + uniqueSuffix + path.extname(req.file.originalname);

        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: filename,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
            ACL: 'public-read'
        });

        await s3Client.send(command);

        // Construct Public URL
        // Endpoint: https://mdbkdbfztsfhzfjhlper.storage.supabase.co/storage/v1/s3
        // Public URL format: https://mdbkdbfztsfhzfjhlper.supabase.co/storage/v1/object/public/<bucket>/<key>

        // Extract project ID from endpoint for URL construction
        // or rely on env var if we had one, but extraction is safe given the known format.
        const projectId = 'mdbkdbfztsfhzfjhlper';
        const publicUrl = `https://${projectId}.supabase.co/storage/v1/object/public/${bucketName}/${filename}`;

        res.json({ url: publicUrl });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: 'Failed to upload document: ' + error.message });
    }
});

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

        // Send welcome email
        if (email) {
            const axios = require('axios');
            try {
                await axios.post('http://notification-service:3004/send-email', {
                    to: email,
                    subject: '🌿 Welcome to Ayurveda Platform!',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <div style="background: linear-gradient(135deg, #15803d 0%, #166534 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                                <h1>🌿 Welcome to Ayurveda!</h1>
                                <p>Your wellness journey begins here</p>
                            </div>
                            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                                <p>Dear <strong>${otherData.fname || username}</strong>,</p>
                                <p>Thank you for registering as a <strong>Patient</strong> on Ayurveda Platform! We're thrilled to have you on board.</p>
                                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                    <h3>What you can do:</h3>
                                    <ul style="line-height: 2;">
                                        <li>🧴 Browse authentic Ayurvedic medicines</li>
                                        <li>👨‍⚕️ Connect with certified practitioners</li>
                                        <li>📅 Book appointments online</li>
                                        <li>🤖 Chat with AyurBot for wellness advice</li>
                                        <li>🛒 Order medicines with home delivery</li>
                                    </ul>
                                </div>
                                <center>
                                    <a href="#" style="display: inline-block; background: #15803d; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Get Started</a>
                                </center>
                                <div style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px;">
                                    <p>Questions? Contact us at support@ayurveda.com</p>
                                    <p>&copy; 2025 Ayurveda Platform. All rights reserved.</p>
                                </div>
                            </div>
                        </div>
                    `
                });
            } catch (emailError) {
                console.error('Failed to send welcome email:', emailError.message);
            }
        }

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

        // Send welcome email
        if (email) {
            const axios = require('axios');
            try {
                await axios.post('http://notification-service:3004/send-email', {
                    to: email,
                    subject: '🌿 Welcome to Ayurveda Platform - Practitioner!',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <div style="background: linear-gradient(135deg, #15803d 0%, #166534 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                                <h1>🌿 Welcome, Practitioner!</h1>
                                <p>You're now part of the Ayurveda Platform</p>
                            </div>
                            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                                <p>Dear <strong>Dr. ${otherData.fname || username}</strong>,</p>
                                <p>Thank you for registering as a <strong>Practitioner</strong> on Ayurveda Platform! We're honored to have you join our community of certified practitioners.</p>
                                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                    <h3>What you can do:</h3>
                                    <ul style="line-height: 2;">
                                        <li>💊 Add and manage your medicines catalog</li>
                                        <li>📅 Set your availability and manage appointments</li>
                                        <li>📋 Create and send prescriptions to patients</li>
                                        <li>📊 View analytics on your practice performance</li>
                                        <li>📦 Track and manage patient orders</li>
                                    </ul>
                                </div>
                                <center>
                                    <a href="#" style="display: inline-block; background: #15803d; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Set Up Your Profile</a>
                                </center>
                                <div style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px;">
                                    <p>Questions? Contact us at support@ayurveda.com</p>
                                    <p>&copy; 2025 Ayurveda Platform. All rights reserved.</p>
                                </div>
                            </div>
                        </div>
                    `
                });
            } catch (emailError) {
                console.error('Failed to send welcome email:', emailError.message);
            }
        }

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
            allowedFields = ['fname', 'lname', 'phone', 'office_name', 'address', 'bio', 'facebook', 'twitter', 'email', 'profile', 'nida', 'license'];
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

// Forgot Password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email, type } = req.body;
        let user;

        if (type === 'patient') {
            user = await Patient.findOne({ where: { email } });
        } else if (type === 'practitioner') {
            user = await Practitioner.findOne({ where: { email } });
        } else if (type === 'admin') {
            user = await Admin.findOne({ where: { email } });
        }

        if (!user) {
            return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

        // Remove existing tokens for this user
        await PasswordResetToken.destroy({ where: { user_id: user.id, user_type: type } });

        await PasswordResetToken.create({
            user_id: user.id,
            user_type: type,
            token: token,
            expires_at: expiresAt
        });

        const resetLink = `http://localhost:3000/reset-password?token=${token}&type=${type}`;

        const axios = require('axios');
        try {
            await axios.post('http://notification-service:3004/send-email', {
                to: email,
                subject: 'Password Reset Request',
                html: `
                    <p>You requested a password reset.</p>
                    <p>Click the link below to reset your password:</p>
                    <a href="${resetLink}">${resetLink}</a>
                    <p>This link will expire in 1 hour.</p>
                `
            });
        } catch (emailError) {
            console.error('Failed to send reset email:', emailError.message);
        }

        res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
    try {
        const { token, type, newPassword } = req.body;

        const resetToken = await PasswordResetToken.findOne({ where: { token, user_type: type } });

        if (!resetToken) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }

        if (new Date() > new Date(resetToken.expires_at)) {
            await resetToken.destroy();
            return res.status(400).json({ error: 'Token expired' });
        }

        let user;
        if (type === 'patient') {
            user = await Patient.findByPk(resetToken.user_id);
        } else if (type === 'practitioner') {
            user = await Practitioner.findByPk(resetToken.user_id);
        } else if (type === 'admin') {
            user = await Admin.findByPk(resetToken.user_id);
        }

        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await user.update({ password: hashedPassword });

        await resetToken.destroy();

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

