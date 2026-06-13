# Architecture
## Tech Stack
### Frontend
* Next.js (App Router)
* TypeScript
* React Hook Form + Zod
* React Query (data fetching)
* Zustand (state)
* shadcn/ui (UI)
* Better Auth
### Backend
* Go (Fiber v2)
* PostgreSQL (via repositories)
* MinIO (object storage)
---
## System Architecture
### Frontend Layers
* UI Components
* Hooks (logic + API orchestration)
* API Layer (network calls)
* Models & Types
* Store (Zustand)
---
### Backend Layers
* Router
* Middleware
* Handlers
* Services
* Repositories
* Database
---
## Backend Structure
```
internals/
 ├── handlers → HTTP layer
 ├── middlewares → auth, logging
 ├── services → business logic
 ├── repositories → DB access
 ├── models → schema structs
 ├── storage → MinIO integration
 └── utils → helpers
```
---
## Frontend Structure
```
src/
 ├── api → API calls
 ├── hooks → business hooks
 ├── components → UI
 ├── models/types → schema
 ├── store → Zustand
 └── lib → utilities
```
---
## Data Flow
### Read Flow
UI → Hook → API → Backend → Repo → DB → Response → Cache → UI
### Write Flow
Form → Zod → Hook → API → Backend → Service → Repo → DB
---
## Storage
* MinIO for media (videos/images)
* DB for metadata
---
## Key Principles
* Separation of concerns
* Predictable flow
* Strict layering
* Type safety everywhere