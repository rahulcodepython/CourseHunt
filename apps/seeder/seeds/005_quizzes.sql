-- 005_quizzes.sql: Seed Quizzes, Questions, Options, Arrange Items, Fill Blank Answers

-- Quiz Metadata (10 Quizzes)
INSERT INTO quiz_metadata (id, lesson_id, title, time_limit_seconds, total_questions, pass_score_percent) VALUES
    ('qz-001', 'les-001-01-05', 'Go Syntax & Basic Concurrency Quiz', 600, 3, 70),
    ('qz-002', 'les-001-02-05', 'Fiber REST API Quiz', 600, 3, 70),
    ('qz-003', 'les-002-01-05', 'Next.js App Router Quiz', 900, 3, 80),
    ('qz-004', 'les-002-02-05', 'React Server Components Quiz', 600, 3, 75),
    ('qz-005', 'les-003-01-05', 'System Design Foundations Quiz', 600, 3, 70),
    ('qz-006', 'les-004-01-05', 'Docker Basics Quiz', 900, 3, 80),
    ('qz-007', 'les-005-01-05', 'Python Data Science Quiz', 600, 3, 70),
    ('qz-008', 'les-006-01-05', 'Deep Learning & Neural Nets Quiz', 600, 3, 75),
    ('qz-009', 'les-007-01-05', 'Flutter Widget Lifecycle Quiz', 600, 3, 70),
    ('qz-010', 'les-009-01-05', 'Rust Ownership & Lifetimes Quiz', 900, 3, 80)
ON CONFLICT (id) DO NOTHING;

-- Quiz Questions (30 Questions, 3 per quiz)
INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, points) VALUES
    -- Quiz 1
    ('q-001-1', 'qz-001', 'What is the default zero value of a pointer in Go?', 'single_choice', 10),
    ('q-001-2', 'qz-001', 'Select all keywords that support concurrency in Go.', 'multi_choice', 10),
    ('q-001-3', 'qz-001', 'Fill in the blank: Go channels are initialized using the _____ built-in function.', 'fill_blank', 10),
    -- Quiz 2
    ('q-002-1', 'qz-002', 'Which Fiber method registers a GET route handler?', 'single_choice', 10),
    ('q-002-2', 'qz-002', 'Arrange the HTTP request pipeline order in Fiber.', 'arrange', 10),
    ('q-002-3', 'qz-002', 'What function is used in Fiber to parse JSON request bodies?', 'fill_blank', 10),
    -- Quiz 3
    ('q-003-1', 'qz-003', 'Where are page routes defined in the Next.js App Router?', 'single_choice', 10),
    ('q-003-2', 'qz-003', 'Which special file defines layout wrappers in Next.js?', 'fill_blank', 10),
    ('q-003-3', 'qz-003', 'Can Server Components import Client Components in Next.js?', 'single_choice', 10),
    -- Quiz 4
    ('q-004-1', 'qz-004', 'What directive marks a React component as a Client Component?', 'fill_blank', 10),
    ('q-004-2', 'qz-004', 'Which hook can only be used inside Client Components?', 'single_choice', 10),
    ('q-004-3', 'qz-004', 'Do React Server Components ship JavaScript bundles to the browser?', 'single_choice', 10),
    -- Quiz 5
    ('q-005-1', 'qz-005', 'According to CAP Theorem, what two guarantees are chosen during network partition?', 'single_choice', 10),
    ('q-005-2', 'qz-005', 'Which load balancing algorithm distributes requests based on server capacity?', 'single_choice', 10),
    ('q-005-3', 'qz-005', 'Fill in the blank: _____ caching stores response data closer to users geographically.', 'fill_blank', 10),
    -- Quiz 6
    ('q-006-1', 'qz-006', 'Which Dockerfile instruction specifies the base container image?', 'fill_blank', 10),
    ('q-006-2', 'qz-006', 'What command builds a Docker image from a Dockerfile?', 'single_choice', 10),
    ('q-006-3', 'qz-006', 'Arrange the steps to publish a Docker image to Docker Hub.', 'arrange', 10),
    -- Quiz 7
    ('q-007-1', 'qz-007', 'Which library is primary for N-dimensional numerical array computation in Python?', 'single_choice', 10),
    ('q-007-2', 'qz-007', 'Fill in the blank: A 2D labeled data structure in Pandas is called a _____.', 'fill_blank', 10),
    ('q-007-3', 'qz-007', 'Which function reads CSV files into a Pandas DataFrame?', 'single_choice', 10),
    -- Quiz 8
    ('q-008-1', 'qz-008', 'In PyTorch, what method calculates gradients during backpropagation?', 'single_choice', 10),
    ('q-008-2', 'qz-008', 'Fill in the blank: The activation function ReLU stands for Rectified _____ Unit.', 'fill_blank', 10),
    ('q-008-3', 'qz-008', 'Which optimizer is widely used for adaptive gradient learning in Deep Learning?', 'single_choice', 10),
    -- Quiz 9
    ('q-009-1', 'qz-009', 'Which method is called first when a StateWidget is inserted into the tree?', 'single_choice', 10),
    ('q-009-2', 'qz-009', 'Fill in the blank: To update the UI in a Flutter State, call the _____ method.', 'fill_blank', 10),
    ('q-009-3', 'qz-009', 'StatelessWidgets re-render whenever their properties change.', 'single_choice', 10),
    -- Quiz 10
    ('q-010-1', 'qz-010', 'How many mutable references to a resource can exist simultaneously in Rust?', 'single_choice', 10),
    ('q-010-2', 'qz-010', 'Fill in the blank: Rust memory is automatically cleaned up when a variable goes out of _____.', 'fill_blank', 10),
    ('q-010-3', 'qz-010', 'Which keyword is used to transfer ownership of a variable into a closure?', 'single_choice', 10)
