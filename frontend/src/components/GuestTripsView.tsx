import React, { useState } from 'react';
import { BookingSummary } from '../types/BookingState';
import { roomiaApi } from '../utils/apiClient';
import { BookingVoucherModal } from './public/BookingVoucherModal';
import { HostConciergeModal } from './public/HostConciergeModal';
import { PaymentGatewayModal } from './public/PaymentGatewayModal';
import { SatInvoicingModal } from './public/SatInvoicingModal';

interface GuestTripsViewProps {
  bookings: BookingSummary[];
  onRefresh: () => void;
}

export const GuestTripsView: React.FC<GuestTripsViewProps> = ({ bookings, onRefresh }) => {
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<BookingSummary | null>(null);
  const [selectedBookingForVoucher, setSelectedBookingForVoucher] = useState<BookingSummary | null>(null);
  const [selectedBookingForConcierge, setSelectedBookingForConcierge] = useState<BookingSummary | null>(null);
  const [selectedBookingForSatInvoice, setSelectedBookingForSatInvoice] = useState<BookingSummary | null>(null);

  const [banner, setBanner] = useState<{ error: boolean; message: string } | null>(null);

  const handleCompleteStay = async (bookingId: number) => {
    const res = await roomiaApi.completeBookingStay(bookingId);
    if (res.ok && res.data) {
      setBanner({
        error: false,
        message: res.data.message || 'Estancia concluida satisfactoriamente.',
      });
      onRefresh();
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    const res = await roomiaApi.cancelBooking(bookingId);
    if (res.ok && res.data) {
      setBanner({
        error: false,
        message: res.data.message || 'Reserva cancelada y fechas liberadas en calendario.',
      });
      onRefresh();
    }
  };

  return (
    <section className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-xs border border-zinc-200/80 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-950">
            Registro de Estancias ({bookings.length})
          </h2>
          <p className="text-xs text-zinc-500 font-light mt-1">
            Supervisa tus periodos reservados, liquida mediante la pasarela segura tokenizada o consulta tus pases de acceso digital.
          </p>
        </div>
      </div>

      {banner && (
        <div
          role="alert"
          className={`p-4 rounded-2xl text-xs font-medium border ${
            banner.error
              ? 'bg-rose-50 text-rose-900 border-rose-200'
              : 'bg-zinc-100 text-zinc-950 border-zinc-300'
          }`}
        >
          {banner.message}
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="bg-white p-16 rounded-3xl border border-zinc-200/80 text-center space-y-3 shadow-xs max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mx-auto font-light text-xl">
            —
          </div>
          <div className="text-base font-semibold text-zinc-900 tracking-tight">Sin estancias activas</div>
          <p className="text-xs text-zinc-500 font-light">
            Explora el catálogo principal para seleccionar y reservar tu próxima residencia.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {bookings.map((b) => (
            <article
              key={b.id}
              className="bg-white rounded-3xl shadow-xs border border-zinc-200/80 overflow-hidden grid grid-cols-1 md:grid-cols-4"
            >
              <div className="h-48 md:h-auto bg-zinc-100">
                <img
                  src={
                    b.listingPhoto ||
                    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'
                  }
                  alt={b.listingTitle}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-6 md:col-span-3 flex flex-col justify-between space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-zinc-100 pb-4">
                  <div>
                    <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-400">
                      Folio #{b.id} · {b.listingCity || 'México'}
                    </span>
                    <h3 className="text-base font-semibold text-zinc-950 tracking-tight mt-0.5">{b.listingTitle}</h3>
                    <p className="text-xs text-zinc-500 font-light mt-0.5">
                      Periodo: {b.checkIn} al {b.checkOut} ({b.nights} noches · {b.guestsCount} huéspedes)
                    </p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider ${
                      b.status === 'CONFIRMED'
                        ? 'bg-zinc-900 text-white'
                        : b.status === 'COMPLETED'
                        ? 'bg-zinc-100 text-zinc-900 border border-zinc-300'
                        : b.status === 'CANCELLED'
                        ? 'bg-zinc-100 text-zinc-400 line-through'
                        : 'bg-amber-50 text-amber-900 border border-amber-200'
                    }`}
                  >
                    {b.status === 'PENDING' ? 'Pendiente de Pago' : b.status}
                  </span>
                </div>

                {/* Financial breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-50 p-4 rounded-2xl border border-zinc-100 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-zinc-400 block">Subtotal</span>
                    <span className="font-mono text-zinc-800">${b.subtotal} MXN</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-zinc-400 block">Comisión (12%)</span>
                    <span className="font-mono text-zinc-800">${b.serviceFee} MXN</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-zinc-400 block">IVA (16%)</span>
                    <span className="font-mono text-zinc-800">${b.taxAmount} MXN</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-zinc-400 block">Total Liquidable</span>
                    <span className="font-mono font-semibold text-zinc-950 text-sm">
                      ${b.totalAmount} MXN
                    </span>
                  </div>
                </div>

                {/* Actions Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="text-[10px] font-mono text-zinc-400 truncate max-w-xs">
                    Hash SHA-256: {b.integritySha256}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {b.status === 'PENDING' && (
                      <>
                        <button
                          type="button"
                          onClick={() => setSelectedBookingForPayment(b)}
                          className="px-4 py-2 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium tracking-wide transition shadow-xs flex items-center gap-2"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          <span>Abrir Pasarela de Pago</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCancelBooking(b.id)}
                          className="px-3.5 py-2 rounded-full border border-zinc-200 hover:border-zinc-400 text-zinc-700 text-xs font-normal transition"
                        >
                          Liberar Fechas
                        </button>
                      </>
                    )}

                    {b.status === 'CONFIRMED' && (
                      <>
                        <button
                          type="button"
                          onClick={() => setSelectedBookingForVoucher(b)}
                          className="px-3.5 py-1.5 rounded-full border border-zinc-300 hover:border-zinc-950 text-zinc-900 text-xs font-medium transition"
                        >
                          Pase de Acceso & QR
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedBookingForSatInvoice(b)}
                          className="px-3.5 py-1.5 rounded-full border border-blue-200 hover:border-blue-600 bg-blue-50/50 hover:bg-blue-50 text-blue-900 text-xs font-medium transition flex items-center gap-1.5"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                          <span>Factura SAT CFDI 4.0</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedBookingForConcierge(b)}
                          className="px-3.5 py-1.5 rounded-full border border-zinc-200 hover:bg-zinc-100 text-zinc-700 text-xs font-normal transition"
                        >
                          Chat Anfitrión
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCompleteStay(b.id)}
                          className="px-4 py-1.5 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium tracking-wide transition shadow-xs"
                        >
                          Finalizar Estancia
                        </button>
                      </>
                    )}

                    {b.status === 'COMPLETED' && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedBookingForVoucher(b)}
                          className="px-3 py-1 rounded-full border border-zinc-200 hover:border-zinc-400 text-zinc-700 text-xs font-normal transition"
                        >
                          Ver Comprobante
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedBookingForSatInvoice(b)}
                          className="px-3 py-1 rounded-full border border-blue-200 hover:border-blue-600 bg-blue-50/50 text-blue-900 text-xs font-medium transition flex items-center gap-1"
                        >
                          <span>CFDI 4.0 XML/PDF</span>
                        </button>
                        <span className="text-xs font-normal text-zinc-600 bg-zinc-100 px-3 py-1 rounded-full border border-zinc-200">
                          Estancia Concluida · Reseña Habilitada
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Payment Gateway Modal */}
      <PaymentGatewayModal
        isOpen={Boolean(selectedBookingForPayment)}
        booking={selectedBookingForPayment}
        onClose={() => setSelectedBookingForPayment(null)}
        onPaymentSuccess={() => {
          setSelectedBookingForPayment(null);
          setBanner({
            error: false,
            message: '¡Pago acreditado exitosamente! Tu estancia está confirmada con código de acceso digital.',
          });
          onRefresh();
        }}
      />

      {/* Booking Voucher Pass Modal */}
      <BookingVoucherModal
        isOpen={Boolean(selectedBookingForVoucher)}
        booking={selectedBookingForVoucher}
        onClose={() => setSelectedBookingForVoucher(null)}
      />

      {/* Host Concierge Chat Modal */}
      {selectedBookingForConcierge && (
        <HostConciergeModal
          isOpen={Boolean(selectedBookingForConcierge)}
          hostName="Elena Rostova"
          listingTitle={selectedBookingForConcierge.listingTitle}
          onClose={() => setSelectedBookingForConcierge(null)}
        />
      )}

      {/* SAT CFDI 4.0 Invoicing Modal */}
      <SatInvoicingModal
        isOpen={Boolean(selectedBookingForSatInvoice)}
        booking={selectedBookingForSatInvoice}
        onClose={() => setSelectedBookingForSatInvoice(null)}
      />
    </section>
  );
};
