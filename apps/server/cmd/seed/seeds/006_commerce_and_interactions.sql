-- 006_commerce_and_interactions.sql: Seed Coupons, Enrollments, Progress, Feedbacks, Notes, Discussions, Certificates, Transactions, Updates, Streaks, Assignments

-- 1. Coupons (Global and Course-Specific, Active and Inactive/Expired)
INSERT INTO coupons (id, code, course_id, discount_percent, max_usage, usage_count, expires_at, is_active, created_by)
SELECT gen_random_uuid(), v.code, c.id, v.discount_percent, v.max_usage, v.usage_count, v.expires_at, v.is_active, u.id
FROM (VALUES
    -- Global Coupons
    ('WELCOME50',   NULL, 50.00, 1000, 14, CURRENT_TIMESTAMP + INTERVAL '90 days', true,  'admin@example.com'),
    ('FLASH30',     NULL, 30.00, 500,  8,  CURRENT_TIMESTAMP + INTERVAL '30 days', true,  'admin@example.com'),
    ('STUDENT20',   NULL, 20.00, 800,  25, CURRENT_TIMESTAMP + INTERVAL '60 days', true,  'admin@example.com'),
    ('SUMMER15',    NULL, 15.00, 300,  5,  CURRENT_TIMESTAMP + INTERVAL '45 days', true,  'admin@example.com'),
    ('EXPIRED90',   NULL, 40.00, 100,  12, CURRENT_TIMESTAMP - INTERVAL '10 days', true,  'admin@example.com'),
    ('INACTIVE25',  NULL, 25.00, 200,  0,  CURRENT_TIMESTAMP + INTERVAL '60 days', false, 'admin@example.com'),
    -- Course-Specific Coupons
    ('GOMASTERY30', 'go-golang-microservices-masterclass', 30.00, 200, 10, CURRENT_TIMESTAMP + INTERVAL '60 days', true, 'tutor@example.com'),
    ('NEXTJS40',    'fullstack-nextjs-react-mastery',     40.00, 150, 12, CURRENT_TIMESTAMP + INTERVAL '45 days', true, 'john.doe@example.com'),
    ('CILIUM50',    'kubernetes-gitops-cilium-mastery',   50.00, 100, 8,  CURRENT_TIMESTAMP + INTERVAL '30 days', true, 'rahulcode2026@gmail.com'),
    ('AIBOOTCAMP25','python-data-science-machine-learning-bootcamp', 25.00, 300, 18, CURRENT_TIMESTAMP + INTERVAL '60 days', true, 'sarah.smith@example.com'),
    ('DEVOPS20',    'docker-kubernetes-modern-devops',    20.00, 250, 6,  CURRENT_TIMESTAMP + INTERVAL '30 days', true, 'tutor@example.com'),
    ('RUSTMASTER35','rust-systems-programming-masterclass', 35.00, 150, 4, CURRENT_TIMESTAMP + INTERVAL '45 days', true, 'tutor@example.com'),
    ('FIGMAPRO15',  'figma-ui-ux-design-system-mastery',  15.00, 400, 9,  CURRENT_TIMESTAMP + INTERVAL '90 days', true, 'john.doe@example.com')
) AS v(code, slug, discount_percent, max_usage, usage_count, expires_at, is_active, email)
LEFT JOIN courses c ON c.slug = v.slug
LEFT JOIN users u ON u.email = v.email
ON CONFLICT (code) DO NOTHING;

