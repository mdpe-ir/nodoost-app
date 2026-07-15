import React, { useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenContainer } from '@/presentation/components/ScreenContainer';
import { BubblesSkeleton, Skeleton } from '@/presentation/components/Skeleton';
import { EmptyState } from '@/presentation/components/EmptyState';
import { Avatar } from '@/presentation/components/Avatar';
import { Icon } from '@/presentation/components/Icon';
import { Button } from '@/presentation/components/Button';
import { TierBadge, tierName } from '@/presentation/components/TierBadge';
import { useThreadViewModel } from '@/presentation/hooks/useThreadViewModel';
import { faClock, faDayLabel, dayKey } from '@/core/utils/time';
import { colors, fonts, fontSizes, lineHeights, spacing, radius, gradients } from '@/core/theme';
import type { Message } from '@/domain/entities';

type Row =
  | { type: 'sep'; key: string; label: string }
  | {
      type: 'msg';
      key: string;
      msg: Message;
      mine: boolean;
      /** آخرینِ گروهِ پیاپیِ یک فرستنده — دُمِ حباب و ساعت فقط اینجا. */
      lastOfGroup: boolean;
      firstOfGroup: boolean;
    };

/** پیام‌ها را با جداکننده‌ی روز و گروه‌بندیِ فرستنده به سطرهای رندر تبدیل می‌کند. */
function buildRows(messages: Message[], myId?: number): Row[] {
  const rows: Row[] = [];
  messages.forEach((m, i) => {
    const prev = messages[i - 1];
    const next = messages[i + 1];
    const day = dayKey(m.createdAt);
    if (!prev || dayKey(prev.createdAt) !== day) {
      rows.push({ type: 'sep', key: `sep-${day}-${i}`, label: faDayLabel(m.createdAt) });
    }
    const sameAsPrev = !!prev && prev.senderId === m.senderId && dayKey(prev.createdAt) === day;
    const sameAsNext = !!next && next.senderId === m.senderId && dayKey(next.createdAt) === day;
    rows.push({
      type: 'msg',
      key: String(m.id ?? `i${i}`),
      msg: m,
      mine: m.senderId === myId,
      firstOfGroup: !sameAsPrev,
      lastOfGroup: !sameAsNext,
    });
  });
  return rows;
}

