import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Switch,
  ScrollView,
  Modal,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { ScreenContainer, ScreenHeader, PAGE_PADDING } from '@/presentation/components/ScreenContainer';
import { ProfileSkeleton } from '@/presentation/components/Skeleton';
import { Button } from '@/presentation/components/Button';
import { Icon } from '@/presentation/components/Icon';
import { AppVersionInfo } from '@/presentation/components/AppVersionInfo';
import { InterestPicker } from '@/presentation/components/InterestPicker';
import { PhotoPicker } from '@/presentation/components/PhotoPicker';
import { ProfilePhotoSheet } from '@/presentation/components/ProfilePhotoSheet';
import { useRemoteConfig } from '@/presentation/providers/RemoteConfigProvider';
import { useQuota } from '@/presentation/providers/QuotaProvider';
import { QuotaMeter } from '@/presentation/components/QuotaMeter';
import { tierName } from '@/presentation/components/TierBadge';
import { maxPhotosForTier } from '@/presentation/tiers/tierFeatures';
import { useProfileViewModel } from '@/presentation/hooks/useProfileViewModel';
import { mediaUrl } from '@/core/http/mediaUrl';
import { faNum } from '@/core/utils/faNum';
import { faJalali, daysUntil } from '@/core/utils/time';
import type { Photo } from '@/domain/entities';
import { colors, fonts, fontSizes, lineHeights, spacing, radius, shadow, gradients } from '@/core/theme';

const COLS = 3;
const GRID_GAP = 2;
/** بلندیِ نوارِ چسبانِ پشتیبانی + حاشیه‌هایش — هم برای جاباز‌کردن، هم برای محاسبه‌ی دیده‌شدن. */
const SUPPORT_DOCK_H = 96;

type Tab = 'photos' | 'about' | 'settings';
const TABS: { key: Tab; label: string }[] = [
  { key: 'photos', label: 'عکس‌ها' },
  { key: 'about', label: 'درباره' },
  { key: 'settings', label: 'تنظیمات' },
];
/** زبانه‌ی معتبر از پارامترِ مسیر (مثلاً ‎/profile?tab=settings). */
const asTab = (v: unknown): Tab | null =>
  typeof v === 'string' && TABS.some((t) => t.key === v) ? (v as Tab) : null;

/** همه‌ی مسیرهای ارتقا به یک مقصد می‌روند: صفحه‌ی سطح‌ها، با زمینه‌ی امکانِ قفل. */
const goToPlans = (required?: number, feature?: string) =>
  router.push({
    pathname: '/plans',
    params: {
      ...(required ? { required: String(required) } : null),
      ...(feature ? { feature } : null),
    },
  });

/** شهرهای حالتِ سفر (الماس) — مختصاتِ مرکزِ شهر. */
const TRAVEL_CITIES: { name: string; lat: number; lng: number }[] = [
  { name: 'تهران', lat: 35.6892, lng: 51.389 },
  { name: 'مشهد', lat: 36.2605, lng: 59.6168 },
  { name: 'اصفهان', lat: 32.6539, lng: 51.666 },
  { name: 'شیراز', lat: 29.5918, lng: 52.5837 },
  { name: 'تبریز', lat: 38.0962, lng: 46.2738 },
  { name: 'کرج', lat: 35.8327, lng: 50.9916 },
];

/** یک ستونِ آماری در ردیفِ بالای پروفایل — سبکِ اینستاگرام. */
function Stat({ value, label, onPress }: { value: string; label: string; onPress?: () => void }) {
  const inner = (
    <View style={styles.stat}>
      <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
    </View>
  );
  if (!onPress) return inner;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.statPress, pressed && styles.pressed]}>
      {inner}
    </Pressable>
  );
}

/**
 * ردیفِ تنظیمِ حریمِ خصوصیِ سطح‌دار — با سطحِ کافی سوییچ است، وگرنه قفل و
 * دعوت به ارتقا.
 */
function PrivacyRow({
  icon,
  title,
  hint,
  requiredTier,
  requiredName,
  userTier,
  value,
  saving,
  onChange,
  onUpgrade,
}: {
  icon: React.ComponentProps<typeof Icon>['name'];
  title: string;
  hint: string;
  requiredTier: number;
  requiredName: string;
  userTier: number;
  value: boolean;
  saving: boolean;
  onChange: (v: boolean) => void;
  onUpgrade: () => void;
}) {
  const unlocked = userTier >= requiredTier;
  if (!unlocked) {
    return (
      <Pressable style={styles.rowInner} onPress={onUpgrade} accessibilityRole="button">
        <View style={styles.rowChip}><Icon name="lock" size={18} tint="gold" /></View>
        <View style={styles.rowBody}>
          <Text style={styles.rowTitle}>{title}</Text>
          <Text style={styles.rowHint}>{`ویژه‌ی سطحِ ${requiredName} — برای فعال‌سازی ارتقا بده`}</Text>
        </View>
        <Icon name="chevron-prev" size={16} tint="gold" />
      </Pressable>
    );
  }
  return (
    <View style={styles.rowInner}>
      <View style={styles.rowChip}><Icon name={icon} size={18} tint="gold" /></View>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowHint}>{hint}</Text>
      </View>
      {saving ? (
        <View style={styles.rowSwitch}>
          <ActivityIndicator size="small" color={colors.gold} />
        </View>
      ) : (
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ false: colors.line, true: colors.goldSoft }}
          thumbColor={value ? colors.gold : colors.ink3}
          accessibilityLabel={title}
        />
      )}
    </View>
  );
}

