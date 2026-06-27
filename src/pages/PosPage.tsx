import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Minus, Trash2, ShoppingCart, X, Check, Printer, DollarSign, CreditCard, Smartphone, Banknote, QrCode, LogOut, User } from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';
import { Product, Cashier, POSCartItem, PaymentMethod } from '../types';
import { supabase } from '../lib/supabase';
import { OptimizedImage } from '../components/ui/OptimizedImage';

// ==============================
// PIN Login
// ==============================
function PosLogin({ onLogin }: { onLogin: (cashier: Cashier) => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDigit = (d: string) => {
    if (pin.length < 4) {
      setPin(p => p + d);
      setError('');
    }
  };

  const handleClear = () => setPin('');

  const handleDelete = () => setPin(p => p.slice(0, -1));

  useEffect(() => {
    if (pin.length !== 4) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('admins')
        .select('*')
        .eq('pin', pin)
        .limit(1)
        .maybeSingle();
      if (data) {
        onLogin({ id: data.id, name: data.name || data.email, email: data.email, employee_id: data.employee_id, location_id: data.location_id });
      } else {
        setError('PIN incorrecto');
        setPin('');
      }
      setLoading(false);
    })();
  }, [pin, onLogin]);

  const digits = [['1','2','3'],['4','5','6'],['7','8','9'],['', '0', 'del']];

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm bg-dark-card border border-zinc-800 rounded-3xl p-8 space-y-8"
      >
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-primary-vibrant/10 rounded-2xl flex items-center justify-center mx-auto">
            <User className="w-8 h-8 text-primary-vibrant" />
          </div>
          <h1 className="text-2xl font-black text-white">POS Cajera</h1>
          <p className="text-zinc-500 text-sm">Ingresa tu PIN de 4 dígitos</p>
        </div>

        <div className="space-y-2 text-center">
          <div className="flex justify-center gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all ${pin[i] ? 'bg-primary-vibrant border-primary-vibrant' : 'border-zinc-600'}`} />
            ))}
          </div>
          {error && <p className="text-red-400 text-xs font-bold">{error}</p>}
          {loading && <p className="text-zinc-500 text-xs animate-pulse">Verificando...</p>}
        </div>

        <div className="grid grid-cols-3 gap-3 max-w-[220px] mx-auto">
          {digits.flat().map((d, i) => (
            d === '' ? <div key={i} />
            : d === 'del' ? (
              <button key={i} onClick={handleDelete}
                className="h-14 rounded-xl bg-zinc-800 text-zinc-400 font-bold text-lg hover:bg-zinc-700 active:scale-95 transition-all"
              >
                <X className="w-5 h-5 mx-auto" />
              </button>
            ) : (
              <button key={i} onClick={() => handleDigit(d)}
                className="h-14 rounded-xl bg-zinc-800 text-white font-bold text-xl hover:bg-zinc-700 active:scale-95 transition-all"
              >
                {d}
              </button>
            )
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ==============================
// Payment Modal
// ==============================
function PaymentModal({
  total, onConfirm, onClose,
}: {
  total: number;
  onConfirm: (method: PaymentMethod, amountReceived: number, changeAmount: number) => void;
  onClose: () => void;
}) {
  const [method, setMethod] = useState<PaymentMethod>('Efectivo');
  const [amountReceived, setAmountReceived] = useState('');
  const changeAmount = method === 'Efectivo'
    ? Math.max(0, (parseFloat(amountReceived) || 0) - total)
    : 0;
  const isCashEnough = method !== 'Efectivo' || (parseFloat(amountReceived) || 0) >= total;

  const handleConfirm = () => {
    if (!isCashEnough) return;
    onConfirm(method, method === 'Efectivo' ? parseFloat(amountReceived) || 0 : total, changeAmount);
  };

  const methods: { key: PaymentMethod; icon: typeof DollarSign; label: string; color: string }[] = [
    { key: 'Efectivo', icon: Banknote, label: 'Efectivo', color: 'bg-green-500' },
    { key: 'Tarjeta', icon: CreditCard, label: 'Tarjeta', color: 'bg-blue-500' },
    { key: 'Transferencia', icon: Smartphone, label: 'Transferencia', color: 'bg-purple-500' },
    { key: 'QR', icon: QrCode, label: 'QR', color: 'bg-orange-500' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80"
    >
      <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-6"
      >
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-black text-white">Cobrar</h2>
          <button onClick={onClose} className="p-2 bg-zinc-800 rounded-full text-zinc-500 hover:text-white"><X /></button>
        </div>

        <div className="text-center py-4">
          <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Total a cobrar</p>
          <p className="text-5xl font-black text-white">${total.toFixed(2)}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {methods.map(m => (
            <button key={m.key} onClick={() => setMethod(m.key)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                method === m.key
                  ? 'border-primary-vibrant bg-primary-vibrant/10'
                  : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
              }`}
            >
              <m.icon className={`w-6 h-6 ${method === m.key ? 'text-primary-vibrant' : 'text-zinc-500'}`} />
              <span className={`font-bold text-sm ${method === m.key ? 'text-white' : 'text-zinc-500'}`}>{m.label}</span>
            </button>
          ))}
        </div>

        {method === 'Efectivo' && (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Monto recibido</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-lg">$</span>
                <input autoFocus type="number" step="0.01" min="0" value={amountReceived}
                  onChange={e => setAmountReceived(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 p-4 pl-8 rounded-2xl text-2xl font-black text-white outline-none focus:ring-2 focus:ring-primary-vibrant"
                  placeholder="0.00"
                />
              </div>
            </div>
            {parseFloat(amountReceived) > 0 && (
              <div className={`p-4 rounded-2xl text-center ${isCashEnough ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Vuelto</p>
                <p className={`text-3xl font-black ${isCashEnough ? 'text-green-400' : 'text-red-400'}`}>
                  ${changeAmount.toFixed(2)}
                </p>
              </div>
            )}
            <div className="flex gap-2">
              {[5, 10, 20, 50].map(n => (
                <button key={n} onClick={() => setAmountReceived((parseFloat(amountReceived) + n).toFixed(2))}
                  className="flex-1 py-2 bg-zinc-800 rounded-xl text-white font-bold text-sm hover:bg-zinc-700 transition-all"
                >
                  +${n}
                </button>
              ))}
            </div>
          </div>
        )}

        <button onClick={handleConfirm} disabled={!isCashEnough}
          className="w-full bg-primary-vibrant text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          <DollarSign className="w-5 h-5" />
          {method === 'Efectivo' ? `Cobrar $${total.toFixed(2)}` : `Cobrar con ${method}`}
        </button>
      </motion.div>
    </motion.div>
  );
}

// ==============================
// Receipt
// ==============================
function ReceiptModal({
  items, total, paymentMethod, changeAmount, cashierName, customerName, onClose, onNewSale,
}: {
  items: POSCartItem[];
  total: number;
  paymentMethod: PaymentMethod;
  changeAmount: number;
  cashierName: string;
  customerName: string;
  onClose: () => void;
  onNewSale: () => void;
}) {
  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const date = new Date().toLocaleString('es-SV');

  const handlePrint = () => {
    const w = window.open('', '', 'width=300,height=600');
    if (!w) return;
    w.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Recibo</title>
<style>
body { font-family: monospace; font-size: 12px; width: 280px; margin: 0 auto; padding: 10px; }
h2 { text-align: center; margin: 0; font-size: 16px; }
p { text-align: center; margin: 2px 0; font-size: 11px; }
table { width: 100%; border-collapse: collapse; margin: 10px 0; }
th, td { text-align: left; padding: 2px 4px; font-size: 11px; }
th { border-bottom: 1px dashed #000; }
td.r { text-align: right; }
.total td { border-top: 1px dashed #000; font-weight: bold; font-size: 13px; padding-top: 6px; }
hr { border: none; border-top: 1px dashed #000; margin: 8px 0; }
.footer { text-align: center; font-size: 10px; margin-top: 10px; }
</style></head><body>
<h2>Wallace Panda Express</h2>
<p>${date}</p>
<p>Cajera: ${cashierName}</p>
<p>Cliente: ${customerName}</p>
<hr>
<table>
<tr><th>Item</th><th class="r">Cant</th><th class="r">Precio</th></tr>
${items.map(i => `<tr><td>${i.product.name}</td><td class="r">${i.quantity}</td><td class="r">$${(i.product.price * i.quantity).toFixed(2)}</td></tr>`).join('')}
<tr class="total"><td>TOTAL</td><td></td><td class="r">$${total.toFixed(2)}</td></tr>
</table>
<hr>
<p>Método de pago: ${paymentMethod}</p>
${paymentMethod === 'Efectivo' ? `<p>Vuelto: $${changeAmount.toFixed(2)}</p>` : ''}
<hr>
<p class="footer">¡Gracias por su compra!</p>
<p class="footer">wallacepanda.com</p>
<script>window.print();window.close();</script>
</body></html>`);
    w.document.close();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80"
    >
      <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
        className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-6 text-center"
      >
        <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto">
          <Check className="w-8 h-8 text-green-400" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white">Venta Exitosa</h2>
          <p className="text-zinc-500 text-sm">${total.toFixed(2)} — ${paymentMethod}</p>
        </div>

        <div className="bg-zinc-950 rounded-2xl p-4 space-y-2 text-left text-sm max-h-40 overflow-y-auto">
          {items.map(i => (
            <div key={i.product.id} className="flex justify-between text-zinc-400">
              <span>{i.quantity}x {i.product.name}</span>
              <span className="text-white font-bold">${(i.product.price * i.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-zinc-800 pt-2 flex justify-between text-white font-black text-lg">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={handlePrint}
            className="flex-1 bg-zinc-800 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-zinc-700 transition-all flex items-center justify-center gap-2"
          >
            <Printer className="w-5 h-5" /> Imprimir
          </button>
          <button onClick={onNewSale}
            className="flex-1 bg-primary-vibrant text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all"
          >
            Nueva Venta
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ==============================
// Main POS Page
// ==============================
export function PosPage() {
  const { menuItems, categories, locations } = useRestaurant();
  const [cashier, setCashier] = useState<Cashier | null>(null);
  const [activeCategory, setActiveCategory] = useState('Todas');
  const [cart, setCart] = useState<POSCartItem[]>([]);
  const [search, setSearch] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryType, setDeliveryType] = useState<'Delivery' | 'Pick-up'>('Pick-up');
  const [showPayModal, setShowPayModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState<{
    items: POSCartItem[];
    total: number;
    paymentMethod: PaymentMethod;
    changeAmount: number;
  } | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState('');

  useEffect(() => {
    if (!selectedLocationId && locations.length > 0) {
      setSelectedLocationId(locations[0].id);
    }
  }, [locations, selectedLocationId]);

  const filteredProducts = useMemo(() => {
    let items = menuItems.filter(p => p.inStock);
    if (activeCategory !== 'Todas') items = items.filter(p => p.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.code && p.code.toLowerCase().includes(q))
      );
    }
    return items;
  }, [menuItems, activeCategory, search]);

  const cartTotal = useMemo(() => cart.reduce((s, i) => s + i.product.price * i.quantity, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);

  const addToCart = useCallback((product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1 }];
    });
  }, []);

  const updateQty = useCallback((productId: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.product.id !== productId) return i;
      const newQty = i.quantity + delta;
      return newQty <= 0 ? null : { ...i, quantity: newQty };
    }).filter(Boolean) as POSCartItem[]);
  }, []);

  const removeItem = useCallback((productId: string) => {
    setCart(prev => prev.filter(i => i.product.id !== productId));
  }, []);

  const handlePayment = useCallback(async (method: PaymentMethod, amountReceived: number, changeAmount: number) => {
    if (!cashier || !selectedLocationId || cart.length === 0) return;

    const orderItems = cart.map(i => ({
      id: i.product.id,
      name: i.product.name,
      price: i.product.price,
      quantity: i.quantity,
      notes: i.notes || '',
      selectedChoices: i.selectedChoices || [],
    }));

    try {
      const { error } = await supabase.from('orders').insert({
        location_id: selectedLocationId,
        customer_name: customerName || 'Mostrador',
        customer_phone: customerPhone || 'N/A',
        delivery_type: deliveryType,
        items: orderItems,
        subtotal: cartTotal,
        delivery_fee: 0,
        total: cartTotal,
        notes: '',
        payment_method: method,
        change_amount: changeAmount,
        cashier_id: cashier.id,
      });
      if (error) throw error;

      setShowPayModal(false);
      setShowReceipt({ items: cart, total: cartTotal, paymentMethod: method, changeAmount });
    } catch (err) {
      console.error('Error creating order:', err);
      alert('Error al procesar la venta');
    }
  }, [cashier, selectedLocationId, cart, cartTotal, customerName, customerPhone, deliveryType]);

  const handleNewSale = () => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setShowReceipt(null);
  };

  if (!cashier) return <PosLogin onLogin={setCashier} />;

  const locationName = locations.find(l => l.id === selectedLocationId)?.name || 'Seleccionar sede';

  return (
    <div className="h-screen bg-dark text-white flex flex-col font-body overflow-hidden">
      {/* Top bar */}
      <header className="bg-dark-card border-b border-zinc-800 px-4 md:px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="font-display text-xl uppercase tracking-wider text-white max-md:hidden">POS</h1>
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-primary-vibrant" />
            <span className="font-bold text-zinc-300">{cashier.name}</span>
          </div>
          <select value={selectedLocationId} onChange={e => setSelectedLocationId(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs font-bold text-zinc-300 outline-none"
          >
            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500 font-mono">{new Date().toLocaleTimeString('es-SV')}</span>
          <button onClick={() => setCashier(null)}
            className="p-2 bg-zinc-800 rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-700 transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Products */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search + Categories */}
          <div className="bg-dark-card border-b border-zinc-800 p-3 space-y-2 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar producto..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-primary-vibrant"
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
              <button onClick={() => setActiveCategory('Todas')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                  activeCategory === 'Todas' ? 'bg-primary-vibrant text-white' : 'bg-zinc-800 text-zinc-500 hover:text-white'
                }`}
              >
                Todas
              </button>
              {categories.map(cat => (
                <button key={cat.id} onClick={() => setActiveCategory(cat.name)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                    activeCategory === cat.name ? 'bg-primary-vibrant text-white' : 'bg-zinc-800 text-zinc-500 hover:text-white'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product grid */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
              {filteredProducts.map(product => (
                <button key={product.id} onClick={() => addToCart(product)}
                  className="bg-dark-card border border-zinc-800 hover:border-primary-vibrant/50 rounded-2xl p-2 text-left transition-all active:scale-95 hover:shadow-lg hover:shadow-primary-vibrant/5 relative"
                >
                  {product.code && (
                    <span className="absolute top-1 right-1 bg-zinc-800 text-zinc-500 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded z-10">{product.code}</span>
                  )}
                  <div className="aspect-square bg-zinc-900 rounded-xl overflow-hidden mb-2">
                    <OptimizedImage src={product.image} alt={product.name} className="w-full h-full p-1" />
                  </div>
                  <div className="px-1 space-y-1">
                    <div className="font-bold text-xs text-white leading-tight line-clamp-2 min-h-[2em]">{product.name}</div>
                    <div className="text-primary-vibrant font-black text-base">${product.price.toFixed(2)}</div>
                  </div>
                </button>
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full py-16 text-center text-zinc-600 text-sm">Sin productos</div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Cart */}
        <div className="w-80 bg-dark-card border-l border-zinc-800 flex flex-col flex-shrink-0 max-lg:hidden">
          <div className="p-4 border-b border-zinc-800 space-y-2 flex-shrink-0">
            <h2 className="font-black text-lg flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary-vibrant" />
              Venta
            </h2>
            <input value={customerName} onChange={e => setCustomerName(e.target.value)}
              placeholder="Cliente"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-primary-vibrant"
            />
            <div className="flex gap-2">
              <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                placeholder="Teléfono"
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-primary-vibrant"
              />
              <select value={deliveryType} onChange={e => setDeliveryType(e.target.value as any)}
                className="bg-zinc-900 border border-zinc-800 rounded-xl px-2 py-2 text-xs font-bold text-zinc-400 outline-none"
              >
                <option value="Pick-up">Para Llevar</option>
                <option value="Delivery">Delivery</option>
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {cart.length === 0 && (
              <div className="text-center py-12 text-zinc-600 text-sm">Carrito vacío</div>
            )}
            {cart.map(item => (
              <div key={item.product.id} className="bg-zinc-900 rounded-2xl p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-white truncate">{item.product.name}</div>
                  <div className="text-primary-vibrant font-black text-sm">${item.product.price.toFixed(2)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(item.product.id, -1)}
                    className="w-7 h-7 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-black text-sm w-5 text-center">{item.quantity}</span>
                  <button onClick={() => updateQty(item.product.id, 1)}
                    className="w-7 h-7 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button onClick={() => removeItem(item.product.id)}
                    className="w-7 h-7 bg-red-500/10 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-zinc-800 p-4 space-y-3 flex-shrink-0">
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 font-bold text-sm">Items:</span>
              <span className="font-bold text-white">{cartCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-lg font-black text-white">Total:</span>
              <span className="text-2xl font-black text-primary-vibrant">${cartTotal.toFixed(2)}</span>
            </div>
            <button onClick={() => setShowPayModal(true)} disabled={cart.length === 0}
              className="w-full bg-primary-vibrant text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <DollarSign className="w-5 h-5" /> Cobrar
            </button>
          </div>
        </div>
      </div>

      {/* Mobile cart button */}
      {cartCount > 0 && (
        <button onClick={() => setShowPayModal(true)}
          className="lg:hidden fixed bottom-4 left-4 right-4 bg-primary-vibrant text-white p-4 rounded-2xl font-black shadow-2xl shadow-primary-vibrant/30 z-40 flex items-center justify-between active:scale-[0.98] transition-transform"
        >
          <span className="flex items-center gap-2"><ShoppingCart className="w-5 h-5" /> {cartCount} items</span>
          <span className="text-lg">${cartTotal.toFixed(2)}</span>
        </button>
      )}

      {/* Payment modal */}
      <AnimatePresence>
        {showPayModal && (
          <PaymentModal total={cartTotal} onConfirm={handlePayment} onClose={() => setShowPayModal(false)} />
        )}
      </AnimatePresence>

      {/* Receipt modal */}
      <AnimatePresence>
        {showReceipt && (
          <ReceiptModal
            items={showReceipt.items}
            total={showReceipt.total}
            paymentMethod={showReceipt.paymentMethod}
            changeAmount={showReceipt.changeAmount}
            cashierName={cashier?.name || ''}
            customerName={customerName}
            onClose={() => setShowReceipt(null)}
            onNewSale={handleNewSale}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default PosPage;
