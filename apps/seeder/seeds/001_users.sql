-- 001_users.sql: Seed Roles, Permissions, Users, Credentials, Roles Mapping, and Profiles
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Insert Standard System Roles
INSERT INTO roles (name, description, is_system) VALUES
    ('admin',    'Platform administrator with full access', true),
    ('tutor',    'Course instructor and content manager',   true),
    ('user',     'Regular learner',                         true),
    ('enrolled', 'User enrolled in at least one course',    true)
ON CONFLICT (name) DO NOTHING;

-- Insert System Permissions (matching apps/server/internals/generic/permissions.go)
INSERT INTO permissions (name, description) VALUES
    -- Admin permissions
    ('admin:categories:manage',    'Manage categories (admin)'),
    ('admin:courses:inspect',      'Inspect all courses (admin)'),
    ('admin:dashboard',            'View admin dashboard'),
    ('admin:discussion:read',      'Read discussions (admin)'),
    ('admin:discussion:write',     'Write in discussions (admin)'),
    ('admin:discussion:delete',    'Delete discussions (admin)'),
    ('admin:enrollments:inspect',  'Inspect enrollments (admin)'),
    ('admin:coupons:manage',       'Manage coupons (admin)'),
    ('admin:feedback:inspect',     'Inspect feedbacks (admin)'),
    ('admin:transactions:read_all','View all transactions (admin)'),
    ('admin:users:list',           'List all users (admin)'),
    ('admin:users:role:assign',    'Assign user roles (admin)'),
    ('admin:users:role:revoke',    'Revoke user roles (admin)'),
    ('admin:users:create',         'Create user accounts (admin)'),
    ('admin:users:read',           'Read user details (admin)'),
    ('admin:roles:create',         'Create custom roles (admin)'),
    ('admin:roles:read',           'List roles and permissions (admin)'),
    ('admin:roles:update',         'Update custom roles (admin)'),
    ('admin:roles:delete',         'Delete custom roles (admin)'),
    ('admin:roles:assign',         'Assign custom roles (admin)'),
    ('admin:profile',              'Access admin profile list (admin)'),

    -- Tutor permissions
    ('tutor:courses:manage',       'Manage own courses (tutor)'),
    ('tutor:dashboard',            'View tutor dashboard'),
    ('tutor:discussion:read',      'Read discussions (tutor)'),
    ('tutor:discussion:write',     'Write in discussions (tutor)'),
    ('tutor:discussion:delete',    'Delete discussions (tutor)'),
    ('tutor:feedback:manage',      'Manage feedbacks for own courses (tutor)'),
    ('tutor:quiz:manage',          'Manage quizzes for own courses (tutor)'),
    ('tutor:updates:manage',       'Manage updates for own courses (tutor)'),
    ('tutor:profile',              'Access tutor profile (tutor)'),

    -- Enrolled permissions
    ('enrolled:courses:study',     'Access study page for enrolled course'),
    ('enrolled:dashboard',         'View student dashboard'),
    ('enrolled:discussion:read',   'Read discussions in enrolled course'),
    ('enrolled:discussion:write',  'Post in discussions in enrolled course'),
    ('enrolled:quiz:access',       'Attempt quiz in enrolled course'),
    ('enrolled:updates:feed',      'Read update feed for enrolled courses'),

    -- User permissions
    ('user:cart:manage',           'Manage shopping cart'),
    ('user:certificate:manage',    'View and claim certificates'),
    ('user:enrollments:read',      'View own enrollments'),
    ('user:feedback:create',       'Submit course feedback'),
    ('user:notes:manage',          'Manage personal lesson notes'),
    ('user:transactions:initiate', 'Initiate purchases'),
    ('user:transactions:read_own',  'View own transaction history'),
    ('user:profile',               'View and update user profile'),
    ('user:wishlist:manage',       'Manage wishlist items')
ON CONFLICT (name) DO NOTHING;

-- Map Role-Permissions
DO $$
DECLARE
    r_admin    UUID := (SELECT id FROM roles WHERE name = 'admin');
    r_tutor    UUID := (SELECT id FROM roles WHERE name = 'tutor');
    r_enrolled UUID := (SELECT id FROM roles WHERE name = 'enrolled');
    r_user     UUID := (SELECT id FROM roles WHERE name = 'user');
    p RECORD;
BEGIN
    -- Admin gets EVERY permission
    FOR p IN SELECT id FROM permissions LOOP
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (r_admin, p.id)
        ON CONFLICT DO NOTHING;
    END LOOP;

    -- Tutor permissions
    FOR p IN SELECT id FROM permissions WHERE name LIKE 'tutor:%' LOOP
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (r_tutor, p.id)
        ON CONFLICT DO NOTHING;
    END LOOP;

    -- Enrolled permissions
    FOR p IN SELECT id FROM permissions WHERE name LIKE 'enrolled:%' LOOP
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (r_enrolled, p.id)
        ON CONFLICT DO NOTHING;
    END LOOP;

    -- User permissions
    FOR p IN SELECT id FROM permissions WHERE name LIKE 'user:%' LOOP
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (r_user, p.id)
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;

