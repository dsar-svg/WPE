# AGENTS.md — Wallace Panda Express

## Dev commands

```sh
npm install          # install deps
npm run dev          # vite dev server → http://localhost:5173
npm run build        # tsc && vite build → dist/
npm run preview      # vite preview (serve dist/)
npm run lint         # eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
```

No test suite configured. Validate via browser + lint. TestSprite MCP is wired in `opencode.jsonc`.

## Backend: Supabase

This app uses **Supabase** for everything — database, auth, file storage.

- **Schema**: `supabase/migrations/00000_full_schema.sql` — 6 tables (config, categories, menu_items, locations, orders, admins)
- **Seed**: `supabase/seed.sql` — run after migration
- **Auth**: Supabase Auth (email/password) via `@supabase/ssr`
- **Client**: `src/lib/supabase.ts` — `createBrowserClient`
- **Image upload**: `src/lib/uploadImage.ts` — compresses to WebP, uploads to Supabase Storage bucket `images`
- **Admin roles**: `isSuperAdmin` (email === `dariomedina2619@gmail.com`) or `isLocalAdmin` (matches location's `adminEmail`)

All data flows through `src/context/RestaurantContext.tsx` — the single provider wrapping the app.

## Required env vars (`.env.local`, not committed)

```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

Optional: `VITE_GRAPHOPPER_API_KEY` (road distance, falls back to OSRM → Haversine).

## Architecture

| Layer | Tech |
|-------|------|
| UI | React 19 + React Router v7 |
| Build | Vite 6 + TypeScript 5.8 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Backend | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (email/password) |
| Maps | Leaflet + react-leaflet + Nominatim geocoding |
| Storage | Supabase Storage (bucket: `images`) |
| Animations | `motion` (framer-motion v12) |
| Icons | `lucide-react` |

## Routes (`src/App.tsx`)

| Path | Component | Notes |
|------|-----------|-------|
| `/` | `LandingPage` | Marketing/home |
| `/menu` | `PublicMenuPage` | Full menu without location |
| `/pedir` | `MainView` (inline) | Order flow, requires location selection |
| `/admin` | `AdminPage` | CRUD + orders, requires auth |

Query param `?sede=<id>` or `?location=<id>` on `/pedir` auto-selects location.

## Key modules

- **Cart**: `src/hooks/useCart.ts` — add, remove, update qty/notes, clear
- **I18n**: `src/context/LanguageContext.tsx` — `es`/`en`/`zh`, translation function `t(key)`
- **Checkout**: generates WhatsApp link via `generateWhatsAppLink()` in `src/utils.ts`
- **Distance**: `src/services/DistanceService.ts` — 3-tier: GraphHopper → OSRM → Haversine
- **Image upload**: `src/lib/uploadImage.ts` — compresses to WebP, uploads to Supabase Storage bucket `images`

## Admin auth flow

1. User enters email + password in `/admin`
2. First visit: use "Registrarse" (sign up) to create account
3. Session managed by Supabase Auth; `userEmail` derived from `session.user.email`
4. Super admin: `dariomedina2619@gmail.com` — full access
5. Location admin: email stored in location's `adminEmail` — limited to that location

## DB structure (`supabase/migrations/00000_full_schema.sql`)

| Table | Columns | RLS |
|-------|---------|-----|
| `config` | Singleton (id=1), name, logo, colors, social, tax, delivery, distance | SELECT: public; UPSERT: authenticated |
| `categories` | id UUID, name UNIQUE, sort_order | SELECT: public; CRUD: authenticated |
| `menu_items` | id UUID, name, price, category FK→categories(name), sort_order | SELECT: public; CRUD: authenticated |
| `locations` | id UUID, name, address, coords, admin_email, schedule | SELECT: public; CRUD: authenticated |
| `orders` | id UUID, location_id FK→locations, customer info, items JSONB, totals | SELECT: authenticated; INSERT: anon+auth |
| `admins` | id UUID, email UNIQUE, user_id FK→auth.users | SELECT/INSERT: authenticated |

RLS policies are permissive (auth-only for writes). No granular role-based RLS — admin checks are client-side via email.

## Deployment

- Frontend: `npm run build` → `dist/`, deploy anywhere (Vercel SPA config in `vercel.json`)
- Backend: Supabase manages itself; run migrations via Supabase SQL Editor

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, invoke the `skill` tool with `skill: "graphify"` before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
