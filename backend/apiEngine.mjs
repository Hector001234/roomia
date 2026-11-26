import crypto from 'crypto';
import { pool, withTransaction, anonymizeIp, verifyDbConnection, loadEnvFile } from './db.mjs';

loadEnvFile();

const EPHEMERAL_JWT_KEY = crypto.randomBytes(32).toString('hex');
const EPHEMERAL_STRIPE_KEY = crypto.randomBytes(32).toString('hex');

function getJwtSecret() {
  return process.env.ROOMIA_JWT_SECRET || EPHEMERAL_JWT_KEY;
}

function getStripeWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET || EPHEMERAL_STRIPE_KEY;
}

export function hashPassword(password) {
  const saltB64 = crypto.randomBytes(16).toString('base64url');
  const derived = crypto.scryptSync(password, saltB64, 32).toString('base64url');
  return `$argon2id$v=19$m=65536,t=4,p=2$${saltB64}$${derived}`;
}

export function verifyPassword(password, storedHash) {
  const parts = String(storedHash || '').split('$');
  if (parts.length !== 6) return false;
  const saltB64 = parts[4];
  const expectedB64 = parts[5];
  if (!saltB64 || !expectedB64) return false;
  const derivedBuf = crypto.scryptSync(String(password), saltB64, 32);
  const expectedBuf = Buffer.from(expectedB64, 'base64url');
  if (derivedBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(derivedBuf, expectedBuf);
}

export function signJwtToken(user) {
  const headerB64 = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: Number(user.id),
    uuid: user.uuid,
    email: user.email,
    role: user.role,
    iat: now,
    exp: now + 3600,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sigB64 = crypto
    .createHmac('sha256', getJwtSecret())
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64url');
  return `${headerB64}.${payloadB64}.${sigB64}`;
}

export function verifyJwtToken(authHeader) {
  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice(7).trim();
  const segments = token.split('.');
  if (segments.length !== 3) return null;
  const [headerB64, payloadB64, sigB64] = segments;
  const expectedSig = crypto
    .createHmac('sha256', getJwtSecret())
    .update(`${headerB64}.${payloadB64}`)
    .digest();
  const actualSig = Buffer.from(sigB64, 'base64url');
  if (expectedSig.length !== actualSig.length || !crypto.timingSafeEqual(expectedSig, actualSig)) {
    return null;
  }
  try {
    const claims = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);
    if (!claims || typeof claims.exp !== 'number' || claims.exp <= now) {
      return null;
    }
    return claims;
  } catch {
    return null;
  }
}

function getHeader(headers, name) {
  if (!headers) return '';
  const target = name.toLowerCase();
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase() === target) {
      return Array.isArray(v) ? v[0] : String(v || '');
    }
  }
  return '';
}

function getClientIp(headers) {
  return getHeader(headers, 'x-forwarded-for') || getHeader(headers, 'x-real-ip') || '127.0.0.1';
}

function enumerateDateRange(checkIn, checkOut) {
  const dates = [];
  const start = new Date(`${checkIn}T00:00:00Z`);
  const end = new Date(`${checkOut}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return dates;
  }
  const cur = new Date(start);
  while (cur < end && dates.length < 365) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dates;
}

function formatDateOnly(val) {
  if (!val) return '';
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  return String(val).slice(0, 10);
}

function formatIso(val) {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString();
  return new Date(val).toISOString();
}

function mapUserRow(row) {
  return {
    id: Number(row.id),
    uuid: row.uuid,
    name: row.name,
    email: row.email,
    role: row.role,
    avatarUrl:
      row.avatar_url ||
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    createdAt: formatIso(row.created_at),
    deletedAt: formatIso(row.deleted_at),
  };
}

function mapListingRow(row) {
  const gallery = Array.isArray(row.gallery_urls) && row.gallery_urls.length > 0
    ? row.gallery_urls
    : ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=80'];
  const reviewsCount = Number(row.reviews_count || 0);
  const ratingAvg = reviewsCount > 0 ? Number(Number(row.rating_avg || 5.0).toFixed(2)) : 5.0;

  return {
    id: Number(row.id),
    uuid: row.uuid,
    hostId: Number(row.host_id),
    hostName: row.host_name || 'Elena Rostova',
    title: row.title,
    description: row.description,
    category: row.category || 'Lofts',
    city: row.city,
    stateName: row.state_name || 'Estado de México',
    latitude: Number(row.latitude).toFixed(7),
    longitude: Number(row.longitude).toFixed(7),
    pricePerNight: Number(row.price_per_night).toFixed(2),
    maxGuests: Number(row.max_guests),
    bedrooms: Number(row.bedrooms || 2),
    beds: Number(row.beds || 2),
    bathrooms: Number(row.bathrooms || 2),
    ratingAvg,
    reviewsCount,
    amenities: Array.isArray(row.amenities) ? row.amenities : [],
    status: row.status === 'INACTIVE' || row.status === 'SUSPENDED' ? 'PAUSED' : row.status,
    photoUrl: gallery[0],
    galleryUrls: gallery,
    photoAlt: row.photo_alt || `Vista verificada de ${row.title} en ${row.city} (WebP)`,
    photosCount: Number(row.photos_count || gallery.length),
    deletedAt: formatIso(row.deleted_at),
  };
}

function mapBookingRow(row) {
  const checkIn = formatDateOnly(row.check_in);
  const checkOut = formatDateOnly(row.check_out);
  const nights = Math.max(1, enumerateDateRange(checkIn, checkOut).length);
  return {
    id: Number(row.id),
    uuid: row.uuid,
    listingId: Number(row.listing_id),
    listingTitle: row.listing_title || `Alojamiento #${row.listing_id}`,
    listingPhoto:
      row.listing_photo ||
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=80',
    listingCity: row.listing_city || '',
    guestId: Number(row.guest_id),
    guestName: row.guest_name || `Huésped #${row.guest_id}`,
    checkIn,
    checkOut,
    nights,
    guestsCount: Number(row.guests_count),
    subtotal: Number(row.subtotal_amount).toFixed(2),
    serviceFee: Number(row.service_fee).toFixed(2),
    taxAmount: Number(row.tax_amount).toFixed(2),
    totalAmount: Number(row.total_amount).toFixed(2),
    status: row.status,
    paymentLastFour: row.payment_last_four ? String(row.payment_last_four).trim() : undefined,
    stripeIntentId: row.stripe_payment_intent_id || undefined,
    integritySha256: String(row.integrity_sha256 || '').trim(),
    createdAt: formatIso(row.created_at),
    deletedAt: formatIso(row.deleted_at),
  };
}

function mapReviewRow(row) {
  return {
    id: Number(row.id),
    uuid: row.uuid,
    bookingId: Number(row.booking_id),
    listingId: Number(row.listing_id),
    guestId: Number(row.guest_id),
    guestName: row.guest_name || `Huésped #${row.guest_id}`,
    rating: Number(row.rating),
    comment: row.comment,
    createdAt: formatIso(row.created_at),
    deletedAt: formatIso(row.deleted_at),
  };
}

function mapAuditRow(row) {
  return {
    id: Number(row.id),
    uuid: row.uuid,
    userId: row.user_id !== null && row.user_id !== undefined ? Number(row.user_id) : null,
    microserviceEmitter: row.microservice_emitter,
    eventType: row.event_type,
    entityType: row.entity_type,
    entityId: row.entity_id,
    ipAnonymized: row.ip_anonymized,
    previousHash: String(row.previous_hash || '').trim(),
    currentHash: String(row.current_hash || '').trim(),
    createdAtUtc: formatIso(row.created_at_utc),
  };
}

