import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Utensils, ArrowLeft, HandPlatter, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useRestaurant } from '../context/RestaurantContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageToggle } from '../components/ui/LanguageToggle';
import { ProductModal } from '../components/ui/ProductModal';
import { PWAInstallPrompt } from '../components/ui/PWAInstallPrompt';
import { Pagination } from '../components/ui/Pagination';
import { Product } from '../types';

export function PublicMenuPage() {
  const { menuItems, categories, config, isLoading } = useRestaurant();
  const { t, language } = useLanguage();
  const [activeCategory, setActiveCategory] = useState(categories[0]?.name || '');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => { window.scrollTo(0, 0); }, []);
  useEffect(() => {
    if (!activeCategory && categories.length > 0) { setActiveCategory(categories[0].name); }
  }, [categories, activeCategory]);

  useEffect(() => {
    setPage(1);
  }, [activeCategory]);

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => item.category === activeCategory);
  }, [activeCategory, menuItems]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, page]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary-vibrant border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-500 font-display uppercase tracking-[0.3em] text-sm">{t('menu.welcome')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-body selection:bg-primary-vibrant">
      {/* Header */}
      <header className="bg-dark p-10 md:p-16 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary-vibrant/15 rounded-full blur-[100px] -mr-40 -mt-40" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary-vibrant/10 rounded-full blur-[80px] -ml-32 -mb-32" />

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-5">
            <Link to="/" className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-full transition-all duration-300 border border-white/10 mb-2 group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-400">{t('nav.home')}</span>
            </Link>
            <h1 className="font-display text-6xl md:text-8xl uppercase tracking-wider italic leading-none">{t('nav.menu')}</h1>
            <p className="text-zinc-400 font-medium max-w-lg text-lg">{t('about.default')}</p>
          </div>
          <div className="flex items-center gap-4">
            <LanguageToggle />
            <Link to="/pedir" className="bg-primary-vibrant text-white px-8 py-5 rounded-full font-display text-sm tracking-[0.2em] uppercase shadow-2xl shadow-primary-vibrant/30 hover:shadow-primary-vibrant/50 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-3">
              {t('nav.orderNow')}
              <HandPlatter className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Category Tabs */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-2xl z-30 border-b border-zinc-100">
        <div className="max-w-7xl mx-auto flex items-center gap-3 p-6 overflow-x-auto no-scrollbar scroll-smooth">
          {categories.map((cat) => (
            <motion.button key={cat.id} whileTap={{ scale: 0.95 }} onClick={() => setActiveCategory(cat.name)}
              className={`px-8 py-3.5 rounded-full text-[11px] font-bold uppercase tracking-[0.25em] transition-all duration-300 whitespace-nowrap ${
                activeCategory === cat.name
                  ? 'bg-primary-vibrant text-white shadow-xl shadow-primary-vibrant/30'
                  : 'bg-zinc-100 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600'
              }`}>
              {cat.name}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Menu Grid */}
      <main className="max-w-7xl mx-auto px-6 py-16 bg-gradient-to-br from-red-50/30 via-white to-red-50/20">
        {filteredItems.length === 0 ? (
          <div className="py-24 text-center space-y-6">
            <div className="w-24 h-24 bg-zinc-100 rounded-[32px] flex items-center justify-center mx-auto">
              <Tag className="w-12 h-12 text-zinc-300" />
            </div>
            <p className="text-zinc-400 font-display uppercase tracking-[0.3em] text-sm">{t('menu.empty')}</p>
          </div>
        ) : (
          <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {paginatedItems.map((item, idx) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.5 }} viewport={{ once: true }}
                onClick={() => setSelectedProduct(item)}
                className="bg-white rounded-2xl overflow-hidden border border-zinc-100 hover:border-primary-vibrant/20 shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer">
                <div className="relative h-64 overflow-hidden">
                  <img src={item.image || 'https://picsum.photos/seed/food/400/300'} alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" referrerPolicy="no-referrer" />
                  <div className="absolute top-4 left-4 bg-secondary-vibrant text-dark px-4 py-1.5 rounded-lg font-display text-lg tracking-wider shadow-lg">
                    ${item.price.toFixed(2)}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="p-6 space-y-3">
                  <h3 className="font-display text-xl uppercase tracking-wider text-dark line-clamp-1">{item.name}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed line-clamp-2">{item.description}</p>
                  <div className="flex items-center justify-between pt-3">
                    <span className={`px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-[0.2em] ${
                      item.inStock ? 'bg-zinc-100 text-zinc-500' : 'bg-red-50 text-red-500'
                    }`}>
                      {item.inStock ? activeCategory : t('menu.outOfStock')}
                    </span>
                    <Link to="/pedir" state={{ preAddProduct: item }} onClick={(e) => e.stopPropagation()}
                      className="w-11 h-11 bg-primary-vibrant rounded-xl flex items-center justify-center text-white hover:bg-primary-vibrant/90 transition-all duration-300 shadow-md shadow-primary-vibrant/20 group-hover:shadow-lg group-hover:shadow-primary-vibrant/30">
                      <HandPlatter className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="py-20 bg-dark text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-primary-vibrant/10 via-transparent to-transparent" />
        <div className="max-w-lg mx-auto space-y-6 relative z-10">
          <div className="w-20 h-20 bg-white/5 p-2 rounded-full shadow-2xl mx-auto flex items-center justify-center border border-white/10">
            {config.logo ? (
              <img src={config.logo || '/logo.png'} alt={config.name} referrerPolicy="no-referrer" className="w-full h-full object-cover rounded-full" />
            ) : (
              <Utensils className="w-8 h-8 text-zinc-500" />
            )}
          </div>
          <h2 className="font-display text-3xl uppercase tracking-wider italic">{config.name}</h2>
          <div className="flex justify-center gap-3">
            <div className="w-12 h-1 bg-primary-vibrant rounded-full" />
            <div className="w-12 h-1 bg-secondary-vibrant rounded-full" />
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {selectedProduct && (
          <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} showAddToCart={false} />
        )}
      </AnimatePresence>
      <PWAInstallPrompt />
    </div>
  );
}
