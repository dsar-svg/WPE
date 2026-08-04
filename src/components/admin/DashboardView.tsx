import { useState, useMemo, useEffect } from 'react';
import { MapPin, Utensils, ShoppingBag, DollarSign, Trophy, TrendingDown, Calendar, ArrowUpRight, ArrowDownRight, Banknote, CreditCard, Smartphone, Truck, Store, Users } from 'lucide-react';
import { Order, Location, Product, RestaurantConfig } from '../../types';
import { supabase } from '../../lib/supabase';

interface DashboardViewProps {
  orders: Order[];
  locations: Location[];
  menuItems: Product[];
  totalFacturado: number;
  config: RestaurantConfig;
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

export function DashboardView({ orders, locations, menuItems, totalFacturado: _totalFacturado, config }: DashboardViewProps) {
  const now = new Date();
  const rate = config.exchangeRate ?? 1;
  const [view, setView] = useState<'month' | 'today'>('month');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState(0);

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

  const [cashierNames, setCashierNames] = useState<Record<string, string>>({});
  useEffect(() => {
    supabase.from('admins').select('id, name, employee_id, role')
      .eq('role', 'cashier')
      .then(({ data }) => {
        const map: Record<string, string> = {};
        (data || []).forEach((c: any) => { map[c.id] = c.name || c.employee_id || 'Caja'; });
        setCashierNames(map);
      });
  }, []);

  const { filtered: monthFiltered, total: monthTotal, count: monthCount, prevTotal, prevCount, totalChange, countChange } = useMonthFilter(orders, year, month);
  const filtered = useMemo(() => selectedDay > 0 ? monthFiltered.filter(o => new Date(o.created_at).getDate() === selectedDay) : monthFiltered, [monthFiltered, selectedDay]);
  const total = useMemo(() => filtered.reduce((s, o) => s + o.total, 0), [filtered]);
  const count = filtered.length;
  const today = useTodayFilter(orders, rate, orderPaymentsMap);
  const chart = useMemo(() => buildMonthChart(filtered, year, month), [filtered, year, month]);

  // Per-cashier breakdown for today
  const cashierBreakdown = useMemo(() => {
    const todayOrders = orders.filter(o => isToday(o.created_at));
    if (todayOrders.length === 0) return [];
    const groups: Record<string, { orders: Order[]; total: number; delivery: number; pickup: number; efectivoUsd: number; efectivoBs: number; tarjetaBs: number; pagoMovilBs: number }> = {};
    for (const o of todayOrders) {
      const cid = o.cashier_id || 'sin-caja';
      if (!groups[cid]) groups[cid] = { orders: [], total: 0, delivery: 0, pickup: 0, efectivoUsd: 0, efectivoBs: 0, tarjetaBs: 0, pagoMovilBs: 0 };
      const g = groups[cid];
      g.orders.push(o);
      g.total += o.total;
      if (o.delivery_type === 'Delivery') g.delivery += o.total;
      else g.pickup += o.total;
      const splits = orderPaymentsMap[o.id];
      if (splits && splits.length > 0) {
        for (const sp of splits) {
          if (sp.payment_method === 'Efectivo') { if (sp.currency === 'BS') g.efectivoBs += sp.amount; else g.efectivoUsd += sp.amount; }
          else if (sp.payment_method === 'Tarjeta') g.tarjetaBs += (sp.currency === 'BS') ? sp.amount : sp.amount * rate;
          else if (sp.payment_method === 'PagoMóvil') g.pagoMovilBs += (sp.currency === 'BS') ? sp.amount : sp.amount * rate;
        }
      } else {
        if (o.payment_method === 'Efectivo') { if (o.payment_currency === 'BS') g.efectivoBs += o.total * rate; else g.efectivoUsd += o.total; }
        else if (o.payment_method === 'Tarjeta') g.tarjetaBs += o.total * rate;
        else if (o.payment_method === 'PagoMóvil') g.pagoMovilBs += o.total * rate;
      }
    }
    return Object.entries(groups).map(([cid, data]) => ({
      cashierId: cid,
      cashierName: cashierNames[cid] || 'Sin caja',
      ...data,
    })).sort((a, b) => b.total - a.total);
  }, [orders, orderPaymentsMap, cashierNames, rate]);

  const maxVal = Math.max(...chart.values, 1);
  const BAR_HEIGHT = 140;
  const BAR_GAP = 6;
  const TOP_PAD = 40;
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
              <select value={month} onChange={e => { setMonth(Number(e.target.value)); setSelectedDay(0); }}
                className="bg-admin-surface border border-admin-border rounded-xl px-3 py-2 text-sm font-bold text-admin-text outline-none focus:ring-2 focus:ring-primary-vibrant cursor-pointer"
              >
                {monthNames.map((name, i) => <option key={i} value={i}>{name}</option>)}
              </select>
              <select value={selectedDay} onChange={e => setSelectedDay(Number(e.target.value))}
                className="bg-admin-surface border border-admin-border rounded-xl px-3 py-2 text-sm font-bold text-admin-text outline-none focus:ring-2 focus:ring-primary-vibrant cursor-pointer"
              >
                <option value={0}>Todos los días</option>
                {Array.from({ length: new Date(year, month + 1, 0).getDate() }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select value={year} onChange={e => { setYear(Number(e.target.value)); setSelectedDay(0); }}
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <div className="bg-admin-surface border border-admin-border rounded-2xl p-8 col-span-full">
            <div className="flex items-center gap-3 mb-6">
              <DollarSign className="w-8 h-8 text-yellow-500" />
              <h3 className="text-lg font-black">Facturado hoy</h3>
            </div>
            <p className="text-4xl font-black">${today.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <div className="flex gap-6 mt-4 text-sm">
              <span className="text-admin-muted"><Truck className="w-4 h-4 inline mr-1" />Delivery: ${today.delivery.toFixed(2)}</span>
              <span className="text-admin-muted"><Store className="w-4 h-4 inline mr-1" />Pick-up: ${today.pickup.toFixed(2)}</span>
              <span className="text-admin-muted"><ShoppingBag className="w-4 h-4 inline mr-1" />{today.count} pedidos</span>
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

          {cashierBreakdown.length > 0 && (
            <div className="col-span-full bg-admin-surface border border-admin-border rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <Users className="w-6 h-6 text-primary-vibrant" />
                <h3 className="text-lg font-black">Por Caja</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {cashierBreakdown.map(cb => (
                  <div key={cb.cashierId} className="bg-admin-surface border border-admin-border rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-admin-text text-sm">Caja {cb.cashierName}</span>
                      <span className="text-[10px] text-admin-text-muted font-bold">{cb.orders.length} pedidos</span>
                    </div>
                    <p className="text-2xl font-black text-green-400">${cb.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <div className="flex gap-3 text-[11px] text-admin-text-muted">
                      <span><Truck className="w-3 h-3 inline" /> ${cb.delivery.toFixed(2)}</span>
                      <span><Store className="w-3 h-3 inline" /> ${cb.pickup.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-admin-border pt-2 space-y-1 text-[11px]">
                      {cb.efectivoUsd > 0 && <div className="flex justify-between"><span className="text-admin-text-muted">Efectivo $</span><span className="font-bold text-green-400">${cb.efectivoUsd.toFixed(2)}</span></div>}
                      {cb.efectivoBs > 0 && <div className="flex justify-between"><span className="text-admin-text-muted">Efectivo Bs</span><span className="font-bold text-yellow-400">Bs {cb.efectivoBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span></div>}
                      {cb.tarjetaBs > 0 && <div className="flex justify-between"><span className="text-admin-text-muted">Tarjeta</span><span className="font-bold text-blue-400">Bs {cb.tarjetaBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span></div>}
                      {cb.pagoMovilBs > 0 && <div className="flex justify-between"><span className="text-admin-text-muted">P.Móvil</span><span className="font-bold text-purple-400">Bs {cb.pagoMovilBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span></div>}
                    </div>
                  </div>
                ))}
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
                <svg width="100%" height={BAR_HEIGHT + TOP_PAD + 40} viewBox={`0 0 ${barCount * (28 + BAR_GAP) + 20} ${BAR_HEIGHT + TOP_PAD + 40}`} preserveAspectRatio="xMidYMid meet" className="min-w-full">
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#cb2027" stopOpacity="1" />
                      <stop offset="100%" stopColor="#cb2027" stopOpacity="0.3" />
                    </linearGradient>
                  </defs>
                  {chart.values.map((val, i) => {
                    const barH = maxVal > 0 ? (val / maxVal) * BAR_HEIGHT : 0;
                    const x = i * (28 + BAR_GAP) + 10;
                    const y = TOP_PAD + BAR_HEIGHT - barH;
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
                        <text x={x + 12} y={TOP_PAD + BAR_HEIGHT + 16} textAnchor="middle" fill="#52525b" fontSize="9" fontWeight="bold">
                          {chart.labels[i]}
                        </text>
                      </g>
                    );
                  })}
                  {[0, 0.25, 0.5, 0.75, 1].map(pct => (
                    <line key={pct} x1="0" y1={TOP_PAD + BAR_HEIGHT - pct * BAR_HEIGHT} x2={barCount * (28 + BAR_GAP) + 10} y2={TOP_PAD + BAR_HEIGHT - pct * BAR_HEIGHT}
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