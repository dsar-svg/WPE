import { useState, useMemo, useEffect } from 'react';
import { MapPin, Utensils, ShoppingBag, DollarSign, Trophy, TrendingDown, Calendar, ArrowUpRight, ArrowDownRight, Banknote, CreditCard, Smartphone, Truck, Store, User, Clock } from 'lucide-react';
import { Order, Location, Product, RestaurantConfig, Cashier } from '../../types';
import { supabase } from '../../lib/supabase';

interface DashboardViewProps {
  orders: Order[];
  locations: Location[];
  menuItems: Product[];
  totalFacturado: number;
  config: RestaurantConfig;
  cashiers: Cashier[];
}

const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function isToday(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function useMonthFilter(orders: Order[], year: number, month: number) {
  return useMemo(() => {
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const filtered = orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= startOfMonth && d <= endOfMonth;
    });
    const total = filtered.reduce((s, o) => s + o.total, 0);
    const count = filtered.length;

    const prevEnd = new Date(startOfMonth.getTime() - 1);
    const prevStart = new Date(year, month - 1, 1);
    const prevFiltered = orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= prevStart && d <= prevEnd;
    });
    const prevTotal = prevFiltered.reduce((s, o) => s + o.total, 0);
    const prevCount = prevFiltered.length;

    const totalChange = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : total > 0 ? 100 : 0;
    const countChange = prevCount > 0 ? ((count - prevCount) / prevCount) * 100 : count > 0 ? 100 : 0;

    return { filtered, total, count, prevTotal, prevCount, totalChange, countChange };
  }, [orders, year, month]);
}

function useTodayFilter(orders: Order[], rate: number, orderPaymentsMap: Record<string, { payment_method: string; amount: number; currency?: string }[]>) {
  return useMemo(() => {
    const filtered = orders.filter(o => isToday(o.created_at));
    const total = filtered.reduce((s, o) => s + o.total, 0);
    const delivery = filtered.filter(o => o.delivery_type === 'Delivery').reduce((s, o) => s + o.total, 0);
    const pickup = filtered.filter(o => o.delivery_type === 'Pick-up').reduce((s, o) => s + o.total, 0);
    const count = filtered.length;

    let efectivoUsd = 0, efectivoBsRaw = 0, tarjetaBs = 0, pagoMovilBs = 0;
    for (const o of filtered) {
      const splits = orderPaymentsMap[o.id];
      if (splits && splits.length > 0) {
        for (const sp of splits) {
          if (sp.payment_method === 'Efectivo') {
            if (sp.currency === 'BS') efectivoBsRaw += sp.amount;
            else efectivoUsd += sp.amount;
          } else if (sp.payment_method === 'Tarjeta') {
            // Tarjeta is always BS — convert USD amounts to BS
            tarjetaBs += (sp.currency === 'BS') ? sp.amount : sp.amount * rate;
          } else if (sp.payment_method === 'PagoMóvil') {
            // PagoMóvil is always BS — convert USD amounts to BS
            pagoMovilBs += (sp.currency === 'BS') ? sp.amount : sp.amount * rate;
          }
        }
      } else {
        if (o.payment_method === 'Efectivo') {
          if (o.payment_currency === 'BS') efectivoBsRaw += o.total * rate;
          else efectivoUsd += o.total;
        } else if (o.payment_method === 'Tarjeta') {
          // Tarjeta is always BS — order.total is USD, convert to BS
          tarjetaBs += o.total * rate;
        } else if (o.payment_method === 'PagoMóvil') {
          // PagoMóvil is always BS — order.total is USD, convert to BS
          pagoMovilBs += o.total * rate;
        }
      }
    }

    const efectivoBsConverted = efectivoBsRaw;

    return { filtered, total, delivery, pickup, count, efectivoUsd, efectivoBs: efectivoBsConverted, tarjetaBs, pagoMovilBs, rate };
  }, [orders, rate, orderPaymentsMap]);
}

function buildMonthChart(orders: Order[], year: number, month: number) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: { label: string; total: number }[] = [];
  for (let i = 1; i <= daysInMonth; i++) {
    const total = orders
      .filter(o => { const od = new Date(o.created_at); return od.getDate() === i && od.getMonth() === month && od.getFullYear() === year; })
      .reduce((s, o) => s + o.total, 0);
    days.push({ label: `${i}`, total });
  }
  return { labels: days.map(d => d.label), values: days.map(d => d.total), title: `${monthNames[month]} ${year}` };
}

