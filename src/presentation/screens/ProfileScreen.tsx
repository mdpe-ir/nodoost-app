import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Switch,
  ScrollView,
  Modal,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import Constants from 'expo-constants';
import { ScreenContainer, ScreenHeader, PAGE_PADDING } from '@/presentation/components/ScreenContainer';
import { ProfileSkeleton } from '@/presentation/components/Skeleton';
import { Button } from '@/presentation/components/Button';
import { Icon } from '@/presentation/components/Icon';
import { tierName } from '@/presentation/components/TierBadge';
import { tierPerks, maxPhotosForTier } from '@/presentation/tiers/tierFeatures';
import { useProfileViewModel } from '@/presentation/hooks/useProfileViewModel';
import { mediaUrl } from '@/core/http/mediaUrl';
import { faNum, faPrice } from '@/core/utils/faNum';
import { colors, fonts, fontSizes, lineHeights, spacing, radius, shadow, gradients } from '@/core/theme';

const COLS = 3;
const GRID_GAP = 2;

type Tab = 'photos' | 'about' | 'plans' | 'settings';
const TABS: { key: Tab; label: string }[] = [
  { key: 'photos', label: 'عکس‌ها' },
  { key: 'about', label: 'درباره' },
  { key: 'plans', label: 'عضویت' },
  { key: 'settings', label: 'تنظیمات' },
];
/** زبانه‌ی معتبر از پارامترِ مسیر (مثلاً ‎/profile?tab=plans از دکمه‌های ارتقا). */
const asTab = (v: unknown): Tab | null =>
  typeof v === 'string' && TABS.some((t) => t.key === v) ? (v as Tab) : null;

/** شهرهای حالتِ سفر (الماس) — مختصاتِ مرکزِ شهر. */
const TRAVEL_CITIES: { name: string; lat: number; lng: number }[] = [
  { name: 'تهران', lat: 35.6892, lng: 51.389 },
  { name: 'مشهد', lat: 36.2605, lng: 59.6168 },
  { name: 'اصفهان', lat: 32.6539, lng: 51.666 },
  { name: 'شیراز', lat: 29.5918, lng: 52.5837 },
  { name: 'تبریز', lat: 38.0962, lng: 46.2738 },
  { name: 'کرج', lat: 35.8327, lng: 50.9916 },
];

const faShortDate = (iso?: string): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('fa-IR', { day: 'numeric', month: 'long' });
};

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
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={saving}
        trackColor={{ false: colors.line, true: colors.goldSoft }}
        thumbColor={value ? colors.gold : colors.ink3}
        accessibilityLabel={title}
      />
    </View>
  );
}

