const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Item = sequelize.define('Item', {
    item_title: { type: DataTypes.STRING, allowNull: false },
    item_brand: { type: DataTypes.STRING, allowNull: false },
    item_cat: { type: DataTypes.STRING, allowNull: false },
    item_details: { type: DataTypes.TEXT, allowNull: false },
    item_tags: { type: DataTypes.STRING, allowNull: false },
    item_image: { type: DataTypes.STRING, allowNull: false },
    item_quantity: { type: DataTypes.INTEGER, allowNull: false },
    item_price: { type: DataTypes.INTEGER, allowNull: false },
    added_by: { type: DataTypes.STRING(100), allowNull: true },
    status: { type: DataTypes.STRING(20), defaultValue: 'Pending', allowNull: false },
}, {
    tableName: 'items',
    timestamps: false,
});

module.exports = { Item };
