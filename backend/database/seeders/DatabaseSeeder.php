<?php

declare(strict_types=1);

namespace Database\Seeders;

/**
 * Section 20 & CAL-019 Compliance: 100% synthetic, anonymized dataset for Staging/Dev.
 */
final class DatabaseSeeder
{
    public function getSyntheticSeedData(): array
    {
        return [
            'users' => [
                ['id' => 1, 'name' => 'Synthetic Host One', 'email' => 'host1@roomia.synthetic.test', 'role' => 'HOST'],
                ['id' => 104, 'name' => 'Synthetic Guest One', 'email' => 'guest104@roomia.synthetic.test', 'role' => 'GUEST'],
                ['id' => 999, 'name' => 'System Auditor', 'email' => 'auditor@roomia.synthetic.test', 'role' => 'ADMIN'],
            ],
            'listings' => [
                [
                    'id' => 42,
                    'host_id' => 1,
                    'title' => 'Modern Mountain Loft in Toluca',
                    'city' => 'Toluca',
                    'latitude' => '19.2826000',
                    'longitude' => '-99.6557000',
                    'price_per_night' => '1450.00',
                    'max_guests' => 4,
                    'status' => 'ACTIVE',
                ],
            ],
        ];
    }
}
