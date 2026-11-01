import { supabase } from '@/api/xedruoClient';

// Public VAPID key paired with the server-side key stored in Supabase.
export const XEDRUO_VAPID_PUBLIC_KEY = 'BC03afYAQNb6TGHe45kdhum7MNLWx5zH3VDhYtFAqH11czYrDPvzkRAaqlTuvmFvtVQPVp9EAu6i2nm1UAOp_HQ';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export async function registerXedruoPush(companySlug = 'xedruo') {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return { supported: false, status: 'unsupported' };
  }
  if (Notification.permission === 'denied') return { supported: true, status: 'denied' };

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return { supported: true, status: 'no-session' };

  const registration = await navigator.serviceWorker.register('/xedruo-sw.js', { scope: '/' });
  const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  if (permission !== 'granted') return { supported: true, status: permission };

  let subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    const existingKey = subscription.options?.applicationServerKey;
    const expectedKey = urlBase64ToUint8Array(XEDRUO_VAPID_PUBLIC_KEY);
    const existingBytes = existingKey ? new Uint8Array(existingKey) : null;
    const sameKey = existingBytes && existingBytes.length === expectedKey.length &&
      existingBytes.every((value, index) => value === expectedKey[index]);
    if (!sameKey) {
      await subscription.unsubscribe();
      subscription = null;
    }
  }

  subscription ||= await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(XEDRUO_VAPID_PUBLIC_KEY),
  });

  const payload = subscription.toJSON();
  if (!payload.endpoint || !payload.keys?.p256dh || !payload.keys?.auth) {
    throw new Error('The browser returned an incomplete push subscription');
  }

  const { error } = await supabase.rpc('register_xedruo_push_subscription', {
    p_company_slug: companySlug,
    p_endpoint: payload.endpoint,
    p_p256dh: payload.keys.p256dh,
    p_auth_secret: payload.keys.auth,
    p_expiration_epoch_ms: subscription.expirationTime,
  });
  if (error) throw new Error(error.message || 'Could not register push notifications');

  return { supported: true, status: 'granted', subscription };
}

export async function sendTestPush() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not authenticated');
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL || 'https://ydhgxyklucrcqmivtvcu.supabase.co'}/functions/v1/xedruo-push-send-v2`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ title: 'Xedruo test notification', message: 'Push notifications are connected.', url: '/notifications' }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Push delivery is not configured');
  return result;
}
