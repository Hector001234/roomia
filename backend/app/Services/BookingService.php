<?php

declare(strict_types=1);

namespace App\Services;

use App\Repositories\AuditRepository;
use DateTimeImmutable;

/**
 * Section 12 (RF-04) & RQ-FUNC-01: Atomic reservation creation with HTTP 409 on conflict.
 */
final class BookingService
{
    private array $bookings = [];

    public function __construct(
        private readonly BookingTransactionService $transactionService,
        private readonly AuditRepository $auditRepository
    ) {
    }

    public function createBooking(array $requestData, string $clientIp = '192.168.1.50'): array
    {
        $listingId = (int) $requestData['listing_id'];
        $guestId = (int) $requestData['guest_id'];
        $checkIn = (string) $requestData['check_in'];
        $checkOut = (string) $requestData['check_out'];
        $nightlyRate = (string) $requestData['nightly_rate'];
        $bookingId = count($this->bookings) + 1;

        if (!$this->transactionService->acquirePessimisticLock($listingId, $bookingId, $checkIn, $checkOut)) {
            return [
                'status_code' => 409,
                'error' => 'Conflict: Selected dates are already locked by another reservation (RQ-FUNC-01).',
            ];
        }

        $nights = (int) (new DateTimeImmutable($checkIn))->diff(new DateTimeImmutable($checkOut))->days;
        $amounts = $this->transactionService->calculateTotalAmount($nightlyRate, max(1, $nights));
        $uuid = $this->generateUuidV4();

        $booking = array_merge($amounts, [
            'id' => $bookingId,
            'uuid' => $uuid,
            'listing_id' => $listingId,
            'guest_id' => $guestId,
            'check_in' => $checkIn,
            'check_out' => $checkOut,
            'status' => 'PENDING',
            'integrity_sha256' => hash('sha256', "{$uuid}|{$listingId}|{$guestId}|{$amounts['total_amount']}"),
        ]);

        $this->bookings[$bookingId] = $booking;
        $this->auditRepository->appendLog($guestId, 'BOOKING_CREATED', 'bookings', (string) $bookingId, $clientIp, null, $booking);

        return ['status_code' => 201, 'booking' => $booking];
    }

    public function markBookingStatus(int $bookingId, string $newStatus, string $clientIp = '192.168.1.50'): ?array
    {
        if (!isset($this->bookings[$bookingId])) {
            return null;
        }
        $prev = $this->bookings[$bookingId];
        $this->bookings[$bookingId]['status'] = $newStatus;
        if ($newStatus === 'CANCELLED') {
            $this->transactionService->releaseDates($prev['listing_id'], $prev['check_in'], $prev['check_out']);
        }
        $this->auditRepository->appendLog($prev['guest_id'], "BOOKING_{$newStatus}", 'bookings', (string) $bookingId, $clientIp, $prev, $this->bookings[$bookingId]);
        return $this->bookings[$bookingId];
    }

    public function getBooking(int $bookingId): ?array
    {
        return $this->bookings[$bookingId] ?? null;
    }

    private function generateUuidV4(): string
    {
        $bytes = random_bytes(16);
        $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
        $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($bytes), 4));
    }
}
