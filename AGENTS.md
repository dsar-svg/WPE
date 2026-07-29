# AGENTS.md — Wallace Panda Express

**Idioma:** Responder siempre en español.

## Dev commands

```sh
npm install                      # install deps
npm run dev                      # vite dev server → localhost:5173
npm run build                    # tsc + vite → dist/ (public)
npm run build:admin              # vite --mode admin → dist-admin/
npm run build:pos                # vite --mode pos → dist-pos/
npm run build:all                # tsc + all 3 builds in sequence
npm run lint                     # eslint . --ext ts,tsx
npm run preview                  # vite preview (serve dist/)
```

No test suite. Validate via browser + lint. MCP: TestSprite (in `opencode.jsonc`).

## Env vars (`.env.local`, not committed)

```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

Set in each Vercel project too (Settings → Environment Variables).

## Three PWAs, multi-build architecture

Single codebase with 3 Vite entry points, selected via `--mode` flag. Each PWA has its own entry HTML, `main-*.tsx`, `manifest.json`, and Vercel config. The shared `App.tsx` receives an `appMode` prop to filter routes.

| PWA | HTML entry | Main entry | `appMode` | Output dir | Domain |
|-----|-----------|------------|-----------|------------|--------|
| Public | `index.html` | `src/main.tsx` | `public` | `dist/` | wallacepandaexpress.com |
| Admin | `admin.html` | `src/main-admin.tsx` | `admin` | `dist-admin/` | admin.wallacepandaexpress.com |
| POS | `pos.html` | `src/main-pos.tsx` | `pos` | `dist-pos/` | pos.wallacepandaexpress.com |

Build scripts copy `admin.html`/`pos.html` → `index.html`, rename manifests, and copy `vercel-*.json` into each `dist-*/` for Vercel SPA rewrites.

Stack: React 19 / React Router v7 / Vite 6 / TypeScript 5.8 / Tailwind CSS v4 (`@tailwindcss/vite`) / Supabase / React Query v5 / Leaflet + react-leaflet / motion (framer-motion v12) / lucide-react / react-helmet-async.

## Routes (`src/App.tsx`, filtered by `appMode`)

| Path | Component | Available in |
|------|-----------|-------------|
| `/` | `LandingPage` | public only |
| `/menu` | `PublicMenuPage` | public only |
| `/pedir` | `MainView` (inline) | public only. `?sede=<id>` or `?location=<id>` auto-selects location |
| `/admin` | `AdminPage` (lazy) | admin |
| `/pos` | `PosPage` (lazy) | admin + pos |
| `/legal` | `LegalPage` | public only |

## Key modules

- **Cart** (`src/context/CartContext.tsx`): Items keyed by product ID + sorted choices (choice-aware pricing).
- **I18n** (`src/context/LanguageContext.tsx`): `es`/`en`/`zh`, 777+ keys inline, `t(key)` function.
- **Data** (`src/context/RestaurantContext.tsx`): Wraps app; React Query → Supabase. Exposes locations, menu, categories, config, orders, auth.
- **Distance** (`src/lib/DistanceService.ts` / `src/hooks/useDistanceCalculation.ts`): 3-tier fallback — OSRM mirrors → Valhalla → Haversine. Handles address autocomplete + GPS.
- **BCV rate** (`src/services/bcvRate.ts`): Fetches VES from dolarapi.com/ve.dolarapi.com, daily localStorage cache.
- **Image upload** (`src/lib/uploadImage.ts`): Validates 5MB max, compresses to WebP 800px, uploads to `images` Supabase bucket.
- **Auth**: Supabase Auth (email/password) for admins; 4-digit PIN hash (`src/lib/hashPin.ts`) for POS cashiers. RLS allows anon on `orders`, `cortes`, `admins` (needed by POS).

## DB schema

Migrations: `supabase/migrations/` (00000_full_schema.sql + incremental). Seeds: `supabase/seed.sql`. Realtime enabled on `orders`. Admin roles: `admins` table with `role` (`super_admin`/`location_admin`/`cashier`).

## Gotchas

- **Service worker versioning**: `scripts/version-sw.cjs` (presw) stamps `public/sw.js` with timestamp; `scripts/restore-sw.cjs` (postbuild) restores original. Called automatically during builds.
- **`@/` path alias**: Vite resolves `@/` → `./src`, tsconfig `paths` resolves `@/*` → `./*` (root-relative). Rely on Vite at runtime.
- **`@supabase/ssr`** used despite client-only SPA. Works — `createBrowserClient` ignores SSR middleware.
- **Orders `status`**: TEXT with CHECK (`'pendiente'`/`'exitoso'`/`'cancelado'`), not enum.
- **Orders `payment_method`**: TEXT with CHECK (`'Efectivo'`/`'Tarjeta'`/`'Transferencia'`/`'QR'`/`'PagoMóvil'`/`'Otro'`).
- **`tsconfig.json`**: `useDefineForClassFields: false`, `experimentalDecorators: true`.
- **`scripts/`, `docs/`, `dist*/`, `graphify-out/`** gitignored.

## Deployment

```sh
.\deploy-all.ps1       # builds all 3, links Vercel projects, deploys to prod
```

Requires Vercel CLI installed. Vercel projects: `wallace-panda-expres`, `pndaexpress-admin`, `pndaexpress-pos`. Each `dist-*/` includes SPA rewrite config in its `vercel.json`.

Supabase migrations applied via SQL Editor (not automated in CI).

## graphify

Knowledge graph at `graphify-out/`. Use for codebase questions first.
- `graphify query "<question>"` when `graphify-out/graph.json` exists
- `graphify path "<A>" "<B>"` for relationships
- `graphify explain "<concept>"` for focused concepts
- `graphify update .` after modifying code (AST-only, no API cost)
- If `graphify-out/wiki/index.md` exists, use for broad navigation
- Dirty graph files are expected after hooks — not a reason to skip
