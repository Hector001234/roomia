import React, { useEffect, useState } from 'react';
import { BookingSummary } from '../../types/BookingState';
import { roomiaApi } from '../../utils/apiClient';
import { exportToCSV } from '../../utils/csvExport';

export const AdminBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<BookingSummary[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const loadBookings = async () => {
    setLoading(true);
    const res = await roomiaApi.fetchCatalog();
    setLoading(false);
    if (res.ok && res.data) {
      setBookings(res.data.bookings);
    }
  };

  useEffect(() => {
    void loadBookings();
  }, []);

  const handleCancelBooking = async (id: number) => {
    if (!window.confirm(`¿Confirmas la cancelación administrativa de la reserva #${id}? Se liberarán las fechas bloqueadas.`)) {
      return;
    }
    const res = await roomiaApi.cancelBooking(id);
    if (res.ok && res.data) {
      setToast(res.data.message || 'Reserva cancelada con éxito.');
      void loadBookings();
    }
  };

  const handleCompleteStay = async (id: number) => {
    const res = await roomiaApi.completeBookingStay(id);
    if (res.ok && res.data) {
      setToast(res.data.message || 'Estancia marcada como completada.');
      void loadBookings();
    }
  };

  const filtered = bookings.filter((b) => {
    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {toast && (
        <div
          role="status"
          className="bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center justify-between text-xs font-bold"
        >
          <span>✨ {toast}</span>
          <button type="button" onClick={() => setToast(null)} className="text-slate-400 hover:text-white ml-4">
            ✕
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Supervisión y Control de Reservaciones
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Bloqueo pesimista <code className="font-mono bg-slate-200 px-1 rounded">SELECT FOR UPDATE</code> y verificación de integridad criptográfica SHA-256.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              exportToCSV(
                'roomia_reservaciones',
                filtered as unknown as Record<string, unknown>[],
                [
                  { key: 'id', label: 'ID_Reserva' },
                  { key: 'listingTitle', label: 'Alojamiento' },
                  { key: 'guestName', label: 'Huésped' },
                  { key: 'checkIn', label: 'Llegada' },
                  { key: 'checkOut', label: 'Salida' },
                  { key: 'status', label: 'Estado' },
                  { key: 'totalAmount', label: 'Monto_Total_MXN' },
                  { key: 'serviceFee', label: 'Comisión_12' },
                  { key: 'taxAmount', label: 'IVA_16' },
                  { key: 'integrityHash', label: 'Hash_SHA256' },
                ]
              )
            }
            className="px-4 py-1.5 rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-normal transition"
          >
            Exportar CSV
          </button>
          <label htmlFor="booking-status-filter" className="text-xs font-medium text-zinc-600">
            Filtrar:
          </label>
          <select
            id="booking-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800"
          >
            <option value="ALL">Todas ({bookings.length})</option>
            <option value="PENDING">PENDING (Bloqueadas sin pagar)</option>
            <option value="CONFIRMED">CONFIRMED (Pagadas Stripe)</option>
            <option value="COMPLETED">COMPLETED (Estancia finalizada)</option>
            <option value="CANCELLED">CANCELLED (Fechas liberadas)</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs font-bold text-slate-500 animate-pulse">
            Consultando libro mayor de reservaciones...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No se encontraron reservaciones para el estado seleccionado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white uppercase text-[11px] font-bold">
                  <th className="py-3 px-3">Reserva / UUID</th>
                  <th className="py-3 px-3">Alojamiento</th>
                  <th className="py-3 px-3">Huésped</th>
                  <th className="py-3 px-3">Fechas & Noches</th>
                  <th className="py-3 px-3">Desglose Financiero</th>
                  <th className="py-3 px-3">Total Transaccional</th>
                  <th className="py-3 px-3">Estado</th>
                  <th className="py-3 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">#{b.id}</div>
                      <div className="text-[10px] font-mono text-slate-400">{b.uuid.slice(0, 8)}...</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{b.listingTitle}</div>
                      <div className="text-[11px] text-slate-500">ID #{b.listingId} · {b.listingCity}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-700">
                      <div className="font-bold">{b.guestName || `Huésped #${b.guestId}`}</div>
                      <div className="text-[10px] text-slate-400">ID: {b.guestId}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700">
                      <div>{b.checkIn} → {b.checkOut}</div>
                      <div className="text-[10px] text-slate-400 font-sans">
                        {b.nights} noche(s) · {b.guestsCount} huésped(es)
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 text-[11px]">
                      <div>Subtotal: ${b.subtotal}</div>
                      <div>Comisión 12%: ${b.serviceFee}</div>
                      <div>IVA 16%: ${b.taxAmount}</div>
                    </td>
                    <td className="py-3 px-3 font-extrabold text-slate-900 text-sm">
                      ${b.totalAmount} MXN
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          b.status === 'CONFIRMED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.status === 'COMPLETED'
                            ? 'bg-blue-100 text-blue-800'
                            : b.status === 'CANCELLED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                      {b.status === 'CONFIRMED' && (
                        <button
                          type="button"
                          onClick={() => handleCompleteStay(b.id)}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition"
                        >
                          Completar
                        </button>
                      )}
                      {(b.status === 'PENDING' || b.status === 'CONFIRMED') && (
                        <button
                          type="button"
                          onClick={() => handleCancelBooking(b.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] transition"
                        >
                          Cancelar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
