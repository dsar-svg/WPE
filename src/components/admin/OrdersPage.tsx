import { useEffect, useState, useMemo } from 'react';
import { ShoppingBag, MapPin, Phone, User, Clock, ChevronDown, ChevronUp, Search, Filter } from 'lucide-react';
import { Order, Location } from '../../types';
import { useRestaurant } from '../../context/RestaurantContext';

export function OrdersPage() {
  const { orders, fetchOrders, locations } = useRestaurant();

  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [deliveryFilter, setDeliveryFilter] = useState<'all' | 'Delivery' | 'Pick-up'>('all');
  const [sortField, setSortField] = useState<'created_at' | 'total' | 'customer_name'>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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

    if (locationFilter !== 'all') {
      result = result.filter(o => o.location_id === locationFilter);
    }

    if (deliveryFilter !== 'all') {
      result = result.filter(o => o.delivery_type === deliveryFilter);
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'created_at') cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      else if (sortField === 'total') cmp = a.total - b.total;
      else if (sortField === 'customer_name') cmp = a.customer_name.localeCompare(b.customer_name);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [orders, search, locationFilter, deliveryFilter, sortField, sortDir]);

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
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-zinc-800">
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
              <th className="text-left p-4 font-bold text-zinc-400 uppercase tracking-[0.15em] text-[11px]">Sede</th>
              <th className="text-right p-4 font-bold text-zinc-400 uppercase tracking-[0.15em] text-[11px]">
                <button onClick={() => toggleSort('total')} className="flex items-center gap-1.5 hover:text-white transition-colors justify-end w-full">
                  Total <SortIcon field="total" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {filtered.map((order) => (
              <tr key={order.id} className="bg-zinc-900/30 hover:bg-zinc-800/40 transition-colors">
                <td className="p-4 text-[11px] text-zinc-500 whitespace-nowrap">{formatDate(order.created_at)}</td>
                <td className="p-4">
                  <span className="font-bold text-white text-sm">{order.customer_name}</span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <Phone className="w-3 h-3" />
                    <span className="text-xs">{order.customer_phone}</span>
                  </div>
                </td>
                <td className="p-4 max-w-[200px]">
                  {order.delivery_address ? (
                    <div className="flex items-start gap-1.5 text-zinc-400">
                      <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
                      <span className="text-xs truncate">{order.delivery_address}</span>
                    </div>
                  ) : (
                    <span className="text-zinc-600 text-xs italic">—</span>
                  )}
                </td>
                <td className="p-4">
                  <div className="space-y-0.5">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="text-xs text-zinc-300">
                        <span className="text-zinc-500">{item.quantity}x</span> {item.name}
                        {item.notes && <span className="text-zinc-600 italic ml-1">({item.notes})</span>}
                      </div>
                    ))}
                  </div>
                </td>
                <td className="p-4">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg ${
                    order.delivery_type === 'Delivery'
                      ? 'bg-primary-vibrant/10 text-primary-vibrant'
                      : 'bg-secondary-vibrant/10 text-secondary-vibrant'
                  }`}>
                    {order.delivery_type === 'Delivery' ? 'Delivery' : 'Pick-up'}
                  </span>
                </td>
                <td className="p-4 text-xs text-zinc-500">{getLocationName(order.location_id)}</td>
                <td className="p-4 text-right font-bold text-green-500 text-sm">${order.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-zinc-600 text-sm">Ningún pedido coincide con los filtros.</div>
      )}
    </div>
  );
}
