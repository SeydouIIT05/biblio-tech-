// Sert l'API en local pour `npm start` (voir proxy.conf.json).
// Sans variables Upstash, comptes et données sont gardés en mémoire et repartent à zéro à chaque lancement.
import { createServer } from 'node:http';
import { handleLogin, handleLogout, handleSignup } from '../backend/auth.mjs';
import { handleState } from '../backend/state-handler.mjs';
import { createMemoryStore, storeFromEnv } from '../backend/store.mjs';

const PORT = Number(process.env.API_PORT ?? 3001);
const configured = storeFromEnv(process.env);
const store = configured ?? createMemoryStore();
const routes = {
  '/api/state': handleState,
  '/api/auth/signup': handleSignup,
  '/api/auth/login': handleLogin,
  '/api/auth/logout': handleLogout,
};

createServer(async (req, res) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const headers = { 'Content-Type': req.headers['content-type'] ?? 'application/json' };
  if (req.headers.authorization) headers.Authorization = req.headers.authorization;
  const request = new Request(`http://localhost:${PORT}${req.url}`, {
    method: req.method,
    headers,
    body: chunks.length ? Buffer.concat(chunks) : undefined,
  });
  const handler = routes[new URL(request.url).pathname];
  const response = handler ? await handler(request, store) : new Response('Not found', { status: 404 });
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
}).listen(PORT, () => {
  console.log(`API BiblioTech : http://localhost:${PORT}/api (${configured ? 'Upstash Redis' : 'mémoire'})`);
});
