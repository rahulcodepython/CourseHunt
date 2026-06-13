# Project: CourseHunt
## Overview
CourseHunt is a scalable online platform enabling institutes and individual educators to create, manage, and sell digital courses. It supports full lifecycle management: course creation → purchase → consumption → tracking.
---
## Goal
* Enable **any institute or creator** to sell courses
* Provide **structured learning delivery**
* Ensure **secure transactions + scalable delivery**
* Maintain **clean architecture for extensibility**
---
## Focus
* Modular architecture (frontend + backend separation)
* Strong data validation & type safety
* Scalable media handling (MinIO)
* Efficient state & API management
---
## Scope
### Core Features
* Authentication (Better Auth)
* Course Management
  * Create / Update / Delete course
  * Categories, pricing, metadata
* Course Consumption
  * Lessons, tracking (last viewed, progress)
* Transactions
  * Purchase system
  * Coupons & discounts
* Dashboard
  * Admin analytics
* Feedback System
* Media Upload (videos, thumbnails)
* User Profile Management
---
## Out of Scope
* Live streaming / webinars
* AI-based recommendations
* Multi-language system (initially)
* Offline downloads
* Social/community features
---
## Key Attributes
* Type-safe (TypeScript + Zod)
* Layered backend (Handler → Service → Repo)
* Predictable frontend data flow
* Highly modular & reusable code
* API-first architecture