import { useState, useMemo } from 'react';
import { Calendar, Download, Search, BarChart3, ShoppingBag, DollarSign } from 'lucide-react';
import { Order, Location, RestaurantConfig } from '../../types';

interface DailyReportViewProps {
  orders: Order[];
  locations: Location[];
  config: RestaurantConfig;
}

function isSameDay(dateStr: string, target: Date) {
  const d = new Date(dateStr);
  return d.getFullYear() === target.getFullYear() && d.getMonth() === target.getMonth() && d.getDate() === target.getDate();
}

function exportDailyCSV(products: { name: string; qty: number; avgPrice: number; revenue: number }[], dateLabel: string) {
  const header = 'Producto,Cantidad,Precio Unitario,Total\n';
  const rows = products.map(p => `${p.name.replace(/,/g, ';')},${p.qty},${p.avgPrice.toFixed(2)},${p.revenue.toFixed(2)}`).join('\n');
  const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `reporte-diario-${dateLabel}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function DailyReportView({ orders, locations, config }: DailyReportViewProps) {
  const now = new Date();
  const [selectedDate, setSelectedDate] = useState(now.toISOString().slice(0, 10));
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'qty' | 'revenue'>('qty');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

  const rate = config.exchangeRate ?? 1;

  const dateObj = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [selectedDate]);

  const dayOrders = useMemo(() =>
    orders.filter(o => isSameDay(o.created_at, dateObj) && o.status === 'exitoso'),
    [orders, dateObj]
  );

  const dayTotal = useMemo(() => dayOrders.reduce((s, o) => s + o.total, 0), [dayOrders]);
  const dayCount = dayOrders.length;

  const productMap = useMemo(() => {
    const map: Record<string, { qty: number; revenue: number }> = {};
    for (const o of dayOrders) {
      for (const item of o.items) {
        if (!map[item.name]) map[item.name] = { qty: 0, revenue: 0 };
        map[item.name].qty += item.quantity;
        map[item.name].revenue += item.price * item.quantity;
      }
    }
    return map;
  }, [dayOrders]);

  const allProducts = useMemo(() =>
    Object.entries(productMap).map(([name, data]) => ({
      name,
      qty: data.qty,
      avgPrice: data.qty > 0 ? data.revenue / data.qty : 0,
      revenue: data.revenue,
    })),
    [productMap]
  );

  const totalItems = useMemo(() => allProducts.reduce((s, p) => s + p.qty, 0), [allProducts]);

  const filteredProducts = useMemo(() => {
    let list = allProducts;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q));
    }
    return list.sort((a, b) => sortDir === 'desc' ? b[sortField] - a[sortField] : a[sortField] - b[sortField]);
  }, [allProducts, searchTerm, sortField, sortDir]);

  const hourlyRevenue = useMemo(() => {
    const arr = Array(24).fill(0);
    for (const o of dayOrders) {
      const h = new Date(o.created_at).getHours();
      arr[h] += o.total;
    }
    return arr;
  }, [dayOrders]);

  const maxHourly = Math.max(...hourlyRevenue, 1);

  const dateLabel = selectedDate;

  const handleSort = (field: 'qty' | 'revenue') => {
    if (sortField === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortField(field); setSortDir('desc'); }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black">Reporte Diario</h2>
          <p className="text-admin-text-muted text-sm">
            {dayCount} pedidos · {totalItems} items vendidos · ${dayTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
          className="bg-admin-surface border border-admin-border rounded-xl px-4 py-2 text-sm font-bold text-admin-text outline-none focus:ring-2 focus:ring-primary-vibrant cursor-pointer"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-admin-surface border border-admin-border rounded-2xl p-6">
          <ShoppingBag className="w-6 h-6 text-primary-vibrant mb-3" />
          <p className="text-2xl font-black">{totalItems}</p>
          <p className="text-admin-text-muted text-sm mt-1">Items vendidos</p>
        </div>
        <div className="bg-admin-surface border border-admin-border rounded-2xl p-6">
          <BarChart3 className="w-6 h-6 text-blue-400 mb-3" />
          <p className="text-2xl font-black">{dayCount}</p>
          <p className="text-admin-text-muted text-sm mt-1">Pedidos exitosos</p>
        </div>
        <div className="bg-admin-surface border border-admin-border rounded-2xl p-6">
          <DollarSign className="w-6 h-6 text-green-400 mb-3" />
          <p className="text-2xl font-black">${dayTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-admin-text-muted text-sm mt-1">Total facturado</p>
          <p className="text-xs text-zinc-500 mt-1">Bs {(dayTotal * rate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Hourly Distribution */}
      <div className="bg-admin-surface border border-admin-border rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="w-5 h-5 text-primary-vibrant" />
          <h3 className="text-lg font-black">Distribución por Hora</h3>
        </div>
        {dayOrders.length === 0 ? (
          <p className="text-admin-text-muted text-sm text-center py-8">Sin ventas en este día</p>
        ) : (
          <div className="overflow-x-auto">
            <svg width="100%" height="160" viewBox="0 0 740 160" preserveAspectRatio="xMidYMid meet" className="min-w-full">
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#cb2027" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#cb2027" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map(frac => {
                const y = 20 + (120 * (1 - frac));
                return <line key={frac} x1="30" y1={y} x2="720" y2={y} stroke="#352f2b" strokeWidth="0.5" />;
              })}
              {/* Area fill + line */}
              {(() => {
                const W = 690, OX = 30, OY = 20, H = 120;
                const pts = hourlyRevenue.map((val, i) => ({
                  x: OX + (i / 23) * W,
                  y: OY + H - (maxHourly > 0 ? (val / maxHourly) * H : 0),
                }));
                const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                const areaD = `${pathD} L ${pts[pts.length - 1].x} ${OY + H} L ${pts[0].x} ${OY + H} Z`;
                return (
                  <>
                    <path d={areaD} fill="url(#areaGrad)" />
                    <path d={pathD} fill="none" stroke="#cb2027" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                    {pts.map((p, i) => (
                      hourlyRevenue[i] > 0 && (
                        <g key={i}>
                          <circle cx={p.x} cy={p.y} r="4" fill="#cb2027" stroke="#25211e" strokeWidth="2" />
                          <title>{`${i}:00 — $${hourlyRevenue[i].toFixed(2)}`}</title>
                        </g>
                      )
                    ))}
                  </>
                );
              })()}
              {/* X labels */}
              {[0, 4, 8, 12, 16, 20, 23].map(h => (
                <text key={h} x={30 + (h / 23) * 690} y="150" textAnchor="middle" fill="#52525b" fontSize="9" fontWeight="bold">{h}h</text>
              ))}
              {/* Y labels */}
              {[0, 1].map(frac => (
                <text key={frac} x="26" y={20 + 120 * (1 - frac) + 4} textAnchor="end" fill="#52525b" fontSize="8" fontWeight="bold">
                  ${(maxHourly * frac).toFixed(0)}
                </text>
              ))}
            </svg>
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="bg-admin-surface border border-admin-border rounded-2xl p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-primary-vibrant" />
            <h3 className="text-lg font-black">Productos Vendidos ({filteredProducts.length})</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-admin-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Buscar producto..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="bg-admin-bg border border-admin-border rounded-xl pl-9 pr-4 py-2 text-sm font-bold text-admin-text outline-none focus:ring-2 focus:ring-primary-vibrant w-48"
              />
            </div>
            <button onClick={() => exportDailyCSV(filteredProducts, dateLabel)}
              className="bg-admin-surface border border-admin-border rounded-xl px-4 py-2 text-xs font-bold text-admin-text-muted hover:text-admin-text hover:border-admin-primary/50 transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Exportar CSV
            </button>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <p className="text-admin-text-muted text-sm text-center py-8">Sin productos en este día</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-admin-border">
                  <th className="text-left py-3 px-4 text-admin-text-muted font-bold text-xs uppercase tracking-wider">Producto</th>
                  <th className="text-right py-3 px-4 text-admin-text-muted font-bold text-xs uppercase tracking-wider cursor-pointer hover:text-admin-text transition-colors" onClick={() => handleSort('qty')}>
                    Cant. {sortField === 'qty' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                  </th>
                  <th className="text-right py-3 px-4 text-admin-text-muted font-bold text-xs uppercase tracking-wider">P. Unit.</th>
                  <th className="text-right py-3 px-4 text-admin-text-muted font-bold text-xs uppercase tracking-wider cursor-pointer hover:text-admin-text transition-colors" onClick={() => handleSort('revenue')}>
                    Total {sortField === 'revenue' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p, i) => (
                  <tr key={p.name} className={`border-b border-admin-border/50 hover:bg-admin-bg/50 transition-colors ${i % 2 === 0 ? '' : 'bg-admin-bg/30'}`}>
                    <td className="py-3 px-4 font-bold text-admin-text">{p.name}</td>
                    <td className="py-3 px-4 text-right text-admin-text-muted">{p.qty}</td>
                    <td className="py-3 px-4 text-right text-admin-text-muted">${p.avgPrice.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-bold text-green-400">${p.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-admin-border">
                  <td className="py-3 px-4 font-black text-admin-text">TOTAL</td>
                  <td className="py-3 px-4 text-right font-black text-admin-text">{totalItems}</td>
                  <td className="py-3 px-4 text-right"></td>
                  <td className="py-3 px-4 text-right font-black text-green-400">${dayTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