function ChangeBadge({ value }: { value: number }) {
  if (value === 0) return null;
  const isUp = value > 0;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${
      isUp ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
    }`}>
      {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

export function DashboardView({ orders, locations, menuItems, totalFacturado: _totalFacturado, config, cashiers }: DashboardViewProps) {
  const now = new Date();
  const rate = config.exchangeRate ?? 1;
  const [view, setView] = useState<'month' | 'today'>('month');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  // Fetch order_payments for today's orders (split payment support)
  const [orderPaymentsMap, setOrderPaymentsMap] = useState<Record<string, { payment_method: string; amount: number; currency?: string }[]>>({});
  useEffect(() => {
    const todayOrders = orders.filter(o => isToday(o.created_at));
    if (todayOrders.length === 0) { setOrderPaymentsMap({}); return; }
    const ids = todayOrders.map(o => o.id);
    supabase.from('order_payments').select('order_id, payment_method, amount, currency')
      .in('order_id', ids)
      .then(({ data }) => {
        const map: Record<string, { payment_method: string; amount: number; currency?: string }[]> = {};
        (data || []).forEach(row => {
          if (!map[row.order_id]) map[row.order_id] = [];
          map[row.order_id].push(row);
        });
        setOrderPaymentsMap(map);
      });
  }, [orders]);

  const { filtered, total, count, prevTotal, prevCount, totalChange, countChange } = useMonthFilter(orders, year, month);
  const today = useTodayFilter(orders, rate, orderPaymentsMap);
  const chart = useMemo(() => buildMonthChart(filtered, year, month), [filtered, year, month]);

  const todayOrders = useMemo(
    () => orders.filter(o => isToday(o.created_at) && o.status === 'exitoso'),
    [orders]
  );

  const hourlyData = useMemo(() => {
    const buckets = Array.from({ length: 24 }, () => 0);
    todayOrders.forEach(o => { buckets[new Date(o.created_at).getHours()]++; });
    const max = Math.max(...buckets, 1);
    return { buckets, max };
  }, [todayOrders]);

  const productSalesToday = useMemo(() => {
    const map: Record<string, { name: string; category: string; qty: number; revenue: number }> = {};
    todayOrders.forEach(order => {
      order.items.forEach(item => {
        const menuItem = menuItems.find(m => m.name === item.name);
        const category = menuItem?.category || 'Sin categoría';
        if (!map[item.id]) map[item.id] = { name: item.name, category, qty: 0, revenue: 0 };
        map[item.id].qty += item.quantity;
        map[item.id].revenue += item.quantity * item.price;
      });
    });
    return Object.values(map).sort((a, b) => b.qty - a.qty);
  }, [todayOrders, menuItems]);

  const categorySalesToday = useMemo(() => {
    const map: Record<string, { qty: number; revenue: number }> = {};
    todayOrders.forEach(order => {
      order.items.forEach(item => {
        const menuItem = menuItems.find(m => m.name === item.name);
        const cat = menuItem?.category || 'Sin categoría';
        if (!map[cat]) map[cat] = { qty: 0, revenue: 0 };
        map[cat].qty += item.quantity;
        map[cat].revenue += item.quantity * item.price;
      });
    });
    return Object.entries(map)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [todayOrders, menuItems]);

  const paymentBreakdownToday = useMemo(() => {
    const result: Record<string, number> = { Efectivo: 0, Tarjeta: 0, PagoMóvil: 0, Mixto: 0, Otro: 0 };
    todayOrders.forEach(order => {
      const splits = orderPaymentsMap[order.id];
      if (splits && splits.length > 0) {
        splits.forEach(sp => { result[sp.payment_method] = (result[sp.payment_method] || 0) + sp.amount; });
      } else if (order.payment_method) {
        result[order.payment_method] = (result[order.payment_method] || 0) + order.total;
      }
    });
    return Object.entries(result)
      .filter(([, v]) => v > 0)
      .map(([method, amount]) => ({ method, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [todayOrders, orderPaymentsMap]);

  const locationSummaryToday = useMemo(() => {
    const map: Record<string, { name: string; count: number; total: number }> = {};
    todayOrders.forEach(order => {
      const loc = locations.find(l => l.id === order.location_id);
      const name = loc?.name || 'Desconocida';
      if (!map[order.location_id]) map[order.location_id] = { name, count: 0, total: 0 };
      map[order.location_id].count++;
      map[order.location_id].total += order.total;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [todayOrders, locations]);

  const cashierSummaryToday = useMemo(() => {
    const map: Record<string, {
      name: string; orders: number; total: number; cash: number; card: number; other: number;
      delivery: number; pickup: number; items: number; topProduct: string; firstOrder: string; lastOrder: string;
    }> = {};
    const itemMaps: Record<string, Record<string, number>> = {};
    todayOrders.forEach(order => {
      const cid = order.cashier_id || 'online';
      if (!map[cid]) {
        const cashier = cashiers.find(c => c.id === cid);
        map[cid] = {
          name: cid === 'online' ? 'Pedidos Online' : (cashier?.name || cashier?.employee_id || 'Cajero/a'),
          orders: 0, total: 0, cash: 0, card: 0, other: 0,
          delivery: 0, pickup: 0, items: 0, topProduct: '', firstOrder: '', lastOrder: '',
        };
        itemMaps[cid] = {};
      }
      const entry = map[cid];
      entry.orders++;
      entry.total += order.total;
      if (order.payment_method === 'Efectivo') entry.cash += order.total;
      else if (order.payment_method === 'Tarjeta' || order.payment_method === 'PagoMóvil') entry.card += order.total;
      else entry.other += order.total;
      if (order.delivery_type === 'Delivery') entry.delivery++;
      else entry.pickup++;
      entry.items += order.items.reduce((sum, it) => sum + it.quantity, 0);
      if (!entry.firstOrder || order.created_at < entry.firstOrder) entry.firstOrder = order.created_at;
      if (!entry.lastOrder || order.created_at > entry.lastOrder) entry.lastOrder = order.created_at;
      order.items.forEach(item => {
        itemMaps[cid][item.name] = (itemMaps[cid][item.name] || 0) + item.quantity;
      });
    });
    Object.entries(map).forEach(([cid, entry]) => {
      const sorted = Object.entries(itemMaps[cid] || {}).sort((a, b) => b[1] - a[1]);
      entry.topProduct = sorted[0]?.[0] || '';
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [todayOrders, cashiers]);

  const avgMinutesToday = useMemo(() => {
    if (todayOrders.length < 2) return 0;
    const sorted = [...todayOrders].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    let sumDiff = 0;
    for (let i = 1; i < sorted.length; i++) {
      sumDiff += new Date(sorted[i].created_at).getTime() - new Date(sorted[i - 1].created_at).getTime();
    }
    return sumDiff / (sorted.length - 1) / 60000;
  }, [todayOrders]);

  const maxVal = Math.max(...chart.values, 1);
  const BAR_HEIGHT = 140;
  const BAR_GAP = 6;
  const barCount = chart.labels.length;

  const productSales = filtered.reduce((acc, order) => {
    order.items.forEach(item => {
      if (!acc[item.name]) acc[item.name] = 0;
      acc[item.name] += item.quantity;
    });
    return acc;
  }, {} as Record<string, number>);
  const topSelling = Object.entries(productSales).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const leastSelling = Object.entries(productSales).sort((a, b) => a[1] - b[1]).slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black">Dashboard</h2>
          <p className="text-admin-muted text-sm">{view === 'today' ? 'Resumen del día de hoy' : 'Resumen mensual'}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-admin-surface border border-admin-border rounded-xl p-1">
            <button onClick={() => setView('today')}
              className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-colors ${view === 'today' ? 'bg-primary-vibrant text-white' : 'text-admin-muted hover:text-admin-text'}`}
            >Hoy</button>
            <button onClick={() => setView('month')}
              className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-colors ${view === 'month' ? 'bg-primary-vibrant text-white' : 'text-admin-muted hover:text-admin-text'}`}
            >Mes</button>
          </div>
          {view === 'month' && (
            <div className="flex items-center gap-2">
              <select value={month} onChange={e => setMonth(Number(e.target.value))}
                className="bg-admin-surface border border-admin-border rounded-xl px-3 py-2 text-sm font-bold text-admin-text outline-none focus:ring-2 focus:ring-primary-vibrant cursor-pointer"
              >
                {monthNames.map((name, i) => <option key={i} value={i}>{name}</option>)}
              </select>
              <select value={year} onChange={e => setYear(Number(e.target.value))}
                className="bg-admin-surface border border-admin-border rounded-xl px-3 py-2 text-sm font-bold text-admin-text outline-none focus:ring-2 focus:ring-primary-vibrant cursor-pointer"
              >
                {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {view === 'today' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <div className="bg-admin-surface border border-admin-border rounded-2xl p-8 col-span-full">
              <div className="flex items-center gap-3 mb-6">
                <DollarSign className="w-8 h-8 text-yellow-500" />
                <h3 className="text-lg font-black">Facturado hoy</h3>
              </div>
              <p className="text-4xl font-black">${today.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <div className="flex flex-wrap gap-6 mt-4 text-sm">
                <span className="text-admin-muted"><Truck className="w-4 h-4 inline mr-1" />Delivery: ${today.delivery.toFixed(2)}</span>
                <span className="text-admin-muted"><Store className="w-4 h-4 inline mr-1" />Pick-up: ${today.pickup.toFixed(2)}</span>
                <span className="text-admin-muted"><ShoppingBag className="w-4 h-4 inline mr-1" />{today.count} pedidos</span>
                <span className="text-admin-muted"><Clock className="w-4 h-4 inline mr-1" />{todayOrders.length < 2 ? '—' : `${Math.floor(avgMinutesToday)}m ${Math.round((avgMinutesToday % 1) * 60)}s`}</span>
              </div>
            </div>

            <div className="bg-admin-surface border border-admin-border rounded-2xl p-8">
              <Banknote className="w-8 h-8 text-green-500 mb-4" />
              <p className="text-3xl font-black">${today.efectivoUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-admin-muted text-sm mt-1">Efectivo $</p>
              <p className="text-xs text-zinc-500 mt-1">Bs {(today.efectivoUsd * today.rate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-admin-surface border border-admin-border rounded-2xl p-8">
              <Banknote className="w-8 h-8 text-yellow-500 mb-4" />
              <p className="text-3xl font-black">Bs {today.efectivoBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-admin-muted text-sm mt-1">Efectivo Bs</p>
            </div>
            <div className="bg-admin-surface border border-admin-border rounded-2xl p-8">
              <Smartphone className="w-8 h-8 text-purple-500 mb-4" />
              <p className="text-3xl font-black">Bs {today.pagoMovilBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-admin-muted text-sm mt-1">PagoMóvil</p>
            </div>
            <div className="bg-admin-surface border border-admin-border rounded-2xl p-8">
              <CreditCard className="w-8 h-8 text-blue-500 mb-4" />
              <p className="text-3xl font-black">Bs {today.tarjetaBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-admin-muted text-sm mt-1">Tarjeta</p>
            </div>
          </div>

          {/* Hourly Heatmap */}
          <div className="bg-admin-surface border border-admin-border rounded-2xl p-6">
            <h3 className="text-sm font-black text-admin-text uppercase tracking-widest mb-4">Mapa de Calor por Hora</h3>
            <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-12 gap-2">
              {hourlyData.buckets.map((cnt, hour) => {
                const intensity = cnt / hourlyData.max;
                const bgClass = cnt === 0
                  ? 'bg-admin-bg'
                  : intensity < 0.25 ? 'bg-green-900/40'
                    : intensity < 0.5 ? 'bg-green-700/50'
                      : intensity < 0.75 ? 'bg-green-500/60'
                        : 'bg-green-400/80';
                return (
                  <div key={hour} className={`relative group aspect-square rounded-xl flex flex-col items-center justify-center ${bgClass} border border-admin-border transition-all hover:scale-105`}>
                    <span className="text-[10px] font-black text-admin-text">{hour.toString().padStart(2, '0')}</span>
                    <span className="text-[8px] text-admin-text-muted">{cnt}</span>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-[9px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      {hour.toString().padStart(2, '0')}:00 — {cnt} pedidos
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Products + Categories */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-admin-surface border border-admin-border rounded-2xl p-6">
              <h3 className="text-sm font-black text-admin-text uppercase tracking-widest mb-4">Top Productos Hoy</h3>
              {productSalesToday.length === 0 ? (
                <p className="text-xs text-admin-text-muted">Sin ventas hoy</p>
              ) : (
                <div className="space-y-3">
                  {productSalesToday.slice(0, 10).map((p, i) => (
                    <div key={p.name} className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-admin-muted w-5 text-right">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-admin-text truncate">{p.name}</span>
                          <span className="text-[10px] text-admin-text-muted shrink-0">{p.qty}x · ${p.revenue.toFixed(2)}</span>
                        </div>
                        <div className="w-full h-1.5 bg-admin-bg rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-primary-vibrant rounded-full" style={{ width: `${(p.qty / productSalesToday[0].qty) * 100}%` }} />
                        </div>
                        <span className="text-[9px] text-admin-text-muted">{p.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-admin-surface border border-admin-border rounded-2xl p-6">
              <h3 className="text-sm font-black text-admin-text uppercase tracking-widest mb-4">Ventas por Categoría</h3>
              {categorySalesToday.length === 0 ? (
                <p className="text-xs text-admin-text-muted">Sin ventas hoy</p>
              ) : (
                <div className="space-y-3">
                  {categorySalesToday.map(cat => (
                    <div key={cat.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-admin-text">{cat.name}</span>
                        <span className="text-[10px] text-admin-text-muted">{cat.qty}x · ${cat.revenue.toFixed(2)}</span>
                      </div>
                      <div className="w-full h-2 bg-admin-bg rounded-full overflow-hidden">
                        <div className="h-full bg-primary-vibrant/70 rounded-full" style={{ width: `${(cat.revenue / Math.max(...categorySalesToday.map(c => c.revenue), 1)) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Payment Methods + Location Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-admin-surface border border-admin-border rounded-2xl p-6">
              <h3 className="text-sm font-black text-admin-text uppercase tracking-widest mb-4">Métodos de Pago</h3>
              {paymentBreakdownToday.length === 0 ? (
                <p className="text-xs text-admin-text-muted">Sin pagos hoy</p>
              ) : (
                <div className="space-y-3">
                  {paymentBreakdownToday.map(p => (
                    <div key={p.method}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-admin-text">{p.method}</span>
                        <span className="text-[10px] text-admin-text-muted">${p.amount.toFixed(2)}</span>
                      </div>
                      <div className="w-full h-2 bg-admin-bg rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500/70 rounded-full" style={{ width: `${(p.amount / Math.max(...paymentBreakdownToday.map(x => x.amount), 1)) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-admin-surface border border-admin-border rounded-2xl p-6">
              <h3 className="text-sm font-black text-admin-text uppercase tracking-widest mb-4">Resumen por Sede</h3>
              {locationSummaryToday.length === 0 ? (
                <p className="text-xs text-admin-text-muted">Sin ventas hoy</p>
              ) : (
                <div className="space-y-3">
                  {locationSummaryToday.map(loc => (
                    <div key={loc.name} className="flex items-center gap-3 p-3 bg-admin-bg rounded-xl">
                      <div className="w-8 h-8 rounded-lg bg-primary-vibrant/10 flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4 text-primary-vibrant" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-admin-text truncate">{loc.name}</p>
                        <p className="text-[10px] text-admin-text-muted">{loc.count} pedidos</p>
                      </div>
                      <span className="text-sm font-black text-admin-text shrink-0">${loc.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cashier Summary */}
          {cashierSummaryToday.length > 0 && (
            <div>
              <h3 className="text-sm font-black text-admin-text uppercase tracking-widest mb-4">Resumen por Cajero/a</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cashierSummaryToday.map(c => {
                  const avgTicket = c.orders > 0 ? c.total / c.orders : 0;
                  const timeRange = c.firstOrder && c.lastOrder
                    ? `${new Date(c.firstOrder).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })} – ${new Date(c.lastOrder).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}`
                    : '';
                  return (
                    <div key={c.name} className="bg-admin-surface border border-admin-border rounded-2xl p-5 space-y-4">
                      {/* Header */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-vibrant/10 flex items-center justify-center shrink-0">
                          <User className="w-5 h-5 text-primary-vibrant" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-admin-text truncate">{c.name}</p>
                          <p className="text-[10px] text-admin-text-muted">{c.orders} pedidos · {c.items} artículos</p>
                        </div>
                        <span className="text-lg font-black text-admin-text shrink-0">${c.total.toFixed(2)}</span>
                      </div>

                      {/* Metrics row */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-admin-bg rounded-xl p-2 text-center">
                          <p className="text-[9px] text-admin-text-muted uppercase">Ticket</p>
                          <p className="text-xs font-black text-admin-text">${avgTicket.toFixed(2)}</p>
                        </div>
                        <div className="bg-admin-bg rounded-xl p-2 text-center">
                          <p className="text-[9px] text-admin-text-muted uppercase">Delivery</p>
                          <p className="text-xs font-black text-admin-text">{c.delivery}</p>
                        </div>
                        <div className="bg-admin-bg rounded-xl p-2 text-center">
                          <p className="text-[9px] text-admin-text-muted uppercase">Pick-up</p>
                          <p className="text-xs font-black text-admin-text">{c.pickup}</p>
                        </div>
                      </div>

                      {/* Top product */}
                      {c.topProduct && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-admin-bg rounded-xl">
                          <Trophy className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                          <span className="text-[10px] text-admin-text-muted">Más vendido:</span>
                          <span className="text-[10px] font-bold text-admin-text truncate">{c.topProduct}</span>
                        </div>
                      )}

                      {/* Time range */}
                      {timeRange && (
                        <div className="flex items-center gap-2 text-[10px] text-admin-text-muted">
                          <Clock className="w-3 h-3" />
                          <span>{timeRange}</span>
                        </div>
                      )}

                      {/* Payment breakdown */}
                      <div className="space-y-1.5 border-t border-admin-border pt-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-admin-text-muted uppercase tracking-widest">Efectivo</span>
                          <span className="text-[11px] font-bold text-admin-text">${c.cash.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-admin-text-muted uppercase tracking-widest">Tarjeta / PagoMóvil</span>
                          <span className="text-[11px] font-bold text-admin-text">${c.card.toFixed(2)}</span>
                        </div>
                        {c.other > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-admin-text-muted uppercase tracking-widest">Otro</span>
                            <span className="text-[11px] font-bold text-admin-text">${c.other.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-admin-surface border border-admin-border rounded-2xl p-8">
            <MapPin className="w-8 h-8 text-primary-vibrant mb-4" />
            <p className="text-3xl font-black">{locations.length}</p>
            <p className="text-admin-muted text-sm mt-1">Sedes activas</p>
          </div>
          <div className="bg-admin-surface border border-admin-border rounded-2xl p-8">
            <Utensils className="w-8 h-8 text-secondary-vibrant mb-4" />
            <p className="text-3xl font-black">{menuItems.length}</p>
            <p className="text-admin-muted text-sm mt-1">Productos en menú</p>
          </div>
          <div className="bg-admin-surface border border-admin-border rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <ShoppingBag className="w-8 h-8 text-green-500" />
              <ChangeBadge value={countChange} />
            </div>
            <p className="text-3xl font-black">{count}</p>
            <p className="text-admin-muted text-sm mt-1">Pedidos{prevCount > 0 ? ` (vs ${prevCount} anterior)` : ''}</p>
          </div>
          <div className="bg-admin-surface border border-admin-border rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="w-8 h-8 text-yellow-500" />
              <ChangeBadge value={totalChange} />
            </div>
            <p className="text-3xl font-black">${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-admin-muted text-sm mt-1">Ventas{prevTotal > 0 ? ` (vs $${prevTotal.toFixed(0)} anterior)` : ''}</p>
          </div>
        </div>
      )}

      {view === 'month' && (
        <>
          {/* Sales Chart */}
          <div className="bg-admin-surface border border-admin-border rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-8">
              <Calendar className="w-6 h-6 text-primary-vibrant" />
              <h3 className="text-lg font-black">{chart.title}</h3>
            </div>
            {filtered.length === 0 ? (
              <p className="text-admin-muted text-sm text-center py-12">Sin ventas en este período</p>
            ) : (
              <div className="overflow-x-auto pb-2">
                <svg width="100%" height={BAR_HEIGHT + 40} viewBox={`0 0 ${barCount * (28 + BAR_GAP) + 20} ${BAR_HEIGHT + 40}`} preserveAspectRatio="xMidYMid meet" className="min-w-full">
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#cb2027" stopOpacity="1" />
                      <stop offset="100%" stopColor="#cb2027" stopOpacity="0.3" />
                    </linearGradient>
                  </defs>
                  {chart.values.map((val, i) => {
                    const barH = maxVal > 0 ? (val / maxVal) * BAR_HEIGHT : 0;
                    const x = i * (28 + BAR_GAP) + 10;
                    const y = BAR_HEIGHT - barH;
                    return (
                      <g key={i}>
                        <rect x={x} y={y} width={24} height={barH} rx={4} fill="url(#barGrad)" className="hover:opacity-80 transition-opacity">
                          <title>${val.toFixed(2)}</title>
                        </rect>
                        {val > 0 && (
                          <text x={x + 12} y={y - 6} textAnchor="middle" fill="#a1a1aa" fontSize="9" fontWeight="bold">
                            ${val.toFixed(2)}
                          </text>
                        )}
                        <text x={x + 12} y={BAR_HEIGHT + 16} textAnchor="middle" fill="#52525b" fontSize="9" fontWeight="bold">
                          {chart.labels[i]}
                        </text>
                      </g>
                    );
                  })}
                  {[0, 0.25, 0.5, 0.75, 1].map(pct => (
                    <line key={pct} x1="0" y1={BAR_HEIGHT - pct * BAR_HEIGHT} x2={barCount * (28 + BAR_GAP) + 10} y2={BAR_HEIGHT - pct * BAR_HEIGHT}
                      stroke="#352f2b" strokeWidth="1" strokeDasharray="4 4" />
                  ))}
                </svg>
              </div>
            )}
          </div>

          {/* Top / Bottom Selling */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-admin-surface border border-admin-border rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <Trophy className="w-6 h-6 text-yellow-500" />
                <h3 className="text-lg font-black">Top 5 Más Vendidos</h3>
              </div>
              {topSelling.length === 0 ? (
                <p className="text-admin-muted text-sm">Sin datos en este período</p>
              ) : (
                <div className="space-y-4">
                  {topSelling.map(([name, qty], i) => {
                    const maxQty = topSelling[0][1];
                    const pct = maxQty > 0 ? (qty / maxQty) * 100 : 0;
                    return (
                      <div key={name} className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-zinc-300">{i + 1}. {name}</span>
                          <span className="text-xs font-black text-primary-vibrant">{qty} uds</span>
                        </div>
                        <div className="w-full h-2 bg-admin-border rounded-full overflow-hidden">
                          <div className="h-full bg-primary-vibrant rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-admin-surface border border-admin-border rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <TrendingDown className="w-6 h-6 text-red-500" />
                <h3 className="text-lg font-black">Top 5 Menos Vendidos</h3>
              </div>
              {leastSelling.length === 0 ? (
                <p className="text-admin-muted text-sm">Sin datos en este período</p>
              ) : (
                <div className="space-y-4">
                  {leastSelling.map(([name, qty], i) => {
                    const maxQty = topSelling[0]?.[1] || 1;
                    const pct = maxQty > 0 ? (qty / maxQty) * 100 : 0;
                    return (
                      <div key={name} className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-zinc-300">{i + 1}. {name}</span>
                          <span className="text-xs font-black text-red-500">{qty} uds</span>
                        </div>
                        <div className="w-full h-2 bg-admin-border rounded-full overflow-hidden">
                          <div className="h-full bg-red-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-admin-surface border border-admin-border rounded-2xl p-8">
            <h3 className="text-lg font-black mb-6">Últimos pedidos</h3>
            {filtered.length === 0 ? (
              <p className="text-admin-muted text-sm">Sin pedidos en este período</p>
            ) : (
              <div className="space-y-3">
                {filtered.slice(0, 5).map(order => (
                  <div key={order.id} className="flex items-center justify-between bg-admin-bg p-4 rounded-2xl">
                    <div>
                      <p className="font-bold text-sm text-admin-text">{order.customer_name}</p>
                      <p className="text-[10px] text-admin-muted">${order.total.toFixed(2)} · {order.delivery_type}</p>
                    </div>
                    <span className="text-[10px] text-admin-muted">
                      {new Date(order.created_at).toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}