const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
    item_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    order_quantity: { type: DataTypes.INTEGER, allowNull: false },
    order_date: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
    order_status: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, {
    tableName: 'orders',
    timestamps: false,
});

const Appointment = sequelize.define('Appointment', {
    patient_id: { type: DataTypes.INTEGER, allowNull: false },
    practitioner_id: { type: DataTypes.INTEGER, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    time: { type: DataTypes.TIME, allowNull: false },
    status: { type: DataTypes.STRING, defaultValue: 'Pending' }, // Pending, Confirmed, Rejected, Completed
    notes: { type: DataTypes.TEXT },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    tableName: 'appointments',
    timestamps: false,
});

module.exports = { Order, Appointment };
