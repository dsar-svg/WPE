# AGENTS.md — Wallace Panda Express

## Dev commands

```sh
npm install          # install deps
npm run dev          # vite dev server → http://localhost:5173
npm run build        # tsc && vite build → dist/
npm run preview      # vite preview (serve dist/)
npm run lint         # eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 100
```

No test suite. Validate via browser + lint. TestSprite MCP wired in `opencode.jsonc`.

## Env vars (`.env.local`, not committed)

```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```
Optional: `VITE_GRAPHOPPER_API_KEY` (road distance, falls back to OSRM → Haversine). Optional: `DISABLE_HMR=true` disables HMR (`vite.config.ts:19`).

## Backend: Supabase

Database, auth, file storage. Client: `src/lib/supabase.ts` via `@supabase/ssr`. Image upload: `src/lib/uploadImage.ts` — compresses to WebP → Supabase Storage bucket `images`.

Admin roles: `isSuperAdmin` (email === `dariomedina2619@gmail.com`) or `isLocalAdmin` (matches location's `adminEmail`). Admin checks are client-side via email — no granular RLS.

## Architecture

| Layer | Tech |
|-------|------|
| UI | React 19 + React Router v7 |
| Build | Vite 6 + TypeScript 5.8 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Backend | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (email/password) |
| Maps | Leaflet + react-leaflet + Nominatim geocoding |
| Data fetching | `@tanstack/react-query` (React Query v5) |
| Meta/SEO | `react-helmet-async` |
| Animations | `motion` (framer-motion v12) |
| Icons | `lucide-react` |

## Routes (`src/App.tsx`)

| Path | Component | Notes |
|------|-----------|-------|
| `/` | `LandingPage` | Marketing/home |
| `/menu` | `PublicMenuPage` | Full menu, no location needed |
| `/pedir` | `MainView` (inline) | Order flow, requires location selection |
| `/admin` | `AdminPage` (lazy) | CRUD + orders, requires auth |
| `/pos` | `PosPage` (lazy) | Point-of-sale, requires auth |
| `/legal` | `LegalPage` | Legal info |

Query param `?sede=<id>` or `?location=<id>` on `/pedir` auto-selects location.

## Key modules

- **Cart**: `src/context/CartContext.tsx` — `CartProvider` + `useCart()` hook. Items keyed by product ID + sorted choices. Choice-aware pricing.
- **I18n**: `src/context/LanguageContext.tsx` — `es`/`en`/`zh`, `t(key)` function, 777+ translation keys inline.
- **Data**: `src/context/RestaurantContext.tsx` — single provider wrapping app, uses React Query for Supabase fetches. Exposes locations, menu items, categories, config, orders, auth functions.
- **Checkout**: `src/utils.ts` — `generateWhatsAppLink()` → `wa.me` link.
- **Distance**: `src/lib/DistanceService.ts` via `src/hooks/useDistanceCalculation.ts` — 3-tier: GraphHopper → OSRM → Haversine. Also handles address autocomplete & GPS geolocation.
- **BCV rate**: `src/services/bcvRate.ts` — fetches Venezuelan bolívar exchange rate from `dolarapi.com`/`ve.dolarapi.com`, caches daily.
- **Image upload**: `src/lib/uploadImage.ts` — validates size (5MB max), compresses to WebP 800px, uploads to `images` bucket.

## DB structure (`supabase/migrations/00000_full_schema.sql`, also `00001_*` … `00004_*`)

| Table | Key columns | RLS |
|-------|-------------|-----|
| `config` | id=1 (singleton), name, logo, colors, social, tax_rate, delivery_fee, exchange_rate, distance_pricing (JSONB) | SELECT: public; UPSERT: authenticated |
| `categories` | id UUID, name UNIQUE, sort_order | SELECT: public; CRUD: authenticated |
| `menu_items` | id UUID, name, description, price, category FK→categories(name), image, in_stock, sort_order | SELECT: public; CRUD: authenticated |
| `locations` | id UUID, name, whatsapp, schedule, address, image, open_time, close_time, is_open, lat/lng, admin_email, discontinued_product_ids (TEXT[]) | SELECT: public; CRUD: authenticated |
| `orders` | id UUID, location_id FK, customer_name/phone, delivery_type CHECK('Delivery','Pick-up'), delivery_address, delivery_coordinates (JSONB), items (JSONB), subtotal, delivery_fee, total, notes, status, created_at | INSERT: anon+auth; SELECT: authenticated |
| `admins` | id UUID, email UNIQUE, user_id FK→auth.users | SELECT/INSERT: authenticated |

Realtime enabled on `orders` table.

## Gotchas

- `@/` path alias: in `vite.config.ts` resolves to `./src`, in `tsconfig.json` paths `@/*` → `./*` (root-relative). Behavior differs; rely on Vite's resolution at runtime.
- `@supabase/ssr` is used even though this is a client-side SPA (no SSR). Works fine — `createBrowserClient` ignores SSR middleware.
- `tsconfig.json` has `experimentalDecorators: true` and `useDefineForClassFields: false` — unusual for a React SPA, but present. Do not remove.
- Orders `status` column is TEXT with CHECK constraint (`'exitoso'` / `'cancelado'`), not an enum.
- `PaymentMethod`, `change_amount`, `cashier_id` exist in TypeScript types but not in the DB schema — frontend-only for POS.
- No formatter (Prettier) configured. ESLint is the only linter.
- `react-refresh/only-export-components: warn` in ESLint — component files must export a single component or use `allowConstantExport`.
- Service worker (`public/sw.js`) registered in `index.html:62-69`; registration failures are silently `console.log`'d, not thrown.
- `src/main.tsx` creates a `QueryClient` with `retry: 1` and `refetchOnWindowFocus: false` — writes new queries should match these defaults.
- `realtime` is enabled on the `orders` table — the subscription is in `RestaurantContext.tsx`.
- `scripts/`, `docs/`, `dist/`, `testsprite_tests/`, `.impeccable/`, `graphify-out/` are gitignored. Seed scripts: `supabase/seed.sql`, `supabase/seed_choices.sql`, `supabase/seed_images.sql`.

## Deployment

- Frontend: `npm run build` → `dist/`, deploy anywhere (Vercel SPA rewrite config in `vercel.json`)
- Backend: Supabase manages itself; run migrations via Supabase SQL Editor

## graphify

Knowledge graph at `graphify-out/`. Use for codebase questions first.
- `graphify query "<question>"` when `graphify-out/graph.json` exists
- `graphify path "<A>" "<B>"` for relationships
- `graphify explain "<concept>"` for focused concepts
- `graphify update .` after modifying code (AST-only, no API cost)
- If `graphify-out/wiki/index.md` exists, use for broad navigation
- Dirty graph files are expected after hooks — not a reason to skip
