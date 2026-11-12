# Entrega 04: Optimización de Recursos y Arquitectura (OPT)

---

## 1. Portada y Trazabilidad

**Proyecto Auditado:** Roomia — Plataforma de Reservas y Gestión Residencial  
**Módulo:** 04 — Optimización de Recursos y Arquitectura  
**Estado del Dictamen:** Con Hallazgos de Deriva Arquitectónica y Política CORS Permisiva  
**Fecha de Ejecución:** 2026-11-12  

### Resumen Ejecutivo
La arquitectura de Roomia implementa acertadamente la segregación física de aplicaciones en puertos independientes (`frontend` en `:5174` para clientes y `frontend-admin` en `:5175` para administración), reduciendo la superficie de exposición del backoffice. No obstante, en el backend coexisten dos implementaciones paralelas con divergencia funcional: una arquitectura en capas PHP PSR-4 (`backend/app/`, `backend/routes/api.php`) y un motor operativo en Node.js (`backend/apiEngine.mjs`), sin un contrato de ejecución único. Asimismo, `backend/server.mjs` configura una cabecera CORS permisiva (`*`) por defecto.

### Distribución por Severidad

| Severidad | Cantidad | Porcentaje | IDs Asociados |
| :--- | :---: | :---: | :--- |
| **Crítica** | 0 | 0.0% | — |
| **Alta** | 0 | 0.0% | — |
| **Media** | 2 | 100.0% | `OPT-01`, `OPT-02` |
| **Baja** | 0 | 0.0% | — |
| **Total** | **2** | **100%** | — |

### Metadatos del Commit Auditado e Inventario

| Atributo | Valor Observable |
| :--- | :--- |
| **Commit Hash (HEAD)** | `f17a5f0afb2fb8b16560c33363fcb9710d4a77d3` |
| **Fecha del Commit** | `2026-11-10 22:42:29 -0600` |
| **Archivos Auditados** | `136` archivos (`.php`: 2,375 LOC \| `.mjs`: 1,474 LOC \| `.ts/.tsx`: 14,390 LOC \| `.sql`: 573 LOC) |

---

## 2. Método y Límites

### Herramientas y Técnicas Aplicadas
- Análisis comparativo de topología de carpetas, rutas declaradas en `backend/routes/api.php` frente a `backend/apiEngine.mjs`, y revisión de políticas HTTP en `backend/server.mjs`.
- Validación de separación de artefactos frontend mediante compilación independiente de `frontend` y `frontend-admin`.

### Alcance y Exclusiones (No Evaluado / N/M)
- **No evaluado:** Orquestación de contenedores Docker en clústeres productivos, configuración de balanceadores NGINX/Ingress, ni consumo de memoria RAM en contenedores PHP-FPM (`N/M`).

---

## 3. Tabla de Controles Revisados

| Control Arquitectónico | Estándar / Referencia | Evaluación | Observación Verificada |
| :--- | :--- | :---: | :--- |
| Segregación física Portal Público vs Backoffice Admin | Zero Trust / Least Privilege | **Cumple** | `frontend` (:5174) y `frontend-admin` (:5175) en paquetes separados. |
| Unicidad de implementación backend (Sin deriva) | Clean Architecture | **Falla** | Coexisten `backend/app/` (PHP, 2,375 LOC) y `apiEngine.mjs` (Node, 940 LOC) con reglas distintas. |
| Política CORS restrictiva por lista blanca (Allowlist) | OWASP A05:2021 | **Falla** | `server.mjs:7` usa `'*'` por defecto si falta `CORS_ALLOWED_ORIGIN`. |
| Esquema relacional en Tercera Forma Normal (3FN) | Codd 3FN / PostgreSQL | **Cumple** | Definido en `backend/database/postgresql/01_schema_3fn.sql`. |
| Cabeceras de endurecimiento (`X-Frame-Options`, `nosniff`) | OWASP Secure Headers | **Cumple** | Configuradas en `backend/server.mjs:33-34`. |

---

## 4. Matriz de Hallazgos

| ID | Severidad | Título | Responsable |
| :--- | :---: | :--- | :--- |
| `OPT-01` | **Media** | Deriva arquitectónica entre especificación PHP (`routes/api.php`) y runtime activo Node.js (`apiEngine.mjs`) | Arquitecto de Software |
| `OPT-02` | **Media** | Política CORS permisiva con comodín (`*`) por defecto en `backend/server.mjs` | Backend / DevOps |

---

## 5. Fichas Individuales de Hallazgo

### OPT-01: Deriva arquitectónica entre especificación PHP y runtime activo Node.js

