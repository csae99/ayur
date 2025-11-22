CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    fname VARCHAR(50) NOT NULL,
    lname VARCHAR(50) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    profile VARCHAR(255),
    address VARCHAR(255),
    joined_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS practitioners (
    id SERIAL PRIMARY KEY,
    fname VARCHAR(255) NOT NULL,
    lname VARCHAR(255) NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    office_name VARCHAR(255),
    address VARCHAR(255),
    profile VARCHAR(255),
    professionality VARCHAR(255),
    bio TEXT,
    nida VARCHAR(50),
    businesslicense VARCHAR(255),
    facebook VARCHAR(255),
    twitter VARCHAR(255),
    license VARCHAR(255),
    verified BOOLEAN DEFAULT FALSE,
    is_new BOOLEAN DEFAULT TRUE,
    role VARCHAR(50) DEFAULT 'user',
    joined_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    firstname VARCHAR(100) NOT NULL,
    lastname VARCHAR(100) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    status VARCHAR(100) DEFAULT 'active',
    joined_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
