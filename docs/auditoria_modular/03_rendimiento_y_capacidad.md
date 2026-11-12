# Entrega 03: Rendimiento y Capacidad (REN)

---

## 1. Portada y Trazabilidad

**Proyecto Auditado:** Roomia — Plataforma de Reservas y Gestión Residencial  
**Módulo:** 03 — Rendimiento y Capacidad (ISO/IEC 25010 Eficiencia de Desempeño)  
**Estado del Dictamen:** Con Hallazgos de Bloqueo de Event Loop y Riesgo de Agotamiento de Memoria  
**Fecha de Ejecución:** 2026-11-12  

### Resumen Ejecutivo
La evaluación de capacidad y eficiencia de código muestra un contraste marcado entre las capas frontend y el motor backend Node.js. Ambos portales React (`frontend` y `frontend-admin`) compilan hacia paquetes optimizados menores a 105 KB comprimidos en gzip, mientras la API implementa paginación acotada (`limit <= 50` / `100`) y limitación de tasa en memoria. Sin embargo, el servidor HTTP Node.js (`backend/server.mjs`) carece de límite de tamaño de cuerpo (`Content-Length` / stream cap), y `backend/apiEngine.mjs` ejecuta operaciones de lectura y escritura síncronas en disco (`fs.readFileSync` / `fs.writeFileSync`) en cada petición, bloqueando el *Event Loop* bajo concurrencia.

### Distribución por Severidad

| Severidad | Cantidad | Porcentaje | IDs Asociados |
| :--- | :---: | :---: | :--- |
| **Crítica** | 0 | 0.0% | — |
| **Alta** | 2 | 100.0% | `REN-01`, `REN-02` |
| **Media** | 0 | 0.0% | — |
| **Baja** | 0 | 0.0% | — |
| **Total** | **2** | **100%** | — |

### Metadatos del Commit Auditado e Inventario

| Atributo | Valor Observable |
| :--- | :--- |
| **Commit Hash (HEAD)** | `f17a5f0afb2fb8b16560c33363fcb9710d4a77d3` |
| **Fecha del Commit** | `2026-11-10 22:42:29 -0600` |
| **Archivos Auditados** | `136` archivos (`backend`: 4,369 LOC \| `frontend`: 14,235 LOC \| `frontend-admin`: 3,778 LOC) |

---

## 2. Método y Límites

### Herramientas y Técnicas Aplicadas
- Inspección de complejidad algorítmica, operaciones de E/S en `backend/server.mjs` y `backend/apiEngine.mjs`, y análisis de tamaño de compilación mediante `vite build`.
- Ejecución de fixtures locales `T05` y `T08` (`scripts/run_fixture_tests.mjs`) para contabilizar llamadas bloqueantes y verificar ausencia de límites de payload.

### Alcance y Exclusiones (No Evaluado / N/M)
- **No evaluado:** Pruebas de estrés reales con `k6` (`scripts/k6-search-load-test.js`), latencia p95/p99 de red, throughput en RPS bajo infraestructura de producción, ni consumo de memoria de PostgreSQL 16 en vivo (`N/M`).

---

## 3. Tabla de Controles Revisados

| Control de Rendimiento | Estándar / Referencia | Evaluación | Observación Verificada |
| :--- | :--- | :---: | :--- |
| Límite de tamaño de carga útil HTTP (Body Limit) | OWASP API4:2023 | **Falla** | `server.mjs:17-20` acumula chunks en memoria sin tope máximo. |
| E/S No Bloqueante en el Event Loop | Node.js Best Practices | **Falla** | `apiEngine.mjs` ejecuta `readFileSync` y `writeFileSync` por petición. |
| Paginación acotada en colecciones | OWASP API4:2023 | **Cumple** | Tope de 50 items en `/listings` (`apiEngine.mjs:316`) y 100 en `/audit`. |
| Limitación de tasa (Rate Limiting) | OWASP API4:2023 | **Parcial** | Activo en memoria (90 req/60s), pero no distribuido ni con limpieza de `Map`. |
| Optimización de empaquetado Frontend | Web Vitals / Vite | **Cumple** | Bundle público `101.10 kB` gzip; Admin `80.46 kB` gzip. |
| Latencia p95 y RPS bajo carga real (`k6`) | ISO/IEC 25010 | **No evaluado** | No medido en entorno productivo (`N/M`). |

---

## 4. Matriz de Hallazgos

| ID | Severidad | Título | Responsable |
| :--- | :---: | :--- | :--- |
| `REN-01` | **Alta** | Ausencia de límite de tamaño de cuerpo HTTP (`Payload Too Large`) en `backend/server.mjs` | Backend Lead |
| `REN-02` | **Alta** | Bloqueo síncrono del Event Loop por lectura/escritura en disco (`readFileSync`/`writeFileSync`) en cada petición | Backend Lead |

---

## 5. Fichas Individuales de Hallazgo

### REN-01: Ausencia de límite de tamaño de cuerpo HTTP (`Payload Too Large`) en `backend/server.mjs`

