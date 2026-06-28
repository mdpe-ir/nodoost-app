import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Icon, type IconName } from '@/presentation/components/Icon';
import { colors, fonts } from '@/core/theme';

const tab =
  (name: IconName) =>
  ({ focused }: { focused: boolean }) =>
    <Icon name={name} size={26} tint={focused ? 'gold' : 'white'} style={focused ? undefined : { opacity: 0.45 }} />;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.gold2,
        tabBarInactiveTintColor: colors.ink3,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
        },
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11 },
        tabBarItemStyle: { paddingTop: 2 },
      }}
    >
      <Tabs.Screen name="discover" options={{ title: 'کاوش', tabBarIcon: tab('tab-discover') }} />
      <Tabs.Screen name="random" options={{ title: 'تصادفی', tabBarIcon: tab('lightning') }} />
      <Tabs.Screen name="likes" options={{ title: 'پسندها', tabBarIcon: tab('tab-likes') }} />
      <Tabs.Screen name="chat" options={{ title: 'گفتگو', tabBarIcon: tab('tab-chat') }} />
      <Tabs.Screen name="profile" options={{ title: 'من', tabBarIcon: tab('tab-profile') }} />
    </Tabs>
  );
}