-- Insert Users (2 Admins, 3 Tutors, 7 Students)
INSERT INTO "users" (id, name, email, "emailVerified", image) VALUES
    (gen_random_uuid(), 'System Admin', 'admin@example.com', true, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'),
    (gen_random_uuid(), 'Lead Admin', 'superadmin@example.com', true, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80'),
    (gen_random_uuid(), 'Alex Rivers (Go & Systems Expert)', 'tutor@example.com', true, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80'),
    (gen_random_uuid(), 'Dr. Sarah Smith (Data Science Lead)', 'sarah.smith@example.com', true, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80'),
    (gen_random_uuid(), 'John Doe (Next.js & Frontend Architect)', 'john.doe@example.com', true, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=250&q=80'),
    (gen_random_uuid(), 'Regular Student', 'user@example.com', true, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80'),
    (gen_random_uuid(), 'Alice Vance', 'alice@example.com', true, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80'),
    (gen_random_uuid(), 'Bob Miller', 'bob@example.com', true, 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=250&q=80'),
    (gen_random_uuid(), 'Charlie Brown', 'charlie@example.com', true, 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=250&q=80'),
    (gen_random_uuid(), 'David Wright', 'david@example.com', true, 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=250&q=80'),
    (gen_random_uuid(), 'Eva Davis', 'eva@example.com', true, 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80'),
    (gen_random_uuid(), 'Fiona Gallagher', 'fiona@example.com', true, 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=250&q=80')
ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, image = EXCLUDED.image;

-- Insert Credentials (Passwords: admin123456, tutor123456, user123456 / password123)
INSERT INTO credentials (user_id, password_hash)
SELECT u.id, crypt(v.password, gen_salt('bf'))
FROM (VALUES
    ('admin@example.com', 'admin123456'),
    ('superadmin@example.com', 'admin123456'),
    ('tutor@example.com', 'tutor123456'),
    ('sarah.smith@example.com', 'tutor123456'),
    ('john.doe@example.com', 'tutor123456'),
    ('user@example.com', 'user123456'),
    ('alice@example.com', 'password123'),
    ('bob@example.com', 'password123'),
    ('charlie@example.com', 'password123'),
    ('david@example.com', 'password123'),
    ('eva@example.com', 'password123'),
    ('fiona@example.com', 'password123')
) AS v(email, password)
JOIN users u ON u.email = v.email
ON CONFLICT (user_id) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- Map User Roles
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM "users" u
JOIN roles r ON (
    (u.email LIKE '%admin%' AND r.name = 'admin') OR
    (u.email LIKE '%tutor%' AND r.name = 'tutor') OR
    (u.email NOT LIKE '%admin%' AND u.email NOT LIKE '%tutor%' AND r.name = 'user')
)
ON CONFLICT DO NOTHING;

-- Insert User Profiles (Merged single `profiles` table)
INSERT INTO profiles (user_id, bio, headline, website, total_students, rating_avg)
SELECT u.id, v.bio, v.headline, v.website, v.total_students, v.rating_avg
FROM (VALUES
    ('admin@example.com', 'Platform Administrator managing operations and course quality.', 'CourseHunt Platform Admin', 'https://coursehunt.com', 0, 0),
    ('superadmin@example.com', 'Operations & System Security Lead at CourseHunt.', 'Senior Admin', 'https://coursehunt.com', 0, 0),
    ('tutor@example.com', 'Alex Rivers is a veteran software architect who has led Go microservices transformations at scale.', 'Go & Microservices Architect', 'https://alexrivers.dev', 120, 4.90),
    ('sarah.smith@example.com', 'Dr. Sarah Smith holds a PhD from MIT and brings real-world AI research experience into interactive, easy-to-grasp courses.', 'AI & Data Science Instructor', 'https://sarahsmith.ai', 85, 4.95),
    ('john.doe@example.com', 'John Doe is a Next.js Core Contributor and UI design advocate focused on clean code, performance, and accessibility.', 'Principal Frontend Engineer', 'https://johndoe.codes', 95, 4.85),
    ('user@example.com', 'Passionate learner exploring Go backend engineering and modern web technologies.', 'Software Developer', NULL, 0, 0),
    ('alice@example.com', 'Computer Science student focusing on Frontend engineering.', 'CS Undergrad', NULL, 0, 0),
    ('bob@example.com', 'Self-taught developer building full-stack applications.', 'Junior Web Developer', NULL, 0, 0),
    ('charlie@example.com', 'DevOps enthusiast transitioning into Cloud Native engineering.', 'Junior Systems Engineer', NULL, 0, 0),
    ('david@example.com', 'Data enthusiast learning Python & AI models.', 'Data Analyst', NULL, 0, 0),
    ('eva@example.com', 'UI/UX Designer expanding into React and Next.js frontend development.', 'Product Designer', NULL, 0, 0),
    ('fiona@example.com', 'Mobile app developer learning Flutter and React Native.', 'App Developer', NULL, 0, 0)
) AS v(email, bio, headline, website, total_students, rating_avg)
JOIN users u ON u.email = v.email
ON CONFLICT (user_id) DO UPDATE SET bio = EXCLUDED.bio, headline = EXCLUDED.headline, website = EXCLUDED.website;
