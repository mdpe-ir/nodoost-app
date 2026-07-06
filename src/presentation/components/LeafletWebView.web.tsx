import React, { useCallback, useEffect, useRef } from 'react';

export interface LeafletEvent {
  type?: string;
  id?: number;
}

interface Props {
  html: string;
  /** رشته‌ی JSON که به داخلِ نقشه تزریق می‌شود ({ me, users }). */
  payload: string;
  onEvent: (msg: LeafletEvent) => void;
}

/**
 * نسخه‌ی وبِ نقشه: به‌جای react-native-webview (که روی وب پشتیبانی نمی‌شود) یک
 * iframe با srcDoc رندر می‌کند. ارتباط دوطرفه با postMessage بینِ صفحه و iframe.
 */
export function LeafletWebView({ html, payload, onEvent }: Props) {
  const ref = useRef<HTMLIFrameElement>(null);
  const ready = useRef(false);

  const push = useCallback(() => {
    ref.current?.contentWindow?.postMessage(payload, '*');
  }, [payload]);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (typeof e.data !== 'string') return;
      let msg: LeafletEvent;
      try {
        msg = JSON.parse(e.data);
      } catch {
        return;
      }
      if (!msg || typeof msg !== 'object' || !msg.type) return;
      if (msg.type === 'ready') {
        ready.current = true;
        push();
      } else {
        onEvent(msg);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [push, onEvent]);

  // با تغییرِ داده، اگر نقشه آماده باشد دوباره تزریق کن.
  useEffect(() => {
    if (ready.current) push();
  }, [payload, push]);

  return (
    <iframe
      ref={ref}
      srcDoc={html}
      title="map"
      style={{ border: 'none', width: '100%', height: '100%', backgroundColor: '#0B0910' }}
    />
  );
}
