-- 003: Category tables

CREATE TABLE IF NOT EXISTS categories (
    id         text PRIMARY KEY DEFAULT gen_random_uuid(),
    name       text NOT NULL UNIQUE,
    created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subcategories (
    id          text PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id text NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name        text NOT NULL,
    created_at  timestamptz DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category_id, name)
);

CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON subcategories(category_id);
