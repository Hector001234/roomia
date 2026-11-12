# Entrega 07: Confiabilidad, Integración y Operación (REL)

---

## 1. Portada y Trazabilidad

**Proyecto Auditado:** Roomia — Plataforma de Reservas y Gestión Residencial  
**Módulo:** 07 — Confiabilidad, Integración y Operación (ISO/IEC 25010 Fiabilidad / Mantenibilidad)  
**Estado del Dictamen:** Con Hallazgos en Persistencia ante Fallos y Cadena de Suministro (`lockfile`)  
**Fecha de Ejecución:** 2026-11-12  

### Resumen Ejecutivo
La plataforma implementa mecanismos positivos de integridad forense (encadenamiento SHA-256 verificable en bitácoras y validación HMAC en webhooks de pago Stripe), así como scripts operativos de respaldo (`scripts/cold-restore-drill.sh`). Sin embargo, la persistencia en archivo plano del motor activo Node.js (`apiEngine.mjs`) presenta un manejo silencioso de errores de lectura que reinicializa la base de datos ante corrupción JSON, borrando datos previos sin alerta. Adicionalmente, el paquete `frontend-admin` carece de `package-lock.json`, imposibilitando auditorías de dependencias deterministas (`npm audit` falla con `ENOLOCK`).

### Distribución por Severidad

| Severidad | Cantidad | Porcentaje | IDs Asociados |
| :--- | :---: | :---: | :--- |
| **Crítica** | 0 | 0.0% | — |
| **Alta** | 1 | 50.0% | `REL-01` |
| **Media** | 1 | 50.0% | `REL-02` |
| **Baja** | 0 | 0.0% | — |
| **Total** | **2** | **100%** | — |

### Metadatos del Commit Auditado e Inventario

| Atributo | Valor Observable |
| :--- | :--- |
| **Commit Hash (HEAD)** | `f17a5f0afb2fb8b16560c33363fcb9710d4a77d3` |
| **Fecha del Commit** | `2026-11-10 22:42:29 -0600` |
| **Archivos Auditados** | `136` archivos (`backend`: 4,369 LOC \| `frontend`: 14,235 LOC \| `frontend-admin`: 3,778 LOC \| `scripts`: 245 LOC) |

---

## 2. Método y Límites

### Herramientas y Técnicas Aplicadas
- Inspección de manejo de excepciones, persistencia en disco, verificación de integridad criptográfica y gestión de dependencias (`npm audit --omit=dev`).
- Ejecución de `node backend/tests/run_audit_suite.mjs` (`14 PASSED, 0 FAILED`).

### Alcance y Exclusiones (No Evaluado / N/M)
- **No evaluado:** Ejecución real de `scripts/cold-restore-drill.sh` contra un servidor PostgreSQL vivo, monitoreo APM, alertas en la nube (Datadog/CloudWatch), ni pruebas de integración end-to-end contra APIs reales de Stripe o SAT (`N/M`).

---

## 3. Tabla de Controles Revisados

| Control Operativo / Confiabilidad | Estándar / Referencia | Evaluación | Observación Verificada |
| :--- | :--- | :---: | :--- |
| Manejo seguro de errores en carga de estado | ISO/IEC 25010 / CWE-390 | **Falla** | `loadState()` captura errores en silencio y sobreescribe el estado con valores iniciales. |
| Determinismo de dependencias (`package-lock.json`) | OWASP A06:2021 / SLSA | **Falla** | `frontend-admin/` carece de `package-lock.json` (`npm audit` retorna `ENOLOCK`). |
| Integridad inmutable de bitácora (Hash Chaining) | Forense / NIST SP 800-92 | **Cumple** | `verifyAuditChain()` (`apiEngine.mjs:217-237`) valida cadena SHA-256 completa. |
| Verificación de firma Webhook de terceros | Stripe Best Practices | **Cumple** | `apiEngine.mjs:914-926` valida firma HMAC-SHA256 retornando `400` si es inválida. |
| Disponibilidad / SLA / Replicación en Producción | Operación Cloud | **No evaluado** | No medido en infraestructura productiva (`N/M`). |

---

## 4. Matriz de Hallazgos

| ID | Severidad | Título | Responsable |
| :--- | :---: | :--- | :--- |
| `REL-01` | **Alta** | Manejo silencioso de excepciones con sobreescritura destructiva en `loadState()` | Backend Lead |
| `REL-02` | **Media** | Ausencia de `package-lock.json` en `frontend-admin/` impide auditoría de dependencias y builds deterministas | Frontend / DevOps |

---

## 5. Fichas Individuales de Hallazgo

### REL-01: Manejo silencioso de excepciones con sobreescritura destructiva en `loadState()`

