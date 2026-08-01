import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, MapPin, Phone, User, Clock, ChevronDown, ChevronUp, Search, Trash2, Ban, AlertTriangle, X, Download, UserCircle } from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { supabase } from '../../lib/supabase';
import { Cashier } from '../../types';
import { EmptyState } from '../ui/EmptyState';
import { TableSkeleton } from '../ui/Skeleton';

const ITEMS_PER_PAGE = 15;

function exportCSV(orders: any[], locations: any[], cashiers: any[]) {
  const headers = ['Fecha', 'Cliente', 'Teléfono', 'Dirección', 'Items', 'Tipo', 'Estado', 'Sede', 'Caja', 'Total', 'Método Pago', 'Notas'];
  const rows = orders.map(o => [
    new Date(o.created_at).toLocaleString('es-VE'),
    o.customer_name,
    o.customer_phone,
    o.delivery_address || '',
    o.items.map((i: any) => `${i.quantity}x ${i.name}`).join(' / '),
    o.delivery_type,
    o.status === 'cancelado' ? 'Cancelado' : o.status === 'pendiente' ? 'Pendiente' : 'Exitoso',
    locations.find(l => l.id === o.location_id)?.name || '',
    o.cashier_id ? (cashiers.find((c: any) => c.id === o.cashier_id)?.employee_id || cashiers.find((c: any) => c.id === o.cashier_id)?.name || '') : '',
    `$${o.total.toFixed(2)}`,
    o.payment_method || '',
    o.notes || '',
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pedidos_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function OrdersPage() {
  const { orders, fetchOrders, locations, deleteOrder, updateOrderStatus } = useRestaurant();

  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [deliveryFilter, setDeliveryFilter] = useState<'all' | 'Delivery' | 'Pick-up'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pendiente' | 'exitoso' | 'cancelado'>('all');
  const [sortField, setSortField] = useState<'created_at' | 'total' | 'customer_name'>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [cashierFilter, setCashierFilter] = useState('all');
  const [orderPaymentsMap, setOrderPaymentsMap] = useState<Record<string, { payment_method: string; amount: number; currency?: string }[]>>({});

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('admins').select('*').eq('role', 'cashier');
      if (data) setCashiers(data.map(r => ({ id: r.id, name: r.name, email: r.email, employee_id: r.employee_id, location_id: r.location_id, pin: r.pin })));
    })();
  }, []);

  // Fetch order_payments for all visible orders
  useEffect(() => {
    if (orders.length === 0) { setOrderPaymentsMap({}); return; }
    const ids = orders.map(o => o.id);
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

  const getPaymentLabel = (order: any) => {
    const splits = orderPaymentsMap[order.id];
    if (splits && splits.length > 1) {
      return splits.map(s => {
        const label = s.payment_method === 'Efectivo' && s.currency === 'BS' ? 'Efectivo Bs' : s.payment_method;
        return `${label} $${s.amount.toFixed(2)}`;
      }).join(' + ');
    }
    if (splits && splits.length === 1) {
      return splits[0].payment_method === 'Efectivo' && splits[0].currency === 'BS' ? 'Efectivo Bs' : splits[0].payment_method;
    }
    return order.payment_method || '—';
  };

  const filtered = useMemo(() => {
    let result = [...orders];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(o =>
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_phone.includes(q) ||
        (o.delivery_address || '').toLowerCase().includes(q)
      );
    }
    if (locationFilter !== 'all') result = result.filter(o => o.location_id === locationFilter);
    if (deliveryFilter !== 'all') result = result.filter(o => o.delivery_type === deliveryFilter);
    if (statusFilter !== 'all') result = result.filter(o => o.status === statusFilter);
    if (cashierFilter !== 'all') result = result.filter(o => o.cashier_id === cashierFilter);
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'created_at') cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      else if (sortField === 'total') cmp = a.total - b.total;
      else if (sortField === 'customer_name') cmp = a.customer_name.localeCompare(b.customer_name);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [orders, search, locationFilter, deliveryFilter, statusFilter, cashierFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, page]);

  useEffect(() => { setPage(1); }, [search, locationFilter, deliveryFilter, statusFilter, cashierFilter]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  const getLocationName = (locId: string) => locations.find(l => l.id === locId)?.name || '—';
  const getCashierName = (cashierId?: string) => {
    if (!cashierId) return null;
    const c = cashiers.find(c => c.id === cashierId);
    return c?.employee_id || c?.name || c?.email || null;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const renderOrderRow = (order: any, isMobile = false) => {
    if (isMobile) {
      return (
        <div key={order.id} className="bg-admin-surface border border-admin-border rounded-2xl p-4 space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold text-admin-text text-sm">{order.customer_name}</p>
              <p className="text-[10px] text-admin-muted mt-0.5">{formatDate(order.created_at)}</p>
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg ${
              order.delivery_type === 'Delivery' ? 'bg-primary-vibrant/10 text-primary-vibrant' : 'bg-secondary-vibrant/10 text-secondary-vibrant'
            }`}>{order.delivery_type === 'Delivery' ? 'Delivery' : 'Pick-up'}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-admin-muted">
            <div className="flex items-center gap-1"><Phone className="w-3 h-3" /><span>{order.customer_phone}</span></div>
            <span className="text-admin-border">|</span>
            <span className="text-admin-muted">{getLocationName(order.location_id)}</span>
          </div>
          {order.delivery_address && (
            <div className="flex items-start gap-1.5 text-xs text-admin-muted">
              <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" /><span className="truncate">{order.delivery_address}</span>
            </div>
          )}
          <div className="border-t border-admin-border pt-2">
            {order.items.map((item: any, idx: number) => (
              <div key={idx} className="text-xs text-zinc-300">
                <span className="text-admin-muted">{item.quantity}x</span> {item.name}
                {item.notes && <span className="text-zinc-600 italic ml-1">({item.notes})</span>}
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center pt-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg ${
                order.status === 'cancelado' ? 'bg-red-500/10 text-red-400' :
                order.status === 'pendiente' ? 'bg-yellow-500/10 text-yellow-400' :
                'bg-green-500/10 text-green-400'
              }`}>{order.status === 'cancelado' ? 'Cancelado' : order.status === 'pendiente' ? 'Pendiente' : 'Exitoso'}</span>
              {getCashierName(order.cashier_id) && (
                <span className="text-[10px] text-admin-muted flex items-center gap-1">
                  <UserCircle className="w-3 h-3" />{getCashierName(order.cashier_id)}
                </span>
              )}
              <span className="text-[10px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">{getPaymentLabel(order)}</span>
              <span className="text-[10px] text-admin-muted uppercase tracking-widest">Total</span>
            </div>
            <div className="flex items-center gap-2">
              {order.status === 'exitoso' && (
                <button onClick={() => updateOrderStatus(order.id, 'cancelado')}
                  className="p-1.5 text-admin-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Cancelar pedido">
                  <Ban className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => setConfirmDelete(order.id)}
                className="p-1.5 text-admin-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Eliminar pedido">
                <Trash2 className="w-4 h-4" />
              </button>
              <span className="font-bold text-green-500 text-sm">${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      );
    }
    return (
      <tr key={order.id} className="bg-admin-surface/30 hover:bg-admin-border/40 transition-colors">
        <td className="p-4 text-[11px] text-admin-muted whitespace-nowrap">{formatDate(order.created_at)}</td>
        <td className="p-4"><span className="font-bold text-admin-text text-sm">{order.customer_name}</span></td>
        <td className="p-4"><div className="flex items-center gap-1.5 text-admin-muted"><Phone className="w-3 h-3" /><span className="text-xs">{order.customer_phone}</span></div></td>
        <td className="p-4 max-w-[200px]">
          {order.delivery_address ? (
            <div className="flex items-start gap-1.5 text-admin-muted"><MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" /><span className="text-xs truncate">{order.delivery_address}</span></div>
          ) : <span className="text-zinc-600 text-xs italic">—</span>}
        </td>
        <td className="p-4">
          <div className="space-y-0.5">
            {order.items.map((item: any, idx: number) => (
              <div key={idx} className="text-xs text-zinc-300">
                <span className="text-admin-muted">{item.quantity}x</span> {item.name}
                {item.notes && <span className="text-zinc-600 italic ml-1">({item.notes})</span>}
              </div>
            ))}
          </div>
        </td>
        <td className="p-4">
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg ${
            order.delivery_type === 'Delivery' ? 'bg-primary-vibrant/10 text-primary-vibrant' : 'bg-secondary-vibrant/10 text-secondary-vibrant'
          }`}>{order.delivery_type === 'Delivery' ? 'Delivery' : 'Pick-up'}</span>
        </td>
        <td className="p-4">
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg ${
            order.status === 'cancelado' ? 'bg-red-500/10 text-red-400' :
            order.status === 'pendiente' ? 'bg-yellow-500/10 text-yellow-400' :
            'bg-green-500/10 text-green-400'
          }`}>{order.status === 'cancelado' ? 'Cancelado' : order.status === 'pendiente' ? 'Pendiente' : 'Exitoso'}</span>
        </td>
        <td className="p-4 text-xs text-admin-muted">{getLocationName(order.location_id)}</td>
        <td className="p-4 text-xs text-admin-muted">
          {getCashierName(order.cashier_id) ? (
            <span className="flex items-center gap-1"><UserCircle className="w-3 h-3" />{getCashierName(order.cashier_id)}</span>
          ) : '—'}
        </td>
        <td className="p-4 text-xs text-admin-muted">
          <span className="bg-zinc-800 px-2 py-1 rounded-full">{getPaymentLabel(order)}</span>
        </td>
        <td className="p-4 text-right font-bold text-green-500 text-sm">${order.total.toFixed(2)}</td>
        <td className="p-4">
          <div className="flex items-center justify-end gap-1">
            {order.status === 'exitoso' && (
              <button onClick={() => updateOrderStatus(order.id, 'cancelado')}
                className="p-1.5 text-admin-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Cancelar pedido">
                <Ban className="w-4 h-4" />
              </button>
            )}
            <button onClick={() => setConfirmDelete(order.id)}
              className="p-1.5 text-admin-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Eliminar pedido">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  if (orders.length === 0) {
    return (
      <EmptyState icon={ShoppingBag} title="Pedidos"
        description="Aún no hay pedidos registrados. Los pedidos aparecerán aquí cuando los clientes realicen órdenes." />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black">Pedidos</h2>
          <p className="text-admin-muted text-sm">{filtered.length} de {orders.length} pedido(s)</p>
        </div>
        <button onClick={() => exportCSV(filtered, locations, cashiers)}
          className="flex items-center gap-2 bg-admin-surface border border-admin-border px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-admin-muted hover:text-admin-text hover:border-admin-muted transition-all">
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, teléfono..."
            className="w-full pl-10 pr-4 py-2.5 bg-admin-surface border border-admin-border rounded-xl text-sm text-admin-text placeholder:text-admin-muted focus:border-primary-vibrant/50 outline-none transition-colors" />
        </div>
        <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)}
          className="bg-admin-surface border border-admin-border rounded-xl px-4 py-2.5 text-sm text-admin-text focus:border-primary-vibrant/50 outline-none transition-colors">
          <option value="all">Todas las sedes</option>
          {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <select value={deliveryFilter} onChange={e => setDeliveryFilter(e.target.value as typeof deliveryFilter)}
          className="bg-admin-surface border border-admin-border rounded-xl px-4 py-2.5 text-sm text-admin-text focus:border-primary-vibrant/50 outline-none transition-colors">
          <option value="all">Todos los tipos</option>
          <option value="Delivery">Delivery</option>
          <option value="Pick-up">Pick-up</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
          className="bg-admin-surface border border-admin-border rounded-xl px-4 py-2.5 text-sm text-admin-text focus:border-primary-vibrant/50 outline-none transition-colors">
          <option value="all">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="exitoso">Exitoso</option>
          <option value="cancelado">Cancelado</option>
        </select>
        {cashiers.length > 0 && (
          <select value={cashierFilter} onChange={e => setCashierFilter(e.target.value)}
            className="bg-admin-surface border border-admin-border rounded-xl px-4 py-2.5 text-sm text-admin-text focus:border-primary-vibrant/50 outline-none transition-colors">
            <option value="all">Todas las cajas</option>
            {cashiers.map(c => <option key={c.id} value={c.id}>{c.employee_id || c.name || c.email}</option>)}
          </select>
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-admin-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-admin-surface border-b border-admin-border">
              <th className="text-left p-4 font-bold text-admin-muted uppercase tracking-[0.15em] text-[11px]">
                <button onClick={() => toggleSort('created_at')} className="flex items-center gap-1.5 hover:text-admin-text transition-colors">
                  <Clock className="w-3.5 h-3.5" /> Fecha <SortIcon field="created_at" />
                </button>
              </th>
              <th className="text-left p-4 font-bold text-admin-muted uppercase tracking-[0.15em] text-[11px]">
                <button onClick={() => toggleSort('customer_name')} className="flex items-center gap-1.5 hover:text-admin-text transition-colors">
                  <User className="w-3.5 h-3.5" /> Cliente <SortIcon field="customer_name" />
                </button>
              </th>
              <th className="text-left p-4 font-bold text-admin-muted uppercase tracking-[0.15em] text-[11px]">Contacto</th>
              <th className="text-left p-4 font-bold text-admin-muted uppercase tracking-[0.15em] text-[11px]">Dirección</th>
              <th className="text-left p-4 font-bold text-admin-muted uppercase tracking-[0.15em] text-[11px]">Items</th>
              <th className="text-left p-4 font-bold text-admin-muted uppercase tracking-[0.15em] text-[11px]">Tipo</th>
              <th className="text-left p-4 font-bold text-admin-muted uppercase tracking-[0.15em] text-[11px]">Estado</th>
              <th className="text-left p-4 font-bold text-admin-muted uppercase tracking-[0.15em] text-[11px]">Sede</th>
              <th className="text-left p-4 font-bold text-admin-muted uppercase tracking-[0.15em] text-[11px]">Caja</th>
              <th className="text-left p-4 font-bold text-admin-muted uppercase tracking-[0.15em] text-[11px]">Pago</th>
              <th className="text-right p-4 font-bold text-admin-muted uppercase tracking-[0.15em] text-[11px]">
                <button onClick={() => toggleSort('total')} className="flex items-center gap-1.5 hover:text-admin-text transition-colors justify-end w-full">
                  Total <SortIcon field="total" />
                </button>
              </th>
              <th className="text-right p-4 font-bold text-admin-muted uppercase tracking-[0.15em] text-[11px]">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-admin-border/50">
            {paginated.map(order => renderOrderRow(order))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {paginated.map(order => renderOrderRow(order, true))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-admin-muted text-sm">Ningún pedido coincide con los filtros.</div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (() => {
        const pages: (number | '...')[] = [];
        const maxVisible = 7;
        if (totalPages <= maxVisible) {
          for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
          pages.push(1);
          const start = Math.max(2, page - 1);
          const end = Math.min(totalPages - 1, page + 1);
          if (start > 2) pages.push('...');
          for (let i = start; i <= end; i++) pages.push(i);
          if (end < totalPages - 1) pages.push('...');
          pages.push(totalPages);
        }
        return (
          <div className="flex items-center justify-center gap-1.5 pt-4">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-admin-surface text-admin-muted hover:text-admin-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              Anterior
            </button>
            {pages.map((p, i) => p === '...' ? (
              <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-admin-muted">…</span>
            ) : (
              <button key={p} onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                  p === page ? 'bg-white text-black shadow-lg' : 'bg-admin-surface text-admin-muted hover:text-admin-text'
                }`}>{p}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-admin-surface text-admin-muted hover:text-admin-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              Siguiente
            </button>
          </div>
        );
      })()}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80" onClick={() => setConfirmDelete(null)} />
            <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="relative w-full max-w-sm bg-admin-surface border border-admin-border rounded-2xl p-8 space-y-6 text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-admin-text">Eliminar Pedido</h3>
                <p className="text-admin-muted text-sm">Esta acción es permanente. El pedido se eliminará de la base de datos y no se puede recuperar.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-3 rounded-2xl bg-admin-border text-admin-muted font-bold text-sm hover:bg-zinc-700 transition-colors">
                  Cancelar
                </button>
                <button onClick={() => { deleteOrder(confirmDelete); setConfirmDelete(null); }}
                  className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors">
                  Eliminar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}