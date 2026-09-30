import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { PressableScale } from '@/presentation/components/PressableScale';
import { ScreenContainer, PAGE_PADDING } from '@/presentation/components/ScreenContainer';
import { StackHeader } from '@/presentation/components/StackHeader';
import { Skeleton } from '@/presentation/components/Skeleton';
import { EmptyState } from '@/presentation/components/EmptyState';
import { Icon, type IconName } from '@/presentation/components/Icon';
import { TierBadge } from '@/presentation/components/TierBadge';
import { FollowButton } from '@/presentation/components/FollowButton';
import { FollowStatsRow } from '@/presentation/components/FollowStatsRow';
import { ProfileInterests } from '@/presentation/components/ProfileInterests';
import { SettingsGroup, SettingsLink, SettingsToggle } from '@/presentation/components/SettingsRow';
import { SharedMediaPreviewRow } from '@/presentation/components/SharedMediaPreviewRow';
import { ActionSheet } from '@/presentation/components/ActionSheet';
import { ReportReasonSheet } from '@/presentation/components/ReportReasonSheet';
import { PhotoViewer } from '@/presentation/components/PhotoViewer';
import { useChatInfoViewModel } from '@/presentation/hooks/useChatInfoViewModel';
import { useSession } from '@/presentation/providers/SessionProvider';
import { mediaUrl } from '@/core/http/mediaUrl';
import { faNum, faDistance } from '@/core/utils/faNum';
import { lastSeenText } from '@/core/utils/time';
import { colors, fonts, fontSizes, lineHeights, spacing, radius } from '@/core/theme';
/**
 * اطلاعاتِ مخاطب — چیزی که در تلگرام با تپ روی هدرِ گفتگو باز می‌شود.
 *
 * پیش از این، همان تپ کاربر را به «پروفایلِ اجتماعی» پرتاب می‌کرد: کاروسلِ
 * عکس، دکمه‌ی پسند/نپسند و علاقه‌مندی‌های مشترک. آن صفحه برای کشف است، نه برای
 * کسی که همین حالا وسطِ گفتگوست و می‌خواهد کاری انجام دهد (پیام، مدیا، بی‌صدا
 * کردن، مسدود کردن). این صفحه همان کارها را در دسترس می‌گذارد و پروفایلِ
 * اجتماعی هم یک ردیف پایین‌تر، عمداً یک ضربه دورتر، باقی می‌ماند.
 *
 * چیدمان از بالا به پایین: هویت → کنش‌ها → اجتماع → درباره → گفتگو و امنیت.
 */