-- 2. Enrollments
INSERT INTO enrollments (id, user_id, course_id, enrolled_at)
SELECT gen_random_uuid(), u.id, c.id, v.enrolled_at
FROM (VALUES
    -- rahulprofession01@gmail.com (Mastery Learner)
    ('rahulprofession01@gmail.com', 'go-golang-microservices-masterclass',          CURRENT_TIMESTAMP - INTERVAL '14 days'),
    ('rahulprofession01@gmail.com', 'fullstack-nextjs-react-mastery',              CURRENT_TIMESTAMP - INTERVAL '10 days'),
    ('rahulprofession01@gmail.com', 'system-design-distributed-systems',          CURRENT_TIMESTAMP - INTERVAL '6 days'),
    ('rahulprofession01@gmail.com', 'docker-kubernetes-modern-devops',             CURRENT_TIMESTAMP - INTERVAL '4 days'),
    ('rahulprofession01@gmail.com', 'kubernetes-gitops-cilium-mastery',            CURRENT_TIMESTAMP - INTERVAL '2 days'),
    ('rahulprofession01@gmail.com', 'rust-systems-programming-masterclass',         CURRENT_TIMESTAMP - INTERVAL '1 days'),
    -- bwubca23406@gmail.com (AI & Data Science Scholar)
    ('bwubca23406@gmail.com',       'python-data-science-machine-learning-bootcamp',CURRENT_TIMESTAMP - INTERVAL '16 days'),
    ('bwubca23406@gmail.com',       'deep-learning-llms-transformers-python',       CURRENT_TIMESTAMP - INTERVAL '8 days'),
    ('bwubca23406@gmail.com',       'docker-kubernetes-modern-devops',             CURRENT_TIMESTAMP - INTERVAL '7 days'),
    ('bwubca23406@gmail.com',       'git-github-essential-crash-course',            CURRENT_TIMESTAMP - INTERVAL '5 days'),
    ('bwubca23406@gmail.com',       'rust-systems-programming-masterclass',         CURRENT_TIMESTAMP - INTERVAL '3 days'),
    -- user@example.com
    ('user@example.com',            'go-golang-microservices-masterclass',          CURRENT_TIMESTAMP - INTERVAL '10 days'),
    ('user@example.com',            'fullstack-nextjs-react-mastery',              CURRENT_TIMESTAMP - INTERVAL '8 days'),
    ('user@example.com',            'system-design-distributed-systems',          CURRENT_TIMESTAMP - INTERVAL '5 days'),
    ('user@example.com',            'rust-systems-programming-masterclass',         CURRENT_TIMESTAMP - INTERVAL '3 days'),
    -- alice@example.com
    ('alice@example.com',           'fullstack-nextjs-react-mastery',              CURRENT_TIMESTAMP - INTERVAL '12 days'),
    ('alice@example.com',           'figma-ui-ux-design-system-mastery',           CURRENT_TIMESTAMP - INTERVAL '6 days'),
    -- bob@example.com
    ('bob@example.com',             'go-golang-microservices-masterclass',          CURRENT_TIMESTAMP - INTERVAL '9 days'),
    ('bob@example.com',             'rust-systems-programming-masterclass',         CURRENT_TIMESTAMP - INTERVAL '4 days'),
    -- charlie@example.com
    ('charlie@example.com',         'docker-kubernetes-modern-devops',             CURRENT_TIMESTAMP - INTERVAL '15 days'),
    ('charlie@example.com',         'system-design-distributed-systems',          CURRENT_TIMESTAMP - INTERVAL '3 days'),
    -- david@example.com
    ('david@example.com',           'python-data-science-machine-learning-bootcamp',CURRENT_TIMESTAMP - INTERVAL '11 days'),
    ('david@example.com',           'deep-learning-llms-transformers-python',       CURRENT_TIMESTAMP - INTERVAL '2 days'),
    -- eva@example.com
    ('eva@example.com',             'figma-ui-ux-design-system-mastery',           CURRENT_TIMESTAMP - INTERVAL '7 days'),
    ('eva@example.com',             'vue-nuxt3-modern-web-apps',                   CURRENT_TIMESTAMP - INTERVAL '1 day'),
    -- fiona@example.com
    ('fiona@example.com',           'flutter-dart-multiplatform-mobile-dev',        CURRENT_TIMESTAMP - INTERVAL '14 days'),
    ('fiona@example.com',           'fullstack-nextjs-react-mastery',              CURRENT_TIMESTAMP - INTERVAL '5 days')
) AS v(email, slug, enrolled_at)
JOIN users u ON u.email = v.email
JOIN courses c ON c.slug = v.slug
ON CONFLICT (user_id, course_id) DO NOTHING;

-- 3. Lesson Progress
-- rahulprofession01@gmail.com: 100% Go Microservices (all 25 lessons)
INSERT INTO lesson_progress (id, user_id, lesson_id, course_id, completed, completed_at, playback_seconds, total_watch_time_seconds, last_watched_at)
SELECT gen_random_uuid(), u.id, l.id, c.id, true, CURRENT_TIMESTAMP - (INTERVAL '1 day' * (14 - ch.chapter_no)), l.duration_seconds, l.duration_seconds + 30, CURRENT_TIMESTAMP - (INTERVAL '1 day' * (14 - ch.chapter_no))
FROM courses c
JOIN chapters ch ON ch.course_id = c.id
JOIN lessons l ON l.chapter_id = ch.id
JOIN users u ON u.email = 'rahulprofession01@gmail.com'
WHERE c.slug = 'go-golang-microservices-masterclass'
ON CONFLICT (user_id, lesson_id) DO NOTHING;

-- rahulprofession01@gmail.com: Next.js (Chapters 1, 2, 3 = 15 lessons completed)
INSERT INTO lesson_progress (id, user_id, lesson_id, course_id, completed, completed_at, playback_seconds, total_watch_time_seconds, last_watched_at)
SELECT gen_random_uuid(), u.id, l.id, c.id, true, CURRENT_TIMESTAMP - (INTERVAL '1 day' * (10 - ch.chapter_no)), l.duration_seconds, l.duration_seconds + 45, CURRENT_TIMESTAMP - (INTERVAL '1 day' * (10 - ch.chapter_no))
FROM courses c
JOIN chapters ch ON ch.course_id = c.id
JOIN lessons l ON l.chapter_id = ch.id
JOIN users u ON u.email = 'rahulprofession01@gmail.com'
WHERE c.slug = 'fullstack-nextjs-react-mastery' AND ch.chapter_no <= 3
ON CONFLICT (user_id, lesson_id) DO NOTHING;

-- rahulprofession01@gmail.com: System Design (Chapter 1 = 5 lessons completed)
INSERT INTO lesson_progress (id, user_id, lesson_id, course_id, completed, completed_at, playback_seconds, total_watch_time_seconds, last_watched_at)
SELECT gen_random_uuid(), u.id, l.id, c.id, true, CURRENT_TIMESTAMP - INTERVAL '3 days', l.duration_seconds, l.duration_seconds + 20, CURRENT_TIMESTAMP - INTERVAL '3 days'
FROM courses c
JOIN chapters ch ON ch.course_id = c.id
JOIN lessons l ON l.chapter_id = ch.id
JOIN users u ON u.email = 'rahulprofession01@gmail.com'
WHERE c.slug = 'system-design-distributed-systems' AND ch.chapter_no = 1
ON CONFLICT (user_id, lesson_id) DO NOTHING;

