-- Recent Updates System
CREATE TABLE IF NOT EXISTS recent_updates (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS update_seen_status (
    user_id TEXT REFERENCES "user"(id) ON DELETE CASCADE,
    update_id INTEGER REFERENCES recent_updates(id) ON DELETE CASCADE,
    seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, update_id)
);
