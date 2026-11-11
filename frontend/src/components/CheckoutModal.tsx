import React, { useEffect, useRef } from 'react';
import { BookingSummary } from '../types/BookingState';

interface CheckoutModalProps {
  isOpen: boolean;
  summary: BookingSummary;
  onConfirmPayment: () => void;
  onClose: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  summary,
  onConfirmPayment,
  onClose,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const focusableSelector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const firstFocusable = modalRef.current?.querySelector<HTMLElement>(focusableSelector);
    firstFocusable?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === 'Tab' && modalRef.current) {
        const focusables = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(focusableSelector)
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-modal-title"
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4"
      >
        <h2 id="checkout-modal-title" className="text-lg font-extrabold text-slate-900">
          Confirmación de Desglose Financiero (M04)
        </h2>
        <div className="space-y-1 text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <p>Alojamiento: <strong>{summary.listingTitle}</strong></p>
          <p>Fechas: {summary.checkIn} a {summary.checkOut} ({summary.nights} noches)</p>
          <p>Subtotal: ${summary.subtotal} MXN</p>
          <p>Tarifa de Servicio (12%): ${summary.serviceFee} MXN</p>
          <p>Impuestos IVA (16%): ${summary.taxAmount} MXN</p>
          <p className="text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
            Total a Pagar: ${summary.totalAmount} MXN
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana de pago"
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmPayment}
            aria-label="Confirmar pago con Stripe Elements"
            className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold"
          >
            Pagar con Stripe (PCI-DSS)
          </button>
        </div>
      </div>
    </div>
  );
};
