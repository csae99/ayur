const { Order } = require('./models');
const sequelize = require('./config/database');

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('Database connected...');

        // Ensure table exists
        await Order.sync();
        console.log('Orders table synced...');

        // Sample orders from legacy database
        await Order.bulkCreate([
            {
                item_id: 1,
                user_id: 1,
                order_quantity: 1,
                order_date: '2024-04-09',
                order_status: 0
            },
            {
                item_id: 2,
                user_id: 1,
                order_quantity: 1,
                order_date: '2024-04-09',
                order_status: 0
            },
            {
                item_id: 1,
                user_id: 2,
                order_quantity: 2,
                order_date: '2024-04-10',
                order_status: 0
            },
            {
                item_id: 3,
                user_id: 2,
                order_quantity: 1,
                order_date: '2024-04-10',
                order_status: 1
            },
            {
                item_id: 2,
                user_id: 1,
                order_quantity: 3,
                order_date: '2024-04-10',
                order_status: 1
            }
        ]);

        console.log('Orders seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seed();
