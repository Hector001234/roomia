import { useState, useCallback } from 'react';

export interface PaymentIntentResult {
  statusCode: number;
  paymentIntentId: string | null;
  errorMessage: string | null;
}

/**
 * Section 14.1 & RF-05 Compliance: Manages tokenized Stripe payment intents without storing PAN/CVV.
 */
export function usePaymentIntent() {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const confirmTokenizedPayment = useCallback(async (bookingId: number, stripeToken: string): Promise<PaymentIntentResult> => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/v1/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId, payment_token: stripeToken }),
      });
      const data = (await response.json()) as { stripe_payment_intent_id?: string; error?: string };
      return {
        statusCode: response.status,
        paymentIntentId: data.stripe_payment_intent_id ?? null,
        errorMessage: data.error ?? null,
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return { isProcessing, confirmTokenizedPayment };
}
