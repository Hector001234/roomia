import React from 'react';

interface PciSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PciSecurityModal: React.FC<PciSecurityModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pci-modal-title"
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
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-zinc-400">
                Certificación de Pasarela de Pago
              </span>
            </div>
            <h2 id="pci-modal-title" className="text-lg font-semibold tracking-tight text-zinc-950 mt-0.5">
              Estándar de Seguridad PCI-DSS 4.0
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
              Garantía de Cero Almacenamiento de Datos Sensibles (PAN / CVV)
            </span>
            <p>
              Roomia cumple rigurosamente con los 12 requerimientos del Payment Card Industry Data Security Standard (PCI-DSS 4.0 Nivel 1). Los datos de tarjetas bancarias nunca tocan ni se almacenan en los servidores de Roomia.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-950">
              1. Tokenización en Origen con Stripe
            </h3>
            <p>
              Toda transacción realizada en Roomia se procesa mediante tokenización directa cliente-servidor a través de la infraestructura de Stripe. El número primario de cuenta (PAN) es sustituido por un token criptográfico efímero de un solo uso.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-950">
              2. Cifrado en Tránsito TLS 1.3 con AES-256
            </h3>
            <p>
              Todas las comunicaciones entre el navegador del huésped, las APIs de Roomia y los procesadores bancarios están protegidas con TLS 1.3 y suites de cifrado de alta seguridad (ECDHE-RSA-AES256-GCM-SHA384).
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-950">
              3. Autenticación 3D Secure 2.0 y Prevención de Fraude
            </h3>
            <p>
              Integramos validación biométrica y desafío OTP mediante 3D Secure 2.0 para garantizar que el titular legítimo autoriza cada estancia, reduciendo a cero el riesgo de contracargos fraudulentos.
            </p>
          </div>

          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-1 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-zinc-400">Nivel de Cumplimiento:</span>
              <span className="text-zinc-800 font-medium">PCI-DSS 4.0 Level 1 Service Provider</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Auditoría Criptográfica:</span>
              <span className="text-zinc-800 font-medium">SHA-256 Chain Verification</span>
            </div>
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
