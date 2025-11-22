const { Order } = require('../models');
const sequelize = require('../config/database');

const seedOrders = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected...');

        // Sync models
        await sequelize.sync();

        const orders = [
            {
                item_id: 1,
                user_id: 1,
                order_quantity: 2,
                order_date: new Date('2025-11-20'),
                order_status: 1 // Completed
            },
            {
                item_id: 2,
                user_id: 1,
                order_quantity: 1,
                order_date: new Date('2025-11-21'),
                order_status: 0 // Pending
            },
            {
                item_id: 3,
                user_id: 1,
                order_quantity: 3,
                order_date: new Date(),
                order_status: 0 // Pending
            }
        ];

        for (const orderData of orders) {
            await Order.create(orderData);
        }

        console.log('Dummy orders seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding orders:', error);
        process.exit(1);
    }
};

seedOrders();
