import { useCallback, useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useFocusEffect } from 'expo-router';

/**
 * محتوا را وقتی صفحه دوباره فوکوس می‌گیرد یا اپ از پس‌زمینه به پیش‌زمینه برمی‌گردد
 * تازه می‌کند. صفحه‌های تب در expo-router مونت می‌مانند؛ پس بدونِ این، محتوا در
 * اولین بارگذاری «یخ» می‌زند و با تعویضِ تب یا بازکردنِ دوباره‌ی اپ به‌روز نمی‌شود.
 *
 * بارِ اولِ فوکوس نادیده گرفته می‌شود تا با بارگذاریِ اولیه‌ی خودِ ویومدل دوبار
 * صدا زده نشود.
 */
export function useRefetchOnFocus(reload: () => void) {
  const reloadRef = useRef(reload);
  reloadRef.current = reload;

  // آیا صفحه هم‌اکنون فوکوس دارد؟ برای اینکه فقط تبِ فعال با بازگشتِ اپ تازه شود.
  const focusedRef = useRef(false);
  const firstFocusRef = useRef(true);

  useFocusEffect(
    useCallback(() => {
      focusedRef.current = true;
      if (firstFocusRef.current) {
        firstFocusRef.current = false; // بارِ اول را ویومدل خودش لود کرده
      } else {
        reloadRef.current();
      }
      return () => {
        focusedRef.current = false;
      };
    }, [])
  );

  useEffect(() => {
    let prev: AppStateStatus = AppState.currentState;
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      const cameToForeground = /inactive|background/.test(prev) && next === 'active';
      prev = next;
      if (cameToForeground && focusedRef.current) reloadRef.current();
    });
    return () => sub.remove();
  }, []);
}
