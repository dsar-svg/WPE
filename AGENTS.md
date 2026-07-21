# AGENTS.md — Wallace Panda Express

**Idioma:** Responder siempre en español.

## Dev commands

```sh
npm install          # install deps
npm run dev          # vite dev server → http://localhost:5173
npm run build        # tsc && vite build → dist/ (public app)
npm run build:admin  # vite build --mode admin → dist-admin/ (admin PWA)
npm run build:pos    # vite build --mode pos → dist-pos/ (POS PWA)
npm run build:all    # tsc + all 3 builds (public + admin + POS)
npm run preview      # vite preview (serve dist/)
npm run lint         # eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 100
```

No test suite. Validate via browser + lint. TestSprite MCP wired in `opencode.jsonc`.

## Env vars (`.env.local`, not committed)

```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```
(Estas mismas variables hay que configurarlas en cada proyecto Vercel: Settings → Environment Variables)

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

## DB structure (`supabase/migrations/00000_full_schema.sql`)

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
- `scripts/`, `docs/`, `dist/` directories are gitignored.
- README mentions `GEMINI_API_KEY` (leftover from AI Studio template) — not used by this app. Ignore it.
- Orders `status` column is TEXT with CHECK constraint (`'exitoso'` / `'cancelado'`), not an enum.
- `PaymentMethod`, `change_amount`, `cashier_id` exist in TypeScript types but not in the DB schema — frontend-only for POS.

## Deployment

### 3 PWAs instalables (public + admin + POS)

Cada una tiene su propio `manifest.json` con nombre, iconos y scope independientes para instalación en escritorio/móvil:

| PWA | Dominio | Nombre de instalación | Manifest fuente |
|-----|---------|----------------------|-----------------|
| Público | `wallacepandaexpress.com` | Wallace Panda Express | `public/manifest.json` |
| Admin | `admin.wallacepandaexpress.com` | Admin - Wallace Panda Express | `public/manifest-admin.json` → renombrado a `manifest.json` |
| POS | `pos.wallacepandaexpress.com` | POS - Wallace Panda Express | `public/manifest-pos.json` → renombrado a `manifest.json` |

```sh
npm run build        # → dist/ (público, wallacepanda.com)
npm run build:admin  # → dist-admin/ (admin, admin.wallacepanda.com)
npm run build:pos    # → dist-pos/   (POS,   pos.wallacepanda.com)
npm run build:all    # los 3 en secuencia
```

Cada `dist-*/` incluye su propio `index.html` + `manifest.json` + `vercel.json` (SPA rewrites).

### Env vars (configurar en cada proyecto Vercel)

| Variable | Dónde obtener |
|----------|--------------|
| `VITE_SUPABASE_URL` | Supabase Dashboard → Project Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API → Anon Key |

### Primer deploy

1. Instalar Vercel CLI: `npm i -g vercel`
2. Crear 3 proyectos en vercel.com (o `vercel projects add`)
3. Asignar dominios:
   ```sh
   vercel domain add wallacepandaexpress.com --cwd dist
   vercel domain add admin.wallacepandaexpress.com pndaexpress-admin
   vercel domain add pos.wallacepandaexpress.com pndaexpress-pos
   ```
4. Configurar env vars en cada proyecto desde Vercel Dashboard → Settings → Environment Variables
5. `.\deploy-all.ps1` para build + deploy de los 3

### Deployment diario

```sh
.\deploy-all.ps1
```
El script vincula automáticamente los proyectos después del build y despliega los 3.

### Backend

Supabase. Migraciones via SQL Editor. Seeds en `supabase/seed.sql`.

## graphify

Knowledge graph at `graphify-out/`. Use for codebase questions first.
- `graphify query "<question>"` when `graphify-out/graph.json` exists
- `graphify path "<A>" "<B>"` for relationships
- `graphify explain "<concept>"` for focused concepts
- `graphify update .` after modifying code (AST-only, no API cost)
- If `graphify-out/wiki/index.md` exists, use for broad navigation
- Dirty graph files are expected after hooks — not a reason to skip
