import { useEffect, useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    if (standalone || sessionStorage.getItem('sahai-pwa-dismissed') === '1') return;

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => {
      setVisible(false);
      setInstallEvent(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setVisible(false);
    setInstallEvent(null);
  };

  const dismiss = () => {
    sessionStorage.setItem('sahai-pwa-dismissed', '1');
    setVisible(false);
  };

  if (!visible || !installEvent) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-lg rounded-2xl border border-primary-200 bg-white p-4 shadow-2xl dark:border-primary-900 dark:bg-zinc-900 sm:bottom-5">
      <button onClick={dismiss} aria-label="Dismiss install prompt" className="absolute right-3 top-3 rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800">
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3 pr-7">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
          <Smartphone className="h-5 w-5" />
        </div>
        <div>
          <p className="font-bold">Install SahAI</p>
          <p className="mt-1 text-xs leading-5 text-gray-500">Add SahAI to your home screen for a full-screen app experience and faster return visits.</p>
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={dismiss}>Not now</Button>
        <Button size="sm" onClick={install}><Download className="h-4 w-4" /> Install App</Button>
      </div>
    </div>
  );
}