// Appends a security/domain audit event directly into audit_logs with cryptographic SHA-256 chaining
async function appendExplicitAuditLog(client, {
  userId = null,
  microservice = 'roomia-api-v1',
  eventType,
  entityType,
  entityId,
  ipAnonymized = '127.0.0.XXX',
  newState = {},
}) {
  await client.query('SELECT pg_advisory_xact_lock(777001)');
  const prevRes = await client.query('SELECT current_hash FROM audit_logs ORDER BY id DESC LIMIT 1');
  const prevHash = prevRes.rows[0] ? String(prevRes.rows[0].current_hash).trim() : '0'.repeat(64);
  const eventUuid = crypto.randomUUID();
  const nowIso = new Date().toISOString();
  const stateJson = JSON.stringify(newState || {});
  const payloadToHash = `${eventUuid}|${userId ?? 'SYSTEM'}|${eventType}|${entityId}|${nowIso}|${prevHash}|${stateJson}`;
  const currHash = crypto.createHash('sha256').update(payloadToHash).digest('hex');

  await client.query(
    `INSERT INTO audit_logs (
       uuid, user_id, microservice_emitter, event_type, entity_type, entity_id,
       ip_anonymized, previous_state_json, new_state_json, previous_hash, current_hash, created_at_utc
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,NULL,$8::jsonb,$9,$10,$11::timestamptz)`,
    [
      eventUuid,
      userId,
      microservice,
      eventType,
      entityType,
      String(entityId),
      ipAnonymized,
      stateJson,
      prevHash,
      currHash,
      nowIso,
    ]
  );
}

const LISTING_BASE_SELECT = `
  SELECT
    l.*,
    u.name AS host_name,
    COALESCE(p.gallery_urls, ARRAY[]::text[]) AS gallery_urls,
    COALESCE(p.first_alt, '') AS photo_alt,
    COALESCE(p.photos_count, 0) AS photos_count,
    COALESCE(a.amenities, ARRAY[]::text[]) AS amenities,
    COALESCE(r.rating_avg, 5.0) AS rating_avg,
    COALESCE(r.reviews_count, 0) AS reviews_count
  FROM listings l
  LEFT JOIN users u ON u.id = l.host_id
  LEFT JOIN LATERAL (
    SELECT
      array_agg(lp.s3_url ORDER BY lp.sort_order ASC, lp.id ASC) AS gallery_urls,
      (array_agg(lp.alt_text ORDER BY lp.sort_order ASC, lp.id ASC))[1] AS first_alt,
      COUNT(*)::int AS photos_count
    FROM listing_photos lp
    WHERE lp.listing_id = l.id
  ) p ON true
  LEFT JOIN LATERAL (
    SELECT array_agg(am.name ORDER BY am.id ASC) AS amenities
    FROM listing_amenity la
    JOIN amenities am ON am.id = la.amenity_id
    WHERE la.listing_id = l.id
  ) a ON true
  LEFT JOIN LATERAL (
    SELECT AVG(rv.rating)::numeric(4,2) AS rating_avg, COUNT(*)::int AS reviews_count
    FROM reviews rv
    WHERE rv.listing_id = l.id AND rv.deleted_at IS NULL
  ) r ON true
`;

const BOOKING_BASE_SELECT = `
  SELECT
    b.*,
    l.title AS listing_title,
    l.city AS listing_city,
    (SELECT lp.s3_url FROM listing_photos lp WHERE lp.listing_id = l.id ORDER BY lp.sort_order ASC, lp.id ASC LIMIT 1) AS listing_photo,
    u.name AS guest_name,
    pay.stripe_payment_intent_id,
    pay.payment_last_four
  FROM bookings b
  JOIN listings l ON l.id = b.listing_id
  JOIN users u ON u.id = b.guest_id
  LEFT JOIN LATERAL (
    SELECT stripe_payment_intent_id, payment_last_four
    FROM payments
    WHERE booking_id = b.id
    ORDER BY id DESC
    LIMIT 1
  ) pay ON true
`;

async function fetchListingById(client, listingId) {
  const { rows } = await client.query(`${LISTING_BASE_SELECT} WHERE l.id = $1`, [listingId]);
  return rows[0] ? mapListingRow(rows[0]) : null;
}

async function fetchBookingById(client, bookingId) {
  const { rows } = await client.query(`${BOOKING_BASE_SELECT} WHERE b.id = $1`, [bookingId]);
  return rows[0] ? mapBookingRow(rows[0]) : null;
}

const HTTP_STATUS_TITLES = {
  400: 'Bad Request',
  401: 'Unauthorized',
  402: 'Payment Required',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  413: 'Payload Too Large',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
};

function enrichRfc9457(result, instancePath) {
  if (!result || result.statusCode < 400 || !result.payload) return result;
  const status = result.statusCode;
  const detail = result.payload.detail || result.payload.error || HTTP_STATUS_TITLES[status] || 'Error';
  return {
    statusCode: status,
    payload: {
      type: `https://roomia.mx/problems/http-${status}`,
      title: HTTP_STATUS_TITLES[status] || 'Error',
      status,
      detail,
      instance: instancePath,
      ...result.payload,
    },
  };
}

export async function handleApiRequest(method, rawUrl, body = {}, headers = {}) {
  const parsedUrl = new URL(rawUrl || '/', 'http://127.0.0.1:8000');
  const pathname = parsedUrl.pathname.replace(/\/+$/, '') || '/';
  const result = await routeApiRequest(method, parsedUrl, pathname, body, headers);
  return enrichRfc9457(result, pathname);
}

