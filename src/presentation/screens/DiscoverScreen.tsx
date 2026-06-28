import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/presentation/components/ScreenContainer';
import { SwipeCard } from '@/presentation/components/SwipeCard';
import { EmptyState } from '@/presentation/components/EmptyState';
import { Loading } from '@/presentation/components/Loading';
import { useDiscoverViewModel } from '@/presentation/hooks/useDiscoverViewModel';
import { colors, fonts, fontSizes, spacing, radius } from '@/core/theme';

export function DiscoverScreen() {
  const vm = useDiscoverViewModel();

  if (vm.loading) return <Loading />;

  return (
    <ScreenContainer flush style={styles.wrap}>
      <View style={styles.head}>
        <Text style={styles.title}>کاوش</Text>
      </View>

      <View style={styles.deck}>
        {vm.current ? (
          <>
            <View style={styles.behind} />
            <SwipeCard key={vm.current.id} candidate={vm.current} onSwipe={vm.swipe} />
          </>
        ) : (
          <View style={styles.empty}>
            <EmptyState
              icon={vm.error ? '⚠️' : '✨'}
              title={vm.error ? 'اتصال برقرار نشد' : 'فعلاً کسی نمونده'}
              hint={
                vm.error
                  ? `ارتباط با سرور ناموفق بود (${vm.error}). اتصال و آدرسِ بک‌اند را بررسی کن.`
                  : 'کمی بعد دوباره سر بزن تا چهره‌های تازه ببینی.'
              }
            />
            <Pressable style={styles.reload} onPress={vm.reload}>
              <Text style={styles.reloadText}>بارگذاریِ دوباره</Text>
            </Pressable>
          </View>
        )}
      </View>

      {vm.current ? (
        <View style={styles.actions}>
          <Pressable style={[styles.fab, styles.pass]} onPress={() => vm.swipe('pass')}>
            <Ionicons name="close" size={30} color={colors.rose} />
          </Pressable>
          <Pressable style={[styles.fab, styles.like]} onPress={() => vm.swipe('like')}>
            <Ionicons name="heart" size={28} color={colors.onGold} />
          </Pressable>
        </View>
      ) : null}

      {vm.match ? (
        <View style={styles.overlay}>
          <Text style={styles.matchKicker}>هر دو همدیگه رو پسندیدید</Text>
          <Text style={styles.matchTitle}>با {vm.match.peer?.name} مَچ شدی!</Text>
          <Pressable
            style={styles.matchBtn}
            onPress={() => {
              const id = vm.match?.matchId;
              const name = vm.match?.peer?.name ?? '';
              vm.dismissMatch();
              if (id) {
                router.push({ pathname: '/thread/[id]', params: { id: String(id), name } });
              } else {
                router.push('/chat');
              }
            }}
          >
            <Text style={styles.matchBtnText}>شروعِ گفتگو</Text>
          </Pressable>
          <Pressable onPress={vm.dismissMatch}>
            <Text style={styles.matchLater}>بعداً</Text>
          </Pressable>
        </View>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16 },
  head: { paddingVertical: spacing.sm, alignItems: 'flex-end' },
  title: { fontFamily: fonts.bold, fontSize: fontSizes.xl, color: colors.gold },
  deck: { flex: 1, marginVertical: spacing.md },
  behind: {
    ...StyleSheet.absoluteFillObject,
    top: 14,
    marginHorizontal: 12,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    opacity: 0.5,
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  reload: {
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
  pass: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.rose },
  like: { backgroundColor: colors.gold },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,10,12,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  matchKicker: { fontFamily: fonts.medium, fontSize: fontSizes.md, color: colors.gold2 },
  matchTitle: { fontFamily: fonts.bold, fontSize: fontSizes.xxl, color: colors.ink, textAlign: 'center' },
  matchBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.xxl,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchBtnText: { fontFamily: fonts.bold, fontSize: fontSizes.md, color: colors.onGold },
  matchLater: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.ink3, marginTop: spacing.sm },
});
