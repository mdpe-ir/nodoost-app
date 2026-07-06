import { useCallback, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { useCases } from '@/core/di/DIProvider';
import { useSession } from '@/presentation/providers/SessionProvider';

const RESEND_WAIT = 60;

/** ویومدلِ ورود: شماره → کد → ورود → مسیردهی به onboarding یا کاوش. */
export function useLogin() {
  const uc = useCases();
  const { login } = useSession();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugCode, setDebugCode] = useState<string | null>(null);
  /** ثانیه‌های باقی‌مانده تا امکانِ ارسالِ دوباره‌ی کد. */
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (step !== 'code' || resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [step, resendIn]);

  const sendOtp = useCallback(async () => {
    if (phone.trim().length < 10) {
      setError('شماره‌ی موبایل را کامل وارد کن');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const r = await uc.auth.requestOtp(phone.trim());
      setDebugCode(r.debugCode ?? null);
      setCode('');
      setResendIn(RESEND_WAIT);
      setStep('code');
    } catch {
      setError('ارسالِ کد ناموفق بود. دوباره تلاش کن.');
    } finally {
      setLoading(false);
    }
  }, [phone, uc]);

  const verify = useCallback(async () => {
    if (code.trim().length < 4) {
      setError('کدِ تأیید را کامل وارد کن');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await login(phone.trim(), code.trim());
      router.replace(result.profileComplete ? '/discover' : '/onboarding');
    } catch {
      setError('کدِ واردشده نادرست است.');
    } finally {
      setLoading(false);
    }
  }, [code, phone, login]);

  return {
    phone,
    setPhone,
    code,
    setCode,
    step,
    loading,
    error,
    debugCode,
    resendIn,
    sendOtp,
    verify,
    back: () => {
      setStep('phone');
      setError(null);
      setResendIn(0);
    },
  };
}
