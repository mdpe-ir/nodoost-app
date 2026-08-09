import { useCallback, useEffect, useState } from 'react';
import { useCases } from '@/core/di/DIProvider';
import { ApiError } from '@/core/http/ApiError';
import { enNum } from '@/core/utils/faNum';
import type { ReferralOverview } from '@/domain/entities';

const ERRORS: Record<string, string> = {
  referral_self: 'کدِ خودت را نمی‌توانی وارد کنی.',
  referral_cycle: 'شما دو نفر نمی‌توانید هم‌دیگر را دعوت کنید.',
  referral_used: 'قبلاً یک کدِ دعوت وارد کرده‌ای.',
  referral_expired: 'مهلتِ واردکردنِ کدِ دعوت گذشته است.',
  referral_bad_code: 'این کد پیدا نشد.',
  referral_disabled: 'دعوت از دوستان فعلاً غیرفعال است.',
};

/** کدِ دعوت را به شکلی که سرور می‌فهمد درمی‌آورد: ارقامِ فارسی به لاتین،
 *  حذفِ فاصله و خط‌تیره، حروفِ بزرگ. */
export const normalizeInviteCode = (raw: string): string =>
  enNum(raw).replace(/[\s\-_]/g, '').toUpperCase();

export function useInviteViewModel() {
  const uc = useCases();
  const [data, setData] = useState<ReferralOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fetchIt = useCallback(async () => {
    setData(await uc.missions.getReferral(1));
  }, [uc]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      await fetchIt();
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [fetchIt]);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchIt();
    } catch {
      /* بی‌صدا */
    } finally {
      setRefreshing(false);
    }
  }, [fetchIt]);

  const submitCode = useCallback(async () => {
    const clean = normalizeInviteCode(code);
    if (clean.length < 4) {
      setMessage('کد را کامل وارد کن.');
      setSuccess(false);
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      await uc.missions.redeemReferralCode(clean);
      setSuccess(true);
      setMessage('کد ثبت شد؛ هدیه‌ات اضافه شد 🎉');
      setCode('');
      await fetchIt();
    } catch (e) {
      setSuccess(false);
      setMessage(
        e instanceof ApiError
          ? (ERRORS[e.code ?? ''] ?? 'کد ثبت نشد؛ دوباره تلاش کن.')
          : 'کد ثبت نشد؛ دوباره تلاش کن.'
      );
    } finally {
      setSubmitting(false);
    }
  }, [uc, code, fetchIt]);

  return {
    data,
    loading,
    refreshing,
    error,
    code,
    setCode,
    submitting,
    message,
    success,
    clearMessage: () => setMessage(null),
    reload: load,
    refresh,
    submitCode,
  };
}
