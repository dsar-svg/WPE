import { useState, useEffect, useRef } from 'react';

export function usePWAInstall() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const deferredPromptRef = useRef<any>(null);

  useEffect(() => {
    // Check if on iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Check if already standalone
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(standalone);

    const handler = (e: any) => {
      e.preventDefault();
      // Store the full event but handle it carefully
      deferredPromptRef.current = e;
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const installApp = async () => {
    const promptEvent = deferredPromptRef.current;
    if (!promptEvent) return;
    
    try {
      promptEvent.prompt();
      const result = await promptEvent.userChoice;
      
      if (result && result.outcome === 'accepted') {
        setIsInstallable(false);
      }
    } catch (err) {
      console.error('PWA Install failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      deferredPromptRef.current = null;
    }
  };

  return { isInstallable, isStandalone, isIOS, installApp };
}
