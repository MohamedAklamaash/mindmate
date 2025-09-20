import { DeviceEventEmitter } from 'react-native';
import { useUserStore } from '@/store/userStore';

const DEFAULT_SERVER = 'https://mind-mate-two-tau.vercel.app';

export async function combinedFetchService(emotionOverride?: string | string[]) {
  // Determine emotion: override > store > neutral
  const rawFromStore = useUserStore.getState().currentEmotion ?? 'neutral';
  let currentEmotionRaw = emotionOverride ?? rawFromStore ?? 'neutral';

  const sanitizeEmotion = (val: any): string => {
    if (Array.isArray(val)) {
      for (const item of val) {
        if (typeof item === 'string' && item.trim().length > 0) return item.trim();
      }
      return 'neutral';
    }
    if (typeof val === 'string') {
      return val.trim().length > 0 ? val.trim() : 'neutral';
    }
    return 'neutral';
  };

  const currentEmotion = sanitizeEmotion(currentEmotionRaw);
  console.log('[quoteFetcher] Sanitized emotion for get-quote-thought:', currentEmotion);

  try {
    const requestBody = { emotion: currentEmotion };
    console.log('[quoteFetcher] Request body:', requestBody);

    const res = await fetch(`${DEFAULT_SERVER}/get-quote-thought`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const rawText = await res.text();
    console.log('[quoteFetcher] raw response:', rawText);

    let payload: any = {};
    try {
      payload = rawText ? JSON.parse(rawText) : {};
    } catch (e) {
      console.warn('[quoteFetcher] failed to parse JSON, rawText used as payload:', e);
      payload = {};
    }

    // Emit an event so any mounted UI can update immediately
    try {
      DeviceEventEmitter.emit('quotesFetched', payload);
      console.log('[quoteFetcher] Emitted quotesFetched event with payload.');
    } catch (emitErr) {
      console.warn('[quoteFetcher] Failed to emit quotesFetched event:', emitErr);
    }

    return payload;
  } catch (err) {
    console.error('[quoteFetcher] Error fetching combined quote:', err);
    // Still emit empty payload so listeners can fallback to defaults
    try {
      DeviceEventEmitter.emit('quotesFetched', {});
    } catch (e) {
      /* ignore */
    }
    return null;
  }
}
