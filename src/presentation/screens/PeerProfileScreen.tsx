import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { ScreenContainer, PAGE_PADDING } from '@/presentation/components/ScreenContainer';
import { StackHeader } from '@/presentation/components/StackHeader';
import { PeerProfileSkeleton } from '@/presentation/components/Skeleton';
import { EmptyState } from '@/presentation/components/EmptyState';
import { Icon } from '@/presentation/components/Icon';
import { Button } from '@/presentation/components/Button';
import { Scrim } from '@/presentation/components/Scrim';
import { TierBadge } from '@/presentation/components/TierBadge';
import { TierLockModal } from '@/presentation/components/TierLockModal';
import { MatchOverlay } from '@/presentation/components/MatchOverlay';
import { FollowButton } from '@/presentation/components/FollowButton';
import { usePeerProfileViewModel } from '@/presentation/hooks/usePeerProfileViewModel';
import { useSession } from '@/presentation/providers/SessionProvider';
import { mediaUrl } from '@/core/http/mediaUrl';
import { faNum, faDistance } from '@/core/utils/faNum';
import { colors, fonts, fontSizes, lineHeights, spacing, radius } from '@/core/theme';

/** برچسبِ آخرین فعالیت — «آنلاین» تا ۵ دقیقه، بعد دقیقه/ساعت/روز. */
const faLastActive = (isOnline?: boolean, min?: number): string => {
  if (isOnline) return 'آنلاین';
  if (min == null) return 'اخیراً فعال';
  if (min < 60) return `فعال ${faNum(Math.max(1, min))} دقیقه پیش`;
  if (min < 60 * 24) return `فعال ${faNum(Math.floor(min / 60))} ساعت پیش`;
  return `فعال ${faNum(Math.floor(min / (60 * 24)))} روز پیش`;
};

