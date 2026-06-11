# PRD — W Panda Express (App de Pedidos)

## 1. Descripción General

Aplicación web progresiva (PWA) para restaurante de comida china **W Panda Express**. Los clientes seleccionan una sede, navegan el menú categorizado, arman un carrito de compras y finalizan el pedido enviándolo por WhatsApp. Incluye un panel administrativo para gestionar sedes, productos, categorías, configuración y pedidos.

---

## 2. Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | React 19 + TypeScript |
| Build | Vite 6 |
| Routing | React Router v6 |
| Estilos | Tailwind CSS v4 + `motion/react` (animaciones) |
| Backend/Datos | Supabase (PostgreSQL, Auth, Realtime) |
| Mapas | Leaflet (Nominatim para geocodificación) |
| PWA | Service Worker + manifest |
| Admin Auth | Supabase Auth (email/password + Google OAuth) |

---

## 3. Rutas

| Ruta | Página | Descripción |
|------|--------|-------------|
| `/` | `LandingPage` | Página de marketing: hero, sobre nosotros, platos destacados, sedes, reseñas, redes sociales, CTA |
| `/menu` | `PublicMenuPage` | Menú público sin selección de sede |
| `/pedir` | `MainView` | Flujo de pedido: seleccionar sede → ver menú → carrito → checkout → WhatsApp |
| `/admin` | `AdminPage` | Panel de administración protegido (login requerido) |
| `*` | Redirect a `/` | |

---

## 4. Funcionalidades por Componente

### 4.1 LandingPage (`/`)
- Hero section con tagline y CTA para pedir
- Sección "Sobre Nosotros" con contenido configurable desde Supabase
- Platos destacados (configurable via `featuredProductIds`)
- Lista de sedes con horarios y estado abierto/cerrado
- Reseñas de clientes (estáticas con traducciones)
- Redes sociales (Instagram, Facebook, TikTok configurables)
- CTA final "Ver Menú Completo"
- LanguageToggle (español, inglés, chino)

### 4.2 WelcomeScreen (paso 1 del flujo `/pedir`)
- Muestra logo del restaurante y nombre
- Lista de sedes disponibles con imagen, horario, dirección y estado (abierto/cerrado)
- Al seleccionar una sede abierta, se navega al menú
- Enlace al panel de admin

### 4.3 MenuView (paso 2 del flujo `/pedir`)
- Header con nombre de sede y botón volver
- Categorías sticky con scroll horizontal
- Grid de productos por categoría
- Cada producto: imagen, nombre, descripción, precio, botón "+" para agregar al carrito
- Productos agotados se muestran con overlay y no son seleccionables
- Productos descontinuados por sede se filtran automáticamente
- Modal de producto al hacer clic (detalle)
- Botón flotante de carrito con conteo y total

### 4.4 CartDrawer (paso 3 del flujo `/pedir`)
- Drawer inferior con sheet animation
- **Paso "cart":** lista de items con imagen, nombre, precio, selector de cantidad (+/−), input de notas, botón eliminar
- **Paso "checkout":** formulario con:
  - Nombre completo (validación: ≥2 caracteres)
  - WhatsApp de contacto (validación: regex teléfono ≥10 dígitos)
  - Tipo de entrega: Delivery o Pick-up (no implementado visualmente pero sí en lógica)
  - Dirección con búsqueda por Nominatim (autocomplete con debounce 500ms)
  - Geocodificación automática de dirección
  - Botón "Usar mi ubicación actual" (Geolocation API)
  - Mapa interactivo Leaflet para seleccionar ubicación
  - Cálculo de distancia y tarifa de envío basado en distancePricing
  - Validación de cobertura (máx XX km)
  - Punto de referencia
- Resumen de orden con subtotal, impuesto, delivery, total en USD y Bs.
- Botón "Pedir por WhatsApp" → genera mensaje formateado y abre WhatsApp
- Los pedidos también se guardan en Supabase (tabla `orders`)

### 4.5 ProductModal
- Modal de detalle de producto con imagen grande, descripción, precio
- Botón para agregar al carrito

### 4.6 AdminPage (`/admin`)
- **Autenticación:** Login con email/password o Google OAuth via Supabase Auth
- **Roles:**
  - SuperAdmin (email: `dariomedina2619@gmail.com`): acceso total
  - LocalAdmin (adminEmail en location): gestiona solo su sede
- **Dashboard:** tarjetas con conteo de sedes, productos y pedidos
- **Sedes (CRUD):** crear, editar, eliminar sedes; toggle activo/inactivo
- **Productos (CRUD):** crear, editar, eliminar productos; toggle inStock global; toggle disponibilidad por sede (discontinuedProductIds)
- **Categorías (CRUD):** gestionar categorías del menú
- **Ajustes:** editar configuración del restaurante (nombre, logo, colores, redes, impuesto, delivery fee, exchange rate, distance pricing)
- **Pedidos:** lista de pedidos realizados (tabla `orders`)

### 4.7 LanguageToggle
- Cambia entre español, inglés y chino
- Traducciones vía contexto (`LanguageContext`) con objeto `translations`

### 4.8 PWAInstallPrompt
- Captura evento `beforeinstallprompt`
- Muestra prompt de instalación de PWA

---

## 5. Modelo de Datos (Supabase)

### Tablas

