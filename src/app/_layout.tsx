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
import { PwaInstallProvider } from '@/presentation/providers/PwaInstallProvider';
import { isProfileComplete } from '@/domain/policies/profile';
import { Loading } from '@/presentation/components/Loading';
import { AnimatedSplash } from '@/presentation/components/AnimatedSplash';
import { colors } from '@/core/theme';

SplashScreen.preventAutoHideAsync();

/** بر اساسِ وضعیتِ نشست و کاربر، مسیرِ درست را تضمین می‌کند. */
function AuthGate() {
  const { status, user } = useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    const root = segments[0];
    const onAuthScreen = root === 'login' || root === 'onboarding' || root === 'suspended';

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
  }, [status, user, segments, router]);

  if (status === 'loading') return <Loading />;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="suspended" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="likes" />
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

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <DIProvider>
        <SessionProvider>
          <PwaInstallProvider>
            <StatusBar style="light" />
            <AuthGate />
            {!splashDone ? <AnimatedSplash onDone={() => setSplashDone(true)} /> : null}
          </PwaInstallProvider>
        </SessionProvider>
      </DIProvider>
    </SafeAreaProvider>
  );
}
