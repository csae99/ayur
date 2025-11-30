const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Coupon = sequelize.define('Coupon', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        code: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
            validate: {
                isUppercase: true,
                len: [3, 50]
            }
        },
        discount_type: {
            type: DataTypes.ENUM('percentage', 'fixed'),
            allowNull: false,
            defaultValue: 'percentage'
        },
        discount_value: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                min: 0
            }
        },
        min_order_value: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0
        },
        max_discount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            comment: 'Maximum discount amount (useful for percentage coupons)'
        },
        expiry_date: {
            type: DataTypes.DATE,
            allowNull: true
        },
        usage_limit: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Total number of times this coupon can be used (null = unlimited)'
        },
        used_count: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'coupons',
        timestamps: false,
        indexes: [
            {
                unique: true,
                fields: ['code']
            }
        ]
    });

    return Coupon;
};
