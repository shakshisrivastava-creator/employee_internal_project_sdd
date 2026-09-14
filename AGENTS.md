# INT AI-First Engineering Policy & Repository Governance

## 1. Governance & Authority Hierarchy
This repository adheres strictly to the **INT Specification-Driven Development (SDD)** lifecycle. All software development, enhancements, bug fixes, and modifications must strictly follow this policy.

The governing authority hierarchy is:
1. **Repository-Local Skills (`.agents/skills/`) & Policy (`AGENTS.md`)** [Highest Priority]
2. **Project AI Context (`.ai-context/`) & Constitution (`.ai-context/constitution.md`)**
3. **INT Control Plane (`.agent/`)**
4. **Global AI Customizations & Fallbacks (`~/.gemini/config/`)**

## 2. The SDD Engineering Chain
No code shall be written without an approved specification and verified test-first discipline:

```text
Business Requirement / BRD
       │
       ▼
Feature Spec (`.ai-context/specs/<feature-slug>.spec.md`)
       │
       ▼
Gate 1 Review (Spec Peer Review & Approval)
       │
       ▼
Technical Plan (`.ai-context/plans/<feature-slug>.plan.md`)
       │
       ▼
Task Decomposition (`.ai-context/tasks/<feature-slug>.tasks.md`)
       │
       ▼
Spec-Derived Test Cases (`.ai-context/test_cases/<feature-slug>.test_cases.md`)
       │
       ▼
Test-First (RED Tests in `tests/`)
       │
       ▼
Implementation (GREEN Tests in `src/`)
       │
       ▼
Gate 2 Review (Code Review & Quality Verification)
       │
       ▼
Release (`.ai-context/releases/RELEASE-vX.Y.Z.md`)
```

## 3. Core Governance Rules
1. **Specification First**: Implementation without an approved specification is strictly prohibited.
2. **Gate 1 Approval**: Code generation cannot begin until Gate 1 (Spec Review) is signed off by designated reviewers.
3. **Test-First Discipline (TDD)**: Automated test cases must be written and executed (failing/RED) before functional implementation is committed.
4. **Gate 2 Review**: Code review, security scan, and test suite verification must pass before merging or releasing.
5. **Flat File Artifacts**: All `.ai-context` artifacts sit flat inside their respective directory (e.g. `.ai-context/specs/<feature-slug>.spec.md`). Subdirectories per feature are prohibited.
6. **Portable Paths**: Absolute paths (e.g. `C:\Users\...`) are prohibited in repository documentation and artifacts. Always use workspace-relative paths.
7. **Append-Only Prompt History**: `.ai-context/prompt_history.md` is strictly append-only.

## 4. Local Skills Reference
The following local skills are maintained in `.agents/skills/`:
- `int-project-setup`: Project initialization and baseline control plane maintenance.
- `int-sdd-lifecycle`: End-to-end SDD feature development lifecycle.
- `int-brd-ingestion`: BRD ingestion, requirement baseline, and change management.
- `int-incident-management`: Production incident triage, classification, and routing.
- `int-hotfix-management`: Emergency hotfixes with post-hoc Gate 2 reviews.
- `int-release-management`: Release readiness validation and spec-driven release notes.
- `int-session-continuation`: Session resumption and persistent memory tracking.
