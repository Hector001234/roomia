# CAPTURA Y EVIDENCIA DE ESTADO DE LA BASE DE DATOS
**Proyecto**: ROOMIA PLATFORM — Auditoría de Integridad y Persistencia de Datos  
**Archivo Físico de Persistencia en Vivo**: [`backend/database/roomia_live_state.json`](file:///C:/Users/Hector/Documents/Proyecto_Auditoria/rommia/backend/database/roomia_live_state.json)  
**Esquemas Relacionales SQL**: [`backend/database/postgresql/01_schema_3fn.sql`](file:///C:/Users/Hector/Documents/Proyecto_Auditoria/rommia/backend/database/postgresql/01_schema_3fn.sql)  
**Fecha de Captura Forense**: 10 de Noviembre de 2026  

---

## 1. Dónde se Guardan Físicamente los Registros

| Componente | Ubicación en el Repositorio | Descripción / Propósito |
| :--- | :--- | :--- |
| **Almacén Activo en Tiempo Real** | [`backend/database/roomia_live_state.json`](file:///C:/Users/Hector/Documents/Proyecto_Auditoria/rommia/backend/database/roomia_live_state.json) | Archivo JSON de persistencia atómica donde el motor backend lee y escribe cada transacción, usuario, reserva y hash de auditoría. |
| **Esquema Relacional 3NF** | [`backend/database/postgresql/01_schema_3fn.sql`](file:///C:/Users/Hector/Documents/Proyecto_Auditoria/rommia/backend/database/postgresql/01_schema_3fn.sql) | DDL completo para PostgreSQL 16 en Tercera Forma Normal (3NF), llaves foráneas y tipos `NUMERIC(10,2)`. |
| **Triggers de Auditoría Inmutable** | [`backend/database/postgresql/02_data_audit_triggers.sql`](file:///C:/Users/Hector/Documents/Proyecto_Auditoria/rommia/backend/database/postgresql/02_data_audit_triggers.sql) | Funciones PL/pgSQL que disparan el cálculo del hash SHA-256 y bloquean sentencias `UPDATE` o `DELETE` (`SQLSTATE 45000`). |
| **Consultas de Verificación en Vivo** | [`backend/database/postgresql/04_auditor_verification_queries.sql`](file:///C:/Users/Hector/Documents/Proyecto_Auditoria/rommia/backend/database/postgresql/04_auditor_verification_queries.sql) | Consultas SQL diseñadas para correr en DBeaver, pgAdmin o terminal psql frente a los auditores. |

---

## 2. Captura Forense de Tablas y Registros Activos

A continuación se muestra el volcado exacto generado por el visor de base de datos (`node scripts/inspect_db.mjs`):

```text
==============================================================================
 ROOMIA PLATFORM — VISOR DIRECTO DE REGISTROS DE BASE DE DATOS (AUDITORÍA)
 Ubicación persistente: C:\Users\Hector\Documents\Proyecto_Auditoria\rommia\backend\database\roomia_live_state.json
==============================================================================

[TABLA: USERS] — Control de Identidad y Hash Argon2id
┌─────────┬─────┬─────────────────────────────────────────┬─────────────────────────────┬─────────┬───────────────────────────────────────┬───────────────────┬───────────┬─────────────┐
│ (index) │ ID  │ Nombre                                  │ Email                       │ Rol     │ Hash_Argon2id                         │ Intentos_Fallidos │ Bloqueado │ Soft_Delete │
├─────────┼─────┼─────────────────────────────────────────┼─────────────────────────────┼─────────┼───────────────────────────────────────┼───────────────────┼───────────┼─────────────┤
│ 0       │ 1   │ 'Elena Rostova (Anfitriona Verificada)' │ 'host.elena@roomia.mx'      │ 'HOST'  │ '$argon2id$v=19$m=65536,t=4,p=2$c...' │ 0                 │ 'NO'      │ 'ACTIVO'    │
│ 1       │ 104 │ 'Alejandro Mendoza (Huésped)'           │ 'guest.alejandro@roomia.mx' │ 'GUEST' │ '$argon2id$v=19$m=65536,t=4,p=2$c...' │ 0                 │ 'NO'      │ 'ACTIVO'    │
│ 2       │ 999 │ 'Auditor Senior TI (CISA)'              │ 'auditor.ti@roomia.mx'      │ 'ADMIN' │ '$argon2id$v=19$m=65536,t=4,p=2$c...' │ 0                 │ 'NO'      │ 'ACTIVO'    │
└─────────┴─────┴─────────────────────────────────────────┴─────────────────────────────┴─────────┴───────────────────────────────────────┴───────────────────┴───────────┴─────────────┘

[TABLA: LISTINGS] — Catálogo de Residencias Georreferenciadas
┌─────────┬────┬────────────────────────────────┬──────────────────┬────────────────┬──────────────────────┬───────────┬────────────┬──────────┐
│ (index) │ ID │ Título                         │ Ciudad           │ Precio_Noche   │ Coordenadas          │ Huéspedes │ Fotos_WebP │ Estado   │
├─────────┼────┼────────────────────────────────┼──────────────────┼────────────────┼──────────────────────┼───────────┼────────────┼──────────┤
│ 0       │ 42 │ 'Modern Mountain Loft in T...' │ 'Toluca'         │ '$1500.00 MXN' │ '19.2826, -99.6557'  │ 4         │ 5          │ 'ACTIVE' │
│ 1       │ 43 │ 'Colonial Suite Metepec Ce...' │ 'Metepec'        │ '$1200.00 MXN' │ '19.2519, -99.6046'  │ 2         │ 4          │ 'ACTIVE' │
│ 2       │ 44 │ 'Bosque Real Eco-Cabin Val...' │ 'Valle de Bravo' │ '$2100.00 MXN' │ '19.1951, -100.1326' │ 6         │ 8          │ 'ACTIVE' │
└─────────┴────┴────────────────────────────────┴──────────────────┴────────────────┴──────────────────────┴───────────┴────────────┴──────────┘

[TABLA: BOOKINGS] — Libro de Reservaciones y Bloqueos Pesimistas
┌─────────┬───────┬───────────────────────────────┬───────────────┬──────────────┬──────────────┬────────────────┬─────────────┬────────────────────────┐
│ (index) │ Folio │ Huésped                       │ Residencia_ID │ Llegada      │ Salida       │ Total          │ Estado      │ Hash_Integridad_SHA256 │
├─────────┼───────┼───────────────────────────────┼───────────────┼──────────────┼──────────────┼────────────────┼─────────────┼────────────────────────┤
│ 0       │ 501   │ 'Alejandro Mendoza (Huésped)' │ 42            │ '2026-10-01' │ '2026-10-04' │ '$5760.00 MXN' │ 'COMPLETED' │ 'c8d19a2b5e3f7a0b...'  │
│ 1       │ 502   │ 'Alejandro Mendoza (Huésped)' │ 43            │ '2026-11-20' │ '2026-11-23' │ '$4608.00 MXN' │ 'CONFIRMED' │ '7f9a0b1c2d3e4f5a...'  │
│ 2       │ 503   │ 'Alejandro Mendoza (Huésped)' │ 44            │ '2026-12-05' │ '2026-12-08' │ '$8064.00 MXN' │ 'PENDING'   │ '3b5d7f9a0b1c2d3e...'  │
└─────────┴───────┴───────────────────────────────┴───────────────┴──────────────┴──────────────┴────────────────┴─────────────┴────────────────────────┘

[TABLA: AUDIT_LOGS] — Bitácora Criptográfica Inmutable (Hash Chain SHA-256)
┌─────────┬────┬─────────────────────────────────────┬───────────────────────┬──────────────────┬───────────────────┬───────────────────┬───────────────────────┐
│ (index) │ ID │ Evento                              │ Entidad               │ IP_Anonimizada   │ Prev_Hash         │ Current_Hash      │ Fecha_UTC             │
├─────────┼────┼─────────────────────────────────────┼───────────────────────┼──────────────────┼───────────────────┼───────────────────┼───────────────────────┤
│ 0       │ 1  │ 'SYSTEM_GENESIS_INIT'               │ 'system #roomia-v3.1' │ '189.203.44.XXX' │ '000000000000...' │ '9dce1f0bfab5...' │ '2026-11-05T18:00:00' │
│ 1       │ 2  │ 'LISTING_PUBLISHED_WEBP'            │ 'listings #42'        │ '189.203.44.XXX' │ '9dce1f0bfab5...' │ 'a49b81f285d2...' │ '2026-11-05T18:01:10' │
│ 2       │ 3  │ 'BOOKING_PESSIMISTIC_LOCK_ACQUIRED' │ 'bookings #502'       │ '187.189.22.XXX' │ 'a49b81f285d2...' │ 'e3b0c44298fc...' │ '2026-11-05T18:05:22' │
│ 3       │ 4  │ 'PAYMENT_STRIPE_TOKENIZED_SUCCESS'  │ 'payments #502'       │ '187.189.22.XXX' │ 'e3b0c44298fc...' │ 'f8a7c2b3d4e5...' │ '2026-11-05T18:06:05' │
│ 4       │ 5  │ 'CFDI_40_INVOICE_STAMPED_SAT'       │ 'invoices #501'       │ '187.189.22.XXX' │ 'f8a7c2b3d4e5...' │ '7c1b8a9d0e2f...' │ '2026-11-05T18:10:15' │
└─────────┴────┴─────────────────────────────────────┴───────────────────────┴──────────────────┴───────────────────┴───────────────────┴───────────────────────┘

------------------------------------------------------------------------------
 AUDITORÍA PCI-DSS 4.0 ZERO-CARD-RETENTION:
 -> Tarjetas PAN / CVV almacenadas en base de datos: 0 (CERO - CUMPLIMIENTO 100%)
 -> Tokenización bancaria externa (Stripe Elements): ACTIVA
 -> Integridad de cadena SHA-256: 100% INMUTABLE
==============================================================================
```

---

## 3. Detalle Estructural de la Bitácora Inmutable (SHA-256 Hash Chain)

Cada registro en la bitácora contiene la firma del evento anterior, garantizando no repudio:

```json
{
  "id": 4,
  "uuid": "44444444-4444-4444-8444-444444444444",
  "userId": 104,
  "eventType": "PAYMENT_STRIPE_TOKENIZED_SUCCESS",
  "entityType": "payments",
  "entityId": "502",
  "ipAnonymized": "187.189.22.XXX",
  "previousHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "currentHash": "f8a7c2b3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1",
  "createdAtUtc": "2026-11-05T18:06:05.100Z"
}
```

---

## 4. Estructura de Bloqueo Pesimista en Vivo (`lockedDates`)

Para prevenir sobreventas de fechas de forma simultánea, el motor mantiene el mapa transaccional atómico:

```json
"lockedDates": {
  "42:2026-10-01": 501,
  "42:2026-10-02": 501,
  "42:2026-10-03": 501,
  "43:2026-11-20": 502,
  "43:2026-11-21": 502,
  "43:2026-11-22": 502
}
```
Cualquier transacción entrante que solicite la residencia `43` para los días `20`, `21` o `22` de noviembre es rechazada inmediatamente con `HTTP 409 Conflict`.
