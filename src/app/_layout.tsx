import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Vazirmatn_400Regular,
  Vazirmatn_500Medium,
  Vazirmatn_700Bold,
} from '@expo-google-fonts/vazirmatn';
import { DIProvider } from '@/core/di/DIProvider';
import { SessionProvider, useSession } from '@/presentation/providers/SessionProvider';
import { WelcomeProvider, useWelcome } from '@/presentation/providers/WelcomeProvider';
import { PwaInstallProvider } from '@/presentation/providers/PwaInstallProvider';
import { UpdateGateProvider } from '@/presentation/providers/UpdateGateProvider';
import { RemoteConfigProvider } from '@/presentation/providers/RemoteConfigProvider';
import { AndroidAppGateProvider } from '@/presentation/providers/AndroidAppGateProvider';
import { isProfileComplete } from '@/domain/policies/profile';
import { requestNotificationPermission } from '@/core/notifications/notificationPermission';
import { Loading } from '@/presentation/components/Loading';
import { AnimatedSplash } from '@/presentation/components/AnimatedSplash';
import { CelebrationModal } from '@/presentation/components/CelebrationModal';
import { colors } from '@/core/theme';

SplashScreen.preventAutoHideAsync();

/** بر اساسِ وضعیتِ نشست و کاربر، مسیرِ درست را تضمین می‌کند. */
function AuthGate() {
  const { status, user } = useSession();
  const { seen: welcomeSeen } = useWelcome();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading' || welcomeSeen === null) return;
    const root = segments[0];
    const onAuthScreen =
      root === 'welcome' || root === 'login' || root === 'onboarding' || root === 'suspended';

    // تورِ معرفی مقدم بر همه‌چیز است: به همه‌ی کاربران (حتی واردشده‌ها) یک‌بار
    // نشان داده می‌شود؛ «دیده شدن» فقط سمتِ کلاینت نگه‌داری می‌شود.
    if (!welcomeSeen) {
      if (root !== 'welcome') router.replace('/welcome');
      return;
    }

    if (status === 'guest') {
      if (root !== 'login') router.replace('/login');
      return;
    }
    if (user?.status === 'banned' || user?.status === 'pending_review') {
      if (root !== 'suspended') router.replace('/suspended');
      return;
    }
    // تا وقتی پروفایل کامل نشده (نام، جنسیت، سن و حداقل یک عکس) اجازه‌ی ورود به اپ نیست.
    if (!isProfileComplete(user)) {
      if (root !== 'onboarding') router.replace('/onboarding');
      return;
    }
    if (onAuthScreen || root === undefined) router.replace('/discover');
  }, [status, user, welcomeSeen, segments, router]);

  if (status === 'loading' || welcomeSeen === null) return <Loading />;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="suspended" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="likes" />
      <Stack.Screen name="viewers" />
      <Stack.Screen name="plans" />
      <Stack.Screen name="get-app" />
      <Stack.Screen name="user/[id]" />
      <Stack.Screen name="thread/[id]" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Vazirmatn_400Regular,
    Vazirmatn_500Medium,
    Vazirmatn_700Bold,
  });
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  // مجوزِ اعلانِ Fetchy را یک‌بار در startup از کاربرِ اندروید ۱۳+ بگیر.
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <DIProvider>
        <SessionProvider>
          <RemoteConfigProvider>
            <WelcomeProvider>
              <PwaInstallProvider>
                <UpdateGateProvider>
                  <AndroidAppGateProvider>
                    <StatusBar style="light" />
                    <AuthGate />
                    <CelebrationModal />
                    {!splashDone ? <AnimatedSplash onDone={() => setSplashDone(true)} /> : null}
                  </AndroidAppGateProvider>
                </UpdateGateProvider>
              </PwaInstallProvider>
            </WelcomeProvider>
          </RemoteConfigProvider>
        </SessionProvider>
      </DIProvider>
    </SafeAreaProvider>
  );
}
