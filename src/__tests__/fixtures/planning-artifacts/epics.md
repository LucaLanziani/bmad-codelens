---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
status: complete
inputDocuments:
  - planning-artifacts/prd.md
  - planning-artifacts/architecture.md
---

# experiment - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for experiment, decomposing the requirements from the PRD and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

**Recognition & Nomination (6 requirements):**

- FR1: Any employee can nominate a colleague for recognition using @ mention search
- FR2: Any employee can write a free-text reason when submitting a nomination
- FR3: The system enforces a limit of one nomination per employee per month
- FR4: Any employee can see when their monthly nomination limit resets
- FR5: A submitted recognition appears instantly on the public recognition feed
- FR6: The system posts a public shout-out to a designated Slack channel when a recognition is submitted

**Approval Workflow (6 requirements):**

- FR7: A manager can view all pending nominations for their direct reports
- FR8: A manager can approve a nomination with a single action
- FR9: A manager can reject a nomination and provide a reason
- FR10: The system prompts a manager to have a conversation with the recipient when a nomination is rejected
- FR11: The system sends a Slack DM to the recipient's manager when a new nomination is pending
- FR12: The system aggregates pending nominations so managers can review in batches

**Rewards & Gift Cards (4 requirements):**

- FR13: The system automatically triggers gift card issuance when a manager approves a nomination
- FR14: The system sends an email to the recipient with gift card details upon approval
- FR15: The system integrates with a gift card provider through a pluggable interface (mocked for MVP)
- FR16: The system withholds the gift card when a manager rejects a nomination while keeping the public recognition visible

**Recognition Feed & History (4 requirements):**

- FR17: Any employee can view a public recognition feed showing all recognitions
- FR18: The public recognition feed updates in real-time as new recognitions are submitted
- FR19: Any employee can view their personal recognition history (received recognitions)
- FR20: The recognition feed displays the nominator, recipient, and reason for each recognition

**Notifications (3 requirements):**

- FR21: The system sends a Slack notification to the recipient when they are recognized
- FR22: The system sends a Slack DM to the recipient's manager for pending approvals
- FR23: The system sends an email to the recipient when a gift card is issued

**Budget Management (5 requirements):**

- FR24: An HR admin can view total recognition spend across the organization
- FR25: An HR admin can view recognition spend broken down by team or project
- FR26: The system tracks budget allocation per team or project
- FR27: The system continues allowing public recognitions when a team's budget is exhausted
- FR28: The system pauses gift card issuance when a team's budget is exhausted

**User Management & Authentication (4 requirements):**

- FR29: Any  employee can authenticate via Google SSO
- FR30: The system auto-provisions user accounts on first SSO login
- FR31: The system assigns roles to users (Employee, Manager, HR Admin)
- FR32: The system determines a user's line manager for routing approval workflows

**HR Administration (3 requirements):**

- FR33: An HR admin can view total recognition count and approval/rejection rates
- FR34: An HR admin can view a basic team-level breakdown of recognition activity
- FR35: An HR admin can set and manage budget allocations per team or project

### NonFunctional Requirements

**Performance (5 requirements):**

- NFR1: Page load (LCP) under 2 seconds on standard broadband
- NFR2: Nomination submission completes in under 1 second
- NFR3: Real-time feed updates delivered within 500ms via WebSocket
- NFR4: System supports 600 concurrent authenticated users without degradation
- NFR5: Manager approval queue loads in under 1 second with up to 50 pending items

**Security (5 requirements):**

- NFR6: All authentication via Google SSO (OAuth 2.0 / OpenID Connect) -- no local passwords
- NFR7: All data transmitted over HTTPS (TLS 1.2+)
- NFR8: Role-based access control enforced at API level (Employee, Manager, HR Admin)
- NFR9: Users access only data appropriate to their role (managers: own team approvals; HR admins: org-wide data)
- NFR10: API endpoints protected against unauthorized access -- no data leakage across roles

**Accessibility (5 requirements):**

- NFR11: WCAG 2.1 AA compliance across all user-facing pages
- NFR12: Full keyboard navigation for all interactive elements
- NFR13: Screen reader compatibility (ARIA labels, semantic HTML)
- NFR14: Minimum 4.5:1 color contrast ratio for all text
- NFR15: Focus management for SPA route transitions

**Integration Resilience (4 requirements):**

- NFR16: Slack API integration handles rate limits gracefully (retry with backoff)
- NFR17: Gift card provider integration designed as pluggable interface -- swapping providers requires no core logic changes
- NFR18: Google SSO token refresh handled transparently to the user
- NFR19: Slack integration failure does not block core recognition flow (degrade gracefully; retry asynchronously)

