import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, MapPin, Phone, User, Clock, ChevronDown, ChevronUp, Search, Trash2, Ban, AlertTriangle, X } from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';

const ITEMS_PER_PAGE = 15;

export function OrdersPage() {
  const { orders, fetchOrders, locations, deleteOrder, updateOrderStatus } = useRestaurant();

  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [deliveryFilter, setDeliveryFilter] = useState<'all' | 'Delivery' | 'Pick-up'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'exitoso' | 'cancelado'>('all');
  const [sortField, setSortField] = useState<'created_at' | 'total' | 'customer_name'>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

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
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'created_at') cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      else if (sortField === 'total') cmp = a.total - b.total;
      else if (sortField === 'customer_name') cmp = a.customer_name.localeCompare(b.customer_name);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [orders, search, locationFilter, deliveryFilter, statusFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, page]);

  useEffect(() => { setPage(1); }, [search, locationFilter, deliveryFilter, statusFilter]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  const getLocationName = (locId: string) => locations.find(l => l.id === locId)?.name || '—';

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const renderOrderRow = (order: any, isMobile = false) => {
    if (isMobile) {
      return (
        <div key={order.id} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold text-white text-sm">{order.customer_name}</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">{formatDate(order.created_at)}</p>
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg ${
              order.delivery_type === 'Delivery' ? 'bg-primary-vibrant/10 text-primary-vibrant' : 'bg-secondary-vibrant/10 text-secondary-vibrant'
            }`}>{order.delivery_type === 'Delivery' ? 'Delivery' : 'Pick-up'}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-400">
            <div className="flex items-center gap-1"><Phone className="w-3 h-3" /><span>{order.customer_phone}</span></div>
            <span className="text-zinc-700">|</span>
            <span className="text-zinc-500">{getLocationName(order.location_id)}</span>
          </div>
          {order.delivery_address && (
            <div className="flex items-start gap-1.5 text-xs text-zinc-400">
              <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" /><span className="truncate">{order.delivery_address}</span>
            </div>
          )}
          <div className="border-t border-zinc-800 pt-2">
            {order.items.map((item: any, idx: number) => (
              <div key={idx} className="text-xs text-zinc-300">
                <span className="text-zinc-500">{item.quantity}x</span> {item.name}
                {item.notes && <span className="text-zinc-600 italic ml-1">({item.notes})</span>}
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center pt-1">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg ${
                order.status === 'cancelado' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'
              }`}>{order.status === 'cancelado' ? 'Cancelado' : 'Exitoso'}</span>
              <span className="text-[10px] text-zinc-600 uppercase tracking-widest">Total</span>
            </div>
            <div className="flex items-center gap-2">
              {order.status === 'exitoso' && (
                <button onClick={() => updateOrderStatus(order.id, 'cancelado')}
                  className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Cancelar pedido">
                  <Ban className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => setConfirmDelete(order.id)}
                className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Eliminar pedido">
                <Trash2 className="w-4 h-4" />
              </button>
              <span className="font-bold text-green-500 text-sm">${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      );
    }
    return (
      <tr key={order.id} className="bg-zinc-900/30 hover:bg-zinc-800/40 transition-colors">
        <td className="p-4 text-[11px] text-zinc-500 whitespace-nowrap">{formatDate(order.created_at)}</td>
        <td className="p-4"><span className="font-bold text-white text-sm">{order.customer_name}</span></td>
        <td className="p-4"><div className="flex items-center gap-1.5 text-zinc-400"><Phone className="w-3 h-3" /><span className="text-xs">{order.customer_phone}</span></div></td>
        <td className="p-4 max-w-[200px]">
          {order.delivery_address ? (
            <div className="flex items-start gap-1.5 text-zinc-400"><MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" /><span className="text-xs truncate">{order.delivery_address}</span></div>
          ) : <span className="text-zinc-600 text-xs italic">—</span>}
        </td>
        <td className="p-4">
          <div className="space-y-0.5">
            {order.items.map((item: any, idx: number) => (
              <div key={idx} className="text-xs text-zinc-300">
                <span className="text-zinc-500">{item.quantity}x</span> {item.name}
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
            order.status === 'cancelado' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'
          }`}>{order.status === 'cancelado' ? 'Cancelado' : 'Exitoso'}</span>
        </td>
        <td className="p-4 text-xs text-zinc-500">{getLocationName(order.location_id)}</td>
        <td className="p-4 text-right font-bold text-green-500 text-sm">${order.total.toFixed(2)}</td>
        <td className="p-4">
          <div className="flex items-center justify-end gap-1">
            {order.status === 'exitoso' && (
              <button onClick={() => updateOrderStatus(order.id, 'cancelado')}
                className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Cancelar pedido">
                <Ban className="w-4 h-4" />
              </button>
            )}
            <button onClick={() => setConfirmDelete(order.id)}
              className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Eliminar pedido">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-24">
        <ShoppingBag className="w-16 h-16 text-zinc-700 mx-auto mb-6" />
        <h2 className="text-2xl font-black text-zinc-400">Pedidos</h2>
        <p className="text-zinc-600 mt-2">Aún no hay pedidos registrados.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black">Pedidos</h2>
          <p className="text-zinc-500 text-sm">{filtered.length} de {orders.length} pedido(s)</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, teléfono..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-300 placeholder:text-zinc-600 focus:border-primary-vibrant/50 outline-none transition-colors" />
        </div>
        <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-300 focus:border-primary-vibrant/50 outline-none transition-colors">
          <option value="all">Todas las sedes</option>
          {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <select value={deliveryFilter} onChange={e => setDeliveryFilter(e.target.value as typeof deliveryFilter)}
          className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-300 focus:border-primary-vibrant/50 outline-none transition-colors">
          <option value="all">Todos los tipos</option>
          <option value="Delivery">Delivery</option>
          <option value="Pick-up">Pick-up</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
          className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-300 focus:border-primary-vibrant/50 outline-none transition-colors">
          <option value="all">Todos los estados</option>
          <option value="exitoso">Exitoso</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-900 border-b border-zinc-800">
              <th className="text-left p-4 font-bold text-zinc-400 uppercase tracking-[0.15em] text-[11px]">
                <button onClick={() => toggleSort('created_at')} className="flex items-center gap-1.5 hover:text-white transition-colors">
                  <Clock className="w-3.5 h-3.5" /> Fecha <SortIcon field="created_at" />
                </button>
              </th>
              <th className="text-left p-4 font-bold text-zinc-400 uppercase tracking-[0.15em] text-[11px]">
                <button onClick={() => toggleSort('customer_name')} className="flex items-center gap-1.5 hover:text-white transition-colors">
                  <User className="w-3.5 h-3.5" /> Cliente <SortIcon field="customer_name" />
                </button>
              </th>
              <th className="text-left p-4 font-bold text-zinc-400 uppercase tracking-[0.15em] text-[11px]">Contacto</th>
              <th className="text-left p-4 font-bold text-zinc-400 uppercase tracking-[0.15em] text-[11px]">Dirección</th>
              <th className="text-left p-4 font-bold text-zinc-400 uppercase tracking-[0.15em] text-[11px]">Items</th>
              <th className="text-left p-4 font-bold text-zinc-400 uppercase tracking-[0.15em] text-[11px]">Tipo</th>
              <th className="text-left p-4 font-bold text-zinc-400 uppercase tracking-[0.15em] text-[11px]">Estado</th>
              <th className="text-left p-4 font-bold text-zinc-400 uppercase tracking-[0.15em] text-[11px]">Sede</th>
              <th className="text-right p-4 font-bold text-zinc-400 uppercase tracking-[0.15em] text-[11px]">
                <button onClick={() => toggleSort('total')} className="flex items-center gap-1.5 hover:text-white transition-colors justify-end w-full">
                  Total <SortIcon field="total" />
                </button>
              </th>
              <th className="text-right p-4 font-bold text-zinc-400 uppercase tracking-[0.15em] text-[11px]">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {paginated.map(order => renderOrderRow(order))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {paginated.map(order => renderOrderRow(order, true))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-zinc-600 text-sm">Ningún pedido coincide con los filtros.</div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            Anterior
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                p === page ? 'bg-white text-black shadow-lg' : 'bg-zinc-800 text-zinc-500 hover:text-white'
              }`}>{p}</button>
          ))}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            Siguiente
          </button>
        </div>
      )}

      {/* Styled Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80" onClick={() => setConfirmDelete(null)} />
            <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-6 text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-white">Eliminar Pedido</h3>
                <p className="text-zinc-400 text-sm">Esta acción es permanente. El pedido se eliminará de la base de datos y no se puede recuperar.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-3 rounded-2xl bg-zinc-800 text-zinc-300 font-bold text-sm hover:bg-zinc-700 transition-colors">
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
