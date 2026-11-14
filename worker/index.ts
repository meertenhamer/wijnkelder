// Wijnkelder API op Cloudflare Workers.
// - Serveert de React-app (statische bestanden uit dist/) via de assets-binding.
// - /api/* gaat langs deze Worker: wijnen, locaties, instellingen en AI-aanroepen.
// - Inloggen gebeurt door Cloudflare Access; deze Worker controleert het Access-token.

import Anthropic from '@anthropic-ai/sdk';
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
  price?: number | null;
  priceEstimated?: boolean;
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
  price: number | null;
  price_estimated: number;
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
    price: w.price ?? undefined,
    priceEstimated: w.price != null && w.price_estimated === 1 ? true : undefined,
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
    validPrice(w.price),
    validPrice(w.price) != null && w.priceEstimated ? 1 : 0,
  ];
}

function validPrice(v: unknown): number | null {
  return typeof v === 'number' && isFinite(v) && v >= 0 && v < 100000 ? Math.round(v * 100) / 100 : null;
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
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, timeout: 60_000 });
    try {
      const response = await client.beta.messages.create({
        model: 'claude-sonnet-5-5',
        max_tokens: 16000,
        // Eenvoudige JSON-opdracht: weinig nadenken houdt het snel
        output_config: { effort: 'low' },
        // Bij een (onterechte) weigering automatisch een ander model laten antwoorden
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        messages: [{ role: 'user', content: prompt }],
      });
      if (response.stop_reason === 'refusal') {
        throw new HttpError(502, 'Claude wilde deze vraag niet beantwoorden. Probeer het anders te formuleren.');
      }
      // Het antwoord kan met een denkblok beginnen: pak alleen de tekstblokken
      const text = response.content
        .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === 'text')
        .map((block) => block.text)
        .join('');
      if (!text) {
        console.error('Claude gaf geen tekst terug', response.stop_reason, response.content.map((b) => b.type));
        throw new HttpError(502, 'Geen antwoord van Claude');
      }
      return text;
    } catch (err) {
      if (err instanceof HttpError) throw err;
      if (err instanceof Anthropic.RateLimitError) {
        throw new HttpError(503, 'Claude is even te druk bezet. Probeer het over een minuut opnieuw.');
      }
      if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
        console.error('Claude-sleutel geweigerd', err.status, err.message);
        throw new HttpError(500, 'De Claude API key op de server werkt niet (meer).');
      }
      if (err instanceof Anthropic.APIError) {
        console.error('Claude API fout', err.status, err.message);
        throw new HttpError(502, err.status === 529
          ? 'Claude is even overbelast. Probeer het zo opnieuw.'
          : `Claude gaf een fout (${err.status ?? 'geen verbinding'}).`);
      }
      throw err;
    }
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
  if (!res.ok) {
    console.error('OpenAI API fout', res.status, data.error?.message);
    throw new HttpError(502, data.error?.message || 'OpenAI API fout');
  }
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new HttpError(502, 'Geen antwoord van OpenAI');
  return text;
}

function pricePrompt(w: DbWine, withSearch: boolean): string {
  return `Wat kost deze wijn ongeveer per fles (0,75 l) bij Nederlandse wijnhandels of slijterijen?

Naam: ${w.name}
Jaar: ${w.year}
${w.region || w.country ? `Herkomst: ${[w.region, w.country].filter(Boolean).join(', ')}` : ''}
${w.grapes ? `Druif: ${w.grapes}` : ''}

${withSearch ? 'Zoek online naar actuele prijzen. ' : ''}Geef een gangbare winkelprijs in euro's. Bestaat deze jaargang niet meer in de handel, schat dan op basis van recente jaargangen. Weet je het echt niet, geef dan null.

Antwoord ALLEEN met JSON: {"price": 12.95}`;
}

function parsePrice(text: string): number | null {
  const match = text.match(/\{[^{}]*"price"[^{}]*\}/);
  if (!match) return null;
  try {
    return validPrice((JSON.parse(match[0]) as { price?: unknown }).price);
  } catch {
    return null;
  }
}

/** Zoekt de prijs per fles op: met Claude (online zoeken) of anders een schatting via OpenAI */
async function lookupPrice(env: Env, wine: DbWine): Promise<number | null> {
  if (env.ANTHROPIC_API_KEY) {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, timeout: 90_000 });
    const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: 'user', content: pricePrompt(wine, true) }];
    try {
      // Server-tools kunnen pauzeren (pause_turn); ga dan maximaal twee keer verder
      for (let attempt = 0; attempt < 3; attempt++) {
        const response = await client.beta.messages.create({
          model: 'claude-sonnet-5-5',
          max_tokens: 16000,
          output_config: { effort: 'low' },
          betas: ['server-side-fallback-2026-07-01'],
          fallbacks: 'default',
          tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 3, user_location: { type: 'approximate', country: 'NL' } }],
          messages,
        });
        if (response.stop_reason === 'pause_turn') {
          messages.push({ role: 'assistant', content: response.content });
          continue;
        }
        const text = response.content
          .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
          .map((b) => b.text)
          .join('');
        return parsePrice(text);
      }
      return null;
    } catch (err) {
      if (err instanceof Anthropic.RateLimitError) {
        throw new HttpError(503, 'Claude is even te druk bezet. Probeer het over een minuut opnieuw.');
      }
      if (err instanceof Anthropic.APIError) {
        console.error('Claude prijs-opzoeken fout', err.status, err.message);
        throw new HttpError(502, `Prijs opzoeken mislukt (${err.status ?? 'geen verbinding'}).`);
      }
      throw err;
    }
  }
  if (env.OPENAI_API_KEY) {
    return parsePrice(await callAI(env, 'openai', pricePrompt(wine, false)));
  }
  throw new HttpError(500, 'Er is geen AI-sleutel ingesteld op de server.');
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
           best_before, taste_profile, pairing_advice, fun_fact, notes, rating, location, price, price_estimated)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         RETURNING *`
      )
        .bind(newId, user, ...wineValues(wine))
        .first<DbWine>();
      return json(dbToWine(row!), 201);
    }

    if (id && !parts[3] && method === 'PUT') {
      const wine = validateWine(await readJson(request));
      const result = await env.DB.prepare(
        `UPDATE wines SET name = ?, year = ?, grapes = ?, quantity = ?, country = ?, region = ?, type = ?,
           best_before = ?, taste_profile = ?, pairing_advice = ?, fun_fact = ?, notes = ?, rating = ?, location = ?,
           price = ?, price_estimated = ?
         WHERE id = ? AND user_id = ?`
      )
        .bind(...wineValues(wine), id, user)
        .run();
      if (!result.meta.changes) throw new HttpError(404, 'Wijn niet gevonden');
      return json({ ok: true });
    }

    if (id && parts[3] === 'price' && method === 'POST') {
      const wine = await env.DB.prepare('SELECT * FROM wines WHERE id = ? AND user_id = ?').bind(id, user).first<DbWine>();
      if (!wine) throw new HttpError(404, 'Wijn niet gevonden');
      const price = await lookupPrice(env, wine);
      if (price == null) throw new HttpError(404, 'Claude kon geen prijs vinden voor deze wijn.');
      const updated = await env.DB.prepare(
        'UPDATE wines SET price = ?, price_estimated = 1 WHERE id = ? AND user_id = ? RETURNING *'
      )
        .bind(price, id, user)
        .first<DbWine>();
      return json(dbToWine(updated!));
    }

    if (id && !parts[3] && method === 'DELETE') {
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
