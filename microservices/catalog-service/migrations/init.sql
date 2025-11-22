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
