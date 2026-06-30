import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from './Icon';
import { colors, fonts, radius } from '@/core/theme';

// نگاشتِ نامِ مسیر به آیکنِ برند
const ICONS: Record<string, IconName> = {
  discover: 'tab-discover',
  random: 'lightning',
  likes: 'tab-likes',
  chat: 'tab-chat',
  profile: 'tab-profile',
};

interface Route {
  key: string;
  name: string;
}
interface TabBarProps {
  state: { index: number; routes: Route[] };
  descriptors: Record<string, { options: { title?: string } }>;
  navigation: {
    emit: (e: { type: 'tabPress'; target: string; canPreventDefault: true }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
}

/**
 * نوارِ ناوبریِ پایین — راست‌به‌چپ (کاوش سمتِ راست) با حبابِ فعالِ طلایی.
 * چون اپ از forceRTL استفاده نمی‌کند، ترتیب را خودمان با row-reverse می‌چینیم.
 */
export function BottomTabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom + 6 }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const label = descriptors[route.key]?.options.title ?? route.name;
        const iconName = ICONS[route.name] ?? 'tab-discover';
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };
        return (
          <Pressable
            key={route.key}
            style={styles.item}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            hitSlop={6}
          >
            <View style={[styles.pill, focused && styles.pillActive]}>
              <Icon
                name={iconName}
                size={23}
                tint={focused ? 'gold' : 'white'}
                style={focused ? undefined : { opacity: 0.5 }}
              />
            </View>
            <Text style={[styles.label, focused && styles.labelActive]} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 8,
  },
  item: { flex: 1, alignItems: 'center', gap: 4 },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: 'transparent',
  },
  pillActive: { backgroundColor: colors.goldFaint },
  label: { fontFamily: fonts.medium, fontSize: 11, color: colors.ink3 },
  labelActive: { color: colors.gold2 },
});
