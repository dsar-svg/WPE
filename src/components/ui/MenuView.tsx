import { useState, useMemo, useEffect, useCallback, memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingCart, Plus, Tag, ArrowLeft, Check, List, X } from "lucide-react";
import { Product, Location, Category } from "../../types";
import { useLanguage } from "../../context/LanguageContext";
import { ProductModal } from "./ProductModal";
import { ChoiceSelectorModal } from "./ChoiceSelectorModal";
import { Pagination } from "./Pagination";
import { OptimizedImage } from "./OptimizedImage";

interface MenuViewProps {
  onAddToCart: (p: Product, selectedChoices?: string[]) => void;
  cartCount: number;
  total: number;
  menuItems: Product[];
  categories: Category[];
  onOpenCart: () => void;
  location: Location;
  onBack: () => void;
  config: { name: string; logo: string };
}

const ProductCard = memo(function ProductCard({
  item,
  isAdded,
  onSelect,
  onAddToCart,
}: {
  item: Product;
  isAdded: boolean;
  onSelect: () => void;
  onAddToCart: (e: React.MouseEvent) => void;
}) {
  const hasChoices = item.choices && item.choices.length > 0;

  return (
    <div
      onClick={onSelect}
      className={`relative group bg-dark p-3 rounded-2xl border-2 transition-all duration-200 ${
        item.inStock
          ? "border-secondary-vibrant/20 hover:border-secondary-vibrant/50 hover:shadow-lg hover:shadow-secondary-vibrant/10"
          : "border-white/5 opacity-50 grayscale cursor-not-allowed"
      }`}
    >
      <div className="relative h-40 md:h-48 rounded-2xl overflow-hidden mb-3 bg-dark-card">
<OptimizedImage
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full p-2"
                  />
        <div className="absolute top-2 right-2 bg-secondary-vibrant text-dark font-display text-lg tracking-wider px-3 py-1 rounded-lg shadow-lg font-bold">
          ${item.price.toFixed(2)}
        </div>
        {!item.inStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-red-500/20 text-red-400 text-[11px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider border border-red-500/30">
              Agotado
            </span>
          </div>
        )}
      </div>
      <div className="px-3 pb-3 space-y-2.5">
        <h3 className="font-display text-xl uppercase tracking-wider text-white group-hover:text-secondary-vibrant transition-colors duration-200 line-clamp-1">
          {item.name}
        </h3>
        <p className="text-zinc-500 text-xs md:text-sm font-medium leading-relaxed line-clamp-2">
          {item.description}
        </p>
        <div className="flex items-center justify-between pt-1 border-t-2 border-primary-vibrant/20">
          <span className="font-display text-xl tracking-wider text-secondary-vibrant">${item.price.toFixed(2)}</span>
          {item.inStock && (
            <button
              onClick={hasChoices ? (e) => { e.stopPropagation(); onSelect(); } : onAddToCart}
              className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-secondary-vibrant ${
                isAdded
                  ? "bg-green-500 text-white shadow-green-500/30"
                  : hasChoices
                    ? "bg-white/10 text-white hover:bg-white/15 border border-white/10"
                    : "bg-gradient-to-r from-primary-vibrant to-secondary-vibrant text-white shadow-primary-vibrant/30 hover:shadow-primary-vibrant/50 hover:scale-105 active:scale-95"
              }`}
            >
              {isAdded ? (
                <Check className="w-5 h-5" strokeWidth={3} />
              ) : (
                <Plus className="w-5 h-5" strokeWidth={3} />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

export function MenuView({
  onAddToCart, cartCount, total, menuItems, categories, onOpenCart, location, onBack, config: _config,
}: MenuViewProps) {
  const { t, language } = useLanguage();
  const [activeCategory, setActiveCategory] = useState(categories[0]?.name || "");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [choiceProduct, setChoiceProduct] = useState<Product | null>(null);
  const [page, setPage] = useState(1);
  const [addedItem, setAddedItem] = useState<string | null>(null);
  const [showCategories, setShowCategories] = useState(false);
  const ITEMS_PER_PAGE = 12;

  const handleAddToCart = useCallback((product: Product, selectedChoices?: string[]) => {
    onAddToCart(product, selectedChoices);
    setAddedItem(product.id);
    setTimeout(() => setAddedItem(null), 1500);
  }, [onAddToCart]);

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
    <div className="min-h-screen bg-dark-card pb-32 flex flex-col font-body overflow-x-hidden">
      {/* Header */}
      <div className="bg-dark p-8 md:p-14 text-white relative overflow-hidden border-b-2 border-secondary-vibrant/30">
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary-vibrant/25 rounded-full blur-[40px] -mr-36 -mt-36" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary-vibrant/20 rounded-full blur-[40px] -ml-24 -mb-24" />

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <button onClick={onBack}
              className="inline-flex items-center gap-2 bg-primary-vibrant/10 hover:bg-primary-vibrant/20 px-5 py-2.5 rounded-full transition-all duration-200 border border-primary-vibrant/20 mb-2 group">
              <ArrowLeft className="w-4 h-4 text-primary-vibrant group-hover:-translate-x-1 transition-transform duration-200" />
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary-vibrant">{t("nav.home")}</span>
            </button>
            <h1 className="font-display text-5xl md:text-6xl uppercase tracking-wider leading-none">
              {language === "es" ? location.name : t(`loc.${location.id}.name`)}
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-secondary-vibrant font-display text-sm tracking-[0.3em] uppercase bg-secondary-vibrant/10 px-3 py-1 rounded-full border border-secondary-vibrant/20">{t("menu.welcome")}</span>
            </div>
          </div>
        </div>
      </div>

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
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-dark backdrop-blur-2xl border-r border-white/10 overflow-y-auto p-5 space-y-1.5 pt-5 transition-transform duration-300 ease-out lg:hidden ${
        showCategories ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {categories.map((cat) => (
          <button key={cat.id} onClick={() => { setActiveCategory(cat.name); setShowCategories(false); }}
            className={`w-full px-4 py-3 rounded-xl text-[11px] font-bold uppercase tracking-[0.25em] text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-vibrant ${
              activeCategory === cat.name
                ? "bg-gradient-to-r from-primary-vibrant to-secondary-vibrant text-white shadow-xl shadow-primary-vibrant/30"
                : "text-zinc-500 hover:bg-white/5 hover:text-white"
            }`}>
            {cat.name}
          </button>
        ))}
      </aside>

      {/* Content: Sidebar (desktop) + Grid */}
      <div className="max-w-7xl mx-auto flex min-h-[60vh]">
        <aside className="sticky top-0 h-screen w-56 shrink-0 bg-dark z-30 border-r border-white/10 overflow-y-auto p-5 space-y-1.5 pt-5 max-lg:hidden">
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.name)}
              className={`w-full px-4 py-3 rounded-xl text-[11px] font-bold uppercase tracking-[0.25em] text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-vibrant ${
                activeCategory === cat.name
                  ? "bg-gradient-to-r from-primary-vibrant to-secondary-vibrant text-white shadow-xl shadow-primary-vibrant/30"
                  : "text-zinc-500 hover:bg-white/5 hover:text-white"
              }`}>
              {cat.name}
            </button>
          ))}
        </aside>
        <div className="flex-1 min-w-0 px-5 py-8 bg-gradient-to-b from-transparent via-primary-vibrant/[0.03] to-transparent">
        {filteredItems.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-primary-vibrant/10 rounded-xl flex items-center justify-center mx-auto border border-primary-vibrant/20">
              <Tag className="w-10 h-10 text-primary-vibrant" />
            </div>
            <p className="text-zinc-500 font-display uppercase tracking-[0.3em] text-sm">{t("menu.empty")}</p>
          </div>
        ) : (
          <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedItems.map((item) => (
              <ProductCard
                key={item.id}
                item={item}
                isAdded={addedItem === item.id}
                onSelect={() => {
                  if (item.choices && item.choices.length > 0) {
                    setChoiceProduct(item);
                  } else {
                    setSelectedProduct(item);
                  }
                }}
                onAddToCart={(e) => { e.stopPropagation(); handleAddToCart(item); }}
              />
            ))}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
      </div>

      {/* Product Modal (no choices) */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)}
            onAddToCart={(p) => { handleAddToCart(p); setSelectedProduct(null); }} showAddToCart={false} />
        )}
      </AnimatePresence>

      {/* Choice Selector Modal */}
      <AnimatePresence>
        {choiceProduct && (
          <ChoiceSelectorModal
            product={choiceProduct}
            onClose={() => setChoiceProduct(null)}
            onConfirm={(selectedChoices) => {
              handleAddToCart(choiceProduct, selectedChoices);
              setChoiceProduct(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Floating Cart Button */}
      {cartCount > 0 && (
        <motion.button initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          onClick={onOpenCart}
          className="fixed bottom-6 left-6 right-6 max-w-lg mx-auto text-white p-5 rounded-2xl flex items-center justify-between z-40 group transition-all duration-200"
          style={{
            background: 'linear-gradient(135deg, rgba(203,32,39,0.98) 0%, rgba(139,15,21,0.98) 100%)',
            boxShadow: '0 10px 30px rgba(203,32,39,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
          }}>
          <div className="flex items-center gap-4">
            <div className="relative bg-white/15 p-3 rounded-2xl">
              <ShoppingCart className="w-6 h-6" />
              <span
                className="absolute -top-2 -right-2 bg-secondary-vibrant text-dark text-[11px] font-bold w-6 h-6 rounded-xl flex items-center justify-center shadow-xl"
              >
                {cartCount}
              </span>
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
