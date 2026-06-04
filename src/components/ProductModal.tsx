
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBag, Utensils } from 'lucide-react';
import { Product } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart?: (product: Product) => void;
  showAddToCart?: boolean;
}

export function ProductModal({ product, onClose, onAddToCart, showAddToCart = true }: ProductModalProps) {
  const { t, language } = useLanguage();

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Modal Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-2xl bg-white rounded-[48px] overflow-hidden shadow-2xl flex flex-col md:flex-row"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 w-12 h-12 bg-white/80 backdrop-blur-md rounded-2xl flex items-center justify-center text-zinc-800 hover:rotate-90 transition-transform shadow-lg"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Image Side */}
        <div className="w-full md:w-1/2 h-64 md:h-auto relative">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:hidden" />
        </div>

        {/* Details Side */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-secondary-vibrant font-black uppercase tracking-[0.3em] text-[10px] italic">
                {t('featured.badge')}
              </span>
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-zinc-900 leading-none">
                {product.name}
              </h2>
              <div className="w-12 h-1.5 bg-primary-vibrant rounded-full" />
            </div>

            <p className="text-zinc-500 font-medium leading-relaxed italic text-sm">
              {product.description}
            </p>

            <div className="flex items-center justify-between pt-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{t('menu.price')}</span>
                <span className="text-3xl font-black text-primary-vibrant">
                  ${product.price.toFixed(2)}
                </span>
              </div>

              {showAddToCart && product.inStock && onAddToCart && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    onAddToCart(product);
                    onClose();
                  }}
                  className="vibrant-gradient text-white px-8 py-4 rounded-[24px] font-black uppercase tracking-widest text-xs shadow-xl shadow-primary-vibrant/30 flex items-center gap-3"
                >
                  {t('nav.orderNow')} <ShoppingBag className="w-5 h-5" />
                </motion.button>
              )}

              {(!product.inStock) && (
                 <span className="bg-zinc-100 text-zinc-400 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px]">
                    {t('menu.outOfStock')}
                 </span>
              )}
            </div>
          </div>
          
          {/* Decoration */}
          <div className="absolute -bottom-10 -right-10 text-zinc-50 opacity-10 pointer-events-none">
            <Utensils className="w-40 h-40" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
