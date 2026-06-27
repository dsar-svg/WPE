import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Edit2, Trash2, AlertTriangle, ChevronUp, ChevronDown } from 'lucide-react';
import { Category } from '../../types';

interface CategoryModalProps {
  categories: Category[];
  onClose: () => void;
  onSave: (c: Category) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function CategoryModal({ categories, onClose, onSave, onDelete }: CategoryModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [newName, setNewName] = useState('');
  const [, setIsSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

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

  const startEditing = (cat: Category) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
  };

  const commitEdit = (cat: Category) => {
    if (editingName.trim() && editingName !== cat.name) {
      handleSave({ ...cat, name: editingName });
    } else {
      setEditingId(null);
    }
  };

  const moveUp = async (index: number) => {
    if (index === 0 || categories.length < 2) return;
    const prev = categories[index - 1];
    const curr = categories[index];
    await onSave({ ...prev, order: curr.order });
    await onSave({ ...curr, order: prev.order });
  };

  const moveDown = async (index: number) => {
    if (index === categories.length - 1 || categories.length < 2) return;
    const next = categories[index + 1];
    const curr = categories[index];
    await onSave({ ...curr, order: next.order });
    await onSave({ ...next, order: curr.order });
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
            {categories.map((cat, index) => (
              <div
                key={cat.id}
                className="bg-zinc-950 border border-zinc-900 p-4 rounded-2xl flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => moveUp(index)}
                      disabled={index === 0}
                      className="p-0.5 text-zinc-600 hover:text-white hover:bg-zinc-800 rounded transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => moveDown(index)}
                      disabled={index === categories.length - 1}
                      className="p-0.5 text-zinc-600 hover:text-white hover:bg-zinc-800 rounded transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {editingId === cat.id ? (
                    <input
                      autoFocus
                      className="flex-1 bg-zinc-900 border border-zinc-800 p-2 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-vibrant outline-none"
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      onBlur={() => commitEdit(cat)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') commitEdit(cat);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                    />
                  ) : (
                    <span className="font-bold text-zinc-300 truncate">{cat.name}</span>
                  )}
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button
                    onClick={() => startEditing(cat)}
                    className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(cat.id)}
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
                <h3 className="text-xl font-black text-white">Eliminar Categoría</h3>
                <p className="text-zinc-400 text-sm">Los productos seguirán existiendo pero no se verán en el menú hasta que les cambies la categoría.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-3 rounded-2xl bg-zinc-800 text-zinc-300 font-bold text-sm hover:bg-zinc-700 transition-colors">
                  Cancelar
                </button>
                <button onClick={() => { onDelete(confirmDelete); setConfirmDelete(null); }}
                  className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors">
                  Eliminar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