### Additional Requirements

**Starter Template (Architecture specifies project scaffolding for Epic 1, Story 1):**

- Monorepo with npm workspaces: `packages/frontend`, `packages/backend`, `packages/shared`
- Frontend: `npm create vite@latest -- --template react-swc-ts` (Vite 6 + React 19 + TypeScript + SWC)
- Backend: `npm init fastify` (Fastify 5.7.x + TypeScript)
- Root workspace: `package.json` with npm workspaces, `tsconfig.base.json` shared config

**Data Layer:**

- Prisma ORM as single source of truth for database schema
- PostgreSQL 16.x database
- Prisma Migrate for version-controlled migrations
- Shared TypeScript types generated from Prisma schema exported via `shared` workspace package
- Seed data script (`seed.ts`) for test users, teams, and budgets

**Authentication & Token Strategy:**

- @fastify/oauth2 8.x with built-in Google provider
- JWT stateless sessions: short-lived access tokens (~15min) in memory, refresh tokens in httpOnly cookies
- Role (Employee/Manager/HR Admin) embedded in JWT claims
- Fastify `requireRole()` decorators on routes for RBAC enforcement
- Auto-provisioning on first SSO login

**API & Communication:**

- REST API with Ajv validation powering both route validation and auto-generated Swagger docs (@fastify/swagger + @fastify/swagger-ui)
- Simple JSON error format (`{ statusCode, error, message }`) across all endpoints
- @fastify/websocket for real-time recognition feed; fallback to TanStack Query polling on disconnect
- WebSocket event format: `domain:action` (e.g., `recognition:created`, `approval:updated`)
- @fastify/rate-limit for API-level abuse protection

**Frontend Architecture:**

- TanStack Router for type-safe routing
- TanStack Query for server state management, caching, and polling fallback
- Tailwind CSS for utility-first styling
- Flat component folder structure
- React Error Boundaries for unrecoverable crashes; TanStack Query `onError` + toast for recoverable errors
- Skeleton loaders for initial page loads; optimistic updates for approval actions

**Infrastructure & DevOps:**

- Docker Compose for local development (PostgreSQL + backend + frontend)
- Docker Compose for production (PostgreSQL + backend + Nginx serving SPA)
- GitHub Actions CI/CD: lint, test, build, Docker
- Structured JSON logging via Pino (Fastify built-in)
- @fastify/env for Ajv-validated typed environment config

**Code Quality & Consistency:**

- Vitest as single test runner across monorepo (frontend + backend)
- ESLint + Prettier shared config across monorepo
- Co-located tests (e.g., `recognition-card.test.tsx` next to `recognition-card.tsx`)
- Naming conventions: `snake_case` (PostgreSQL), `camelCase` (TypeScript/JSON API), `kebab-case` (files), `PascalCase` (components/types)
- Service layer boundary enforced: route handlers → services → integrations
- Integration clients isolated with retry/exponential backoff (Slack, email, gift cards never block primary operations)

### FR Coverage Map

- FR1: Epic 2 - Nominate colleague via @ mention search
- FR2: Epic 2 - Free-text reason for nomination
- FR3: Epic 2 - Rate limit: 1 nomination per employee per month
- FR4: Epic 2 - Display when monthly nomination limit resets
- FR5: Epic 2 - Recognition appears on public feed upon submission
- FR6: Epic 3 - Post public shout-out to Slack #recognition channel
- FR7: Epic 4 - Manager views pending nominations for direct reports
- FR8: Epic 4 - Manager approves nomination with single action
- FR9: Epic 4 - Manager rejects nomination with reason
- FR10: Epic 4 - System prompts manager to have conversation on rejection
- FR11: Epic 4 - Slack DM to manager for pending nomination
- FR12: Epic 4 - Aggregate pending nominations for batch review
- FR13: Epic 4 - Auto-trigger gift card issuance on approval
- FR14: Epic 4 - Email recipient with gift card details on approval
- FR15: Epic 4 - Pluggable gift card provider interface (mocked for MVP)
- FR16: Epic 4 - Withhold gift card on rejection; public recognition persists
- FR17: Epic 2 - Public recognition feed showing all recognitions
- FR18: Epic 3 - Real-time feed updates via WebSocket
- FR19: Epic 3 - Personal recognition history (received recognitions)
- FR20: Epic 2 - Feed displays nominator, recipient, and reason
- FR21: Epic 3 - Slack notification to recipient when recognized
- FR22: Epic 4 - Slack DM to manager for pending approvals
- FR23: Epic 4 - Email to recipient when gift card is issued
- FR24: Epic 5 - HR admin views total recognition spend
- FR25: Epic 5 - HR admin views spend by team or project
- FR26: Epic 5 - System tracks budget allocation per team/project
- FR27: Epic 5 - Public recognitions continue when budget exhausted
- FR28: Epic 5 - Gift card issuance pauses when budget exhausted
- FR29: Epic 1 - Google SSO authentication
- FR30: Epic 1 - Auto-provision user accounts on first login
- FR31: Epic 1 - Role assignment (Employee, Manager, HR Admin)
- FR32: Epic 1 - Determine user's line manager for approval routing

