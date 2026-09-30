import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, TextInput, FlatList, Pressable, StyleSheet } from 'react-native';
import { Icon } from './Icon';
import { EmptyState } from './EmptyState';
import { haptics } from '@/core/haptics';
import { useCases } from '@/core/di/DIProvider';
import { faDayLabel, faClock } from '@/core/utils/time';
import { messagePreviewText } from '@/core/media/messagePreview';
import type { Message } from '@/domain/entities';
import { colors, fonts, fontSizes, lineHeights, spacing, radius } from '@/core/theme';

/*
 * جستجوی داخلِ گفتگو — پوشه‌ای که از منوی گفتگو باز می‌شود و نتیجه‌ها را
 * «متن + تاریخ» نشان می‌دهد. تپ روی نتیجه، پوشه را می‌بندد و خودِ گفتگو با
 * `jumpToMessage` (که تاریخچه را تا آن پیام می‌کشد) به حباب می‌پرد و برجسته‌اش
 * می‌کند — همان رفتارِ تلگرام با نتیجه‌های جستجو.
 */

interface Props {
  visible: boolean;
  matchId: number;
  /** پرش به یک پیام در گفتگوی زیرین (پس از بستنِ پوشه). */
  onJump: (messageId: number) => void;
  onClose: () => void;
}

export function ChatSearch({ visible, matchId, onJump, onClose }: Props) {
  const uc = useCases();
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [searched, setSearched] = useState(false);
  const [failed, setFailed] = useState(false);
  const inputRef = useRef<TextInput>(null);
  /** شناسهی درخواستِ جاری — پاسخِ دیرِ عبارتِ قبلی نباید روی نتیجه بنشیند. */
  const reqId = useRef(0);

  // هر بازشدن: حالت قبلی پاک و ورودی فوکوس می‌گیرد (کمی دیر، تا مودال جا بیفتد).
  // ریستِ حالت در افکت عمدی است: همگام‌سازیِ «بازشدنِ مودال» با state داخلی،
  // نه رندرِ آبشاری از روی props — مثلِ همان الگوی `useChatInfoViewModel`.
  useEffect(() => {
    if (!visible) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQ('');
    setHits([]);
    setSearched(false);
    setFailed(false);
    const t = setTimeout(() => inputRef.current?.focus(), 260);
    return () => clearTimeout(t);
  }, [visible]);

  const runSearch = async (term: string) => {
    if (!term) return;
    const id = ++reqId.current;
    setBusy(true);
    setFailed(false);
    try {
      const res = await uc.chat.searchMessages(matchId, term);
      if (id !== reqId.current) return;
      setHits(res.items);
      setSearched(true);
    } catch {
      if (id === reqId.current) setFailed(true);
    } finally {
      if (id === reqId.current) setBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.wrap}>
        <View style={styles.bar}>
          <Pressable
            onPress={() => {
              haptics.tap();
              onClose();
            }}
            accessibilityRole="button"
            accessibilityLabel="بستنِ جستوجو"
            style={styles.closeBtn}
          >
            <Icon name="close" size={20} tint="white" />
          </Pressable>
          <View style={styles.field}>
            <Icon name="search" size={16} tint="muted" />
            <TextInput
              ref={inputRef}
              value={q}
              onChangeText={setQ}
              placeholder="جستجو در این گفتگو…"
              placeholderTextColor={colors.ink3}
              style={styles.input}
              returnKeyType="search"
              onSubmitEditing={() => void runSearch(q.trim())}
              textAlign="right"
            />
            {q ? (
              <Pressable
                onPress={() => {
                  setQ('');
                  setHits([]);
                  setSearched(false);
                  inputRef.current?.focus();
                }}
                accessibilityRole="button"
                accessibilityLabel="پاککردنِ عبارت"
              >
                <Icon name="close" size={16} tint="muted" />
              </Pressable>
            ) : null}
          </View>
          <Pressable
            onPress={() => {
              haptics.select();
              void runSearch(q.trim());
            }}
            accessibilityRole="button"
            accessibilityLabel="جستوجو"
            style={styles.goBtn}
          >
            <Text style={styles.goText}>بگرد</Text>
          </Pressable>
        </View>

        <FlatList
          data={hits}
          keyExtractor={(m) => String(m.id ?? m.clientId ?? Math.random())}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            busy ? (
              <Text style={styles.note}>میگردم…</Text>
            ) : failed ? (
              <EmptyState
                icon="rewind"
                title="جستجو شکست خورد"
                hint="ارتباط با سرور برقرار نشد."
                actionLabel="تلاشِ دوباره"
                onAction={() => void runSearch(q.trim())}
              />
            ) : searched && hits.length === 0 ? (
              <EmptyState icon="search" title="چیزی پیدا نشد" hint="عبارتِ دیگری را امتحان کن." />
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                if (item.id == null) return;
                haptics.select();
                onClose();
                // گفتگوی زیرین (که همین حالا دیده میشود) به خودِ پیام میپرد.
                onJump(item.id);
              }}
              accessibilityRole="button"
              accessibilityLabel={messagePreviewText(item)}
              style={styles.hit}
            >
              <View style={styles.hitBody}>
                <Text style={styles.hitText} numberOfLines={2}>
                  {messagePreviewText(item)}
                </Text>
                <Text style={styles.hitDate}>
                  {faDayLabel(item.createdAt)} · {faClock(item.createdAt)}
                </Text>
              </View>
              <Icon name="chevron-prev" size={14} tint="muted" />
            </Pressable>
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  bar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.ink,
    writingDirection: 'rtl',
  },
  goBtn: {
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: 18,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goText: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.gold },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  note: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.ink3,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  hit: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  hitBody: { flex: 1, alignItems: 'flex-end', gap: 2 },
  hitText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  hitDate: { fontFamily: fonts.regular, fontSize: fontSizes.xs, color: colors.ink3 },
});
