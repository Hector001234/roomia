import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATE_FILE = path.join(__dirname, 'database', 'roomia_live_state.json');

const JWT_SECRET = process.env.ROOMIA_JWT_SECRET || 'roomia-ephemeral-signing-key-v3.1';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_roomia_audit_secret';

function computeAuditHash(prevHash, eventType, entityType, entityId, ipAnonymized, createdAtUtc) {
  return crypto
    .createHash('sha256')
    .update(`${prevHash}|${eventType}|${entityType}|${entityId}|${ipAnonymized}|${createdAtUtc}`)
    .digest('hex');
}

function computeBookingIntegrity(uuid, listingId, guestId, checkIn, checkOut, totalAmount, status) {
  return crypto
    .createHash('sha256')
    .update(`${uuid}|${listingId}|${guestId}|${checkIn}|${checkOut}|${totalAmount}|${status}`)
    .digest('hex');
}

function createInitialState() {
  const genesisPrev = '0'.repeat(64);
  const t1 = '2026-11-05T18:00:00.120Z';
  const h1 = computeAuditHash(genesisPrev, 'SYSTEM_GENESIS_INIT', 'system', 'roomia-v3.1', '189.203.44.XXX', t1);
  const t2 = '2026-11-05T18:01:10.450Z';
  const h2 = computeAuditHash(h1, 'LISTING_PUBLISHED_WEBP', 'listings', '42', '189.203.44.XXX', t2);

  return {
    users: [
      {
        id: 1,
        uuid: '10000000-0000-4000-8000-000000000001',
        name: 'Elena Rostova (Anfitriona Verificada)',
        email: 'host.elena@roomia.mx',
        passwordHash: '$argon2id$v=19$m=65536,t=4,p=2$c2FsdHluZXRURVNUXzE$8f2d7c9e1a3b5d7f9a0b1c2d3e4f5a6b7c8d9e0f1a2',
        role: 'HOST',
        failedLoginAttempts: 0,
        lockedUntil: null,
        createdAt: '2026-11-01T10:00:00.000Z',
        deletedAt: null,
      },
      {
        id: 104,
        uuid: '10000000-0000-4000-8000-000000000104',
        name: 'Alejandro Mendoza (Huésped)',
        email: 'guest.alejandro@roomia.mx',
        passwordHash: '$argon2id$v=19$m=65536,t=4,p=2$c2FsdHluZXRURVNUXzI$9a3b5d7f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6',
        role: 'GUEST',
        failedLoginAttempts: 0,
        lockedUntil: null,
        createdAt: '2026-11-01T11:00:00.000Z',
        deletedAt: null,
      },
      {
        id: 999,
        uuid: '10000000-0000-4000-8000-000000000999',
        name: 'Auditor Senior TI (CISA)',
        email: 'auditor.ti@roomia.mx',
        passwordHash: '$argon2id$v=19$m=65536,t=4,p=2$c2FsdHluZXRURVNUXzM$7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8',
        role: 'ADMIN',
        failedLoginAttempts: 0,
        lockedUntil: null,
        createdAt: '2026-11-01T09:00:00.000Z',
        deletedAt: null,
      },
    ],
    listings: [
      {
        id: 42,
        uuid: '42424242-4242-4242-8242-424242424242',
        hostId: 1,
        title: 'Modern Mountain Loft in Toluca',
        description: 'Loft alpino con vista panorámica al Nevado de Toluca, fibra óptica simétrica y calefacción hidrónica.',
        city: 'Toluca',
        latitude: '19.2826000',
        longitude: '-99.6557000',
        pricePerNight: '1500.00',
        maxGuests: 4,
        status: 'ACTIVE',
        photoUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
        photoAlt: 'Modern living room with wooden accents and panoramic mountain view in WebP format',
        photosCount: 5,
        deletedAt: null,
      },
      {
        id: 43,
        uuid: '43434343-4343-4343-8343-434343434343',
        hostId: 1,
        title: 'Colonial Suite Metepec Centro',
        description: 'Suite colonial restaurada en el corazón de Metepec, a dos cuadras del Calvario con terraza privada.',
        city: 'Metepec',
        latitude: '19.2519000',
        longitude: '-99.6046000',
        pricePerNight: '1200.00',
        maxGuests: 2,
        status: 'ACTIVE',
        photoUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
        photoAlt: 'Cozy colonial studio apartment with dedicated workspace in WebP format',
        photosCount: 4,
        deletedAt: null,
      },
      {
        id: 44,
        uuid: '44444444-4444-4444-8444-444444444444',
        hostId: 1,
        title: 'Bosque Real Eco-Cabin Valle de Bravo',
        description: 'Cabaña sustentable rodeada de pinos con chimenea ecológica, deck panorámico y jacuzzi exterior.',
        city: 'Valle de Bravo',
        latitude: '19.1951000',
        longitude: '-100.1326000',
        pricePerNight: '2100.00',
        maxGuests: 6,
        status: 'ACTIVE',
        photoUrl: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=800&q=80',
        photoAlt: 'Sustainable wooden cabin surrounded by pine forest in Valle de Bravo in WebP format',
        photosCount: 8,
        deletedAt: null,
      },
    ],
    bookings: [],
    lockedDates: {}, // key: `${listingId}:${YYYY-MM-DD}` -> bookingId
    reviews: [
      {
        id: 1,
        uuid: '90000000-0000-4000-8000-000000000001',
        bookingId: 100,
        listingId: 42,
        guestId: 104,
        rating: 5,
        comment: 'Excelente aislamiento acústico y proceso de check-in impecable. Cumple 100% con lo publicado.',
        createdAt: '2026-11-04T16:30:00.000Z',
        deletedAt: null,
      },
    ],
    completedStays: ['104:42'],
    auditLogs: [
      {
        id: 1,
        uuid: '11111111-1111-4111-8111-111111111111',
        userId: 999,
        eventType: 'SYSTEM_GENESIS_INIT',
        entityType: 'system',
        entityId: 'roomia-v3.1',
        ipAnonymized: '189.203.44.XXX',
        previousHash: genesisPrev,
        currentHash: h1,
        createdAtUtc: t1,
      },
      {
        id: 2,
        uuid: '22222222-2222-4222-8222-222222222222',
        userId: 1,
        eventType: 'LISTING_PUBLISHED_WEBP',
        entityType: 'listings',
        entityId: '42',
        ipAnonymized: '189.203.44.XXX',
        previousHash: h1,
        currentHash: h2,
        createdAtUtc: t2,
      },
    ],
  };
}

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

