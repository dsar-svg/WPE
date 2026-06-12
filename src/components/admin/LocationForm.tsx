import { useState, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, RefreshCcw, Info, Clock, AlertCircle, Image as ImageIcon, MessageCircle, MapPin } from 'lucide-react';
import { Location } from '../../types';
import { useUploadImage } from '../../hooks/useUploadImage';

interface LocationFormProps {
  location?: Location;
  isSuperAdmin: boolean;
  onClose: () => void;
  onSave: (l: Location) => void;
}

const dayOptions = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const parseSchedule = (schedule: string) => {
  const parts = schedule.split(' a ');
  return { dayFrom: parts[0] || 'Lunes', dayTo: parts[1] || 'Domingo' };
};

const to12h = (time24: string) => {
  if (!time24) return { hour: '12', minute: '00', ampm: 'AM' };
  const [h, m] = time24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return { hour: String(h12), minute: String(m).padStart(2, '0'), ampm };
};

const to24h = (hour: string, minute: string, ampm: string) => {
  let h = parseInt(hour);
  if (ampm === 'AM' && h === 12) h = 0;
  else if (ampm === 'PM' && h !== 12) h += 12;
  return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

export function LocationForm({ location, isSuperAdmin, onClose, onSave }: LocationFormProps) {
  const [data, setData] = useState<Location>({
    id: location?.id || `loc-${Date.now()}`,
    name: location?.name || '',
    whatsapp: location?.whatsapp || '',
    address: location?.address || '',
    image: location?.image || '',
    openTime: location?.openTime || '12:00',
    closeTime: location?.closeTime || '22:00',
    schedule: location?.schedule || 'Lunes a Domingo',
    isOpen: location?.isOpen ?? true,
    latitude: location?.latitude || undefined,
    longitude: location?.longitude || undefined,
    adminEmail: location?.adminEmail || '',
    adminPassword: location?.adminPassword || '',
    discontinuedProductIds: location?.discontinuedProductIds || []
  });
  const [activeFormTab, setActiveFormTab] = useState<'info' | 'horario'>('info');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const uploadImage = useUploadImage();

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadImage(file);
      setData({ ...data, image: url });
    } catch (err: any) {
      setError(err.message || 'Error al subir imagen');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      await onSave(data);
      onClose();
    } catch (err: any) {
      console.error("Save error:", err);
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
      />
      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        className="relative w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-2xl p-0 overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="bg-zinc-800/50 p-8 pb-4 border-b border-zinc-800">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black tracking-tight">
              {location ? 'Editar Sede' : 'Nueva Sede'}
            </h2>
            <button onClick={onClose} className="p-2 bg-zinc-800 rounded-full text-zinc-500 hover:text-white transition-colors">
              <X />
            </button>
          </div>
          <div className="flex gap-2 p-1.5 bg-zinc-950 rounded-2xl border border-zinc-800">
            {[
              { id: 'info', label: 'Info', icon: Info },
              { id: 'horario', label: 'Horario', icon: Clock }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFormTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                  activeFormTab === tab.id ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <tab.icon className="w-3 h-3" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-500 text-xs font-bold">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {activeFormTab === 'info' && (
              <motion.div
                key="info-tab"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 space-y-4">
                  <label className="text-[11px] uppercase font-black tracking-widest text-zinc-500 ml-2">
                    Foto de la Sede
                  </label>
                  <div className="flex gap-4">
                    <div className="w-24 h-24 bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden flex-shrink-0 relative">
                      {data.image ? (
                        <img src={data.image} alt={data.name} loading="lazy" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-700">
                          <ImageIcon className="w-8 h-8" />
                        </div>
                      )}
                      {isUploading && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-primary-vibrant border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <input
                        type="file"
                        id="loc-image-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileUpload}
                      />
                      <button
                        onClick={() => document.getElementById('loc-image-upload')?.click()}
                        className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all"
                      >
                        Subir desde el dispositivo
                      </button>
                      <input
                        type="text"
                        className="w-full bg-zinc-900 border border-zinc-700 p-2.5 rounded-xl font-bold text-[9px] focus:ring-1 focus:ring-primary-vibrant outline-none text-zinc-400"
                        placeholder="O URL directa..."
                        value={data.image}
                        onChange={e => setData({...data, image: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="location-name" className="text-[11px] uppercase font-black tracking-widest text-zinc-500 ml-2">Nombre</label>
                    <input
                      id="location-name"
                      type="text"
                      className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-primary-vibrant outline-none"
                      placeholder="Ej: Valencia Norte"
                      value={data.name}
                      onChange={e => setData({...data, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="location-address" className="text-[11px] uppercase font-black tracking-widest text-zinc-500 ml-2">Dirección</label>
                    <textarea
                      id="location-address"
                      className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-primary-vibrant outline-none h-24 resize-none"
                      placeholder="Dirección completa de la sede..."
                      value={data.address}
                      onChange={e => setData({...data, address: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="location-whatsapp" className="text-[11px] uppercase font-black tracking-widest text-zinc-500 ml-2">
                    WhatsApp de Pedidos
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-zinc-500 font-bold">
                      <MessageCircle className="w-4 h-4" />
                      <span>+</span>
                    </div>
                    <input
                      id="location-whatsapp"
                      type="text"
                      className="w-full bg-zinc-950 border border-zinc-800 p-4 pl-12 rounded-2xl font-bold focus:ring-2 focus:ring-primary-vibrant outline-none"
                      placeholder="584241234567"
                      value={data.whatsapp}
                      onChange={e => setData({...data, whatsapp: e.target.value})}
                    />
                  </div>
                  <p className="text-[9px] text-zinc-600 ml-2 italic">
                    * Incluye código de país (ej: 58 para Venezuela)
                  </p>
                </div>

                <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 space-y-4">
                  <div className="flex justify-between items-center px-2">
                    <label className="text-[11px] uppercase font-black tracking-widest text-zinc-500">
                      Coordenadas de la Sede
                    </label>
                    <span className="text-[8px] text-zinc-600">Para cálculo de distancias</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="location-latitude" className="text-[11px] uppercase font-black tracking-widest text-zinc-500 ml-2">Latitud</label>
                      <input
                        id="location-latitude"
                        type="number"
                        step="0.000001"
                        className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-primary-vibrant outline-none"
                        placeholder="10.162000"
                        value={data.latitude || ''}
                        onChange={e => setData({...data, latitude: parseFloat(e.target.value) || undefined})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="location-longitude" className="text-[11px] uppercase font-black tracking-widest text-zinc-500 ml-2">Longitud</label>
                      <input
                        id="location-longitude"
                        type="number"
                        step="0.000001"
                        className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-primary-vibrant outline-none"
                        placeholder="-68.007000"
                        value={data.longitude || ''}
                        onChange={e => setData({...data, longitude: parseFloat(e.target.value) || undefined})}
                      />
                    </div>
                  </div>
                  <p className="text-[8px] text-zinc-600 ml-2">
                    Ejemplo: Valencia centro ~ 10.162, -68.007
                  </p>
                </div>

                {isSuperAdmin && (
                  <>
                    <div className="space-y-2">
                      <label htmlFor="location-admin-email" className="text-[11px] uppercase font-black tracking-widest text-zinc-500 ml-2">
                        Email del Administrador de Sede
                      </label>
                      <input
                        id="location-admin-email"
                        type="email"
                        className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-primary-vibrant outline-none"
                        placeholder="ejemplo@admin.com"
                        value={data.adminEmail || ''}
                        onChange={e => setData({...data, adminEmail: e.target.value})}
                      />
                      <p className="text-[9px] text-zinc-600 ml-2">
                        Este usuario podrá gestionar exclusivamente esta sede.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="location-admin-password" className="text-[11px] uppercase font-black tracking-widest text-zinc-500 ml-2">
                        Contraseña de Acceso
                      </label>
                      <input
                        id="location-admin-password"
                        type="text"
                        className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-primary-vibrant outline-none"
                        placeholder="Contraseña"
                        value={data.adminPassword || ''}
                        onChange={e => setData({...data, adminPassword: e.target.value})}
                      />
                      <p className="text-[9px] text-zinc-600 ml-2">
                        Se recomienda usar una contraseña segura.
                      </p>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {activeFormTab === 'horario' && (
              <motion.div
                key="horario-tab"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-[11px] uppercase font-black tracking-widest text-zinc-500 ml-2">
                    Días de Atención
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="location-schedule-from" className="text-[9px] uppercase font-black tracking-widest text-zinc-600 ml-2">Desde</label>
                      <select
                        id="location-schedule-from"
                        className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-primary-vibrant outline-none"
                        value={parseSchedule(data.schedule).dayFrom}
                        onChange={e => {
                          const dayTo = parseSchedule(data.schedule).dayTo;
                          setData({...data, schedule: `${e.target.value} a ${dayTo}`});
                        }}
                      >
                        {dayOptions.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="location-schedule-to" className="text-[9px] uppercase font-black tracking-widest text-zinc-600 ml-2">Hasta</label>
                      <select
                        id="location-schedule-to"
                        className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-primary-vibrant outline-none"
                        value={parseSchedule(data.schedule).dayTo}
                        onChange={e => {
                          const dayFrom = parseSchedule(data.schedule).dayFrom;
                          setData({...data, schedule: `${dayFrom} a ${e.target.value}`});
                        }}
                      >
                        {dayOptions.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="location-open-ampm" className="text-[11px] uppercase font-black tracking-widest text-zinc-500 ml-2">Apertura</label>
                    <div className="flex gap-2">
                      <select
                        id="location-open-ampm"
                        className="w-24 bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-primary-vibrant outline-none"
                        value={to12h(data.openTime).ampm}
                        onChange={e => {
                          const { hour, minute } = to12h(data.openTime);
                          setData({...data, openTime: to24h(hour, minute, e.target.value)});
                        }}
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                      <input
                        type="time"
                        className="flex-1 bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-primary-vibrant outline-none transition-all"
                        value={data.openTime}
                        onChange={e => setData({...data, openTime: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="location-close-ampm" className="text-[11px] uppercase font-black tracking-widest text-zinc-500 ml-2">Cierre</label>
                    <div className="flex gap-2">
                      <select
                        id="location-close-ampm"
                        className="w-24 bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-primary-vibrant outline-none"
                        value={to12h(data.closeTime).ampm}
                        onChange={e => {
                          const { hour, minute } = to12h(data.closeTime);
                          setData({...data, closeTime: to24h(hour, minute, e.target.value)});
                        }}
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                      <input
                        type="time"
                        className="flex-1 bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-primary-vibrant outline-none transition-all"
                        value={data.closeTime}
                        onChange={e => setData({...data, closeTime: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-zinc-800/20 rounded-2xl border border-zinc-800 flex items-start gap-4">
                  <Clock className="w-5 h-5 text-primary-vibrant mt-1" />
                  <p className="text-[11px] leading-relaxed text-zinc-500">
                    Este horario se usará para el <strong className="text-zinc-300">bloqueo automático</strong> de pedidos.
                    Asegúrate de que las horas sean exactas.
                  </p>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        <div className="p-8 pt-0 mt-auto">
          <button
            disabled={isSaving}
            onClick={handleSave}
            className="w-full bg-white text-black py-5 rounded-[20px] font-black flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-transform shadow-xl shadow-white/5 disabled:opacity-50"
          >
            {isSaving ? <RefreshCcw className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
