import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/presentation/components/AppText';
import { InstallMethods } from '@/presentation/components/InstallMethods';
import { ReinstallNotice } from '@/presentation/components/ReinstallNotice';
import { useRemoteConfig } from '@/presentation/providers/RemoteConfigProvider';
import { usableMethods } from '@/core/config/installConfig';
import {
  bumpInstallNagDismissals,
  readInstallNagActions,
  readInstallNagDismissals,
  subscribeInstallNag,
} from '@/core/installNag';
import { colors, fonts, fontSizes, radius, spacing } from '@/core/theme';

const APP_ICON = require('../../../assets/logo/app-icon-1024.png');

/**
 * هدایتِ کاربرانِ اندرویدیِ نسخه‌ی وب به نصبِ اپِ نیتیو (فقط وب + اندروید).
 *
 * دو حالت دارد که ادمین با `android_gate_mode` انتخاب می‌کند:
 * - `nag`: کاربر آزادانه ثبت‌نام می‌کند و می‌گردد؛ اما پس از `nagStartAfter` کنشِ
 *   معنادار (پیام، لایک، …) یک مودالِ قابلِ‌بستنِ «اپ را نصب کن» می‌آید و بعد هر
 *   `nagEvery` کنش — و همچنین ابتدای هر بازدیدِ تازه — دوباره تکرار می‌شود. لحنِ
 *   متن با هر بار بستن پله‌پله جدی‌تر می‌شود.
 * - `block`: صفحه‌ی مسدودکننده‌ی غیرقابلِ‌بستنِ قدیمی (از بازدیدِ دوم یا ۹۰ ثانیه).
 *
 * سیاستِ fail-open: اگر پیکربندی نیامده یا هیچ روشِ نصبِ فعالی نباشد، هیچ‌چیز
 * نشان داده نمی‌شود. روی نیتیو و iOS/دسکتاپ کاملاً بی‌اثر است.
 */

const KEY_SESSIONS = 'androidGate:sessions';
const FIRST_SESSION_DELAY_MS = 90 * 1000; // حالتِ block: در بازدیدِ اول پس از ۹۰ ثانیه
const SESSION_NAG_DELAY_MS = 25 * 1000; // حالتِ nag: یادآورِ ابتدای بازدیدِ تازه

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

/** متن‌های پله‌ای — هرچه کاربر بیشتر یادآور را ببندد، لحن مصرتر می‌شود. */
const NAG_STAGES: { title: string; body: string }[] = [
  {
    title: 'نودوست توی اپ خیلی بهتره',
    body: 'اعلانِ پیام‌ها و لایک‌ها، سرعتِ بیشتر و امکانِ خرید فقط توی اپِ اندروید هست. همین حالا نصبش کن و با همین شماره وارد شو.',
  },
  {
    title: 'هنوز اپ را نصب نکرده‌ای؟',
    body: 'با نسخه‌ی وب پیام‌ها و لایک‌های تازه را از دست می‌دهی. نصبِ اپ یک دقیقه هم طول نمی‌کشد — حسابت همین‌جاست.',
  },
  {
    title: 'این یادآور دست‌بردار نیست 😅',
    body: 'تا وقتی اپ را نصب نکنی هر بار همین‌جا سبز می‌شود. یکی از راه‌های زیر را بزن، نصب کن و برای همیشه خلاص شو.',
  },
];

function nagStage(dismissals: number): { title: string; body: string } {
  if (dismissals >= 5) return NAG_STAGES[2];
  if (dismissals >= 2) return NAG_STAGES[1];
  return NAG_STAGES[0];
}