export function ChatInfoScreen({
  matchId,
  peerId,
  name,
  photoUrl,
  peerTier,
}: {
  matchId: number;
  peerId?: number;
  name?: string;
  photoUrl?: string;
  peerTier?: number;
}) {
  const vm = useChatInfoViewModel(matchId, peerId);
  const { user } = useSession();
  const { width } = useWindowDimensions();
  const [photoIdx, setPhotoIdx] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const heroW = width - PAGE_PADDING * 2;

  const p = vm.profile;
  const photos = (p?.photos ?? []).map((u) => mediaUrl(u)).filter(Boolean) as string[];
  // تا وقتی پروفایل نرسیده، عکسِ هدرِ گفتگو (که همین حالا در دست است) دیده
  // می‌شود؛ این‌طور صفحه روی شبکه نمی‌لنگد و بعد به عکسِ اصلیِ پروفایل میرسد.
  const fallbackPhoto = mediaUrl(photoUrl);
  const heroUri = photos[0] ?? fallbackPhoto;
  const displayName = p?.name ?? name ?? 'گفتگو';
  const tier = p?.tier ?? peerTier;
  const viewerUri = photos[photoIdx] ?? fallbackPhoto ?? null;

  /**
   * یک خط، چهار حالت — به ترتیبِ فوریت. «پنهان» با «آفلاین» یکی نیست: اگر
   * طرفِ مقابل حضورش را خاموش کرده باشد، گفتنِ «آفلاین» همان چیزی را لو می‌دهد
   * که او پنهان کرده است.
   */
  const presenceLine = (() => {
    const pr = vm.presence;
    if (!pr || pr.hidden) return 'آخرین بازدید نامعلوم';
    if (pr.typing) return 'در حالِ نوشتن…';
    if (pr.online) return 'آنلاین';
    return lastSeenText(pr.lastActiveMin) || 'اخیراً فعال';
  })();

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / heroW);
    if (i !== photoIdx) setPhotoIdx(i);
  };

  const openFollowList = (tab: 'followers' | 'following') => {
    if (!peerId) return;
    // «as Href»: تایپِ مسیرها تولیدی است و مسیرِ تازه تا اجرای بعدیِ expo start
    // شناخته نمی‌شود — همان قراردادِ PeerProfileScreen.
    router.push(
      `/followers?user=${peerId}&tab=${tab}&name=${encodeURIComponent(displayName)}` as Href
    );
  };

  if (vm.loading) {
    return (
      <ScreenContainer>
        <StackHeader title={displayName} />
        <ChatInfoSkeleton heroW={heroW} />
      </ScreenContainer>
    );
  }

  const profileUnavailable = vm.error && !p;

  return (
    <ScreenContainer>
      <StackHeader title={displayName} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* — هویت — */}
        <View style={[styles.hero, { height: heroW * 1.15 }]}>
          {photos.length > 1 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={onScroll}
              scrollEventThrottle={32}
            >
              {photos.map((u) => (
                <Image
                  key={u}
                  source={{ uri: u }}
                  style={{ width: heroW, height: '100%' }}
                  contentFit="cover"
                  transition={180}
                  cachePolicy="memory-disk"
                />
              ))}
            </ScrollView>
          ) : heroUri ? (
            <Pressable
              onPress={() => setViewerOpen(true)}
              accessibilityRole="image"
              accessibilityLabel={`عکسِ ${displayName}`}
            >
              <Image
                source={{ uri: heroUri }}
                style={{ width: heroW, height: '100%' }}
                contentFit="cover"
                transition={180}
                cachePolicy="memory-disk"
              />
            </Pressable>
          ) : (
            <View style={styles.noPhoto}>
              <Text style={styles.noPhotoText}>{(displayName || '؟').charAt(0)}</Text>
            </View>
          )}

          {photos.length > 1 ? (
            <View style={styles.dots}>
              {photos.map((_, i) => (
                <View key={i} style={[styles.dot, i === photoIdx && styles.dotActive]} />
              ))}
            </View>
          ) : null}

          {/* بزرگ‌نمایی — همان لایت‌باکسِ گفتگو (پینچ/دابل‌تپ/زوم). */}
          {heroUri ? (
            <PressableScale
              style={styles.zoomBtn}
              onPress={() => setViewerOpen(true)}
              scaleTo={0.9}
              accessibilityRole="button"
              accessibilityLabel="نمایشِ تمام‌صفحه‌ی عکس"
            >
              <Icon name="plus" size={18} tint="white" />
            </PressableScale>
          ) : null}
        </View>

        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {p?.name ?? name ?? 'بی‌نام'}
            {p?.age ? `، ${faNum(p.age)}` : ''}
          </Text>
          {p?.verified ? <Icon name="shield-check" size={20} tint="gold" /> : null}
          {tier ? <TierBadge tier={tier} /> : null}
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <View style={[styles.presenceDot, vm.presence?.online && styles.presenceDotOn]} />
            <Text style={styles.metaText}>{presenceLine}</Text>
          </View>
          {faDistance(p?.distanceM) ? (
            <View style={styles.metaItem}>
              <Icon name="map" size={13} tint="gold" />
              <Text style={styles.metaText}>{faDistance(p?.distanceM)}</Text>
            </View>
          ) : null}
          {p?.isMatch ? (
            <View style={[styles.metaItem, styles.matchTag]}>
              <Icon name="heart-fill" size={12} tint="white" />
              <Text style={[styles.metaText, styles.matchTagText]}>با هم مَچ شده‌اید</Text>
            </View>
          ) : null}
        </View>

        {/* — پروفایل در دسترس نیست: کنش‌های گفتگو باید سرِ جایشان بمانند — */}
        {profileUnavailable ? (
          <View style={styles.errorWrap}>
            <EmptyState
              icon="rewind"
              title="اطلاعاتِ پروفایل در دسترس نیست"
              hint="ارتباط با سرور ناموفق بود. کنش‌های گفتگو همچنان کار می‌کنند."
              actionLabel="تلاشِ دوباره"
              onAction={() => vm.reload()}
            />
          </View>
        ) : null}

        <ChatInfoActions
          canOpenProfile={!!peerId}
          onMessage={() => router.back()}
          onProfile={() =>
            peerId && router.push({ pathname: '/user/[id]', params: { id: String(peerId) } })
          }
        />

        {/* — اجتماع — */}
        {p ? (
          <>
            <SettingsGroup title="ارتباط">
              <View style={styles.followRow}>
                <FollowStatsRow
                  followersCount={p.followersCount}
                  followingCount={p.followingCount}
                  onOpen={openFollowList}
                />
                <FollowButton
                  isFollowing={p.isFollowing}
                  busy={vm.followBusy}
                  onPress={vm.toggleFollow}
                  size="md"
                  style={styles.followBtn}
                />
              </View>
            </SettingsGroup>
            {p.isFollowedBy ? (
              <View style={styles.followsYou}>
                <Icon name="check" size={12} tint="gold" />
                <Text style={styles.followsYouText}>شما را دنبال می‌کند</Text>
              </View>
            ) : null}
          </>
        ) : null}

        <ProfileInterests
          bio={p?.bio}
          interests={p?.interests ?? []}
          myInterests={user?.interests}
        />

        {/* — گفتگو — */}
        <SettingsGroup title="گفتگو">
          <SettingsToggle
            icon="bell-off"
            title="بی‌صدا کردن‌ی اعلان‌ها"
            hint="پوش نمی‌آید؛ خودِ گفتگو و شمارنده سرِ جایشان‌اند"
            value={vm.muted}
            saving={vm.muteBusy}
            onChange={() => void vm.toggleMute()}
          />
          {vm.shared && vm.shared.counts.photo + vm.shared.counts.voice > 0 ? (
            <SharedMediaPreviewRow
              matchId={matchId}
              items={vm.shared.items}
              counts={vm.shared.counts}
              onOpen={() =>
                router.push(
                  `/shared-media/${matchId}?name=${encodeURIComponent(displayName)}` as Href
                )
              }
            />
          ) : null}
          <SettingsLink
            icon="trash"
            tone="danger"
            title="پاک‌کردنِ تاریخچه"
            hint="فقط از سمتِ تو پاک می‌شود؛ او چیزی نمی‌بیند"
            onPress={() => setConfirmClear(true)}
          />
        </SettingsGroup>

        {/* — امنیت — */}
        <SettingsGroup
          title="امنیت"
          hint="اگر این کاربر آزارت می‌دهد، گزارش بده. گزارش با نامِ تو نمایش داده نمی‌شود."
        >
          <SettingsLink
            icon="shield"
            tone="danger"
            title={vm.reported ? 'گزارش ثبت شد' : 'گزارش'}
            hint={vm.reported ? 'کارشناسانِ ما در حالِ بررسی‌اند' : 'تخلف را به تیمِ پشتیبانی بگو'}
            onPress={peerId ? () => setReportOpen(true) : undefined}
          />
          <SettingsLink
            icon="lock"
            tone="danger"
            title="مسدود کردن"
            hint="دیگر هم را نمی‌بینید و پیامی رد و بدل نمی‌شود"
            onPress={peerId ? () => setConfirmBlock(true) : undefined}
          />
        </SettingsGroup>
      </ScrollView>

      <ActionSheet
        visible={confirmClear}
        title="تاریخچه پاک شود؟"
        subtitle="تاریخچه فقط از سمتِ تو پاک می‌شود. اگر او پیامِ تازه‌ای بدهد، گفتگو با همان پیامِ جدید برمی‌گردد."
        actions={[
          {
            key: 'yes',
            label: 'بله، پاک کن',
            icon: 'close',
            danger: true,
            onPress: () => {
              setConfirmClear(false);
              // موفق ⇒ به تِرِد برمی‌گردیم (تاریخچه دیگر آن‌جا نیست).
              void vm.clearChat().then((ok) => {
                if (ok) router.back();
              });
            },
          },
        ]}
        onDismiss={() => setConfirmClear(false)}
      />

      <ActionSheet
        visible={confirmBlock}
        title={`${displayName} مسدود شود؟`}
        subtitle="دیگر نمی‌توانید به هم پیام بدهید یا هم را ببینید. دنبال‌کردن هم در هر دو جهت پاک می‌شود. هر وقت خواستی، از تنظیمات ← حریمِ خصوصی برش می‌داری."
        actions={[
          {
            key: 'yes',
            label: 'بله، مسدود کن',
            icon: 'lock',
            danger: true,
            onPress: () => {
              setConfirmBlock(false);
              // بلاک کاربر را از گفتگو بیرون می‌برد؛ هم این صفحه و هم تِرِدِ
              // پشتش بی‌معنی می‌شوند، پس کلِ پشته بسته می‌شود.
              void vm.block().then((ok) => {
                if (ok) router.dismissAll();
              });
            },
          },
        ]}
        onDismiss={() => setConfirmBlock(false)}
      />

      <ReportReasonSheet
        visible={reportOpen}
        peerName={displayName}
        busy={vm.reporting}
        error={vm.reportError}
        onSubmit={(reason) => {
          void vm.report(reason).then((ok) => {
            if (ok) setReportOpen(false);
          });
        }}
        onDismiss={() => setReportOpen(false)}
      />

      <PhotoViewer visible={viewerOpen} uri={viewerUri} onClose={() => setViewerOpen(false)} />
    </ScreenContainer>
  );
}