| Tabla | Descripción |
|-------|-------------|
| `config` | Configuración del restaurante (una fila, id='main') |
| `locations` | Sedes con datos de contacto, horario, coordenadas |
| `menu_items` | Productos del menú |
| `categories` | Categorías para agrupar productos |
| `orders` | Pedidos realizados (nombre, teléfono, dirección, items, totales) |
| `admins` | Administradores vinculados por uid de Supabase Auth |

### Tipos clave (TypeScript)

- `RestaurantConfig`: nombre, logo, colores, taxRate, deliveryFee, exchangeRate, distancePricing, redes
- `Location`: nombre, whatsapp, schedule, address, image, openTime, closeTime, isOpen, coordenadas, discontinuedProductIds
- `Product`: nombre, descripción, price, categoría, image, inStock, order
- `CartItem`: Product + quantity + notes
- `Category`: nombre, order
- `CheckoutData`: datos del formulario de checkout
- `Order`: datos completos del pedido con items, totales, coordenadas

---

## 6. Lo que TestSprite debe Probar

### 6.1 Landing Page (`/`)
- [ ] Hero section se renderiza con tagline y CTA
- [ ] Platos destacados se muestran correctamente
- [ ] Sedes aparecen con nombre, horario y estado
- [ ] Enlace "Pedir Ahora" navega a `/pedir`
- [ ] LanguageToggle cambia idiomas correctamente
- [ ] Diseño responsive (mobile/desktop)

### 6.2 Flujo de Pedido (`/pedir`)

#### WelcomeScreen
- [ ] Logo y nombre del restaurante se muestran
- [ ] Lista de sedes se renderiza con imágenes
- [ ] Sede cerrada no es seleccionable
- [ ] Al seleccionar sede abierta → navega a MenuView
- [ ] Estado vacío cuando no hay sedes

#### MenuView
- [ ] Categorías sticky funcionan con scroll
- [ ] Productos se filtran por categoría
- [ ] Producto agotado se muestra como no seleccionable
- [ ] Botón "+" agrega producto al carrito
- [ ] Botón flotante de carrito aparece con conteo correcto
- [ ] Modal de producto se abre al hacer clic
- [ ] Estado vacío por categoría sin productos

#### CartDrawer
- [ ] Drawer se abre/cierra con animación
- [ ] Items en carrito muestran imagen, nombre, precio, cantidad
- [ ] Botón +/− actualiza cantidad (mínimo 0 elimina)
- [ ] Input de notas funciona con límite 100 caracteres
- [ ] Botón eliminar quita el item
- [ ] Carrito vacío muestra estado vacío

#### Checkout (formulario)
- [ ] Validación: nombre ≥2 caracteres
- [ ] Validación: teléfono ≥10 dígitos (regex)
- [ ] Validación: dirección ≥5 caracteres (Delivery)
- [ ] Búsqueda de dirección con Nominatim (autocomplete)
- [ ] Selección de sugerencia de dirección actualiza coordenadas
- [ ] Botón "Usar mi ubicación actual" (Geolocation API)
- [ ] Mapa Leaflet es interactivo y selecciona ubicación
- [ ] Cálculo de distancia y tarifa de envío funciona
- [ ] Validación de cobertura (fuera de rango bloquea el envío)
- [ ] Resumen muestra subtotal, impuesto, delivery, total USD y Bs.

#### Finalizar Pedido
- [ ] Botón "Pedir por WhatsApp" abre WhatsApp con mensaje formateado
- [ ] Pedido se guarda en Supabase (tabla orders)
- [ ] Carrito se limpia después del pedido

### 6.3 Panel Admin (`/admin`)

#### Autenticación
- [ ] Login con email/password funciona
- [ ] Login con Google OAuth funciona
- [ ] Error de credenciales muestra mensaje apropiado
- [ ] Solo admins pueden acceder (no autenticados ven login)

#### Dashboard
- [ ] Conteo de sedes, productos y pedidos es correcto

#### CRUD Sedes
- [ ] Crear sede con formulario
- [ ] Editar sede existente
- [ ] Eliminar sede
- [ ] Toggle activo/inactivo funciona
- [ ] LocalAdmin solo ve su sede

#### CRUD Productos
- [ ] Crear producto con formulario
- [ ] Editar producto existente
- [ ] Eliminar producto
- [ ] Toggle inStock global funciona
- [ ] Toggle disponibilidad por sede (LocalAdmin) funciona

#### CRUD Categorías
- [ ] Crear categoría
- [ ] Editar categoría
- [ ] Eliminar categoría

#### Ajustes
- [ ] Editar nombre, logo, colores del restaurante
- [ ] Editar taxRate, deliveryFee, exchangeRate
- [ ] Editar distancePricing (rangos y distancia máxima)
- [ ] Editar redes sociales
- [ ] Los cambios persisten en Supabase

### 6.4 Internacionalización (i18n)
- [ ] Español, inglés y chino funcionan en todas las páginas
- [ ] Traducciones de productos, categorías y sedes se muestran correctamente
- [ ] El cambio de idioma persiste durante la sesión

### 6.5 PWA
- [ ] Prompt de instalación aparece (cuando es soportado)
- [ ] La app funciona offline (service worker)

### 6.6 Responsive / UI
- [ ] Layout funciona en mobile (320px+), tablet y desktop
- [ ] Animaciones no rompen el flujo
- [ ] Scroll horizontal de categorías funciona en mobile
- [ ] Drawer del carrito ocupa max 95vh en mobile