- FR33: Epic 5 - HR admin views recognition count and approval/rejection rates
- FR34: Epic 5 - HR admin views team-level recognition activity breakdown
- FR35: Epic 5 - HR admin sets and manages budget allocations

## Epic List

### Epic 1: Project Foundation & User Authentication
Any employee can sign in via Google SSO and be automatically provisioned with the correct role and manager relationship. The monorepo, database, and development infrastructure are in place.
**FRs covered:** FR29, FR30, FR31, FR32

### Epic 2: Peer Nomination & Recognition Feed
An employee can nominate a colleague using @ mention search with a free-text reason. The recognition appears on the public feed showing nominator, recipient, and reason. Rate limiting enforces 1 nomination per month with clear reset visibility.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR17, FR20

### Epic 3: Real-time Feed, Slack Integration & Recognition History
The recognition feed updates in real-time via WebSocket. New recognitions are automatically posted to the Slack #recognition channel. Recipients receive a Slack notification. Employees can view their personal recognition history.
**FRs covered:** FR6, FR18, FR19, FR21

### Epic 4: Manager Approval & Rewards
Managers receive Slack DM notifications for pending nominations, review them in a web queue, and approve or reject with one click. Approved nominations trigger gift card issuance and email to recipient. Rejected nominations prompt a conversation -- public recognition stays visible.
**FRs covered:** FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR16, FR22, FR23

### Epic 5: Budget Management & HR Administration
HR admins view total spend, team-level breakdowns, recognition activity, and manage budgets. Gift cards pause when budget is exhausted; public recognitions continue.
**FRs covered:** FR24, FR25, FR26, FR27, FR28, FR33, FR34, FR35

## Epic 1: Project Foundation & User Authentication

Any employee can sign in via Google SSO and be automatically provisioned with the correct role and manager relationship. The monorepo, database, and development infrastructure are in place.

### Story 1.1: Monorepo & Development Environment Setup

As a **developer**,
I want a monorepo with frontend, backend, and shared packages with Docker Compose for local development,
So that I can start building features with a consistent, reproducible development environment.

**Acceptance Criteria:**

**Given** a fresh clone of the repository
**When** I run `npm install` at the root
**Then** all workspace dependencies are installed for frontend, backend, and shared packages

**Given** the monorepo is set up
**When** I run `docker compose up`
**Then** PostgreSQL 16, Fastify backend (with hot reload), and Vite frontend (with HMR) are all running

**Given** the development environment is running
**When** I access the frontend dev server
**Then** I see the default Vite React app loading successfully

**Given** the development environment is running
**When** I access the backend server health check endpoint
**Then** I receive a JSON response confirming the API is running

**Given** any TypeScript file in the monorepo
**When** I run the linter
**Then** ESLint and Prettier validate code style consistently across all packages

**Given** any package in the monorepo
**When** I run the test command
**Then** Vitest executes and reports results

**Given** the shared package exports a type
**When** frontend or backend imports it
**Then** the type is resolved correctly with full TypeScript support

### Story 1.2: Google SSO Authentication & User Provisioning

As a **employee**,
I want to sign in with my Google account,
So that I can access the recognition platform securely without creating a separate password.

**Acceptance Criteria:**

**Given** I am not authenticated
**When** I visit any page on the application
**Then** I am redirected to a login page with a "Sign in with Google" button

**Given** I am on the login page
**When** I click "Sign in with Google"
**Then** I am redirected to Google's OAuth2 consent screen

**Given** I have completed Google authentication
**When** Google redirects back to the application
**Then** the system creates my user account if it is my first login (auto-provisioning)
**And** I receive a JWT access token (stored in memory) and a refresh token (stored in httpOnly cookie)
**And** I am redirected to the main application page