/** یک کنشِ ردیفِ بالا — آیکنِ گرد + برچسب. */
function ActionChip({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      scaleTo={0.92}
      feedback="select"
      style={[styles.chipWrap, disabled && styles.chipDisabled]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.chip}>
        <Icon name={icon} size={22} tint="gold" />
      </View>
      <Text style={styles.chipLabel} numberOfLines={1}>
        {label}
      </Text>
    </PressableScale>
  );
}

/**
 * ردیفِ کنش‌های سریعِ بالای صفحه.
 *
 * هر آیتمِ تازه (مدیا، بی‌صدا، جست‌وجو) یک `ActionChip` دیگر است و کارت خودش
 * را با `flex: 1` بین‌شان تقسیم می‌کند؛ پس افزودن گزینه چیدمان را نمی‌شکند.
 */
function ChatInfoActions({
  canOpenProfile,
  onMessage,
  onProfile,
}: {
  canOpenProfile: boolean;
  onMessage: () => void;
  onProfile: () => void;
}) {
  return (
    <View style={styles.actionsCard}>
      <ActionChip icon="send-fill" label="پیام" onPress={onMessage} />
      <ActionChip
        icon="tab-profile"
        label="پروفایل"
        onPress={onProfile}
        disabled={!canOpenProfile}
      />
    </View>
  );
}

