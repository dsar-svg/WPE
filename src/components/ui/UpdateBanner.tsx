import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, RotateCcw } from 'lucide-react';

export function UpdateBanner() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const regRef = useRef<ServiceWorkerRegistration | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let reg: ServiceWorkerRegistration | null = null;

    const check = async () => {
      if (!reg) return;
      await reg.update();
      if (reg.waiting) {
        setWaitingWorker(reg.waiting);
      } else if (reg.installing) {
        reg.installing.addEventListener('statechange', function handler() {
          if (reg?.installing?.state === 'installed' && navigator.serviceWorker.controller) {
            setWaitingWorker(reg.installing);
          }
        });
      }
    };

    const register = async () => {
      try {
        reg = await navigator.serviceWorker.register('/sw.js');
        regRef.current = reg;

        if (reg.waiting) {
          setWaitingWorker(reg.waiting);
        }

        reg.addEventListener('updatefound', () => {
          const w = reg?.installing;
          if (!w) return;
          w.addEventListener('statechange', () => {
            if (w.state === 'installed' && navigator.serviceWorker.controller) {
              setWaitingWorker(w);
            }
          });
        });

        intervalRef.current = setInterval(check, 15000);
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') check();
        });
      } catch { /* SW registration failed */ }
    };

    register();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleUpdate = () => {
    if (!waitingWorker) return;
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  };

  return (
    <AnimatePresence>
      {waitingWorker && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-4 right-4 z-[999] mx-auto max-w-md"
        >
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-2xl shadow-black/50 flex items-center gap-4">
            <div className="w-10 h-10 bg-primary-vibrant/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <RefreshCw className="w-5 h-5 text-primary-vibrant" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white">Nueva versión disponible</p>
              <p className="text-[11px] text-zinc-500">Actualiza para ver los cambios</p>
            </div>
            <button
              onClick={handleUpdate}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-primary-vibrant text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-primary-vibrant/90 transition-all flex-shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Actualizar
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}