export function ProfileScreen() {
  const vm = useProfileViewModel();
  const { interests: interestsCatalog } = useRemoteConfig();
  const { quota } = useQuota();
  const { width } = useWindowDimensions();
  // شبکه‌ی تمام‌عرض (لبه‌تا‌لبه) مثلِ اینستاگرام — سلول‌های مربعیِ نزدیک‌به‌هم.
  const tile = (width - GRID_GAP * (COLS - 1)) / COLS;

  // زبانه‌ی فعال؛ با پارامترِ ‎?tab=…‎ قابلِ کنترل از هر جای اپ.
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>(asTab(params.tab) ?? 'photos');
  useEffect(() => {
    // «عضویت» دیگر زبانه‌ی پروفایل نیست — لینک‌های قدیمیِ ?tab=plans به صفحه‌ی سطح‌ها می‌روند.
    if (params.tab === 'plans') {
      router.setParams({ tab: '' });
      goToPlans();
      return;
    }
    const t = asTab(params.tab);
    if (t) {
      setTab(t);
      // پارامتر را مصرف‌شده پاک می‌کنیم تا لینکِ بعدی همیشه دوباره اثر کند.
      router.setParams({ tab: '' });
    }
  }, [params.tab]);
  // عکسِ بازشده در نمای تمام‌صفحه — خودِ عکس (نه فقط آدرسش) تا کنشِ «عکسِ پروفایل» را هم بشود داد.
  const [viewer, setViewer] = useState<Photo | null>(null);
  // برگه‌ی عوض‌کردنِ عکسِ پروفایل (از آواتارِ بالای صفحه باز می‌شود).
  const [photoSheetOpen, setPhotoSheetOpen] = useState(false);
  const setPhotoError = vm.setPhotoError;
  const openPhotoSheet = useCallback(() => {
    setPhotoError(null);
    setPhotoSheetOpen(true);
  }, [setPhotoError]);

  /* — نوارِ چسبانِ پشتیبانی —
     تا وقتی کاربر به ردیفِ «گفتگو با پشتیبانی» (ته‌ی زبانه‌ی تنظیمات) نرسیده،
     یک نوارِ برجسته پایینِ صفحه می‌ماند؛ به‌محضِ دیده‌شدنِ ردیف کنار می‌رود.
     موقعیتِ ردیف = y نوارِ محتوای زبانه + y محتوای تنظیمات + y خودِ بخش. */
  const dock = useRef({ scrollTop: 0, viewportH: 0, contentY: 0, settingsY: 0, sectionY: -1, sectionH: 0 });
  const [supportSeen, setSupportSeen] = useState(false);
  const syncSupportSeen = useCallback(() => {
    const m = dock.current;
    if (m.sectionY < 0 || m.viewportH === 0) return;
    const sectionBottom = m.contentY + m.settingsY + m.sectionY + m.sectionH;
    // نوارِ چسبان خودش پایینِ دید را می‌پوشاند؛ پس آن اندازه از ارتفاعِ دید کم می‌شود.
    const seen = m.scrollTop + m.viewportH - SUPPORT_DOCK_H >= sectionBottom;
    setSupportSeen((prev) => (prev === seen ? prev : seen));
  }, []);
  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      dock.current.scrollTop = e.nativeEvent.contentOffset.y;
      dock.current.viewportH = e.nativeEvent.layoutMeasurement.height;
      syncSupportSeen();
    },
    [syncSupportSeen],
  );
  const onScrollLayout = useCallback(
    (e: LayoutChangeEvent) => {
      dock.current.viewportH = e.nativeEvent.layout.height;
      syncSupportSeen();
    },
    [syncSupportSeen],
  );
  // با عوض‌شدنِ زبانه اندازه‌های قبلی بی‌اعتبارند؛ onLayoutِ زبانه‌ی تازه دوباره پرشان می‌کند.
  const changeTab = useCallback((t: Tab) => {
    dock.current.sectionY = -1;
    setSupportSeen(false);
    setTab(t);
  }, []);

  if (vm.loading) {
    return (
      <ScreenContainer>
        <ScreenHeader title="من" support />
        <ProfileSkeleton />
      </ScreenContainer>
    );
  }

  const user = vm.user;
  const primary = vm.photos.find((p) => p.isPrimary) ?? vm.photos[0];
  const heroUri = mediaUrl(primary?.url);
  const userTier = user?.tier ?? 1;
  const activeTierName = tierName(userTier) || 'رایگان';
  // سقفِ عکس بر اساسِ سطحِ مؤثر — هم‌آهنگ با بک‌اند (عادی۳ … الماس۱۵).
  const maxPhotos = maxPhotosForTier(userTier);
  // عکس‌های ردشده در سقف حساب نمی‌شوند (مطابقِ سرور).
  const countedPhotos = vm.photos.filter((p) => p.status !== 'rejected').length;
  const isTrial = user?.subscriptionStatus === 'trial' || user?.subscriptionProvider === 'trial';
  // تاریخِ پایانِ اشتراک به‌صورتِ شمسی + روزهای باقی‌مانده.
  const expiry = faJalali(user?.subscriptionUntil);
  const remainingDays = daysUntil(user?.subscriptionUntil);
  const rejected = vm.photos.filter((p) => p.status === 'rejected' && p.rejectionReason);

  return (
    <ScreenContainer flush>
      {/* کلِ صفحه یکجا اسکرول می‌شود؛ نوارِ زبانه‌ها هنگامِ رسیدن به بالا می‌چسبد. */}
      <ScrollView
        contentContainerStyle={styles.tabScroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        stickyHeaderIndices={[1]}
        onScroll={onScroll}
        onLayout={onScrollLayout}
        scrollEventThrottle={32}
      >
        {/* ۰ — هویت؛ همراهِ اسکرول بالا می‌رود — */}
        <View style={styles.padded}>
          <ScreenHeader title="من" support />

          <View style={styles.idRow}>
            {/* آواتار خودش دکمه‌ی عوض‌کردنِ عکسِ پروفایل است — همان‌جایی که کاربر
                برای این کار نگاه می‌کند؛ نشانِ گوشه‌اش کار را آشکار می‌کند. */}
            <Pressable
              onPress={openPhotoSheet}
              style={({ pressed }) => [styles.avatarRing, shadow.gold, pressed && styles.pressed]}
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
            </Pressable>
            <View style={styles.stats}>
              <Stat value={faNum(vm.photos.length)} label="عکس" onPress={() => changeTab('photos')} />
              {/* شمارنده‌های دنبال‌کردن — سبکِ اینستاگرام؛ سطحِ اشتراک در کارتِ عضویتِ پایین دیده می‌شود. */}
              <Stat value={faNum(vm.followersCount)} label="دنبال‌کننده" onPress={() => router.push('/followers' as Href)} />
              <Stat value={faNum(vm.followingCount)} label="دنبال‌شده" onPress={() => router.push('/followers?tab=following' as Href)} />
              {/* «as Href»: تایپِ مسیرها تولیدی است و تا اجرای بعدیِ expo start مسیرِ تازه را نمی‌شناسد. */}
              <Stat value={faNum(vm.viewersCount)} label="بازدید" onPress={() => router.push('/viewers' as Href)} />
            </View>
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{user?.name ?? 'بدونِ نام'}</Text>
            {user?.verified ? <Icon name="shield-check" size={16} tint="gold" /> : null}
          </View>
          {user?.bio ? <Text style={styles.bio} numberOfLines={2}>{user.bio}</Text> : null}
          {user?.phone ? (
            <View style={styles.phoneRow}>
              <Text style={styles.phoneText}>{faNum(user.phone)}</Text>
              <Icon name="phone" size={14} tint="gold" />
            </View>
          ) : null}

          <View style={styles.actions}>
            <Button label="ویرایشِ پروفایل" size="sm" variant="ghost" onPress={() => changeTab('about')} style={styles.actionBtn} />
            <Button label="پسندها" size="sm" variant="ghost" icon="tab-likes" onPress={() => router.push('/likes')} style={styles.actionBtn} />
          </View>

          {/* — عضویت: برای کاربرِ رایگان دعوتِ ارتقا، برای مشترک کارتِ وضعیتِ اشتراک.
              جزئیات و خرید فقط در صفحه‌ی «سطح‌های اشتراک» (/plans) است. — */}
          {!user?.isPlus ? (
            <Pressable
              onPress={() => goToPlans()}
              style={({ pressed }) => [styles.cta, shadow.gold, pressed && styles.ctaPressed]}
              accessibilityRole="button"
              accessibilityLabel="ارتقا به نودوست پلاس"
            >
              <LinearGradient colors={gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
              <View style={styles.ctaIcon}>
                <Icon name="diamond-fill" size={22} tint="ink" />
              </View>
              <View style={styles.ctaBody}>
                <Text style={styles.ctaTitle}>نودوست پلاس</Text>
                <Text style={styles.ctaSub}>پسندهای بیشتر، دیدنِ علاقه‌مندان و امکاناتِ ویژه</Text>
              </View>
              <View style={styles.ctaPill}>
                <Text style={styles.ctaPillText}>ارتقا</Text>
              </View>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => goToPlans()}
              style={({ pressed }) => [styles.memberCard, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="مدیریتِ اشتراک و ارتقا"
            >
              <View style={styles.memberIcon}>
                <Icon name="diamond-fill" size={20} tint="gold" />
              </View>
              <View style={styles.memberBody}>
                <Text style={styles.memberTitle}>
                  {`اشتراکِ ${activeTierName}${isTrial ? ' (آزمایشی)' : ''} فعال است`}
                </Text>
                <Text style={styles.memberSub}>
                  {expiry
                    ? `تا ${expiry}${remainingDays > 0 ? ` · ${faNum(remainingDays)} روزِ باقی‌مانده` : ''}`
                    : 'برای تمدید یا ارتقا بزن'}
                </Text>
              </View>
              <View style={styles.memberAction}>
                <Text style={styles.memberActionText}>تمدید / ارتقا</Text>
              </View>
            </Pressable>
          )}

          {/* — سهمیه‌ی من —
              کارتِ عضویت می‌گفت «چه داری»؛ این می‌گوید «چقدر مانده». بدونِ این،
              کاربر تا لحظه‌ی خوردن به سقف هیچ‌جا نمی‌دید که سهمیه‌ای در کار است —
              و همین، بیشترین سوءتفاهمِ گزارش‌شده بود. با فشار، صفحه‌ی سطح‌ها
              با همان زمینه باز می‌شود. */}
          {quota?.items.length ? (
            <Pressable
              onPress={() => goToPlans()}
              accessibilityRole="button"
              accessibilityLabel="سهمیه‌ی من و ارتقای اشتراک"
              style={({ pressed }) => [styles.quotaCard, pressed && styles.pressed]}
            >
              <View style={styles.quotaHead}>
                <Text style={styles.quotaTitle}>سهمیه‌ی من</Text>
                <Text style={styles.quotaMore}>سطح‌ها</Text>
              </View>
              {quota.items.map((it) => (
                <QuotaMeter key={it.key} item={it} quota={quota} />
              ))}
            </Pressable>
          ) : null}
        </View>

        {/* ۱ — نوارِ زبانه‌ها (چسبان) — */}
        <View style={styles.tabSticky}>
          <View style={styles.tabBar}>
            {TABS.map((t) => {
              const active = tab === t.key;
              return (
                <Pressable
                  key={t.key}
                  onPress={() => changeTab(t.key)}
                  style={[styles.tabItem, active && styles.tabItemActive]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ۲ — محتوای زبانه‌ی فعال — */}
        <View onLayout={(e) => { dock.current.contentY = e.nativeEvent.layout.y; syncSupportSeen(); }}>
        {tab === 'photos' ? (
          <>
            <View style={styles.grid}>
              {vm.photos.map((p) => {
                const uri = mediaUrl(p.url);
                const pending = p.status === 'pending' || p.status == null;
                const isRejected = p.status === 'rejected';
                return (
                  <Pressable
                    key={p.id}
                    style={({ pressed }) => [styles.tile, { width: tile, height: tile }, pressed && styles.tilePressed]}
                    onPress={() => uri && setViewer(p)}
                    disabled={!uri}
                    accessibilityRole="imagebutton"
                    accessibilityLabel="نمایشِ کاملِ عکس"
                  >
                    {uri ? (
                      <Image source={{ uri }} style={[styles.photo, (pending || isRejected) && styles.photoDim]} contentFit="cover" cachePolicy="memory-disk" />
                    ) : null}
                    {p.isPrimary ? (
                      <View style={styles.primaryTag}><Text style={styles.primaryTagText}>اصلی</Text></View>
                    ) : null}
                    {pending ? (
                      <View style={styles.statusTag}>
                        <Icon name="clock" size={11} tint="ink" />
                        <Text style={styles.statusText}>در انتظار</Text>
                      </View>
                    ) : null}
                    {isRejected ? (
                      <View style={[styles.statusTag, styles.statusTagReject]}><Text style={styles.statusText}>رد شد</Text></View>
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
                  </Pressable>
                );
              })}
              {countedPhotos < maxPhotos ? (
                <Pressable
                  style={({ pressed }) => [styles.tile, styles.addTile, { width: tile, height: tile }, pressed && styles.addTilePressed]}
                  onPress={() => vm.addPhoto()}
                  disabled={vm.busy}
                  accessibilityRole="button"
                  accessibilityLabel="افزودنِ عکس"
                >
                  <Icon name="plus" size={24} tint="gold" />
                  <Text style={styles.addTileText}>افزودن</Text>
                </Pressable>
              ) : userTier < 5 ? (
                // سقفِ سطحِ فعلی پر شده — کاشیِ قفل، دعوت به ارتقا.
                <Pressable
                  style={({ pressed }) => [styles.tile, styles.addTile, styles.lockTile, { width: tile, height: tile }, pressed && styles.addTilePressed]}
                  onPress={() => goToPlans(userTier + 1, 'آپلودِ عکس‌های بیشتر')}
                  accessibilityRole="button"
                  accessibilityLabel="افزایشِ سقفِ عکس با ارتقای سطح"
                >
                  <Icon name="lock" size={22} tint="gold" />
                  <Text style={styles.addTileText}>عکسِ بیشتر با ارتقا</Text>
                </Pressable>
              ) : null}
            </View>
            <View style={styles.padded}>
              {/* خطای آپلود/حذف دیگر بی‌صدا بلعیده نمی‌شود. */}
              {vm.photoError ? <Text style={styles.photoError}>{vm.photoError}</Text> : null}
              <Text style={styles.caption}>
                {faNum(countedPhotos)} از {faNum(maxPhotos)} عکسِ سطحِ {activeTierName} استفاده شده.
                {' '}عکس‌های تازه بلافاصله نمایش داده می‌شوند. اگر عکسی خلاف قوانین باشد، دلیلِ رد آن را همین‌جا می‌بینی.
              </Text>
              {rejected.map((photo) => (
                <View key={`reason-${photo.id}`} style={styles.rejectionRow}>
                  <Icon name="close" size={12} tint="white" />
                  <Text style={styles.rejectionReason}>دلیلِ رد: {photo.rejectionReason}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {tab === 'about' ? (
          <View style={styles.padded}>
            <View style={styles.card}>
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
              <Text style={styles.fieldLabel}>علاقه‌مندی‌ها</Text>
              <Text style={styles.fieldHint}>
                با انتخابِ علاقه‌مندی‌ها، افرادِ هم‌سلیقه‌ات را بهتر پیدا می‌کنیم.
              </Text>
              <InterestPicker
                options={interestsCatalog}
                value={vm.draftInterests}
                onChange={vm.setDraftInterests}
              />
              {vm.saveError ? <Text style={styles.saveError}>ذخیره ناموفق بود. دوباره تلاش کن.</Text> : null}
              <Button
                label="ذخیره‌ی تغییرات"
                size="md"
                onPress={vm.saveProfile}
                loading={vm.saving}
                disabled={!vm.dirty || vm.draftName.trim().length < 2}
              />
            </View>
          </View>
        ) : null}

        {tab === 'settings' ? (
          <View
            style={styles.padded}
            onLayout={(e) => { dock.current.settingsY = e.nativeEvent.layout.y; syncSupportSeen(); }}
          >
            {/* — اعلان‌ها: صفحه‌ی جدا با سوییچِ هر گونه — */}
            <Text style={styles.groupLabel}>اعلان‌ها</Text>
            <View style={styles.group}>
              <Pressable
                style={styles.rowInner}
                onPress={() => router.push('/notification-settings' as Href)}
                accessibilityRole="button"
                accessibilityLabel="تنظیماتِ اعلان"
              >
                <View style={styles.rowChip}><Icon name="bell" size={18} tint="gold" /></View>
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>تنظیماتِ اعلان</Text>
                  <Text style={styles.rowHint}>انتخاب کن برای کدام اتفاق‌ها خبردار شوی</Text>
                </View>
                <Icon name="chevron-prev" size={16} tint="gold" />
              </Pressable>
            </View>

            <Text style={styles.groupLabel}>موقعیت</Text>
            <View style={styles.group}>
              <View style={styles.rowInner}>
                <View style={styles.rowChip}><Icon name="map" size={18} tint="gold" /></View>
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>نمایشِ موقعیتِ دقیق</Text>
                  <Text style={styles.rowHint}>پیش‌فرض فقط یک نقطه‌ی تقریبی است</Text>
                </View>
                {vm.savingPref === 'showExactLocationOnMap' ? (
                  <View style={styles.rowSwitch}>
                    <ActivityIndicator size="small" color={colors.gold} />
                  </View>
                ) : (
                  <Switch
                    value={user?.prefs?.showExactLocationOnMap ?? false}
                    onValueChange={vm.updateMapPrivacy}
                    trackColor={{ false: colors.line, true: colors.goldSoft }}
                    thumbColor={user?.prefs?.showExactLocationOnMap ? colors.gold : colors.ink3}
                    accessibilityLabel="نمایش موقعیت دقیق روی نقشه"
                  />
                )}
              </View>
            </View>

            {/*
              * — حریمِ خصوصی: کنترل‌های رایگان —
              * فهرستِ مسدودشده‌ها بالای گروهِ «ویژه» می‌نشیند و هیچ قفلِ سطحی
              * ندارد: بلاک یک ابزارِ ایمنی است، نه یک قابلیتِ فروختنی. تا امروز
              * هیچ راهی برای دیدنِ این فهرست نبود، پس رفعِ بلاک هم ممکن نبود.
              */}
            <Text style={styles.groupLabel}>حریمِ خصوصی</Text>
            <View style={styles.group}>
              <Pressable
                style={styles.rowInner}
                onPress={() => router.push('/blocked' as Href)}
                accessibilityRole="button"
                accessibilityLabel="کاربرانِ مسدودشده"
              >
                <View style={styles.rowChip}><Icon name="shield" size={18} tint="gold" /></View>
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>کاربرانِ مسدودشده</Text>
                  <Text style={styles.rowHint}>ببین چه کسانی را مسدود کرده‌ای و رفعِ مسدودی کن</Text>
                </View>
                <Icon name="chevron-prev" size={16} tint="gold" />
              </Pressable>
            </View>

            {/* — حریمِ خصوصیِ ویژه: پنهان‌سازیِ آنلاین/فاصله (طلایی+) و ناشناس (الماس) — */}
            <Text style={styles.groupLabel}>حریمِ خصوصیِ ویژه</Text>
            <View style={styles.group}>
              <PrivacyRow
                icon="moon"
                title="پنهان‌کردنِ وضعیتِ آنلاین"
                hint="کسی نبیند کِی آنلاین بوده‌ای"
                requiredTier={4}
                requiredName="طلایی"
                userTier={userTier}
                value={user?.prefs?.hideOnline ?? false}
                saving={vm.savingPref === 'hideOnline'}
                onChange={(v) => vm.updatePrefs({ hideOnline: v })}
                onUpgrade={() => goToPlans(4, 'پنهان‌کردنِ وضعیتِ آنلاین')}
              />
              <View style={styles.rowDivider} />
              <PrivacyRow
                icon="map"
                title="پنهان‌کردنِ فاصله"
                hint="فاصله‌ات از دیگران نمایش داده نشود"
                requiredTier={4}
                requiredName="طلایی"
                userTier={userTier}
                value={user?.prefs?.hideDistance ?? false}
                saving={vm.savingPref === 'hideDistance'}
                onChange={(v) => vm.updatePrefs({ hideDistance: v })}
                onUpgrade={() => goToPlans(4, 'پنهان‌کردنِ فاصله')}
              />
              <View style={styles.rowDivider} />
              <PrivacyRow
                icon="shield"
                title="حالتِ ناشناس"
                hint="از کاوش، اطراف و نقشه حذف می‌شوی؛ بازدیدت هم ثبت نمی‌شود"
                requiredTier={5}
                requiredName="الماس"
                userTier={userTier}
                value={user?.prefs?.incognito ?? false}
                saving={vm.savingPref === 'incognito'}
                onChange={(v) => vm.updatePrefs({ incognito: v })}
                onUpgrade={() => goToPlans(5, 'حالتِ ناشناس')}
              />
            </View>

            {/* — حالتِ سفر (الماس): جست‌وجو در شهرِ دلخواه — */}
            <Text style={styles.groupLabel}>حالتِ سفر</Text>
            <View style={styles.group}>
              {userTier < 5 ? (
                <Pressable style={styles.rowInner} onPress={() => goToPlans(5, 'حالتِ سفر')} accessibilityRole="button">
                  <View style={styles.rowChip}><Icon name="lock" size={18} tint="gold" /></View>
                  <View style={styles.rowBody}>
                    <Text style={styles.rowTitle}>جست‌وجو در شهرِ دلخواه</Text>
                    <Text style={styles.rowHint}>ویژه‌ی سطحِ الماس — برای فعال‌سازی ارتقا بده</Text>
                  </View>
                  <Icon name="chevron-prev" size={16} tint="gold" />
                </Pressable>
              ) : user?.prefs?.travelMode ? (
                <View style={styles.travelBox}>
                  <Text style={styles.rowTitle}>حالتِ سفر فعال است ✈️</Text>
                  <Text style={styles.rowHint}>در شهرِ انتخابی دیده می‌شوی و همان‌جا جست‌وجو می‌کنی.</Text>
                  <Button
                    label="بازگشت به موقعیتِ واقعی"
                    size="sm"
                    variant="ghost"
                    onPress={vm.stopTravel}
                    loading={vm.travelBusy}
                  />
                </View>
              ) : (
                <View style={styles.travelBox}>
                  <Text style={styles.rowHint}>یک شهر انتخاب کن تا موقعیتت موقتاً آن‌جا باشد:</Text>
                  <View style={styles.travelCities}>
                    {TRAVEL_CITIES.map((c) => (
                      <Pressable
                        key={c.name}
                        style={({ pressed }) => [styles.cityChip, pressed && styles.pressed]}
                        onPress={() => vm.startTravel(c.lat, c.lng)}
                        disabled={vm.travelBusy}
                        accessibilityRole="button"
                        accessibilityLabel={`سفر به ${c.name}`}
                      >
                        <Text style={styles.cityChipText}>{c.name}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* — پشتیبانی: تنها راهِ رسمیِ تماس با ما —
                onLayout: تا نوارِ چسبانِ پایین بداند کِی کاربر به این بخش رسیده. */}
            <View
              onLayout={(e) => {
                dock.current.sectionY = e.nativeEvent.layout.y;
                dock.current.sectionH = e.nativeEvent.layout.height;
                syncSupportSeen();
              }}
            >
              <Text style={styles.groupLabel}>پشتیبانی</Text>
              <View style={[styles.group, styles.supportGroup]}>
                <Pressable
                  style={styles.rowInner}
                  onPress={() => router.push('/support' as Href)}
                  accessibilityRole="button"
                  accessibilityLabel="گفتگو با پشتیبانی"
                >
                  <View style={[styles.rowChip, styles.supportRowChip]}><Icon name="shield-check" size={18} tint="gold" /></View>
                  <View style={styles.rowBody}>
                    <Text style={styles.rowTitle}>گفتگو با پشتیبانی</Text>
                    <Text style={styles.rowHint}>سوال، مشکلِ پرداخت یا گزارشِ تخلف</Text>
                  </View>
                  <Icon name="chevron-prev" size={16} tint="gold" />
                </Pressable>
              </View>
            </View>

            <AppVersionInfo />
            <Button label="خروج از حساب" variant="danger" onPress={vm.logout} style={styles.logout} />
            {/* جای خالی زیرِ نوارِ چسبان تا دکمه‌ی خروج پشتش پنهان نشود. */}
            <View style={styles.dockSpacer} />
          </View>
        ) : null}
        </View>
      </ScrollView>

      {/* — نوارِ چسبانِ پشتیبانی: فقط در زبانه‌ی تنظیمات و تا وقتی ردیفش دیده نشده — */}
      {tab === 'settings' && !supportSeen ? (
        <Animated.View
          entering={FadeInDown.duration(220)}
          exiting={FadeOutDown.duration(160)}
          style={styles.supportDock}
          pointerEvents="box-none"
        >
          {/* محوشدگی تا محتوای زیرِ نوار ناگهانی قطع نشود. */}
          <LinearGradient
            colors={['rgba(11,9,16,0)', colors.bg]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <Pressable
            onPress={() => router.push('/support' as Href)}
            style={({ pressed }) => [styles.supportDockBtn, shadow.gold, pressed && styles.ctaPressed]}
            accessibilityRole="button"
            accessibilityLabel="گفتگو با پشتیبانی"
          >
            <LinearGradient colors={gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <View style={styles.supportDockIcon}>
              <Icon name="shield-check" size={20} tint="ink" />
            </View>
            <View style={styles.ctaBody}>
              <Text style={styles.ctaTitle}>پشتیبانیِ نودوست</Text>
              <Text style={styles.ctaSub}>سوال یا مشکلی داری؟ همین‌جا بپرس</Text>
            </View>
            <View style={styles.ctaPill}>
              <Text style={styles.ctaPillText}>گفتگو</Text>
            </View>
          </Pressable>
        </Animated.View>
      ) : null}

      {/* — نمایِ تمام‌صفحه‌ی عکس — */}
      <Modal
        visible={viewer != null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setViewer(null)}
      >
        <Pressable style={styles.viewerBackdrop} onPress={() => setViewer(null)}>
          {viewer ? (
            <Image source={{ uri: mediaUrl(viewer.url) }} style={styles.viewerImage} contentFit="contain" transition={150} cachePolicy="memory-disk" />
          ) : null}
          <Pressable style={styles.viewerClose} onPress={() => setViewer(null)} hitSlop={10} accessibilityRole="button" accessibilityLabel="بستن">
            <Icon name="close" size={20} tint="white" />
          </Pressable>
          {/* همان کنشِ برگه‌ی آواتار، این‌بار سرِ راهِ کسی که از شبکه‌ی عکس‌ها آمده. */}
          {viewer && !viewer.isPrimary && viewer.status !== 'rejected' ? (
            <View style={styles.viewerDock}>
              <Button
                label="عکسِ پروفایلم شود"
                icon="check"
                loading={vm.primaryBusyId === viewer.id}
                onPress={async () => {
                  const ok = await vm.setPrimaryPhoto(viewer.id);
                  if (ok) setViewer(null);
                }}
              />
            </View>
          ) : null}
        </Pressable>
      </Modal>

      {/* برگه‌ی «عکسِ پروفایل» — انتخاب از میانِ عکس‌های موجود یا گرفتنِ عکسِ تازه. */}
      <ProfilePhotoSheet
        visible={photoSheetOpen}
        photos={vm.photos}
        busyId={vm.primaryBusyId}
        error={vm.photoError}
        canAdd={countedPhotos < maxPhotos}
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
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  padded: { paddingHorizontal: PAGE_PADDING },
  tabScroll: { paddingBottom: spacing.xxl },
  pressed: { opacity: 0.6 },

  // — ردیفِ هویت: آواتار + آمار —
  idRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.lg },
  avatarRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: { width: 74, height: 74, borderRadius: 37, backgroundColor: colors.surface2 },
  avatarEmpty: { alignItems: 'center', justifyContent: 'center' },
  // نشانِ «ویرایش» روی لبه‌ی آواتار؛ حلقه‌ی هم‌رنگِ زمینه آن را از عکس جدا می‌کند.
  avatarBadge: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.gold,
    borderWidth: 2,
    borderColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontFamily: fonts.bold, fontSize: 32, color: colors.goldSoft },
  stats: { flex: 1, flexDirection: 'row-reverse', justifyContent: 'space-around', alignItems: 'center' },
  statPress: { flex: 1 },
  stat: { alignItems: 'center', gap: 2 },
  statValue: { fontFamily: fonts.bold, fontSize: fontSizes.lg, color: colors.ink, textAlign: 'center' },
  statLabel: { fontFamily: fonts.regular, fontSize: fontSizes.xs, color: colors.ink3, textAlign: 'center' },

  // — نام و بیو —
  nameRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.xs, marginTop: spacing.md },
  name: { fontFamily: fonts.bold, fontSize: fontSizes.lg, lineHeight: lineHeights.lg, color: colors.ink, writingDirection: 'rtl' },
  bio: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: spacing.xs,
  },
  phoneRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  phoneText: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.ink2, writingDirection: 'rtl' },

  // — کنش‌ها —
  actions: { flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.lg },
  actionBtn: { flex: 1 },

  // — دعوتِ ارتقا —
  cta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginTop: spacing.lg,
  },
  ctaPressed: { opacity: 0.94, transform: [{ scale: 0.99 }] },
  ctaIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBody: { flex: 1, alignItems: 'flex-end', gap: 2 },
  ctaTitle: { fontFamily: fonts.bold, fontSize: fontSizes.md, color: colors.onGold, textAlign: 'right' },
  ctaSub: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: 'rgba(42,29,18,0.8)',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  ctaPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(42,29,18,0.9)',
  },
  ctaPillText: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.gold2 },

  // — کارتِ سهمیه —
  quotaCard: {
    marginTop: spacing.md,
    padding: spacing.lg,
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  quotaHead: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quotaTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.sm,
    color: colors.ink,
    writingDirection: 'rtl',
  },
  quotaMore: { fontFamily: fonts.medium, fontSize: fontSizes.xs, color: colors.gold2 },

  // — کارتِ وضعیتِ اشتراک (کاربرِ مشترک) — جزئیات و خرید در /plans —
  memberCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    backgroundColor: colors.goldFaint,
    marginTop: spacing.lg,
  },
  memberIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberBody: { flex: 1, alignItems: 'flex-end', gap: 2 },
  memberTitle: { fontFamily: fonts.bold, fontSize: fontSizes.sm, color: colors.ink, textAlign: 'right', writingDirection: 'rtl' },
  memberSub: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  memberAction: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    backgroundColor: colors.surface,
  },
  memberActionText: { fontFamily: fonts.medium, fontSize: fontSizes.xs, color: colors.gold2 },

  // — نوارِ زبانه‌ها —
  tabSticky: {
    backgroundColor: colors.bg,
    paddingHorizontal: PAGE_PADDING,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  tabBar: {
    flexDirection: 'row-reverse',
    padding: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  tabItem: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.pill, alignItems: 'center' },
  tabItemActive: { backgroundColor: colors.goldFaint, borderWidth: 1, borderColor: colors.goldSoft },
  tabText: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.ink3 },
  tabTextActive: { color: colors.gold2 },

  // — شبکه‌ی عکس —
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: GRID_GAP, marginTop: spacing.md },
  tile: { backgroundColor: colors.surface2, overflow: 'hidden' },
  tilePressed: { opacity: 0.8 },
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
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.goldSoft,
    backgroundColor: colors.surface,
  },
  addTilePressed: { backgroundColor: colors.goldFaint },
  addTileText: { fontFamily: fonts.medium, fontSize: fontSizes.xs, color: colors.gold2, textAlign: 'center', writingDirection: 'rtl' },
  lockTile: { borderStyle: 'solid', opacity: 0.85, paddingHorizontal: spacing.xs },

  caption: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: lineHeights.xs,
    marginTop: spacing.md,
  },
  rejectionRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.roseFaint,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  rejectionReason: { flex: 1, fontFamily: fonts.regular, fontSize: 12, color: colors.rose, textAlign: 'right' },

  // — کارتِ درباره —
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  fieldLabel: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.ink2, textAlign: 'right' },
  fieldHint: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
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
  photoError: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.rose,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.sm,
  },

  // — تنظیمات —
  group: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  groupLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: spacing.xl,
    marginBottom: -spacing.sm,
  },
  rowDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line },
  travelBox: { paddingVertical: spacing.md, gap: spacing.md, alignItems: 'stretch' },
  travelCities: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm },
  cityChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.goldSoft,
  },
  cityChipText: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.gold2 },
  rowInner: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  rowChip: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  rowBody: { flex: 1, alignItems: 'flex-end', gap: 2 },
  // هم‌اندازه با Switch تا هنگامِ نمایشِ لودر چیدمان نپرد.
  rowSwitch: { width: 51, height: 31, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontFamily: fonts.bold, fontSize: fontSizes.md, color: colors.ink, textAlign: 'right' },
  rowHint: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
  },

  logout: { marginTop: spacing.xl },

  // — پشتیبانی: کارتِ برجسته در فهرست + نوارِ چسبانِ پایین —
  supportGroup: { borderColor: colors.goldSoft, backgroundColor: colors.goldFaint },
  supportRowChip: { backgroundColor: colors.goldFaint, borderWidth: 1, borderColor: colors.goldSoft },
  dockSpacer: { height: SUPPORT_DOCK_H },
  supportDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: PAGE_PADDING,
    paddingBottom: spacing.md,
    paddingTop: spacing.xl,
  },
  supportDockBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  supportDockIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // — لایت‌باکس —
  viewerBackdrop: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center' },
  viewerImage: { width: '100%', height: '100%' },
  viewerClose: {
    position: 'absolute',
    top: 44,
    left: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: spacing.xl,
    paddingHorizontal: PAGE_PADDING,
  },
});
