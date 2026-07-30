-- 005_quizzes.sql: Seed Quizzes, Questions, Options, Arrange Items, Fill Blank Answers

-- Quiz Metadata (10 Quizzes)
INSERT INTO quiz_metadata (id, lesson_id, title, time_limit_seconds, total_questions, pass_score_percent) VALUES
    ('88888888-8888-8888-8888-888888888801', '77777777-7777-7777-0001-0000000105', 'Go Syntax & Basic Concurrency Quiz', 600, 3, 70),
    ('88888888-8888-8888-8888-888888888802', '77777777-7777-7777-0001-0000000205', 'Fiber REST API Quiz', 600, 3, 70),
    ('88888888-8888-8888-8888-888888888803', '77777777-7777-7777-0002-0000000105', 'Next.js App Router Quiz', 900, 3, 80),
    ('88888888-8888-8888-8888-888888888804', '77777777-7777-7777-0002-0000000205', 'React Server Components Quiz', 600, 3, 75),
    ('88888888-8888-8888-8888-888888888805', '77777777-7777-7777-0003-0000000105', 'System Design Foundations Quiz', 600, 3, 70),
    ('88888888-8888-8888-8888-888888888806', '77777777-7777-7777-0004-0000000105', 'Docker Basics Quiz', 900, 3, 80),
    ('88888888-8888-8888-8888-888888888807', '77777777-7777-7777-0005-0000000105', 'Python Data Science Quiz', 600, 3, 70),
    ('88888888-8888-8888-8888-888888888808', '77777777-7777-7777-0006-0000000105', 'Deep Learning & Neural Nets Quiz', 600, 3, 75),
    ('88888888-8888-8888-8888-888888888809', '77777777-7777-7777-0007-0000000105', 'Flutter Widget Lifecycle Quiz', 600, 3, 70),
    ('88888888-8888-8888-8888-888888888810', '77777777-7777-7777-0009-0000000105', 'Rust Ownership & Lifetimes Quiz', 900, 3, 80)
ON CONFLICT (id) DO NOTHING;

