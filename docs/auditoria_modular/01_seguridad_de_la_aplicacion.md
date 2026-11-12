# Entrega 01: Seguridad de la Aplicación (SEC)

---

## 1. Portada y Trazabilidad

**Proyecto Auditado:** Roomia — Plataforma de Reservas y Gestión Residencial  
**Módulo:** 01 — Seguridad de la Aplicación  
**Estado del Dictamen:** Requiere Remediación Prioritaria (Riesgo Crítico/Alto en Runtime Node.js)  
**Fecha de Ejecución:** 2026-11-12  

### Resumen Ejecutivo
La auditoría estática y dinámica aislada sobre el motor activo (`backend/apiEngine.mjs`, `backend/server.mjs`) y la especificación de arquitectura PHP (`backend/routes/api.php`, `backend/app/`) revela una dualidad estructural. Si bien la capa documental y de referencia en PHP contempla controles robustos (JWT middleware, RBAC estricto y validadores dedicados), el motor Node.js que responde en ejecución presenta deficiencias críticas de control de acceso y autenticación: el endpoint forense `/api/v1/audit` carece de validación de token o rol, la verificación de contraseña en `/api/v1/auth/login` omite el cotejo criptográfico contra el hash almacenado, y existen llaves criptográficas con valores de respaldo estáticos en código fuente.

### Distribución por Severidad

| Severidad | Cantidad | Porcentaje | IDs Asociados |
| :--- | :---: | :---: | :--- |
| **Crítica** | 1 | 33.3% | `SEC-02` |
| **Alta** | 2 | 66.7% | `SEC-01`, `SEC-03` |
| **Media** | 0 | 0.0% | — |
| **Baja** | 0 | 0.0% | — |
| **Total** | **3** | **100%** | — |

### Metadatos del Commit Auditado e Inventario

| Atributo | Valor Observable |
| :--- | :--- |
| **Commit Hash (HEAD)** | `f17a5f0afb2fb8b16560c33363fcb9710d4a77d3` |
| **Rama** | `main` |
| **Fecha del Commit** | `2026-11-10 22:42:29 -0600` |
| **Autor** | `[REDACTADO] <[REDACTADO]>` |
| **Archivos Auditados** | `136` archivos fuente y configuración (`.ts`, `.tsx`, `.mjs`, `.php`, `.sql`, `.json`, `.js`) |
| **Líneas de Código (LOC)** | `22,627` líneas (`backend`: 4,369 | `frontend`: 14,235 | `frontend-admin`: 3,778 | `scripts`: 245) |

---

## 2. Método y Límites

### Herramientas y Técnicas Aplicadas
- **Análisis Estático de Código Fuente (SAST manual):** Revisión de rutas, middlewares, manejo de sesión, hashing y flujos de autorización en `backend/apiEngine.mjs`, `backend/server.mjs` y `backend/app/Http/Middleware/`.
- **Pruebas Aisladas mediante Fixtures Locales (`scripts/run_fixture_tests.mjs`):** Ejecución sin conexión a servicios en nube ni bases de datos productivas, con respaldo y restauración automática de `roomia_live_state.json`. Evidencia persistida en `evidencias/fixtures_test_evidence.json`.
- **Verificación de Compilación y Suites (`scripts/audit_collector.mjs`):** Ejecución local de `tsc --noEmit`, `vite build` y `node backend/tests/run_audit_suite.mjs` registrada en `evidencias/audit_execution_evidence.json`.

### Alcance y Exclusiones (No Evaluado / N/M)
- **No evaluado:** Controles de red perimetral (WAF, firewalls, balanceadores de carga), terminación TLS/HTTPS en producción, configuración de secretos en gestores externos (AWS Secrets Manager / Vault), ni ejecución real del stack PHP contra un motor PostgreSQL 16 activo.
- **Cero suposiciones:** No se asume la ausencia ni existencia de controles de infraestructura no versionados en este repositorio Git.

---

## 3. Tabla de Controles Revisados

| Control de Seguridad | Estándar / Referencia | Evaluación | Observación Verificada |
| :--- | :--- | :---: | :--- |
| Autorización en endpoint de bitácora (`/api/v1/audit`) | OWASP ASVS V4.1 | **Falla** | Accesible sin token JWT ni rol `ADMIN` en `apiEngine.mjs`. |
| Verificación criptográfica de contraseña en Login | OWASP ASVS V2.1 | **Falla** | Coteja longitud/string estático en lugar de verificar hash. |
| Gestión de llaves secretas JWT y Webhooks | OWASP ASVS V2.10 | **Falla** | Valores `fallback` hardcodeados en el código fuente. |
| Prevención de sobreventa (Concurrencia pesimista) | OWASP ASVS V11.1 | **Cumple** | Validado localmente en prueba `T06` (`HTTP 409 Conflict`). |
| Verificación HMAC-SHA256 en Webhook Stripe | OWASP API8:2023 | **Parcial** | Implementa HMAC, pero depende de secreto fallback estático. |
| Bloqueo por fuerza bruta (5 intentos) | OWASP ASVS V2.2 | **Cumple** | Implementado en `apiEngine.mjs:466-476` (estado `429`). |
| Controles de WAF / Red / TLS Productivo | Infraestructura | **No evaluado** | Fuera del alcance estático del repositorio local (`N/M`). |

