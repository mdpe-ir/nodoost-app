import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet, Platform } from 'react-native';
import { PressableScale } from '@/presentation/components/PressableScale';
import { haptics, hapticThreshold } from '@/core/haptics';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '@/presentation/components/ScreenContainer';
import { ChatBackground } from '@/presentation/components/ChatBackground';
import { BubblesSkeleton, Skeleton } from '@/presentation/components/Skeleton';
import { EmptyState } from '@/presentation/components/EmptyState';
import { Avatar } from '@/presentation/components/Avatar';
import { Icon } from '@/presentation/components/Icon';
import { Button } from '@/presentation/components/Button';
import { TierBadge, tierName } from '@/presentation/components/TierBadge';
import { VoiceBubble } from '@/presentation/components/VoiceBubble';
import { PhotoBubble } from '@/presentation/components/PhotoBubble';
import { MessageText } from '@/presentation/components/MessageText';
import { MessageSendStatus } from '@/presentation/components/MessageSendStatus';
import { ChatComposer } from '@/presentation/components/ChatComposer';
import { UpgradeSheet } from '@/presentation/components/UpgradeSheet';
import { useRemoteConfig } from '@/presentation/providers/RemoteConfigProvider';
import { messagePreviewText } from '@/core/media/messagePreview';
import { ActionSheet, type SheetAction } from '@/presentation/components/ActionSheet';
import { InfoSheet } from '@/presentation/components/InfoSheet';
import { ReportReasonSheet } from '@/presentation/components/ReportReasonSheet';
import { ChatSearch } from '@/presentation/components/ChatSearch';
import { copyToClipboard } from '@/core/utils/clipboard';
import { useCases } from '@/core/di/DIProvider';
import { useThreadViewModel } from '@/presentation/hooks/useThreadViewModel';
import { useQuota } from '@/presentation/providers/QuotaProvider';
import { lowWarning, isLow, isExhausted } from '@/presentation/tiers/quotaCopy';
import { faClock, faDayLabel, faJalali, dayKey, lastSeenText } from '@/core/utils/time';
import {
  colors,
  fonts,
  fontSizes,
  lineHeights,
  radius,
  spacing,
  springs,
} from '@/core/theme';
import { quotaOf, type Message } from '@/domain/entities';

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
      key: m.clientId ?? (m.id != null ? String(m.id) : `i${i}`),
      msg: m,
      mine: m.senderId === myId,
      firstOfGroup: !sameAsPrev,
      lastOfGroup: !sameAsNext,
    });
  });
  // ترتیبِ صعودی ساخته شد؛ برای فهرستِ وارونه باید برعکس شود.
  return rows.reverse();
}

/**
 * متنِ «کِی خوانده شد» برای برگه‌ی کنشِ پیام.
 *
 * فقط برای پیامِ خودم معنا دارد و فقط وقتی سرور `readAt` داده باشد. اگر
 * نداده، چیزی برنمی‌گرداند تا صفحه به متنِ پیش‌فرض (متنِ پیام) برگردد —
 * «خوانده نشده» گفتن غلط است، چون شاید فقط سطحِ حساب اجازه‌ی دیدنش را ندهد.
 */
function readReceiptText(m: Message | null): string | undefined {
  if (!m?.readAt) return undefined;
  return `خوانده شد · ${faDayLabel(m.readAt)} ساعتِ ${faClock(m.readAt)}`;
}

/**
 * سطرهای «اطلاعاتِ پیام» — زمانِ ارسال، ویرایش و خوانده‌شدن.
 *
 * این‌جا برخلافِ زیرنویسِ برگه‌ی کنش، «خوانده نشده» هم گفته می‌شود: کاربر عمداً
 * اطلاعاتِ پیام را باز کرده و در این بافت، نبودنِ زمانِ خواندن یعنی «هنوز
 * نخوانده». در برگه‌ی کنش اما سکوت می‌کردیم چون آن‌جا مقدارِ پیش‌فرض مهم‌تر بود.
 */
function messageInfoRows(m: Message, myId?: number): { label: string; value: string }[] {
  const rows = [
    {
      label: 'ارسال',
      value: m.createdAt ? `${faJalali(m.createdAt)} · ${faClock(m.createdAt)}` : '—',
    },
  ];
  if (m.editedAt) {
    rows.push({
      label: 'ویرایش',
      value: `${faJalali(m.editedAt)} · ${faClock(m.editedAt)}`,
    });
  }
  // رسیدِ خواندن فقط برای پیامِ خودم معنا دارد؛ سرور هم فقط برای همان‌ها
  // `read_at` می‌فرستد. برای پیامِ طرفِ مقابل «هنوز خوانده نشده» گفتن دروغ است.
  if (m.senderId === myId) {
    rows.push({
      label: 'وضعیت',
      value: m.readAt
        ? `خوانده شد · ${faDayLabel(m.readAt)} ساعتِ ${faClock(m.readAt)}`
        : 'هنوز خوانده نشده',
    });
  }
  if (m.body && !m.deleted) rows.push({ label: 'متن', value: messagePreviewText(m) });
  return rows;
}

/**
 * چقدر می‌شود حباب را کشید، و از کجا رهاکردن یعنی «پاسخ بده».
 */
const REPLY_MAX = 76;
const REPLY_TRIGGER = 54;

/**
 * حبابِ پیام — با کشیدن تبدیل به پاسخ می‌شود.
 *
 * جهتِ کشیدن به سمتِ حباب بستگی دارد و همیشه **به سمتِ فضای خالیِ کنارش** است:
 * پیامِ من چپ می‌رود، پیامِ او راست. دو دلیل دارد و هر دو عملی‌اند:
 *   ۱) حباب هیچ‌وقت از لبه‌ی صفحه بیرون نمی‌زند. جهتِ ثابت برای هر دو، یکی از
 *      دو طرف را حتماً می‌بُرد.
 *   ۲) پیکانِ پاسخ در همان جایی ظاهر می‌شود که حباب خالی کرده — مثلِ کشیدنِ
 *      کشو و دیدنِ چیزی که پشتش بود.
 *
 * `failOffsetY` مهم است: بدونِ آن، ژستِ افقی اسکرولِ عمودیِ گفتگو را می‌دزدد و
 * بالا رفتن در تاریخچه لغزنده می‌شود. با آن، هر حرکتی که بیشتر عمودی است
 * دستِ فهرست می‌ماند.
 */