-- Quiz Questions (30 Questions, 3 per quiz)
INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, points) VALUES
    -- Quiz 1
    ('99999999-9999-9999-0001-000000000001', '88888888-8888-8888-8888-888888888801', 'What is the default zero value of a pointer in Go?', 'single_choice', 10),
    ('99999999-9999-9999-0001-000000000002', '88888888-8888-8888-8888-888888888801', 'Select all keywords that support concurrency in Go.', 'multi_choice', 10),
    ('99999999-9999-9999-0001-000000000003', '88888888-8888-8888-8888-888888888801', 'Fill in the blank: Go channels are initialized using the _____ built-in function.', 'fill_blank', 10),
    -- Quiz 2
    ('99999999-9999-9999-0002-000000000001', '88888888-8888-8888-8888-888888888802', 'Which Fiber method registers a GET route handler?', 'single_choice', 10),
    ('99999999-9999-9999-0002-000000000002', '88888888-8888-8888-8888-888888888802', 'Arrange the HTTP request pipeline order in Fiber.', 'arrange', 10),
    ('99999999-9999-9999-0002-000000000003', '88888888-8888-8888-8888-888888888802', 'What function is used in Fiber to parse JSON request bodies?', 'fill_blank', 10),
    -- Quiz 3
    ('99999999-9999-9999-0003-000000000001', '88888888-8888-8888-8888-888888888803', 'Where are page routes defined in the Next.js App Router?', 'single_choice', 10),
    ('99999999-9999-9999-0003-000000000002', '88888888-8888-8888-8888-888888888803', 'Which special file defines layout wrappers in Next.js?', 'fill_blank', 10),
    ('99999999-9999-9999-0003-000000000003', '88888888-8888-8888-8888-888888888803', 'Can Server Components import Client Components in Next.js?', 'single_choice', 10),
    -- Quiz 4
    ('99999999-9999-9999-0004-000000000001', '88888888-8888-8888-8888-888888888804', 'What directive marks a React component as a Client Component?', 'fill_blank', 10),
    ('99999999-9999-9999-0004-000000000002', '88888888-8888-8888-8888-888888888804', 'Which hook can only be used inside Client Components?', 'single_choice', 10),
    ('99999999-9999-9999-0004-000000000003', '88888888-8888-8888-8888-888888888804', 'Do React Server Components ship JavaScript bundles to the browser?', 'single_choice', 10),
    -- Quiz 5
    ('99999999-9999-9999-0005-000000000001', '88888888-8888-8888-8888-888888888805', 'According to CAP Theorem, what two guarantees are chosen during network partition?', 'single_choice', 10),
    ('99999999-9999-9999-0005-000000000002', '88888888-8888-8888-8888-888888888805', 'Which load balancing algorithm distributes requests based on server capacity?', 'single_choice', 10),
    ('99999999-9999-9999-0005-000000000003', '88888888-8888-8888-8888-888888888805', 'Fill in the blank: _____ caching stores response data closer to users geographically.', 'fill_blank', 10),
    -- Quiz 6
    ('99999999-9999-9999-0006-000000000001', '88888888-8888-8888-8888-888888888806', 'Which Dockerfile instruction specifies the base container image?', 'fill_blank', 10),
    ('99999999-9999-9999-0006-000000000002', '88888888-8888-8888-8888-888888888806', 'What command builds a Docker image from a Dockerfile?', 'single_choice', 10),
    ('99999999-9999-9999-0006-000000000003', '88888888-8888-8888-8888-888888888806', 'Arrange the steps to publish a Docker image to Docker Hub.', 'arrange', 10),
    -- Quiz 7
    ('99999999-9999-9999-0007-000000000001', '88888888-8888-8888-8888-888888888807', 'Which library is primary for N-dimensional numerical array computation in Python?', 'single_choice', 10),
    ('99999999-9999-9999-0007-000000000002', '88888888-8888-8888-8888-888888888807', 'Fill in the blank: A 2D labeled data structure in Pandas is called a _____.', 'fill_blank', 10),
    ('99999999-9999-9999-0007-000000000003', '88888888-8888-8888-8888-888888888807', 'Which function reads CSV files into a Pandas DataFrame?', 'single_choice', 10),
    -- Quiz 8
    ('99999999-9999-9999-0008-000000000001', '88888888-8888-8888-8888-888888888808', 'In PyTorch, what method calculates gradients during backpropagation?', 'single_choice', 10),
    ('99999999-9999-9999-0008-000000000002', '88888888-8888-8888-8888-888888888808', 'Fill in the blank: The activation function ReLU stands for Rectified _____ Unit.', 'fill_blank', 10),
    ('99999999-9999-9999-0008-000000000003', '88888888-8888-8888-8888-888888888808', 'Which optimizer is widely used for adaptive gradient learning in Deep Learning?', 'single_choice', 10),
    -- Quiz 9
    ('99999999-9999-9999-0009-000000000001', '88888888-8888-8888-8888-888888888809', 'Which method is called first when a StateWidget is inserted into the tree?', 'single_choice', 10),
    ('99999999-9999-9999-0009-000000000002', '88888888-8888-8888-8888-888888888809', 'Fill in the blank: To update the UI in a Flutter State, call the _____ method.', 'fill_blank', 10),
    ('99999999-9999-9999-0009-000000000003', '88888888-8888-8888-8888-888888888809', 'StatelessWidgets re-render whenever their properties change.', 'single_choice', 10),
    -- Quiz 10
    ('99999999-9999-9999-0010-000000000001', '88888888-8888-8888-8888-888888888810', 'How many mutable references to a resource can exist simultaneously in Rust?', 'single_choice', 10),
    ('99999999-9999-9999-0010-000000000002', '88888888-8888-8888-8888-888888888810', 'Fill in the blank: Rust memory is automatically cleaned up when a variable goes out of _____.', 'fill_blank', 10),
    ('99999999-9999-9999-0010-000000000003', '88888888-8888-8888-8888-888888888810', 'Which keyword is used to transfer ownership of a variable into a closure?', 'single_choice', 10)
ON CONFLICT (id) DO NOTHING;

