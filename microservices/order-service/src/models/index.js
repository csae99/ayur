const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
    item_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    order_quantity: { type: DataTypes.INTEGER, allowNull: false },
    order_date: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
    order_status: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: '0=PendingPayment, 1=Confirmed, 2=Processing, 3=Packed, 4=Shipped, 5=OutForDelivery, 6=Delivered, 7=Cancelled, 8=Returned, 9=Refunded'
    },
    tracking_number: { type: DataTypes.STRING },
    shipped_date: { type: DataTypes.DATE },
    delivered_date: { type: DataTypes.DATE },
    estimated_delivery: { type: DataTypes.DATEONLY },
    practitioner_id: { type: DataTypes.INTEGER, allowNull: true, comment: 'ID of the practitioner/pharmacy who sold the item' },
    coupon_code: { type: DataTypes.STRING, allowNull: true },
    discount_amount: { type: DataTypes.FLOAT, defaultValue: 0 },
    final_amount: { type: DataTypes.FLOAT }
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

const { Cart, CartItem } = require('./cart');
const Address = require('./address');
const Coupon = require('./Coupon')(sequelize);

// Associations
Cart.hasMany(CartItem, { foreignKey: 'cart_id', onDelete: 'CASCADE' });
CartItem.belongsTo(Cart, { foreignKey: 'cart_id' });

// Order Associations (Optional, but good for future)
Order.belongsTo(Address, { foreignKey: 'address_id', as: 'shippingAddress' });

module.exports = { Order, Appointment, Cart, CartItem, Address, Coupon };
