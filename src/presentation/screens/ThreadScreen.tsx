import React, { useRef } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/presentation/components/ScreenContainer';
import { Loading } from '@/presentation/components/Loading';
import { useThreadViewModel } from '@/presentation/hooks/useThreadViewModel';
import { colors, fonts, fontSizes, spacing, radius } from '@/core/theme';

export function ThreadScreen({ matchId, name }: { matchId: number; name?: string }) {
  const vm = useThreadViewModel(matchId);
  const listRef = useRef<FlatList>(null);

  return (
    <ScreenContainer flush style={styles.wrap}>
      <View style={styles.header}>
        <Pressable hitSlop={10} onPress={() => router.back()}>
          <Ionicons name="chevron-forward" size={26} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerName} numberOfLines={1}>
          {name || 'گفتگو'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        {vm.loading ? (
          <Loading />
        ) : (
          <FlatList
            ref={listRef}
            data={vm.messages}
            keyExtractor={(m, i) => String(m.id ?? i)}
            contentContainerStyle={styles.list}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const mine = item.senderId === vm.myId;
              return (
                <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                  <Text style={[styles.bubbleText, mine ? styles.mineText : styles.theirsText]}>
                    {item.body}
                  </Text>
                </View>
              );
            }}
          />
        )}

        <View style={styles.composer}>
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
            style={[styles.send, !vm.draft.trim() && styles.sendOff]}
            onPress={vm.send}
            disabled={vm.sending || !vm.draft.trim()}
          >
            <Ionicons name="send" size={20} color={colors.onGold} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 0 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  headerName: { flex: 1, fontFamily: fonts.bold, fontSize: fontSizes.lg, color: colors.ink, textAlign: 'right', marginRight: spacing.md },
  headerSpacer: { width: 26 },
  list: { padding: spacing.lg, gap: spacing.sm },
  bubble: { maxWidth: '78%', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.lg },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.gold, borderBottomRightRadius: 4 },
  theirs: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderBottomLeftRadius: 4 },
  bubbleText: { fontFamily: fonts.regular, fontSize: fontSizes.md, lineHeight: 22, textAlign: 'right' },
  mineText: { color: colors.onGold },
  theirsText: { color: colors.ink },
  composer: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
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
    color: colors.ink,
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
  },
  send: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  sendOff: { opacity: 0.4 },
});
