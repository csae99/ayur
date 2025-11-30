-- Migration: Add Coupons table
-- Description: Create coupons table for discount code management

CREATE TABLE IF NOT EXISTS coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value >= 0),
    min_order_value DECIMAL(10,2) DEFAULT 0,
    max_discount DECIMAL(10,2),
    expiry_date TIMESTAMP,
    usage_limit INTEGER,
    used_count INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index on code for faster lookups
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);

-- Create index on is_active for filtering queries
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active);

-- Insert some sample coupons for testing
INSERT INTO coupons (code, discount_type, discount_value, min_order_value, max_discount, expiry_date, usage_limit, is_active)
VALUES 
    ('WELCOME10', 'percentage', 10, 100, 50, '2025-12-31', NULL, true),
    ('SAVE50', 'fixed', 50, 200, NULL, '2025-12-31', 100, true),
    ('FIRSTORDER', 'percentage', 15, 0, 100, '2025-12-31', NULL, true)
ON CONFLICT (code) DO NOTHING;
