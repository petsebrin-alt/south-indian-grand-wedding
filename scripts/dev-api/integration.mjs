// Astro integration: serves the local dev API at /api during `astro dev` only.
// The router is loaded through Vite so it can share the TypeScript backend handlers.
export function devApi() {
  return {
    name: 'rdv-dev-api',
    hooks: {
      'astro:server:setup': ({ server }) => {
        server.middlewares.use(async (req, res, next) => {
          if (!req.url?.startsWith('/api/')) return next();
          try {
            const { handleDevRequest } = await server.ssrLoadModule('/scripts/dev-api/router.ts');
            const chunks = [];
            for await (const chunk of req) chunks.push(chunk);
            const body = chunks.length ? Buffer.concat(chunks) : undefined;
            const headers = new Headers();
            for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v);
            headers.set('x-real-ip', req.socket.remoteAddress ?? '127.0.0.1');
            const request = new Request(`http://${req.headers.host}${req.url}`, {
              method: req.method,
              headers,
              body: body && req.method !== 'GET' && req.method !== 'HEAD' ? body : undefined,
            });
            const response = await handleDevRequest(request);
            if (!response) return next();
            res.statusCode = response.status;
            response.headers.forEach((value, key) => res.setHeader(key, value));
            res.end(Buffer.from(await response.arrayBuffer()));
          } catch (err) {
            console.error('[dev-api]', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'dev-api-crash' }));
          }
        });
      },
    },
  };
}
