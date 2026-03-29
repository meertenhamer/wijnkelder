# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server with HMR
npm run build      # TypeScript compile + Vite production build
npm run lint       # Run ESLint
npm run preview    # Preview production build locally
```

## Architecture

**Wijnkelder** is a Dutch-language wine cellar management SPA built with React + TypeScript + Vite, using Supabase for auth/storage and OpenAI (gpt-4o-mini) for wine metadata enrichment.

### State & Routing

There is no router library. `App.tsx` manages all navigation via a `page` state string (`'home' | 'new' | 'cellar' | 'search' | 'pairing'`) and conditionally renders the corresponding component. `App.tsx` also owns the top-level `wines: Wine[]` state and passes down callbacks (`onSave`, `onUpdate`, `onDelete`) to child components.

### Data Flow

Wine data flows top-down from `App.tsx`. When a component modifies data it calls a callback, which updates both Supabase and the React state in the parent. Components do not interact with each other directly.

**Adding a wine:** `NewWineForm` collects user input → calls `fetchWineInfo()` (OpenAI) to get AI-enriched metadata → calls `storage.saveWine()` → fires `onSave(wine)` callback back to `App.tsx`.

**Food pairing:** `FoodPairing` sends the user's dish text + their in-stock wines to `getFoodPairing()` (OpenAI), which returns ranked recommendations referencing wines by index in the submitted list.

### Services

- **`src/services/supabase.ts`** — Supabase client initialization (public anon key, standard for client-side RLS-protected apps)
- **`src/services/storage.ts`** — All Supabase DB operations. Handles snake_case (DB) ↔ camelCase (app) field conversion. Manages OpenAI API key persistence (Supabase `user_settings` table, with localStorage fallback migration).
- **`src/services/openai.ts`** — OpenAI gpt-4o-mini calls. All prompts are in Dutch and request structured JSON. Three functions: `fetchWineInfo`, `getWineInfo` (Dutch field names), `getFoodPairing`.

### Database Tables

- `wines` — per-user wine records
- `user_settings` — stores user's OpenAI API key (`openai_api_key` column)

### Key Type: `Wine`

Defined in `src/types/wine.ts`. Fields split into:
- **User-provided:** `name`, `year`, `grapes`, `quantity`, `notes`, `rating`
- **AI-generated:** `country`, `region`, `type`, `bestBefore`, `tasteProfile`, `pairingAdvice`
- Wine `type` is one of: `'rood' | 'wit' | 'rosé' | 'bruisend'`

### UI Conventions

- All UI text, error messages, and OpenAI prompts are in **Dutch**
- Styling uses Tailwind CSS 4 with a stone/warm palette; wine type colors: rood=`red-800`, wit=`amber-500`, rosé=`pink-400`, bruisend=`amber-300`
- Mobile-first with `safe-area-inset` padding for notched devices
- `WineCard` is a modal (fixed overlay) that doubles as both detail view and inline editor
