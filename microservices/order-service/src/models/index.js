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
    final_amount: { type: DataTypes.FLOAT },
    // Payment Fields
    razorpay_order_id: { type: DataTypes.STRING },
    razorpay_payment_id: { type: DataTypes.STRING },
    razorpay_signature: { type: DataTypes.STRING },
    payment_method: { type: DataTypes.STRING, comment: 'UPI, Card, Netbanking' }
}, {
    tableName: 'orders',
    timestamps: false,
});

// Appointment model removed - Managed by Identity Service

const OrderStatusHistory = sequelize.define('OrderStatusHistory', {
    order_id: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.INTEGER, allowNull: false },
    status_name: { type: DataTypes.STRING(50), allowNull: false },
    notes: { type: DataTypes.TEXT },
    created_by: { type: DataTypes.INTEGER },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    tableName: 'order_status_history',
    timestamps: false,
});

const { Cart, CartItem } = require('./cart');
const Address = require('./address');
const Coupon = require('./Coupon')(sequelize);

// Associations
Cart.hasMany(CartItem, { foreignKey: 'cart_id', onDelete: 'CASCADE' });
CartItem.belongsTo(Cart, { foreignKey: 'cart_id' });

// Order Associations
Order.belongsTo(Address, { foreignKey: 'address_id', as: 'shippingAddress' });
Order.hasMany(OrderStatusHistory, { foreignKey: 'order_id', as: 'statusHistory' });
OrderStatusHistory.belongsTo(Order, { foreignKey: 'order_id' });

const Wishlist = require('./Wishlist');

module.exports = { Order, Cart, CartItem, Address, Coupon, OrderStatusHistory, Wishlist };
