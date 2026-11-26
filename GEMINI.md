# TripByGenie Project Guidelines

All AI agents and developers working on this project MUST strictly follow the security, privacy, and development rules defined in [SECURITY_STANDARDS.md](./SECURITY_STANDARDS.md):

1. **Zero-Trust Auth**: 15-min access tokens, rotating refresh tokens in HttpOnly cookies, token reuse detection, instant session revocation.
2. **Strict Server-Side RBAC & Data Ownership**: Never trust client-supplied IDs or roles; enforce query-level ownership checks across customers, agents, staff, bookings, and documents.
3. **API Hardening**: Helmet, CSP, explicit CORS allowlist, rate limiting, and path traversal guards.
4. **India DPDP Act 2023 Compliance**: Data export, consent tracking, and right to erasure with financial record safeguards.
5. **Database & Financial Integrity**: Parameterized queries, atomic transactions with rollback, idempotency keys.
6. **Git Constraint**: **NEVER run `git commit` or `git push` without the user's explicit prior request and consent.**
7. **Test Verification**: Always verify that `test-security-suite.js`, `test-b2b-workflow.js`, `test-c2b-workflow.js`, `test-enquiry-flow.js`, and `npm run build` pass with 0 failures.
