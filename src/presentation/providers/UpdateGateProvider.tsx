import React from 'react';
import { Platform, View, ScrollView, StyleSheet } from 'react-native';
import * as Application from 'expo-application';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '@/core/theme';
import { AppText } from '@/presentation/components/AppText';
import { Button } from '@/presentation/components/Button';
import { InstallMethods } from '@/presentation/components/InstallMethods';
import { ReinstallNotice } from '@/presentation/components/ReinstallNotice';
import { useRemoteConfig } from '@/presentation/providers/RemoteConfigProvider';
import { usableMethods } from '@/core/config/installConfig';
import { cmpVersion, openStore } from '@/core/config/appUpdate';

/**
 * دروازه‌ی به‌روزرسانیِ اجباری (فقط نیتیو).
 *
 * وب/PWA خودکار آخرین نسخه را می‌گیرد، پس آن‌جا کاری نمی‌کند. روی اندروید، نسخه‌ی
 * نصب‌شده را با `min_android_version` از `GET /api/config` مقایسه می‌کند؛ اگر پایین‌تر
 * بود صفحه‌ی مسدودکننده نشان می‌دهد که همه‌ی روش‌های نصبِ فعالِ پنلِ ادمین (کافه‌بازار /
 * مایکت / دانلودِ مستقیم) را برای به‌روزرسانی پیش می‌گذارد. اگر هیچ روشی تنظیم نشده باشد،
 * به دکمه‌ی پیش‌فرضِ «به‌روزرسانی از بازار» برمی‌گردد.
 *
 * سیاست: fail-open — اگر درخواست شکست خورد یا فیلدها نبود، کاربر مسدود نمی‌شود.
 */
export function UpdateGateProvider({ children }: { children: React.ReactNode }) {
  const { install, version } = useRemoteConfig();
  const storeUrl = version.storeUrl;

  // فقط اندرویدِ نیتیو؛ وب و iOS (فعلاً بازار ندارد) رد می‌شوند. تا وقتی پیکربندی
  // نیامده `minAndroidVersion` خالی است و کسی مسدود نمی‌شود (fail-open).
  const installed = Application.nativeApplicationVersion;
  const blocked =
    Platform.OS === 'android' &&
    !!version.minAndroidVersion &&
    !!installed &&
    cmpVersion(installed, version.minAndroidVersion) < 0;

  if (!blocked) return <>{children}</>;

  const methods = usableMethods(install);

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <AppText variant="title" align="center">
            نسخه‌ی جدید در دسترس است
          </AppText>
          <AppText variant="body" align="center" style={styles.body}>
            برای ادامه‌ی استفاده از نودوست، لطفاً برنامه را به‌روزرسانی کنید. از یکی از راه‌های
            زیر جدیدترین نسخه را نصب کن.
          </AppText>
          {methods.length > 0 ? (
            <View style={styles.methods}>
              <InstallMethods methods={methods} />
            </View>
          ) : (
            <Button
              label="به‌روزرسانی از بازار"
              onPress={() => openStore(storeUrl)}
              style={styles.btn}
            />
          )}
          <View style={styles.notice}>
            <ReinstallNotice />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  card: { gap: spacing.md, alignItems: 'stretch' },
  body: { marginTop: spacing.xs, opacity: 0.7 },
  methods: { alignSelf: 'stretch', marginTop: spacing.md },
  btn: { marginTop: spacing.lg },
  notice: { marginTop: spacing.lg },
});
