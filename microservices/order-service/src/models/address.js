const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Address = sequelize.define('Address', {
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    full_name: { type: DataTypes.STRING, allowNull: false },
    street: { type: DataTypes.STRING, allowNull: false },
    city: { type: DataTypes.STRING, allowNull: false },
    state: { type: DataTypes.STRING, allowNull: false },
    zip: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: false },
    is_default: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
    tableName: 'addresses',
    timestamps: false
});

module.exports = Address;
