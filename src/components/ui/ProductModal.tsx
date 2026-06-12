import { motion, AnimatePresence } from "motion/react";
import { X, ShoppingBag, Utensils } from "lucide-react";
import { Product } from "../../types";
import { useLanguage } from "../../context/LanguageContext";

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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
        className="absolute inset-0 bg-black/85 backdrop-blur-md" />

      {/* Modal Content */}
      <motion.div initial={{ opacity: 0, scale: 0.85, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, y: 30 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-2xl bg-[#141414] rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row border border-white/5">

        {/* Close Button */}
        <button onClick={onClose}
          className="absolute top-5 right-5 z-10 w-11 h-11 bg-black/50 backdrop-blur-md rounded-xl flex items-center justify-center text-white hover:bg-white/20 hover:rotate-90 transition-all duration-300 border border-white/10">
          <X className="w-5 h-5" />
        </button>

        {/* Image Side */}
        <div className="w-full md:w-[55%] h-64 md:h-auto relative overflow-hidden">
          <img src={product.image} alt={product.name}
            loading="lazy" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-[#141414]" />
        </div>

        {/* Details Side */}
        <div className="w-full md:w-[45%] p-8 md:p-10 flex flex-col justify-center">
          <div className="space-y-6">
            <div className="space-y-3">
              <span className="text-secondary-vibrant font-display text-sm tracking-[0.4em] uppercase italic">
                {t("featured.badge")}
              </span>
              <h2 className="font-display text-3xl md:text-4xl uppercase tracking-wider text-white leading-none">
                {product.name}
              </h2>
              <div className="w-10 h-1 bg-primary-vibrant rounded-full" />
            </div>

            <p className="text-zinc-400 font-medium leading-relaxed italic text-sm">
              {product.description}
            </p>

            <div className="flex items-center justify-between pt-4">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-zinc-600 uppercase tracking-[0.2em]">{t("menu.price")}</span>
                <span className="font-display text-3xl text-secondary-vibrant tracking-wider">
                  ${product.price.toFixed(2)}
                </span>
              </div>
              {showAddToCart && product.inStock && onAddToCart && (
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => { onAddToCart(product); onClose(); }}
                  className="bg-primary-vibrant text-white px-7 py-4 rounded-xl font-display uppercase tracking-[0.2em] text-sm shadow-xl shadow-primary-vibrant/30 flex items-center gap-3 hover:shadow-primary-vibrant/50 transition-shadow duration-300">
                  {t("nav.orderNow")}
                  <ShoppingBag className="w-5 h-5" />
                </motion.button>
              )}
              {!product.inStock && (
                <span className="bg-white/5 text-zinc-500 px-6 py-3 rounded-xl font-display uppercase tracking-[0.2em] text-[11px] border border-white/5">
                  {t("menu.outOfStock")}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
