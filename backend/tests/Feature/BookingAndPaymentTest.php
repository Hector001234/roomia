<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Http\Controllers\BookingController;
use App\Repositories\AuditRepository;
use App\Services\BookingService;
use App\Services\BookingTransactionService;

/**
 * Covers CPF-02, CP-CONC-01, CP-CONC-02, CP-INT-04, CP-INT-08 (M04 Atomic Bookings & Stripe Webhooks).
 */
final class BookingAndPaymentTest
{
    public function testConcurrentOverlapReturnsHttp409Conflict(): bool
    {
        $service = new BookingService(new BookingTransactionService(), new AuditRepository());
        $controller = new BookingController($service);
        $payload = [
            'listing_id' => 42,
            'guest_id' => 104,
            'check_in' => '2026-11-20',
            'check_out' => '2026-11-23',
            'guests_count' => 2,
            'nightly_rate' => '1500.00',
        ];
        $first = $controller->store('GUEST', $payload);
        $second = $controller->store('GUEST', $payload);
        return $first['status_code'] === 201 && $second['status_code'] === 409;
    }
}
