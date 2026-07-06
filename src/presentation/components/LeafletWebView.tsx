import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { colors } from '@/core/theme';

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
 * پوشِ نیتیوِ نقشه‌ی Leaflet: از react-native-webview استفاده می‌کند.
 * نسخه‌ی وب (LeafletWebView.web.tsx) به‌جای آن iframe رندر می‌کند تا PWA export
 * به react-native-webview که روی وب پشتیبانی نمی‌شود وابسته نباشد.
 */
export function LeafletWebView({ html, payload, onEvent }: Props) {
  const ref = useRef<WebView>(null);
  const ready = useRef(false);

  const push = useCallback(() => {
    ref.current?.postMessage(payload);
  }, [payload]);

  // با تغییرِ داده، اگر نقشه آماده باشد دوباره تزریق کن.
  useEffect(() => {
    if (ready.current) push();
  }, [payload, push]);

  const onMessage = useCallback(
    (e: WebViewMessageEvent) => {
      let msg: LeafletEvent;
      try {
        msg = JSON.parse(e.nativeEvent.data);
      } catch {
        return;
      }
      if (msg.type === 'ready') {
        ready.current = true;
        push();
      } else {
        onEvent(msg);
      }
    },
    [push, onEvent]
  );

  return (
    <WebView
      ref={ref}
      originWhitelist={['*']}
      source={{ html }}
      onMessage={onMessage}
      style={styles.web}
      javaScriptEnabled
      domStorageEnabled
      setSupportMultipleWindows={false}
    />
  );
}

const styles = StyleSheet.create({
  web: { flex: 1, backgroundColor: colors.bg },
});
