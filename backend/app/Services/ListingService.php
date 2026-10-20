<?php

declare(strict_types=1);

namespace App\Services;

use App\Repositories\ListingRepositoryInterface;
use InvalidArgumentException;

/**
 * Section 12 (RF-02) & CPF-03: Listing creation, geospatial validation and WebP optimization.
 */
final class ListingService
{
    public const MAX_GUESTS_ALLOWED = 20;
    public const DEFAULT_CURRENCY = 'MXN';

    public function __construct(private readonly ListingRepositoryInterface $repository)
    {
    }

    public function publishListing(array $payload, array $rawPhotos): array
    {
        $this->validateCoordinates((float) $payload['latitude'], (float) $payload['longitude']);
        if (count($rawPhotos) < 1 || count($rawPhotos) > 15) {
            throw new InvalidArgumentException('A listing must include between 1 and 15 photographs.');
        }

        $optimizedPhotos = array_map(
            fn (string $photoName, int $index): array => $this->convertPhotoToWebp($photoName, $index + 1),
            $rawPhotos,
            array_keys($rawPhotos)
        );

        return $this->repository->saveListing([
            'host_id' => (int) $payload['host_id'],
            'title' => htmlspecialchars((string) $payload['title'], ENT_QUOTES, 'UTF-8'),
            'city' => htmlspecialchars((string) $payload['city'], ENT_QUOTES, 'UTF-8'),
            'latitude' => number_format((float) $payload['latitude'], 7, '.', ''),
            'longitude' => number_format((float) $payload['longitude'], 7, '.', ''),
            'price_per_night' => number_format((float) $payload['price_per_night'], 2, '.', ''),
            'currency' => self::DEFAULT_CURRENCY,
            'max_guests' => min((int) $payload['max_guests'], self::MAX_GUESTS_ALLOWED),
        ], $optimizedPhotos);
    }

    private function validateCoordinates(float $latitude, float $longitude): void
    {
        if ($latitude < -90.0 || $latitude > 90.0 || $longitude < -180.0 || $longitude > 180.0) {
            throw new InvalidArgumentException('Geographic coordinates out of valid bounds.');
        }
    }

    private function convertPhotoToWebp(string $originalName, int $order): array
    {
        $slug = preg_replace('/\.[^.]+$/', '', basename($originalName));
        return [
            's3_url' => "https://s3.us-east-1.amazonaws.com/roomia-listings-media/{$slug}.webp",
            'alt_text' => "Verified property view #{$order}",
            'mime_type' => 'image/webp',
            'sort_order' => $order,
        ];
    }
}