-- bwubca23406@gmail.com: 100% Python Data Science (all 25 lessons)
INSERT INTO lesson_progress (id, user_id, lesson_id, course_id, completed, completed_at, playback_seconds, total_watch_time_seconds, last_watched_at)
SELECT gen_random_uuid(), u.id, l.id, c.id, true, CURRENT_TIMESTAMP - (INTERVAL '1 day' * (16 - ch.chapter_no)), l.duration_seconds, l.duration_seconds + 50, CURRENT_TIMESTAMP - (INTERVAL '1 day' * (16 - ch.chapter_no))
FROM courses c
JOIN chapters ch ON ch.course_id = c.id
JOIN lessons l ON l.chapter_id = ch.id
JOIN users u ON u.email = 'bwubca23406@gmail.com'
WHERE c.slug = 'python-data-science-machine-learning-bootcamp'
ON CONFLICT (user_id, lesson_id) DO NOTHING;

-- bwubca23406@gmail.com: 100% Git Crash Course (all 10 lessons)
INSERT INTO lesson_progress (id, user_id, lesson_id, course_id, completed, completed_at, playback_seconds, total_watch_time_seconds, last_watched_at)
SELECT gen_random_uuid(), u.id, l.id, c.id, true, CURRENT_TIMESTAMP - INTERVAL '4 days', l.duration_seconds, l.duration_seconds + 20, CURRENT_TIMESTAMP - INTERVAL '4 days'
FROM courses c
JOIN chapters ch ON ch.course_id = c.id
JOIN lessons l ON l.chapter_id = ch.id
JOIN users u ON u.email = 'bwubca23406@gmail.com'
WHERE c.slug = 'git-github-essential-crash-course'
ON CONFLICT (user_id, lesson_id) DO NOTHING;

-- bwubca23406@gmail.com: Deep Learning (Chapters 1 & 2 = 10 lessons completed)
INSERT INTO lesson_progress (id, user_id, lesson_id, course_id, completed, completed_at, playback_seconds, total_watch_time_seconds, last_watched_at)
SELECT gen_random_uuid(), u.id, l.id, c.id, true, CURRENT_TIMESTAMP - (INTERVAL '1 day' * (8 - ch.chapter_no)), l.duration_seconds, l.duration_seconds + 30, CURRENT_TIMESTAMP - (INTERVAL '1 day' * (8 - ch.chapter_no))
FROM courses c
JOIN chapters ch ON ch.course_id = c.id
JOIN lessons l ON l.chapter_id = ch.id
JOIN users u ON u.email = 'bwubca23406@gmail.com'
WHERE c.slug = 'deep-learning-llms-transformers-python' AND ch.chapter_no <= 2
ON CONFLICT (user_id, lesson_id) DO NOTHING;

-- Lesson Progress for other users
INSERT INTO lesson_progress (id, user_id, lesson_id, course_id, completed, completed_at, playback_seconds, total_watch_time_seconds, last_watched_at)
SELECT gen_random_uuid(), u.id, l.id, c.id, v.completed, v.completed_at, 400, 420, v.completed_at
FROM (VALUES
    ('user@example.com',    'go-golang-microservices-masterclass', 1, 1, true, CURRENT_TIMESTAMP - INTERVAL '9 days'),
    ('user@example.com',    'go-golang-microservices-masterclass', 1, 2, true, CURRENT_TIMESTAMP - INTERVAL '9 days'),
    ('user@example.com',    'go-golang-microservices-masterclass', 1, 3, true, CURRENT_TIMESTAMP - INTERVAL '8 days'),
    ('alice@example.com',   'fullstack-nextjs-react-mastery',     1, 1, true, CURRENT_TIMESTAMP - INTERVAL '11 days'),
    ('alice@example.com',   'fullstack-nextjs-react-mastery',     1, 2, true, CURRENT_TIMESTAMP - INTERVAL '10 days'),
    ('bob@example.com',     'go-golang-microservices-masterclass', 1, 1, true, CURRENT_TIMESTAMP - INTERVAL '8 days'),
    ('charlie@example.com', 'docker-kubernetes-modern-devops',    1, 1, true, CURRENT_TIMESTAMP - INTERVAL '14 days'),
    ('charlie@example.com', 'docker-kubernetes-modern-devops',    1, 2, true, CURRENT_TIMESTAMP - INTERVAL '14 days'),
    ('david@example.com',   'python-data-science-machine-learning-bootcamp', 1, 1, true, CURRENT_TIMESTAMP - INTERVAL '10 days'),
    ('eva@example.com',     'figma-ui-ux-design-system-mastery',  1, 1, true, CURRENT_TIMESTAMP - INTERVAL '6 days'),
    ('fiona@example.com',   'flutter-dart-multiplatform-mobile-dev',1, 1, true, CURRENT_TIMESTAMP - INTERVAL '13 days')
) AS v(email, slug, ch_no, l_no, completed, completed_at)
JOIN users u ON u.email = v.email
JOIN courses c ON c.slug = v.slug
JOIN chapters ch ON ch.course_id = c.id AND ch.chapter_no = v.ch_no
JOIN lessons l ON l.chapter_id = ch.id AND l.lesson_no = v.l_no
ON CONFLICT (user_id, lesson_id) DO NOTHING;

