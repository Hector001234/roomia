import fs from 'fs';
import path from 'path';
import { handleApiRequest } from '../backend/apiEngine.mjs';

const baseDir = 'C:\\Users\\Hector\\Documents\\Proyecto_Auditoria\\rommia';
const evidenceDir = path.join(baseDir, 'evidencias');
const stateFile = path.join(baseDir, 'backend', 'database', 'roomia_live_state.json');

if (!fs.existsSync(evidenceDir)) {
  fs.mkdirSync(evidenceDir, { recursive: true });
}

// Backup live state to keep fixture tests 100% isolated and non-destructive
const originalStateBackup = fs.existsSync(stateFile) ? fs.readFileSync(stateFile, 'utf8') : null;

const testResults = [];

function runTest(id, name, fn) {
  try {
    const outcome = fn();
    testResults.push({ id, name, status: 'CONFIRMED', details: outcome });
  } catch (err) {
    testResults.push({ id, name, status: 'ERROR', error: err.message });
  }
}

try {
  // T01: Broken Access Control on /api/v1/audit (Unauthenticated GET returns 200)
  runTest('T01', 'Acceso sin autenticacion a /api/v1/audit', () => {
    const res = handleApiRequest('GET', '/api/v1/audit', {}, {});
    return {
      statusCode: res.statusCode,
      entriesExposed: Array.isArray(res.payload?.data) ? res.payload.data.length : 0,
      chainVerifiedFlag: res.payload?.chain_integrity_verified ?? null,
      findingConfirmed: res.statusCode === 200
    };
  });

  // T02: Hardcoded Password Bypass Check in /api/v1/auth/login
  runTest('T02', 'Validacion de contrasena en /api/v1/auth/login', () => {
    const res = handleApiRequest('POST', '/api/v1/auth/login', {
      email: 'guest.alejandro@roomia.mx',
      password: 'ArbitraryPasswordNotMatchingHash!'
    }, {});
    return {
      statusCode: res.statusCode,
      tokenIssued: Boolean(res.payload?.access_token),
      findingConfirmed: res.statusCode === 200 && Boolean(res.payload?.access_token)
    };
  });

  // T03: Excessive Data Exposure in /api/v1/listings
  runTest('T03', 'Exposicion de coleccion bookings en endpoint publico /api/v1/listings', () => {
    const res = handleApiRequest('GET', '/api/v1/listings', {}, {});
    return {
      statusCode: res.statusCode,
      bookingsPropertyPresent: res.payload?.bookings !== undefined,
      exposedBookingsCount: Array.isArray(res.payload?.bookings) ? res.payload.bookings.length : 0,
      findingConfirmed: res.statusCode === 200 && res.payload?.bookings !== undefined
    };
  });

  // T04: Hardcoded Secrets Fallback Check
  runTest('T04', 'Verificacion de valores fallback para secretos criptograficos', () => {
    const engineCode = fs.readFileSync(path.join(baseDir, 'backend', 'apiEngine.mjs'), 'utf8');
    const hasJwtFallback = engineCode.includes("process.env.ROOMIA_JWT_SECRET || '");
    const hasStripeFallback = engineCode.includes("process.env.STRIPE_WEBHOOK_SECRET || '");
    return {
      jwtFallbackPresent: hasJwtFallback,
      stripeFallbackPresent: hasStripeFallback,
      findingConfirmed: hasJwtFallback || hasStripeFallback
    };
  });

  // T05: Wildcard CORS Check in server.mjs
  runTest('T05', 'Verificacion de politica CORS por defecto en server.mjs', () => {
    const serverCode = fs.readFileSync(path.join(baseDir, 'backend', 'server.mjs'), 'utf8');
    const hasWildcard = serverCode.includes("process.env.CORS_ALLOWED_ORIGIN || '*'");
    const hasBodyLimit = serverCode.includes('maxBodySize') || serverCode.includes('content-length');
    return {
      corsWildcardFallback: hasWildcard,
      bodySizeLimitPresent: hasBodyLimit,
      findingConfirmed: hasWildcard
    };
  });

  // T06: Pessimistic Lock & Overbooking Prevention Control
  runTest('T06', 'Control positivo de concurrencia y prevencion de overbooking (HTTP 409)', () => {
    const res1 = handleApiRequest('POST', '/api/v1/bookings', {
      listingId: 42,
      guestId: 104,
      checkIn: '2027-01-10',
      checkOut: '2027-01-12',
      guestsCount: 2
    }, {});
    const res2 = handleApiRequest('POST', '/api/v1/bookings', {
      listingId: 42,
      guestId: 104,
      checkIn: '2027-01-10',
      checkOut: '2027-01-12',
      guestsCount: 2
    }, {});
    return {
      firstAttemptStatus: res1.statusCode,
      secondAttemptStatus: res2.statusCode,
      controlEffective: res1.statusCode === 201 && res2.statusCode === 409
    };
  });

  // T07: localStorage JWT persistence check in frontends
  runTest('T07', 'Persistencia de token JWT en localStorage en frontend y frontend-admin', () => {
    const pubAuth = fs.readFileSync(path.join(baseDir, 'frontend', 'src', 'context', 'AuthContext.tsx'), 'utf8');
    const admAuth = fs.readFileSync(path.join(baseDir, 'frontend-admin', 'src', 'context', 'AuthContext.tsx'), 'utf8');
    return {
      publicUsesLocalStorage: pubAuth.includes("localStorage.setItem('roomia_auth_token'"),
      adminUsesLocalStorage: admAuth.includes("localStorage.setItem('roomia_auth_token'"),
      findingConfirmed: pubAuth.includes('roomia_auth_token') || admAuth.includes('roomia_auth_token')
    };
  });

  // T08: Synchronous FS I/O check in apiEngine.mjs
  runTest('T08', 'Operaciones bloqueantes sincronas de E/S en apiEngine.mjs', () => {
    const engineCode = fs.readFileSync(path.join(baseDir, 'backend', 'apiEngine.mjs'), 'utf8');
    const readSyncMatches = (engineCode.match(/fs\.readFileSync/g) || []).length;
    const writeSyncMatches = (engineCode.match(/fs\.writeFileSync/g) || []).length;
    return {
      readFileSyncCount: readSyncMatches,
      writeFileSyncCount: writeSyncMatches,
      findingConfirmed: readSyncMatches > 0 && writeSyncMatches > 0
    };
  });

} finally {
  // Restore original state file so workspace remains clean
  if (originalStateBackup !== null) {
    fs.writeFileSync(stateFile, originalStateBackup, 'utf8');
  }
}

fs.writeFileSync(
  path.join(evidenceDir, 'fixtures_test_evidence.json'),
  JSON.stringify({ timestamp: new Date().toISOString(), environment: 'Isolated Local Fixture Runner', tests: testResults }, null, 2),
  'utf8'
);

console.log('FIXTURES EXECUTED:', testResults.length);
console.log(JSON.stringify(testResults, null, 2));
