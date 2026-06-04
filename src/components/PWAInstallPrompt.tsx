import { motion, AnimatePresence } from 'motion/react';
import { Download, X, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useState, useEffect } from 'react';

export function PWAInstallPrompt() {
  const { isInstallable, isStandalone, isIOS, installApp } = usePWAInstall();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('pwa-prompt-dismissed');
    
    // Check if it's likely a mobile device.
    const isMobile = /android|iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());

    if (!isStandalone && !dismissed && isMobile) {
      // Force show if mobile and not already installed, regardless of isInstallable (which can be finicky)
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [isInstallable, isStandalone, isIOS]);

  const handleDismiss = () => {
    setShow(false);
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  const handleInstall = () => {
    installApp();
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-6 right-6 z-[200] md:left-auto md:right-12 md:max-w-sm"
        >
          <div className="bg-zinc-900 border border-zinc-800 rounded-[32px] p-6 shadow-2xl flex items-center gap-4 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-2 h-full bg-primary-vibrant" />
            
            <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-6 h-6 text-primary-vibrant" />
            </div>
            
            <div className="flex-1">
              <h4 className="text-white font-black text-sm uppercase tracking-tight">Instala nuestra App</h4>
              <p className="text-zinc-500 text-[10px] font-medium leading-tight mt-1">
                {isIOS 
                  ? 'Pulsa el icono de "Compartir" y luego "Añadir a pantalla de inicio".'
                  : 'Accede más rápido y pide sin esperas desde tu pantalla de inicio.'}
              </p>
            </div>
            
            <div className="flex flex-col gap-2">
              {!isIOS && (
                <button
                  onClick={isInstallable ? handleInstall : () => alert('Para instalar, toca el menú de tu navegador (los tres puntos arriba a la derecha) y selecciona "Añadir a pantalla de inicio".')}
                  className="bg-primary-vibrant hover:scale-105 active:scale-95 transition-transform text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
                >
                  <Download className="w-3 h-3" />
                  Instalar
                </button>
              )}
              <button
                onClick={handleDismiss}
                className="text-zinc-600 hover:text-white transition-colors text-center text-[8px] font-bold uppercase tracking-widest"
              >
                Después
              </button>
            </div>
            
            <button 
              onClick={handleDismiss}
              className="absolute top-3 right-3 text-zinc-700 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