-- 4. Certificates
INSERT INTO certificates (id, user_id, course_id, issued_at)
SELECT gen_random_uuid(), u.id, c.id, v.issued_at
FROM (VALUES
    ('rahulprofession01@gmail.com', 'go-golang-microservices-masterclass',           CURRENT_TIMESTAMP - INTERVAL '2 days'),
    ('bwubca23406@gmail.com',       'python-data-science-machine-learning-bootcamp', CURRENT_TIMESTAMP - INTERVAL '3 days'),
    ('bwubca23406@gmail.com',       'git-github-essential-crash-course',             CURRENT_TIMESTAMP - INTERVAL '1 day'),
    ('user@example.com',            'go-golang-microservices-masterclass',           CURRENT_TIMESTAMP - INTERVAL '7 days'),
    ('charlie@example.com',         'docker-kubernetes-modern-devops',              CURRENT_TIMESTAMP - INTERVAL '12 days'),
    ('alice@example.com',           'figma-ui-ux-design-system-mastery',            CURRENT_TIMESTAMP - INTERVAL '5 days'),
    ('david@example.com',           'python-data-science-machine-learning-bootcamp', CURRENT_TIMESTAMP - INTERVAL '9 days')
) AS v(email, slug, issued_at)
JOIN users u ON u.email = v.email
JOIN courses c ON c.slug = v.slug
ON CONFLICT (user_id, course_id) DO NOTHING;

-- 5. Student Notes
INSERT INTO notes (id, user_id, lesson_id, course_id, content, updated_at)
SELECT gen_random_uuid(), u.id, l.id, c.id, v.content, v.updated_at
FROM (VALUES
    ('rahulprofession01@gmail.com', 'go-golang-microservices-masterclass', 1, 1, 'Idiomatic Go Concurrency: Always propagate context.Context down the call tree to handle timeout signals and cancellations across gRPC requests cleanly.', CURRENT_TIMESTAMP - INTERVAL '13 days'),
    ('rahulprofession01@gmail.com', 'go-golang-microservices-masterclass', 2, 2, 'Fiber Middleware: CORS must precede logger and rate-limiter in app setup so preflight OPTIONS requests return immediately with 204 No Content.', CURRENT_TIMESTAMP - INTERVAL '11 days'),
    ('rahulprofession01@gmail.com', 'fullstack-nextjs-react-mastery', 1, 1, 'Server Actions vs Route Handlers: Prefer Server Actions for form mutations because they bundle automatic cache revalidation (revalidatePath) directly into the response payload.', CURRENT_TIMESTAMP - INTERVAL '9 days'),
    ('rahulprofession01@gmail.com', 'system-design-distributed-systems', 1, 1, 'CAP Theorem in Practice: For transaction ledgers, CP (Strict Consistency) is required. For social comment threads, AP (Eventual Consistency) with read-repair is optimal.', CURRENT_TIMESTAMP - INTERVAL '5 days'),
    ('bwubca23406@gmail.com', 'python-data-science-machine-learning-bootcamp', 1, 1, 'NumPy vs Python Lists: Vectorized operations leverage SIMD CPU registers. Never use for-loops across 100k+ rows; use np.where() or df.apply(axis=1).', CURRENT_TIMESTAMP - INTERVAL '15 days'),
    ('bwubca23406@gmail.com', 'deep-learning-llms-transformers-python', 1, 1, 'Transformer Attention: Attention(Q, K, V) = softmax((Q @ K.T) / sqrt(d_k)) @ V. The scaling factor sqrt(d_k) prevents logits from exploding into flat softmax gradients.', CURRENT_TIMESTAMP - INTERVAL '7 days'),
    ('bwubca23406@gmail.com', 'git-github-essential-crash-course', 1, 2, 'Interactive Rebase: Use "git rebase -i HEAD~4" with "fixup" to merge small typo fixes into the main feature commit before requesting review on GitHub.', CURRENT_TIMESTAMP - INTERVAL '4 days')
) AS v(email, slug, ch_no, l_no, content, updated_at)
JOIN users u ON u.email = v.email
JOIN courses c ON c.slug = v.slug
JOIN chapters ch ON ch.course_id = c.id AND ch.chapter_no = v.ch_no
JOIN lessons l ON l.chapter_id = ch.id AND l.lesson_no = v.l_no
ON CONFLICT (user_id, lesson_id) DO UPDATE SET content = EXCLUDED.content;

