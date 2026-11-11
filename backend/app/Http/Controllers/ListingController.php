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

    public function index(int $limit = 20, int $offset = 0): array
    {
        return [
            'status_code' => 200,
            'data' => $this->listingService->listActive($limit, $offset),
            'pagination' => ['limit' => min(max(1, $limit), 50), 'offset' => max(0, $offset)],
        ];
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

    public function destroy(string $userRole, int $listingId, int $hostId): array
    {
        if (!RoleMiddleware::isAuthorized($userRole, 'PUT /api/v1/listings')) {
            return ['status_code' => 403, 'error' => 'Forbidden: Only HOST role can soft-delete listings.'];
        }

        $deleted = $this->listingService->softDelete($listingId, $hostId);
        return $deleted
            ? ['status_code' => 200, 'status' => 'SOFT_DELETED']
            : ['status_code' => 404, 'error' => 'Listing not found or unauthorized host.'];
    }
}
