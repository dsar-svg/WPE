import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Minus, Trash2, ShoppingCart, X, Check, Printer, DollarSign, CreditCard, Smartphone, Banknote, LogOut, User, IdCard, Calendar, History, Loader2, QrCode, Truck, Store } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRestaurant } from '../context/RestaurantContext';
import { Product, Cashier, POSCartItem, PaymentMethod, Order, OrderStatus, DeliveryType } from '../types';
import { supabase } from '../lib/supabase';
import { OptimizedImage } from '../components/ui/OptimizedImage';

import { ChoiceSelectorModal } from '../components/ui/ChoiceSelectorModal';
import { hashPin } from '../lib/hashPin';

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
      const pinHash = await hashPin(pin);
      let { data } = await supabase
        .from('admins')
        .select('*')
        .eq('pin_hash', pinHash)
        .limit(1)
        .maybeSingle();
      if (!data) {
        const { data: fallback } = await supabase
          .from('admins')
          .select('*')
          .eq('pin', pin)
          .limit(1)
          .maybeSingle();
        data = fallback;
        if (fallback) {
          supabase.from('admins').update({ pin_hash: pinHash }).eq('id', fallback.id).then();
        }
      }
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
type PaymentSplit = { method: PaymentMethod; amount: number; currency?: 'USD' | 'BS'; ref?: string };

