import React from 'react';

interface GuestGuaranteeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuestGuaranteeModal: React.FC<GuestGuaranteeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="guarantee-modal-title"
      className="fixed inset-0 z-50 bg-zinc-950/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl border border-zinc-200/90 max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden my-4"
      >
        {/* Header */}
        <div className="px-8 py-5 border-b border-zinc-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-10">
          <div>
            <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-zinc-400">
              Compromiso de Calidad & Hospitalidad
            </span>
            <h2 id="guarantee-modal-title" className="text-lg font-semibold tracking-tight text-zinc-950 mt-0.5">
              Garantía de Huésped Roomia
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-zinc-200 hover:bg-zinc-100 flex items-center justify-center text-zinc-500 text-sm font-light transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6 overflow-y-auto text-xs text-zinc-600 font-light leading-relaxed">
          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-950 block">
              Protección Integral de tu Estancia
            </span>
            <p>
              En Roomia cada residencia es verificada personalmente por nuestro equipo de curaduría. Tu estancia está protegida de principio a fin con nuestro compromiso de hospitalidad respaldado por la arquitectura del sistema.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-950">
              1. Protección Antidoble Reserva (SELECT FOR UPDATE)
            </h3>
            <p>
              A diferencia de plataformas convencionales que sufren sobreventa o cancelaciones involuntarias, Roomia implementa un bloqueo pesimista en base de datos PostgreSQL 16. Una vez confirmada tu reserva, nadie más puede tomar tus fechas bajo ninguna circunstancia.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-950">
              2. Garantía de Veracidad del Alojamiento
            </h3>
            <p>
              Si al momento de tu llegada la residencia no cuenta con las amenidades prometidas, la limpieza es deficiente o existe alguna anomalía estructural, nuestro equipo te reubicará de inmediato en una propiedad de categoría igual o superior, o te reembolsará el 100% de tu dinero.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-950">
              3. Asistencia Concierge 24/7
            </h3>
            <p>
              Cuentas con un canal directo de atención con tu anfitrión y con el equipo de soporte de emergencias Roomia disponible las 24 horas del día durante toda la duración de tu estancia.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-950">
              4. Identidad del Anfitrión Validada con SAT / RFC
            </h3>
            <p>
              Todos los anfitriones de nuestra plataforma han superado un proceso de verificación fiscal e identidad oficial para asegurar una estancia completamente segura y legítima.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-zinc-100 bg-zinc-50/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-xs tracking-wider uppercase transition shadow-xs"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
