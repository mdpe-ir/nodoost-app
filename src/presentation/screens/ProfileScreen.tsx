import React from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { ScreenContainer, ScreenHeader, PAGE_PADDING } from '@/presentation/components/ScreenContainer';
import { ProfileSkeleton } from '@/presentation/components/Skeleton';
import { Button } from '@/presentation/components/Button';
import { Icon } from '@/presentation/components/Icon';
import { TierBadge, tierName } from '@/presentation/components/TierBadge';
import { useProfileViewModel } from '@/presentation/hooks/useProfileViewModel';
import { mediaUrl } from '@/core/http/mediaUrl';
import { faNum, faPrice } from '@/core/utils/faNum';
import { colors, fonts, fontSizes, lineHeights, spacing, radius, shadow } from '@/core/theme';

const GAP = spacing.md;
const COLS = 3;

function Section({ title }: { title: string }) {
  return <Text style={styles.section}>{title}</Text>;
}

export function ProfileScreen() {
  const vm = useProfileViewModel();
  const { width } = useWindowDimensions();
  const tileW = (Math.min(width, 560) - PAGE_PADDING * 2 - GAP * (COLS - 1)) / COLS;
  const tileH = tileW * 1.25;

  if (vm.loading) {
    return (
      <ScreenContainer>
        <ScreenHeader title="من" />
        <ProfileSkeleton />
      </ScreenContainer>
    );
  }

  const user = vm.user;
  const primary = vm.photos.find((p) => p.isPrimary) ?? vm.photos[0];
  const heroUri = mediaUrl(primary?.url);
  const version = Constants.expoConfig?.version;

  return (
    <ScreenContainer flush>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <ScreenHeader title="من" />

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
          <View style={styles.nameRow}>
            <Text style={styles.name}>{user?.name ?? 'بدونِ نام'}</Text>
            {user?.verified ? <Icon name="shield-check" size={18} tint="gold" /> : null}
          </View>
          <View style={styles.tierRow}>
            <TierBadge tier={user?.tier ?? 1} />
            <Text style={styles.tierText}>سطحِ {tierName(user?.tier ?? 1) || 'پایه'}</Text>
          </View>
        </View>

        {/* ورودی به پسندها — چه کسانی پسندت کرده‌اند و چه کسانی را پسندیده‌ای */}
        <Pressable
          style={({ pressed }) => [styles.likesEntry, pressed && styles.likesEntryPressed]}
          onPress={() => router.push('/likes')}
          accessibilityRole="button"
          accessibilityLabel="پسندها"
        >
          <View style={styles.likesBadge}>
            <Icon name="tab-likes" size={20} tint="gold" />
          </View>
          <View style={styles.likesBody}>
            <Text style={styles.likesTitle}>پسندها</Text>
            <Text style={styles.likesHint}>چه کسانی پسندت کرده‌اند و چه کسانی را پسندیده‌ای</Text>
          </View>
          <Icon name="chevron-prev" size={16} tint="gold" />
        </Pressable>

        <Section title="درباره‌ی من" />
        <View style={styles.editCard}>
          <Text style={styles.fieldLabel}>نام</Text>
          <TextInput
            style={styles.input}
            value={vm.draftName}
            onChangeText={vm.setDraftName}
            placeholder="نامت را بنویس"
            placeholderTextColor={colors.ink3}
            textAlign="right"
            maxLength={40}
          />
          <Text style={styles.fieldLabel}>درباره‌ات</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={vm.draftBio}
            onChangeText={vm.setDraftBio}
            placeholder="چند کلمه از خودت بنویس…"
            placeholderTextColor={colors.ink3}
            textAlign="right"
            multiline
            maxLength={160}
          />
          <Text style={styles.bioCount}>{faNum(vm.draftBio.length)} / {faNum(160)}</Text>
          {vm.saveError ? (
            <Text style={styles.saveError}>ذخیره ناموفق بود. دوباره تلاش کن.</Text>
          ) : null}
          {vm.dirty ? (
            <Button
              label="ذخیره‌ی تغییرات"
              size="md"
              onPress={vm.saveProfile}
              loading={vm.saving}
              disabled={vm.draftName.trim().length < 2}
            />
          ) : null}
        </View>

        <Section title="عکس‌ها" />
        <Text style={styles.photoNote}>
          عکس‌های تازه پیش از نمایش به دیگران توسطِ مدیر بررسی می‌شوند. تا زمانِ تأیید فقط خودت آن‌ها را می‌بینی.
        </Text>
        <View style={styles.grid}>
          {vm.photos.map((p) => {
            const uri = mediaUrl(p.url);
            const pending = p.status === 'pending' || p.status == null;
            const rejected = p.status === 'rejected';
            return (
              <View key={p.id} style={[styles.photoTile, { width: tileW, height: tileH }]}>
                {uri ? (
                  <Image
                    source={{ uri }}
                    style={[styles.photo, (pending || rejected) && styles.photoDim]}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                  />
                ) : null}
                {p.isPrimary ? (
                  <View style={styles.primaryTag}>
                    <Text style={styles.primaryTagText}>اصلی</Text>
                  </View>
                ) : null}
                {pending ? (
                  <View style={styles.statusTag}>
                    <Icon name="clock" size={11} tint="ink" />
                    <Text style={styles.statusText}>در انتظارِ تأیید</Text>
                  </View>
                ) : null}
                {rejected ? (
                  <View style={[styles.statusTag, styles.statusTagReject]}>
                    <Text style={styles.statusText}>رد شد</Text>
                  </View>
                ) : null}
                <Pressable
                  style={({ pressed }) => [styles.del, pressed && styles.delPressed]}
                  onPress={() => vm.deletePhoto(p.id)}
                  disabled={vm.busy}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel="حذفِ عکس"
                >
                  <Icon name="close" size={14} tint="white" />
                </Pressable>
              </View>
            );
          })}
          {vm.photos.length < 6 ? (
            <Pressable
              style={({ pressed }) => [
                styles.photoTile,
                styles.addTile,
                { width: tileW, height: tileH },
                pressed && styles.addTilePressed,
              ]}
              onPress={vm.addPhoto}
              disabled={vm.busy}
              accessibilityRole="button"
              accessibilityLabel="افزودنِ عکس"
            >
              <Icon name="plus" size={26} tint="gold" />
              <Text style={styles.addTileText}>افزودن</Text>
            </Pressable>
          ) : null}
        </View>

        <Section title="عضویت" />
        <View style={styles.tiers}>
          {vm.tiers.map((t) => {
            const current = t.level === (user?.tier ?? 1);
            return (
              <View key={t.id} style={[styles.tierCard, current && styles.tierCardCurrent, shadow.soft]}>
                <View style={styles.tierInfo}>
                  <View style={styles.tierNameRow}>
                    <Text style={styles.tierName}>{t.name}</Text>
                    {current ? (
                      <View style={styles.currentTag}>
                        <Text style={styles.currentTagText}>پلنِ فعلی</Text>
                      </View>
                    ) : null}
                  </View>
                  {t.priceToman != null ? (
                    <Text style={styles.tierPrice}>{faPrice(t.priceToman)} تومان</Text>
                  ) : null}
                </View>
                {!current ? (
                  <Button label="خرید" size="sm" onPress={() => vm.buy(t.id)} style={styles.buyBtn} />
                ) : (
                  <Icon name="check" size={20} tint="gold" />
                )}
              </View>
            );
          })}
        </View>

        <Button label="خروج از حساب" variant="outline" onPress={vm.logout} style={styles.logout} />
        {version ? (
          <Text style={styles.version}>نودوست · نسخه‌ی {faNum(version)}</Text>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: PAGE_PADDING, paddingBottom: spacing.xxl },
  hero: { alignItems: 'center', marginBottom: spacing.lg },
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
  nameRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  name: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
    color: colors.ink,
    writingDirection: 'rtl',
  },
  tierRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  tierText: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.ink3 },
  likesEntry: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.goldFaint,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    marginTop: spacing.sm,
  },
  likesEntryPressed: { opacity: 0.85 },
  likesBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  likesBody: { flex: 1, alignItems: 'flex-end' },
  likesTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.gold2,
    textAlign: 'right',
  },
  likesHint: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  section: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  editCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  fieldLabel: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.ink2, textAlign: 'right' },
  input: {
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: colors.ink,
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    writingDirection: 'rtl',
  },
  bioInput: { minHeight: 96, textAlignVertical: 'top' },
  bioCount: { fontFamily: fonts.regular, fontSize: fontSizes.xs, color: colors.ink3, textAlign: 'left' },
  saveError: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.rose, textAlign: 'right' },
  photoNote: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: lineHeights.xs,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: GAP },
  photoTile: {
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  photo: { width: '100%', height: '100%' },
  photoDim: { opacity: 0.45 },
  primaryTag: {
    position: 'absolute',
    top: 6,
    right: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    borderRadius: radius.pill,
    backgroundColor: colors.gold,
  },
  primaryTagText: { fontFamily: fonts.medium, fontSize: 10, color: colors.onGold },
  statusTag: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 3,
    backgroundColor: colors.goldFaint,
  },
  statusTagReject: { backgroundColor: 'rgba(120,20,30,0.55)' },
  statusText: { fontFamily: fonts.medium, fontSize: 10, color: colors.ink },
  del: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  delPressed: { transform: [{ scale: 0.9 }] },
  addTile: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderStyle: 'dashed',
    borderColor: colors.goldSoft,
  },
  addTilePressed: { backgroundColor: colors.goldFaint },
  addTileText: { fontFamily: fonts.medium, fontSize: fontSizes.xs, color: colors.gold2 },
  tiers: { gap: spacing.md },
  tierCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  tierCardCurrent: { borderColor: colors.goldSoft, backgroundColor: colors.surface2 },
  tierInfo: { flex: 1, alignItems: 'flex-end', gap: 2 },
  tierNameRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  tierName: { fontFamily: fonts.bold, fontSize: fontSizes.md, color: colors.gold2 },
  currentTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    borderRadius: radius.pill,
    backgroundColor: colors.goldFaint,
    borderWidth: 1,
    borderColor: colors.goldSoft,
  },
  currentTagText: { fontFamily: fonts.medium, fontSize: 10, color: colors.gold2 },
  tierPrice: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.ink2 },
  buyBtn: { paddingHorizontal: spacing.xl },
  logout: { marginTop: spacing.xxl },
  version: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.ink3,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
