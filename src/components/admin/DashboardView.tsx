import { useState, useMemo } from 'react';
import { MapPin, Utensils, ShoppingBag, DollarSign, Trophy, TrendingDown, Calendar } from 'lucide-react';
import { Order, Location, Product } from '../../types';

type DateRange = 'today' | 'week' | 'month' | 'all';

interface DashboardViewProps {
  orders: Order[];
  locations: Location[];
  menuItems: Product[];
  totalFacturado: number;
}

function useDateFilter(orders: Order[], range: DateRange) {
  return useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let start: Date;
    if (range === 'today') start = startOfDay;
    else if (range === 'week') start = startOfWeek;
    else if (range === 'month') start = startOfMonth;
    else start = new Date(0);

    const filtered = orders.filter(o => new Date(o.created_at) >= start);

    const total = filtered.reduce((s, o) => s + o.total, 0);
    const count = filtered.length;

    return { filtered, total, count, start };
  }, [orders, range]);
}

function buildChartData(orders: Order[], range: DateRange) {
  const now = new Date();
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  if (range === 'today') {
    const hours: { label: string; total: number }[] = [];
    for (let h = 8; h <= 23; h++) {
      const label = `${h.toString().padStart(2, '0')}:00`;
      const total = orders
        .filter(o => { const d = new Date(o.created_at); return d.getHours() === h && d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); })
        .reduce((s, o) => s + o.total, 0);
      hours.push({ label, total });
    }
    return { labels: hours.map(h => h.label), values: hours.map(h => h.total), title: 'Hoy por hora' };
  }

  if (range === 'week') {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const days: { label: string; total: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      const label = dayNames[d.getDay()];
      const total = orders
        .filter(o => { const od = new Date(o.created_at); return od.getDate() === d.getDate() && od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear(); })
        .reduce((s, o) => s + o.total, 0);
      days.push({ label, total });
    }
    return { labels: days.map(d => d.label), values: days.map(d => d.total), title: 'Esta semana' };
  }

  if (range === 'month') {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const step = Math.max(1, Math.floor(daysInMonth / 15));
    const days: { label: string; total: number }[] = [];
    for (let i = 5; i <= daysInMonth; i += step) {
      const total = orders
        .filter(o => { const od = new Date(o.created_at); return od.getDate() === i && od.getMonth() === now.getMonth() && od.getFullYear() === now.getFullYear(); })
        .reduce((s, o) => s + o.total, 0);
      days.push({ label: `${i}`, total });
    }
    const lastDay = daysInMonth;
    if (days.length === 0 || days[days.length - 1].label !== `${lastDay}`) {
      const total = orders
        .filter(o => { const od = new Date(o.created_at); return od.getDate() === lastDay && od.getMonth() === now.getMonth() && od.getFullYear() === now.getFullYear(); })
        .reduce((s, o) => s + o.total, 0);
      days.push({ label: `${lastDay}`, total });
    }
    return { labels: days.map(d => d.label), values: days.map(d => d.total), title: `${monthNames[now.getMonth()]} ${now.getFullYear()}` };
  }

  // all time — group by month
  const months: { label: string; total: number }[] = [];
  const map = new Map<string, number>();
  orders.forEach(o => {
    const d = new Date(o.created_at);
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    map.set(key, (map.get(key) || 0) + o.total);
  });
  const sortedKeys = Array.from(map.keys()).reverse().slice(0, 12).reverse();
  sortedKeys.forEach(k => months.push({ label: k, total: map.get(k) || 0 }));
  return { labels: months.map(m => m.label), values: months.map(m => m.total), title: 'Histórico mensual' };
}

