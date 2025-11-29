const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Cart = sequelize.define('Cart', {
    user_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    tableName: 'carts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

const CartItem = sequelize.define('CartItem', {
    cart_id: { type: DataTypes.INTEGER, allowNull: false },
    item_id: { type: DataTypes.INTEGER, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    added_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    tableName: 'cart_items',
    timestamps: false
});

module.exports = { Cart, CartItem };
