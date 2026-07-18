CREATE TABLE IF NOT EXISTS user_roles (
    user_id TEXT    NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);
