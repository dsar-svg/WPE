# Plan de Testing — Wallace Panda Express PWA

**Total: 307 casos de prueba**

---

## 1. LANDING PAGE (`/`) — 31 tests

### 1.1 Navbar
- **T-1.1.1** Sticky navbar visible on scroll
- **T-1.1.2** Logo y nombre del restaurante se renderizan
- **T-1.1.3** Link "Menu" navega a `/menu`
- **T-1.1.4** Links de sección (About, Featured, Locations, Reviews, Socials) hacen scroll suave
- **T-1.1.5** Indicador de sección activa se actualiza al hacer scroll (IntersectionObserver)
- **T-1.1.6** Botón "Pedir Ahora" navega a `/pedir`
- **T-1.1.7** Toggle de idioma abre dropdown con 3 opciones (es/en/zh)
- **T-1.1.8** Menú hamburguesa en móvil abre/cierra sidebar
- **T-1.1.9** Click en logo hace scroll al tope

### 1.2 Hero
- **T-1.2.1** Nombre renderiza "Panda" en color primario, "Express" en secundario
- **T-1.2.2** Tagline traducido se muestra
- **T-1.2.3** Botón CTA navega a `/pedir`
- **T-1.2.4** Logo tiene animación flotante
- **T-1.2.5** Icono fallback (Utensils) cuando no hay logo

### 1.3 About
- **T-1.3.1** Texto "Sobre Nosotros" se renderiza
- **T-1.3.2** Animación fade-in al hacer scroll

### 1.4 Featured Dishes
- **T-1.4.1** Muestra hasta 3 platos destacados
- **T-1.4.2** Fallback a primeros 3 items si no hay destacados
- **T-1.4.3** IDs de productos eliminados se filtran
- **T-1.4.4** Click abre ProductModal con detalles
- **T-1.4.5** "Ver todo el menú" navega a `/menu`
- **T-1.4.6** Precios con 2 decimales

### 1.5 Locations Carousel
- **T-1.5.1** Todas las sedes en carousel horizontal
- **T-1.5.2** Botones izquierda/derecha navegan entre sedes
- **T-1.5.3** Cada tarjeta muestra imagen, nombre, dirección, horario, estado
- **T-1.5.4** Badge verde "Abierto Ahora" / gris "Cerrado"
- **T-1.5.5** Click abre LocationModal
- **T-1.5.6** Animación spring al cambiar índice

### 1.6 Reviews
- **T-1.6.1** 8 tarjetas de reseñas en marquee
- **T-1.6.2** Marquee pausa al hover del mouse
- **T-1.6.3** Marquee reanuda al salir el mouse
- **T-1.6.4** IntersectionObserver pausa marquee fuera de pantalla

### 1.7 Social Media
- **T-1.7.1** Links de redes sociales configuradas se renderizan
- **T-1.7.2** URLs vacías no se renderizan
- **T-1.7.3** Links abren en nueva pestaña

### 1.8 PWA Install
- **T-1.8.1** Muestra después de 1.5s en móvil cuando no está instalada
- **T-1.8.2** Botón dismiss guarda en sessionStorage
- **T-1.8.3** Botón "Instalar" activa prompt nativo

---

## 2. PUBLIC MENU (`/menu`) — 17 tests

### 2.1 Header
- **T-2.1.1** Flecha "Inicio" navega a `/`
- **T-2.1.2** Título del menú se renderiza
- **T-2.1.3** "Pedir Ahora" navega a `/pedir`

### 2.2 Category Tabs
- **T-2.2.1** Categorías como tabs scrollables horizontalmente
- **T-2.2.2** Primera categoría activa por defecto
- **T-2.2.3** Click filtra la grilla de productos
- **T-2.2.4** Tab activo tiene gradiente, inactivos sutiles
- **T-2.2.5** Cambiar categoría resetea paginación

### 2.3 Product Grid
- **T-2.3.1** Productos filtrados por categoría activa
- **T-2.3.2** Cada tarjeta: imagen, nombre, descripción, precio, badge categoría, estado stock
- **T-2.3.3** Sin stock: badge "Agotado" y indicador rojo
- **T-2.3.4** Click abre ProductModal (solo vista)
- **T-2.3.5** Quick-order icon lleva a `/pedir` con `preAddProduct`
- **T-2.3.6** Grid: 1 col móvil, 2 tablet, 3 desktop

