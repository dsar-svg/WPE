import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Edit2, Trash2, Key, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { Cashier } from '../../types';
import { supabase } from '../../lib/supabase';
import { useRestaurant } from '../../context/RestaurantContext';
import { hashPin } from '../../lib/hashPin';

export function CashierModal({ onClose }: { onClose: () => void }) {
  const { locations } = useRestaurant();
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ box: '', pin: '', location_id: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showPin, setShowPin] = useState<string | null>(null);

  const fetch = async () => {
    const { data } = await supabase.from('admins').select('*').eq('role', 'cashier');
    if (data) setCashiers(data.map(r => ({ id: r.id, name: r.name, email: r.email, employee_id: r.employee_id, location_id: r.location_id, pin: r.pin })));
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const handleSave = async () => {
    if (!form.box || form.pin.length !== 4) return;
    const pinHash = await hashPin(form.pin);
    const email = `${form.box.replace(/\s+/g, '').toLowerCase()}@caja.local`;
    const record = {
      name: form.box,
      email,
      employee_id: form.box,
      pin_hash: pinHash,
      pin: form.pin,
      location_id: form.location_id || null,
      role: 'cashier',
    };
    if (editingId) {
      await supabase.from('admins').update(record).eq('id', editingId);
    } else {
      await supabase.from('admins').insert(record);
    }
    setEditingId(null);
    setIsAdding(false);
    setForm({ box: '', pin: '', location_id: '' });
    fetch();
  };

  const startEdit = (c: Cashier) => {
    setEditingId(c.id);
    setForm({ box: c.employee_id || '', pin: c.pin || '', location_id: c.location_id || '' });
  };

  const handleDelete = async (id: string) => {
    await supabase.from('admins').delete().eq('id', id);
    setConfirmDelete(null);
    fetch();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
        className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black tracking-tight">Gestionar Cajeras</h2>
          <button onClick={onClose} className="p-2 bg-zinc-800 rounded-full text-zinc-500 hover:text-white"><X /></button>
        </div>

        {isAdding || editingId ? (
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <h3 className="font-black text-sm">{editingId ? 'Editar Cajera' : 'Nueva Cajera'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Número de Caja</label>
                <input value={form.box} onChange={e => setForm(f => ({ ...f, box: e.target.value }))}
                  placeholder="Ej: Caja 1"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary-vibrant" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">PIN (4 dígitos)</label>
                <input value={form.pin} maxLength={4} onChange={e => setForm(f => ({ ...f, pin: e.target.value.replace(/\D/g, '') }))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm font-bold font-mono tracking-widest outline-none focus:ring-2 focus:ring-primary-vibrant" inputMode="numeric" />
              </div>
              <div className="space-y-1 col-span-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Sede</label>
                <select value={form.location_id} onChange={e => setForm(f => ({ ...f, location_id: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary-vibrant"
                >
                  <option value="">Seleccionar sede</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setEditingId(null); setIsAdding(false); setForm({ box: '', pin: '', location_id: '' }); }}
                className="flex-1 py-3 rounded-xl bg-zinc-800 text-zinc-400 font-bold text-sm hover:bg-zinc-700 transition-all">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={!form.box || form.pin.length !== 4}
                className="flex-1 py-3 rounded-xl bg-primary-vibrant text-white font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">
                Guardar
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-primary-vibrant text-white px-5 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg">
            <Plus className="w-4 h-4" /> Nueva Cajera
          </button>
        )}

        {loading ? (
          <div className="text-center py-8 text-zinc-600 text-sm animate-pulse">Cargando...</div>
        ) : cashiers.length === 0 ? (
          <div className="text-center py-8 text-zinc-600 text-sm">No hay cajeras registradas</div>
        ) : (
          <div className="space-y-2 max-h-[40vh] overflow-y-auto no-scrollbar pr-2">
            {cashiers.map(c => (
              <div key={c.id} className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 flex items-center justify-between group">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Key className="w-4 h-4 text-zinc-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-white truncate">{c.employee_id}</div>
                    <div className="text-xs text-zinc-500 flex items-center gap-3 mt-0.5">
                      {locations.find(l => l.id === c.location_id)?.name && (
                        <span>{locations.find(l => l.id === c.location_id)?.name}</span>
                      )}
                      <button onClick={() => setShowPin(showPin === c.id ? null : c.id)}
                        className="text-zinc-600 hover:text-white transition-all">
                        {showPin === c.id ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                      {showPin === c.id && <span className="font-mono font-bold text-zinc-400">{c.pin}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => startEdit(c)}
                    className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-all">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setConfirmDelete(c.id)}
                    className="p-2 text-zinc-500 hover:text-primary-vibrant hover:bg-primary-vibrant/10 rounded-lg transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80" onClick={() => setConfirmDelete(null)} />
            <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-6 text-center">
              <div className="w-16 h-16 bg-primary-vibrant/10 rounded-2xl flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 text-primary-vibrant" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-white">Eliminar Cajera</h3>
                <p className="text-zinc-400 text-sm">¿Estás seguro? No se podrá recuperar.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-3 rounded-2xl bg-zinc-800 text-zinc-300 font-bold text-sm hover:bg-zinc-700 transition-colors">Cancelar</button>
                <button onClick={() => handleDelete(confirmDelete)}
                  className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors">Eliminar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}