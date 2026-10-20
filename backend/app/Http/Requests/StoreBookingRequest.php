<?php

declare(strict_types=1);

namespace App\Http\Requests;

final class StoreBookingRequest
{
    public static function validate(array $input): array
    {
        $errors = [];
        $checkIn = (string) ($input['check_in'] ?? '');
        $checkOut = (string) ($input['check_out'] ?? '');
        $guests = (int) ($input['guests_count'] ?? 1);

        if ($checkIn === '' || $checkOut === '' || $checkOut <= $checkIn) {
            $errors['dates'] = 'Check-out date must be strictly after check-in date.';
        }
        if ($guests < 1 || $guests > 20) {
            $errors['guests_count'] = 'Guests count must be between 1 and MAX_GUESTS_ALLOWED (20).';
        }

        return [
            'valid' => empty($errors),
            'status_code' => empty($errors) ? 200 : 422,
            'errors' => $errors,
        ];
    }
}
