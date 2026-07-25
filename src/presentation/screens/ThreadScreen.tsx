import React, { useMemo, useRef } from 'react';
import { View, Text, TextInput, Pressable, FlatList, StyleSheet, Platform } from 'react-native';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
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

/**
 * پیام‌ها را با جداکننده‌ی روز و گروه‌بندیِ فرستنده به سطرهای رندر تبدیل می‌کند.
 * خروجی **وارونه** است چون فهرست با `inverted` رندر می‌شود: خانه‌ی صفر پایینِ صفحه
 * (تازه‌ترین پیام) می‌نشیند. با این کار باز شدنِ کیبورد یا بلند شدنِ ورودی، ته‌ی
 * گفتگو را جابه‌جا نمی‌کند — دقیقاً مثلِ تلگرام.
 */
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
  // ترتیبِ صعودی ساخته شد؛ برای فهرستِ وارونه باید برعکس شود.
  return rows.reverse();
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
  const listRef = useRef<FlatList<Row>>(null);
  const rows = useMemo(() => buildRows(vm.messages, vm.myId), [vm.messages, vm.myId]);

  // در فهرستِ وارونه، «انتها» یعنی قدیمی‌ترین پیام؛ پس صفحه‌بندیِ گذشته به onEndReached
  // وصل می‌شود. چون این پیام‌ها بعد از سطرهای موجود می‌آیند، اسکرول تکان نمی‌خورد و
  // دیگر به ترفندِ نگه‌داشتنِ موقعیت نیازی نیست.
  const onEndReached = () => {
    if (!vm.hasMore || vm.loadingOlder) return;
    vm.loadOlder();
  };
  const canSend = !!vm.draft.trim() && !vm.sending;

  /*
   * ردیابیِ کیبورد روی رشته‌ی UI (بدونِ رفت‌وبرگشتِ جاوااسکریپت):
   * `height` از keyboard-controller در هر فریمِ انیمیشن به‌روز می‌شود (هنگامِ باز بودن
   * منفی است). یک فاصله‌گیرِ متحرک در پایینِ صفحه می‌گذاریم که ارتفاعش برابرِ همان
   * مقدار است؛ نوارِ نوشتن با آن بالا می‌آید و فهرست به همان اندازه کوتاه می‌شود.
   *
   * چرا max با insets.bottom؟ اپ edge-to-edge است و در این حالت ارتفاعِ گزارش‌شده‌ی
   * کیبورد شاملِ ناحیه‌ی نوارِ ناوبری هم هست. اگر insets.bottom را جداگانه اضافه کنیم
   * با کیبوردِ باز یک فاصله‌ی دوتایی می‌افتد؛ با max، کیبورد آن را «می‌بلعد» و با
   * کیبوردِ بسته همان اینستِ نوارِ اشاره‌ای باقی می‌ماند.
   */
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();
  const bottomSpacer = useAnimatedStyle(() => ({
    height: Math.max(-keyboardHeight.value, insets.bottom),
  }));

  // ارسال → پریدن به تازه‌ترین پیام (در فهرستِ وارونه یعنی آفستِ صفر).
  const onSend = () => {
    void vm.send();
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

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

      {/*
       * بدنه‌ی گفتگو: فهرست + نوارِ نوشتن + فاصله‌گیرِ متحرکِ کیبورد. هیچ
       * KeyboardAvoidingView‌ای در کار نیست؛ ارتفاعِ فاصله‌گیر مستقیماً از انیمیشنِ
       * کیبورد می‌آید تا حرکت روی رشته‌ی UI و بدونِ لرزش باشد.
       */}
      <View style={styles.flex}>
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
            inverted
            keyExtractor={(r) => r.key}
            contentContainerStyle={styles.list}
            // پیامِ تازه در ابتدای داده می‌نشیند؛ اگر کاربر بالا رفته باشد نباید صفحه
            // زیرِ دستش بپرد. آستانه هم باعث می‌شود وقتی ته‌ی گفتگوییم خودکار بچسبیم.
            maintainVisibleContentPosition={{ minIndexForVisible: 0, autoscrollToTopThreshold: 10 }}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.2}
            // کشیدنِ فهرست کیبورد را می‌بندد. مقدارِ interactive فقط روی iOS معنا دارد
            // و روی اندروید بی‌صدا نادیده گرفته می‌شود؛ آنجا on-drag لازم است.
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            ListFooterComponent={
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
          <View style={styles.lockedBar}>
            <Text style={styles.lockedText}>
              {`این کاربر سطحِ ${tierName(peerTier!)} دارد. برای شروعِ گفتگو باید سطحِ حسابت را ارتقا بدهی.`}
            </Text>
            <Button
              label="مشاهده‌ی سطح‌های اشتراک"
              size="sm"
              onPress={() =>
                router.push({
                  pathname: '/plans',
                  params: { required: String(peerTier ?? 2), feature: 'شروعِ گفتگو با این کاربر' },
                })
              }
            />
          </View>
        ) : (
        <View style={styles.composer}>
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
            onPress={onSend}
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

        {/* ناحیه‌ی امنِ پایین وقتی کیبورد بسته است، و جای خودِ کیبورد وقتی باز است. */}
        <Animated.View style={bottomSpacer} />
      </View>
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
  // فهرست وارونه است، پس paddingهای این ظرف هم وارونه دیده می‌شوند: paddingTop
  // فاصله‌ی نزدیکِ نوارِ نوشتن و paddingBottom فاصله‌ی بالای صفحه است.
  list: { padding: spacing.lg, paddingTop: spacing.sm },
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
    // فاصله‌ی پایین ثابت است؛ ناحیه‌ی امن/کیبورد را فاصله‌گیرِ متحرکِ زیرِ نوار می‌دهد.
    paddingVertical: spacing.md,
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
    paddingVertical: spacing.md,
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
