import { useState, useMemo, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { Utensils, ArrowLeft, HandPlatter, Tag, List, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useRestaurant } from '../context/RestaurantContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageToggle } from '../components/ui/LanguageToggle';
import { ProductModal } from '../components/ui/ProductModal';
import { ChoiceSelectorModal } from '../components/ui/ChoiceSelectorModal';
import { PWAInstallPrompt } from '../components/ui/PWAInstallPrompt';
import { Pagination } from '../components/ui/Pagination';
import { OptimizedImage } from '../components/ui/OptimizedImage';
import { SEO } from '../components/ui/SEO';
import { BrandName } from '../components/ui/BrandName';
import { Product } from '../types';

export function PublicMenuPage() {
  const { menuItems, categories, config, isLoading } = useRestaurant();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState(categories[0]?.name || '');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [choiceProduct, setChoiceProduct] = useState<Product | null>(null);
  const [page, setPage] = useState(1);
  const [showCategories, setShowCategories] = useState(false);
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
      <SEO
        title="Menú - Platos y Precios"
        description="Explora el menú completo de Wallace Panda Express. Arroz chino, pollo agridulce, wonton, egg rolls, sopa y más. Precios accesibles y delivery rápido."
        canonical="/menu"
      />
      {/* Header */}
      <header className="bg-dark p-10 md:p-16 text-white relative overflow-hidden border-b-2 border-primary-vibrant/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary-vibrant/15 rounded-full blur-[40px] -mr-40 -mt-40" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary-vibrant/10 rounded-full blur-[40px] -ml-32 -mb-32" />

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

      {/* Mobile toggle button */}
      <button
        onClick={() => setShowCategories(!showCategories)}
        className="fixed bottom-6 left-6 z-50 lg:hidden w-14 h-14 bg-gradient-to-r from-primary-vibrant to-secondary-vibrant rounded-2xl flex items-center justify-center shadow-2xl shadow-primary-vibrant/40 transition-all duration-200 active:scale-90"
      >
        {showCategories ? <X className="w-6 h-6" /> : <List className="w-6 h-6" />}
      </button>

      {/* Mobile sidebar overlay */}
      {showCategories && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setShowCategories(false)} />
      )}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-dark/95 backdrop-blur-2xl border-r border-white/10 overflow-y-auto p-5 space-y-1.5 pt-6 transition-transform duration-300 ease-out lg:hidden ${
        showCategories ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {categories.map((cat) => (
          <button key={cat.id} onClick={() => { setActiveCategory(cat.name); setShowCategories(false); }}
            className={`w-full px-4 py-3 rounded-xl text-[11px] font-bold uppercase tracking-[0.25em] text-left transition-all duration-200 ${
              activeCategory === cat.name
                ? 'bg-gradient-to-r from-primary-vibrant to-secondary-vibrant text-white shadow-xl shadow-primary-vibrant/30'
                : 'text-zinc-400 hover:bg-white/5 hover:text-white'
            }`}>
            {cat.name}
          </button>
        ))}
      </aside>

      {/* Content: Sidebar (desktop) + Grid */}
      <div className="max-w-7xl mx-auto flex min-h-[60vh]">
        <aside className="sticky top-0 h-screen w-56 shrink-0 bg-dark/95 backdrop-blur-2xl z-30 border-r border-white/10 overflow-y-auto p-5 space-y-1.5 pt-6 max-lg:hidden">
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.name)}
              className={`w-full px-4 py-3 rounded-xl text-[11px] font-bold uppercase tracking-[0.25em] text-left transition-all duration-200 ${
                activeCategory === cat.name
                  ? 'bg-gradient-to-r from-primary-vibrant to-secondary-vibrant text-white shadow-xl shadow-primary-vibrant/30'
                  : 'text-zinc-400 hover:bg-white/5 hover:text-white'
              }`}>
              {cat.name}
            </button>
          ))}
        </aside>
        <main className="flex-1 min-w-0 px-6 py-16 bg-gradient-to-br from-primary-vibrant/[0.05] via-dark to-secondary-vibrant/[0.03]">
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
                onClick={() => {
                  if (item.choices && item.choices.length > 0) {
                    setChoiceProduct(item);
                  } else {
                    setSelectedProduct(item);
                  }
                }}
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
                    <button onClick={(e) => {
                        e.stopPropagation();
                        if (item.choices && item.choices.length > 0) {
                          setChoiceProduct(item);
                        } else {
                          navigate('/pedir', { state: { preAddProduct: item } });
                        }
                      }}
                      className="w-11 h-11 bg-gradient-to-r from-primary-vibrant to-secondary-vibrant rounded-xl flex items-center justify-center text-white hover:shadow-lg hover:shadow-primary-vibrant/30 transition-all duration-200">
                      <HandPlatter className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </main>
      </div>

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
          <h2 className="text-3xl uppercase"><BrandName className="text-3xl uppercase" theme="dark" /></h2>
          <div className="flex justify-center gap-3">
            <div className="w-16 h-1.5 bg-gradient-to-r from-primary-vibrant to-secondary-vibrant rounded-full" />
          </div>
          <p className="text-xs font-medium tracking-wider"><BrandName className="text-xs" theme="dark" /></p>
          <div className="flex items-center justify-center gap-3 text-zinc-500 text-xs">
            <Link to="/legal" className="hover:text-white transition-colors">{t('legal.terms.title')}</Link>
            <span className="text-zinc-700">|</span>
            <Link to="/legal#privacidad" className="hover:text-white transition-colors">{t('legal.privacy.title')}</Link>
          </div>
          <p className="text-zinc-600 text-[10px]">Created By Dario Medina</p>
        </div>
      </footer>

      <AnimatePresence>
        {selectedProduct && (
          <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} showAddToCart={false} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {choiceProduct && (
          <ChoiceSelectorModal
            product={choiceProduct}
            onClose={() => setChoiceProduct(null)}
            onConfirm={(selectedChoices) => {
              navigate('/pedir', { state: { preAddProduct: choiceProduct, preSelectedChoices: selectedChoices } });
              setChoiceProduct(null);
            }}
          />
        )}
      </AnimatePresence>
      <PWAInstallPrompt />
    </div>
  );
}
