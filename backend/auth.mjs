// Comptes et sessions.
//   POST /api/auth/signup { library, type, city, name, phone, email, password, remember } → 201 { token, user, place }
//   POST /api/auth/login  { email, password, remember }                                  → 200 { token, user, place }
//   POST /api/auth/logout (Authorization: Bearer <token>)                                → 204
// Les mots de passe sont hachés avec scrypt ; le jeton n'est stocké que sous forme d'empreinte SHA-256.
import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { endpoint, json, readBody } from './http.mjs';

const scryptAsync = promisify(scrypt);

export const REMEMBER_TTL = 30 * 24 * 3600;
export const SESSION_TTL = 24 * 3600;
export const MAX_FAILURES = 10;
const FAILURE_WINDOW = 15 * 60;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TYPES = ['Municipale', 'Universitaire', 'Scolaire', 'Associative'];

const text = (value) => (typeof value === 'string' ? value.trim() : '');
const normalizeEmail = (value) => text(value).toLowerCase();
const hashToken = (token) => createHash('sha256').update(token).digest('hex');

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, 64);
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export async function verifyPassword(password, stored) {
  const [scheme, salt, hash] = String(stored).split('$');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64');
  const actual = await scryptAsync(password, Buffer.from(salt, 'base64'), expected.length);
  return timingSafeEqual(actual, expected);
}

/** Mêmes messages et même ordre que le formulaire d'inscription. */
export function signupError(body) {
  if (!text(body.library)) return 'Indiquez le nom de la bibliothèque.';
  if (!text(body.name)) return 'Indiquez votre nom complet.';
  if (!/^(\+225)?\d{10}$/.test(text(body.phone).replace(/\s/g, '')))
    return 'Numéro de téléphone invalide : 10 chiffres, avec ou sans +225.';
  if (!EMAIL_RE.test(normalizeEmail(body.email))) return 'Saisissez une adresse e-mail valide.';
  if (typeof body.password !== 'string' || body.password.length < 8 || !/\d/.test(body.password))
    return 'Mot de passe : 8 caractères minimum, dont un chiffre.';
  return '';
}

async function openSession(store, user, remember) {
  const token = randomBytes(32).toString('base64url');
  const session = { email: user.email, library: user.library.id };
  await store.setSession(hashToken(token), JSON.stringify(session), remember ? REMEMBER_TTL : SESSION_TTL);
  return { token, user: `${user.name}, ${user.role}`, place: user.library.name };
}

const bearer = (request) => /^Bearer (\S+)$/.exec(request.headers.get('Authorization') ?? '')?.[1];

/** @returns {Promise<{ email: string, library: string } | null>} */
export async function authenticate(request, store) {
  const token = bearer(request);
  if (!token) return null;
  const session = await store.getSession(hashToken(token));
  return session ? JSON.parse(session) : null;
}

export const handleSignup = endpoint(['POST'], async (request, store) => {
  const body = await readBody(request);
  if (!body) return json(400, { error: 'JSON invalide.' });
  const error = signupError(body);
  if (error) return json(400, { error });
  const email = normalizeEmail(body.email);
  const user = {
    email,
    name: text(body.name),
    role: 'administrateur',
    phone: text(body.phone),
    passwordHash: await hashPassword(body.password),
    library: {
      id: randomUUID(),
      name: text(body.library),
      type: TYPES.includes(body.type) ? body.type : TYPES[0],
      city: text(body.city),
    },
    createdAt: new Date().toISOString(),
  };
  if (!(await store.createUser(email, JSON.stringify(user)))) {
    return json(409, { error: 'Un compte existe déjà avec cette adresse e-mail.' });
  }
  return json(201, await openSession(store, user, body.remember !== false));
});

export const handleLogin = endpoint(['POST'], async (request, store) => {
  const body = await readBody(request);
  const email = normalizeEmail(body?.email);
  if (!EMAIL_RE.test(email) || typeof body.password !== 'string') {
    return json(400, { error: 'Saisissez une adresse e-mail valide.' });
  }
  if ((await store.failures(email)) >= MAX_FAILURES) {
    return json(429, { error: 'Trop de tentatives : réessayez dans 15 minutes.' });
  }
  const stored = await store.getUser(email);
  const user = stored ? JSON.parse(stored) : null;
  if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
    await store.addFailure(email, FAILURE_WINDOW);
    return json(401, { error: 'E-mail ou mot de passe incorrect.' });
  }
  await store.clearFailures(email);
  return json(200, await openSession(store, user, body.remember !== false));
});

export const handleLogout = endpoint(['POST'], async (request, store) => {
  const token = bearer(request);
  if (token) await store.deleteSession(hashToken(token));
  return new Response(null, { status: 204 });
});
