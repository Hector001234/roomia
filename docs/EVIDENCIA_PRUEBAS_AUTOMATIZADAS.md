# REPORTE DE EVIDENCIA DE PRUEBAS AUTOMATIZADAS DE AUDITORÍA
**Proyecto**: ROOMIA PLATFORM (MC-ROOMIA-2026-V3.1)  
**Script de Ejecución**: `node backend/tests/run_audit_suite.mjs`  
**Fecha de Ejecución**: 10 de Noviembre de 2026  
**Resultado Global**: **14 PRUEBAS EJECUTADAS · 14 PASADAS (100% PASS) · 0 FALLIDAS**  

---

## 1. Matriz de Casos de Prueba Verificados

| ID Prueba | Control de Seguridad / Requisito | Datos de Entrada | Resultado Esperado | Resultado Obtenido | Estado |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **CPF-01** | Validación sintáctica RFC 5322 | `email: "correo-invalido@@sin-dominio"` | Rechazo con código `422 Unprocessable Entity` | HTTP 422 recibido. Error de validación retornado. | **PASS** |
| **CP-AUTH-01** | Hashing Argon2id y Omisión de DTO | Credenciales de usuario: `email: "guest@roomia.mx"` | Contraseña procesada con Argon2id; `password_hash` omitido en JSON de salida | `m=65536, t=4, p=2` confirmado. Campo `password_hash` ausente en payload. | **PASS** |
| **CP-AUTH-02** | TTL de JWT y Bloqueo por Fuerza Bruta | 5 intentos de inicio de sesión fallidos seguidos | Intento 1 a 4: `401 Unauthorized`. Intento 5: `429 Too Many Requests` (Cuenta bloqueada) | `HTTP 429` exacto en el 5º intento. `lockedUntil` registrado. | **PASS** |
| **CPF-03** | Publicación de Listados con Imágenes WebP | 15 imágenes en formato WebP con dimensiones optimizadas | Respuesta exitosa con código `201 Created` y URLs S3 verificadas | `HTTP 201 Created`. Registro en BD con 15 fotos enlazadas. | **PASS** |
| **CP-CAT-01** | RBAC para Catálogo y Coordenadas Geográficas | Petición con rol `GUEST` intentando crear residencia o coordenadas fuera de cuadrante | `403 Forbidden` por rol; `422` por coordenadas inválidas | `HTTP 403` al no ser HOST/ADMIN. `HTTP 422` al rebasar lat/lng permitidas. | **PASS** |
| **CP-CONC-01** | Bloqueo Pesimista Concurrente (SELECT FOR UPDATE) | 2 peticiones concurrentes idénticas para las mismas fechas de la Residencia #42 | Petición 1: `201 Created` (bloqueo adquirido). Petición 2: `409 Conflict` (rechazo) | Petición A: confirmada. Petición B: `HTTP 409 Conflict` inmediato. Fechas bloqueadas. | **PASS** |
| **CP-CONC-02** | Precisión Numérica Financiera NUMERIC(10,2) | 3 noches a tarifa $1,500.00 MXN | Subtotal $4,500.00 + 12% Comisión ($540.00) + 16% IVA ($720.00) = **$5,760.00** | Cálculo matemático exacto a 2 decimales sin redondeos espurios. | **PASS** |
| **CPF-04** | Búsqueda sobre Fechas Ocupadas | Consulta sobre fechas que ya poseen bloqueo activo | Arreglo vacío `[]` y total `0` | `HTTP 200` con `data: []` y `total: 0`. Ninguna propiedad ocupada se fuga. | **PASS** |
| **CPF-02** | Tarjeta Declinada y Liberación de Fechas | Tarjeta de prueba terminación `0999` (Declinada por emisor) | Respuesta `402 Payment Required` y liberación inmediata de fechas bloqueadas | `HTTP 402` recibido. Las fechas quedaron nuevamente libres para reserva. | **PASS** |
| **CP-INT-04 / 08** | Validación de Firma de Webhook Stripe HMAC-SHA256 | Webhook con firma válida vs Webhook con firma manipulada | Firma válida: `200 OK`. Firma manipulada: `400 Bad Request` | Firma legítima procesó el pago; payload forjado fue bloqueado con `HTTP 400`. | **PASS** |
| **CPF-05 / REV-01** | Validación de Estancia Previa para Reseñas | Huésped intenta publicar calificación sin estancia completada | `403 Forbidden` hasta que la estancia pase a estado `COMPLETED` | Intento sin estancia: `HTTP 403`. Tras `completeStay()`: `HTTP 201 Created`. | **PASS** |
| **CP-AUD-01 / 02** | Inmutabilidad de Bitácora y Cadena SHA-256 | Intento de `UPDATE/DELETE` en tabla `audit_logs` y verificación de hash chain | Bloqueo con `SQLSTATE 45000` y 100% de coherencia en hashes enlazados | Sentencia SQL bloqueada por trigger. Cadena SHA-256 verificada matemáticamente. | **PASS** |
| **CP-PGSQL-01** | Esquema 3NF y Triggers PostgreSQL 16 | Revisión de integridad referencial, claves foráneas y soft-delete (`deleted_at`) | Modelo en Tercera Forma Normal (3NF) con vistas forenses | Esquema validado en [`backend/database/postgresql/01_schema_3fn.sql`](file:///C:/Users/Hector/Documents/Proyecto_Auditoria/rommia/backend/database/postgresql/01_schema_3fn.sql). | **PASS** |
| **CP-OBS-01** | 8 Pilares de Arquitectura y Salud del Sistema | Inspección de dependencias, SEO, telemetría y encabezados de seguridad | Cero dependencias huérfanas, etiquetas canónicas y HSTS/X-Frame | Cumplimiento estricto en frontend y backend. | **PASS** |

---

## 2. Evidencia de Ejecución en Consola (Log Completo del Sistema)

```text
======================================================================
 ROOMIA AUTOMATED AUDIT VERIFICATION SUITE (MC-ROOMIA-2026-V3.1)
======================================================================
[PASS] CPF-01: Reject invalid RFC 5322 email with HTTP 422
[PASS] CP-AUTH-01: Password hashed with Argon2id (memory=65536, time=4, threads=2) and omitted from public DTO
[PASS] CP-AUTH-02: Issue JWT (TTL 3600s) and lock account with HTTP 429 after 5 failed attempts
[PASS] CPF-03: Publish listing with 15 photos converted to WebP and return HTTP 201
[PASS] CP-CAT-01: Reject out-of-range coordinates with HTTP 422 and enforce RBAC HTTP 403 for GUEST
[PASS] CP-CONC-01: Pessimistic lock confirms first booking (HTTP 201) and rejects overlapping concurrent request with HTTP 409 Conflict
[PASS] CP-CONC-02: Exact NUMERIC(10,2) calculation (3 nights * 1500.00 = 4500.00 + 540.00 fee + 720.00 tax = 5760.00)
[PASS] CPF-04: Search over occupied dates/criteria returns HTTP 200 with empty data array [] and 0 total
[PASS] CPF-02: Declined card (4000 0000 0000 0999) returns HTTP 402 Payment Required and releases locked dates
[PASS] CP-INT-04 & CP-INT-08: Signed Stripe webhook confirms booking (200) and forged webhook signature is rejected (400)
[PASS] CPF-05 & CP-REV-01: Reject unverified review with HTTP 403 Forbidden and allow review after COMPLETED stay (HTTP 201)
[PASS] CP-AUD-01 & CP-AUD-02: Block UPDATE/DELETE on audit_logs (SQLSTATE 45000) and verify 100% SHA-256 hash chain integrity
[PASS] CP-PGSQL-01: PostgreSQL 16 schema (3NF + deleted_at soft delete), PL/pgSQL SHA-256 audit triggers and views present
[PASS] CP-OBS-01 & 8-PILLARS: Clean dependencies (no unused axios), canonical/meta SEO tags, soft-delete (deletedAt) and telemetry active
======================================================================
 SUMMARY: 14 PASSED, 0 FAILED
======================================================================
```
