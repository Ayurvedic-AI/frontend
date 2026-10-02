/**
 * Browser push enable/disable (feature 069, Web Push + VAPID).
 *
 * States: `unsupported` (missing APIs / insecure context / server keys unset),
 * `blocked` (user denied the browser permission), `enabled` (this browser has
 * an active subscription), `disabled` (supported, not subscribed), `busy`.
 * All backend calls go through the orval SDK (standing rule).
 */
import { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getAdminPushPublicKeyQueryOptions,
  useAdminPushSubscribe,
  useAdminPushUnsubscribe,
} from '../../../sdk/notifications';
import type { PushPublicKeyOut } from '../../../sdk/schemas';
import { useToast } from '../../../common/common-snackbar';
import { errorMessage } from '../../../utils/api-messages';
import { pushSupported, urlBase64ToUint8Array } from '../push-utils';

const SW_URL = '/push-sw.js';

export type PushState = 'unsupported' | 'blocked' | 'enabled' | 'disabled' | 'busy';

export function usePushNotifications() {
  const { toast } = useToast();
  const apiSupported = pushSupported();

  const publicKeyQuery = useQuery({
    ...getAdminPushPublicKeyQueryOptions(),
    enabled: apiSupported,
    staleTime: 5 * 60_000,
  });
  const keyOut = (publicKeyQuery.data as { data?: PushPublicKeyOut } | undefined)?.data;
  const publicKey = keyOut?.public_key ?? null;
  const serverEnabled = keyOut?.enabled === true && Boolean(publicKey);

  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  // Reflect this browser's actual subscription on mount (no backend call).
  useEffect(() => {
    if (!apiSupported) return;
    let cancelled = false;
    void navigator.serviceWorker.getRegistration(SW_URL).then(async (reg) => {
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (!cancelled) setSubscribed(Boolean(sub));
    });
    return () => {
      cancelled = true;
    };
  }, [apiSupported]);

  const subscribeMutation = useAdminPushSubscribe();
  const unsubscribeMutation = useAdminPushUnsubscribe();

  const enable = useCallback(async () => {
    if (!apiSupported || !publicKey) return;
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast({
          severity: 'error',
          message:
            permission === 'denied'
              ? 'Notifications are blocked for this site. Allow them via the icon next to the address bar, then try again.'
              : 'Please click "Allow" on the browser prompt (next to the address bar) to enable notifications.',
        });
        return;
      }
      const reg = await navigator.serviceWorker.register(SW_URL);
      await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey).buffer as ArrayBuffer,
        }));
      const json = sub.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error('Browser returned an incomplete push subscription');
      }
      await subscribeMutation.mutateAsync({
        data: {
          endpoint: json.endpoint,
          keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
          user_agent: navigator.userAgent.slice(0, 250),
        },
      });
      setSubscribed(true);
      toast({ severity: 'success', message: 'Browser notifications enabled.' });
    } catch (e) {
      // Surface the browser's own reason (e.g. Chrome's "Registration failed —
      // push service error") — the generic fallback hides the actionable cause.
      const detail = e instanceof Error && e.message ? `${e.name}: ${e.message}` : null;
      toast({ severity: 'error', message: errorMessage(e, detail ?? undefined) });
      console.error('push enable failed', e);
    } finally {
      setBusy(false);
    }
  }, [apiSupported, publicKey, subscribeMutation, toast]);

  const disable = useCallback(async () => {
    if (!apiSupported) return;
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration(SW_URL);
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) {
        await unsubscribeMutation.mutateAsync({ data: { endpoint: sub.endpoint } });
        await sub.unsubscribe();
      }
      setSubscribed(false);
      toast({ severity: 'success', message: 'Browser notifications disabled.' });
    } catch (e) {
      toast({ severity: 'error', message: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  }, [apiSupported, unsubscribeMutation, toast]);

  let state: PushState;
  if (!apiSupported || (publicKeyQuery.isSuccess && !serverEnabled)) state = 'unsupported';
  else if (typeof Notification !== 'undefined' && Notification.permission === 'denied') state = 'blocked';
  else if (busy || subscribed === null || publicKeyQuery.isPending) state = 'busy';
  else state = subscribed ? 'enabled' : 'disabled';

  return { state, enable, disable };
}
