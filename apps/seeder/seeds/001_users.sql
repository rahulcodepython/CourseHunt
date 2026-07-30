-- 001_users.sql: Seed Roles, Users, Credentials, Roles Mapping, and Profiles
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Insert Standard System Roles
INSERT INTO roles (name, description, is_system) VALUES
    ('admin',    'Platform administrator with full access', true),
    ('tutor',    'Course instructor and content manager',   true),
    ('user',     'Regular learner',                         true),
    ('enrolled', 'User enrolled in at least one course',    true)
ON CONFLICT (name) DO NOTHING;

-- Insert Users (2 Admins, 3 Tutors, 7 Students)
INSERT INTO "user" (id, name, email, "emailVerified", image) VALUES
    ('usr-admin-001', 'System Admin', 'admin@example.com', true, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'),
    ('usr-admin-002', 'Lead Admin', 'superadmin@example.com', true, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80'),
    ('usr-tutor-001', 'Alex Rivers (Go & Systems Expert)', 'tutor@example.com', true, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80'),
    ('usr-tutor-002', 'Dr. Sarah Smith (Data Science Lead)', 'sarah.smith@example.com', true, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80'),
    ('usr-tutor-003', 'John Doe (Next.js & Frontend Architect)', 'john.doe@example.com', true, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=250&q=80'),
    ('usr-student-001', 'Regular Student', 'user@example.com', true, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80'),
    ('usr-student-002', 'Alice Vance', 'alice@example.com', true, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80'),
    ('usr-student-003', 'Bob Miller', 'bob@example.com', true, 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=250&q=80'),
    ('usr-student-004', 'Charlie Brown', 'charlie@example.com', true, 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=250&q=80'),
    ('usr-student-005', 'David Wright', 'david@example.com', true, 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=250&q=80'),
    ('usr-student-006', 'Eva Davis', 'eva@example.com', true, 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80'),
    ('usr-student-007', 'Fiona Gallagher', 'fiona@example.com', true, 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=250&q=80')
ON CONFLICT (id) DO NOTHING;

-- Insert Credentials (Passwords: admin123456, tutor123456, user123456 / password123)
INSERT INTO credentials (user_id, password_hash) VALUES
    ('usr-admin-001', crypt('admin123456', gen_salt('bf'))),
    ('usr-admin-002', crypt('admin123456', gen_salt('bf'))),
    ('usr-tutor-001', crypt('tutor123456', gen_salt('bf'))),
    ('usr-tutor-002', crypt('tutor123456', gen_salt('bf'))),
    ('usr-tutor-003', crypt('tutor123456', gen_salt('bf'))),
    ('usr-student-001', crypt('user123456', gen_salt('bf'))),
    ('usr-student-002', crypt('password123', gen_salt('bf'))),
    ('usr-student-003', crypt('password123', gen_salt('bf'))),
    ('usr-student-004', crypt('password123', gen_salt('bf'))),
    ('usr-student-005', crypt('password123', gen_salt('bf'))),
    ('usr-student-006', crypt('password123', gen_salt('bf'))),
    ('usr-student-007', crypt('password123', gen_salt('bf')))
ON CONFLICT (user_id) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- Map User Roles
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM "user" u
JOIN roles r ON (
    (u.id LIKE 'usr-admin%' AND r.name = 'admin') OR
    (u.id LIKE 'usr-tutor%' AND r.name = 'tutor') OR
    (u.id LIKE 'usr-student%' AND r.name = 'user')
)
ON CONFLICT DO NOTHING;

-- Map Role Permissions
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

-- Insert / Update User Profiles
INSERT INTO user_profile (user_id, bio, headline, website) VALUES
    ('usr-admin-001', 'Platform Administrator managing operations and course quality.', 'CourseHunt Platform Admin', 'https://coursehunt.com'),
    ('usr-admin-002', 'Operations & System Security Lead at CourseHunt.', 'Senior Admin', 'https://coursehunt.com'),
    ('usr-tutor-001', 'Senior Backend Engineer with 10+ years specializing in Go, Distributed Systems, and High Performance Computing.', 'Go & Microservices Architect', 'https://alexrivers.dev'),
    ('usr-tutor-002', 'PhD in Machine Learning. Ex-FAANG AI Researcher teaching Data Science, Deep Learning, and LLMs.', 'AI & Data Science Instructor', 'https://sarahsmith.ai'),
    ('usr-tutor-003', 'Full Stack Developer & Open Source Contributor. Passionate about Next.js, React, and TypeScript UI engineering.', 'Principal Frontend Engineer', 'https://johndoe.codes'),
    ('usr-student-001', 'Passionate learner exploring Go backend engineering and modern web technologies.', 'Software Developer', NULL),
    ('usr-student-002', 'Computer Science student focusing on Frontend engineering.', 'CS Undergrad', NULL),
    ('usr-student-003', 'Self-taught developer building full-stack applications.', 'Junior Web Developer', NULL),
    ('usr-student-004', 'DevOps enthusiast transitioning into Cloud Native engineering.', 'Junior Systems Engineer', NULL),
    ('usr-student-005', 'Data enthusiast learning Python & AI models.', 'Data Analyst', NULL),
    ('usr-student-006', 'UI/UX Designer expanding into React and Next.js frontend development.', 'Product Designer', NULL),
    ('usr-student-007', 'Mobile app developer learning Flutter and React Native.', 'App Developer', NULL)
ON CONFLICT (user_id) DO UPDATE SET bio = EXCLUDED.bio, headline = EXCLUDED.headline, website = EXCLUDED.website;

-- Insert / Update Tutor Profiles
INSERT INTO tutor_profile (user_id, bio, headline, website) VALUES
    ('usr-tutor-001', 'Alex Rivers is a veteran software architect who has led Go microservices transformations at scale. He has taught over 50,000 students worldwide.', 'Go & Microservices Architect', 'https://alexrivers.dev'),
    ('usr-tutor-002', 'Dr. Sarah Smith holds a PhD from MIT and brings real-world AI research experience into interactive, easy-to-grasp courses.', 'AI & Data Science Instructor', 'https://sarahsmith.ai'),
    ('usr-tutor-003', 'John Doe is a Next.js Core Contributor and UI design advocate focused on clean code, performance, and accessibility.', 'Principal Frontend Engineer', 'https://johndoe.codes')
ON CONFLICT (user_id) DO UPDATE SET bio = EXCLUDED.bio, headline = EXCLUDED.headline, website = EXCLUDED.website;
