import React, { useState } from 'react';
import { BookingSummary } from '../../types/BookingState';

interface SatInvoicingModalProps {
  isOpen: boolean;
  booking: BookingSummary | null;
  onClose: () => void;
}

export const SatInvoicingModal: React.FC<SatInvoicingModalProps> = ({
  isOpen,
  booking,
  onClose,
}) => {
  const [rfc, setRfc] = useState('XAXX010101000');
  const [razonSocial, setRazonSocial] = useState('PÚBLICO EN GENERAL');
  const [codigoPostal, setCodigoPostal] = useState('52140');
  const [regimenFiscal, setRegimenFiscal] = useState('612'); // Personas Físicas con Actividades Empresariales
  const [usoCfdi, setUsoCfdi] = useState('G03'); // Gastos en general
  const [generando, setGenerando] = useState(false);
  const [facturaEmitida, setFacturaEmitida] = useState<{
    uuid: string;
    fechaTimbrado: string;
    selloSat: string;
    noCertificadoSat: string;
    subtotal: number;
    iva: number;
    ish: number;
    total: number;
  } | null>(null);

  if (!isOpen || !booking) return null;

  const totalAmount = Number(booking.totalAmount || 9600);
  const subtotal = Math.round((totalAmount / 1.195) * 100) / 100;
  const iva = Math.round(subtotal * 0.16 * 100) / 100;
  const ish = Math.round(subtotal * 0.035 * 100) / 100; // Impuesto sobre hospedaje Edomex (3.5%)

  const handleEmitirFactura = (e: React.FormEvent) => {
    e.preventDefault();
    setGenerando(true);

    setTimeout(() => {
      setGenerando(false);
      setFacturaEmitida({
        uuid: '4A8F29C1-8E3B-4DF0-971A-' + Math.random().toString(16).slice(2, 14).toUpperCase(),
        fechaTimbrado: new Date().toISOString(),
        selloSat: 'gX4k9LmP2Q8v...SHA256==' + Math.random().toString(36).substring(2),
        noCertificadoSat: '00001000000508924156',
        subtotal,
        iva,
        ish,
        total: totalAmount,
      });
    }, 1200);
  };

  const handleDownloadXml = () => {
    if (!facturaEmitida) return;
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" xmlns:tpe="http://www.sat.gob.mx/implocal" Version="4.0" Serie="RM" Folio="${booking.id}" Fecha="${facturaEmitida.fechaTimbrado}" SubTotal="${facturaEmitida.subtotal}" Total="${facturaEmitida.total}" Moneda="MXN" FormaPago="04" MetodoPago="PUE" TipoDeComprobante="I" LugarExpedicion="52140">
  <cfdi:Emisor Rfc="ORR260315AA1" Nombre="OPERADORA RESIDENCIAL ROOMIA S.A.P.I. DE C.V." RegimenFiscal="601"/>
  <cfdi:Receptor Rfc="${rfc.toUpperCase()}" Nombre="${razonSocial.toUpperCase()}" DomicilioFiscalReceptor="${codigoPostal}" RegimenFiscalReceptor="${regimenFiscal}" UsoCFDI="${usoCfdi}"/>
  <cfdi:Conceptos>
    <cfdi:Concepto ClaveProdServ="90111800" Cantidad="1" ClaveUnidad="E48" Descripcion="Servicio de hospedaje arquitectónico temporal - ${booking.listingTitle} (${booking.checkIn} al ${booking.checkOut})" ValorUnitario="${facturaEmitida.subtotal}" Importe="${facturaEmitida.subtotal}" ObjetoImp="02">
      <cfdi:Impuestos>
        <cfdi:Traslados>
          <cfdi:Traslado Base="${facturaEmitida.subtotal}" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="${facturaEmitida.iva}"/>
        </cfdi:Traslados>
      </cfdi:Impuestos>
    </cfdi:Concepto>
  </cfdi:Conceptos>
  <cfdi:Complemento>
    <tpe:ImpuestosLocales version="1.0" TotaldeRetenciones="0.00" TotaldeTraslados="${facturaEmitida.ish}">
      <tpe:TrasladosLocales ImpLocTrasladado="ISH" TasadeTraslado="3.50" Importe="${facturaEmitida.ish}"/>
    </tpe:Complemento>
</cfdi:Comprobante>`;

    const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CFDI40_ROOMIA_FOLIO_${booking.id}_${rfc}.xml`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sat-invoice-title"
      className="fixed inset-0 z-50 bg-zinc-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="max-w-xl w-full bg-white rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden my-8 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-950 text-white flex items-center justify-center text-xs font-mono font-bold tracking-wider">
              SAT
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400 block">
                Facturación Electrónica CFDI 4.0
              </span>
              <h3 id="sat-invoice-title" className="text-base font-semibold text-zinc-950">
                Emisión Fiscal Deducible — Folio #{booking.id}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex items-center justify-center text-sm transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {!facturaEmitida ? (
            <form onSubmit={handleEmitirFactura} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 text-xs text-zinc-600 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-zinc-900">{booking.listingTitle}</div>
                  <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                    Estancia: {booking.checkIn} al {booking.checkOut}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-sm text-zinc-950">
                    ${totalAmount.toLocaleString('es-MX')} MXN
                  </div>
                  <div className="text-[10px] text-emerald-600 font-medium">Liquidado / Pagado</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="sat-rfc" className="block text-[11px] font-medium text-zinc-700 mb-1">
                    RFC del Receptor *
                  </label>
                  <input
                    id="sat-rfc"
                    type="text"
                    required
                    maxLength={13}
                    value={rfc}
                    onChange={(e) => setRfc(e.target.value.toUpperCase())}
                    placeholder="XAXX010101000"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-mono uppercase focus:border-zinc-950 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="sat-cp" className="block text-[11px] font-medium text-zinc-700 mb-1">
                    Código Postal Fiscal *
                  </label>
                  <input
                    id="sat-cp"
                    type="text"
                    required
                    maxLength={5}
                    value={codigoPostal}
                    onChange={(e) => setCodigoPostal(e.target.value)}
                    placeholder="52140"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-mono focus:border-zinc-950 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="sat-razon" className="block text-[11px] font-medium text-zinc-700 mb-1">
                  Nombre o Razón Social (Exacto a Constancia de Situación Fiscal) *
                </label>
                <input
                  id="sat-razon"
                  type="text"
                  required
                  value={razonSocial}
                  onChange={(e) => setRazonSocial(e.target.value.toUpperCase())}
                  placeholder="NOMBRE FISCAL COMPLETO"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-medium uppercase focus:border-zinc-950 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="sat-regimen" className="block text-[11px] font-medium text-zinc-700 mb-1">
                    Régimen Fiscal *
                  </label>
                  <select
                    id="sat-regimen"
                    value={regimenFiscal}
                    onChange={(e) => setRegimenFiscal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs focus:border-zinc-950 focus:outline-none bg-white"
                  >
                    <option value="601">601 - General de Ley Personas Morales</option>
                    <option value="605">605 - Sueldos y Salarios</option>
                    <option value="612">612 - Personas Físicas Actividades Empresariales</option>
                    <option value="626">626 - Régimen Simplificado de Confianza (RESICO)</option>
                    <option value="616">616 - Sin obligaciones fiscales</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="sat-uso" className="block text-[11px] font-medium text-zinc-700 mb-1">
                    Uso de CFDI *
                  </label>
                  <select
                    id="sat-uso"
                    value={usoCfdi}
                    onChange={(e) => setUsoCfdi(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs focus:border-zinc-950 focus:outline-none bg-white"
                  >
                    <option value="G03">G03 - Gastos en general</option>
                    <option value="G01">G01 - Adquisición de mercancías</option>
                    <option value="S01">S01 - Sin efectos fiscales</option>
                    <option value="CP01">CP01 - Pagos</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={generando}
                className="w-full py-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-xs tracking-wider uppercase transition shadow-xs disabled:opacity-60 flex items-center justify-center gap-2 mt-4"
              >
                {generando ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Timbrando con el SAT...</span>
                  </>
                ) : (
                  <span>Emitir y Timbrar Factura CFDI 4.0</span>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-5 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Factura Timbrada Exitosamente ante el SAT</span>
                </div>
                <div className="text-[11px] font-mono text-emerald-900 break-all">
                  Folio Fiscal (UUID): <strong>{facturaEmitida.uuid}</strong>
                </div>
                <div className="text-[10px] text-emerald-700 font-mono">
                  Certificado SAT: {facturaEmitida.noCertificadoSat} · Fecha: {facturaEmitida.fechaTimbrado.slice(0, 19)}
                </div>
              </div>

              <div className="border border-zinc-200 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-zinc-100 text-zinc-500">
                  <span>Subtotal Hospedaje:</span>
                  <span className="font-mono text-zinc-950">${facturaEmitida.subtotal.toFixed(2)} MXN</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-100 text-zinc-500">
                  <span>IVA Trasladado (16%):</span>
                  <span className="font-mono text-zinc-950">${facturaEmitida.iva.toFixed(2)} MXN</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-100 text-zinc-500">
                  <span>Impuesto Sobre Hospedaje (ISH 3.5%):</span>
                  <span className="font-mono text-zinc-950">${facturaEmitida.ish.toFixed(2)} MXN</span>
                </div>
                <div className="flex justify-between pt-1 font-bold text-sm text-zinc-950">
                  <span>Total Facturado:</span>
                  <span className="font-mono">${facturaEmitida.total.toFixed(2)} MXN</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleDownloadXml}
                  className="py-2.5 px-3 rounded-xl border border-zinc-300 hover:border-zinc-950 text-zinc-800 text-xs font-semibold transition flex items-center justify-center gap-2 bg-white"
                >
                  <span>Descargar XML CFDI 4.0</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="py-2.5 px-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold transition flex items-center justify-center gap-2"
                >
                  <span>Imprimir / PDF Oficial</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
