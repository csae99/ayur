const { Item } = require('./models');
const sequelize = require('./config/database');

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('Database connected...');

        // Ensure table exists
        await Item.sync();
        console.log('Items table synced...');

        await Item.bulkCreate([
            {
                item_title: 'Cilliata',
                item_brand: 'Cilliata',
                item_cat: 'medicine',
                item_details: 'I treats fever and ulcers plus general health of body',
                item_tags: 'fever, ulcers, health',
                item_image: 'med1.webp',
                item_quantity: 86,
                item_price: 70
            },
            {
                item_title: 'Globulus',
                item_brand: 'Globulus',
                item_cat: 'medicine',
                item_details: 'Treats skin infections and other skin disorders',
                item_tags: 'skin, infection',
                item_image: 'med2.jpg',
                item_quantity: 89,
                item_price: 200
            },
            {
                item_title: 'Aristata',
                item_brand: 'Aristata',
                item_cat: 'medicine',
                item_details: 'Treats both scabiies and other skin infections in the body.',
                item_tags: 'scabies, skin',
                item_image: 'med3.webp',
                item_quantity: 82,
                item_price: 99
            }
        ]);

        console.log('Catalog items seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seed();
