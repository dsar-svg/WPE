import { useEffect } from 'react';
import { ShoppingBag, MapPin, Phone, User, Clock, ChevronRight } from 'lucide-react';
import { Order, Location } from '../../types';
import { useRestaurant } from '../../context/RestaurantContext';

export function OrdersPage() {
  const { orders, fetchOrders, locations } = useRestaurant();

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const getLocationName = (locId: string) => {
    return locations.find(l => l.id === locId)?.name || 'Sede desconocida';
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-VE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
          <p className="text-zinc-500 text-sm">{orders.length} pedido(s) registrados</p>
        </div>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-zinc-900 border border-zinc-800 rounded-[32px] p-6 space-y-4 hover:border-zinc-700 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-primary-vibrant" />
                  <span className="font-bold text-sm">{order.customer_name}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-500">
                  <Phone className="w-3 h-3" />
                  <span className="text-[11px]">{order.customer_phone}</span>
                </div>
                {order.delivery_address && (
                  <div className="flex items-center gap-2 text-zinc-500">
                    <MapPin className="w-3 h-3" />
                    <span className="text-[11px] truncate max-w-md">{order.delivery_address}</span>
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-green-600">${order.total.toFixed(2)}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                  {order.delivery_type === 'Delivery' ? 'Delivery' : 'Pick-up'}
                </p>
              </div>
            </div>

            <div className="bg-zinc-950 rounded-2xl p-4 space-y-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500">{item.quantity}x</span>
                    <span className="font-bold text-zinc-300">{item.name}</span>
                    {item.notes && (
                      <span className="text-zinc-600 italic">({item.notes})</span>
                    )}
                  </div>
                  <span className="text-zinc-400 font-mono">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center text-[10px] text-zinc-600">
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3" />
                <span>{getLocationName(order.location_id)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3" />
                <span>{formatDate(order.created_at)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
