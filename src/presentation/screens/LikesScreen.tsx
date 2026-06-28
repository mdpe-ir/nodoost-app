import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer, ScreenHeader } from '@/presentation/components/ScreenContainer';
import { GridSkeleton } from '@/presentation/components/Skeleton';
import { EmptyState } from '@/presentation/components/EmptyState';
import { Avatar } from '@/presentation/components/Avatar';
import { Button } from '@/presentation/components/Button';
import { Icon } from '@/presentation/components/Icon';
import { useLikesViewModel } from '@/presentation/hooks/useLikesViewModel';
import { faNum } from '@/core/utils/faNum';
import { colors, fonts, fontSizes, spacing, radius } from '@/core/theme';

export function LikesScreen() {
  const vm = useLikesViewModel();

  if (vm.loading) {
    return (
      <ScreenContainer>
        <ScreenHeader title="پسندها" />
        <GridSkeleton count={6} />
      </ScreenContainer>
    );
  }

  const data = vm.data;
  const count = data?.count ?? 0;

  if (vm.error || count === 0) {
    return (
      <ScreenContainer>
        <ScreenHeader title="پسندها" />
        <View style={styles.center}>
          <EmptyState
            icon="heart-fill"
            title={vm.error ? 'اتصال برقرار نشد' : 'هنوز کسی پسندت نکرده'}
            hint={vm.error ? 'دوباره تلاش کن.' : 'کاوش کن و پروفایلت را کامل کن تا دیده شوی.'}
          />
        </View>
      </ScreenContainer>
    );
  }

  const revealed = data?.revealed ?? false;
  const tiles = revealed
    ? data!.likers
    : Array.from({ length: Math.min(count, 12) }, (_, i) => ({ id: -i - 1 }));

  return (
    <ScreenContainer>
      <ScreenHeader title="پسندها" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.count}>{faNum(count)} نفر تو را پسندیده‌اند</Text>

        {!revealed ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>
              برای دیدنِ این‌که چه کسانی پسندت کرده‌اند، به سطحِ طلایی ارتقا بده.
            </Text>
            <Button label="ارتقای عضویت" onPress={() => router.push('/profile')} style={styles.bannerBtn} />
          </View>
        ) : null}

        <View style={styles.grid}>
          {tiles.map((t) => {
            const liker = revealed ? (t as { id: number; name?: string; photoUrl?: string; age?: number }) : null;
            return (
              <View key={t.id} style={styles.tile}>
                <View>
                  <View style={!revealed && styles.locked}>
                    <Avatar uri={liker?.photoUrl} name={revealed ? liker?.name : '؟'} size={96} ring={revealed} />
                  </View>
                  {!revealed ? (
                    <View style={styles.lockOverlay}>
                      <Icon name="lock" size={22} tint="gold" />
                    </View>
                  ) : null}
                </View>
                <Text style={styles.tileName} numberOfLines={1}>
                  {revealed ? liker?.name ?? 'بی‌نام' : 'پنهان'}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center' },
  count: { fontFamily: fonts.medium, fontSize: fontSizes.md, color: colors.ink2, textAlign: 'right', marginBottom: spacing.lg },
  banner: {
    backgroundColor: colors.goldFaint,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  bannerText: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.gold2, textAlign: 'right', lineHeight: 22 },
  bannerBtn: { height: 46 },
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'flex-start' },
  tile: { width: 96, alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  locked: { opacity: 0.45 },
  lockOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  tileName: { fontFamily: fonts.regular, fontSize: fontSizes.xs, color: colors.ink2, maxWidth: 96 },
});
