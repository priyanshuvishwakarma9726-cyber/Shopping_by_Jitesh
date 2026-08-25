'use client';

import React, { useEffect, useState } from 'react';
import { Download, X, Share } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstaller: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // 1. Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => console.warn('[SW Registration Warning]', err));
    }

    requestAnimationFrame(() => {
      if (!isMounted) return;

      // 2. Already Installed Standalone Check
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;

      if (isStandalone) {
        return; // Installed -> Hide completely
      }

      // 3. Session Dismissal Check (per-session only, allowed again on future visits)
      const isSessionDismissed = sessionStorage.getItem('sbj_pwa_session_dismissed') === 'true';
      if (isSessionDismissed) {
        return;
      }

      // 4. iOS Safari Detection
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIosDevice = /iphone|ipad|ipod/.test(userAgent);

      if (isIosDevice) {
        setIsIOS(true);
        setShowIOSGuide(true);
      }
    });

    // 5. Capture BeforeInstallPrompt for Chromium/Android/Desktop
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;

      if (isStandalone) return;

      setDeferredPrompt(e as BeforeInstallPromptEvent);

      const isSessionDismissed = sessionStorage.getItem('sbj_pwa_session_dismissed') === 'true';
      if (!isSessionDismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      isMounted = false;
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    setShowInstallBanner(false);
    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        sessionStorage.setItem('sbj_pwa_session_dismissed', 'true');
      }
    } catch (err) {
      console.warn('[PWA Install Error]', err);
    } finally {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    setShowIOSGuide(false);
    sessionStorage.setItem('sbj_pwa_session_dismissed', 'true');
  };

  if (!showInstallBanner && !showIOSGuide) {
    return null;
  }

  return (
    <div className="fixed bottom-16 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-50 animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-stone-800 flex items-start gap-3">
        <div className="w-10 h-10 bg-amber-600/20 text-amber-500 rounded-xl flex items-center justify-center shrink-0 border border-amber-500/30">
          <Download className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">App Experience</h4>
          <p className="text-xs font-semibold text-stone-200 mt-0.5">
            Install Shopping by Jitesh for faster access & offline updates.
          </p>

          {isIOS && showIOSGuide ? (
            <div className="mt-2 text-[11px] text-stone-300 space-y-1">
              <p className="flex items-center gap-1">
                Tap <Share className="w-3.5 h-3.5 text-amber-400 inline" /> Share then select <strong className="text-white">Add to Home Screen</strong>.
              </p>
              <button
                onClick={handleDismiss}
                className="mt-1 text-[10px] font-bold text-amber-400 hover:underline"
              >
                Got it
              </button>
            </div>
          ) : (
            <Button
              onClick={handleInstallClick}
              variant="primary"
              size="sm"
              className="mt-2.5 text-xs py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              Install App
            </Button>
          )}
        </div>

        <button
          onClick={handleDismiss}
          className="text-stone-400 hover:text-white p-1 transition-colors rounded-lg cursor-pointer"
          aria-label="Dismiss installation prompt"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
