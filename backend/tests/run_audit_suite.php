<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

use App\Http\Controllers\AuditController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\ListingController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\WebhookController;
use App\Repositories\AuditRepository;
use App\Repositories\ListingRepository;
use App\Repositories\SearchRepository;
use App\Services\AuthService;
use App\Services\BookingService;
use App\Services\BookingTransactionService;
use App\Services\ListingService;
use App\Services\ReviewService;
use App\Services\StripePaymentAdapter;

$passed = 0;
$failed = 0;

function assertAuditCase(string $testId, string $description, bool $condition): void
{
    global $passed, $failed;
    if ($condition) {
        $passed++;
        echo "[PASS] {$testId}: {$description}\n";
    } else {
        $failed++;
        echo "[FAIL] {$testId}: {$description}\n";
    }
}

echo "======================================================================\n";
echo " ROOMIA AUTOMATED AUDIT VERIFICATION SUITE (MC-ROOMIA-2026-V3.1)\n";
echo "======================================================================\n";

// 1. CPF-01: RFC 5322 Invalid Email Registration
$authService = new AuthService();
$authController = new AuthController($authService);
$cpf01 = $authController->register([
    'name' => 'Carlos Ruiz',
    'email' => 'carlos.ruiz@dominio_invalido',
    'role' => 'GUEST',
]);
assertAuditCase('CPF-01', 'Reject invalid RFC 5322 email with HTTP 422', $cpf01['status_code'] === 422);

// 2. CP-AUTH-01: Argon2id Hashing Parameters (m=65536, t=4, p=2)
$validReg = $authController->register([
    'name' => 'Ana Gomez',
    'email' => 'ana.gomez@roomia.mx',
    'password' => 'SecurePass#2026',
    'role' => 'GUEST',
]);
$hash = $validReg['data']['password_hash'] ?? '';
assertAuditCase(
    'CP-AUTH-01',
    'Password hashed with Argon2id (memory=65536, time=4, threads=2)',
    str_starts_with($hash, '$argon2id$v=19$m=65536,t=4,p=2$')
);

// 3. CP-AUTH-02: RSA-2048 JWT Issuance (60m TTL) & 5-Attempt Brute Force Lockout
$loginOk = $authController->login('ana.gomez@roomia.mx', 'SecurePass#2026');
for ($i = 0; $i < 5; $i++) {
    $authController->login('ana.gomez@roomia.mx', 'WrongPassword');
}
$lockedResp = $authController->login('ana.gomez@roomia.mx', 'SecurePass#2026');
assertAuditCase(
    'CP-AUTH-02',
    'Issue JWT (TTL 3600s) and lock account with HTTP 429 after 5 failed attempts',
    $loginOk['status'] === 200 && $loginOk['expires_in'] === 3600 && $lockedResp['status'] === 429
);

// 4. CPF-03 & CP-CAT-01: Listing Creation with 15 WebP Photos & Coordinate Validation
$listingRepo = new ListingRepository();
$listingService = new ListingService($listingRepo);
$listingController = new ListingController($listingService);
$photos15 = array_map(fn (int $n): string => "photo_{$n}.jpg", range(1, 15));
$cpf03 = $listingController->store('HOST', [
    'host_id' => 1,
    'title' => 'Bosque Real Cabin',
    'city' => 'Toluca',
    'latitude' => 19.2826,
    'longitude' => -99.6557,
    'price_per_night' => 1500.00,
    'max_guests' => 4,
], $photos15);
$invalidCoords = $listingController->store('HOST', [
    'host_id' => 1,
    'title' => 'Invalid Coords Listing',
    'city' => 'Toluca',
    'latitude' => 135.0,
    'longitude' => -99.0,
    'price_per_night' => 1200.00,
    'max_guests' => 2,
], ['p1.jpg']);
$guestForbidden = $listingController->store('GUEST', [
    'host_id' => 104,
    'title' => 'Unauthorized Host Listing',
    'city' => 'Toluca',
    'latitude' => 19.28,
    'longitude' => -99.65,
    'price_per_night' => 900.00,
    'max_guests' => 2,
], ['p1.jpg']);

assertAuditCase(
    'CPF-03',
    'Publish listing with 15 photos converted to WebP and return HTTP 201',
    $cpf03['status_code'] === 201 && count($cpf03['data']['photos']) === 15 && $cpf03['data']['photos'][0]['mime_type'] === 'image/webp'
);
assertAuditCase(
    'CP-CAT-01',
    'Reject out-of-range coordinates with HTTP 422 and enforce RBAC HTTP 403 for GUEST',
    $invalidCoords['status_code'] === 422 && $guestForbidden['status_code'] === 403
);

// 5. CPF-04: Multi-Criteria Search on Occupied Dates Returns []
$searchRepo = new SearchRepository(
    [['id' => 42, 'title' => 'Toluca Loft', 'city' => 'Toluca', 'max_guests' => 4, 'status' => 'ACTIVE']],
    [42 => ['2026-12-24', '2026-12-25']]
);
$searchController = new SearchController($searchRepo);
$cpf04 = $searchController->search([
    'city' => 'Toluca',
    'guests' => 2,
    'check_in' => '2026-12-24',
    'check_out' => '2026-12-26',
]);
assertAuditCase(
    'CPF-04',
    'Search over occupied dates returns HTTP 200 with empty data array [] and 0 total',
    $cpf04['status_code'] === 200 && $cpf04['data'] === [] && $cpf04['pagination']['total'] === 0
);