ON CONFLICT (id) DO NOTHING;

-- Question Options (for choice questions)
INSERT INTO quiz_options (id, question_id, option_text, is_correct) VALUES
    ('opt-001-1-1', 'q-001-1', 'nil', true),
    ('opt-001-1-2', 'q-001-1', 'null', false),
    ('opt-001-1-3', 'q-001-1', '0', false),
    ('opt-001-1-4', 'q-001-1', 'undefined', false),

    ('opt-001-2-1', 'q-001-2', 'go', true),
    ('opt-001-2-2', 'q-001-2', 'select', true),
    ('opt-001-2-3', 'q-001-2', 'chan', true),
    ('opt-001-2-4', 'q-001-2', 'async', false),

    ('opt-002-1-1', 'q-002-1', 'app.Get()', true),
    ('opt-002-1-2', 'q-002-1', 'app.Post()', false),
    ('opt-002-1-3', 'q-002-1', 'app.Listen()', false),

    ('opt-003-1-1', 'q-003-1', 'inside app/ folder as page.tsx', true),
    ('opt-003-1-2', 'q-003-1', 'inside pages/ folder as index.js', false),
    ('opt-003-1-3', 'q-003-1', 'inside routes/ folder', false),

    ('opt-003-3-1', 'q-003-3', 'Yes, Server Components can render Client Components', true),
    ('opt-003-3-2', 'q-003-3', 'No, never', false),

    ('opt-004-2-1', 'q-004-2', 'useState', true),
    ('opt-004-2-2', 'q-004-2', 'fetch', false),

    ('opt-004-3-1', 'q-004-3', 'No, their code stays strictly on the server', true),
    ('opt-004-3-2', 'q-004-3', 'Yes, all code is sent to browser', false),

    ('opt-005-1-1', 'q-005-1', 'Consistency (C) and Availability (A) or Partition Tolerance (P)', true),
    ('opt-005-1-2', 'q-005-1', 'Latency and Throughput', false),

    ('opt-005-2-1', 'q-005-2', 'Weighted Round Robin / Least Connections', true),
    ('opt-005-2-2', 'q-005-2', 'Random Choice', false),

    ('opt-006-2-1', 'q-006-2', 'docker build -t name .', true),
    ('opt-006-2-2', 'q-006-2', 'docker run -d name', false),

    ('opt-007-1-1', 'q-007-1', 'NumPy', true),
    ('opt-007-1-2', 'q-007-1', 'Django', false),

    ('opt-007-3-1', 'q-007-3', 'pd.read_csv()', true),
    ('opt-007-3-2', 'q-007-3', 'pd.load_csv()', false),

    ('opt-008-1-1', 'q-008-1', 'loss.backward()', true),
    ('opt-008-1-2', 'q-008-1', 'optimizer.step()', false),

    ('opt-008-3-1', 'q-008-3', 'Adam / AdamW', true),
    ('opt-008-3-2', 'q-008-3', 'Linear Regression', false),

    ('opt-009-1-1', 'q-009-1', 'initState()', true),
    ('opt-009-1-2', 'q-009-1', 'build()', false),

    ('opt-009-3-1', 'q-009-3', 'True', true),
    ('opt-009-3-2', 'q-009-3', 'False', false),

    ('opt-010-1-1', 'q-010-1', 'Exactly 1', true),
    ('opt-010-1-2', 'q-010-1', 'Unlimited', false),

    ('opt-010-3-1', 'q-010-3', 'move', true),
    ('opt-010-3-2', 'q-010-3', 'borrow', false)
ON CONFLICT (id) DO NOTHING;

-- Arrange Items
INSERT INTO quiz_arrange_items (id, question_id, item_text, correct_order) VALUES
    ('arr-002-2-1', 'q-002-2', 'Incoming HTTP Request arrives at port', 1),
    ('arr-002-2-2', 'q-002-2', 'Global Middleware execution (CORS, Logger)', 2),
    ('arr-002-2-3', 'q-002-2', 'Route Handler matches request path', 3),
    ('arr-002-2-4', 'q-002-2', 'JSON Response written to client', 4),

    ('arr-006-3-1', 'q-006-3', 'Write Dockerfile configuration', 1),
    ('arr-006-3-2', 'q-006-3', 'Build local image: docker build', 2),
    ('arr-006-3-3', 'q-006-3', 'Tag image with registry repository name', 3),
    ('arr-006-3-4', 'q-006-3', 'Push image: docker push', 4)
ON CONFLICT (id) DO NOTHING;

-- Fill Blank Answers
INSERT INTO quiz_fill_blank_answers (question_id, answer) VALUES
    ('q-001-3', 'make'),
    ('q-002-3', 'c.BodyParser'),
    ('q-003-2', 'layout.tsx'),
    ('q-004-1', 'use client'),
    ('q-005-3', 'CDN'),
    ('q-006-1', 'FROM'),
    ('q-007-2', 'DataFrame'),
    ('q-008-2', 'Linear'),
    ('q-009-2', 'setState'),
    ('q-010-2', 'scope')
ON CONFLICT (id) DO NOTHING;