function MessageBubble({
  matchId,
  msg,
  mine,
  firstOfGroup,
  lastOfGroup,
  time,
  highlighted,
  onReply,
  onLongPress,
  onJumpToQuote,
  onRetryMessage,
  onPressMention,
}: {
  matchId: number;
  msg: Message;
  mine: boolean;
  firstOfGroup: boolean;
  lastOfGroup: boolean;
  time: string;
  highlighted: boolean;
  onReply: () => void;
  onLongPress: () => void;
  onJumpToQuote: (id: number) => void;
  onRetryMessage?: (clientId: string) => void;
  onPressMention?: (username: string) => void;
}) {
  /** ‎−۱ = حباب به چپ می‌رود (پیامِ من)، ‎+۱ = به راست (پیامِ او). */
  const dir = mine ? -1 : 1;
  const tx = useSharedValue(0);
  /** یک‌بار در هر کشیدن لرزش بزند، نه در هر فریمِ بالای آستانه. */
  const armed = useSharedValue(0);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-14, 14])
        .failOffsetY([-12, 12])
        .onUpdate((e) => {
          // در جهتِ درست آزاد است تا سقف؛ در جهتِ مخالف کِش می‌آید تا حرکت
          // بی‌جواب نماند ولی معنایی هم پیدا نکند.
          const along = e.translationX * dir;
          tx.value = along > 0 ? Math.min(along, REPLY_MAX) * dir : (e.translationX / 4);
          const past = along >= REPLY_TRIGGER ? 1 : 0;
          if (past !== armed.value) {
            armed.value = past;
            if (past) runOnJS(hapticThreshold)();
          }
        })
        .onEnd(() => {
          if (armed.value) runOnJS(onReply)();
          armed.value = 0;
          tx.value = withSpring(0, springs.gentle);
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onReply, dir]
  );

  const slide = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }] }));
  const glyph = useAnimatedStyle(() => {
    const t = interpolate(tx.value * dir, [0, REPLY_TRIGGER], [0, 1], Extrapolation.CLAMP);
    return { opacity: t, transform: [{ scale: 0.6 + t * 0.4 }] };
  });

  return (
    <View style={styles.bubbleRow}>
      {/* پیکانِ پاسخ در فضایی که حباب خالی می‌کند آشکار می‌شود. */}
      <Animated.View
        style={[styles.replyGlyph, mine ? styles.replyGlyphMine : styles.replyGlyphTheirs, glyph]}
        pointerEvents="none"
      >
        <Icon name="reply" size={18} tint="gold" />
      </Animated.View>

      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            styles.bubble,
            mine ? styles.mine : styles.theirs,
            firstOfGroup && styles.firstOfGroup,
            mine && lastOfGroup && styles.mineTail,
            !mine && lastOfGroup && styles.theirsTail,
            highlighted && (mine ? styles.flashMine : styles.flashTheirs),
            slide,
          ]}
        >
          <Pressable
            onLongPress={onLongPress}
            onPress={
              msg.failed && msg.clientId
                ? () => onRetryMessage?.(msg.clientId!)
                : undefined
            }
            delayLongPress={280}
            // حباب ظرف است، دکمه نیست — نقل، ویس و تلاشِ دوباره خودشان دکمه‌اند.
            // نقشِ button در وب به <button> تبدیل می‌شود و دکمه‌ی تو در تو نامعتبر است.
            accessibilityLabel={messagePreviewText(msg)}
            accessibilityHint="نگه‌داشتن برای پاسخ، ویرایش یا حذف · کشیدن به چپ برای پاسخ"
          >
            {/* نقلِ پیامی که این پیام پاسخِ آن است — زدنش به همان پیام می‌برد. */}
            {msg.replyTo ? (
              <PressableScale
                onPress={() => msg.replyTo && onJumpToQuote(msg.replyTo.id)}
                onLongPress={onLongPress}
                delayLongPress={280}
                disabled={msg.replyTo.deleted}
                accessibilityRole="button"
                accessibilityLabel="رفتن به پیامِ اصلی"
                scaleTo={0.97}
                style={[styles.quote, mine ? styles.quoteMine : styles.quoteTheirs]}
              >
                <Text
                  style={[
                    styles.quoteText,
                    mine ? styles.quoteTextMine : styles.quoteTextTheirs,
                    msg.replyTo.deleted && styles.quoteDeleted,
                  ]}
                  numberOfLines={2}
                >
                  {messagePreviewText(msg.replyTo)}
                </Text>
              </PressableScale>
            ) : null}

            {msg.kind === 'voice' && (msg.id || msg.pending || msg.failed) ? (
              <VoiceBubble
                matchId={matchId}
                messageId={msg.id}
                localUri={msg.localUri}
                pending={msg.pending}
                failed={msg.failed}
                transferPhase={msg.transferPhase}
                transferProgress={msg.transferProgress}
                durationMs={msg.mediaMeta?.durationMs}
                peaks={msg.mediaMeta?.peaks}
                mine={mine}
                onLongPress={onLongPress}
                onRetry={msg.clientId ? () => onRetryMessage?.(msg.clientId!) : undefined}
              />
            ) : msg.kind === 'photo' && (msg.id || msg.pending || msg.failed) ? (
              <PhotoBubble
                matchId={matchId}
                messageId={msg.id}
                localUri={msg.localUri}
                pending={msg.pending}
                failed={msg.failed}
                transferPhase={msg.transferPhase}
                transferProgress={msg.transferProgress}
                width={msg.mediaMeta?.width}
                height={msg.mediaMeta?.height}
                mine={mine}
                onLongPress={onLongPress}
                onRetry={msg.clientId ? () => onRetryMessage?.(msg.clientId!) : undefined}
              />
            ) : (
              <MessageText
                text={msg.body}
                mine={mine}
                style={[
                  styles.bubbleText,
                  mine ? styles.mineText : styles.theirsText,
                  msg.pending && styles.textPending,
                ]}
                onPressMention={onPressMention}
              />
            )}
            {lastOfGroup && time ? (
              <View style={styles.metaRow}>
                <Text style={[styles.time, mine ? styles.timeMine : styles.timeTheirs]}>
                  {time}
                  {msg.editedAt ? '  · ویرایش‌شده' : ''}
                </Text>
                {mine ? (
                  <MessageSendStatus
                    pending={msg.pending}
                    failed={msg.failed}
                    read={!!msg.readAt}
                    onRetry={
                      msg.clientId ? () => onRetryMessage?.(msg.clientId!) : undefined
                    }
                  />
                ) : null}
              </View>
            ) : null}
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
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
  const { chat } = useRemoteConfig();
  const uc = useCases();
  const { quota } = useQuota();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<Row>>(null);
  const rows = useMemo(() => buildRows(vm.messages, vm.myId), [vm.messages, vm.myId]);
  // آینهی rows برای پرشِ پس از بارگذاریِ گذشته (`loadUntil`) — چون در آن لحظه
  // `rows` داخلِ بسته هنوز کهنه است و scrollToIndex باید به فهرستِ تازه اشاره کند.
  const rowsRef = useRef(rows);
  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  // در فهرستِ وارونه، «انتها» یعنی قدیمی‌ترین پیام؛ پس صفحه‌بندیِ گذشته به onEndReached
  // وصل می‌شود. چون این پیام‌ها بعد از سطرهای موجود می‌آیند، اسکرول تکان نمی‌خورد و
  // دیگر به ترفندِ نگه‌داشتنِ موقعیت نیازی نیست.
  const onEndReached = () => {
    if (!vm.hasMore || vm.loadingOlder) return;
    vm.loadOlder();
  };
  /**
   * پرش به پیامی که این پیام پاسخِ آن است.
   *
   * بعد از پرش، پیامِ مقصد برای یک لحظه روشن می‌شود. بدونِ آن، پرش در گفتگوی
   * شلوغ بی‌فایده است: صفحه جابه‌جا می‌شود ولی معلوم نیست روی کدام حباب
   * نشسته‌ای.
   */
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const jumpToMessage = useCallback(
    (id: number) => {
      const idx = rows.findIndex((r) => r.type === 'msg' && r.msg.id === id);
      if (idx >= 0) {
        listRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
        setHighlightId(id);
        return;
      }
      // پیام در صفحاتِ بارگذاری‌شده نیست: گذشته را تا خودش میکشیم، بعد پرش.
      // پیدا نشد (تاریخچه کوتاهتر از حدِ انتظار/پاک‌شده)؟ همان لرزشِ «نشد».
      void vm.loadUntil(id).then((found) => {
        if (!found) {
          haptics.warn();
          return;
        }
        // rows تازه هنوز رندر نشده؛ با تاخیرِ کوتاه، فهرستِ تازه را نشانه میگیریم.
        requestAnimationFrame(() => {
          const fresh = rowsRef.current.findIndex((r) => r.type === 'msg' && r.msg.id === id);
          if (fresh >= 0) {
            listRef.current?.scrollToIndex({ index: fresh, animated: true, viewPosition: 0.5 });
            setHighlightId(id);
          } else {
            haptics.warn();
          }
        });
      });
    },
    [rows, vm],
  );

  useEffect(() => {
    if (highlightId == null) return;
    const t = setTimeout(() => setHighlightId(null), 1400);
    return () => clearTimeout(t);
  }, [highlightId]);

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
  // در حالتِ ویرایش همان دکمه ذخیره می‌کند؛ اسکرول لازم نیست چون پیام سرِ جایش است.
  const onSend = () => {
    if (vm.editing) {
      void vm.submitEdit();
      return;
    }
    void vm.send();
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  /*
   * برگه‌ی کنشِ پیام (نگه‌داشتنِ حباب) و دیالوگِ تأییدِ حذف.
   *
   * حذف دو معنی دارد و کاربر باید انتخاب کند: «برای من» فقط از دیدِ خودش پنهان
   * می‌کند، «برای همه» جای پیام سنگِ قبر می‌گذارد. گزینه‌ی دوم فقط برای فرستنده
   * ظاهر می‌شود — سرور هم همین را اعمال می‌کند.
   */
  const [actionTarget, setActionTarget] = useState<Message | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Message | null>(null);
  /** منشنِ لمس‌شده برای باز کردنِ برگه‌ی هدایت یا کپی. */
  const [mentionTarget, setMentionTarget] = useState<string | null>(null);
  /** برگه‌ی «اطلاعاتِ پیام» — زمانِ ارسال/ویرایش/خوانده‌شدن. */
  const [infoTarget, setInfoTarget] = useState<Message | null>(null);
  /** مقصدِ گزارش: خودِ کاربر یا یک پیامِ مشخص. */
  const [reportTarget, setReportTarget] = useState<
    { kind: 'user' } | { kind: 'message'; msg: Message } | null
  >(null);
  const [reportBusy, setReportBusy] = useState(false);
  const [reportError, setReportError] = useState(false);

  /** مدیریتِ تپ روی منشن‌های نامِ کاربری (@username). */
  const handlePressMention = useCallback((username: string) => {
    haptics.select();
    setMentionTarget(username);
  }, []);

  /** کپی کردن نام کاربری منشن‌شده در کلیپ‌بورد. */
  const copyMentionUsername = useCallback(async (username: string) => {
    const ok = await copyToClipboard(`@${username}`);
    if (ok) haptics.success();
    else haptics.warn();
    setMentionTarget(null);
  }, []);

  const mentionActions: SheetAction[] = mentionTarget
    ? [
        {
          key: 'copy',
          label: 'کپی نام کاربری',
          hint: `@${mentionTarget}`,
          icon: 'copy' as const,
          onPress: () => {
            void copyMentionUsername(mentionTarget);
          },
        },
      ]
    : [];

  /**
   * متنِ پیام را در کلیپ‌بورد می‌گذارد.
   *
   * فقط پیامِ متنیِ زنده کپی می‌شود: کپیِ «پیام صوتی» یا سنگِ قبر بی‌معنی است.
   * موفقیت با هپتیک گفته می‌شود نه با متنِ شناور — اپ سامانه‌ی toast ندارد و
   * ساختنش برای یک کنش، زبانِ بصریِ تازه‌ای تحمیل می‌کند.
   */
  const copyMessage = useCallback(async (m: Message) => {
    const ok = await copyToClipboard(m.body);
    if (ok) haptics.success();
    else haptics.warn();
  }, []);

  const submitReport = useCallback(
    async (reason: string, messageId?: number) => {
      if (!peerId) return;
      setReportBusy(true);
      setReportError(false);
      try {
        await uc.safety.report(peerId, reason, undefined, messageId);
        haptics.success();
        setReportTarget(null);
      } catch {
        setReportError(true);
      } finally {
        setReportBusy(false);
      }
    },
    [peerId, uc]
  );

  const messageActions: SheetAction[] = actionTarget
    ? [
        {
          key: 'reply',
          label: 'پاسخ',
          icon: 'send-fill',
          onPress: () => {
            vm.startReply(actionTarget);
            setActionTarget(null);
          },
        },
        // کپی فقط برای متنِ زنده — روی عکس/صدا/سنگِ قبر چیزی برای کپی نیست.
        ...(!actionTarget.deleted &&
        (actionTarget.kind == null || actionTarget.kind === 'text') &&
        !!actionTarget.body
          ? [
              {
                key: 'copy',
                label: 'کپی متن',
                icon: 'copy' as const,
                onPress: () => {
                  const m = actionTarget;
                  setActionTarget(null);
                  void copyMessage(m);
                },
              },
            ]
          : []),
        ...(vm.canEdit(actionTarget)
          ? [
              {
                key: 'edit',
                label: 'ویرایش',
                hint: 'تا ۱۵ دقیقه پس از ارسال',
                icon: 'edit' as const,
                onPress: () => {
                  vm.startEdit(actionTarget);
                  setActionTarget(null);
                },
              },
            ]
          : []),
        {
          key: 'info',
          label: 'اطلاعاتِ پیام',
          icon: 'info',
          onPress: () => {
            setInfoTarget(actionTarget);
            setActionTarget(null);
          },
        },
        /*
         * سنجاق — فقط برای پیامِ زندهٔ سروری: سنگِ قبر چیزی برای نگه‌داشتن
         * ندارد و پیامِ بهینه هنوز شناسهٔ سروری ندارد تا بعداً پیدا شود.
         */
        ...(actionTarget.id != null && !actionTarget.deleted
          ? [
              {
                key: 'pin',
                label: vm.pinned?.id === actionTarget.id ? 'برداشتنِ سنجاق' : 'سنجاق کردن',
                hint: 'بالای گفتگو می‌ماند تا خودت برداری',
                icon: 'pin' as const,
                onPress: () => {
                  const m = actionTarget;
                  setActionTarget(null);
                  void vm.togglePin(vm.pinned?.id === m.id ? null : m);
                },
              },
            ]
          : []),
        ...(peerId
          ? [
              {
                key: 'report',
                label: 'گزارشِ پیام',
                hint: 'تخلف را به تیمِ پشتیبانی بگو',
                icon: 'shield' as const,
                danger: true,
                onPress: () => {
                  setReportTarget({ kind: 'message', msg: actionTarget });
                  setActionTarget(null);
                },
              },
            ]
          : []),
        {
          key: 'delete',
          label: 'حذف',
          icon: 'close',
          danger: true,
          onPress: () => {
            setDeleteTarget(actionTarget);
            setActionTarget(null);
          },
        },
      ]
    : [];

  const deleteActions: SheetAction[] = deleteTarget
    ? [
        {
          key: 'me',
          label: 'حذف برای من',
          hint: 'فقط از گفتگوی تو پاک می‌شود؛ او همچنان می‌بیندش',
          icon: 'close',
          onPress: () => {
            void vm.remove(deleteTarget, 'me');
            setDeleteTarget(null);
          },
        },
        ...(deleteTarget.senderId === vm.myId
          ? [
              {
                key: 'all',
                label: 'حذف برای همه',
                hint: 'جای پیام «این پیام حذف شد» می‌نشیند',
                icon: 'close' as const,
                danger: true,
                onPress: () => {
                  void vm.remove(deleteTarget, 'all');
                  setDeleteTarget(null);
                },
              },
            ]
          : []),
      ]
    : [];

  // قانونِ سطح: تا وقتی گفتگو پیامی ندارد، فقط هم‌سطح یا بالاتر می‌تواند شروع کند.
  // اگر طرفِ مقابل سطحِ بالاتری دارد، ورودی قفل می‌شود تا او پیامِ اول را بدهد.
  const tierLocked = !vm.loading && vm.messages.length === 0 && !!peerTier && peerTier > vm.myTier;

  /*
   * هشدارِ پیش‌از‌مصرف.
   *
   * قلبِ این بازطراحی همین چند خط است: کاربر باید *پیش از* فرستادنِ پیام
   * بداند این آخرین سهمِ اوست، نه بعد از اینکه دکمه را زد و رد شد. فقط روی
   * «شروعِ گفتگو» نشان داده می‌شود — پاسخ‌دادن هیچ‌وقت سهمیه نمی‌سوزاند و
   * هشدار دادن در آن‌جا فقط ترسِ بی‌مورد می‌سازد.
   */
  const convQuota = quotaOf(quota, 'conversation');
  const showStartWarning =
    vm.isStarting && !tierLocked && !!convQuota && (isLow(convQuota) || isExhausted(convQuota));

  // برگه‌ی ارتقا از دو مسیر باز می‌شود: کاربر روی هشدار زد، یا سرور ارسال را رد
  // کرد. حالتِ دوم *مشتق* می‌شود تا رفتنِ یکی از آن دو، دیگری را گیج نکند.
  const [manualSheet, setManualSheet] = useState<
    { kind: 'quota' } | { kind: 'tier'; level: number; feature: string } | null
  >(null);
  const blockSheet: { kind: 'quota' } | { kind: 'tier'; level: number; feature: string } | null =
    vm.block
      ? vm.block.kind === 'quota'
        ? { kind: 'quota' }
        : {
            kind: 'tier',
            level: vm.block.requiredTier ?? peerTier ?? chat.photo.minTier ?? 3,
            feature: 'ارسال عکس در گفتگو',
          }
      : null;
  const sheet = blockSheet ?? manualSheet;
  const setSheet = setManualSheet;

  /**
   * `hidden` یعنی طرفِ مقابل (طلایی+) حضورش را خاموش کرده — در آن حالت هیچ
   * چیزی نمی‌گوییم. گفتنِ «آفلاین» همان اطلاعاتی را لو می‌دهد که او خاموش
   * کرده است.
   */
  const presenceLine = (() => {
    const p = vm.presence;
    if (!p || p.hidden) return peerId ? 'اطلاعاتِ مخاطب' : '';
    if (p.typing) return 'در حالِ نوشتن…';
    if (p.online) return 'آنلاین';
    return lastSeenText(p.lastActiveMin) || (peerId ? 'اطلاعاتِ مخاطب' : '');
  })();

  /**
   * تپ روی هدر → «اطلاعاتِ مخاطب»، نه پروفایلِ اجتماعی.
   *
   * این همان تصمیمِ محوریِ فلوست: در پیام‌رسان، کسی که وسطِ گفتگوست با تپ روی
   * نام، دنبالِ گزینه‌های گفتگو (مدیا، بی‌صدا، مسدود، پاک‌کردن) است. پروفایلِ
   * اجتماعیِ دیتینگ یک ضربه دورتر، از داخلِ همان صفحه، در دسترس می‌ماند.
   */
  const openPeerProfile = () => {
    if (peerId) {
      // رشته‌ی صریح + `as Href`: تایپِ مسیرها تولیدی است و `/chat-info/[id]`
      // تازه است، پس تا اجرای بعدیِ expo start در اتحادیه‌ی مسیرها نیست —
      // همان قراردادی که PeerProfileScreen برای مسیرهای تازه دارد.
      const q = new URLSearchParams({ peerId: String(peerId) });
      if (name) q.set('name', name);
      if (photoUrl) q.set('photoUrl', photoUrl);
      if (peerTier != null) q.set('peerTier', String(peerTier));
      router.push(`/chat-info/${matchId}?${q.toString()}` as Href);
    }
  };

  /*
   * منویِ خودِ گفتگو — همان گزینه‌های صفحه‌ی اطلاعات، برای کسی که نمی‌خواهد
   * از تِرِد بیرون برود. ترتیب از مفید به خطرناک است: اطلاعات → پاک‌کردن →
   * گزارش → مسدود کردن.
   */
  const [threadMenu, setThreadMenu] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  /** پوشهٔ جستجوی گفتگو — نتایج با پرش به خودِ پیام باز می‌شوند. */
  const [searchOpen, setSearchOpen] = useState(false);

  const threadActions: SheetAction[] = [
    ...(peerId
      ? [
          {
            key: 'profile',
            label: 'اطلاعاتِ مخاطب',
            hint: 'پروفایل، مدیا و تنظیماتِ گفتگو',
            icon: 'tab-profile' as const,
            onPress: () => {
              setThreadMenu(false);
              openPeerProfile();
            },
          },
        ]
      : []),
    {
      key: 'search',
      label: 'جستجو در گفتگو',
      hint: 'میانِ پیامهای قبلی بگرد',
      icon: 'search' as const,
      onPress: () => {
        setThreadMenu(false);
        setSearchOpen(true);
      },
    },
    {
      key: 'mute',
      label: vm.muted ? 'باصدا کردنِ اعلانها' : 'بیصدا کردنِ اعلانها',
      hint: 'فقط پوش میآید؛ خودِ گفتگو و شمارنده سرِ جایشان میمانند',
      icon: 'bell-off' as const,
      onPress: () => {
        setThreadMenu(false);
        void vm.toggleMuted();
      },
    },
    {
      key: 'clear',
      label: 'پاک‌کردنِ گفتگو',
      hint: 'فقط برای تو؛ او چیزی نمی‌بیند',
      icon: 'close',
      onPress: () => {
        setThreadMenu(false);
        setConfirmClear(true);
      },
    },
    ...(peerId
      ? [
          {
            key: 'report',
            label: 'گزارش',
            hint: 'تخلف را به تیمِ پشتیبانی بگو',
            icon: 'shield' as const,
            danger: true,
            onPress: () => {
              setThreadMenu(false);
              setReportTarget({ kind: 'user' });
            },
          },
          {
            key: 'block',
            label: 'مسدود کردن',
            hint: 'دیگر نه پیامی، نه دیده‌شدنی',
            icon: 'lock' as const,
            danger: true,
            onPress: () => {
              setThreadMenu(false);
              setConfirmBlock(true);
            },
          },
        ]
      : []),
  ];

  return (
    <ScreenContainer flush>
      {/* طرحِ پس‌زمینه زیرِ همه‌چیز و بیرونِ فهرست است تا با اسکرول حرکت نکند. */}
      <ChatBackground />
      <View style={styles.header}>
        <PressableScale
          scaleTo={0.9}
          hitSlop={10}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="بازگشت"
          style={styles.back}
        >
          {/* در RTL بازگشت به سمتِ راست است — شورونِ رو به راست */}
          <Icon name="chevron-next" size={22} tint="white" />
        </PressableScale>
        {/* تپِ آواتار/نام → اطلاعاتِ مخاطب (فلوی تلگرام) */}
        <Pressable
          onPress={openPeerProfile}
          disabled={!peerId}
          style={styles.headerPeer}
          accessibilityRole="button"
          accessibilityLabel={`اطلاعاتِ ${name ?? 'کاربر'}`}
        >
          <Avatar uri={photoUrl} name={name} size={38} ring />
          <View style={styles.headerText}>
            <View style={styles.headerNameRow}>
              <Text style={styles.headerName} numberOfLines={1}>
                {name || 'گفتگو'}
              </Text>
              {peerTier ? <TierBadge tier={peerTier} height={18} /> : null}
            </View>
            {/*
              * یک خط، چهار حالت — به ترتیبِ فوریت. «در حالِ تایپ» از همه
              * جلوتر است چون تنها حالتی است که همین ثانیه معنا دارد؛
              * «اطلاعاتِ مخاطب» ته‌ی صف است چون راهنماست نه خبر.
              */}
            {presenceLine ? (
              <View style={styles.presenceRow}>
                {vm.presence?.online && !vm.presence.typing ? (
                  <View style={styles.onlineDot} />
                ) : null}
                <Text
                  style={[styles.headerHint, vm.presence?.typing && styles.headerHintLive]}
                  numberOfLines={1}
                >
                  {presenceLine}
                </Text>
              </View>
            ) : null}
          </View>
        </Pressable>
        <PressableScale
          scaleTo={0.9}
          hitSlop={10}
          onPress={() => setThreadMenu(true)}
          accessibilityRole="button"
          accessibilityLabel="گزینه‌های گفتگو"
          style={styles.back}
        >
          <Icon name="more" size={20} tint="gold" />
        </PressableScale>
      </View>

      {/*
       * بدنه‌ی گفتگو: فهرست + نوارِ نوشتن + فاصله‌گیرِ متحرکِ کیبورد. هیچ
       * KeyboardAvoidingView‌ای در کار نیست؛ ارتفاعِ فاصله‌گیر مستقیماً از انیمیشنِ
       * کیبورد می‌آید تا حرکت روی رشته‌ی UI و بدونِ لرزش باشد.
       */}
      <View style={styles.flex}>
        {/* نوارِ پیامِ سنجاقشده — همیشه بالای فهرست، مثلِ تلگرام. */}
        {vm.pinned ? (
          <PinnedBar
            message={vm.pinned}
            onJump={() => jumpToMessage(vm.pinned!.id!)}
            onUnpin={() => void vm.togglePin(null)}
          />
        ) : null}
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
            // ارتفاعِ حباب‌ها متغیر است و getItemLayout نداریم؛ اگر مقصد هنوز
            // رندر نشده باشد، اول تقریبی نزدیکش می‌رویم و بعد دقیق.
            onScrollToIndexFailed={(info) => {
              listRef.current?.scrollToOffset({
                offset: info.averageItemLength * info.index,
                animated: true,
              });
              setTimeout(() => {
                listRef.current?.scrollToIndex({
                  index: info.index,
                  animated: true,
                  viewPosition: 0.5,
                });
              }, 240);
            }}
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

              // سنگِ قبر: پیام «برای همه» حذف شده. ردیف می‌ماند تا جای خالیِ
              // گفتگو معنا داشته باشد، ولی نه حباب دارد نه منویِ کنش.
              if (msg.deleted) {
                return (
                  <View style={[styles.tombstone, mine ? styles.mine : styles.theirs]}>
                    <Icon name="lock" size={12} tint="gold" style={styles.tombstoneIcon} />
                    <Text style={styles.tombstoneText}>
                      {msg.deletedByAdmin ? 'این پیام توسطِ پشتیبانی برداشته شد' : 'این پیام حذف شد'}
                    </Text>
                  </View>
                );
              }

              return (
                <MessageBubble
                  matchId={matchId}
                  msg={msg}
                  mine={mine}
                  firstOfGroup={firstOfGroup}
                  lastOfGroup={lastOfGroup}
                  time={time}
                  highlighted={highlightId === msg.id}
                  onReply={() => vm.startReply(msg)}
                  onLongPress={() => setActionTarget(msg)}
                  onJumpToQuote={jumpToMessage}
                  onRetryMessage={vm.retryMessage}
                  onPressMention={handlePressMention}
                />
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
        <>
        {/*
          * نوارِ «در حالِ پاسخ به…» / «در حالِ ویرایش». هرگز هم‌زمان نیستند و
          * عمداً بیرونِ composer است — نوار باید تمامِ عرض را بگیرد.
          */}
        {vm.replyTo || vm.editing ? (
          <View style={styles.contextBar}>
            <View style={styles.contextText}>
              <Text style={styles.contextTitle}>
                {vm.editing ? 'ویرایشِ پیام' : 'پاسخ به پیام'}
              </Text>
              <Text style={styles.contextBody} numberOfLines={1}>
                {messagePreviewText((vm.editing ?? vm.replyTo)! as Message)}
              </Text>
            </View>
            <Pressable
              hitSlop={10}
              onPress={vm.editing ? vm.cancelEdit : vm.cancelReply}
              accessibilityRole="button"
              accessibilityLabel={vm.editing ? 'انصراف از ویرایش' : 'انصراف از پاسخ'}
            >
              <Icon name="close" size={16} tint="gold" />
            </Pressable>
          </View>
        ) : null}
        {vm.editError ? (
          <Pressable onPress={vm.clearEditError} accessibilityRole="button">
            <Text style={styles.editError}>{vm.editError}</Text>
          </Pressable>
        ) : null}

        <ChatComposer
          draft={vm.draft}
          onChangeDraft={vm.changeDraft}
          onSendText={onSend}
          onSendPhoto={vm.sendPhoto}
          onSendVoice={vm.sendVoice}
          sending={vm.sending}
          editing={!!vm.editing}
          chat={chat}
          myTier={vm.myTier}
          onPhotoLocked={() =>
            setManualSheet({
              kind: 'tier',
              level: chat.photo.minTier ?? 3,
              feature: 'ارسال عکس در گفتگو',
            })
          }
          showQuotaHint={
            showStartWarning && convQuota ? (
              <PressableScale
                scaleTo={0.9}
                onPress={() => setSheet({ kind: 'quota' })}
                accessibilityRole="button"
                style={[styles.quotaHint, isExhausted(convQuota) && styles.quotaHintOut]}
              >
                <Icon name={isExhausted(convQuota) ? 'lock' : 'send-fill'} size={14} tint="gold" />
                <Text style={styles.quotaHintText}>
                  {isExhausted(convQuota)
                    ? 'سهمِ شروعِ گفتگویت تمام شده — برای ادامه بزن'
                    : lowWarning(convQuota)}
                </Text>
                <Text style={styles.quotaHintCta}>جزئیات</Text>
              </PressableScale>
            ) : undefined
          }
        />
        </>
        )}

        {/* ناحیه‌ی امنِ پایین وقتی کیبورد بسته است، و جای خودِ کیبورد وقتی باز است. */}
        <Animated.View style={bottomSpacer} />
      </View>

      <ActionSheet
        visible={threadMenu}
        title={name || 'گفتگو'}
        actions={threadActions}
        onDismiss={() => setThreadMenu(false)}
      />
      <ActionSheet
        visible={confirmClear}
        title="گفتگو پاک شود؟"
        subtitle="تاریخچه فقط از سمتِ تو پاک می‌شود. اگر او پیامِ تازه‌ای بدهد، گفتگو با همان پیامِ جدید برمی‌گردد."
        actions={[
          {
            key: 'yes',
            label: 'بله، پاک کن',
            icon: 'close',
            danger: true,
            onPress: () => {
              setConfirmClear(false);
              void uc.chat.clearChat(matchId).then(() => router.back());
            },
          },
        ]}
        onDismiss={() => setConfirmClear(false)}
      />
      <ActionSheet
        visible={confirmBlock}
        title={`${name || 'این کاربر'} مسدود شود؟`}
        subtitle="دیگر نمی‌توانید به هم پیام بدهید یا هم را ببینید. دنبال‌کردن هم در هر دو جهت پاک می‌شود. هر وقت خواستی، از تنظیمات ← حریمِ خصوصی برش می‌داری."
        actions={[
          {
            key: 'yes',
            label: 'بله، مسدود کن',
            icon: 'shield',
            danger: true,
            onPress: () => {
              setConfirmBlock(false);
              if (peerId) void uc.safety.block(peerId).then(() => router.back());
            },
          },
        ]}
        onDismiss={() => setConfirmBlock(false)}
      />

      <ActionSheet
        visible={actionTarget != null}
        title="این پیام"
        /*
         * نگه‌داشتنِ پیام، زمانِ خوانده‌شدن را هم می‌گوید. جایش همین‌جاست نه
         * روی خودِ حباب: تاریخِ کامل روی هر پیام، گفتگو را شلوغ می‌کند، ولی
         * وقتی کسی عمداً پیام را نگه می‌دارد دقیقاً دنبالِ همین جزئیات است.
         */
        subtitle={
          readReceiptText(actionTarget) ||
          (actionTarget ? messagePreviewText(actionTarget) : undefined)
        }
        actions={messageActions}
        onDismiss={() => setActionTarget(null)}
      />
      <ActionSheet
        visible={deleteTarget != null}
        title="حذفِ پیام"
        subtitle={deleteTarget ? messagePreviewText(deleteTarget) : undefined}
        actions={deleteActions}
        onDismiss={() => setDeleteTarget(null)}
      />

      <ActionSheet
        visible={mentionTarget != null}
        title={mentionTarget ? `@${mentionTarget}` : 'کاربر'}
        subtitle="نام کاربریِ منشن‌شده در پیام"
        actions={mentionActions}
        onDismiss={() => setMentionTarget(null)}
      />

      {/* اطلاعاتِ پیام — سطرهای فقط‌خواندنی، نه کنش. */}
      <InfoSheet
        visible={infoTarget != null}
        title="اطلاعاتِ پیام"
        rows={infoTarget ? messageInfoRows(infoTarget, vm.myId) : []}
        onDismiss={() => setInfoTarget(null)}
      />

      <ReportReasonSheet
        visible={reportTarget != null}
        peerName={name}
        busy={reportBusy}
        error={reportError}
        onSubmit={(reason) =>
          void submitReport(reason, reportTarget?.kind === 'message' ? reportTarget.msg.id : undefined)
        }
        onDismiss={() => {
          setReportTarget(null);
          setReportError(false);
        }}
      />

      {/* جستجوی گفتگو — نتیجه‌ها با پرش به حبابِ خودشان باز می‌شوند. */}
      <ChatSearch
        visible={searchOpen}
        matchId={matchId}
        onJump={jumpToMessage}
        onClose={() => setSearchOpen(false)}
      />

      <UpgradeSheet
        visible={sheet != null}
        onClose={() => {
          setSheet(null);
          vm.clearBlock();
        }}
        quotaKey={sheet?.kind === 'quota' ? 'conversation' : undefined}
        requiredTier={sheet?.kind === 'tier' ? sheet.level : undefined}
        feature={
          sheet?.kind === 'tier'
            ? sheet.feature
            : sheet?.kind === 'quota'
              ? undefined
              : undefined
        }
        title={
          sheet?.kind === 'tier' && sheet.feature === 'ارسال عکس در گفتگو'
            ? 'ارسال عکس در گفتگو قفل است'
            : sheet?.kind === 'tier'
              ? 'گفتگو با این کاربر قفل است'
              : undefined
        }
      />
    </ScreenContainer>
  );
}

