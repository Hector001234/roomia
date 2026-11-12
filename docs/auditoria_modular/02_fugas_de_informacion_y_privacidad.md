# Entrega 02: Fugas de Información y Privacidad (FUG)

---

## 1. Portada y Trazabilidad

**Proyecto Auditado:** Roomia — Plataforma de Reservas y Gestión Residencial  
**Módulo:** 02 — Fugas de Información y Privacidad (LFPDPPP / OWASP API3)  
**Estado del Dictamen:** Con Hallazgos de Exposición de Datos y Sesión en Navegador  
**Fecha de Ejecución:** 2026-11-12  

### Resumen Ejecutivo
El análisis del flujo de datos entre API y clientes React revela dos vectores principales de exposición de información. En el plano del servidor (`backend/apiEngine.mjs`), el endpoint público de catálogo `GET /api/v1/listings` adjunta en su respuesta el arreglo completo de reservas del sistema (`bookings`), exponiendo información transaccional a clientes no autenticados. En el plano cliente (`frontend/` y `frontend-admin/`), los tokens JWT y el perfil del usuario se persisten en `localStorage`, quedando accesibles mediante JavaScript del navegador ante un eventual fallo de XSS. Como punto positivo, el sistema anonimiza el último octeto IP (`XXX`) en bitácoras y excluye `passwordHash` mediante `toPublicUserDto`.

### Distribución por Severidad

| Severidad | Cantidad | Porcentaje | IDs Asociados |
| :--- | :---: | :---: | :--- |
| **Crítica** | 0 | 0.0% | — |
| **Alta** | 1 | 50.0% | `FUG-01` |
| **Media** | 1 | 50.0% | `FUG-02` |
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
- Inspección estática de DTOs, respuestas JSON en `backend/apiEngine.mjs`, manejo de almacenamiento en navegador (`localStorage`) en `frontend/src/context/AuthContext.tsx` y `frontend-admin/src/context/AuthContext.tsx`.
- Ejecución de fixtures locales `T03` y `T07` (`scripts/run_fixture_tests.mjs`), verificando respuestas JSON sin conexión a servicios externos ni PII real en nube.

### Alcance y Exclusiones (No Evaluado / N/M)
- **No evaluado:** Retención de logs en servicios externos (CDN, CloudWatch, proxies inversos) ni cumplimiento administrativo documental ante el INAI fuera del código fuente (`N/M`).

---

## 3. Tabla de Controles Revisados

| Control de Privacidad | Estándar / Referencia | Evaluación | Observación Verificada |
| :--- | :--- | :---: | :--- |
| Minimización de datos en catálogo público | OWASP API3:2023 | **Falla** | `GET /api/v1/listings` expone la colección global `bookings`. |
| Almacenamiento seguro de credenciales de sesión | OWASP ASVS V3.2 | **Falla** | Tokens JWT almacenados en `localStorage` en lugar de cookies `HttpOnly`. |
| Exclusión de `passwordHash` en DTOs de usuario | OWASP ASVS V2.4 | **Cumple** | `toPublicUserDto()` (`apiEngine.mjs:239-249`) filtra el hash. |
| Enmascaramiento de IP en bitácora forense | LFPDPPP / GDPR Art. 32 | **Cumple** | `appendAudit()` (`apiEngine.mjs:194-195`) enmascara el cuarto octeto (`XXX`). |
| Aislamiento de tarjeta (Zero-PAN) | PCI-DSS 4.0 SAQ-A | **Cumple** | Solo se almacenan los últimos 4 dígitos (`lastFourDigits`) e ID de intención. |

---

## 4. Matriz de Hallazgos

| ID | Severidad | Título | Responsable |
| :--- | :---: | :--- | :--- |
| `FUG-01` | **Alta** | Exposición excesiva de datos de reservas en endpoint público `GET /api/v1/listings` | Backend Lead |
| `FUG-02` | **Media** | Almacenamiento de tokens JWT y objetos de sesión en `localStorage` en ambos frontends | Frontend Lead |

---

## 5. Fichas Individuales de Hallazgo

### FUG-01: Exposición excesiva de datos de reservas en endpoint público `GET /api/v1/listings`

- **Metadatos:** Severidad: **Alta** | Estado: **Abierto** | Responsable: **Backend Lead** | Esfuerzo orientativo: **0.5 días**
- **Ubicación:** `backend/apiEngine.mjs:315-335`
- **Causa y condición:**  
  El endpoint público de listado de propiedades devuelve, además del arreglo paginado de alojamientos (`data`), la colección completa de todas las reservas activas (`bookings`), incluyendo `guestId`, fechas, totales e integridad SHA-256 sin requerir autenticación ni filtrar por usuario propietario:
  ```javascript
  // backend/apiEngine.mjs:321-334
  return {
    statusCode: 200,
    payload: {
      status_code: 200,
      data: slice,
      bookings: state.bookings.filter((b) => b.deletedAt === null),
      reviews: state.reviews.filter((r) => r.deletedAt === null),
  ```
