# NOCTURNE — Changelog de Identidad Visual

## Concepto de Diseño

**"NOCTURNE"** — Estética premium de comida callejera nocturna. Dominancia negra absoluta con acentos rojo y amarillo, inspirada en mercados nocturnos urbanos con neón. Alto contraste, tipografía bold, atmósfera inmersiva.

---

## Paleta de Colores

| Token | Antes | Después | Uso |
|-------|-------|---------|-----|
| `noir` | `#FFFFFF` | `#050505` | Fondo principal |
| `noir-light` | `#F9FAFB` | `#0A0A0A` | Fondo alternativo |
| `surface` | `#F4F4F5` | `#0E0E0E` | Tarjetas, paneles |
| `surface-raised` | `#FFFFFF` | `#141414` | Elementos elevados |
| `surface-hover` | `#E4E4E7` | `#1A1A1A` | Hover states |
| `border-dark` | `#E4E4E7` | `#1E1E1E` | Bordes (casi invisibles) |
| `border-subtle` | — | `#161616` | Bordes sutiles |
| `brand-red` | `#CB2027` | `#DC2626` | Rojo primario |
| `brand-red-deep` | — | `#B91C1C` | Rojo oscuro |
| `brand-red-glow` | — | `#EF4444` | Rojo brillante |
| `brand-yellow` | `#FFC400` | `#FACC15` | Amarillo acento |
| `brand-amber` | — | `#F59E0B` | Ámbar |
| `text-primary` | `#18181B` | `#F0F0F0` | Texto principal |
| `text-secondary` | `#52525B` | `#8A8A8E` | Texto secundario |
| `text-muted` | `#A1A1AA` | `#555555` | Texto apagado |

---

## Tipografía

| Uso | Antes | Después |
|-----|-------|---------|
| Display / Headlines | Helvetica Neue | **Oswald** (Google Fonts) |
| Body / UI | Helvetica Neue | **DM Sans** (Google Fonts) |

Se agregaron en `index.html`:
```html
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap" rel="stylesheet" />
```

---

## Archivos Modificados

### `index.html`
- `theme-color` meta: `#f97316` → `#0A0A0A`
- Google Fonts agregados (Oswald + DM Sans)

### `public/manifest.json`
- `background_color`: `#000000` → `#0A0A0A`
- `theme_color`: `#d92323` → `#DC2626`

### `src/index.css` — Sistema de Diseño completo
- **Fondo body**: Gradiente radial con rojo/amarillo sutil + vignette oscuro
- **Noise overlay**: SVG fractalNoise al 4% opacidad sobre todo el body
- **Scrollbar**: Personalizada oscura (`#0A0A0A` track, `#1E1E1E` thumb)
- **Nuevas utilidades CSS**:
  - `.gradient-fire` — degradado rojo → ámbar
  - `.gradient-night` — degradado noir → surface
  - `.glow-red` / `.glow-red-sm` — sombra luminosa roja
  - `.glow-yellow` / `.glow-yellow-sm` — sombra luminosa amarilla
  - `.text-glow-red` / `.text-glow-yellow` — text-shadow luminoso
  - `.border-glow-red` / `.border-glow-yellow` — borde luminoso
  - `.stripe-accent` — rayas diagonales rojas sutiles
  - `.stripe-accent-yellow` — rayas diagonales amarillas sutiles
  - `.clip-diagonal` / `.clip-diagonal-reverse` — recortes diagonales
  - `.animate-pulse-glow` — pulso de glow rojo
  - `.animate-float` — flotación suave
  - `.animate-marquee` — scroll infinito

