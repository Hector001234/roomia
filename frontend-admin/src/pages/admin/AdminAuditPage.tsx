import React, { useEffect, useState } from 'react';
import { AuditLogEntry } from '../../types/BookingState';
import { roomiaApi } from '../../utils/apiClient';
import { exportToCSV } from '../../utils/csvExport';

export const AdminAuditPage: React.FC = () => {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [chainVerified, setChainVerified] = useState(true);
  const [loading, setLoading] = useState(true);

  const loadAudit = async () => {
    setLoading(true);
    const res = await roomiaApi.fetchAuditLogs(100, 0);
    setLoading(false);
    if (res.ok && res.data) {
      setEntries(res.data.data);
      setChainVerified(res.data.chain_integrity_verified);
    }
  };

  useEffect(() => {
    void loadAudit();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Bitácora Criptográfica Inmutable (D5 audit_logs)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Trigger PL/pgSQL <code className="bg-slate-200 px-1 rounded font-mono">trg_audit_logs_immutability</code> (SQLSTATE 45000) · Cadena SHA-256 en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              exportToCSV(
                'roomia_bitacora_auditoria',
                entries as unknown as Record<string, unknown>[],
                [
                  { key: 'uuid', label: 'UUID' },
                  { key: 'event_type', label: 'Evento' },
                  { key: 'table_name', label: 'Tabla' },
                  { key: 'row_id', label: 'ID_Fila' },
                  { key: 'created_at', label: 'Timestamp_UTC' },
                  { key: 'ip_address_anonymized', label: 'IP_Anonimizada' },
                  { key: 'current_hash', label: 'SHA256_Actual' },
                  { key: 'previous_hash', label: 'SHA256_Previo' },
                ]
              )
            }
            className="px-4 py-1.5 rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-normal text-zinc-800 transition"
          >
            Exportar CSV
          </button>
          <button
            type="button"
            onClick={loadAudit}
            className="px-4 py-1.5 rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-normal text-zinc-800 transition"
          >
            Actualizar Cadena
          </button>
          <span
            className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold ${
              chainVerified
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                : 'bg-rose-100 text-rose-900 border border-rose-300'
            }`}
          >
            {chainVerified ? `✓ SHA-256 CHAIN VERIFIED (${entries.length} BLOQUES)` : '✕ TAMPER DETECTADO'}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs font-bold text-slate-500 animate-pulse">
            Verificando integridad criptográfica de la cadena SHA-256...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white uppercase text-[11px] font-bold font-mono">
                  <th className="py-3 px-3"># / UUID v4</th>
                  <th className="py-3 px-3 font-sans">Evento Auditable</th>
                  <th className="py-3 px-3">Entidad</th>
                  <th className="py-3 px-3">IP Anonimizada</th>
                  <th className="py-3 px-3">Timestamp UTC(3)</th>
                  <th className="py-3 px-3">Hash Previo → Hash SHA-256 Actual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                {entries.map((entry) => (
                  <tr key={entry.uuid} className="hover:bg-slate-50">
                    <td className="py-3 px-3 text-slate-600">
                      <span className="font-bold text-slate-900">#{entry.id}</span> · {entry.uuid.slice(0, 8)}
                    </td>
                    <td className="py-3 px-3 font-sans font-extrabold text-rose-700">
                      {entry.eventType}
                    </td>
                    <td className="py-3 px-3 text-slate-700">
                      {entry.entityType}:{entry.entityId}
                    </td>
                    <td className="py-3 px-3 text-slate-700">{entry.ipAnonymized}</td>
                    <td className="py-3 px-3 text-slate-500">{entry.createdAtUtc}</td>
                    <td className="py-3 px-3">
                      <div className="text-slate-400 truncate max-w-xs" title={entry.previousHash}>
                        Prev: {entry.previousHash.slice(0, 18)}...
                      </div>
                      <div className="text-emerald-700 font-bold truncate max-w-xs" title={entry.currentHash}>
                        Curr: {entry.currentHash.slice(0, 24)}...
                      </div>
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
