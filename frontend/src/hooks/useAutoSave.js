import { useEffect, useRef, useState } from 'react';
import { sessionAPI } from '../services/api';

export function useAutoSave({ sessionId, elements, enabled = true, delay = 1200 }) {
  const [status, setStatus] = useState('idle');
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const firstRun = useRef(true);
  const lastPayload = useRef('');

  useEffect(() => {
    if (!enabled || !sessionId) return;

    const payload = JSON.stringify(elements || []);
    if (firstRun.current) {
      firstRun.current = false;
      lastPayload.current = payload;
      return;
    }
    if (payload === lastPayload.current) return;

    setStatus('saving');
    const timer = setTimeout(async () => {
      try {
        await sessionAPI.updateElements(sessionId, elements || []);
        lastPayload.current = payload;
        setLastSavedAt(new Date());
        setStatus('saved');
      } catch {
        setStatus('error');
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, elements, enabled, sessionId]);

  return { status, lastSavedAt };
}
