// Controleert het Cloudflare Access-token (JWT) dat Access met elk verzoek meestuurt.
// Zo kan niemand de API gebruiken zonder via Access ingelogd te zijn.

import type { Env } from './index';

interface Jwk {
  kid: string;
  kty: string;
  n: string;
  e: string;
  alg?: string;
}

let cachedKeys: { teamDomain: string; keys: Jwk[]; fetchedAt: number } | null = null;

async function getKeys(teamDomain: string, forceRefresh = false): Promise<Jwk[]> {
  const fresh = cachedKeys && cachedKeys.teamDomain === teamDomain && Date.now() - cachedKeys.fetchedAt < 60 * 60 * 1000;
  if (fresh && !forceRefresh) return cachedKeys!.keys;
  const res = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`);
  if (!res.ok) throw new Error(`Kon Access-sleutels niet ophalen (${res.status})`);
  const data = (await res.json()) as { keys: Jwk[] };
  cachedKeys = { teamDomain, keys: data.keys, fetchedAt: Date.now() };
  return data.keys;
}

function base64UrlDecode(input: string): Uint8Array {
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(input.length / 4) * 4, '=');
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function verifyAccessJwt(token: string, teamDomain: string, aud: string): Promise<string | null> {
  const [headerB64, payloadB64, sigB64] = token.split('.');
  if (!headerB64 || !payloadB64 || !sigB64) return null;

  const header = JSON.parse(new TextDecoder().decode(base64UrlDecode(headerB64))) as { kid?: string; alg?: string };
  if (header.alg !== 'RS256' || !header.kid) return null;

  let jwk = (await getKeys(teamDomain)).find((k) => k.kid === header.kid);
  if (!jwk) jwk = (await getKeys(teamDomain, true)).find((k) => k.kid === header.kid);
  if (!jwk) return null;

  const key = await crypto.subtle.importKey(
    'jwk',
    { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true },
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );
  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    base64UrlDecode(sigB64),
    new TextEncoder().encode(`${headerB64}.${payloadB64}`)
  );
  if (!valid) return null;

  const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadB64))) as {
    aud?: string | string[];
    exp?: number;
    iss?: string;
    email?: string;
  };
  const auds = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!auds.includes(aud)) return null;
  if (!payload.exp || payload.exp * 1000 < Date.now()) return null;
  if (payload.iss !== `https://${teamDomain}`) return null;
  return payload.email ? payload.email.toLowerCase() : null;
}

export async function getUserEmail(request: Request, env: Env): Promise<string | null> {
  if (env.ACCESS_TEAM_DOMAIN && env.ACCESS_AUD) {
    const token = request.headers.get('Cf-Access-Jwt-Assertion');
    if (!token) return null;
    try {
      return await verifyAccessJwt(token, env.ACCESS_TEAM_DOMAIN, env.ACCESS_AUD);
    } catch (err) {
      console.error('Access-token controle mislukt', err);
      return null;
    }
  }

  // Lokaal ontwikkelen zonder Access
  if (env.DEV_USER_EMAIL) return env.DEV_USER_EMAIL.toLowerCase();

  return null;
}
