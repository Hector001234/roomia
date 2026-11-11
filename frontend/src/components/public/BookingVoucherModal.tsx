import React from 'react';
import { BookingSummary } from '../../types/BookingState';

interface BookingVoucherModalProps {
  isOpen: boolean;
  booking: BookingSummary | null;
  onClose: () => void;
}

export const BookingVoucherModal: React.FC<BookingVoucherModalProps> = ({
  isOpen,
  booking,
  onClose,
}) => {
  if (!isOpen || !booking) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="voucher-title"
      className="fixed inset-0 z-50 bg-zinc-950/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl border border-zinc-200/90 max-w-lg w-full overflow-hidden my-4"
      >
        {/* Printable Voucher Card */}
        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-zinc-200/80 pb-5">
            <div>
              <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-zinc-400">
                Pase de Acceso & Comprobante
              </span>
              <h2 id="voucher-title" className="text-xl font-semibold tracking-tight text-zinc-950 mt-1">
                {booking.listingTitle}
              </h2>
              <p className="text-xs text-zinc-500 font-light mt-0.5">
                {booking.listingCity || 'México'} · Folio #{booking.id}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-zinc-200 hover:bg-zinc-100 flex items-center justify-center text-zinc-400 text-sm"
            >
              ✕
            </button>
          </div>

          {/* Access Key & QR Code Row */}
          <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-200/70 flex items-center justify-between gap-4">
            <div>
              <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-400 block">
                Clave de Cerradura Inteligente
              </span>
              <span className="text-2xl font-mono font-semibold tracking-widest text-zinc-950">
                #4829
              </span>
              <p className="text-[11px] text-zinc-500 font-light mt-1">
                Válida a partir de las 15:00 hrs de tu fecha de llegada.
              </p>
            </div>

            {/* Visual QR Code Pattern */}
            <div className="w-20 h-20 rounded-xl bg-white border border-zinc-200 p-1.5 shrink-0 flex items-center justify-center shadow-xs">
              <svg viewBox="0 0 100 100" className="w-full h-full text-zinc-900 fill-current">
                <rect x="0" y="0" width="30" height="30" />
                <rect x="5" y="5" width="20" height="20" fill="white" />
                <rect x="10" y="10" width="10" height="10" />
                <rect x="70" y="0" width="30" height="30" />
                <rect x="75" y="5" width="20" height="20" fill="white" />
                <rect x="80" y="10" width="10" height="10" />
                <rect x="0" y="70" width="30" height="30" />
                <rect x="5" y="75" width="20" height="20" fill="white" />
                <rect x="10" y="80" width="10" height="10" />
                <rect x="40" y="10" width="15" height="10" />
                <rect x="40" y="40" width="20" height="20" />
                <rect x="10" y="40" width="15" height="15" />
                <rect x="70" y="50" width="20" height="15" />
                <rect x="40" y="75" width="15" height="15" />
                <rect x="75" y="75" width="15" height="15" />
              </svg>
            </div>
          </div>

          {/* Stay Specifics */}
          <div className="grid grid-cols-2 gap-4 text-xs font-light">
            <div className="p-3.5 rounded-xl border border-zinc-100 bg-zinc-50/50">
              <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-400 block">Llegada (Check-in)</span>
              <span className="font-medium text-zinc-900 text-sm mt-0.5 block">{booking.checkIn}</span>
              <span className="text-[10px] text-zinc-400">A partir de las 15:00 hrs</span>
            </div>
            <div className="p-3.5 rounded-xl border border-zinc-100 bg-zinc-50/50">
              <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-400 block">Salida (Check-out)</span>
              <span className="font-medium text-zinc-900 text-sm mt-0.5 block">{booking.checkOut}</span>
              <span className="text-[10px] text-zinc-400">Antes de las 11:00 hrs</span>
            </div>
          </div>

          {/* Financial Breakdown Receipt */}
          <div className="p-4 bg-zinc-50/70 rounded-2xl border border-zinc-200/60 space-y-2 text-xs">
            <div className="flex justify-between text-zinc-500 font-light">
              <span>Huésped Registrado</span>
              <span className="font-medium text-zinc-900">{booking.guestName}</span>
            </div>
            <div className="flex justify-between text-zinc-500 font-light">
              <span>Noches Reservadas</span>
              <span className="font-mono text-zinc-900">{booking.nights} noches</span>
            </div>
            <div className="flex justify-between text-zinc-500 font-light">
              <span>Subtotal Liquidado</span>
              <span className="font-mono text-zinc-900">${booking.subtotal} MXN</span>
            </div>
            <div className="flex justify-between text-zinc-500 font-light">
              <span>Impuestos IVA (16%)</span>
              <span className="font-mono text-zinc-900">${booking.taxAmount} MXN</span>
            </div>
            <div className="pt-2 border-t border-zinc-200 flex justify-between text-sm font-semibold text-zinc-950">
              <span>Total Pagado</span>
              <span className="font-mono text-zinc-950">${booking.totalAmount} MXN</span>
            </div>
          </div>

          {/* Cryptographic SHA-256 seal */}
          <div className="text-[9px] font-mono text-zinc-400 truncate bg-zinc-100 p-2 rounded-xl">
            Sello Criptográfico SHA-256: {booking.integritySha256}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex-1 py-3 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-xs tracking-wider uppercase transition shadow-xs"
            >
              Imprimir Comprobante
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-full border border-zinc-200 hover:border-zinc-400 text-zinc-700 text-xs font-normal transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
