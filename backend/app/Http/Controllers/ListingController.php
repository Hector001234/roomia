<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Middleware\RoleMiddleware;
use App\Http\Requests\StoreListingRequest;
use App\Services\ListingService;

final class ListingController
{
    public function __construct(private readonly ListingService $listingService)
    {
    }

    public function store(string $userRole, array $payload, array $photos): array
    {
        if (!RoleMiddleware::isAuthorized($userRole, 'POST /api/v1/listings')) {
            return ['status_code' => 403, 'error' => 'Forbidden: Only HOST role can publish listings.'];
        }

        $validation = StoreListingRequest::validate($payload, $photos);
        if (!$validation['valid']) {
            return $validation;
        }

        $listing = $this->listingService->publishListing($payload, $photos);
        return ['status_code' => 201, 'data' => $listing];
    }
}
