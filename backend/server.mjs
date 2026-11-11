import http from 'http';
import { handleApiRequest } from './apiEngine.mjs';

const PORT = Number(process.env.PORT || 8000);

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Stripe-Signature');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const chunks = [];
  req.on('data', (chunk) => chunks.push(chunk));
  req.on('end', () => {
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
