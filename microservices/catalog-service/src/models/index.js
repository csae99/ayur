const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Item = sequelize.define('Item', {
    item_title: { type: DataTypes.STRING, allowNull: false },
    item_brand: { type: DataTypes.STRING, allowNull: false },
    item_cat: { type: DataTypes.STRING, allowNull: false },
    item_details: { type: DataTypes.TEXT, allowNull: false },
    item_tags: { type: DataTypes.STRING, allowNull: false },
    item_image: { type: DataTypes.TEXT, allowNull: false }, // Stores JSON string of URLs
    item_quantity: { type: DataTypes.INTEGER, allowNull: false },
    item_price: { type: DataTypes.INTEGER, allowNull: false },
    added_by: { type: DataTypes.STRING(100), allowNull: true },
    status: { type: DataTypes.STRING(20), defaultValue: 'Pending', allowNull: false },
    // Pending edits system - stores proposed changes awaiting admin approval
    pending_edits: { type: DataTypes.JSONB, allowNull: true, defaultValue: null },
    has_pending_edits: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
}, {
    tableName: 'items',
    timestamps: false,
});



const Review = sequelize.define('Review', {
    item_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    user_name: { type: DataTypes.STRING(100), allowNull: false },
    rating: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
    comment: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    tableName: 'reviews',
    timestamps: false
});

// Associations
Item.hasMany(Review, { foreignKey: 'item_id', as: 'reviews' });
Review.belongsTo(Item, { foreignKey: 'item_id' });

module.exports = { Item, Review };
