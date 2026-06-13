# Coding Constraints
## General Rules
* Strict TypeScript (NO `any`)
* DRY principle mandatory
* Modular & reusable code
* Remove unused code always
* Functions must be small & single-purpose
* Every function must have a comment header
* Use generic functions wherever logic is reused with minor variations.
---
## Code Style
* Clear naming (no abbreviations)
* Avoid deep nesting (>3 levels)
* Prefer early returns
* Use constants over magic values
---
## Frontend Data Flow (MANDATORY)
1. UI Trigger (form/action)
2. Parser (Zod validation)
3. Custom Hook (React Query)
4. API Call (api-client)
5. Cache (React Query/Zustand)
6. UI Render
### API Send Flow
Form → Parser → Hook → API
---
## Backend Flow (STRICT)
1. Route
2. Middleware
3. Handler
   * Validate input
   * Clean data
   * Structure payload
4. Service
   * Business logic
   * Rules/validation
5. Repository
   * ONLY DB calls
---
## File Responsibilities
* Handlers → request/response only
* Services → logic only
* Repositories → DB only
* Hooks → API orchestration
* API files → network only
---
## Validation Rules
* Zod for all inputs
* No raw input usage
* Sanitize before DB
---
## Error Handling
* Centralized response utility
* No raw error leaks
* Always structured response
---
## Performance Rules
* Avoid unnecessary re-renders
* Use caching (React Query)
* Lazy load heavy components
---
## Security Rules
* Auth middleware everywhere needed
* Validate ownership before mutation
* Never trust client data