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
- **Checkout público** (`src/components/ui/CartDrawer.tsx`): solo Delivery (`deliveryType` fijo). **Único método de pago: Pago Móvil** (Efectivo eliminado; referencia obligatoria). Se guarda como `payment_method = 'PagoMóvil'`.
- **POS: ventas en espera** (`src/pages/PosPage.tsx`, `PausedSalesModal`): botón **Pausar** junto a Cobrar guarda la venta en curso (carrito, cliente, tipo, pedido web cargado) y limpia la caja; **En espera (N)** en el header lista las pausadas para retomar o eliminar. Al retomar con otra venta abierta, esa se pausa sola. Se guardan en `localStorage` por sede (`pos_paused_sales_<locationId>`), solo en ese navegador (no en Supabase). Al retomar se refrescan productos con el menú actual y, si era pedido web, se verifica que siga `pendiente`.
- **POS: descuento** (`PaymentModal` en `src/pages/PosPage.tsx`): input "Descuento (%)" al cobrar, aplica solo sobre productos (no delivery). Sin columna en BD: se guarda `orders.total` ya descontado y `subtotal` sin descuento; el descuento se deriva como `subtotal + delivery_fee - total` (usado al reimprimir). Factura imprime línea DESCUENTO.
- **Mapa** (`src/components/ui/MapComponent.tsx`): Leaflet + capa vectorial **OpenFreeMap** vía MapLibre (`maplibre-gl` + `@maplibre/maplibre-gl-leaflet`, carga diferida), estilos `dark`/`positron`, sin API key. Respaldo automático a **Esri Canvas** raster si no hay WebGL, falla la carga o tarda >8s. No usar CARTO (exige API key, muestra marca de agua "API KEY REQUIRED") ni tile.openstreetmap.org (bloquea apps). Las direcciones (autocompletado/reverse geocode) vienen de Nominatim/Photon en `DistanceService`, no del mapa.
- **BCV rate** (`src/services/bcvRate.ts`): Fetches VES from dolarapi.com/ve.dolarapi.com, daily localStorage cache.
- **Image upload** (`src/lib/uploadImage.ts`): Validates 5MB max, compresses to WebP 800px, uploads to `images` Supabase bucket.
- **Auth**: Supabase Auth (email/password) for admins; escrituras del admin solo si `is_staff()` (email confirmado + rol `super_admin`/`location_admin`). POS: PIN de 4 dígitos → RPC `pos_login` devuelve un token (`pos_sessions`, 16 h) guardado en `cashier.token`. La clave anon **no** puede leer `admins`/`customers` ni escribir `orders` (salvo pedido web `pendiente`), `order_payments`, `cortes` o `invoice_counters` (migración 00022).
- **POS: cobro y corte por RPC**: `pos_cobrar` asigna el número de factura atómico (si falla no consume número), guarda `paid_at`, `exchange_rate`, vuelto y su moneda (`change_currency`). `pos_corte` calcula el corte en el servidor con los pedidos `corte_id IS NULL` de la cajera, guarda el conteo ciego (`counted_*`) y marca los pedidos con `corte_id`. Arqueo/diferencias: `src/lib/corte.ts`.

## DB schema

Migrations: `supabase/migrations/` (00000_full_schema.sql + incremental). Seeds: `supabase/seed.sql`. Realtime enabled on `orders`. Admin roles: `admins` table with `role` (`super_admin`/`location_admin`/`cashier`).

## Gotchas

- **Service worker versioning**: `scripts/version-sw.cjs` (presw) stamps `public/sw.js` with timestamp; `scripts/restore-sw.cjs` (postbuild) restores original. Called automatically during builds.
- **`@/` path alias**: Vite resolves `@/` → `./src`, tsconfig `paths` resolves `@/*` → `./*` (root-relative). Rely on Vite at runtime.
- **`@supabase/ssr`** used despite client-only SPA. Works — `createBrowserClient` ignores SSR middleware.
- **Orders `status`**: TEXT with CHECK (`'pendiente'`/`'exitoso'`/`'cancelado'`), not enum.
- **Orders `payment_method`**: TEXT with CHECK (`'Efectivo'`/`'Tarjeta'`/`'Transferencia'`/`'QR'`/`'PagoMóvil'`/`'Otro'`).
- **MapLibre worker**: `vite.config.ts` usa `worker.format: 'es'` y `MapComponent` hace `setWorkerUrl()` con `maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url`. Sin esto el mapa vectorial falla con "Worker failed to load" y cae al respaldo Esri.
- **`tsconfig.json`**: `useDefineForClassFields: false`, `experimentalDecorators: true`.
- **`scripts/`, `docs/`, `dist*/`, `graphify-out/`** gitignored.

## Deployment

```sh
.\deploy-all.ps1       # builds all 3, links Vercel projects, deploys to prod
```

Requires Vercel CLI installed. Vercel projects: `wallace-panda-expres`, `pndaexpress-admin`, `pndaexpress-pos`. Each `dist-*/` includes SPA rewrite config in its `vercel.json`.

**Deploy solo de la app pública** (lo usado en la práctica): desde la raíz, `vercel link --yes --project wallace-panda-expres` y `vercel deploy --prod --yes` (build remoto en Vercel con sus env vars). El push a GitHub solo genera deploys **Preview** (ninguna rama está configurada como producción), y las Preview piden login de Vercel. Variables locales: `vercel env pull .env.local --environment=production`.

Supabase migrations applied via SQL Editor (not automated in CI).

## graphify

Knowledge graph at `graphify-out/`. Use for codebase questions first.
- `graphify query "<question>"` when `graphify-out/graph.json` exists
- `graphify path "<A>" "<B>"` for relationships
- `graphify explain "<concept>"` for focused concepts
- `graphify update .` after modifying code (AST-only, no API cost)
- If `graphify-out/wiki/index.md` exists, use for broad navigation
- Dirty graph files are expected after hooks — not a reason to skip
