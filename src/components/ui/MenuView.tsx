import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingCart, Plus, Tag, ArrowLeft } from "lucide-react";
import { Product, Location, Category } from "../../types";
import { useLanguage } from "../../context/LanguageContext";
import { ProductModal } from "./ProductModal";
import { Pagination } from "./Pagination";

interface MenuViewProps {
  onAddToCart: (p: Product) => void;
  cartCount: number;
  total: number;
  menuItems: Product[];
  categories: Category[];
  onOpenCart: () => void;
  location: Location;
  onBack: () => void;
  config: { name: string; logo: string };
}

export function MenuView({
  onAddToCart, cartCount, total, menuItems, categories, onOpenCart, location, onBack, config,
}: MenuViewProps) {
  const { t, language } = useLanguage();
  const [activeCategory, setActiveCategory] = useState(categories[0]?.name || "");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    if (!activeCategory && categories.length > 0) { setActiveCategory(categories[0].name); }
  }, [categories]);

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

  return (
    <div className="min-h-screen bg-[#0c0c0c] pb-32 flex flex-col font-body overflow-x-hidden">
      {/* Header */}
      <div className="bg-dark p-8 md:p-14 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary-vibrant/15 rounded-full blur-[100px] -mr-36 -mt-36" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary-vibrant/10 rounded-full blur-[80px] -ml-24 -mb-24" />

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <motion.button whileTap={{ scale: 0.9 }} onClick={onBack}
              className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-full transition-all duration-300 border border-white/10 mb-2 group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-400">{t("nav.home")}</span>
            </motion.button>
            <h1 className="font-display text-5xl md:text-6xl uppercase tracking-wider italic leading-none">
              {language === "es" ? location.name : t(`loc.${location.id}.name`)}
            </h1>
            <span className="text-secondary-vibrant font-display text-sm tracking-[0.3em] uppercase italic">{t("menu.welcome")}</span>
          </div>
        </div>
      </div>

      {/* Sticky Categories */}
      <div className="sticky top-0 bg-[#0c0c0c]/95 backdrop-blur-2xl z-30 border-b border-white/5">
        <div className="max-w-7xl mx-auto relative">
          <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#0c0c0c]/95 to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#0c0c0c]/95 to-transparent z-10 pointer-events-none" />
          <div className="flex items-center gap-3 p-5 overflow-x-auto no-scrollbar scroll-smooth">
            {categories.map((cat) => (
              <motion.button key={cat.id} whileTap={{ scale: 0.95 }} onClick={() => setActiveCategory(cat.name)}
                className={`px-8 py-3 rounded-full text-[11px] font-bold uppercase tracking-[0.25em] transition-all duration-300 whitespace-nowrap ${
                  activeCategory === cat.name
                    ? "bg-primary-vibrant text-white shadow-xl shadow-primary-vibrant/30"
                    : "bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-zinc-300"
                }`}>
                {cat.name}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Product List */}
      <div className="px-5 py-8 max-w-7xl mx-auto w-full flex-1 bg-gradient-to-b from-transparent via-primary-vibrant/[0.02] to-transparent">
        {filteredItems.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-white/5 rounded-[28px] flex items-center justify-center mx-auto border border-white/5">
              <Tag className="w-10 h-10 text-zinc-600" />
            </div>
            <p className="text-zinc-600 font-display uppercase tracking-[0.3em] text-sm">{t("menu.empty")}</p>
          </div>
        ) : (
          <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedItems.map((item, index) => (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06, duration: 0.4 }} key={item.id}
                onClick={() => setSelectedProduct(item)}
                className={`relative group bg-[#141414] p-3 rounded-2xl border transition-all duration-300 ${
                  item.inStock
                    ? "border-white/5 hover:border-secondary-vibrant/30 hover:shadow-xl hover:shadow-secondary-vibrant/5"
                    : "border-white/5 opacity-50 grayscale cursor-not-allowed"
                }`}>
                <div className="relative h-40 md:h-48 rounded-2xl overflow-hidden mb-3 bg-white/5">
                  <img src={item.image || "https://picsum.photos/seed/food/400/300"} alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" referrerPolicy="no-referrer" />
                  {!item.inStock && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                      <span className="bg-white/10 text-white text-[11px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider border border-white/20">
                        {t("menu.outOfStock")}
                      </span>
                    </div>
                  )}
                </div>
                <div className="px-3 pb-3 space-y-2.5">
                  <h3 className="font-display text-xl uppercase tracking-wider text-white group-hover:text-primary-vibrant transition-colors duration-300 line-clamp-1">
                    {item.name}
                  </h3>
                  <p className="text-zinc-500 text-xs md:text-sm font-medium leading-relaxed line-clamp-2 italic">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-display text-xl tracking-wider text-secondary-vibrant">${item.price.toFixed(2)}</span>
                    {item.inStock && (
                      <motion.button whileHover={{ scale: 1.1, rotate: 12 }} whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); onAddToCart(item); }}
                        className="w-10 h-10 bg-primary-vibrant text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary-vibrant/30 hover:shadow-primary-vibrant/50 transition-all duration-300">
                        <Plus className="w-5 h-5" strokeWidth={3} />
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Product Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)}
            onAddToCart={(p) => { onAddToCart(p); setSelectedProduct(null); }} showAddToCart={false} />
        )}
      </AnimatePresence>

      {/* Floating Cart Button */}
      {cartCount > 0 && (
        <motion.button initial={{ y: 100, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onOpenCart}
          className="fixed bottom-6 left-6 right-6 max-w-lg mx-auto text-white p-5 rounded-[28px] flex items-center justify-between z-40 group transition-all duration-300"
          style={{
            background: 'linear-gradient(135deg, rgba(203,32,39,0.95) 0%, rgba(139,15,21,0.95) 100%)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 60px rgba(203,32,39,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
          }}>
          <div className="flex items-center gap-4">
            <div className="relative bg-white/15 p-3 rounded-2xl backdrop-blur-md">
              <ShoppingCart className="w-6 h-6" />
              <motion.span key={cartCount} initial={{ scale: 1.5 }} animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 bg-secondary-vibrant text-dark text-[11px] font-bold w-6 h-6 rounded-xl flex items-center justify-center shadow-xl">
                {cartCount}
              </motion.span>
            </div>
            <div className="flex flex-col items-start">
              <span className="font-display text-lg uppercase tracking-wider leading-none">{t("menu.viewCart")}</span>
              <span className="text-[10px] font-medium text-white/60 uppercase tracking-[0.2em] mt-1">{t("menu.ready")}</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-secondary-vibrant font-display text-xs uppercase tracking-widest">{t("menu.total")}</span>
            <span className="text-2xl font-display tracking-wider leading-none">${total.toFixed(2)}</span>
          </div>
        </motion.button>
      )}
    </div>
  );
}