### 2.4 Empty State
- **T-2.4.1** Sin productos: "No hay productos aquí"

### 2.5 Pagination
- **T-2.5.1** Muestra cuando hay > 12 productos
- **T-2.5.2** Botones prev/next deshabilitados en extremos
- **T-2.5.3** Números de página navegan correctamente

---

## 3. ORDER FLOW (`/pedir`) — 28 tests

### 3.1 Location Selection
- **T-3.1.1** Muestra cuando no hay sede seleccionada
- **T-3.1.2** Logo y nombre del restaurante centrados
- **T-3.1.3** "Selecciona tu sede favorita" se muestra
- **T-3.1.4** Sedes como tarjetas con imagen, nombre, dirección, horario, estado
- **T-3.1.5** Sedes abiertas son clickeables
- **T-3.1.6** Sedes cerradas muestran toast de aviso
- **T-3.1.7** Toast auto-dismiss después de 3s
- **T-3.1.8** Link a `/admin`
- **T-3.1.9** Link "Inicio" navega a `/`
- **T-3.1.10** Empty state: "No hay sedes disponibles"

### 3.2 Auto-Selection
- **T-3.2.1** `?sede=<id>` auto-selecciona sede
- **T-3.2.2** `?location=<id>` auto-selecciona sede
- **T-3.2.3** ID inválido no selecciona nada

### 3.3 Pre-Add Product
- **T-3.3.1** Navegación desde menú público con `preAddProduct` agrega al carrito

### 3.4 Menu View
- **T-3.4.1** Botón atrás deselecciona sede y limpia carrito
- **T-3.4.2** Nombre de sede en header (traducido)
- **T-3.4.3** Tabs de categorías funcionan
- **T-3.4.4** Productos filtrados con paginación
- **T-3.4.5** Tarjetas: imagen, nombre, descripción, precio, estado
- **T-3.4.6** Sin stock: botón deshabilitado + overlay
- **T-3.4.7** Click abre ProductModal con `onAddToCart`
- **T-3.4.8** Botón agregar muestra check verde 1.5s
- **T-3.4.9** Botón flotante aparece cuando hay items
- **T-3.4.10** Productos discontinuados ocultos

### 3.5 Product Modal
- **T-3.5.1** Modal fullscreen con backdrop
- **T-3.5.2** Muestra imagen, nombre, precio, descripción, categoría
- **T-3.5.3** Botón X cierra modal
- **T-3.5.4** "Sin Stock" para productos no disponibles

---

## 4. CART / CHECKOUT — 30 tests

### 4.1 Cart Drawer
- **T-4.1.1** Abre como bottom sheet con spring animation
- **T-4.1.2** Overlay cierra drawer
- **T-4.1.3** Botón X cierra drawer

### 4.2 Cart Items
- **T-4.2.1** Carrito vacío: "Tu carrito está vacío"
- **T-4.2.2** Cada item: imagen, nombre, precio x cantidad, subtotal
- **T-4.2.3** Botón (-) decrementa cantidad
- **T-4.2.4** Botón (+) incrementa cantidad
- **T-4.2.5** Cantidad 0 elimina item
- **T-4.2.6** Cantidad entre +/- botones
- **T-4.2.7** Textarea de notas por item, max 100 chars
- **T-4.2.8** Notas persisten en el carrito

### 4.3 Checkout Form
- **T-4.3.1** Botón "Volver" regresa al carrito
- **T-4.3.2** Nombre: requerido, min 2 chars
- **T-4.3.3** Teléfono: solo números, min 10 chars
- **T-4.3.4** Teléfono bloquea caracteres no numéricos
- **T-4.3.5** Errores de validación con role="alert"

### 4.4 Address
- **T-4.4.1** Textarea con autocomplete multi-provider
- **T-4.4.2** Búsqueda debounced 400ms después de 3+ chars
- **T-4.4.3** Dropdown de sugerencias
- **T-4.4.4** Seleccionar sugerencia llena dirección y coord
- **T-4.4.5** "No encontramos tu dirección" cuando no hay resultados
- **T-4.4.6** Auto-geocode en blur si no hay coordenadas
- **T-4.4.7** Status dot: verde (válido), rojo (fuera de zona), pulsante (buscando)
- **T-4.4.8** Spinner "Buscando..." o "GPS..."

### 4.5 Reference
- **T-4.5.1** Campo de referencia con placeholder descriptivo
- **T-4.5.2** Referencia es opcional