function PaymentModal({
  total, onConfirm, onClose, exchangeRate, originalPaymentMethod,
}: {
  total: number;
  onConfirm: (splits: PaymentSplit[], changeAmount: number) => void;
  onClose: () => void;
  exchangeRate: number;
  originalPaymentMethod?: PaymentMethod | null;
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
  const [amountReceived, setAmountReceived] = useState('');
  const [amountCurrency, setAmountCurrency] = useState<'USD' | 'BS'>('USD');
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
  const totalBs = total * rate;

  // Split mode calculations — normalize all to USD before summing
  const splitTotal = splits.reduce((s, p) => s + (p.currency === 'BS' ? p.amount / rate : p.amount), 0);
  const splitRemaining = Math.max(0, total - splitTotal);
  const splitValid = splits.length > 0 && Math.abs(splitRemaining) < 0.01 && splits.every(s => s.amount > 0);

  const canConfirm = isSplit
    ? splitValid
    : isCashEnough && (!methodChanged || confirmChange);

  const handleConfirm = () => {
    if (!canConfirm) return;
    if (isSplit) {
      onConfirm(splits.filter(s => s.amount > 0), 0);
    } else {
      onConfirm([{ method, amount: method === 'Efectivo' ? amountReceivedUsd : total, currency: method === 'Efectivo' ? amountCurrency : undefined, ref: paymentRef || undefined }], changeAmount);
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
          <p className="text-5xl font-black text-white">${total.toFixed(2)}</p>
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
                    }}
                      className="px-3 bg-zinc-800 rounded-2xl text-white font-bold text-sm hover:bg-zinc-700 transition-all flex items-center"
                    >
                      {amountCurrency === 'USD' ? 'Bs' : '$'}
                    </button>
                  </div>
                </div>
                {parseFloat(amountReceived) > 0 && (
                  <div className={`p-4 rounded-2xl text-center ${isCashEnough ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Vuelto</p>
                    <p className={`text-3xl font-black ${isCashEnough ? 'text-green-400' : 'text-red-400'}`}>
                      {amountCurrency === 'USD'
                        ? `$${changeAmount.toFixed(2)}`
                        : `${(changeAmount * rate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.`
                      }
                    </p>
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

        <button onClick={handleConfirm} disabled={!canConfirm}
          className="w-full bg-primary-vibrant text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          <DollarSign className="w-5 h-5" />
          {isSplit ? `Cerrar venta mixta $${total.toFixed(2)} / ${totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.` : method === 'Efectivo' ? `Cerrar venta $${total.toFixed(2)}` : `Cerrar venta con ${method}`}
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
  items, total, paymentMethod, changeAmount, cashierName, customerName, customerCedula, invoiceNumber, config, locationName, exchangeRate, onClose: _onClose, onNewSale,
}: {
  items: POSCartItem[];
  total: number;
  paymentMethod: PaymentMethod;
  changeAmount: number;
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
        <td class="text-right">Bs ${formatBs(changeAmount * rate)}</td>
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
  const [error, setError] = useState('');
  const [orderPaymentsMap, setOrderPaymentsMap] = useState<Record<string, { payment_method: string; amount: number; currency?: string }[]>>({});

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCortes = useMemo(() => cortes.filter(c => c.date === todayStr && c.cashier_id === cashier?.id).sort((a, b) => new Date(b.closed_at).getTime() - new Date(a.closed_at).getTime()), [cortes, todayStr, cashier?.id]);
  const existingCorte = todayCortes[0] || null;

  const todayOrders = useMemo(() => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return orders.filter(o =>
      o.location_id === locationId &&
      o.status === 'exitoso' &&
      o.cashier_id === cashier?.id &&
      new Date(o.created_at) >= startOfDay
    );
  }, [orders, locationId, cashier?.id]);

  // Always filter orders after the last corte (auto-reset after save)
  const activeOrders = useMemo(() => {
    const ref = saved || existingCorte;
    if (!ref) return todayOrders;
    const corteTime = new Date(ref.closed_at);
    return todayOrders.filter(o => new Date(o.created_at) > corteTime);
  }, [todayOrders, existingCorte, saved]);

  // Fetch order_payments for active orders to handle split payments
  useEffect(() => {
    if (activeOrders.length === 0) { setOrderPaymentsMap({}); return; }
    const orderIds = activeOrders.map(o => o.id);
    supabase.from('order_payments').select('order_id, payment_method, amount, currency')
      .in('order_id', orderIds)
      .then(({ data }) => {
        const map: Record<string, { payment_method: string; amount: number; currency?: string }[]> = {};
        (data || []).forEach(row => {
          if (!map[row.order_id]) map[row.order_id] = [];
          map[row.order_id].push(row);
        });
        setOrderPaymentsMap(map);
      });
  }, [activeOrders]);

  // Aggregate totals: prefer order_payments (split-aware), fall back to order.payment_method
  // RULE: Tarjeta and PagoMóvil are ALWAYS in BS. Convert USD amounts to BS using exchangeRate.
  const { totalEfectivoUsd, totalEfectivoBs, totalTarjetaBs, totalPagoMovilBs } = useMemo(() => {
    let eUsd = 0, eBs = 0, tBs = 0, pmBs = 0;
    const rate = exchangeRate || 1;
    for (const o of activeOrders) {
      const splits = orderPaymentsMap[o.id];
      if (splits && splits.length > 0) {
        for (const sp of splits) {
          if (sp.payment_method === 'Efectivo') {
            if (sp.currency === 'BS') eBs += sp.amount;
            else eUsd += sp.amount;
          } else if (sp.payment_method === 'Tarjeta') {
            // Tarjeta is always BS — convert USD amounts to BS
            tBs += (sp.currency === 'BS') ? sp.amount : sp.amount * rate;
          } else if (sp.payment_method === 'PagoMóvil') {
            // PagoMóvil is always BS — convert USD amounts to BS
            pmBs += (sp.currency === 'BS') ? sp.amount : sp.amount * rate;
          }
        }
      } else {
        // Legacy: no splits stored, use order-level fields
        // NOTE: o.total is always in USD. Convert to BS when needed.
        if (o.payment_method === 'Efectivo') {
          if (o.payment_currency === 'BS') eBs += o.total * rate;
          else eUsd += o.total;
        } else if (o.payment_method === 'Tarjeta') {
          // Tarjeta is always BS — order.total is USD, convert to BS
          tBs += o.total * rate;
        } else if (o.payment_method === 'PagoMóvil') {
          // PagoMóvil is always BS — order.total is USD, convert to BS
          pmBs += o.total * rate;
        }
      }
    }
    return { totalEfectivoUsd: eUsd, totalEfectivoBs: eBs, totalTarjetaBs: tBs, totalPagoMovilBs: pmBs };
  }, [activeOrders, orderPaymentsMap, exchangeRate]);
  const totalEfectivo = totalEfectivoUsd + (totalEfectivoBs / (exchangeRate || 1));
  const totalTarjeta = totalTarjetaBs / (exchangeRate || 1);
  const totalPagoMovil = totalPagoMovilBs / (exchangeRate || 1);
  const granTotal = activeOrders.reduce((s, o) => s + o.total, 0);
  const count = activeOrders.length;
  const rate = exchangeRate || 1;
  const formatBs = (n: number) => n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const deliveryCount = activeOrders.filter(o => o.delivery_type === 'Delivery').length;
  const pickupCount = activeOrders.filter(o => o.delivery_type === 'Pick-up').length;
  const deliveryTotal = activeOrders.filter(o => o.delivery_type === 'Delivery').reduce((s, o) => s + o.total, 0);
  const pickupTotal = activeOrders.filter(o => o.delivery_type === 'Pick-up').reduce((s, o) => s + o.total, 0);

  const sortedOrders = [...activeOrders].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const timeFrom = sortedOrders.length > 0 ? new Date(sortedOrders[0].created_at).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }) : '--:--';
  const timeTo = sortedOrders.length > 0 ? new Date(sortedOrders[sortedOrders.length - 1].created_at).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }) : '--:--';

  const dateStr = new Date().toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' });

  const handleSaveCorte = async () => {
    setSaving(true);
    setError('');
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const fromTime = existingCorte ? existingCorte.closed_at : startOfDay.toISOString();
      const { error: insertError } = await supabase.from('cortes').insert({
        location_id: locationId,
        cashier_id: cashier?.id || '',
        cashier_name: cashier?.employee_id || cashier?.name || '',
        date: todayStr,
        closed_at: now.toISOString(),
        order_count: count,
        total_efectivo: totalEfectivo,
        total_efectivo_usd: totalEfectivoUsd,
        total_efectivo_bs: totalEfectivoBs,
        total_tarjeta: totalTarjeta,
        total_tarjeta_usd: 0,
        total_tarjeta_bs: totalTarjetaBs,
        total_pagomovil: totalPagoMovil,
        total_pagomovil_usd: 0,
        total_pagomovil_bs: totalPagoMovilBs,
        grand_total: granTotal,
        from_date: fromTime,
        to_date: now.toISOString(),
      });
      if (insertError) throw insertError;
      const record: CorteRecord = {
        id: '',
        location_id: locationId,
        cashier_id: cashier?.id || '',
        cashier_name: cashier?.employee_id || cashier?.name || '',
        date: todayStr,
        closed_at: now.toISOString(),
        order_count: count,
        total_efectivo: totalEfectivo,
        total_efectivo_usd: totalEfectivoUsd,
        total_efectivo_bs: totalEfectivoBs,
        total_tarjeta: totalTarjeta,
        total_tarjeta_usd: 0,
        total_tarjeta_bs: totalTarjetaBs,
        total_pagomovil: totalPagoMovil,
        total_pagomovil_usd: 0,
        total_pagomovil_bs: totalPagoMovilBs,
        grand_total: granTotal,
        from_date: fromTime,
        to_date: now.toISOString(),
        created_at: now.toISOString(),
      };
      setSaved(record);
      onCorteSaved();
      // Auto-reset after 3 seconds to show next batch of pending orders
      setTimeout(() => setSaved(null), 3000);
    } catch (err) {
      console.error('Error saving corte:', err);
      setError('Error al guardar el corte. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    const displayRecord = saved || existingCorte;
    const efectivoUsd = displayRecord?.total_efectivo_usd ?? totalEfectivoUsd;
    const efectivoBs = displayRecord?.total_efectivo_bs ?? totalEfectivoBs;
    const tarjetaBs = displayRecord?.total_tarjeta_bs ?? totalTarjetaBs;
    const pagomovilBs = displayRecord?.total_pagomovil_bs ?? totalPagoMovilBs;
    const tarjetaUsd = tarjetaBs / rate;
    const pagomovilUsd = pagomovilBs / rate;
    const grand = displayRecord?.grand_total ?? granTotal;
    const ordenes = displayRecord?.order_count ?? count;
    const ordersList = sortedOrders.length > 0 ? sortedOrders : activeOrders;
    const receiptHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Corte de Caja</title>
<style>
  @media print {
    @page { size: 80mm auto; margin: 0; }
    body { margin: 0; padding: 0; }
  }
  * { font-family: Arial, Helvetica, sans-serif !important; }
  body {
    font-family: Arial, Helvetica, sans-serif !important;
    font-size: 10px;
    width: 270px;
    margin: 0 auto;
    padding: 8px 5px;
    color: #000;
    line-height: 1.2;
  }
  .text-center { text-align: center; }
  .text-right { text-align: right; }
  .bold { font-weight: bold; }
  .header-title { font-size: 13px; font-weight: bold; margin-bottom: 2px; }
  .header-sub { font-size: 9px; margin: 1px 0; }
  .divider { border-top: 1px dashed #000; margin: 5px 0; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 1.5px 0; font-size: 9px; }
  td.r { text-align: right; }
  .total-row td { font-weight: bold; font-size: 10px; }
  .section-title { font-size: 9px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 3px; }
  .order-row td { font-size: 8.5px; }
  .footer-text { font-size: 8px; margin-top: 4px; }
</style>
</head>
<body>

<div class="text-center">
  <div class="header-title">CORTE DE CAJA</div>
  <div class="header-sub bold">${locationName}</div>
  <div class="header-sub">${dateStr}</div>
  <div class="header-sub">${timeFrom} - ${timeTo} · Tasa: ${formatBs(rate)} Bs/$</div>
</div>

<div class="divider"></div>

<table>
  <tr><td>Pedidos</td><td class="r bold">${ordenes}</td></tr>
  <tr><td>Delivery (${deliveryCount})</td><td class="r">$${deliveryTotal.toFixed(2)}</td></tr>
  <tr><td>Local (${pickupCount})</td><td class="r">$${pickupTotal.toFixed(2)}</td></tr>
</table>

<div class="divider"></div>

<div class="section-title">M&Eacute;TODO DE PAGO</div>
<table>
  <tr><td>Efectivo $</td><td class="r">$${efectivoUsd.toFixed(2)} / Bs ${formatBs(efectivoUsd * rate)}</td></tr>
  <tr><td>Efectivo Bs</td><td class="r">Bs ${formatBs(efectivoBs)}</td></tr>
  <tr><td>Tarjeta</td><td class="r">$${tarjetaUsd.toFixed(2)} / Bs ${formatBs(tarjetaBs)}</td></tr>
  <tr><td>Pago M&oacute;vil</td><td class="r">$${pagomovilUsd.toFixed(2)} / Bs ${formatBs(pagomovilBs)}</td></tr>
</table>

<div class="divider"></div>

<table>
  <tr class="total-row"><td>TOTAL</td><td class="r">$${grand.toFixed(2)}</td></tr>
  <tr class="total-row"><td></td><td class="r">Bs ${formatBs(grand * rate)}</td></tr>
</table>

<div class="divider"></div>

<div class="section-title">DETALLE DE PEDIDOS</div>
<table>
${ordersList.slice(0, 30).map(o => {
  const t = new Date(o.created_at).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
  const name = (o.customer_name || 'N/A').substring(0, 14);
  const type = o.delivery_type === 'Delivery' ? 'DEL' : 'LOC';
  const pay = (o.payment_method || '').substring(0, 4).toUpperCase();
  return `  <tr class="order-row"><td>${t}</td><td>${name}</td><td>${type}</td><td>${pay}</td><td class="r">$${o.total.toFixed(2)}</td></tr>`;
}).join('\n')}
</table>

${displayRecord ? `<div class="divider"></div><p class="text-center" style="font-size:8px">Cerrado: ${new Date(displayRecord.closed_at).toLocaleString('es-VE')}</p>` : ''}

<div class="divider"></div>

<div class="text-center footer-text">
  <div>¡Gracias por su trabajo!</div>
  <div>wallacepandaexpress.com</div>
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
          <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
            <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Check className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-green-400 font-black text-sm">Corte guardado</p>
              <p className="text-[10px] text-zinc-500">{saved.order_count} pedidos · ${saved.grand_total.toFixed(2)}</p>
            </div>
          </div>
        ) : activeOrders.length === 0 ? (
          <div className="text-center py-8">
            <Check className="w-12 h-12 text-green-400/50 mx-auto mb-3" />
            <p className="text-zinc-500 font-bold text-sm">No hay pedidos pendientes</p>
            <p className="text-zinc-600 text-xs mt-1">Todos los pedidos ya fueron cortados</p>
          </div>
        ) : (
          <>
            <div className="text-center text-[11px] text-zinc-500 font-bold">
              {timeFrom} — {timeTo} · Tasa: {formatBs(rate)} Bs/$
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-zinc-950 rounded-2xl p-3 text-center">
                <ShoppingCart className="w-4 h-4 text-primary-vibrant mx-auto mb-1" />
                <p className="text-xl font-black text-white">{count}</p>
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Pedidos</p>
              </div>
              <div className="bg-zinc-950 rounded-2xl p-3 text-center">
                <Truck className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                <p className="text-xl font-black text-white">{deliveryCount}</p>
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Delivery</p>
              </div>
              <div className="bg-zinc-950 rounded-2xl p-3 text-center">
                <Store className="w-4 h-4 text-orange-400 mx-auto mb-1" />
                <p className="text-xl font-black text-white">{pickupCount}</p>
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Local</p>
              </div>
            </div>

            <div className="bg-zinc-950 rounded-2xl p-4 text-center">
              <DollarSign className="w-5 h-5 text-green-400 mx-auto mb-1" />
              <p className="text-2xl font-black text-green-400">${granTotal.toFixed(2)}</p>
              <p className="text-xs text-zinc-500 font-bold">{formatBs(granTotal * rate)} Bs.</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-1">Total Facturado</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-zinc-950 rounded-xl p-3">
                <p className="text-[9px] text-blue-400 uppercase tracking-widest font-bold mb-1">Delivery</p>
                <p className="font-black text-white text-sm">${deliveryTotal.toFixed(2)}</p>
                <p className="text-[10px] text-zinc-500">{formatBs(deliveryTotal * rate)} Bs.</p>
              </div>
              <div className="bg-zinc-950 rounded-xl p-3">
                <p className="text-[9px] text-orange-400 uppercase tracking-widest font-bold mb-1">Local</p>
                <p className="font-black text-white text-sm">${pickupTotal.toFixed(2)}</p>
                <p className="text-[10px] text-zinc-500">{formatBs(pickupTotal * rate)} Bs.</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Método de pago</p>
              {[
                { method: 'Efectivo $', total: totalEfectivoUsd, icon: Banknote, color: 'text-green-400', showAs: 'usd' as const },
                { method: 'Efectivo Bs', total: totalEfectivoBs, icon: Banknote, color: 'text-yellow-400', showAs: 'bs' as const },
                { method: 'Tarjeta', total: totalTarjetaBs, icon: CreditCard, color: 'text-blue-400', showAs: 'bs' as const },
                { method: 'P.Móvil', total: totalPagoMovilBs, icon: Smartphone, color: 'text-purple-400', showAs: 'bs' as const },
              ].map(({ method, total: t, icon: Icon, color, showAs }) => (
                <div key={method} className="flex items-center justify-between bg-zinc-950 p-3 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${color}`} />
                    <span className="text-sm font-bold text-zinc-300">{method}</span>
                  </div>
                  <div className="text-right">
                    {showAs === 'bs' ? (
                      <>
                        <span className={`font-black ${color}`}>${(t / rate).toFixed(2)}</span>
                        <p className="text-[10px] text-zinc-500">{formatBs(t)} Bs.</p>
                      </>
                    ) : (
                      <>
                        <span className={`font-black ${color}`}>${t.toFixed(2)}</span>
                        <p className="text-[10px] text-zinc-500">{formatBs(t * rate)} Bs.</p>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-1 max-h-40 overflow-y-auto">
              <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 sticky top-0 bg-zinc-900 pb-1">Pedidos ({activeOrders.length})</p>
              {sortedOrders.map(o => (
                <div key={o.id} className="flex items-center justify-between text-[11px] text-zinc-400 bg-zinc-950 p-2 rounded-lg gap-2">
                  <span className="text-zinc-600 w-12 flex-shrink-0">{new Date(o.created_at).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}</span>
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
              <button onClick={handleSaveCorte} disabled={saving || count === 0}
                className="flex-1 bg-primary-vibrant text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Hacer Corte
              </button>
            </div>
          </>
        )}

        {saved && (
          <div className="flex gap-2">
            <button onClick={handlePrint}
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
        <td class="text-right">Bs ${formatBs(order.change_amount * rate)}</td>
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
    const efectivoUsd = c.total_efectivo_usd;
    const efectivoBs = c.total_efectivo_bs;
    const tarjetaBs = c.total_tarjeta_bs;
    const pagomovilBs = c.total_pagomovil_bs;
    const tarjetaUsd = tarjetaBs / exchangeRate;
    const pagomovilUsd = pagomovilBs / exchangeRate;
    const grand = c.grand_total;

    const receiptHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Corte de Caja</title>
<style>
  @media print { @page { size: 80mm auto; margin: 0; } body { margin: 0; padding: 0; } }
  * { font-family: Arial, Helvetica, sans-serif !important; }
  body { font-family: Arial, Helvetica, sans-serif !important; font-size: 10px; width: 270px; margin: 0 auto; padding: 8px 5px; color: #000; line-height: 1.2; }
  .text-center { text-align: center; } .text-right { text-align: right; } .bold { font-weight: bold; }
  .header-title { font-size: 13px; font-weight: bold; margin-bottom: 2px; }
  .header-sub { font-size: 9px; margin: 1px 0; }
  .divider { border-top: 1px dashed #000; margin: 5px 0; }
  table { width: 100%; border-collapse: collapse; } td { padding: 1.5px 0; font-size: 9px; } td.r { text-align: right; }
  .total-row td { font-weight: bold; font-size: 10px; }
  .section-title { font-size: 9px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 3px; }
</style>
</head>
<body>
<div class="text-center">
  <div class="header-title">CORTE DE CAJA</div>
  <div class="header-sub bold">${locationName}</div>
  <div class="header-sub">${formatDate(c.date)} ${formatTime(c.closed_at)}</div>
  <div class="header-sub">Cajero: ${c.cashier_name}</div>
  <div class="header-sub">Tasa: ${formatBs(exchangeRate)} Bs/$</div>
</div>
<div class="divider"></div>
<table>
  <tr><td>Pedidos</td><td class="r bold">${c.order_count}</td></tr>
</table>
<div class="divider"></div>
<div class="section-title">M&Eacute;TODO DE PAGO</div>
<table>
  <tr><td>Efectivo $</td><td class="r">$${efectivoUsd.toFixed(2)} / Bs ${formatBs(efectivoUsd * exchangeRate)}</td></tr>
  <tr><td>Efectivo Bs</td><td class="r">Bs ${formatBs(efectivoBs)}</td></tr>
  <tr><td>Tarjeta</td><td class="r">$${tarjetaUsd.toFixed(2)} / Bs ${formatBs(tarjetaBs)}</td></tr>
  <tr><td>Pago M&oacute;vil</td><td class="r">$${pagomovilUsd.toFixed(2)} / Bs ${formatBs(pagomovilBs)}</td></tr>
</table>
<div class="divider"></div>
<table>
  <tr class="total-row"><td>TOTAL</td><td class="r">$${grand.toFixed(2)}</td></tr>
  <tr class="total-row"><td></td><td class="r">Bs ${formatBs(grand * exchangeRate)}</td></tr>
</table>
<div class="divider"></div>
<p class="text-center" style="font-size:8px">Cerrado: ${new Date(c.closed_at).toLocaleString('es-VE')}</p>
</body></html>`;
    const w = window.open('', '_blank', 'width=320,height=600');
    if (w) { w.document.write(receiptHtml); w.document.close(); setTimeout(() => { w.print(); w.close(); }, 400); }
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
                    <p className="text-[10px] text-zinc-500">{formatBs(selected.grand_total * exchangeRate)} Bs.</p>
                  </div>
                </div>
                <div className="space-y-1 pt-2 border-t border-zinc-800">
                  {[
                    { label: 'Efectivo $', usd: selected.total_efectivo_usd, bs: selected.total_efectivo_bs, color: 'text-green-400', showUsd: true },
                    { label: 'Efectivo Bs', usd: null, bs: selected.total_efectivo_bs, color: 'text-yellow-400', showUsd: false },
                    { label: 'Tarjeta', usd: selected.total_tarjeta_bs / exchangeRate, bs: selected.total_tarjeta_bs, color: 'text-blue-400', showUsd: true },
                    { label: 'Pago Móvil', usd: selected.total_pagomovil_bs / exchangeRate, bs: selected.total_pagomovil_bs, color: 'text-purple-400', showUsd: true },
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
// Main POS Page
// ==============================
function loadCashier(): Cashier | null {
  try {
    const raw = localStorage.getItem('pos_cashier');
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Date.now() - data.timestamp > 86400000) {
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
  const { menuItems, categories, locations, config, findCustomer, saveCustomer, generateInvoiceNumber } = useRestaurant();
  const [cashier, setCashier] = useState<Cashier | null>(() => loadCashier());
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
  const [showCorteHistory, setShowCorteHistory] = useState(false);
  const [showInvoiceHistory, setShowInvoiceHistory] = useState(false);
  const [editingRate, setEditingRate] = useState(false);
  const [editRateValue, setEditRateValue] = useState('');
  const queryClient = useQueryClient();
  const [showReceipt, setShowReceipt] = useState<{
    items: POSCartItem[];
    total: number;
    paymentMethod: PaymentMethod;
    changeAmount: number;
    invoiceNumber: string;
  } | null>(null);
  const locationId = cashier?.location_id || '';
  const [choiceProduct, setChoiceProduct] = useState<Product | null>(null);
  const [orderCode, setOrderCode] = useState('');
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [orderCodeError, setOrderCodeError] = useState('');
  const [loadedOrderId, setLoadedOrderId] = useState<string | null>(null);
  const [loadedPaymentMethod, setLoadedPaymentMethod] = useState<PaymentMethod | null>(null);
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
      return (data || []).map((row: any) => ({
        id: row.id,
        location_id: row.location_id,
        cashier_id: row.cashier_id,
        cashier_name: row.cashier_name || '',
        date: row.date,
        closed_at: row.closed_at,
        order_count: row.order_count,
        total_efectivo: row.total_efectivo,
        total_efectivo_usd: row.total_efectivo_usd ?? 0,
        total_efectivo_bs: row.total_efectivo_bs ?? 0,
        total_tarjeta: row.total_tarjeta,
        total_tarjeta_usd: row.total_tarjeta_usd ?? 0,
        total_tarjeta_bs: row.total_tarjeta_bs ?? 0,
        total_pagomovil: row.total_pagomovil,
        total_pagomovil_usd: row.total_pagomovil_usd ?? 0,
        total_pagomovil_bs: row.total_pagomovil_bs ?? 0,
        grand_total: row.grand_total,
        from_date: row.from_date,
        to_date: row.to_date,
        created_at: row.created_at,
      }));
    },
    enabled: !!cashier && !!locationId,
    staleTime: 5000,
  });
  const cortes = cortesQuery.data || [];

  // Today's corte (if exists)
  const todayStr = new Date().toISOString().slice(0, 10);
  const isFormValid =
    customerCedula.trim().length >= 6 &&
    customerName.trim().length > 0 &&
    customerPhone.startsWith('04') &&
    customerPhone.replace(/\D/g, '').length >= 7;

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

  const handlePayment = useCallback(async (splits: { method: PaymentMethod; amount: number; currency?: 'USD' | 'BS'; ref?: string }[], changeAmount: number) => {
    if (!cashier || !locationId || cart.length === 0) return;

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
      const invoiceNumber = await generateInvoiceNumber(locationId);

      let orderId = loadedOrderId;

      if (orderId) {
        // UPDATE the original online order → mark as exitoso with invoice
        const { error } = await supabase.from('orders').update({
          status: 'exitoso',
          delivery_type: deliveryType,
          payment_method: primaryMethod,
          payment_ref: primaryRef || null,
          change_amount: changeAmount,
          cashier_id: cashier.id,
          invoice_number: invoiceNumber,
          items: orderItems,
          subtotal: cartTotal,
          total: cartTotal,
          payment_currency: primaryCurrency || null,
        }).eq('id', orderId);
        if (error) throw error;
      } else {
        // Manual POS sale (no online order) → INSERT new row
        const { data: inserted, error } = await supabase.from('orders').insert({
          location_id: locationId,
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
          payment_method: primaryMethod,
          payment_ref: primaryRef || null,
          change_amount: changeAmount,
          cashier_id: cashier.id,
          invoice_number: invoiceNumber,
          payment_currency: primaryCurrency || null,
        }).select('id').single();
        if (error) throw error;
        orderId = inserted?.id;
      }

      // Save split payments to order_payments table
      if (orderId && splits.length > 0) {
        // Delete existing splits (for loaded orders that might already have splits)
        await supabase.from('order_payments').delete().eq('order_id', orderId);

        const splitRows = splits.map(s => ({
          order_id: orderId!,
          payment_method: s.method,
          amount: s.amount,
          currency: s.currency || null,
          payment_ref: s.ref || '',
        }));
        const { error: splitError } = await supabase.from('order_payments').insert(splitRows);
        if (splitError) console.error('Error saving splits:', splitError);
      }

      await saveCustomer({ cedula: customerCedula, name: customerName || 'Mostrador', phone: customerPhone || 'N/A' });

      posOrdersQuery.refetch();

      setShowPayModal(false);
      setShowReceipt({ items: cart, total: cartTotal, paymentMethod: primaryMethod, changeAmount, invoiceNumber });
    } catch (err) {
      console.error('Error processing payment:', err);
      alert('Error al procesar la venta');
    }
  }, [cashier, locationId, cart, cartTotal, customerName, customerPhone, customerCedula, deliveryType, loadedOrderId, generateInvoiceNumber, saveCustomer, posOrdersQuery]);

  const handleNewSale = () => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerCedula('');
    setDeliveryType('Pick-up');
    setOrderCode('');
    setOrderCodeError('');
    setLoadedOrderId(null);
    setLoadedPaymentMethod(null);
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
        .eq('code', code)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        setOrderCodeError('Código no encontrado');
        setIsLoadingOrder(false);
        return;
      }

      // Store original order ID and payment method for POS validation
      setLoadedOrderId(data.id);
      setLoadedPaymentMethod((data.payment_method as PaymentMethod) || null);

      // Sync delivery type dropdown with the loaded order
      if (data.delivery_type === 'Delivery' || data.delivery_type === 'Pick-up') {
        setDeliveryType(data.delivery_type);
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
                    await supabase.rpc('update_exchange_rate', { rate: v });
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
          <PaymentModal total={cartTotal} onConfirm={handlePayment} onClose={() => setShowPayModal(false)} exchangeRate={localRate ?? 1} originalPaymentMethod={loadedPaymentMethod} />
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
