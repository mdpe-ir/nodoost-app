import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';

/**
 * بیومتریک — میانبرِ بازکردنِ قفل، نه جایگزینش.
 *
 * اصلِ امنیتیِ تلگرام را نگه میداریم: بیومتریک «راحتی» است، نه «راز». رازِ
 * واقعی همان رمزِ عددی/الگوست که هشِ محلی‌اش در SecureStore است؛ اثر انگشت
 * فقط دکمه‌ی میانبری می‌شود که همان قفل را باز میکند. به همین دلیل:
 * • بدونِ قفلِ تنظیمشده، بیومتریک اصلاً معنا ندارد (فعال نمیشود).
 * • خاموشیِ قفل، بیومتریک را هم با خودش می‌برد (در همین رکورد ذخیره است).
 * • `disableDeviceFallback` روشن است: اگر بیومتریک نخواند، جای فال‌بکِ
 *   سیستمی (PINِ گوشی) خودِ کیپدِ نودوست می‌آید — راز باید نزدِ خودمان بماند.
 */

export type BiometricKind = 'fingerprint' | 'face' | 'iris';

export interface BiometricCapability {
  /** سختافزار موجود باشد و در تنظیماتِ سیستم هم ثبت شده باشد. */
  available: boolean;
  kinds: BiometricKind[];
}

const unavailable: BiometricCapability = { available: false, kinds: [] };

const mapKind = (t: LocalAuthentication.AuthenticationType): BiometricKind | null => {
  switch (t) {
    case LocalAuthentication.AuthenticationType.FINGERPRINT:
      return 'fingerprint';
    case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
      return 'face';
    case LocalAuthentication.AuthenticationType.IRIS:
      return 'iris';
    default:
      return null;
  }
};

export const getBiometricCapability = async (): Promise<BiometricCapability> => {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return unavailable;
  try {
    if (!(await LocalAuthentication.hasHardwareAsync())) return unavailable;
    if (!(await LocalAuthentication.isEnrolledAsync())) return unavailable;
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const kinds = types.map(mapKind).filter((k): k is BiometricKind => k !== null);
    return kinds.length > 0 ? { available: true, kinds } : unavailable;
  } catch {
    return unavailable;
  }
};

export interface BiometricResult {
  success: boolean;
  /** کاربر خودش انصراف داده باشد — برای اینکه خطا نشان ندهیم. */
  cancelled: boolean;
}

/** درخواستِ احرازِ بیومتریک — روی هر خطایی `{success:false, cancelled:false}`. */
export const authenticateBiometric = async (reason: string): Promise<BiometricResult> => {
  try {
    const res = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      cancelLabel: 'انصراف',
      disableDeviceFallback: true,
    });
    return { success: res.success, cancelled: !res.success && res.error === 'user_cancel' };
  } catch {
    return { success: false, cancelled: false };
  }
};