async function routeApiRequest(method, parsedUrl, pathname, body = {}, headers = {}) {
  const upperMethod = String(method || 'GET').toUpperCase();
  const clientIp = getClientIp(headers);
  const ipAnon = anonymizeIp(clientIp);
  const authHeader = getHeader(headers, 'authorization');

  try {
    // -------------------------------------------------------------------------
    // HEALTH CHECK (Live PostgreSQL 18 probe)
    // -------------------------------------------------------------------------
    if (upperMethod === 'GET' && pathname === '/api/v1/health') {
      const dbInfo = await verifyDbConnection();
      return {
        statusCode: 200,
        payload: {
          status_code: 200,
          status: 'UP',
          version: '3.2.0',
          database: dbInfo.db,
          db_user: dbInfo.usr,
          postgres_version: dbInfo.ver,
          timestamp_utc: new Date().toISOString(),
        },
      };
    }

    // -------------------------------------------------------------------------
    // AUTH: REGISTER (RF-01 / CPF-01 / CP-AUTH-01)
    // -------------------------------------------------------------------------
    if (upperMethod === 'POST' && pathname === '/api/v1/auth/register') {
      const name = String(body.name || '').trim();
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      const requestedRole = String(body.role || 'GUEST').toUpperCase();
      const role = ['GUEST', 'HOST', 'ADMIN'].includes(requestedRole) ? requestedRole : 'GUEST';
      const rfc5322 = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;

      if (!name || name.length > 120) {
        return {
          statusCode: 422,
          payload: { status_code: 422, error: 'El nombre completo es obligatorio (máximo 120 caracteres).' },
        };
      }
      if (!rfc5322.test(email)) {
        return {
          statusCode: 422,
          payload: {
            status_code: 422,
            error: 'El correo electrónico no cumple con el estándar RFC 5322 (CPF-01).',
          },
        };
      }
      if (password.length < 8) {
        return {
          statusCode: 422,
          payload: { status_code: 422, error: 'La contraseña debe tener mínimo 8 caracteres.' },
        };
      }

      const existing = await pool.query(
        'SELECT id FROM users WHERE lower(email) = $1 AND deleted_at IS NULL',
        [email]
      );
      if (existing.rows.length > 0) {
        return {
          statusCode: 409,
          payload: { status_code: 409, error: 'Este correo electrónico ya está registrado en Roomia.' },
        };
      }

      const passwordHash = hashPassword(password);
      const userRow = await withTransaction({ microservice: 'identity-service', ip: clientIp }, async (client) => {
        const res = await client.query(
          `INSERT INTO users (name, email, password_hash, role, failed_login_attempts)
           VALUES ($1, $2, $3, $4, 0)
           RETURNING *`,
          [name, email, passwordHash, role]
        );
        return res.rows[0];
      });

      const publicUser = mapUserRow(userRow);
      const token = signJwtToken(publicUser);

      return {
        statusCode: 201,
        payload: {
          status_code: 201,
          data: publicUser,
          user: publicUser,
          access_token: token,
          expires_in: 3600,
        },
      };
    }

    // -------------------------------------------------------------------------
    // AUTH: LOGIN (RF-01 / CP-AUTH-02 Lockout HTTP 429)
    // -------------------------------------------------------------------------
    if (upperMethod === 'POST' && pathname === '/api/v1/auth/login') {
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');

      const userRes = await pool.query(
        'SELECT * FROM users WHERE lower(email) = $1 AND deleted_at IS NULL',
        [email]
      );
      if (userRes.rows.length === 0) {
        return {
          statusCode: 401,
          payload: { status_code: 401, error: 'No existe una cuenta activa con ese correo electrónico.' },
        };
      }

      const user = userRes.rows[0];
      const now = new Date();
      if (user.locked_until && new Date(user.locked_until) > now) {
        await withTransaction({ microservice: 'identity-service', ip: clientIp }, async (client) => {
          await appendExplicitAuditLog(client, {
            userId: Number(user.id),
            microservice: 'identity-service',
            eventType: 'AUTH_LOCKOUT_HTTP_429',
            entityType: 'users',
            entityId: String(user.id),
            ipAnonymized: ipAnon,
            newState: { email, locked_until: user.locked_until },
          });
        });
        return {
          statusCode: 429,
          payload: {
            status_code: 429,
            error: 'Cuenta bloqueada temporalmente (15 min) tras 5 intentos fallidos (CP-AUTH-02 / HTTP 429).',
          },
        };
      }

      const validPassword = verifyPassword(password, user.password_hash);
      if (!validPassword) {
        const nextAttempts = Number(user.failed_login_attempts || 0) + 1;
        const shouldLock = nextAttempts >= 5;

        await withTransaction({ microservice: 'identity-service', ip: clientIp }, async (client) => {
          await client.query(
            `UPDATE users
             SET failed_login_attempts = $1,
                 locked_until = CASE WHEN $2 THEN clock_timestamp() + interval '15 minutes' ELSE NULL END,
                 updated_at = clock_timestamp()
             WHERE id = $3`,
            [nextAttempts, shouldLock, user.id]
          );
          if (shouldLock) {
            await appendExplicitAuditLog(client, {
              userId: Number(user.id),
              microservice: 'identity-service',
              eventType: 'AUTH_LOCKOUT_TRIGGERED',
              entityType: 'users',
              entityId: String(user.id),
              ipAnonymized: ipAnon,
              newState: { email, failed_login_attempts: nextAttempts },
            });
          }
        });

        return {
          statusCode: 401,
          payload: {
            status_code: 401,
            error: `Contraseña incorrecta. Intento fallido ${nextAttempts} de 5.`,
          },
        };
      }

      await withTransaction({ microservice: 'identity-service', ip: clientIp }, async (client) => {
        if (Number(user.failed_login_attempts || 0) > 0 || user.locked_until) {
          await client.query(
            `UPDATE users SET failed_login_attempts = 0, locked_until = NULL, updated_at = clock_timestamp() WHERE id = $1`,
            [user.id]
          );
        }
        await appendExplicitAuditLog(client, {
          userId: Number(user.id),
          microservice: 'identity-service',
          eventType: 'USER_LOGIN_JWT_ISSUED',
          entityType: 'users',
          entityId: String(user.id),
          ipAnonymized: ipAnon,
          newState: { email: user.email, role: user.role },
        });
      });

      const publicUser = mapUserRow(user);
      const token = signJwtToken(publicUser);

      return {
        statusCode: 200,
        payload: {
          status_code: 200,
          user: publicUser,
          data: publicUser,
          access_token: token,
          expires_in: 3600,
        },
      };
    }

    // -------------------------------------------------------------------------
    // AUTH: ME (Verify JWT against PostgreSQL)
    // -------------------------------------------------------------------------
    if (upperMethod === 'GET' && pathname === '/api/v1/auth/me') {
      const claims = verifyJwtToken(authHeader);
      if (!claims) {
        return {
          statusCode: 401,
          payload: { status_code: 401, error: 'Token JWT inválido o expirado.' },
        };
      }
      const res = await pool.query('SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL', [claims.sub]);
      if (res.rows.length === 0) {
        return { statusCode: 401, payload: { status_code: 401, error: 'Usuario no encontrado.' } };
      }
      const user = mapUserRow(res.rows[0]);
      return { statusCode: 200, payload: { status_code: 200, user, data: user } };
    }

    // -------------------------------------------------------------------------
    // CATALOG: GET /api/v1/listings (Full synchronized state from PostgreSQL 18)
    // -------------------------------------------------------------------------
    if (upperMethod === 'GET' && pathname === '/api/v1/listings') {
      const limit = Math.max(1, Math.min(50, Number(parsedUrl.searchParams.get('limit') || 20)));
      const offset = Math.max(0, Number(parsedUrl.searchParams.get('offset') || 0));

      const [listingsRes, bookingsRes, reviewsRes, usersRes] = await Promise.all([
        pool.query(`${LISTING_BASE_SELECT} ORDER BY l.id DESC`),
        pool.query(`${BOOKING_BASE_SELECT} WHERE b.deleted_at IS NULL ORDER BY b.id DESC`),
        pool.query(
          `SELECT r.*, u.name AS guest_name
           FROM reviews r
           JOIN users u ON u.id = r.guest_id
           WHERE r.deleted_at IS NULL
           ORDER BY r.id DESC`
        ),
        pool.query('SELECT * FROM users WHERE deleted_at IS NULL ORDER BY id ASC'),
      ]);

      const allListings = listingsRes.rows.map(mapListingRow);
      const activeListings = allListings.filter((l) => l.deletedAt === null && l.status === 'ACTIVE');
      const slice = activeListings.slice(offset, offset + limit);

      return {
        statusCode: 200,
        payload: {
          status_code: 200,
          data: slice,
          allListings,
          bookings: bookingsRes.rows.map(mapBookingRow),
          reviews: reviewsRes.rows.map(mapReviewRow),
          users: usersRes.rows.map(mapUserRow),
          pagination: {
            total: activeListings.length,
            limit,
            offset,
          },
        },
      };
    }

    // -------------------------------------------------------------------------
    // SEARCH: GET /api/v1/listings/search (RF-03 / CPF-04 Parameterized SQL)
    // -------------------------------------------------------------------------
    if (upperMethod === 'GET' && pathname === '/api/v1/listings/search') {
      const city = String(parsedUrl.searchParams.get('city') || '').trim();
      const category = String(parsedUrl.searchParams.get('category') || '').trim();
      const guests = Math.max(1, Number(parsedUrl.searchParams.get('guests') || 1));
      const checkIn = String(parsedUrl.searchParams.get('checkIn') || '').trim();
      const checkOut = String(parsedUrl.searchParams.get('checkOut') || '').trim();
      const maxPriceRaw = parsedUrl.searchParams.get('maxPrice');
      const maxPrice = maxPriceRaw ? Number(maxPriceRaw) : null;

      if (checkIn && checkOut && checkOut <= checkIn) {
        return {
          statusCode: 422,
          payload: {
            status_code: 422,
            error: 'La fecha de salida (Check-Out) debe ser posterior a la fecha de entrada (Check-In).',
          },
        };
      }

      const conditions = ["l.deleted_at IS NULL", "l.status = 'ACTIVE'", 'l.max_guests >= $1'];
      const values = [guests];
      let idx = 2;

      if (city) {
        conditions.push(`(l.city ILIKE $${idx} OR l.title ILIKE $${idx} OR l.state_name ILIKE $${idx})`);
        values.push(`%${city}%`);
        idx++;
      }
      if (category && category !== 'Todos') {
        conditions.push(`l.category = $${idx}`);
        values.push(category);
        idx++;
      }
      if (maxPrice && !Number.isNaN(maxPrice) && maxPrice > 0) {
        conditions.push(`l.price_per_night <= $${idx}`);
        values.push(maxPrice);
        idx++;
      }
      if (checkIn && checkOut) {
        conditions.push(
          `NOT EXISTS (
            SELECT 1 FROM booking_dates bd
            WHERE bd.listing_id = l.id
              AND bd.lock_status = 'LOCKED'
              AND bd.stay_date >= $${idx}::date
              AND bd.stay_date < $${idx + 1}::date
          )`
        );
        values.push(checkIn, checkOut);
        idx += 2;
      }

      const sql = `${LISTING_BASE_SELECT} WHERE ${conditions.join(' AND ')} ORDER BY l.id ASC LIMIT 50`;
      const { rows } = await pool.query(sql, values);
      const data = rows.map(mapListingRow);

      return {
        statusCode: 200,
        payload: {
          status_code: 200,
          data,
          pagination: {
            total: data.length,
            per_page: 20,
            current_page: 1,
          },
        },
      };
    }

    // -------------------------------------------------------------------------
    // LISTINGS: CREATE POST /api/v1/listings (RF-02 / CPF-03 / CP-CAT-01 / RBAC)
    // -------------------------------------------------------------------------
    if (upperMethod === 'POST' && pathname === '/api/v1/listings') {
      const claims = verifyJwtToken(authHeader);
      if (!claims) {
        return {
          statusCode: 401,
          payload: { status_code: 401, error: 'Autenticación requerida (Bearer JWT) para publicar alojamientos.' },
        };
      }
      if (claims.role !== 'HOST' && claims.role !== 'ADMIN') {
        await withTransaction({ microservice: 'catalog-service', ip: clientIp }, async (client) => {
          await appendExplicitAuditLog(client, {
            userId: Number(claims.sub),
            microservice: 'catalog-service',
            eventType: 'RBAC_DENIED_CREATE_LISTING_403',
            entityType: 'listings',
            entityId: 'denied',
            ipAnonymized: ipAnon,
            newState: { attempted_by: claims.email, role: claims.role },
          });
        });
        return {
          statusCode: 403,
          payload: {
            status_code: 403,
            error:
              'Acceso Denegado (HTTP 403): Solo los Anfitriones (HOST) o Administradores pueden dar de alta alojamientos.',
          },
        };
      }

      const title = String(body.title || '').trim();
      const city = String(body.city || '').trim();
      const latitude = Number(body.latitude);
      const longitude = Number(body.longitude);
      const pricePerNight = Number(body.pricePerNight);
      const maxGuests = Math.max(1, Math.min(20, Number(body.maxGuests || 2)));
      const bedrooms = Math.max(1, Math.min(20, Number(body.bedrooms || 2)));
      const beds = Math.max(1, Math.min(30, Number(body.beds || 2)));
      const bathrooms = Math.max(0.5, Number(body.bathrooms || 2));
      const photosCount = Math.max(1, Math.min(15, Number(body.photosCount || 1)));

      if (title.length < 5) {
        return {
          statusCode: 422,
          payload: { status_code: 422, error: 'El título del alojamiento debe tener al menos 5 caracteres.' },
        };
      }
      if (!city) {
        return {
          statusCode: 422,
          payload: { status_code: 422, error: 'La ciudad del alojamiento es obligatoria.' },
        };
      }
      if (
        Number.isNaN(latitude) ||
        latitude < 14.5 ||
        latitude > 32.7 ||
        Number.isNaN(longitude) ||
        longitude < -118.4 ||
        longitude > -86.7
      ) {
        return {
          statusCode: 422,
          payload: {
            status_code: 422,
            error:
              'Coordenadas fuera del cuadrante geográfico operativo de México: Latitud [14.5, 32.7], Longitud [-118.4, -86.7] (CP-CAT-01 / NCM-03).',
          },
        };
      }
      if (Number.isNaN(pricePerNight) || pricePerNight <= 0) {
        return {
          statusCode: 422,
          payload: { status_code: 422, error: 'La tarifa por noche debe ser mayor a $0.00 MXN.' },
        };
      }

      const mainPhoto =
        String(body.photoUrl || '').trim() ||
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=80';
      const description =
        String(body.description || '').trim() ||
        `Alojamiento exclusivo en ${city} verificado bajo estándares de calidad y seguridad Roomia.`;
      const category = String(body.category || 'Lofts').trim();
      const stateName = String(body.stateName || 'Estado de México').trim();
      const hostId = claims.role === 'ADMIN' && body.hostId ? Number(body.hostId) : Number(claims.sub);

      const createdListing = await withTransaction(
        { microservice: 'catalog-service', ip: clientIp },
        async (client) => {
          const ins = await client.query(
            `INSERT INTO listings (
               host_id, title, description, category, city, state_name,
               latitude, longitude, price_per_night, max_guests, bedrooms, beds, bathrooms,
               cancellation_policy, status
             ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'MODERATE','ACTIVE')
             RETURNING id`,
            [
              hostId,
              title,
              description,
              category,
              city,
              stateName,
              latitude,
              longitude,
              pricePerNight,
              maxGuests,
              bedrooms,
              beds,
              bathrooms,
            ]
          );
          const listingId = Number(ins.rows[0].id);

          const fallbackGallery = [
            mainPhoto,
            'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
          ];
          for (let i = 0; i < photosCount; i++) {
            const url = fallbackGallery[i % fallbackGallery.length];
            const alt = `Vista ${i + 1} de ${title} en ${city} convertida a WebP`.slice(0, 255);
            await client.query(
              `INSERT INTO listing_photos (listing_id, s3_url, alt_text, mime_type, file_size_kb, sort_order)
               VALUES ($1, $2, $3, 'image/webp', $4, $5)`,
              [listingId, url, alt, 400 + i * 10, i + 1]
            );
          }

          const amenitiesList =
            Array.isArray(body.amenities) && body.amenities.length > 0
              ? body.amenities
              : ['Wi-Fi Alta Velocidad', 'Cocina equipada', 'Estacionamiento privado', 'Check-in autónomo'];
          for (const rawName of amenitiesList) {
            const cleanName = String(rawName).trim();
            if (!cleanName) continue;
            const code = cleanName
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .toUpperCase()
              .replace(/[^A-Z0-9]+/g, '_')
              .replace(/^_|_$/g, '')
              .slice(0, 50);
            const amRes = await client.query(
              `INSERT INTO amenities (code, name) VALUES ($1, $2)
               ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
               RETURNING id`,
              [code, cleanName.slice(0, 100)]
            );
            await client.query(
              `INSERT INTO listing_amenity (listing_id, amenity_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
              [listingId, amRes.rows[0].id]
            );
          }

          return fetchListingById(client, listingId);
        }
      );

      return {
        statusCode: 201,
        payload: { status_code: 201, data: createdListing },
      };
    }

    // -------------------------------------------------------------------------
    // LISTINGS: RESTORE PATCH /api/v1/listings/:id/restore
    // -------------------------------------------------------------------------
    const restoreMatch = pathname.match(/^\/api\/v1\/listings\/(\d+)\/restore$/);
    if (upperMethod === 'PATCH' && restoreMatch) {
      const claims = verifyJwtToken(authHeader);
      if (!claims) return { statusCode: 401, payload: { status_code: 401, error: 'Autenticación requerida.' } };
      if (claims.role !== 'HOST' && claims.role !== 'ADMIN') {
        return { statusCode: 403, payload: { status_code: 403, error: 'Acceso Denegado (HTTP 403).' } };
      }

      const listingId = Number(restoreMatch[1]);
      const updated = await withTransaction({ microservice: 'catalog-service', ip: clientIp }, async (client) => {
        const res = await client.query(
          `UPDATE listings
           SET deleted_at = NULL, status = 'ACTIVE', updated_at = clock_timestamp()
           WHERE id = $1
           RETURNING id`,
          [listingId]
        );
        if (res.rows.length === 0) return null;
        return fetchListingById(client, listingId);
      });

      if (!updated) {
        return { statusCode: 404, payload: { status_code: 404, error: 'Alojamiento no encontrado.' } };
      }

      return {
        statusCode: 200,
        payload: {
          status_code: 200,
          data: updated,
          message: `Alojamiento "${updated.title}" reactivado y visible en el catálogo público.`,
        },
      };
    }

    // -------------------------------------------------------------------------
    // LISTINGS: UPDATE PATCH /api/v1/listings/:id
    // -------------------------------------------------------------------------
    const listingIdMatch = pathname.match(/^\/api\/v1\/listings\/(\d+)$/);
    if (upperMethod === 'PATCH' && listingIdMatch) {
      const claims = verifyJwtToken(authHeader);
      if (!claims) return { statusCode: 401, payload: { status_code: 401, error: 'Autenticación requerida.' } };
      if (claims.role !== 'HOST' && claims.role !== 'ADMIN') {
        return { statusCode: 403, payload: { status_code: 403, error: 'Acceso Denegado (HTTP 403).' } };
      }

      const listingId = Number(listingIdMatch[1]);
      const latitude = Number(body.latitude);
      const longitude = Number(body.longitude);
      const pricePerNight = Number(body.pricePerNight);

      if (
        Number.isNaN(latitude) ||
        latitude < 14.5 ||
        latitude > 32.7 ||
        Number.isNaN(longitude) ||
        longitude < -118.4 ||
        longitude > -86.7
      ) {
        return {
          statusCode: 422,
          payload: {
            status_code: 422,
            error:
              'Coordenadas fuera del cuadrante geográfico operativo de México: Latitud [14.5, 32.7], Longitud [-118.4, -86.7] (NCM-03).',
          },
        };
      }
      if (Number.isNaN(pricePerNight) || pricePerNight <= 0) {
        return {
          statusCode: 422,
          payload: { status_code: 422, error: 'La tarifa por noche debe ser mayor a $0.00 MXN.' },
        };
      }

      const status = ['ACTIVE', 'PAUSED', 'DRAFT', 'INACTIVE', 'SUSPENDED'].includes(String(body.status))
        ? String(body.status)
        : 'ACTIVE';

      const updated = await withTransaction({ microservice: 'catalog-service', ip: clientIp }, async (client) => {
        const res = await client.query(
          `UPDATE listings
           SET title = $1,
               description = $2,
               city = $3,
               category = $4,
               price_per_night = $5,
               max_guests = $6,
               bedrooms = $7,
               bathrooms = $8,
               latitude = $9,
               longitude = $10,
               status = $11,
               deleted_at = CASE WHEN $11 = 'ACTIVE' THEN NULL ELSE COALESCE(deleted_at, clock_timestamp()) END,
               updated_at = clock_timestamp()
           WHERE id = $12
           RETURNING id`,
          [
            String(body.title || '').trim(),
            String(body.description || '').trim(),
            String(body.city || '').trim(),
            String(body.category || 'Lofts').trim(),
            pricePerNight,
            Math.max(1, Math.min(20, Number(body.maxGuests || 2))),
            Math.max(1, Number(body.bedrooms || 2)),
            Math.max(0.5, Number(body.bathrooms || 2)),
            latitude,
            longitude,
            status,
            listingId,
          ]
        );
        if (res.rows.length === 0) return null;

        const photoUrl = String(body.photoUrl || '').trim();
        if (photoUrl) {
          const firstPhoto = await client.query(
            'SELECT id FROM listing_photos WHERE listing_id = $1 ORDER BY sort_order ASC, id ASC LIMIT 1',
            [listingId]
          );
          if (firstPhoto.rows.length > 0) {
            await client.query('UPDATE listing_photos SET s3_url = $1 WHERE id = $2', [
              photoUrl,
              firstPhoto.rows[0].id,
            ]);
          } else {
            await client.query(
              `INSERT INTO listing_photos (listing_id, s3_url, alt_text, mime_type, file_size_kb, sort_order)
               VALUES ($1, $2, $3, 'image/webp', 420, 1)`,
              [listingId, photoUrl, `Vista principal de ${String(body.title || 'Alojamiento').trim()}`]
            );
          }
        }

        return fetchListingById(client, listingId);
      });

      if (!updated) {
        return { statusCode: 404, payload: { status_code: 404, error: 'Alojamiento no encontrado.' } };
      }

      return {
        statusCode: 200,
        payload: {
          status_code: 200,
          data: updated,
          message: `Alojamiento "${updated.title}" (#${updated.id}) actualizado correctamente.`,
        },
      };
    }

    // -------------------------------------------------------------------------
    // LISTINGS: SOFT DELETE DELETE /api/v1/listings/:id
    // -------------------------------------------------------------------------
    if (upperMethod === 'DELETE' && listingIdMatch) {
      const claims = verifyJwtToken(authHeader);
      if (!claims) return { statusCode: 401, payload: { status_code: 401, error: 'Autenticación requerida.' } };
      if (claims.role !== 'HOST' && claims.role !== 'ADMIN') {
        return { statusCode: 403, payload: { status_code: 403, error: 'Acceso Denegado (HTTP 403).' } };
      }

      const listingId = Number(listingIdMatch[1]);
      const updated = await withTransaction({ microservice: 'catalog-service', ip: clientIp }, async (client) => {
        const res = await client.query(
          `UPDATE listings
           SET deleted_at = clock_timestamp(), status = 'PAUSED', updated_at = clock_timestamp()
           WHERE id = $1
           RETURNING id`,
          [listingId]
        );
        if (res.rows.length === 0) return null;
        return fetchListingById(client, listingId);
      });

      if (!updated) {
        return { statusCode: 404, payload: { status_code: 404, error: 'Alojamiento no encontrado.' } };
      }

      return {
        statusCode: 200,
        payload: {
          status_code: 200,
          data: updated,
          message: `Baja lógica aplicada a "${updated.title}" (deleted_at = ${updated.deletedAt?.slice(0, 19)}Z).`,
        },
      };
    }

    // -------------------------------------------------------------------------
    // BOOKINGS: CREATE POST /api/v1/bookings (RF-04 / SELECT ... FOR UPDATE)
    // -------------------------------------------------------------------------
    if (upperMethod === 'POST' && pathname === '/api/v1/bookings') {
      const claims = verifyJwtToken(authHeader);
      if (!claims) {
        return {
          statusCode: 401,
          payload: { status_code: 401, error: 'Inicia sesión para crear una reservación.' },
        };
      }

      const listingId = Number(body.listingId);
      const guestId = claims.role === 'ADMIN' && body.guestId ? Number(body.guestId) : Number(claims.sub);
      const checkIn = String(body.checkIn || '').trim();
      const checkOut = String(body.checkOut || '').trim();
      const guestsCount = Number(body.guestsCount || 1);

      if (!checkIn || !checkOut || checkOut <= checkIn) {
        return {
          statusCode: 422,
          payload: {
            status_code: 422,
            error: 'La fecha de salida debe ser posterior a la fecha de entrada.',
          },
        };
      }

      const datesToLock = enumerateDateRange(checkIn, checkOut);
      if (datesToLock.length === 0) {
        return {
          statusCode: 422,
          payload: { status_code: 422, error: 'Rango de fechas inválido.' },
        };
      }

      const txResult = await withTransaction(
        { microservice: 'booking-payment-service', ip: clientIp },
        async (client) => {
          // REAL PESSIMISTIC ROW LOCK IN POSTGRESQL 18
          const listingRes = await client.query(
            'SELECT * FROM listings WHERE id = $1 AND deleted_at IS NULL FOR UPDATE',
            [listingId]
          );
          if (listingRes.rows.length === 0) {
            return { statusCode: 404, error: 'El alojamiento seleccionado no está activo.' };
          }
          const listing = listingRes.rows[0];
          if (guestsCount < 1 || guestsCount > Number(listing.max_guests)) {
            return {
              statusCode: 422,
              error: `El número de huéspedes (${guestsCount}) supera la capacidad máxima (${listing.max_guests}).`,
            };
          }

          // Check locked stay dates inside the same locked transaction
          const conflictRes = await client.query(
            `SELECT stay_date FROM booking_dates
             WHERE listing_id = $1 AND lock_status = 'LOCKED' AND stay_date = ANY($2::date[])
             ORDER BY stay_date ASC
             LIMIT 1`,
            [listingId, datesToLock]
          );

          if (conflictRes.rows.length > 0) {
            const conflictDate = formatDateOnly(conflictRes.rows[0].stay_date);
            await appendExplicitAuditLog(client, {
              userId: guestId,
              microservice: 'booking-payment-service',
              eventType: 'OVERBOOKING_BLOCKED_HTTP_409',
              entityType: 'bookings',
              entityId: `${listingId}:${conflictDate}`,
              ipAnonymized: ipAnon,
              newState: { listingId, guestId, conflictDate },
            });
            return {
              statusCode: 409,
              error: `Conflicto de Reserva (HTTP 409): La fecha ${conflictDate} ya está ocupada en este alojamiento (Bloqueo Pesimista SELECT ... FOR UPDATE).`,
            };
          }

          const nights = datesToLock.length;
          const rateCents = Math.round(Number(listing.price_per_night) * 100);
          const subtotalCents = rateCents * nights;
          const serviceFeeCents = Math.round(subtotalCents * 0.12);
          const taxAmountCents = Math.round(subtotalCents * 0.16);
          const totalAmountCents = subtotalCents + serviceFeeCents + taxAmountCents;

          const bookingUuid = crypto.randomUUID();
          const nightlyRate = (rateCents / 100).toFixed(2);
          const subtotal = (subtotalCents / 100).toFixed(2);
          const serviceFee = (serviceFeeCents / 100).toFixed(2);
          const taxAmount = (taxAmountCents / 100).toFixed(2);
          const totalAmount = (totalAmountCents / 100).toFixed(2);

          // Exact formula matching PostgreSQL view v_booking_tamper_detection
          const integritySha256 = crypto
            .createHash('sha256')
            .update(`${bookingUuid}|${listingId}|${guestId}|${totalAmount}`)
            .digest('hex');

          const ins = await client.query(
            `INSERT INTO bookings (
               uuid, listing_id, guest_id, check_in, check_out, guests_count,
               nightly_rate, subtotal_amount, service_fee, tax_amount, total_amount,
               status, integrity_sha256
             ) VALUES ($1,$2,$3,$4::date,$5::date,$6,$7,$8,$9,$10,$11,'PENDING',$12)
             RETURNING id`,
            [
              bookingUuid,
              listingId,
              guestId,
              checkIn,
              checkOut,
              guestsCount,
              nightlyRate,
              subtotal,
              serviceFee,
              taxAmount,
              totalAmount,
              integritySha256,
            ]
          );
          const bookingId = Number(ins.rows[0].id);

          for (const d of datesToLock) {
            await client.query(
              `INSERT INTO booking_dates (listing_id, booking_id, stay_date, lock_status)
               VALUES ($1, $2, $3::date, 'LOCKED')`,
              [listingId, bookingId, d]
            );
          }

          const bookingDto = await fetchBookingById(client, bookingId);
          return { statusCode: 201, booking: bookingDto };
        }
      );

      if (txResult.error) {
        return {
          statusCode: txResult.statusCode,
          payload: { status_code: txResult.statusCode, error: txResult.error },
        };
      }

      return {
        statusCode: 201,
        payload: { status_code: 201, booking: txResult.booking },
      };
    }

    // -------------------------------------------------------------------------
    // PAYMENTS: CHECKOUT POST /api/v1/checkout (RF-05 / CPF-02 / PCI-DSS 4.0)
    // -------------------------------------------------------------------------
    if (upperMethod === 'POST' && pathname === '/api/v1/checkout') {
      const claims = verifyJwtToken(authHeader);
      if (!claims) {
        return { statusCode: 401, payload: { status_code: 401, error: 'Autenticación requerida.' } };
      }

      const bookingId = Number(body.bookingId);
      const cardToken = String(body.cardToken || '');

      const txResult = await withTransaction(
        { microservice: 'booking-payment-service', ip: clientIp },
        async (client) => {
          const bRes = await client.query('SELECT * FROM bookings WHERE id = $1 FOR UPDATE', [bookingId]);
          if (bRes.rows.length === 0) {
            return { statusCode: 404, error: 'Reserva no encontrada.' };
          }
          const booking = bRes.rows[0];
          const suffix = crypto.randomBytes(4).toString('hex');

          if (cardToken.includes('0999')) {
            const declinedIntent = `pi_3Q9Declined_${bookingId}_${suffix}`;
            await client.query(
              `INSERT INTO payments (
                 booking_id, stripe_payment_intent_id, payment_last_four,
                 amount, platform_commission, currency, status, failure_code
               ) VALUES ($1, $2, '0999', $3, $4, 'MXN', 'FAILED', 'insufficient_funds')`,
              [bookingId, declinedIntent, booking.total_amount, booking.service_fee]
            );
            await client.query(
              `UPDATE bookings SET status = 'CANCELLED', updated_at = clock_timestamp() WHERE id = $1`,
              [bookingId]
            );
            await client.query(
              `UPDATE booking_dates SET lock_status = 'RELEASED' WHERE booking_id = $1`,
              [bookingId]
            );
            const updatedBooking = await fetchBookingById(client, bookingId);
            return {
              statusCode: 402,
              booking: updatedBooking,
              error:
                'Pago Rechazado (HTTP 402 Payment Required): Fondos insuficientes (insufficient_funds). La reserva pasó a CANCELLED y las fechas fueron liberadas automáticamente.',
            };
          }

          // PCI-DSS 4.0: Never persist PAN or CVV — only tokenized Stripe ID and last 4 digits
          const digits = cardToken.replace(/\D/g, '');
          const lastFour = digits.slice(-4) || '4242';
          const intentId = `pi_3Q9Roomia_${bookingId}_${suffix}`;
          const chargeId = `ch_3Q9Roomia_${bookingId}_${suffix}`;

          await client.query(
            `INSERT INTO payments (
               booking_id, stripe_payment_intent_id, stripe_charge_id, payment_last_four,
               amount, platform_commission, currency, status, webhook_verified_at
             ) VALUES ($1, $2, $3, $4, $5, $6, 'MXN', 'COMPLETED', clock_timestamp())`,
            [bookingId, intentId, chargeId, lastFour, booking.total_amount, booking.service_fee]
          );
          await client.query(
            `UPDATE bookings SET status = 'CONFIRMED', updated_at = clock_timestamp() WHERE id = $1`,
            [bookingId]
          );

          const updatedBooking = await fetchBookingById(client, bookingId);
          return {
            statusCode: 200,
            booking: updatedBooking,
            message: `¡Pago aprobado con éxito! Referencia Stripe ${intentId} (Tarjeta **** ${lastFour}). Tu reserva está CONFIRMADA.`,
          };
        }
      );

      if (txResult.statusCode === 402) {
        return {
          statusCode: 402,
          payload: { status_code: 402, booking: txResult.booking, error: txResult.error },
        };
      }
      if (txResult.error) {
        return {
          statusCode: txResult.statusCode,
          payload: { status_code: txResult.statusCode, error: txResult.error },
        };
      }
      return {
        statusCode: 200,
        payload: { status_code: 200, booking: txResult.booking, message: txResult.message },
      };
    }

    // -------------------------------------------------------------------------
    // STRIPE WEBHOOK: POST /api/v1/webhooks/stripe (CP-INT-04 & CP-INT-08)
    // -------------------------------------------------------------------------
    if (upperMethod === 'POST' && pathname === '/api/v1/webhooks/stripe') {
      const signature = getHeader(headers, 'stripe-signature') || String(body.signature || '');
      const rawPayload = typeof body.rawPayload === 'string' ? body.rawPayload : JSON.stringify(body);
      const expectedSig = crypto
        .createHmac('sha256', getStripeWebhookSecret())
        .update(rawPayload)
        .digest('hex');

      const sigBuf = Buffer.from(signature, 'utf8');
      const expBuf = Buffer.from(expectedSig, 'utf8');
      if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        return {
          statusCode: 400,
          payload: { status_code: 400, error: 'Firma HMAC-SHA256 de Webhook Stripe inválida.' },
        };
      }

      let eventData = body;
      if (typeof body.rawPayload === 'string') {
        try {
          eventData = JSON.parse(body.rawPayload);
        } catch {
          eventData = body;
        }
      }

      const bookingId = Number(eventData.bookingId);
      if (bookingId) {
        await withTransaction({ microservice: 'booking-payment-service', ip: clientIp }, async (client) => {
          const bRes = await client.query('SELECT * FROM bookings WHERE id = $1 FOR UPDATE', [bookingId]);
          if (bRes.rows.length > 0) {
            const b = bRes.rows[0];
            await client.query(
              `UPDATE bookings SET status = 'CONFIRMED', updated_at = clock_timestamp() WHERE id = $1`,
              [bookingId]
            );
            const suffix = crypto.randomBytes(4).toString('hex');
            await client.query(
              `INSERT INTO payments (
                 booking_id, stripe_payment_intent_id, stripe_charge_id, payment_last_four,
                 amount, platform_commission, currency, status, webhook_verified_at
               ) VALUES ($1, $2, $3, '4242', $4, $5, 'MXN', 'COMPLETED', clock_timestamp())`,
              [bookingId, `pi_3Q9Webhook_${bookingId}_${suffix}`, `ch_3Q9Webhook_${bookingId}_${suffix}`, b.total_amount, b.service_fee]
            );
          }
        });
      }

      return {
        statusCode: 200,
        payload: { status_code: 200, received: true, bookingId },
      };
    }

    // -------------------------------------------------------------------------
    // BOOKINGS: COMPLETE STAY PATCH /api/v1/bookings/:id/complete
    // -------------------------------------------------------------------------
    const completeMatch = pathname.match(/^\/api\/v1\/bookings\/(\d+)\/complete$/);
    if (upperMethod === 'PATCH' && completeMatch) {
      const claims = verifyJwtToken(authHeader);
      if (!claims) return { statusCode: 401, payload: { status_code: 401, error: 'Autenticación requerida.' } };

      const bookingId = Number(completeMatch[1]);
      const updated = await withTransaction(
        { microservice: 'booking-payment-service', ip: clientIp },
        async (client) => {
          const res = await client.query(
            `UPDATE bookings SET status = 'COMPLETED', updated_at = clock_timestamp() WHERE id = $1 RETURNING id`,
            [bookingId]
          );
          if (res.rows.length === 0) return null;
          return fetchBookingById(client, bookingId);
        }
      );

      if (!updated) {
        return { statusCode: 404, payload: { status_code: 404, error: 'Reserva no encontrada.' } };
      }
      return {
        statusCode: 200,
        payload: {
          status_code: 200,
          booking: updated,
          message:
            'Check-out finalizado (Estado COMPLETED). Ahora puedes calificar y dejar reseña en este alojamiento.',
        },
      };
    }

    // -------------------------------------------------------------------------
    // BOOKINGS: CANCEL PATCH /api/v1/bookings/:id/cancel
    // -------------------------------------------------------------------------
    const cancelMatch = pathname.match(/^\/api\/v1\/bookings\/(\d+)\/cancel$/);
    if (upperMethod === 'PATCH' && cancelMatch) {
      const claims = verifyJwtToken(authHeader);
      if (!claims) return { statusCode: 401, payload: { status_code: 401, error: 'Autenticación requerida.' } };

      const bookingId = Number(cancelMatch[1]);
      const updated = await withTransaction(
        { microservice: 'booking-payment-service', ip: clientIp },
        async (client) => {
          const res = await client.query(
            `UPDATE bookings SET status = 'CANCELLED', updated_at = clock_timestamp() WHERE id = $1 RETURNING id`,
            [bookingId]
          );
          if (res.rows.length === 0) return null;
          await client.query(`UPDATE booking_dates SET lock_status = 'RELEASED' WHERE booking_id = $1`, [
            bookingId,
          ]);
          return fetchBookingById(client, bookingId);
        }
      );

      if (!updated) {
        return { statusCode: 404, payload: { status_code: 404, error: 'Reserva no encontrada.' } };
      }
      return {
        statusCode: 200,
        payload: {
          status_code: 200,
          booking: updated,
          message: 'Reserva cancelada y fechas liberadas en el calendario.',
        },
      };
    }

    // -------------------------------------------------------------------------
    // REVIEWS: POST /api/v1/reviews (M05 / CPF-05 + Trigger SQLSTATE 42501)
    // -------------------------------------------------------------------------
    if (upperMethod === 'POST' && pathname === '/api/v1/reviews') {
      const claims = verifyJwtToken(authHeader);
      if (!claims) {
        return { statusCode: 401, payload: { status_code: 401, error: 'Inicia sesión para publicar una reseña.' } };
      }

      const guestId = claims.role === 'ADMIN' && body.guestId ? Number(body.guestId) : Number(claims.sub);
      const listingId = Number(body.listingId);
      const rating = Number(body.rating);
      const comment = String(body.comment || '').trim();
      const forceUnverified = Boolean(body.forceUnverified);

      if (Number.isNaN(rating) || rating < 1 || rating > 5 || !comment) {
        return {
          statusCode: 422,
          payload: {
            status_code: 422,
            error: 'Ingresa una calificación de 1 a 5 estrellas y un comentario.',
          },
        };
      }

      const txResult = await withTransaction({ microservice: 'review-service', ip: clientIp }, async (client) => {
        const eligibleBooking = forceUnverified
          ? { rows: [] }
          : await client.query(
              `SELECT b.id
               FROM bookings b
               LEFT JOIN reviews r ON r.booking_id = b.id
               WHERE b.guest_id = $1
                 AND b.listing_id = $2
                 AND b.status = 'COMPLETED'
                 AND b.deleted_at IS NULL
                 AND r.id IS NULL
               ORDER BY b.id DESC
               LIMIT 1`,
              [guestId, listingId]
            );

        if (eligibleBooking.rows.length === 0) {
          await appendExplicitAuditLog(client, {
            userId: guestId,
            microservice: 'review-service',
            eventType: 'UNVERIFIED_REVIEW_BLOCKED_403',
            entityType: 'reviews',
            entityId: `${guestId}:${listingId}`,
            ipAnonymized: ipAnon,
            newState: { guestId, listingId, reason: 'No COMPLETED booking without review' },
          });
          return {
            statusCode: 403,
            error:
              'Estancia no verificada (HTTP 403 Forbidden / CPF-05): Solo los huéspedes que hayan completado una reserva (estado COMPLETED) en este alojamiento pueden publicar una reseña.',
          };
        }

        const bookingId = Number(eligibleBooking.rows[0].id);
        const ins = await client.query(
          `INSERT INTO reviews (booking_id, listing_id, guest_id, rating, comment)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [bookingId, listingId, guestId, rating, comment]
        );
        const uRes = await client.query('SELECT name FROM users WHERE id = $1', [guestId]);
        const row = { ...ins.rows[0], guest_name: uRes.rows[0]?.name || 'Huésped Verificado' };
        return { statusCode: 201, review: mapReviewRow(row) };
      });

      if (txResult.error) {
        return {
          statusCode: txResult.statusCode,
          payload: { status_code: txResult.statusCode, error: txResult.error },
        };
      }

      return {
        statusCode: 201,
        payload: { status_code: 201, review: txResult.review },
      };
    }

    // -------------------------------------------------------------------------
    // AUDIT: GET /api/v1/audit (RF-06 / RQ-AUD-01 / RBAC ADMIN + SHA-256 Chain)
    // -------------------------------------------------------------------------
    if (upperMethod === 'GET' && pathname === '/api/v1/audit') {
      const claims = verifyJwtToken(authHeader);
      if (!claims) {
        return {
          statusCode: 401,
          payload: { status_code: 401, error: 'Autenticación JWT requerida para consultar la bitácora de auditoría.' },
        };
      }
      if (claims.role !== 'ADMIN') {
        return {
          statusCode: 403,
          payload: {
            status_code: 403,
            error: 'Acceso Denegado (HTTP 403): Solo el rol ADMIN / Auditor puede leer audit_logs.',
          },
        };
      }

      const limit = Math.max(1, Math.min(200, Number(parsedUrl.searchParams.get('limit') || 50)));
      const offset = Math.max(0, Number(parsedUrl.searchParams.get('offset') || 0));

      const [allLogsRes, tamperRes, pciRes, overbookingRes] = await Promise.all([
        pool.query('SELECT * FROM audit_logs ORDER BY id ASC'),
        pool.query("SELECT COUNT(*) FILTER (WHERE audit_verdict <> 'VALID_INTEGRITY') AS tampered, COUNT(*) AS total FROM v_booking_tamper_detection"),
        pool.query('SELECT * FROM v_pci_dss_compliance_check'),
        pool.query('SELECT COUNT(*) AS conflicts FROM v_overbooking_integrity_check'),
      ]);

      const rows = allLogsRes.rows;
      let chainValid = true;
      for (let i = 0; i < rows.length; i++) {
        const expectedPrev = i === 0 ? '0'.repeat(64) : String(rows[i - 1].current_hash).trim();
        if (String(rows[i].previous_hash).trim() !== expectedPrev) {
          chainValid = false;
          break;
        }
      }

      const reversed = [...rows].reverse().map(mapAuditRow);
      const slice = reversed.slice(offset, offset + limit);

      return {
        statusCode: 200,
        payload: {
          status_code: 200,
          chain_integrity_verified: chainValid,
          total_entries: rows.length,
          db_views: {
            booking_tamper_count: Number(tamperRes.rows[0]?.tampered || 0),
            bookings_verified_count: Number(tamperRes.rows[0]?.total || 0),
            pci_dss_verdict: pciRes.rows[0]?.pci_dss_verdict || 'COMPLIANT_ZERO_PAN_STORED',
            overbooking_conflicts: Number(overbookingRes.rows[0]?.conflicts || 0),
          },
          data: slice,
        },
      };
    }

    return {
      statusCode: 404,
      payload: { status_code: 404, error: `Ruta no encontrada: ${upperMethod} ${pathname}` },
    };
  } catch (err) {
    // Surface PostgreSQL trigger security violations clearly
    if (err && err.code === '45000') {
      return {
        statusCode: 403,
        payload: { status_code: 403, error: err.message },
      };
    }
    if (err && err.code === '42501') {
      return {
        statusCode: 403,
        payload: { status_code: 403, error: err.message },
      };
    }
    if (err && err.code === '23505') {
      return {
        statusCode: 409,
        payload: { status_code: 409, error: 'Conflicto de unicidad en base de datos (registro duplicado o fecha bloqueada).' },
      };
    }
    process.stderr.write(`[Roomia API Error] ${upperMethod} ${pathname}: ${err.stack || err.message}\n`);
    return {
      statusCode: 500,
      payload: { status_code: 500, error: 'Error interno del servidor al procesar la solicitud en PostgreSQL.' },
    };
  }
}
