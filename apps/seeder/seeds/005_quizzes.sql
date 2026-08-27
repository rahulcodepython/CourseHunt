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
    ('rust-systems-programming-masterclass', 1, 5, 'Rust Ownership & Lifetimes Quiz', 900, 3, 80)
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
    ('Rust Ownership & Lifetimes Quiz', 'How many mutable references to a resource can exist simultaneously in Rust?', 'single_choice', 10),
    ('Rust Ownership & Lifetimes Quiz', 'Fill in the blank: Rust memory is automatically cleaned up when a variable goes out of _____.', 'fill_blank', 10),
    ('Rust Ownership & Lifetimes Quiz', 'Which keyword is used to transfer ownership of a variable into a closure?', 'single_choice', 10)
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
    ('Rust Ownership & Lifetimes Quiz', 'How many mutable references to a resource can exist simultaneously in Rust?', 'Exactly 1', true),
    ('Rust Ownership & Lifetimes Quiz', 'How many mutable references to a resource can exist simultaneously in Rust?', 'Unlimited', false),
    ('Rust Ownership & Lifetimes Quiz', 'Which keyword is used to transfer ownership of a variable into a closure?', 'move', true),
    ('Rust Ownership & Lifetimes Quiz', 'Which keyword is used to transfer ownership of a variable into a closure?', 'borrow', false)
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
    ('Docker Basics Quiz', 'Arrange the steps to publish a Docker image to Docker Hub.', 'Push image: docker push', 4)
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
    ('Rust Ownership & Lifetimes Quiz', 'Fill in the blank: Rust memory is automatically cleaned up when a variable goes out of _____.', 'scope')
) AS v(quiz_title, question_text, answer)
JOIN quiz_questions qq ON qq.question_text = v.question_text
JOIN quiz_metadata qm ON qm.id = qq.quiz_id AND qm.title = v.quiz_title
ON CONFLICT DO NOTHING;

