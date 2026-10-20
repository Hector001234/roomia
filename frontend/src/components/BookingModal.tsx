import React from 'react';
import { BookingState } from '../types/BookingState';
import { formatCurrencyAmount } from '../utils/currencyUtils';
import { formatIsoDateRange } from '../utils/date-formatter';

interface BookingModalProps {
  booking: BookingState;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Section 12 (RF-04) & Section 28.2 (WCAG 2.1 AA aria-modal without keyboard trap).
 */
export const BookingModal: React.FC<BookingModalProps> = ({ booking, isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="booking-modal-title" className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-lg">
        <h2 id="booking-modal-title" className="text-xl font-bold text-slate-900">
          Resumen de Reserva (Bloqueo Pesimista Activo)
        </h2>
        <p className="mt-2 text-sm text-slate-700">Estancia: {formatIsoDateRange(booking.checkIn, booking.checkOut)}</p>
        <p className="mt-1 text-sm text-slate-700">Total Exacto: {formatCurrencyAmount(booking.totalAmount)}</p>
        <p className="mt-1 text-xs font-mono text-slate-500">UUID v4: {booking.uuid ?? 'Pendiente'}</p>
        <div className="mt-4 flex justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-800 text-white rounded">
            Cerrar (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