**Given** I am authenticated
**When** my access token expires
**Then** the system silently refreshes it using the refresh token
**And** I experience no interruption in my session

**Given** I am authenticated
**When** I click "Sign out"
**Then** my session is terminated, tokens are invalidated, and I am returned to the login page

**Given** a non company Google account attempts to sign in
**When** the OAuth callback is processed
**Then** access is denied with a clear error message

### Story 1.3: Role-Based Access Control & Manager Routing

As a **system administrator**,
I want users assigned appropriate roles with correct manager relationships,
So that each user accesses only the features and data relevant to their role.

**Acceptance Criteria:**

**Given** a user exists in the system
**When** their account is provisioned or updated
**Then** they are assigned one of three roles: Employee, Manager, or HR Admin

**Given** a user has the Employee role
**When** they access the application
**Then** they can view the recognition feed, submit nominations, and view their personal history
**And** they cannot access the manager approval queue or HR admin dashboard

**Given** a user has the Manager role
**When** they access the application
**Then** they have all Employee capabilities plus access to the approval queue for their direct reports

**Given** a user has the HR Admin role
**When** they access the application
**Then** they have all Employee capabilities plus access to the admin dashboard with org-wide data

**Given** a user with the Employee role
**When** they attempt to access an API endpoint requiring Manager or HR Admin role
**Then** they receive a 403 Forbidden JSON response with `{ statusCode: 403, error: "Forbidden", message: "..." }`

**Given** a user's manager relationship is defined in the system
**When** a nomination is submitted for that user
**Then** the system can determine which manager should receive the approval request

**Given** the seed data script is run
**When** the database is populated
**Then** test users exist for all three roles with correct manager relationships and team assignments

## Epic 2: Peer Nomination & Recognition Feed

An employee can nominate a colleague using @ mention search with a free-text reason. The recognition appears on the public feed showing nominator, recipient, and reason. Rate limiting enforces 1 nomination per month with clear reset visibility.

### Story 2.1: Recognition Data Model & Public Feed

As an **employee**,
I want to view a public recognition feed showing all recognitions with nominator, recipient, and reason,
So that I can see who is being recognized across the organization.

**Acceptance Criteria:**

**Given** I am authenticated
**When** I navigate to the home page
**Then** I see a paginated recognition feed showing all recognitions, most recent first

**Given** the recognition feed is displayed
**When** I view a recognition card
**Then** I see the nominator's name, recipient's name, reason, and date

**Given** there are many recognitions
**When** I scroll or paginate through the feed
**Then** older recognitions load progressively

**Given** there are no recognitions yet
**When** I view the feed
**Then** I see an empty state with a prompt to submit the first recognition

**Given** the feed is loading
**When** data is being fetched
**Then** I see skeleton loaders while content loads

### Story 2.2: User Search & Nomination Submission

As an **employee**,
I want to nominate a colleague by searching for their name and writing a reason,
So that my recognition of their work is visible to the entire organization.

**Acceptance Criteria:**

**Given** I am authenticated
**When** I navigate to the nomination page
**Then** I see a nomination form with a recipient search field and a reason text area

**Given** I am on the nomination form
**When** I type @ followed by characters in the recipient field
**Then** I see an autocomplete dropdown of matching employees

**Given** I have selected a recipient and written a reason
**When** I submit the nomination
**Then** the recognition is created and appears on the public feed
**And** the submission completes in under 1 second (NFR2)

**Given** I am on the nomination form
**When** I try to submit without selecting a recipient or writing a reason
**Then** I see validation errors indicating the missing fields

**Given** I attempt to nominate myself
**When** I submit the form
**Then** the system rejects the nomination with a clear error message

### Story 2.3: Rate Limiting & Nomination Feedback

As an **employee**,
I want to know my nomination limit and when it resets,
So that I can plan when to recognize my colleagues.

**Acceptance Criteria:**

**Given** I have already submitted a nomination this month
**When** I attempt to submit another nomination
**Then** the system rejects it with a message explaining the 1-per-month limit

**Given** I have used my monthly nomination
**When** I view the nomination page
**Then** I see a clear display of when my limit resets

**Given** it is a new month and my limit has reset
**When** I access the nomination form
**Then** I can submit a new nomination

**Given** I have not yet nominated this month
**When** I view the nomination page
**Then** I see that I have 1 nomination available

**Given** I attempt to submit a nomination that exceeds the rate limit
**When** the API returns a 409 Conflict
**Then** the error is displayed as a JSON error with a clear message