import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  type LayoutChangeEvent,
} from 'react-native';
import { PressableScale } from '@/presentation/components/PressableScale';
import Animated, {
  FadeIn,
  FadeOut,
  runOnJS,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import {
  CollapsingHeaderTitle,
  ScreenContainer,
  ScreenHeader,
} from '@/presentation/components/ScreenContainer';
import { ProfileSkeleton } from '@/presentation/components/Skeleton';
import { Button } from '@/presentation/components/Button';
import { Icon, type IconName } from '@/presentation/components/Icon';
import { PhotoPicker } from '@/presentation/components/PhotoPicker';
import { ProfilePhotoSheet } from '@/presentation/components/ProfilePhotoSheet';
import { useQuota } from '@/presentation/providers/QuotaProvider';
import { QuotaMeter } from '@/presentation/components/QuotaMeter';
import { tierName } from '@/presentation/components/TierBadge';
import { RankBadge } from '@/presentation/components/RankBadge';
import { RankSheet } from '@/presentation/components/RankSheet';
import { maxPhotosForTier } from '@/presentation/tiers/tierFeatures';
import { useProfileViewModel } from '@/presentation/hooks/useProfileViewModel';
import { mediaUrl } from '@/core/http/mediaUrl';
import { faNum } from '@/core/utils/faNum';
import { faJalali, daysUntil } from '@/core/utils/time';
import { colors, fonts, fontSizes, lineHeights, spacing, radius, shadow, gradients } from '@/core/theme';

/**
 * صفحه‌ی «من» — سرصفحه‌ی حساب، نه انبارِ همه‌چیز.
 *
 * پیش‌تر این یک صفحه هم‌زمان پنجْ کار می‌کرد: هویت، اشتراک، سهمیه، امتیاز، و
 * سه زبانه‌ای که مدیریتِ عکس، فرمِ ویرایش و شش گروهِ تنظیمات را در خود داشت.
 * چون همه‌ی این‌ها کارتِ هم‌شکلِ طلایی بودند، هیچ‌کدام مهم به نظر نمی‌رسید و
 * کاربر «خریدِ اشتراک»، «ماموریت‌ها»، «تنظیمات» و «تغییرِ عکس» را پیدا نمی‌کرد.
 *
 * حالا هر کار مقصدِ خودش را دارد (‎/edit-profile‎، ‎/photos‎، ‎/settings‎،
 * ‎/plans‎، ‎/missions‎) و این صفحه فقط وضعیت را نشان می‌دهد و راه را نشان
 * می‌دهد. یک کنشِ طلایی بیشتر در صفحه نیست: ارتقای اشتراک. بقیه آرام‌اند.
 */

/** همه‌ی مسیرهای ارتقا به یک مقصد می‌روند: صفحه‌ی سطح‌ها، با زمینه‌ی امکانِ قفل. */
const goToPlans = (required?: number, feature?: string) =>
  router.push({
    pathname: '/plans',
    params: {
      ...(required ? { required: String(required) } : null),
      ...(feature ? { feature } : null),
    },
  });

/**
 * لینک‌های قدیمیِ ‎/profile?tab=…‎ (از اعلان‌ها، پیام‌های درون‌برنامه‌ای و
 * نسخه‌های نصب‌شده‌ی قبلی) هنوز در گردش‌اند؛ هرکدام به صفحه‌ی تازه‌اش می‌رود.
 */
const LEGACY_TAB: Record<string, Href> = {
  photos: '/photos' as Href,
  about: '/edit-profile' as Href,
  settings: '/settings' as Href,
  plans: '/plans' as Href,
};

/** یک ستونِ آماری — عدد و برچسبِ کوتاه، با مقصدِ خودش. */
function Stat({ value, label, onPress }: { value: string; label: string; onPress: () => void }) {
  return (
    <PressableScale
      scaleTo={0.9}
      feedback="select"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      style={styles.stat}
    >
      <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
    </PressableScale>
  );
}

/** کاشیِ دسترسیِ سریع — آیکن، عنوان و یک خطِ توضیح. */
function QuickTile({
  icon,
  title,
  hint,
  onPress,
}: {
  icon: IconName;
  title: string;
  hint: string;
  onPress: () => void;
}) {
  return (
    <PressableScale
      scaleTo={0.98}
      feedback="select"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={styles.tile}
    >
      <View style={styles.tileIcon}>
        <Icon name={icon} size={18} tint="gold" />
      </View>
      <Text style={styles.tileTitle} numberOfLines={1}>{title}</Text>
      <Text style={styles.tileHint} numberOfLines={2}>{hint}</Text>
    </PressableScale>
  );
}

export function ProfileScreen() {
  const vm = useProfileViewModel();
  const { quota } = useQuota();

  const [rankSheet, setRankSheet] = useState(false);
  const [photoSheetOpen, setPhotoSheetOpen] = useState(false);
  const setPhotoError = vm.setPhotoError;
  const openPhotoSheet = useCallback(() => {
    setPhotoError(null);
    setPhotoSheetOpen(true);
  }, [setPhotoError]);

  /*
   * — نشانه‌ی «هنوز ادامه دارد» —
   * صفحه از کارت ساخته شده و لبه‌ی پایینِ نمایشگر معمولاً درست سرِ مرزِ یک کارت
   * می‌افتد؛ نتیجه این‌که صفحه «تمام‌شده» به نظر می‌رسید و کاربر اسکرول نمی‌کرد.
   * این نشانه فقط وقتی هست که واقعاً چیزی پایین‌تر مانده باشد، و به‌محضِ رسیدن
   * به ته صفحه خودش می‌رود.
   */
  const geom = useRef({ viewport: 0, content: 0, offset: 0 });
  const [hasMore, setHasMore] = useState(false);
  const syncHasMore = useCallback(() => {
    const g = geom.current;
    if (!g.viewport || !g.content) return;
    const scrollable = g.content > g.viewport + 24;
    const atEnd = g.offset + g.viewport >= g.content - 32;
    setHasMore(scrollable && !atEnd);
  }, []);
  /**
   * موقعیتِ اسکرول برای کوچک‌شدنِ عنوان — روی تردِ UI می‌ماند تا هدر با
   * اسکرولِ تند هم نلرزد.
   */
  const scrollY = useSharedValue(0);

  // هندسه‌ی اسکرول (برای نشانه‌ی «ادامه دارد») هنوز سمتِ JS لازم است.
  const reportGeom = useCallback(
    (offset: number, viewport: number, content: number) => {
      geom.current.offset = offset;
      geom.current.viewport = viewport;
      geom.current.content = content;
      syncHasMore();
    },
    [syncHasMore],
  );

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
    runOnJS(reportGeom)(e.contentOffset.y, e.layoutMeasurement.height, e.contentSize.height);
  });
  const onScrollLayout = useCallback(
    (e: LayoutChangeEvent) => {
      geom.current.viewport = e.nativeEvent.layout.height;
      syncHasMore();
    },
    [syncHasMore],
  );
  const onContentSize = useCallback(
    (_w: number, h: number) => {
      geom.current.content = h;
      syncHasMore();
    },
    [syncHasMore],
  );

  const params = useLocalSearchParams<{ tab?: string }>();
  useEffect(() => {
    const dest = params.tab ? LEGACY_TAB[params.tab] : undefined;
    if (!dest) return;
    // پارامتر را مصرف‌شده پاک می‌کنیم تا با بازگشت دوباره پرتاب نشویم.
    router.setParams({ tab: '' });
    router.push(dest);
  }, [params.tab]);

  if (vm.loading) {
    return (
      <ScreenContainer>
        <ScreenHeader title="من" support settings />
        <ProfileSkeleton />
      </ScreenContainer>
    );
  }

  const user = vm.user;
  const primary = vm.photos.find((p) => p.isPrimary) ?? vm.photos[0];
  const heroUri = mediaUrl(primary?.url);
  const userTier = user?.tier ?? 1;
  const activeTierName = tierName(userTier) || 'رایگان';
  const maxPhotos = maxPhotosForTier(userTier);
  // عکس‌های ردشده در سقف حساب نمی‌شوند (مطابقِ سرور).
  const countedPhotos = vm.photos.filter((p) => p.status !== 'rejected').length;
  const canAddPhoto = countedPhotos < maxPhotos;
  const isTrial = user?.subscriptionStatus === 'trial' || user?.subscriptionProvider === 'trial';
  const expiry = faJalali(user?.subscriptionUntil);
  const remainingDays = daysUntil(user?.subscriptionUntil);

  // — پیشرفتِ رتبه: از کفِ رتبه‌ی فعلی تا کفِ رتبه‌ی بعدی —
  const pts = user?.points;
  const rankSpan = pts?.rank && pts?.nextRank ? pts.nextRank.minPoints - pts.rank.minPoints : 0;
  const rankProgress =
    rankSpan > 0 ? Math.max(0.04, Math.min(1, (pts!.earned - pts!.rank!.minPoints) / rankSpan)) : 1;

  return (
    <ScreenContainer>
      <ScreenHeader
        title="من"
        support
        settings
        titleSlot={<CollapsingHeaderTitle title="من" scrollY={scrollY} />}
      />
      <Animated.ScrollView
        contentContainerStyle={styles.scroll}
        // نوارِ اسکرولِ وب روی عنوانِ بخش‌ها می‌افتد؛ نشانه‌ی «بکش پایین» کارِ
        // اعلامِ ادامه‌ی صفحه را بهتر و بدونِ این عارضه انجام می‌دهد.
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        onLayout={onScrollLayout}
        onContentSizeChange={onContentSize}
        scrollEventThrottle={32}
      >
        {/* ۱ — هویت: چهره، نام، رتبه، معرفیِ کوتاه — */}
        <View style={styles.idRow}>
          <PressableScale
            scaleTo={0.94}
            feedback="tap"
            onPress={openPhotoSheet}
            style={[styles.avatarRing, shadow.gold]}
            accessibilityRole="button"
            accessibilityLabel="تغییرِ عکسِ پروفایل"
          >
            {heroUri ? (
              <Image source={{ uri: heroUri }} style={styles.avatar} contentFit="cover" transition={200} cachePolicy="memory-disk" />
            ) : (
              <View style={[styles.avatar, styles.avatarEmpty]}>
                <Text style={styles.avatarInitial}>{(user?.name || '؟').charAt(0)}</Text>
              </View>
            )}
            <View style={styles.avatarBadge}>
              <Icon name="edit" size={13} tint="ink" />
            </View>
          </PressableScale>

          <View style={styles.idBody}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>{user?.name ?? 'بدونِ نام'}</Text>
              {user?.verified ? <Icon name="shield-check" size={16} tint="gold" /> : null}
            </View>
            <RankBadge rank={user?.points?.rank} height={20} onPress={() => setRankSheet(true)} />
            <Text style={styles.bio} numberOfLines={2}>
              {user?.bio?.trim() || 'هنوز چیزی درباره‌ی خودت ننوشته‌ای.'}
            </Text>
          </View>
        </View>

        <Button
          label="ویرایشِ پروفایل"
          icon="edit"
          size="md"
          variant="ghost"
          onPress={() => router.push('/edit-profile' as Href)}
          style={styles.editBtn}
        />
        {/* آپلود از آواتار هم ممکن است؛ اگر شکست بخورد باید همین‌جا دیده شود. */}
        {vm.photoError ? <Text style={styles.photoError}>{vm.photoError}</Text> : null}

        {/* ۲ — آمار: هر عدد مقصدِ خودش را دارد — */}
        <View style={styles.statsCard}>
          <Stat value={faNum(vm.photos.length)} label="عکس" onPress={() => router.push('/photos' as Href)} />
          <View style={styles.statDivider} />
          <Stat value={faNum(vm.followersCount)} label="دنبال‌کننده" onPress={() => router.push('/followers' as Href)} />
          <View style={styles.statDivider} />
          <Stat value={faNum(vm.followingCount)} label="دنبال‌شده" onPress={() => router.push('/followers?tab=following' as Href)} />
          <View style={styles.statDivider} />
          <Stat value={faNum(vm.viewersCount)} label="بازدید" onPress={() => router.push('/viewers' as Href)} />
        </View>

        {/* ۳ — ماموریت‌ها: راهِ رایگانِ رسیدن به همان امکاناتی که پول می‌خواهند.
            عمداً *بالای* سهمیه است — کاربر باید قبل از دیدنِ سقف‌ها بداند راهِ
            بازکردنشان بدونِ پرداخت هم وجود دارد. */}
        {pts ? (
          <>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>ماموریت‌ها و امتیاز</Text>
            </View>
            <View style={styles.pointsCard}>
              <View style={styles.pointsHead}>
                <View style={styles.pointsIcon}>
                  <Icon name="star" size={20} tint="gold" />
                </View>
                <View style={styles.pointsHeadBody}>
                  <Text style={styles.pointsBalance}>{`${faNum(pts.balance)} امتیاز`}</Text>
                  <Text style={styles.pointsRank}>
                    {pts.rank ? `رتبه‌ی ${pts.rank.name}` : 'امتیازِ من'}
                  </Text>
                </View>
              </View>

              <View style={styles.pointsTrack}>
                <View style={[styles.pointsFill, { width: `${Math.round(rankProgress * 100)}%` }]} />
              </View>
              <Text style={styles.pointsHint}>
                {pts.nextRank
                  ? `${faNum(pts.toNext)} امتیاز تا رتبه‌ی «${pts.nextRank.name}»`
                  : 'به بالاترین رتبه رسیده‌ای.'}
              </Text>
              <Text style={styles.pointsLead}>
                ماموریت‌ها، جوایز و جدولِ رتبه‌بندی به تبِ «قهرمانی» منتقل شده‌اند.
              </Text>
              <Button
                label="رفتن به قهرمانی"
                icon="star"
                size="md"
                variant="ghost"
                onPress={() => router.push('/arena' as Href)}
              />
            </View>
          </>
        ) : null}

        {/* ۴ — اشتراک و سهمیه: تنها کنشِ طلاییِ صفحه — */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>اشتراکِ من</Text>
        </View>
        <View style={[styles.statusCard, user?.isPlus && styles.statusCardPlus]}>
          <PressableScale
            scaleTo={0.98}
            feedback="select"
            onPress={() => goToPlans()}
            accessibilityRole="button"
            accessibilityLabel={user?.isPlus ? 'تمدید یا ارتقای اشتراک' : 'خریدِ اشتراک'}
            style={styles.statusHead}
          >
            {!user?.isPlus ? (
              <LinearGradient colors={gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            ) : null}
            <View style={[styles.statusIcon, user?.isPlus && styles.statusIconPlus]}>
              <Icon name="diamond-fill" size={20} tint={user?.isPlus ? 'gold' : 'ink'} />
            </View>
            <View style={styles.statusBody}>
              <Text style={[styles.statusTitle, !user?.isPlus && styles.onGoldTitle]}>
                {user?.isPlus ? `اشتراکِ ${activeTierName}${isTrial ? ' (آزمایشی)' : ''}` : 'اشتراکِ رایگان'}
              </Text>
              <Text style={[styles.statusSub, !user?.isPlus && styles.onGoldSub]}>
                {user?.isPlus
                  ? expiry
                    ? `تا ${expiry}${remainingDays > 0 ? ` · ${faNum(remainingDays)} روزِ باقی‌مانده` : ''}`
                    : 'برای تمدید یا ارتقا بزن'
                  : 'پسندِ بیشتر، دیدنِ علاقه‌مندان و گفتگوی نامحدود'}
              </Text>
            </View>
            <View style={[styles.statusPill, user?.isPlus && styles.statusPillPlus]}>
              <Text style={[styles.statusPillText, user?.isPlus && styles.statusPillTextPlus]}>
                {user?.isPlus ? 'تمدید' : 'ارتقا'}
              </Text>
            </View>
          </PressableScale>

          {/* «چه داری» بالا، «چقدر مانده» پایین — همان‌جایی که کاربر می‌فهمد
              سهمیه‌ای در کار است، راهِ بازکردنش هم یک لمس فاصله دارد. */}
          {quota?.items.length ? (
            <View style={styles.quotaBox}>
              {quota.items.map((it) => (
                <QuotaMeter key={it.key} item={it} quota={quota} />
              ))}
            </View>
          ) : null}
        </View>

        {/* ۵ — دسترسیِ سریع: مقصدهایی که کاربر بیشتر از همه دنبالشان می‌گشت —
            «تنظیمات» آخر و تمام‌عرض است؛ در ردیفِ فرد تنها می‌ماند و کشیده‌شدنش
            بهتر از یک جای خالی در کنارش است. */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>دسترسیِ سریع</Text>
        </View>
        <View style={styles.tiles}>
          <QuickTile
            icon="tab-likes"
            title="پسندها"
            hint="چه کسانی را پسندیده‌ای و چه کسانی تو را"
            onPress={() => router.push('/likes')}
          />
          <QuickTile
            icon="edit"
            title="عکس‌های من"
            hint={`${faNum(countedPhotos)} از ${faNum(maxPhotos)} — افزودن، حذف و عکسِ اصلی`}
            onPress={() => router.push('/photos' as Href)}
          />
          <QuickTile
            icon="send-fill"
            title="دعوت از دوستان"
            hint="با هر دعوت امتیاز بگیر"
            onPress={() => router.push('/invite' as Href)}
          />
          <QuickTile
            icon="headset"
            title="پشتیبانی"
            hint="سوال، مشکلِ پرداخت یا گزارشِ تخلف"
            onPress={() => router.push('/support' as Href)}
          />
          <QuickTile
            icon="menu"
            title="تنظیمات"
            hint="اعلان‌ها، حریمِ خصوصی و حساب"
            onPress={() => router.push('/settings' as Href)}
          />
        </View>
      </Animated.ScrollView>

      {hasMore ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(160)}
          style={styles.moreHint}
          pointerEvents="none"
        >
          {/* محوشدگی تا محتوای زیرِ نشانه ناگهانی قطع نشود. */}
          <LinearGradient colors={['rgba(11,9,16,0)', colors.bg]} style={StyleSheet.absoluteFill} />
          <View style={styles.moreChip}>
            <Icon name="chevron-down" size={13} tint="gold" />
            <Text style={styles.moreText}>بکش پایین</Text>
          </View>
        </Animated.View>
      ) : null}

      {/* برگه‌ی «عکسِ پروفایل» — انتخاب از میانِ عکس‌های موجود یا گرفتنِ عکسِ تازه. */}
      <ProfilePhotoSheet
        visible={photoSheetOpen}
        photos={vm.photos}
        busyId={vm.primaryBusyId}
        error={vm.photoError}
        canAdd={canAddPhoto}
        onSelect={vm.setPrimaryPhoto}
        onAddNew={() => {
          setPhotoSheetOpen(false);
          vm.addPhoto({ makePrimary: true });
        }}
        onDismiss={() => setPhotoSheetOpen(false)}
      />

      {/* برگه‌ی دوربین/گالری + ویرایشگرِ برش — همان جریانی که در تکمیلِ پروفایل است. */}
      <PhotoPicker
        visible={vm.pickerOpen}
        onClose={vm.closePicker}
        onPicked={vm.onPhotoPicked}
        onError={vm.setPhotoError}
      />

      <RankSheet
        visible={rankSheet}
        rank={pts?.rank}
        earned={pts?.earned}
        nextRank={pts?.nextRank}
        toNext={pts?.toNext}
        onDismiss={() => setRankSheet(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl },

  // — هویت —
  idRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.lg },
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: { width: 78, height: 78, borderRadius: 39, backgroundColor: colors.surface2 },
  avatarEmpty: { alignItems: 'center', justifyContent: 'center' },
  // نشانِ «ویرایش» روی لبه‌ی آواتار؛ حلقه‌ی هم‌رنگِ زمینه آن را از عکس جدا می‌کند.
  avatarBadge: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gold,
    borderWidth: 2,
    borderColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontFamily: fonts.bold, fontSize: 32, color: colors.goldSoft },
  idBody: { flex: 1, alignItems: 'flex-end', gap: spacing.xs },
  nameRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.xs },
  name: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    color: colors.ink,
    writingDirection: 'rtl',
  },
  bio: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  editBtn: { marginTop: spacing.lg },

  // — آمار —
  statsCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.rim,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: spacing.xs },
  statValue: { fontFamily: fonts.bold, fontSize: fontSizes.lg, color: colors.ink, textAlign: 'center' },
  statLabel: { fontFamily: fonts.regular, fontSize: fontSizes.xs, color: colors.ink3, textAlign: 'center' },
  statDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: colors.line },

  // — سرِ بخش‌ها —
  sectionHead: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  sectionLink: { fontFamily: fonts.medium, fontSize: fontSizes.xs, color: colors.gold2, writingDirection: 'rtl' },
  sectionValue: { fontFamily: fonts.bold, fontSize: fontSizes.sm, color: colors.gold2, writingDirection: 'rtl' },

  photoError: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.rose,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: spacing.sm,
  },

  // — اشتراک و سهمیه —
  statusCard: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.goldSoft,
    backgroundColor: colors.surface,
  },
  statusCardPlus: { borderColor: colors.line, borderTopColor: colors.rim },
  statusHead: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  statusIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIconPlus: { backgroundColor: colors.goldFaint, borderWidth: 1, borderColor: colors.goldSoft },
  statusBody: { flex: 1, alignItems: 'flex-end', gap: 2 },
  statusTitle: { fontFamily: fonts.bold, fontSize: fontSizes.md, color: colors.ink, textAlign: 'right', writingDirection: 'rtl' },
  statusSub: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  onGoldTitle: { color: colors.onGold },
  onGoldSub: { color: 'rgba(42,29,18,0.82)' },
  statusPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(42,29,18,0.9)',
  },
  statusPillPlus: { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.goldSoft },
  statusPillText: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.gold2 },
  statusPillTextPlus: { fontSize: fontSizes.xs },
  quotaBox: {
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },

  // — ماموریت‌ها و امتیاز —
  pointsCard: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    backgroundColor: colors.surface,
  },
  pointsHead: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  pointsIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.goldFaint,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointsHeadBody: { flex: 1, alignItems: 'flex-end' },
  pointsBalance: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
    color: colors.gold2,
    writingDirection: 'rtl',
  },
  pointsRank: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.ink3,
    writingDirection: 'rtl',
  },
  // راست‌به‌چپ: نوار از سمتِ راست پر می‌شود.
  pointsTrack: { height: 8, borderRadius: 4, backgroundColor: colors.line, flexDirection: 'row-reverse', overflow: 'hidden' },
  pointsFill: { height: 8, borderRadius: 4, backgroundColor: colors.gold },
  pointsHint: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  pointsLead: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
  },

  // — نشانه‌ی ادامه‌ی صفحه —
  moreHint: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 64,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: spacing.sm,
  },
  moreChip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.goldSoft,
  },
  moreText: { fontFamily: fonts.medium, fontSize: fontSizes.xs, color: colors.gold2, writingDirection: 'rtl' },

  // — دسترسیِ سریع —
  tiles: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm },
  tile: {
    // دو ستون: پایه‌ی زیرِ نصف + رشد، تا با gap دقیقاً دوتا در هر ردیف جا شود.
    flexBasis: '46%',
    flexGrow: 1,
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.rim,
    backgroundColor: colors.surface,
    alignItems: 'flex-end',
  },
  tileIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.goldFaint,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  tileTitle: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  tileHint: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
