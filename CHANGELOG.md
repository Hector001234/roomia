# Changelog — Roomia Platform

All notable changes to this project are documented in this file in accordance with **Semantic Versioning 2.0.0 (SemVer)** and **Section 32** of `MC-ROOMIA-2026-V3.1`.

## [v3.1.0] - 2026-09-10
### Added
- **M01 Identity & Access (`RF-01`)**: Implemented `AuthController`, `AuthService`, `RegisterRequest` (RFC 5322 validation), Argon2id password derivation (`64MB, t=4, p=2`), asymmetric RSA-2048 JWT tokens (60-min TTL), Redis single-use refresh tokens, 5-attempt brute-force lockout, and `RoleMiddleware` RBAC (`GUEST`, `HOST`, `ADMIN`).
- **M02 Listing Catalog (`RF-02`)**: Implemented `ListingController`, `ListingService`, `ListingRepositoryInterface`, coordinate boundary validation (`[-90, 90]`, `[-180, 180]`), and WebP media optimization for up to 15 photos.
- **M03 Multi-Criteria Search Engine (`RF-03`)**: Added `SearchController` and `SearchRepository` with composite MySQL indexing and Redis caching (`P95 <= 1.5s`).
- **M04 Atomic Bookings & Stripe Webhooks (`RF-04`, `RF-05`)**: Implemented `BookingTransactionService` with pessimistic locking (`SELECT ... FOR UPDATE`), `HTTP 409 Conflict` double-booking rejection, exact `DECIMAL(10,2)` calculation (`calculateTotalAmount`), and `StripePaymentAdapter` / `WebhookController` without storing PAN or CVV.
- **M05 Verified Reviews (`RF-05B`)**: Implemented `ReviewController` and `ReviewService` enforcing `COMPLETED` stay verification (`HTTP 403 Forbidden` on unverified stay).
- **M06 Immutable Audit Trail (`RF-06`, `RQ-AUD-01`)**: Implemented `AuditLoggerMiddleware`, `AuditRepository` with chained `SHA-256` hashes (`previous_hash`, `current_hash`), IP anonymization, and MySQL `BEFORE UPDATE` / `BEFORE DELETE` immutability triggers.
