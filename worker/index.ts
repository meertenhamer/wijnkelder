// Wijnkelder API op Cloudflare Workers.
// - Serveert de React-app (statische bestanden uit dist/) via de assets-binding.
// - /api/* gaat langs deze Worker: wijnen, locaties, instellingen en AI-aanroepen.
// - Inloggen gebeurt door Cloudflare Access; deze Worker controleert het Access-token.

import { getUserEmail } from './auth';

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  // Cloudflare Access (instellen in wrangler.jsonc)
  ACCESS_TEAM_DOMAIN?: string; // bijv. "meertenhamer.cloudflareaccess.com" (meerdere: komma-gescheiden)
  ACCESS_AUD?: string; // "Application Audience (AUD) Tag" van de Access-app
  // Alleen voor lokaal ontwikkelen (.dev.vars), nooit in productie zetten
  DEV_USER_EMAIL?: string;
  // Geheimen (wrangler secret put / dashboard)
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
}

type AiProvider = 'openai' | 'claude';

const WINE_TYPES = ['rood', 'wit', 'rosé', 'bruisend'];

interface WineInput {
  name: string;
  year: number;
  grapes?: string;
  quantity: number;
  country?: string;
  region?: string;
  type: string;
  bestBefore?: string;
  tasteProfile?: string;
  pairingAdvice?: string;
  funFact?: string;
  notes?: string;
  rating?: number;
  location?: string;
}

interface DbWine {
  id: string;
  name: string;
  year: number;
  grapes: string | null;
  quantity: number;
  country: string | null;
  region: string | null;
  type: string;
  best_before: string | null;
  taste_profile: string | null;
  pairing_advice: string | null;
  fun_fact: string | null;
  notes: string | null;
  rating: number | null;
  location: string | null;
  created_at: string;
}

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function dbToWine(w: DbWine) {
  return {
    id: w.id,
    name: w.name,
    year: w.year,
    grapes: w.grapes ?? undefined,
    quantity: w.quantity,
    country: w.country ?? undefined,
    region: w.region ?? undefined,
    type: w.type,
    bestBefore: w.best_before ?? undefined,
    tasteProfile: w.taste_profile ?? undefined,
    pairingAdvice: w.pairing_advice ?? undefined,
    funFact: w.fun_fact ?? undefined,
    notes: w.notes ?? undefined,
    rating: w.rating ?? undefined,
    location: w.location ?? undefined,
    createdAt: w.created_at,
  };
}

const str = (v: unknown) => (typeof v === 'string' && v.trim() !== '' ? v : null);

function validateWine(body: unknown): WineInput {
  const w = body as Partial<WineInput>;
  if (!w || typeof w.name !== 'string' || !w.name.trim()) throw new HttpError(400, 'Naam ontbreekt');
  if (typeof w.year !== 'number') throw new HttpError(400, 'Jaar ontbreekt');
  if (typeof w.quantity !== 'number') throw new HttpError(400, 'Aantal ontbreekt');
  if (typeof w.type !== 'string' || !WINE_TYPES.includes(w.type)) throw new HttpError(400, 'Ongeldig wijntype');
  return w as WineInput;
}

function wineValues(w: WineInput) {
  return [
    w.name.trim(),
    w.year,
    str(w.grapes),
    w.quantity,
    str(w.country),
    str(w.region),
    w.type,
    str(w.bestBefore),
    str(w.tasteProfile),
    str(w.pairingAdvice),
    str(w.funFact),
    str(w.notes),
    typeof w.rating === 'number' && w.rating >= 1 && w.rating <= 5 ? w.rating : null,
    str(w.location),
  ];
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new HttpError(400, 'Ongeldige JSON');
  }
}

async function getProvider(env: Env, user: string): Promise<AiProvider> {
  const row = await env.DB.prepare('SELECT ai_provider FROM user_settings WHERE user_id = ?')
    .bind(user)
    .first<{ ai_provider: string }>();
  const chosen: AiProvider = row?.ai_provider === 'claude' ? 'claude' : row?.ai_provider === 'openai' ? 'openai' : 'claude';
  // Val terug op de provider waarvoor wél een key op de server staat
  if (chosen === 'claude' && !env.ANTHROPIC_API_KEY && env.OPENAI_API_KEY) return 'openai';
  if (chosen === 'openai' && !env.OPENAI_API_KEY && env.ANTHROPIC_API_KEY) return 'claude';
  return chosen;
}

async function callAI(env: Env, provider: AiProvider, prompt: string): Promise<string> {
  if (provider === 'claude') {
    if (!env.ANTHROPIC_API_KEY) throw new HttpError(500, 'Er is geen Claude API key ingesteld op de server.');
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5-5',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = (await res.json()) as { content?: { text?: string }[]; error?: { message?: string } };
    if (!res.ok) throw new HttpError(502, data.error?.message || 'Claude API fout');
    const text = data.content?.[0]?.text;
    if (!text) throw new HttpError(502, 'Geen antwoord van Claude');
    return text;
  }

  if (!env.OPENAI_API_KEY) throw new HttpError(500, 'Er is geen OpenAI API key ingesteld op de server.');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  });
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[]; error?: { message?: string } };
  if (!res.ok) throw new HttpError(502, data.error?.message || 'OpenAI API fout');
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new HttpError(502, 'Geen antwoord van OpenAI');
  return text;
}