-- 6. Feedbacks & Course Reviews
INSERT INTO feedbacks (id, user_id, course_id, rating, content, is_pinned, created_at)
SELECT gen_random_uuid(), u.id, c.id, v.rating, v.content, v.is_pinned, v.created_at
FROM (VALUES
    ('rahulprofession01@gmail.com', 'go-golang-microservices-masterclass', 5, 'Absolute masterpiece! The production microservices architecture with Fiber, gRPC, and Postgres connection pooling is the cleanest real-world Go material anywhere on the web.', true, CURRENT_TIMESTAMP - INTERVAL '2 days'),
    ('rahulprofession01@gmail.com', 'fullstack-nextjs-react-mastery', 5, 'John Doe explains Server Components and Server Actions with brilliant real-world clarity. The Better-Auth setup alone is worth 10x the price!', false, CURRENT_TIMESTAMP - INTERVAL '4 days'),
    ('bwubca23406@gmail.com', 'python-data-science-machine-learning-bootcamp', 5, 'Dr. Sarah Smith makes complex machine learning math exceptionally approachable. The real estate and customer churn datasets gave me hands-on confidence for my college thesis.', true, CURRENT_TIMESTAMP - INTERVAL '3 days'),
    ('bwubca23406@gmail.com', 'git-github-essential-crash-course', 5, 'The best free Git course online! Interactive rebasing, resolving merge conflicts, and reflog are finally second nature to me.', false, CURRENT_TIMESTAMP - INTERVAL '1 day'),
    ('user@example.com', 'go-golang-microservices-masterclass', 5, 'Fiber and sqlx explanations are top tier. Helped me refactor our internal analytics pipeline.', false, CURRENT_TIMESTAMP - INTERVAL '6 days'),
    ('alice@example.com', 'fullstack-nextjs-react-mastery', 5, 'Next.js 15 App router explained so clearly. Highly recommend!', false, CURRENT_TIMESTAMP - INTERVAL '8 days'),
    ('bob@example.com', 'rust-systems-programming-masterclass', 5, 'Rust memory model and borrow checker finally clicked for me.', false, CURRENT_TIMESTAMP - INTERVAL '2 days'),
    ('charlie@example.com', 'docker-kubernetes-modern-devops', 5, 'Docker and Kubernetes simplified! Built my first multi-node cluster seamlessly.', false, CURRENT_TIMESTAMP - INTERVAL '10 days'),
    ('david@example.com', 'deep-learning-llms-transformers-python', 5, 'PyTorch and LLM fine-tuning content is cutting-edge and practical.', false, CURRENT_TIMESTAMP - INTERVAL '1 day'),
    ('eva@example.com', 'figma-ui-ux-design-system-mastery', 5, 'Figma Auto Layout 5.0 and design system tokens are fantastic.', false, CURRENT_TIMESTAMP - INTERVAL '4 days')
) AS v(email, slug, rating, content, is_pinned, created_at)
JOIN users u ON u.email = v.email
JOIN courses c ON c.slug = v.slug
ON CONFLICT (course_id, user_id) DO UPDATE SET content = EXCLUDED.content, rating = EXCLUDED.rating;

-- 7. Discussions (Top-Level Questions & Threaded Replies)
-- Insert Parent Discussions
INSERT INTO discussions (id, course_id, user_id, lesson_id, parent_id, content, created_at)
SELECT gen_random_uuid(), c.id, u.id, l.id, NULL, v.content, v.created_at
FROM (VALUES
    ('rahulprofession01@gmail.com', 'go-golang-microservices-masterclass', 1, 2, 'In Fiber v3, how do we configure graceful shutdown with SIGTERM when running under Kubernetes preStop lifecycle hooks?', CURRENT_TIMESTAMP - INTERVAL '12 days'),
    ('rahulprofession01@gmail.com', 'fullstack-nextjs-react-mastery', 1, 2, 'Is there any performance benefit in using React Server Components over streaming SSR with Suspense boundaries?', CURRENT_TIMESTAMP - INTERVAL '8 days'),
    ('bwubca23406@gmail.com', 'python-data-science-machine-learning-bootcamp', 1, 2, 'When dealing with skewed financial distributions, should we prefer Log Transformation or Box-Cox for linear models?', CURRENT_TIMESTAMP - INTERVAL '14 days'),
    ('bwubca23406@gmail.com', 'deep-learning-llms-transformers-python', 1, 1, 'In LoRA fine-tuning, why is rank r=8 or r=16 usually sufficient for 8B models without losing downstream accuracy?', CURRENT_TIMESTAMP - INTERVAL '6 days'),
    ('user@example.com', 'go-golang-microservices-masterclass', 1, 3, 'What is the optimal max_open_conns setting for a 4-core database server with pgbouncer?', CURRENT_TIMESTAMP - INTERVAL '5 days'),
    ('charlie@example.com', 'docker-kubernetes-modern-devops', 1, 1, 'Is NGINX ingress controller preferred over Traefik in production for gRPC streaming workloads?', CURRENT_TIMESTAMP - INTERVAL '9 days')
) AS v(email, slug, ch_no, l_no, content, created_at)
JOIN users u ON u.email = v.email
JOIN courses c ON c.slug = v.slug
JOIN chapters ch ON ch.course_id = c.id AND ch.chapter_no = v.ch_no
JOIN lessons l ON l.chapter_id = ch.id AND l.lesson_no = v.l_no
ON CONFLICT (id) DO NOTHING;

