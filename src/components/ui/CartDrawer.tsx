import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Plus, Minus, X, ArrowRight } from 'lucide-react';
import { CartItem } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { OptimizedImage } from './OptimizedImage';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  total: number;
  updateQuantity: (id: string, qty: number) => void;
  updateNotes: (id: string, notes: string) => void;
  onGoToCheckout: () => void;
}

export function CartDrawer({
  isOpen,
  onClose,
  items,
  total,
  updateQuantity,
  updateNotes,
  onGoToCheckout,
}: CartDrawerProps) {
  const { config } = useRestaurant();
  const { t } = useLanguage();

  const subtotalWithTax = total * (1 + (config.taxRate ?? 0));
  const totalVES = subtotalWithTax * (config.exchangeRate ?? 1);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 z-50 backdrop-blur-md"
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-dark-card rounded-t-[2rem] z-50 overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]"
            role="dialog"
            aria-modal="true"
            aria-label="Carrito de compras"
          >
            {/* Header */}
            <div className="p-5 sm:p-6 border-b-2 border-primary-vibrant/20 bg-dark-card relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-vibrant/20 rounded-full blur-xl -mr-16 -mt-16" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary-vibrant/15 rounded-full blur-lg -ml-12 -mb-12" />
              <div className="flex items-center justify-between relative z-10">
                <h2 className="font-display text-xl sm:text-2xl tracking-wider flex items-center gap-3 text-white">
                  <div className="w-10 h-10 bg-gradient-to-r from-primary-vibrant to-secondary-vibrant rounded-xl flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  {t('cart.title')}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 bg-white/10 hover:bg-primary-vibrant rounded-xl transition-all duration-300 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary-vibrant"
                  aria-label="Cerrar carrito"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-dark-card scroll-smooth pb-32 sm:pb-40">
              {items.length === 0 ? (
                <div className="py-24 text-center space-y-6">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="w-24 h-24 bg-primary-vibrant/10 rounded-2xl flex items-center justify-center mx-auto border border-primary-vibrant/20"
                  >
                    <ShoppingCart className="w-12 h-12 text-primary-vibrant" />
                  </motion.div>
                  <div className="space-y-2">
                    <p className="text-zinc-400 font-display uppercase text-sm tracking-[0.25em] leading-none">{t('cart.empty')}</p>
                    <p className="text-zinc-600 text-xs font-medium">{t('cart.emptyTagline')}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={item.id}
                      className="flex gap-3 bg-dark-card p-4 rounded-xl border border-white/10 group hover:border-primary-vibrant/20 transition-colors duration-300"
                    >
                      <div className="w-16 h-16 shrink-0 rounded-2xl overflow-hidden border border-white/10">
                        <OptimizedImage src={item.image} alt={item.name} className="w-full h-full p-1" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-bold text-sm text-white uppercase tracking-wider truncate">{item.name}</h3>
                          <p className="font-display text-secondary-vibrant text-sm tracking-wider">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1.5 bg-white/10 rounded-xl p-1 border border-white/10">
                            <motion.button
                              whileTap={{ scale: 0.8 }}
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-11 h-11 bg-white/10 hover:bg-white/15 rounded-lg flex items-center justify-center text-zinc-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-vibrant focus:ring-offset-1 focus:ring-offset-dark"
                              aria-label={`Decrease quantity of ${item.name}`}
                            >
                              <Minus className="w-4 h-4" />
                            </motion.button>
                            <span className="w-7 text-center font-bold text-sm text-white">{item.quantity}</span>
                            <motion.button
                              whileTap={{ scale: 0.8 }}
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-11 h-11 bg-primary-vibrant text-white rounded-lg flex items-center justify-center shadow-lg shadow-primary-vibrant/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-1 focus:ring-offset-primary-vibrant"
                              aria-label={`Increase quantity of ${item.name}`}
                            >
                              <Plus className="w-4 h-4" />
                            </motion.button>
                          </div>
                          <div className="flex-1 ml-3 relative">
                            <textarea
                              placeholder={t('cart.specialInstructions') + ' (ej: sin picante)'}
                              aria-label={t('cart.specialInstructions')}
                              value={item.notes}
                              onChange={(e) => updateNotes(item.id, e.target.value)}
                              className="w-full text-xs bg-white/5 border border-white/5 rounded-lg px-3 py-2 focus:border-primary-vibrant/50 outline-none transition-colors duration-200 resize-none min-h-[32px] text-zinc-300 placeholder:text-zinc-600"
                              rows={1}
                              maxLength={100}
                            />
                            {item.notes && <span className="absolute -bottom-4 right-0 text-[8px] text-zinc-600">{item.notes.length}/100</span>}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-4 sm:p-6 bg-dark-card border-t-2 border-secondary-vibrant/30 space-y-4">
                <div className="p-5 bg-dark-surface text-white rounded-xl space-y-3 relative overflow-hidden border-2 border-primary-vibrant/20">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary-vibrant/20 rounded-full blur-2xl -mr-16 -mt-16" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary-vibrant/15 rounded-full blur-xl -ml-12 -mb-12" />

                  <div className="space-y-1.5 pb-3 border-b-2 border-primary-vibrant/20">
                    <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-primary-vibrant">Resumen del Pedido</p>
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-[11px] text-zinc-300">
                        <span className="truncate flex-1">{item.quantity}x {item.name}</span>
                        <span className="font-medium text-white">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-end pb-2">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-secondary-vibrant mb-0.5">{t('cart.orderTotal')}</span>
                      <span className="font-display text-2xl sm:text-3xl tracking-wider leading-none text-white">
                        ${subtotalWithTax.toFixed(2)} <span className="text-[10px] text-zinc-400 ml-1 font-medium font-body">USD</span>
                      </span>
                      {(config.taxRate ?? 0) > 0 && (
                        <span className="text-[8px] text-zinc-500 uppercase tracking-widest mt-0.5">
                          {t('cart.includesTax')} ({((config.taxRate ?? 0) * 100).toFixed(1)}%)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-bold text-secondary-vibrant uppercase tracking-widest">{t('cart.inBolivares')}</span>
                      <span className="font-display text-lg sm:text-xl text-secondary-vibrant tracking-wider">
                        {totalVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}{' '}
                        <span className="text-[9px] font-body">Bs.</span>
                      </span>
                    </div>
                    <div className="bg-secondary-vibrant/10 px-3 py-1 rounded-full border border-secondary-vibrant/20">
                      <span className="text-[8px] text-secondary-vibrant font-bold uppercase">Tasa: {config.exchangeRate}</span>
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onGoToCheckout}
                  className="w-full vibrant-gradient text-white py-5 sm:py-6 rounded-[20px] font-display uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 shadow-[0_20px_50px_rgba(203,32,39,0.3)] transition-all duration-300 hover:shadow-[0_20px_60px_rgba(203,32,39,0.5)]"
                >
                  {t('cart.continue')} <ArrowRight className="w-5 h-5" />
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
