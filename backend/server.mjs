import http from 'http';
import { handleApiRequest } from './apiEngine.mjs';

if (process.env.NODE_ENV === 'production' && (!process.env.ROOMIA_JWT_SECRET || !process.env.STRIPE_WEBHOOK_SECRET)) {
  process.stderr.write('FATAL (SEC-03): ROOMIA_JWT_SECRET and STRIPE_WEBHOOK_SECRET are required in production.\n');
  process.exit(1);
}

const PORT = Number(process.env.PORT || 8000);
const MAX_BODY_BYTES = 1_048_576; // 1 MB strict payload cap (REN-01)

const DEFAULT_ORIGINS = [
  'http://127.0.0.1:5174',
  'http://localhost:5174',
  'http://127.0.0.1:5175',
  'http://localhost:5175',
];

const EXTRA_ORIGINS = (process.env.CORS_ALLOWED_ORIGINS || process.env.CORS_ALLOWED_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const ALLOWED_ORIGINS = new Set([...DEFAULT_ORIGINS, ...EXTRA_ORIGINS]);

const server = http.createServer((req, res) => {
  const origin = req.headers.origin;
  res.setHeader('Vary', 'Origin');
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Stripe-Signature');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const contentLength = Number(req.headers['content-length'] || 0);
  if (contentLength > MAX_BODY_BYTES) {
    res.statusCode = 413;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ status_code: 413, error: 'Payload Too Large: Maximum 1 MB allowed.' }));
    req.destroy();
    return;
  }

  const chunks = [];
  let receivedBytes = 0;
  let aborted = false;

  req.on('data', (chunk) => {
    if (aborted) return;
    receivedBytes += chunk.length;
    if (receivedBytes > MAX_BODY_BYTES) {
      aborted = true;
      res.statusCode = 413;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ status_code: 413, error: 'Payload Too Large: Maximum 1 MB allowed.' }));
      req.destroy();
      return;
    }
    chunks.push(chunk);
  });

  req.on('end', () => {
    if (aborted) return;
    const rawBody = Buffer.concat(chunks).toString('utf8');
    let parsedBody = {};
    if (rawBody) {
      try {
        parsedBody = JSON.parse(rawBody);
      } catch {
        parsedBody = {};
      }
    }

    const result = handleApiRequest(req.method || 'GET', req.url || '/', parsedBody, req.headers || {});
    res.statusCode = result.statusCode;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.end(JSON.stringify(result.payload));
  });
});

server.listen(PORT, () => {
  process.stdout.write(`Roomia API v1 Server listening on port ${PORT}\n`);
});
