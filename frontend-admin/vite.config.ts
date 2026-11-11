import { defineConfig } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';
// @ts-expect-error -- ESM Node backend engine imported into Vite dev server middleware
import { handleApiRequest } from '../backend/apiEngine.mjs';

function roomiaApiMiddlewarePlugin() {
  return {
    name: 'roomia-api-v1-middleware',
    configureServer(server: {
      middlewares: {
        use: (fn: (req: IncomingMessage, res: ServerResponse, next: () => void) => void) => void;
      };
    }) {
      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const url = req.url || '';
        if (!url.startsWith('/api/v1/')) {
          next();
          return;
        }

        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => chunks.push(chunk));
        req.on('end', () => {
          const rawBody = Buffer.concat(chunks).toString('utf8');
          let parsedBody: Record<string, unknown> = {};
          if (rawBody) {
            try {
              parsedBody = JSON.parse(rawBody) as Record<string, unknown>;
            } catch {
              parsedBody = {};
            }
          }

          const result = handleApiRequest(req.method || 'GET', url, parsedBody, req.headers || {});
          res.statusCode = result.statusCode;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('X-Content-Type-Options', 'nosniff');
          res.setHeader('X-Frame-Options', 'DENY');
          res.end(JSON.stringify(result.payload));
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [roomiaApiMiddlewarePlugin()],
  server: {
    port: 5175,
    strictPort: true,
  },
});