- **Metadatos:** Severidad: **Alta** | Estado: **Abierto** | Responsable: **Backend Lead** | Esfuerzo orientativo: **0.5 días**
- **Ubicación:** `backend/server.mjs:17-28`
- **Causa y condición:**  
  El servidor HTTP nativo lee fragmentos entrantes (`req.on('data')`) acumulándolos en un arreglo sin verificar `Content-Length` ni contabilizar el total de bytes recibidos para cortar la conexión si supera un umbral razonable (ej. 1 MB):
  ```javascript
  // backend/server.mjs:17-21
  const chunks = [];
  req.on('data', (chunk) => chunks.push(chunk));
  req.on('end', () => {
    const rawBody = Buffer.concat(chunks).toString('utf8');
  ```
- **Impacto real y delimitado:**  
  Un cliente puede enviar cargas JSON de cientos de megabytes en una sola petición `POST`, provocando incremento descontrolado del heap de V8 y caída del proceso Node.js por error *Out-Of-Memory* (DoS).
- **Evidencia y alcance de la prueba:**  
  Prueba estática `T05` (`evidencias/fixtures_test_evidence.json`): Confirmó `bodySizeLimitPresent: false` en `backend/server.mjs`.
- **Corrección propuesta:**  
  Implementar un contador acumulado de bytes dentro de `req.on('data')`; al superar `1_048_576` bytes (1 MB), responder inmediatamente con `HTTP 413 Payload Too Large` y destruir el stream (`req.destroy()`).
- **Criterio verificable de cierre:**  
  `Petición POST con cuerpo > 1 MB retorna HTTP 413 y no asigna buffers completos en memoria`.
- **Clasificación:** CWE-400 (Uncontrolled Resource Consumption) / CWE-770 — [OWASP API4:2023 Unrestricted Resource Consumption](https://owasp.org/API-Security/editions/2023/en/0xa4-unrestricted-resource-consumption/)

---

### REN-02: Bloqueo síncrono del Event Loop por lectura/escritura en disco en cada petición

- **Metadatos:** Severidad: **Alta** | Estado: **Abierto** | Responsable: **Backend Lead** | Esfuerzo orientativo: **2.0 días**
- **Ubicación:** `backend/apiEngine.mjs:171-191`, `312`
- **Causa y condición:**  
  La función `handleApiRequest()` invoca `loadState()` al inicio de cada petición (incluso en lecturas `GET`), lo cual ejecuta `fs.readFileSync` y `JSON.parse` de forma síncrona. Adicionalmente, cada mutación llama a `saveState()` con `fs.writeFileSync` y formato indentado (`JSON.stringify(state, null, 2)`):
  ```javascript
  // backend/apiEngine.mjs:173-175, 190
  if (fs.existsSync(STATE_FILE)) {
    const raw = fs.readFileSync(STATE_FILE, 'utf8');
    return JSON.parse(raw);
  }
  ...
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  ```
- **Impacto real y delimitado:**  
  Debido a la naturaleza monohilo de Node.js, todas las peticiones concurrentes quedan encoladas esperando que finalice la E/S de disco y el serializado JSON completo de la base de datos. Conforme crezca `roomia_live_state.json`, la latencia escalará linealmente hasta saturar el servidor.
- **Evidencia y alcance de la prueba:**  
  Prueba estática `T08` (`evidencias/fixtures_test_evidence.json`): Verificó presencia directa de `fs.readFileSync` y `fs.writeFileSync` en la ruta crítica de despacho.
- **Corrección propuesta:**  
  Conectar el motor API directamente al pool de conexiones asíncrono de PostgreSQL (`pg` / `PostgresConnection`) utilizando consultas indexadas y `SELECT ... FOR UPDATE`, eliminando la persistencia en archivo plano JSON.
- **Criterio verificable de cierre:**  
  `Cero invocaciones a readFileSync/writeFileSync en el ciclo de manejo de peticiones HTTP; consultas servidas vía pool asíncrono`.
- **Clasificación:** CWE-400 (Uncontrolled Resource Consumption) — [Node.js Don't Block the Event Loop](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop)

---

## 6. Validación Realizada y Pendiente

| Validación | Alcance | Resultado Observado | Evidencia |
| :--- | :--- | :--- | :--- |
| Build de Producción Frontend (`vite build`) | `frontend/` | **Exitoso (357.06 kB / 101.10 kB gzip)** | `evidencias/audit_execution_evidence.json` |
| Build de Producción Admin (`vite build`) | `frontend-admin/` | **Exitoso (265.98 kB / 80.46 kB gzip)** | `evidencias/audit_execution_evidence.json` |
| Pruebas de Capacidad y Carga (`k6`) | `scripts/k6-search-load-test.js` | **Pendiente (`N/M`)** | Requiere entorno dedicado de staging |

---

## 7. Plan de Corrección y Cierre

| Prioridad | ID | Acción Requerida | Responsable | Esfuerzo |
| :--- | :---: | :--- | :--- | :---: |
| **1 (Alta)** | `REN-01` | Agregar límite estricto de `Content-Length` / stream bytes (`413 Payload Too Large`). | Backend Lead | 0.5 d |
| **2 (Alta)** | `REN-02` | Reemplazar `roomia_live_state.json` síncrono por pool asíncrono PostgreSQL 16. | Backend / DBA | 2.0 d |

---

## 8. Referencias Técnicas Oficiales
- Node.js Official Guides — Don't Block the Event Loop: https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop
- OWASP API Security Top 10 (2023) — API4:2023 Unrestricted Resource Consumption.
- PostgreSQL 16 Documentation — Explicit Locking (`SELECT ... FOR UPDATE`): https://www.postgresql.org/docs/16/explicit-locking.html
