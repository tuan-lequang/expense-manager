import { useEffect, useState } from 'react';

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type OfflineState = 'preparing' | 'ready' | 'unavailable' | 'error';

export function useInstall() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(
    () =>
      matchMedia('(display-mode: standalone)').matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone),
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    const media = matchMedia('(display-mode: standalone)');
    const offered = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
      setMessage('');
    };
    const completed = () => {
      setInstalled(true);
      setPrompt(null);
      setMessage('');
    };
    const changed = () =>
      setInstalled(
        media.matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone),
      );
    window.addEventListener('beforeinstallprompt', offered);
    window.addEventListener('appinstalled', completed);
    media.addEventListener('change', changed);
    return () => {
      window.removeEventListener('beforeinstallprompt', offered);
      window.removeEventListener('appinstalled', completed);
      media.removeEventListener('change', changed);
    };
  }, []);
  async function install() {
    if (!prompt || busy) return;
    setBusy(true);
    setMessage('');
    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      setMessage(
        outcome === 'accepted'
          ? 'Đã gửi yêu cầu cài đặt. Bạn có thể mở Mơ từ biểu tượng ứng dụng sau khi trình duyệt hoàn tất.'
          : 'Bạn có thể cài sau từ menu của trình duyệt.',
      );
    } catch {
      setMessage('Chưa mở được cửa sổ cài đặt. Hãy thử từ menu của trình duyệt.');
    } finally {
      setPrompt(null);
      setBusy(false);
    }
  }
  return { canInstall: prompt !== null, installed, busy, message, install };
}
export type InstallState = ReturnType<typeof useInstall>;