-- Insert Replies to Discussions
INSERT INTO discussions (id, course_id, user_id, lesson_id, parent_id, content, created_at)
SELECT gen_random_uuid(), d.course_id, u.id, d.lesson_id, d.id, v.content, v.created_at
FROM (VALUES
    ('tutor@example.com', 'In Fiber v3, how do we configure graceful shutdown with SIGTERM when running under Kubernetes preStop lifecycle hooks?', 'Great question Rahul! Use app.ShutdownWithContext(ctx) inside a signal.Notify channel listener. In your pod manifest, set terminationGracePeriodSeconds: 60 to give existing connections time to drain.', CURRENT_TIMESTAMP - INTERVAL '11 days'),
    ('john.doe@example.com', 'Is there any performance benefit in using React Server Components over streaming SSR with Suspense boundaries?', 'Yes! RSC executes strictly on the server and generates a virtual DOM payload (RSC flight data), sending zero JavaScript bundle to the client for server-only components.', CURRENT_TIMESTAMP - INTERVAL '7 days'),
    ('sarah.smith@example.com', 'When dealing with skewed financial distributions, should we prefer Log Transformation or Box-Cox for linear models?', 'Log(x + 1) is great for strictly non-negative values. Box-Cox is more flexible because it estimates the optimal lambda exponent parameter automatically.', CURRENT_TIMESTAMP - INTERVAL '13 days'),
    ('sarah.smith@example.com', 'In LoRA fine-tuning, why is rank r=8 or r=16 usually sufficient for 8B models without losing downstream accuracy?', 'Because low-intrinsic-dimension research demonstrates that parameter updates lie in a very small subspace. Higher ranks only introduce overfitting risks and increase VRAM.', CURRENT_TIMESTAMP - INTERVAL '5 days')
) AS v(tutor_email, q_fragment, content, created_at)
JOIN discussions d ON d.content LIKE ('%' || v.q_fragment || '%') AND d.parent_id IS NULL
JOIN users u ON u.email = v.tutor_email
ON CONFLICT (id) DO NOTHING;

-- 8. Wishlists & Shopping Carts
INSERT INTO wishlists (id, user_id, course_id)
SELECT gen_random_uuid(), u.id, c.id
FROM (VALUES
    ('rahulprofession01@gmail.com', 'deep-learning-llms-transformers-python'),
    ('rahulprofession01@gmail.com', 'rust-systems-programming-masterclass'),
    ('bwubca23406@gmail.com',       'system-design-distributed-systems'),
    ('bwubca23406@gmail.com',       'kubernetes-gitops-cilium-mastery'),
    ('user@example.com',            'docker-kubernetes-modern-devops'),
    ('alice@example.com',           'go-golang-microservices-masterclass')
) AS v(email, slug)
JOIN users u ON u.email = v.email
JOIN courses c ON c.slug = v.slug
ON CONFLICT (user_id, course_id) DO NOTHING;

INSERT INTO cart_items (id, user_id, course_id)
SELECT gen_random_uuid(), u.id, c.id
FROM (VALUES
    ('rahulprofession01@gmail.com', 'python-ai-agents-langchain-langgraph'),
    ('bwubca23406@gmail.com',       'flutter-dart-multiplatform-mobile-dev'),
    ('user@example.com',            'rust-systems-programming-masterclass'),
    ('alice@example.com',           'vue-nuxt3-modern-web-apps')
) AS v(email, slug)
JOIN users u ON u.email = v.email
JOIN courses c ON c.slug = v.slug
ON CONFLICT (user_id, course_id) DO NOTHING;

-- 9. Transactions & Coupon Usages
INSERT INTO transactions (id, user_id, course_id, amount, actual_price, offered_price, tax_percent, discount_amount, currency, status, razorpay_order_id, razorpay_payment_id, confirmed_at, created_at)
SELECT gen_random_uuid(), u.id, c.id, v.amount, v.actual_price, v.offered_price, 18.00, v.discount_amount, 'INR', v.status, v.order_id, v.payment_id, v.confirmed_at, v.created_at
FROM (VALUES
    ('rahulprofession01@gmail.com', 'go-golang-microservices-masterclass',          24.99, 129.99, 49.99, 25.00, 'success', 'order_R1a1b1c1d1', 'pay_P1a1b1c1d1', CURRENT_TIMESTAMP - INTERVAL '14 days', CURRENT_TIMESTAMP - INTERVAL '14 days'),
    ('rahulprofession01@gmail.com', 'fullstack-nextjs-react-mastery',              35.99, 149.99, 59.99, 24.00, 'success', 'order_R2a2b2c2d2', 'pay_P2a2b2c2d2', CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP - INTERVAL '10 days'),
    ('rahulprofession01@gmail.com', 'system-design-distributed-systems',          79.99, 199.99, 79.99, 0.00,  'success', 'order_R3a3b3c3d3', 'pay_P3a3b3c3d3', CURRENT_TIMESTAMP - INTERVAL '6 days',  CURRENT_TIMESTAMP - INTERVAL '6 days'),
    ('bwubca23406@gmail.com',       'python-data-science-machine-learning-bootcamp',33.74, 139.99, 44.99, 11.25, 'success', 'order_B1a1b1c1d1', 'pay_B1a1b1c1d1', CURRENT_TIMESTAMP - INTERVAL '16 days', CURRENT_TIMESTAMP - INTERVAL '16 days'),
    ('bwubca23406@gmail.com',       'deep-learning-llms-transformers-python',       69.99, 179.99, 69.99, 0.00,  'success', 'order_B2a2b2c2d2', 'pay_B2a2b2c2d2', CURRENT_TIMESTAMP - INTERVAL '8 days',  CURRENT_TIMESTAMP - INTERVAL '8 days'),
    ('bwubca23406@gmail.com',       'docker-kubernetes-modern-devops',             33.99, 119.99, 39.99, 6.00,   'success', 'order_B3a3b3c3d3', 'pay_B3a3b3c3d3', CURRENT_TIMESTAMP - INTERVAL '7 days',  CURRENT_TIMESTAMP - INTERVAL '7 days'),
    ('user@example.com',            'go-golang-microservices-masterclass',          49.99, 129.99, 49.99, 0.00,  'success', 'order_K1a2b3c4d5', 'pay_P1a2b3c4d5', CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP - INTERVAL '10 days'),
    ('user@example.com',            'fullstack-nextjs-react-mastery',              59.99, 149.99, 59.99, 0.00,  'success', 'order_K2a2b3c4d5', 'pay_P2a2b3c4d5', CURRENT_TIMESTAMP - INTERVAL '8 days',  CURRENT_TIMESTAMP - INTERVAL '8 days'),
    ('alice@example.com',           'fullstack-nextjs-react-mastery',              47.99, 149.99, 59.99, 12.00, 'success', 'order_K3a2b3c4d5', 'pay_P3a2b3c4d5', CURRENT_TIMESTAMP - INTERVAL '12 days', CURRENT_TIMESTAMP - INTERVAL '12 days'),
    ('bob@example.com',             'go-golang-microservices-masterclass',          49.99, 129.99, 49.99, 0.00,  'success', 'order_K4a2b3c4d5', 'pay_P4a2b3c4d5', CURRENT_TIMESTAMP - INTERVAL '9 days',  CURRENT_TIMESTAMP - INTERVAL '9 days')
) AS v(email, slug, amount, actual_price, offered_price, discount_amount, status, order_id, payment_id, confirmed_at, created_at)
JOIN users u ON u.email = v.email
JOIN courses c ON c.slug = v.slug
ON CONFLICT (id) DO NOTHING;

