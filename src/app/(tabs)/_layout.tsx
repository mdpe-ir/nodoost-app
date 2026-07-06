import React from 'react';
import { Tabs } from 'expo-router';
import { BottomTabBar } from '@/presentation/components/BottomTabBar';

/**
 * چهار تب + کنشِ میانیِ برجسته (تصادفی).
 * پسندها دیگر تب نیست — از کارتِ بالای «گفتگو» بازش می‌کنیم.
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props: React.ComponentProps<typeof BottomTabBar>) => <BottomTabBar {...props} />}
    >
      <Tabs.Screen name="discover" options={{ title: 'کاوش' }} />
      <Tabs.Screen name="nearby" options={{ title: 'اطراف' }} />
      <Tabs.Screen name="random" options={{ title: 'تصادفی' }} />
      <Tabs.Screen name="chat" options={{ title: 'گفتگو' }} />
      <Tabs.Screen name="profile" options={{ title: 'من' }} />
    </Tabs>
  );
}
