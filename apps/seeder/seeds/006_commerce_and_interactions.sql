-- 006_commerce_and_interactions.sql: Seed Coupons, Enrollments, Lesson Progress, Feedbacks, Wishlists, Cart Items, Discussions, Certificates, Transactions

-- Coupons (10 Coupons)
INSERT INTO coupons (id, code, discount_percent, max_usage, expires_at, is_active) VALUES
    ('cpn-001', 'WELCOME50',  50.00, 1000, CURRENT_TIMESTAMP + INTERVAL '90 days', true),
    ('cpn-002', 'GOFLASH',    30.00,  500, CURRENT_TIMESTAMP + INTERVAL '60 days', true),
    ('cpn-003', 'NEXTJS20',   20.00,  300, CURRENT_TIMESTAMP + INTERVAL '30 days', true),
    ('cpn-004', 'DEVOPS15',   15.00,  200, CURRENT_TIMESTAMP + INTERVAL '45 days', true),
    ('cpn-005', 'DATASCIENCE', 25.00,  400, CURRENT_TIMESTAMP + INTERVAL '60 days', true),
    ('cpn-006', 'AIFUTURE',   40.00,  100, CURRENT_TIMESTAMP + INTERVAL '15 days', true),
    ('cpn-007', 'FLUTTER30',  30.00,  250, CURRENT_TIMESTAMP + INTERVAL '30 days', true),
    ('cpn-008', 'FIGMADESIGN', 10.00,  500, CURRENT_TIMESTAMP + INTERVAL '90 days', true),
    ('cpn-009', 'RUSTMASTER', 35.00,  150, CURRENT_TIMESTAMP + INTERVAL '45 days', true),
    ('cpn-010', 'VUEROCKS',   12.00,  300, CURRENT_TIMESTAMP + INTERVAL '60 days', true)
ON CONFLICT (id) DO NOTHING;

