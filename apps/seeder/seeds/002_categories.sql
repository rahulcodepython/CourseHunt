-- 002_categories.sql: Seed Root Categories and Subcategories

-- Root Categories
INSERT INTO categories (id, parent_id, name) VALUES
    ('cat-web-dev',    NULL, 'Web Development'),
    ('cat-mobile-dev', NULL, 'Mobile Development'),
    ('cat-data-ai',    NULL, 'Data Science & AI'),
    ('cat-cloud-devops',NULL, 'Cloud & DevOps'),
    ('cat-design-ux',  NULL, 'Design & UX')
ON CONFLICT DO NOTHING;

-- Subcategories
INSERT INTO categories (id, parent_id, name) VALUES
    ('subcat-react-next',  'cat-web-dev',     'React & Next.js'),
    ('subcat-golang',      'cat-web-dev',     'Golang & Backend'),
    ('subcat-vue-nuxt',    'cat-web-dev',     'Vue & Nuxt'),
    ('subcat-node-micro',  'cat-web-dev',     'Node.js & Microservices'),
    ('subcat-flutter',     'cat-mobile-dev',  'Flutter & Dart'),
    ('subcat-react-native','cat-mobile-dev',  'React Native'),
    ('subcat-ml-python',   'cat-data-ai',     'Machine Learning with Python'),
    ('subcat-deep-llm',    'cat-data-ai',     'Deep Learning & LLMs'),
    ('subcat-k8s-docker',  'cat-cloud-devops','Docker & Kubernetes'),
    ('subcat-aws-cloud',   'cat-cloud-devops','AWS & Cloud Architecture'),
    ('subcat-ui-ux-design','cat-design-ux',   'UI/UX Design Fundamentals'),
    ('subcat-figma',       'cat-design-ux',   'Figma & Prototyping')
ON CONFLICT DO NOTHING;
