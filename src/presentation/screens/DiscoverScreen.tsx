import React, { useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { ScreenContainer, ScreenHeader } from '@/presentation/components/ScreenContainer';
import { SwipeCard, type SwipeCardHandle } from '@/presentation/components/SwipeCard';
import { EmptyState } from '@/presentation/components/EmptyState';
import { NudgeBanner } from '@/presentation/components/NudgeBanner';
import { CardSkeleton } from '@/presentation/components/Skeleton';
import { Avatar } from '@/presentation/components/Avatar';
import { Icon } from '@/presentation/components/Icon';
import { useDiscoverViewModel } from '@/presentation/hooks/useDiscoverViewModel';
import { colors, fonts, fontSizes, spacing, radius, shadow } from '@/core/theme';

export function DiscoverScreen() {
  const vm = useDiscoverViewModel();
  const cardRef = useRef<SwipeCardHandle>(null);

  if (vm.loading) {
    return (
      <ScreenContainer flush style={styles.wrap}>
        <ScreenHeader title="کاوش" />
        <CardSkeleton />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer flush style={styles.wrap}>
      <ScreenHeader title="کاوش" />

      {vm.needsLocation ? (
        <NudgeBanner
          icon="shield"
          title="موقعیتت روشن نیست"
          hint="بدونِ موقعیت، دیگران تو را در کاوش نمی‌بینند. روشنش کن تا پیدات کنند."
          ctaLabel="روشن کردنِ موقعیت"
          busy={vm.locating}
          onPress={vm.enableLocation}
        />
      ) : null}

      <View style={styles.deck}>
        {vm.current ? (
          <>
            <View style={styles.behind} />
            <SwipeCard ref={cardRef} key={vm.current.id} candidate={vm.current} onSwipe={vm.swipe} />
          </>
        ) : (
          <View style={styles.empty}>
            <EmptyState
              icon={vm.error ? 'rewind' : 'star'}
              title={vm.error ? 'اتصال برقرار نشد' : 'فعلاً کسی نمونده'}
              hint={
                vm.error
                  ? `ارتباط با سرور ناموفق بود (${vm.error}). اتصال و آدرسِ بک‌اند را بررسی کن.`
                  : 'کمی بعد دوباره سر بزن تا چهره‌های تازه ببینی.'
              }
            />
            <Pressable style={styles.reload} onPress={vm.reload} accessibilityRole="button">
              <Icon name="rewind" size={16} tint="gold" />
              <Text style={styles.reloadText}>بارگذاریِ دوباره</Text>
            </Pressable>
          </View>
        )}
      </View>

      {vm.current ? (
        <View style={styles.actions}>
          <Pressable
            style={[styles.fab, styles.pass]}
            onPress={() => cardRef.current?.swipe('pass')}
            accessibilityRole="button"
            accessibilityLabel="رد"
          >
            <Icon name="close" size={28} tint="white" />
          </Pressable>
          <Pressable
            style={[styles.fab, styles.like, shadow.gold]}
            onPress={() => cardRef.current?.swipe('like')}
            accessibilityRole="button"
            accessibilityLabel="پسند"
          >
            <Icon name="heart-fill" size={26} tint="ink" />
          </Pressable>
        </View>
      ) : null}

      {vm.match ? (
        <Animated.View entering={FadeIn.duration(220)} style={styles.overlay}>
          <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.matchCard}>
            <Avatar uri={vm.match.peer?.photoUrl} name={vm.match.peer?.name} size={108} ring />
            <Text style={styles.matchKicker}>هر دو همدیگر را پسندیدید</Text>
            <Text style={styles.matchTitle}>با {vm.match.peer?.name} مَچ شدی!</Text>
            <Pressable
              style={[styles.matchBtn, shadow.gold]}
              onPress={() => {
                const id = vm.match?.matchId;
                const name = vm.match?.peer?.name ?? '';
                vm.dismissMatch();
                if (id) router.push({ pathname: '/thread/[id]', params: { id: String(id), name } });
                else router.push('/chat');
              }}
            >
              <Text style={styles.matchBtnText}>شروعِ گفتگو</Text>
            </Pressable>
            <Pressable onPress={vm.dismissMatch} hitSlop={10}>
              <Text style={styles.matchLater}>بعداً</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16 },
  deck: { flex: 1, marginVertical: spacing.md },
  behind: {
    position: 'absolute',
    top: 16,
    left: 12,
    right: 12,
    bottom: -2,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    opacity: 0.5,
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  reload: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    backgroundColor: colors.goldFaint,
  },
  reloadText: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.gold2 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingBottom: spacing.lg,
  },
  fab: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  pass: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  like: { backgroundColor: colors.gold },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(12,8,10,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  matchCard: { alignItems: 'center' },
  matchKicker: { fontFamily: fonts.regular, fontSize: fontSizes.md, color: colors.ink2, marginTop: spacing.lg, marginBottom: spacing.sm },
  matchTitle: { fontFamily: fonts.bold, fontSize: fontSizes.xxl, color: colors.gold2, textAlign: 'center', marginBottom: spacing.xl },
  matchBtn: {
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.xxl,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchBtnText: { fontFamily: fonts.bold, fontSize: fontSizes.md, color: colors.onGold },
  matchLater: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.ink3, marginTop: spacing.md },
});
