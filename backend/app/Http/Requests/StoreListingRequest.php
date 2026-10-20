<?php

declare(strict_types=1);

namespace App\Http\Requests;

/**
 * RQ-DAT-01 & CP-CAT-01: Validates geographic coordinates, positive rate, and max photos.
 */
final class StoreListingRequest
{
    public static function validate(array $input, array $photos): array
    {
        $errors = [];
        $lat = (float) ($input['latitude'] ?? 999);
        $lng = (float) ($input['longitude'] ?? 999);
        $price = (float) ($input['price_per_night'] ?? 0);

        if ($lat < -90.0 || $lat > 90.0) {
            $errors['latitude'] = 'Latitude must be between -90 and 90 degrees.';
        }
        if ($lng < -180.0 || $lng > 180.0) {
            $errors['longitude'] = 'Longitude must be between -180 and 180 degrees.';
        }
        if ($price <= 0) {
            $errors['price_per_night'] = 'Nightly rate must be a positive decimal amount.';
        }
        if (count($photos) < 1 || count($photos) > 15) {
            $errors['photos'] = 'Between 1 and 15 photos are required (CPF-03).';
        }

        return [
            'valid' => empty($errors),
            'status_code' => empty($errors) ? 200 : 422,
            'errors' => $errors,
        ];
    }
}
