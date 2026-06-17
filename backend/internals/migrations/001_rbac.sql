-- 001: RBAC — roles, permissions, role_permissions, user_roles

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS roles (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS permissions (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id       INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id TEXT    NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- ── Seed Roles ────────────────────────────────────────────────────────────────
INSERT INTO roles (name, description) VALUES
    ('admin',   'Platform administrator with full access'),
    ('tutor',   'Course instructor and content manager'),
    ('user',    'Regular learner')
ON CONFLICT (name) DO NOTHING;

-- ── Seed Permissions ──────────────────────────────────────────────────────────
INSERT INTO permissions (name, description) VALUES
    -- Dashboard
    ('dashboard:admin',              'View admin dashboard'),
    ('dashboard:user',               'View student dashboard'),
    ('dashboard:tutor',              'View tutor dashboard'),
    -- Profile
    ('profile:read',                 'Read own profile'),
    ('profile:update',               'Update own profile'),
    -- User management
    ('users:read',                   'List all users'),
    ('users:role:assign',            'Assign a role to a user'),
    ('users:role:revoke',            'Revoke a role from a user'),
    ('me:read',                      'Read current user'),
    ('me:update',                    'Update current user'),
    -- Categories
    ('categories:read',              'List categories'),
    ('categories:create',            'Create category'),
    ('categories:update',            'Update category'),
    ('categories:delete',            'Delete category'),
    -- Courses
    ('courses:browse',               'Browse public courses'),
    ('courses:view',                 'View course detail (tutor/admin)'),
    ('courses:create',               'Create a new course'),
    ('courses:update',               'Update a course'),
    ('courses:delete',               'Delete a course'),
    ('courses:publish',              'Publish / unpublish a course'),
    ('courses:enroll:manual',        'Manually enroll a user (admin)'),
    ('courses:enrolled',             'View own enrolled courses'),
    ('courses:study',                'Access study page'),
    -- Chapters
    ('chapters:create',              'Create a chapter'),
    ('chapters:update',              'Update a chapter'),
    ('chapters:delete',              'Delete a chapter'),
    -- Lessons
    ('lessons:create',               'Create a lesson'),
    ('lessons:update',               'Update a lesson'),
    ('lessons:delete',               'Delete a lesson'),
    ('lessons:content',              'Access lesson content'),
    ('lessons:progress:mark',        'Mark lesson as complete'),
    -- Resources
    ('resources:create',             'Add lesson resource'),
    ('resources:delete',             'Delete lesson resource'),
    -- Quiz
    ('quiz:create',                  'Create quiz'),
    ('quiz:update',                  'Update quiz'),
    ('quiz:delete',                  'Delete quiz'),
    ('quiz:attempt',                 'Attempt a quiz'),
    -- Discussions
    ('discussions:read',             'Read discussions'),
    ('discussions:create',           'Post a discussion'),
    ('discussions:delete',           'Delete own discussion'),
    -- Notes
    ('notes:upsert',                 'Create or update lesson note'),
    ('notes:read',                   'Read own note'),
    -- Updates
    ('updates:read',                 'Read course updates'),
    ('updates:create',               'Create a course update'),
    ('updates:update',               'Edit a course update'),
    ('updates:delete',               'Delete a course update'),
    -- Feedback
    ('feedbacks:read',               'Read feedbacks'),
    ('feedbacks:create',             'Submit feedback'),
    ('feedbacks:pin',                'Pin/unpin feedback'),
    ('feedbacks:delete',             'Delete feedback'),
    -- Coupons
    ('coupons:read',                 'List coupons'),
    ('coupons:create',               'Create coupon'),
    ('coupons:update',               'Update coupon'),
    ('coupons:delete',               'Delete coupon'),
    ('coupons:check',                'Check coupon validity'),
    -- Transactions
    ('transactions:initiate',        'Initiate a purchase'),
    ('transactions:webhook',         'Receive Razorpay webhook'),
    ('transactions:read',            'View all transactions (admin)'),
    ('transactions:read:own',        'View own transactions'),
    -- Enrollments
    ('enrollments:read',             'View enrollments'),
    -- Wishlist
    ('wishlist:read',                'View wishlist'),
    ('wishlist:add',                 'Add to wishlist'),
    ('wishlist:remove',              'Remove from wishlist'),
    -- Cart
    ('cart:read',                    'View cart'),
    ('cart:add',                     'Add to cart'),
    ('cart:remove',                  'Remove from cart'),
    -- Certificates
    ('certificates:read',            'View certificates'),
    -- Storage
    ('storage:upload-media',         'Upload media files')
ON CONFLICT (name) DO NOTHING;

-- ── Role-Permission mapping ───────────────────────────────────────────────────
DO $$
DECLARE
    r_admin   INTEGER := (SELECT id FROM roles WHERE name = 'admin');
    r_tutor   INTEGER := (SELECT id FROM roles WHERE name = 'tutor');
    r_user    INTEGER := (SELECT id FROM roles WHERE name = 'user');
    p RECORD;
BEGIN
    -- admin gets every permission
    FOR p IN SELECT id FROM permissions LOOP
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (r_admin, p.id)
        ON CONFLICT DO NOTHING;
    END LOOP;

    -- tutor permissions
    FOR p IN SELECT id FROM permissions WHERE name IN (
        'dashboard:tutor', 'dashboard:user',
        'profile:read', 'profile:update',
        'me:read', 'me:update',
        'courses:browse', 'courses:view', 'courses:create', 'courses:update', 'courses:delete', 'courses:publish',
        'chapters:create', 'chapters:update', 'chapters:delete',
        'lessons:create', 'lessons:update', 'lessons:delete', 'lessons:content',
        'resources:create', 'resources:delete',
        'quiz:create', 'quiz:update', 'quiz:delete',
        'discussions:read', 'discussions:create', 'discussions:delete',
        'updates:read', 'updates:create', 'updates:update', 'updates:delete',
        'feedbacks:read',
        'storage:upload-media',
        'categories:read'
    ) LOOP
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (r_tutor, p.id)
        ON CONFLICT DO NOTHING;
    END LOOP;

    -- user (learner) permissions
    FOR p IN SELECT id FROM permissions WHERE name IN (
        'dashboard:user',
        'profile:read', 'profile:update',
        'me:read', 'me:update',
        'courses:browse', 'courses:enrolled', 'courses:study',
        'lessons:content', 'lessons:progress:mark',
        'discussions:read', 'discussions:create',
        'notes:upsert', 'notes:read',
        'updates:read',
        'feedbacks:create',
        'coupons:check',
        'transactions:initiate', 'transactions:read:own',
        'wishlist:read', 'wishlist:add', 'wishlist:remove',
        'cart:read', 'cart:add', 'cart:remove',
        'certificates:read',
        'categories:read',
        'quiz:attempt'
    ) LOOP
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (r_user, p.id)
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;

-- ── Trigger: auto-assign 'user' role on new user; first user → 'admin' ────────
CREATE OR REPLACE FUNCTION assign_default_role() RETURNS TRIGGER AS $$
DECLARE
    user_count     INTEGER;
    target_role_id INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM "user";
    IF user_count = 1 THEN
        SELECT id INTO target_role_id FROM roles WHERE name = 'admin';
    ELSE
        SELECT id INTO target_role_id FROM roles WHERE name = 'user';
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