/** شمارنده‌ی قابلِ ضربه‌ی «دنبال‌کننده/دنبال‌شده». */
function FollowStat({
  value,
  label,
  onPress,
}: {
  value: number;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${faNum(value)}`}
      style={({ pressed }) => [styles.followStat, pressed && styles.followStatPressed]}
    >
      <Text style={styles.followStatValue}>{faNum(value)}</Text>
      <Text style={styles.followStatLabel}>{label}</Text>
    </Pressable>
  );
}

/** پروفایلِ عمومیِ یک کاربرِ دیگر — عکس‌ها، معرفی، علاقه‌مندی‌ها و کنشِ پسند. */
export function PeerProfileScreen({ userId }: { userId: number }) {
  const vm = usePeerProfileViewModel(userId);
  const { user } = useSession();
  const { width } = useWindowDimensions();
  const [photoIdx, setPhotoIdx] = useState(0);
  const [lockOpen, setLockOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportError, setReportError] = useState(false);
  const heroW = width - PAGE_PADDING * 2;

  if (vm.loading) {
    return (
      <ScreenContainer>
        <StackHeader title="پروفایل" />
        <PeerProfileSkeleton />
      </ScreenContainer>
    );
  }

  if (vm.error || !vm.profile) {
    return (
      <ScreenContainer>
        <StackHeader title="پروفایل" />
        <View style={styles.center}>
          <EmptyState
            icon="rewind"
            title="پروفایل در دسترس نیست"
            hint="ارتباط با سرور ناموفق بود یا این کاربر دیگر فعال نیست."
            actionLabel="تلاشِ دوباره"
            onAction={vm.reload}
          />
        </View>
      </ScreenContainer>
    );
  }

  const p = vm.profile;
  const photos = p.photos.map((u) => mediaUrl(u)).filter(Boolean) as string[];
  // قانونِ سطح: شروعِ گفتگو فقط با هم‌سطح یا پایین‌تر؛ پیام روی سطحِ بالاتر قفل است.
  const myTier = user?.tier ?? 1;
  const tierLocked = !!p.tier && p.tier > myTier;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / heroW);
    if (i !== photoIdx) setPhotoIdx(i);
  };

  // «as Href»: تایپِ مسیرها تولیدی است و مسیرِ تازه تا اجرای بعدیِ expo start شناخته نمی‌شود.
  const openFollowList = (tab: 'followers' | 'following') =>
    router.push(
      `/followers?user=${p.id}&tab=${tab}&name=${encodeURIComponent(p.name ?? '')}` as Href
    );

  return (
    <ScreenContainer>
      <StackHeader title={p.name ?? 'پروفایل'} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={[styles.hero, { height: heroW * 1.15 }]}>
          {photos.length > 0 ? (
            <>
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
              <Scrim height="35%" />
              {photos.length > 1 ? (
                <View style={styles.dots}>
                  {photos.map((_, i) => (
                    <View key={i} style={[styles.dot, i === photoIdx && styles.dotActive]} />
                  ))}
                </View>
              ) : null}
            </>
          ) : (
            <View style={styles.noPhoto}>
              <Text style={styles.noPhotoText}>{(p.name || '؟').charAt(0)}</Text>
            </View>
          )}
        </View>

        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {p.name ?? 'بی‌نام'}
            {p.age ? `، ${faNum(p.age)}` : ''}
          </Text>
          {p.verified ? <Icon name="shield-check" size={20} tint="gold" /> : null}
          {p.tier ? <TierBadge tier={p.tier} /> : null}
        </View>

        <View style={styles.metaRow}>
          {faDistance(p.distanceM) ? (
            <View style={styles.metaItem}>
              <Icon name="map" size={13} tint="gold" />
              <Text style={styles.metaText}>{faDistance(p.distanceM)}</Text>
            </View>
          ) : null}
          {/* آخرین فعالیت — سرور فقط برای بیننده‌ی نقره‌ای+ می‌فرستد */}
          {p.isOnline != null ? (
            <View style={styles.metaItem}>
              <View style={[styles.presenceDot, p.isOnline && styles.presenceDotOn]} />
              <Text style={styles.metaText}>{faLastActive(p.isOnline, p.lastActiveMin)}</Text>
            </View>
          ) : null}
          {p.isMatch ? (
            <View style={[styles.metaItem, styles.matchTag]}>
              <Icon name="heart-fill" size={12} tint="white" />
              <Text style={[styles.metaText, styles.matchTagText]}>با هم مَچ شده‌اید</Text>
            </View>
          ) : null}
        </View>

        {/* — گرافِ دنبال‌کردن: رایگان برای همه‌ی سطح‌ها، بدونِ هیچ قفلِ اشتراکی — */}
        <View style={styles.followRow}>
          <View style={styles.followCounts}>
            <FollowStat
              value={p.followersCount}
              label="دنبال‌کننده"
              onPress={() => openFollowList('followers')}
            />
            <View style={styles.followDivider} />
            <FollowStat
              value={p.followingCount}
              label="دنبال‌شده"
              onPress={() => openFollowList('following')}
            />
          </View>
          <FollowButton
            isFollowing={p.isFollowing}
            busy={vm.followBusy}
            onPress={vm.toggleFollow}
            size="md"
            style={styles.followBtn}
          />
        </View>
        {p.isFollowedBy ? (
          <View style={styles.followsYou}>
            <Icon name="check" size={12} tint="gold" />
            <Text style={styles.followsYouText}>شما را دنبال می‌کند</Text>
          </View>
        ) : null}

        {p.bio ? (
          <>
            <Text style={styles.section}>درباره‌اش</Text>
            <Text style={styles.bio}>{p.bio}</Text>
          </>
        ) : null}

        {p.interests.length > 0 ? (() => {
          // علاقه‌مندی‌های مشترک با بیننده طلایی و اول نمایش داده می‌شوند — نقطه‌ی اتصالِ گفتگو.
          const mine = new Set(user?.interests ?? []);
          const shared = p.interests.filter((l) => mine.has(l));
          const rest = p.interests.filter((l) => !mine.has(l));
          return (
            <>
              <Text style={styles.section}>علاقه‌مندی‌ها</Text>
              {shared.length > 0 ? (
                <Text style={styles.sharedNote}>
                  {faNum(shared.length)} علاقه‌ی مشترک دارید ✨
                </Text>
              ) : null}
              <View style={styles.interests}>
                {[...shared, ...rest].map((label) => {
                  const isShared = mine.has(label);
                  return (
                    <View key={label} style={[styles.interest, isShared && styles.interestShared]}>
                      <Text style={[styles.interestText, isShared && styles.interestTextShared]}>
                        {label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </>
          );
        })() : null}

        {/* کنش‌ها کنارِ هم — پسندیدن راست، ارسالِ پیام چپ */}
        <View style={styles.actions}>
          {!p.isMatch ? (
            <Button
              label={vm.liked ? 'پسندیدی — لغو' : vm.disliked ? 'نپسندیدی — لغو' : 'پسندیدن'}
              icon={vm.liked || vm.disliked ? 'rewind' : 'heart-fill'}
              variant={vm.liked || vm.disliked ? 'outline' : 'gold'}
              onPress={vm.liked || vm.disliked ? vm.undoSwipe : vm.like}
              loading={vm.swiping}
              style={styles.actionBtn}
            />
          ) : null}
          <Button
            label={tierLocked ? 'برای پیام، ارتقای سطح' : 'ارسالِ پیام'}
            icon="tab-chat"
            variant={p.isMatch && !tierLocked ? 'gold' : 'outline'}
            loading={vm.openingChat}
            onPress={async () => {
              if (tierLocked) {
                setLockOpen(true);
                return;
              }
              const matchId = await vm.startChat();
              if (matchId) {
                router.push({
                  pathname: '/thread/[id]',
                  params: {
                    id: String(matchId),
                    name: p.name ?? '',
                    peerId: String(p.id),
                    photoUrl: p.photos[0] ?? '',
                    peerTier: String(p.tier ?? ''),
                  },
                });
              }
            }}
            style={styles.actionBtn}
          />
        </View>

        {/* نپسندیدن — فقط تا وقتی هیچ کنشی روی این کاربر ثبت نشده */}
        {!p.isMatch && !vm.liked && !vm.disliked ? (
          <Button
            label="نپسندیدن"
            icon="close"
            variant="ghost"
            onPress={vm.dislike}
            loading={vm.swiping}
            size="md"
            style={styles.dislikeBtn}
          />
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="گزارش عکس پروفایل"
          onPress={() => setReportOpen(true)}
          style={({ pressed }) => [styles.reportLink, pressed && styles.reportLinkPressed]}
        >
          <Icon name="shield" size={15} tint="ink" />
          <Text style={styles.reportLinkText}>{vm.reported ? 'گزارش ثبت شد' : 'گزارش عکس پروفایل'}</Text>
        </Pressable>
      </ScrollView>

      {vm.match ? (
        <MatchOverlay
          peerName={p.name}
          peerPhotoUrl={p.photos[0]}
          onChat={() => {
            const id = vm.match?.matchId;
            vm.dismissMatch();
            if (id) router.push({
              pathname: '/thread/[id]',
              params: {
                id: String(id),
                name: p.name ?? '',
                peerId: String(p.id),
                photoUrl: p.photos[0] ?? '',
                peerTier: String(p.tier ?? ''),
              },
            });
            else router.push('/chat');
          }}
          onDismiss={vm.dismissMatch}
        />
      ) : null}

      <TierLockModal visible={lockOpen} requiredTier={p.tier ?? 1} onClose={() => setLockOpen(false)} />

      <Modal visible={reportOpen} transparent animationType="fade" onRequestClose={() => setReportOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.reportModal}>
            <Text style={styles.reportTitle}>گزارش عکس پروفایل</Text>
            <Text style={styles.reportHint}>لطفاً کوتاه توضیح بده چرا این تصویر مناسب نیست.</Text>
            <TextInput
              autoFocus
              multiline
              maxLength={500}
              value={reportReason}
              onChangeText={(value) => { setReportReason(value); setReportError(false); }}
              placeholder="دلیل گزارش…"
              placeholderTextColor={colors.ink3}
              style={styles.reportInput}
              textAlign="right"
            />
            {reportError ? <Text style={styles.reportError}>ثبت گزارش ناموفق بود؛ دوباره تلاش کن.</Text> : null}
            <View style={styles.modalActions}>
              <Button
                label="ثبت گزارش"
                loading={vm.reporting}
                disabled={!reportReason.trim()}
                onPress={async () => {
                  const ok = await vm.reportPhoto(p.photoIds[photoIdx], reportReason.trim());
                  if (ok) { setReportOpen(false); setReportReason(''); }
                  else setReportError(true);
                }}
                style={styles.modalButton}
              />
              <Button label="انصراف" variant="outline" onPress={() => setReportOpen(false)} style={styles.modalButton} />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center' },
  scroll: { paddingBottom: spacing.xxl },
  hero: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
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
  metaRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md, marginTop: spacing.xs },
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
  reportLink: { flexDirection: 'row-reverse', alignSelf: 'center', alignItems: 'center', gap: spacing.xs, marginTop: spacing.lg, padding: spacing.sm },
  reportLinkPressed: { opacity: 0.6 },
  reportLinkText: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.ink2 },
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: 'rgba(0,0,0,0.72)' },
  reportModal: { borderRadius: radius.xl, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, padding: spacing.lg },
  reportTitle: { fontFamily: fonts.bold, fontSize: fontSizes.lg, color: colors.ink, textAlign: 'right' },
  reportHint: { marginTop: spacing.xs, fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.ink2, textAlign: 'right' },
  reportInput: { minHeight: 110, marginTop: spacing.md, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: spacing.md, fontFamily: fonts.regular, color: colors.ink, backgroundColor: colors.surface2, textAlignVertical: 'top' },
  reportError: { marginTop: spacing.xs, fontFamily: fonts.regular, fontSize: fontSizes.xs, color: colors.rose, textAlign: 'right' },
  modalActions: { flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.md },
  modalButton: { flex: 1 },
  section: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  bio: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  interests: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm },
  interest: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  interestText: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.ink2 },
  interestShared: { borderColor: colors.gold, backgroundColor: colors.goldFaint },
  interestTextShared: { color: colors.gold2 },
  sharedNote: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.gold2,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.sm,
  },
  followRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  followCounts: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center' },
  followDivider: { width: 1, height: 24, backgroundColor: colors.line, marginHorizontal: spacing.md },
  followStat: { alignItems: 'center' },
  followStatPressed: { opacity: 0.6 },
  followStatValue: { fontFamily: fonts.bold, fontSize: fontSizes.md, color: colors.ink },
  followStatLabel: { fontFamily: fonts.regular, fontSize: fontSizes.xs, color: colors.ink3 },
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
  actions: { flexDirection: 'row-reverse', marginTop: spacing.xl, gap: spacing.md },
  actionBtn: { flex: 1 },
  dislikeBtn: { marginTop: spacing.sm },
});
