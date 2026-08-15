import { useCallback, useEffect, useState } from 'react';
import { haptics } from '@/core/haptics';
import { useCases } from '@/core/di/DIProvider';
import type { Mission, MissionProof } from '@/domain/entities';
import { missionErrorText } from './useMissionsViewModel';

/**
 * ویومدلِ صفحه‌ی جزئیاتِ ماموریت.
 *
 * سرور تنها منبعِ حقیقتِ وضعیت است: بعد از هر کنش، خودِ پاسخِ سرور جایگزینِ
 * حالتِ محلی می‌شود. تنها استثنا آپلود و حذفِ عکس است که فقط آرایه‌ی مدرک‌ها را
 * دست می‌زند — یک رفت‌وبرگشتِ کاملِ جزئیات برای هر عکس، صفحه را کند می‌کرد.
 */
export function useMissionDetailViewModel(missionId: number) {
  const uc = useCases();

  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [proofText, setProofText] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    setNotFound(false);
    try {
      const m = await uc.missions.getMission(missionId);
      setMission(m);
      // متنِ ارسالِ قبلی برمی‌گردد تا کاربر بعد از رد شدن مجبور نباشد از صفر
      // بنویسد؛ معمولاً فقط یک تکه‌اش باید اصلاح شود.
      setProofText(m.proof ?? '');
    } catch (e) {
      const code = (e as { code?: string })?.code;
      if (code === 'not_found') setNotFound(true);
      else setError(true);
    } finally {
      setLoading(false);
    }
  }, [uc, missionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const start = useCallback(async () => {
    setBusy(true);
    try {
      setMission(await uc.missions.startMission(missionId));
    } catch (e) {
      setToast(missionErrorText(e));
    } finally {
      setBusy(false);
    }
  }, [uc, missionId]);

  const claim = useCallback(async () => {
    setBusy(true);
    try {
      const res = await uc.missions.claimMission(missionId, proofText.trim() || undefined);
      setMission(res.mission);
      const done = res.mission.state !== 'pending_review';
      // «فرستاده شد» هنوز موفقیت نیست — منتظرِ بررسی است. لرزشِ جشن را برای
      // لحظه‌ای نگه می‌داریم که امتیاز واقعاً نشسته باشد.
      if (done) haptics.success();
      else haptics.tap();
      setToast(
        done ? `${res.mission.points} امتیاز گرفتی 🎉` : 'فرستاده شد؛ پس از بررسی امتیازت اضافه می‌شود.'
      );
    } catch (e) {
      haptics.warn();
      setToast(missionErrorText(e));
    } finally {
      setBusy(false);
    }
  }, [uc, missionId, proofText]);

  const addProof = useCallback(
    async (uri: string) => {
      setUploading(true);
      try {
        const p: MissionProof = await uc.missions.uploadProof(missionId, uri);
        setMission((prev) => (prev ? { ...prev, proofs: [...prev.proofs, p] } : prev));
      } catch (e) {
        setToast(missionErrorText(e));
      } finally {
        setUploading(false);
      }
    },
    [uc, missionId]
  );

  const removeProof = useCallback(
    async (proofId: number) => {
      // خوش‌بینانه حذف می‌شود و در صورتِ خطا برمی‌گردد: انتظار برای شبکه در یک
      // کنشِ آنی مثلِ «حذفِ عکس» حس می‌شود.
      const before = mission?.proofs ?? [];
      setMission((prev) =>
        prev ? { ...prev, proofs: prev.proofs.filter((p) => p.id !== proofId) } : prev
      );
      try {
        await uc.missions.deleteProof(proofId);
      } catch (e) {
        setMission((prev) => (prev ? { ...prev, proofs: before } : prev));
        setToast(missionErrorText(e));
      }
    },
    [uc, mission]
  );

  /** شرطِ فعال‌بودنِ دکمه‌ی ارسال، دقیقاً مطابقِ اعتبارسنجیِ سرور. */
  const canSubmit = (() => {
    if (!mission || mission.verifyKind !== 'manual') return false;
    if (mission.locked || busy || uploading) return false;
    if (mission.state === 'pending_review' || mission.state === 'completed') return false;
    if (mission.attemptsLeft <= 0) return false;
    const needsText = mission.proofKind === 'text' || mission.proofKind === 'image_and_text';
    const needsImages = mission.proofKind === 'image' || mission.proofKind === 'image_and_text';
    if (needsText && proofText.trim() === '') return false;
    if (needsImages && mission.proofs.length < mission.proofMinImages) return false;
    return true;
  })();

  const canAddProof =
    !!mission &&
    (mission.proofKind === 'image' || mission.proofKind === 'image_and_text') &&
    mission.state !== 'pending_review' &&
    mission.state !== 'completed' &&
    mission.attemptsLeft > 0 &&
    mission.proofs.length < mission.proofMaxImages;

  return {
    mission,
    loading,
    notFound,
    error,
    busy,
    uploading,
    toast,
    proofText,
    setProofText,
    canSubmit,
    canAddProof,
    clearToast: () => setToast(null),
    /** برای خطاهای پردازشِ محلیِ عکس که از خودِ پیکر می‌آیند. */
    showToast: setToast,
    reload: load,
    start,
    claim,
    addProof,
    removeProof,
  };
}
