-- 003_courses.sql: Seed 10 Full Courses

INSERT INTO courses (
    id, tutor_id, slug, title, short_description, long_description,
    image_url, preview_video_url, language, level, actual_price, final_price,
    benefits, requirements, category_id, subcategory_id, coupon_allowed,
    total_lectures, total_duration_seconds, rating_avg, feedback_count, status
) VALUES
    (
        'crs-001', 'usr-tutor-001', 'go-golang-microservices-masterclass',
        'Go (Golang) Production Microservices Masterclass',
        'Build high-performance, fault-tolerant Go microservices using Fiber, gRPC, Postgres, and Docker.',
        'Master modern Go backend engineering from scratch to production. You will learn idiomatic Go pattern designs, Fiber web framework, gRPC streaming, SQL database pooling with sqlx, Redis caching, JWT auth, and containerization.',
        'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&w=800&q=80',
        'https://www.w3schools.com/html/mov_bbb.mp4',
        'English', 'advanced', 129.99, 49.99,
        ARRAY['Build production Go microservices', 'Master Fiber & gRPC', 'Implement SQL connection pooling', 'Deploy with Docker & Kubernetes'],
        ARRAY['Basic programming fundamentals', 'Familiarity with SQL concept'],
        'cat-web-dev', 'subcat-golang', true,
        25, 18000, 4.90, 18, 'published'
    ),
    (
        'crs-002', 'usr-tutor-003', 'fullstack-nextjs-react-mastery',
        'Full-Stack Development with Next.js 15 & React 19',
        'Build fast, SEO-optimized web applications with Next.js 15 App Router, React Server Components, and Tailwind CSS.',
        'Learn the latest Next.js 15 features including React Server Components (RSC), Server Actions, Parallel & Intercepting Routes, Turbopack, and full authentication integration with Better-Auth.',
        'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
        'https://www.w3schools.com/html/mov_bbb.mp4',
        'English', 'intermediate', 149.99, 59.99,
        ARRAY['Next.js 15 App Router', 'React 19 Server Components', 'Tailwind CSS v4 Styling', 'Full-stack Authentication & Postgres integration'],
        ARRAY['JavaScript / TypeScript basics', 'HTML and CSS fundamentals'],
        'cat-web-dev', 'subcat-react-next', true,
        25, 21600, 4.85, 24, 'published'
    ),
    (
        'crs-003', 'usr-tutor-001', 'system-design-distributed-systems',
        'System Design & Distributed Systems Engineering',
        'Learn how to design scalable system architectures, load balancers, database sharding, and fault-tolerant message queues.',
        'An in-depth practical guide to passing system design interviews and architecting real-world web scale systems. Covers CAP theorem, consistent hashing, distributed caching, rate limiting, and event-driven architecture.',
        'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
        'https://www.w3schools.com/html/mov_bbb.mp4',
        'English', 'advanced', 199.99, 79.99,
        ARRAY['Master System Design Principles', 'Architect High Availability Systems', 'Database Sharding & Replication', 'Event-Driven Microservices with Kafka'],
        ARRAY['2+ years software engineering experience', 'Understanding of basic network protocols'],
        'cat-cloud-devops', 'subcat-aws-cloud', true,
        25, 25200, 4.95, 32, 'published'
    ),
    (
        'crs-004', 'usr-tutor-001', 'docker-kubernetes-modern-devops',
        'Docker, Kubernetes & Modern DevOps Pipeline',
        'Containerize applications, orchestrate Kubernetes clusters, and automate CI/CD pipelines from scratch.',
        'Become a DevOps expert. Learn container virtualization with Docker, multi-container compose setups, Kubernetes deployments, Helm charts, ingress controllers, and automated GitHub Actions workflows.',
        'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?auto=format&fit=crop&w=800&q=80',
        'https://www.w3schools.com/html/mov_bbb.mp4',
        'English', 'intermediate', 119.99, 39.99,
        ARRAY['Docker image optimization', 'Kubernetes cluster deployment', 'Helm release management', 'Automated CI/CD with GitHub Actions'],
        ARRAY['Basic Linux command line usage'],
        'cat-cloud-devops', 'subcat-k8s-docker', true,
        25, 19800, 4.80, 15, 'published'
    ),
    (
        'crs-005', 'usr-tutor-002', 'python-data-science-machine-learning-bootcamp',
        'Python Data Science & Machine Learning Bootcamp',
        'Master NumPy, Pandas, Matplotlib, Scikit-Learn, and build real-world ML prediction models.',
        'Comprehensive data science course covering data analysis, cleaning, visualization, statistical inference, regression, classification models, random forests, and gradient boosting.',
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
        'https://www.w3schools.com/html/mov_bbb.mp4',
        'English', 'beginner', 139.99, 44.99,
        ARRAY['Data wrangling with Pandas', 'Machine Learning algorithms with Scikit-Learn', 'Data visualization techniques', 'Statistical modeling'],
        ARRAY['No prior coding required; basic math helpful'],
        'cat-data-ai', 'subcat-ml-python', true,
        25, 23400, 4.92, 40, 'published'
    ),
    (
        'crs-006', 'usr-tutor-002', 'deep-learning-llms-transformers-python',
        'Deep Learning, PyTorch & Large Language Models (LLMs)',
        'Build neural networks, PyTorch transformers, fine-tune LLMs, and deploy AI APIs.',
        'Dive deep into modern Artificial Intelligence. Understand artificial neural networks, convolutional networks (CNNs), transformers, self-attention mechanisms, and fine-tuning open-source LLMs (Llama 3, Mistral) with PyTorch.',
        'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=800&q=80',
        'https://www.w3schools.com/html/mov_bbb.mp4',
        'English', 'advanced', 179.99, 69.99,
        ARRAY['Neural Networks in PyTorch', 'Transformer Architecture from Scratch', 'LLM Fine-tuning (LoRA / QLoRA)', 'Deploying AI Models to Production'],
        ARRAY['Python programming experience', 'Basic linear algebra and calculus concepts'],
        'cat-data-ai', 'subcat-deep-llm', true,
        25, 27000, 4.98, 28, 'published'
    ),
    (
        'crs-007', 'usr-tutor-003', 'flutter-dart-multiplatform-mobile-dev',
        'Flutter & Dart: Build Multi-Platform Mobile Apps',
        'Build iOS and Android applications with a single codebase using Flutter and Dart.',
        'Complete guide to mobile app development using Flutter. Master state management (Riverpod / Provider), REST API integration, native device capabilities, clean architecture, and App Store publishing.',
        'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80',
        'https://www.w3schools.com/html/mov_bbb.mp4',
        'English', 'beginner', 129.99, 49.99,
        ARRAY['Build iOS and Android apps from 1 codebase', 'State management with Riverpod', 'Custom animations & UI themes', 'Publish to Google Play & Apple App Store'],
        ARRAY['Basic OOP programming concepts'],
        'cat-mobile-dev', 'subcat-flutter', true,
        25, 20500, 4.75, 19, 'published'
    ),
    (
        'crs-008', 'usr-tutor-003', 'figma-ui-ux-design-system-mastery',
        'Figma to Code: UI/UX Design & System Engineering',
        'Design beautiful user interfaces, create design systems in Figma, and convert mockups to responsive frontend code.',
        'Learn user experience (UX) research, wireframing, interactive prototyping in Figma, typography, auto-layout, design token setup, and translation into clean HTML/Tailwind CSS.',
        'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=800&q=80',
        'https://www.w3schools.com/html/mov_bbb.mp4',
        'English', 'beginner', 99.99, 29.99,
        ARRAY['Master Figma Auto-Layout 5.0', 'Create Scalable Design Systems', 'UX Research & Wireframing', 'Export Design Tokens to Code'],
        ARRAY['No prior design software experience required'],
        'cat-design-ux', 'subcat-figma', true,
        25, 16200, 4.88, 22, 'published'
    ),
    (
        'crs-009', 'usr-tutor-001', 'rust-systems-programming-masterclass',
        'Rust Programming: Zero to Systems Master',
        'Build blazingly fast systems, web servers, and CLI utilities with Rust memory safety principles.',
        'Comprehensive Rust course covering ownership, borrowing, lifetimes, pattern matching, async runtime (Tokio), web services (Axum), and WebAssembly (Wasm).',
        'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
        'https://www.w3schools.com/html/mov_bbb.mp4',
        'English', 'intermediate', 159.99, 54.99,
        ARRAY['Rust Memory Ownership & Lifetimes', 'Async I/O with Tokio', 'High Performance Web APIs with Axum', 'WebAssembly (Wasm) integration'],
        ARRAY['Familiarity with C, C++, Go, or Java'],
        'cat-web-dev', 'subcat-golang', true,
        25, 24000, 4.93, 26, 'published'
    ),
    (
        'crs-010', 'usr-tutor-003', 'vue-nuxt3-modern-web-apps',
        'Vue 3 & Nuxt 3 Full-Stack Web Development',
        'Build fast, SSR & SSG web applications with Vue 3 Composition API, Pinia, and Nuxt 3.',
        'Explore the Vue 3 ecosystem. Learn reactive state management with Pinia, server-side rendering with Nuxt 3, TypeScript integration, and Tailwind CSS styling.',
        'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
        'https://www.w3schools.com/html/mov_bbb.mp4',
        'English', 'intermediate', 119.99, 34.99,
        ARRAY['Vue 3 Composition API', 'Nuxt 3 Server-Side Rendering', 'Pinia State Management', 'TypeScript & Tailwind CSS integration'],
        ARRAY['Basic HTML, CSS, JavaScript'],
        'cat-web-dev', 'subcat-vue-nuxt', true,
        25, 17500, 4.82, 16, 'published'
    )
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, final_price = EXCLUDED.final_price;
