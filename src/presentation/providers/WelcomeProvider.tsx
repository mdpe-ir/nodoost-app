import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { welcomeSeenStorage } from '@/core/storage/prefs';

interface WelcomeValue {
  /** null یعنی هنوز از حافظه خوانده نشده؛ سپس true/false. */
  seen: boolean | null;
  markSeen: () => void;
}

const WelcomeContext = createContext<WelcomeValue | null>(null);

/**
 * وضعیتِ «تورِ معرفی دیده شده؟» را از حافظه‌ی سمتِ کلاینت می‌خواند و در کلِ اپ
 * به‌اشتراک می‌گذارد. هم AuthGate (برای مسیریابی) و هم WelcomeScreen (برای علامت‌زدن)
 * از همین حالت استفاده می‌کنند تا با یک بار خواندن، واکنشی هماهنگ داشته باشند.
 */
export function WelcomeProvider({ children }: { children: React.ReactNode }) {
  const [seen, setSeen] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    welcomeSeenStorage.get().then((v) => {
      if (alive) setSeen(v);
    });
    return () => {
      alive = false;
    };
  }, []);

  const markSeen = useCallback(() => {
    setSeen(true); // به‌روزرسانیِ خوش‌بینانه تا مسیریابی بی‌درنگ ادامه یابد
    void welcomeSeenStorage.markSeen();
  }, []);

  return <WelcomeContext.Provider value={{ seen, markSeen }}>{children}</WelcomeContext.Provider>;
}

export function useWelcome(): WelcomeValue {
  const ctx = useContext(WelcomeContext);
  if (!ctx) throw new Error('useWelcome must be used within <WelcomeProvider>');
  return ctx;
}
