-- 003: Category tables

CREATE TABLE IF NOT EXISTS categories (
    id         text PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id  text REFERENCES categories(id) ON DELETE CASCADE,
    name       text NOT NULL,
    created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
    UNIQUE NULLS NOT DISTINCT (parent_id, name)
);

CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