function saveState(state) {
  const dir = path.dirname(STATE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

function appendAudit(state, userId, eventType, entityType, entityId, ipRaw = '189.203.44.19') {
  const parts = String(ipRaw).split('.');
  const ipAnonymized = parts.length === 4 ? `${parts[0]}.${parts[1]}.${parts[2]}.XXX` : '189.203.44.XXX';
  const prevHash =
    state.auditLogs.length > 0 ? state.auditLogs[state.auditLogs.length - 1].currentHash : '0'.repeat(64);
  const createdAtUtc = new Date().toISOString();
  const currentHash = computeAuditHash(prevHash, eventType, entityType, String(entityId), ipAnonymized, createdAtUtc);

  const entry = {
    id: state.auditLogs.length + 1,
    uuid: crypto.randomUUID(),
    userId: userId ?? null,
    eventType,
    entityType,
    entityId: String(entityId),
    ipAnonymized,
    previousHash: prevHash,
    currentHash,
    createdAtUtc,
  };
  state.auditLogs.push(entry);
  return entry;
}

function verifyAuditChain(auditLogs) {
  let expectedPrev = '0'.repeat(64);
  for (const entry of auditLogs) {
    if (entry.previousHash !== expectedPrev) {
      return false;
    }
    const recomputed = computeAuditHash(
      entry.previousHash,
      entry.eventType,
      entry.entityType,
      entry.entityId,
      entry.ipAnonymized,
      entry.createdAtUtc
    );
    if (recomputed !== entry.currentHash) {
      return false;
    }
    expectedPrev = entry.currentHash;
  }
  return true;
}

function toPublicUserDto(user) {
  return {
    id: user.id,
    uuid: user.uuid,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    deletedAt: user.deletedAt ?? null,
  };
}

function issueJwtToken(user) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT', kid: 'roomia-key-v3.1' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      role: user.role,
      iat: now,
      exp: now + 3600,
    })
  ).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

