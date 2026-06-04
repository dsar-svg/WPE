import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WelcomeScreen } from './components/WelcomeScreen';
import { MenuView } from './components/MenuView';
import { CartDrawer } from './components/CartDrawer';
import { AdminPage } from './pages/AdminPage';
import { LandingPage } from './pages/LandingPage';
import { PublicMenuPage } from './pages/PublicMenuPage';
import { useCart } from './hooks/useCart';
import { Location, CheckoutData } from './types';
import { generateWhatsAppLink } from './utils';
import { RestaurantProvider, useRestaurant } from './context/RestaurantContext';
import { LanguageProvider } from './context/LanguageContext';
import { LanguageToggle } from './components/LanguageToggle';

function MainView() {
  const { locations, menuItems, categories, config, isLoading, selectedLocation, setSelectedLocation } = useRestaurant();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { items, addToCart, updateQuantity, updateNotes, total, clearCart } = useCart();

  const activeMenuItems = selectedLocation 
    ? menuItems.filter(item => !selectedLocation.discontinuedProductIds?.includes(item.id))
    : menuItems;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary-vibrant border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">Cargando experiencia...</p>
      </div>
    );
  }

  const handleCheckout = (data: CheckoutData) => {
    if (!selectedLocation) return;
    const link = generateWhatsAppLink(selectedLocation, items, data);
    window.open(link, '_blank');
    clearCart();
    setIsCartOpen(false);
  };

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-orange-200">
      {!selectedLocation ? (
        <WelcomeScreen 
          onSelectLocation={(loc) => setSelectedLocation({ ...loc })} 
          locations={locations}
          config={config}
        />
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
            onBack={() => {
              setSelectedLocation(null);
              clearCart();
            }}
            config={config}
          />
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
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <RestaurantProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/menu" element={<PublicMenuPage />} />
            <Route path="/pedir" element={<MainView />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </RestaurantProvider>
    </LanguageProvider>
  );
}
