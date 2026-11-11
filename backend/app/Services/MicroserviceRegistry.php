<?php

declare(strict_types=1);

namespace App\Services;

/**
 * Section 32.1 & 35.2 Compliance:
 * Formal Microservice Boundary & Distributed Tracing Registry.
 */
final class MicroserviceRegistry
{
    public const SERVICES = [
        'identity-service' => [
            'module_id' => 'M01',
            'version' => '3.1.0',
            'data_store' => 'D1 (PostgreSQL: users + Redis JWT Blacklist)',
            'base_route' => '/api/v1/auth',
            'controllers' => ['AuthController'],
        ],
        'catalog-service' => [
            'module_id' => 'M02',
            'version' => '3.1.0',
            'data_store' => 'D2 (PostgreSQL: listings, listing_photos, amenities + AWS S3)',
            'base_route' => '/api/v1/listings',
            'controllers' => ['ListingController'],
        ],
        'search-service' => [
            'module_id' => 'M03',
            'version' => '3.1.0',
            'data_store' => 'D2/D3 Read Replica + Redis 7.x Cache',
            'base_route' => '/api/v1/listings/search',
            'controllers' => ['SearchController'],
        ],
        'booking-payment-service' => [
            'module_id' => 'M04',
            'version' => '3.1.0',
            'data_store' => 'D3 & D4 (PostgreSQL: bookings, booking_dates, payments)',
            'base_route' => '/api/v1/bookings & /api/v1/checkout & /api/v1/webhooks/stripe',
            'controllers' => ['BookingController', 'WebhookController'],
        ],
        'review-service' => [
            'module_id' => 'M05',
            'version' => '3.1.0',
            'data_store' => 'D2 & D3 (PostgreSQL: reviews, bookings)',
            'base_route' => '/api/v1/reviews',
            'controllers' => ['ReviewController'],
        ],
        'audit-service' => [
            'module_id' => 'M06',
            'version' => '3.1.0',
            'data_store' => 'D5 (PostgreSQL Append-Only: audit_logs)',
            'base_route' => '/api/v1/audit',
            'controllers' => ['AuditController'],
        ],
    ];

    public static function getServiceDescriptor(string $serviceName): ?array
    {
        return self::SERVICES[$serviceName] ?? null;
    }

    public static function getAllServices(): array
    {
        return self::SERVICES;
    }
}
