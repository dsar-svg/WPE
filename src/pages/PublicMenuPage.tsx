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
import { OptimizedImage } from '../components/ui/OptimizedImage';
import { Product } from '../types';

export function PublicMenuPage() {
  const { menuItems, categories, config, isLoading } = useRestaurant();
  const { t, language } = useLanguage();
  const [activeCategory, setActiveCategory] = useState(categories[0]?.name || '');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

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
    <div className="min-h-screen bg-dark font-body selection:bg-primary-vibrant text-white">
      {/* Header */}
      <header className="bg-dark p-10 md:p-16 text-white relative overflow-hidden border-b-2 border-primary-vibrant/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary-vibrant/15 rounded-full blur-[60px] -mr-40 -mt-40 will-change-[filter]" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary-vibrant/10 rounded-full blur-[60px] -ml-32 -mb-32 will-change-[filter]" />

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
      <div className="sticky top-0 bg-dark/95 backdrop-blur-2xl z-30 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center gap-3 p-6 overflow-x-auto no-scrollbar scroll-smooth">
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.name)}
              className={`px-8 py-3.5 rounded-full text-[11px] font-bold uppercase tracking-[0.25em] transition-all duration-200 whitespace-nowrap ${
                activeCategory === cat.name
                  ? 'bg-gradient-to-r from-primary-vibrant to-secondary-vibrant text-white shadow-xl shadow-primary-vibrant/30'
                  : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-white/10'
              }`}>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Grid */}
      <main className="max-w-7xl mx-auto px-6 py-16 bg-gradient-to-br from-primary-vibrant/[0.05] via-dark to-secondary-vibrant/[0.03]">
        {filteredItems.length === 0 ? (
          <div className="py-24 text-center space-y-6">
            <div className="w-24 h-24 bg-white/5 rounded-2xl flex items-center justify-center mx-auto border border-white/10">
              <Tag className="w-12 h-12 text-zinc-600" />
            </div>
            <p className="text-zinc-500 font-display uppercase tracking-[0.3em] text-sm">{t('menu.empty')}</p>
          </div>
        ) : (
          <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {paginatedItems.map((item) => (
              <div key={item.id}
                onClick={() => setSelectedProduct(item)}
                className="bg-dark-card rounded-2xl overflow-hidden border-2 border-secondary-vibrant/20 hover:border-secondary-vibrant/50 shadow-sm hover:shadow-xl hover:shadow-secondary-vibrant/10 transition-all duration-200 group cursor-pointer">
                <div className="relative h-64 overflow-hidden">
                  <OptimizedImage
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full p-2"
                  />
                  <div className="absolute top-4 left-4 bg-secondary-vibrant text-dark px-4 py-1.5 rounded-lg font-display text-lg tracking-wider shadow-lg font-bold">
                    ${item.price.toFixed(2)}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-vibrant/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </div>
                <div className="p-6 space-y-3">
                  <h3 className="font-display text-xl uppercase tracking-wider text-white group-hover:text-secondary-vibrant transition-colors line-clamp-1">{item.name}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed line-clamp-2">{item.description}</p>
                  <div className="flex items-center justify-between pt-3 border-t-2 border-primary-vibrant/20">
                    <span className={`px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-[0.2em] ${
                      item.inStock ? 'bg-primary-vibrant/10 text-primary-vibrant' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {item.inStock ? activeCategory : t('menu.outOfStock')}
                    </span>
                    <Link to="/pedir" state={{ preAddProduct: item }} onClick={(e) => e.stopPropagation()}
                      className="w-11 h-11 bg-gradient-to-r from-primary-vibrant to-secondary-vibrant rounded-xl flex items-center justify-center text-white hover:shadow-lg hover:shadow-primary-vibrant/30 transition-all duration-200">
                      <HandPlatter className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="py-20 bg-dark text-white text-center relative overflow-hidden border-t-2 border-primary-vibrant/30">
        <div className="absolute inset-0 bg-gradient-to-t from-primary-vibrant/20 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-secondary-vibrant/10 to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary-vibrant via-secondary-vibrant to-primary-vibrant" />
        <div className="max-w-lg mx-auto space-y-6 relative z-10">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-vibrant/30 to-secondary-vibrant/30 p-2 rounded-full shadow-2xl mx-auto flex items-center justify-center border-2 border-secondary-vibrant/40">
            {config.logo ? (
              <img src={config.logo || '/logo.png'} alt={config.name} referrerPolicy="no-referrer" className="w-full h-full object-cover rounded-full" />
            ) : (
              <Utensils className="w-8 h-8 text-secondary-vibrant" />
            )}
          </div>
          <h2 className="font-display text-3xl uppercase tracking-wider text-secondary-vibrant">{config.name}</h2>
          <div className="flex justify-center gap-3">
            <div className="w-16 h-1.5 bg-gradient-to-r from-primary-vibrant to-secondary-vibrant rounded-full" />
          </div>
          <p className="text-zinc-500 text-xs font-medium tracking-wider">{t('menu.title')} {config.name}</p>
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
