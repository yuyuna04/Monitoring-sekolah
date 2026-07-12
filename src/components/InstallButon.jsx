import React, { useState, useEffect } from 'react';
import { FiDownload, FiX } from 'react-icons/fi';

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showButton, setShowButton] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const alreadyInstalled = window.matchMedia('(display-mode: standalone)').matches;
    if (alreadyInstalled) return;

    const wasDismissed = localStorage.getItem('installPromptDismissed');
    if (wasDismissed) setDismissed(true);

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setShowButton(false);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowButton(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowButton(false);
    setDismissed(true);
    localStorage.setItem('installPromptDismissed', 'true');
  };

  if (!showButton || dismissed) return null;

  return (
    <div className="bg-white border border-red-100 rounded-2xl p-4 shadow-sm flex items-center gap-3 mb-4">
      <div style={{ background: '#FFF0F0', color: '#CC0000', width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <FiDownload size={20} />
      </div>
      <div className="flex-1">
        <p className="font-bold text-gray-800 text-sm">Install Aplikasi SIAP</p>
        <p className="text-xs text-gray-400">Akses lebih cepat langsung dari layar utama HP</p>
      </div>
      <button
        type="button"
        onClick={handleInstallClick}
        className="bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-full flex-shrink-0"
      >
        Install
      </button>
      <button type="button" onClick={handleDismiss} className="text-gray-300 flex-shrink-0">
        <FiX size={18} />
      </button>
    </div>
  );
}