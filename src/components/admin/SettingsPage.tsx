import { useState, ChangeEvent } from 'react';
import { Save, RefreshCcw, Image as ImageIcon, Plus, Trash2, Settings, DollarSign } from 'lucide-react';
import { RestaurantConfig, Product, Category } from '../../types';
import { useUploadImage } from '../../hooks/useUploadImage';

interface SettingsPageProps {
  config: RestaurantConfig;
  menuItems: Product[];
  categories: Category[];
  onSave: (c: RestaurantConfig) => Promise<void>;
}

export function SettingsPage({ config: initialConfig, menuItems, categories, onSave }: SettingsPageProps) {
  const [data, setData] = useState<RestaurantConfig>(() => ({
    ...initialConfig,
    aboutUs: initialConfig.aboutUs || '',
    socialMedia: initialConfig.socialMedia || {},
    featuredProductIds: initialConfig.featuredProductIds || [],
    distancePricing: initialConfig.distancePricing || {
      ranges: [
        { maxDistance: 5, fee: 3.00 },
        { maxDistance: 10, fee: 5.00 },
        { maxDistance: 15, fee: 7.00 },
        { maxDistance: null, fee: 0.00 }
      ],
      maxDeliveryDistance: 20
    }
  }));
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'general' | 'finanzas'>('general');
  const [featuredCategory, setFeaturedCategory] = useState('Todos');
  const uploadImage = useUploadImage();

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(false);
      await onSave(data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadImage(file);
      setData({ ...data, logo: url });
    } catch (err: any) {
      setError(err.message || 'Error al subir logo');
    } finally {
      setIsUploading(false);
    }
  };

  const toggleFeaturedProduct = (id: string) => {
    const ids = data.featuredProductIds || [];
    if (ids.includes(id)) {
      setData({ ...data, featuredProductIds: ids.filter(i => i !== id) });
    } else {
      if (ids.length < 3) {
        setData({ ...data, featuredProductIds: [...ids, id] });
      }
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black">Ajustes</h2>
        <p className="text-zinc-500 text-sm">Configuración del restaurante</p>
      </div>

      <div className="flex gap-2 p-1.5 bg-zinc-900 border border-zinc-800 rounded-2xl">
        {[
          { id: 'general' as const, label: 'General', icon: Settings },
          { id: 'finanzas' as const, label: 'Finanzas', icon: DollarSign }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSettingsTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
              activeSettingsTab === tab.id ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <tab.icon className="w-3 h-3" />
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-red-500 text-xs font-bold">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-2xl text-green-500 text-xs font-bold">
          Cambios guardados correctamente
        </div>
      )}

      {activeSettingsTab === 'general' && (
        <div className="space-y-8">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[32px] space-y-4">
            <label className="text-[11px] uppercase font-black tracking-widest text-zinc-500 ml-2">Logo</label>
            <div className="flex gap-4">
              <div className="w-20 h-20 bg-white rounded-full border border-zinc-800 overflow-hidden flex-shrink-0 relative flex items-center justify-center shadow-inner">
                {data.logo ? (
                  <img src={data.logo} className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-zinc-300" />
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-primary-vibrant border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input type="file" id="settings-logo-upload" className="hidden" accept="image/*" onChange={handleFileUpload} />
                <button
                  onClick={() => document.getElementById('settings-logo-upload')?.click()}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all"
                >
                  Subir Logo
                </button>
                <input
                  type="text"
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-xl font-bold text-[9px] focus:ring-1 focus:ring-primary-vibrant outline-none text-zinc-500"
                  placeholder="URL logo..."
                  value={data.logo}
                  onChange={e => setData({...data, logo: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[32px] space-y-4">
            <label className="text-[11px] uppercase font-black tracking-widest text-zinc-500 ml-2">Sobre Nosotros</label>
            <textarea
              className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-primary-vibrant outline-none h-24"
              placeholder="Descripción del restaurante..."
              value={data.aboutUs}
              onChange={e => setData({...data, aboutUs: e.target.value})}
            />
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[32px] space-y-4">
            <label className="text-[11px] uppercase font-black tracking-widest text-zinc-500 ml-2">Redes Sociales (URLs)</label>
            {(['instagram', 'facebook', 'tiktok'] as const).map(platform => (
              <input
                key={platform}
                type="text"
                className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl font-bold text-xs focus:ring-2 focus:ring-primary-vibrant outline-none capitalize"
                placeholder={`${platform} URL`}
                value={data.socialMedia?.[platform] || ''}
                onChange={e => setData({...data, socialMedia: {...data.socialMedia, [platform]: e.target.value}})}
              />
            ))}
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[32px] space-y-4">
            <label className="text-[11px] uppercase font-black tracking-widest text-zinc-500 ml-2">
              Platos Destacados (Máx 3)
            </label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFeaturedCategory('Todos')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                  featuredCategory === 'Todos' ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Todos
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setFeaturedCategory(cat.name)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                    featuredCategory === cat.name ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(featuredCategory === 'Todos' ? menuItems : menuItems.filter(i => i.category === featuredCategory)).map(item => (
                <button
                  key={item.id}
                  onClick={() => toggleFeaturedProduct(item.id)}
                  className={`p-3 rounded-xl text-xs font-bold text-left border transition-all ${
                    data.featuredProductIds?.includes(item.id)
                      ? 'bg-primary-vibrant text-white border-primary-vibrant'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSettingsTab === 'finanzas' && (
        <div className="space-y-8">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[32px] space-y-6">
            <div className="flex justify-between items-center">
              <label className="text-[11px] uppercase font-black tracking-widest text-zinc-500">Impuestos y Delivery</label>
              <span className="text-[8px] text-zinc-600">Configuración global</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] uppercase font-black tracking-widest text-zinc-500 ml-2">Impuesto (%)</label>
                <input
                  type="number" step="0.1"
                  className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-primary-vibrant outline-none"
                  value={isNaN(data.taxRate * 100) ? '' : (data.taxRate * 100).toFixed(1)}
                  onChange={e => {
                    const val = parseFloat(e.target.value);
                    setData({...data, taxRate: isNaN(val) ? 0 : val / 100});
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] uppercase font-black tracking-widest text-zinc-500 ml-2">Delivery Base ($)</label>
                <input
                  type="number" step="0.1"
                  className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-primary-vibrant outline-none"
                  value={data.deliveryFee}
                  onChange={e => setData({...data, deliveryFee: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] uppercase font-black tracking-widest text-zinc-500 ml-2">Tasa de Cambio (BS/USD)</label>
              <input
                type="number" step="0.01"
                className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-primary-vibrant outline-none"
                value={data.exchangeRate}
                onChange={e => setData({...data, exchangeRate: parseFloat(e.target.value) || 1})}
              />
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[32px] space-y-6">
            <div className="flex justify-between items-center">
              <label className="text-[11px] uppercase font-black tracking-widest text-zinc-500">Tarifas por Distancia</label>
              <span className="text-[8px] text-zinc-600">Configuración global</span>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] uppercase font-black tracking-widest text-zinc-500 ml-2">
                Distancia Máxima de Delivery (km)
              </label>
              <input
                type="number" step="1"
                className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-primary-vibrant outline-none"
                value={data.distancePricing?.maxDeliveryDistance || 20}
                onChange={e => setData({
                  ...data,
                  distancePricing: {
                    ...data.distancePricing!,
                    maxDeliveryDistance: parseInt(e.target.value) || 20
                  }
                })}
              />
            </div>
            <div className="space-y-3">
              <label className="text-[11px] uppercase font-black tracking-widest text-zinc-500 ml-2">Rangos de Tarifas</label>
              <div className="space-y-2">
                {(data.distancePricing?.ranges || []).map((range, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-zinc-950 border border-zinc-800 p-3 rounded-xl">
                    <div className="flex items-center gap-1 flex-1">
                      <span className="text-[11px] font-black text-zinc-500">Hasta</span>
                      <input
                        type="number" step="1"
                        className="w-16 bg-transparent font-bold text-xs outline-none text-center"
                        placeholder="km"
                        value={range.maxDistance === null ? '' : range.maxDistance}
                        onChange={e => {
                          const ranges = [...(data.distancePricing?.ranges || [])];
                          ranges[idx].maxDistance = e.target.value === '' ? null : parseInt(e.target.value);
                          setData({ ...data, distancePricing: { ...data.distancePricing!, ranges } });
                        }}
                      />
                      <span className="text-[11px] font-black text-zinc-500">km →</span>
                    </div>
                    <div className="flex items-center gap-1 bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-800">
                      <span className="text-[11px] font-black text-zinc-500">$</span>
                      <input
                        type="number" step="0.1"
                        className="w-16 bg-transparent font-bold text-xs outline-none"
                        value={range.fee}
                        onChange={e => {
                          const ranges = [...(data.distancePricing?.ranges || [])];
                          ranges[idx].fee = parseFloat(e.target.value) || 0;
                          setData({ ...data, distancePricing: { ...data.distancePricing!, ranges } });
                        }}
                      />
                    </div>
                    <button
                      onClick={() => {
                        const ranges = (data.distancePricing?.ranges || []).filter((_, i) => i !== idx);
                        setData({ ...data, distancePricing: { ...data.distancePricing!, ranges } });
                      }}
                      className="p-2 text-zinc-600 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  const ranges = [...(data.distancePricing?.ranges || [])];
                  ranges.push({ maxDistance: null, fee: 0 });
                  setData({ ...data, distancePricing: { ...data.distancePricing!, ranges } });
                }}
                className="text-[11px] font-black text-primary-vibrant uppercase flex items-center gap-1 hover:opacity-80"
              >
                <Plus className="w-3 h-3" /> Añadir Rango
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        disabled={isSaving}
        onClick={handleSave}
        className="w-full bg-white text-black py-5 rounded-[20px] font-black flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-transform shadow-xl shadow-white/5 disabled:opacity-50"
      >
        {isSaving ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
      </button>
    </div>
  );
}
