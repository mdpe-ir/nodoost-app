import { useCallback, useEffect, useState } from 'react';
import { useCases } from '@/core/di/DIProvider';
import type { NotificationPrefs } from '@/domain/entities';

const DEFAULTS: NotificationPrefs = {
  follows: true,
  likes: true,
  messages: true,
  matches: true,
  profileViews: true,
  system: true,
};

export type NotificationPrefKey = keyof NotificationPrefs;

/** ویومدلِ تنظیماتِ اعلان — سوییچ‌ها خوش‌بینانه‌اند و در خطا برمی‌گردند. */
export function useNotificationPrefsViewModel() {
  const uc = useCases();
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  /** کدام کلید همین حالا در حالِ ذخیره است (برای لودرِ همان ردیف). */
  const [saving, setSaving] = useState<NotificationPrefKey | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setPrefs(await uc.notifications.getPrefs());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [uc]);

  useEffect(() => {
    load();
  }, [load]);

  const update = useCallback(
    async (key: NotificationPrefKey, value: boolean) => {
      const previous = prefs[key];
      setPrefs((p) => ({ ...p, [key]: value }));
      setSaving(key);
      try {
        setPrefs(await uc.notifications.updatePrefs({ [key]: value }));
      } catch {
        setPrefs((p) => ({ ...p, [key]: previous }));
      } finally {
        setSaving(null);
      }
    },
    [prefs, uc]
  );

  return { prefs, loading, error, saving, update, reload: load };
}
