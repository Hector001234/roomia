# Roomia — Temporary Accommodation Intermediation Platform

> **Quality Management Baseline**: `MC-ROOMIA-2026-V3.1` | `ERS-ROOMIA-2026-V3.1` | `DD-ROOMIA-2026-V3.1` | `RTM-ROOMIA-2026-V3.1`
> **Standards**: ISO/IEC 25010:2011, ISO/IEC 25012:2008, ISO/IEC 27001:2022, ISO/IEC/IEEE 29119, ISO 19011:2018, OWASP ASVS, LFPDPPP.

## 1. Architecture Overview (Section 13)
Roomia implements a decoupled 3-tier **Clean Architecture**:
- **Frontend (`/frontend`)**: React 18 Single Page Application (SPA) with strict TypeScript (`noImplicitAny`), Tailwind CSS, WCAG 2.1 AA accessibility attributes, and Axios JWT interceptors.
- **Backend (`/backend`)**: Laravel 11 RESTful API (PHP 8.3, `declare(strict_types=1);`, PSR-12 compliant, McCabe cyclomatic complexity < 10, methods <= 25 effective lines).
- **Persistence & Caching (`/backend/database`)**: MySQL 8.0 (`InnoDB` in 3rd Normal Form with `ON DELETE RESTRICT` and pessimistic locking `SELECT ... FOR UPDATE`) and Redis 7.x for search caching and JWT revocation.

## 2. Module Mapping to RTM (Section 12)
| Module | Requirement ID | Backend Artifacts | Frontend Artifacts | Automated Tests |
| :--- | :--- | :--- | :--- | :--- |
| **M01 Identity & RBAC** | `RF-01`, `RQ-SEG-001`, `RQ-SEG-002` | `AuthController.php`, `AuthService.php`, `RegisterRequest.php`, `RoleMiddleware.php` | `RegisterForm.tsx` | `CPF-01`, `CP-AUTH-01`, `CP-AUTH-02` |
| **M02 Listing Catalog** | `RF-02`, `RQ-DAT-01` | `ListingController.php`, `ListingService.php`, `ListingRepositoryInterface.php` | `CreateListing.tsx`, `PropertyCard.tsx` | `CPF-03`, `CP-CAT-01`, `CP-SYS-03` |
| **M03 Search Engine** | `RF-03`, `RQ-PERF-01` | `SearchController.php`, `SearchRepository.php` | `SearchFilters.tsx`, `useAvailabilityCheck.ts` | `CPF-04`, `CP-PERF-01`, `CP-PERF-02` |
| **M04 Bookings & Payments** | `RF-04`, `RF-05`, `RQ-FUNC-01` | `BookingController.php`, `BookingService.php`, `BookingTransactionService.php`, `StripePaymentAdapter.php`, `WebhookController.php` | `BookingModal.tsx`, `Checkout.tsx`, `CheckoutModal.tsx`, `usePaymentIntent.ts` | `CPF-02`, `CP-CONC-01`, `CP-CONC-02`, `CP-INT-04`, `CP-INT-08` |
| **M05 Verified Reviews** | `RF-05B` | `ReviewController.php`, `ReviewService.php` | `ReviewForm.tsx` | `CPF-05`, `CP-REV-01` |
| **M06 Immutable Audit Trail** | `RF-06`, `RQ-AUD-01` | `AuditLoggerMiddleware.php`, `AuditRepository.php`, `AuditController.php` | `AdminLogs.tsx` | `CP-AUD-01`, `CP-AUD-02` |
