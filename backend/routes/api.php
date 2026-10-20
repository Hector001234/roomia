<?php

declare(strict_types=1);

/**
 * Section 32.2 Compliance: Explicitly versioned URI routes (/api/v1/*).
 */
return [
    'POST /api/v1/auth/register' => 'AuthController@register',
    'POST /api/v1/auth/login' => 'AuthController@login',
    'GET /api/v1/listings' => 'ListingController@index',
    'POST /api/v1/listings' => 'ListingController@store',
    'GET /api/v1/listings/search' => 'SearchController@search',
    'POST /api/v1/bookings' => 'BookingController@store',
    'POST /api/v1/checkout' => 'StripePaymentAdapter@processCheckout',
    'POST /api/v1/webhooks/stripe' => 'WebhookController@handleStripeWebhook',
    'POST /api/v1/reviews' => 'ReviewController@store',
    'GET /api/v1/audit' => 'AuditController@index',
];
