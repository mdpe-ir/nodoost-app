import React from 'react';
import { Tabs } from 'expo-router';
import { BottomTabBar } from '@/presentation/components/BottomTabBar';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props: React.ComponentProps<typeof BottomTabBar>) => <BottomTabBar {...props} />}
    >
      <Tabs.Screen name="discover" options={{ title: 'کاوش' }} />
      <Tabs.Screen name="map" options={{ title: 'نقشه' }} />
      <Tabs.Screen name="random" options={{ title: 'تصادفی' }} />
      <Tabs.Screen name="likes" options={{ title: 'پسندها' }} />
      <Tabs.Screen name="chat" options={{ title: 'گفتگو' }} />
      <Tabs.Screen name="profile" options={{ title: 'من' }} />
    </Tabs>
  );
}