- **Metadatos:** Severidad: **Alta** | Estado: **Abierto** | Responsable: **Backend Lead** | Esfuerzo orientativo: **1.0 día**
- **Ubicación:** `backend/apiEngine.mjs:171-183`
- **Causa y condición:**  
  Si ocurre cualquier excepción al leer o parsear `roomia_live_state.json` (por ejemplo, una escritura truncada por fallo eléctrico o condición de carrera), el bloque `catch` suprime el error sin registrar en `stderr` y regenera inmediatamente el archivo desde cero:
  ```javascript
  // backend/apiEngine.mjs:171-183
  function loadState() {
    try {
      if (fs.existsSync(STATE_FILE)) {
        const raw = fs.readFileSync(STATE_FILE, 'utf8');
        return JSON.parse(raw);
      }
    } catch {
      // Fallback to initial state if corrupted
    }
    const initial = createInitialState();
    saveState(initial);
    return initial;
  }
  ```
- **Impacto real y delimitado:**  
  Un fallo de parseo o corrupción parcial provoca la pérdida irreversible y silenciosa de todas las reservas, usuarios registrados y cadena forense `auditLogs` almacenadas en `roomia_live_state.json`.
- **Evidencia y alcance de la prueba:**  
  Inspección directa de código fuente en `backend/apiEngine.mjs:177-182`.
- **Corrección propuesta:**  
  1) Migrar la persistencia hacia PostgreSQL con transacciones ACID.  
  2) Mientras se mantenga el respaldo JSON local, usar escritura atómica (`write-file-atomic` mediante archivo temporal `.tmp` + `fs.renameSync`) y en caso de error de parseo conservar una copia de respaldo `.corrupted.<timestamp>` y lanzar excepción controlada sin sobreescribir el archivo original.
- **Criterio verificable de cierre:**  
  `Ante JSON corrupto en archivo de estado, el sistema preserva el archivo corrupto en backup, registra error estructurado y NO sobreescribe el historial con createInitialState()`.
- **Clasificación:** CWE-390 (Detection of Error Condition Without Action) / CWE-755 — [OWASP Improper Error Handling](https://owasp.org/www-community/Improper_Error_Handling)

---

### REL-02: Ausencia de `package-lock.json` en `frontend-admin/` impide auditoría de dependencias

- **Metadatos:** Severidad: **Media** | Estado: **Abierto** | Responsable: **Frontend / DevOps** | Esfuerzo orientativo: **0.25 días**
- **Ubicación:** `frontend-admin/` (ausencia de `frontend-admin/package-lock.json`)
- **Causa y condición:**  
  Mientras el portal público (`frontend/`) cuenta con su archivo de bloqueo, el módulo administrativo `frontend-admin/` carece de `package-lock.json` versionado en el repositorio.
- **Impacto real y delimitado:**  
  Las instalaciones en CI/CD (`npm ci`) o auditorías automatizadas (`npm audit`) fallan o resuelven versiones transitivas distintas en cada ejecución, exponiendo el backoffice administrativo a regresiones o ataques a la cadena de suministro.
- **Evidencia y alcance de la prueba:**  
  Ejecución local de `npm audit --omit=dev` en `frontend-admin/` el 2026-11-12 devolvió código de error `1` con mensaje `npm error code ENOLOCK`.
- **Corrección propuesta:**  
  Generar y versionar `frontend-admin/package-lock.json` mediante `npm install --package-lock-only` y exigir `npm ci` en los pipelines de integración continua.
- **Criterio verificable de cierre:**  
  `Ejecución de "npm audit --omit=dev" y "npm ci" en frontend-admin/ finaliza con Exit Code 0`.
- **Clasificación:** CWE-1395 (Dependency on Vulnerable Third-Party Component) / CWE-829 — [OWASP Vulnerable and Outdated Components](https://owasp.org/Top10/A06_2021-Vulnerable_and_Outdated_Components/)

---

## 6. Validación Realizada y Pendiente

| Validación | Alcance | Resultado Observado | Evidencia |
| :--- | :--- | :--- | :--- |
| Suite de Pruebas de Auditoría | `backend/tests/run_audit_suite.mjs` | **14 PASSED, 0 FAILED** | `evidencias/audit_execution_evidence.json` |
| Auditoría de Dependencias (`npm audit`) | `frontend/` | **0 vulnerabilidades** | Ejecución local 2026-11-12 |
| Auditoría de Dependencias (`npm audit`) | `frontend-admin/` | **Falla (`ENOLOCK`)** | Ejecución local 2026-11-12 |
| Simulacro de Restauración en Frío | `scripts/cold-restore-drill.sh` | **No evaluado (`N/M`)** | Requiere instancia PostgreSQL real |

---

## 7. Plan de Corrección y Cierre

| Prioridad | ID | Acción Requerida | Responsable | Esfuerzo |
| :--- | :---: | :--- | :--- | :---: |
| **1 (Alta)** | `REL-01` | Implementar escritura atómica y manejo seguro de errores en persistencia de estado. | Backend Lead | 1.0 d |
| **2 (Media)** | `REL-02` | Generar y commitear `frontend-admin/package-lock.json` y activar `npm audit` en CI. | Frontend / DevOps | 0.25 d |

---

## 8. Referencias Técnicas Oficiales
- OWASP Top 10:2021 — A06 Vulnerable and Outdated Components.
- Node.js File System Documentation — `fs.renameSync` Atomic Semantics: https://nodejs.org/api/fs.html#fsrenamesyncoldpath-newpath
- NIST SP 800-92 — Guide to Computer Security Log Management.
