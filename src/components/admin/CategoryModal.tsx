import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Edit2, Trash2, AlertTriangle, GripVertical } from 'lucide-react';
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
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDrop = async (index: number) => {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reordered = [...categories];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(index, 0, moved);

    for (let i = 0; i < reordered.length; i++) {
      await onSave({ ...reordered[i], order: i });
    }

    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
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
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={() => handleDrop(index)}
                onDragEnd={handleDragEnd}
                className={`bg-zinc-950 border p-4 rounded-2xl flex items-center justify-between group transition-all ${
                  dragOverIndex === index ? 'border-primary-vibrant scale-[1.02]' : 'border-zinc-900'
                } ${dragIndex === index ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 transition-colors flex-shrink-0">
                    <GripVertical className="w-4 h-4" />
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
