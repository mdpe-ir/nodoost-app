import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Linking } from 'react-native';
import { useCases } from '@/core/di/DIProvider';
import { useSession } from '@/presentation/providers/SessionProvider';
import { useWelcome } from '@/presentation/providers/WelcomeProvider';
import { isProfileComplete } from '@/domain/policies/profile';
import { getLocationPermission, resolveLocation } from '@/core/utils/location';
import { locationPrimerStorage } from '@/core/storage/prefs';
import {
  LocationPermissionModal,
  type PrimerStage,
} from '@/presentation/components/LocationPermissionModal';

/** آن‌قدر صبر می‌کنیم که اسپلشِ متحرک تمام شده باشد و پنجره وسطِ انیمیشن ظاهر نشود. */
const SHOW_DELAY_MS = 2400;
/** مکثِ کوتاهِ حالتِ «عالی شد» پیش از بسته‌شدنِ خودکار. */
const SUCCESS_HOLD_MS = 1400;

/**
 * دروازه‌ی موقعیت در آغازِ اپ — یک‌بار، با توضیحِ دلیل، پیش از دیالوگِ سیستمی.
 *
 * ترتیبِ تصمیم‌ها عمدی است:
 *  ۱. تا وقتی کاربر وارد نشده یا پروفایلش کامل نیست چیزی نمی‌پرسیم؛ در آن مرحله
 *     کاربر هنوز نمی‌داند نودوست چیست و «رد» کردن تقریباً حتمی است.
 *  ۲. اگر مجوز از قبل هست، هیچ پنجره‌ای نشان نمی‌دهیم و فقط بی‌صدا موقعیت را
 *     تازه می‌کنیم — مزاحمتِ صفر.
 *  ۳. اگر مجوز برای همیشه بسته شده، به‌جای دکمه‌ی بی‌اثرِ «اجازه می‌دهم»، مسیرِ
 *     تنظیماتِ سیستم را نشان می‌دهیم.
 *
 * این کامپوننت چیزی رندر نمی‌کند مگر خودِ پنجره، پس هرجای درختِ اپ می‌تواند بنشیند.
 */
export function LocationPrimerProvider() {
  const uc = useCases();
  const { status, user } = useSession();
  const { seen: welcomeSeen } = useWelcome();

  const [visible, setVisible] = useState(false);
  const [stage, setStage] = useState<PrimerStage>('ask');
  // یک‌بار در هر اجرای اپ تصمیم می‌گیریم؛ تغییرِ بعدیِ user نباید دوباره تریگر کند.
  const decided = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const later = useCallback((silent = false) => {
    setVisible(false);
    if (!silent) void locationPrimerStorage.snooze();
  }, []);

  useEffect(() => {
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, []);

  useEffect(() => {
    if (decided.current) return;
    if (status !== 'authed' || welcomeSeen !== true || !user || !isProfileComplete(user)) return;
    decided.current = true;

    let alive = true;
    (async () => {
      const perm = await getLocationPermission();

      if (perm === 'granted') {
        // مجوز هست: بی‌سروصدا موقعیت را تازه کن تا نتایجِ نزدیکی به‌روز بماند.
        const res = await resolveLocation(false);
        if (res.ok) await uc.profile.setLocation(res.coords.lat, res.coords.lng).catch(() => {});
        void locationPrimerStorage.markDone();
        return;
      }

      if (!(await locationPrimerStorage.shouldAsk())) return;
      if (!alive) return;

      setStage(perm === 'blocked' ? 'blocked' : 'ask');
      timers.current.push(
        setTimeout(() => {
          if (alive) setVisible(true);
        }, SHOW_DELAY_MS)
      );
    })();

    return () => {
      alive = false;
    };
  }, [status, user, welcomeSeen, uc]);

  const allow = useCallback(async () => {
    setStage('requesting');
    // interactive=false چون مسیرِ «تنظیمات» را خودمان با حالتِ blocked مدیریت می‌کنیم.
    const res = await resolveLocation(false);

    if (res.ok) {
      await uc.profile.setLocation(res.coords.lat, res.coords.lng).catch(() => {});
      void locationPrimerStorage.markDone();
      setStage('granted');
      timers.current.push(setTimeout(() => setVisible(false), SUCCESS_HOLD_MS));
      return;
    }

    // «مختصات نشد» با «مجوز نداد» یکی نیست: ممکن است کاربر اجازه داده باشد ولی
    // هنوز fix نداشته باشیم. پس منبعِ حقیقت، خودِ وضعیتِ مجوز است نه شکستِ مختصات.
    const perm = await getLocationPermission();
    if (perm === 'granted') {
      void locationPrimerStorage.markDone();
      setVisible(false);
      return;
    }
    if (perm === 'blocked') {
      setStage('blocked');
      return;
    }
    setStage('ask');
    later();
  }, [uc, later]);

  const openSettings = useCallback(() => {
    void Linking.openSettings().catch(() => {});
    later();
  }, [later]);

  return (
    <LocationPermissionModal
      visible={visible}
      stage={stage}
      onAllow={() => void allow()}
      onLater={() => later()}
      onOpenSettings={openSettings}
    />
  );
}