---

## 4. Matriz de Hallazgos

| ID | Severidad | Título | Responsable |
| :--- | :---: | :--- | :--- |
| `SEC-01` | **Alta** | Ausencia de autenticación JWT y autorización RBAC en endpoint forense `/api/v1/audit` | Backend Lead |
| `SEC-02` | **Crítica** | Bypass de autenticación en `/api/v1/auth/login` por omisión de verificación criptográfica de hash | Backend Lead |
| `SEC-03` | **Alta** | Secretos criptográficos (`JWT_SECRET` y `STRIPE_WEBHOOK_SECRET`) con valores predeterminados en código | DevSecOps / Backend |

---

## 5. Fichas Individuales de Hallazgo

### SEC-01: Ausencia de autenticación JWT y autorización RBAC en endpoint forense `/api/v1/audit`

- **Metadatos:** Severidad: **Alta** | Estado: **Abierto** | Responsable: **Backend Lead** | Esfuerzo orientativo: **0.5 días**
- **Ubicación:** `backend/apiEngine.mjs:890-911` (en contraste con `backend/routes/api.php:61-65`)
- **Causa y condición:**  
  El manejador de la ruta `GET /api/v1/audit` en el motor activo Node.js atiende solicitudes directamente sin verificar el encabezado `Authorization: Bearer <token>` ni validar que el rol del sujeto sea `ADMIN`:
  ```javascript
  // backend/apiEngine.mjs:890-895
  if (method === 'GET' && pathname === '/api/v1/audit') {
    const limit = Math.max(1, Math.min(100, Number(query.limit || 50)));
    const offset = Math.max(0, Number(query.offset || 0));
    const chainVerified = verifyAuditChain(state.auditLogs);
    const reversed = [...state.auditLogs].reverse();
  ```
- **Impacto real y delimitado:**  
  Cualquier usuario anónimo en la red con alcance al puerto del backend puede enumerar eventos internos de auditoría, IDs de usuarios, tipos de eventos de seguridad y direcciones IP anonimizadas.
- **Evidencia y alcance de la prueba:**  
  Prueba aislada `T01` (`evidencias/fixtures_test_evidence.json`): Invocación sin cabeceras a `GET /api/v1/audit` devolvió `statusCode: 200` y expuso `2` registros de bitácora.
- **Corrección propuesta:**  
  Extraer y verificar obligatoriamente el token JWT mediante un middleware centralizado antes del despacho de rutas administrativas, exigiendo `claims.role === 'ADMIN'` y respondiendo `401` / `403` ante ausencia o insuficiencia de privilegios.
- **Criterio verificable de cierre:**  
  `Sin token: HTTP 401; Con token válido de rol GUEST/HOST: HTTP 403; Con token válido de rol ADMIN: HTTP 200`.
- **Clasificación:** CWE-306 (Missing Authentication for Critical Function) / CWE-862 (Missing Authorization) — [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)

---

### SEC-02: Bypass de autenticación en `/api/v1/auth/login` por omisión de verificación criptográfica de hash

- **Metadatos:** Severidad: **Crítica** | Estado: **Abierto** | Responsable: **Backend Lead** | Esfuerzo orientativo: **1 día**
- **Ubicación:** `backend/apiEngine.mjs:478-493`
- **Causa y condición:**  
  Aunque el registro de usuarios (`apiEngine.mjs:423-425`) deriva un hash con `crypto.scryptSync`, el endpoint de inicio de sesión nunca decodifica ni verifica el `passwordHash` almacenado. En su lugar, únicamente rechaza la cadena literal `'WrongPassword'` o contraseñas menores a 4 caracteres:
  ```javascript
  // backend/apiEngine.mjs:478-488
  if (password === 'WrongPassword' || password.length < 4) {
    user.failedLoginAttempts += 1;
    saveState(state);
    return {
      statusCode: 401,
      payload: {
        status_code: 401,
        error: `Contraseña incorrecta. Intentos fallidos: ${user.failedLoginAttempts}/5.`,
      },
    };
  }
  ```
- **Impacto real y delimitado:**  
  Cualquier actor que conozca el correo de un usuario registrado (incluyendo administradores `ADMIN` o anfitriones `HOST`) puede autenticarse y obtener un token JWT válido utilizando cualquier contraseña arbitraria de al menos 4 caracteres distinta de `'WrongPassword'`.
