<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\StripePaymentAdapter;

final class WebhookController
{
    public function __construct(private readonly StripePaymentAdapter $paymentAdapter)
    {
    }

    public function handleStripeWebhook(string $rawPayload, string $signatureHeader, string $clientIp = '10.0.0.1'): array
    {
        return $this->paymentAdapter->verifyAndHandleWebhook($rawPayload, $signatureHeader, $clientIp);
    }
}