-- Question Options (for choice questions)
INSERT INTO quiz_options (id, question_id, option_text, is_correct) VALUES
    ('opt-001-1-1', '99999999-9999-9999-0001-000000000001', 'nil', true),
    ('opt-001-1-2', '99999999-9999-9999-0001-000000000001', 'null', false),
    ('opt-001-1-3', '99999999-9999-9999-0001-000000000001', '0', false),
    ('opt-001-1-4', '99999999-9999-9999-0001-000000000001', 'undefined', false),

    ('opt-001-2-1', '99999999-9999-9999-0001-000000000002', 'go', true),
    ('opt-001-2-2', '99999999-9999-9999-0001-000000000002', 'select', true),
    ('opt-001-2-3', '99999999-9999-9999-0001-000000000002', 'chan', true),
    ('opt-001-2-4', '99999999-9999-9999-0001-000000000002', 'async', false),

    ('opt-002-1-1', '99999999-9999-9999-0002-000000000001', 'app.Get()', true),
    ('opt-002-1-2', '99999999-9999-9999-0002-000000000001', 'app.Post()', false),
    ('opt-002-1-3', '99999999-9999-9999-0002-000000000001', 'app.Listen()', false),

    ('opt-003-1-1', '99999999-9999-9999-0003-000000000001', 'inside app/ folder as page.tsx', true),
    ('opt-003-1-2', '99999999-9999-9999-0003-000000000001', 'inside pages/ folder as index.js', false),
    ('opt-003-1-3', '99999999-9999-9999-0003-000000000001', 'inside routes/ folder', false),

    ('opt-003-3-1', '99999999-9999-9999-0003-000000000003', 'Yes, Server Components can render Client Components', true),
    ('opt-003-3-2', '99999999-9999-9999-0003-000000000003', 'No, never', false),

    ('opt-004-2-1', '99999999-9999-9999-0004-000000000002', 'useState', true),
    ('opt-004-2-2', '99999999-9999-9999-0004-000000000002', 'fetch', false),

    ('opt-004-3-1', '99999999-9999-9999-0004-000000000003', 'No, their code stays strictly on the server', true),
    ('opt-004-3-2', '99999999-9999-9999-0004-000000000003', 'Yes, all code is sent to browser', false),

    ('opt-005-1-1', '99999999-9999-9999-0005-000000000001', 'Consistency (C) and Availability (A) or Partition Tolerance (P)', true),
    ('opt-005-1-2', '99999999-9999-9999-0005-000000000001', 'Latency and Throughput', false),

    ('opt-005-2-1', '99999999-9999-9999-0005-000000000002', 'Weighted Round Robin / Least Connections', true),
    ('opt-005-2-2', '99999999-9999-9999-0005-000000000002', 'Random Choice', false),

    ('opt-006-2-1', '99999999-9999-9999-0006-000000000002', 'docker build -t name .', true),
    ('opt-006-2-2', '99999999-9999-9999-0006-000000000002', 'docker run -d name', false),

    ('opt-007-1-1', '99999999-9999-9999-0007-000000000001', 'NumPy', true),
    ('opt-007-1-2', '99999999-9999-9999-0007-000000000001', 'Django', false),

    ('opt-007-3-1', '99999999-9999-9999-0007-000000000003', 'pd.read_csv()', true),
    ('opt-007-3-2', '99999999-9999-9999-0007-000000000003', 'pd.load_csv()', false),

    ('opt-008-1-1', '99999999-9999-9999-0008-000000000001', 'loss.backward()', true),
    ('opt-008-1-2', '99999999-9999-9999-0008-000000000001', 'optimizer.step()', false),

    ('opt-008-3-1', '99999999-9999-9999-0008-000000000003', 'Adam / AdamW', true),
    ('opt-008-3-2', '99999999-9999-9999-0008-000000000003', 'Linear Regression', false),

    ('opt-009-1-1', '99999999-9999-9999-0009-000000000001', 'initState()', true),
    ('opt-009-1-2', '99999999-9999-9999-0009-000000000001', 'build()', false),

    ('opt-009-3-1', '99999999-9999-9999-0009-000000000003', 'True', true),
    ('opt-009-3-2', '99999999-9999-9999-0009-000000000003', 'False', false),

    ('opt-010-1-1', '99999999-9999-9999-0010-000000000001', 'Exactly 1', true),
    ('opt-010-1-2', '99999999-9999-9999-0010-000000000001', 'Unlimited', false),

    ('opt-010-3-1', '99999999-9999-9999-0010-000000000003', 'move', true),
    ('opt-010-3-2', '99999999-9999-9999-0010-000000000003', 'borrow', false)
ON CONFLICT (id) DO NOTHING;

-- Arrange Items
INSERT INTO quiz_arrange_items (id, question_id, item_text, correct_order) VALUES
    ('arr-002-2-1', '99999999-9999-9999-0002-000000000002', 'Incoming HTTP Request arrives at port', 1),
    ('arr-002-2-2', '99999999-9999-9999-0002-000000000002', 'Global Middleware execution (CORS, Logger)', 2),
    ('arr-002-2-3', '99999999-9999-9999-0002-000000000002', 'Route Handler matches request path', 3),
    ('arr-002-2-4', '99999999-9999-9999-0002-000000000002', 'JSON Response written to client', 4),

    ('arr-006-3-1', '99999999-9999-9999-0006-000000000003', 'Write Dockerfile configuration', 1),
    ('arr-006-3-2', '99999999-9999-9999-0006-000000000003', 'Build local image: docker build', 2),
    ('arr-006-3-3', '99999999-9999-9999-0006-000000000003', 'Tag image with registry repository name', 3),
    ('arr-006-3-4', '99999999-9999-9999-0006-000000000003', 'Push image: docker push', 4)
ON CONFLICT (id) DO NOTHING;

-- Fill Blank Answers
INSERT INTO quiz_fill_blank_answers (question_id, answer) VALUES
    ('99999999-9999-9999-0001-000000000003', 'make'),
    ('99999999-9999-9999-0002-000000000003', 'c.BodyParser'),
    ('99999999-9999-9999-0003-000000000002', 'layout.tsx'),
    ('99999999-9999-9999-0004-000000000001', 'use client'),
    ('99999999-9999-9999-0005-000000000003', 'CDN'),
    ('99999999-9999-9999-0006-000000000001', 'FROM'),
    ('99999999-9999-9999-0007-000000000002', 'DataFrame'),
    ('99999999-9999-9999-0008-000000000002', 'Linear'),
    ('99999999-9999-9999-0009-000000000002', 'setState'),
    ('99999999-9999-9999-0010-000000000002', 'scope')
ON CONFLICT (id) DO NOTHING;
