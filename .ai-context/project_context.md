# Project Context: Employee Internal Transfer Digital Journey

## Overview
The **Employee Internal Transfer Digital Journey** is an enterprise-grade capability within the One-Point Employee Portal. It digitizes, automates, and orchestrates the end-to-end internal transfer process—from initial employee submission through dual-manager approvals, HR policy validation, and parallel downstream execution across IT provisioning, Payroll adjustment, and Facilities arrangement.

## Baseline Parameters
- **Project Name:** Employee Internal Transfer Digital Journey (`employee-internal-transfer`)
- **Project Type:** Full Stack
- **Architecture Style:** Modular Monolith (Microservice Ready)
- **Frontend Stack:** React (Vite) + Vanilla CSS / Tailwind (Modern Responsive Dark/Light UI)
- **Backend Stack:** Node.js + Express (TypeScript)
- **Database & Data Access:** PostgreSQL + Sequelize / TypeORM (with multi-environment SQLite/In-memory testing)
- **Authentication & Security:** JWT Token Authentication + Role-Based Access Control (RBAC)
- **Deployment Target:** Docker Container / Cloud Native Container Run
- **Gate 1 Reviewers:** Supratim Jetty (Tech Lead / PM, `supratim.jetty@intglobal.com`)
- **Gate 2 Reviewers:** Supratim Jetty (Tech Lead / PM, `supratim.jetty@intglobal.com`)

## Business Stakeholders & Roles
1. **Employee:** Initiates, tracks, and manages personal internal transfer requests.
2. **Current Manager (Releasing):** Evaluates team capacity impact and approves/rejects initial request.
3. **Receiving Manager:** Evaluates role fit, headcount, and budget to approve/reject incoming transfer.
4. **HR Administrator:** Validates company policy compliance, tenure, and organizational restructuring approval.
5. **IT Specialist:** Provisions accounts, software licenses, equipment, and access permissions.
6. **Payroll Specialist:** Updates salary bands, cost centers, taxation jurisdiction, and payroll records.
7. **Facilities Specialist:** Allocates workspace, physical building access, and office logistics.

## Key Goals & Success Criteria
- Eliminate disconnected emails and manual handoffs.
- Provide single-pane-of-glass status visibility for transferring employees.
- Automate multi-gate approval chains with clear SLA tracking and audit trails.
- Enforce strict SDD traceability across all requirements, specifications, tests, and code.
