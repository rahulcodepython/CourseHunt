-- Commerce & Coupons
CREATE TABLE IF NOT EXISTS coupons (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    expiry_date TIMESTAMP NOT NULL,
    usage INTEGER DEFAULT 0,
    max_usage INTEGER NOT NULL,
    offer_value DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    transaction_id TEXT NOT NULL UNIQUE,
    course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
    course_name TEXT NOT NULL,
    user_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
    user_email TEXT NOT NULL,
    coupon_id INTEGER REFERENCES coupons(id) ON DELETE SET NULL,
    coupon_code TEXT,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
