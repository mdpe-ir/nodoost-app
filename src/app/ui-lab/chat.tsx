import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '@/presentation/components/ScreenContainer';
import { ChatBackground } from '@/presentation/components/ChatBackground';
import { ChatComposer } from '@/presentation/components/ChatComposer';
import { Avatar } from '@/presentation/components/Avatar';
import { Icon } from '@/presentation/components/Icon';
import { PressableScale } from '@/presentation/components/PressableScale';
import { TierBadge } from '@/presentation/components/TierBadge';
import { emptyChatConfig } from '@/core/config/chatConfig';
import {
  colors,
  fonts,
  fontSizes,
  lineHeights,
  radius,
  spacing,
} from '@/core/theme';

type MockMsg = {
  id: string;
  mine: boolean;
  body: string;
  time: string;
  first?: boolean;
  last?: boolean;
  quote?: string;
  deleted?: boolean;
};

const MOCK: MockMsg[] = [
  { id: '1', mine: false, body: 'سلام!', time: '۲۰:۱۵', first: true, last: true },
  { id: '2', mine: true, body: 'سلام، خوبی؟', time: '۲۰:۱۶', first: true, last: false },
  { id: '3', mine: true, body: 'امروز چه خبر؟', time: '۲۰:۱۶', first: false, last: true },
  {
    id: '4',
    mine: false,
    body: 'خوبم ممنون. تو چی؟',
    time: '۲۰:۱۷',
    first: true,
    last: true,
    quote: 'امروز چه خبر؟',
  },
  { id: '5', mine: true, body: 'این پیام حذف شد', time: '۲۰:۱۸', first: true, last: true, deleted: true },
  { id: '6', mine: true, body: 'باشه فردا هماهنگ می‌کنیم', time: '۲۰:۲۰', first: true, last: true },
];

/**
 * آزمایشگاهِ UI چت — بدون بک‌اند و بدون نشست.
 * مسیر: /ui-lab/chat
 */
export default function ChatUiLab() {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState('');
  const chat = emptyChatConfig();

  return (
    <ScreenContainer flush>
      <ChatBackground />

      <View style={[styles.header, { paddingTop: insets.top || spacing.sm }]}>
        <PressableScale scaleTo={0.9} style={styles.iconBtn}>
          <Icon name="chevron-next" size={22} tint="white" />
        </PressableScale>
        <View style={styles.headerPeer}>
          <Avatar name="Mahan" size={38} ring />
          <View style={styles.headerText}>
            <View style={styles.headerNameRow}>
              <Text style={styles.headerName}>Mahan</Text>
              <TierBadge tier={1} height={18} />
            </View>
            <Text style={styles.headerHint}>آخرین بازدید: ۴۱ دقیقه پیش</Text>
          </View>
        </View>
        <PressableScale scaleTo={0.9} style={styles.iconBtn}>
          <Icon name="more" size={20} tint="gold" />
        </PressableScale>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.sepWrap}>
          <Text style={styles.sepText}>۲۴ مرداد</Text>
        </View>

        {MOCK.map((m) =>
          m.deleted ? (
            <View
              key={m.id}
              style={[styles.tombstone, m.mine ? styles.tombstoneMine : styles.tombstoneTheirs]}
            >
              <Icon name="lock" size={12} tint="gold" />
              <Text style={styles.tombstoneText}>{m.body}</Text>
            </View>
          ) : (
            <View
              key={m.id}
              style={[
                styles.bubble,
                m.mine ? styles.mine : styles.theirs,
                m.first && styles.firstOfGroup,
                m.mine && m.last && styles.mineTail,
                !m.mine && m.last && styles.theirsTail,
              ]}
            >
              {m.quote ? (
                <View style={[styles.quote, m.mine ? styles.quoteMine : styles.quoteTheirs]}>
                  <Text
                    style={[styles.quoteText, m.mine ? styles.quoteTextMine : styles.quoteTextTheirs]}
                    numberOfLines={2}
                  >
                    {m.quote}
                  </Text>
                </View>
              ) : null}
              <Text style={[styles.bubbleText, m.mine ? styles.mineText : styles.theirsText]}>
                {m.body}
              </Text>
              <View style={styles.metaRow}>
                <Text style={[styles.time, m.mine ? styles.timeMine : styles.timeTheirs]}>
                  {m.time}
                </Text>
                {m.mine ? <Icon name="check" size={12} tint="ink" /> : null}
              </View>
            </View>
          )
        )}
      </ScrollView>

      <ChatComposer
        draft={draft}
        onChangeDraft={setDraft}
        onSendText={() => setDraft('')}
        onSendVoice={(_uri, ms) => {
          setDraft(`🎤 ${Math.round(ms / 1000)}s`);
        }}
        onSendPhoto={() => undefined}
        chat={chat}
        myTier={3}
        onPhotoLocked={() => undefined}
        voiceEnabled
        photoBypassTier
      />
      <View style={{ height: Math.max(insets.bottom, spacing.sm) }} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: 'rgba(11,9,16,0.82)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerPeer: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  headerText: { flex: 1, minWidth: 0 },
  headerNameRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  headerName: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
    flexShrink: 1,
  },
  headerHint: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.ink3,
    textAlign: 'right',
    marginTop: 1,
  },
  list: { padding: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xl },
  sepWrap: {
    alignSelf: 'center',
    marginVertical: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(32,30,40,0.72)',
  },
  sepText: { fontFamily: fonts.medium, fontSize: fontSizes.xs, color: colors.ink2 },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
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
  theirsText: { color: colors.ink },
  metaRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    alignSelf: 'flex-end',
  },
  time: { fontFamily: fonts.regular, fontSize: 10, textAlign: 'left' },
  timeMine: { color: 'rgba(42,29,18,0.6)' },
  timeTheirs: { color: colors.ink3 },
  quote: {
    marginBottom: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderRightWidth: 2,
  },
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
  tombstone: {
    maxWidth: '78%',
    marginTop: spacing.sm,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    borderStyle: 'dashed',
  },
  tombstoneMine: { alignSelf: 'flex-end' },
  tombstoneTheirs: { alignSelf: 'flex-start' },
  tombstoneText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    fontStyle: 'italic',
    color: colors.ink3,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
