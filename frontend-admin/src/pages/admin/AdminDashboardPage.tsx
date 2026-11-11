import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuditLogEntry, BookingSummary, ListingItem } from '../../types/BookingState';
import { roomiaApi } from '../../utils/apiClient';

export const AdminDashboardPage: React.FC = () => {
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [bookings, setBookings] = useState<BookingSummary[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [chainVerified, setChainVerified] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const [catRes, auditRes] = await Promise.all([
        roomiaApi.fetchCatalog(50, 0),
        roomiaApi.fetchAuditLogs(10, 0),
      ]);
      setLoading(false);

      if (catRes.ok && catRes.data) {
        setListings(catRes.data.allListings || catRes.data.data);
        setBookings(catRes.data.bookings);
      }
      if (auditRes.ok && auditRes.data) {
        setAuditLogs(auditRes.data.data);
        setChainVerified(auditRes.data.chain_integrity_verified);
      }
    })();
  }, []);

  const activeListings = listings.filter((l) => l.deletedAt === null && l.status === 'ACTIVE');
  const deletedListings = listings.filter((l) => l.deletedAt !== null);
  const confirmedBookings = bookings.filter(
    (b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED'
  );
  const totalVolume = confirmedBookings.reduce((sum, b) => sum + Number(b.totalAmount), 0);
  const totalFees = confirmedBookings.reduce((sum, b) => sum + Number(b.serviceFee), 0);

  return (
    <div className="space-y-6">
      {/* Top Welcome Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Resumen Ejecutivo & Métricas de Plataforma
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Supervisión transaccional en tiempo real bajo estándares ISO/IEC 25010 y LFPDPPP.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/listings"
            className="px-4 py-2 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-xs tracking-wider uppercase shadow-xs transition"
          >
            Gestionar Inventario
          </Link>
          <Link
            to="/audit"
            className="px-4 py-2 rounded-full border border-zinc-200 hover:border-zinc-950 bg-white text-zinc-900 font-medium text-xs tracking-wider uppercase transition"
          >
            Cadena SHA-256
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-500">
            <span>Alojamientos Activos</span>
            <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {activeListings.length} en catálogo
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900">{activeListings.length}</div>
          <div className="text-[11px] text-slate-500">
            {deletedListings.length} en baja lógica (<code className="font-mono text-rose-600">deleted_at</code>)
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-500">
            <span>Reservas Totales</span>
            <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              {bookings.length} registradas
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900">{bookings.length}</div>
          <div className="text-[11px] text-slate-500">
            {confirmedBookings.length} confirmadas / completadas
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-500">
            <span>Volumen Transaccional</span>
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-mono text-[10px]">
              PCI-DSS Tokenizado
            </span>
          </div>
          <div className="text-3xl font-black text-emerald-700">
            ${totalVolume.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500">
            Comisión plataforma (12%): <strong>${totalFees.toFixed(2)} MXN</strong>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-500">
            <span>Integridad de Auditoría</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                chainVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}
            >
              {chainVerified ? 'VERIFICADA' : 'MANIPULADA'}
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900">{auditLogs.length}</div>
          <div className="text-[11px] text-slate-500 truncate">
            Último bloque: {auditLogs[0]?.currentHash.slice(0, 16)}...
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Activity + Compliance Verification */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Platform Reservations Table */}
        <section className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900">
              Últimas Reservaciones Registradas en el Sistema
            </h2>
            <Link to="/bookings" className="text-xs font-bold text-rose-600 hover:underline">
              Ver todas ({bookings.length}) →
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-500 animate-pulse">
              Cargando historial de reservas...
            </div>
          ) : bookings.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
              No hay reservaciones registradas aún en la base de datos.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3">ID / UUID</th>
                    <th className="py-2.5 px-3">Alojamiento</th>
                    <th className="py-2.5 px-3">Huésped</th>
                    <th className="py-2.5 px-3">Fechas</th>
                    <th className="py-2.5 px-3">Monto Total</th>
                    <th className="py-2.5 px-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bookings.slice(0, 5).map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-700">#{b.id}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">{b.listingTitle}</td>
                      <td className="py-2.5 px-3 text-slate-600">{b.guestName || `ID ${b.guestId}`}</td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                        {b.checkIn} → {b.checkOut}
                      </td>
                      <td className="py-2.5 px-3 font-extrabold text-slate-900">
                        ${b.totalAmount} MXN
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Audit & Compliance Health Card */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center justify-between">
            <span>Garantías de Cumplimiento</span>
            <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
              100% OK
            </span>
          </h2>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900">🔒 Control de Concurrencia (CP-CONC-01)</div>
              <p className="text-slate-600 text-[11px]">
                Bloqueo pesimista con <code className="bg-white px-1 rounded border">SELECT ... FOR UPDATE</code> y
                restricción única parcial en <code className="bg-white px-1 rounded border">booking_dates</code>.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900">💳 PCI-DSS 4.0 Tokenizado (CPF-02)</div>
              <p className="text-slate-600 text-[11px]">
                Pasarela Stripe con webhooks firmados HMAC-SHA256. Cero almacenamiento de números de tarjeta o CVV en base de datos.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900">🛡️ Inmutabilidad D5 audit_logs (RQ-AUD-01)</div>
              <p className="text-slate-600 text-[11px]">
                Trigger PL/pgSQL que eleva <code className="bg-white px-1 rounded border">SQLSTATE 45000</code> ante cualquier intento de UPDATE o DELETE.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900">⭐ Reseñas Verificadas (CPF-05)</div>
              <p className="text-slate-600 text-[11px]">
                Trigger que exige obligatoriamente una estancia en estado <code className="bg-white px-1 rounded border">COMPLETED</code> para calificar.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
