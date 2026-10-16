// Sert /api/state en local pour `npm start` (voir proxy.conf.json).
// Sans variables Upstash, l'état est gardé en mémoire et repart à zéro à chaque lancement.
import { createServer } from 'node:http';
import { handleState } from '../backend/state-handler.mjs';
import { createMemoryStore, storeFromEnv } from '../backend/store.mjs';

const PORT = Number(process.env.API_PORT ?? 3001);
const configured = storeFromEnv(process.env);
const store = configured ?? createMemoryStore();

createServer(async (req, res) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const request = new Request(`http://localhost:${PORT}${req.url}`, {
    method: req.method,
    headers: { 'Content-Type': req.headers['content-type'] ?? 'application/json' },
    body: chunks.length ? Buffer.concat(chunks) : undefined,
  });
  const response =
    new URL(request.url).pathname === '/api/state'
      ? await handleState(request, store)
      : new Response('Not found', { status: 404 });
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
}).listen(PORT, () => {
  console.log(`API BiblioTech : http://localhost:${PORT}/api/state (${configured ? 'Upstash Redis' : 'mémoire'})`);
});
