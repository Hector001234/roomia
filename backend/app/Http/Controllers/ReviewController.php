<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\ReviewService;

final class ReviewController
{
    public function __construct(private readonly ReviewService $reviewService)
    {
    }

    public function store(int $guestId, int $listingId, int $rating, string $comment, string $clientIp = '192.168.1.104'): array
    {
        return $this->reviewService->submitReview($guestId, $listingId, $rating, $comment, $clientIp);
    }
}
