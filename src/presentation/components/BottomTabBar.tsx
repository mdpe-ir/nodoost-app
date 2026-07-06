import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Icon, type IconName } from './Icon';
import { colors, fonts, gradients, radius, shadow } from '@/core/theme';

// نگاشتِ نامِ مسیر به آیکنِ برند
const ICONS: Record<string, IconName> = {
  discover: 'tab-discover',
  nearby: 'map',
  random: 'lightning-fill',
  chat: 'tab-chat',
  profile: 'tab-profile',
};

/** تبِ میانی — کنشِ برجسته‌ی «تصادفی». */
const CENTER_ROUTE = 'random';

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
 * نوارِ ناوبریِ شناور — چهار تب + کنشِ برجسته‌ی میانی (تصادفی).
 * راست‌به‌چپ: کاوش سمتِ راست. چون اپ از forceRTL استفاده نمی‌کند،
 * ترتیب را خودمان با row-reverse می‌چینیم.
 */
export function BottomTabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingBottom: insets.bottom + 10 }]}>
      <View style={[styles.bar, shadow.card]}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const label = descriptors[route.key]?.options.title ?? route.name;
          const iconName = ICONS[route.name] ?? 'tab-discover';
          const isCenter = route.name === CENTER_ROUTE;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          if (isCenter) {
            return (
              <View key={route.key} style={styles.centerSlot}>
                <Pressable
                  onPress={onPress}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: focused }}
                  accessibilityLabel={label}
                  hitSlop={6}
                  style={({ pressed }) => [
                    styles.centerBtn,
                    shadow.gold,
                    focused && styles.centerBtnFocused,
                    pressed && styles.centerBtnPressed,
                  ]}
                >
                  <LinearGradient
                    colors={gradients.gold}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <Icon name={iconName} size={26} tint="ink" />
                </Pressable>
              </View>
            );
          }

          return (
            <Pressable
              key={route.key}
              style={({ pressed }) => [styles.item, pressed && !focused && styles.itemPressed]}
              onPress={onPress}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              hitSlop={6}
            >
              {focused ? <Animated.View entering={FadeIn.duration(180)} style={styles.activeDot} /> : null}
              <Icon
                name={iconName}
                size={23}
                tint={focused ? 'gold' : 'white'}
                style={focused ? undefined : styles.iconIdle}
              />
              <Text style={[styles.label, focused && styles.labelActive]} numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const BAR_HEIGHT = 68;

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.bg,
    paddingHorizontal: 14,
    paddingTop: 6,
  },
  bar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    height: BAR_HEIGHT,
    borderRadius: radius.xl + 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 6,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, height: BAR_HEIGHT },
  itemPressed: { opacity: 0.7 },
  iconIdle: { opacity: 0.45 },
  label: { fontFamily: fonts.medium, fontSize: 10.5, color: colors.ink3 },
  labelActive: { color: colors.gold2 },
  activeDot: {
    position: 'absolute',
    top: 8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gold,
  },
  centerSlot: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  centerBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    marginTop: -26,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: colors.bg,
  },
  centerBtnFocused: { borderColor: colors.gold2 },
  centerBtnPressed: { transform: [{ scale: 0.94 }] },
});
