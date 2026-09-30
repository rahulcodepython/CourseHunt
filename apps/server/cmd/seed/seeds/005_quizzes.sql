-- 005_quizzes.sql: Seed Quizzes, Questions, Options, Arrange Items, Fill Blank Answers

INSERT INTO quiz_metadata (id, lesson_id, title, time_limit_seconds, total_questions, pass_score_percent)
SELECT gen_random_uuid(), l.id, v.title, v.time_limit_seconds, v.total_questions, v.pass_score_percent
FROM (VALUES
    ('go-golang-microservices-masterclass', 1, 5, 'Go Syntax & Basic Concurrency Quiz', 600, 3, 70),
    ('go-golang-microservices-masterclass', 2, 5, 'Fiber REST API Quiz', 600, 3, 70),
    ('fullstack-nextjs-react-mastery', 1, 5, 'Next.js App Router Quiz', 900, 3, 80),
    ('fullstack-nextjs-react-mastery', 2, 5, 'React Server Components Quiz', 600, 3, 75),
    ('system-design-distributed-systems', 1, 5, 'System Design Foundations Quiz', 600, 3, 70),
    ('docker-kubernetes-modern-devops', 1, 5, 'Docker Basics Quiz', 900, 3, 80),
    ('python-data-science-machine-learning-bootcamp', 1, 5, 'Python Data Science Quiz', 600, 3, 70),
    ('deep-learning-llms-transformers-python', 1, 5, 'Deep Learning & Neural Nets Quiz', 600, 3, 75),
    ('flutter-dart-multiplatform-mobile-dev', 1, 5, 'Flutter Widget Lifecycle Quiz', 600, 3, 70),
    ('rust-systems-programming-masterclass', 1, 5, 'Rust Ownership & Lifetimes Quiz', 1200, 10, 70)
) AS v(slug, ch_no, l_no, title, time_limit_seconds, total_questions, pass_score_percent)
JOIN courses c ON c.slug = v.slug
JOIN chapters ch ON ch.course_id = c.id AND ch.chapter_no = v.ch_no
JOIN lessons l ON l.chapter_id = ch.id AND l.lesson_no = v.l_no
ON CONFLICT (id) DO NOTHING;

INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, points)
SELECT gen_random_uuid(), qm.id, v.question_text, v.question_type, v.points
FROM (VALUES
    ('Go Syntax & Basic Concurrency Quiz', 'What is the default zero value of a pointer in Go?', 'single_choice', 10),
    ('Go Syntax & Basic Concurrency Quiz', 'Select all keywords that support concurrency in Go.', 'multi_choice', 10),
    ('Go Syntax & Basic Concurrency Quiz', 'Fill in the blank: Go channels are initialized using the _____ built-in function.', 'fill_blank', 10),
    ('Fiber REST API Quiz', 'Which Fiber method registers a GET route handler?', 'single_choice', 10),
    ('Fiber REST API Quiz', 'Arrange the HTTP request pipeline order in Fiber.', 'arrange', 10),
    ('Fiber REST API Quiz', 'What function is used in Fiber to parse JSON request bodies?', 'fill_blank', 10),
    ('Next.js App Router Quiz', 'Where are page routes defined in the Next.js App Router?', 'single_choice', 10),
    ('Next.js App Router Quiz', 'Which special file defines layout wrappers in Next.js?', 'fill_blank', 10),
    ('Next.js App Router Quiz', 'Can Server Components import Client Components in Next.js?', 'single_choice', 10),
    ('React Server Components Quiz', 'What directive marks a React component as a Client Component?', 'fill_blank', 10),
    ('React Server Components Quiz', 'Which hook can only be used inside Client Components?', 'single_choice', 10),
    ('React Server Components Quiz', 'Do React Server Components ship JavaScript bundles to the browser?', 'single_choice', 10),
    ('System Design Foundations Quiz', 'According to CAP Theorem, what two guarantees are chosen during network partition?', 'single_choice', 10),
    ('System Design Foundations Quiz', 'Which load balancing algorithm distributes requests based on server capacity?', 'single_choice', 10),
    ('System Design Foundations Quiz', 'Fill in the blank: _____ caching stores response data closer to users geographically.', 'fill_blank', 10),
    ('Docker Basics Quiz', 'Which Dockerfile instruction specifies the base container image?', 'fill_blank', 10),
    ('Docker Basics Quiz', 'What command builds a Docker image from a Dockerfile?', 'single_choice', 10),
    ('Docker Basics Quiz', 'Arrange the steps to publish a Docker image to Docker Hub.', 'arrange', 10),
    ('Python Data Science Quiz', 'Which library is primary for N-dimensional numerical array computation in Python?', 'single_choice', 10),
    ('Python Data Science Quiz', 'Fill in the blank: A 2D labeled data structure in Pandas is called a _____.', 'fill_blank', 10),
    ('Python Data Science Quiz', 'Which function reads CSV files into a Pandas DataFrame?', 'single_choice', 10),
    ('Deep Learning & Neural Nets Quiz', 'In PyTorch, what method calculates gradients during backpropagation?', 'single_choice', 10),
    ('Deep Learning & Neural Nets Quiz', 'Fill in the blank: The activation function ReLU stands for Rectified _____ Unit.', 'fill_blank', 10),
    ('Deep Learning & Neural Nets Quiz', 'Which optimizer is widely used for adaptive gradient learning in Deep Learning?', 'single_choice', 10),
    ('Flutter Widget Lifecycle Quiz', 'Which method is called first when a StateWidget is inserted into the tree?', 'single_choice', 10),
    ('Flutter Widget Lifecycle Quiz', 'Fill in the blank: To update the UI in a Flutter State, call the _____ method.', 'fill_blank', 10),
    ('Flutter Widget Lifecycle Quiz', 'StatelessWidgets re-render whenever their properties change.', 'single_choice', 10),
    ('Rust Ownership & Lifetimes Quiz', 'How many mutable references to a particular piece of data can exist in a given scope?', 'single_choice', 10),
    ('Rust Ownership & Lifetimes Quiz', 'Which keyword is used to transfer ownership of captured variables into a closure?', 'single_choice', 10),
    ('Rust Ownership & Lifetimes Quiz', 'What happens when the owner of heap-allocated memory (e.g. Box or Vec) goes out of scope?', 'single_choice', 10),
    ('Rust Ownership & Lifetimes Quiz', 'Which of the following are fundamental rules of Rust ownership? (Select all that apply)', 'multi_choice', 10),
    ('Rust Ownership & Lifetimes Quiz', 'Which types implement the Copy trait by default in Rust? (Select all that apply)', 'multi_choice', 10),
    ('Rust Ownership & Lifetimes Quiz', 'Select all valid lifetime annotations and specifiers in Rust.', 'multi_choice', 10),
    ('Rust Ownership & Lifetimes Quiz', 'Fill in the blank: Rust memory is automatically cleaned up when a variable goes out of _____.', 'fill_blank', 10),
    ('Rust Ownership & Lifetimes Quiz', 'Fill in the blank: In Rust, a shared immutable reference is created using the symbol _____.', 'fill_blank', 10),
    ('Rust Ownership & Lifetimes Quiz', 'Arrange the chronological phases of a Rust variable lifecycle.', 'arrange', 10),
    ('Rust Ownership & Lifetimes Quiz', 'Arrange the order of compiler borrow checker rules evaluation.', 'arrange', 10)
) AS v(quiz_title, question_text, question_type, points)
JOIN quiz_metadata qm ON qm.title = v.quiz_title
ON CONFLICT (id) DO NOTHING;