- **Evidencia y alcance de la prueba:**  
  Prueba aislada `T02` (`evidencias/fixtures_test_evidence.json`): Envío de `POST /api/v1/auth/login` con usuario registrado y contraseña `'ArbitraryPasswordNotMatchingHash!'` resultó en `statusCode: 200` y emisión de `access_token`.
- **Corrección propuesta:**  
  Implementar verificación criptográfica real con `crypto.scryptSync` y comparación en tiempo constante (`crypto.timingSafeEqual`) frente al salt y hash almacenados en `user.passwordHash` (o migrar al paquete nativo `argon2`).
- **Criterio verificable de cierre:**  
  `Login con contraseña incorrecta (ej. "Arbitrary123"): HTTP 401 sin emisión de token; Login con contraseña real registrada: HTTP 200 con JWT válido`.
- **Clasificación:** CWE-287 (Improper Authentication) — [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

### SEC-03: Secretos criptográficos (`JWT_SECRET` y `STRIPE_WEBHOOK_SECRET`) con valores predeterminados en código

- **Metadatos:** Severidad: **Alta** | Estado: **Abierto** | Responsable: **DevSecOps / Backend** | Esfuerzo orientativo: **0.5 días**
- **Ubicación:** `backend/apiEngine.mjs:10-11`
- **Causa y condición:**  
  Las constantes de firma de tokens JWT y verificación HMAC de webhooks utilizan cadenas de texto estáticas como valor de respaldo cuando no se configuran variables de entorno:
  ```javascript
  // backend/apiEngine.mjs:10-11
  const JWT_SECRET = process.env.ROOMIA_JWT_SECRET || '[REDACTADO]';
  const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '[REDACTADO]';
  ```
- **Impacto real y delimitado:**  
  Si el servicio se despliega sin inyectar las variables de entorno en el host o contenedor, la aplicación operará con llaves predecibles presentes en el historial de Git, permitiendo falsificación de tokens JWT de administrador y firmas de webhooks.
- **Evidencia y alcance de la prueba:**  
  Prueba aislada `T04` (`evidencias/fixtures_test_evidence.json`): Confirmó `jwtFallbackPresent: true` y `stripeFallbackPresent: true` en ausencia de variables de entorno.
- **Corrección propuesta:**  
  Aplicar patrón *fail-fast* al arranque del servidor: si `NODE_ENV === 'production'` (o por defecto fuera de pruebas unitarias) y falta `ROOMIA_JWT_SECRET` o `STRIPE_WEBHOOK_SECRET`, abortar el proceso (`process.exit(1)`) en lugar de usar valores estáticos.
- **Criterio verificable de cierre:**  
  `Arranque sin variables ROOMIA_JWT_SECRET o STRIPE_WEBHOOK_SECRET falla explícitamente con código de salida != 0`.
- **Clasificación:** CWE-798 (Use of Hard-coded Credentials) / CWE-1188 (Initialization of a Resource with an Insecure Default) — [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

---

## 6. Validación Realizada y Pendiente

| Validación | Alcance | Resultado Observado | Evidencia |
| :--- | :--- | :--- | :--- |
| Typecheck Frontend (`tsc --noEmit`) | `frontend/` | **Aprobado (Exit 0)** | Ejecución local 2026-11-12 |
| Typecheck Admin (`tsc --noEmit`) | `frontend-admin/` | **Aprobado (Exit 0)** | Ejecución local 2026-11-12 |
| Suite de Auditoría (`run_audit_suite.mjs`) | `backend/tests/` | **14 PASSED, 0 FAILED** | `evidencias/audit_execution_evidence.json` |
| Fixtures de Seguridad (`T01`, `T02`, `T04`, `T06`) | `scripts/run_fixture_tests.mjs` | **Hallazgos Confirmados** | `evidencias/fixtures_test_evidence.json` |
| DAST / Pentesting en Producción | Infraestructura Cloud | **Pendiente (N/M)** | Fuera de alcance local |

---

## 7. Plan de Corrección y Cierre

| Prioridad | ID | Acción Requerida | Responsable | Esfuerzo |
| :---: | :---: | :--- | :--- | :---: |
| **1 (Inmediata)** | `SEC-02` | Implementar verificación criptográfica `timingSafeEqual` en `/api/v1/auth/login`. | Backend Lead | 1.0 d |
| **2 (Alta)** | `SEC-01` | Incorporar middleware obligatorio JWT + RBAC (`ADMIN`) en `/api/v1/audit`. | Backend Lead | 0.5 d |
| **3 (Alta)** | `SEC-03` | Eliminar llaves de respaldo en código y exigir inyección vía entorno (*fail-fast*). | DevSecOps | 0.5 d |

---

## 8. Referencias Técnicas Oficiales
- OWASP Top 10:2021 — A01 Broken Access Control, A02 Cryptographic Failures, A07 Identification and Authentication Failures.
- OWASP Authorization Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
- Node.js `crypto.timingSafeEqual` Documentation: https://nodejs.org/api/crypto.html#cryptotimingsafeequala-b
