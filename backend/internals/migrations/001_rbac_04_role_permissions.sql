CREATE TABLE IF NOT EXISTS role_permissions (
    role_id       INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

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
