const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    development: {
        username: process.env.DB_USER || 'user',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_NAME || 'ayur_db',
        host: process.env.DB_HOST || 'postgres-db',
        dialect: 'postgres',
    },
    test: {
        username: process.env.DB_USER || 'user',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_NAME || 'ayur_db_test',
        host: process.env.DB_HOST || 'localhost',
        dialect: 'postgres',
    },
    production: {
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        dialect: 'postgres',
    },
};