/*
 * نوارِ پیامِ سنجاقشده.
 *
 * یک سطرِ باریک بینِ هدر و فهرست: آیکنِ سنجاق، پیشنمایشِ پیام، و دو ناحیهی
 * لمسی — تپِ روی متن میپرد به خودِ پیام (چون «پیدا کردنش در شلوغی» دلیلِ
 * سنجاق است)، ضربدر آن را برمیدارد. چرا کامپوننتِ جدا: خواناییِ ThreadScreen
 * و این که استایلِ نوار نباید به چرخهٔ رندرِ فهرست وابسته باشد.
 */
function PinnedBar({
  message,
  onJump,
  onUnpin,
}: {
  message: Message;
  onJump: () => void;
  onUnpin: () => void;
}) {
  return (
    <View style={styles.pinnedBar}>
      <Pressable
        onPress={onJump}
        accessibilityRole="button"
        accessibilityLabel="پرش به پیامِ سنجاقشده"
        style={styles.pinnedBody}
      >
        <Icon name="pin" size={14} tint="gold" />
        <Text style={styles.pinnedLabel} numberOfLines={1}>
          {messagePreviewText(message)}
        </Text>
      </Pressable>
      <Pressable
        onPress={onUnpin}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="برداشتنِ سنجاق"
        style={styles.pinnedUnpin}
      >
        <Icon name="close" size={14} tint="muted" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pinnedBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  pinnedBody: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pinnedLabel: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  pinnedUnpin: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    // مثل تلگرام: هدر روی پترن می‌نشیند، فقط خطی نازک جدا می‌کند.
    backgroundColor: 'rgba(11,9,16,0.82)',
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
  headerPeer: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  headerText: { flex: 1, minWidth: 0 },
  headerNameRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  presenceRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5, marginTop: 1 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.ok },
  headerHintLive: { color: colors.gold2 },
  headerHint: { fontFamily: fonts.regular, fontSize: fontSizes.xs, color: colors.ink3, textAlign: 'right' },
  headerName: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
    flexShrink: 1,
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
    paddingVertical: 4,
    borderRadius: radius.pill,
    // مثل تلگرام: کپسولِ نیمه‌شفاف روی پترن، بدون قابِ ضخیم.
    backgroundColor: 'rgba(32,30,40,0.72)',
  },
  sepText: { fontFamily: fonts.medium, fontSize: fontSizes.xs, color: colors.ink2 },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    // شعاعِ تلگرامی (~۱۸) با دمِ تیز روی آخرین پیامِ گروه.
    borderRadius: 18,
    marginTop: 2,
  },
  firstOfGroup: { marginTop: spacing.sm + 2 },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.gold },
  mineTail: { borderBottomRightRadius: 5 },
  theirs: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  theirsTail: { borderBottomLeftRadius: 5 },
  bubbleText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  mineText: { color: colors.onGold },
  textPending: { opacity: 0.72 },
  theirsText: { color: colors.ink },
  time: { fontFamily: fonts.regular, fontSize: 10, textAlign: 'left' },
  // ساعت و تیک در یک ردیف؛ در RTL تیک سمتِ چپِ ساعت می‌نشیند.
  metaRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, marginTop: 2, alignSelf: 'flex-end' },
  timeMine: { color: 'rgba(42,29,18,0.6)' },
  timeTheirs: { color: colors.ink3 },

  // نقلِ پیامِ مقصدِ پاسخ — یک نوارِ باریک بالای متنِ حباب.
  quote: {
    marginBottom: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderRightWidth: 2,
  },
  // داخلِ حبابِ طلایی، پس‌زمینه‌ی روشن است؛ متنِ نقل هم باید تیره باشد.
  // قبلاً هر دو حالت `ink2` (خاکستریِ روشن) بودند و نقل روی طلا خوانده نمی‌شد.
  quoteMine: { backgroundColor: 'rgba(42,29,18,0.14)', borderRightColor: 'rgba(42,29,18,0.55)' },
  quoteTheirs: { backgroundColor: colors.surface2, borderRightColor: colors.gold },
  quoteText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  quoteTextMine: { color: 'rgba(42,29,18,0.8)' },
  quoteTextTheirs: { color: colors.ink2 },
  quoteDeleted: { fontStyle: 'italic', opacity: 0.7 },

  // ردیفی که حباب و پیکانِ پاسخ را کنارِ هم نگه می‌دارد.
  bubbleRow: { justifyContent: 'center' },
  replyGlyph: { position: 'absolute', alignSelf: 'center' },
  // پیامِ من به چپ می‌رود، پس پیکان سمتِ راست جا باز می‌کند — و برعکس.
  replyGlyphMine: { right: spacing.md },
  replyGlyphTheirs: { left: spacing.md },
  // برقِ کوتاهِ پیامِ مقصدِ پرش.
  flashMine: { backgroundColor: colors.gold2 },
  flashTheirs: { backgroundColor: colors.surface2, borderColor: colors.goldSoft },

  // سنگِ قبر — نه حباب است نه پس‌زمینه دارد؛ فقط جای خالی را نگه می‌دارد.
  tombstone: {
    maxWidth: '78%',
    marginTop: 2,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.rim,
    borderStyle: 'dashed',
  },
  tombstoneIcon: { opacity: 0.6 },
  tombstoneText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    fontStyle: 'italic',
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
  },

  // نوارِ «پاسخ به…» / «ویرایشِ…» بالای نوارِ نوشتن.
  contextBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: -spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.rim,
    backgroundColor: colors.surface,
  },
  contextText: { flex: 1 },
  contextTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xs,
    color: colors.gold,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  contextBody: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.ink2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  editError: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    color: colors.rose,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
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
  /*
   * نوارِ هشدارِ سهمیه، بالای ورودی.
   *
   * جانشینِ متنِ ریزِ قرمزِ قبلی است که *بعد* از رد شدنِ ارسال نشان داده می‌شد.
   * این‌جا نکته‌ی طراحی «قابلِ فشار بودن» است: هشدار بن‌بست نیست، در است.
   */
  quotaHint: {
    position: 'absolute',
    top: -40,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    backgroundColor: colors.surface2,
  },
  quotaHintOut: { borderColor: colors.roseSoft },
  quotaHintText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  quotaHintCta: { fontFamily: fonts.bold, fontSize: fontSizes.xs, color: colors.gold2 },
});
