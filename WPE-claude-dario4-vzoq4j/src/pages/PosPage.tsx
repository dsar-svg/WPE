import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Minus, Trash2, ShoppingCart, X, Check, Printer, DollarSign, CreditCard, Smartphone, Banknote, LogOut, User, IdCard, Calendar, History, Loader2, QrCode } from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';
import { Product, Cashier, POSCartItem, PaymentMethod, Order } from '../types';
import { supabase } from '../lib/supabase';
import { OptimizedImage } from '../components/ui/OptimizedImage';
import { fetchBcvRate } from '../services/bcvRate';
import { ChoiceSelectorModal } from '../components/ui/ChoiceSelectorModal';

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
  total, onConfirm, onClose, exchangeRate,
}: {
  total: number;
  onConfirm: (method: PaymentMethod, amountReceived: number, changeAmount: number) => void;
  onClose: () => void;
  exchangeRate: number;
}) {
  const [method, setMethod] = useState<PaymentMethod>('Efectivo');
  const [amountReceived, setAmountReceived] = useState('');
  const [rate, setRate] = useState(exchangeRate);
  const [rateLoading, setRateLoading] = useState(false);

  useEffect(() => {
    setRateLoading(true);
    fetchBcvRate().then(r => {
      if (r && r > 0) setRate(r);
    }).finally(() => setRateLoading(false));
  }, []);

  const cashTotal = method === 'Efectivo' ? Math.ceil(total) : total;
  const changeAmount = method === 'Efectivo'
    ? Math.max(0, (parseFloat(amountReceived) || 0) - cashTotal)
    : 0;
  const isCashEnough = method !== 'Efectivo' || (parseFloat(amountReceived) || 0) >= cashTotal;
  const totalBs = total * rate;

  const handleConfirm = () => {
    if (!isCashEnough) return;
    onConfirm(method, method === 'Efectivo' ? parseFloat(amountReceived) || 0 : total, changeAmount);
  };

  const methods: { key: PaymentMethod; icon: typeof DollarSign; label: string; color: string }[] = [
    { key: 'Efectivo', icon: Banknote, label: 'Efectivo', color: 'bg-green-500' },
    { key: 'Tarjeta', icon: CreditCard, label: 'Tarjeta', color: 'bg-blue-500' },
    { key: 'PagoMóvil', icon: Smartphone, label: 'Pago Móvil', color: 'bg-purple-500' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80"
    >
      <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-6"
      >
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-black text-white">Cerrar Venta</h2>
          <button onClick={onClose} className="p-2 bg-zinc-800 rounded-full text-zinc-500 hover:text-white"><X /></button>
        </div>

        <div className="text-center py-4">
          <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Total a cobrar</p>
          <p className="text-5xl font-black text-white">${total.toFixed(2)}</p>
          {method !== 'Efectivo' && (
            <div className="mt-3 p-3 bg-primary-vibrant/10 rounded-xl border border-primary-vibrant/20 space-y-1">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Total en Bs.</p>
              <p className="text-3xl font-black text-primary-vibrant">
                {totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.
              </p>
              <div className="flex items-center justify-center gap-1.5">
                <p className="text-[10px] text-zinc-500">Tasa BCV: {rate.toFixed(2)}</p>
                {rateLoading && <Loader2 className="w-3 h-3 text-zinc-500 animate-spin" />}
              </div>
            </div>
          )}
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
            <div className="p-3 bg-primary-vibrant/10 rounded-xl border border-primary-vibrant/20 text-center">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Total redondeado</p>
              <p className="text-2xl font-black text-primary-vibrant">${cashTotal.toFixed(2)}</p>
            </div>
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
          {method === 'Efectivo' ? `Cerrar venta $${total.toFixed(2)}` : `Cerrar venta con ${method}`}
        </button>
      </motion.div>
    </motion.div>
  );
}

// ==============================
// Receipt
// ==============================
function ReceiptModal({
  items, total, paymentMethod, changeAmount, cashierName, customerName, customerCedula, invoiceNumber, config, locationName, onClose: _onClose, onNewSale,
}: {
  items: POSCartItem[];
  total: number;
  paymentMethod: PaymentMethod;
  changeAmount: number;
  cashierName: string;
  customerName: string;
  customerCedula?: string;
  invoiceNumber?: string;
  config: { rif?: string; businessAddress?: string; businessPhone?: string; name?: string };
  locationName: string;
  onClose: () => void;
  onNewSale: () => void;
}) {
  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const date = new Date().toLocaleString('es-VE');
  const taxRate = 0.16; // 16% IVA / ITBMS
  const taxAmount = subtotal * taxRate;
  const subtotalWithoutTax = subtotal / (1 + taxRate);

  const handlePrint = () => {
    const w = window.open('', '', 'width=380,height=700');
    if (!w) return;
    w.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Factura</title>
<style>
body { font-family: 'Courier New', monospace; font-size: 11px; width: 290px; margin: 0 auto; padding: 8px; }
h2 { text-align: center; margin: 0; font-size: 15px; text-transform: uppercase; }
h3 { text-align: center; margin: 2px 0; font-size: 12px; }
p { text-align: center; margin: 1px 0; font-size: 10px; }
table { width: 100%; border-collapse: collapse; margin: 8px 0; }
th, td { text-align: left; padding: 2px 3px; font-size: 10px; }
th { border-bottom: 1px dashed #000; }
td.r { text-align: right; }
td.c { text-align: center; }
.total td { border-top: 1px dashed #000; font-weight: bold; font-size: 12px; padding-top: 4px; }
hr { border: none; border-top: 1px dashed #000; margin: 6px 0; }
.footer { text-align: center; font-size: 9px; margin-top: 6px; }
.left { text-align: left; }
</style></head><body>
<h2>${config.name || 'Wallace Panda Express'}</h2>
${config.rif ? `<p>RIF: ${config.rif}</p>` : ''}
${config.businessAddress ? `<p>${config.businessAddress}</p>` : ''}
${config.businessPhone ? `<p>Tel: ${config.businessPhone}</p>` : ''}
<p>${locationName}</p>
<hr>
<p><strong>FACTURA</strong> ${invoiceNumber ? `N° ${invoiceNumber}` : ''}</p>
<p>${date}</p>
<p>Cajero/a: ${cashierName}</p>
<p>Cliente: ${customerName}${customerCedula ? ` — C.I: V-${customerCedula}` : ''}</p>
<hr>
<table>
<tr><th>Item</th><th class="c">Cant</th><th class="r">Precio</th></tr>
${items.map(i => `<tr><td>${i.product.name}</td><td class="c">${i.quantity}</td><td class="r">$${(i.product.price * i.quantity).toFixed(2)}</td></tr>`).join('')}
</table>
<hr>
<table>
<tr><td>Subtotal (sin IVA)</td><td class="r">$${subtotalWithoutTax.toFixed(2)}</td></tr>
<tr><td>IVA 16%</td><td class="r">$${taxAmount.toFixed(2)}</td></tr>
<tr><td>Subtotal</td><td class="r">$${subtotal.toFixed(2)}</td></tr>
<tr class="total"><td>TOTAL</td><td class="r">$${total.toFixed(2)}</td></tr>
</table>
<hr>
<p>Método de pago: ${paymentMethod}</p>
${paymentMethod === 'Efectivo' ? `<p>Recibido: $${(total + changeAmount).toFixed(2)}</p><p>Vuelto: $${changeAmount.toFixed(2)}</p>` : ''}
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
        className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4"
      >
        <div className="text-center">
          <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Check className="w-7 h-7 text-green-400" />
          </div>
          <h2 className="text-xl font-black text-white">Venta Exitosa</h2>
          {invoiceNumber && (
            <p className="text-[10px] text-primary-vibrant font-bold mt-1">Factura N° {invoiceNumber}</p>
          )}
        </div>

        {/* Invoice details */}
        <div className="bg-zinc-950 rounded-2xl p-3 space-y-1.5 text-[11px]">
          {config.rif && (
            <div className="flex justify-between text-zinc-500">
              <span>RIF</span>
              <span className="text-zinc-300 font-bold">{config.rif}</span>
            </div>
          )}
          <div className="flex justify-between text-zinc-500">
            <span>Cliente</span>
            <span className="text-zinc-300 font-bold">{customerName}{customerCedula ? ` V-${customerCedula}` : ''}</span>
          </div>
          <div className="flex justify-between text-zinc-500">
            <span>Método</span>
            <span className="text-zinc-300 font-bold">{paymentMethod}</span>
          </div>
          {paymentMethod === 'Efectivo' && changeAmount > 0 && (
            <div className="flex justify-between text-zinc-500">
              <span>Vuelto</span>
              <span className="text-green-400 font-bold">${changeAmount.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="bg-zinc-950 rounded-2xl p-3 space-y-1.5 text-sm max-h-36 overflow-y-auto">
          {items.map(i => (
            <div key={i.product.id} className="flex justify-between text-zinc-400">
              <span className="truncate flex-1">{i.quantity}x {i.product.name}</span>
              <span className="text-white font-bold ml-2">${(i.product.price * i.quantity).toFixed(2)}</span>
            </div>
          ))}
          <hr className="border-zinc-800" />
          <div className="flex justify-between text-[11px] text-zinc-500">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[11px] text-zinc-500">
            <span>IVA 16%</span>
            <span>${taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-white font-black text-base border-t border-zinc-800 pt-1.5 mt-1.5">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={handlePrint}
            className="flex-1 bg-zinc-800 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-700 transition-all flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" /> Imprimir
          </button>
          <button onClick={onNewSale}
            className="flex-1 bg-primary-vibrant text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all"
          >
            Nueva Venta
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ==============================
// Corte de Caja (Daily Closure)
// ==============================
function CorteDeCajaModal({
  orders, locationId, locationName, onClose,
}: {
  orders: Order[];
  locationId: string;
  locationName: string;
  onClose: () => void;
}) {
  const todayOrders = useMemo(() => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return orders.filter(o =>
      o.location_id === locationId &&
      o.status !== 'cancelado' &&
      new Date(o.created_at) >= startOfDay
    );
  }, [orders, locationId]);

  const totalEfectivo = todayOrders.filter(o => o.payment_method === 'Efectivo').reduce((s, o) => s + o.total, 0);
  const totalTarjeta = todayOrders.filter(o => o.payment_method === 'Tarjeta').reduce((s, o) => s + o.total, 0);
  const totalPagoMovil = todayOrders.filter(o => o.payment_method === 'PagoMóvil').reduce((s, o) => s + o.total, 0);
  const granTotal = todayOrders.reduce((s, o) => s + o.total, 0);
  const count = todayOrders.length;

  const dateStr = new Date().toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80"
    >
      <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-black text-white">Corte de Caja</h2>
          <button onClick={onClose} className="p-2 bg-zinc-800 rounded-xl text-zinc-500 hover:text-white"><X /></button>
        </div>

        <div className="text-center pb-2 border-b border-zinc-800">
          <p className="text-lg font-black text-white">{locationName}</p>
          <p className="text-xs text-zinc-500">{dateStr}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-zinc-950 rounded-2xl p-4 text-center">
            <ShoppingCart className="w-5 h-5 text-primary-vibrant mx-auto mb-1" />
            <p className="text-2xl font-black text-white">{count}</p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Pedidos</p>
          </div>
          <div className="bg-zinc-950 rounded-2xl p-4 text-center">
            <DollarSign className="w-5 h-5 text-green-400 mx-auto mb-1" />
            <p className="text-2xl font-black text-green-400">${granTotal.toFixed(2)}</p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Total</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Desglose por método</p>
          {[
            { method: 'Efectivo', total: totalEfectivo, icon: Banknote, color: 'text-green-400' },
            { method: 'Tarjeta', total: totalTarjeta, icon: CreditCard, color: 'text-blue-400' },
            { method: 'Pago Móvil', total: totalPagoMovil, icon: Smartphone, color: 'text-purple-400' },
          ].map(({ method, total: t, icon: Icon, color }) => (
            <div key={method} className="flex items-center justify-between bg-zinc-950 p-3 rounded-xl">
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-sm font-bold text-zinc-300">{method}</span>
              </div>
              <span className={`font-black ${color}`}>${t.toFixed(2)}</span>
            </div>
          ))}
        </div>

        {todayOrders.length > 0 && (
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 sticky top-0 bg-zinc-900 pb-1">Últimos pedidos</p>
            {todayOrders.slice(0, 10).map(o => (
              <div key={o.id} className="flex items-center justify-between text-xs text-zinc-400 bg-zinc-950 p-2 rounded-lg">
                <span className="truncate flex-1">{o.customer_name}</span>
                <span className="text-zinc-600 mx-2">{o.payment_method}</span>
                <span className="font-bold text-white">${o.total.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}

        <button onClick={onClose}
          className="w-full bg-zinc-800 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-700 transition-all"
        >
          Cerrar
        </button>
      </motion.div>
    </motion.div>
  );
}

// ==============================
// Invoice History
// ==============================
function InvoiceHistoryModal({
  orders, locationId, onClose,
}: {
  orders: Order[];
  locationId: string;
  onClose: () => void;
}) {
  const [searchCedula, setSearchCedula] = useState('');
  const [searchName, setSearchName] = useState('');

  const filtered = useMemo(() => {
    let result = orders.filter(o => o.location_id === locationId && o.invoice_number);
    if (searchCedula.trim()) {
      result = result.filter(o => o.cedula?.includes(searchCedula.trim()));
    }
    if (searchName.trim()) {
      const q = searchName.toLowerCase();
      result = result.filter(o => o.customer_name.toLowerCase().includes(q));
    }
    return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [orders, locationId, searchCedula, searchName]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  const handleReprint = (order: Order) => {
    const w = window.open('', '', 'width=380,height=700');
    if (!w) return;
    const items = order.items as Array<{ name: string; quantity: number; price: number }>;
    w.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Factura</title>
<style>
body { font-family: 'Courier New', monospace; font-size: 11px; width: 290px; margin: 0 auto; padding: 8px; }
h2 { text-align: center; margin: 0; font-size: 14px; }
p { text-align: center; margin: 1px 0; font-size: 10px; }
table { width: 100%; border-collapse: collapse; margin: 6px 0; }
th, td { text-align: left; padding: 2px 3px; font-size: 10px; }
th { border-bottom: 1px dashed #000; }
td.r { text-align: right; }
td.c { text-align: center; }
.total td { border-top: 1px dashed #000; font-weight: bold; font-size: 12px; }
hr { border: none; border-top: 1px dashed #000; margin: 4px 0; }
.footer { text-align: center; font-size: 9px; }
</style></head><body>
<h2>FACTURA ${order.invoice_number || ''}</h2>
<p>${formatDate(order.created_at)}</p>
<p>Cliente: ${order.customer_name}${order.cedula ? ` V-${order.cedula}` : ''}</p>
<p>${order.delivery_type}${order.delivery_address ? ` — ${order.delivery_address}` : ''}</p>
<hr>
<table>
<tr><th>Item</th><th class="c">Cant</th><th class="r">Precio</th></tr>
${items.map(i => `<tr><td>${i.name}</td><td class="c">${i.quantity}</td><td class="r">$${(i.price * i.quantity).toFixed(2)}</td></tr>`).join('')}
</table>
<hr>
<table>
<tr><td>Subtotal</td><td class="r">$${order.subtotal.toFixed(2)}</td></tr>
<tr><td>Delivery</td><td class="r">$${order.delivery_fee.toFixed(2)}</td></tr>
<tr class="total"><td>TOTAL</td><td class="r">$${order.total.toFixed(2)}</td></tr>
</table>
<hr>
<p>Método: ${order.payment_method || 'N/A'}</p>
${order.change_amount && order.change_amount > 0 ? `<p>Vuelto: $${order.change_amount.toFixed(2)}</p>` : ''}
<hr>
<p class="footer">wallacepanda.com</p>
<script>window.print();</script>
</body></html>`);
    w.document.close();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80"
    >
      <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
        className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 max-h-[90vh] flex flex-col"
      >
        <div className="flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-black text-white">Historial de Facturas</h2>
          <button onClick={onClose} className="p-2 bg-zinc-800 rounded-xl text-zinc-500 hover:text-white"><X /></button>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <input value={searchCedula} onChange={e => setSearchCedula(e.target.value)}
            placeholder="Cédula..."
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-primary-vibrant"
          />
          <input value={searchName} onChange={e => setSearchName(e.target.value)}
            placeholder="Nombre..."
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-primary-vibrant"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-zinc-600 text-sm">Sin facturas</div>
          ) : (
            filtered.map(o => (
              <div key={o.id} className="flex items-center justify-between bg-zinc-950 p-3 rounded-xl hover:bg-zinc-900 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-primary-vibrant">{o.invoice_number}</span>
                    <span className="text-xs text-zinc-600">{formatDate(o.created_at)}</span>
                  </div>
                  <p className="text-sm font-bold text-white truncate">{o.customer_name}</p>
                  <p className="text-[10px] text-zinc-500">${o.total.toFixed(2)} · {o.payment_method}</p>
                </div>
                <button onClick={() => handleReprint(o)}
                  className="p-2 bg-zinc-800 rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-700 transition-all flex-shrink-0"
                  title="Reimprimir"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ==============================
// Main POS Page
// ==============================
export function PosPage() {
  const { menuItems, categories, locations, config, orders, findCustomer, saveCustomer, generateInvoiceNumber } = useRestaurant();
  const [cashier, setCashier] = useState<Cashier | null>(null);
  const [activeCategory, setActiveCategory] = useState('Todas');
  const [cart, setCart] = useState<POSCartItem[]>([]);
  const [search, setSearch] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCedula, setCustomerCedula] = useState('');
  const [isLookingUpCustomer, setIsLookingUpCustomer] = useState(false);
  const [deliveryType, setDeliveryType] = useState<'Delivery' | 'Pick-up'>('Pick-up');
  const [showPayModal, setShowPayModal] = useState(false);
  const [showCorteDeCaja, setShowCorteDeCaja] = useState(false);
  const [showInvoiceHistory, setShowInvoiceHistory] = useState(false);
  const [showReceipt, setShowReceipt] = useState<{
    items: POSCartItem[];
    total: number;
    paymentMethod: PaymentMethod;
    changeAmount: number;
    invoiceNumber: string;
  } | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [choiceProduct, setChoiceProduct] = useState<Product | null>(null);
  const [orderCode, setOrderCode] = useState('');
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [orderCodeError, setOrderCodeError] = useState('');

  const isFormValid =
    customerCedula.trim().length >= 6 &&
    customerName.trim().length > 0 &&
    customerPhone.startsWith('04') &&
    customerPhone.replace(/\D/g, '').length >= 7;

  useEffect(() => {
    if (!selectedLocationId && locations.length > 0) {
      setSelectedLocationId(locations[0].id);
    }
  }, [locations, selectedLocationId]);

  // Lookup customer by cedula
  const cedulaLookupRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (cedulaLookupRef.current) clearTimeout(cedulaLookupRef.current);
    if (!customerCedula || customerCedula.length < 6) return;
    setIsLookingUpCustomer(true);
    cedulaLookupRef.current = setTimeout(async () => {
      try {
        const found = await findCustomer(customerCedula);
        if (found) {
          setCustomerName(found.name);
          setCustomerPhone(found.phone);
        }
      } catch { /* cedula lookup failed silently */ }
      setIsLookingUpCustomer(false);
    }, 400);
    return () => { if (cedulaLookupRef.current) clearTimeout(cedulaLookupRef.current); };
  }, [customerCedula, findCustomer]);

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

  const addToCart = useCallback((product: Product, selectedChoices?: string[]) => {
    setCart(prev => {
      const choices = selectedChoices && selectedChoices.length > 0 ? [...selectedChoices].sort() : [];
      const key = product.id + '|' + choices.join(',');
      const existing = prev.find(i => {
        const ik = i.product.id + '|' + (i.selectedChoices ? [...i.selectedChoices].sort().join(',') : '');
        return ik === key;
      });
      if (existing) {
        return prev.map(i => {
          const ik = i.product.id + '|' + (i.selectedChoices ? [...i.selectedChoices].sort().join(',') : '');
          return ik === key ? { ...i, quantity: i.quantity + 1 } : i;
        });
      }
      return [...prev, { product, quantity: 1, selectedChoices: choices.length > 0 ? choices : undefined }];
    });
  }, []);

  const handleProductClick = useCallback((product: Product) => {
    if (product.choices && product.choices.length > 0) {
      setChoiceProduct(product);
    } else {
      addToCart(product);
    }
  }, [addToCart]);

  const getItemKey = (item: POSCartItem) =>
    item.product.id + '|' + (item.selectedChoices ? [...item.selectedChoices].sort().join(',') : '');

  const updateQty = useCallback((key: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (getItemKey(i) !== key) return i;
      const newQty = i.quantity + delta;
      return newQty <= 0 ? null : { ...i, quantity: newQty };
    }).filter(Boolean) as POSCartItem[]);
  }, []);

  const removeItem = useCallback((key: string) => {
    setCart(prev => prev.filter(i => getItemKey(i) !== key));
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
      const invoiceNumber = await generateInvoiceNumber(selectedLocationId);

      const { error } = await supabase.from('orders').insert({
        location_id: selectedLocationId,
        customer_name: customerName || 'Mostrador',
        customer_phone: customerPhone || 'N/A',
        cedula: customerCedula || '',
        delivery_type: deliveryType,
        items: orderItems,
        subtotal: cartTotal,
        delivery_fee: 0,
        total: cartTotal,
        notes: '',
        status: 'exitoso',
        payment_method: method,
        change_amount: changeAmount,
        cashier_id: cashier.id,
        invoice_number: invoiceNumber,
      });
      if (error) throw error;

      await saveCustomer({ cedula: customerCedula, name: customerName || 'Mostrador', phone: customerPhone || 'N/A' });

      setShowPayModal(false);
      setShowReceipt({ items: cart, total: cartTotal, paymentMethod: method, changeAmount, invoiceNumber });
    } catch (err) {
      console.error('Error creating order:', err);
      alert('Error al procesar la venta');
    }
  }, [cashier, selectedLocationId, cart, cartTotal, customerName, customerPhone, customerCedula, deliveryType, generateInvoiceNumber, saveCustomer]);

  const handleNewSale = () => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerCedula('');
    setOrderCode('');
    setOrderCodeError('');
    setShowReceipt(null);
  };

  const handleLoadOrderByCode = useCallback(async () => {
    const code = orderCode.trim().toUpperCase();
    if (!code) return;
    setIsLoadingOrder(true);
    setOrderCodeError('');
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('order_code', code)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        setOrderCodeError('Código no encontrado');
        setIsLoadingOrder(false);
        return;
      }

      // Fill customer data
      if (data.customer_name) setCustomerName(data.customer_name);
      if (data.customer_phone) setCustomerPhone(data.customer_phone);
      if (data.cedula) setCustomerCedula(data.cedula);

      // Fill cart with order items mapped to POS products
      const newCart: POSCartItem[] = [];
      for (const orderItem of (data.items as any[])) {
        const product = menuItems.find(p => p.id === orderItem.id);
        if (product) {
          newCart.push({
            product,
            quantity: orderItem.quantity,
            notes: orderItem.notes || '',
            selectedChoices: orderItem.selectedChoices || [],
          });
        } else {
          // Product no longer exists — create a stub so it still shows
          newCart.push({
            product: {
              id: orderItem.id,
              name: orderItem.name,
              price: orderItem.price,
              description: '',
              category: '',
              image: '',
              inStock: true,
              order: 0,
            },
            quantity: orderItem.quantity,
            notes: orderItem.notes || '',
            selectedChoices: orderItem.selectedChoices || [],
          });
        }
      }
      setCart(newCart);
    } catch {
      setOrderCodeError('Error al cargar la orden');
    } finally {
      setIsLoadingOrder(false);
    }
  }, [orderCode, menuItems]);

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
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCorteDeCaja(true)}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 rounded-xl text-[10px] font-bold text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all"
          >
            <Calendar className="w-3.5 h-3.5" /> Corte
          </button>
          <button onClick={() => setShowInvoiceHistory(true)}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 rounded-xl text-[10px] font-bold text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all"
          >
            <History className="w-3.5 h-3.5" /> Facturas
          </button>
          <span className="text-xs text-zinc-500 font-mono">{new Date().toLocaleTimeString('es-VE')}</span>
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
                <button key={product.id} onClick={() => handleProductClick(product)}
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
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600">
                <IdCard className="w-4 h-4" />
              </div>
              <input value={customerCedula} onChange={e => setCustomerCedula(e.target.value.replace(/[^0-9]/g, '').slice(0, 8))}
                placeholder="Cédula (auto-busca)"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-10 py-2 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-primary-vibrant"
              />
              {isLookingUpCustomer && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 text-primary-vibrant animate-spin" />
                </div>
              )}
            </div>
            <input value={customerName} onChange={e => setCustomerName(e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''))}
              placeholder="Cliente"
              className={`w-full bg-zinc-900 border rounded-xl px-3 py-2 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-primary-vibrant ${customerName.trim().length === 0 ? 'border-red-500/50' : 'border-zinc-800'}`}
            />
            <div className="flex gap-2">
              <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="Teléfono 04XXXXX"
                className={`flex-1 bg-zinc-900 border rounded-xl px-3 py-2 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-primary-vibrant ${customerPhone.length > 0 && (!customerPhone.startsWith('04') || customerPhone.length < 7) ? 'border-red-500/50' : 'border-zinc-800'}`}
              />
              <select value={deliveryType} onChange={e => { setDeliveryType(e.target.value as any); setOrderCode(''); setOrderCodeError(''); }}
                className="bg-zinc-900 border border-zinc-800 rounded-xl px-2 py-2 text-xs font-bold text-zinc-400 outline-none"
              >
                <option value="Pick-up">Pickup</option>
                <option value="Delivery">Delivery</option>
              </select>
            </div>

            {/* Order code lookup — only for Delivery */}
            {deliveryType === 'Delivery' && (
              <div className="space-y-1">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      value={orderCode}
                      onChange={e => { setOrderCode(e.target.value.toUpperCase()); setOrderCodeError(''); }}
                      onKeyDown={e => e.key === 'Enter' && handleLoadOrderByCode()}
                      placeholder="Código de orden (PED-XXXXXX)"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-10 pr-3 py-2 text-sm font-mono font-bold text-white outline-none focus:ring-2 focus:ring-primary-vibrant placeholder:text-zinc-600"
                    />
                  </div>
                  <button
                    onClick={handleLoadOrderByCode}
                    disabled={!orderCode.trim() || isLoadingOrder}
                    className="px-3 py-2 bg-primary-vibrant text-white rounded-xl text-xs font-bold disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center gap-1"
                  >
                    {isLoadingOrder ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cargar'}
                  </button>
                </div>
                {orderCodeError && (
                  <p className="text-red-400 text-[11px] font-bold px-1">{orderCodeError}</p>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {cart.length === 0 && (
              <div className="text-center py-12 text-zinc-600 text-sm">Carrito vacío</div>
            )}
            {cart.map(item => {
              const key = getItemKey(item);
              return (
              <div key={key} className="bg-zinc-900 rounded-2xl p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-white truncate">{item.product.name}</div>
                  {item.selectedChoices && item.selectedChoices.length > 0 && (
                    <div className="text-[10px] text-zinc-500 font-medium truncate">
                      {item.selectedChoices.join(', ')}
                    </div>
                  )}
                  <div className="text-primary-vibrant font-black text-sm">${item.product.price.toFixed(2)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(key, -1)}
                    className="w-7 h-7 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-black text-sm w-5 text-center">{item.quantity}</span>
                  <button onClick={() => updateQty(key, 1)}
                    className="w-7 h-7 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button onClick={() => removeItem(key)}
                    className="w-7 h-7 bg-red-500/10 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              );
            })}
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
            <button onClick={() => setShowPayModal(true)} disabled={cart.length === 0 || !isFormValid}
              className="w-full bg-primary-vibrant text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <DollarSign className="w-5 h-5" /> Cobrar
            </button>
          </div>
        </div>
      </div>

      {/* Mobile cart button */}
      {cartCount > 0 && (
        <button onClick={() => setShowPayModal(true)} disabled={!isFormValid}
          className="lg:hidden fixed bottom-4 left-4 right-4 bg-primary-vibrant text-white p-4 rounded-2xl font-black shadow-2xl shadow-primary-vibrant/30 z-40 flex items-center justify-between active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          <span className="flex items-center gap-2"><ShoppingCart className="w-5 h-5" /> {cartCount} items</span>
          <span className="text-lg">${cartTotal.toFixed(2)}</span>
        </button>
      )}

      {/* Payment modal */}
      <AnimatePresence>
        {showPayModal && (
          <PaymentModal total={cartTotal} onConfirm={handlePayment} onClose={() => setShowPayModal(false)} exchangeRate={config.exchangeRate ?? 1} />
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
            invoiceNumber={showReceipt.invoiceNumber}
            cashierName={cashier?.name || ''}
            customerName={customerName}
            customerCedula={customerCedula || undefined}
            config={{ rif: config.rif, businessAddress: config.businessAddress, businessPhone: config.businessPhone, name: config.name }}
            locationName={locationName}
            onClose={() => setShowReceipt(null)}
            onNewSale={handleNewSale}
          />
        )}
      </AnimatePresence>

      {/* Corte de Caja modal */}
      <AnimatePresence>
        {showCorteDeCaja && (
          <CorteDeCajaModal
            orders={orders}
            locationId={selectedLocationId}
            locationName={locationName}
            onClose={() => setShowCorteDeCaja(false)}
          />
        )}
      </AnimatePresence>

      {/* Invoice History modal */}
      <AnimatePresence>
        {showInvoiceHistory && (
          <InvoiceHistoryModal
            orders={orders}
            locationId={selectedLocationId}
            onClose={() => setShowInvoiceHistory(false)}
          />
        )}
      </AnimatePresence>

      {/* Choice selector modal */}
      <AnimatePresence>
        {choiceProduct && (
          <ChoiceSelectorModal
            product={choiceProduct}
            onClose={() => setChoiceProduct(null)}
            onConfirm={(selectedChoices) => {
              addToCart(choiceProduct, selectedChoices);
              setChoiceProduct(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default PosPage;