-- Transactions with Coupons Applied
INSERT INTO transactions_coupons (transaction_id, coupon_id)
SELECT t.id, cp.id
FROM (VALUES
    ('order_R1a1b1c1d1', 'WELCOME50'),
    ('order_R2a2b2c2d2', 'NEXTJS40'),
    ('order_B1a1b1c1d1', 'AIBOOTCAMP25'),
    ('order_B3a3b3c3d3', 'DEVOPS15'),
    ('order_K3a2b3c4d5', 'NEXTJS20')
) AS v(order_id, code)
JOIN transactions t ON t.razorpay_order_id = v.order_id
JOIN coupons cp ON cp.code = v.code
ON CONFLICT (transaction_id) DO NOTHING;

-- Coupon Usages Tracking
INSERT INTO coupon_usages (id, coupon_id, user_id, course_id, used_at)
SELECT gen_random_uuid(), cp.id, u.id, c.id, t.created_at
FROM transactions_coupons tc
JOIN transactions t ON t.id = tc.transaction_id
JOIN coupons cp ON cp.id = tc.coupon_id
JOIN users u ON u.id = t.user_id
JOIN courses c ON c.id = t.course_id
ON CONFLICT (coupon_id, user_id, course_id) DO NOTHING;

-- 10. Course Updates & Announcements
INSERT INTO updates (id, course_id, created_by, message, created_at)
SELECT gen_random_uuid(), c.id, u.id, v.message, v.created_at
FROM (VALUES
    ('tutor@example.com', 'go-golang-microservices-masterclass', 'Updated Chapter 3 with Go 1.24 Fiber v3 benchmarks and gRPC reflection examples.', CURRENT_TIMESTAMP - INTERVAL '2 days'),
    ('john.doe@example.com', 'fullstack-nextjs-react-mastery', 'Added new Next.js 15 Server Actions & Optimistic UI tutorial videos in Chapter 1.', CURRENT_TIMESTAMP - INTERVAL '3 days'),
    ('sarah.smith@example.com', 'python-data-science-machine-learning-bootcamp', 'Updated Pandas data cleaning exercises with new 2026 Kaggle datasets.', CURRENT_TIMESTAMP - INTERVAL '4 days'),
    ('rahulcode2026@gmail.com', 'kubernetes-gitops-cilium-mastery', 'Cilium 1.16 Mutual Auth and Hubble Grafana dashboards uploaded to course resources.', CURRENT_TIMESTAMP - INTERVAL '1 day'),
    ('admin@example.com', NULL, 'Platform Maintenance: Core infrastructure upgrade scheduled this Saturday 2:00 AM UTC.', CURRENT_TIMESTAMP - INTERVAL '2 days'),
    ('admin@example.com', NULL, 'Welcome to CourseHunt v2.0! Enjoy instant search and seamless video learning.', CURRENT_TIMESTAMP - INTERVAL '7 days')
) AS v(email, slug, message, created_at)
JOIN users u ON u.email = v.email
LEFT JOIN courses c ON c.slug = v.slug
ON CONFLICT (id) DO NOTHING;

-- Seed Update Seen
INSERT INTO update_seen (id, user_id, update_id, seen_at)
SELECT gen_random_uuid(), u.id, up.id, CURRENT_TIMESTAMP - INTERVAL '1 hour'
FROM updates up
CROSS JOIN (SELECT id FROM users WHERE email IN ('rahulprofession01@gmail.com', 'bwubca23406@gmail.com')) u
ON CONFLICT (user_id, update_id) DO NOTHING;

