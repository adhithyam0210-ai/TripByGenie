---
description: Mandatory Security, Privacy, and Scalability Standards for TripByGenie
globs: ["**/*"]
alwaysApply: true
---

# TripByGenie Enterprise Standards & Security Directives

Every future update, feature addition, refactoring, and file creation in this repository MUST comply with these mandatory rules:

1. **Zero-Trust Identity**:
   - Access tokens have 15-minute expiration.
   - Refresh tokens are rotating, SHA-256 hashed in database, and delivered via HttpOnly SameSite Secure cookies.
   - Enforce Token Reuse Detection (BCP 225).
   - Never store tokens in `localStorage`.
2. **Server-Side RBAC & IDOR Immunity**:
   - Enforce role checks in middleware via `authorize(...)`.
   - Never trust client-supplied `user_id`, `agent_id`, `role`, or `customer_id`. Derive identity exclusively from authenticated `req.user`.
   - Enforce query-level ownership checks on all documents, bookings, inquiries, and orders.
3. **API Hardening**:
   - Helmet headers, strict CSP, and explicit CORS allowlist required.
   - Rate limiting on auth and enquiry forms.
   - Strict path traversal guards on file reading/streaming (`safePathResolver`).
4. **India DPDP Act 2023 Compliance**:
   - Maintain `/api/v1/privacy/export`, `/api/v1/privacy/consents`, and `/api/v1/privacy/erase`.
   - Anonymize PII upon erasure requests while preserving tax/statutory financial records.
5. **Database & Financial Transactions**:
   - Use parameterized SQL queries.
   - Wrap booking and payment workflows in atomic transactions with automatic rollback.
   - Enforce idempotency on payments.
6. **Git Safety Rule**:
   - **NEVER run `git commit` or `git push` without the user's explicit prior request and consent.**
7. **Verification**:
   - All tests (`test-security-suite.js`, `test-b2b-workflow.js`, `test-c2b-workflow.js`, `test-enquiry-flow.js`, and `npm run build`) must pass with 0 failures before finishing any task.
