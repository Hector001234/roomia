import React, { useState } from 'react';
import { Link } from 'react-router-dom';

type LegalTab = 'privacy' | 'terms' | 'pci' | 'guarantee';

export const LegalNoticePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<LegalTab>('privacy');

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="border-b border-zinc-200/80 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-zinc-400 block">
            Marco Legal & Cumplimiento Normativo
          </span>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-zinc-950 mt-1">
            Centro de Transparencia & Regulaciones
          </h1>
          <p className="text-xs text-zinc-500 font-light mt-1">
            Operadora Residencial Roomia S.A.P.I. de C.V. · RFC: ORR260315AA1 · RNT: 34098214
          </p>
        </div>

        <Link
          to="/"
          className="text-xs text-zinc-600 hover:text-zinc-950 transition font-medium self-start md:self-auto"
        >
          ← Volver a Explorar Residencias
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-3 text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('privacy')}
          className={`px-4 py-2 rounded-xl transition ${
            activeTab === 'privacy'
              ? 'bg-zinc-950 text-white shadow-xs'
              : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
          }`}
        >
          Aviso de Privacidad (LFPDPPP)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('terms')}
          className={`px-4 py-2 rounded-xl transition ${
            activeTab === 'terms'
              ? 'bg-zinc-950 text-white shadow-xs'
              : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
          }`}
        >
          Términos de Hospitalidad
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pci')}
          className={`px-4 py-2 rounded-xl transition ${
            activeTab === 'pci'
              ? 'bg-zinc-950 text-white shadow-xs'
              : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
          }`}
        >
          Seguridad PCI-DSS 4.0
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('guarantee')}
          className={`px-4 py-2 rounded-xl transition ${
            activeTab === 'guarantee'
              ? 'bg-zinc-950 text-white shadow-xs'
              : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
          }`}
        >
          Garantía & SAT
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-3xl border border-zinc-200/80 p-8 shadow-xs text-zinc-700 leading-relaxed space-y-6">
        {activeTab === 'privacy' && (
          <div className="space-y-5 animate-in fade-in">
            <h2 className="text-lg font-semibold text-zinc-950 border-b border-zinc-100 pb-3">
              Aviso de Privacidad Integral conforme a la LFPDPPP
            </h2>
            <p className="text-xs text-zinc-600">
              En estricto cumplimiento con lo dispuesto por la <strong>Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)</strong> y su Reglamento, <strong>OPERADORA RESIDENCIAL ROOMIA S.A.P.I. DE C.V.</strong>, con domicilio fiscal en Paseo Tollocan #1205, Colonia Universidad, Metepec, Estado de México, C.P. 52140, es la entidad responsable del tratamiento legítimo, controlado e informado de sus datos personales.
            </p>

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                1. Finalidades Primarias del Tratamiento
              </h3>
              <ul className="text-xs list-disc list-inside space-y-1 text-zinc-600">
                <li>Gestión, procesamiento y validación transaccional de solicitudes de reserva temporal.</li>
                <li>Verificación de identidad del huésped y del anfitrión ante registros públicos y SAT.</li>
                <li>Generación de códigos criptográficos para cerraduras inteligentes IoT asociadas al inmueble.</li>
                <li>Emisión de Comprobantes Fiscales Digitales por Internet (CFDI 4.0) deducibles.</li>
                <li>Registro en bitácora de auditoría inmutable mediante hash SHA-256 según ISO/IEC 25010.</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                2. Ejercicio de Derechos ARCO (Acceso, Rectificación, Cancelación y Oposición)
              </h3>
              <p className="text-xs text-zinc-600">
                Usted tiene derecho a conocer qué datos personales tenemos de usted, para qué los utilizamos y las condiciones del uso que les damos (Acceso). Asimismo, es su derecho solicitar la corrección de su información (Rectificación), que la eliminemos de nuestros registros (Cancelación), o bien oponerse al uso de sus datos para fines específicos (Oposición). Para ejercer cualquiera de sus derechos ARCO, envíe una solicitud firmada a:
              </p>
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs font-mono">
                privacidad@roomia.mx · Asunto: Ejercicio de Derechos ARCO - LFPDPPP
              </div>
            </div>
          </div>
        )}

        {activeTab === 'terms' && (
          <div className="space-y-5 animate-in fade-in">
            <h2 className="text-lg font-semibold text-zinc-950 border-b border-zinc-100 pb-3">
              Términos y Condiciones del Servicio de Hospitalidad de Autor
            </h2>
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                1. Naturaleza del Contrato de Hospedaje Temporal
              </h3>
              <p className="text-xs text-zinc-600">
                La formalización de una reserva en Roomia constituye un contrato civil de hospedaje turístico y temporal, sin que en ningún momento se configure arrendamiento inmobiliario tradicional o derechos posesorios sobre las residencias ofertadas.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                2. Política de Cancelación y Reembolsos
              </h3>
              <p className="text-xs text-zinc-600">
                Cancelaciones realizadas con más de 48 horas de anticipación a la fecha de check-in son reembolsables al 100% en el mismo método de pago original. Cancelaciones posteriores a dicho periodo conllevan una penalización del 50% de la primera noche para compensación del anfitrión exclusivo.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                3. Convivencia y Cuidado del Entorno Arquitectónico
              </h3>
              <p className="text-xs text-zinc-600">
                Las residencias catalogadas en Roomia son obras arquitectónicas de autor. Queda estrictamente prohibida la realización de fiestas no autorizadas, uso pirotécnico o actividades que vulneren la integridad del patrimonio estructural y ecológico.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'pci' && (
          <div className="space-y-5 animate-in fade-in">
            <h2 className="text-lg font-semibold text-zinc-950 border-b border-zinc-100 pb-3">
              Estándar de Seguridad PCI-DSS 4.0 y Cifrado Transaccional
            </h2>
            <p className="text-xs text-zinc-600">
              Roomia opera bajo la certificación y directrices del estándar <strong>PCI-DSS 4.0 (Payment Card Industry Data Security Standard)</strong> en modalidad SAQ-A.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1">
                <div className="text-xs font-bold text-zinc-950">Zero-Storage PAN</div>
                <p className="text-[11px] text-zinc-500">
                  Ningún número de tarjeta (PAN) ni código de seguridad CVV toca o se almacena en las bases de datos de Roomia.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1">
                <div className="text-xs font-bold text-zinc-950">Tokenización Cifrada</div>
                <p className="text-[11px] text-zinc-500">
                  Todo pago es procesado mediante bóvedas de tokenización segura con algoritmos AES-256 y autenticación bancaria 3D Secure 2.0.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1">
                <div className="text-xs font-bold text-zinc-950">TLS 1.3 End-to-End</div>
                <p className="text-[11px] text-zinc-500">
                  Todas las transferencias de datos en tránsito están forzadas sobre protocolos seguros con encabezados HSTS y X-Frame-Options.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'guarantee' && (
          <div className="space-y-5 animate-in fade-in">
            <h2 className="text-lg font-semibold text-zinc-950 border-b border-zinc-100 pb-3">
              Garantía de Huésped y Validación SAT de Anfitriones
            </h2>
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                1. Validación Fiscal SAT de Anfitriones
              </h3>
              <p className="text-xs text-zinc-600">
                Cada anfitrión en Roomia pasa por un proceso de cotejo de RFC contra la lista 69-B del SAT para descartar empresas fantasma, validando constancia de situación fiscal vigente y titularidad legal del inmueble ofrecido.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                2. Garantía Anti-Sobreventa Criptográfica
              </h3>
              <p className="text-xs text-zinc-600">
                El motor de base de datos de Roomia ejecuta bloqueos pesimistas a nivel de fila (<code>SELECT ... FOR UPDATE</code>). Una vez confirmada tu reserva, las fechas quedan físicamente bloqueadas en el motor transaccional, imposibilitando la doble reserva matemática de la misma residencia.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900 text-white flex items-center justify-between">
              <div>
                <div className="text-xs font-bold">Cobertura Integral Roomia Care</div>
                <p className="text-[11px] text-zinc-400 font-light mt-0.5">
                  Protección respaldada por hasta $1,000,000 MXN en daños o reubicación inmediata en caso de contingencia.
                </p>
              </div>
              <span className="px-3 py-1 bg-white text-zinc-950 font-mono text-[10px] font-bold rounded-full">
                ACTIVA
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Corporate Metadata Footer */}
      <div className="p-6 rounded-3xl bg-zinc-100 text-xs text-zinc-500 space-y-2 border border-zinc-200">
        <div className="font-semibold text-zinc-900">
          OPERADORA RESIDENCIAL ROOMIA S.A.P.I. DE C.V.
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px]">
          <div>RFC: ORR260315AA1</div>
          <div>RNT Turístico: 34098214</div>
          <div>Sede: Metepec, Edomex</div>
        </div>
      </div>
    </div>
  );
};