async function handleApi(request: Request, env: Env, path: string): Promise<Response> {
  const user = await getUserEmail(request, env);
  if (!user) throw new HttpError(401, 'Niet ingelogd');

  const method = request.method;
  const parts = path.split('/').filter(Boolean); // ['api', 'wines', ':id']
  const resource = parts[1];
  const id = parts[2];

  // --- Gebruiker & instellingen ---
  if (resource === 'me' && method === 'GET') {
    return json({
      email: user,
      aiProvider: await getProvider(env, user),
      hasOpenAI: Boolean(env.OPENAI_API_KEY),
      hasClaude: Boolean(env.ANTHROPIC_API_KEY),
    });
  }

  if (resource === 'settings' && method === 'PUT') {
    const body = (await readJson(request)) as { aiProvider?: string };
    const provider: AiProvider = body.aiProvider === 'claude' ? 'claude' : 'openai';
    await env.DB.prepare(
      `INSERT INTO user_settings (user_id, ai_provider, updated_at)
       VALUES (?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
       ON CONFLICT (user_id) DO UPDATE SET ai_provider = excluded.ai_provider, updated_at = excluded.updated_at`
    )
      .bind(user, provider)
      .run();
    return json({ aiProvider: provider });
  }

  // --- Wijnen ---
  if (resource === 'wines') {
    if (!id && method === 'GET') {
      const { results } = await env.DB.prepare(
        'SELECT * FROM wines WHERE user_id = ? ORDER BY created_at DESC'
      )
        .bind(user)
        .all<DbWine>();
      return json(results.map(dbToWine));
    }

    if (!id && method === 'POST') {
      const wine = validateWine(await readJson(request));
      const newId = crypto.randomUUID();
      const row = await env.DB.prepare(
        `INSERT INTO wines (id, user_id, name, year, grapes, quantity, country, region, type,
           best_before, taste_profile, pairing_advice, fun_fact, notes, rating, location)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         RETURNING *`
      )
        .bind(newId, user, ...wineValues(wine))
        .first<DbWine>();
      return json(dbToWine(row!), 201);
    }

    if (id && method === 'PUT') {
      const wine = validateWine(await readJson(request));
      const result = await env.DB.prepare(
        `UPDATE wines SET name = ?, year = ?, grapes = ?, quantity = ?, country = ?, region = ?, type = ?,
           best_before = ?, taste_profile = ?, pairing_advice = ?, fun_fact = ?, notes = ?, rating = ?, location = ?
         WHERE id = ? AND user_id = ?`
      )
        .bind(...wineValues(wine), id, user)
        .run();
      if (!result.meta.changes) throw new HttpError(404, 'Wijn niet gevonden');
      return json({ ok: true });
    }

    if (id && method === 'DELETE') {
      await env.DB.prepare('DELETE FROM wines WHERE id = ? AND user_id = ?').bind(id, user).run();
      return json({ ok: true });
    }
  }

  // --- Locaties ---
  if (resource === 'locations') {
    if (!id && method === 'GET') {
      const { results } = await env.DB.prepare(
        'SELECT id, name, created_at FROM wine_locations WHERE user_id = ? ORDER BY name COLLATE NOCASE'
      )
        .bind(user)
        .all<{ id: string; name: string; created_at: string }>();
      return json(results.map((l) => ({ id: l.id, name: l.name, createdAt: l.created_at })));
    }

    if (!id && method === 'POST') {
      const body = (await readJson(request)) as { name?: string };
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      if (!name) throw new HttpError(400, 'Naam ontbreekt');
      const row = await env.DB.prepare(
        `INSERT INTO wine_locations (id, user_id, name) VALUES (?, ?, ?)
         ON CONFLICT (user_id, name) DO UPDATE SET name = excluded.name
         RETURNING id, name, created_at`
      )
        .bind(crypto.randomUUID(), user, name)
        .first<{ id: string; name: string; created_at: string }>();
      return json({ id: row!.id, name: row!.name, createdAt: row!.created_at }, 201);
    }

    if (id && method === 'DELETE') {
      await env.DB.prepare('DELETE FROM wine_locations WHERE id = ? AND user_id = ?').bind(id, user).run();
      return json({ ok: true });
    }
  }

  // --- AI ---
  if (resource === 'ai' && method === 'POST') {
    const body = (await readJson(request)) as { prompt?: string };
    if (typeof body.prompt !== 'string' || !body.prompt.trim()) throw new HttpError(400, 'Prompt ontbreekt');
    if (body.prompt.length > 20000) throw new HttpError(400, 'Prompt is te lang');
    const text = await callAI(env, await getProvider(env, user), body.prompt);
    return json({ text });
  }

  throw new HttpError(404, 'Niet gevonden');
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      try {
        return await handleApi(request, env, url.pathname);
      } catch (err) {
        if (err instanceof HttpError) return json({ error: err.message }, err.status);
        console.error(err);
        return json({ error: 'Er ging iets mis op de server' }, 500);
      }
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
