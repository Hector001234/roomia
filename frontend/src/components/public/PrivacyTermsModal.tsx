import React from 'react';

interface PrivacyTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyTermsModal: React.FC<PrivacyTermsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-title"
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
              Marco Regulatorio & Cumplimiento LFPDPPP
            </span>
            <h2 id="privacy-modal-title" className="text-lg font-semibold tracking-tight text-zinc-950 mt-0.5">
              Aviso de Privacidad & Términos de Servicio
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
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-950">
              1. Identidad del Responsable del Tratamiento
            </h3>
            <p>
              Roomia S.A.P.I. de C.V., con domicilio en el Estado de México, es responsable del uso y protección de sus datos personales conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-950">
              2. Datos Personales Recabados
            </h3>
            <p>
              Para la prestación de los servicios de alojamiento y verificación transaccional, recabamos: nombre completo, correo electrónico validado bajo RFC 5322, número telefónico de contacto y credenciales de autenticación protegidas mediante el algoritmo Argon2id. No almacenamos números de tarjeta de crédito (PAN) ni códigos de seguridad (CVV/CVC) en nuestras bases de datos.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-950">
              3. Derechos ARCO
            </h3>
            <p>
              Usted tiene derecho a conocer qué datos personales tenemos de usted, para qué los utilizamos y las condiciones de uso (Acceso). Asimismo, es su derecho solicitar la corrección (Rectificación), eliminación de nuestros registros (Cancelación), u oponerse al tratamiento para fines específicos (Oposición).
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-950">
              4. Políticas de Cancelación y Reembolsos
            </h3>
            <p>
              Toda reserva cuenta con cancelación flexible sin penalización hasta 48 horas antes del check-in programado (15:00 hrs). Las cancelaciones extemporáneas conllevan la retención de la primera noche por concepto de bloqueo de fechas garantizado.
            </p>
          </div>

          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">Contacto Oficial de Privacidad</span>
            <span className="font-mono text-zinc-800">privacidad@roomia.mx</span>
            <p className="text-[10px] text-zinc-400">Atención de lunes a viernes de 09:00 a 18:00 hrs (Horario Ciudad de México).</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-zinc-100 bg-zinc-50/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-xs tracking-wider uppercase transition shadow-xs"
          >
            Entendido y Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};