- **Metadatos:** Severidad: **Media** | Estado: **Abierto** | Responsable: **Arquitecto de Software** | Esfuerzo orientativo: **3.0 días**
- **Ubicación:** `backend/routes/api.php:61-65` vs `backend/apiEngine.mjs:890-911`
- **Causa y condición:**  
  El repositorio mantiene simultáneamente una base de código PHP de 2,375 líneas (`backend/app/`, `backend/public/index.php`) y un motor monolítico en Node.js (`backend/apiEngine.mjs`, 940 líneas). Mientras `routes/api.php` declara middlewares obligatorios (`jwt_auth`, `rbac:ADMIN`), el motor Node.js omite estos controles en rutas equivalentes:
  ```php
  // backend/routes/api.php:61-64
  'GET /api/v1/audit' => [
      'handler' => 'AuditController@index',
      'middleware' => ['rate_limit:60,60', 'jwt_auth', 'rbac:ADMIN', 'audit_log'],
  ```
- **Impacto real y delimitado:**  
  Duplicidad de esfuerzo de mantenimiento, inconsistencia en pruebas (`run_audit_suite.php` vs `run_audit_suite.mjs`) y brechas de seguridad introducidas por discrepancias entre la documentación arquitectónica y el servidor en ejecución.
- **Evidencia y alcance de la prueba:**  
  Inventario de código (`evidencias/audit_execution_evidence.json`) y discrepancia observada en `T01` (`evidencias/fixtures_test_evidence.json`).
- **Corrección propuesta:**  
  Unificar el backend hacia un único runtime productivo oficial (ya sea consolidando en PHP + PostgreSQL con `Dockerfile` productivo, o migrando formalmente toda la arquitectura modular a TypeScript/Node.js) y archivar o retirar el motor secundario.
- **Criterio verificable de cierre:**  
  `Existencia de un único punto de entrada backend versionado y validado mediante pipeline CI unificado`.
- **Clasificación:** CWE-1068 (Inconsistency Between Implementation and Documented Design) — [OWASP Architecture & Design Guidelines](https://owasp.org/www-project-developer-guide/)

---

### OPT-02: Política CORS permisiva con comodín (`*`) por defecto en `backend/server.mjs`

- **Metadatos:** Severidad: **Media** | Estado: **Abierto** | Responsable: **Backend / DevOps** | Esfuerzo orientativo: **0.5 días**
- **Ubicación:** `backend/server.mjs:7-9`
- **Causa y condición:**  
  Si la variable `CORS_ALLOWED_ORIGIN` no está definida, el servidor HTTP emite la directiva comodín `*` para cualquier origen web:
  ```javascript
  // backend/server.mjs:7
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ALLOWED_ORIGIN || '*');
  ```
- **Impacto real y delimitado:**  
  Cualquier dominio externo visitado por el usuario en su navegador puede realizar peticiones de lectura y escritura contra la API (y leer sus respuestas JSON) sin restricción de origen en capa navegador.
- **Evidencia y alcance de la prueba:**  
  Prueba estática `T05` (`evidencias/fixtures_test_evidence.json`): Confirmó `corsWildcardFallback: true`.
- **Corrección propuesta:**  
  Configurar una lista blanca explícita (*allowlist*) verificando el header `Origin` contra los dominios autorizados del portal cliente y backoffice (`http://127.0.0.1:5174`, `http://127.0.0.1:5175` o dominios productivos en `CORS_ALLOWED_ORIGINS`), devolviendo `Vary: Origin`.
- **Criterio verificable de cierre:**  
  `Petición OPTIONS/GET con Origin: https://evil.example no recibe Access-Control-Allow-Origin: * ni refleja el origen no autorizado`.
- **Clasificación:** CWE-942 (Permissive Cross-domain Policy with Untrusted Domains) — [OWASP Cross-Origin Resource Sharing](https://owasp.org/www-community/attacks/CORS_OriginHeaderScrutiny)

---

## 6. Validación Realizada y Pendiente

| Validación | Alcance | Resultado Observado | Evidencia |
| :--- | :--- | :--- | :--- |
| Compilación modular aislada (`vite build`) | `frontend` & `frontend-admin` | **Exitosa (0 errores)** | `evidencias/audit_execution_evidence.json` |
| Verificación CORS estática (`T05`) | `backend/server.mjs` | **Hallazgo Confirmado** | `evidencias/fixtures_test_evidence.json` |
| Pruebas de rendimiento de contenedores | Docker / Orquestador | **No evaluado (`N/M`)** | Sin entorno de contenedores activo |

---

## 7. Plan de Corrección y Cierre

| Prioridad | ID | Acción Requerida | Responsable | Esfuerzo |
| :--- | :---: | :--- | :--- | :---: |
| **1 (Media)** | `OPT-02` | Restringir CORS mediante *allowlist* estricta y cabecera `Vary: Origin`. | Backend / DevOps | 0.5 d |
| **2 (Media)** | `OPT-01` | Consolidar runtime backend único y retirar código paralelo no productivo. | Arquitecto | 3.0 d |

---

## 8. Referencias Técnicas Oficiales
- OWASP Top 10:2021 — A05 Security Misconfiguration.
- MDN Web Docs — Cross-Origin Resource Sharing (CORS): https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
