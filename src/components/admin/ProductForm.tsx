import { useState, ChangeEvent } from 'react';
import { motion } from 'motion/react';
import { X, Save, RefreshCcw, Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import { Product, Category, ProductChoice } from '../../types';
import { useUploadImage } from '../../hooks/useUploadImage';
import { validateImageSize } from '../../lib/uploadImage';

interface ProductFormProps {
  product?: Product;
  categories: Category[];
  onClose: () => void;
  onSave: (p: Product) => Promise<void>;
}

export function ProductForm({ product, categories, onClose, onSave }: ProductFormProps) {
  const [data, setData] = useState<Product>(product || {
    id: `prod-${Date.now()}`,
    name: '',
    description: '',
    category: categories[0]?.name || '',
    price: 0,
    image: '',
    inStock: true,
    order: 0,
    choices: [],
    maxSelections: 0,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const uploadImage = useUploadImage();

  const choices = data.choices || [];
  const maxSelections = data.maxSelections ?? 0;

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageSize(file);
    if (!validation.valid) {
      setError(validation.error || 'Imagen demasiado grande');
      e.target.value = '';
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      const url = await uploadImage(file);
      setData({ ...data, image: url });
    } catch (err: any) {
      setError(err.message || 'Error al subir imagen');
    } finally {
      setIsUploading(false);
    }
  };

  const addChoice = () => {
    const newChoice: ProductChoice = { name: '', priceAdjust: 0 };
    setData({ ...data, choices: [...choices, newChoice] });
  };

  const updateChoice = (index: number, patch: Partial<ProductChoice>) => {
    const updated = choices.map((c, i) => (i === index ? { ...c, ...patch } : c));
    setData({ ...data, choices: updated });
  };

  const removeChoice = (index: number) => {
    setData({ ...data, choices: choices.filter((_, i) => i !== index) });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      await onSave(data);
      onClose();
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
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
        className="absolute inset-0 bg-black/90"
      />
      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-h-[90vh] overflow-y-auto space-y-8 custom-scrollbar"
      >
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black tracking-tight">
            {product ? 'Editar Plato' : 'Nuevo Plato'}
          </h2>
          <button onClick={onClose} className="p-2 bg-zinc-800 rounded-full text-zinc-500">
            <X />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-zinc-950 p-4 rounded-3xl border border-zinc-800 flex flex-col items-center gap-4">
              <div className="w-full aspect-square bg-zinc-900 rounded-2xl overflow-hidden relative">
                {data.image ? (
                  <img src={data.image} alt={data.name} loading="lazy" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-800">
                    <ImageIcon className="w-12 h-12" />
                  </div>
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-primary-vibrant border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <div className="w-full space-y-2">
                <input
                  type="file"
                  id="prod-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileUpload}
                />
                <button
                  onClick={() => document.getElementById('prod-upload')?.click()}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCcw className="w-3 h-3" />
                  Subir desde el dispositivo
                </button>
                <p className="text-[9px] text-zinc-600 text-center">Máximo 5MB • Se comprime automáticamente</p>
                <input
                  className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded-xl font-mono text-[9px] text-zinc-500 focus:ring-1 focus:ring-primary-vibrant outline-none"
                  placeholder="O URL directa..."
                  value={data.image}
                  onChange={e => setData({...data, image: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="product-category" className="text-[11px] uppercase font-black tracking-widest text-zinc-500 ml-2">Categoría</label>
              <select
                id="product-category"
                className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-primary-vibrant outline-none"
                value={data.category}
                onChange={e => setData({...data, category: e.target.value})}
              >
                {categories.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="product-name" className="text-[11px] uppercase font-black tracking-widest text-zinc-500 ml-2">Nombre del Producto</label>
              <input
                id="product-name"
                className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-primary-vibrant outline-none"
                value={data.name}
                onChange={e => setData({...data, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="product-price" className="text-[11px] uppercase font-black tracking-widest text-zinc-500 ml-2">Precio ($)</label>
              <input
                id="product-price"
                type="number"
                step="0.01"
                className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-primary-vibrant outline-none"
                value={isNaN(data.price) ? "" : data.price}
                onChange={e => {
                  const val = parseFloat(e.target.value);
                  setData({...data, price: isNaN(val) ? 0 : val});
                }}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="product-description" className="text-[11px] uppercase font-black tracking-widest text-zinc-500 ml-2">Descripción</label>
              <textarea
                id="product-description"
                className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-primary-vibrant outline-none h-32 resize-none"
                value={data.description}
                onChange={e => setData({...data, description: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* ── Choices Section ─────────────────────────────────── */}
        <div className="space-y-4 border-t-2 border-zinc-800 pt-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black tracking-tight">Opciones del Producto</h3>
              <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold mt-1">
                Ej: Chopsuey, Papas Fritas, Queso Extra
              </p>
            </div>
            <button
              type="button"
              onClick={addChoice}
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              <Plus className="w-3 h-3" />
              Agregar opción
            </button>
          </div>

          {/* Max selections */}
          <div className="flex items-center gap-4">
            <label className="text-[11px] uppercase font-black tracking-widest text-zinc-500">
              Máx selecciones:
            </label>
            <input
              type="number"
              min="0"
              max="10"
              className="w-20 bg-zinc-950 border border-zinc-800 px-3 py-2 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-vibrant outline-none text-center"
              value={maxSelections}
              onChange={e => {
                const val = parseInt(e.target.value);
                setData({...data, maxSelections: isNaN(val) ? 0 : val});
              }}
            />
            <span className="text-[10px] text-zinc-600">
              {maxSelections === 0 ? '(sin límite — checkboxes)' : `(selecciona hasta ${maxSelections})`}
            </span>
          </div>

          {choices.length === 0 && (
            <div className="bg-zinc-950 border border-dashed border-zinc-700 rounded-2xl p-8 text-center">
              <p className="text-zinc-600 text-xs font-bold">Este producto no tiene opciones.</p>
              <p className="text-zinc-700 text-[10px] mt-1">Haz clic en "Agregar opción" para añadir opciones extras.</p>
            </div>
          )}

          {choices.map((choice, ci) => (
            <div key={ci} className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
              <input
                className="flex-1 bg-zinc-900 border border-zinc-800 px-4 py-2.5 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-vibrant outline-none"
                placeholder="Nombre de la opción (ej: Chopsuey)"
                value={choice.name}
                onChange={e => updateChoice(ci, { name: e.target.value })}
              />
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-zinc-600 font-bold">+$</span>
                <input
                  type="number"
                  step="0.01"
                  className="w-24 bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-xl text-sm font-bold focus:ring-1 focus:ring-primary-vibrant outline-none text-right"
                  placeholder="0"
                  value={choice.priceAdjust ?? ''}
                  onChange={e => {
                    const val = parseFloat(e.target.value);
                    updateChoice(ci, { priceAdjust: isNaN(val) ? 0 : val });
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => removeChoice(ci)}
                className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {error && <p className="text-red-500 text-xs mb-4 font-bold">{error}</p>}

        <button
          disabled={isSaving}
          onClick={handleSave}
          className="w-full bg-white text-black py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-50"
        >
          {isSaving ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {isSaving ? 'Guardando...' : 'Guardar Plato'}
        </button>
      </motion.div>
    </div>
  );
}
