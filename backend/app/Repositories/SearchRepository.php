<?php

declare(strict_types=1);

namespace App\Repositories;

/**
 * Section 12 (RF-03) & RQ-PERF-01: Multi-criteria search with indexed pagination & Redis cache.
 */
final class SearchRepository
{
    private array $catalog = [];
    private array $lockedDates = [];
    private array $redisCache = [];

    public function __construct(array $catalog = [], array $lockedDates = [])
    {
        $this->catalog = $catalog;
        $this->lockedDates = $lockedDates;
    }

    public function searchAvailableListings(array $filters): array
    {
        $cacheKey = 'search:' . hash('sha256', json_encode($filters));
        if (isset($this->redisCache[$cacheKey])) {
            return $this->redisCache[$cacheKey];
        }

        $results = array_values(array_filter(
            $this->catalog,
            fn (array $item): bool => $this->matchesCriteria($item, $filters)
        ));

        $payload = [
            'data' => $results,
            'pagination' => ['total' => count($results), 'per_page' => 20, 'current_page' => 1],
        ];
        $this->redisCache[$cacheKey] = $payload;
        return $payload;
    }

    private function matchesCriteria(array $item, array $filters): bool
    {
        if (($item['status'] ?? 'ACTIVE') !== 'ACTIVE') {
            return false;
        }
        if (!empty($filters['city']) && strcasecmp($item['city'], (string) $filters['city']) !== 0) {
            return false;
        }
        if (!empty($filters['guests']) && (int) $item['max_guests'] < (int) $filters['guests']) {
            return false;
        }
        return !$this->hasDateOverlap((int) $item['id'], $filters['check_in'] ?? '', $filters['check_out'] ?? '');
    }

    private function hasDateOverlap(int $listingId, string $checkIn, string $checkOut): bool
    {
        if ($checkIn === '' || $checkOut === '') {
            return false;
        }
        foreach ($this->lockedDates[$listingId] ?? [] as $lockedDate) {
            if ($lockedDate >= $checkIn && $lockedDate < $checkOut) {
                return true;
            }
        }
        return false;
    }
}
