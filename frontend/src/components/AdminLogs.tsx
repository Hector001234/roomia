import React from 'react';
import { AuditLogEntry } from '../types/BookingState';

interface AdminLogsProps {
  entries: AuditLogEntry[];
  chainVerified: boolean;
}

/**
 * Section 12 (RF-06) & RQ-AUD-01: Immutable Audit Trail Console with SHA-256 chain status.
 */
export const AdminLogs: React.FC<AdminLogsProps> = ({ entries, chainVerified }) => {
  return (
    <section aria-label="Immutable Audit Trail Console" className="p-6 bg-slate-900 text-slate-100 rounded-xl shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Bitácora Inmutable de Auditoría (M06 — D5 audit_logs)</h2>
        <span className={`px-3 py-1 rounded text-xs font-bold ${chainVerified ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {chainVerified ? 'SHA-256 CHAIN VERIFIED' : 'CHAIN TAMPERING DETECTED'}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400">
              <th className="py-2">UUID v4</th>
              <th className="py-2">Evento</th>
              <th className="py-2">IP Anonimizada</th>
              <th className="py-2">Timestamp UTC</th>
              <th className="py-2">Hash SHA-256 Actual</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.uuid} className="border-b border-slate-800">
                <td className="py-2">{entry.uuid}</td>
                <td className="py-2">{entry.eventType}</td>
                <td className="py-2">{entry.ipAnonymized}</td>
                <td className="py-2">{entry.createdAtUtc}</td>
                <td className="py-2 truncate max-w-xs">{entry.currentHash}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
