CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    item_title VARCHAR(250) NOT NULL,
    item_brand VARCHAR(250) NOT NULL,
    item_cat VARCHAR(50) NOT NULL,
    item_details TEXT NOT NULL,
    item_tags VARCHAR(250) NOT NULL,
    item_image VARCHAR(250) NOT NULL,
    item_quantity INTEGER NOT NULL,
    item_price INTEGER NOT NULL,
    added_by VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Pending'
);

CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL,
    user_name VARCHAR(100) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

