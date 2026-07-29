import { useState } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { Cashier } from '../../types';
import { supabase } from '../../lib/supabase';
import { useRestaurant } from '../../context/RestaurantContext';
import { hashPin } from '../../lib/hashPin';

interface CashierFormProps {
  cashier?: Cashier;
  onClose: () => void;
  onSaved: () => void;
}

export function CashierForm({ cashier, onClose, onSaved }: CashierFormProps) {
  const { locations } = useRestaurant();
  const [form, setForm] = useState({
    box: cashier?.employee_id || '',
    pin: cashier?.pin || '',
    location_id: cashier?.location_id || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.box || form.pin.length !== 4) return;
    setSaving(true);
    try {
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
      if (cashier) {
        await supabase.from('admins').update(record).eq('id', cashier.id);
      } else {
        await supabase.from('admins').insert(record);
      }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
        className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-6"
      >
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black">{cashier ? 'Editar Cajera' : 'Nueva Cajera'}</h2>
          <button onClick={onClose} className="p-2 bg-zinc-800 rounded-full text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Número de Caja</label>
              <input value={form.box} onChange={e => setForm(f => ({ ...f, box: e.target.value }))}
                placeholder="Ej: Caja 1"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary-vibrant" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">PIN (4 dígitos)</label>
              <input value={form.pin} maxLength={4} onChange={e => setForm(f => ({ ...f, pin: e.target.value.replace(/\D/g, '') }))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm font-bold font-mono tracking-widest outline-none focus:ring-2 focus:ring-primary-vibrant" inputMode="numeric" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Sede</label>
            <select value={form.location_id} onChange={e => setForm(f => ({ ...f, location_id: e.target.value }))}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary-vibrant"
            >
              <option value="">Seleccionar sede</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-zinc-800 text-zinc-400 font-bold text-sm hover:bg-zinc-700 transition-all">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={!form.box || form.pin.length !== 4 || saving}
            className="flex-1 py-3 rounded-xl bg-primary-vibrant text-white font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}