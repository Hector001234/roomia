<?php

declare(strict_types=1);

namespace App\Repositories;

/**
 * Section 14.1 Compliance: ListingRepositoryInterface in PascalCase.
 */
interface ListingRepositoryInterface
{
    public function saveListing(array $listingData, array $photos): array;

    public function findById(int $listingId): ?array;

    public function findActiveListings(): array;
}
