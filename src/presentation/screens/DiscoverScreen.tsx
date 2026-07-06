import React, { useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer, ScreenHeader } from '@/presentation/components/ScreenContainer';
import { SwipeCard, type SwipeCardHandle } from '@/presentation/components/SwipeCard';
import { EmptyState } from '@/presentation/components/EmptyState';
import { NudgeBanner } from '@/presentation/components/NudgeBanner';
import { CardSkeleton } from '@/presentation/components/Skeleton';
import { IconButton } from '@/presentation/components/IconButton';
import { MatchOverlay } from '@/presentation/components/MatchOverlay';
import { useDiscoverViewModel } from '@/presentation/hooks/useDiscoverViewModel';
import { colors, spacing, radius } from '@/core/theme';

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
            {/* دو لایه‌ی پشتی برای حسِ واقعیِ دسته‌کارت */}
            <View style={[styles.behind, styles.behindFar]} />
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
                  ? 'ارتباط با سرور ناموفق بود. اینترنتت را بررسی کن و دوباره تلاش کن.'
                  : 'کمی بعد دوباره سر بزن تا چهره‌های تازه ببینی.'
              }
              actionLabel="بارگذاریِ دوباره"
              onAction={vm.reload}
            />
          </View>
        )}
      </View>

      {vm.current ? (
        // ترتیبِ فیزیکی عمداً ثابت است: رد چپ، پسند راست — هم‌جهت با ژستِ سواایپ.
        <View style={styles.actions}>
          <IconButton
            icon="close"
            size={62}
            variant="surface"
            onPress={() => cardRef.current?.swipe('pass')}
            accessibilityLabel="رد"
          />
          <IconButton
            icon="heart-fill"
            size={68}
            variant="gold"
            onPress={() => cardRef.current?.swipe('like')}
            accessibilityLabel="پسند"
          />
        </View>
      ) : null}

      {vm.match ? (
        <MatchOverlay
          peerName={vm.match.peer?.name}
          peerPhotoUrl={vm.match.peer?.photoUrl}
          onChat={() => {
            const id = vm.match?.matchId;
            const name = vm.match?.peer?.name ?? '';
            vm.dismissMatch();
            if (id) router.push({ pathname: '/thread/[id]', params: { id: String(id), name } });
            else router.push('/chat');
          }}
          onDismiss={vm.dismissMatch}
        />
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.lg },
  deck: { flex: 1, marginVertical: spacing.md },
  behind: {
    position: 'absolute',
    top: 14,
    left: 10,
    right: 10,
    bottom: -4,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    opacity: 0.6,
  },
  behindFar: { top: 26, left: 22, right: 22, bottom: -8, opacity: 0.3 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xl + 4,
    paddingBottom: spacing.lg,
  },
});
