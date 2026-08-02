import { useMemo, useState, useEffect } from 'react';
import { ShoppingBag, DollarSign, Receipt, Clock, MapPin } from 'lucide-react';
import { Order, Location, Product } from '../../types';
import { supabase } from '../../lib/supabase';

interface ReporteDiarioProps {
  orders: Order[];
  locations: Location[];
  menuItems: Product[];
}

function isToday(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function getHour(dateStr: string) {
  return new Date(dateStr).getHours();
}

export function ReporteDiario({ orders, locations, menuItems }: ReporteDiarioProps) {
  const [orderPaymentsMap, setOrderPaymentsMap] = useState<Record<string, { payment_method: string; amount: number; currency?: string }[]>>({});

  const todayOrders = useMemo(
    () => orders.filter(o => isToday(o.created_at) && o.status === 'exitoso'),
    [orders]
  );

  useEffect(() => {
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
  }, [todayOrders]);

  const kpis = useMemo(() => {
    const total = todayOrders.reduce((s, o) => s + o.total, 0);
    const count = todayOrders.length;
    const ticket = count > 0 ? total / count : 0;

    let avgMinutes = 0;
    if (count >= 2) {
      const sorted = [...todayOrders].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      let sumDiff = 0;
      for (let i = 1; i < sorted.length; i++) {
        sumDiff += new Date(sorted[i].created_at).getTime() - new Date(sorted[i - 1].created_at).getTime();
      }
      avgMinutes = sumDiff / (sorted.length - 1) / 60000;
    }

    return { total, count, ticket, avgMinutes };
  }, [todayOrders]);

  const hourlyData = useMemo(() => {
    const buckets = Array.from({ length: 24 }, () => 0);
    todayOrders.forEach(o => { buckets[getHour(o.created_at)]++; });
    const max = Math.max(...buckets, 1);
    return { buckets, max };
  }, [todayOrders]);

  const productSales = useMemo(() => {
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

  const categorySales = useMemo(() => {
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

  const paymentBreakdown = useMemo(() => {
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

  const locationSummary = useMemo(() => {
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

  const catMax = Math.max(...categorySales.map(c => c.revenue), 1);
  const payMax = Math.max(...paymentBreakdown.map(p => p.amount), 1);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-admin-text uppercase tracking-widest">Reporte Diario</h2>
        <p className="text-xs text-admin-text-muted mt-1">
          {new Date().toLocaleDateString('es-VE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={<DollarSign className="w-5 h-5" />} label="Total Vendido" value={`$${kpis.total.toFixed(2)}`} />
        <KpiCard icon={<ShoppingBag className="w-5 h-5" />} label="Pedidos" value={String(kpis.count)} />
        <KpiCard icon={<Receipt className="w-5 h-5" />} label="Ticket Promedio" value={`$${kpis.ticket.toFixed(2)}`} />
        <KpiCard icon={<Clock className="w-5 h-5" />} label="Tiempo Prom. entre Pedidos" value={kpis.count < 2 ? '—' : `${Math.floor(kpis.avgMinutes)}m ${Math.round((kpis.avgMinutes % 1) * 60)}s`} />
      </div>

      {/* Hourly Heatmap */}
      <div className="bg-admin-surface border border-admin-border rounded-2xl p-6">
        <h3 className="text-sm font-black text-admin-text uppercase tracking-widest mb-4">Mapa de Calor por Hora</h3>
        <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-12 gap-2">
          {hourlyData.buckets.map((count, hour) => {
            const intensity = count / hourlyData.max;
            const bgClass = count === 0
              ? 'bg-admin-bg'
              : intensity < 0.25
                ? 'bg-green-900/40'
                : intensity < 0.5
                  ? 'bg-green-700/50'
                  : intensity < 0.75
                    ? 'bg-green-500/60'
                    : 'bg-green-400/80';
            return (
              <div key={hour} className={`relative group aspect-square rounded-xl flex flex-col items-center justify-center ${bgClass} border border-admin-border transition-all hover:scale-105`}>
                <span className="text-[10px] font-black text-admin-text">{hour.toString().padStart(2, '0')}</span>
                <span className="text-[8px] text-admin-text-muted">{count}</span>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-[9px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  {hour.toString().padStart(2, '0')}:00 — {count} pedidos
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Products + Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-admin-surface border border-admin-border rounded-2xl p-6">
          <h3 className="text-sm font-black text-admin-text uppercase tracking-widest mb-4">Top Productos Hoy</h3>
          {productSales.length === 0 ? (
            <p className="text-xs text-admin-text-muted">Sin ventas hoy</p>
          ) : (
            <div className="space-y-3">
              {productSales.slice(0, 10).map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-admin-muted w-5 text-right">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-admin-text truncate">{p.name}</span>
                      <span className="text-[10px] text-admin-text-muted shrink-0">{p.qty}x · ${p.revenue.toFixed(2)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-admin-bg rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-primary-vibrant rounded-full" style={{ width: `${(p.qty / productSales[0].qty) * 100}%` }} />
                    </div>
                    <span className="text-[9px] text-admin-text-muted">{p.category}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Categories */}
        <div className="bg-admin-surface border border-admin-border rounded-2xl p-6">
          <h3 className="text-sm font-black text-admin-text uppercase tracking-widest mb-4">Ventas por Categoría</h3>
          {categorySales.length === 0 ? (
            <p className="text-xs text-admin-text-muted">Sin ventas hoy</p>
          ) : (
            <div className="space-y-3">
              {categorySales.map(cat => (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-admin-text">{cat.name}</span>
                    <span className="text-[10px] text-admin-text-muted">{cat.qty}x · ${cat.revenue.toFixed(2)}</span>
                  </div>
                  <div className="w-full h-2 bg-admin-bg rounded-full overflow-hidden">
                    <div className="h-full bg-primary-vibrant/70 rounded-full" style={{ width: `${(cat.revenue / catMax) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payment Methods + Location Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <div className="bg-admin-surface border border-admin-border rounded-2xl p-6">
          <h3 className="text-sm font-black text-admin-text uppercase tracking-widest mb-4">Métodos de Pago</h3>
          {paymentBreakdown.length === 0 ? (
            <p className="text-xs text-admin-text-muted">Sin pagos hoy</p>
          ) : (
            <div className="space-y-3">
              {paymentBreakdown.map(p => (
                <div key={p.method}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-admin-text">{p.method}</span>
                    <span className="text-[10px] text-admin-text-muted">${p.amount.toFixed(2)}</span>
                  </div>
                  <div className="w-full h-2 bg-admin-bg rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500/70 rounded-full" style={{ width: `${(p.amount / payMax) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Location Summary */}
        <div className="bg-admin-surface border border-admin-border rounded-2xl p-6">
          <h3 className="text-sm font-black text-admin-text uppercase tracking-widest mb-4">Resumen por Sede</h3>
          {locationSummary.length === 0 ? (
            <p className="text-xs text-admin-text-muted">Sin ventas hoy</p>
          ) : (
            <div className="space-y-3">
              {locationSummary.map(loc => (
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
    </div>
  );
}

function KpiCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-admin-surface border border-admin-border rounded-2xl p-5 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-primary-vibrant/10 flex items-center justify-center shrink-0 text-primary-vibrant">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-admin-text-muted uppercase tracking-widest font-bold">{label}</p>
        <p className="text-lg font-black text-admin-text truncate">{value}</p>
      </div>
    </div>
  );
}
