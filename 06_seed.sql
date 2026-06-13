-- Seed Data for CourseHunt

-- 1. Categories
INSERT INTO categories (name) VALUES 
('Web Development'), 
('Data Science'), 
('Mobile Development'), 
('Design'), 
('Business')
ON CONFLICT (name) DO NOTHING;

-- 2. Courses (Assuming some creator_id exists or using NULL)
-- Note: creator_id should be a valid user ID from the "user" table. 
-- Since we are not seeding users, these will have creator_id as NULL or a dummy if constraints allow.
-- If creator_id is mandatory, this might fail unless users are added first.
-- For now, we use a placeholder 'admin-user-id' which the user should replace or ensure exists.

INSERT INTO courses (creator_id, title, description, duration, students, rating, reviews, price, original_price, category_name, discount, image_url, image_file_type, preview_video_url, preview_video_file_type, long_description, chapters_count, lessons_count, is_published)
VALUES 
(NULL, 'Fullstack Web Development with Next.js', 'Learn to build modern web applications with Next.js, TypeScript, and Tailwind CSS.', '20 hours', 1500, 4.8, 120, 49.99, 99.99, 'Web Development', '50%', 'https://placehold.co/600x400?text=Next.js+Course', 'image', '', '', 'This comprehensive course covers everything from the basics of React to advanced Next.js features like Server Actions and PPR.', 2, 4, true),
(NULL, 'Data Science Bootcamp: Python & Pandas', 'Master data analysis and visualization using Python, Pandas, and Matplotlib.', '35 hours', 800, 4.7, 85, 59.99, 119.99, 'Data Science', '50%', 'https://placehold.co/600x400?text=Data+Science', 'image', '', '', 'Go from zero to hero in data science. Learn how to clean, analyze, and visualize data effectively.', 1, 2, true),
(NULL, 'UI/UX Design Masterclass', 'Design beautiful and functional user interfaces using Figma.', '15 hours', 1200, 4.9, 200, 39.99, 79.99, 'Design', '50%', 'https://placehold.co/600x400?text=Design+Masterclass', 'image', '', '', 'Learn the principles of design and how to apply them in Figma to create stunning mobile and web interfaces.', 1, 2, true)
ON CONFLICT DO NOTHING;

-- 3. Chapters
INSERT INTO chapters (course_id, title, preview, order_index, total_lessons)
VALUES 
(1, 'Introduction to Next.js', true, 0, 2),
(1, 'Server Components & Routing', false, 1, 2),
(2, 'Python Basics for Data Science', true, 0, 2),
(3, 'Design Principles', true, 0, 2)
ON CONFLICT DO NOTHING;

-- 4. Lessons
INSERT INTO lessons (chapter_id, title, duration, type, video_url, video_file_type, content, order_index)
VALUES 
(1, 'Getting Started', '10m', 'video', 'https://demo.video/1', 'video', 'Welcome to the course!', 0),
(1, 'Installation & Setup', '15m', 'video', 'https://demo.video/2', 'video', 'Setting up your environment.', 1),
(2, 'File-based Routing', '20m', 'video', 'https://demo.video/3', 'video', 'Understanding the App Router.', 0),
(2, 'Server vs Client Components', '25m', 'video', 'https://demo.video/4', 'video', 'Deep dive into components.', 1),
(3, 'Variables & Data Types', '15m', 'reading', '', '', 'Basics of Python variables.', 0),
(3, 'Control Flow', '20m', 'video', 'https://demo.video/5', 'video', 'Loops and conditionals.', 1),
(4, 'Typography & Color', '20m', 'video', 'https://demo.video/6', 'video', 'Mastering the basics of UI.', 0),
(4, 'Layout & Grid', '25m', 'video', 'https://demo.video/7', 'video', 'Building responsive layouts.', 1)
ON CONFLICT DO NOTHING;

-- 5. FAQs
INSERT INTO course_faqs (course_id, question, answer)
VALUES 
(1, 'Do I need prior React knowledge?', 'Yes, basic React knowledge is recommended.'),
(1, 'Will I get a certificate?', 'Yes, upon successful completion of the course.')
ON CONFLICT DO NOTHING;

-- 6. Coupons
INSERT INTO coupons (code, expiry_date, usage, max_usage, offer_value, is_active, description)
VALUES 
('WELCOME10', CURRENT_TIMESTAMP + INTERVAL '30 days', 0, 100, 10.0, true, '10% off for new students'),
('HALFOFF', CURRENT_TIMESTAMP + INTERVAL '7 days', 0, 50, 50.0, true, 'Flash sale: 50% off everything')
ON CONFLICT DO NOTHING;

-- 7. Feedback (dummy feedback for course 1)
INSERT INTO feedback (user_id, course_id, rating, comment)
VALUES 
(NULL, 1, 5, 'Absolutely amazing course! The instructor explains everything so clearly.'),
(NULL, 1, 4, 'Very good, but some parts are a bit fast.')
ON CONFLICT DO NOTHING;
