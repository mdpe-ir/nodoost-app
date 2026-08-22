import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, type View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

import { copyToClipboard } from '@/core/utils/clipboard';

const SHARE_TOAST = 'کپشن کپی شد؛ در اینستاگرام پیست کن';
const FAIL_TOAST = 'ساختِ تصویر نشد؛ دوباره تلاش کن.';

/**
 * رونوشتِ کپشن + ثبتِ PNG از کارتِ خارج‌ازصفحه + برگه‌ی سیستم.
 *
 * اینستاگرام معمولاً کپشنِ همراهِ تصویر را می‌اندازد؛ برای همین اول کپی
 * می‌کنیم و بعد برگه را باز می‌کنیم تا کاربر در استوری/پست پیست کند.
 */
export function useShareCard() {
  const viewRef = useRef<View>(null);
  const busyRef = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [sharing, setSharing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    []
  );

  const share = useCallback(
    async (caption: string) => {
      if (busyRef.current || Platform.OS === 'web') return;
      busyRef.current = true;
      setSharing(true);
      try {
        const copied = await copyToClipboard(caption);
        if (copied) showToast(SHARE_TOAST);

        const node = viewRef.current;
        if (!node) {
          showToast(FAIL_TOAST);
          return;
        }

        // یک فریم صبر تا layout و عکسِ ازپیش‌بارشده روی کارتِ تمام‌رزولوشن بنشینند.
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => setTimeout(resolve, 80));
        });

        const uri = await captureRef(node, {
          format: 'png',
          quality: 1,
          result: 'tmpfile',
          fileName: 'nodoost-invite',
        });

        if (!(await Sharing.isAvailableAsync())) {
          if (!copied) showToast('اشتراک‌گذاری در این دستگاه در دسترس نیست.');
          return;
        }

        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          UTI: 'public.png',
          dialogTitle: 'اشتراک‌گذاری',
        });
      } catch {
        showToast(FAIL_TOAST);
      } finally {
        busyRef.current = false;
        setSharing(false);
      }
    },
    [showToast]
  );

  return {
    viewRef,
    sharing,
    toast,
    share,
    clearToast: () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      setToast(null);
    },
  };
}
