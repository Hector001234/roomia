<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Http\Controllers\ListingController;
use App\Http\Controllers\SearchController;
use App\Repositories\ListingRepository;
use App\Repositories\SearchRepository;
use App\Services\ListingService;

/**
 * Covers CPF-03, CPF-04, CP-CAT-01, CP-SYS-03 (M02 Catalog & M03 Multi-criteria Search).
 */
final class ListingAndSearchTest
{
    public function testOccupiedSearchReturnsEmptyDataArray(): bool
    {
        $repo = new SearchRepository(
            [['id' => 42, 'title' => 'Toluca Loft', 'city' => 'Toluca', 'max_guests' => 4, 'status' => 'ACTIVE']],
            [42 => ['2026-12-24', '2026-12-25']]
        );
        $controller = new SearchController($repo);
        $res = $controller->search(['city' => 'Toluca', 'guests' => 2, 'check_in' => '2026-12-24', 'check_out' => '2026-12-26']);
        return $res['status_code'] === 200 && $res['data'] === [];
    }
}
