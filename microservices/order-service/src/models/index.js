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

module.exports = { Order };
