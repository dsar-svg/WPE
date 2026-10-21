import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Minus, Trash2, ShoppingCart, X, Check, Printer, DollarSign, CreditCard, Smartphone, Banknote, LogOut, User, IdCard, Calendar, History, Loader2, QrCode, Truck, Store, ArrowDownCircle, Pause, Play, Clock } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRestaurant } from '../context/RestaurantContext';
import { Product, Cashier, POSCartItem, PaymentMethod, Order, OrderStatus, DeliveryType } from '../types';
import { supabase } from '../lib/supabase';
import { OptimizedImage } from '../components/ui/OptimizedImage';

import { ChoiceSelectorModal } from '../components/ui/ChoiceSelectorModal';
import { corteArqueo, arqueoHtml, cuadra, formatArqueo } from '../lib/corte';

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
      const { data, error: rpcError } = await supabase.rpc('pos_login', { p_pin: pin });
      if (data) {
        onLogin(data as Cashier);
      } else {
        setError(rpcError?.message || 'PIN incorrecto');
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
type PaymentSplit = { method: PaymentMethod; amount: number; currency?: 'USD' | 'BS'; ref?: string };

function PaymentModal({
  total: baseTotal, subtotal, onConfirm, onClose, exchangeRate, originalPaymentMethod, isProcessing,
}: {
  total: number;
  subtotal: number;
  onConfirm: (splits: PaymentSplit[], changeAmount: number, discount: number, changeCurrency: 'USD' | 'BS') => void;
  onClose: () => void;
  exchangeRate: number;
  originalPaymentMethod?: PaymentMethod | null;
  isProcessing?: boolean;
}) {
  const [isSplit, setIsSplit] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>(originalPaymentMethod ?? 'Efectivo');
  const [methodChanged, setMethodChanged] = useState(false);
  const [confirmChange, setConfirmChange] = useState(false);

  const handleMethodChange = (m: PaymentMethod) => {
    setMethod(m);
    if (originalPaymentMethod && m !== originalPaymentMethod) {
      setMethodChanged(true);
      setConfirmChange(false);
    } else {
      setMethodChanged(false);
      setConfirmChange(false);
    }
  };
  const [paymentRef, setPaymentRef] = useState('');
  const [discountPct, setDiscountPct] = useState('');
  // Descuento solo sobre productos (no sobre el delivery)
  const pct = Math.min(100, Math.max(0, parseFloat(discountPct) || 0));
  const discount = Math.round(subtotal * pct) / 100;
  const total = Math.max(0, baseTotal - discount);
  const [amountReceived, setAmountReceived] = useState('');
  const [amountCurrency, setAmountCurrency] = useState<'USD' | 'BS'>('USD');
  // Moneda en que se entrega el vuelto: si difiere de la recibida, el corte lo descuenta de esa caja
  const [changeCurrency, setChangeCurrency] = useState<'USD' | 'BS' | null>(null);
  const rate = exchangeRate;

  // Split payment state
  const emptySplit = (): PaymentSplit => ({ method: 'Efectivo', amount: 0, currency: 'USD', ref: '' });
  const [splits, setSplits] = useState<PaymentSplit[]>([emptySplit()]);

  const amountReceivedUsd = amountCurrency === 'BS'
    ? (parseFloat(amountReceived) || 0) / rate
    : (parseFloat(amountReceived) || 0);

  const cashTotal = method === 'Efectivo' ? Math.ceil(total) : total;
  const changeAmount = method === 'Efectivo'
    ? Math.max(0, amountReceivedUsd - cashTotal)
    : 0;
  const isCashEnough = method !== 'Efectivo' || amountReceivedUsd >= cashTotal;
  const changeCur = changeCurrency ?? amountCurrency;
  // Un vuelto de $100 o más casi siempre es el monto tecleado en la moneda equivocada
  const changeTooBig = changeAmount >= 100;
  const totalBs = total * rate;

  // Split mode calculations — normalize all to USD before summing
  const splitTotal = splits.reduce((s, p) => s + (p.currency === 'BS' ? p.amount / rate : p.amount), 0);
  const splitRemaining = Math.max(0, total - splitTotal);
  // Exacto en ambos sentidos: si el descuento baja el total, los montos ya cargados no pueden excederlo
  const splitValid = splits.length > 0 && Math.abs(total - splitTotal) < 0.01 && splits.every(s => s.amount > 0);

  const canConfirm = isSplit
    ? splitValid
    : isCashEnough && !changeTooBig && (!methodChanged || confirmChange) && !isProcessing;

  const handleConfirm = () => {
    if (!canConfirm) return;
    if (isSplit) {
      onConfirm(splits.filter(s => s.amount > 0), 0, discount, 'USD');
    } else {
      let amountToSend: number;
      let currencyToSend: 'USD' | 'BS' | undefined;
      if (method === 'Efectivo') {
        amountToSend = amountCurrency === 'BS' ? cashTotal * rate : cashTotal;
        currencyToSend = amountCurrency;
      } else if (method === 'Tarjeta') {
        amountToSend = total * rate;
        currencyToSend = 'BS';
      } else if (method === 'PagoMóvil') {
        amountToSend = total * rate;
        currencyToSend = 'BS';
      } else {
        amountToSend = total;
        currencyToSend = undefined;
      }
      onConfirm([{ method, amount: amountToSend, currency: currencyToSend, ref: paymentRef || undefined }], changeAmount, discount, changeCur);
    }
  };

  const addSplit = () => {
    setSplits(prev => [...prev, { ...emptySplit(), amount: splitRemaining }]);
  };
  const removeSplit = (idx: number) => {
    setSplits(prev => prev.filter((_, i) => i !== idx));
  };
  const updateSplit = (idx: number, patch: Partial<PaymentSplit>) => {
    setSplits(prev => prev.map((s, i) => i === idx ? { ...s, ...patch } : s));
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
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-6 overflow-y-auto max-h-[90vh]"
      >
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-black text-white">Cerrar Venta</h2>
          <button onClick={onClose} className="p-2 bg-zinc-800 rounded-full text-zinc-500 hover:text-white"><X /></button>
        </div>

        <div className="text-center py-4">
          <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Total a cobrar</p>
          {discount > 0 && (
            <p className="text-lg font-bold text-zinc-500 line-through">${baseTotal.toFixed(2)}</p>
          )}
          <p className="text-5xl font-black text-white">${total.toFixed(2)}</p>
          {discount > 0 && (
            <p className="text-sm font-bold text-green-400 mt-1">Descuento {pct}%: -${discount.toFixed(2)}</p>
          )}
          <div className="mt-3 p-3 bg-primary-vibrant/10 rounded-xl border border-primary-vibrant/20 space-y-1">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Total en Bs.</p>
            <p className="text-3xl font-black text-primary-vibrant">
              {totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.
            </p>
            <div className="flex items-center justify-center gap-1.5">
              <p className="text-[10px] text-zinc-500">Tasa: {rate.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Descuento (%)</label>
          <div className="relative">
            <input type="number" step="1" min="0" max="100" value={discountPct}
              onChange={e => setDiscountPct(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 p-3 pr-10 rounded-2xl text-lg font-bold text-white outline-none focus:ring-2 focus:ring-primary-vibrant"
              placeholder="0"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">%</span>
          </div>
        </div>

        {/* Toggle single / split */}
        <button onClick={() => { setIsSplit(v => !v); setSplits([{ ...emptySplit(), amount: total }]); }}
          className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all ${
            isSplit ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400' : 'border-zinc-800 bg-zinc-950 text-zinc-500 hover:text-white hover:border-zinc-700'
          }`}>
          {isSplit ? 'Modo Pago Mixto Activo' : 'Pago Mixto'}
        </button>

        {!isSplit && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {methods.map(m => (
                <button key={m.key} onClick={() => handleMethodChange(m.key)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all relative ${
                    method === m.key
                      ? 'border-primary-vibrant bg-primary-vibrant/10'
                      : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                  }`}
                >
                  {originalPaymentMethod === m.key && (
                    <span className="absolute top-1.5 right-1.5 text-[9px] bg-green-500/20 text-green-400 font-bold px-1.5 py-0.5 rounded-full">Cliente</span>
                  )}
                  <m.icon className={`w-6 h-6 ${method === m.key ? 'text-primary-vibrant' : 'text-zinc-500'}`} />
                  <span className={`font-bold text-sm ${method === m.key ? 'text-white' : 'text-zinc-500'}`}>{m.label}</span>
                </button>
              ))}
            </div>

            {methodChanged && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 space-y-3">
                <p className="text-yellow-400 text-sm font-bold">
                  El cliente eligió <span className="text-white">{originalPaymentMethod}</span> — cambiar a <span className="text-white">{method}</span>?
                </p>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={confirmChange} onChange={e => setConfirmChange(e.target.checked)}
                    className="w-4 h-4 rounded accent-yellow-400"
                  />
                  <span className="text-yellow-300 text-xs font-bold">Sí, confirmo el cambio de método de pago</span>
                </label>
              </div>
            )}

            {method === 'PagoMóvil' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Referencia</label>
                  <input autoFocus type="text" value={paymentRef}
                    onChange={e => setPaymentRef(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl text-lg font-bold text-white outline-none focus:ring-2 focus:ring-primary-vibrant"
                    placeholder="Número de referencia"
                  />
                </div>
              </div>
            )}

            {method === 'Efectivo' && (
              <div className="space-y-3">
                <div className="p-3 bg-primary-vibrant/10 rounded-xl border border-primary-vibrant/20 text-center">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Total redondeado</p>
                  <p className="text-2xl font-black text-primary-vibrant">${cashTotal.toFixed(2)}</p>
                  <p className="text-sm text-zinc-400 font-bold mt-1">
                    {(cashTotal * rate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Monto recibido</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-lg">
                        {amountCurrency === 'USD' ? '$' : 'Bs'}
                      </span>
                      <input autoFocus type="number" step="0.01" min="0" value={amountReceived}
                        onChange={e => setAmountReceived(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 p-4 pl-10 rounded-2xl text-2xl font-black text-white outline-none focus:ring-2 focus:ring-primary-vibrant"
                        placeholder="0.00"
                      />
                    </div>
                    <button onClick={() => {
                      setAmountCurrency(c => c === 'USD' ? 'BS' : 'USD');
                      setAmountReceived('');
                      setChangeCurrency(null);
                    }}
                      className="px-3 bg-zinc-800 rounded-2xl text-white font-bold text-sm hover:bg-zinc-700 transition-all flex items-center"
                    >
                      {amountCurrency === 'USD' ? 'Bs' : '$'}
                    </button>
                  </div>
                </div>
                {parseFloat(amountReceived) > 0 && (
                  <div className={`p-4 rounded-2xl text-center space-y-2 ${isCashEnough && !changeTooBig ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Vuelto</p>
                    <p className={`text-3xl font-black ${isCashEnough && !changeTooBig ? 'text-green-400' : 'text-red-400'}`}>
                      {changeCur === 'USD'
                        ? `$${changeAmount.toFixed(2)}`
                        : `${(changeAmount * rate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.`
                      }
                    </p>
                    {changeTooBig && (
                      <p className="text-xs font-bold text-red-400">Vuelto de $100 o más: revisa el monto y la moneda ($ / Bs).</p>
                    )}
                    {changeAmount > 0 && !changeTooBig && (
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Entregar en</span>
                        {(['USD', 'BS'] as const).map(c => (
                          <button key={c} onClick={() => setChangeCurrency(c)}
                            className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${changeCur === c ? 'bg-green-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
                          >
                            {c === 'USD' ? '$' : 'Bs'}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div className="flex gap-2">
                  {amountCurrency === 'USD'
                    ? [5, 10, 20, 50].map(n => (
                        <button key={n} onClick={() => setAmountReceived((parseFloat(amountReceived || '0') + n).toFixed(2))}
                          className="flex-1 py-2 bg-zinc-800 rounded-xl text-white font-bold text-sm hover:bg-zinc-700 transition-all"
                        >
                          +${n}
                        </button>
                      ))
                    : [500, 1000, 2000, 5000].map(n => (
                        <button key={n} onClick={() => setAmountReceived((parseFloat(amountReceived || '0') + n).toFixed(2))}
                          className="flex-1 py-2 bg-zinc-800 rounded-xl text-white font-bold text-sm hover:bg-zinc-700 transition-all"
                        >
                          +{n.toLocaleString('es-VE')} Bs
                        </button>
                      ))
                  }
                </div>
              </div>
            )}
          </>
        )}

        {isSplit && (
          <div className="space-y-4">
            <div className={`p-3 rounded-xl text-center ${splitRemaining <= 0.01 ? 'bg-green-500/10' : 'bg-zinc-800'}`}>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Restante</p>
              <p className={`text-2xl font-black ${splitRemaining <= 0.01 ? 'text-green-400' : 'text-white'}`}>
                ${splitRemaining.toFixed(2)}
              </p>
              <p className="text-sm text-zinc-400 font-bold">
                {(splitRemaining * rate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.
              </p>
            </div>

            {splits.map((sp, idx) => (
              <div key={idx} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Pago {idx + 1}</span>
                  {splits.length > 1 && (
                    <button onClick={() => removeSplit(idx)} className="text-zinc-600 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {methods.map(m => (
                    <button key={m.key} onClick={() => updateSplit(idx, { method: m.key, ref: '' })}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${
                        sp.method === m.key ? 'bg-primary-vibrant text-white' : 'bg-zinc-800 text-zinc-500 hover:text-white'
                      }`}>
                      {m.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">
                      {sp.currency === 'BS' ? 'Bs' : '$'}
                    </span>
                    <input type="number" step="0.01" min="0" value={sp.amount || ''}
                      onChange={e => updateSplit(idx, { amount: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-zinc-900 border border-zinc-800 p-3 pl-7 rounded-xl text-lg font-black text-white outline-none focus:ring-2 focus:ring-primary-vibrant"
                      placeholder="0.00"
                    />
                  </div>
                  <button onClick={() => {
                    const newCurrency = sp.currency === 'BS' ? 'USD' : 'BS';
                    const converted = newCurrency === 'BS' ? sp.amount * rate : sp.amount / rate;
                    updateSplit(idx, { currency: newCurrency, amount: Math.round(converted * 100) / 100 });
                  }}
                    className="px-3 bg-zinc-800 rounded-xl text-white font-bold text-sm hover:bg-zinc-700 transition-all">
                    {sp.currency === 'BS' ? 'Bs' : '$'}
                  </button>
                </div>
                {sp.method === 'PagoMóvil' && (
                  <input type="text" value={sp.ref || ''} placeholder="Referencia"
                    onChange={e => updateSplit(idx, { ref: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-sm font-bold text-white outline-none focus:ring-2 focus:ring-primary-vibrant"
                  />
                )}
                {sp.amount > 0 && (
                  <p className="text-[10px] text-zinc-500 text-right">
                    {sp.currency === 'BS'
                      ? `$${(sp.amount / rate).toFixed(2)}`
                      : `${(sp.amount * rate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.`
                    } equivalentes
                  </p>
                )}
              </div>
            ))}

            {splitRemaining > 0.01 && (
              <button onClick={addSplit}
                className="w-full py-3 rounded-xl border border-dashed border-zinc-700 text-zinc-500 text-xs font-bold uppercase tracking-widest hover:border-zinc-500 hover:text-white transition-all">
                + Agregar otro pago
              </button>
            )}
          </div>
        )}

        {!isSplit && (
          <div className={`p-4 rounded-2xl border-2 text-center ${
            method === 'Efectivo' ? 'border-green-500/50 bg-green-500/10' :
            method === 'Tarjeta' ? 'border-blue-500/50 bg-blue-500/10' :
            'border-purple-500/50 bg-purple-500/10'
          }`}>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Cobrar con</p>
            <p className={`text-2xl font-black ${
              method === 'Efectivo' ? 'text-green-400' :
              method === 'Tarjeta' ? 'text-blue-400' :
              'text-purple-400'
            }`}>
              {method === 'Efectivo' && amountCurrency === 'BS' ? 'Efectivo Bs.' :
               method === 'Efectivo' ? 'Efectivo $' :
               method === 'Tarjeta' ? 'Tarjeta' : 'Pago Móvil'}
            </p>
            {method === 'Efectivo' && (
              <p className="text-sm text-zinc-400 font-bold mt-1">
                {amountReceivedUsd > 0
                  ? `$${amountReceivedUsd.toFixed(2)} — Vuelto: ${changeCur === 'USD' ? `$${changeAmount.toFixed(2)}` : `${(changeAmount * rate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.`}`
                  : 'Ingrese monto recibido'}
              </p>
            )}
            {method === 'PagoMóvil' && paymentRef && (
              <p className="text-sm text-zinc-400 font-bold mt-1">Ref: {paymentRef}</p>
            )}
          </div>
        )}

        <button onClick={handleConfirm} disabled={!canConfirm}
          className="w-full bg-primary-vibrant text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <DollarSign className="w-5 h-5" />
              {isSplit ? `Cerrar venta mixta $${total.toFixed(2)} / ${totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.` : method === 'Efectivo' ? `Cerrar venta $${total.toFixed(2)}` : `Cerrar venta con ${method}`}
            </>
          )}
        </button>
      </motion.div>
    </motion.div>
  );
}

// ==============================
// Receipt
// ==============================
// ==============================
// Receipt (Modificado al Formato Fiscal SENIAT)
// ==============================
function getChoiceAdjust(product: Product, selectedChoices?: string[]): number {
  if (!selectedChoices || !product.choices) return 0;
  return product.choices.filter(c => selectedChoices.includes(c.name)).reduce((s, c) => s + (c.priceAdjust ?? 0), 0);
}

function ReceiptModal({
  items, total, discount = 0, paymentMethod, changeAmount, changeCurrency = 'BS', cashierName, customerName, customerCedula, invoiceNumber, config, locationName, exchangeRate, onClose: _onClose, onNewSale,
}: {
  items: POSCartItem[];
  total: number;
  discount?: number;
  paymentMethod: PaymentMethod;
  changeAmount: number;
  changeCurrency?: 'USD' | 'BS';
  cashierName: string;
  customerName: string;
  customerCedula?: string;
  invoiceNumber?: string;
  config: { rif?: string; businessAddress?: string; businessPhone?: string; name?: string; exchangeRate?: number };
  locationName: string;
  exchangeRate: number;
  onClose: () => void;
  onNewSale: () => void;
}) {
  const rate = exchangeRate || 1;
  const totalBs = total * rate;
  const biBs = totalBs / 1.16;
  const taxBs = biBs * 0.16;

  const now = new Date();
  const dateStr = now.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
  const formatBs = (n: number) => n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const abbreviate = (text: string) => {
    const clean = text.replace(/[,;.]/g, '').toLowerCase();
    const stopWords = ['con', 'y', 'de', 'del', 'la', 'el', 'los', 'las', 'un', 'una'];
    return clean.split(' ').map(w => stopWords.includes(w) ? '' : w.length > 5 ? w.slice(0, 4) + '.' : w).filter(Boolean).join(' ');
  };

  useEffect(() => {
    const t = setTimeout(() => handlePrint(), 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => onNewSale(), 8000);
    return () => clearTimeout(t);
  }, [onNewSale]);

  const handlePrint = () => {
    const receiptHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Factura Fiscal</title>
<style>
  @media print {
    @page { size: 80mm auto; margin: 0; }
    body { margin: 0; padding: 0; }
  }
  * {
    font-family: Arial, Helvetica, sans-serif !important;
  }
  body { 
    font-family: Arial, Helvetica, sans-serif !important; 
    font-size: 11px; 
    width: 270px; 
    margin: 0 auto; 
    padding: 10px 5px; 
    color: #000;
    line-height: 1.25;
  }
  .text-center { text-align: center; }
  .text-right { text-align: right; }
  .text-left { text-align: left; }
  .bold { font-weight: bold; }
  
  .header-title { font-size: 14px; font-weight: bold; margin-bottom: 2px; }
  .header-sub { font-size: 10px; margin: 1px 0; }
  
  .divider { 
    border-top: 1px dashed #000; 
    margin: 6px 0; 
  }
  
  .info-table, .items-table, .totals-table { 
    width: 100%; 
    border-collapse: collapse; 
  }
  
  .info-table td, .totals-table td { 
    padding: 1px 0; 
    font-size: 10px; 
    font-family: Arial, Helvetica, sans-serif !important;
  }
  
  .items-table th { 
    border-top: 1px dashed #000; 
    border-bottom: 1px dashed #000; 
    padding: 3px 0; 
    font-size: 10px; 
    font-weight: bold;
    font-family: Arial, Helvetica, sans-serif !important;
  }
  
  .items-table td { 
    padding: 3px 0; 
    font-size: 10px; 
    vertical-align: top;
    font-family: Arial, Helvetica, sans-serif !important;
  }
  
  .total-row { 
    font-weight: bold; 
    font-size: 11px;
  }
  
  .footer-text { 
    font-size: 9.5px; 
    margin-top: 4px; 
  }
</style>
</head>
<body>

  <!-- Encabezado SENIAT -->
  <div class="text-center">
    <div class="header-title">SENIAT</div>
    <div class="header-sub bold">RIF: ${config.rif || 'J-302199232'}</div>
    <div class="header-sub bold">${config.name || 'Wallace Panda Express'}</div>
    <div class="header-sub">${config.businessAddress || 'Av. Bolivar Norte calle 133 Lopez Latouche, C.C las acacias Local 6, Valencia 2001, Carabobo'}</div>
  </div>

  <div class="divider"></div>

  <!-- Datos del Cliente -->
  <div class="text-center bold" style="font-size: 10px; margin-bottom: 3px;">*** DATOS DE CLIENTE ***</div>
  <table class="info-table">
    <tr><td class="bold">R.SOCIAL:</td><td class="text-right">${customerName || 'CONTRIBUYENTE OCASIONAL'}</td></tr>
    <tr><td class="bold">RIF/CI:</td><td class="text-right">${customerCedula ? `V-${customerCedula}` : 'V-00000000'}</td></tr>
    <tr><td class="bold">VENDEDOR:</td><td class="text-right">0000</td></tr>
    <tr><td class="bold">FACTURA:</td><td class="text-right">${invoiceNumber || 'FAC-20260724-0032'}</td></tr>
    <tr><td class="bold">FECHA: ${dateStr}</td><td class="text-right bold">HORA: ${timeStr}</td></tr>
  </table>

  <!-- Tabla de Items -->
  <table class="items-table" style="margin-top: 5px;">
    <thead>
      <tr>
        <th class="text-left" style="width: 55%;">Item</th>
        <th class="text-center" style="width: 15%;">Cant</th>
        <th class="text-right" style="width: 30%;">Precio Bs.</th>
      </tr>
    </thead>
    <tbody>
      ${items.map(i => {
        const itemTotalBs = (i.product.price + getChoiceAdjust(i.product, i.selectedChoices)) * i.quantity * rate;
        const choices = i.selectedChoices?.length ? ` (${i.selectedChoices.join(', ')})` : '';
        const isCombo = i.product.category === 'Combos';
        const desc = isCombo && i.product.description ? ` — ${abbreviate(i.product.description)}` : '';
        return `
          <tr>
            <td class="text-left">${i.product.name}${choices}${desc}</td>
            <td class="text-center">${i.quantity}</td>
            <td class="text-right">${formatBs(itemTotalBs)}</td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>

  <div class="divider"></div>

  <!-- Totales e Impuestos -->
  <table class="totals-table">
    ${discount > 0.01 ? `
    <tr>
      <td>DESCUENTO</td>
      <td class="text-right">-Bs ${formatBs(discount * rate)}</td>
    </tr>` : ''}
    <tr>
      <td>SUBTTL</td>
      <td class="text-right">Bs ${formatBs(biBs)}</td>
    </tr>
    <tr>
      <td>EXENTO (E)</td>
      <td class="text-right">Bs 0,00</td>
    </tr>
    <tr>
      <td>BI G (16,00%)</td>
      <td class="text-right">Bs ${formatBs(biBs)}</td>
    </tr>
    <tr>
      <td>IVA G (16,00%)</td>
      <td class="text-right">Bs ${formatBs(taxBs)}</td>
    </tr>
  </table>

  <div class="divider"></div>

  <!-- Total Final y M�todo de Pago -->
  <table class="totals-table">
    <tr class="total-row">
      <td>TOTAL</td>
      <td class="text-right">Bs ${formatBs(totalBs)}</td>
    </tr>
  </table>

  <div class="divider"></div>

  <table class="totals-table">
    <tr class="total-row">
      <td>TOTAL ${paymentMethod.toUpperCase()}</td>
      <td class="text-right">Bs ${formatBs(totalBs)}</td>
    </tr>
    ${paymentMethod === 'Efectivo' && changeAmount > 0 ? `
      <tr>
        <td>VUELTO</td>
        <td class="text-right">${changeCurrency === 'USD' ? `$${changeAmount.toFixed(2)}` : `Bs ${formatBs(changeAmount * rate)}`}</td>
      </tr>
    ` : ''}
  </table>

  <div class="divider"></div>

  <!-- Pie Fiscal -->
  <div class="text-center footer-text">
    <div>GRA0000487 / MH</div>
    <div style="margin-top: 3px;">¡Gracias por su compra!</div>
    <div>wallacepanda.com</div>
  </div>

</body>
</html>`;
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(receiptHtml);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 2000);
      }, 500);
    }
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
          <div className="flex justify-between text-zinc-500">
            <span>Total Bs.</span>
            <span className="text-primary-vibrant font-bold">Bs. {formatBs(totalBs)}</span>
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
interface CorteRecord {
  id: string;
  location_id: string;
  cashier_id: string;
  cashier_name: string;
  date: string;
  closed_at: string;
  order_count: number;
  total_efectivo: number;
  total_efectivo_usd: number;
  total_efectivo_bs: number;
  total_tarjeta: number;
  total_tarjeta_usd: number;
  total_tarjeta_bs: number;
  total_pagomovil: number;
  total_pagomovil_usd: number;
  total_pagomovil_bs: number;
  grand_total: number;
  from_date: string;
  to_date: string;
  created_at: string;
  exchange_rate?: number | null;
  counted_efectivo_usd?: number | null;
  counted_efectivo_bs?: number | null;
  counted_tarjeta_bs?: number | null;
  counted_pagomovil_bs?: number | null;
}

const toCorteRecord = (row: any): CorteRecord => ({
  ...row,
  cashier_name: row.cashier_name || '',
  total_efectivo_usd: Number(row.total_efectivo_usd ?? 0),
  total_efectivo_bs: Number(row.total_efectivo_bs ?? 0),
  total_tarjeta_usd: Number(row.total_tarjeta_usd ?? 0),
  total_tarjeta_bs: Number(row.total_tarjeta_bs ?? 0),
  total_pagomovil_usd: Number(row.total_pagomovil_usd ?? 0),
  total_pagomovil_bs: Number(row.total_pagomovil_bs ?? 0),
  grand_total: Number(row.grand_total ?? 0),
});

// Cortes viejos guardaban 0 en los campos USD de tarjeta/pago móvil: se convierten con la tasa
const corteUsd = (bs: number, usd: number, rate: number) => (usd > 0 ? usd : bs / (rate || 1));

function buildCorteReceipt(c: CorteRecord, locationName: string, fallbackRate: number, orders: Order[] | null) {
  const rate = c.exchange_rate || fallbackRate || 1;
  const formatBs = (n: number) => n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtTime = (d: string) => new Date(d).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
  const tarjetaUsd = corteUsd(c.total_tarjeta_bs, c.total_tarjeta_usd, rate);
  const pagomovilUsd = corteUsd(c.total_pagomovil_bs, c.total_pagomovil_usd, rate);
  const delivery = (orders || []).filter(o => o.delivery_type === 'Delivery');
  const local = (orders || []).filter(o => o.delivery_type !== 'Delivery');
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Corte de Caja</title>
<style>
  @media print { @page { size: 80mm auto; margin: 0; } body { margin: 0; padding: 0; } }
  * { font-family: Arial, Helvetica, sans-serif !important; }
  body { font-size: 10px; width: 270px; margin: 0 auto; padding: 8px 5px; color: #000; line-height: 1.2; }
  .text-center { text-align: center; } .bold { font-weight: bold; }
  .header-title { font-size: 13px; font-weight: bold; margin-bottom: 2px; }
  .header-sub { font-size: 9px; margin: 1px 0; }
  .divider { border-top: 1px dashed #000; margin: 5px 0; }
  table { width: 100%; border-collapse: collapse; } td { padding: 1.5px 0; font-size: 9px; } td.r { text-align: right; }
  .total-row td { font-weight: bold; font-size: 10px; }
  .section-title { font-size: 9px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 3px; }
  .order-row td { font-size: 8.5px; }
</style>
</head>
<body>
<div class="text-center">
  <div class="header-title">CORTE DE CAJA</div>
  <div class="header-sub bold">${locationName}</div>
  <div class="header-sub">${new Date(c.closed_at).toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
  <div class="header-sub">Cajero: ${c.cashier_name}</div>
  <div class="header-sub">${c.from_date ? `${fmtTime(c.from_date)} - ` : ''}${fmtTime(c.closed_at)} · Tasa: ${formatBs(rate)} Bs/$</div>
</div>
<div class="divider"></div>
<table>
  <tr><td>Pedidos</td><td class="r bold">${c.order_count}</td></tr>
  ${orders ? `<tr><td>Delivery (${delivery.length})</td><td class="r">$${delivery.reduce((s, o) => s + o.total, 0).toFixed(2)}</td></tr>
  <tr><td>Local (${local.length})</td><td class="r">$${local.reduce((s, o) => s + o.total, 0).toFixed(2)}</td></tr>` : ''}
</table>
<div class="divider"></div>
<div class="section-title">M&Eacute;TODO DE PAGO (SISTEMA)</div>
<table>
  <tr><td>Efectivo $</td><td class="r">$${c.total_efectivo_usd.toFixed(2)}</td></tr>
  <tr><td>Efectivo Bs</td><td class="r">Bs ${formatBs(c.total_efectivo_bs)}</td></tr>
  <tr><td>Tarjeta</td><td class="r">$${tarjetaUsd.toFixed(2)} / Bs ${formatBs(c.total_tarjeta_bs)}</td></tr>
  <tr><td>Pago M&oacute;vil</td><td class="r">$${pagomovilUsd.toFixed(2)} / Bs ${formatBs(c.total_pagomovil_bs)}</td></tr>
</table>
<div class="divider"></div>
<table>
  <tr class="total-row"><td>TOTAL FACTURADO</td><td class="r">$${c.grand_total.toFixed(2)}</td></tr>
  <tr class="total-row"><td></td><td class="r">Bs ${formatBs(c.grand_total * rate)}</td></tr>
</table>
${arqueoHtml(c)}
${orders && orders.length > 0 ? `<div class="divider"></div>
<div class="section-title">DETALLE DE PEDIDOS</div>
<table>
${orders.map(o => `  <tr class="order-row"><td>${fmtTime(o.paid_at || o.created_at)}</td><td>${(o.invoice_number || '').slice(-4)}</td><td>${(o.customer_name || 'N/A').substring(0, 12)}</td><td>${(o.payment_method || '').substring(0, 4).toUpperCase()}</td><td class="r">$${o.total.toFixed(2)}</td></tr>`).join('\n')}
</table>` : ''}
<div class="divider"></div>
<p class="text-center" style="font-size:8px">Cerrado: ${new Date(c.closed_at).toLocaleString('es-VE')}</p>
<div class="divider"></div>
<p class="text-center" style="font-size:8px">Firma cajera: ____________________</p>
</body>
</html>`;
}

function printHtml(html: string) {
  const iframe = document.createElement('iframe');
  Object.assign(iframe.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: 'none' });
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) return;
  doc.open();
  doc.write(html);
  doc.close();
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => document.body.removeChild(iframe), 2000);
  }, 500);
}

function ArqueoTable({ c }: { c: CorteRecord }) {
  const rows = corteArqueo(c);
  if (!rows) return null;
  return (
    <div className="space-y-1">
      <div className="grid grid-cols-4 text-[9px] font-bold uppercase tracking-widest text-zinc-500 px-2">
        <span>Arqueo</span><span className="text-right">Sistema</span><span className="text-right">Contado</span><span className="text-right">Dif.</span>
      </div>
      {rows.map(r => (
        <div key={r.label} className="grid grid-cols-4 items-center bg-zinc-950 p-2 rounded-lg text-[11px]">
          <span className="font-bold text-zinc-300">{r.label}</span>
          <span className="text-right text-zinc-400">{formatArqueo(r, r.esperado)}</span>
          <span className="text-right text-zinc-400">{formatArqueo(r, r.contado)}</span>
          <span className={`text-right font-black ${cuadra(r) ? 'text-green-400' : 'text-red-400'}`}>
            {r.diferencia > 0 ? '+' : ''}{formatArqueo(r, r.diferencia)}
          </span>
        </div>
      ))}
    </div>
  );
}

// Totales por método que calcula el servidor (pos_corte) con las ventas registradas
function CorteTotals({ c }: { c: CorteRecord }) {
  const formatBs = (n: number) => n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const rate = c.exchange_rate || 1;
  const rows = [
    { label: 'Efectivo $', icon: Banknote, color: 'text-green-400', main: `$${c.total_efectivo_usd.toFixed(2)}`, sub: '' },
    { label: 'Efectivo Bs', icon: Banknote, color: 'text-yellow-400', main: `${formatBs(c.total_efectivo_bs)} Bs`, sub: '' },
    { label: 'Tarjeta', icon: CreditCard, color: 'text-blue-400', main: `${formatBs(c.total_tarjeta_bs)} Bs`, sub: `$${corteUsd(c.total_tarjeta_bs, c.total_tarjeta_usd, rate).toFixed(2)}` },
    { label: 'Pago Móvil', icon: Smartphone, color: 'text-purple-400', main: `${formatBs(c.total_pagomovil_bs)} Bs`, sub: `$${corteUsd(c.total_pagomovil_bs, c.total_pagomovil_usd, rate).toFixed(2)}` },
  ];
  return (
    <div className="space-y-2">
      <div className="bg-zinc-950 rounded-2xl p-4 text-center">
        <DollarSign className="w-5 h-5 text-green-400 mx-auto mb-1" />
        <p className="text-2xl font-black text-green-400">${c.grand_total.toFixed(2)}</p>
        <p className="text-xs text-zinc-500 font-bold">{formatBs(c.grand_total * rate)} Bs.</p>
        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-1">Total vendido · {c.order_count} pedidos</p>
      </div>
      <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Lo que debe haber</p>
      {rows.map(({ label, icon: Icon, color, main, sub }) => (
        <div key={label} className="flex items-center justify-between bg-zinc-950 p-3 rounded-xl">
          <span className="flex items-center gap-2 text-sm font-bold text-zinc-300"><Icon className={`w-4 h-4 ${color}`} /> {label}</span>
          <span className="text-right">
            <span className={`font-black ${color}`}>{main}</span>
            {sub && <span className="block text-[10px] text-zinc-500">{sub}</span>}
          </span>
        </div>
      ))}
      <p className="text-[10px] text-zinc-600">El efectivo ya descuenta el vuelto dado en otra moneda. Tasa: {formatBs(rate)} Bs/$.</p>
    </div>
  );
}

function CorteDeCajaModal({
  orders, cortes, locationId, locationName, cashier, exchangeRate, onCorteSaved, onClose,
}: {
  orders: Order[];
  cortes: CorteRecord[];
  locationId: string;
  locationName: string;
  cashier: Cashier | null;
  exchangeRate: number;
  onCorteSaved: () => void;
  onClose: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<CorteRecord | null>(null);
  const [savedOrders, setSavedOrders] = useState<Order[]>([]);
  const [preview, setPreview] = useState<CorteRecord | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [error, setError] = useState('');

  // Misma regla que pos_corte: pedidos de esta cajera aún sin corte
  const pendingOrders = useMemo(() => {
    const lastClosed = cortes.filter(c => c.cashier_id === cashier?.id)
      .reduce<string | null>((m, c) => (!m || c.closed_at > m ? c.closed_at : m), null);
    const vz = new Date(Date.now() - 4 * 60 * 60 * 1000);
    const bound = lastClosed ? new Date(lastClosed) : new Date(Date.UTC(vz.getUTCFullYear(), vz.getUTCMonth(), vz.getUTCDate(), 4, 0, 0));
    return orders
      .filter(o => o.location_id === locationId && o.status === 'exitoso' && o.cashier_id === cashier?.id && !o.corte_id
        && (o.paid_at || new Date(o.created_at) > bound))
      .sort((a, b) => new Date(a.paid_at || a.created_at).getTime() - new Date(b.paid_at || b.created_at).getTime());
  }, [orders, cortes, locationId, cashier?.id]);

  // Los totales los calcula el servidor; se recalculan si entra otra venta con el modal abierto
  const token = cashier?.token;
  useEffect(() => {
    if (!token || saved) return;
    setLoadingPreview(true);
    supabase.rpc('pos_corte', { p_token: token, p_exchange_rate: exchangeRate, p_preview: true })
      .then(({ data, error: rpcError }) => {
        setPreview(rpcError || !data ? null : toCorteRecord(data));
        setLoadingPreview(false);
      });
  }, [token, exchangeRate, pendingOrders.length, saved]);

  const dateStr = new Date().toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' });
  const rate = exchangeRate || 1;
  const firstOrderAt = preview?.from_date ? new Date(preview.from_date) : null;

  const handleSaveCorte = async () => {
    if (!token) return;
    setSaving(true);
    setError('');
    try {
      const { data, error: rpcError } = await supabase.rpc('pos_corte', { p_token: token, p_exchange_rate: exchangeRate, p_preview: false });
      if (rpcError) throw rpcError;
      const record = toCorteRecord(data);
      setSaved(record);
      const { data: rows } = await supabase.from('orders').select('*').eq('corte_id', record.id).order('paid_at');
      setSavedOrders((rows || []) as Order[]);
      onCorteSaved();
    } catch (err) {
      console.error('Error saving corte:', err);
      setError((err as { message?: string })?.message || 'Error al guardar el corte. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

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

        {saved ? (
          <>
            <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
              <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Check className="w-5 h-5 text-green-400" />
              </div>
              <p className="text-green-400 font-black text-sm">Corte guardado</p>
            </div>
            <CorteTotals c={saved} />
            <div className="flex gap-2">
              <button onClick={() => printHtml(buildCorteReceipt(saved, locationName, rate, savedOrders))}
                className="flex-1 bg-zinc-800 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-700 transition-all flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" /> Imprimir
              </button>
              <button onClick={onClose}
                className="flex-1 bg-primary-vibrant text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all"
              >
                Cerrar
              </button>
            </div>
          </>
        ) : loadingPreview ? (
          <div className="flex items-center justify-center py-12 gap-2 text-zinc-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Calculando el corte...
          </div>
        ) : !preview ? (
          <div className="text-center py-8">
            <Check className="w-12 h-12 text-green-400/50 mx-auto mb-3" />
            <p className="text-zinc-500 font-bold text-sm">No hay pedidos pendientes</p>
            <p className="text-zinc-600 text-xs mt-1">Todos los pedidos ya fueron cortados</p>
          </div>
        ) : (
          <>
            {firstOrderAt && (
              <p className="text-center text-[11px] text-zinc-400 font-bold">
                Ventas desde el {firstOrderAt.toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'short' })}, {firstOrderAt.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
            <CorteTotals c={preview} />

            <div className="space-y-1 max-h-40 overflow-y-auto">
              <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 sticky top-0 bg-zinc-900 pb-1">Pedidos ({pendingOrders.length})</p>
              {pendingOrders.map(o => (
                <div key={o.id} className="flex items-center justify-between text-[11px] text-zinc-400 bg-zinc-950 p-2 rounded-lg gap-2">
                  <span className="text-zinc-600 w-12 flex-shrink-0">{new Date(o.paid_at || o.created_at).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="truncate flex-1">{o.customer_name}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex-shrink-0 ${o.delivery_type === 'Delivery' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>{o.delivery_type === 'Delivery' ? 'DEL' : 'LOCAL'}</span>
                  <span className="font-bold text-white w-16 text-right">${o.total.toFixed(2)}</span>
                </div>
              ))}
            </div>

            {error && (
              <p className="text-red-400 text-xs font-bold text-center">{error}</p>
            )}

            <div className="flex gap-2">
              <button onClick={onClose}
                className="flex-1 bg-zinc-800 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-700 transition-all"
              >
                Cancelar
              </button>
              <button onClick={handleSaveCorte} disabled={saving}
                className="flex-1 bg-primary-vibrant text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Hacer Corte
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// ==============================
// Invoice History
// ==============================
function InvoiceHistoryModal({
  orders, locationId, config, locationName, exchangeRate, onClose,
}: {
  orders: Order[];
  locationId: string;
  config: { rif?: string; businessAddress?: string; businessPhone?: string; name?: string; exchangeRate?: number };
  locationName: string;
  exchangeRate: number;
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
    try {
      const raw = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
      const items = raw as Array<{ name: string; quantity: number; price: number; selectedChoices?: string[] }>;
      if (!Array.isArray(items) || items.length === 0) return;
      const rate = exchangeRate || config?.exchangeRate || 1;
      const totalBs = order.total * rate;
      // ponytail: descuento derivado (no hay columna en orders); agregar columna discount si se necesita reportar
      const discount = (order.subtotal ?? 0) + (order.delivery_fee ?? 0) - order.total;
      const biBs = totalBs / 1.16;
      const taxBs = biBs * 0.16;
      const formatBs = (n: number) => n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const abbreviate = (text: string) => {
        const clean = text.replace(/[,;.]/g, '').toLowerCase();
        const stopWords = ['con', 'y', 'de', 'del', 'la', 'el', 'los', 'las', 'un', 'una'];
        return clean.split(' ').map(w => stopWords.includes(w) ? '' : w.length > 5 ? w.slice(0, 4) + '.' : w).filter(Boolean).join(' ');
      };
      const now = new Date(order.created_at);
      const dateStr = now.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const timeStr = now.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
      const receiptHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Factura Fiscal</title>
<style>
  @media print {
    @page { size: 80mm auto; margin: 0; }
    body { margin: 0; padding: 0; }
  }
  * {
    font-family: Arial, Helvetica, sans-serif !important;
  }
  body { 
    font-family: Arial, Helvetica, sans-serif !important; 
    font-size: 11px; 
    width: 270px; 
    margin: 0 auto; 
    padding: 10px 5px; 
    color: #000;
    line-height: 1.25;
  }
  .text-center { text-align: center; }
  .text-right { text-align: right; }
  .text-left { text-align: left; }
  .bold { font-weight: bold; }
  
  .header-title { font-size: 14px; font-weight: bold; margin-bottom: 2px; }
  .header-sub { font-size: 10px; margin: 1px 0; }
  
  .divider { 
    border-top: 1px dashed #000; 
    margin: 6px 0; 
  }
  
  .info-table, .items-table, .totals-table { 
    width: 100%; 
    border-collapse: collapse; 
  }
  
  .info-table td, .totals-table td { 
    padding: 1px 0; 
    font-size: 10px; 
    font-family: Arial, Helvetica, sans-serif !important;
  }
  
  .items-table th { 
    border-top: 1px dashed #000; 
    border-bottom: 1px dashed #000; 
    padding: 3px 0; 
    font-size: 10px; 
    font-weight: bold;
    font-family: Arial, Helvetica, sans-serif !important;
  }
  
  .items-table td { 
    padding: 3px 0; 
    font-size: 10px; 
    vertical-align: top;
    font-family: Arial, Helvetica, sans-serif !important;
  }
  
  .total-row { 
    font-weight: bold; 
    font-size: 11px;
  }
  
  .footer-text { 
    font-size: 9.5px; 
    margin-top: 4px; 
  }
</style>
</head>
<body>

  <div class="text-center">
    <div class="header-title">SENIAT</div>
    <div class="header-sub bold">RIF: ${config?.rif || 'J-302199232'}</div>
    <div class="header-sub bold">${config?.name || 'Wallace Panda Express'}</div>
    <div class="header-sub">${config?.businessAddress || 'Av. Bolivar Norte calle 133 Lopez Latouche, C.C las acacias Local 6, Valencia 2001, Carabobo'}</div>
  </div>

  <div class="divider"></div>

  <div class="text-center bold" style="font-size: 10px; margin-bottom: 3px;">*** DATOS DE CLIENTE ***</div>
  <table class="info-table">
    <tr><td class="bold">R.SOCIAL:</td><td class="text-right">${order.customer_name || 'CONTRIBUYENTE OCASIONAL'}</td></tr>
    <tr><td class="bold">RIF/CI:</td><td class="text-right">${order.cedula ? `V-${order.cedula}` : 'V-00000000'}</td></tr>
    <tr><td class="bold">VENDEDOR:</td><td class="text-right">0000</td></tr>
    <tr><td class="bold">FACTURA:</td><td class="text-right">${order.invoice_number || 'FAC-20260724-0032'}</td></tr>
    <tr><td class="bold">FECHA: ${dateStr}</td><td class="text-right bold">HORA: ${timeStr}</td></tr>
  </table>

  <table class="items-table" style="margin-top: 5px;">
    <thead>
      <tr>
        <th class="text-left" style="width: 55%;">Item</th>
        <th class="text-center" style="width: 15%;">Cant</th>
        <th class="text-right" style="width: 30%;">Precio Bs.</th>
      </tr>
    </thead>
    <tbody>
      ${items.map(i => {
        const itemTotalBs = i.price * i.quantity * rate;
        const choices = i.selectedChoices?.length ? ` (${i.selectedChoices.join(', ')})` : '';
        return `
          <tr>
            <td class="text-left">${i.name}${choices}</td>
            <td class="text-center">${i.quantity}</td>
            <td class="text-right">${formatBs(itemTotalBs)}</td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>

  <div class="divider"></div>

  <table class="totals-table">
    ${discount > 0.01 ? `
    <tr>
      <td>DESCUENTO</td>
      <td class="text-right">-Bs ${formatBs(discount * rate)}</td>
    </tr>` : ''}
    <tr>
      <td>SUBTTL</td>
      <td class="text-right">Bs ${formatBs(biBs)}</td>
    </tr>
    <tr>
      <td>EXENTO (E)</td>
      <td class="text-right">Bs 0,00</td>
    </tr>
    <tr>
      <td>BI G (16,00%)</td>
      <td class="text-right">Bs ${formatBs(biBs)}</td>
    </tr>
    <tr>
      <td>IVA G (16,00%)</td>
      <td class="text-right">Bs ${formatBs(taxBs)}</td>
    </tr>
  </table>

  <div class="divider"></div>

  <table class="totals-table">
    <tr class="total-row">
      <td>TOTAL</td>
      <td class="text-right">Bs ${formatBs(totalBs)}</td>
    </tr>
  </table>

  <div class="divider"></div>

  <table class="totals-table">
    <tr class="total-row">
      <td>TOTAL ${order.payment_method ? order.payment_method.toUpperCase() : 'N/A'}</td>
      <td class="text-right">Bs ${formatBs(totalBs)}</td>
    </tr>
    ${order.payment_method === 'Efectivo' && order.change_amount && order.change_amount > 0 ? `
      <tr>
        <td>VUELTO</td>
        <td class="text-right">${order.change_currency === 'USD' ? `$${order.change_amount.toFixed(2)}` : `Bs ${formatBs(order.change_amount * rate)}`}</td>
      </tr>
    ` : ''}
  </table>

  <div class="divider"></div>

  <div class="text-center footer-text">
    <div>GRA0000487 / MH</div>
    <div style="margin-top: 3px;">¡Gracias por su compra!</div>
    <div>wallacepanda.com</div>
  </div>

</body>
</html>`;
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(receiptHtml);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 2000);
      }, 500);
    }
    } catch (e) {
      console.error('Error al reimprimir factura:', e);
    }
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
// Corte History
// ==============================
function CorteHistoryModal({
  cortes, locationName, exchangeRate, onClose,
}: {
  cortes: CorteRecord[];
  locationName: string;
  exchangeRate: number;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<CorteRecord | null>(null);
  const [filterDate, setFilterDate] = useState('');
  const [filterCashier, setFilterCashier] = useState('');

  const formatDate = (d: string) => new Date(d).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
  const formatTime = (d: string) => new Date(d).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
  const formatBs = (v: number) => v.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const uniqueCashiers = [...new Set(cortes.map(c => c.cashier_name).filter(Boolean))];

  const filtered = cortes.filter(c => {
    if (filterDate && c.date !== filterDate) return false;
    if (filterCashier && c.cashier_name !== filterCashier) return false;
    return true;
  });

  const handleReprint = (c: CorteRecord) => {
    const w = window.open('', '_blank', 'width=320,height=600');
    if (w) { w.document.write(buildCorteReceipt(c, locationName, exchangeRate, null)); w.document.close(); setTimeout(() => { w.print(); w.close(); }, 400); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80"
    >
      <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
        className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 max-h-[90vh] flex flex-col"
      >
        <div className="flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-black text-white">Historial de Cortes</h2>
          <button onClick={onClose} className="p-2 bg-zinc-800 rounded-xl text-zinc-500 hover:text-white"><X /></button>
        </div>
        <p className="text-[10px] text-zinc-500 -mt-3">{locationName}</p>

        {!selected && (
          <div className="flex gap-2 flex-shrink-0">
            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-vibrant"
            />
            <select value={filterCashier} onChange={e => setFilterCashier(e.target.value)}
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-vibrant"
            >
              <option value="">Todos los cajeros</option>
              {uniqueCashiers.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-1.5">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-zinc-600 text-sm">Sin cortes registrados</div>
          ) : selected ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <button onClick={() => setSelected(null)}
                  className="text-[10px] font-bold text-primary-vibrant hover:underline flex items-center gap-1"
                >
                  ← Volver al listado
                </button>
                <button onClick={() => handleReprint(selected)}
                  className="p-2 bg-zinc-800 rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-700 transition-all"
                  title="Reimprimir"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>
              <div className="bg-zinc-950 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-500">{formatDate(selected.date)}</span>
                  <span className="text-[10px] text-zinc-600">{formatTime(selected.closed_at)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Cajero/a</span>
                  <span className="font-bold text-white">{selected.cashier_name}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800">
                  <div>
                    <p className="text-[10px] text-zinc-500">Pedidos</p>
                    <p className="text-lg font-black text-white">{selected.order_count}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500">Total</p>
                    <p className="text-lg font-black text-green-400">${selected.grand_total.toFixed(2)}</p>
                    <p className="text-[10px] text-zinc-500">{formatBs(selected.grand_total * (selected.exchange_rate || exchangeRate))} Bs.</p>
                  </div>
                </div>
                <div className="space-y-1 pt-2 border-t border-zinc-800">
                  {[
                    { label: 'Efectivo $', usd: selected.total_efectivo_usd, bs: selected.total_efectivo_bs, color: 'text-green-400', showUsd: true },
                    { label: 'Efectivo Bs', usd: null, bs: selected.total_efectivo_bs, color: 'text-yellow-400', showUsd: false },
                    { label: 'Tarjeta', usd: corteUsd(selected.total_tarjeta_bs, selected.total_tarjeta_usd, selected.exchange_rate || exchangeRate), bs: selected.total_tarjeta_bs, color: 'text-blue-400', showUsd: true },
                    { label: 'Pago Móvil', usd: corteUsd(selected.total_pagomovil_bs, selected.total_pagomovil_usd, selected.exchange_rate || exchangeRate), bs: selected.total_pagomovil_bs, color: 'text-purple-400', showUsd: true },
                  ].map(({ label, usd, bs, color, showUsd }) => (
                    <div key={label} className="flex justify-between text-xs">
                      <span className="text-zinc-500">{label}</span>
                      <div className="text-right">
                        {showUsd && usd !== null && (
                          <span className={`font-bold ${color}`}>${usd.toFixed(2)}</span>
                        )}
                        <span className={`font-bold ${color} ${showUsd ? 'text-[10px] ml-1' : ''}`}>Bs {formatBs(bs)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-zinc-800">
                  <ArqueoTable c={selected} />
                </div>
              </div>
            </div>
          ) : (
            filtered.map(c => (
              <button key={c.id} onClick={() => setSelected(c)}
                className="w-full flex items-center justify-between bg-zinc-950 p-3 rounded-xl hover:bg-zinc-900 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-sm font-bold text-white">{formatDate(c.date)}</span>
                    <span className="text-[10px] text-zinc-600">{formatTime(c.closed_at)}</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {c.order_count} pedidos · ${c.grand_total.toFixed(2)} · {c.cashier_name}
                    {corteArqueo(c) && (corteArqueo(c)!.every(cuadra)
                      ? <span className="ml-2 text-green-400 font-bold">Cuadra</span>
                      : <span className="ml-2 text-red-400 font-bold">Descuadre</span>)}
                  </p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleReprint(c); }}
                  className="p-2 bg-zinc-800 rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-700 transition-all flex-shrink-0"
                  title="Reimprimir"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </button>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ==============================
// Ventas en espera (pausadas)
// ==============================
interface PausedSale {
  id: string;
  pausedAt: number;
  cashierName: string;
  cart: POSCartItem[];
  customerName: string;
  customerPhone: string;
  customerCedula: string;
  deliveryType: 'Delivery' | 'Pick-up';
  orderCode: string;
  loadedOrderId: string | null;
  loadedPaymentMethod: PaymentMethod | null;
  loadedDeliveryFee: number;
  total: number;
}

// Se guardan por sede en este navegador: sobreviven recargas y cambios de cajero.
const pausedSalesKey = (locationId: string) => `pos_paused_sales_${locationId}`;

function loadPausedSales(locationId: string): PausedSale[] {
  if (!locationId) return [];
  try {
    const raw = localStorage.getItem(pausedSalesKey(locationId));
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

function savePausedSales(locationId: string, sales: PausedSale[]) {
  if (!locationId) return;
  try {
    if (sales.length === 0) localStorage.removeItem(pausedSalesKey(locationId));
    else localStorage.setItem(pausedSalesKey(locationId), JSON.stringify(sales));
  } catch { /* storage lleno o bloqueado: se mantienen en memoria */ }
}

function formatWaitTime(pausedAt: number, now: number): string {
  const mins = Math.max(0, Math.floor((now - pausedAt) / 60000));
  if (mins < 1) return 'hace menos de 1 min';
  if (mins < 60) return `hace ${mins} min`;
  return `hace ${Math.floor(mins / 60)} h ${mins % 60} min`;
}

function PausedSalesModal({
  sales,
  onResume,
  onDiscard,
  onClose,
}: {
  sales: PausedSale[];
  onResume: (id: string) => void;
  onDiscard: (id: string) => void;
  onClose: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80"
    >
      <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
        className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 max-h-[90vh] flex flex-col"
      >
        <div className="flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-black text-white">Ventas en espera</h2>
          <button onClick={onClose} className="p-2 bg-zinc-800 rounded-xl text-zinc-500 hover:text-white"><X /></button>
        </div>
        <p className="text-[10px] text-zinc-500 -mt-3">Retoma una venta pausada para terminar de cobrarla.</p>

        <div className="flex-1 overflow-y-auto space-y-2">
          {sales.length === 0 ? (
            <div className="text-center py-12 text-zinc-600 text-sm">No hay ventas en espera</div>
          ) : (
            [...sales].sort((a, b) => a.pausedAt - b.pausedAt).map(sale => {
              const items = sale.cart.reduce((n, i) => n + i.quantity, 0);
              return (
                <div key={sale.id} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white truncate">{sale.customerName.trim() || 'Sin nombre'}</span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${sale.deliveryType === 'Delivery' ? 'bg-amber-500/15 text-amber-400' : 'bg-zinc-800 text-zinc-400'}`}>
                        {sale.deliveryType === 'Delivery' ? 'Delivery' : 'Pickup'}
                      </span>
                      {sale.orderCode && (
                        <span className="text-[9px] font-mono font-bold text-zinc-500">#{sale.orderCode}</span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-500 truncate">
                      {items} {items === 1 ? 'item' : 'items'} · {sale.cart.map(i => i.product.name).join(', ')}
                    </div>
                    <div className="text-[10px] text-zinc-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatWaitTime(sale.pausedAt, now)}{sale.cashierName ? ` · ${sale.cashierName}` : ''}
                    </div>
                  </div>
                  <div className="text-primary-vibrant font-black text-base whitespace-nowrap">${sale.total.toFixed(2)}</div>
                  <div className="flex flex-col gap-1.5">
                    <button onClick={() => onResume(sale.id)}
                      className="px-3 py-1.5 bg-primary-vibrant text-white rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 hover:opacity-90"
                    >
                      <Play className="w-3 h-3" /> Retomar
                    </button>
                    <button onClick={() => { if (window.confirm('¿Eliminar esta venta en espera? No se podrá recuperar.')) onDiscard(sale.id); }}
                      className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 hover:bg-red-500/20"
                    >
                      <Trash2 className="w-3 h-3" /> Eliminar
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ==============================
// Main POS Page
// ==============================
function loadCashier(): Cashier | null {
  try {
    const raw = localStorage.getItem('pos_cashier');
    if (!raw) return null;
    const data = JSON.parse(raw);
    // Sesiones guardadas antes de los tokens no sirven para cobrar: pedir PIN de nuevo
    if (Date.now() - data.timestamp > 86400000 || !data.cashier?.token) {
      localStorage.removeItem('pos_cashier');
      return null;
    }
    return data.cashier as Cashier;
  } catch { return null; }
}

function saveCashier(c: Cashier) {
  localStorage.setItem('pos_cashier', JSON.stringify({ cashier: c, timestamp: Date.now() }));
}

function clearCashier() {
  localStorage.removeItem('pos_cashier');
}

export function PosPage() {
  const { menuItems, categories, locations, config, findCustomer } = useRestaurant();
  const [cashier, setCashier] = useState<Cashier | null>(() => loadCashier());
  const cashierToken = cashier?.token;

  // La sesión vence en el servidor (16 h): si ya no vale, volver al PIN
  useEffect(() => {
    if (!cashierToken) return;
    supabase.rpc('pos_whoami', { p_token: cashierToken }).then(({ data, error }) => {
      if (!error && !data) setCashier(null);
    });
  }, [cashierToken]);

  const logout = () => {
    if (cashierToken) supabase.rpc('pos_logout', { p_token: cashierToken }).then();
    setCashier(null);
  };
  const [activeCategory, setActiveCategory] = useState('Todas');
  const [cart, setCart] = useState<POSCartItem[]>([]);
  const [search, setSearch] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCedula, setCustomerCedula] = useState('');
  const [isLookingUpCustomer, setIsLookingUpCustomer] = useState(false);
  const [deliveryType, setDeliveryType] = useState<'Delivery' | 'Pick-up'>('Pick-up');
  const [showPayModal, setShowPayModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showCorteDeCaja, setShowCorteDeCaja] = useState(false);
  const [showCorteHistory, setShowCorteHistory] = useState(false);
  const [showInvoiceHistory, setShowInvoiceHistory] = useState(false);
  const [editingRate, setEditingRate] = useState(false);
  const [editRateValue, setEditRateValue] = useState('');
  const queryClient = useQueryClient();
  const [showReceipt, setShowReceipt] = useState<{
    items: POSCartItem[];
    total: number;
    discount: number;
    paymentMethod: PaymentMethod;
    changeAmount: number;
    changeCurrency: 'USD' | 'BS';
    invoiceNumber: string;
  } | null>(null);
  const locationId = cashier?.location_id || '';
  const [choiceProduct, setChoiceProduct] = useState<Product | null>(null);
  const [orderCode, setOrderCode] = useState('');
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [orderCodeError, setOrderCodeError] = useState('');
  const [loadedOrderId, setLoadedOrderId] = useState<string | null>(null);
  const [loadedPaymentMethod, setLoadedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [loadedDeliveryFee, setLoadedDeliveryFee] = useState<number>(0);
  // Ventas en espera, ligadas a la sede para no mezclar ni sobrescribir las de otra
  const [pausedState, setPausedState] = useState(() => ({ locationId, sales: loadPausedSales(locationId) }));
  const pausedSales = pausedState.locationId === locationId ? pausedState.sales : [];
  const setPausedSales = useCallback((update: (prev: PausedSale[]) => PausedSale[]) => {
    setPausedState(prev => ({ locationId: prev.locationId, sales: update(prev.sales) }));
  }, []);
  const [showPausedSales, setShowPausedSales] = useState(false);
  const [localRate, setLocalRate] = useState(() => {
    try {
      const saved = localStorage.getItem('pos_local_rate');
      if (saved) { const v = parseFloat(saved); if (v > 0) return v; }
    } catch {}
    return config.exchangeRate ?? 1;
  });

  useEffect(() => {
    localStorage.setItem('pos_local_rate', String(localRate));
  }, [localRate]);

  useEffect(() => {
    if (cashier) saveCashier(cashier); else clearCashier();
  }, [cashier]);

  // Ventas en espera: se recargan al cambiar de sede y se guardan en cada cambio
  useEffect(() => {
    if (pausedState.locationId !== locationId) setPausedState({ locationId, sales: loadPausedSales(locationId) });
  }, [locationId, pausedState.locationId]);
  useEffect(() => {
    savePausedSales(pausedState.locationId, pausedState.sales);
  }, [pausedState]);

  // Fetch orders for the POS location (separate from context query which requires Supabase auth)
  const posOrdersQuery = useQuery({
    queryKey: ['pos-orders', locationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('location_id', locationId)
        .order('created_at', { ascending: false })
        .limit(500);
      return (data || []).map((row: any): Order => ({
        id: row.id,
        location_id: row.location_id,
        customer_name: row.customer_name,
        customer_phone: row.customer_phone,
        cedula: row.cedula || '',
        delivery_type: row.delivery_type as DeliveryType,
        delivery_address: row.delivery_address,
        delivery_coordinates: row.delivery_coordinates,
        items: row.items,
        subtotal: row.subtotal,
        delivery_fee: row.delivery_fee,
        total: row.total,
        notes: row.notes || '',
        status: row.status as OrderStatus,
        payment_method: row.payment_method,
        change_amount: row.change_amount ?? 0,
        cashier_id: row.cashier_id,
        invoice_number: row.invoice_number || '',
        payment_currency: row.payment_currency || null,
        change_currency: row.change_currency || null,
        paid_at: row.paid_at || null,
        corte_id: row.corte_id || null,
        created_at: row.created_at,
      }));
    },
    enabled: !!cashier && !!locationId,
    staleTime: 10000,
  });

  // Fetch cortes for this location
  const cortesQuery = useQuery({
    queryKey: ['cortes', locationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('cortes')
        .select('*')
        .eq('location_id', locationId)
        .order('closed_at', { ascending: false })
        .limit(50);
      return (data || []).map(toCorteRecord);
    },
    enabled: !!cashier && !!locationId,
    staleTime: 5000,
  });
  const cortes = cortesQuery.data || [];

  // Today's corte (if exists)
  const todayStr = new Date().toISOString().slice(0, 10);
  const isFormValid =
    customerCedula.trim().length >= 6 &&
    customerName.trim().length >= 4 &&
    /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{4,}$/.test(customerName.trim()) &&
    customerPhone.startsWith('04') &&
    customerPhone.replace(/\D/g, '').length === 11;

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

  const getChoiceAdjust = useCallback((product: Product, selectedChoices?: string[]) => {
    if (!selectedChoices || !product.choices) return 0;
    return product.choices.filter(c => selectedChoices.includes(c.name)).reduce((s, c) => s + (c.priceAdjust ?? 0), 0);
  }, []);

  const cartTotal = useMemo(() => cart.reduce((s, i) => s + (i.product.price + getChoiceAdjust(i.product, i.selectedChoices)) * i.quantity, 0), [cart, getChoiceAdjust]);
  const manualDeliveryFee = deliveryType === 'Delivery' && !loadedOrderId ? (config.deliveryFee ?? 0) : 0;
  const orderTotal = useMemo(() => cartTotal + loadedDeliveryFee + manualDeliveryFee, [cartTotal, loadedDeliveryFee, manualDeliveryFee]);
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

  const handlePayment = useCallback(async (splits: { method: PaymentMethod; amount: number; currency?: 'USD' | 'BS'; ref?: string }[], changeAmount: number, discount = 0, changeCurrency: 'USD' | 'BS' = 'USD') => {
    if (!cashier || !locationId || cart.length === 0 || processingPayment) return;
    setProcessingPayment(true);
    const finalTotal = Math.max(0, orderTotal - discount);

    const orderItems = cart.map(i => ({
      id: i.product.id,
      name: i.product.name,
      price: i.product.price + getChoiceAdjust(i.product, i.selectedChoices),
      quantity: i.quantity,
      notes: i.notes || '',
      selectedChoices: i.selectedChoices || [],
    }));

    const primaryMethod = splits.length === 1 ? splits[0].method : 'Mixto';
    const primaryCurrency = splits.length === 1 ? splits[0].currency : undefined;
    const primaryRef = splits.length === 1 ? splits[0].ref : undefined;

    try {
      const { data, error } = await supabase.rpc('pos_cobrar', {
        p_token: cashier.token,
        p_order_id: loadedOrderId,
        p_order: {
          customer_name: customerName,
          customer_phone: customerPhone,
          cedula: customerCedula,
          delivery_type: deliveryType,
          items: orderItems,
          subtotal: cartTotal,
          delivery_fee: orderTotal - cartTotal,
          total: finalTotal,
          payment_method: primaryMethod,
          payment_ref: primaryRef || '',
          payment_currency: primaryCurrency || '',
        },
        p_payments: splits.map(s => ({ method: s.method, amount: s.amount, currency: s.currency || '', ref: s.ref || '' })),
        p_exchange_rate: localRate,
        p_change_amount: changeAmount,
        p_change_currency: changeAmount > 0 ? changeCurrency : null,
      });
      if (error) throw error;
      const invoiceNumber: string = data.invoice_number;

      posOrdersQuery.refetch();

      setShowPayModal(false);
      setShowReceipt({ items: cart, total: finalTotal, discount, paymentMethod: primaryMethod, changeAmount, changeCurrency, invoiceNumber });
    } catch (err) {
      console.error('Error processing payment:', err);
      alert(`Error al procesar la venta: ${(err as { message?: string })?.message || 'intenta de nuevo'}`);
    } finally {
      setProcessingPayment(false);
    }
  }, [cashier, locationId, cart, cartTotal, orderTotal, customerName, customerPhone, customerCedula, deliveryType, loadedOrderId, localRate, posOrdersQuery, processingPayment]);

  const resetSale = () => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerCedula('');
    setDeliveryType('Pick-up');
    setOrderCode('');
    setOrderCodeError('');
    setLoadedOrderId(null);
    setLoadedPaymentMethod(null);
    setLoadedDeliveryFee(0);
  };

  const handleNewSale = () => {
    resetSale();
    setShowReceipt(null);
  };

  const snapshotCurrentSale = (): PausedSale => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    pausedAt: Date.now(),
    cashierName: cashier?.name || '',
    cart,
    customerName,
    customerPhone,
    customerCedula,
    deliveryType,
    orderCode: loadedOrderId ? orderCode : '',
    loadedOrderId,
    loadedPaymentMethod,
    loadedDeliveryFee,
    total: orderTotal,
  });

  const handlePauseSale = () => {
    if (cart.length === 0) return;
    setPausedSales(prev => [...prev, snapshotCurrentSale()]);
    resetSale();
  };

  const handleDiscardPaused = (id: string) => {
    setPausedSales(prev => prev.filter(s => s.id !== id));
  };

  const handleResumeSale = async (id: string) => {
    const sale = pausedSales.find(s => s.id === id);
    if (!sale) return;

    // Si era un pedido web, verificar que otra caja no lo haya facturado mientras estaba en espera
    if (sale.loadedOrderId) {
      const { data } = await supabase.from('orders').select('status, invoice_number').eq('id', sale.loadedOrderId).maybeSingle();
      if (data && data.status !== 'pendiente') {
        const detail = data.status === 'exitoso'
          ? `ya fue facturado${data.invoice_number ? ` (factura ${data.invoice_number})` : ''}`
          : 'fue cancelado';
        if (window.confirm(`El pedido #${sale.orderCode || ''} ${detail}. ¿Quitarlo de la lista de espera?`)) {
          handleDiscardPaused(id);
        }
        return;
      }
    }

    // Si hay una venta a medio hacer, se pausa en lugar de perderse
    const current = cart.length > 0 ? snapshotCurrentSale() : null;
    setPausedSales(prev => {
      const rest = prev.filter(s => s.id !== id);
      return current ? [...rest, current] : rest;
    });

    // Refrescar productos con el menú actual (precios / opciones)
    setCart(sale.cart.map(item => {
      const fresh = menuItems.find(p => p.id === item.product.id);
      return fresh ? { ...item, product: fresh } : item;
    }));
    setCustomerName(sale.customerName);
    setCustomerPhone(sale.customerPhone);
    setCustomerCedula(sale.customerCedula);
    setDeliveryType(sale.deliveryType);
    setOrderCode(sale.orderCode);
    setOrderCodeError('');
    setLoadedOrderId(sale.loadedOrderId);
    setLoadedPaymentMethod(sale.loadedPaymentMethod);
    setLoadedDeliveryFee(sale.loadedDeliveryFee);
    setShowPausedSales(false);
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
        .eq('code', code)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        setOrderCodeError('Código no encontrado');
        setIsLoadingOrder(false);
        return;
      }

      // Store original order ID, payment method, and delivery fee for POS validation
      setLoadedOrderId(data.id);
      setLoadedPaymentMethod((data.payment_method as PaymentMethod) || null);
      setLoadedDeliveryFee(data.delivery_fee ?? 0);

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

  const locationName = locations.find(l => l.id === locationId)?.name || 'Seleccionar sede';

  return (
    <main id="main-content" className="h-screen bg-dark text-white flex flex-col font-body overflow-hidden">
      {/* Top bar */}
      <header className="bg-dark-card border-b border-zinc-800 px-4 md:px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="font-display text-xl uppercase tracking-wider text-white max-md:hidden">POS</h1>
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-primary-vibrant" />
            <span className="font-bold text-zinc-300">{cashier.name}</span>
          </div>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{locationName}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowPausedSales(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
              pausedSales.length > 0
                ? 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25'
                : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
            }`}
          >
            <Pause className="w-3.5 h-3.5" /> En espera{pausedSales.length > 0 ? ` (${pausedSales.length})` : ''}
          </button>
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
          <button onClick={() => setShowCorteHistory(true)}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 rounded-xl text-[10px] font-bold text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all"
          >
            <Calendar className="w-3.5 h-3.5" /> Historial
          </button>
          <span className="text-xs text-zinc-500 font-mono">{new Date().toLocaleTimeString('es-VE')}</span>
          {editingRate ? (
            <input autoFocus
              className="w-20 text-[10px] font-black text-primary-vibrant bg-zinc-800 px-2.5 py-1 rounded-lg text-center outline-none ring-2 ring-primary-vibrant"
              type="number" step="0.01" min="0"
              value={editRateValue}
              onChange={e => setEditRateValue(e.target.value)}
              onBlur={async () => {
                const v = parseFloat(editRateValue);
                if (v > 0) {
                  setLocalRate(v);
                  if (v !== localRate) {
                    await supabase.rpc('pos_update_rate', { p_token: cashierToken, p_rate: v });
                    queryClient.refetchQueries({ queryKey: ['config'] });
                  }
                }
                setEditingRate(false);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                if (e.key === 'Escape') setEditingRate(false);
              }}
            />
          ) : (
            <button onClick={() => { setEditRateValue(String(localRate ?? '')); setEditingRate(true); }}
              className="text-[10px] font-black text-primary-vibrant bg-primary-vibrant/10 px-2.5 py-1 rounded-lg flex items-center gap-1 hover:bg-primary-vibrant/20 transition-all cursor-text"
            >
              <DollarSign className="w-3 h-3" /> Bs. {localRate?.toFixed(2) || 'N/A'}
            </button>
          )}
          <button onClick={logout}
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
              placeholder="Cliente (mín. 4 letras)"
              className={`w-full bg-zinc-900 border rounded-xl px-3 py-2 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-primary-vibrant ${customerName.trim().length > 0 && customerName.trim().length < 4 ? 'border-red-500/50' : 'border-zinc-800'}`}
            />
            <div className="flex gap-2">
              <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="Teléfono 04XX-XXXXXXX"
                className={`flex-1 bg-zinc-900 border rounded-xl px-3 py-2 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-primary-vibrant ${customerPhone.length > 0 && customerPhone.replace(/\D/g, '').length !== 11 ? 'border-red-500/50' : 'border-zinc-800'}`}
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
                      placeholder="Código de orden (ej: A3K9)"
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
                  <div className="text-primary-vibrant font-black text-sm">${(item.product.price + getChoiceAdjust(item.product, item.selectedChoices)).toFixed(2)}</div>
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
            {loadedDeliveryFee > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 font-bold text-sm">Delivery:</span>
                <span className="font-bold text-white">${loadedDeliveryFee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-lg font-black text-white">Total:</span>
              <span className="text-2xl font-black text-primary-vibrant">${orderTotal.toFixed(2)}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={handlePauseSale} disabled={cart.length === 0}
                title="Poner la venta en espera y atender otro pedido"
                className="px-4 bg-zinc-800 text-amber-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Pause className="w-4 h-4" /> Pausar
              </button>
              <button onClick={() => setShowPayModal(true)} disabled={cart.length === 0 || !isFormValid}
                className="flex-1 bg-primary-vibrant text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                <DollarSign className="w-5 h-5" /> Cobrar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile cart button */}
      {cartCount > 0 && (
        <button onClick={handlePauseSale} aria-label="Pausar venta"
          className="lg:hidden fixed bottom-4 left-4 w-14 bg-zinc-800 text-amber-400 rounded-2xl shadow-2xl z-40 flex items-center justify-center active:scale-95 transition-transform h-[60px]"
        >
          <Pause className="w-5 h-5" />
        </button>
      )}
      {cartCount > 0 && (
        <button onClick={() => setShowPayModal(true)} disabled={!isFormValid}
          className="lg:hidden fixed bottom-4 left-20 right-4 bg-primary-vibrant text-white p-4 rounded-2xl font-black shadow-2xl shadow-primary-vibrant/30 z-40 flex items-center justify-between active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          <span className="flex items-center gap-2"><ShoppingCart className="w-5 h-5" /> {cartCount} items</span>
          <span className="text-lg">${orderTotal.toFixed(2)}</span>
        </button>
      )}

      {/* Payment modal */}
      <AnimatePresence>
        {showPayModal && (
          <PaymentModal total={orderTotal} subtotal={cartTotal} onConfirm={handlePayment} onClose={() => setShowPayModal(false)} exchangeRate={localRate ?? 1} originalPaymentMethod={loadedPaymentMethod} isProcessing={processingPayment} />
        )}
      </AnimatePresence>

      {/* Receipt modal */}
      <AnimatePresence>
        {showReceipt && (
          <ReceiptModal
            items={showReceipt.items}
            total={showReceipt.total}
            discount={showReceipt.discount}
            paymentMethod={showReceipt.paymentMethod}
            changeAmount={showReceipt.changeAmount}
            changeCurrency={showReceipt.changeCurrency}
            invoiceNumber={showReceipt.invoiceNumber}
            cashierName={cashier?.name || ''}
            customerName={customerName}
            customerCedula={customerCedula || undefined}
            config={{ rif: config.rif, businessAddress: config.businessAddress, businessPhone: config.businessPhone, name: config.name, exchangeRate: localRate }}
            locationName={locationName}
            exchangeRate={localRate ?? 1}
            onClose={() => setShowReceipt(null)}
            onNewSale={handleNewSale}
          />
        )}
      </AnimatePresence>

      {/* Corte de Caja modal */}
      <AnimatePresence>
        {showCorteDeCaja && (
          <CorteDeCajaModal
            orders={posOrdersQuery.data || []}
            cortes={cortes}
            locationId={locationId}
            locationName={locationName}
            cashier={cashier}
            exchangeRate={localRate ?? 1}
            onCorteSaved={() => cortesQuery.refetch()}
            onClose={() => setShowCorteDeCaja(false)}
          />
        )}
      </AnimatePresence>

      {/* Corte History modal */}
      <AnimatePresence>
        {showCorteHistory && (
          <CorteHistoryModal
            cortes={cortes}
            locationName={locationName}
            exchangeRate={localRate ?? 1}
            onClose={() => setShowCorteHistory(false)}
          />
        )}
      </AnimatePresence>

      {/* Invoice History modal */}
      <AnimatePresence>
        {showInvoiceHistory && (
          <InvoiceHistoryModal
            orders={posOrdersQuery.data || []}
            locationId={locationId}
            config={{ rif: config.rif, businessAddress: config.businessAddress, businessPhone: config.businessPhone, name: config.name, exchangeRate: localRate }}
            locationName={locationName}
            exchangeRate={localRate ?? 1}
            onClose={() => setShowInvoiceHistory(false)}
          />
        )}
      </AnimatePresence>

      {/* Paused sales modal */}
      <AnimatePresence>
        {showPausedSales && (
          <PausedSalesModal
            sales={pausedSales}
            onResume={handleResumeSale}
            onDiscard={handleDiscardPaused}
            onClose={() => setShowPausedSales(false)}
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
    </main>
  );
}

export default PosPage;