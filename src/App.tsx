import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { WelcomeScreen } from "./components/ui/WelcomeScreen";
import { MenuView } from "./components/ui/MenuView";
import { LandingPage } from "./pages/LandingPage";
import { PublicMenuPage } from "./pages/PublicMenuPage";
import { LegalPage } from "./pages/LegalPage";
import { SEO } from "./components/ui/SEO";
import { useCart } from "./context/CartContext";
import { CheckoutData } from "./types";
import { generateWhatsAppLink, generateOrderCode } from "./utils";
import { RestaurantProvider, useRestaurant } from "./context/RestaurantContext";
import { LanguageProvider } from "./context/LanguageContext";
import { CartProvider } from "./context/CartContext";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { UpdateBanner } from "./components/ui/UpdateBanner";

const AdminPage = lazy(() => import("./pages/AdminPage"));
const PosPage = lazy(() => import("./pages/PosPage"));
const CartDrawer = lazy(() => import("./components/ui/CartDrawer").then(m => ({ default: m.CartDrawer })));

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-white animate-pulse flex flex-col">
      <div className="h-16 bg-zinc-100 border-b border-zinc-200" />
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 space-y-6 max-w-md mx-auto w-full">
        <div className="w-20 h-20 bg-zinc-100 rounded-full" />
        <div className="space-y-3 w-full">
          <div className="h-6 bg-zinc-100 rounded-lg w-3/4 mx-auto" />
          <div className="h-3 bg-zinc-100 rounded w-1/2 mx-auto" />
        </div>
        <div className="space-y-3 w-full mt-8">
          <div className="h-28 bg-zinc-100 rounded-2xl" />
          <div className="h-28 bg-zinc-100 rounded-2xl" />
          <div className="h-28 bg-zinc-100 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

function MainView() {
  const { locations, menuItems, categories, config, isLoading, selectedLocation, setSelectedLocation, createOrder } = useRestaurant();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { items, addToCart, updateQuantity, updateNotes, removeFromCart, total, clearCart } = useCart();
  const routeStateRef = useRef(useLocation().state);

  useEffect(() => {
    const state = routeStateRef.current as any;
    if (selectedLocation && state?.preAddProduct) {
      const product = menuItems.find(p => p.id === state.preAddProduct.id);
      if (product) addToCart(product, state.preSelectedChoices);
      window.history.replaceState({}, document.title);
    }
  }, [selectedLocation, menuItems, addToCart]);

  const activeMenuItems = selectedLocation
    ? menuItems.filter(item => !selectedLocation.discontinuedProductIds?.includes(item.id))
    : menuItems;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const handleCheckout = async (data: CheckoutData) => {
    if (!selectedLocation) return;
    const orderCode = generateOrderCode();
    const link = generateWhatsAppLink(selectedLocation, items, data, config, orderCode);
    window.open(link, "_blank");
    try {
      const deliveryFee = data.calculatedDeliveryFee ?? config.deliveryFee ?? 0;
      await createOrder({
        location_id: selectedLocation.id,
        cedula: data.cedula || '',
        customer_name: data.name,
        customer_phone: data.phone,
        delivery_type: data.deliveryType || 'Delivery',
        delivery_address: data.address,
        delivery_coordinates: data.deliveryCoordinates,
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          notes: item.notes,
          selectedChoices: item.selectedChoices,
        })),
        subtotal: total,
        delivery_fee: deliveryFee,
        total: total + deliveryFee,
        notes: data.notes,
        payment_method: data.paymentMethod || 'Efectivo',
        payment_ref: data.paymentRef || '',
        status: 'pendiente',
        code: orderCode,
      });
    } catch (err) {
      console.error('Error saving order:', err);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-primary-vibrant selection:text-white">
      <SEO
        title="Hacer Pedido - Delivery Rápido"
        description="Haz tu pedido en Wallace Panda Express. Selecciona tu ubicación, elige tus platillos favoritos y recíbelo en la comodidad de tu hogar. Delivery rápido y seguro."
        canonical="/pedir"
      />
      {!selectedLocation ? (
        <WelcomeScreen onSelectLocation={(loc) => setSelectedLocation({ ...loc })} locations={locations} config={config} />
      ) : (
        <>
          <MenuView
            onAddToCart={addToCart}
            cartCount={items.reduce((acc, item) => acc + item.quantity, 0)}
            total={total}
            menuItems={activeMenuItems}
            categories={categories}
            onOpenCart={() => setIsCartOpen(true)}
            location={selectedLocation}
            onBack={() => { setSelectedLocation(null); clearCart(); }}
            config={config}
          />
          <Suspense fallback={<LoadingSpinner />}>
            <CartDrawer
              isOpen={isCartOpen}
              onClose={() => setIsCartOpen(false)}
              items={items}
              total={total}
              location={selectedLocation}
              updateQuantity={updateQuantity}
              updateNotes={updateNotes}
              removeFromCart={removeFromCart}
              onCheckout={handleCheckout}
              clearCart={clearCart}
            />
          </Suspense>
        </>
      )}
    </div>
  );
}

export default function App({ appMode }: { appMode?: 'public' | 'admin' | 'pos' }) {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <RestaurantProvider>
          <CartProvider>
            <BrowserRouter>
              <UpdateBanner />
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  {(!appMode || appMode === 'public') && (
                    <>
                      <Route path="/" element={<LandingPage />} />
                      <Route path="/menu" element={<PublicMenuPage />} />
                      <Route path="/pedir" element={<MainView />} />
                      <Route path="/legal" element={<LegalPage />} />
                    </>
                  )}
                  {(!appMode || appMode === 'admin') && (
                    <Route path="/admin" element={<AdminPage />} />
                  )}
                  {(!appMode || appMode === 'pos' || appMode === 'admin') && (
                    <Route path="/pos" element={<PosPage />} />
                  )}
                  <Route path="*" element={<Navigate to={appMode === 'admin' ? '/admin' : appMode === 'pos' ? '/pos' : '/'} replace />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </CartProvider>
        </RestaurantProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
