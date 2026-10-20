<?php

declare(strict_types=1);

namespace App\Http\Middleware;

/**
 * Section 18.2 & CAL-011 Compliance: Role-Based Access Control (RBAC) Matrix enforcement.
 */
final class RoleMiddleware
{
    private const PERMISSIONS = [
        'GET /api/v1/listings' => ['GUEST', 'HOST', 'ADMIN'],
        'POST /api/v1/bookings' => ['GUEST'],
        'POST /api/v1/checkout' => ['GUEST'],
        'POST /api/v1/listings' => ['HOST'],
        'PUT /api/v1/listings' => ['HOST'],
        'PATCH /api/v1/bookings' => ['HOST'],
        'POST /api/v1/reviews' => ['GUEST', 'HOST'],
        'GET /api/v1/audit' => ['ADMIN'],
    ];

    public static function isAuthorized(string $role, string $endpointKey): bool
    {
        $allowedRoles = self::PERMISSIONS[$endpointKey] ?? [];
        return in_array($role, $allowedRoles, true);
    }
}
