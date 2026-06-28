import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '@/core/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const icon =
  (name: IconName) =>
  ({ color, size }: { color: string; size: number }) =>
    <Ionicons name={name} color={color} size={size} />;

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
          height: Platform.OS === 'ios' ? 86 : 66,
          paddingTop: 7,
          paddingBottom: Platform.OS === 'ios' ? 28 : 9,
        },
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11 },
      }}
    >
      <Tabs.Screen name="discover" options={{ title: 'کاوش', tabBarIcon: icon('compass-outline') }} />
      <Tabs.Screen name="random" options={{ title: 'تصادفی', tabBarIcon: icon('shuffle-outline') }} />
      <Tabs.Screen name="likes" options={{ title: 'پسندها', tabBarIcon: icon('heart-outline') }} />
      <Tabs.Screen name="chat" options={{ title: 'گفتگو', tabBarIcon: icon('chatbubble-outline') }} />
      <Tabs.Screen name="profile" options={{ title: 'من', tabBarIcon: icon('person-outline') }} />
    </Tabs>
  );
}
