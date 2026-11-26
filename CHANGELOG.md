# Changelog — Roomia Platform

All notable changes to this project are documented in this file in accordance with **Semantic Versioning 2.0.0 (SemVer)** and **Section 32** of `MC-ROOMIA-2026-V3.1`.

## [v3.2.0] - 2026-11-25
### Added
- **Real PostgreSQL 18 Persistence (`roomia_db`)**: Connected `backend/server.mjs` and `backend/apiEngine.mjs` directly to PostgreSQL 18 via `pg` connection pool (`backend/db.mjs`) using least-privilege role `roomia_app_user` (with `UPDATE/DELETE/TRUNCATE` revoked on `audit_logs`).
- **RFC 9457 / RFC 7807 Problem Details (`OBS-02`)**: Standardized all HTTP 4xx/5xx error responses with `type`, `title`, `status`, `detail`, and `instance`.
- **Formal Change Control (`RFC-001` / `NCM-01`)**: Issued signed RFC documenting the migration from MySQL 8.0 to PostgreSQL 18 (3NF, PL/pgSQL `SQLSTATE 45000` immutability triggers, `pgcrypto` SHA-256 hash chain, partial unique index `uq_booking_dates_active_lock`).
- **Live E2E Audit Verification (`scripts/run_live_e2e_audit.mjs`)**: Automated live end-to-end verification across all 3 services (`8000`, `5174`, `5175`) and PostgreSQL 18 (`8/8 PASS` + `15/15 PASS` backend suite).
- **One-Click Demo Launcher (`scripts/start-roomia.ps1`)**: Starts API `:8000`, Public Portal `:5174`, and Admin Backoffice `:5175` cleanly.

### Changed
- **Eliminated Frontend `localStorage` Simulation**: Rewrote `frontend/src/utils/apiClient.ts`, `frontend-admin/src/utils/apiClient.ts`, and both `AuthContext.tsx` to authenticate via real HMAC-SHA256 JWT (`Authorization: Bearer <token>`) and proxy `/api/v1` directly to `http://127.0.0.1:8000` in both `vite.config.ts`. Bookings and payments created on `:5174` now appear immediately on `:5175` and in pgAdmin 4.
- **Geographic Coordinate Boundaries (`NCM-03`)**: Restricted listing coordinates to the Mexico operational quadrant (`lat [14.5, 32.7]`, `lng [-118.4, -86.7]`).
- **CI/CD Pipeline (`NCM-02`)**: Replaced simulated `echo` statements in `.github/workflows/ci-cd-pipeline.yml` with real TypeScript builds and live PostgreSQL 15-control audit execution.
- **LFPDPPP Authority Reference (`OBS-01`)**: Replaced obsolete references to the extinguished INAI with the current authority (**Secretaría Anticorrupción y Buen Gobierno**).

### Fixed
- **Interactive Map (`InteractiveMapView.tsx`)**: Fixed Leaflet blank/gray canvas when switching providers (`Calles` ↔ `Satelital HD` ↔ `Google Maps` ↔ `Waze`), raised toolbar & floating card `z-index` to `z-[500]`, fixed responsive price pills (`width: max-content`), added `invalidateSize()` + `fitBounds()`, and switched street tiles to watermark-free **Esri World Street Map**.
- **Admin Login Role Race Condition (`AdminLoginPage.tsx`)**: Validated `res.user.role === 'ADMIN'` directly from the API response instead of reading stale `localStorage`.
- **Audit CSV Export (`AdminAuditPage.tsx`)**: Fixed camelCase field keys so exported CSV files include complete SHA-256 chain data.

## [v3.1.0] - 2026-09-10
### Added
- **M01 Identity & Access (`RF-01`)**: Implemented `AuthController`, `AuthService`, `RegisterRequest` (RFC 5322 validation), Argon2id password derivation (`64MB, t=4, p=2`), asymmetric RSA-2048 JWT tokens (60-min TTL), Redis single-use refresh tokens, 5-attempt brute-force lockout, and `RoleMiddleware` RBAC (`GUEST`, `HOST`, `ADMIN`).
- **M02 Listing Catalog (`RF-02`)**: Implemented `ListingController`, `ListingService`, `ListingRepositoryInterface`, coordinate boundary validation (`[-90, 90]`, `[-180, 180]`), and WebP media optimization for up to 15 photos.
- **M03 Multi-Criteria Search Engine (`RF-03`)**: Added `SearchController` and `SearchRepository` with composite indexing and Redis caching (`P95 <= 1.5s`).
- **M04 Atomic Bookings & Stripe Webhooks (`RF-04`, `RF-05`)**: Implemented `BookingTransactionService` with pessimistic locking (`SELECT ... FOR UPDATE`), `HTTP 409 Conflict` double-booking rejection, exact `DECIMAL(10,2)` calculation (`calculateTotalAmount`), and `StripePaymentAdapter` / `WebhookController` without storing PAN or CVV.
- **M05 Verified Reviews (`RF-05B`)**: Implemented `ReviewController` and `ReviewService` enforcing `COMPLETED` stay verification (`HTTP 403 Forbidden` on unverified stay).
- **M06 Immutable Audit Trail (`RF-06`, `RQ-AUD-01`)**: Implemented `AuditLoggerMiddleware`, `AuditRepository` with chained `SHA-256` hashes (`previous_hash`, `current_hash`), IP anonymization, and `BEFORE UPDATE` / `BEFORE DELETE` immutability triggers.