export function ThreadScreen({
  matchId,
  name,
  peerId,
  photoUrl,
  peerTier,
}: {
  matchId: number;
  name?: string;
  peerId?: number;
  photoUrl?: string;
  peerTier?: number;
}) {
  const vm = useThreadViewModel(matchId);
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList>(null);
  // هنگامِ افزودنِ پیام‌های قدیمی به بالای فهرست، نباید به انتها بپریم.
  const prependingRef = useRef(false);
  const rows = useMemo(() => buildRows(vm.messages, vm.myId), [vm.messages, vm.myId]);

  // رسیدن به بالای فهرست → بارگذاریِ صفحه‌ی قدیمی‌ترِ بعدی (با حفظِ موقعیتِ اسکرول).
  const onStartReached = () => {
    if (!vm.hasMore || vm.loadingOlder) return;
    prependingRef.current = true;
    vm.loadOlder();
  };
  const canSend = !!vm.draft.trim() && !vm.sending;
  // قانونِ سطح: تا وقتی گفتگو پیامی ندارد، فقط هم‌سطح یا بالاتر می‌تواند شروع کند.
  // اگر طرفِ مقابل سطحِ بالاتری دارد، ورودی قفل می‌شود تا او پیامِ اول را بدهد.
  const tierLocked = !vm.loading && vm.messages.length === 0 && !!peerTier && peerTier > vm.myTier;

  const openPeerProfile = () => {
    if (peerId) router.push({ pathname: '/user/[id]', params: { id: String(peerId) } });
  };

  return (
    <ScreenContainer flush>
      <View style={styles.header}>
        <Pressable
          hitSlop={10}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="بازگشت"
          style={({ pressed }) => [styles.back, pressed && styles.backPressed]}
        >
          {/* در RTL بازگشت به سمتِ راست است — شورونِ رو به راست */}
          <Icon name="chevron-next" size={22} tint="white" />
        </Pressable>
        {/* تپِ آواتار/نام → پروفایلِ طرفِ مقابل */}
        <Pressable
          onPress={openPeerProfile}
          disabled={!peerId}
          style={styles.headerPeer}
          accessibilityRole="button"
          accessibilityLabel={`پروفایلِ ${name ?? 'کاربر'}`}
        >
          <Avatar uri={photoUrl} name={name} size={40} ring />
          <View style={styles.headerText}>
            <View style={styles.headerNameRow}>
              <Text style={styles.headerName} numberOfLines={1}>
                {name || 'گفتگو'}
              </Text>
              {peerTier ? <TierBadge tier={peerTier} height={18} /> : null}
            </View>
            {peerId ? <Text style={styles.headerHint}>دیدنِ پروفایل</Text> : null}
          </View>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 64}
      >
        {vm.loading ? (
          <BubblesSkeleton />
        ) : rows.length === 0 ? (
          <View style={styles.emptyWrap}>
            <EmptyState
              icon="heart-fill"
              title={name ? `با ${name} مَچ شدی` : 'مَچ شدید'}
              hint={
                tierLocked
                  ? 'او سطحِ بالاتری دارد؛ هر وقت پیام بدهد می‌توانی پاسخ بدهی.'
                  : 'یخ را بشکن — یک سلامِ ساده بهترین شروع است.'
              }
            />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={rows}
            keyExtractor={(r) => r.key}
            contentContainerStyle={styles.list}
            onContentSizeChange={() => {
              // در حالتِ افزودنِ پیام‌های قدیمی به بالا، جای اسکرول را نگه می‌داریم؛
              // فقط برای پیام‌های تازه/بارِ اول به انتها می‌رویم.
              if (prependingRef.current) {
                prependingRef.current = false;
                return;
              }
              listRef.current?.scrollToEnd({ animated: false });
            }}
            maintainVisibleContentPosition={{ minIndexForVisible: 1 }}
            onStartReached={onStartReached}
            onStartReachedThreshold={0.2}
            ListHeaderComponent={
              vm.loadingOlder ? (
                <View style={styles.olderLoading}>
                  <Skeleton width={160} height={38} br={radius.lg} style={{ alignSelf: 'flex-start' }} />
                  <Skeleton width={200} height={38} br={radius.lg} style={{ alignSelf: 'flex-end', marginTop: 8 }} />
                </View>
              ) : null
            }
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              if (item.type === 'sep') {
                return (
                  <View style={styles.sepWrap}>
                    <Text style={styles.sepText}>{item.label}</Text>
                  </View>
                );
              }
              const { msg, mine, firstOfGroup, lastOfGroup } = item;
              const time = faClock(msg.createdAt);
              return (
                <View
                  style={[
                    styles.bubble,
                    mine ? styles.mine : styles.theirs,
                    firstOfGroup && styles.firstOfGroup,
                    mine && lastOfGroup && styles.mineTail,
                    !mine && lastOfGroup && styles.theirsTail,
                  ]}
                >
                  <Text style={[styles.bubbleText, mine ? styles.mineText : styles.theirsText]}>
                    {msg.body}
                  </Text>
                  {lastOfGroup && time ? (
                    <Text style={[styles.time, mine ? styles.timeMine : styles.timeTheirs]}>
                      {time}
                      {/* رسیدِ خواندن — سرور فقط برای طلایی+ می‌فرستد. */}
                      {mine && msg.readAt ? '  · خوانده شد' : ''}
                    </Text>
                  ) : null}
                </View>
              );
            }}
          />
        )}

        {tierLocked ? (
          <View style={[styles.lockedBar, { paddingBottom: Math.max(spacing.md, insets.bottom + spacing.sm) }]}>
            <Text style={styles.lockedText}>
              {`این کاربر سطحِ ${tierName(peerTier!)} دارد. برای شروعِ گفتگو باید سطحِ حسابت را ارتقا بدهی.`}
            </Text>
            <Button
              label="مشاهده‌ی سطح‌های اشتراک"
              size="sm"
              onPress={() => router.push('/profile?tab=plans')}
            />
          </View>
        ) : (
        <View style={[styles.composer, { paddingBottom: Math.max(spacing.md, insets.bottom + spacing.sm) }]}>
          {vm.sendError ? <Text style={styles.sendError}>{vm.sendError}</Text> : null}
          <TextInput
            style={styles.input}
            value={vm.draft}
            onChangeText={vm.setDraft}
            placeholder="پیامت را بنویس…"
            placeholderTextColor={colors.ink3}
            textAlign="right"
            multiline
          />
          <Pressable
            style={({ pressed }) => [styles.send, pressed && canSend && styles.sendPressed]}
            onPress={vm.send}
            disabled={!canSend}
            accessibilityRole="button"
            accessibilityLabel="ارسال"
          >
            <LinearGradient
              colors={gradients.gold}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, !canSend && styles.sendOff]}
            />
            <Icon name="send-fill" size={20} tint="ink" />
          </Pressable>
        </View>
        )}
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPressed: { backgroundColor: colors.surface },
  headerPeer: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md },
  headerText: { flex: 1 },
  headerNameRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  headerHint: { fontFamily: fonts.regular, fontSize: fontSizes.xs, color: colors.ink3, textAlign: 'right' },
  headerName: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  emptyWrap: { flex: 1, justifyContent: 'center' },
  list: { padding: spacing.lg, paddingBottom: spacing.sm },
  olderLoading: { paddingBottom: spacing.md },
  sepWrap: {
    alignSelf: 'center',
    marginVertical: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  sepText: { fontFamily: fonts.medium, fontSize: fontSizes.xs, color: colors.ink3 },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    marginTop: 2,
  },
  firstOfGroup: { marginTop: spacing.sm + 2 },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.gold },
  mineTail: { borderBottomRightRadius: 4 },
  theirs: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  theirsTail: { borderBottomLeftRadius: 4 },
  bubbleText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  mineText: { color: colors.onGold },
  theirsText: { color: colors.ink },
  time: { fontFamily: fonts.regular, fontSize: 10, marginTop: 3, textAlign: 'left' },
  timeMine: { color: 'rgba(42,29,18,0.6)' },
  timeTheirs: { color: colors.ink3 },
  composer: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    backgroundColor: colors.bg,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 46,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 12 : 8,
    paddingBottom: Platform.OS === 'ios' ? 12 : 8,
    color: colors.ink,
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    writingDirection: 'rtl',
  },
  send: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendPressed: { transform: [{ scale: 0.92 }] },
  sendOff: { opacity: 0.35 },
  lockedBar: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    backgroundColor: colors.bg,
    alignItems: 'center',
  },
  lockedText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink2,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  sendError: {
    position: 'absolute',
    top: -34,
    left: spacing.md,
    right: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: colors.roseFaint,
    color: colors.rose,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    textAlign: 'center',
    writingDirection: 'rtl',
    overflow: 'hidden',
  },
});
