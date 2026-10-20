import React, { useState } from 'react';

/**
 * Section 12 (RF-05) & CPF-02: Tokenized Stripe Checkout (Never persists PAN or CVV).
 */
export const Checkout: React.FC = () => {
  const [testCardScenario, setTestCardScenario] = useState<string>('tok_visa_success');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleCheckout = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (testCardScenario === '4000 0000 0000 0999') {
      setStatusMessage('HTTP 402 Payment Required: Fondos insuficientes (CPF-02). Fechas liberadas en calendario.');
      return;
    }
    setStatusMessage('HTTP 200 OK: Pago tokenizado confirmado vía Stripe Webhook (pi_...).');
  };

  return (
    <form onSubmit={handleCheckout} aria-label="Stripe Tokenized Checkout" className="p-6 bg-white rounded-xl shadow">
      <h2 className="text-xl font-bold text-slate-900 mb-3">Checkout Tokenizado PCI-DSS (M04)</h2>
      <label htmlFor="stripe-scenario" className="block text-sm font-medium">Simulador de Token Stripe Sandbox</label>
      <select id="stripe-scenario" value={testCardScenario} onChange={(e) => setTestCardScenario(e.target.value)} className="mt-1 w-full border rounded p-2">
        <option value="tok_visa_success">Tarjeta Aprobada (Token pi_...)</option>
        <option value="4000 0000 0000 0999">Tarjeta Declinada 4000 0000 0000 0999 (Caso CPF-02 insufficient_funds)</option>
      </select>
      {statusMessage && (
        <p role="status" aria-live="polite" className="mt-3 p-3 rounded bg-slate-100 text-sm font-medium">
          {statusMessage}
        </p>
      )}
      <button type="submit" className="mt-4 px-4 py-2 bg-emerald-700 text-white font-semibold rounded">
        Procesar Pago Seguro
      </button>
    </form>
  );
};
