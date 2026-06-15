-- =============================================================================
-- 09_rbac.sql  — Role-Based & Permission-Based Access Control
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Core tables
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS roles (
    id   SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS permissions (
    id   SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,   -- e.g. "courses:create"
    description TEXT
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id       INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id TEXT    NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id)  ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- -----------------------------------------------------------------------------
-- 2. Seed roles
-- -----------------------------------------------------------------------------

INSERT INTO roles (name, description) VALUES
    ('admin',   'Platform administrator with full access'),
    ('tutor',   'Course creator and content manager'),
    ('student', 'Learner who can enroll and study courses')
ON CONFLICT (name) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 3. Seed permissions  (resource:action format)
-- -----------------------------------------------------------------------------

INSERT INTO permissions (name, description) VALUES
    -- Dashboard
    ('dashboard:admin',              'View admin dashboard'),
    ('dashboard:user',               'View student dashboard'),

    -- User management
    ('users:list',                   'List all users'),
    ('users:ban',                    'Ban a user'),
    ('users:unban',                  'Unban a user'),
    ('users:assign-role',            'Change a user''s role'),

    -- Courses (admin / tutor)
    ('courses:list-admin',           'View all courses in admin panel'),
    ('courses:create',               'Create a new course'),
    ('courses:update',               'Update an existing course'),
    ('courses:delete',               'Delete a course'),

    -- Courses (student)
    ('courses:list-owned',           'View enrolled courses'),
    ('courses:view-names',           'View enrolled course names'),

    -- Coupons
    ('coupons:list',                 'List all coupons'),
    ('coupons:create',               'Create a coupon'),
    ('coupons:update',               'Update a coupon'),
    ('coupons:delete',               'Delete a coupon'),

    -- Feedback
    ('feedback:list',                'List all feedback'),
    ('feedback:create',              'Submit feedback'),
    ('feedback:pin',                 'Pin/unpin feedback'),
    ('feedback:delete',              'Delete feedback'),

    -- Transactions
    ('transactions:list-admin',      'View all transactions as admin'),
    ('transactions:accept-refund',   'Accept a refund request'),
    ('transactions:reject-refund',   'Reject a refund request'),
    ('transactions:initiate-refund', 'Initiate a refund request'),
    ('transactions:list-user',       'View own transaction history'),
    ('transactions:checkout',        'Access checkout page'),
    ('transactions:purchase',        'Make a purchase'),

    -- Study
    ('study:access',                 'Access study materials'),

    -- Storage
    ('storage:upload-media',         'Upload media files'),

    -- Updates
    ('updates:list-unseen',          'View unseen updates'),
    ('updates:list-admin',           'List all updates (admin)'),
    ('updates:create',               'Create an update'),
    ('updates:update',               'Edit an update'),
    ('updates:delete',               'Delete an update'),

    -- Discussions
    ('discussions:list',             'View lesson discussions'),
    ('discussions:create',           'Post a discussion'),
    ('discussions:delete',           'Delete a discussion')

ON CONFLICT (name) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 4. Assign permissions to roles
-- -----------------------------------------------------------------------------

-- Helper: resolve by name so order of inserts does not matter
DO $$
DECLARE
    r_admin   INTEGER := (SELECT id FROM roles WHERE name = 'admin');
    r_tutor   INTEGER := (SELECT id FROM roles WHERE name = 'tutor');
    r_student INTEGER := (SELECT id FROM roles WHERE name = 'student');

    p RECORD;
BEGIN

    -- admin gets every permission
    FOR p IN SELECT id FROM permissions LOOP
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (r_admin, p.id)
        ON CONFLICT DO NOTHING;
    END LOOP;

    -- tutor permissions
    FOR p IN
        SELECT id FROM permissions WHERE name IN (
            'dashboard:user',
            'courses:list-admin',
            'courses:create',
            'courses:update',
            'courses:delete',
            'feedback:list',
            'storage:upload-media',
            'discussions:list',
            'discussions:create',
            'discussions:delete'
        )
    LOOP
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (r_tutor, p.id)
        ON CONFLICT DO NOTHING;
    END LOOP;

    -- student permissions
    FOR p IN
        SELECT id FROM permissions WHERE name IN (
            'dashboard:user',
            'courses:list-owned',
            'courses:view-names',
            'feedback:create',
            'transactions:initiate-refund',
            'transactions:list-user',
            'transactions:checkout',
            'transactions:purchase',
            'study:access',
            'updates:list-unseen',
            'discussions:list',
            'discussions:create'
        )
    LOOP
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (r_student, p.id)
        ON CONFLICT DO NOTHING;
    END LOOP;

END $$;

-- -----------------------------------------------------------------------------
-- 5. Trigger: auto-assign role on new user insert
--    • First user ever  → admin
--    • All others       → student
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION assign_default_role() RETURNS TRIGGER AS $$
DECLARE
    user_count INTEGER;
    target_role_id INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM "user";

    IF user_count = 1 THEN
        -- This is the very first user
        SELECT id INTO target_role_id FROM roles WHERE name = 'admin';
    ELSE
        SELECT id INTO target_role_id FROM roles WHERE name = 'student';
    END IF;

    INSERT INTO user_roles (user_id, role_id)
    VALUES (NEW.id, target_role_id)
    ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_assign_default_role ON "user";
CREATE TRIGGER trg_assign_default_role
    AFTER INSERT ON "user"
    FOR EACH ROW EXECUTE FUNCTION assign_default_role();