-- 11. User Learning Streaks
INSERT INTO user_learning_streaks (user_id, current_streak_days, longest_streak_days, last_active_date, total_study_minutes, created_at, updated_at)
SELECT u.id, v.current_streak, v.longest_streak, CURRENT_DATE, v.total_minutes, CURRENT_TIMESTAMP - INTERVAL '30 days', CURRENT_TIMESTAMP
FROM (VALUES
    ('rahulprofession01@gmail.com', 14, 21, 840),
    ('bwubca23406@gmail.com',       9,  14, 620),
    ('user@example.com',            5,  12, 380),
    ('alice@example.com',           7,  10, 420),
    ('charlie@example.com',         11, 15, 710)
) AS v(email, current_streak, longest_streak, total_minutes)
JOIN users u ON u.email = v.email
ON CONFLICT (user_id) DO UPDATE SET
    current_streak_days = EXCLUDED.current_streak_days,
    longest_streak_days = EXCLUDED.longest_streak_days,
    total_study_minutes = EXCLUDED.total_study_minutes;

-- 12. Student Assignment Submissions & Grading
INSERT INTO assignment_submissions (id, assignment_id, user_id, file_url, score, feedback_notes, graded_by, status, submitted_at, graded_at)
SELECT gen_random_uuid(), a.id, u.id, v.file_url, v.score, v.feedback, tu.id, 'graded', v.submitted_at, v.graded_at
FROM (VALUES
    ('Build a Resilient REST API with Fiber & Postgres', 'rahulprofession01@gmail.com', 'https://github.com/rahulprofession01/go-fiber-postgres-api', 98, 'Flawless error handling and connection pool configuration. Excellent job handling SIGTERM gracefully!', 'tutor@example.com', CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP - INTERVAL '9 days'),
    ('Build Next.js 15 App with Server Actions & Optimistic UI', 'rahulprofession01@gmail.com', 'https://github.com/rahulprofession01/nextjs15-task-planner', 96, 'Super clean Server Actions with useOptimistic. UI responsiveness is instant.', 'john.doe@example.com', CURRENT_TIMESTAMP - INTERVAL '6 days', CURRENT_TIMESTAMP - INTERVAL '5 days'),
    ('Exploratory Data Analysis (EDA) on Real Estate Dataset', 'bwubca23406@gmail.com', 'https://github.com/bwubca23406/real-estate-eda-python', 95, 'Thorough EDA and outlier detection with IQR. Great visual interpretation of correlation matrices!', 'sarah.smith@example.com', CURRENT_TIMESTAMP - INTERVAL '12 days', CURRENT_TIMESTAMP - INTERVAL '11 days')
) AS v(assignment_title, student_email, file_url, score, feedback, tutor_email, submitted_at, graded_at)
JOIN assignments a ON a.title = v.assignment_title
JOIN users u ON u.email = v.student_email
JOIN users tu ON tu.email = v.tutor_email
ON CONFLICT (assignment_id, user_id) DO NOTHING;

-- 13. Tutor Payout Transactions
INSERT INTO tutor_payout_transactions (id, tutor_id, course_id, amount, platform_fee, status, reference_id, processed_at, created_at)
SELECT gen_random_uuid(), tu.id, c.id, v.amount, v.platform_fee, v.status, v.ref_id, v.processed_at, v.created_at
FROM (VALUES
    ('tutor@example.com',       'go-golang-microservices-masterclass', 850.00, 150.00, 'completed', 'PAYOUT_HDFC_91823', CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '6 days'),
    ('john.doe@example.com',    'fullstack-nextjs-react-mastery',     720.00, 120.00, 'completed', 'PAYOUT_AXIS_48192', CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP - INTERVAL '5 days'),
    ('sarah.smith@example.com', 'python-data-science-machine-learning-bootcamp', 900.00, 100.00, 'completed', 'PAYOUT_SBI_29102', CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '4 days'),
    ('rahulcode2026@gmail.com', 'kubernetes-gitops-cilium-mastery',   450.00, 50.00,  'pending',   'PAYOUT_KOTAK_57193', NULL, CURRENT_TIMESTAMP - INTERVAL '1 day')
) AS v(tutor_email, slug, amount, platform_fee, status, ref_id, processed_at, created_at)
JOIN users tu ON tu.email = v.tutor_email
JOIN courses c ON c.slug = v.slug
ON CONFLICT (id) DO NOTHING;

-- 14. System Notifications & Seen Status
INSERT INTO notifications (id, type, message, is_admin, is_tutor, is_student, created_at) VALUES
    (1001, 'enrollment', 'Welcome to CourseHunt! You can now explore your enrolled courses in the My Learning tab.', true, true, true, CURRENT_TIMESTAMP - INTERVAL '15 days'),
    (1002, 'course_update', 'Go Production Microservices Masterclass has been updated with Fiber v3 modules.', false, false, true, CURRENT_TIMESTAMP - INTERVAL '2 days'),
    (1003, 'coupon', 'Limited time flash sale! Use code WELCOME50 for 50% discount on any course.', false, false, true, CURRENT_TIMESTAMP - INTERVAL '5 days'),
    (1004, 'payout', 'Monthly instructor payouts for September have been successfully disbursed.', false, true, false, CURRENT_TIMESTAMP - INTERVAL '3 days'),
    (1005, 'system', 'Platform scheduled maintenance completed successfully with 99.99% uptime.', true, true, true, CURRENT_TIMESTAMP - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

INSERT INTO notification_seen (user_id, last_seen_notification_id, updated_at)
SELECT u.id, 1002, CURRENT_TIMESTAMP
FROM users u
WHERE u.email IN ('rahulprofession01@gmail.com', 'bwubca23406@gmail.com', 'admin@example.com', 'tutor@example.com')
ON CONFLICT (user_id) DO UPDATE SET last_seen_notification_id = EXCLUDED.last_seen_notification_id;
