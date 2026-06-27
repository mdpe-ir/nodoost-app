import { useEffect, useRef } from 'react';
import { getApiBase, getAccess } from '@/api/client';

type Handler = (ev: { type: string; [k: string]: unknown }) => void;

/** اتصالِ WebSocket برای رویدادهای بلادرنگ (پیامِ تازه، مَچِ تازه) */
export function useSocket(enabled: boolean, onEvent: Handler) {
  const wsRef = useRef<WebSocket | null>(null);
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    if (!enabled) return;
    let closed = false;
    let retry: ReturnType<typeof setTimeout> | undefined;

    async function connect() {
      const token = await getAccess();
      if (!token || closed) return;
      const url = getApiBase().replace(/^http/, 'ws') + '/ws?token=' + encodeURIComponent(token);
      const ws = new WebSocket(url);
      wsRef.current = ws;
      ws.onmessage = (e: MessageEvent) => {
        try {
          handlerRef.current(JSON.parse(e.data));
        } catch {}
      };
      ws.onclose = () => {
        wsRef.current = null;
        if (!closed) retry = setTimeout(connect, 3000);
      };
      ws.onerror = () => {
        try {
          ws.close();
        } catch {}
      };
    }
    connect();

    return () => {
      closed = true;
      if (retry) clearTimeout(retry);
      try {
        wsRef.current?.close();
      } catch {}
    };
  }, [enabled]);
}
