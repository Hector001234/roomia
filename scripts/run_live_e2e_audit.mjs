import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../backend/db.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_API = 'http://127.0.0.1:5174/api/v1';
const ADMIN_API = 'http://127.0.0.1:5175/api/v1';
const DIRECT_API = 'http://127.0.0.1:8000/api/v1';

const results = [];

async function httpJson(url, options = {}) {
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function record(id, description, passed, evidence) {
  results.push({ id, description, passed, evidence });
  const tag = passed ? '\x1b[32m[PASS]\x1b[0m' : '\x1b[31m[FAIL]\x1b[0m';
  process.stdout.write(`${tag} ${id}: ${description}\n`);
}

async function main() {
  process.stdout.write('======================================================================\n');
  process.stdout.write(' ROOMIA v3.2.0 — LIVE END-TO-END HTTP + POSTGRESQL 18 AUDIT\n');
  process.stdout.write('======================================================================\n');

  // 1. Verify all 3 live servers (8000, 5174 proxy, 5175 proxy)
  const hDirect = await httpJson(`${DIRECT_API}/health`);
  const hPublic = await httpJson(`${PUBLIC_API}/health`);
  const hAdmin = await httpJson(`${ADMIN_API}/health`);
  record(
    'LIVE-PROXY-01',
    'All 3 services live (8000, 5174->8000 proxy, 5175->8000 proxy) connected to PostgreSQL 18 roomia_db',
    hDirect.status === 200 &&
      hPublic.status === 200 &&
      hAdmin.status === 200 &&
      hPublic.data.database === 'roomia_db',
    { direct: hDirect.status, publicProxy: hPublic.status, adminProxy: hAdmin.status, db: hPublic.data.database }
  );

  // 2. CPF-01 + OBS-02 (RFC 9457 Problem Details)
  const cpf01 = await httpJson(`${PUBLIC_API}/auth/register`, {
    method: 'POST',
    body: { name: 'Bad Email', email: 'correo_invalido@sin_dominio', password: 'Password123!', role: 'GUEST' },
  });
  record(
    'CPF-01 + OBS-02',
    'Invalid RFC 5322 email rejected with HTTP 422 in RFC 9457 format (type, title, status, detail, instance)',
    cpf01.status === 422 &&
      Boolean(cpf01.data.type && cpf01.data.title && cpf01.data.status === 422 && cpf01.data.detail && cpf01.data.instance),
    { status: cpf01.status, rfc9457: { type: cpf01.data.type, title: cpf01.data.title, instance: cpf01.data.instance } }
  );

  // 3. Real E2E Sync Flow: Register -> Book -> Pay on Public (:5174) -> Instantly visible on Admin (:5175) & PostgreSQL 18
  const uniqueSuffix = Date.now();
  const reg = await httpJson(`${PUBLIC_API}/auth/register`, {
    method: 'POST',
    body: {
      name: 'Auditoria E2E Guest',
      email: `e2e.guest.${uniqueSuffix}@roomia.mx`,
      password: 'RoomiaAudit2026!',
      role: 'GUEST',
    },
  });
  const guestToken = reg.data.access_token;

  const booking = await httpJson(`${PUBLIC_API}/bookings`, {
    method: 'POST',
    token: guestToken,
    body: {
      listingId: 43,
      checkIn: '2026-12-20',
      checkOut: '2026-12-23',
      guestsCount: 2,
    },
  });
  const bookingId = booking.data.booking?.id;

  const checkout = await httpJson(`${PUBLIC_API}/checkout`, {
    method: 'POST',
    token: guestToken,
    body: {
      bookingId,
      cardToken: '4242 4242 4242 4242',
    },
  });

  // Immediately query Admin Backoffice proxy (:5175) to prove cross-portal sync!
  const adminCatalog = await httpJson(`${ADMIN_API}/listings`);
  const foundInAdmin = (adminCatalog.data.bookings || []).find((b) => b.id === bookingId);

  // Query PostgreSQL 18 directly to prove real persistence!
  const pgBooking = await pool.query('SELECT id, status, total_amount FROM bookings WHERE id = $1', [bookingId]);
  const pgPayment = await pool.query('SELECT stripe_payment_intent_id, payment_last_four, status FROM payments WHERE booking_id = $1', [bookingId]);

  record(
    'E2E-SYNC-01',
    'Register -> Book -> Pay on Public (:5174) appears INSTANTLY in Admin (:5175) and PostgreSQL 18',
    reg.status === 201 &&
      booking.status === 201 &&
      checkout.status === 200 &&
      Boolean(foundInAdmin && foundInAdmin.status === 'CONFIRMED') &&
      pgBooking.rows[0]?.status === 'CONFIRMED' &&
      pgPayment.rows[0]?.status === 'COMPLETED',
    {
      bookingId,
      adminVisibleStatus: foundInAdmin?.status,
      pgBookingStatus: pgBooking.rows[0]?.status,
      pgStripeIntent: pgPayment.rows[0]?.stripe_payment_intent_id,
    }
  );

  // 4. Overbooking (HTTP 409) on the exact same locked dates
  const overbook = await httpJson(`${PUBLIC_API}/bookings`, {
    method: 'POST',
    token: guestToken,
    body: {
      listingId: 43,
      checkIn: '2026-12-21',
      checkOut: '2026-12-24',
      guestsCount: 2,
    },
  });
  record(
    'CP-CONC-01-LIVE',
    'Overlapping booking on locked dates rejected live with HTTP 409 Conflict',
    overbook.status === 409,
    { status: overbook.status, detail: overbook.data.detail }
  );

  // 5. CPF-04 Search excludes locked listing on occupied dates
  const cpf04 = await httpJson(
    `${PUBLIC_API}/listings/search?city=Valle%20de%20Bravo&guests=2&checkIn=2026-12-20&checkOut=2026-12-23`
  );
  record(
    'CPF-04-LIVE',
    'Search over occupied dates in Valle de Bravo returns HTTP 200 with empty [] and total=0',
    cpf04.status === 200 && Array.isArray(cpf04.data.data) && cpf04.data.data.length === 0 && cpf04.data.pagination?.total === 0,
    { status: cpf04.status, total: cpf04.data.pagination?.total }
  );

  // 6. CPF-02 Declined card (0999) -> HTTP 402 + automatic release of dates
  const b2 = await httpJson(`${PUBLIC_API}/bookings`, {
    method: 'POST',
    token: guestToken,
    body: { listingId: 44, checkIn: '2026-12-26', checkOut: '2026-12-28', guestsCount: 2 },
  });
  const cpf02 = await httpJson(`${PUBLIC_API}/checkout`, {
    method: 'POST',
    token: guestToken,
    body: { bookingId: b2.data.booking?.id, cardToken: '4000 0000 0000 0999' },
  });
  const pgReleased = await pool.query(
    "SELECT COUNT(*)::int AS released FROM booking_dates WHERE booking_id = $1 AND lock_status = 'RELEASED'",
    [b2.data.booking?.id]
  );
  record(
    'CPF-02-LIVE',
    'Declined card 0999 returns HTTP 402 and marks booking_dates as RELEASED in PostgreSQL 18',
    cpf02.status === 402 && pgReleased.rows[0]?.released === 2,
    { status: cpf02.status, releasedDates: pgReleased.rows[0]?.released }
  );

  // 7. CPF-05 Unverified review -> HTTP 403
  const cpf05 = await httpJson(`${PUBLIC_API}/reviews`, {
    method: 'POST',
    token: guestToken,
    body: { listingId: 43, rating: 5, comment: 'Intento de reseña antes de completar estancia' },
  });
  record(
    'CPF-05-LIVE',
    'Review without COMPLETED stay rejected with HTTP 403 Forbidden',
    cpf05.status === 403,
    { status: cpf05.status, detail: cpf05.data.detail }
  );

  // 8. Admin login on :5175 + RBAC + Audit Logs SHA-256 chain + 3 DB views
  const guestAuditDenied = await httpJson(`${ADMIN_API}/audit`, { token: guestToken });
  const adminLogin = await httpJson(`${ADMIN_API}/auth/login`, {
    method: 'POST',
    body: { email: 'auditor.ti@roomia.mx', password: 'RoomiaAudit2026!' },
  });
  const adminAudit = await httpJson(`${ADMIN_API}/audit?limit=50&offset=0`, {
    token: adminLogin.data.access_token,
  });
  record(
    'CP-AUD-LIVE',
    'Admin (:5175) verifies RBAC (403 for GUEST), 100% SHA-256 chain integrity & PostgreSQL audit views',
    guestAuditDenied.status === 403 &&
      adminLogin.status === 200 &&
      adminAudit.status === 200 &&
      adminAudit.data.chain_integrity_verified === true &&
      adminAudit.data.db_views?.booking_tamper_count === 0 &&
      adminAudit.data.db_views?.pci_dss_verdict === 'COMPLIANT_ZERO_PAN_STORED' &&
      adminAudit.data.db_views?.overbooking_conflicts === 0,
    {
      totalAuditEntries: adminAudit.data.total_entries,
      chainVerified: adminAudit.data.chain_integrity_verified,
      dbViews: adminAudit.data.db_views,
    }
  );

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  const evidencePath = path.resolve(__dirname, '..', 'evidencias', 'live_e2e_audit_v3.2.0.json');
  fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
  fs.writeFileSync(
    evidencePath,
    JSON.stringify(
      {
        version: '3.2.0',
        executedAtUtc: new Date().toISOString(),
        summary: { total: results.length, passed, failed },
        results,
      },
      null,
      2
    )
  );

  await pool.end();
  process.stdout.write('======================================================================\n');
  process.stdout.write(` LIVE E2E SUMMARY: ${passed} PASSED, ${failed} FAILED\n`);
  process.stdout.write(` Evidence saved: ${evidencePath}\n`);
  process.stdout.write('======================================================================\n');
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  process.stderr.write(`LIVE E2E FATAL: ${err.stack || err.message}\n`);
  process.exit(1);
});
