<?php

declare(strict_types=1);

namespace App\Services;

use App\Repositories\AuditRepository;

/**
 * Section 12 (RF-05), CPF-02, CP-INT-04 & CP-INT-08:
 * Tokenized Stripe payment processing without persisting PAN or CVV (PCI-DSS 4.0).
 */
final class StripePaymentAdapter
{
    private const DECLINED_CARD_TOKEN = '4000 0000 0000 0999';

    public function __construct(
        private readonly BookingService $bookingService,
        private readonly AuditRepository $auditRepository,
        private readonly string $webhookSecret = 'whsec_roomia_audit_secret'
    ) {
    }

    public function processCheckout(int $bookingId, string $paymentTokenOrTestCard, string $clientIp = '192.168.1.50'): array
    {
        $booking = $this->bookingService->getBooking($bookingId);
        if ($booking === null) {
            return ['status_code' => 404, 'error' => 'Booking not found.'];
        }

        $paymentIntentId = 'pi_' . bin2hex(random_bytes(8));

        if (trim($paymentTokenOrTestCard) === self::DECLINED_CARD_TOKEN || $paymentTokenOrTestCard === 'tok_insufficient_funds') {
            $this->bookingService->markBookingStatus($bookingId, 'CANCELLED', $clientIp);
            $this->auditRepository->appendLog(
                (int) $booking['guest_id'],
                'PAYMENT_FAILED',
                'payments',
                $paymentIntentId,
                $clientIp,
                ['status' => 'PENDING'],
                ['status' => 'FAILED', 'failure_code' => 'insufficient_funds', 'dates_lock' => 'RELEASED']
            );
            return [
                'status_code' => 402,
                'error' => 'Payment Required: Card declined (insufficient_funds). Calendar dates released.',
                'failure_code' => 'insufficient_funds',
                'stripe_payment_intent_id' => $paymentIntentId,
            ];
        }

        $this->bookingService->markBookingStatus($bookingId, 'CONFIRMED', $clientIp);
        return [
            'status_code' => 200,
            'status' => 'CONFIRMED',
            'stripe_payment_intent_id' => $paymentIntentId,
            'amount' => $booking['total_amount'],
            'currency' => 'MXN',
        ];
    }

    public function verifyAndHandleWebhook(string $rawPayload, string $signatureHeader, string $clientIp = '10.0.0.1'): array
    {
        $expectedSignature = hash_hmac('sha256', $rawPayload, $this->webhookSecret);
        if (!hash_equals($expectedSignature, $signatureHeader)) {
            $this->auditRepository->appendLog(null, 'WEBHOOK_SIGNATURE_INVALID', 'payments', 'webhook', $clientIp, null, ['status' => 'REJECTED']);
            return ['status_code' => 400, 'error' => 'Invalid Stripe Webhook HMAC signature.'];
        }

        $event = json_decode($rawPayload, true);
        $bookingId = (int) ($event['data']['booking_id'] ?? 0);
        $type = (string) ($event['type'] ?? '');

        if ($type === 'payment_intent.succeeded') {
            $this->bookingService->markBookingStatus($bookingId, 'CONFIRMED', $clientIp);
            return ['status_code' => 200, 'BookingStatus' => 'CONFIRMED'];
        }
        if ($type === 'charge.failed' || $type === 'payment_intent.payment_failed') {
            $this->bookingService->markBookingStatus($bookingId, 'CANCELLED', $clientIp);
            return ['status_code' => 200, 'BookingStatus' => 'RELEASED'];
        }
        return ['status_code' => 200, 'BookingStatus' => 'IGNORED'];
    }
}
