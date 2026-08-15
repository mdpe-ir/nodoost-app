import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ScrollView,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { PressableScale } from '@/presentation/components/PressableScale';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenContainer } from '@/presentation/components/ScreenContainer';
import { ChatBackground } from '@/presentation/components/ChatBackground';
import { StackHeader } from '@/presentation/components/StackHeader';
import { RowsSkeleton, Skeleton } from '@/presentation/components/Skeleton';
import { EmptyState } from '@/presentation/components/EmptyState';
import { Avatar } from '@/presentation/components/Avatar';
import { Icon } from '@/presentation/components/Icon';
import { useSupportViewModel } from '@/presentation/hooks/useSupportViewModel';
import { faClock, faDayLabel, dayKey } from '@/core/utils/time';
import { colors, fonts, fontSizes, lineHeights, spacing, radius, gradients } from '@/core/theme';
import type { Message } from '@/domain/entities';

/**
 * پرسش‌های پرتکرار — عمداً سمتِ کلاینت است: پاسخ‌ها به وضعیتِ کاربر بستگی ندارند
 * و نمایششان پیش از باز شدنِ تیکت، بارِ صفِ پشتیبانی را کم می‌کند.
 */
const FAQ: { q: string; a: string }[] = [
  {
    q: 'پرداخت کردم ولی اشتراکم فعال نشد',
    a: 'اپ را ببند و دوباره باز کن؛ رسیدِ پرداخت خودکار بررسی می‌شود. اگر بعد از چند دقیقه هنوز فعال نشده بود، موضوعِ «پرداخت و اشتراک» را انتخاب کن و شماره‌ی پیگیری را برایمان بفرست.',
  },
  {
    q: 'چطور حسابم را حذف کنم؟',
    a: 'از بخشِ «من» ← تنظیمات ← پایینِ صفحه، گزینه‌ی حذفِ حساب هست. حذف برگشت‌ناپذیر است و همه‌ی گفتگوها و عکس‌هایت پاک می‌شود.',
  },
  {
    q: 'عکسم تأیید نمی‌شود',
    a: 'عکس باید واضح باشد، چهره‌ات پیدا باشد و شماره‌ی تماس یا آی‌دیِ شبکه‌های اجتماعی رویش نباشد. اگر مطمئنی مشکلی ندارد، موضوعِ «مشکلِ فنی» را بزن.',
  },
  {
    q: 'کسی مزاحمم شده',
    a: 'از پروفایلِ آن کاربر می‌توانی او را مسدود یا گزارش کنی. برای موارد جدی موضوعِ «گزارشِ تخلف» را انتخاب کن و نامِ کاربری‌اش را بنویس.',
  },
];

type Row =
  | { type: 'sep'; key: string; label: string }
  | {
      type: 'msg';
      key: string;
      msg: Message;
      mine: boolean;
      lastOfGroup: boolean;
      firstOfGroup: boolean;
    };

/**
 * همان الگوی ThreadScreen: جداکننده‌ی روز + گروه‌بندیِ فرستنده، و خروجیِ وارونه
 * چون فهرست با `inverted` رندر می‌شود.
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
  return rows.reverse();
}

/** سربرگِ حسابِ رسمی — چهره + نام + نشانِ تأیید. */
function OfficialHeader({
  name,
  photoUrl,
  subtitle,
}: {
  name?: string;
  photoUrl?: string;
  subtitle: string;
}) {
  return (
    <View style={styles.official}>
      <Avatar uri={photoUrl} name={name ?? 'پشتیبانی'} size={44} ring />
      <View style={styles.officialText}>
        <View style={styles.officialNameRow}>
          <Text style={styles.officialName} numberOfLines={1}>
            {name || 'پشتیبانیِ نودوست'}
          </Text>
          <Icon name="shield-check" size={16} tint="gold" />
        </View>
        <Text style={styles.officialHint}>{subtitle}</Text>
      </View>
    </View>
  );
}

