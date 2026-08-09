import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useSegments } from 'expo-router';
import { useCases } from '@/core/di/DIProvider';
import { isBazaarBuild } from '@/core/billing/paymentStrategy';
import { openBazaarReview } from '@/core/bazaar/rate';
import { subscribeReviewMoments } from '@/core/reviewMoments';
import { useRemoteConfig } from '@/presentation/providers/RemoteConfigProvider';
import { useSession } from '@/presentation/providers/SessionProvider';
import { useInAppMessages } from '@/presentation/providers/InAppMessagesProvider';
import {
  ReviewPromptModal,
  type ReviewChoice,
} from '@/presentation/components/ReviewPromptModal';
import type { ReviewPromptAction } from '@/domain/repositories/ReviewPromptRepository';

/**
 * درخواستِ ثبتِ نظر در کافه‌بازار — تصمیمِ «کِی نشان بدهیم».
 *
 * تقسیمِ کار: سرور می‌گوید *مجاز* هست یا نه (سنِ حساب، درگیری، کول‌داون، سقفِ
 * دفعات، و تصمیم‌های قبلیِ کاربر)؛ این‌جا فقط لحظه‌اش انتخاب می‌شود.
 *
 * قاعده‌ی لحظه — عمداً سخت‌گیرانه، چون پنجره‌ی بدموقع خودش نظرِ منفی می‌سازد:
 *   ۱) فقط بیلدِ اندرویدِ کافه‌بازار (وب فروشگاهی ندارد که نظر در آن ثبت شود)
 *   ۲) فقط بعد از یک «لحظه‌ی خوش»: مَچ، خریدِ موفق، یا رسیدنِ کنش‌های همین نشست
 *      به آستانه‌ی تنظیم‌شده
 *   ۳) فقط روی تب‌های ریشه — نه وسطِ گفتگو، ثبت‌نام یا صفحه‌ی خرید
 *   ۴) هیچ مودالِ دیگری روی صفحه نباشد (تبریکِ اشتراک، پاپ‌آپِ ادمین)
 *   ۵) با کمی مکث بعد از لحظه‌ی خوش، تا روی حسِ آن لحظه نیفتد
 *
 * اگر شرط‌های ۳ و ۴ برقرار نبودند درخواست «مسلح» می‌ماند و به‌محضِ برقرارشدنشان
 * پنجره باز می‌شود — نه اینکه آن نوبت سوخته شود.
 */

const SHOW_DELAY_MS = 800;

interface ReviewPromptValue {
  /** آیا در این بیلد اصلاً معنا دارد (اندرویدِ بازار)؟ */
  available: boolean;
  /** بازکردنِ دستیِ پنجره — ردیفِ «نظر و امتیاز» در پروفایل. */
  open: () => void;
}

const ReviewPromptContext = createContext<ReviewPromptValue>({
  available: false,
  open: () => {},
});

export const useReviewPrompt = () => useContext(ReviewPromptContext);

export function ReviewPromptProvider({ children }: { children: React.ReactNode }) {
  const uc = useCases();
  const { review, version } = useRemoteConfig();
  const { status, celebrateTier } = useSession();
  const { popup } = useInAppMessages();
  const segments = useSegments();

  const [eligible, setEligible] = useState(false);
  const [armed, setArmed] = useState(false);
  const [visible, setVisible] = useState(false);
  // مسیرِ دستی هیچ‌کدام از شرط‌های لحظه را لازم ندارد.
  const [manual, setManual] = useState(false);

  // هم بیلد باید بازاری باشد و هم فیچر از پنل روشن — همان یک سوییچ، هم پنجره‌ی
  // خودکار را کنترل می‌کند و هم ردیفِ دستیِ پروفایل را.
  const available = isBazaarBuild && review.enabled;
  // یک‌بار در هر اجرا: نگذارد کاربری که همین حالا تصمیم گرفت، با یک لحظه‌ی خوشِ
  // دیگر دوباره پنجره ببیند.
  const doneThisRun = useRef(false);

  const report = useCallback(
    (action: ReviewPromptAction, note?: string) => {
      uc.reviewPrompt.report(action, note).catch(() => {
        /* گزارشِ آماری است؛ شکستش نباید به کاربر نشان داده شود */
      });
    },
    [uc]
  );

  // واجدِ شرایط بودن را یک‌بار پس از ورود می‌پرسیم.
  useEffect(() => {
    if (!available || status !== 'authed') return;
    let alive = true;
    uc.reviewPrompt
      .get()
      .then((s) => {
        if (alive) setEligible(s.eligible);
      })
      .catch(() => {
        /* fail-safe: چیزی نشان داده نمی‌شود */
      });
    return () => {
      alive = false;
    };
  }, [available, status, uc]);

  // مسلح‌شدن با لحظه‌ی خوش. `action` فقط تریگرِ پشتیبان است و باید به آستانه برسد.
  // اگر کاربر پیش از رسیدنِ پاسخِ سرور به آستانه رسیده باشد، اولین کنشِ بعدی
  // مسلحش می‌کند — شمارنده نشستی است و صفر نمی‌شود.
  useEffect(() => {
    if (!available || !eligible) return;
    return subscribeReviewMoments((moment, actions) => {
      if (doneThisRun.current) return;
      if (moment === 'action' && actions < review.triggerActions) return;
      setArmed(true);
    });
  }, [available, eligible, review.triggerActions]);

  // نمایش: فقط وقتی صحنه خلوت است. هر بار که یکی از این شرط‌ها عوض شود دوباره
  // بررسی می‌شود، پس یک پاپ‌آپِ هم‌زمان فقط نمایش را عقب می‌اندازد، نه لغو.
  const onRootTab = segments[0] === '(tabs)';
  const sceneClear = onRootTab && celebrateTier == null && popup == null;

  useEffect(() => {
    if (!armed || visible || !sceneClear) return;
    const t = setTimeout(() => {
      setVisible(true);
      setArmed(false);
      report('shown');
    }, SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, [armed, visible, sceneClear, report]);

  const open = useCallback(() => {
    setManual(true);
    setVisible(true);
  }, []);

  const choose = useCallback(
    (choice: ReviewChoice) => {
      // «راضی‌ام» تصمیمِ نهایی نیست: مودال خودش به مرحله‌ی دعوت به بازار می‌رود و
      // باز می‌ماند. این‌جا فقط عددِ میانیِ قیف ثبت می‌شود.
      if (choice.kind === 'happy') {
        report('happy');
        return;
      }

      setVisible(false);
      if (!manual) doneThisRun.current = true;
      setManual(false);

      switch (choice.kind) {
        case 'store':
          report('store_opened');
          openBazaarReview(version.storeUrl).catch(() => {});
          setEligible(false);
          return;
        case 'later':
          report('later');
          setEligible(false);
          return;
        case 'never':
          report('never');
          setEligible(false);
          return;
        case 'unhappy':
          report('unhappy', choice.note || undefined);
          setEligible(false);
          return;
      }
    },
    [manual, report, version.storeUrl]
  );

  return (
    <ReviewPromptContext.Provider value={{ available, open }}>
      {children}
      {available ? (
        <ReviewPromptModal visible={visible} cfg={review} onChoose={choose} />
      ) : null}
    </ReviewPromptContext.Provider>
  );
}
