# Project Constitution

## Testing Discipline
- **Test-First (TDD)**: RED-GREEN-Refactor cycle is mandatory. RED tests must be written and verified failing before implementing functional code.
- **Coverage Target**: Minimum 90% line and branch test coverage for core business modules (transfer request creation, validation, multi-stage approval workflow, downstream task orchestration).
- **Test Layers**:
  - Unit tests for domain logic, status transition validation, eligibility checks, and utility functions.
  - Integration tests for REST API endpoints, authentication/authorization middleware, and database operations.
  - End-to-end / acceptance tests mapped directly to spec acceptance criteria (`.AC` IDs).

## Security Posture
- **Role-Based Access Control (RBAC)**: Enforce strict role authorization across Employee, Current Manager (Releasing), Receiving Manager, HR Administrator, IT Specialist, Payroll Specialist, and Facilities Specialist.
- **Authentication**: JWT token-based authentication with cryptographically secure signatures, standard expiration, and user identity verification.
- **Input Validation & Sanitization**: Strict schema validation on all API endpoints; zero trust on client input to prevent injection, tampering, and malicious payloads.
- **Data Protection & Privacy**: Confidential transfer notes and compensation/payroll details restricted strictly to authorized roles (HR and Payroll).

## Architectural Constraints
- **Pattern**: Modular Monolith + Microservice Ready.
- **Modularity**: Domain modules (`transfers`, `approvals`, `orchestration`, `notifications`, `users`) must be loosely coupled with explicit interfaces.
- **Separation of Concerns**: Strict boundary between Presentation Layer (`src/frontend/`), Business & Orchestration Layer (`src/backend/modules/`), and Shared Infrastructure (`src/backend/shared/`).
- **Portability**: All repository links, references, and imports must use relative paths. Absolute system paths are strictly prohibited.

## Non-Functional Baselines
- **API Performance**: p95 response time under 200ms for standard queries and under 500ms for state transition/orchestration triggers.
- **Auditability**: Complete, immutable event audit trail for every transfer initiation, approval, rejection, cancellation, and task completion.
- **Reliability & Idempotency**: State transitions and downstream orchestration event dispatches must be idempotent to prevent duplicate task triggers.

## Versioning Rules
- **Semantic Versioning**: Standard SemVer (`MAJOR.MINOR.PATCH`) applied to all releases.
- **API Versioning**: URL-versioned REST API routes under `/api/v1/`.