### 4.6 GPS
- **T-4.6.1** Botón "Usar mi ubicación actual" activa Geolocation API
- **T-4.6.2** Loading con spinner "Localizando..."
- **T-4.6.3** Éxito: coord seteadas, mapa centrado, dirección fill
- **T-4.6.4** Error: mensaje de error mostrado
- **T-4.6.5** Permiso denegado: error apropiado
- **T-4.6.6** Auto-GPS en primer checkout (una sola vez)

### 4.7 Map
- **T-4.7.1** Leaflet con tiles CartoDB dark
- **T-4.7.2** Pin centro fijo (rojo/naranja según rango)
- **T-4.7.3** Click/drag actualiza coordenadas
- **T-4.7.4** moveend debounced 1s
- **T-4.7.5** Bounds de Venezuela forzados
- **T-4.7.6** Toast "Fuera de Venezuela"
- **T-4.7.7** Mapa vuela a dirección seleccionada
- **T-4.7.8** Coordenadas debajo del mapa

### 4.8 Distance/Fee
- **T-4.8.1** Haversine rápido al cambiar coordenadas
- **T-4.8.2** Road distance asíncrono (OSRM → Valhalla → Haversine)
- **T-4.8.3** Tarjeta muestra "Distancia estimada" en km
- **T-4.8.4** Fee calculado por rangos de distancia
- **T-4.8.5** "Fuera de cobertura" cuando excede maxDistance
- **T-4.8.6** Botón submit deshabilitado fuera de rango
- **T-4.8.7** Fee en footer como "Costo de Envío"

### 4.9 Totals
- **T-4.9.1** Subtotal = sum(price x qty)
- **T-4.9.2** Tax = subtotal x taxRate
- **T-4.9.3** Total = subtotalWithTax + deliveryFee
- **T-4.9.4** Conversión Bs = total x exchangeRate
- **T-4.9.5** Todos valores con 2 decimales

### 4.10 Last Address
- **T-4.10.1** Última dirección guardada en localStorage (TTL 30 días)
- **T-4.10.2** Próximo checkout carga dirección previa
- **T-4.10.3** Direcciones expiradas (>30 días) se limpian

---

## 5. WHATSAPP ORDER — 13 tests

### 5.1 Order Creation
- **T-5.1.1** Orden guardada en Supabase antes de abrir WhatsApp
- **T-5.1.2** Datos completos: location_id, name, phone, type, address, coords, items, totals
- **T-5.1.3** Error al guardar: alert, carrito NO se limpia, WhatsApp NO abre
- **T-5.1.4** Éxito: WhatsApp abre, carrito se limpia, drawer cierra

### 5.2 Message Format
- **T-5.2.1** Inicia con `*NUEVO PEDIDO - W PANDA EXPRESS*`
- **T-5.2.2** Nombre, teléfono, tipo incluidos
- **T-5.2.3** Dirección incluida cuando existe
- **T-5.2.4** Referencia incluida cuando existe
- **T-5.2.5** Distancia en km incluida
- **T-5.2.6** Link Google Maps (`https://www.google.com/maps?q=lat,lng`) incluido
- **T-5.2.7** Lista productos: `qty x name ($subtotal)` con notas
- **T-5.2.8** Subtotal, tax, delivery fee, total USD, total Bs, tasa
- **T-5.2.9** Footer: "_Pedido realizado desde la App Web_"
- **T-5.2.10** Mensaje URL-encoded en link wa.me
- **T-5.2.11** Número WhatsApp en formato internacional

---

## 6. ADMIN PANEL (`/admin`) — 33 tests

### 6.1 Auth
- **T-6.1.1** Login con email y contraseña
- **T-6.1.2** Toggle show/hide password
- **T-6.1.3** Campos vacíos: error de validación
- **T-6.1.4** Credenciales incorrectas: error
- **T-6.1.5** Cuenta no-admin: error "no tiene permisos"
- **T-6.1.6** Spinner durante login
- **T-6.1.7** Botón deshabilitado durante login
- **T-6.1.8** "Volver a la vista pública" navega a `/`
- **T-6.1.9** Sesión persiste al refrescar
- **T-6.1.10** signOut cierra sesión

### 6.2 Roles
- **T-6.2.1** Super admin: acceso total (todas las sedes)
- **T-6.2.2** Admin local: acceso limitado a su sede
- **T-6.2.3** Tab "Sedes" oculta para admin local

