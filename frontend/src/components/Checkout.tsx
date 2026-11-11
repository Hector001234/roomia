import React, { useState } from 'react';
import { BookingSummary } from '../types/BookingState';
import { roomiaApi } from '../utils/apiClient';

interface CheckoutProps {
  activeBooking: BookingSummary | null;
  onBookingUpdated: (booking: BookingSummary) => void;
}

export const Checkout: React.FC<CheckoutProps> = ({ activeBooking, onBookingUpdated }) => {
  const [cardInput, setCardInput] = useState('4242 4242 4242 4242');
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const summary: BookingSummary = activeBooking || {
    id: 1,
    uuid: '50100000-0000-4000-8000-000000000501',
    listingId: 42,
    listingTitle: 'Modern Mountain Loft in Toluca',
    listingPhoto: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
    listingCity: 'Toluca',
    guestId: 104,
    guestName: 'Alejandro Mendoza',
    checkIn: '2026-11-20',
    checkOut: '2026-11-23',
    nights: 3,
    guestsCount: 2,
    subtotal: '4500.00',
    serviceFee: '540.00',
    taxAmount: '720.00',
    totalAmount: '5760.00',
    status: 'PENDING',
    integritySha256: '8f2d7c9e1a3b5d7f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f',
    createdAt: '2026-11-05T18:00:00.000Z',
    deletedAt: null,
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPaymentMessage(null);

    let targetBookingId = summary.id;
    if (!activeBooking) {
      const created = await roomiaApi.createBooking({
        listingId: summary.listingId,
        guestId: 104,
        checkIn: summary.checkIn,
        checkOut: summary.checkOut,
        guestsCount: summary.guestsCount,
      });
      if (created.ok && created.data) {
        targetBookingId = created.data.booking.id;
        onBookingUpdated(created.data.booking);
      } else if (created.statusCode === 409) {
        setLoading(false);
        setIsError(true);
        setPaymentMessage(created.error || 'Conflicto HTTP 409: Fechas ya bloqueadas.');
        return;
      }
    }

    const res = await roomiaApi.processCheckout({
      bookingId: targetBookingId || 1,
      cardToken: cardInput,
    });

    setLoading(false);
    if (!res.ok) {
      setIsError(true);
      setPaymentMessage(
        res.error || 'HTTP 402 Payment Required: Fondos insuficientes. Fechas liberadas.'
      );
      if (res.data?.booking) {
        onBookingUpdated(res.data.booking);
      }
      return;
    }

    setIsError(false);
    if (res.data?.booking) {
      onBookingUpdated(res.data.booking);
    }
    setPaymentMessage(
      res.data?.message ||
        'HTTP 200 OK: Pago confirmado vía Stripe Webhook HMAC-SHA256. Reserva en estado CONFIRMED.'
    );
  };

  const handleMarkCompleted = async () => {
    if (!summary.id) return;
    setLoading(true);
    const res = await roomiaApi.completeBookingStay(summary.id);
    setLoading(false);
    if (res.ok && res.data?.booking) {
      onBookingUpdated(res.data.booking);
      setIsError(false);
      setPaymentMessage(res.data.message || 'Estancia marcada como COMPLETED.');
    }
  };

  return (
    <section
      aria-label="Booking Checkout and Payment"
      className="bg-white p-6 rounded-xl shadow-md border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="text-lg font-bold text-slate-900">
            Desglose Financiero Exacto — NUMERIC(10,2) (M04)
          </h2>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              summary.status === 'CONFIRMED' || summary.status === 'COMPLETED'
                ? 'bg-emerald-100 text-emerald-800'
                : summary.status === 'CANCELLED'
                ? 'bg-rose-100 text-rose-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            Estado: {summary.status}
          </span>
        </div>
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Alojamiento:</span>
            <span className="font-semibold text-slate-900">{summary.listingTitle}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Periodo Bloqueado:</span>
            <span className="font-mono text-xs text-slate-800">
              {summary.checkIn} → {summary.checkOut} ({summary.nights} noches)
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Subtotal ({summary.nights} noches):</span>
            <span className="font-medium">${summary.subtotal} MXN</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Comisión de Servicio (12%):</span>
            <span className="font-medium">${summary.serviceFee} MXN</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Impuestos IVA (16%):</span>
            <span className="font-medium">${summary.taxAmount} MXN</span>
          </div>
          <div className="pt-2 border-t border-slate-200 flex justify-between text-base font-extrabold text-slate-900">
            <span>Total Transaccional:</span>
            <span className="text-blue-700">${summary.totalAmount} MXN</span>
          </div>
          <div className="pt-2 text-[11px] font-mono text-slate-500 break-all">
            SHA-256 Row Hash: {summary.integritySha256}
          </div>
        </div>
      </div>

      <form onSubmit={handlePay} className="flex flex-col justify-between space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            Pasarela Tokenizada Stripe (PCI-DSS 4.0)
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            Usa <code className="bg-slate-100 px-1 rounded">4242 4242 4242 4242</code> para aprobar o{' '}
            <code className="bg-rose-50 text-rose-700 px-1 rounded">4000 0000 0000 0999</code> para simular
            rechazo <strong>CPF-02 (HTTP 402 + Liberación de Fechas)</strong>.
          </p>

          <label htmlFor="stripe-card-token" className="block text-xs font-bold text-slate-700 mb-1">
            Token / Tarjeta de Prueba (Sin persistencia de PAN/CVV en BD)
          </label>
          <input
            id="stripe-card-token"
            type="text"
            value={cardInput}
            onChange={(e) => setCardInput(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />

          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => setCardInput('4242 4242 4242 4242')}
              className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded font-semibold"
            >
              Usar Tarjeta Aprobada (4242)
            </button>
            <button
              type="button"
              onClick={() => setCardInput('4000 0000 0000 0999')}
              className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 px-2.5 py-1 rounded font-semibold"
            >
              Simular Tarjeta Rechazada (0999)
            </button>
          </div>
        </div>

        {paymentMessage && (
          <div
            role="alert"
            className={`p-3 rounded-lg text-xs font-semibold border ${
              isError
                ? 'bg-rose-50 text-rose-900 border-rose-300'
                : 'bg-emerald-50 text-emerald-900 border-emerald-300'
            }`}
          >
            {paymentMessage}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={loading}
            aria-label="Ejecutar cobro tokenizado con Stripe"
            className="flex-1 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-semibold text-sm py-2.5 px-4 rounded-lg shadow transition focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            {loading ? 'Procesando...' : 'Procesar Pago Tokenizado'}
          </button>

          {summary.status === 'CONFIRMED' && summary.id && (
            <button
              type="button"
              onClick={handleMarkCompleted}
              className="bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs py-2.5 px-3 rounded-lg shadow transition"
            >
              Finalizar Estancia (COMPLETED)
            </button>
          )}
        </div>
      </form>
    </section>
  );
};
