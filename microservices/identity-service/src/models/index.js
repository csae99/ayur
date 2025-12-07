const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Patient = sequelize.define('Patient', {
    fname: { type: DataTypes.STRING, allowNull: false },
    lname: { type: DataTypes.STRING, allowNull: false },
    username: { type: DataTypes.STRING, unique: true, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    phone: { type: DataTypes.STRING },
    profile: { type: DataTypes.STRING },
    address: { type: DataTypes.STRING },
    joined_on: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
    tableName: 'patients',
    timestamps: false,
});

const Practitioner = sequelize.define('Practitioner', {
    fname: { type: DataTypes.STRING, allowNull: false },
    lname: { type: DataTypes.STRING, allowNull: false },
    username: { type: DataTypes.STRING, unique: true, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    phone: { type: DataTypes.STRING },
    office_name: { type: DataTypes.STRING },
    address: { type: DataTypes.STRING },
    profile: { type: DataTypes.STRING },
    professionality: { type: DataTypes.STRING },
    bio: { type: DataTypes.TEXT },
    nida: { type: DataTypes.STRING },
    businesslicense: { type: DataTypes.STRING },
    facebook: { type: DataTypes.STRING },
    twitter: { type: DataTypes.STRING },
    license: { type: DataTypes.STRING },
    verified: { type: DataTypes.BOOLEAN, defaultValue: false },
    is_new: { type: DataTypes.BOOLEAN, defaultValue: true },
    role: { type: DataTypes.STRING, defaultValue: 'user' },
    joined_on: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
    tableName: 'practitioners',
    timestamps: false,
});

const Admin = sequelize.define('Admin', {
    firstname: { type: DataTypes.STRING, allowNull: false },
    lastname: { type: DataTypes.STRING, allowNull: false },
    username: { type: DataTypes.STRING, unique: true, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.STRING, defaultValue: 'active' },
    joined_on: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
    tableName: 'admins',
    timestamps: false,
});

const RefreshToken = sequelize.define('RefreshToken', {
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    user_type: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: { isIn: [['patient', 'practitioner', 'admin']] }
    },
    token: { type: DataTypes.STRING(500), unique: true, allowNull: false },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
    tableName: 'refresh_tokens',
    timestamps: false,
});

module.exports = { Patient, Practitioner, Admin, RefreshToken };