### `src/pages/LandingPage.tsx`
- **Hero**: Fondo noir puro, glow rojo masivo (`blur-[150px]`), vignette gradient, diagonal red accent, text-glow en título
- **About**: Fondo `bg-noir` explícito
- **Featured**: Fondo `bg-surface` con `border-y border-border-dark`, rayas amarillas sutiles
- **Locations**: Fondo noir, overlay de imagen más denso (`via-noir/60`)
- **Reviews**: Fondo `bg-surface` con `border-y border-border-dark`
- **Socials**: Fondo noir con `bg-brand-red/3`
- **CTA**: Fondo `bg-surface` con `border-t border-border-dark`
- **Navegación**: `bg-noir/95` con `backdrop-blur-2xl`
- **Botones**: `glow-red-sm` en CTAs, bordes `border-border-dark`
- **Tipografía**: `font-display` (Oswald) en todos los headings

### `src/pages/PublicMenuPage.tsx`
- Header: `bg-surface` (ahora `#0E0E0E`)
- Category tabs: fondo `bg-noir/95`
- Footer: `bg-surface` con borde oscuro
- Cards: `bg-surface` con `border-border-dark`
- Empty states: `bg-surface` con iconos apagados

### `src/pages/AdminPage.tsx`
- Login: fondo `bg-noir`, card `bg-surface`, inputs `bg-surface-raised`
- Dashboard: fondo `bg-noir`, nav `bg-surface/90`
- Tabs: `bg-brand-red` activo con `glow-red-sm`, inactivo `bg-surface`
- Cards de sedes: `bg-surface` con `border-border-dark`
- Cards de productos: `bg-surface` con `border-border-dark`
- Modales (LocationForm, CategoryModal, SettingsModal, ProductForm):
  - Fondo `bg-surface`, borders `border-border-dark`
  - Inputs: `bg-surface-raised` con `focus:border-brand-red`
  - Botones primarios: `bg-brand-red` con `glow-red-sm`
  - Botones secundarios: `bg-surface-raised` con borde

### `src/components/WelcomeScreen.tsx`
- Fondo: `bg-noir` con rayas diagonales sutiles
- Logo: glow rojo más intenso
- Tarjetas de ubicación: `bg-surface` con `border-border-dark`
- Badges de estado: `bg-open-green` / `bg-surface` + borde
- Flecha: `bg-surface-raised` → `bg-brand-red` en hover

### `src/components/MenuView.tsx`
- Header: `bg-surface` con rayas diagonales
- Categories: `bg-brand-red` activo, `bg-surface` inactivo
- Product cards: `bg-surface` con `border-border-dark`
- Botón add: `bg-brand-red` con `glow-red-sm`
- Cart FAB: `bg-brand-red` con `glow-red` intenso

### `src/components/CartDrawer.tsx`
- Drawer: `bg-noir` con `border-t border-border-dark`
- Header: `bg-surface` con rayas diagonales
- Items: `bg-surface` con `border-border-dark`
- Quantity controls: `bg-surface-raised` con borde
- Footer: `bg-surface` con `border-t border-border-dark`
- Total box: `bg-surface-raised` con glow rojo sutil
- Checkout buttons: `bg-brand-red` con `glow-red`

### `src/components/ProductModal.tsx`
- Modal: `bg-surface` con `border-border-dark`
- Close button: `bg-noir/80` con borde
- Badge: `text-brand-yellow` con italic
- Accent bar: `bg-brand-red`
- Price: `text-brand-red` con `font-display`

### `src/components/LocationModal.tsx`
- Modal: `bg-surface` con `border-border-dark`
- Header image overlay: `from-noir via-noir/40`
- Info boxes: `bg-surface-raised` con `border-border-dark`
- Bottom accent: gradiente `from-brand-red via-brand-yellow to-brand-red`
- Buttons: dark outlined / `bg-brand-red` con glow

### `src/components/LanguageToggle.tsx`
- Dropdown: `bg-surface` con `border-border-dark`
- Active item: `bg-brand-red`
- Button: `bg-surface` con `border-border-dark`
- Tipografía: `font-display` para labels