INSERT INTO quiz_options (id, question_id, option_text, is_correct)
SELECT gen_random_uuid(), qq.id, v.option_text, v.is_correct::boolean
FROM (VALUES
    ('Go Syntax & Basic Concurrency Quiz', 'What is the default zero value of a pointer in Go?', 'nil', true),
    ('Go Syntax & Basic Concurrency Quiz', 'What is the default zero value of a pointer in Go?', 'null', false),
    ('Go Syntax & Basic Concurrency Quiz', 'What is the default zero value of a pointer in Go?', '0', false),
    ('Go Syntax & Basic Concurrency Quiz', 'What is the default zero value of a pointer in Go?', 'undefined', false),
    ('Go Syntax & Basic Concurrency Quiz', 'Select all keywords that support concurrency in Go.', 'go', true),
    ('Go Syntax & Basic Concurrency Quiz', 'Select all keywords that support concurrency in Go.', 'select', true),
    ('Go Syntax & Basic Concurrency Quiz', 'Select all keywords that support concurrency in Go.', 'chan', true),
    ('Go Syntax & Basic Concurrency Quiz', 'Select all keywords that support concurrency in Go.', 'async', false),
    ('Fiber REST API Quiz', 'Which Fiber method registers a GET route handler?', 'app.Get()', true),
    ('Fiber REST API Quiz', 'Which Fiber method registers a GET route handler?', 'app.Post()', false),
    ('Fiber REST API Quiz', 'Which Fiber method registers a GET route handler?', 'app.Listen()', false),
    ('Next.js App Router Quiz', 'Where are page routes defined in the Next.js App Router?', 'inside app/ folder as page.tsx', true),
    ('Next.js App Router Quiz', 'Where are page routes defined in the Next.js App Router?', 'inside pages/ folder as index.js', false),
    ('Next.js App Router Quiz', 'Where are page routes defined in the Next.js App Router?', 'inside routes/ folder', false),
    ('Next.js App Router Quiz', 'Can Server Components import Client Components in Next.js?', 'Yes, Server Components can render Client Components', true),
    ('Next.js App Router Quiz', 'Can Server Components import Client Components in Next.js?', 'No, never', false),
    ('React Server Components Quiz', 'Which hook can only be used inside Client Components?', 'useState', true),
    ('React Server Components Quiz', 'Which hook can only be used inside Client Components?', 'fetch', false),
    ('React Server Components Quiz', 'Do React Server Components ship JavaScript bundles to the browser?', 'No, their code stays strictly on the server', true),
    ('React Server Components Quiz', 'Do React Server Components ship JavaScript bundles to the browser?', 'Yes, all code is sent to browser', false),
    ('System Design Foundations Quiz', 'According to CAP Theorem, what two guarantees are chosen during network partition?', 'Consistency (C) and Availability (A) or Partition Tolerance (P)', true),
    ('System Design Foundations Quiz', 'According to CAP Theorem, what two guarantees are chosen during network partition?', 'Latency and Throughput', false),
    ('System Design Foundations Quiz', 'Which load balancing algorithm distributes requests based on server capacity?', 'Weighted Round Robin / Least Connections', true),
    ('System Design Foundations Quiz', 'Which load balancing algorithm distributes requests based on server capacity?', 'Random Choice', false),
    ('Docker Basics Quiz', 'What command builds a Docker image from a Dockerfile?', 'docker build -t name .', true),
    ('Docker Basics Quiz', 'What command builds a Docker image from a Dockerfile?', 'docker run -d name', false),
    ('Python Data Science Quiz', 'Which library is primary for N-dimensional numerical array computation in Python?', 'NumPy', true),
    ('Python Data Science Quiz', 'Which library is primary for N-dimensional numerical array computation in Python?', 'Django', false),
    ('Python Data Science Quiz', 'Which function reads CSV files into a Pandas DataFrame?', 'pd.read_csv()', true),
    ('Python Data Science Quiz', 'Which function reads CSV files into a Pandas DataFrame?', 'pd.load_csv()', false),
    ('Deep Learning & Neural Nets Quiz', 'In PyTorch, what method calculates gradients during backpropagation?', 'loss.backward()', true),
    ('Deep Learning & Neural Nets Quiz', 'In PyTorch, what method calculates gradients during backpropagation?', 'optimizer.step()', false),
    ('Deep Learning & Neural Nets Quiz', 'Which optimizer is widely used for adaptive gradient learning in Deep Learning?', 'Adam / AdamW', true),
    ('Deep Learning & Neural Nets Quiz', 'Which optimizer is widely used for adaptive gradient learning in Deep Learning?', 'Linear Regression', false),
    ('Flutter Widget Lifecycle Quiz', 'Which method is called first when a StateWidget is inserted into the tree?', 'initState()', true),
    ('Flutter Widget Lifecycle Quiz', 'Which method is called first when a StateWidget is inserted into the tree?', 'build()', false),
    ('Flutter Widget Lifecycle Quiz', 'StatelessWidgets re-render whenever their properties change.', 'True', true),
    ('Flutter Widget Lifecycle Quiz', 'StatelessWidgets re-render whenever their properties change.', 'False', false),
    ('Rust Ownership & Lifetimes Quiz', 'How many mutable references to a particular piece of data can exist in a given scope?', 'Exactly 1', true),
    ('Rust Ownership & Lifetimes Quiz', 'How many mutable references to a particular piece of data can exist in a given scope?', 'Unlimited', false),
    ('Rust Ownership & Lifetimes Quiz', 'How many mutable references to a particular piece of data can exist in a given scope?', 'Up to 3', false),
    ('Rust Ownership & Lifetimes Quiz', 'How many mutable references to a particular piece of data can exist in a given scope?', 'Depends on available memory', false),
    ('Rust Ownership & Lifetimes Quiz', 'Which keyword is used to transfer ownership of captured variables into a closure?', 'move', true),
    ('Rust Ownership & Lifetimes Quiz', 'Which keyword is used to transfer ownership of captured variables into a closure?', 'borrow', false),
    ('Rust Ownership & Lifetimes Quiz', 'Which keyword is used to transfer ownership of captured variables into a closure?', 'take', false),
    ('Rust Ownership & Lifetimes Quiz', 'Which keyword is used to transfer ownership of captured variables into a closure?', 'clone', false),
    ('Rust Ownership & Lifetimes Quiz', 'What happens when the owner of heap-allocated memory (e.g. Box or Vec) goes out of scope?', 'The Drop trait runs and heap memory is freed immediately', true),
    ('Rust Ownership & Lifetimes Quiz', 'What happens when the owner of heap-allocated memory (e.g. Box or Vec) goes out of scope?', 'A garbage collector sweeps it on the next cycle', false),
    ('Rust Ownership & Lifetimes Quiz', 'What happens when the owner of heap-allocated memory (e.g. Box or Vec) goes out of scope?', 'A segmentation fault is raised', false),
    ('Rust Ownership & Lifetimes Quiz', 'What happens when the owner of heap-allocated memory (e.g. Box or Vec) goes out of scope?', 'Memory leaks until the OS reclaims it', false),
    ('Rust Ownership & Lifetimes Quiz', 'Which of the following are fundamental rules of Rust ownership? (Select all that apply)', 'Each value in Rust has an owner', true),
    ('Rust Ownership & Lifetimes Quiz', 'Which of the following are fundamental rules of Rust ownership? (Select all that apply)', 'There can only be one owner at a time', true),
    ('Rust Ownership & Lifetimes Quiz', 'Which of the following are fundamental rules of Rust ownership? (Select all that apply)', 'When the owner goes out of scope, the value is dropped', true),
    ('Rust Ownership & Lifetimes Quiz', 'Which of the following are fundamental rules of Rust ownership? (Select all that apply)', 'Unused values are scanned periodically by a background runtime GC', false),
    ('Rust Ownership & Lifetimes Quiz', 'Which types implement the Copy trait by default in Rust? (Select all that apply)', 'i32, u64, and f64 primitive numeric types', true),
    ('Rust Ownership & Lifetimes Quiz', 'Which types implement the Copy trait by default in Rust? (Select all that apply)', 'bool and char', true),
    ('Rust Ownership & Lifetimes Quiz', 'Which types implement the Copy trait by default in Rust? (Select all that apply)', 'String and Vec<T>', false),
    ('Rust Ownership & Lifetimes Quiz', 'Which types implement the Copy trait by default in Rust? (Select all that apply)', 'Box<T>', false),
    ('Rust Ownership & Lifetimes Quiz', 'Select all valid lifetime annotations and specifiers in Rust.', '''a', true),
    ('Rust Ownership & Lifetimes Quiz', 'Select all valid lifetime annotations and specifiers in Rust.', '''static', true),
    ('Rust Ownership & Lifetimes Quiz', 'Select all valid lifetime annotations and specifiers in Rust.', '''lifetime', true),
    ('Rust Ownership & Lifetimes Quiz', 'Select all valid lifetime annotations and specifiers in Rust.', '#borrow', false)
) AS v(quiz_title, question_text, option_text, is_correct)
JOIN quiz_questions qq ON qq.question_text = v.question_text
JOIN quiz_metadata qm ON qm.id = qq.quiz_id AND qm.title = v.quiz_title
ON CONFLICT (id) DO NOTHING;

INSERT INTO quiz_arrange_items (id, question_id, item_text, correct_order)
SELECT gen_random_uuid(), qq.id, v.item_text, v.correct_order
FROM (VALUES
    ('Fiber REST API Quiz', 'Arrange the HTTP request pipeline order in Fiber.', 'Incoming HTTP Request arrives at port', 1),
    ('Fiber REST API Quiz', 'Arrange the HTTP request pipeline order in Fiber.', 'Global Middleware execution (CORS, Logger)', 2),
    ('Fiber REST API Quiz', 'Arrange the HTTP request pipeline order in Fiber.', 'Route Handler matches request path', 3),
    ('Fiber REST API Quiz', 'Arrange the HTTP request pipeline order in Fiber.', 'JSON Response written to client', 4),
    ('Docker Basics Quiz', 'Arrange the steps to publish a Docker image to Docker Hub.', 'Write Dockerfile configuration', 1),
    ('Docker Basics Quiz', 'Arrange the steps to publish a Docker image to Docker Hub.', 'Build local image: docker build', 2),
    ('Docker Basics Quiz', 'Arrange the steps to publish a Docker image to Docker Hub.', 'Tag image with registry repository name', 3),
    ('Docker Basics Quiz', 'Arrange the steps to publish a Docker image to Docker Hub.', 'Push image: docker push', 4),
    ('Rust Ownership & Lifetimes Quiz', 'Arrange the chronological phases of a Rust variable lifecycle.', 'Variable declaration and value binding (let x = ...)', 1),
    ('Rust Ownership & Lifetimes Quiz', 'Arrange the chronological phases of a Rust variable lifecycle.', 'Accessing, borrowing, or passing references in active scope', 2),
    ('Rust Ownership & Lifetimes Quiz', 'Arrange the chronological phases of a Rust variable lifecycle.', 'Reaching the end of the enclosing block scope (})', 3),
    ('Rust Ownership & Lifetimes Quiz', 'Arrange the chronological phases of a Rust variable lifecycle.', 'Automatic invocation of the drop() destructor', 4),
    ('Rust Ownership & Lifetimes Quiz', 'Arrange the order of compiler borrow checker rules evaluation.', 'Ensure variable is initialized before any read access', 1),
    ('Rust Ownership & Lifetimes Quiz', 'Arrange the order of compiler borrow checker rules evaluation.', 'Track active immutable references to the resource', 2),
    ('Rust Ownership & Lifetimes Quiz', 'Arrange the order of compiler borrow checker rules evaluation.', 'Verify no mutable references co-exist with active immutable borrows', 3),
    ('Rust Ownership & Lifetimes Quiz', 'Arrange the order of compiler borrow checker rules evaluation.', 'Verify reference lifetime does not outlive owner lifetime', 4)
) AS v(quiz_title, question_text, item_text, correct_order)
JOIN quiz_questions qq ON qq.question_text = v.question_text
JOIN quiz_metadata qm ON qm.id = qq.quiz_id AND qm.title = v.quiz_title
ON CONFLICT (id) DO NOTHING;

INSERT INTO quiz_fill_blank_answers (question_id, answer)
SELECT qq.id, v.answer
FROM (VALUES
    ('Go Syntax & Basic Concurrency Quiz', 'Fill in the blank: Go channels are initialized using the _____ built-in function.', 'make'),
    ('Fiber REST API Quiz', 'What function is used in Fiber to parse JSON request bodies?', 'c.BodyParser'),
    ('Next.js App Router Quiz', 'Which special file defines layout wrappers in Next.js?', 'layout.tsx'),
    ('React Server Components Quiz', 'What directive marks a React component as a Client Component?', 'use client'),
    ('System Design Foundations Quiz', 'Fill in the blank: _____ caching stores response data closer to users geographically.', 'CDN'),
    ('Docker Basics Quiz', 'Which Dockerfile instruction specifies the base container image?', 'FROM'),
    ('Python Data Science Quiz', 'Fill in the blank: A 2D labeled data structure in Pandas is called a _____.', 'DataFrame'),
    ('Deep Learning & Neural Nets Quiz', 'Fill in the blank: The activation function ReLU stands for Rectified _____ Unit.', 'Linear'),
    ('Flutter Widget Lifecycle Quiz', 'Fill in the blank: To update the UI in a Flutter State, call the _____ method.', 'setState'),
    ('Rust Ownership & Lifetimes Quiz', 'Fill in the blank: Rust memory is automatically cleaned up when a variable goes out of _____.', 'scope'),
    ('Rust Ownership & Lifetimes Quiz', 'Fill in the blank: In Rust, a shared immutable reference is created using the symbol _____.', '&')
) AS v(quiz_title, question_text, answer)
JOIN quiz_questions qq ON qq.question_text = v.question_text
JOIN quiz_metadata qm ON qm.id = qq.quiz_id AND qm.title = v.quiz_title
ON CONFLICT DO NOTHING;

-- Seed Quiz Attempts for rahulprofession01@gmail.com, bwubca23406@gmail.com, and user@example.com
INSERT INTO quiz_attempts (id, quiz_id, user_id, started_at, submitted_at, total_score, passed, correct_count, incorrect_count, skipped_count)
SELECT gen_random_uuid(), qm.id, u.id, v.started_at, v.submitted_at, v.total_score, v.passed, v.correct_count, v.incorrect_count, v.skipped_count
FROM (VALUES
    ('Go Syntax & Basic Concurrency Quiz', 'rahulprofession01@gmail.com', CURRENT_TIMESTAMP - INTERVAL '7 days 20 minutes', CURRENT_TIMESTAMP - INTERVAL '7 days', 30.00, true, 3, 0, 0),
    ('Next.js App Router Quiz', 'rahulprofession01@gmail.com', CURRENT_TIMESTAMP - INTERVAL '4 days 25 minutes', CURRENT_TIMESTAMP - INTERVAL '4 days', 30.00, true, 3, 0, 0),
    ('Python Data Science Quiz', 'bwubca23406@gmail.com', CURRENT_TIMESTAMP - INTERVAL '5 days 15 minutes', CURRENT_TIMESTAMP - INTERVAL '5 days', 30.00, true, 3, 0, 0),
    ('Deep Learning & Neural Nets Quiz', 'bwubca23406@gmail.com', CURRENT_TIMESTAMP - INTERVAL '2 days 18 minutes', CURRENT_TIMESTAMP - INTERVAL '2 days', 20.00, false, 2, 1, 0),
    ('Go Syntax & Basic Concurrency Quiz', 'user@example.com', CURRENT_TIMESTAMP - INTERVAL '6 days 12 minutes', CURRENT_TIMESTAMP - INTERVAL '6 days', 20.00, false, 2, 1, 0),
    ('Docker Basics Quiz', 'charlie@example.com', CURRENT_TIMESTAMP - INTERVAL '8 days 15 minutes', CURRENT_TIMESTAMP - INTERVAL '8 days', 30.00, true, 3, 0, 0)
) AS v(quiz_title, email, started_at, submitted_at, total_score, passed, correct_count, incorrect_count, skipped_count)
JOIN quiz_metadata qm ON qm.title = v.quiz_title
JOIN users u ON u.email = v.email
ON CONFLICT (id) DO NOTHING;

-- Seed Single Choice Answers for Quiz Attempts
INSERT INTO quiz_attempt_single_answers (id, attempt_id, question_id, selected_option_id, is_correct, is_skipped)
SELECT gen_random_uuid(), qa.id, qq.id, qo.id, qo.is_correct, false
FROM quiz_attempts qa
JOIN quiz_metadata qm ON qm.id = qa.quiz_id
JOIN users u ON u.id = qa.user_id
JOIN quiz_questions qq ON qq.quiz_id = qm.id AND qq.question_type = 'single_choice'
JOIN quiz_options qo ON qo.question_id = qq.id AND qo.is_correct = true
ON CONFLICT (attempt_id, question_id) DO NOTHING;

-- Seed Fill Blank Answers for Quiz Attempts
INSERT INTO quiz_attempt_fill_answers (id, attempt_id, question_id, fill_text, is_correct, is_skipped)
SELECT gen_random_uuid(), qa.id, qq.id, qfb.answer, true, false
FROM quiz_attempts qa
JOIN quiz_metadata qm ON qm.id = qa.quiz_id
JOIN users u ON u.id = qa.user_id
JOIN quiz_questions qq ON qq.quiz_id = qm.id AND qq.question_type = 'fill_blank'
JOIN quiz_fill_blank_answers qfb ON qfb.question_id = qq.id
ON CONFLICT (attempt_id, question_id) DO NOTHING;

-- Ensure all lessons referenced by quiz_metadata are flagged as 'quiz' and clear conflicting media/docs
UPDATE lessons SET lesson_type = 'quiz'
WHERE id IN (SELECT lesson_id FROM quiz_metadata);

DELETE FROM lesson_document_content
WHERE lesson_id IN (SELECT lesson_id FROM quiz_metadata);

DELETE FROM lesson_video_content
WHERE lesson_id IN (SELECT lesson_id FROM quiz_metadata);


