'use client';

import React, { useState, useEffect } from 'react';
import { Bell, BellOff, CheckCircle2, ShieldAlert } from 'lucide-react';
import { savePushSubscription, deletePushSubscription } from '@/services/push-service';
import { useToast } from '@/context/toast-context';

export const NotificationToggle: React.FC = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    let isMounted = true;
    requestAnimationFrame(() => {
      if (
        isMounted &&
        typeof window !== 'undefined' &&
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window
      ) {
        setIsSupported(true);
        if (Notification.permission === 'granted') {
          setIsEnabled(true);
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const handleToggle = async () => {
    if (!isSupported) {
      showToast('Push notifications are not supported on this browser/device.', 'error');
      return;
    }

    setLoading(true);

    try {
      if (isEnabled) {
        // Unsubscribe
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await deletePushSubscription(subscription.endpoint);
          await subscription.unsubscribe();
        }
        setIsEnabled(false);
        showToast('Push notifications disabled.', 'info');
      } else {
        // Subscribe
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          showToast('Notification permission was denied in browser settings.', 'error');
          setLoading(false);
          return;
        }

        const registration = await navigator.serviceWorker.ready;
        // Public VAPID Key or Fallback key for standard subscription
        const vapidPublicKey =
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
          'BEl62iUYgUivxIkv69yViEuiBIa45xV1wI904jH4T45X67U5-901_38792h_J0';

        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey,
        });

        const subJson = subscription.toJSON();
        if (subJson.endpoint && subJson.keys?.p256dh && subJson.keys?.auth) {
          const res = await savePushSubscription({
            endpoint: subJson.endpoint,
            p256dh: subJson.keys.p256dh,
            auth: subJson.keys.auth,
          });

          if (res.success) {
            setIsEnabled(true);
            showToast('Push notifications enabled for order & store updates!', 'success');
          } else {
            showToast(res.error || 'Failed to save subscription server-side.', 'error');
          }
        }
      }
    } catch (err) {
      console.warn('[Notification Toggle Warning]', err);
      showToast('Could not configure push notifications.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 text-xs text-stone-500 bg-stone-100 p-3 rounded-xl">
        <ShieldAlert className="w-4 h-4 text-stone-400 shrink-0" />
        <span>Push notifications unavailable on this browser.</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 bg-stone-50 hover:bg-stone-100/80 border border-stone-200 rounded-xl transition-all">
      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
            isEnabled ? 'bg-amber-100 text-amber-700' : 'bg-stone-200 text-stone-600'
          }`}
        >
          {isEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            Order & Store Notifications
            {isEnabled && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />}
          </h4>
          <p className="text-[11px] text-stone-500">
            {isEnabled
              ? 'Active: Receive instant updates for payment approvals & order status changes.'
              : 'Disabled: Enable to receive instant order tracking & delivery updates.'}
          </p>
        </div>
      </div>

      <button
        onClick={handleToggle}
        disabled={loading}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          isEnabled ? 'bg-amber-600' : 'bg-stone-300'
        }`}
        aria-label="Toggle push notifications"
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            isEnabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};
