import React, { useMemo, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { ScreenContainer, ScreenHeader } from '@/presentation/components/ScreenContainer';
import { UpgradeSheet } from '@/presentation/components/UpgradeSheet';
import { SwipeCard, type SwipeCardHandle } from '@/presentation/components/SwipeCard';
import { CardDeck } from '@/presentation/components/CardDeck';
import { EmptyState } from '@/presentation/components/EmptyState';
import { NudgeBanner } from '@/presentation/components/NudgeBanner';
import { InAppBanner } from '@/presentation/components/inapp/InAppBanner';
import { CardSkeleton } from '@/presentation/components/Skeleton';
import { IconButton } from '@/presentation/components/IconButton';
import { MatchOverlay } from '@/presentation/components/MatchOverlay';
import { useDiscoverViewModel } from '@/presentation/hooks/useDiscoverViewModel';
import { useSession } from '@/presentation/providers/SessionProvider';
import { spacing } from '@/core/theme';

export function DiscoverScreen() {
  const vm = useDiscoverViewModel();
  const { user } = useSession();
  const cardRef = useRef<SwipeCardHandle>(null);
  /**
   * یک مقدارِ مشترک برای کلِ صفحه: کارت می‌نویسدش، دسته و دکمه‌ها می‌خوانندش.
   * همه‌ی حرکت روی تردِ UI می‌ماند و هیچ‌کدام از این‌ها re-render نمی‌شوند.
   */
  const progress = useSharedValue(0);

  const myInterests = useMemo(() => user?.interests ?? [], [user?.interests]);

  /**
   * برگرداندنِ کارت ویژه‌ی طلایی (۴) به بالاست. دکمه برای همه دیده می‌شود ولی
   * برای سطحِ پایین‌تر پنجره‌ی ارتقا باز می‌کند، نه اینکه غیبش بزند: امکانی که
   * پنهان است فروخته نمی‌شود، و کاربر هم نمی‌فهمد چه چیزی را از دست می‌دهد.
   */
  const canRewind = (user?.tier ?? 1) >= 4 && Boolean(user?.isPlus);
  const [rewindLock, setRewindLock] = useState(false);
  const onUndo = () => (canRewind ? vm.undoLast() : setRewindLock(true));

  // بازکردنِ پروفایلِ کامل — همان‌جا دکمه‌های «ارسالِ پیام» و «پسند» هست.
  const openProfile = (id: number | string) =>
    router.push({ pathname: '/user/[id]', params: { id: String(id) } });

  // دکمه‌ها با کشیدن هم‌نفس می‌شوند: هرچه کارت به سمتِ پسند می‌رود، دکمه‌ی
  // پسند بزرگ‌تر و دکمه‌ی رد کم‌رنگ‌تر. کاربر ژست و دکمه را یک چیز می‌فهمد.
  const likeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(progress.value, [0, 1], [1, 1.16], Extrapolation.CLAMP) }],
    opacity: interpolate(progress.value, [-1, 0], [0.45, 1], Extrapolation.CLAMP),
  }));
  const passStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(progress.value, [-1, 0], [1.16, 1], Extrapolation.CLAMP) }],
    opacity: interpolate(progress.value, [0, 1], [1, 0.45], Extrapolation.CLAMP),
  }));

  if (vm.loading) {
    return (
      <ScreenContainer flush style={styles.wrap}>
        <ScreenHeader title="کاوش" membership />
        <CardSkeleton />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer flush style={styles.wrap}>
      <ScreenHeader title="کاوش" membership />

      {/* بنرِ ادمین بالای همه‌چیز می‌نشیند، ولی زیرِ نیازهای عملیاتیِ خودِ اپ
          (مثلِ روشن‌کردنِ موقعیت) نمی‌آید — آن یکی مسدودکننده‌ی واقعیِ تجربه است. */}
      <InAppBanner />

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
          <CardDeck upcoming={vm.upcoming} progress={progress}>
            <SwipeCard
              ref={cardRef}
              key={vm.current.id}
              candidate={vm.current}
              onSwipe={vm.swipe}
              onOpenProfile={() => openProfile(vm.current!.id)}
              progress={progress}
              sharedInterests={myInterests}
            />
          </CardDeck>
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
          {/*
           * برگرداندن سمتِ چپِ ردیف است، دورتر از پسند — نزدیک‌کردنش به
           * دکمه‌ی اصلی یعنی فشارِ اشتباهی روی کنشی که خودش برای رفعِ فشارِ
           * اشتباهی ساخته شده.
           */}
          <IconButton
            icon="rewind"
            size={46}
            variant="surface"
            disabled={!vm.canUndo || vm.undoing}
            onPress={onUndo}
            accessibilityLabel={canRewind ? 'برگرداندنِ آخرین کارت' : 'برگرداندن — ویژه‌ی سطحِ طلایی'}
          />
          <Animated.View style={passStyle}>
            <IconButton
              icon="close"
              size={62}
              variant="surface"
              feedback="commit"
              onPress={() => cardRef.current?.swipe('pass')}
              accessibilityLabel="رد"
            />
          </Animated.View>
          <IconButton
            icon="tab-profile"
            size={54}
            variant="ghost"
            onPress={() => openProfile(vm.current!.id)}
            accessibilityLabel="دیدنِ پروفایل و پیام"
          />
          <Animated.View style={likeStyle}>
            <IconButton
              icon="heart-fill"
              size={68}
              variant="gold"
              feedback="commit"
              onPress={() => cardRef.current?.swipe('like')}
              accessibilityLabel="پسند"
            />
          </Animated.View>
        </View>
      ) : null}

      {vm.match ? (
        <MatchOverlay
          peerName={vm.match.peer?.name}
          peerPhotoUrl={vm.match.peer?.photoUrl}
          onChat={() => {
            const id = vm.match?.matchId;
            const name = vm.match?.peer?.name ?? '';
            const peerId = vm.match?.peer?.id;
            const photoUrl = vm.match?.peer?.photoUrl;
            const peerTier = vm.match?.peer?.tier;
            vm.dismissMatch();
            if (id) router.push({
              pathname: '/thread/[id]',
              params: { id: String(id), name, peerId: peerId ? String(peerId) : '', photoUrl: photoUrl ?? '', peerTier: peerTier ? String(peerTier) : '' },
            });
            else router.push('/chat');
          }}
          onDismiss={vm.dismissMatch}
        />
      ) : null}

      {/* سقفِ پسندِ روزانه — تا پیش از این بی‌صدا رد می‌شد. */}
      <UpgradeSheet visible={vm.limitHit} onClose={vm.dismissLimit} quotaKey="like" />

      <UpgradeSheet
        visible={rewindLock}
        onClose={() => setRewindLock(false)}
        requiredTier={4}
        title="برگرداندنِ کارت"
        message="با سطحِ طلایی می‌توانی آخرین کارتی که رد کرده‌ای را برگردانی."
        feature="برگرداندنِ کارت"
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.lg },
  deck: { flex: 1, marginVertical: spacing.md },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
    paddingBottom: spacing.lg,
  },
});