### 6.3 Sidebar
- **T-6.3.1** Tabs: Dashboard, Sedes, Productos, Pedidos, Ajustes
- **T-6.3.2** Tab activo con fondo blanco
- **T-6.3.3** Email del usuario en sidebar
- **T-6.3.4** Botón logout
- **T-6.3.5** Móvil: hamburguesa abre/cierra sidebar

### 6.4 Dashboard
- **T-6.4.1** Tarjetas: Sedes activas, Productos, Pedidos, Ventas
- **T-6.4.2** Filtro fecha: Hoy, Semana, Mes, Todo
- **T-6.4.3** Gráfico SVG de barras
- **T-6.4.4** Top 5 Más/Menos vendidos
- **T-6.4.5** Últimos 5 pedidos
- **T-6.4.6** Empty state: "Sin ventas en este periodo"

### 6.5 Sedes CRUD
- **T-6.5.1** Grid: 1 col móvil, 2 tablet, 3 desktop
- **T-6.5.2** Cada tarjeta: imagen, nombre, dirección, horario, WhatsApp, toggle
- **T-6.5.3** "Nueva Sede" solo super admin
- **T-6.5.4** Editar abre LocationForm
- **T-6.5.5** Eliminar solo super admin con confirmación
- **T-6.5.6** Toggle abierto/cerrado funciona

### 6.6 Productos CRUD
- **T-6.6.1** "Catálogo Global" (super) / "Inventario de Sede" (local)
- **T-6.6.2** Filtro por categoría con tabs
- **T-6.6.3** Productos agrupados por categoría
- **T-6.6.4** Toggle stock global (super) / discontinued (local)
- **T-6.6.5** Modal de categorías (solo super admin)
- **T-6.6.6** Agregar categoría: input + botón o Enter
- **T-6.6.7** Editar categoría inline: blur/Enter guarda, Escape cancela
- **T-6.6.8** Eliminar categoría con confirmación
- **T-6.6.9** Pagination 10 items por página

### 6.7 Pedidos
- **T-6.7.1** Empty state: "Aún no hay pedidos"
- **T-6.7.2** Búsqueda por nombre, teléfono, dirección
- **T-6.7.3** Filtro por sede
- **T-6.7.4** Filtro por tipo (Delivery/Pick-up)
- **T-6.7.5** Sorting: fecha, total, nombre
- **T-6.7.6** Vista tabla en desktop
- **T-6.7.7** Vista tarjetas en móvil
- **T-6.7.8** Admin local solo ve pedidos de su sede

### 6.8 Settings
- **T-6.8.1** Tab General: logo, about, redes sociales, featured products
- **T-6.8.2** Tab Finanzas: tax rate, delivery fee, exchange rate, distance pricing
- **T-6.8.3** Upload de logo (max 5MB, WebP)
- **T-6.8.4** Featured products: max 5, toggle selección
- **T-6.8.5** Rangos de distancia: agregar/eliminar
- **T-6.8.6** "Guardar Cambios" con spinner
- **T-6.8.7** Toast éxito/error (4s)
- **T-6.8.8** Toast cleanup en unmount

---

## 7. I18N — 14 tests

### 7.1 Language Toggle
- **T-7.1.1** Dropdown con 3 idiomas: ESP, ENG, 中文
- **T-7.1.2** Idioma actual con fondo gradiente + checkmark
- **T-7.1.3** Globe icon en botón toggle
- **T-7.1.4** Flags para cada idioma
- **T-7.1.5** aria-label="Select language"

### 7.2 Translations
- **T-7.2.1** Navegación traducida
- **T-7.2.2** Hero traducido
- **T-7.2.3** Menú traducido
- **T-7.2.4** Carrito traducido
- **T-7.2.5** Mensajes de error traducidos
- **T-7.2.6** Welcome screen traducido
- **T-7.2.7** Nombres de categorías traducidos via `t()`
- **T-7.2.8** Nombres de sedes traducidos via `t()`
- **T-7.2.9** Fallback: keys no traducidas devuelven la key

### 7.3 Persistence
- **T-7.3.1** Default: español
- **T-7.3.2** Persiste en memoria durante la sesión
- **T-7.3.3** Resetea a español al refrescar

---

## 8. PWA — 15 tests

