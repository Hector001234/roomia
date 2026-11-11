# Roomia — Temporary Accommodation Intermediation Platform (v3.1.0)

> **Quality Management Baseline**: `MC-ROOMIA-2026-V3.1` | `ERS-ROOMIA-2026-V3.1` | `DD-ROOMIA-2026-V3.1` | `RTM-ROOMIA-2026-V3.1` | `ALP-ROOMIA-2026-01`  
> **Standards**: ISO/IEC 25010:2011, ISO/IEC 25012:2008, ISO/IEC 27001:2022, ISO/IEC/IEEE 29119, ISO 19011:2018, OWASP ASVS, PCI-DSS 4.0, WCAG 2.1 AA, LFPDPPP.

---

## 1. Architecture: Modular Microservices + Clean Architecture (§13, §32.1 & §35.2)
Roomia combines **Clean Architecture** with **6 domain microservices** orchestrated behind an NGINX API Gateway (`docker-compose.yml`) and instrumented via [`MicroserviceRegistry.php`](backend/app/Services/MicroserviceRegistry.php) and [`StructuredJsonLogger.php`](backend/app/Services/StructuredJsonLogger.php):

1. **`identity-service` (`M01`)**: Argon2id hashing (`m=65536, t=4, p=2`), RSA-2048 JWT tokens (60-min TTL), Redis single-use refresh tokens, 5-attempt lockout, and RBAC (`GUEST`, `HOST`, `ADMIN`).
2. **`catalog-service` (`M02`)**: Property management, geospatial coordinate boundary validation (`[-90, 90]`, `[-180, 180]`), and asynchronous conversion of up to 15 photos to `.webp` with mandatory `alt_text` (WCAG 2.1 AA).
3. **`search-service` (`M03`)**: Parameterized multi-criteria search (`/api/v1/listings/search`) powered by composite PostgreSQL indexing (`idx_listings_search_composite`) and Redis caching ($P_{95} \le 1.5\text{ s}$).
4. **`booking-payment-service` (`M04`)**: Atomic PostgreSQL transactions with row-level pessimistic locking (`SELECT ... FOR UPDATE` + partial unique index `uq_booking_dates_active_lock`), exact `NUMERIC(10,2)` arithmetic, and tokenized Stripe Webhooks (`whsec_...`) with zero PAN/CVV persistence.
5. **`review-service` (`M05`)**: Mutual 1–5 star evaluations strictly conditioned on a `COMPLETED` stay (`CPF-05`, enforced both in `ReviewService.php` and in PostgreSQL via `trg_reviews_verify_completed_stay`).
6. **`audit-service` (`M06`)**: Append-only immutable audit trail (`audit_logs`) with chained `SHA-256` hashes (`pgcrypto`), IP anonymization (`.XXX`), and PostgreSQL triggers blocking `UPDATE` and `DELETE`.

---

## 2. PostgreSQL 16 Database & Live Data Auditing (`backend/database/postgresql/`)
All SQL scripts are located in `backend/database/postgresql/` and are automatically executed by the `postgres:16-alpine` container on startup:
* [`01_schema_3fn.sql`](backend/database/postgresql/01_schema_3fn.sql): 3rd Normal Form (3NF) schema across Data Stores `D1`–`D5` using native `BIGSERIAL`, `UUID`, `NUMERIC(10,2)`, `TIMESTAMPTZ(3)`, `JSONB`, `ON DELETE RESTRICT`, and `CHECK` constraints.
* [`02_data_audit_triggers.sql`](backend/database/postgresql/02_data_audit_triggers.sql):
  * `fn_prevent_audit_logs_tampering()`: `BEFORE UPDATE OR DELETE` trigger on `audit_logs` raising `SQLSTATE 45000`.
  * `fn_automatic_row_level_data_audit()`: `AFTER INSERT OR UPDATE OR DELETE` trigger on `users`, `listings`, `bookings`, `payments`, and `reviews` that automatically records previous/new `JSONB` states (stripping password hashes) and chains `SHA-256` hashes via `pgcrypto`.
  * `fn_enforce_completed_stay_for_review()`: `BEFORE INSERT` trigger on `reviews` raising `SQLSTATE 42501` if stay is not `COMPLETED` (`CPF-05`).
  * Live Auditor Views: `v_booking_tamper_detection`, `v_pci_dss_compliance_check`, and `v_overbooking_integrity_check`.
* [`03_seed_synthetic_data.sql`](backend/database/postgresql/03_seed_synthetic_data.sql): 100% synthetic dataset (`CAL-019`).
* [`04_auditor_verification_queries.sql`](backend/database/postgresql/04_auditor_verification_queries.sql): Ready-to-run SQL queries for live audit demonstrations in **pgAdmin 4 / DBeaver / psql**.

---

## 3. Running the Complete Audit Verification Suite (Weeks 1, 2 & 3)
```powershell
php backend/tests/run_audit_suite.php
```