- **Impacto real y delimitado:**  
  Cualquier visitante anónimo puede leer el historial global de reservas, importes pagados, fechas de ocupación por huésped y patrones de reserva de todos los usuarios de la plataforma.
- **Evidencia y alcance de la prueba:**  
  Prueba aislada `T03` (`evidencias/fixtures_test_evidence.json`): La consulta anónima a `GET /api/v1/listings` retornó `statusCode: 200` con `bookingsPropertyPresent: true`.
- **Corrección propuesta:**  
  Eliminar completamente la propiedad `bookings` de la respuesta de `GET /api/v1/listings`. Crear un endpoint autenticado dedicado `GET /api/v1/bookings/me` que filtre estrictamente por `guestId === claims.sub` (o por `hostId` si es anfitrión).
- **Criterio verificable de cierre:**  
  `GET /api/v1/listings no contiene la clave "bookings"; GET /api/v1/bookings/me sin token retorna HTTP 401`.
- **Clasificación:** CWE-200 (Exposure of Sensitive Information to an Unauthorized Actor) / CWE-359 — [OWASP API3:2023 Broken Object Property Level Authorization](https://owasp.org/API-Security/editions/2023/en/0xa3-broken-object-property-level-authorization/)

---

### FUG-02: Almacenamiento de tokens JWT y objetos de sesión en `localStorage` en ambos frontends

- **Metadatos:** Severidad: **Media** | Estado: **Abierto** | Responsable: **Frontend Lead** | Esfuerzo orientativo: **1.5 días**
- **Ubicación:** `frontend/src/context/AuthContext.tsx:38-56` y `frontend-admin/src/context/AuthContext.tsx:38-56`
- **Causa y condición:**  
  Tanto el portal público como el backoffice administrativo persisten el token JWT (`roomia_auth_token`) y el perfil JSON del usuario en `localStorage`, además de inicializar un valor por defecto simulado si no existe sesión previa:
  ```typescript
  // frontend/src/context/AuthContext.tsx:38-40, 50-56
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('roomia_auth_token') || '[REDACTADO]';
  });
  ...
  useEffect(() => {
    if (token) {
      localStorage.setItem('roomia_auth_token', token);
  ```
- **Impacto real y delimitado:**  
  Todo script ejecutado en el origen (incluyendo dependencias de terceros o vectores XSS potenciales) puede leer `localStorage.getItem('roomia_auth_token')` y exfiltrar la sesión activa del usuario o administrador.
- **Evidencia y alcance de la prueba:**  
  Prueba aislada `T07` (`evidencias/fixtures_test_evidence.json`): Confirmó `publicUsesLocalStorage: true` y `adminUsesLocalStorage: true`.
- **Corrección propuesta:**  
  Emitir el token JWT desde el backend mediante cabecera `Set-Cookie` con banderas `HttpOnly; Secure; SameSite=Strict` y mantener el estado de sesión en memoria React (`useState`) hidratado por un endpoint `/api/v1/auth/me`.
- **Criterio verificable de cierre:**  
  `Inspección de Application > Local Storage tras login no muestra claves JWT; la cookie de sesión posee atributos HttpOnly y SameSite=Strict`.
- **Clasificación:** CWE-922 (Insecure Storage of Sensitive Information) — [OWASP HTML5 Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html#local-storage)

---

## 6. Validación Realizada y Pendiente

| Validación | Alcance | Resultado Observado | Evidencia |
| :--- | :--- | :--- | :--- |
| Auditoría de dependencias (`npm audit --omit=dev`) | `frontend/` | **0 vulnerabilidades conocidas** | Ejecución local 2026-11-12 |
| Fixtures de Privacidad (`T03`, `T07`) | `scripts/run_fixture_tests.mjs` | **Hallazgos Confirmados** | `evidencias/fixtures_test_evidence.json` |
| Escaneo de logs en producción | Infraestructura Cloud | **No evaluado (`N/M`)** | Sin acceso a entorno productivo |

---

## 7. Plan de Corrección y Cierre

| Prioridad | ID | Acción Requerida | Responsable | Esfuerzo |
| :--- | :---: | :--- | :--- | :---: |
| **1 (Alta)** | `FUG-01` | Remover `bookings` de `GET /api/v1/listings` y habilitar ruta privada autenticada. | Backend Lead | 0.5 d |
| **2 (Media)** | `FUG-02` | Migrar persistencia de JWT de `localStorage` a cookies `HttpOnly` + `SameSite=Strict`. | Frontend/Backend | 1.5 d |

---

## 8. Referencias Técnicas Oficiales
- OWASP API Security Top 10 (2023) — API3:2023 Broken Object Property Level Authorization.
- OWASP Session Management Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
- Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) — Principio de Minimización y Consentimiento.
