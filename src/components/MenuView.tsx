
import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Plus, Tag, ArrowLeft, ChevronLeft, ChevronRight, Utensils } from 'lucide-react';
import { Product, Location, Category } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface MenuViewProps {
  onAddToCart: (p: Product) => void;
  cartCount: number;
  total: number;
  menuItems: Product[];
  categories: Category[];
  onOpenCart: () => void;
  location: Location;
  onBack: () => void;
  config: { name: string, logo: string };
}

export function MenuView({ onAddToCart, cartCount, total, menuItems, categories, onOpenCart, location, onBack, config }: MenuViewProps) {
  const { t, language } = useLanguage();
  const [activeCategory, setActiveCategory] = useState(categories[0]?.name || '');

  useEffect(() => {
    if (!activeCategory && categories.length > 0) {
      setActiveCategory(categories[0].name);
    }
  }, [categories]);

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => item.category === activeCategory);
  }, [activeCategory, menuItems]);

  return (
    <div className="min-h-screen bg-zinc-50 pb-32 flex flex-col font-sans overflow-x-hidden">
      {/* App Header */}
      <div className="vibrant-gradient p-8 pt-16 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-2xl -ml-16 -mb-16" />
        
        <div className="max-w-lg mx-auto flex items-center gap-6 relative z-10">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={onBack}
            className="p-3 bg-white/20 hover:bg-white/30 rounded-2xl transition-all shadow-lg backdrop-blur-md"
          >
            <ArrowLeft className="w-6 h-6" />
          </motion.button>
          
          <div className="flex-1 flex items-center gap-4">
            <div className="w-14 h-14 bg-white p-1 rounded-2xl shadow-2xl shrink-0">
              {config.logo ? (
                <img
                  src={config.logo}
                  alt={config.name}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <div className="w-full h-full rounded-xl bg-zinc-100 flex items-center justify-center">
                  <Utensils className="w-6 h-6 text-zinc-400" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <span className="text-secondary-vibrant font-black uppercase tracking-[0.2em] text-[10px] italic">{t('menu.welcome')}</span>
              <h2 className="text-xl font-black uppercase tracking-tighter leading-none">{language === 'es' ? location.name : t(`loc.${location.id}.name`)}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Categories */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-xl z-30 border-b border-zinc-100 shadow-xl shadow-zinc-200/20">
        <div className="max-w-lg mx-auto flex items-center gap-3 p-6 overflow-x-auto no-scrollbar scroll-smooth">
          {categories.map((cat) => (
            <motion.button
              key={cat.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveCategory(cat.name)}
              className={`px-8 py-3 rounded-[20px] text-xs font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${
                activeCategory === cat.name
                  ? 'bg-primary-vibrant text-white shadow-xl shadow-primary-vibrant/30 scale-105'
                  : 'bg-zinc-100 text-zinc-400 hover:bg-zinc-200'
              }`}
            >
              {cat.name}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Product List */}
      <div className="px-6 py-8 space-y-8 max-w-lg mx-auto w-full flex-1">
        {filteredItems.length === 0 ? (
          <div className="py-20 text-center space-y-4">
              <div className="w-20 h-20 bg-zinc-100 rounded-[32px] flex items-center justify-center mx-auto opacity-50">
                <Tag className="w-10 h-10 text-zinc-300" />
              </div>
              <p className="text-zinc-400 font-black uppercase tracking-widest text-xs">{t('menu.empty')}</p>
           </div>
        ) : filteredItems.map((item, index) => (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            key={item.id}
            className={`relative group bg-white p-5 rounded-[40px] border-2 transition-all shadow-xl hover:shadow-2xl ${
              item.inStock 
                ? 'border-white hover:border-secondary-vibrant shadow-zinc-200/50' 
                : 'border-zinc-100 bg-zinc-50 opacity-70 grayscale cursor-not-allowed'
            }`}
          >
            <div className="flex gap-6">
              <div className="w-28 h-28 md:w-32 md:h-32 shrink-0 relative rounded-[32px] overflow-hidden bg-zinc-100 shadow-inner group-hover:rotate-3 transition-transform">
                <img
                  src={item.image || 'https://picsum.photos/seed/food/400/300'}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                {!item.inStock && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="bg-white text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-lg">{t('menu.outOfStock')}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 flex flex-col justify-between py-1">
                <div>
                  <h3 className="font-black text-lg uppercase tracking-tight text-zinc-900 group-hover:text-primary-vibrant transition-colors">{item.name}</h3>
                  <p className="text-zinc-500 text-[11px] font-medium leading-relaxed mt-1 line-clamp-2 italic">
                    {item.description}
                  </p>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">{t('menu.price')}</span>
                    <span className="text-xl font-black text-primary-vibrant">
                      ${item.price.toFixed(2)}
                    </span>
                  </div>
                  {item.inStock && (
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 12 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => { e.stopPropagation(); onAddToCart(item); }}
                      className="w-12 h-12 vibrant-gradient text-white rounded-[20px] flex items-center justify-center shadow-lg shadow-primary-vibrant/30 group-hover:shadow-primary-vibrant/60 active:shadow-none transition-all"
                    >
                      <Plus className="w-7 h-7" strokeWidth={3} />
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
            {/* Brand accent */}
            <div className={`absolute top-1/2 -right-1 w-1.5 h-12 -translate-y-1/2 rounded-full transition-all ${
              activeCategory ? 'bg-secondary-vibrant' : 'bg-transparent'
            }`} />
          </motion.div>
        ))}
      </div>

      {/* Floating Cart Button */}
      {cartCount > 0 && (
        <motion.button
          initial={{ y: 100, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onOpenCart}
          className="fixed bottom-8 left-8 right-8 max-w-lg mx-auto vibrant-gradient text-white p-6 rounded-[32px] flex items-center justify-between shadow-[0_20px_50px_rgba(203,32,39,0.3)] z-40 group active:shadow-none transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="relative bg-white/20 p-3 rounded-2xl backdrop-blur-md">
              <ShoppingCart className="w-6 h-6" />
              <motion.span 
                key={cartCount}
                initial={{ scale: 1.5, backgroundColor: '#ffffff' }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 bg-secondary-vibrant text-black text-[10px] font-black w-6 h-6 rounded-xl flex items-center justify-center shadow-xl border-2 border-primary-vibrant"
              >
                {cartCount}
              </motion.span>
            </div>
            <div className="flex flex-col items-start translate-y-0.5">
              <span className="font-black text-lg uppercase tracking-tighter leading-none">{t('menu.viewCart')}</span>
              <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest mt-1">{t('menu.ready')}</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
             <span className="text-secondary-vibrant font-black text-xs uppercase tracking-widest mb-0.5">{t('menu.total')}</span>
             <span className="text-2xl font-black tracking-tighter leading-none">
               ${total.toFixed(2)}
             </span>
          </div>
        </motion.button>
      )}
    </div>
  );
}
