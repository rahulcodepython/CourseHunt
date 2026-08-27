-- 002_categories.sql: Seed Root Categories and Subcategories

-- Root Categories
INSERT INTO categories (id, parent_id, name) VALUES
    (gen_random_uuid(), NULL, 'Web Development'),
    (gen_random_uuid(), NULL, 'Mobile Development'),
    (gen_random_uuid(), NULL, 'Data Science & AI'),
    (gen_random_uuid(), NULL, 'Cloud & DevOps'),
    (gen_random_uuid(), NULL, 'Design & UX')
ON CONFLICT (parent_id, name) DO NOTHING;

-- Subcategories (Categories with parent_id)
INSERT INTO categories (id, parent_id, name)
SELECT gen_random_uuid(), c.id, v.name
FROM (VALUES
    ('Web Development', 'React & Next.js'),
    ('Web Development', 'Golang & Backend'),
    ('Web Development', 'Vue & Nuxt'),
    ('Web Development', 'Node.js & Microservices'),
    ('Mobile Development', 'Flutter & Dart'),
    ('Mobile Development', 'React Native'),
    ('Data Science & AI', 'Machine Learning with Python'),
    ('Data Science & AI', 'Deep Learning & LLMs'),
    ('Cloud & DevOps', 'Docker & Kubernetes'),
    ('Cloud & DevOps', 'AWS & Cloud Architecture'),
    ('Design & UX', 'UI/UX Design Fundamentals'),
    ('Design & UX', 'Figma & Prototyping')
) AS v(parent_name, name)
JOIN categories c ON c.name = v.parent_name AND c.parent_id IS NULL
ON CONFLICT (parent_id, name) DO NOTHING;
