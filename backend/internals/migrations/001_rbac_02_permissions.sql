CREATE TABLE IF NOT EXISTS permissions (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE,
    description TEXT
);

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
