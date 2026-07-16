import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { Save, RefreshCcw, Plus, Trash2, Edit2, Truck, Banknote, Loader2, AlertTriangle } from 'lucide-react';
import { RestaurantConfig, PagoMovilData } from '../../types';
import { fetchBcvRate, saveRateSource } from '../../services/bcvRate';
import { PagoMovilForm } from './PagoMovilForm';

interface FinanzasPageProps {
  config: RestaurantConfig;
  onSave: (c: RestaurantConfig) => Promise<void>;
}

export function FinanzasPage({ config: initialConfig, onSave }: FinanzasPageProps) {
  const [activeTab, setActiveTab] = useState<'delivery' | 'pagomovil'>('delivery');
  const [data, setData] = useState<RestaurantConfig>(() => ({
    ...initialConfig,
    distancePricing: initialConfig.distancePricing || {
      ranges: [{ maxDistance: 5, fee: 3.00 }, { maxDistance: 10, fee: 5.00 }, { maxDistance: 15, fee: 7.00 }, { maxDistance: null, fee: 0.00 }],
      maxDeliveryDistance: 20,
    },
    pagoMovil: initialConfig.pagoMovil || [],
  }));
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingRate, setIsFetchingRate] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: number; type: 'success' | 'error'; message: string }>>([]);
  const toastTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const [isAddingPm, setIsAddingPm] = useState(false);
  const [editingPm, setEditingPm] = useState<PagoMovilData | null>(null);
  const [confirmDeletePm, setConfirmDeletePm] = useState<string | null>(null);

  useEffect(() => {
    const timers = toastTimers.current;
    return () => { timers.forEach(t => clearTimeout(t)); timers.clear(); };
  }, []);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    const timer = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      toastTimers.current.delete(id);
    }, 4000);
    toastTimers.current.set(id, timer);
  }, []);

  // Auto-fetch BCV rate on mount and every 5 min
  useEffect(() => {
    const fetchRate = async () => {
      setIsFetchingRate(true);
      try {
        const rate = await fetchBcvRate();
        if (rate !== null) {
          setData(prev => ({ ...prev, exchangeRate: rate }));
          saveRateSource('bcv');
        }
      } catch { /* BCV rate fetch failed */ }
      setIsFetchingRate(false);
    };
    fetchRate();
    const interval = setInterval(fetchRate, 300000);
    return () => clearInterval(interval);
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(data);
      showToast('success', 'Cambios guardados correctamente');
    } catch (err: any) {
      showToast('error', err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const addPagoMovil = (entry: PagoMovilData) => {
    setData(prev => ({ ...prev, pagoMovil: [...(prev.pagoMovil || []), entry] }));
  };

  const updatePagoMovil = (entry: PagoMovilData) => {
    setData(prev => ({ ...prev, pagoMovil: (prev.pagoMovil || []).map(p => p.id === entry.id ? entry : p) }));
  };

  const deletePagoMovil = (id: string) => {
    setData(prev => ({ ...prev, pagoMovil: (prev.pagoMovil || []).filter(p => p.id !== id) }));
    setConfirmDeletePm(null);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black">Finanzas</h2>
        <p className="text-zinc-500 text-sm">Configuración financiera del restaurante</p>
      </div>

      <div className="flex gap-2 p-1.5 bg-zinc-900 border border-zinc-800 rounded-2xl">
        {[
          { id: 'delivery' as const, label: 'Tarifas Delivery', icon: Truck },
          { id: 'pagomovil' as const, label: 'Pago Móvil', icon: Banknote },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
            }`}>
            <tab.icon className="w-3 h-3" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'delivery' && (
        <div className="space-y-8">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-6">
            <div className="flex justify-between items-center">
              <label className="text-[11px] uppercase font-black tracking-widest text-zinc-500">Información Fiscal</label>
              <span className="text-[8px] text-zinc-600">Datos para facturación</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] uppercase font-black tracking-widest text-zinc-500 ml-2">RIF</label>
                <input type="text"
                  className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-bold text-xs focus:ring-2 focus:ring-primary-vibrant outline-none"
                  value={data.rif || ''}
                  onChange={e => setData({...data, rif: e.target.value})}
                  placeholder="J-12345678-9" />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] uppercase font-black tracking-widest text-zinc-500 ml-2">Teléfono del Negocio</label>
                <input type="text"
                  className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-bold text-xs focus:ring-2 focus:ring-primary-vibrant outline-none"
                  value={data.businessPhone || ''}
                  onChange={e => setData({...data, businessPhone: e.target.value})}
                  placeholder="+58 412-1234567" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] uppercase font-black tracking-widest text-zinc-500 ml-2">Dirección Fiscal</label>
              <input type="text"
                className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-bold text-xs focus:ring-2 focus:ring-primary-vibrant outline-none"
                value={data.businessAddress || ''}
                onChange={e => setData({...data, businessAddress: e.target.value})}
                placeholder="Dirección del establecimiento" />
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-6">
            <div className="flex justify-between items-center">
              <label className="text-[11px] uppercase font-black tracking-widest text-zinc-500">Impuestos y Delivery</label>
              <span className="text-[8px] text-zinc-600">Configuración global</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] uppercase font-black tracking-widest text-zinc-500 ml-2">Delivery Base ($)</label>
                <input type="number" step="0.1"
                  className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-primary-vibrant outline-none"
                  value={data.deliveryFee}
                  onChange={e => setData({...data, deliveryFee: parseFloat(e.target.value) || 0})} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-2">
                <label className="text-[11px] uppercase font-black tracking-widest text-zinc-500">Tasa de Cambio (BS/USD)</label>
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all bg-green-500/10 text-green-400 border border-green-500/20`}>
                    {isFetchingRate ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCcw className="w-3 h-3" />}
                    BCV Activo
                  </div>
                </div>
              </div>
              <input type="number" step="0.01"
                className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-primary-vibrant outline-none"
                value={data.exchangeRate}
                onChange={e => setData({...data, exchangeRate: parseFloat(e.target.value) || 1})} />
              <p className="text-[9px] text-zinc-600 ml-2">Se actualiza automáticamente del BCV cada 5 minutos.</p>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-6">
            <div className="flex justify-between items-center">
              <label className="text-[11px] uppercase font-black tracking-widest text-zinc-500">Tarifas por Distancia</label>
              <span className="text-[8px] text-zinc-600">Configuración global</span>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] uppercase font-black tracking-widest text-zinc-500 ml-2">Distancia Máxima de Delivery (km)</label>
              <input type="number" step="1"
                className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-primary-vibrant outline-none"
                value={data.distancePricing?.maxDeliveryDistance || 20}
                onChange={e => setData({...data, distancePricing: { ...data.distancePricing!, maxDeliveryDistance: parseInt(e.target.value) || 20 }})} />
            </div>
            <div className="space-y-3">
              <label className="text-[11px] uppercase font-black tracking-widest text-zinc-500 ml-2">Rangos de Tarifas</label>
              <div className="space-y-2">
                {(data.distancePricing?.ranges || []).map((range, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-zinc-950 border border-zinc-800 p-3 rounded-xl">
                    <div className="flex items-center gap-1 flex-1">
                      <span className="text-[11px] font-black text-zinc-500">Hasta</span>
                      <input type="number" step="1"
                        className="w-16 bg-transparent font-bold text-xs outline-none text-center"
                        placeholder="km"
                        value={range.maxDistance === null ? '' : range.maxDistance}
                        onChange={e => {
                          const ranges = [...(data.distancePricing?.ranges || [])];
                          ranges[idx].maxDistance = e.target.value === '' ? null : parseInt(e.target.value);
                          setData({ ...data, distancePricing: { ...data.distancePricing!, ranges } });
                        }} />
                      <span className="text-[11px] font-black text-zinc-500">km →</span>
                    </div>
                    <div className="flex items-center gap-1 bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-800">
                      <span className="text-[11px] font-black text-zinc-500">$</span>
                      <input type="number" step="0.1"
                        className="w-16 bg-transparent font-bold text-xs outline-none"
                        value={range.fee}
                        onChange={e => {
                          const ranges = [...(data.distancePricing?.ranges || [])];
                          ranges[idx].fee = parseFloat(e.target.value) || 0;
                          setData({ ...data, distancePricing: { ...data.distancePricing!, ranges } });
                        }} />
                    </div>
                    <button onClick={() => {
                      const ranges = (data.distancePricing?.ranges || []).filter((_, i) => i !== idx);
                      setData({ ...data, distancePricing: { ...data.distancePricing!, ranges } });
                    }} className="p-2 text-zinc-600 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
              <button onClick={() => {
                const ranges = [...(data.distancePricing?.ranges || [])];
                ranges.push({ maxDistance: null, fee: 0 });
                setData({ ...data, distancePricing: { ...data.distancePricing!, ranges } });
              }} className="text-[11px] font-black text-primary-vibrant uppercase flex items-center gap-1 hover:opacity-80">
                <Plus className="w-3 h-3" /> Añadir Rango
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'pagomovil' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <p className="text-zinc-500 text-sm">{(data.pagoMovil || []).length} cuenta(s) registradas</p>
            <button onClick={() => setIsAddingPm(true)}
              className="bg-primary-vibrant hover:scale-105 active:scale-95 transition-transform text-white px-5 py-2.5 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary-vibrant/20">
              <Plus className="w-4 h-4" /> Nueva Cuenta
            </button>
          </div>

          {(data.pagoMovil || []).length === 0 ? (
            <div className="text-center py-16 text-zinc-600 text-sm">No hay cuentas de pago móvil registradas</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(data.pagoMovil || []).map(entry => (
                <motion.div layoutId={entry.id} key={entry.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col justify-between group overflow-hidden">
                  <div className="space-y-6">
                    <div className="flex justify-between items-start">
                      <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center border border-zinc-700 shadow-xl">
                        <Banknote className="w-7 h-7 text-zinc-500" />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingPm(entry)} className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-500 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setConfirmDeletePm(entry.id)} className="p-2 hover:bg-red-500/10 text-red-500/50 hover:text-red-500 rounded-xl transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-2xl font-black">{entry.bank}</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800/50">
                          <div className="flex items-center gap-1.5 mb-1 opacity-50">
                            <span className="text-[8px] font-black uppercase tracking-widest">Teléfono</span>
                          </div>
                          <p className="text-xs font-black">{entry.phone}</p>
                        </div>
                        <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800/50">
                          <div className="flex items-center gap-1.5 mb-1 opacity-50">
                            <span className="text-[8px] font-black uppercase tracking-widest">RIF/Cédula</span>
                          </div>
                          <p className="text-xs font-black">{entry.rifCedula || '—'}</p>
                        </div>
                        {entry.qrImage && (
                          <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800/50 col-span-2">
                            <div className="flex items-center gap-1.5 mb-1 opacity-50">
                              <span className="text-[8px] font-black uppercase tracking-widest">Código QR</span>
                            </div>
                            <img src={entry.qrImage} alt="QR" className="w-20 h-20 rounded-xl object-cover border border-zinc-700" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      <button disabled={isSaving} onClick={handleSave}
        className="w-full bg-white text-black py-5 rounded-[20px] font-black flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-transform shadow-xl shadow-white/5 disabled:opacity-50">
        {isSaving ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
      </button>

      {/* PagoMóvil Form Modal */}
      {(isAddingPm || editingPm) && (
        <PagoMovilForm
          entry={editingPm || undefined}
          onClose={() => { setEditingPm(null); setIsAddingPm(false); }}
          onSave={(entry) => {
            if (editingPm) updatePagoMovil(entry);
            else addPagoMovil(entry);
          }}
        />
      )}

      {/* Delete confirmation */}
      {confirmDeletePm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => setConfirmDeletePm(null)} />
          <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }}
            className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-6 text-center">
            <div className="w-16 h-16 bg-primary-vibrant/10 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-primary-vibrant" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-white">Eliminar Cuenta</h3>
              <p className="text-zinc-400 text-sm">¿Estás seguro? No se podrá recuperar.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeletePm(null)}
                className="flex-1 py-3 rounded-2xl bg-zinc-800 text-zinc-300 font-bold text-sm hover:bg-zinc-700 transition-colors">Cancelar</button>
              <button onClick={() => deletePagoMovil(confirmDeletePm)}
                className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors">Eliminar</button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Floating Toasts */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id}
            className={`pointer-events-auto px-5 py-3 rounded-2xl text-sm font-bold shadow-2xl animate-slide-in ${
              toast.type === 'success'
                ? 'bg-green-500/90 text-white border border-green-500/30'
                : 'bg-red-500/90 text-white border border-red-500/30'
            }`}>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
