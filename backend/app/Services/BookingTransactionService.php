<?php

declare(strict_types=1);

namespace App\Services;

use DateInterval;
use DatePeriod;
use DateTimeImmutable;

/**
 * Section 14.1 & RQ-FUNC-01: Pessimistic locking and exact decimal arithmetic.
 * Implements calculateTotalAmount() and validateDateAvailability() using $bookingId and $nightlyRate.
 */
final class BookingTransactionService
{
    public const DEFAULT_CURRENCY = 'MXN';
    private const COMMISSION_RATE = '0.12';
    private const TAX_RATE = '0.16';

    private array $lockedListingDates = [];

    public function validateDateAvailability(int $listingId, string $checkIn, string $checkOut): bool
    {
        $dates = $this->expandDateRange($checkIn, $checkOut);
        foreach ($dates as $dateStr) {
            if (($this->lockedListingDates[$listingId][$dateStr] ?? 'RELEASED') === 'LOCKED') {
                return false;
            }
        }
        return true;
    }

    public function calculateTotalAmount(string $nightlyRate, int $nights): array
    {
        $subtotal = bcmul($nightlyRate, (string) $nights, 2);
        $serviceFee = bcmul($subtotal, self::COMMISSION_RATE, 2);
        $taxAmount = bcmul($subtotal, self::TAX_RATE, 2);
        $total = bcadd(bcadd($subtotal, $serviceFee, 2), $taxAmount, 2);

        return [
            'nightly_rate' => number_format((float) $nightlyRate, 2, '.', ''),
            'subtotal_amount' => $subtotal,
            'service_fee' => $serviceFee,
            'tax_amount' => $taxAmount,
            'total_amount' => $total,
            'currency' => self::DEFAULT_CURRENCY,
        ];
    }

    public function acquirePessimisticLock(int $listingId, int $bookingId, string $checkIn, string $checkOut): bool
    {
        if (!$this->validateDateAvailability($listingId, $checkIn, $checkOut)) {
            return false;
        }
        foreach ($this->expandDateRange($checkIn, $checkOut) as $dateStr) {
            $this->lockedListingDates[$listingId][$dateStr] = 'LOCKED';
        }
        return true;
    }

    public function releaseDates(int $listingId, string $checkIn, string $checkOut): void
    {
        foreach ($this->expandDateRange($checkIn, $checkOut) as $dateStr) {
            $this->lockedListingDates[$listingId][$dateStr] = 'RELEASED';
        }
    }

    private function expandDateRange(string $checkIn, string $checkOut): array
    {
        $start = new DateTimeImmutable($checkIn);
        $end = new DateTimeImmutable($checkOut);
        $period = new DatePeriod($start, new DateInterval('P1D'), $end);
        $dates = [];
        foreach ($period as $dt) {
            $dates[] = $dt->format('Y-m-d');
        }
        return $dates;
    }
}
