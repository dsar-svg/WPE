import { useState } from 'react';
import { motion } from 'motion/react';
import { X, Plus, Edit2, Trash2 } from 'lucide-react';
import { Category } from '../../types';

interface CategoryModalProps {
  categories: Category[];
  onClose: () => void;
  onSave: (c: Category) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function CategoryModal({ categories, onClose, onSave, onDelete }: CategoryModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (cat: Category) => {
    try {
      setIsSaving(true);
      await onSave(cat);
      setEditingId(null);
      setNewName('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    const id = `cat-${Date.now()}`;
    handleSave({ id, name: newName, order: categories.length });
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
        className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-8"
      >
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black tracking-tight">Gestionar Categorías</h2>
          <button onClick={onClose} className="p-2 bg-zinc-800 rounded-full text-zinc-500 hover:text-white transition-colors">
            <X />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              className="flex-1 bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-primary-vibrant outline-none"
              placeholder="Nueva categoría..."
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <button
              onClick={handleAdd}
              className="bg-primary-vibrant p-4 rounded-2xl text-white hover:scale-105 active:scale-95 transition-all shadow-lg"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-2 max-h-[40vh] overflow-y-auto no-scrollbar pr-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-zinc-950 border border-zinc-900 p-4 rounded-2xl flex items-center justify-between group"
              >
                {editingId === cat.id ? (
                  <input
                    autoFocus
                    className="flex-1 bg-zinc-900 border border-zinc-800 p-2 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-vibrant outline-none"
                    value={cat.name}
                    onChange={e => onSave({ ...cat, name: e.target.value })}
                    onBlur={() => setEditingId(null)}
                    onKeyDown={e => e.key === 'Enter' && setEditingId(null)}
                  />
                ) : (
                  <span className="font-bold text-zinc-300">{cat.name}</span>
                )}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditingId(cat.id)}
                    className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('¿Estás seguro de eliminar esta categoría? Los productos seguirán existiendo pero no se verán en el menú hasta que les cambies la categoría.')) {
                        onDelete(cat.id);
                      }
                    }}
                    className="p-2 text-zinc-500 hover:text-primary-vibrant hover:bg-primary-vibrant/10 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