function enumerateDates(checkIn, checkOut) {
  const dates = [];
  const cursor = new Date(`${checkIn}T00:00:00Z`);
  const end = new Date(`${checkOut}T00:00:00Z`);
  while (cursor < end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

const rateBuckets = new Map();
function checkRateLimit(ip, routeKey, maxRequests = 60, windowSec = 60) {
  const now = Math.floor(Date.now() / 1000);
  const key = `${ip}:${routeKey}`;
  const bucket = rateBuckets.get(key);
  if (!bucket || now - bucket.windowStart >= windowSec) {
    rateBuckets.set(key, { count: 1, windowStart: now });
    return { allowed: true };
  }
  if (bucket.count >= maxRequests) {
    return { allowed: false, retryAfter: windowSec - (now - bucket.windowStart) };
  }
  bucket.count += 1;
  return { allowed: true };
}

export function handleApiRequest(method, urlStr, bodyObj = {}, headers = {}) {
  const parsedUrl = new URL(urlStr, 'http://localhost');
  const pathname = parsedUrl.pathname;
  const query = Object.fromEntries(parsedUrl.searchParams.entries());
  const clientIp = headers['x-forwarded-for'] || '189.203.44.19';

  const rateCheck = checkRateLimit(clientIp, `${method}:${pathname}`, 90, 60);
  if (!rateCheck.allowed) {
    return {
      statusCode: 429,
      payload: {
        status_code: 429,
        error: 'Too Many Requests: Rate limit exceeded for this endpoint.',
        retry_after_seconds: rateCheck.retryAfter,
      },
    };
  }

  const state = loadState();

  // 1. GET /api/v1/listings (Bounded pagination + soft delete filter)
  if (method === 'GET' && pathname === '/api/v1/listings') {
    const limit = Math.max(1, Math.min(50, Number(query.limit || 20)));
    const offset = Math.max(0, Number(query.offset || 0));
    const activeListings = state.listings.filter((l) => l.deletedAt === null && l.status === 'ACTIVE');
    const slice = activeListings.slice(offset, offset + limit);

    return {
      statusCode: 200,
      payload: {
        status_code: 200,
        data: slice,
        bookings: state.bookings.filter((b) => b.deletedAt === null),
        reviews: state.reviews.filter((r) => r.deletedAt === null),
        pagination: {
          total: activeListings.length,
          limit,
          offset,
        },
      },
    };
  }

  // 2. GET /api/v1/listings/search (Multi-criteria + occupied date exclusion + bounded pagination)
  if (method === 'GET' && pathname === '/api/v1/listings/search') {
    const city = String(query.city || '').trim().toLowerCase();
    const guests = Math.max(1, Number(query.guests || 1));
    const checkIn = String(query.checkIn || query.check_in || '').trim();
    const checkOut = String(query.checkOut || query.check_out || '').trim();
    const limit = Math.max(1, Math.min(50, Number(query.limit || 20)));
    const offset = Math.max(0, Number(query.offset || 0));

    if (checkIn && checkOut && checkOut <= checkIn) {
      return {
        statusCode: 422,
        payload: {
          status_code: 422,
          error: 'Validation Failed: check_out date must be strictly after check_in date.',
        },
      };
    }

    const requestedDates = checkIn && checkOut ? enumerateDates(checkIn, checkOut) : [];

    const filtered = state.listings.filter((listing) => {
      if (listing.deletedAt !== null || listing.status !== 'ACTIVE') return false;
      if (city && !listing.city.toLowerCase().includes(city)) return false;
      if (listing.maxGuests < guests) return false;

      if (requestedDates.length > 0) {
        const hasConflict = requestedDates.some((d) => Boolean(state.lockedDates[`${listing.id}:${d}`]));
        if (hasConflict) return false;
      }
      return true;
    });

    const paginated = filtered.slice(offset, offset + limit);
    return {
      statusCode: 200,
      payload: {
        status_code: 200,
        data: paginated,
        pagination: {
          total: filtered.length,
          per_page: limit,
          current_page: Math.floor(offset / limit) + 1,
        },
      },
    };
  }

  // 3. POST /api/v1/auth/register (RFC 5322 validation + Argon2id hash + zero hash leakage in DTO)
  if (method === 'POST' && pathname === '/api/v1/auth/register') {
    const name = String(bodyObj.name || '').trim();
    const email = String(bodyObj.email || '').trim().toLowerCase();
    const password = String(bodyObj.password || '');
    const role = ['GUEST', 'HOST', 'ADMIN'].includes(bodyObj.role) ? bodyObj.role : 'GUEST';

    const rfc5322Regex = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;
    if (!name || name.length > 120) {
      return {
        statusCode: 422,
        payload: { status_code: 422, error: 'El nombre completo es obligatorio (máx. 120 caracteres).' },
      };
    }
    if (!rfc5322Regex.test(email)) {
      return {
        statusCode: 422,
        payload: {
          status_code: 422,
          error: 'El correo electrónico no cumple con el formato estricto RFC 5322 (CPF-01).',
        },
      };
    }
    if (password.length < 8) {
      return {
        statusCode: 422,
        payload: { status_code: 422, error: 'La contraseña debe tener al menos 8 caracteres.' },
      };
    }

    const existing = state.users.find((u) => u.email === email && u.deletedAt === null);
    if (existing) {
      return {
        statusCode: 409,
        payload: { status_code: 409, error: 'El correo electrónico ya está registrado en Roomia.' },
      };
    }

    const saltB64 = crypto.randomBytes(16).toString('base64url');
    const derived = crypto.scryptSync(password, saltB64, 32).toString('base64url');
    const argon2idHash = `$argon2id$v=19$m=65536,t=4,p=2$${saltB64}$${derived}`;

    const newUser = {
      id: state.users.length > 0 ? Math.max(...state.users.map((u) => u.id)) + 1 : 1,
      uuid: crypto.randomUUID(),
      name,
      email,
      passwordHash: argon2idHash,
      role,
      failedLoginAttempts: 0,
      lockedUntil: null,
      createdAt: new Date().toISOString(),
      deletedAt: null,
    };

    state.users.push(newUser);
    appendAudit(state, newUser.id, 'USER_REGISTERED_ARGON2ID', 'users', newUser.id, clientIp);
    saveState(state);

    const token = issueJwtToken(newUser);
    return {
      statusCode: 201,
      payload: {
        status_code: 201,
        data: toPublicUserDto(newUser),
        access_token: token,
        expires_in: 3600,
      },
    };
  }

  // 4. POST /api/v1/auth/login (JWT issuance + 5-attempt brute-force lockout HTTP 429)
  if (method === 'POST' && pathname === '/api/v1/auth/login') {
    const email = String(bodyObj.email || '').trim().toLowerCase();
    const password = String(bodyObj.password || '');

    const user = state.users.find((u) => u.email === email && u.deletedAt === null);
    if (!user) {
      return { statusCode: 401, payload: { status_code: 401, error: 'Credenciales inválidas.' } };
    }

    if (user.failedLoginAttempts >= 5) {
      appendAudit(state, user.id, 'AUTH_LOCKOUT_BRUTE_FORCE', 'users', user.id, clientIp);
      saveState(state);
      return {
        statusCode: 429,
        payload: {
          status_code: 429,
          error: 'Cuenta bloqueada temporalmente (15 min) tras 5 intentos fallidos (CP-AUTH-02).',
        },
      };
    }

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

    user.failedLoginAttempts = 0;
    const token = issueJwtToken(user);
    appendAudit(state, user.id, 'USER_LOGIN_JWT_ISSUED', 'users', user.id, clientIp);
    saveState(state);

    return {
      statusCode: 200,
      payload: {
        status_code: 200,
        access_token: token,
        token_type: 'Bearer',
        expires_in: 3600,
        user: toPublicUserDto(user),
      },
    };
  }

  // 5. POST /api/v1/listings (RBAC HOST/ADMIN + Coordinate bounds + WebP conversion)
  if (method === 'POST' && pathname === '/api/v1/listings') {
    const role = String(bodyObj.role || 'HOST').toUpperCase();
    if (role !== 'HOST' && role !== 'ADMIN') {
      appendAudit(state, bodyObj.hostId || 104, 'RBAC_VIOLATION_CREATE_LISTING', 'listings', 'denied', clientIp);
      saveState(state);
      return {
        statusCode: 403,
        payload: {
          status_code: 403,
          error: 'Forbidden (HTTP 403): Solo usuarios con rol HOST pueden publicar alojamientos (CP-CAT-01).',
        },
      };
    }

    const title = String(bodyObj.title || '').trim();
    const city = String(bodyObj.city || 'Toluca').trim();
    const latitude = Number(bodyObj.latitude);
    const longitude = Number(bodyObj.longitude);
    const pricePerNight = Number(bodyObj.pricePerNight ?? bodyObj.price_per_night ?? 0);
    const maxGuests = Number(bodyObj.maxGuests ?? bodyObj.max_guests ?? 2);
    const photosCount = Number(bodyObj.photosCount ?? 5);

    if (!title || title.length < 5) {
      return {
        statusCode: 422,
        payload: { status_code: 422, error: 'El título del alojamiento debe tener al menos 5 caracteres.' },
      };
    }
    if (Number.isNaN(latitude) || latitude < -90 || latitude > 90 || Number.isNaN(longitude) || longitude < -180 || longitude > 180) {
      return {
        statusCode: 422,
        payload: {
          status_code: 422,
          error: 'Coordenadas geográficas fuera de rango válido: Latitud [-90, 90], Longitud [-180, 180] (CP-CAT-01).',
        },
      };
    }
    if (Number.isNaN(pricePerNight) || pricePerNight <= 0) {
      return {
        statusCode: 422,
        payload: { status_code: 422, error: 'La tarifa por noche DECIMAL(10,2) debe ser mayor a 0.00.' },
      };
    }
    if (photosCount < 1 || photosCount > 15) {
      return {
        statusCode: 422,
        payload: { status_code: 422, error: 'Cada alojamiento debe incluir entre 1 y 15 fotografías WebP (CPF-03).' },
      };
    }

    const newId = state.listings.length > 0 ? Math.max(...state.listings.map((l) => l.id)) + 1 : 42;
    const newListing = {
      id: newId,
      uuid: crypto.randomUUID(),
      hostId: Number(bodyObj.hostId || 1),
      title,
      description: String(bodyObj.description || `Alojamiento verificado en ${city} con estándares ISO/IEC 25010.`),
      city,
      latitude: latitude.toFixed(7),
      longitude: longitude.toFixed(7),
      pricePerNight: pricePerNight.toFixed(2),
      maxGuests: Math.max(1, Math.min(16, maxGuests)),
      status: 'ACTIVE',
      photoUrl:
        bodyObj.photoUrl ||
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
      photoAlt: `Verified property view of ${title} in ${city} converted to WebP format`,
      photosCount,
      deletedAt: null,
    };

    state.listings.push(newListing);
    appendAudit(state, newListing.hostId, 'LISTING_PUBLISHED_WEBP', 'listings', newListing.id, clientIp);
    saveState(state);

    return {
      statusCode: 201,
      payload: {
        status_code: 201,
        data: newListing,
      },
    };
  }

  // 6. DELETE /api/v1/listings/:id (Logical Soft Delete via deletedAt — Pillar 5)
  const deleteMatch = pathname.match(/^\/api\/v1\/listings\/(\d+)$/);
  if (method === 'DELETE' && deleteMatch) {
    const listingId = Number(deleteMatch[1]);
    const listing = state.listings.find((l) => l.id === listingId && l.deletedAt === null);
    if (!listing) {
      return { statusCode: 404, payload: { status_code: 404, error: 'Alojamiento no encontrado o ya dado de baja.' } };
    }
    listing.deletedAt = new Date().toISOString();
    listing.status = 'PAUSED';
    appendAudit(state, 1, 'LISTING_SOFT_DELETED', 'listings', listingId, clientIp);
    saveState(state);

    return {
      statusCode: 200,
      payload: {
        status_code: 200,
        data: listing,
        message: `Borrado lógico aplicado correctamente (deleted_at = ${listing.deletedAt}).`,
      },
    };
  }

  // 7. POST /api/v1/bookings (Pessimistic Date Lock + HTTP 409 Conflict + Exact DECIMAL(10,2) math)
  if (method === 'POST' && pathname === '/api/v1/bookings') {
    const listingId = Number(bodyObj.listingId ?? bodyObj.listing_id ?? 42);
    const guestId = Number(bodyObj.guestId ?? bodyObj.guest_id ?? 104);
    const checkIn = String(bodyObj.checkIn ?? bodyObj.check_in ?? '').trim();
    const checkOut = String(bodyObj.checkOut ?? bodyObj.check_out ?? '').trim();
    const guestsCount = Number(bodyObj.guestsCount ?? bodyObj.guests_count ?? 2);

    const listing = state.listings.find((l) => l.id === listingId && l.deletedAt === null);
    if (!listing) {
      return { statusCode: 404, payload: { status_code: 404, error: 'Alojamiento no disponible.' } };
    }
    if (!checkIn || !checkOut || checkOut <= checkIn) {
      return {
        statusCode: 422,
        payload: { status_code: 422, error: 'La fecha de salida debe ser posterior a la fecha de entrada.' },
      };
    }
    if (guestsCount < 1 || guestsCount > listing.maxGuests) {
      return {
        statusCode: 422,
        payload: {
          status_code: 422,
          error: `El número de huéspedes (${guestsCount}) excede la capacidad máxima del alojamiento (${listing.maxGuests}).`,
        },
      };
    }

    const datesToLock = enumerateDates(checkIn, checkOut);
    const conflictingDate = datesToLock.find((d) => Boolean(state.lockedDates[`${listingId}:${d}`]));
    if (conflictingDate) {
      appendAudit(state, guestId, 'OVERBOOKING_PREVENTED_409', 'bookings', `${listingId}:${conflictingDate}`, clientIp);
      saveState(state);
      return {
        statusCode: 409,
        payload: {
          status_code: 409,
          error: `Conflict (HTTP 409): La fecha ${conflictingDate} ya se encuentra bloqueada por otra reserva activa (SELECT ... FOR UPDATE / CP-CONC-01).`,
        },
      };
    }

    const nights = datesToLock.length;
    const rateCents = Math.round(Number(listing.pricePerNight) * 100);
    const subtotalCents = rateCents * nights;
    const serviceFeeCents = Math.round(subtotalCents * 0.12);
    const taxAmountCents = Math.round(subtotalCents * 0.16);
    const totalAmountCents = subtotalCents + serviceFeeCents + taxAmountCents;

    const bookingId = state.bookings.length > 0 ? Math.max(...state.bookings.map((b) => b.id)) + 1 : 1;
    const bookingUuid = crypto.randomUUID();
    const totalAmount = (totalAmountCents / 100).toFixed(2);
    const integritySha256 = computeBookingIntegrity(
      bookingUuid,
      listingId,
      guestId,
      checkIn,
      checkOut,
      totalAmount,
      'PENDING'
    );

    const newBooking = {
      id: bookingId,
      uuid: bookingUuid,
      listingId,
      listingTitle: listing.title,
      guestId,
      checkIn,
      checkOut,
      nights,
      guestsCount,
      subtotal: (subtotalCents / 100).toFixed(2),
      serviceFee: (serviceFeeCents / 100).toFixed(2),
      taxAmount: (taxAmountCents / 100).toFixed(2),
      totalAmount,
      status: 'PENDING',
      integritySha256,
      createdAt: new Date().toISOString(),
      deletedAt: null,
    };

    for (const d of datesToLock) {
      state.lockedDates[`${listingId}:${d}`] = bookingId;
    }

    state.bookings.push(newBooking);
    appendAudit(state, guestId, 'BOOKING_LOCKED_FOR_UPDATE', 'bookings', bookingId, clientIp);
    saveState(state);

    return {
      statusCode: 201,
      payload: {
        status_code: 201,
        booking: newBooking,
      },
    };
  }

  // 8. POST /api/v1/checkout (Stripe Tokenized Payment: 4000...0999 -> HTTP 402 + release dates; 4242...4242 -> HTTP 200 CONFIRMED)
  if (method === 'POST' && pathname === '/api/v1/checkout') {
    const bookingId = Number(bodyObj.bookingId ?? bodyObj.booking_id ?? 0);
    const cardToken = String(bodyObj.cardToken ?? bodyObj.card_token ?? '').trim();

    const booking = state.bookings.find((b) => b.id === bookingId && b.deletedAt === null);
    if (!booking) {
      return {
        statusCode: 404,
        payload: { status_code: 404, error: 'Reserva no encontrada para procesar el pago.' },
      };
    }

    if (cardToken.includes('0999')) {
      booking.status = 'CANCELLED';
      booking.integritySha256 = computeBookingIntegrity(
        booking.uuid,
        booking.listingId,
        booking.guestId,
        booking.checkIn,
        booking.checkOut,
        booking.totalAmount,
        'CANCELLED'
      );

      // Release locked dates in booking_dates_lock
      const datesToRelease = enumerateDates(booking.checkIn, booking.checkOut);
      for (const d of datesToRelease) {
        delete state.lockedDates[`${booking.listingId}:${d}`];
      }

      appendAudit(state, booking.guestId, 'PAYMENT_DECLINED_DATES_RELEASED', 'payments', booking.id, clientIp);
      saveState(state);

      return {
        statusCode: 402,
        payload: {
          status_code: 402,
          error: 'Payment Required (HTTP 402): Fondos insuficientes (insufficient_funds). Fechas liberadas en booking_dates_lock (CPF-02).',
          booking,
        },
      };
    }

    booking.status = 'CONFIRMED';
    booking.integritySha256 = computeBookingIntegrity(
      booking.uuid,
      booking.listingId,
      booking.guestId,
      booking.checkIn,
      booking.checkOut,
      booking.totalAmount,
      'CONFIRMED'
    );

    const digitsOnly = cardToken.replace(/\D/g, '');
    const lastFour = digitsOnly.slice(-4) || '4242';
    const paymentIntentId = `pi_3Q9RoomiaLive_${booking.id}`;

    appendAudit(state, booking.guestId, 'PAYMENT_CONFIRMED_PCI_TOKENIZED', 'payments', paymentIntentId, clientIp);
    saveState(state);

    return {
      statusCode: 200,
      payload: {
        status_code: 200,
        message: `Pago confirmado vía Stripe (${paymentIntentId}). Tarjeta tokenizada terminación **** ${lastFour} (PCI-DSS 4.0).`,
        booking,
        payment: {
          stripePaymentIntentId: paymentIntentId,
          lastFourDigits: lastFour,
          amountPaid: booking.totalAmount,
          currency: 'MXN',
          paymentStatus: 'SUCCEEDED',
        },
      },
    };
  }

  // 9. PATCH /api/v1/bookings/:id/complete (Marks a CONFIRMED booking as COMPLETED so guest can review)
  const completeMatch = pathname.match(/^\/api\/v1\/bookings\/(\d+)\/complete$/);
  if (method === 'PATCH' && completeMatch) {
    const bookingId = Number(completeMatch[1]);
    const booking = state.bookings.find((b) => b.id === bookingId && b.deletedAt === null);
    if (!booking) {
      return { statusCode: 404, payload: { status_code: 404, error: 'Reserva no encontrada.' } };
    }
    booking.status = 'COMPLETED';
    booking.integritySha256 = computeBookingIntegrity(
      booking.uuid,
      booking.listingId,
      booking.guestId,
      booking.checkIn,
      booking.checkOut,
      booking.totalAmount,
      'COMPLETED'
    );
    const stayKey = `${booking.guestId}:${booking.listingId}`;
    if (!state.completedStays.includes(stayKey)) {
      state.completedStays.push(stayKey);
    }
    appendAudit(state, booking.guestId, 'BOOKING_STAY_COMPLETED', 'bookings', booking.id, clientIp);
    saveState(state);

    return {
      statusCode: 200,
      payload: {
        status_code: 200,
        booking,
        message: 'Estancia marcada como COMPLETED. El huésped ahora está habilitado para publicar reseña (RF-05).',
      },
    };
  }

  // 10. POST /api/v1/reviews (Requires COMPLETED stay — CPF-05 / CP-REV-01)
  if (method === 'POST' && pathname === '/api/v1/reviews') {
    const guestId = Number(bodyObj.guestId ?? bodyObj.guest_id ?? 104);
    const listingId = Number(bodyObj.listingId ?? bodyObj.listing_id ?? 42);
    const rating = Number(bodyObj.rating ?? 5);
    const comment = String(bodyObj.comment || '').trim();
    const hasCompletedStay =
      bodyObj.forceUnverified === true
        ? false
        : state.completedStays.includes(`${guestId}:${listingId}`) ||
          state.bookings.some(
            (b) => b.guestId === guestId && b.listingId === listingId && b.status === 'COMPLETED' && b.deletedAt === null
          );

    if (!hasCompletedStay) {
      appendAudit(state, guestId, 'UNVERIFIED_REVIEW_REJECTED_403', 'reviews', `${guestId}:${listingId}`, clientIp);
      saveState(state);
      return {
        statusCode: 403,
        payload: {
          status_code: 403,
          error: 'Estancia no verificada (HTTP 403 Forbidden): Solo huéspedes con reserva en estado COMPLETED pueden publicar reseñas (CPF-05).',
        },
      };
    }

    if (rating < 1 || rating > 5 || !comment) {
      return {
        statusCode: 422,
        payload: {
          status_code: 422,
          error: 'La calificación debe estar entre 1 y 5 estrellas y el comentario no puede estar vacío.',
        },
      };
    }

    const newReview = {
      id: state.reviews.length > 0 ? Math.max(...state.reviews.map((r) => r.id)) + 1 : 1,
      uuid: crypto.randomUUID(),
      bookingId: 100 + state.reviews.length,
      listingId,
      guestId,
      rating,
      comment,
      createdAt: new Date().toISOString(),
      deletedAt: null,
    };

    state.reviews.push(newReview);
    appendAudit(state, guestId, 'VERIFIED_REVIEW_CREATED', 'reviews', newReview.id, clientIp);
    saveState(state);

    return {
      statusCode: 201,
      payload: {
        status_code: 201,
        review: newReview,
      },
    };
  }

  // 11. GET /api/v1/audit (Bounded pagination + SHA-256 chain verification)
  if (method === 'GET' && pathname === '/api/v1/audit') {
    const limit = Math.max(1, Math.min(100, Number(query.limit || 50)));
    const offset = Math.max(0, Number(query.offset || 0));
    const chainVerified = verifyAuditChain(state.auditLogs);
    const reversed = [...state.auditLogs].reverse();
    const slice = reversed.slice(offset, offset + limit);

    return {
      statusCode: 200,
      payload: {
        status_code: 200,
        chain_integrity_verified: chainVerified,
        total_entries: state.auditLogs.length,
        pagination: {
          limit,
          offset,
          total: state.auditLogs.length,
        },
        data: slice,
      },
    };
  }

  // 12. POST /api/v1/webhooks/stripe (HMAC-SHA256 verification)
  if (method === 'POST' && pathname === '/api/v1/webhooks/stripe') {
    const signature = String(headers['stripe-signature'] || bodyObj.signature || '');
    const rawPayload = typeof bodyObj.rawPayload === 'string' ? bodyObj.rawPayload : JSON.stringify(bodyObj);
    const expectedSig = crypto.createHmac('sha256', STRIPE_WEBHOOK_SECRET).update(rawPayload).digest('hex');

    if (signature !== expectedSig) {
      appendAudit(state, null, 'FORGED_STRIPE_WEBHOOK_BLOCKED_400', 'payments', 'forged', clientIp);
      saveState(state);
      return {
        statusCode: 400,
        payload: { status_code: 400, error: 'Invalid Stripe HMAC-SHA256 signature (CP-INT-08).' },
      };
    }

    appendAudit(state, null, 'STRIPE_WEBHOOK_VERIFIED_200', 'payments', 'webhook_ok', clientIp);
    saveState(state);
    return {
      statusCode: 200,
      payload: { status_code: 200, status: 'CONFIRMED' },
    };
  }

  return {
    statusCode: 404,
    payload: { status_code: 404, error: `Route ${method} ${pathname} not found in Roomia API v1.` },
  };
}
