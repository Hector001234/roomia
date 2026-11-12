import os
import subprocess

EDGE_EXE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
OUT_DIR = r"C:\Users\Hector\Documents\7mo\Auditorias\roomia"
PDF_PATH = os.path.join(OUT_DIR, "Presentacion_Roomia_Auditoria.pdf")
HTML_PATH = os.path.join(OUT_DIR, "temp_presentacion.html")

HTML_CONTENT = """<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Roomia Platform — Presentación del Proyecto</title>
<style>
  @page {
    size: 13.333in 7.5in;
    margin: 0;
  }
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #09090b;
    background: #ffffff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .slide {
    width: 13.333in;
    height: 7.5in;
    padding: 0.65in 0.85in;
    page-break-after: always;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: #ffffff;
    overflow: hidden;
  }
  .slide:last-child {
    page-break-after: auto;
  }
  .slide-dark {
    background: #09090b;
    color: #ffffff;
  }
  .top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #e4e4e7;
    padding-bottom: 14px;
    font-size: 10pt;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #71717a;
    font-weight: 600;
  }
  .slide-dark .top-bar {
    border-bottom-color: #27272a;
    color: #a1a1aa;
  }
  .bottom-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #e4e4e7;
    padding-top: 12px;
    font-size: 9pt;
    color: #71717a;
  }
  .slide-dark .bottom-bar {
    border-top-color: #27272a;
    color: #a1a1aa;
  }
  .tag {
    display: inline-block;
    padding: 4px 12px;
    border: 1px solid #27272a;
    border-radius: 999px;
    font-size: 9pt;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 20px;
  }
  .slide-dark .tag {
    border-color: #3f3f46;
    color: #e4e4e7;
  }
  h1 {
    font-size: 46pt;
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.08;
    margin-bottom: 18px;
  }
  h2 {
    font-size: 25pt;
    font-weight: 800;
    letter-spacing: -0.02em;
    margin-bottom: 22px;
    color: #09090b;
  }
  .subtitle {
    font-size: 16pt;
    color: #a1a1aa;
    font-weight: 400;
    max-width: 85%;
    line-height: 1.45;
  }
  .cover-grid {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: 40px;
    margin-top: 32px;
    padding-top: 28px;
    border-top: 1px solid #27272a;
  }
  .meta-label {
    font-size: 8.5pt;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: #71717a;
    margin-bottom: 4px;
    font-weight: 700;
  }
  .meta-val {
    font-size: 12.5pt;
    color: #f4f4f5;
    font-weight: 500;
    margin-bottom: 14px;
  }
  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 28px;
    flex: 1;
    align-content: center;
  }
  .grid-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 22px;
    flex: 1;
    align-content: center;
  }
  .card {
    border: 1px solid #e4e4e7;
    border-radius: 14px;
    padding: 24px 26px;
    background: #fafafa;
  }
  .card-dark {
    border: 1px solid #18181b;
    border-radius: 14px;
    padding: 24px 26px;
    background: #09090b;
    color: #ffffff;
  }
  .card-title {
    font-size: 13pt;
    font-weight: 700;
    margin-bottom: 10px;
    letter-spacing: -0.01em;
  }
  .card p, .card li {
    font-size: 10.8pt;
    line-height: 1.5;
    color: #3f3f46;
  }
  .card-dark p, .card-dark li {
    font-size: 10.8pt;
    line-height: 1.5;
    color: #d4d4d8;
  }
  ul {
    padding-left: 18px;
  }
  li {
    margin-bottom: 7px;
  }
  .step-num {
    font-size: 28pt;
    font-weight: 800;
    color: #18181b;
    letter-spacing: -0.03em;
    margin-bottom: 8px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 10.2pt;
    margin-top: 6px;
  }
  th {
    background: #09090b;
    color: #ffffff;
    text-align: left;
    padding: 11px 14px;
    font-weight: 700;
    font-size: 9.2pt;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  td {
    padding: 10px 14px;
    border-bottom: 1px solid #e4e4e7;
    color: #18181b;
  }
  tr:nth-child(even) td {
    background: #fafafa;
  }
  .pill {
    display: inline-block;
    padding: 2px 9px;
    border-radius: 999px;
    font-size: 8.2pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .pill-ok { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
  .pill-bad { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
  .mono { font-family: Consolas, monospace; font-size: 9.5pt; }
</style>
</head>
<body>

<!-- SLIDE 1: PORTADA -->
<div class="slide slide-dark">
  <div class="top-bar">
    <span>Ingeniería en Software · Grupo SW</span>
    <span>12 de noviembre de 2026</span>
  </div>
  <div>
    <div class="tag">Auditorías de Sistemas · Exposición de Proyecto</div>
    <h1>ROOMIA</h1>
    <p class="subtitle">Plataforma de Reservas y Gestión Residencial diseñada bajo estándares de seguridad PCI-DSS 4.0, control de concurrencia y cumplimiento fiscal y legal en México.</p>
    <div class="cover-grid">
      <div>
        <div class="meta-label">Integrantes del Equipo</div>
        <div class="meta-val">
          Jesús Valdez Dominguez<br>
          Jair Resenos Serrano<br>
          Héctor Tomas Rodríguez Flores
        </div>
      </div>
      <div>
        <div class="meta-label">Unidad de Aprendizaje</div>
        <div class="meta-val">Auditorías de Sistemas</div>
        <div class="meta-label">Profesora</div>
        <div class="meta-val">MTRA. JULIETA GARCILAZO REYES</div>
      </div>
    </div>
  </div>
  <div class="bottom-bar">
    <span>Repositorio Oficial: github.com/Hector001234/roomia</span>
    <span>01 / 10</span>
  </div>
</div>

<!-- SLIDE 2: PROBLEMATICA EN APPS ACTUALES -->
<div class="slide">
  <div class="top-bar">
    <span>Roomia · Análisis del Entorno</span>
    <span>Problemática del Mercado</span>
  </div>
  <div style="flex:1; display:flex; flex-direction:column; justify-content:center;">
    <h2>Problemática en las Plataformas de Hospedaje Actuales</h2>
    <div class="grid-2">
      <div class="card">
        <div class="card-title">Fallas Operativas y de Confianza</div>
        <ul>
          <li><strong>Overbooking por concurrencia:</strong> Dos huéspedes reservan las mismas fechas simultáneamente por falta de bloqueos transaccionales en base de datos.</li>
          <li><strong>Reseñas no verificadas:</strong> Usuarios que nunca completaron una estancia pueden publicar calificaciones manipuladas.</li>
          <li><strong>Pérdida de historial:</strong> Borrados físicos (<span class="mono">DELETE</span>) que eliminan registros financieros y de reservas pasadas.</li>
        </ul>
      </div>
      <div class="card-dark">
        <div class="card-title">Riesgos de Seguridad y Cumplimiento</div>
        <ul>
          <li><strong>Exposición de tarjetas:</strong> Almacenamiento inadecuado de números completos (PAN/CVV) fuera de norma PCI-DSS.</li>
          <li><strong>Backoffice expuesto:</strong> Paneles administrativos (<span class="mono">/admin</span>) accesibles dentro del mismo portal público.</li>
          <li><strong>Vacío fiscal y legal:</strong> Carencia de facturación inmediata <strong>SAT CFDI 4.0</strong> y falta de aviso de privacidad <strong>LFPDPPP / ARCO</strong>.</li>
        </ul>
      </div>
    </div>
  </div>
  <div class="bottom-bar">
    <span>Diagnóstico base para la arquitectura de Roomia</span>
    <span>02 / 10</span>
  </div>
</div>

<!-- SLIDE 3: QUE OFRECE ROOMIA DIFERENTE -->
<div class="slide">
  <div class="top-bar">
    <span>Roomia · Propuesta de Valor</span>
    <span>Diferenciadores Clave</span>
  </div>
  <div style="flex:1; display:flex; flex-direction:column; justify-content:center;">
    <h2>¿Qué ofrece Roomia a diferencia de otras aplicaciones?</h2>
    <div class="grid-3">
      <div class="card">
        <div class="meta-label">01 · Segregación Física</div>
        <div class="card-title">Portales Independientes</div>
        <p>El portal de huéspedes (<span class="mono">:5174</span>) y el backoffice administrativo (<span class="mono">:5175</span>) operan en aplicaciones y puertos separados. Un usuario normal nunca accede a rutas administrativas.</p>
      </div>
      <div class="card">
        <div class="meta-label">02 · Cero Overbooking</div>
        <div class="card-title">Bloqueo Pesimista por Fecha</div>
        <p>Bloqueo atómico de fechas (<span class="mono">SELECT ... FOR UPDATE</span>) que rechaza reservas simultáneas con <span class="mono">HTTP 409 Conflict</span> y libera disponibilidad si el pago declina.</p>
      </div>
      <div class="card">
        <div class="meta-label">03 · Trazabilidad Forense</div>
        <div class="card-title">Cadena Inmutable SHA-256</div>
        <p>Cada alta, baja lógica, reserva o pago genera un registro encadenado con el hash criptográfico anterior, garantizando integridad total.</p>
      </div>
    </div>
  </div>
  <div class="bottom-bar">
    <span>Arquitectura orientada a confiabilidad, transparencia y control</span>
    <span>03 / 10</span>
  </div>
</div>

<!-- SLIDE 4: COMPARATIVA ROOMIA VS APPS TRADICIONALES -->
<div class="slide">
  <div class="top-bar">
    <span>Roomia · Ventaja Competitiva</span>
    <span>Comparativa Funcional</span>
  </div>
  <div style="flex:1; display:flex; flex-direction:column; justify-content:center;">
    <h2>Roomia frente a Plataformas Tradicionales</h2>
    <table>
      <thead>
        <tr>
          <th>Criterio</th>
          <th>Plataformas Convencionales</th>
          <th>Roomia Platform</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Control de Doble Reserva</strong></td>
          <td><span class="pill pill-bad">Validación tardía</span></td>
          <td><span class="pill pill-ok">Bloqueo pesimista HTTP 409</span></td>
        </tr>
        <tr>
          <td><strong>Seguridad de Tarjetas</strong></td>
          <td><span class="pill pill-bad">Captura directa sin tokenización</span></td>
          <td><span class="pill pill-ok">Zero-PAN (PCI-DSS 4.0 SAQ-A)</span></td>
        </tr>
        <tr>
          <td><strong>Autenticidad de Reseñas</strong></td>
          <td><span class="pill pill-bad">Abierta o moderación manual</span></td>
          <td><span class="pill pill-ok">Solo estancias COMPLETED</span></td>
        </tr>
        <tr>
          <td><strong>Facturación Fiscal (México)</strong></td>
          <td><span class="pill pill-bad">Trámite externo lento</span></td>
          <td><span class="pill pill-ok">CFDI 4.0 XML/PDF en 1 clic</span></td>
        </tr>
        <tr>
          <td><strong>Bajas de Propiedades</strong></td>
          <td><span class="pill pill-bad">Borrado físico destructivo</span></td>
          <td><span class="pill pill-ok">Baja lógica (deleted_at) reversible</span></td>
        </tr>
        <tr>
          <td><strong>Aislamiento Administrativo</strong></td>
          <td><span class="pill pill-bad">Misma app (/admin expuesto)</span></td>
          <td><span class="pill pill-ok">App y puerto dedicado (:5175)</span></td>
        </tr>
      </tbody>
    </table>
  </div>
  <div class="bottom-bar">
    <span>Diferenciación técnica y de negocio verificable</span>
    <span>04 / 10</span>
  </div>
</div>

<!-- SLIDE 5: GEORREFERENCIACION Y EXPERIENCIA -->
<div class="slide">
  <div class="top-bar">
    <span>Roomia · Experiencia del Huésped</span>
    <span>Mapas y Movilidad</span>
  </div>
  <div style="flex:1; display:flex; flex-direction:column; justify-content:center;">
    <h2>Georreferenciación Real y Movilidad Integrada</h2>
    <div class="grid-2">
      <div class="card">
        <div class="card-title">Cartografía Abierta sin Restricciones</div>
        <ul>
          <li><strong>Vista Calles y Satélite HD:</strong> Integración con <strong>OpenStreetMap</strong> y <strong>Esri World Imagery</strong> sin API keys ni marcas de agua.</li>
          <li><strong>Pines de Tarifa en Tiempo Real:</strong> Visualización de todas las propiedades activas con ubicación exacta y precio por noche.</li>
          <li><strong>Rutas Directas:</strong> Botones de apertura inmediata hacia <strong>Google Maps</strong> y <strong>Waze</strong> con coordenadas pre-cargadas.</li>
        </ul>
      </div>
      <div class="card">
        <div class="card-title">Compartir y Experiencia Minimalista</div>
        <ul>
          <li><strong>Código QR y Deep-Linking:</strong> Generación de enlace directo (<span class="mono">?residencia=ID</span>), código QR escaneable y envío formateado a WhatsApp.</li>
          <li><strong>Diseño Editorial Limpio:</strong> Interfaz sin distracciones ni saturación visual, enfocada en legibilidad y conversión.</li>
          <li><strong>Filtros Inteligentes:</strong> Búsqueda por destino, fechas disponibles, capacidad de huéspedes, categoría y presupuesto.</li>
        </ul>
      </div>
    </div>
  </div>
  <div class="bottom-bar">
    <span>Sincronización en vivo entre catálogo administrativo y mapa del huésped</span>
    <span>05 / 10</span>
  </div>
</div>

<!-- SLIDE 6: FLUJO TRANSACCIONAL Y FISCAL -->
<div class="slide">
  <div class="top-bar">
    <span>Roomia · Motor Financiero y Fiscal</span>
    <span>Reservas, Pagos y SAT</span>
  </div>
  <div style="flex:1; display:flex; flex-direction:column; justify-content:center;">
    <h2>Flujo Transaccional Seguro y Facturación CFDI 4.0</h2>
    <div class="grid-3">
      <div class="card">
        <div class="step-num">01</div>
        <div class="card-title">Cotización Exacta</div>
        <p>Cálculo financiero en centavos (<span class="mono">NUMERIC(10,2)</span>) sin errores de redondeo: tarifa base, comisión de servicio (12%), IVA (16%) e ISH (3.5%).</p>
      </div>
      <div class="card">
        <div class="step-num">02</div>
        <div class="card-title">Pago Tokenizado</div>
        <p>Integración Stripe tokenizada. Si el pago es declinado (<span class="mono">HTTP 402</span>), las fechas bloqueadas se liberan automáticamente para otros huéspedes.</p>
      </div>
      <div class="card">
        <div class="step-num">03</div>
        <div class="card-title">CFDI 4.0 &amp; Extras</div>
        <p>Emisión de factura fiscal con RFC, Régimen y Uso de CFDI (descarga XML/PDF), además de servicios Concierge y calculadora <em>Split-Bill</em>.</p>
      </div>
    </div>
  </div>
  <div class="bottom-bar">
    <span>Trazabilidad completa desde la reserva hasta la emisión del comprobante fiscal</span>
    <span>06 / 10</span>
  </div>
</div>

<!-- SLIDE 7: BASE DE DATOS RELACIONAL 3FN -->
<div class="slide">
  <div class="top-bar">
    <span>Roomia · Ingeniería de Datos</span>
    <span>Modelo Relacional 3FN</span>
  </div>
  <div style="flex:1; display:flex; flex-direction:column; justify-content:center;">
    <h2>Base de Datos Normalizada en Tercera Forma Normal (3FN)</h2>
    <div class="grid-2">
      <div class="card">
        <div class="card-title">Estructura de Entidades Principales</div>
        <ul>
          <li><span class="mono"><strong>users</strong></span>: Roles (<span class="mono">GUEST</span>, <span class="mono">HOST</span>, <span class="mono">ADMIN</span>), hash seguro y control de intentos fallidos.</li>
          <li><span class="mono"><strong>listings</strong></span>: Catálogo georreferenciado (<span class="mono">DECIMAL(10,7)</span>), tarifa y estado (<span class="mono">ACTIVE/PAUSED</span>).</li>
          <li><span class="mono"><strong>bookings &amp; booking_dates_lock</strong></span>: Índice único por fecha para impedir sobreventa.</li>
          <li><span class="mono"><strong>payments, reviews &amp; audit_logs</strong></span>: Pagos tokenizados, reseñas verificadas y bitácora SHA-256.</li>
        </ul>
      </div>
      <div class="card-dark">
        <div class="card-title">Integridad y Triggers en PostgreSQL 16</div>
        <ul>
          <li><strong>Cero borrado físico:</strong> Todas las entidades implementan <span class="mono">deleted_at TIMESTAMPTZ</span> para conservar historial y permitir reactivación.</li>
          <li><strong>Inmutabilidad a nivel motor:</strong> Triggers PL/pgSQL bloquean cualquier <span class="mono">UPDATE</span> o <span class="mono">DELETE</span> en la bitácora (<span class="mono">SQLSTATE 45000</span>).</li>
          <li><strong>Sincronización en vivo:</strong> Alta, baja lógica y reactivación desde Admin se reflejan al instante en el portal del huésped.</li>
        </ul>
      </div>
    </div>
  </div>
  <div class="bottom-bar">
    <span>Esquema SQL versionado con integridad referencial estricta</span>
    <span>07 / 10</span>
  </div>
</div>

<!-- SLIDE 8: ARQUITECTURA DE SEGURIDAD Y PRIVACIDAD -->
<div class="slide">
  <div class="top-bar">
    <span>Roomia · Ciberseguridad y Privacidad</span>
    <span>Controles Técnicos</span>
  </div>
  <div style="flex:1; display:flex; flex-direction:column; justify-content:center;">
    <h2>Capas de Seguridad y Protección de Datos</h2>
    <div class="grid-2">
      <div class="card">
        <div class="card-title">Seguridad de la Aplicación (OWASP)</div>
        <ul>
          <li><strong>Autenticación robusta:</strong> Contraseñas protegidas con <span class="mono">scrypt/Argon2id</span> y verificación en tiempo constante (<span class="mono">timingSafeEqual</span>).</li>
          <li><strong>Control de acceso RBAC:</strong> Endpoints administrativos protegidos con JWT y validación estricta de rol <span class="mono">ADMIN</span>.</li>
          <li><strong>Endurecimiento HTTP:</strong> Límite de payload de <span class="mono">1 MB</span> (<span class="mono">HTTP 413</span>), CORS por lista blanca y cabeceras anti-clickjacking.</li>
        </ul>
      </div>
      <div class="card">
        <div class="card-title">Privacidad y Cumplimiento Legal (LFPDPPP)</div>
        <ul>
          <li><strong>Sesiones seguras:</strong> Tokens JWT mantenidos exclusivamente en memoria volátil sin exposición en <span class="mono">localStorage</span>.</li>
          <li><strong>Minimización de datos:</strong> El catálogo público omite información privada de reservas de otros usuarios.</li>
          <li><strong>Transparencia ARCO:</strong> Sección legal dedicada con derechos ARCO, políticas de cancelación e identidad fiscal visible.</li>
        </ul>
      </div>
    </div>
  </div>
  <div class="bottom-bar">
    <span>Diseño alineado a OWASP Top 10, PCI-DSS 4.0 SAQ-A y LFPDPPP</span>
    <span>08 / 10</span>
  </div>
</div>

<!-- SLIDE 9: HERRAMIENTAS Y STACK TECNOLOGICO -->
<div class="slide">
  <div class="top-bar">
    <span>Roomia · Stack Tecnológico</span>
    <span>Herramientas de Desarrollo</span>
  </div>
  <div style="flex:1; display:flex; flex-direction:column; justify-content:center;">
    <h2>Herramientas Empleadas en el Proyecto</h2>
    <div class="grid-3">
      <div class="card">
        <div class="card-title">Frontend y Cartografía</div>
        <ul>
          <li><strong>React 18 + TypeScript:</strong> Tipado estricto y arquitectura modular.</li>
          <li><strong>Vite + Tailwind CSS:</strong> Compilación rápida e interfaz minimalista responsiva.</li>
          <li><strong>Leaflet + OpenStreetMap:</strong> Renderizado geográfico interactivo.</li>
        </ul>
      </div>
      <div class="card">
        <div class="card-title">Backend y Datos</div>
        <ul>
          <li><strong>Node.js ESM + PHP PSR-4:</strong> API REST versionada (<span class="mono">/api/v1</span>).</li>
          <li><strong>PostgreSQL 16:</strong> Modelado 3FN, triggers PL/pgSQL y bloqueos concurrentes.</li>
          <li><strong>Módulo <span class="mono">crypto</span>:</strong> HMAC-SHA256, JWT y escrituras atómicas en disco.</li>
        </ul>
      </div>
      <div class="card">
        <div class="card-title">Calidad y Control</div>
        <ul>
          <li><strong>Suite de 14 Pruebas:</strong> Validación automática de reglas de negocio y seguridad.</li>
          <li><strong>ESLint + <span class="mono">tsc</span> + <span class="mono">npm audit</span>:</strong> Código limpio y cero vulnerabilidades en dependencias.</li>
          <li><strong>Git / GitHub:</strong> Control de versiones colaborativo.</li>
        </ul>
      </div>
    </div>
  </div>
  <div class="bottom-bar">
    <span>136 archivos fuente organizados y verificados sin errores de compilación</span>
    <span>09 / 10</span>
  </div>
</div>

<!-- SLIDE 10: DEMO EN VIVO Y CIERRE -->
<div class="slide slide-dark">
  <div class="top-bar">
    <span>Ingeniería en Software · Auditorías de Sistemas</span>
    <span>Grupo SW</span>
  </div>
  <div style="margin:auto 0;">
    <div class="tag">Demostración en Vivo</div>
    <h1>ROOMIA PLATFORM</h1>
    <p class="subtitle">Portal Público (<span class="mono">:5174</span>) · Backoffice Administrativo (<span class="mono">:5175</span>) · API REST (<span class="mono">:8000</span>)</p>
    <div style="margin-top:36px; display:flex; gap:48px;">
      <div>
        <div class="meta-label">Repositorio Oficial</div>
        <div class="meta-val mono">github.com/Hector001234/roomia</div>
      </div>
      <div>
        <div class="meta-label">Profesora</div>
        <div class="meta-val">MTRA. JULIETA GARCILAZO REYES</div>
      </div>
    </div>
  </div>
  <div class="bottom-bar">
    <span>Jesús Valdez Dominguez · Jair Resenos Serrano · Héctor Tomas Rodríguez Flores</span>
    <span>10 / 10</span>
  </div>
</div>

</body>
</html>
"""

with open(HTML_PATH, "w", encoding="utf-8") as f:
    f.write(HTML_CONTENT)

cmd = [
    EDGE_EXE,
    "--headless",
    "--disable-gpu",
    "--run-all-compositor-stages-before-draw",
    f"--print-to-pdf={PDF_PATH}",
    "--no-pdf-header-footer",
    HTML_PATH,
]
subprocess.run(cmd, capture_output=True)
if os.path.exists(HTML_PATH):
    os.remove(HTML_PATH)

if os.path.exists(PDF_PATH):
    print("PRESENTACION 10 SLIDES GENERADA:", PDF_PATH, round(os.path.getsize(PDF_PATH) / 1024, 1), "KB")
else:
    print("ERROR AL GENERAR PRESENTACION")
