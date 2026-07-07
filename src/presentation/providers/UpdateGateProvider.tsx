import React, { useEffect, useState } from 'react';
import { Platform, View, StyleSheet, Linking } from 'react-native';
import * as Application from 'expo-application';
import { SafeAreaView } from 'react-native-safe-area-context';
import { env } from '@/core/config/env';
import { colors, spacing } from '@/core/theme';
import { AppText } from '@/presentation/components/AppText';
import { Button } from '@/presentation/components/Button';

/**
 * دروازه‌ی به‌روزرسانیِ اجباری (فقط نیتیو).
 *
 * وب/PWA خودکار آخرین نسخه را می‌گیرد، پس آن‌جا کاری نمی‌کند. روی اندروید، نسخه‌ی
 * نصب‌شده را با `min_android_version` از `GET /api/config` مقایسه می‌کند؛ اگر پایین‌تر
 * بود صفحه‌ی مسدودکننده با دکمه‌ی «به‌روزرسانی از بازار» نشان می‌دهد.
 *
 * سیاست: fail-open — اگر درخواست شکست خورد یا فیلدها نبود، کاربر مسدود نمی‌شود.
 */
const PKG = 'ir.nodoost.app';
const DEFAULT_STORE_URL = `https://cafebazaar.ir/app/${PKG}`;
const DEEP_LINK = `bazaar://details?id=${PKG}`;

type Config = {
  min_android_version?: string;
  latest_version?: string;
  store_url?: string;
};

/** مقایسه‌ی نسخه‌های نقطه‌ای مثل «1.0.4» — منفی اگر a < b. */
function cmpVersion(a: string, b: string): number {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

async function openStore(storeUrl: string) {
  try {
    if (await Linking.canOpenURL(DEEP_LINK)) {
      await Linking.openURL(DEEP_LINK);
      return;
    }
  } catch {
    /* fallback زیر */
  }
  Linking.openURL(storeUrl).catch(() => {});
}

export function UpdateGateProvider({ children }: { children: React.ReactNode }) {
  const [blocked, setBlocked] = useState(false);
  const [storeUrl, setStoreUrl] = useState(DEFAULT_STORE_URL);

  useEffect(() => {
    // فقط اندرویدِ نیتیو؛ وب و iOS (فعلاً بازار ندارد) رد می‌شوند.
    if (Platform.OS !== 'android') return;
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${env.apiBaseUrl}/api/config`);
        if (!res.ok) return;
        const cfg: Config = await res.json();
        if (!alive) return;
        if (cfg.store_url) setStoreUrl(cfg.store_url);
        const installed = Application.nativeApplicationVersion;
        if (cfg.min_android_version && installed && cmpVersion(installed, cfg.min_android_version) < 0) {
          setBlocked(true);
        }
      } catch {
        /* fail-open */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!blocked) return <>{children}</>;

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.card}>
        <AppText variant="title" align="center">
          نسخه‌ی جدید در دسترس است
        </AppText>
        <AppText variant="body" align="center" style={styles.body}>
          برای ادامه‌ی استفاده از نودوست، لطفاً برنامه را از کافه‌بازار به‌روزرسانی کنید.
        </AppText>
        <Button
          label="به‌روزرسانی از بازار"
          onPress={() => openStore(storeUrl)}
          style={styles.btn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', padding: spacing.xl },
  card: { gap: spacing.md, alignItems: 'stretch' },
  body: { marginTop: spacing.xs, opacity: 0.7 },
  btn: { marginTop: spacing.lg },
});
