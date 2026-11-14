# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server with HMR (proxies /api to :8787)
npm run dev:api    # Start the Worker locally with a local D1 (needs .dev.vars, see .dev.vars.example)
npm run build      # TypeScript compile + Vite production build
npm run deploy     # Build + wrangler deploy to Cloudflare
npm run db:migrate # Apply migrations/ to the remote D1 database
npm run lint       # Run ESLint
npm run preview    # Preview production build locally
```

## Architecture

**Wijnkelder** is a Dutch-language wine cellar management SPA built with React + TypeScript + Vite, hosted on Cloudflare Workers (static assets + `/api` Worker), with Cloudflare D1 for storage, Cloudflare Access for login, and OpenAI (gpt-4o-mini) or Claude for wine metadata enrichment.

### State & Routing

There is no router library. `App.tsx` holds a `tab` state (`'kelder' | 'spijs' | 'overzicht' | 'instellingen'`, rendered with a bottom `TabBar`), an `openWineId` for the pushed `WineDetail` screen, and an `adding` flag for the `AddWineSheet` bottom sheet. `App.tsx` also owns the top-level `wines` and `locations` state and passes down callbacks to child components.

### Data Flow

Wine data flows top-down from `App.tsx`. When a component modifies data it calls a callback, which updates both the API/D1 and the React state in the parent. Components do not interact with each other directly.

**Adding a wine:** `AddWineSheet` collects name/year/etc. → optionally previews `fetchWineInfo()` (via `/api/ai`), or fetches it on save → `storage.saveWine()` → `onSaved(wine)` back to `App.tsx`, which opens the new wine.

**Food pairing:** `FoodPairing` sends the user's dish text + their in-stock wines to `getFoodPairing()` (via `/api/ai`), which returns ranked recommendations referencing wines by index in the submitted list.

### Services

- **`worker/index.ts`** — Cloudflare Worker: serves `dist/` via the ASSETS binding and handles `/api/*` (`me`, `settings`, `wines`, `locations`, `ai`). Converts snake_case (D1) ↔ camelCase (app). AI keys are Worker secrets (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`) and never reach the client.
- **`worker/auth.ts`** — Verifies the Cloudflare Access JWT (`Cf-Access-Jwt-Assertion`) using `ACCESS_TEAM_DOMAIN` + `ACCESS_AUD`; the user's email is the user id. Locally falls back to `DEV_USER_EMAIL`.
- **`src/services/storage.ts`** — Frontend API client (`api()` helper + `storage` object).
- **`src/services/ai.ts`** — Dutch prompts requesting structured JSON: `fetchWineInfo` and `getFoodPairing`. Calls go through `/api/ai`; the server picks OpenAI or Claude based on the user's setting.

### Database Tables (D1, schema in `migrations/`)

- `wines` — per-user wine records (`user_id` = email), incl. `price` and `price_estimated`
- `wine_locations` — per-user storage locations
- `user_settings` — per-user `ai_provider`

### Key Type: `Wine`

Defined in `src/types/wine.ts`. Fields split into:
- **User-provided:** `name`, `year`, `grapes`, `quantity`, `notes`, `rating`, `location`, `price` (per bottle, EUR)
- **Price lookup:** if no price is entered, `POST /api/wines/:id/price` lets Claude (Sonnet 5.5 + web search) find it; such prices get `priceEstimated: true`
- **AI-generated:** `country`, `region`, `type`, `bestBefore`, `tasteProfile`, `pairingAdvice`
- Wine `type` is one of: `'rood' | 'wit' | 'rosé' | 'bruisend'`

### UI Conventions

- All UI text, error messages, and OpenAI prompts are in **Dutch**
- iOS-style UI: large titles, grouped lists (`Group`/`Row`/`Section` in `src/components/ui.tsx`), bottom tab bar, line icons (`Icon` in `ui.tsx`), no emoji
- Tailwind CSS 4 with design tokens in `src/index.css` (`@theme`): `ground`, `surface`, `ink`, `muted`, `line`, `control`, one accent `wine` (#7F1D2D); wine types as dots/bars only: `type-rood`, `type-wit`, `type-rose`, `type-bruisend`
- Mobile-first with `safe-area-inset` padding for notched devices
- Drink-window helpers (`parseDrinkWindow`, `drinkStatus`) and price formatting live in `src/utils/wine.ts`
- `WineDetail` is a pushed screen: quantity, location, rating and notes save immediately; "Wijzig" edits the other fields
