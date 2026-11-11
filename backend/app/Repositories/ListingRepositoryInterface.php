<?php

declare(strict_types=1);

namespace App\Repositories;

/**
 * Section 14.1, Pillar 3 (Bounded Pagination) & Pillar 5 (Soft Delete) Compliance.
 */
interface ListingRepositoryInterface
{
    public function saveListing(array $listingData, array $photos): array;

    public function findById(int $listingId): ?array;

    public function findActiveListings(int $limit = 20, int $offset = 0): array;

    public function softDeleteById(int $listingId, int $hostId): bool;
}
