# Wijnkelder

Persoonlijke app om je wijnvoorraad bij te houden, met AI-wijninformatie en spijs-wijnadvies.

Draait op Cloudflare: de app en API op Workers (`worker/`), gegevens in D1 (`migrations/`),
inloggen via Cloudflare Access. Online op https://wijn.meertenhamer.nl.

## Lokaal ontwikkelen

```bash
npm install
cp .dev.vars.example .dev.vars   # vul DEV_USER_EMAIL en eventueel een AI-key in
npm run db:migrate:local
npm run dev:api                  # Worker + lokale database op :8787
npm run dev                      # Vite op :5173, stuurt /api door naar :8787
```

## Online zetten

Elke push naar de gekoppelde branch wordt door Cloudflare Workers Builds gebouwd
(`npm run build`) en online gezet (`npx wrangler deploy`).

AI-keys staan als geheim op de Worker (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`),
in te stellen via Workers & Pages → wijnkelder → Settings → Variables and Secrets.

## Gegevens uit Supabase overzetten

```bash
node scripts/supabase-csv-naar-sql.mjs jij@example.com wines.csv wine_locations.csv > import.sql
npx wrangler d1 execute wijnkelder --remote --file import.sql
```