-- Enrollments (15 Enrollments)
INSERT INTO enrollments (id, user_id, course_id, enrolled_at) VALUES
    ('enr-001', 'usr-student-001', 'crs-001', CURRENT_TIMESTAMP - INTERVAL '10 days'),
    ('enr-002', 'usr-student-001', 'crs-002', CURRENT_TIMESTAMP - INTERVAL '8 days'),
    ('enr-003', 'usr-student-001', 'crs-003', CURRENT_TIMESTAMP - INTERVAL '5 days'),
    ('enr-004', 'usr-student-002', 'crs-002', CURRENT_TIMESTAMP - INTERVAL '12 days'),
    ('enr-005', 'usr-student-002', 'crs-008', CURRENT_TIMESTAMP - INTERVAL '6 days'),
    ('enr-006', 'usr-student-003', 'crs-001', CURRENT_TIMESTAMP - INTERVAL '9 days'),
    ('enr-007', 'usr-student-003', 'crs-009', CURRENT_TIMESTAMP - INTERVAL '4 days'),
    ('enr-008', 'usr-student-004', 'crs-004', CURRENT_TIMESTAMP - INTERVAL '15 days'),
    ('enr-009', 'usr-student-004', 'crs-003', CURRENT_TIMESTAMP - INTERVAL '3 days'),
    ('enr-010', 'usr-student-005', 'crs-005', CURRENT_TIMESTAMP - INTERVAL '11 days'),
    ('enr-011', 'usr-student-005', 'crs-006', CURRENT_TIMESTAMP - INTERVAL '2 days'),
    ('enr-012', 'usr-student-006', 'crs-008', CURRENT_TIMESTAMP - INTERVAL '7 days'),
    ('enr-013', 'usr-student-006', 'crs-010', CURRENT_TIMESTAMP - INTERVAL '1 day'),
    ('enr-014', 'usr-student-007', 'crs-007', CURRENT_TIMESTAMP - INTERVAL '14 days'),
    ('enr-015', 'usr-student-007', 'crs-002', CURRENT_TIMESTAMP - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

-- Lesson Progress (30 Progress items)
INSERT INTO lesson_progress (id, user_id, lesson_id, course_id, completed, completed_at) VALUES
    ('prg-001', 'usr-student-001', 'les-001-01-01', 'crs-001', true, CURRENT_TIMESTAMP - INTERVAL '9 days'),
    ('prg-002', 'usr-student-001', 'les-001-01-02', 'crs-001', true, CURRENT_TIMESTAMP - INTERVAL '9 days'),
    ('prg-003', 'usr-student-001', 'les-001-01-03', 'crs-001', true, CURRENT_TIMESTAMP - INTERVAL '8 days'),
    ('prg-004', 'usr-student-001', 'les-001-01-04', 'crs-001', true, CURRENT_TIMESTAMP - INTERVAL '8 days'),
    ('prg-005', 'usr-student-001', 'les-001-01-05', 'crs-001', true, CURRENT_TIMESTAMP - INTERVAL '7 days'),

    ('prg-006', 'usr-student-002', 'les-002-01-01', 'crs-002', true, CURRENT_TIMESTAMP - INTERVAL '11 days'),
    ('prg-007', 'usr-student-002', 'les-002-01-02', 'crs-002', true, CURRENT_TIMESTAMP - INTERVAL '10 days'),
    ('prg-008', 'usr-student-002', 'les-002-01-03', 'crs-002', true, CURRENT_TIMESTAMP - INTERVAL '10 days'),
    ('prg-009', 'usr-student-002', 'les-002-01-04', 'crs-002', false, NULL),

    ('prg-010', 'usr-student-003', 'les-001-01-01', 'crs-001', true, CURRENT_TIMESTAMP - INTERVAL '8 days'),
    ('prg-011', 'usr-student-003', 'les-001-01-02', 'crs-001', true, CURRENT_TIMESTAMP - INTERVAL '8 days'),
    ('prg-012', 'usr-student-003', 'les-009-01-01', 'crs-009', true, CURRENT_TIMESTAMP - INTERVAL '3 days'),

    ('prg-013', 'usr-student-004', 'les-004-01-01', 'crs-004', true, CURRENT_TIMESTAMP - INTERVAL '14 days'),
    ('prg-014', 'usr-student-004', 'les-004-01-02', 'crs-004', true, CURRENT_TIMESTAMP - INTERVAL '14 days'),
    ('prg-015', 'usr-student-004', 'les-004-01-03', 'crs-004', true, CURRENT_TIMESTAMP - INTERVAL '13 days'),
    ('prg-016', 'usr-student-004', 'les-004-01-04', 'crs-004', true, CURRENT_TIMESTAMP - INTERVAL '12 days'),
    ('prg-017', 'usr-student-004', 'les-004-01-05', 'crs-004', true, CURRENT_TIMESTAMP - INTERVAL '12 days'),

    ('prg-018', 'usr-student-005', 'les-005-01-01', 'crs-005', true, CURRENT_TIMESTAMP - INTERVAL '10 days'),
    ('prg-019', 'usr-student-005', 'les-005-01-02', 'crs-005', true, CURRENT_TIMESTAMP - INTERVAL '10 days'),
    ('prg-020', 'usr-student-005', 'les-005-01-03', 'crs-005', true, CURRENT_TIMESTAMP - INTERVAL '9 days'),

    ('prg-021', 'usr-student-006', 'les-008-01-01', 'crs-008', true, CURRENT_TIMESTAMP - INTERVAL '6 days'),
    ('prg-022', 'usr-student-006', 'les-008-01-02', 'crs-008', true, CURRENT_TIMESTAMP - INTERVAL '6 days'),
    ('prg-023', 'usr-student-006', 'les-010-01-01', 'crs-010', true, CURRENT_TIMESTAMP - INTERVAL '1 day'),

    ('prg-024', 'usr-student-007', 'les-007-01-01', 'crs-007', true, CURRENT_TIMESTAMP - INTERVAL '13 days'),
    ('prg-025', 'usr-student-007', 'les-007-01-02', 'crs-007', true, CURRENT_TIMESTAMP - INTERVAL '13 days'),
    ('prg-026', 'usr-student-007', 'les-007-01-03', 'crs-007', true, CURRENT_TIMESTAMP - INTERVAL '12 days'),
    ('prg-027', 'usr-student-007', 'les-002-01-01', 'crs-002', true, CURRENT_TIMESTAMP - INTERVAL '4 days'),
    ('prg-028', 'usr-student-007', 'les-002-01-02', 'crs-002', true, CURRENT_TIMESTAMP - INTERVAL '4 days'),
    ('prg-029', 'usr-student-001', 'les-003-01-01', 'crs-003', true, CURRENT_TIMESTAMP - INTERVAL '4 days'),
    ('prg-030', 'usr-student-001', 'les-003-01-02', 'crs-003', true, CURRENT_TIMESTAMP - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

-- Feedbacks / Reviews (15 Feedbacks)
INSERT INTO feedbacks (id, user_id, course_id, rating, content, created_at) VALUES
    ('fb-001', 'usr-student-001', 'crs-001', 5, 'Absolute gold standard course for Go microservices! Fiber and sqlx explanations are top tier.', CURRENT_TIMESTAMP - INTERVAL '6 days'),
    ('fb-002', 'usr-student-003', 'crs-001', 5, 'Great practical examples. The gRPC section helped me refactor my company service.', CURRENT_TIMESTAMP - INTERVAL '5 days'),
    ('fb-003', 'usr-student-002', 'crs-002', 5, 'Next.js 15 App router explained so clearly. Highly recommend John Doe!', CURRENT_TIMESTAMP - INTERVAL '8 days'),
    ('fb-004', 'usr-student-007', 'crs-002', 4, 'Very good overview of Server Components and Server Actions.', CURRENT_TIMESTAMP - INTERVAL '3 days'),
    ('fb-005', 'usr-student-001', 'crs-003', 5, 'Alex Rivers is an amazing instructor. System design principles are crystal clear.', CURRENT_TIMESTAMP - INTERVAL '2 days'),
    ('fb-006', 'usr-student-004', 'crs-004', 5, 'Docker and Kubernetes simplified! Built my first cluster seamlessly.', CURRENT_TIMESTAMP - INTERVAL '10 days'),
    ('fb-007', 'usr-student-005', 'crs-005', 5, 'Pandas & ML models explained with real dataset examples.', CURRENT_TIMESTAMP - INTERVAL '7 days'),
    ('fb-008', 'usr-student-005', 'crs-006', 5, 'PyTorch and LLM fine-tuning content is cutting-edge.', CURRENT_TIMESTAMP - INTERVAL '1 day'),
    ('fb-009', 'usr-student-007', 'crs-007', 4, 'Flutter widgets and Riverpod state management covered thoroughly.', CURRENT_TIMESTAMP - INTERVAL '10 days'),
    ('fb-010', 'usr-student-006', 'crs-008', 5, 'Figma Auto Layout 5.0 and design system tokens are fantastic.', CURRENT_TIMESTAMP - INTERVAL '4 days'),
    ('fb-011', 'usr-student-003', 'crs-009', 5, 'Rust memory model and borrow checker finally clicked for me.', CURRENT_TIMESTAMP - INTERVAL '2 days'),
    ('fb-012', 'usr-student-006', 'crs-010', 4, 'Solid Vue 3 & Nuxt 3 full-stack guide.', CURRENT_TIMESTAMP - INTERVAL '1 day'),
    ('fb-013', 'usr-student-004', 'crs-003', 5, 'Invaluable preparation for high-level system design interviews.', CURRENT_TIMESTAMP - INTERVAL '1 day'),
    ('fb-014', 'usr-student-002', 'crs-008', 5, 'Extremely practical design-to-code workflow.', CURRENT_TIMESTAMP - INTERVAL '5 days'),
    ('fb-015', 'usr-student-001', 'crs-002', 5, 'Loved the Better-Auth and Prisma/Postgres integration details.', CURRENT_TIMESTAMP - INTERVAL '4 days')
ON CONFLICT (id) DO NOTHING;

-- Wishlists (10 Items)
INSERT INTO wishlists (id, user_id, course_id) VALUES
    ('wsh-001', 'usr-student-001', 'crs-004'),
    ('wsh-002', 'usr-student-001', 'crs-006'),
    ('wsh-003', 'usr-student-002', 'crs-001'),
    ('wsh-004', 'usr-student-002', 'crs-003'),
    ('wsh-005', 'usr-student-003', 'crs-005'),
    ('wsh-006', 'usr-student-004', 'crs-009'),
    ('wsh-007', 'usr-student-005', 'crs-001'),
    ('wsh-008', 'usr-student-006', 'crs-002'),
    ('wsh-009', 'usr-student-007', 'crs-008'),
    ('wsh-010', 'usr-student-007', 'crs-010')
ON CONFLICT (id) DO NOTHING;

-- Cart Items (10 Items)
INSERT INTO cart_items (id, user_id, course_id) VALUES
    ('crt-001', 'usr-student-001', 'crs-009'),
    ('crt-002', 'usr-student-002', 'crs-005'),
    ('crt-003', 'usr-student-003', 'crs-004'),
    ('crt-004', 'usr-student-004', 'crs-006'),
    ('crt-005', 'usr-student-005', 'crs-002'),
    ('crt-006', 'usr-student-006', 'crs-007'),
    ('crt-007', 'usr-student-007', 'crs-003'),
    ('crt-008', 'usr-student-002', 'crs-010'),
    ('crt-009', 'usr-student-003', 'crs-008'),
    ('crt-010', 'usr-student-004', 'crs-001')
ON CONFLICT (id) DO NOTHING;

-- Discussions & Replies (10 Discussions)
INSERT INTO discussions (id, course_id, user_id, lesson_id, content, created_at) VALUES
    ('dsc-001', 'crs-001', 'usr-student-001', 'les-001-01-02', 'Should we allow credentials when setting allowed origins in Fiber middleware?', CURRENT_TIMESTAMP - INTERVAL '5 days'),
    ('dsc-002', 'crs-001', 'usr-student-003', 'les-001-01-03', 'What is the optimal max_open_conns setting for a 4-core database server?', CURRENT_TIMESTAMP - INTERVAL '4 days'),
    ('dsc-003', 'crs-002', 'usr-student-002', 'les-002-01-02', 'When should we prefer Server Actions over standard Fiber API routes?', CURRENT_TIMESTAMP - INTERVAL '7 days'),
    ('dsc-004', 'crs-003', 'usr-student-004', 'les-003-02-01', 'How does consistent hashing prevent cascading failures during node crash?', CURRENT_TIMESTAMP - INTERVAL '2 days'),
    ('dsc-005', 'crs-004', 'usr-student-004', 'les-004-03-01', 'Is NGINX ingress controller preferred over Traefik in production?', CURRENT_TIMESTAMP - INTERVAL '9 days'),
    ('dsc-006', 'crs-005', 'usr-student-005', 'les-005-02-01', 'Tips for downcasting float64 columns to float32 on big datasets.', CURRENT_TIMESTAMP - INTERVAL '6 days'),
    ('dsc-007', 'crs-006', 'usr-student-005', 'les-006-04-01', 'What rank r value is recommended for fine-tuning Llama 3 8B?', CURRENT_TIMESTAMP - INTERVAL '1 day'),
    ('dsc-008', 'crs-007', 'usr-student-007', 'les-007-03-01', 'Why is Riverpod recommended over Provider for new Flutter apps?', CURRENT_TIMESTAMP - INTERVAL '8 days'),
    ('dsc-009', 'crs-008', 'usr-student-006', 'les-008-02-01', 'How to link color mode variables to Tailwind dark classes.', CURRENT_TIMESTAMP - INTERVAL '3 days'),
    ('dsc-010', 'crs-009', 'usr-student-003', 'les-009-01-01', 'When to use RefCell versus Mutex for interior mutability?', CURRENT_TIMESTAMP - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- Certificates (10 Certificates)
INSERT INTO certificates (id, user_id, course_id, issued_at) VALUES
    ('crt-001', 'usr-student-001', 'crs-001', CURRENT_TIMESTAMP - INTERVAL '7 days'),
    ('crt-002', 'usr-student-004', 'crs-004', CURRENT_TIMESTAMP - INTERVAL '12 days'),
    ('crt-003', 'usr-student-002', 'crs-008', CURRENT_TIMESTAMP - INTERVAL '5 days'),
    ('crt-004', 'usr-student-005', 'crs-005', CURRENT_TIMESTAMP - INTERVAL '9 days'),
    ('crt-005', 'usr-student-007', 'crs-007', CURRENT_TIMESTAMP - INTERVAL '11 days'),
    ('crt-006', 'usr-student-003', 'crs-001', CURRENT_TIMESTAMP - INTERVAL '4 days'),
    ('crt-007', 'usr-student-001', 'crs-003', CURRENT_TIMESTAMP - INTERVAL '2 days'),
    ('crt-008', 'usr-student-006', 'crs-010', CURRENT_TIMESTAMP - INTERVAL '1 day'),
    ('crt-009', 'usr-student-002', 'crs-002', CURRENT_TIMESTAMP - INTERVAL '6 days'),
    ('crt-010', 'usr-student-003', 'crs-009', CURRENT_TIMESTAMP - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- Transactions (10 Transactions)
INSERT INTO transactions (id, user_id, course_id, amount, status, razorpay_order_id, razorpay_payment_id) VALUES
    ('trx-001', 'usr-student-001', 'crs-001', 49.99, 'success', 'order_K1a2b3c4d5', 'pay_P1a2b3c4d5'),
    ('trx-002', 'usr-student-001', 'crs-002', 59.99, 'success', 'order_K2a2b3c4d5', 'pay_P2a2b3c4d5'),
    ('trx-003', 'usr-student-002', 'crs-002', 59.99, 'success', 'order_K3a2b3c4d5', 'pay_P3a2b3c4d5'),
    ('trx-004', 'usr-student-003', 'crs-001', 49.99, 'success', 'order_K4a2b3c4d5', 'pay_P4a2b3c4d5'),
    ('trx-005', 'usr-student-004', 'crs-004', 39.99, 'success', 'order_K5a2b3c4d5', 'pay_P5a2b3c4d5'),
    ('trx-006', 'usr-student-005', 'crs-005', 44.99, 'success', 'order_K6a2b3c4d5', 'pay_P6a2b3c4d5'),
    ('trx-007', 'usr-student-006', 'crs-008', 29.99, 'success', 'order_K7a2b3c4d5', 'pay_P7a2b3c4d5'),
    ('trx-008', 'usr-student-007', 'crs-007', 49.99, 'success', 'order_K8a2b3c4d5', 'pay_P8a2b3c4d5'),
    ('trx-009', 'usr-student-003', 'crs-009', 54.99, 'success', 'order_K9a2b3c4d5', 'pay_P9a2b3c4d5'),
    ('trx-010', 'usr-student-006', 'crs-010', 34.99, 'success', 'order_K0a2b3c4d5', 'pay_P0a2b3c4d5')
ON CONFLICT (id) DO NOTHING;
