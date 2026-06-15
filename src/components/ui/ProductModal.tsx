import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { X, ShoppingBag } from "lucide-react";
import { Product, ProductChoice } from "../../types";
import { useLanguage } from "../../context/LanguageContext";

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart?: (product: Product, selectedChoices?: Record<string, string>) => void;
  showAddToCart?: boolean;
}

export function ProductModal({ product, onClose, onAddToCart, showAddToCart = true }: ProductModalProps) {
  const { t } = useLanguage();
  const [selectedChoices, setSelectedChoices] = useState<Record<string, string>>({});

  useEffect(() => {
    if (product?.choices) {
      const initial: Record<string, string> = {};
      product.choices.forEach((choice: ProductChoice) => {
        if (choice.options.length > 0) {
          initial[choice.name] = choice.options[0].name;
        }
      });
      setSelectedChoices(initial);
    } else {
      setSelectedChoices({});
    }
  }, [product]);

  if (!product) return null;

  const choices = product.choices || [];

  const getChoicePriceAdjust = (): number => {
    let adjust = 0;
    choices.forEach((choice: ProductChoice) => {
      const selected = selectedChoices[choice.name];
      if (selected) {
        const opt = choice.options.find(o => o.name === selected);
        if (opt?.priceAdjust) adjust += opt.priceAdjust;
      }
    });
    return adjust;
  };

  const totalPrice = product.price + getChoicePriceAdjust();

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product, Object.keys(selectedChoices).length > 0 ? selectedChoices : undefined);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6">
      {/* Backdrop */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
        className="absolute inset-0 bg-black/85" />

      {/* Modal Content */}
      <motion.div initial={{ opacity: 0, scale: 0.85, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, y: 30 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-3xl bg-dark-card rounded-3xl overflow-hidden shadow-2xl border border-white/5 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label={product.name}>

        {/* Close Button */}
        <button onClick={onClose}
          className="absolute top-5 right-5 z-10 w-12 h-12 bg-black/50 backdrop-blur-md rounded-2xl flex items-center justify-center text-white hover:bg-white/20 hover:rotate-90 transition-all duration-300 border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary-vibrant"
          aria-label="Cerrar">
          <X className="w-6 h-6" />
        </button>

        {/* Image */}
        <div className="w-full h-72 md:h-96 relative overflow-hidden">
          <img src={product.image} alt={product.name}
            loading="lazy" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-card via-dark-card/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <span className="inline-block bg-secondary-vibrant/10 text-secondary-vibrant font-display text-xs tracking-[0.4em] uppercase px-4 py-1.5 rounded-full border border-secondary-vibrant/20 mb-3">
              {t("featured.badge")}
            </span>
            <h2 className="font-display text-4xl md:text-5xl uppercase tracking-wider text-white leading-none drop-shadow-lg">
              {product.name}
            </h2>
          </div>
        </div>

        {/* Details */}
        <div className="p-8 md:p-10 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-1.5 bg-gradient-to-r from-primary-vibrant to-secondary-vibrant rounded-full" />
            <span className="font-display text-4xl text-secondary-vibrant tracking-wider">
              ${totalPrice.toFixed(2)}
            </span>
          </div>

          <p className="text-zinc-400 font-medium leading-relaxed text-sm md:text-base">
            {product.description}
          </p>

          {/* ── Choice Selectors ────────────────────────────── */}
          {choices.length > 0 && (
            <div className="space-y-4 pt-2 border-t border-white/5">
              {choices.map((choice: ProductChoice) => (
                <div key={choice.name} className="space-y-2">
                  <p className="text-[11px] uppercase font-black tracking-widest text-zinc-500">
                    {choice.name}
                    {choice.required && <span className="text-primary-vibrant ml-1">*</span>}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {choice.options.map((opt) => {
                      const isSelected = selectedChoices[choice.name] === opt.name;
                      return (
                        <button
                          key={opt.name}
                          type="button"
                          onClick={() => setSelectedChoices({ ...selectedChoices, [choice.name]: opt.name })}
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 border ${
                            isSelected
                              ? 'bg-gradient-to-r from-primary-vibrant to-secondary-vibrant text-white border-transparent shadow-lg shadow-primary-vibrant/20'
                              : 'bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {opt.name}
                          {opt.priceAdjust ? opt.priceAdjust > 0 ? ` (+$${opt.priceAdjust.toFixed(2)})` : ` (-$${Math.abs(opt.priceAdjust).toFixed(2)})` : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 pt-2">
            {showAddToCart && product.inStock && onAddToCart && (
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={handleAddToCart}
                className="flex-1 bg-gradient-to-r from-primary-vibrant to-secondary-vibrant text-white py-5 rounded-2xl font-display uppercase tracking-[0.2em] text-sm shadow-xl shadow-primary-vibrant/30 flex items-center justify-center gap-3 hover:shadow-primary-vibrant/50 transition-shadow duration-300">
                {t("nav.orderNow")}
                <ShoppingBag className="w-5 h-5" />
              </motion.button>
            )}
            {!product.inStock && (
              <span className="flex-1 bg-white/5 text-zinc-500 py-5 rounded-2xl font-display uppercase tracking-[0.2em] text-[11px] border border-white/5 text-center">
                {t("menu.outOfStock")}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
