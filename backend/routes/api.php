<?php

declare(strict_types=1);

/**
 * Section 32.2 & Pillar 1/7 Compliance:
 * Explicitly versioned URI routes (/api/v1/*) with mandatory Middleware Pipeline
 * (RateLimitMiddleware -> JwtAuthMiddleware -> RoleMiddleware -> FormRequest -> AuditLoggerMiddleware).
 */
return [
    'POST /api/v1/auth/register' => [
        'handler' => 'AuthController@register',
        'middleware' => ['rate_limit:20,60', 'validate:RegisterRequest', 'audit_log'],
        'roles' => [],
    ],
    'POST /api/v1/auth/login' => [
        'handler' => 'AuthController@login',
        'middleware' => ['rate_limit:10,60', 'audit_log'],
        'roles' => [],
    ],
    'GET /api/v1/listings' => [
        'handler' => 'ListingController@index',
        'middleware' => ['rate_limit:120,60'],
        'roles' => [],
    ],
    'POST /api/v1/listings' => [
        'handler' => 'ListingController@store',
        'middleware' => ['rate_limit:15,60', 'jwt_auth', 'rbac:HOST,ADMIN', 'validate:StoreListingRequest', 'audit_log'],
        'roles' => ['HOST', 'ADMIN'],
    ],
    'DELETE /api/v1/listings/{id}' => [
        'handler' => 'ListingController@destroy',
        'middleware' => ['rate_limit:15,60', 'jwt_auth', 'rbac:HOST,ADMIN', 'audit_log'],
        'roles' => ['HOST', 'ADMIN'],
    ],
    'GET /api/v1/listings/search' => [
        'handler' => 'SearchController@search',
        'middleware' => ['rate_limit:120,60', 'validate:SearchListingsRequest'],
        'roles' => [],
    ],
    'POST /api/v1/bookings' => [
        'handler' => 'BookingController@store',
        'middleware' => ['rate_limit:20,60', 'jwt_auth', 'rbac:GUEST,HOST,ADMIN', 'validate:CreateBookingRequest', 'audit_log'],
        'roles' => ['GUEST', 'HOST', 'ADMIN'],
    ],
    'POST /api/v1/checkout' => [
        'handler' => 'StripePaymentAdapter@processCheckout',
        'middleware' => ['rate_limit:20,60', 'jwt_auth', 'rbac:GUEST,HOST,ADMIN', 'audit_log'],
        'roles' => ['GUEST', 'HOST', 'ADMIN'],
    ],
    'POST /api/v1/webhooks/stripe' => [
        'handler' => 'WebhookController@handleStripeWebhook',
        'middleware' => ['rate_limit:60,60', 'audit_log'],
        'roles' => [],
    ],
    'POST /api/v1/reviews' => [
        'handler' => 'ReviewController@store',
        'middleware' => ['rate_limit:15,60', 'jwt_auth', 'rbac:GUEST', 'audit_log'],
        'roles' => ['GUEST'],
    ],
    'GET /api/v1/audit' => [
        'handler' => 'AuditController@index',
        'middleware' => ['rate_limit:60,60', 'jwt_auth', 'rbac:ADMIN', 'audit_log'],
        'roles' => ['ADMIN'],
    ],
];