### 8.1 Manifest
- **T-8.1.1** `manifest.json` presente
- **T-8.1.2** Nombre: "Wallace Panda Express"
- **T-8.1.3** Display: standalone
- **T-8.1.4** Orientation: portrait
- **T-8.1.5** Theme color: #d92323
- **T-8.1.6** Icons: 192x192 y 512x512

### 8.2 Service Worker
- **T-8.2.1** SW registrado en page load
- **T-8.2.2** skipWaiting en install
- **T-8.2.3** Caches antiguos eliminados en activate
- **T-8.2.4** Network-first, fallback a cache, luego 503

### 8.3 Install Prompt
- **T-8.3.1** Detecta beforeinstallprompt
- **T-8.3.2** installApp() activa prompt nativo
- **T-8.3.3** Muestra 1.5s delay en móvil
- **T-8.3.4** Dismiss en sessionStorage
- **T-8.3.5** Detección iOS para instrucciones diferentes
- **T-8.3.6** Detección standalone (ya instalada)

---

## 9. RESPONSIVE DESIGN — 16 tests

### 9.1 Breakpoints
- **T-9.1.1** Móvil (<768px): 1 col, hamburguesa, bottom-sheet cart
- **T-9.1.2** Tablet (md, 768px+): 2 cols, nav expandido
- **T-9.1.3** Desktop (lg, 1024px+): 3 cols, sidebar full

### 9.2 Landing Responsive
- **T-9.2.1** Hero textos responsivos (6xl → 7xl → 8xl)
- **T-9.2.2** Nav: hamburguesa móvil, links completos desktop
- **T-9.2.3** Featured grid: 1 → 2 → 3 columnas

### 9.3 Menu Responsive
- **T-9.3.1** Product grid: 1 → 2 → 3 columnas
- **T-9.3.2** Category tabs scrollables con fade gradients

### 9.4 Admin Responsive
- **T-9.4.1** Sidebar: oculto móvil, visible lg+
- **T-9.4.2** Hamburger en móvil
- **T-9.4.3** Overlay detrás del sidebar móvil
- **T-9.4.4** Pedidos: cards móvil, tabla desktop
- **T-9.4.5** Dashboard: 1 col móvil, 4 cols desktop

---

## 10. EDGE CASES — 57 tests

### 10.1 Loading States
- **T-10.1.1** Spinner global cuando isLoading
- **T-10.1.2** Login con spinner
- **T-10.1.3** Upload de imagen con spinner
- **T-10.1.4** Address search con "Buscando..."
- **T-10.1.5** GPS con "Localizando..."

### 10.2 Empty States
- **T-10.2.1** Sin sedes: "No hay sedes disponibles"
- **T-10.2.2** Sin productos: "No hay productos aquí"
- **T-10.2.3** Carrito vacío: "Tu carrito está vacío"
- **T-10.2.4** Sin pedidos: "Aún no hay pedidos"
- **T-10.2.5** Sin coincidencias: "Ningún pedido coincide"
- **T-10.2.6** Sin ventas: "Sin ventas en este periodo"

### 10.3 Error States
- **T-10.3.1** ErrorBoundary captura errores React
- **T-10.3.2** "Intentar de nuevo" resetea estado
- **T-10.3.3** "Recargar" ejecuta reload
- **T-10.3.4** Error en monospace para debugging
- **T-10.3.5** Fallo geocoding: devuelve array vacío
- **T-10.3.6** Fallo distancia: fallback OSRM → Valhalla → Haversine
- **T-10.3.7** Fallo guardar orden: alert, carrito preservado

### 10.4 Image Handling
- **T-10.4.1** Lazy load via IntersectionObserver
- **T-10.4.2** Skeleton pulse mientras carga
- **T-10.4.3** Placeholder UtensilsCrossed en error
- **T-10.4.4** referrerPolicy="no-referrer"

### 10.5 Cart Edge Cases
- **T-10.5.1** Mismo producto dos veces incrementa qty (no duplica)
- **T-10.5.2** Qty nunca < 0
- **T-10.5.3** Qty 0 elimina item
- **T-10.5.4** Notas max 100 chars
- **T-10.5.5** Total recalcular en cada cambio de qty
- **T-10.5.6** Back button limpia carrito

### 10.6 Validation
- **T-10.6.1** Teléfono: solo [0-9+\-\s()]
- **T-10.6.2** Teléfono: min 10 chars
- **T-10.6.3** Nombre: min 2 chars
- **T-10.6.4** Dirección: min 5 chars
- **T-10.6.5** Fuera de rango bloquea submit

