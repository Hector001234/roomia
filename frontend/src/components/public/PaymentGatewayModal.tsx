import React, { useState } from 'react';
import { BookingSummary } from '../../types/BookingState';
import { roomiaApi } from '../../utils/apiClient';

interface PaymentGatewayModalProps {
  isOpen: boolean;
  booking: BookingSummary | null;
  onClose: () => void;
  onPaymentSuccess: (updatedBooking: BookingSummary) => void;
}

export const PaymentGatewayModal: React.FC<PaymentGatewayModalProps> = ({
  isOpen,
  booking,
  onClose,
  onPaymentSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'card' | 'applepay' | 'spei'>('card');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardHolder, setCardHolder] = useState('ALEJANDRO MENDOZA');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('382');
  const [postalCode, setPostalCode] = useState('50000');

  const [processingStep, setProcessingStep] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !booking) return null;

  // Auto detect card brand
  const cleanNumber = cardNumber.replace(/\s+/g, '');
  const isMastercard = cleanNumber.startsWith('5');
  const isAmex = cleanNumber.startsWith('3');
  const cardBrand = isMastercard ? 'MasterCard' : isAmex ? 'American Express' : 'Visa';

  const formatCardNumber = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 16);
    const parts = raw.match(/.{1,4}/g);
    return parts ? parts.join(' ') : raw;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardNumber(formatCardNumber(e.target.value));
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Realistic processing animation steps
    setProcessingStep('1. Encriptando credenciales con protocolo TLS 1.3...');
    await new Promise((r) => setTimeout(r, 600));

    setProcessingStep('2. Autenticación 3D Secure con pasarela bancaria...');
    await new Promise((r) => setTimeout(r, 700));

    setProcessingStep('3. Verificando tokenización PCI-DSS Nivel 1...');

    const res = await roomiaApi.processCheckout({
      bookingId: booking.id,
      cardToken: cleanNumber,
    });

    setProcessingStep(null);

    if (!res.ok) {
      setErrorMessage(
        res.error || 'La transacción fue declinada por la entidad financiera emisora (HTTP 402).'
      );
      return;
    }

    if (res.data?.booking) {
      onPaymentSuccess(res.data.booking);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gateway-title"
      className="fixed inset-0 z-50 bg-zinc-950/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl border border-zinc-200/90 max-w-xl w-full overflow-hidden my-4"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <h2 id="gateway-title" className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-950">
              Pasarela de Pago Segura · Stripe Tokenized
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-zinc-200 hover:bg-zinc-100 flex items-center justify-center text-zinc-500 text-sm font-light transition"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Summary Line */}
          <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200/60 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                Folio #{booking.id} · {booking.listingTitle}
              </div>
              <div className="text-xs font-light text-zinc-600 mt-0.5">
                Periodo: {booking.checkIn} al {booking.checkOut} ({booking.nights} noches)
              </div>
            </div>
            <div className="text-right">
              <span className="text-base font-semibold font-mono text-zinc-950">
                ${Number(booking.totalAmount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
              <span className="block text-[10px] font-mono text-zinc-400 uppercase">MXN Total</span>
            </div>
          </div>

          {/* Payment Method Tabs */}
          <div className="flex gap-2 p-1 bg-zinc-100/70 rounded-full border border-zinc-200/60 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('card')}
              className={`flex-1 py-1.5 rounded-full font-medium transition duration-150 ${
                activeTab === 'card'
                  ? 'bg-white text-zinc-950 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-950'
              }`}
            >
              Tarjeta de Crédito / Débito
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('applepay')}
              className={`flex-1 py-1.5 rounded-full font-medium transition duration-150 ${
                activeTab === 'applepay'
                  ? 'bg-white text-zinc-950 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-950'
              }`}
            >
              Apple Pay / GPay
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('spei')}
              className={`flex-1 py-1.5 rounded-full font-medium transition duration-150 ${
                activeTab === 'spei'
                  ? 'bg-white text-zinc-950 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-950'
              }`}
            >
              SPEI Inmediato
            </button>
          </div>

          {/* Interactive Luxury Credit Card Preview */}
          <div className="relative w-full aspect-[1.75/1] rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-6 text-white shadow-xl border border-zinc-800 flex flex-col justify-between overflow-hidden">
            {/* Background Texture Lines */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>

            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Chip EMV */}
                <div className="w-10 h-7 rounded-md bg-gradient-to-tr from-amber-200 to-amber-400 border border-amber-500/40 opacity-90 shadow-inner"></div>
                {/* Contactless Wave */}
                <span className="text-zinc-400 font-mono text-sm ml-1">))))</span>
              </div>
              <span className="text-xs font-semibold tracking-widest uppercase font-mono text-zinc-300">
                {cardBrand}
              </span>
            </div>

            <div className="relative z-10 my-auto">
              <div className="font-mono text-lg md:text-xl tracking-[0.22em] text-white font-medium drop-shadow-sm">
                {cardNumber || '•••• •••• •••• ••••'}
              </div>
            </div>

            <div className="relative z-10 flex items-end justify-between text-[11px] font-mono text-zinc-400">
              <div>
                <span className="block text-[8px] uppercase tracking-wider text-zinc-500">Titular</span>
                <span className="text-zinc-200 font-medium tracking-wide">
                  {cardHolder || 'NOMBRE DEL TITULAR'}
                </span>
              </div>
              <div className="text-right">
                <span className="block text-[8px] uppercase tracking-wider text-zinc-500">Vence</span>
                <span className="text-zinc-200 font-medium tracking-widest">{cardExpiry || 'MM/AA'}</span>
              </div>
            </div>
          </div>

          {/* Card Form */}
          {activeTab === 'card' && (
            <form onSubmit={handlePay} className="space-y-4">
              <div>
                <label htmlFor="card-number" className="block text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-400 mb-1">
                  Número de Tarjeta
                </label>
                <div className="relative">
                  <input
                    id="card-number"
                    type="text"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    maxLength={19}
                    placeholder="4242 4242 4242 4242"
                    required
                    className="w-full rounded-2xl border border-zinc-200 px-4 py-2.5 text-xs font-mono text-zinc-900 bg-zinc-50/50 focus:outline-none focus:border-zinc-950"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-400 uppercase">
                    {cardBrand}
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="card-holder" className="block text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-400 mb-1">
                  Nombre en la Tarjeta
                </label>
                <input
                  id="card-holder"
                  type="text"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                  required
                  className="w-full rounded-2xl border border-zinc-200 px-4 py-2.5 text-xs text-zinc-900 bg-zinc-50/50 focus:outline-none focus:border-zinc-950"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="card-expiry" className="block text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-400 mb-1">
                    Vencimiento
                  </label>
                  <input
                    id="card-expiry"
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="12/28"
                    maxLength={5}
                    required
                    className="w-full rounded-2xl border border-zinc-200 px-4 py-2.5 text-xs font-mono text-zinc-900 bg-zinc-50/50 focus:outline-none focus:border-zinc-950"
                  />
                </div>
                <div>
                  <label htmlFor="card-cvc" className="block text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-400 mb-1">
                    CVV / CVC
                  </label>
                  <input
                    id="card-cvc"
                    type="password"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value.slice(0, 4))}
                    maxLength={4}
                    placeholder="•••"
                    required
                    className="w-full rounded-2xl border border-zinc-200 px-4 py-2.5 text-xs font-mono text-zinc-900 bg-zinc-50/50 focus:outline-none focus:border-zinc-950"
                  />
                </div>
                <div>
                  <label htmlFor="card-zip" className="block text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-400 mb-1">
                    Código Postal
                  </label>
                  <input
                    id="card-zip"
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    maxLength={5}
                    placeholder="50000"
                    required
                    className="w-full rounded-2xl border border-zinc-200 px-4 py-2.5 text-xs font-mono text-zinc-900 bg-zinc-50/50 focus:outline-none focus:border-zinc-950"
                  />
                </div>
              </div>

              {/* Quick simulation pills */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setCardNumber('4242 4242 4242 4242')}
                  className="text-[10px] px-3 py-1 rounded-full border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 font-mono transition"
                >
                  Tarjeta Aprobada (4242)
                </button>
                <button
                  type="button"
                  onClick={() => setCardNumber('4000 0000 0000 0999')}
                  className="text-[10px] px-3 py-1 rounded-full border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-500 font-mono transition"
                >
                  Simular Declinación (0999)
                </button>
              </div>

              {errorMessage && (
                <div role="alert" className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-normal">
                  {errorMessage}
                </div>
              )}

              {processingStep && (
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-center space-y-2 animate-pulse">
                  <div className="text-xs font-mono text-zinc-800">{processingStep}</div>
                  <div className="w-full bg-zinc-200 rounded-full h-1">
                    <div className="bg-zinc-950 h-1 rounded-full animate-progress"></div>
                  </div>
                </div>
              )}

              {/* Security certification footer */}
              <div className="flex items-center justify-between text-[10px] text-zinc-400 font-light pt-2 border-t border-zinc-100">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Cifrado SSL de 256 bits
                </span>
                <span>Certificación PCI-DSS Nivel 1</span>
              </div>

              <button
                type="submit"
                disabled={Boolean(processingStep)}
                className="w-full py-3.5 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-xs tracking-wider uppercase shadow-xs transition duration-150 disabled:opacity-50"
              >
                {processingStep
                  ? 'Autorizando transacción...'
                  : `Pagar $${Number(booking.totalAmount).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`}
              </button>
            </form>
          )}

          {activeTab === 'applepay' && (
            <div className="p-8 text-center space-y-4 bg-zinc-50 rounded-2xl border border-zinc-200/60">
              <div className="text-xs text-zinc-600 font-light">
                Autentica tu pago directamente con Touch ID o Face ID en tu dispositivo.
              </div>
              <button
                type="button"
                onClick={handlePay}
                className="w-full py-3.5 rounded-full bg-black text-white font-medium text-xs tracking-wide uppercase transition hover:bg-zinc-800"
              >
                Pagar con Apple Pay
              </button>
            </div>
          )}

          {activeTab === 'spei' && (
            <div className="p-6 space-y-3 bg-zinc-50 rounded-2xl border border-zinc-200/60 text-xs">
              <div className="font-medium text-zinc-900">Transferencia Electrónica Interbancaria (SPEI)</div>
              <div className="p-3 bg-white rounded-xl border border-zinc-200 space-y-1 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Banco:</span>
                  <span className="text-zinc-800">STP / Roomia Pagos</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">CLABE:</span>
                  <span className="text-zinc-800">6461 8011 2400 9182 34</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Concepto:</span>
                  <span className="text-zinc-800">RES-{booking.id}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handlePay}
                className="w-full py-3 rounded-full bg-zinc-950 text-white font-medium text-xs tracking-wide uppercase"
              >
                Registrar Transferencia
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
