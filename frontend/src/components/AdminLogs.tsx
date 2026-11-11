import React from 'react';
import { AuditLogEntry } from '../types/BookingState';

interface AdminLogsProps {
  entries: AuditLogEntry[];
  chainVerified: boolean;
  onRefresh?: () => void;
}

export const AdminLogs: React.FC<AdminLogsProps> = ({ entries, chainVerified, onRefresh }) => {
  return (
    <section
      aria-label="Immutable Cryptographic Audit Trail"
      className="bg-white p-6 rounded-xl shadow-md border border-slate-200 space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Bitácora Inmutable de Auditoría — PostgreSQL 16 (M06 — D5 audit_logs)
          </h2>
          <p className="text-xs text-slate-500">
            Trigger PL/pgSQL <code className="bg-slate-100 px-1 rounded">trg_audit_logs_immutability</code> (SQLSTATE 45000) • Encadenamiento SHA-256 en Tiempo Real
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition"
            >
              Actualizar Cadena
            </button>
          )}
          <span
            role="status"
            className={`px-3 py-1.5 rounded-full text-xs font-extrabold tracking-wide ${
              chainVerified
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                : 'bg-rose-100 text-rose-900 border border-rose-300'
            }`}
          >
            {chainVerified
              ? `✓ SHA-256 CHAIN VERIFIED (${entries.length} BLOQUES)`
              : '✕ CHAIN TAMPER DETECTED'}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900 text-slate-100 uppercase tracking-wider text-[11px]">
              <th className="py-3 px-3 rounded-tl-lg"># / UUID v4</th>
              <th className="py-3 px-3">Evento Auditable</th>
              <th className="py-3 px-3">Entidad</th>
              <th className="py-3 px-3">IP Anonimizada</th>
              <th className="py-3 px-3">Timestamp UTC(3)</th>
              <th className="py-3 px-3">Hash Previo → Hash SHA-256 Actual</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-mono">
            {entries.map((entry) => (
              <tr key={entry.uuid} className="hover:bg-slate-50 transition">
                <td className="py-3 px-3 text-slate-600">
                  <span className="font-bold text-slate-900">#{entry.id}</span> • {entry.uuid.slice(0, 8)}
                </td>
                <td className="py-3 px-3 font-sans font-bold text-blue-800">{entry.eventType}</td>
                <td className="py-3 px-3 text-slate-700">
                  {entry.entityType}:{entry.entityId}
                </td>
                <td className="py-3 px-3 text-slate-700">{entry.ipAnonymized}</td>
                <td className="py-3 px-3 text-slate-600">{entry.createdAtUtc}</td>
                <td className="py-3 px-3 text-[11px]">
                  <div className="text-slate-400 truncate max-w-xs" title={entry.previousHash}>
                    Prev: {entry.previousHash.slice(0, 20)}...
                  </div>
                  <div className="text-emerald-800 font-semibold truncate max-w-xs" title={entry.currentHash}>
                    Curr: {entry.currentHash.slice(0, 28)}...
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