export function AndroidAppGateProvider({ children }: { children: React.ReactNode }) {
  const { install, loaded } = useRemoteConfig();
  const [isAndroid] = useState(detectAndroid);
  const [sessions, setSessions] = useState(readSessions);
  const [delayPassed, setDelayPassed] = useState(false);
  const [nagVisible, setNagVisible] = useState(false);
  const [dismissals, setDismissals] = useState(readInstallNagDismissals);

  const methods = usableMethods(install);
  const mode = install.androidGateMode;
  const eligible = isWeb && isAndroid && loaded && methods.length > 0;
  const nagActive = eligible && mode === 'nag';

  useEffect(() => {
    if (!isWeb || !isAndroid) return;
    setSessions(bumpSessions());
    const t = setTimeout(() => setDelayPassed(true), FIRST_SESSION_DELAY_MS);
    return () => clearTimeout(t);
  }, [isAndroid]);

  // حالتِ nag — تکرار با کنش: از nagStartAfterامین کنش و بعد هر nagEvery کنش یک‌بار.
  useEffect(() => {
    if (!nagActive) return;
    const { nagStartAfter, nagEvery } = install;
    return subscribeInstallNag((count) => {
      if (count >= nagStartAfter && (count - nagStartAfter) % nagEvery === 0) {
        setNagVisible(true);
      }
    });
  }, [nagActive, install]);

  // حالتِ nag — یادآورِ ابتدای بازدید: اگر قبلاً از آستانه گذشته، کمی بعد از ورود هم بیاید.
  useEffect(() => {
    if (!nagActive) return;
    if (readInstallNagActions() < install.nagStartAfter) return;
    const t = setTimeout(() => setNagVisible(true), SESSION_NAG_DELAY_MS);
    return () => clearTimeout(t);
  }, [nagActive, install.nagStartAfter]);

  const dismissNag = useCallback(() => {
    setNagVisible(false);
    setDismissals(bumpInstallNagDismissals());
  }, []);

  const copy = useMemo(() => {
    const stage = nagStage(dismissals);
    return {
      title: install.nagTitle || stage.title,
      body: install.nagBody || stage.body,
    };
  }, [dismissals, install.nagTitle, install.nagBody]);

  // حالتِ block — همان رفتارِ سختِ قدیمی.
  const thresholdReached = sessions >= 2 || delayPassed;
  if (eligible && mode === 'block' && thresholdReached) {
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

  return (
    <>
      {children}
      {nagActive && (
        <Modal visible={nagVisible} transparent animationType="slide" onRequestClose={dismissNag}>
          <View style={styles.nagBackdrop}>
            <Pressable style={StyleSheet.absoluteFill} onPress={dismissNag} accessibilityLabel="بستن" />
            <View style={styles.nagSheet}>
              <View style={styles.nagHandle} />
              <Image source={APP_ICON} style={styles.nagIcon} contentFit="cover" />
              <AppText variant="title" align="center">
                {copy.title}
              </AppText>
              <AppText variant="body" align="center" style={styles.nagBody}>
                {copy.body}
              </AppText>
              <View style={styles.methods}>
                <InstallMethods methods={methods} />
              </View>
              <Pressable onPress={dismissNag} accessibilityRole="button" style={styles.nagLater}>
                <AppText variant="body" align="center" style={styles.nagLaterText}>
                  بعداً نصب می‌کنم
                </AppText>
              </Pressable>
              <AppText variant="caption" align="center" style={styles.nagNote}>
                این یادآور تا نصبِ اپ باز هم نشان داده می‌شود
              </AppText>
            </View>
          </View>
        </Modal>
      )}
    </>
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

  nagBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.62)',
  },
  nagSheet: {
    backgroundColor: colors.bg,
    borderTopStartRadius: radius.xl,
    borderTopEndRadius: radius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.line,
    padding: spacing.xl,
    paddingBottom: spacing.xl + spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
  },
  nagHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line,
    marginBottom: spacing.sm,
  },
  nagIcon: { width: 64, height: 64, borderRadius: radius.lg, marginBottom: spacing.xs },
  nagBody: { opacity: 0.75, marginBottom: spacing.md },
  nagLater: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, marginTop: spacing.xs },
  nagLaterText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.sm,
    color: colors.ink3,
    textDecorationLine: 'underline',
  },
  nagNote: { opacity: 0.45 },
});
