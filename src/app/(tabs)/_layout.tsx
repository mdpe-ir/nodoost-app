import React from 'react';
import { Tabs } from 'expo-router';
import { BottomTabBar } from '@/presentation/components/BottomTabBar';

/**
 * چهار تب + کنشِ میانیِ برجسته («قهرمانی»).
 *
 * پسندها دیگر تب نیست — از کارتِ بالای «گفتگو» بازش می‌کنیم.
 * گفتگوی تصادفی هم تبِ خودش را ندارد و به سوییچِ نمای «اطراف» رفته؛ جای
 * برجسته‌ی میانی به حلقه‌ی ماموریت/امتیاز/جایزه رسید.
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props: React.ComponentProps<typeof BottomTabBar>) => <BottomTabBar {...props} />}
    >
      <Tabs.Screen name="discover" options={{ title: 'کاوش' }} />
      <Tabs.Screen name="nearby" options={{ title: 'اطراف' }} />
      <Tabs.Screen name="arena" options={{ title: 'قهرمانی' }} />
      <Tabs.Screen name="chat" options={{ title: 'گفتگو' }} />
      <Tabs.Screen name="profile" options={{ title: 'من' }} />
    </Tabs>
  );
}
