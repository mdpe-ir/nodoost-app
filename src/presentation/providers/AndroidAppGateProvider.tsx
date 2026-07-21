import React, { useEffect, useState } from 'react';
import { Platform, View, ScrollView, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/presentation/components/AppText';
import { InstallMethods } from '@/presentation/components/InstallMethods';
import { ReinstallNotice } from '@/presentation/components/ReinstallNotice';
import { useRemoteConfig } from '@/presentation/providers/RemoteConfigProvider';
import { usableMethods } from '@/core/config/installConfig';
import { colors, spacing, radius } from '@/core/theme';

const APP_ICON = require('../../../assets/logo/app-icon-1024.png');

/**
 * دروازه‌ی اجباریِ نصبِ اپِ نیتیو برای کاربرانِ اندرویدیِ نسخه‌ی وب (فقط وب + اندروید).
 *
 * وقتی ادمین `android_pwa_gate` را روشن کند، به کاربرانِ اندرویدی اجازه می‌دهیم کمی با
 * PWA کار کنند و سپس صفحه‌ی مسدودکننده‌ی غیرقابلِ‌بستن نشان می‌دهیم که برای «ادامه» باید
 * اپِ نیتیو را نصب کنند. روی نیتیو (Platform.OS==='android' واقعی) و iOS/دسکتاپ بی‌اثر است.
 *
 * سیاستِ fail-open: اگر پیکربندی هنوز نیامده یا هیچ روشِ نصبِ فعالی نباشد، کسی مسدود نمی‌شود.
 */

const KEY_SESSIONS = 'androidGate:sessions';
const FIRST_SESSION_DELAY_MS = 90 * 1000; // در همان بازدیدِ اول، پس از ۹۰ ثانیه هم مسدود کن

const isWeb = Platform.OS === 'web';

function detectAndroid(): boolean {
  if (!isWeb || typeof navigator === 'undefined') return false;
  return /android/i.test(navigator.userAgent || '');
}

function readSessions(): number {
  try {
    return typeof localStorage !== 'undefined' ? Number(localStorage.getItem(KEY_SESSIONS) || 0) : 0;
  } catch {
    return 0;
  }
}
function bumpSessions(): number {
  const next = readSessions() + 1;
  try {
    localStorage?.setItem(KEY_SESSIONS, String(next));
  } catch {
    /* حالتِ خصوصی — بی‌خیال */
  }
  return next;
}

export function AndroidAppGateProvider({ children }: { children: React.ReactNode }) {
  const { install, loaded } = useRemoteConfig();
  const [isAndroid] = useState(detectAndroid);
  // شمارشِ بازدید — از بازدیدِ دوم به بعد بلافاصله مسدود می‌کنیم؛ در بازدیدِ اول پس از تأخیر.
  const [sessions, setSessions] = useState(readSessions);
  const [delayPassed, setDelayPassed] = useState(false);

  useEffect(() => {
    if (!isWeb || !isAndroid) return;
    setSessions(bumpSessions());
    const t = setTimeout(() => setDelayPassed(true), FIRST_SESSION_DELAY_MS);
    return () => clearTimeout(t);
  }, [isAndroid]);

  const methods = usableMethods(install);
  const thresholdReached = sessions >= 2 || delayPassed;
  const blocked =
    isWeb && isAndroid && loaded && install.androidPwaGate && methods.length > 0 && thresholdReached;

  if (!blocked) return <>{children}</>;

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Image source={APP_ICON} style={styles.icon} contentFit="cover" />
        <AppText variant="title" align="center">
          برای ادامه، اپ را نصب کن
        </AppText>
        <AppText variant="body" align="center" style={styles.body}>
          ادامه‌ی استفاده از نودوست روی اندروید فقط با اپِ نیتیو ممکن است. از یکی از راه‌های زیر نصب
          کن و با همین شماره وارد شو.
        </AppText>
        <View style={styles.methods}>
          <InstallMethods methods={methods} />
        </View>
        {/* راهنمای رفعِ خطای نصب — جمع‌شده تا کاربرِ تازه را نترساند. */}
        <View style={styles.troubleshoot}>
          <ReinstallNotice variant="subtle" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  icon: { width: 88, height: 88, borderRadius: radius.xl, marginBottom: spacing.sm },
  body: { marginTop: spacing.xs, marginBottom: spacing.lg, opacity: 0.75 },
  methods: { alignSelf: 'stretch' },
  troubleshoot: { alignSelf: 'stretch', marginTop: spacing.md },
});
