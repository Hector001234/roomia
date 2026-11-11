import React, { useState } from 'react';

export const AdminSettingsPage: React.FC = () => {
  const [serviceFeeRate, setServiceFeeRate] = useState('12.0');
  const [taxRate, setTaxRate] = useState('16.0');
  const [cancellationPolicy, setCancellationPolicy] = useState('MODERATE');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setToast('Parámetros de la plataforma actualizados correctamente en memoria.');
  };

  return (
    <div className="space-y-6 max-w-4xl">
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

      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Parámetros Globales de la Plataforma
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configuración económica, tasas impositivas y constantes del motor de reservas Roomia.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
        <h2 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-2">
          Tasas de Comisión y Cálculos Transaccionales — NUMERIC(10,2)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="setting-fee" className="block text-xs font-bold text-slate-700 mb-1">
              Comisión de Servicio Roomia (%)
            </label>
            <input
              id="setting-fee"
              type="number"
              step="0.1"
              value={serviceFeeRate}
              onChange={(e) => setServiceFeeRate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-900"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Actualmente 12.0% cobrado al huésped en cada reservación (M04).
            </p>
          </div>

          <div>
            <label htmlFor="setting-tax" className="block text-xs font-bold text-slate-700 mb-1">
              Impuesto al Valor Agregado IVA (%)
            </label>
            <input
              id="setting-tax"
              type="number"
              step="0.1"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-900"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Actualmente 16.0% correspondiente al régimen fiscal mexicano.
            </p>
          </div>

          <div>
            <label htmlFor="setting-policy" className="block text-xs font-bold text-slate-700 mb-1">
              Política de Cancelación por Defecto
            </label>
            <select
              id="setting-policy"
              value={cancellationPolicy}
              onChange={(e) => setCancellationPolicy(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-900"
            >
              <option value="FLEXIBLE">FLEXIBLE (Reembolso 100% hasta 24h antes)</option>
              <option value="MODERATE">MODERATE (Reembolso 100% hasta 5 días antes)</option>
              <option value="STRICT">STRICT (Reembolso 50% hasta 7 días antes)</option>
            </select>
          </div>

          <div className="flex items-center pt-5">
            <input
              id="setting-maintenance"
              type="checkbox"
              checked={maintenanceMode}
              onChange={(e) => setMaintenanceMode(e.target.checked)}
              className="h-4 w-4 text-rose-600 rounded border-slate-300"
            />
            <label htmlFor="setting-maintenance" className="ml-2 text-xs font-bold text-slate-700">
              Modo de Mantenimiento (Suspende reservas temporales)
            </label>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow transition"
          >
            Guardar Parámetros
          </button>
        </div>
      </form>

      {/* Infrastructure Verification Box */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800 space-y-3 text-xs">
        <h2 className="text-sm font-bold text-white">Variables y Estado del Entorno de Ejecución</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300 font-mono text-[11px]">
          <div>Motor BD: <span className="text-emerald-400 font-bold">PostgreSQL 16 Alpine (3NF)</span></div>
          <div>Algoritmo Hash: <span className="text-emerald-400 font-bold">Argon2id (m=65536, t=4, p=2)</span></div>
          <div>Token Auth: <span className="text-emerald-400 font-bold">RSA-2048 Asymmetric JWT (3600s TTL)</span></div>
          <div>Lock Concurrencia: <span className="text-emerald-400 font-bold">SELECT ... FOR UPDATE</span></div>
          <div>Pasarela Pagos: <span className="text-emerald-400 font-bold">Stripe Tokenized (PCI-DSS 4.0)</span></div>
          <div>Inmutabilidad: <span className="text-emerald-400 font-bold">PL/pgSQL Trigger SQLSTATE 45000</span></div>
        </div>
      </div>
    </div>
  );
};
