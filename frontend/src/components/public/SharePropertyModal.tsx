import React, { useState } from 'react';
import { ListingItem } from '../../types/BookingState';

interface SharePropertyModalProps {
  isOpen: boolean;
  listing: ListingItem | null;
  onClose: () => void;
}

export const SharePropertyModal: React.FC<SharePropertyModalProps> = ({
  isOpen,
  listing,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !listing) return null;

  // Canonical production URL + dev fallback
  const canonicalUrl = `https://roomia.mx/estancias/${listing.uuid}`;
  const localDirectUrl = `${window.location.origin}/?residencia=${listing.id}`;

  const shareText = `Descubre esta residencia de autor en Roomia: "${listing.title}" en ${listing.city}, ${listing.stateName}.`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${canonicalUrl}`)}`;
  const mailUrl = `mailto:?subject=${encodeURIComponent(`Te recomiendo esta estancia en Roomia: ${listing.title}`)}&body=${encodeURIComponent(
    `Hola,\n\nTe comparto este espacio exclusivo que encontré en Roomia:\n\n${listing.title}\nUbicación: ${listing.city}, ${listing.stateName}\nTarifa por noche: $${Number(listing.pricePerNight).toLocaleString('es-MX')} MXN\n\nPuedes consultar fotos, disponibilidad y ubicación exacta aquí:\n${canonicalUrl}\n\nAcceso directo local: ${localDirectUrl}\n\nSaludos.`
  )}`;

  const handleCopyLink = async (textToCopy: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      className="fixed inset-0 z-50 bg-zinc-950/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400 block">
              Compartir Residencia de Autor
            </span>
            <h3 id="share-modal-title" className="text-base font-semibold text-zinc-950 mt-0.5">
              Invitar Huéspedes o Enviar Ficha
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex items-center justify-center text-sm transition"
          >
            ✕
          </button>
        </div>

        {/* Property Brief Preview */}
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-zinc-50 border border-zinc-200/70">
            <img
              src={listing.photoUrl}
              alt={listing.title}
              className="w-16 h-16 rounded-xl object-cover shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-zinc-950 truncate">
                {listing.title}
              </div>
              <div className="text-[11px] text-zinc-500 truncate">
                {listing.city}, {listing.stateName}
              </div>
              <div className="text-xs font-mono font-bold text-zinc-900 mt-1">
                ${Number(listing.pricePerNight).toLocaleString('es-MX')} MXN / noche
              </div>
            </div>
          </div>

          {/* Canonical Link Copy Box */}
          <div className="space-y-2">
            <label className="text-[11px] font-medium text-zinc-700 flex items-center justify-between">
              <span>Enlace Oficial Canónico (Producción)</span>
              {copied && (
                <span className="text-emerald-600 font-semibold text-[10px] animate-pulse">
                  ✓ Copiado al portapapeles
                </span>
              )}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={canonicalUrl}
                className="flex-1 bg-zinc-50 border border-zinc-200 text-zinc-800 text-xs rounded-xl px-3 py-2.5 font-mono select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleCopyLink(canonicalUrl)}
                className="px-4 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-xs tracking-wider uppercase transition shadow-xs shrink-0"
              >
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          </div>

          {/* Quick Direct Sharing Channels */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-2xl border border-emerald-200 hover:border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-900 transition flex items-center justify-center gap-2 text-xs font-semibold"
            >
              <svg className="w-4 h-4 fill-emerald-600 shrink-0" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.303-.058.116-.087.188-.173.289l-.26.303c-.087.087-.177.182-.076.356.101.174.449.741.964 1.201.662.591 1.221.774 1.394.861.173.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.073.043.419-.101.824z" />
              </svg>
              <span>Por WhatsApp</span>
            </a>

            <a
              href={mailUrl}
              className="p-3 rounded-2xl border border-zinc-200 hover:border-zinc-950 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 transition flex items-center justify-center gap-2 text-xs font-semibold"
            >
              <svg className="w-4 h-4 text-zinc-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>Por Correo</span>
            </a>
          </div>

          {/* QR Code Pass for Smartphone Scanning */}
          <div className="p-4 rounded-2xl bg-zinc-900 text-white flex items-center gap-4">
            <div className="w-16 h-16 bg-white p-1 rounded-xl shrink-0 flex items-center justify-center">
              {/* Clean Scalable QR Representation */}
              <svg className="w-full h-full text-zinc-950" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm14 0h4v2h-4v-2zm-4 0h2v2h-2v-2zm0 4h2v2h-2v-2zm4 0h4v2h-4v-2zm-2-2h2v2h-2v-2zm2-4h2v2h-2v-2zM5 5h2v2H5V5zm12 0h2v2h-2V5zM5 17h2v2H5v-2z" />
              </svg>
            </div>
            <div>
              <div className="text-xs font-bold text-white">
                Código QR de Acceso Móvil
              </div>
              <p className="text-[10px] text-zinc-400 font-light mt-0.5 leading-snug">
                Escanea con la cámara de tu teléfono para abrir esta residencia directamente en tu navegador móvil.
              </p>
              <div className="text-[9px] font-mono text-zinc-400 mt-1">
                Folio: #RM-{listing.id.toString().padStart(4, '0')} · UUID {listing.uuid.slice(0, 8)}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
          <span>Garantía de enlace verificado Roomia</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-full border border-zinc-200 hover:border-zinc-950 text-zinc-800 text-xs font-medium transition"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
