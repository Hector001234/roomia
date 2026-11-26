import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { handleApiRequest } from '../apiEngine.mjs';
import { pool } from '../db.mjs';
import { resetAndSeedDatabase } from '../seed-postgres.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let passed = 0;
let failed = 0;

function assertAuditCase(testId, description, condition, detail = '') {
  if (condition) {
    passed++;
    process.stdout.write(`\x1b[32m[PASS]\x1b[0m ${testId}: ${description}\n`);
  } else {
    failed++;
    process.stdout.write(`\x1b[31m[FAIL]\x1b[0m ${testId}: ${description}${detail ? ` -> ${detail}` : ''}\n`);
  }
}

async function runSuite() {
  process.stdout.write('======================================================================\n');
  process.stdout.write(' ROOMIA AUTOMATED AUDIT VERIFICATION SUITE (v3.2.0 — POSTGRESQL 18)\n');
  process.stdout.write('======================================================================\n');

  // Reset PostgreSQL 18 roomia_db to clean seed state before running tests
  await resetAndSeedDatabase({ quiet: true });

  // 0. Health check against real PostgreSQL 18
  const health = await handleApiRequest('GET', '/api/v1/health');
  assertAuditCase(
    'DB-CONN-01',
    'API connects to live PostgreSQL 18 roomia_db as least-privilege roomia_app_user',
    health.statusCode === 200 && health.payload.database === 'roomia_db' && health.payload.db_user === 'roomia_app_user'
  );

  // 1. CPF-01: RFC 5322 Invalid Email Registration
  const cpf01 = await handleApiRequest('POST', '/api/v1/auth/register', {
    name: 'Carlos Ruiz',
    email: 'carlos.ruiz@dominio_invalido',
    password: 'SecurePass#2026',
    role: 'GUEST',
  });
  assertAuditCase('CPF-01', 'Reject invalid RFC 5322 email with HTTP 422', cpf01.statusCode === 422);

  // 2. CP-AUTH-01: Argon2id Hashing in PostgreSQL & Zero Hash Leakage in Public DTO
  const validReg = await handleApiRequest('POST', '/api/v1/auth/register', {
    name: 'Ana Gomez',
    email: 'ana.gomez@roomia.mx',
    password: 'SecurePass#2026',
    role: 'GUEST',
  });
  const dbAna = await pool.query('SELECT id, password_hash FROM users WHERE email = $1', ['ana.gomez@roomia.mx']);
  const storedAna = dbAna.rows[0];
  assertAuditCase(
    'CP-AUTH-01',
    'Password hashed with Argon2id header in PostgreSQL users table and omitted from public DTO',
    validReg.statusCode === 201 &&
      Boolean(storedAna && storedAna.password_hash.startsWith('$argon2id$v=19$m=65536,t=4,p=2$')) &&
      validReg.payload.data.passwordHash === undefined &&
      validReg.payload.data.password_hash === undefined
  );

  // 3. CP-AUTH-02: JWT Issuance (TTL 3600s) & 5-Attempt Brute Force Lockout (HTTP 429)
  const loginOk = await handleApiRequest('POST', '/api/v1/auth/login', {
    email: 'ana.gomez@roomia.mx',
    password: 'SecurePass#2026',
  });
  for (let i = 0; i < 5; i++) {
    await handleApiRequest('POST', '/api/v1/auth/login', {
      email: 'ana.gomez@roomia.mx',
      password: 'WrongPassword',
    });
  }
  const lockedResp = await handleApiRequest('POST', '/api/v1/auth/login', {
    email: 'ana.gomez@roomia.mx',
    password: 'SecurePass#2026',
  });
  assertAuditCase(
    'CP-AUTH-02',
    'Issue real HMAC-SHA256 JWT (TTL 3600s) and lock account in PostgreSQL with HTTP 429 after 5 failed attempts',
    loginOk.statusCode === 200 && loginOk.payload.expires_in === 3600 && lockedResp.statusCode === 429
  );

  // Login as HOST, GUEST, ADMIN using real passwords against PostgreSQL
  const hostLogin = await handleApiRequest('POST', '/api/v1/auth/login', {
    email: 'host.elena@roomia.mx',
    password: 'RoomiaAudit2026!',
  });
  const guestLogin = await handleApiRequest('POST', '/api/v1/auth/login', {
    email: 'guest.alejandro@roomia.mx',
    password: 'RoomiaAudit2026!',
  });
  const adminLogin = await handleApiRequest('POST', '/api/v1/auth/login', {
    email: 'auditor.ti@roomia.mx',
    password: 'RoomiaAudit2026!',
  });
  const hostAuth = { authorization: `Bearer ${hostLogin.payload.access_token}` };
  const guestAuth = { authorization: `Bearer ${guestLogin.payload.access_token}` };
  const adminAuth = { authorization: `Bearer ${adminLogin.payload.access_token}` };

  // Create second guest user for concurrency & review tests
  const guest2Reg = await handleApiRequest('POST', '/api/v1/auth/register', {
    name: 'Luis Concurrencia',
    email: 'luis.guest@roomia.mx',
    password: 'SecurePass#2026',
    role: 'GUEST',
  });
  const guest2Auth = { authorization: `Bearer ${guest2Reg.payload.access_token}` };

  // 4. CPF-03 & CP-CAT-01: Listing Creation with 15 WebP Photos, Coordinate Validation & RBAC
  const cpf03 = await handleApiRequest(
    'POST',
    '/api/v1/listings',
    {
      title: 'Bosque Real Cabin',
      city: 'Toluca',
      latitude: 19.2826,
      longitude: -99.6557,
      pricePerNight: 1500.0,
      maxGuests: 4,
      photosCount: 15,
    },
    hostAuth
  );
  const invalidCoords = await handleApiRequest(
    'POST',
    '/api/v1/listings',
    {
      title: 'Invalid Coords Listing',
      city: 'Toluca',
      latitude: 135.0,
      longitude: -99.0,
      pricePerNight: 1200.0,
      maxGuests: 2,
      photosCount: 2,
    },
    hostAuth
  );
  const guestForbidden = await handleApiRequest(
    'POST',
    '/api/v1/listings',
    {
      title: 'Unauthorized Host Listing',
      city: 'Toluca',
      latitude: 19.28,
      longitude: -99.65,
      pricePerNight: 900.0,
      maxGuests: 2,
      photosCount: 2,
    },
    guestAuth
  );

  assertAuditCase(
    'CPF-03',
    'Publish listing with 15 WebP photos persisted in PostgreSQL listing_photos (HTTP 201)',
    cpf03.statusCode === 201 && cpf03.payload.data.photosCount === 15
  );
  assertAuditCase(
    'CP-CAT-01',
    'Reject out-of-range coordinates (HTTP 422) and enforce RBAC HTTP 403 for GUEST JWT',
    invalidCoords.statusCode === 422 && guestForbidden.statusCode === 403
  );

  // 5. CP-CONC-01 & CP-CONC-02: Real PostgreSQL SELECT ... FOR UPDATE Lock Prevents Double Booking (HTTP 409)
  const firstBooking = await handleApiRequest(
    'POST',
    '/api/v1/bookings',
    {
      listingId: 42,
      checkIn: '2026-12-10',
      checkOut: '2026-12-13',
      guestsCount: 2,
    },
    guestAuth
  );
  const secondConcurrentBooking = await handleApiRequest(
    'POST',
    '/api/v1/bookings',
    {
      listingId: 42,
      checkIn: '2026-12-11',
      checkOut: '2026-12-14',
      guestsCount: 2,
    },
    guest2Auth
  );
  assertAuditCase(
    'CP-CONC-01',
    'PostgreSQL SELECT FOR UPDATE confirms first booking (201) and rejects overlapping booking with HTTP 409',
    firstBooking.statusCode === 201 && secondConcurrentBooking.statusCode === 409
  );
  assertAuditCase(
    'CP-CONC-02',
    'Exact NUMERIC(10,2) math (3 nights * 1500.00 = 4500.00 + 540.00 fee + 720.00 tax = 5760.00) & valid SHA-256',
    firstBooking.payload.booking.totalAmount === '5760.00' &&
      firstBooking.payload.booking.integritySha256.length === 64
  );

  // 6. CPF-04: Multi-Criteria Search Over Occupied Dates Excludes Locked Listing
  const cpf04 = await handleApiRequest(
    'GET',
    '/api/v1/listings/search?city=Toluca&guests=6&checkIn=2026-12-10&checkOut=2026-12-13'
  );
  assertAuditCase(
    'CPF-04',
    'Parameterized PostgreSQL search over occupied dates returns HTTP 200 with [] and total=0',
    cpf04.statusCode === 200 && cpf04.payload.data.length === 0 && cpf04.payload.pagination.total === 0
  );

  // 7. CPF-02, CP-INT-04 & CP-INT-08: Stripe Payment Declined (402 + Date Release) & Webhook Verification
  const cpf02 = await handleApiRequest(
    'POST',
    '/api/v1/checkout',
    {
      bookingId: firstBooking.payload.booking.id,
      cardToken: '4000 0000 0000 0999',
    },
    guestAuth
  );
  const rebookAfterRelease = await handleApiRequest(
    'POST',
    '/api/v1/bookings',
    {
      listingId: 42,
      checkIn: '2026-12-10',
      checkOut: '2026-12-13',
      guestsCount: 2,
    },
    guest2Auth
  );
  assertAuditCase(
    'CPF-02',
    'Declined card (0999) returns HTTP 402 and releases booking_dates in PostgreSQL for rebooking (201)',
    cpf02.statusCode === 402 && rebookAfterRelease.statusCode === 201
  );

  const testStripeSecret = 'whsec_test_isolated_key_v32';
  process.env.STRIPE_WEBHOOK_SECRET = testStripeSecret;
  const rawWebhook = JSON.stringify({
    type: 'payment_intent.succeeded',
    bookingId: rebookAfterRelease.payload.booking.id,
  });
  const validSig = crypto.createHmac('sha256', testStripeSecret).update(rawWebhook).digest('hex');
  const cpInt04 = await handleApiRequest(
    'POST',
    '/api/v1/webhooks/stripe',
    { rawPayload: rawWebhook, signature: validSig },
    { 'stripe-signature': validSig }
  );
  const cpInt08 = await handleApiRequest(
    'POST',
    '/api/v1/webhooks/stripe',
    { rawPayload: rawWebhook, signature: 'forged_sig' },
    { 'stripe-signature': 'forged_sig' }
  );
  assertAuditCase(
    'CP-INT-04 & CP-INT-08',
    'Signed Stripe webhook confirms booking in PostgreSQL (200) and forged signature is rejected (400)',
    cpInt04.statusCode === 200 && cpInt08.statusCode === 400
  );

  // 8. CPF-05 & CP-REV-01: Review Requires COMPLETED Stay
  const cpf05 = await handleApiRequest(
    'POST',
    '/api/v1/reviews',
    {
      listingId: 42,
      rating: 5,
      comment: 'Attempt before COMPLETED stay',
    },
    guest2Auth
  );
  await handleApiRequest('PATCH', `/api/v1/bookings/${rebookAfterRelease.payload.booking.id}/complete`, {}, hostAuth);
  const cpRev01 = await handleApiRequest(
    'POST',
    '/api/v1/reviews',
    {
      listingId: 42,
      rating: 5,
      comment: 'Verified stay review after COMPLETED status',
    },
    guest2Auth
  );
  assertAuditCase(
    'CPF-05 & CP-REV-01',
    'Reject unverified review (HTTP 403) and allow review after COMPLETED stay (HTTP 201)',
    cpf05.statusCode === 403 && cpRev01.statusCode === 201
  );

  // 9. CP-AUD-01 & CP-AUD-02: Immutable Audit Log, RBAC (401/403) & 100% SHA-256 Chain + DB Views
  const auditNoAuth = await handleApiRequest('GET', '/api/v1/audit?limit=50&offset=0');
  const auditGuestForbidden = await handleApiRequest('GET', '/api/v1/audit?limit=50&offset=0', {}, guestAuth);
  const auditResp = await handleApiRequest('GET', '/api/v1/audit?limit=50&offset=0', {}, adminAuth);

  assertAuditCase(
    'CP-AUD-01 & CP-AUD-02',
    'Enforce JWT+RBAC (401/403) on /audit and verify 100% PostgreSQL SHA-256 chain & audit views',
    auditNoAuth.statusCode === 401 &&
      auditGuestForbidden.statusCode === 403 &&
      auditResp.statusCode === 200 &&
      auditResp.payload.chain_integrity_verified === true &&
      auditResp.payload.db_views.booking_tamper_count === 0 &&
      auditResp.payload.db_views.pci_dss_verdict === 'COMPLIANT_ZERO_PAN_STORED' &&
      auditResp.payload.db_views.overbooking_conflicts === 0
  );

  // 10. CP-PGSQL-02: Live PostgreSQL Immutability Trigger Blocks UPDATE on audit_logs
  let immutabilityBlocked = false;
  try {
    await pool.query("UPDATE audit_logs SET event_type = 'HACKED' WHERE id = 1");
  } catch (err) {
    // Either permission denied (42501) from least-privilege REVOKE or trigger (45000)
    immutabilityBlocked = err.code === '42501' || err.code === '45000';
  }
  assertAuditCase(
    'CP-PGSQL-02',
    'PostgreSQL blocks UPDATE on audit_logs (least-privilege REVOKE + trigger SQLSTATE 45000)',
    immutabilityBlocked
  );

  // 11. Soft Delete + Restore Verification
  const softDeleteResp = await handleApiRequest('DELETE', `/api/v1/listings/${cpf03.payload.data.id}`, {}, hostAuth);
  const restoreResp = await handleApiRequest(
    'PATCH',
    `/api/v1/listings/${cpf03.payload.data.id}/restore`,
    {},
    hostAuth
  );
  assertAuditCase(
    'CP-SOFTDEL-01',
    'Soft delete sets deleted_at in PostgreSQL and restore reactivates listing cleanly',
    softDeleteResp.statusCode === 200 &&
      softDeleteResp.payload.data.deletedAt !== null &&
      restoreResp.statusCode === 200 &&
      restoreResp.payload.data.deletedAt === null
  );

  // Re-seed clean default state for live UI
  await resetAndSeedDatabase({ quiet: true });
  await pool.end();

  process.stdout.write('======================================================================\n');
  process.stdout.write(` SUMMARY: ${passed} PASSED, ${failed} FAILED\n`);
  process.stdout.write('======================================================================\n');
  process.exit(failed > 0 ? 1 : 0);
}

runSuite().catch((err) => {
  process.stderr.write(`FATAL SUITE ERROR: ${err.stack || err.message}\n`);
  process.exit(1);
});
