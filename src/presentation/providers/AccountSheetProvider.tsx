import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { SwitchAccountSheet } from '@/presentation/components/accounts/SwitchAccountSheet';

interface AccountSheetValue {
  /** بازکردنِ برگه‌ی سوییچِ اکانت از هرجای اپ. */
  openSwitch: () => void;
  close: () => void;
}

const AccountSheetContext = createContext<AccountSheetValue | null>(null);

/**
 * برگه‌ی سوییچِ اکانت را یک‌جا میزبانی می‌کند.
 *
 * چرا پرووایدر و نه یک کامپوننت در هر صفحه: دو ورودی داریم (هدرِ «من» و
 * تنظیمات) و اگر هرکدام برگه‌ی خودش را می‌داشت، حالتِ «باز است» دو جا تکرار
 * می‌شد. این‌جا فقط یک نمونه وجود دارد و همه با `openSwitch()` صدایش می‌زنند.
 *
 * این پرووایدر **داخلِ محدوده‌ی اکانت** می‌نشیند تا با هر سوییچ از نو ساخته شود؛
 * یعنی برگه پس از جابه‌جایی خودبه‌خود بسته است و لازم نیست کسی یادش باشد
 * ببنددش.
 */
export function AccountSheetProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);

  const openSwitch = useCallback(() => setVisible(true), []);
  const close = useCallback(() => setVisible(false), []);
  const value = useMemo(() => ({ openSwitch, close }), [openSwitch, close]);

  return (
    <AccountSheetContext.Provider value={value}>
      {children}
      <SwitchAccountSheet visible={visible} onDismiss={close} />
    </AccountSheetContext.Provider>
  );
}

export function useAccountSheet(): AccountSheetValue {
  const ctx = useContext(AccountSheetContext);
  if (!ctx) throw new Error('useAccountSheet must be used within <AccountSheetProvider>');
  return ctx;
}
