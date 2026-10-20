<?php

declare(strict_types=1);

namespace App\Repositories;

final class ListingRepository implements ListingRepositoryInterface
{
    private array $listings = [];

    public function saveListing(array $listingData, array $photos): array
    {
        $id = count($this->listings) + 1;
        $record = array_merge($listingData, [
            'id' => $id,
            'photos' => $photos,
            'status' => 'ACTIVE',
        ]);
        $this->listings[$id] = $record;
        return $record;
    }

    public function findById(int $listingId): ?array
    {
        return $this->listings[$listingId] ?? null;
    }

    public function findActiveListings(): array
    {
        return array_values($this->listings);
    }
}