export function DashboardView({ orders, locations, menuItems, totalFacturado: _totalFacturado }: DashboardViewProps) {
  const [range, setRange] = useState<DateRange>('month');
  const { filtered, total, count } = useDateFilter(orders, range);
  const chart = useMemo(() => buildChartData(filtered, range), [filtered, range]);

  const maxVal = Math.max(...chart.values, 1);
  const BAR_HEIGHT = 140;
  const BAR_GAP = 4;
  const barCount = chart.labels.length;
  const svgWidth = Math.max(barCount * (24 + BAR_GAP) + 20, 300);

  const productSales = filtered.reduce((acc, order) => {
    order.items.forEach(item => {
      if (!acc[item.name]) acc[item.name] = 0;
      acc[item.name] += item.quantity;
    });
    return acc;
  }, {} as Record<string, number>);
  const topSelling = Object.entries(productSales).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const leastSelling = Object.entries(productSales).sort((a, b) => a[1] - b[1]).slice(0, 5);

  const ranges: { key: DateRange; label: string }[] = [
    { key: 'today', label: 'Hoy' },
    { key: 'week', label: 'Esta Semana' },
    { key: 'month', label: 'Este Mes' },
    { key: 'all', label: 'Todo' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black">Dashboard</h2>
          <p className="text-zinc-500 text-sm">Resumen del restaurante</p>
        </div>
        <div className="flex gap-2 p-1 bg-zinc-900 border border-zinc-800 rounded-2xl">
          {ranges.map(r => (
            <button key={r.key} onClick={() => setRange(r.key)}
              className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                range === r.key ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
              }`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <MapPin className="w-8 h-8 text-primary-vibrant mb-4" />
          <p className="text-3xl font-black">{locations.length}</p>
          <p className="text-zinc-500 text-sm mt-1">Sedes activas</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <Utensils className="w-8 h-8 text-secondary-vibrant mb-4" />
          <p className="text-3xl font-black">{menuItems.length}</p>
          <p className="text-zinc-500 text-sm mt-1">Productos en menú</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <ShoppingBag className="w-8 h-8 text-green-500 mb-4" />
          <p className="text-3xl font-black">{count}</p>
          <p className="text-zinc-500 text-sm mt-1">Pedidos en período</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <DollarSign className="w-8 h-8 text-yellow-500 mb-4" />
          <p className="text-3xl font-black">${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-zinc-500 text-sm mt-1">Ventas en período</p>
        </div>
      </div>

      {/* Sales Chart */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-8">
          <Calendar className="w-6 h-6 text-primary-vibrant" />
          <h3 className="text-lg font-black">{chart.title}</h3>
        </div>
        {filtered.length === 0 ? (
          <p className="text-zinc-600 text-sm text-center py-12">Sin ventas en este período</p>
        ) : (
          <div className="overflow-x-auto pb-2">
            <svg width={svgWidth} height={BAR_HEIGHT + 40} className="min-w-full">
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#cb2027" stopOpacity="1" />
                  <stop offset="100%" stopColor="#cb2027" stopOpacity="0.3" />
                </linearGradient>
              </defs>
              {chart.values.map((val, i) => {
                const barH = maxVal > 0 ? (val / maxVal) * BAR_HEIGHT : 0;
                const x = i * (24 + BAR_GAP) + 10;
                const y = BAR_HEIGHT - barH;
                return (
                  <g key={i}>
                    <rect x={x} y={y} width={20} height={barH} rx={4} fill="url(#barGrad)" className="hover:opacity-80 transition-opacity">
                      <title>${val.toFixed(2)}</title>
                    </rect>
                    {val > 0 && (
                      <text x={x + 10} y={y - 6} textAnchor="middle" fill="#a1a1aa" fontSize="9" fontWeight="bold">
                        ${val.toFixed(2)}
                      </text>
                    )}
                    <text x={x + 10} y={BAR_HEIGHT + 16} textAnchor="middle" fill="#52525b" fontSize="9" fontWeight="bold">
                      {chart.labels[i]}
                    </text>
                  </g>
                );
              })}
              {/* horizontal grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map(pct => (
                <line key={pct} x1="0" y1={BAR_HEIGHT - pct * BAR_HEIGHT} x2={svgWidth - 10} y2={BAR_HEIGHT - pct * BAR_HEIGHT}
                  stroke="#27272a" strokeWidth="1" strokeDasharray="4 4" />
              ))}
            </svg>
          </div>
        )}
      </div>

      {/* Top / Bottom Selling */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <h3 className="text-lg font-black">Top 5 Más Vendidos</h3>
          </div>
          {topSelling.length === 0 ? (
            <p className="text-zinc-600 text-sm">Sin datos en este período</p>
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
                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-vibrant rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <TrendingDown className="w-6 h-6 text-red-500" />
            <h3 className="text-lg font-black">Top 5 Menos Vendidos</h3>
          </div>
          {leastSelling.length === 0 ? (
            <p className="text-zinc-600 text-sm">Sin datos en este período</p>
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
                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
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
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
        <h3 className="text-lg font-black mb-6">Últimos pedidos</h3>
        {filtered.length === 0 ? (
          <p className="text-zinc-600 text-sm">Sin pedidos en este período</p>
        ) : (
          <div className="space-y-3">
            {filtered.slice(0, 5).map(order => (
              <div key={order.id} className="flex items-center justify-between bg-zinc-950 p-4 rounded-2xl">
                <div>
                  <p className="font-bold text-sm text-white">{order.customer_name}</p>
                  <p className="text-[10px] text-zinc-500">${order.total.toFixed(2)} · {order.delivery_type}</p>
                </div>
                <span className="text-[10px] text-zinc-600">
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
