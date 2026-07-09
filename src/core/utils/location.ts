import { Linking } from 'react-native';
import * as Location from 'expo-location';

export interface Coords {
  lat: number;
  lng: number;
}

export type LocationResult =
  | { ok: true; coords: Coords }
  | { ok: false; reason: 'denied' | 'unavailable' };

/**
 * مجوزِ موقعیت را می‌گیرد و مختصاتِ فعلی را برمی‌گرداند. منطقِ مشترکِ نقشه،
 * کاوش و اکسپلور اینجا یک‌جا جمع شده تا سه نسخه‌ی حقیقت نداشته باشیم.
 *
 * نکته‌ی مهم: `getCurrentPositionAsync` بلافاصله بعد از دادنِ مجوز اغلب یک‌بار
 * شکست می‌خورد (هنوز fix آماده نیست). بدونِ fallback، آن شکستِ گذرا به‌اشتباه
 * «مجوز رد شده» تعبیر می‌شد و پیامِ «موقعیتت روشن نیست» نشان داده می‌شد با اینکه
 * کاربر مجوز داده بود. پس اگر مختصاتِ لحظه‌ای نشد، به آخرین موقعیتِ شناخته‌شده
 * برمی‌گردیم.
 *
 * `interactive` یعنی کاربر خودش دکمه را زده؛ آن‌وقت اگر مجوز برای همیشه رد شده،
 * او را به تنظیماتِ سیستم می‌بریم.
 */
export async function resolveLocation(interactive = false): Promise<LocationResult> {
  try {
    let perm = await Location.getForegroundPermissionsAsync();
    if (!perm.granted && perm.canAskAgain) {
      perm = await Location.requestForegroundPermissionsAsync();
    }
    if (!perm.granted) {
      if (interactive && !perm.canAskAgain) await Linking.openSettings().catch(() => {});
      return { ok: false, reason: 'denied' };
    }

    // تلاشِ اول اغلب قبل از آماده‌شدنِ fix شکست می‌خورد؛ یک‌بار دیگر تلاش می‌کنیم و
    // بعد به آخرین موقعیتِ شناخته‌شده می‌افتیم. نتیجه: unavailable به‌ندرت اتفاق می‌افتد.
    let loc: Location.LocationObject | null = null;
    for (let attempt = 0; attempt < 2 && !loc; attempt++) {
      loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      }).catch(() => null);
    }
    loc = loc ?? (await Location.getLastKnownPositionAsync().catch(() => null));
    if (!loc) return { ok: false, reason: 'unavailable' };

    return { ok: true, coords: { lat: loc.coords.latitude, lng: loc.coords.longitude } };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}
