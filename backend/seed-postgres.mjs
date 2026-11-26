import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { loadEnvFile } from './db.mjs';

loadEnvFile();

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function hashPassword(password) {
  const saltB64 = crypto.randomBytes(16).toString('base64url');
  const derived = crypto.scryptSync(password, saltB64, 32).toString('base64url');
  return `$argon2id$v=19$m=65536,t=4,p=2$${saltB64}$${derived}`;
}

export async function resetAndSeedDatabase({ quiet = false } = {}) {
  const log = (msg) => {
    if (!quiet) process.stdout.write(`${msg}\n`);
  };

  const client = new Client({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_DATABASE || 'roomia_db',
    user: process.env.PG_SUPERUSER || 'postgres',
    password: process.env.PG_SUPERUSER_PASSWORD || 'RoomiaAdmin2026!',
  });

  await client.connect();

  try {
    const sqlDir = path.join(__dirname, 'database', 'postgresql');
    const schemaSql = fs.readFileSync(path.join(sqlDir, '01_schema_3fn.sql'), 'utf8');
    const triggersSql = fs.readFileSync(path.join(sqlDir, '02_data_audit_triggers.sql'), 'utf8');
    const catalogJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'database', 'roomia_shared_catalog.json'), 'utf8')
    );

    log('1) Applying 01_schema_3fn.sql...');
    await client.query(schemaSql);

    log('2) Applying 02_data_audit_triggers.sql...');
    await client.query(triggersSql);

    log('3) Seeding users, rich catalog (10 listings), amenities, photos, initial completed booking & review...');
    await client.query('BEGIN');
    await client.query("SELECT set_config('roomia.microservice', 'identity-service', true)");
    await client.query("SELECT set_config('roomia.ip_anonymized', '192.168.10.XXX', true)");

    const demoPasswordHash = hashPassword('RoomiaAudit2026!');

    const seedUsers = [
      {
        id: 1,
        uuid: '10000000-0000-4000-8000-000000000001',
        name: 'Elena Rostova (Superanfitriona)',
        email: 'host.elena@roomia.mx',
        role: 'HOST',
        avatarUrl:
          'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
      },
      {
        id: 104,
        uuid: '10000000-0000-4000-8000-000000000104',
        name: 'Alejandro Mendoza',
        email: 'guest.alejandro@roomia.mx',
        role: 'GUEST',
        avatarUrl:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      },
      {
        id: 999,
        uuid: '10000000-0000-4000-8000-000000000999',
        name: 'Auditor CISA / Admin TI',
        email: 'auditor.ti@roomia.mx',
        role: 'ADMIN',
        avatarUrl:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      },
    ];

    for (const u of seedUsers) {
      await client.query(
        `INSERT INTO users (id, uuid, name, email, password_hash, role, avatar_url, failed_login_attempts)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 0)`,
        [u.id, u.uuid, u.name, u.email, demoPasswordHash, u.role, u.avatarUrl]
      );
    }
    await client.query("SELECT setval('users_id_seq', 1000, true)");

    await client.query("SELECT set_config('roomia.microservice', 'catalog-service', true)");

    const amenityMap = new Map();
    let nextAmenityId = 1;

    for (const item of catalogJson.listings) {
      await client.query(
        `INSERT INTO listings (
           id, uuid, host_id, title, description, category, city, state_name,
           latitude, longitude, price_per_night, max_guests, bedrooms, beds, bathrooms,
           cancellation_policy, status
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'MODERATE','ACTIVE')`,
        [
          item.id,
          item.uuid,
          1,
          item.title,
          item.description,
          item.category || 'Lofts',
          item.city,
          item.stateName || 'Estado de México',
          Number(item.latitude),
          Number(item.longitude),
          Number(item.pricePerNight),
          Number(item.maxGuests || 4),
          Number(item.bedrooms || 2),
          Number(item.beds || 2),
          Number(item.bathrooms || 2),
        ]
      );

      const gallery =
        Array.isArray(item.galleryUrls) && item.galleryUrls.length > 0
          ? item.galleryUrls
          : [item.photoUrl];
      for (let i = 0; i < Math.min(gallery.length, 15); i++) {
        const alt =
          i === 0 && item.photoAlt && item.photoAlt.trim().length >= 5
            ? item.photoAlt.trim()
            : `Vista ${i + 1} de ${item.title} en ${item.city} (WebP)`;
        await client.query(
          `INSERT INTO listing_photos (listing_id, s3_url, alt_text, mime_type, file_size_kb, sort_order)
           VALUES ($1, $2, $3, 'image/webp', $4, $5)`,
          [item.id, gallery[i], alt.slice(0, 255), 380 + i * 25, i + 1]
        );
      }

      const amenities = Array.isArray(item.amenities) ? item.amenities : [];
      for (const name of amenities) {
        const cleanName = String(name).trim();
        if (!cleanName) continue;
        const code = cleanName
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toUpperCase()
          .replace(/[^A-Z0-9]+/g, '_')
          .replace(/^_|_$/g, '')
          .slice(0, 50);
        let amenityId = amenityMap.get(code);
        if (!amenityId) {
          amenityId = nextAmenityId++;
          amenityMap.set(code, amenityId);
          await client.query(
            `INSERT INTO amenities (id, code, name) VALUES ($1, $2, $3) ON CONFLICT (code) DO NOTHING`,
            [amenityId, code, cleanName.slice(0, 100)]
          );
        }
        await client.query(
          `INSERT INTO listing_amenity (listing_id, amenity_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [item.id, amenityId]
        );
      }
    }

    await client.query("SELECT setval('listings_id_seq', 100, true)");
    await client.query("SELECT setval('amenities_id_seq', GREATEST(100, (SELECT COALESCE(MAX(id), 1) FROM amenities)), true)");

    // Seed 1 verified COMPLETED stay so v_booking_tamper_detection, PCI-DSS view & reviews work out of the box
    await client.query("SELECT set_config('roomia.microservice', 'booking-payment-service', true)");

    const bookingUuid = 'b0000001-0001-4001-8001-000000000001';
    const bookingSha256 = crypto
      .createHash('sha256')
      .update(`${bookingUuid}|42|104|5760.00`)
      .digest('hex');

    await client.query(
      `INSERT INTO bookings (
         id, uuid, listing_id, guest_id, check_in, check_out, guests_count,
         nightly_rate, subtotal_amount, service_fee, tax_amount, total_amount, status, integrity_sha256
       ) VALUES (
         1, $1, 42, 104, '2026-10-01', '2026-10-04', 2,
         1500.00, 4500.00, 540.00, 720.00, 5760.00, 'COMPLETED', $2
       )`,
      [bookingUuid, bookingSha256]
    );
    await client.query("SELECT setval('bookings_id_seq', 500, true)");

    for (const d of ['2026-10-01', '2026-10-02', '2026-10-03']) {
      await client.query(
        `INSERT INTO booking_dates (listing_id, booking_id, stay_date, lock_status)
         VALUES (42, 1, $1, 'LOCKED')`,
        [d]
      );
    }

    await client.query(
      `INSERT INTO payments (
         uuid, booking_id, stripe_payment_intent_id, stripe_charge_id, payment_last_four,
         amount, platform_commission, currency, status, webhook_verified_at
       ) VALUES (
         'c0000001-0001-4001-8001-000000000001', 1, 'pi_3Q9SyntheticRoomia0001', 'ch_3Q9SyntheticRoomia0001', '4242',
         5760.00, 540.00, 'MXN', 'COMPLETED', clock_timestamp()
       )`
    );

    await client.query("SELECT set_config('roomia.microservice', 'review-service', true)");
    await client.query(
      `INSERT INTO reviews (id, uuid, booking_id, listing_id, guest_id, rating, comment)
       VALUES (
         1, '90000000-0000-4000-8000-000000000001', 1, 42, 104, 5,
         'Excelente estancia verificada frente al Nevado de Toluca. Todo impecable y 100% conforme a lo publicado.'
       )`
    );
    await client.query("SELECT setval('reviews_id_seq', 10, true)");

    await client.query('COMMIT');

    log('4) Applying least-privilege grants to roomia_app_user (revoking UPDATE/DELETE on audit_logs)...');
    const appUser = process.env.DB_USERNAME || 'roomia_app_user';
    await client.query(`
      GRANT USAGE, CREATE ON SCHEMA public TO ${appUser};
      GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${appUser};
      GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO ${appUser};
      REVOKE UPDATE, DELETE, TRUNCATE ON TABLE audit_logs FROM ${appUser};
    `);

    const summary = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM users) AS users,
        (SELECT COUNT(*) FROM listings) AS listings,
        (SELECT COUNT(*) FROM bookings) AS bookings,
        (SELECT COUNT(*) FROM payments) AS payments,
        (SELECT COUNT(*) FROM reviews) AS reviews,
        (SELECT COUNT(*) FROM audit_logs) AS audit_logs
    `);
    log(`Seed complete -> ${JSON.stringify(summary.rows[0])}`);
    return summary.rows[0];
  } finally {
    await client.end();
  }
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isDirectRun) {
  resetAndSeedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      process.stderr.write(`Seed failed: ${err.stack || err.message}\n`);
      process.exit(1);
    });
}