// 6. CP-CONC-01 & CP-CONC-02: Pessimistic Lock Prevents Double Booking (HTTP 409) & Exact Decimal Math
$auditRepo = new AuditRepository();
$txService = new BookingTransactionService();
$bookingService = new BookingService($txService, $auditRepo);
$bookingController = new BookingController($bookingService);

$firstBooking = $bookingController->store('GUEST', [
    'listing_id' => 42,
    'guest_id' => 104,
    'check_in' => '2026-11-20',
    'check_out' => '2026-11-23',
    'guests_count' => 2,
    'nightly_rate' => '1500.00',
]);
$secondConcurrentBooking = $bookingController->store('GUEST', [
    'listing_id' => 42,
    'guest_id' => 205,
    'check_in' => '2026-11-21',
    'check_out' => '2026-11-24',
    'guests_count' => 2,
    'nightly_rate' => '1500.00',
]);
assertAuditCase(
    'CP-CONC-01',
    'Pessimistic lock confirms first booking (HTTP 201) and rejects overlapping concurrent request with HTTP 409 Conflict',
    $firstBooking['status_code'] === 201 && $secondConcurrentBooking['status_code'] === 409
);
assertAuditCase(
    'CP-CONC-02',
    'Exact DECIMAL(10,2) calculation (3 nights * 1500.00 = 4500.00 + 540.00 fee + 720.00 tax = 5760.00)',
    $firstBooking['booking']['total_amount'] === '5760.00' && strlen($firstBooking['booking']['integrity_sha256']) === 64
);

// 7. CPF-02, CP-INT-04 & CP-INT-08: Stripe Payment Declined (402 + Date Release) & Webhook Verification
$stripeAdapter = new StripePaymentAdapter($bookingService, $auditRepo, 'whsec_roomia_audit_secret');
$webhookController = new WebhookController($stripeAdapter);

$cpf02 = $stripeAdapter->processCheckout($firstBooking['booking']['id'], '4000 0000 0000 0999');
$rebookAfterRelease = $bookingController->store('GUEST', [
    'listing_id' => 42,
    'guest_id' => 205,
    'check_in' => '2026-11-20',
    'check_out' => '2026-11-23',
    'guests_count' => 2,
    'nightly_rate' => '1500.00',
]);
assertAuditCase(
    'CPF-02',
    'Declined card (4000 0000 0000 0999) returns HTTP 402 Payment Required and releases locked dates',
    $cpf02['status_code'] === 402 && $rebookAfterRelease['status_code'] === 201
);

$validWebhookPayload = (string) json_encode(['type' => 'payment_intent.succeeded', 'data' => ['booking_id' => $rebookAfterRelease['booking']['id']]]);
$validSig = hash_hmac('sha256', $validWebhookPayload, 'whsec_roomia_audit_secret');
$cpInt04 = $webhookController->handleStripeWebhook($validWebhookPayload, $validSig);
$cpInt08 = $webhookController->handleStripeWebhook($validWebhookPayload, 'invalid_forged_signature');
assertAuditCase(
    'CP-INT-04 & CP-INT-08',
    'Signed Stripe webhook confirms booking (200) and forged webhook signature is rejected (400)',
    $cpInt04['status_code'] === 200 && $cpInt08['status_code'] === 400
);

// 8. CPF-05 & CP-REV-01: Review Requires COMPLETED Stay
$reviewService = new ReviewService($auditRepo);
$reviewController = new ReviewController($reviewService);
$cpf05 = $reviewController->store(104, 42, 5, 'Attempt without completed stay');
$reviewService->registerCompletedStay(104, 42, $rebookAfterRelease['booking']['id']);
$cpRev01 = $reviewController->store(104, 42, 5, 'Verified excellent stay!');
assertAuditCase(
    'CPF-05 & CP-REV-01',
    'Reject unverified review with HTTP 403 Forbidden and allow review after COMPLETED stay (HTTP 201)',
    $cpf05['status_code'] === 403 && $cpRev01['status_code'] === 201
);

// 9. CP-AUD-01 & CP-AUD-02: Immutable Audit Log Blocks UPDATE/DELETE and Verifies SHA-256 Chain
$updateBlocked = false;
try {
    $auditRepo->updateEntry(1, ['event_type' => 'TAMPERED']);
} catch (RuntimeException $e) {
    $updateBlocked = str_contains($e->getMessage(), 'SQLSTATE[45000]');
}
$auditController = new AuditController($auditRepo);
$auditResp = $auditController->index('ADMIN');
assertAuditCase(
    'CP-AUD-01 & CP-AUD-02',
    'Block UPDATE/DELETE on audit_logs (SQLSTATE 45000) and verify 100% SHA-256 hash chain integrity',
    $updateBlocked && $auditResp['status_code'] === 200 && $auditResp['chain_integrity_verified'] === true
);

echo "======================================================================\n";
echo " SUMMARY: {$passed} PASSED, {$failed} FAILED\n";
echo "======================================================================\n";
exit($failed > 0 ? 1 : 0);
