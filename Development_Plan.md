# Student Portal Development Plan

## Goal Description
Build a simple yet professional Student Portal using React and Tailwind CSS. The portal serves as a central hub for students. We are now expanding this to include a **robust and scalable backend**.

## User Review Required
- **Database Choice**: I am setting up the project with **Prisma ORM**. Key Decision: I will configure it to use **SQLite** for immediate local development availability (no installation required), but the architecture is designed to switch to **PostgreSQL** for production/scaling with a single config line change.
- **Monorepo Structure**: I will create a `server` directory within the project to house the backend code.

## Architecture & Tech Stack

### Frontend (Existing)
- **Framework**: React (Vite)
- **Styling**: Tailwind CSS
- **Auth**: Client-side context (to be updated to consume API)

### Backend (New)
- **Runtime**: Node.js
- **Framework**: **Express.js** (Industry standard, highly extensible)
- **Language**: **TypeScript** (Strict typing for robustness)
- **ORM**: **Prisma** (Type-safe database access, automated migrations)
- **Database**: 
  - *Dev*: SQLite (Zero-config)
  - *Prod*: PostgreSQL (Scalable relational DB)

### Security Patterns
- **Transport**: HTTPS (TLS)
- **Authentication**: **JWT (JSON Web Tokens)** stored in **HttpOnly Cookies** (Prevents XSS token theft).
- **Headers**: `helmet` for secure HTTP headers.
- **Validation**: Shared `zod` schemas between Frontend and Backend.
- **Rate Limiting**: `express-rate-limit` to prevent brute force.

## Proposed Changes

### 1. Project Restructure
- Initialize `server/` directory.
- Set up TypeScript configuration for backend (`tsconfig.server.json`).

### 2. Database Schema (Prisma)
- **Models**:
  - `User` (Student credentials, role)
  - `Profile` (Personal details)
  - `Course` (Course metadata)
  - `Enrollment` (Relation between Student and Course, includes grades)
  - `Schedule` (Class timing)

### 3. API Development
- **Auth Routes**: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- **Data Routes**: `GET /api/dashboard`, `GET /api/courses`, `GET /api/schedule`

### 4. Integration
- Update Frontend `services` to fetch from real API instead of `mockData.js`.
- Update `AuthContext` to check real session status.

## Verification Plan
### Automated Tests
- Backend compilation check (`tsc`).
- Prisma Studio (`npx prisma studio`) to manually verify data integrity.

### Manual Verification
- Test API endpoints using `curl` or browser.
- Verify full user flow: Login -> Dashboard (Fetch Data) -> Logout.
