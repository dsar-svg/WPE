import { useState } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { PagoMovilData } from '../../types';
import { useUploadImage } from '../../hooks/useUploadImage';

interface PagoMovilFormProps {
  entry?: PagoMovilData;
  onClose: () => void;
  onSave: (entry: PagoMovilData) => void;
}

export function PagoMovilForm({ entry, onClose, onSave }: PagoMovilFormProps) {
  const uploadImage = useUploadImage();
  const [form, setForm] = useState({
    bank: entry?.bank || '',
    phone: entry?.phone || '',
    rifCedula: entry?.rifCedula || '',
    qrImage: entry?.qrImage || '',
  });
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadImage(file);
      setForm(f => ({ ...f, qrImage: url }));
    } catch { /* image upload failed */ }
    setIsUploading(false);
  };

  const handleSave = () => {
    if (!form.bank || !form.phone) return;
    onSave({
      id: entry?.id || crypto.randomUUID(),
      ...form,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
        className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-6"
      >
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black">{entry ? 'Editar Cuenta' : 'Nueva Cuenta'}</h2>
          <button onClick={onClose} className="p-2 bg-zinc-800 rounded-full text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Banco</label>
            <input value={form.bank} onChange={e => setForm(f => ({ ...f, bank: e.target.value }))}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary-vibrant"
              placeholder="Banesco / Mercantil / etc" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Teléfono</label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary-vibrant"
              placeholder="0412-1234567" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">RIF / Cédula</label>
            <input value={form.rifCedula} onChange={e => setForm(f => ({ ...f, rifCedula: e.target.value }))}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary-vibrant"
              placeholder="J-12345678-9" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Código QR</label>
            <div className="flex gap-3 items-center">
              {form.qrImage ? (
                <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-zinc-800">
                  <img src={form.qrImage} alt="QR" className="w-full h-full object-cover" />
                  <button onClick={() => setForm(f => ({ ...f, qrImage: '' }))}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500/80 rounded-full flex items-center justify-center text-white text-[10px]">×</button>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-xl border border-dashed border-zinc-700 flex items-center justify-center text-zinc-600 text-[10px] font-bold">QR</div>
              )}
              <div className="flex-1 space-y-2">
                <input type="file" id="qr-upload" className="hidden" accept="image/*" onChange={handleImageUpload} />
                <button onClick={() => document.getElementById('qr-upload')?.click()} disabled={isUploading}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all disabled:opacity-50">
                  {isUploading ? 'Subiendo...' : 'Subir QR'}
                </button>
                <input value={form.qrImage} onChange={e => setForm(f => ({ ...f, qrImage: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded-xl font-bold text-[9px] outline-none text-zinc-500"
                  placeholder="URL QR..." />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-zinc-800 text-zinc-400 font-bold text-sm hover:bg-zinc-700 transition-all">Cancelar</button>
          <button onClick={handleSave} disabled={!form.bank || !form.phone}
            className="flex-1 py-3 rounded-xl bg-primary-vibrant text-white font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">Guardar</button>
        </div>
      </motion.div>
    </div>
  );
}
