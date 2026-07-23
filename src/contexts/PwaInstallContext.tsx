import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

type InstallOutcome = 'accepted' | 'dismissed' | 'unavailable';

interface PwaInstallContextValue {
  canInstall: boolean;
  isInstalled: boolean;
  isMobile: boolean;
  install: () => Promise<InstallOutcome>;
}

const PwaInstallContext = createContext<PwaInstallContextValue | undefined>(undefined);

function detectInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

function detectMobile() {
  return window.matchMedia('(max-width: 767px)').matches || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(() => detectInstalled());
  const [isMobile, setIsMobile] = useState(() => detectMobile());

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setIsInstalled(true);
      setInstallEvent(null);
    };
    const onResize = () => setIsMobile(detectMobile());

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const install = useCallback(async (): Promise<InstallOutcome> => {
    if (!installEvent) return 'unavailable';
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === 'accepted') {
      setInstallEvent(null);
    }
    return choice.outcome;
  }, [installEvent]);

  const value = useMemo(() => ({
    canInstall: Boolean(installEvent) && !isInstalled,
    isInstalled,
    isMobile,
    install,
  }), [installEvent, isInstalled, isMobile, install]);

  return <PwaInstallContext.Provider value={value}>{children}</PwaInstallContext.Provider>;
}

export function usePwaInstall() {
  const context = useContext(PwaInstallContext);
  if (!context) throw new Error('usePwaInstall must be used within PwaInstallProvider');
  return context;
}
