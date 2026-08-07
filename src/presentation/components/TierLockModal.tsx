import React from 'react';
import { UpgradeSheet } from './UpgradeSheet';

/**
 * نامِ قدیمیِ دروازه‌ی قفلِ سطح. حالا فقط یک پوسته روی UpgradeSheet است تا همه‌ی
 * فراخوان‌های موجود (پروفایلِ کاربر، کاوش، نقشه، …) بدونِ تغییر همان زبانِ
 * بصریِ تازه را بگیرند: برگه‌ی پایینی به‌جای پنجره‌ی وسطِ صفحه.
 *
 * برای موردهای تازه مستقیم از UpgradeSheet استفاده کن — به‌ویژه وقتی علت
 * «پر شدنِ سهمیه» است و نه «کم بودنِ سطح» (پراپِ quotaKey).
 */
export function TierLockModal({
  visible,
  requiredTier,
  onClose,
  title,
  message,
  feature,
}: {
  visible: boolean;
  requiredTier: number;
  onClose: () => void;
  title?: string;
  message?: string;
  /** نامِ کوتاهِ امکانِ قفل‌شده — در بنرِ صفحه‌ی سطح‌ها نشان داده می‌شود. */
  feature?: string;
}) {
  return (
    <UpgradeSheet
      visible={visible}
      onClose={onClose}
      requiredTier={requiredTier}
      title={title ?? 'گفتگو با این کاربر قفل است'}
      message={message}
      feature={feature ?? (title ? undefined : 'شروعِ گفتگو با این کاربر')}
    />
  );
}
