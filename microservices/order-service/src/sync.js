const { Order } = require('./models');
const sequelize = require('./config/database');

async function sync() {
    try {
        await sequelize.authenticate();
        console.log('Database connected...');

        await Order.sync();
        console.log('Orders table synced...');

        process.exit(0);
    } catch (error) {
        console.error('Sync failed:', error);
        process.exit(1);
    }
}

sync();
