<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Middleware\RoleMiddleware;
use App\Http\Requests\StoreBookingRequest;
use App\Services\BookingService;

final class BookingController
{
    public function __construct(private readonly BookingService $bookingService)
    {
    }

    public function store(string $userRole, array $payload, string $clientIp = '192.168.1.50'): array
    {
        if (!RoleMiddleware::isAuthorized($userRole, 'POST /api/v1/bookings')) {
            return ['status_code' => 403, 'error' => 'Forbidden: Only GUEST role can create bookings.'];
        }

        $validation = StoreBookingRequest::validate($payload);
        if (!$validation['valid']) {
            return $validation;
        }

        return $this->bookingService->createBooking($payload, $clientIp);
    }
}