export function SupportScreen() {
  const vm = useSupportViewModel();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<Row>>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const rows = useMemo(() => buildRows(vm.messages, vm.myId), [vm.messages, vm.myId]);

  // متنِ آماده از صفحه‌ی ارجاع‌دهنده (مثلاً بن‌بستِ «این محصول از قبل خریداری شده»).
  // فقط یک‌بار و فقط وقتی کاربر خودش چیزی ننوشته — تایپِ کاربر مقدس است.
  const { draft: draftParam } = useLocalSearchParams<{ draft?: string }>();
  const seeded = useRef(false);
  const { setDraft } = vm;
  useEffect(() => {
    if (seeded.current || !draftParam) return;
    seeded.current = true;
    setDraft((current: string) => (current.trim() ? current : draftParam));
  }, [draftParam, setDraft]);

  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();
  const bottomSpacer = useAnimatedStyle(() => ({
    height: Math.max(-keyboardHeight.value, insets.bottom),
  }));

  const canSend = !!vm.draft.trim() && !vm.sending;
  const onSend = () => {
    void vm.send();
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  if (vm.loading) {
    return (
      <ScreenContainer>
        <StackHeader title="پشتیبانی" />
        <RowsSkeleton count={5} />
      </ScreenContainer>
    );
  }

  if (vm.error) {
    return (
      <ScreenContainer>
        <StackHeader title="پشتیبانی" />
        <View style={styles.center}>
          <EmptyState
            icon="rewind"
            title="اتصال برقرار نشد"
            hint="ارتباط با سرور ناموفق بود. اینترنتت را بررسی کن و دوباره تلاش کن."
            actionLabel="تلاشِ دوباره"
            onAction={vm.reload}
          />
        </View>
      </ScreenContainer>
    );
  }

  // پشتیبانی خاموش است یا هنوز حسابِ رسمی ساخته نشده.
  if (!vm.enabled) {
    return (
      <ScreenContainer>
        <StackHeader title="پشتیبانی" />
        <View style={styles.center}>
          <EmptyState
            icon="clock"
            title="پشتیبانی موقتاً در دسترس نیست"
            hint="کمی بعد دوباره سر بزن — به‌زودی برمی‌گردیم."
            actionLabel="تلاشِ دوباره"
            onAction={vm.reload}
          />
        </View>
      </ScreenContainer>
    );
  }

  // ───────── حالتِ ۱: هنوز گفتگویی نیست — راهنما + انتخابِ موضوع ─────────
  if (!vm.hasThread) {
    return (
      <ScreenContainer>
        <StackHeader title="پشتیبانی" />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <OfficialHeader
            name={vm.account?.name}
            photoUrl={vm.account?.photoUrl}
            subtitle="حسابِ رسمیِ نودوست"
          />

          <Text style={styles.groupLabel}>پرسش‌های پرتکرار</Text>
          <View style={styles.group}>
            {FAQ.map((item, i) => (
              <View key={item.q}>
                {i > 0 ? <View style={styles.divider} /> : null}
                <Pressable
                  onPress={() => setOpenFaq(openFaq === i ? null : i)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: openFaq === i }}
                  style={styles.faqRow}
                >
                  <View style={styles.faqHead}>
                    <Text style={styles.faqQ}>{item.q}</Text>
                    <Icon
                      name={openFaq === i ? 'chevron-next' : 'chevron-prev'}
                      size={14}
                      tint="gold"
                    />
                  </View>
                  {openFaq === i ? <Text style={styles.faqA}>{item.a}</Text> : null}
                </Pressable>
              </View>
            ))}
          </View>

          <Text style={styles.groupLabel}>پاسخت را پیدا نکردی؟</Text>
          <Text style={styles.lead}>
            موضوعِ پیامت را انتخاب کن تا سریع‌تر به همکارِ مربوطه برسد.
          </Text>
          <View style={styles.topics}>
            {vm.topics.map((t) => (
              <PressableScale
                scaleTo={0.98}
                feedback="select"
                key={t.slug}
                onPress={() => void vm.startThread(t.slug)}
                disabled={vm.starting}
                accessibilityRole="button"
                accessibilityLabel={t.label}
                style={[styles.topic, vm.starting && styles.topicDisabled]}
              >
                <Text style={styles.topicText}>{t.label}</Text>
                <Icon name="chevron-prev" size={14} tint="gold" />
              </PressableScale>
            ))}
          </View>

          {vm.starting ? (
            <View style={styles.startingRow}>
              <ActivityIndicator size="small" color={colors.gold} />
              <Text style={styles.startingText}>در حال بازکردنِ گفتگو…</Text>
            </View>
          ) : null}
          {vm.sendError ? <Text style={styles.errorText}>{vm.sendError}</Text> : null}
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ───────── حالتِ ۲: گفتگو باز است — همان تجربه‌ی چت ─────────
  return (
    <ScreenContainer flush>
      {/* همان پس‌زمینه‌ی گفتگو — پشتیبانی هم یک پیام‌رسان است. */}
      <ChatBackground />
      <View style={styles.header}>
        <PressableScale
          scaleTo={0.9}
          feedback="select"
          hitSlop={10}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="بازگشت"
          style={styles.back}
        >
          <Icon name="chevron-next" size={22} tint="white" />
        </PressableScale>
        {/* بی‌کنش: حسابِ رسمی پروفایلِ عمومی ندارد و لمسش نباید به ۴۰۴ برسد. */}
        <OfficialHeader
          name={vm.account?.name}
          photoUrl={vm.account?.photoUrl}
          subtitle="معمولاً در چند ساعت پاسخ می‌دهیم"
        />
      </View>

      <View style={styles.flex}>
        {vm.messages.length === 0 ? (
          <View style={styles.emptyWrap}>
            <EmptyState
              icon="tab-chat"
              title="بنویس، می‌شنویم"
              hint="مشکل یا سوالت را کامل بنویس تا سریع‌تر حلش کنیم."
            />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={rows}
            inverted
            keyExtractor={(r) => r.key}
            contentContainerStyle={styles.list}
            maintainVisibleContentPosition={{ minIndexForVisible: 0, autoscrollToTopThreshold: 10 }}
            onEndReached={() => {
              if (vm.hasMore && !vm.loadingOlder) vm.loadOlder();
            }}
            onEndReachedThreshold={0.2}
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            ListFooterComponent={
              vm.loadingOlder ? (
                <View style={styles.olderLoading}>
                  <Skeleton
                    width={160}
                    height={38}
                    br={radius.lg}
                    style={{ alignSelf: 'flex-start' }}
                  />
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
                      {/* در گفتگوی پشتیبانی رسیدِ خواندن برای همه باز است. */}
                      {mine && msg.readAt ? '  · خوانده شد' : ''}
                    </Text>
                  ) : null}
                </View>
              );
            }}
          />
        )}

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
          <PressableScale
            scaleTo={0.9}
            feedback="select"
            style={styles.send}
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
          </PressableScale>
        </View>

        <Animated.View style={bottomSpacer} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center' },
  scroll: { paddingBottom: spacing.xxl },

  // ── حسابِ رسمی ──
  official: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
  },
  officialText: { flex: 1 },
  officialNameRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.xs },
  officialName: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  officialHint: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
  },

  // ── راهنما و موضوع‌ها ──
  groupLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  lead: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.md,
  },
  group: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.rim,
    overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: colors.line, marginHorizontal: spacing.md },
  faqRow: { paddingHorizontal: spacing.md, paddingVertical: spacing.md, gap: spacing.sm },
  faqHead: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  faqQ: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  faqA: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  topics: { gap: spacing.sm },
  topic: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.rim,
  },
  topicDisabled: { opacity: 0.5 },
  topicText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  startingRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  startingText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  errorText: {
    marginTop: spacing.md,
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.rose,
    textAlign: 'right',
    writingDirection: 'rtl',
  },

  // ── گفتگو ──
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  back: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: { flex: 1, justifyContent: 'center' },
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
    borderTopColor: colors.rim,
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
    borderTopColor: colors.rim,
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
    borderTopColor: colors.rim,
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
