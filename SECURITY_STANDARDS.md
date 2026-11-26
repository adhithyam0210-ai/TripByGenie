# TRIPBYGENIE ENTERPRISE SECURITY, PRIVACY & CODE STANDARDS

This file defines mandatory architecture, security, privacy, and operational guidelines for **TripByGenie**. Every agent, developer, and automated pipeline operating in this repository MUST strictly comply with these rules for all updates, bug fixes, refactoring, and new feature creation.

---

## 1. Zero-Trust Identity & Session Security

1. **Dual-Token Architecture**:
   - Access tokens must have a short lifespan (maximum 15 minutes).
   - Refresh tokens must be cryptographically secure (minimum 32 bytes entropy), stored as SHA-256 hashes in the database (`refresh_tokens` table/collection).
   - Refresh tokens must be delivered via `HttpOnly`, `SameSite=Lax` (or `None` in cross-site production), and `Secure` cookies.
   - Dual support: Accept refresh tokens from cookies (browser SPA) or request body/headers (automated test runners and mobile clients).
2. **Refresh Token Rotation & Reuse Detection (RFC 6749 / BCP 225)**:
   - Every refresh operation MUST revoke the old token and issue a new one under the same `family_id`.
   - If an already-revoked refresh token is replayed, the system MUST treat it as a token theft event and immediately revoke all active tokens in that entire family (`TOKEN_REUSE_DETECTED`).
3. **Instant Session Invalidation**:
   - Password changes, account suspension, or explicit logout (`/api/auth/logout`, `/api/auth/logout-all`) must immediately revoke all tokens and record a `tokens_invalidated_before` timestamp.
4. **Client-Side Credential Storage**:
   - NEVER store refresh tokens, passwords, or persistent sensitive session state in `localStorage` or `sessionStorage`.

---

## 2. Strict Server-Side RBAC & Data Ownership (No IDOR)

1. **Centralized Deny-by-Default Authorization**:
   - Enforce authorization in middleware using centralized matrices (`authorize(...)` in `server/src/middlewares/rbac.middleware.js`).
   - Standard roles: `ADMIN`, `MANAGER`, `STAFF` / `SALES_EXECUTIVE`, `OPERATIONS_EXECUTIVE`, `AGENT`, `CUSTOMER`.
2. **Never Trust Client-Supplied Identifiers**:
   - NEVER trust `user_id`, `agent_id`, `customer_id`, `role`, or `assigned_to` passed in `req.body`, `req.query`, or headers.
   - Always derive identity directly from `req.user` verified by server-side authentication.
3. **Mandatory Query-Level Ownership Checks**:
   - Every read, update, or deletion of a protected resource (bookings, travel documents, quotations, leads, invoices, commissions) MUST verify ownership:
     - **Customers** can only access records where `customer_id === req.user.id` or matching their verified email.
     - **Agents** can only access wholesale records, purchases, and quotes where `agent_id === req.user.id`.
     - **Sales Staff** can only view and update leads and inquiries assigned to their `user_id`.
     - **Operations Staff** can only view and process bookings assigned to their operational scope.
     - **Managers & Admins** have supervisory authority over their respective organizational tiers.

---

## 3. API Hardening & Attack Prevention

1. **Security Headers**:
   - All Express endpoints must be wrapped with Helmet providing:
     - Content Security Policy (CSP) with explicit source allowlisting.
     - `X-Content-Type-Options: nosniff`.
     - `X-Frame-Options: DENY`.
     - Strict-Transport-Security (HSTS in production).
2. **CORS Policy**:
   - No wildcard (`*`) CORS in authenticated API tiers. Maintain an explicit allowlist in `server/src/middlewares/security.middleware.js`.
3. **Rate Limiting & Abuse Defense**:
   - `authLimiter`: Max 20 requests per 15 minutes on login, registration, and password recovery.
   - `enquiryLimiter`: Max 50 requests per hour on public forms.
   - `globalApiLimiter`: Standard sliding window rate limiters across all API endpoints.
4. **Arbitrary File Read & Path Traversal Prevention**:
   - Any endpoint streaming or reading files (`/api/media/stream`, document downloads) MUST validate paths through `safePathResolver` ensuring files strictly reside within designated directories (`server/uploads/` or `public/`). Reject any paths containing `..` or null bytes (`\0`).
5. **Payload Limits**:
   - Express body parsing limit must not exceed 25MB for general endpoints. File uploads above this limit must be processed via streaming or dedicated upload handlers.

---

## 4. India DPDP Act 2023 Statutory Privacy Compliance

1. **Right to Access & Portability (`/api/v1/privacy/export`)**:
   - Must provide Data Principals with a structured, machine-readable JSON bundle of all personal information held.
2. **Consent Lifecycle & Audit Trail (`/api/v1/privacy/consents`)**:
   - Record explicit consent with timestamp, IP address, user agent, and specific processing purpose.
3. **Right to Erasure with Statutory Retention Safeguards (`/api/v1/privacy/erase`)**:
   - Anonymize traveler PII (names, emails, phone numbers, passport scans) upon valid erasure requests.
   - Safeguard: Statutory financial and tax transaction records (GST invoices, advance receipts, transaction IDs) MUST be retained in an anonymized state to satisfy tax compliance laws.

---

## 5. Database & Transactional Integrity

1. **Parameterized Queries**:
   - Raw SQL strings with string concatenation are strictly prohibited. Always use parameterized queries (`$1, $2, ...`).
2. **Atomic Financial Transactions**:
   - State-changing operations involving booking confirmations, payments, wholesale purchases, or customer creation must run inside atomic database transactions (`withTransaction`) with automatic rollback on error.
3. **Idempotency Keys**:
   - Payment webhooks and financial orders must support `idempotency_key` to prevent double-charging or duplicate booking creation on network retries.

---

## 6. Repository & Development Guidelines

1. **Git Control**:
   - **NEVER run `git commit` or `git push` without the user's explicit prior request and consent.**
2. **Continuous Verification**:
   - Any modifications to backend logic, authentication, or routes must maintain full test passes across:
     - `node test-security-suite.js`
     - `node test-b2b-workflow.js`
     - `node test-c2b-workflow.js`
     - `node test-enquiry-flow.js`
     - `npm run build`
3. **Backward Compatibility**:
   - Maintain route compatibility between `/api/*` and `/api/v1/*`. Existing frontend endpoints must continue operating without breaking user sessions.