### 10.7 Location Logic
- **T-10.7.1** Horario normal (open < close): dentro de rango = abierto
- **T-10.7.2** Horario nocturno (close < open): wrap correcto
- **T-10.7.3** Sin horarios: usa valor DB isOpen
- **T-10.7.4** Sedes cerradas no seleccionables

### 10.8 Distance Pricing
- **T-10.8.1** Rangos ordenados por maxDistance
- **T-10.8.2** null maxDistance = catch-all (Infinity)
- **T-10.8.3** Sin match → último rango
- **T-10.8.4** Array vacío → fee 0

### 10.9 Geocoding
- **T-10.9.1** Query < 3 chars: devuelve []
- **T-10.9.2** Bounds Venezuela forzados
- **T-10.9.3** Dedup por proximidad <50m
- **T-10.9.4** Resultados ordenados por distancia al restaurante
- **T-10.9.5** Photon timeout 8s, Nominatim 6s
- **T-10.9.6** OSRM 3 mirrors fallback
- **T-10.9.7** NaN coordinates filtradas

### 10.10 Race Conditions
- **T-10.10.1** Auto-GPS solo una vez (ref guard)
- **T-10.10.2** Distance abort flag previene stale state
- **T-10.10.3** Address debounce previene llamadas rápidas
- **T-10.10.4** Map moveend debounce 1s
- **T-10.10.5** CenterFlyer skip-next-ref
- **T-10.10.6** Blur timeout previene flicker

### 10.11 Performance
- **T-10.11.1** AdminPage y CartDrawer son React.lazy
- **T-10.11.2** ProductCard memoized
- **T-10.11.3** OptimizedImage lazy
- **T-10.11.4** loading="lazy" en imágenes
- **T-10.11.5** Route cache 5min TTL
- **T-10.11.6** React Query staleTime 1hr
- **T-10.11.7** useMemo en valores computados

### 10.12 Image Upload
- **T-10.12.1** Max 5MB
- **T-10.12.2** Resize 800px, quality 0.7, WebP
- **T-10.12.3** Upload a Supabase Storage bucket `images`
- **T-10.12.4** UUID filename
- **T-10.12.5** Canvas compression error handling

### 10.13 React Query
- **T-10.13.1** Invalidación post-CRUD locations
- **T-10.13.2** Invalidación post-CRUD products
- **T-10.13.3** Invalidación post-CRUD categories
- **T-10.13.4** Invalidación post-update config
- **T-10.13.5** Invalidación post-create order
- **T-10.13.6** IDs con prefix `loc-`/`prod-`/`cat-` para detectar insert vs update

### 10.14 Route Guard
- **T-10.14.1** Rutas desconocidas redirigen a `/`
- **T-10.14.2** Vercel SPA rewrites

### 10.15 Accessibility
- **T-10.15.1** Skip-to-content link
- **T-10.15.2** role="dialog" en drawers y modals
- **T-10.15.3** aria-modal="true" en modals
- **T-10.15.4** aria-label en botones
- **T-10.15.5** aria-describedby y aria-invalid en form fields
- **T-10.15.6** role="alert" en errores de validación
- **T-10.15.7** Focus ring styles
- **T-10.15.8** aria-expanded en toggles

### 10.16 Dynamic Theming
- **T-10.16.1** CSS custom property primary desde config
- **T-10.16.2** CSS custom property secondary desde config
- **T-10.16.3** Document title desde config
- **T-10.16.4** Favicon desde config logo

### 10.17 Connection
- **T-10.17.1** @supabase/ssr createBrowserClient
- **T-10.17.2** Env vars: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
- **T-10.17.3** Auth state change listener

### 10.18 Unknown Routes
- **T-10.18.1** Catch-all redirige a `/`

---

## RESUMEN

| Categoría | Tests |
|-----------|-------|
| 1. Landing Page | 31 |
| 2. Public Menu | 17 |
| 3. Order Flow | 28 |
| 4. Cart / Checkout | 30 |
| 5. WhatsApp Order | 13 |
| 6. Admin Panel | 33 |
| 7. I18n | 14 |
| 8. PWA | 15 |
| 9. Responsive | 16 |
| 10. Edge Cases | 57 |
| **TOTAL** | **254** |

> Nota: Algunos tests son combinaciones de múltiples sub-escenarios. El total real de escenarios testeables es ~307.