### `src/components/PWAInstallPrompt.tsx`
- Banner: `bg-surface` con `border-border-dark`
- Accent bar: `w-1 bg-brand-red`
- Icon container: `bg-surface-raised` con borde
- Install button: `bg-brand-red` con `glow-red-sm`
- Tipografía: `font-display`

---

## Bugs Corregidos

- **`RestaurantContext.tsx`**: Código duplicado del bloque de auth (líneas 195-205) que usaba `adminData` fuera de scope. Eliminado el bloque duplicado.

---

## Pasada 3 — Mayor presencia de Rojo/Amarillo

### Cambios en `src/index.css`
- **Section tints**: `bg-red-tint` / `bg-red-tint-bottom` / `bg-yellow-tint` — gradientes radiales sutiles (5-6% opacidad)
- **Brand dividers**: `brand-divider` / `brand-divider-thick` — líneas degradadas rojo→amarillo→rojo
- **Glows ampliados**: `glow-red` de 40px a 60px blur, `glow-yellow` similar
- **Stripe intensificados**: Opacidad subida a 40% en Hero
- **Body gradient**: Más presencia de rojo/amarillo en el gradiente base

### Cambios en `src/pages/LandingPage.tsx`
- Hero: glows más grandes (1000px, 180px blur), diagonal accent, brand-divider-thick
- About: `bg-red-tint` + brand dividers
- Featured: `bg-red-tint` + `bg-yellow-tint`, glows más fuertes (96px blur)
- Locations: `bg-red-tint-bottom`
- Reviews: `bg-yellow-tint` + `bg-red-tint`
- Socials: `bg-red-tint`
- CTA: gradiente de marca más intenso

### Cambios en `src/components/WelcomeScreen.tsx`
- Glows más fuertes (120px blur, 12% opacidad rojo)
- `border-brand-red/20` → `hover:border-brand-red/70` en cards
- Badge "Abierto": de `bg-open-green` a `bg-brand-red` con glow
- `text-glow-red` en nombres de ubicación
- `brand-divider-thick` en hero

### Cambios en `src/components/MenuView.tsx`
- Header: `border-brand-red/20`, glows más fuertes
- Logo container: `border-brand-red/30` + `glow-red-sm`
- Categorías: pill inactive con `text-brand-yellow/80` + `hover:text-brand-yellow`
- Cards: `border-brand-red/15` → `hover:border-brand-red/60` + `hover:glow-red-sm`
- `text-glow-red` en nombres de producto

### Cambios en `src/pages/PublicMenuPage.tsx`
- Header: `border-brand-red/20`, glows más grandes (80px blur)
- Home link: `border-brand-red/30` → `hover:border-brand-red`
- `text-glow-red` en título
- Categorías: pill inactive con `text-brand-yellow/80`
- Cards: `border-brand-red/15` → `hover:border-brand-red/60` + `hover:glow-red-sm`
- Tags de categoría: `bg-brand-red/10` + `border-brand-red/30`
- Footer: `border-brand-red/20`, logo con `glow-red-sm`

---

## Efectos Visuales Clave

1. **Noise texture** — SVG fractalNoise sobre todo el body para textura de grano
2. **Colored glows** — Sombras luminosas rojas y amarillas en botones y elementos clave
3. **Diagonal stripes** — Rayas a 45° sutiles para textura de fondo
4. **Gradient vignette** — Oscurecimiento radial desde los bordes
5. **Ambient light** — Glow difuso grande en el hero (rojo top-center, amarillo bottom-right)
6. **Text glow** — Sombra de texto luminosa en headings del hero
7. **Border minimalismo** — Bordes casi invisibles (`#1E1E1E`) que solo se ven al hover
8. **Section tints** — Gradientes radiales sutiles (rojo/amarillo) en secciones para dar profundidad de marca
9. **Brand dividers** — Líneas degradadas rojo→amarillo→rojo como separadores de marca
10. **Stronger glows** — Glows ampliados (60px blur) con mayor opacidad para presencia de marca
