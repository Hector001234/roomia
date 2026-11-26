import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lightweight .env loader (no external dependency required)
export function loadEnvFile() {
  const candidates = [
    path.resolve(__dirname, '..', '.env'),
    path.resolve(__dirname, '.env'),
  ];
  for (const envPath of candidates) {
    if (!fs.existsSync(envPath)) continue;
    const raw = fs.readFileSync(envPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) {
        process.env[key] = val;
      }
    }
    break;
  }
}

loadEnvFile();

export const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_DATABASE || 'roomia_db',
  user: process.env.DB_USERNAME || 'roomia_app_user',
  password: process.env.DB_PASSWORD || 'RoomiaApp2026!',
  max: 15,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  process.stderr.write(`[Roomia PG Pool Error] ${err.message}\n`);
});

export function anonymizeIp(rawIp) {
  const ip = String(rawIp || '127.0.0.1').split(',')[0].trim().replace(/^::ffff:/, '');
  if (ip === '::1' || ip === 'localhost') return '127.0.0.XXX';
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.XXX`;
  }
  return '127.0.0.XXX';
}

export async function withTransaction(options, callback) {
  const opts = typeof options === 'function' ? {} : options || {};
  const fn = typeof options === 'function' ? options : callback;
  const microservice = opts.microservice || 'roomia-api-v1';
  const ipAnonymized = anonymizeIp(opts.ip || '127.0.0.1');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('roomia.microservice', $1, true)", [microservice]);
    await client.query("SELECT set_config('roomia.ip_anonymized', $1, true)", [ipAnonymized]);
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // ignore rollback error
    }
    throw err;
  } finally {
    client.release();
  }
}

export async function verifyDbConnection() {
  const { rows } = await pool.query('SELECT current_database() AS db, current_user AS usr, version() AS ver');
  return rows[0];
}
