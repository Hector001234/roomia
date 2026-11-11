<?php

declare(strict_types=1);

namespace App\Repositories;

/**
 * Pillar 3 (Bounded Pagination <= 50) & Pillar 5 (Logical Soft Delete deleted_at) Compliance.
 */
final class ListingRepository implements ListingRepositoryInterface
{
    private const MAX_PAGE_SIZE = 50;
    private array $listings = [];

    public function saveListing(array $listingData, array $photos): array
    {
        $id = count($this->listings) + 1;
        $record = array_merge($listingData, [
            'id' => $id,
            'photos' => $photos,
            'status' => 'ACTIVE',
            'deleted_at' => null,
        ]);
        $this->listings[$id] = $record;
        return $record;
    }

    public function findById(int $listingId): ?array
    {
        $item = $this->listings[$listingId] ?? null;
        if ($item === null || $item['deleted_at'] !== null) {
            return null;
        }
        return $item;
    }

    public function findActiveListings(int $limit = 20, int $offset = 0): array
    {
        $safeLimit = max(1, min($limit, self::MAX_PAGE_SIZE));
        $safeOffset = max(0, $offset);
        $active = array_values(array_filter(
            $this->listings,
            static fn (array $item): bool => $item['deleted_at'] === null && $item['status'] === 'ACTIVE'
        ));
        return array_slice($active, $safeOffset, $safeLimit);
    }

    public function softDeleteById(int $listingId, int $hostId): bool
    {
        if (!isset($this->listings[$listingId]) || $this->listings[$listingId]['deleted_at'] !== null) {
            return false;
        }
        if ((int) $this->listings[$listingId]['host_id'] !== $hostId) {
            return false;
        }
        $this->listings[$listingId]['deleted_at'] = gmdate('Y-m-d\TH:i:s.v\Z');
        $this->listings[$listingId]['status'] = 'INACTIVE';
        return true;
    }
}
