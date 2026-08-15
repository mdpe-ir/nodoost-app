import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Icon, type IconName } from './Icon';
import { CountBadge } from './CountBadge';
import { PressableScale } from './PressableScale';
import { useBadges } from '@/presentation/providers/BadgesProvider';
import { colors, durations, fonts, gradients, radius, shadow, springs } from '@/core/theme';

// نگاشتِ نامِ مسیر به آیکنِ برند
const ICONS: Record<string, IconName> = {
  discover: 'tab-discover',
  nearby: 'map',
  chat: 'tab-chat',
  profile: 'tab-profile',
};

/** تبِ میانی — کنشِ برجسته‌ی «قهرمانی». */
const CENTER_ROUTE = 'arena';

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
 * نوارِ ناوبریِ شناور — چهار تب + کنشِ برجسته‌ی میانی (قهرمانی).
 * راست‌به‌چپ: کاوش سمتِ راست. چون اپ از forceRTL استفاده نمی‌کند،
 * ترتیب را خودمان با row-reverse می‌چینیم.
 *
 * نشانه‌ی تبِ فعال یک قرصِ طلاییِ کم‌رنگ است که پشتِ آیکن باز می‌شود، نه
 * نقطه‌ی ۴ پیکسلیِ قبلی. دلیلش صرفاً زیبایی نیست: در یک نوارِ پنج‌تایی،
 * نقطه‌ی ریز در نگاهِ گذرا دیده نمی‌شود و کاربر نمی‌داند کجای اپ است.
 */
export function BottomTabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  // نشانِ گفتگو = تعدادِ گفتگوهای دارای پیامِ خوانده‌نشده (نه تعدادِ پیام‌ها).
  const { badges } = useBadges();
  return (
    <View style={[styles.wrap, { paddingBottom: insets.bottom + 10 }]}>
      <View style={[styles.bar, shadow.card]}>
        {/*
         * گرادیانِ سطح به‌جای رنگِ تخت. `expo-glass-effect` عمداً استفاده نشده:
         * روی اندروید و وب فقط یک `View` خالی رندر می‌کند و
         * `isLiquidGlassAvailable()` هم `false` برمی‌گرداند — یعنی برای مخاطبِ
         * واقعیِ این اپ (کافه‌بازار + PWA) هیچ کاری نمی‌کند. شیشه‌ای که فقط در
         * دیف دیده شود و روی دستگاهِ کاربر نه، بدتر از نبودنش است.
         */}
        {/*
         * شعاعِ گوشه روی خودِ گرادیان است، نه `overflow: 'hidden'` روی نوار.
         * آن یکی دکمه‌ی برجسته‌ی وسط را — که با `marginTop` عمداً از نوار
         * بیرون می‌زند — از بالا می‌بُرید.
         */}
        <LinearGradient
          colors={gradients.surfaceRaised}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[StyleSheet.absoluteFill, styles.barFill]}
        />
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const label = descriptors[route.key]?.options.title ?? route.name;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          if (route.name === CENTER_ROUTE) {
            return (
              <View key={route.key} style={styles.centerSlot}>
                <PressableScale
                  onPress={onPress}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: focused }}
                  accessibilityLabel={label}
                  hitSlop={6}
                  scaleTo={0.9}
                  feedback="commit"
                  style={[styles.centerBtn, shadow.gold, focused && styles.centerBtnFocused]}
                >
                  <LinearGradient
                    colors={gradients.gold}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  {/* جامِ قهرمانی در پکِ آیکونِ برند نیست؛ تنها جای اپ که از
                      آیکونِ برداری استفاده می‌کنیم، و همین یک نقطه است. */}
                  <Ionicons name="trophy" size={26} color={colors.bg} />
                </PressableScale>
              </View>
            );
          }

          return (
            <TabItem
              key={route.key}
              focused={focused}
              label={label}
              icon={ICONS[route.name] ?? 'tab-discover'}
              badge={route.name === 'chat' ? badges.unreadThreads : 0}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
}

function TabItem({
  focused,
  label,
  icon,
  badge,
  onPress,
}: {
  focused: boolean;
  label: string;
  icon: IconName;
  badge: number;
  onPress: () => void;
}) {
  const active = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    // قرص با فنر باز می‌شود (جسم است) ولی رنگ با زمان عوض می‌شود (رویداد است).
    active.value = withSpring(focused ? 1 : 0, springs.snappy);
  }, [focused, active]);

  const pill = useAnimatedStyle(() => ({
    opacity: active.value,
    transform: [{ scale: 0.82 + active.value * 0.18 }],
  }));

  const content = useAnimatedStyle(() => ({
    transform: [{ translateY: -active.value * 1.5 }],
  }));

  const idleIcon = useAnimatedStyle(() => ({
    opacity: withTiming(focused ? 1 : 0.45, { duration: durations.instant }),
  }));

  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      hitSlop={6}
      scaleTo={0.93}
      feedback="select"
      style={styles.item}
    >
      <Animated.View style={[styles.pill, pill]} pointerEvents="none" />
      <Animated.View style={[styles.itemContent, content]}>
        {/* نشان باید به آیکن بچسبد، نه به ستونِ آیکن+برچسب (برچسب پهن‌تر است). */}
        <View>
          <Animated.View style={idleIcon}>
            <Icon name={icon} size={23} tint={focused ? 'gold' : 'white'} />
          </Animated.View>
          <CountBadge count={badge} style={styles.tabBadge} />
        </View>
        <Text style={[styles.label, focused && styles.labelActive]} numberOfLines={1}>
          {label}
        </Text>
      </Animated.View>
    </PressableScale>
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
    borderTopColor: colors.rim,
    paddingHorizontal: 6,
  },
  barFill: { borderRadius: radius.xl + 6 },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', height: BAR_HEIGHT },
  itemContent: { alignItems: 'center', justifyContent: 'center', gap: 3 },
  pill: {
    position: 'absolute',
    top: 8,
    bottom: 8,
    left: 6,
    right: 6,
    borderRadius: radius.md,
    backgroundColor: colors.goldFaint,
    borderWidth: 1,
    borderColor: colors.goldSoft,
  },
  // نوارِ تب سطحِ روشن‌تری دارد؛ قابِ نشان با آن هم‌رنگ می‌شود.
  tabBadge: { top: -5, left: -8, borderColor: colors.surface },
  label: { fontFamily: fonts.medium, fontSize: 10.5, color: colors.ink3 },
  labelActive: { color: colors.gold2 },
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
});
