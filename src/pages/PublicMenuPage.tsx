
import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Utensils, ArrowLeft, ShoppingBag, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useRestaurant } from '../context/RestaurantContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageToggle } from '../components/LanguageToggle';
import { ProductModal } from '../components/ProductModal';
import { PWAInstallPrompt } from '../components/PWAInstallPrompt';
import { Product } from '../types';

export function PublicMenuPage() {
  const { menuItems, categories, config, isLoading } = useRestaurant();
  const { t, language } = useLanguage();
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id || '');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Initialize active category if not set
  useMemo(() => {
    if (!activeCategory && categories.length > 0) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
        const catId = item.category.toLowerCase().replace(/\s+/g, '-');
        // Handle both name matching and ID matching for safety
        const currentCat = categories.find(c => c.id === activeCategory);
        return item.category === activeCategory || (currentCat && item.category === currentCat.name);
    });
  }, [activeCategory, menuItems, categories]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary-vibrant border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-400 font-black uppercase tracking-widest text-[10px]">{t('menu.welcome')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-orange-100">
      {/* Header */}
      <header className="vibrant-gradient p-10 md:p-16 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl -ml-32 -mb-32" />
        
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
             <Link to="/" className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-2xl transition-all backdrop-blur-md mb-4 group">
               <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
               <span className="text-[10px] font-black uppercase tracking-widest">{t('nav.home')}</span>
             </Link>
             <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic">{t('nav.menu')}</h1>
             <p className="text-white/80 font-medium max-w-lg">{t('about.default')}</p>
          </div>
          
          <div className="flex items-center gap-4">
            <LanguageToggle />
            <Link to="/pedir" className="bg-white text-primary-vibrant px-8 py-5 rounded-[32px] font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
               {t('nav.orderNow')} <ShoppingBag className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Category Tabs */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-xl z-30 border-b border-zinc-100 shadow-xl shadow-zinc-200/10">
        <div className="max-w-7xl mx-auto flex items-center gap-4 p-8 overflow-x-auto no-scrollbar scroll-smooth">
          {categories.map((cat) => (
            <motion.button
              key={cat.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-10 py-4 rounded-[24px] text-xs font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${
                activeCategory === cat.id
                  ? 'bg-primary-vibrant text-white shadow-2xl shadow-primary-vibrant/30 scale-110'
                  : 'bg-zinc-100 text-zinc-400 hover:bg-zinc-200'
              }`}
            >
              {cat.name}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Menu Grid */}
      <main className="max-w-7xl mx-auto px-6 py-16">
        {filteredItems.length === 0 ? (
          <div className="py-24 text-center space-y-6">
            <div className="w-24 h-24 bg-zinc-100 rounded-[40px] flex items-center justify-center mx-auto">
              <Tag className="w-12 h-12 text-zinc-300" />
            </div>
            <p className="text-zinc-400 font-black uppercase tracking-[0.2em]">{t('menu.empty')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredItems.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                onClick={() => setSelectedProduct(item)}
                className="bg-white rounded-[48px] p-4 border border-zinc-100 shadow-2xl hover:shadow-primary-vibrant/10 transition-all group overflow-hidden cursor-pointer"
              >
                <div className="relative h-72 rounded-[40px] overflow-hidden mb-6">
                  <img
                    src={item.image || 'https://picsum.photos/seed/food/400/300'}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-6 right-6 bg-primary-vibrant text-white px-6 py-3 rounded-2xl font-black text-xl shadow-2xl">
                    ${item.price.toFixed(2)}
                  </div>
                </div>
                
                <div className="px-6 pb-6 space-y-4">
                  <h3 className="text-2xl font-black uppercase tracking-tight text-zinc-900 line-clamp-1">{item.name}</h3>
                  <p className="text-zinc-500 font-medium leading-relaxed italic text-sm line-clamp-2">
                    {item.description}
                  </p>
                  <div className="pt-4 flex items-center justify-between">
                     <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${item.inStock ? 'bg-zinc-100 text-zinc-500' : 'bg-red-50 text-red-500'}`}>
                        {item.inStock ? t(`cat.${activeCategory}`) : t('menu.outOfStock')}
                     </span>
                     <Link to="/pedir" className="w-12 h-12 vibrant-gradient rounded-2xl flex items-center justify-center text-white shadow-xl hover:rotate-12 transition-transform">
                        <ShoppingBag className="w-6 h-6" />
                     </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Footer Branding */}
      <footer className="py-20 bg-zinc-50 border-t border-zinc-100 text-center">
        <div className="max-w-lg mx-auto space-y-6">
          <div className="w-20 h-20 bg-white p-2 rounded-full shadow-2xl mx-auto flex items-center justify-center">
             {config.logo ? (
               <img src={config.logo || '/logo.png'} alt={config.name} className="w-full h-full object-cover rounded-full" />
             ) : (
               <Utensils className="w-8 h-8 text-zinc-400" />
             )}
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tighter italic">{config.name}</h2>
          <div className="flex justify-center gap-4">
             <div className="w-10 h-1 bg-primary-vibrant rounded-full" />
             <div className="w-10 h-1 bg-secondary-vibrant rounded-full" />
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {selectedProduct && (
          <ProductModal 
            product={selectedProduct} 
            onClose={() => setSelectedProduct(null)} 
            showAddToCart={false}
          />
        )}
      </AnimatePresence>
      <PWAInstallPrompt />
    </div>
  );
}
