import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useSession } from '@/presentation/providers/SessionProvider';
import { useRemoteConfig } from '@/presentation/providers/RemoteConfigProvider';

/**
 * ویومدلِ صفحه‌ی «حساب‌ها»: فهرست، سوییچ، خروجِ تک‌حساب و خروجِ همه.
 *
 * خروجِ حساب برگشت‌ناپذیر است (توکن‌ها پاک می‌شوند و کاربر باید دوباره با کدِ
 * پیامک وارد شود)، پس همیشه تأیید می‌گیرد — همان قراردادی که صفحه‌ی پلن‌ها
 * برای کنش‌های سنگین دارد.
 */
export function useAccountsViewModel() {
  const { accounts, activeId, switchAccount, logoutAccount, logoutAll } = useSession();
  const { accounts: cfg } = useRemoteConfig();
  const [busyId, setBusyId] = useState<string | null>(null);

  const active = accounts.find((a) => a.id === activeId) ?? null;
  const atCap = accounts.length >= cfg.maxAccounts;

  const switchTo = useCallback(
    (id: string) => {
      if (id === activeId) return;
      setBusyId(id);
      // مقصدِ ثابت: اگر کاربر روی گفتگوی اکانتِ قبلی بود، همان‌جا نمی‌ماند.
      router.replace('/discover');
      switchAccount(id).finally(() => setBusyId(null));
    },
    [activeId, switchAccount]
  );

  const remove = useCallback(
    (id: string) => {
      const target = accounts.find((a) => a.id === id);
      const label = target?.name?.trim() || target?.phone || 'این حساب';
      Alert.alert('خروج از حساب', `${label} از این دستگاه حذف می‌شود.`, [
        { text: 'انصراف', style: 'cancel' },
        {
          text: 'خروج',
          style: 'destructive',
          onPress: () => {
            setBusyId(id);
            logoutAccount(id).finally(() => setBusyId(null));
          },
        },
      ]);
    },
    [accounts, logoutAccount]
  );

  const signOutAll = useCallback(() => {
    Alert.alert('خروج از همه‌ی حساب‌ها', 'همه‌ی حساب‌ها از این دستگاه حذف می‌شوند.', [
      { text: 'انصراف', style: 'cancel' },
      {
        text: 'خروج از همه',
        style: 'destructive',
        onPress: () => {
          void logoutAll();
        },
      },
    ]);
  }, [logoutAll]);

  const addAccount = useCallback(() => router.push('/add-account'), []);

  return {
    accounts,
    activeId,
    active,
    atCap,
    maxAccounts: cfg.maxAccounts,
    busyId,
    switchTo,
    remove,
    addAccount,
    signOutAll,
  };
}
