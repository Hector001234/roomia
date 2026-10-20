<?php

declare(strict_types=1);

namespace App\Services;

use App\Repositories\AuditRepository;

/**
 * Module M05 & CPF-05: Mutual reviews conditioned strictly on a COMPLETED stay.
 */
final class ReviewService
{
    private array $completedStays = [];
    private array $reviews = [];

    public function __construct(private readonly AuditRepository $auditRepository)
    {
    }

    public function registerCompletedStay(int $guestId, int $listingId, int $bookingId): void
    {
        $this->completedStays["{$guestId}:{$listingId}"] = $bookingId;
    }

    public function submitReview(int $guestId, int $listingId, int $rating, string $comment, string $clientIp = '192.168.1.104'): array
    {
        $key = "{$guestId}:{$listingId}";
        if (!isset($this->completedStays[$key])) {
            $this->auditRepository->appendLog(
                $guestId,
                'UNAUTHORIZED_REVIEW_ATTEMPT',
                'reviews',
                "{$listingId}",
                $clientIp,
                null,
                ['reason' => 'Unverified stay (CPF-05)', 'guest_id' => $guestId, 'listing_id' => $listingId]
            );
            return [
                'status_code' => 403,
                'error' => 'Estancia no verificada: Only guests with a COMPLETED booking can review this property.',
            ];
        }

        if ($rating < 1 || $rating > 5) {
            return ['status_code' => 422, 'error' => 'Rating must be between 1 and 5 stars.'];
        }

        $review = [
            'id' => count($this->reviews) + 1,
            'booking_id' => $this->completedStays[$key],
            'listing_id' => $listingId,
            'guest_id' => $guestId,
            'rating' => $rating,
            'comment' => htmlspecialchars($comment, ENT_QUOTES, 'UTF-8'),
        ];
        $this->reviews[] = $review;
        return ['status_code' => 201, 'review' => $review];
    }
}
