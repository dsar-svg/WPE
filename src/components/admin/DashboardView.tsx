import { useState, useMemo } from 'react';
import { MapPin, Utensils, ShoppingBag, DollarSign, Trophy, TrendingDown, Calendar, ArrowUpRight, ArrowDownRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Order, Location, Product } from '../../types';

interface DashboardViewProps {
  orders: Order[];
  locations: Location[];
  menuItems: Product[];
  totalFacturado: number;
}

const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

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

export function DashboardView({ orders, locations, menuItems, totalFacturado: _totalFacturado }: DashboardViewProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const { filtered, total, count, prevTotal, prevCount, totalChange, countChange } = useMonthFilter(orders, year, month);
  const chart = useMemo(() => buildMonthChart(filtered, year, month), [filtered, year, month]);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

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
          <p className="text-admin-muted text-sm">Resumen mensual</p>
        </div>
        <div className="flex items-center gap-3 bg-admin-surface border border-admin-border rounded-2xl px-4 py-2">
          <button onClick={prevMonth} className="p-1.5 rounded-xl hover:bg-admin-border text-admin-muted hover:text-admin-text transition-all">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-black text-admin-text min-w-[100px] text-center select-none">
            {monthNames[month]} {year}
          </span>
          <button onClick={nextMonth} className="p-1.5 rounded-xl hover:bg-admin-border text-admin-muted hover:text-admin-text transition-all">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
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
    </div>
  );
}