-- 006_commerce_and_interactions.sql: Seed Coupons, Enrollments, Lesson Progress, Feedbacks, Wishlists, Cart Items, Discussions, Certificates, Transactions

INSERT INTO coupons (id, code, discount_percent, max_usage, expires_at, is_active) VALUES
    (gen_random_uuid(), 'WELCOME50', 50.00, 1000, CURRENT_TIMESTAMP + INTERVAL '90 days', true),
    (gen_random_uuid(), 'GOFLASH', 30.00, 500, CURRENT_TIMESTAMP + INTERVAL '60 days', true),
    (gen_random_uuid(), 'NEXTJS20', 20.00, 300, CURRENT_TIMESTAMP + INTERVAL '30 days', true),
    (gen_random_uuid(), 'DEVOPS15', 15.00, 200, CURRENT_TIMESTAMP + INTERVAL '45 days', true),
    (gen_random_uuid(), 'DATASCIENCE', 25.00, 400, CURRENT_TIMESTAMP + INTERVAL '60 days', true),
    (gen_random_uuid(), 'AIFUTURE', 40.00, 100, CURRENT_TIMESTAMP + INTERVAL '15 days', true),
    (gen_random_uuid(), 'FLUTTER30', 30.00, 250, CURRENT_TIMESTAMP + INTERVAL '30 days', true),
    (gen_random_uuid(), 'FIGMADESIGN', 10.00, 500, CURRENT_TIMESTAMP + INTERVAL '90 days', true),
    (gen_random_uuid(), 'RUSTMASTER', 35.00, 150, CURRENT_TIMESTAMP + INTERVAL '45 days', true),
    (gen_random_uuid(), 'VUEROCKS', 12.00, 300, CURRENT_TIMESTAMP + INTERVAL '60 days', true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO enrollments (id, user_id, course_id, enrolled_at)
SELECT gen_random_uuid(), u.id, c.id, v.enrolled_at FROM (VALUES
    ('user@example.com', 'go-golang-microservices-masterclass', CURRENT_TIMESTAMP - INTERVAL '10 days'),
    ('user@example.com', 'fullstack-nextjs-react-mastery', CURRENT_TIMESTAMP - INTERVAL '8 days'),
    ('user@example.com', 'system-design-distributed-systems', CURRENT_TIMESTAMP - INTERVAL '5 days'),
    ('alice@example.com', 'fullstack-nextjs-react-mastery', CURRENT_TIMESTAMP - INTERVAL '12 days'),
    ('alice@example.com', 'figma-ui-ux-design-system-mastery', CURRENT_TIMESTAMP - INTERVAL '6 days'),
    ('bob@example.com', 'go-golang-microservices-masterclass', CURRENT_TIMESTAMP - INTERVAL '9 days'),
    ('bob@example.com', 'rust-systems-programming-masterclass', CURRENT_TIMESTAMP - INTERVAL '4 days'),
    ('charlie@example.com', 'docker-kubernetes-modern-devops', CURRENT_TIMESTAMP - INTERVAL '15 days'),
    ('charlie@example.com', 'system-design-distributed-systems', CURRENT_TIMESTAMP - INTERVAL '3 days'),
    ('david@example.com', 'python-data-science-machine-learning-bootcamp', CURRENT_TIMESTAMP - INTERVAL '11 days'),
    ('david@example.com', 'deep-learning-llms-transformers-python', CURRENT_TIMESTAMP - INTERVAL '2 days'),
    ('eva@example.com', 'figma-ui-ux-design-system-mastery', CURRENT_TIMESTAMP - INTERVAL '7 days'),
    ('eva@example.com', 'vue-nuxt3-modern-web-apps', CURRENT_TIMESTAMP - INTERVAL '1 day'),
    ('fiona@example.com', 'flutter-dart-multiplatform-mobile-dev', CURRENT_TIMESTAMP - INTERVAL '14 days'),
    ('fiona@example.com', 'fullstack-nextjs-react-mastery', CURRENT_TIMESTAMP - INTERVAL '5 days')
) AS v(email, slug, enrolled_at) JOIN users u ON u.email=v.email JOIN courses c ON c.slug=v.slug ON CONFLICT (id) DO NOTHING;

INSERT INTO lesson_progress (id, user_id, lesson_id, course_id, completed, completed_at)
SELECT gen_random_uuid(), u.id, l.id, c.id, v.completed, v.completed_at FROM (VALUES
    ('user@example.com', 'go-golang-microservices-masterclass', 1, 1, true, CURRENT_TIMESTAMP - INTERVAL '9 days'),
    ('user@example.com', 'go-golang-microservices-masterclass', 1, 2, true, CURRENT_TIMESTAMP - INTERVAL '9 days'),
    ('user@example.com', 'go-golang-microservices-masterclass', 1, 3, true, CURRENT_TIMESTAMP - INTERVAL '8 days'),
    ('user@example.com', 'go-golang-microservices-masterclass', 1, 4, true, CURRENT_TIMESTAMP - INTERVAL '8 days'),
    ('user@example.com', 'go-golang-microservices-masterclass', 1, 5, true, CURRENT_TIMESTAMP - INTERVAL '7 days'),
    ('alice@example.com', 'fullstack-nextjs-react-mastery', 1, 1, true, CURRENT_TIMESTAMP - INTERVAL '11 days'),
    ('alice@example.com', 'fullstack-nextjs-react-mastery', 1, 2, true, CURRENT_TIMESTAMP - INTERVAL '10 days'),
    ('alice@example.com', 'fullstack-nextjs-react-mastery', 1, 3, true, CURRENT_TIMESTAMP - INTERVAL '10 days'),
    ('alice@example.com', 'fullstack-nextjs-react-mastery', 1, 4, false, NULL),
    ('bob@example.com', 'go-golang-microservices-masterclass', 1, 1, true, CURRENT_TIMESTAMP - INTERVAL '8 days'),
    ('bob@example.com', 'go-golang-microservices-masterclass', 1, 2, true, CURRENT_TIMESTAMP - INTERVAL '8 days'),
    ('bob@example.com', 'rust-systems-programming-masterclass', 1, 1, true, CURRENT_TIMESTAMP - INTERVAL '3 days'),
    ('charlie@example.com', 'docker-kubernetes-modern-devops', 1, 1, true, CURRENT_TIMESTAMP - INTERVAL '14 days'),
    ('charlie@example.com', 'docker-kubernetes-modern-devops', 1, 2, true, CURRENT_TIMESTAMP - INTERVAL '14 days'),
    ('charlie@example.com', 'docker-kubernetes-modern-devops', 1, 3, true, CURRENT_TIMESTAMP - INTERVAL '13 days'),
    ('charlie@example.com', 'docker-kubernetes-modern-devops', 1, 4, true, CURRENT_TIMESTAMP - INTERVAL '12 days'),
    ('charlie@example.com', 'docker-kubernetes-modern-devops', 1, 5, true, CURRENT_TIMESTAMP - INTERVAL '12 days'),
    ('david@example.com', 'python-data-science-machine-learning-bootcamp', 1, 1, true, CURRENT_TIMESTAMP - INTERVAL '10 days'),
    ('david@example.com', 'python-data-science-machine-learning-bootcamp', 1, 2, true, CURRENT_TIMESTAMP - INTERVAL '10 days'),
    ('david@example.com', 'python-data-science-machine-learning-bootcamp', 1, 3, true, CURRENT_TIMESTAMP - INTERVAL '9 days'),
    ('eva@example.com', 'figma-ui-ux-design-system-mastery', 1, 1, true, CURRENT_TIMESTAMP - INTERVAL '6 days'),
    ('eva@example.com', 'figma-ui-ux-design-system-mastery', 1, 2, true, CURRENT_TIMESTAMP - INTERVAL '6 days'),
    ('eva@example.com', 'vue-nuxt3-modern-web-apps', 1, 1, true, CURRENT_TIMESTAMP - INTERVAL '1 day'),
    ('fiona@example.com', 'flutter-dart-multiplatform-mobile-dev', 1, 1, true, CURRENT_TIMESTAMP - INTERVAL '13 days'),
    ('fiona@example.com', 'flutter-dart-multiplatform-mobile-dev', 1, 2, true, CURRENT_TIMESTAMP - INTERVAL '13 days'),
    ('fiona@example.com', 'flutter-dart-multiplatform-mobile-dev', 1, 3, true, CURRENT_TIMESTAMP - INTERVAL '12 days'),
    ('fiona@example.com', 'fullstack-nextjs-react-mastery', 1, 1, true, CURRENT_TIMESTAMP - INTERVAL '4 days'),
    ('fiona@example.com', 'fullstack-nextjs-react-mastery', 1, 2, true, CURRENT_TIMESTAMP - INTERVAL '4 days'),
    ('user@example.com', 'system-design-distributed-systems', 1, 1, true, CURRENT_TIMESTAMP - INTERVAL '4 days'),
    ('user@example.com', 'system-design-distributed-systems', 1, 2, true, CURRENT_TIMESTAMP - INTERVAL '3 days')
) AS v(email, l_slug, ch_no, l_no, completed, completed_at)
JOIN users u ON u.email=v.email JOIN courses c ON c.slug=v.l_slug
JOIN chapters ch ON ch.course_id=c.id AND ch.chapter_no=v.ch_no
JOIN lessons l ON l.chapter_id=ch.id AND l.lesson_no=v.l_no ON CONFLICT (id) DO NOTHING;

INSERT INTO feedbacks (id, user_id, course_id, rating, content, created_at)
SELECT gen_random_uuid(), u.id, c.id, v.rating, v.content, v.created_at FROM (VALUES
    ('user@example.com', 'go-golang-microservices-masterclass', 5, 'Absolute gold standard course for Go microservices! Fiber and sqlx explanations are top tier.', CURRENT_TIMESTAMP - INTERVAL '6 days'),
    ('bob@example.com', 'go-golang-microservices-masterclass', 5, 'Great practical examples. The gRPC section helped me refactor my company service.', CURRENT_TIMESTAMP - INTERVAL '5 days'),
    ('alice@example.com', 'fullstack-nextjs-react-mastery', 5, 'Next.js 15 App router explained so clearly. Highly recommend John Doe!', CURRENT_TIMESTAMP - INTERVAL '8 days'),
    ('fiona@example.com', 'fullstack-nextjs-react-mastery', 4, 'Very good overview of Server Components and Server Actions.', CURRENT_TIMESTAMP - INTERVAL '3 days'),
    ('user@example.com', 'system-design-distributed-systems', 5, 'Alex Rivers is an amazing instructor. System design principles are crystal clear.', CURRENT_TIMESTAMP - INTERVAL '2 days'),
    ('charlie@example.com', 'docker-kubernetes-modern-devops', 5, 'Docker and Kubernetes simplified! Built my first cluster seamlessly.', CURRENT_TIMESTAMP - INTERVAL '10 days'),
    ('david@example.com', 'python-data-science-machine-learning-bootcamp', 5, 'Pandas & ML models explained with real dataset examples.', CURRENT_TIMESTAMP - INTERVAL '7 days'),
    ('david@example.com', 'deep-learning-llms-transformers-python', 5, 'PyTorch and LLM fine-tuning content is cutting-edge.', CURRENT_TIMESTAMP - INTERVAL '1 day'),
    ('fiona@example.com', 'flutter-dart-multiplatform-mobile-dev', 4, 'Flutter widgets and Riverpod state management covered thoroughly.', CURRENT_TIMESTAMP - INTERVAL '10 days'),
    ('eva@example.com', 'figma-ui-ux-design-system-mastery', 5, 'Figma Auto Layout 5.0 and design system tokens are fantastic.', CURRENT_TIMESTAMP - INTERVAL '4 days'),
    ('bob@example.com', 'rust-systems-programming-masterclass', 5, 'Rust memory model and borrow checker finally clicked for me.', CURRENT_TIMESTAMP - INTERVAL '2 days'),
    ('eva@example.com', 'vue-nuxt3-modern-web-apps', 4, 'Solid Vue 3 & Nuxt 3 full-stack guide.', CURRENT_TIMESTAMP - INTERVAL '1 day'),
    ('charlie@example.com', 'system-design-distributed-systems', 5, 'Invaluable preparation for high-level system design interviews.', CURRENT_TIMESTAMP - INTERVAL '1 day'),
    ('alice@example.com', 'figma-ui-ux-design-system-mastery', 5, 'Extremely practical design-to-code workflow.', CURRENT_TIMESTAMP - INTERVAL '5 days'),
    ('user@example.com', 'fullstack-nextjs-react-mastery', 5, 'Loved the Better-Auth and Prisma/Postgres integration details.', CURRENT_TIMESTAMP - INTERVAL '4 days')
) AS v(email, slug, rating, content, created_at) JOIN users u ON u.email=v.email JOIN courses c ON c.slug=v.slug ON CONFLICT (id) DO NOTHING;

INSERT INTO wishlists (id, user_id, course_id)
SELECT gen_random_uuid(), u.id, c.id FROM (VALUES
    ('user@example.com', 'docker-kubernetes-modern-devops'),
    ('user@example.com', 'deep-learning-llms-transformers-python'),
    ('alice@example.com', 'go-golang-microservices-masterclass'),
    ('alice@example.com', 'system-design-distributed-systems'),
    ('bob@example.com', 'python-data-science-machine-learning-bootcamp'),
    ('charlie@example.com', 'rust-systems-programming-masterclass'),
    ('david@example.com', 'go-golang-microservices-masterclass'),
    ('eva@example.com', 'fullstack-nextjs-react-mastery'),
    ('fiona@example.com', 'figma-ui-ux-design-system-mastery'),
    ('fiona@example.com', 'vue-nuxt3-modern-web-apps')
) AS v(email, slug) JOIN users u ON u.email=v.email JOIN courses c ON c.slug=v.slug ON CONFLICT (id) DO NOTHING;

INSERT INTO cart_items (id, user_id, course_id)
SELECT gen_random_uuid(), u.id, c.id FROM (VALUES
    ('user@example.com', 'rust-systems-programming-masterclass'),
    ('alice@example.com', 'python-data-science-machine-learning-bootcamp'),
    ('bob@example.com', 'docker-kubernetes-modern-devops'),
    ('charlie@example.com', 'deep-learning-llms-transformers-python'),
    ('david@example.com', 'fullstack-nextjs-react-mastery'),
    ('eva@example.com', 'flutter-dart-multiplatform-mobile-dev'),
    ('fiona@example.com', 'system-design-distributed-systems'),
    ('alice@example.com', 'vue-nuxt3-modern-web-apps'),
    ('bob@example.com', 'figma-ui-ux-design-system-mastery'),
    ('charlie@example.com', 'go-golang-microservices-masterclass')
) AS v(email, slug) JOIN users u ON u.email=v.email JOIN courses c ON c.slug=v.slug ON CONFLICT (id) DO NOTHING;

INSERT INTO discussions (id, course_id, user_id, lesson_id, content, created_at)
SELECT gen_random_uuid(), c.id, u.id, l.id, v.content, v.created_at FROM (VALUES
    ('go-golang-microservices-masterclass', 'user@example.com', 'go-golang-microservices-masterclass', 1, 2, 'Should we allow credentials when setting allowed origins in Fiber middleware?', CURRENT_TIMESTAMP - INTERVAL '5 days'),
    ('go-golang-microservices-masterclass', 'bob@example.com', 'go-golang-microservices-masterclass', 1, 3, 'What is the optimal max_open_conns setting for a 4-core database server?', CURRENT_TIMESTAMP - INTERVAL '4 days'),
    ('fullstack-nextjs-react-mastery', 'alice@example.com', 'fullstack-nextjs-react-mastery', 1, 2, 'When should we prefer Server Actions over standard Fiber API routes?', CURRENT_TIMESTAMP - INTERVAL '7 days'),
    ('system-design-distributed-systems', 'charlie@example.com', 'system-design-distributed-systems', 2, 1, 'How does consistent hashing prevent cascading failures during node crash?', CURRENT_TIMESTAMP - INTERVAL '2 days'),
    ('docker-kubernetes-modern-devops', 'charlie@example.com', 'docker-kubernetes-modern-devops', 3, 1, 'Is NGINX ingress controller preferred over Traefik in production?', CURRENT_TIMESTAMP - INTERVAL '9 days'),
    ('python-data-science-machine-learning-bootcamp', 'david@example.com', 'python-data-science-machine-learning-bootcamp', 2, 1, 'Tips for downcasting float64 columns to float32 on big datasets.', CURRENT_TIMESTAMP - INTERVAL '6 days'),
    ('deep-learning-llms-transformers-python', 'david@example.com', 'deep-learning-llms-transformers-python', 4, 1, 'What rank r value is recommended for fine-tuning Llama 3 8B?', CURRENT_TIMESTAMP - INTERVAL '1 day'),
    ('flutter-dart-multiplatform-mobile-dev', 'fiona@example.com', 'flutter-dart-multiplatform-mobile-dev', 3, 1, 'Why is Riverpod recommended over Provider for new Flutter apps?', CURRENT_TIMESTAMP - INTERVAL '8 days'),
    ('figma-ui-ux-design-system-mastery', 'eva@example.com', 'figma-ui-ux-design-system-mastery', 2, 1, 'How to link color mode variables to Tailwind dark classes.', CURRENT_TIMESTAMP - INTERVAL '3 days'),
    ('rust-systems-programming-masterclass', 'bob@example.com', 'rust-systems-programming-masterclass', 1, 1, 'When to use RefCell versus Mutex for interior mutability?', CURRENT_TIMESTAMP - INTERVAL '2 days')
) AS v(c_slug, email, l_slug, ch_no, l_no, content, created_at)
JOIN courses c ON c.slug=v.c_slug JOIN users u ON u.email=v.email
JOIN chapters ch ON ch.course_id=(SELECT id FROM courses WHERE slug=v.l_slug) AND ch.chapter_no=v.ch_no
JOIN lessons l ON l.chapter_id=ch.id AND l.lesson_no=v.l_no ON CONFLICT (id) DO NOTHING;

INSERT INTO certificates (id, user_id, course_id, issued_at)
SELECT gen_random_uuid(), u.id, c.id, v.issued_at FROM (VALUES
    ('user@example.com', 'go-golang-microservices-masterclass', CURRENT_TIMESTAMP - INTERVAL '7 days'),
    ('charlie@example.com', 'docker-kubernetes-modern-devops', CURRENT_TIMESTAMP - INTERVAL '12 days'),
    ('alice@example.com', 'figma-ui-ux-design-system-mastery', CURRENT_TIMESTAMP - INTERVAL '5 days'),
    ('david@example.com', 'python-data-science-machine-learning-bootcamp', CURRENT_TIMESTAMP - INTERVAL '9 days'),
    ('fiona@example.com', 'flutter-dart-multiplatform-mobile-dev', CURRENT_TIMESTAMP - INTERVAL '11 days'),
    ('bob@example.com', 'go-golang-microservices-masterclass', CURRENT_TIMESTAMP - INTERVAL '4 days'),
    ('user@example.com', 'system-design-distributed-systems', CURRENT_TIMESTAMP - INTERVAL '2 days'),
    ('eva@example.com', 'vue-nuxt3-modern-web-apps', CURRENT_TIMESTAMP - INTERVAL '1 day'),
    ('alice@example.com', 'fullstack-nextjs-react-mastery', CURRENT_TIMESTAMP - INTERVAL '6 days'),
    ('bob@example.com', 'rust-systems-programming-masterclass', CURRENT_TIMESTAMP - INTERVAL '1 day')
) AS v(email, slug, issued_at) JOIN users u ON u.email=v.email JOIN courses c ON c.slug=v.slug ON CONFLICT (id) DO NOTHING;

INSERT INTO transactions (id, user_id, course_id, amount, status, razorpay_order_id, razorpay_payment_id)
SELECT gen_random_uuid(), u.id, c.id, v.amount, v.status, v.razorpay_order_id, v.razorpay_payment_id FROM (VALUES
    ('user@example.com', 'go-golang-microservices-masterclass', 49.99, 'success', 'order_K1a2b3c4d5', 'pay_P1a2b3c4d5'),
    ('user@example.com', 'fullstack-nextjs-react-mastery', 59.99, 'success', 'order_K2a2b3c4d5', 'pay_P2a2b3c4d5'),
    ('alice@example.com', 'fullstack-nextjs-react-mastery', 59.99, 'success', 'order_K3a2b3c4d5', 'pay_P3a2b3c4d5'),
    ('bob@example.com', 'go-golang-microservices-masterclass', 49.99, 'success', 'order_K4a2b3c4d5', 'pay_P4a2b3c4d5'),
    ('charlie@example.com', 'docker-kubernetes-modern-devops', 39.99, 'success', 'order_K5a2b3c4d5', 'pay_P5a2b3c4d5'),
    ('david@example.com', 'python-data-science-machine-learning-bootcamp', 44.99, 'success', 'order_K6a2b3c4d5', 'pay_P6a2b3c4d5'),
    ('eva@example.com', 'figma-ui-ux-design-system-mastery', 29.99, 'success', 'order_K7a2b3c4d5', 'pay_P7a2b3c4d5'),
    ('fiona@example.com', 'flutter-dart-multiplatform-mobile-dev', 49.99, 'success', 'order_K8a2b3c4d5', 'pay_P8a2b3c4d5'),
    ('bob@example.com', 'rust-systems-programming-masterclass', 54.99, 'success', 'order_K9a2b3c4d5', 'pay_P9a2b3c4d5'),
    ('eva@example.com', 'vue-nuxt3-modern-web-apps', 34.99, 'success', 'order_K0a2b3c4d5', 'pay_P0a2b3c4d5')
) AS v(email, slug, amount, status, razorpay_order_id, razorpay_payment_id)
JOIN users u ON u.email=v.email JOIN courses c ON c.slug=v.slug ON CONFLICT (id) DO NOTHING;

-- A subset of the transactions above were paid with a coupon applied.
INSERT INTO transactions_coupons (transaction_id, coupon_id)
SELECT t.id, cp.id FROM (VALUES
    ('order_K1a2b3c4d5', 'WELCOME50'),
    ('order_K3a2b3c4d5', 'NEXTJS20'),
    ('order_K6a2b3c4d5', 'DATASCIENCE')
) AS v(razorpay_order_id, code)
JOIN transactions t ON t.razorpay_order_id = v.razorpay_order_id
JOIN coupons cp ON cp.code = v.code
ON CONFLICT (transaction_id) DO NOTHING;

INSERT INTO updates (id, course_id, created_by, message, created_at)
SELECT gen_random_uuid(), c.id, u.id, v.message, v.created_at FROM (VALUES
    ('admin@example.com', 'go-golang-microservices-masterclass', 'Updated Chapter 3 with Go 1.24 Fiber v3 benchmarks and gRPC reflection examples.', CURRENT_TIMESTAMP - INTERVAL '2 days'),
    ('admin@example.com', 'fullstack-nextjs-react-mastery', 'Added new Next.js 15 Server Actions & Optimistic UI tutorial videos.', CURRENT_TIMESTAMP - INTERVAL '3 days'),
    ('john.doe@example.com', 'fullstack-nextjs-react-mastery', 'Released new source code repository with Tailwind v4 setup.', CURRENT_TIMESTAMP - INTERVAL '4 days'),
    ('jane.smith@example.com', 'go-golang-microservices-masterclass', 'Added hands-on Kafka event streaming assignment in Chapter 4.', CURRENT_TIMESTAMP - INTERVAL '5 days'),
    ('alex.rivers@example.com', 'system-design-distributed-systems', 'New interactive architecture diagram quiz attached to Lesson 2.', CURRENT_TIMESTAMP - INTERVAL '6 days'),
    ('admin@example.com', NULL, 'Platform Maintenance Scheduled: Server upgrade on Sunday 2:00 AM UTC.', CURRENT_TIMESTAMP - INTERVAL '1 day'),
    ('admin@example.com', NULL, 'Welcome to CourseHunt v2.0! Enjoy faster video streaming and instant search.', CURRENT_TIMESTAMP - INTERVAL '7 days'),
    ('sarah.connor@example.com', 'docker-kubernetes-modern-devops', 'Kubernetes 1.30 Helm charts updated in repository.', CURRENT_TIMESTAMP - INTERVAL '8 days'),
    ('emily.watson@example.com', 'figma-ui-ux-design-system-mastery', 'Figma 2026 Variables & Tokens guide added to downloadable resources.', CURRENT_TIMESTAMP - INTERVAL '9 days'),
    ('admin@example.com', NULL, 'New Coupon Released: Use WELCOME50 for 50% discount on all tech courses!', CURRENT_TIMESTAMP - INTERVAL '10 days')
) AS v(email, slug, message, created_at)
JOIN users u ON u.email=v.email
LEFT JOIN courses c ON c.slug=v.slug
ON CONFLICT (id) DO NOTHING;


