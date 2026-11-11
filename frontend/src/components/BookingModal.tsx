import React, { useEffect, useRef, useState } from 'react';
import { BookingSummary, ListingItem } from '../types/BookingState';
import { roomiaApi } from '../utils/apiClient';

interface BookingModalProps {
  isOpen: boolean;
  listing: ListingItem | null;
  onClose: () => void;
  onBookingCreated: (booking: BookingSummary) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  listing,
  onClose,
  onBookingCreated,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [checkIn, setCheckIn] = useState('2026-11-20');
  const [checkOut, setCheckOut] = useState('2026-11-23');
  const [guestsCount, setGuestsCount] = useState(2);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);

    const focusableSelector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const modalEl = dialogRef.current;
    if (modalEl) {
      const firstInput = modalEl.querySelector<HTMLElement>(focusableSelector);
      firstInput?.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === 'Tab' && dialogRef.current) {
        const focusables = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector)
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

  if (!isOpen || !listing) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    const res = await roomiaApi.createBooking({
      listingId: listing.id,
      guestId: 104,
      checkIn,
      checkOut,
      guestsCount,
    });

    setSubmitting(false);
    if (!res.ok || !res.data) {
      setErrorMsg(res.error || 'Error al crear la reserva.');
      return;
    }

    onBookingCreated(res.data.booking);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
    >
      <div
        ref={dialogRef}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-5"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Bloqueo Transaccional SELECT ... FOR UPDATE
            </span>
            <h2 id="booking-modal-title" className="text-xl font-extrabold text-slate-900 mt-0.5">
              Reservar: {listing.title}
            </h2>
            <p className="text-xs text-slate-500">
              Tarifa: <strong>${listing.pricePerNight} MXN</strong> / noche • Máx. {listing.maxGuests} huéspedes
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana modal de reserva"
            className="text-slate-500 hover:text-slate-800 font-bold text-sm px-2.5 py-1 rounded-lg border border-slate-200"
          >
            ✕ Esc
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="modal-checkin" className="block text-xs font-bold text-slate-700 mb-1">
                Fecha de Entrada (Check-In)
              </label>
              <input
                id="modal-checkin"
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
              />
            </div>
            <div>
              <label htmlFor="modal-checkout" className="block text-xs font-bold text-slate-700 mb-1">
                Fecha de Salida (Check-Out)
              </label>
              <input
                id="modal-checkout"
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
              />
            </div>
          </div>

          <div>
            <label htmlFor="modal-guests" className="block text-xs font-bold text-slate-700 mb-1">
              Número de Huéspedes (Máx. {listing.maxGuests})
            </label>
            <input
              id="modal-guests"
              type="number"
              min={1}
              max={listing.maxGuests}
              value={guestsCount}
              onChange={(e) => setGuestsCount(Number(e.target.value))}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-rose-50 border border-rose-300 text-rose-900 text-xs font-semibold"
            >
              {errorMsg}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white text-sm font-bold shadow"
            >
              {submitting ? 'Bloqueando Fechas...' : 'Confirmar Bloqueo de Fechas'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
