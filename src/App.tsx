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
import { generateWhatsAppLink } from "./utils";
import { RestaurantProvider, useRestaurant } from "./context/RestaurantContext";
import { LanguageProvider } from "./context/LanguageContext";
import { CartProvider } from "./context/CartContext";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";

const AdminPage = lazy(() => import("./pages/AdminPage"));
const CartDrawer = lazy(() => import("./components/ui/CartDrawer").then(m => ({ default: m.CartDrawer })));

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-primary-vibrant border-t-transparent rounded-full animate-spin" />
      <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">Cargando...</p>
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
      if (product) addToCart(product);
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
    try {
      const deliveryFee = data.calculatedDeliveryFee ?? config.deliveryFee ?? 0;
      await createOrder({
        location_id: selectedLocation.id,
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
        total: total * (1 + (config.taxRate ?? 0)) + deliveryFee,
        notes: data.notes,
        status: 'exitoso',
      });
      // Only clear cart and open WhatsApp if order saved successfully
      const link = generateWhatsAppLink(selectedLocation, items, data, config);
      window.open(link, "_blank");
      clearCart();
      setIsCartOpen(false);
    } catch (err) {
      console.error('Error saving order:', err);
      alert('Error al guardar el pedido. Por favor intenta de nuevo.');
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
              onCheckout={handleCheckout}
            />
          </Suspense>
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <RestaurantProvider>
          <CartProvider>
            <BrowserRouter>
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/menu" element={<PublicMenuPage />} />
                  <Route path="/pedir" element={<MainView />} />
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/legal" element={<LegalPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </CartProvider>
        </RestaurantProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
