import { useState, ChangeEvent, useMemo, useRef, useCallback, useEffect } from 'react';
import { Save, RefreshCcw, Image as ImageIcon } from 'lucide-react';
import { RestaurantConfig, Product, Category } from '../../types';
import { useUploadImage } from '../../hooks/useUploadImage';
import { Pagination } from '../ui/Pagination';

interface SettingsPageProps {
  config: RestaurantConfig;
  menuItems: Product[];
  categories: Category[];
  onSave: (c: RestaurantConfig) => Promise<void>;
}

export function SettingsPage({ config: initialConfig, menuItems, categories, onSave }: SettingsPageProps) {
  const getFeaturedIds = (val: unknown): string[] => {
    if (Array.isArray(val)) return val as string[];
    if (typeof val === 'string' && val.length > 0) {
      return val.replace(/[{}"]/g, '').split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
  };

  const [data, setData] = useState<RestaurantConfig>(() => ({
    ...initialConfig,
    aboutUs: initialConfig.aboutUs || '',
    socialMedia: initialConfig.socialMedia || {},
    featuredProductIds: getFeaturedIds(initialConfig.featuredProductIds),
  }));
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [featuredCategory, setFeaturedCategory] = useState('Todos');
  const [featuredPage, setFeaturedPage] = useState(1);
  const [toasts, setToasts] = useState<Array<{ id: number; type: 'success' | 'error'; message: string }>>([]);
  const toastTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const ITEMS_PER_PAGE = 10;
  const uploadImage = useUploadImage();

  // Cleanup all toast timers on unmount
  useEffect(() => {
    const timers = toastTimers.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
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

  const filteredFeatured = useMemo(() => {
    return featuredCategory === 'Todos' ? menuItems : menuItems.filter(i => i.category === featuredCategory);
  }, [menuItems, featuredCategory]);

  const totalFeaturedPages = Math.max(1, Math.ceil(filteredFeatured.length / ITEMS_PER_PAGE));
  const paginatedFeatured = useMemo(() => {
    const start = (featuredPage - 1) * ITEMS_PER_PAGE;
    return filteredFeatured.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredFeatured, featuredPage]);

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

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadImage(file);
      setData({ ...data, logo: url });
    } catch (err: any) {
      showToast('error', err.message || 'Error al subir logo');
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => { setFeaturedPage(1); }, [featuredCategory]);

  const toggleFeaturedProduct = (id: string) => {
    setData(prev => {
      const ids = getFeaturedIds(prev.featuredProductIds);
      if (ids.includes(id)) {
        return { ...prev, featuredProductIds: ids.filter(i => i !== id) };
      }
      if (ids.length >= 5) return prev;
      return { ...prev, featuredProductIds: [...ids, id] };
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black">Ajustes</h2>
        <p className="text-zinc-500 text-sm">Configuración del restaurante</p>
      </div>

      <div className="space-y-8">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-4">
            <label className="text-[11px] uppercase font-black tracking-widest text-zinc-500 ml-2">Logo</label>
            <div className="flex gap-4">
              <div className="w-20 h-20 bg-white rounded-full border border-zinc-800 overflow-hidden flex-shrink-0 relative flex items-center justify-center shadow-inner">
                {data.logo ? (
                  <img src={data.logo} alt="Logo" loading="lazy" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
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

          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-4">
            <label className="text-[11px] uppercase font-black tracking-widest text-zinc-500 ml-2">Sobre Nosotros</label>
            <textarea
              className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-primary-vibrant outline-none h-24"
              placeholder="Descripción del restaurante..."
              value={data.aboutUs}
              onChange={e => setData({...data, aboutUs: e.target.value})}
            />
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-4">
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

          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-4">
            <label className="text-[11px] uppercase font-black tracking-widest text-zinc-500 ml-2">
              Platos Destacados (Máx 5)
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
              {paginatedFeatured.map(item => (
                <button
                  key={item.id}
                  onClick={() => toggleFeaturedProduct(item.id)}
                  className={`p-3 rounded-xl text-xs font-bold text-left border transition-all ${
                    getFeaturedIds(data.featuredProductIds).includes(item.id)
                      ? 'bg-primary-vibrant text-white border-primary-vibrant'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
            <Pagination currentPage={featuredPage} totalPages={totalFeaturedPages} onPageChange={setFeaturedPage} />
          </div>
        </div>

      <button
        disabled={isSaving}
        onClick={handleSave}
        className="w-full bg-white text-black py-5 rounded-[20px] font-black flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-transform shadow-xl shadow-white/5 disabled:opacity-50"
      >
        {isSaving ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
      </button>

      {/* Floating Toasts */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto px-5 py-3 rounded-2xl text-sm font-bold shadow-2xl animate-slide-in ${
              toast.type === 'success'
                ? 'bg-green-500/90 text-white border border-green-500/30'
                : 'bg-red-500/90 text-white border border-red-500/30'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
