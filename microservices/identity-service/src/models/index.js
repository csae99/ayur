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

const PasswordResetToken = sequelize.define('PasswordResetToken', {
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
    tableName: 'password_reset_tokens',
    timestamps: false,
});

const Availability = sequelize.define('Availability', {
    practitioner_id: { type: DataTypes.INTEGER, allowNull: false },
    day_of_week: { type: DataTypes.STRING, allowNull: false },
    start_time: { type: DataTypes.TIME, allowNull: false },
    end_time: { type: DataTypes.TIME, allowNull: false },
    is_available: { type: DataTypes.BOOLEAN, defaultValue: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
    tableName: 'availabilities',
    timestamps: false,
});

const Appointment = sequelize.define('Appointment', {
    patient_id: { type: DataTypes.INTEGER, allowNull: true },
    practitioner_id: { type: DataTypes.INTEGER, allowNull: false },
    appointment_date: { type: DataTypes.DATEONLY, allowNull: false },
    appointment_time: { type: DataTypes.TIME, allowNull: false },
    status: { type: DataTypes.STRING, defaultValue: 'pending' },
    notes: { type: DataTypes.TEXT },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
    tableName: 'appointments',
    timestamps: false,
});

const Prescription = sequelize.define('Prescription', {
    practitioner_id: { type: DataTypes.INTEGER, allowNull: false },
    patient_id: { type: DataTypes.INTEGER, allowNull: false },
    medicines: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    notes: { type: DataTypes.TEXT },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
    tableName: 'prescriptions',
    timestamps: false,
});

// Associations
Practitioner.hasMany(Availability, { foreignKey: 'practitioner_id' });
Availability.belongsTo(Practitioner, { foreignKey: 'practitioner_id' });

Patient.hasMany(Appointment, { foreignKey: 'patient_id' });
Appointment.belongsTo(Patient, { foreignKey: 'patient_id' });

Practitioner.hasMany(Appointment, { foreignKey: 'practitioner_id' });
Appointment.belongsTo(Practitioner, { foreignKey: 'practitioner_id' });

Practitioner.hasMany(Prescription, { foreignKey: 'practitioner_id' });
Prescription.belongsTo(Practitioner, { foreignKey: 'practitioner_id' });

Patient.hasMany(Prescription, { foreignKey: 'patient_id' });
Prescription.belongsTo(Patient, { foreignKey: 'patient_id' });

module.exports = { Patient, Practitioner, Admin, RefreshToken, PasswordResetToken, Availability, Appointment, Prescription };