/** اسکلتِ صفحه — همان ریختِ نهایی، تا پرشِ چیدمان نداشته باشیم. */
function ChatInfoSkeleton({ heroW }: { heroW: number }) {
  return (
    <View style={styles.skeleton}>
      <Skeleton width="100%" height={heroW * 1.15} br={radius.xl} />
      <Skeleton width="55%" height={22} style={styles.skelName} />
      <Skeleton width="75%" height={14} style={styles.skelMeta} />
      <Skeleton width="100%" height={92} br={radius.lg} style={styles.skelBlock} />
      <Skeleton width="100%" height={72} br={radius.lg} style={styles.skelBlock} />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl },
  hero: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.rim,
  },
  noPhoto: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface2 },
  noPhotoText: { fontFamily: fonts.bold, fontSize: 72, color: colors.goldSoft },
  dots: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: { backgroundColor: colors.gold2, width: 16 },
  zoomBtn: {
    position: 'absolute',
    left: spacing.md,
    bottom: spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  nameRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  name: {
    flexShrink: 1,
    fontFamily: fonts.bold,
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  metaRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  metaItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5 },
  presenceDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.ink3 },
  presenceDotOn: { backgroundColor: '#5BD08F' },
  metaText: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.ink2 },
  matchTag: {
    backgroundColor: colors.roseFaint,
    borderWidth: 1,
    borderColor: 'rgba(255,92,122,0.35)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
  },
  matchTagText: { color: colors.rose, fontSize: fontSizes.xs },
  errorWrap: { marginTop: spacing.lg },
  actionsCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.rim,
    backgroundColor: colors.surface2,
  },
  chipWrap: { flex: 1, alignItems: 'center', gap: spacing.sm },
  chipDisabled: { opacity: 0.45 },
  chip: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.goldFaint,
    borderWidth: 1,
    borderColor: colors.goldSoft,
  },
  chipLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    color: colors.ink2,
    writingDirection: 'rtl',
  },
  followRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  followBtn: { minWidth: 132 },
  followsYou: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.goldFaint,
    borderWidth: 1,
    borderColor: colors.goldSoft,
  },
  followsYouText: { fontFamily: fonts.medium, fontSize: fontSizes.xs, color: colors.gold2 },
  skeleton: { paddingBottom: spacing.xxl },
  skelName: { alignSelf: 'flex-end', marginTop: spacing.lg },
  skelMeta: { alignSelf: 'flex-end', marginTop: spacing.sm },
  skelBlock: { marginTop: spacing.xl },
});