import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenContainer } from '@/presentation/components/ScreenContainer';
import { Loading } from '@/presentation/components/Loading';
import { Button } from '@/presentation/components/Button';
import { Icon } from '@/presentation/components/Icon';
import { TierBadge, tierName } from '@/presentation/components/TierBadge';
import { useProfileViewModel } from '@/presentation/hooks/useProfileViewModel';
import { mediaUrl } from '@/core/http/mediaUrl';
import { faPrice } from '@/core/utils/faNum';
import { colors, fonts, fontSizes, spacing, radius, gradients, shadow } from '@/core/theme';

export function ProfileScreen() {
  const vm = useProfileViewModel();

  if (vm.loading) return <Loading />;

  const user = vm.user;
  const primary = vm.photos.find((p) => p.isPrimary) ?? vm.photos[0];
  const heroUri = mediaUrl(primary?.url);

  return (
    <ScreenContainer flush>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <View style={[styles.heroRing, shadow.gold]}>
            {heroUri ? (
              <Image source={{ uri: heroUri }} style={styles.heroImg} contentFit="cover" transition={200} cachePolicy="memory-disk" />
            ) : (
              <View style={[styles.heroImg, styles.heroEmpty]}>
                <Text style={styles.heroInitial}>{(user?.name || '؟').charAt(0)}</Text>
              </View>
            )}
          </View>
          <Text style={styles.name}>{user?.name ?? 'بدونِ نام'}</Text>
          <View style={styles.tierRow}>
            <TierBadge tier={user?.tier ?? 1} />
            <Text style={styles.tierText}>سطحِ {tierName(user?.tier ?? 1) || 'پایه'}</Text>
          </View>
        </View>

        <Text style={styles.section}>عکس‌ها</Text>
        <View style={styles.grid}>
          {vm.photos.map((p) => {
            const uri = mediaUrl(p.url);
            return (
              <View key={p.id} style={styles.photoTile}>
                {uri ? <Image source={{ uri }} style={styles.photo} contentFit="cover" cachePolicy="memory-disk" /> : null}
                <Pressable style={styles.del} onPress={() => vm.deletePhoto(p.id)} disabled={vm.busy} hitSlop={6} accessibilityLabel="حذفِ عکس">
                  <Icon name="close" size={14} tint="white" />
                </Pressable>
              </View>
            );
          })}
          {vm.photos.length < 6 ? (
            <Pressable style={[styles.photoTile, styles.addTile]} onPress={vm.addPhoto} disabled={vm.busy} accessibilityLabel="افزودنِ عکس">
              <Icon name="plus" size={28} tint="gold" />
            </Pressable>
          ) : null}
        </View>

        <Text style={styles.section}>عضویت</Text>
        <View style={styles.tiers}>
          {vm.tiers.map((t) => (
            <View key={t.id} style={[styles.tierCard, shadow.soft]}>
              <View style={styles.tierInfo}>
                <Text style={styles.tierName}>{t.name}</Text>
                {t.priceToman != null ? (
                  <Text style={styles.tierPrice}>{faPrice(t.priceToman)} تومان</Text>
                ) : null}
              </View>
              <View style={styles.tierLeft}>
                <Pressable style={styles.buy} onPress={() => vm.buy(t.id)} accessibilityRole="button">
                  <LinearGradient colors={gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                  <Text style={styles.buyText}>خرید</Text>
                </Pressable>
                <Icon name="diamond-fill" size={18} tint="gold" />
              </View>
            </View>
          ))}
        </View>

        <Button label="خروج از حساب" variant="outline" onPress={vm.logout} style={styles.logout} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  hero: { alignItems: 'center', marginBottom: spacing.xl },
  heroRing: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 2,
    borderColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImg: { width: 116, height: 116, borderRadius: 58, backgroundColor: colors.surface2 },
  heroEmpty: { alignItems: 'center', justifyContent: 'center' },
  heroInitial: { fontFamily: fonts.bold, fontSize: 48, color: colors.goldSoft },
  name: { fontFamily: fonts.bold, fontSize: fontSizes.xl, color: colors.ink, marginTop: spacing.md },
  tierRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  tierText: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.ink3 },
  section: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    color: colors.ink,
    textAlign: 'right',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.md },
  photoTile: {
    width: 96,
    height: 120,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  photo: { width: '100%', height: '100%' },
  del: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(15,10,12,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTile: { alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderColor: colors.goldSoft },
  tiers: { gap: spacing.md },
  tierCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  tierInfo: { alignItems: 'flex-end', gap: 2 },
  tierLeft: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md },
  tierName: { fontFamily: fonts.bold, fontSize: fontSizes.md, color: colors.gold2 },
  tierPrice: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.ink2 },
  buy: {
    paddingHorizontal: spacing.xl,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  buyText: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.onGold },
  logout: { marginTop: spacing.xxl },
});