export function ProfileScreen() {
  const vm = useProfileViewModel();
  const { width } = useWindowDimensions();
  // شبکه‌ی تمام‌عرض (لبه‌تا‌لبه) مثلِ اینستاگرام — سلول‌های مربعیِ نزدیک‌به‌هم.
  const tile = (width - GRID_GAP * (COLS - 1)) / COLS;

  // زبانه‌ی فعال؛ با پارامترِ ‎?tab=…‎ قابلِ کنترل از هر جای اپ (دکمه‌های ارتقا → عضویت).
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>(asTab(params.tab) ?? 'photos');
  useEffect(() => {
    const t = asTab(params.tab);
    if (t) {
      setTab(t);
      // پارامتر را مصرف‌شده پاک می‌کنیم تا فشردنِ دوباره‌ی «ارتقا» همیشه دوباره اثر کند.
      router.setParams({ tab: '' });
    }
  }, [params.tab]);
  const [viewerUri, setViewerUri] = useState<string | null>(null);

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
  const userTier = user?.tier ?? 1;
  const activeTierName = tierName(userTier) || 'رایگان';
  // سقفِ عکس بر اساسِ سطحِ مؤثر — هم‌آهنگ با بک‌اند (عادی۳ … الماس۱۵).
  const maxPhotos = maxPhotosForTier(userTier);
  // عکس‌های ردشده در سقف حساب نمی‌شوند (مطابقِ سرور).
  const countedPhotos = vm.photos.filter((p) => p.status !== 'rejected').length;
  const isTrial = user?.subscriptionStatus === 'trial' || user?.subscriptionProvider === 'trial';
  const expiry = faShortDate(user?.subscriptionUntil);
  const rejected = vm.photos.filter((p) => p.status === 'rejected' && p.rejectionReason);

  return (
    <ScreenContainer flush>
      {/* کلِ صفحه یکجا اسکرول می‌شود؛ نوارِ زبانه‌ها هنگامِ رسیدن به بالا می‌چسبد. */}
      <ScrollView
        contentContainerStyle={styles.tabScroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        stickyHeaderIndices={[1]}
      >
        {/* ۰ — هویت؛ همراهِ اسکرول بالا می‌رود — */}
        <View style={styles.padded}>
          <ScreenHeader title="من" />

          <View style={styles.idRow}>
            <View style={[styles.avatarRing, shadow.gold]}>
              {heroUri ? (
                <Image source={{ uri: heroUri }} style={styles.avatar} contentFit="cover" transition={200} cachePolicy="memory-disk" />
              ) : (
                <View style={[styles.avatar, styles.avatarEmpty]}>
                  <Text style={styles.avatarInitial}>{(user?.name || '؟').charAt(0)}</Text>
                </View>
              )}
            </View>
            <View style={styles.stats}>
              <Stat value={faNum(vm.photos.length)} label="عکس" onPress={() => setTab('photos')} />
              <Stat value={activeTierName} label="سطح" onPress={() => setTab('plans')} />
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
            <Button label="ویرایشِ پروفایل" size="sm" variant="ghost" onPress={() => setTab('about')} style={styles.actionBtn} />
            <Button label="پسندها" size="sm" variant="ghost" icon="tab-likes" onPress={() => router.push('/likes')} style={styles.actionBtn} />
          </View>

          {/* — دعوتِ ارتقا؛ فقط برای کاربرِ رایگان — */}
          {!user?.isPlus ? (
            <Pressable
              onPress={() => setTab('plans')}
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
                  onPress={() => setTab(t.key)}
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
        <View>
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
                    onPress={() => uri && setViewerUri(uri)}
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
                  onPress={vm.addPhoto}
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
                  onPress={() => setTab('plans')}
                  accessibilityRole="button"
                  accessibilityLabel="افزایشِ سقفِ عکس با ارتقای سطح"
                >
                  <Icon name="lock" size={22} tint="gold" />
                  <Text style={styles.addTileText}>عکسِ بیشتر با ارتقا</Text>
                </Pressable>
              ) : null}
            </View>
            <View style={styles.padded}>
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

        {tab === 'plans' ? (
          <View style={styles.padded}>
            {user?.isPlus ? (
              <Text style={styles.statusLine}>
                {isTrial ? 'اشتراکِ آزمایشی' : 'اشتراکِ فعال'}{expiry ? ` · تا ${expiry}` : ''}
              </Text>
            ) : null}
            <Button
              label="مقایسه‌ی کاملِ سطح‌ها"
              variant="ghost"
              icon="diamond-fill"
              onPress={() => router.push('/plans')}
              style={styles.plansCta}
            />
            <View style={styles.tiers}>
              {!user?.isPlus ? (
                <View style={[styles.tierCard, styles.tierCardCurrent]}>
                  <View style={styles.tierCardHead}>
                    <View style={styles.tierNameRow}>
                      <Text style={styles.tierName}>رایگان</Text>
                      <View style={styles.currentTag}><Text style={styles.currentTagText}>پلنِ فعلی</Text></View>
                    </View>
                    <Text style={styles.tierPrice}>بدونِ پرداخت</Text>
                  </View>
                </View>
              ) : null}
              {vm.tiers.map((t) => {
                const current = user?.isPlus && t.level === userTier;
                const perks = tierPerks(t).slice(0, 3);
                return (
                  <View key={t.id} style={[styles.tierCard, current && styles.tierCardCurrent]}>
                    <View style={styles.tierCardHead}>
                      <View style={styles.tierNameRow}>
                        <Text style={styles.tierName}>{t.name}</Text>
                        {current ? (
                          <View style={styles.currentTag}><Text style={styles.currentTagText}>{isTrial ? 'trial فعال' : 'پلنِ فعلی'}</Text></View>
                        ) : null}
                      </View>
                      {t.priceToman != null ? <Text style={styles.tierPrice}>{faPrice(t.priceToman)} تومان</Text> : null}
                    </View>
                    {perks.length ? (
                      <View style={styles.tierPerks}>
                        {perks.map((p, i) => (
                          <View key={i} style={styles.tierPerkRow}>
                            <Icon name="check" size={13} tint="gold" />
                            <Text style={styles.tierPerkText} numberOfLines={1}>{p}</Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
                    {!current ? (
                      <Button
                        label="خرید"
                        size="sm"
                        onPress={() => vm.buy(t.id, t.bazaarSku)}
                        loading={vm.busy}
                        style={styles.buyBtn}
                      />
                    ) : (
                      <View style={styles.tierActiveRow}>
                        <Icon name="check" size={16} tint="gold" />
                        <Text style={styles.tierActiveText}>فعال است</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        {tab === 'settings' ? (
          <View style={styles.padded}>
            <View style={styles.group}>
              <View style={styles.rowInner}>
                <View style={styles.rowChip}><Icon name="map" size={18} tint="gold" /></View>
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>نمایشِ موقعیتِ دقیق</Text>
                  <Text style={styles.rowHint}>پیش‌فرض فقط یک نقطه‌ی تقریبی است</Text>
                </View>
                <Switch
                  value={user?.prefs?.showExactLocationOnMap ?? false}
                  onValueChange={vm.updateMapPrivacy}
                  disabled={vm.privacySaving}
                  trackColor={{ false: colors.line, true: colors.goldSoft }}
                  thumbColor={user?.prefs?.showExactLocationOnMap ? colors.gold : colors.ink3}
                  accessibilityLabel="نمایش موقعیت دقیق روی نقشه"
                />
              </View>
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
                saving={vm.privacySaving}
                onChange={(v) => vm.updatePrefs({ hideOnline: v })}
                onUpgrade={() => setTab('plans')}
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
                saving={vm.privacySaving}
                onChange={(v) => vm.updatePrefs({ hideDistance: v })}
                onUpgrade={() => setTab('plans')}
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
                saving={vm.privacySaving}
                onChange={(v) => vm.updatePrefs({ incognito: v })}
                onUpgrade={() => setTab('plans')}
              />
            </View>

            {/* — حالتِ سفر (الماس): جست‌وجو در شهرِ دلخواه — */}
            <Text style={styles.groupLabel}>حالتِ سفر</Text>
            <View style={styles.group}>
              {userTier < 5 ? (
                <Pressable style={styles.rowInner} onPress={() => setTab('plans')} accessibilityRole="button">
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

            <Button label="خروج از حساب" variant="danger" onPress={vm.logout} style={styles.logout} />
            {version ? <Text style={styles.version}>نودوست · نسخه‌ی {faNum(version)}</Text> : null}
          </View>
        ) : null}
        </View>
      </ScrollView>

      {/* — نمایِ تمام‌صفحه‌ی عکس — */}
      <Modal
        visible={viewerUri != null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setViewerUri(null)}
      >
        <Pressable style={styles.viewerBackdrop} onPress={() => setViewerUri(null)}>
          {viewerUri ? (
            <Image source={{ uri: viewerUri }} style={styles.viewerImage} contentFit="contain" transition={150} cachePolicy="memory-disk" />
          ) : null}
          <Pressable style={styles.viewerClose} onPress={() => setViewerUri(null)} hitSlop={10} accessibilityRole="button" accessibilityLabel="بستن">
            <Icon name="close" size={20} tint="white" />
          </Pressable>
        </Pressable>
      </Modal>
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
  rowTitle: { fontFamily: fonts.bold, fontSize: fontSizes.md, color: colors.ink, textAlign: 'right' },
  rowHint: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
  },

  // — پلن‌ها —
  statusLine: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.gold2, textAlign: 'center', marginTop: spacing.lg },
  plansCta: { marginTop: spacing.lg },
  tiers: { gap: spacing.sm, marginTop: spacing.md },
  tierCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  tierCardHead: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  tierCardCurrent: { borderColor: colors.goldSoft, backgroundColor: colors.surface2 },
  tierPerks: { gap: 6 },
  tierPerkRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  tierPerkText: { flex: 1, fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.ink, textAlign: 'right', writingDirection: 'rtl' },
  tierActiveRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  tierActiveText: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.gold },
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

  logout: { marginTop: spacing.xl },
  version: { fontFamily: fonts.regular, fontSize: fontSizes.xs, color: colors.ink3, textAlign: 'center', marginTop: spacing.lg },

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
});
