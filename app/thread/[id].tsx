import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Chat } from '@/api/nodoost';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/hooks/useSocket';
import { Loading } from '@/components/Loading';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import type { Message } from '@/types';

export default function Thread() {
  const insets = useSafeAreaInsets();
  const { me } = useAuth();
  const params = useLocalSearchParams<{ id: string; name?: string; random?: string }>();
  const matchId = Number(params.id);
  const peerName = params.name || 'گفتگو';
  const isRandom = params.random === '1';

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);

  const load = useCallback(async () => {
    try {
      setMessages(await Chat.messages(matchId));
    } catch {
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    load();
  }, [load]);

  // دریافتِ پیامِ بلادرنگ
  useSocket(true, (ev) => {
    if (ev.type === 'message') {
      const m = (ev as { message?: Message }).message;
      if (m && m.match_id === matchId) {
        setMessages((prev) => [...prev, m]);
      }
    }
  });

  async function send() {
    const body = text.trim();
    if (!body || sending) return;
    setText('');
    setSending(true);
    // نمایشِ خوش‌بینانه
    const optimistic: Message = { match_id: matchId, sender_id: me?.id ?? -1, body };
    setMessages((prev) => [...prev, optimistic]);
    try {
      await Chat.send(matchId, body);
    } catch {
      // در صورتِ خطا پیام را برمی‌داریم
      setMessages((prev) => prev.filter((x) => x !== optimistic));
      setText(body);
    } finally {
      setSending(false);
    }
  }

  const data = [...messages].reverse(); // inverted

  return (
    <KeyboardAvoidingView
      style={styles.wrap}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <Ionicons name="chevron-forward" size={26} color={colors.ink} />
        </Pressable>
        <View style={styles.headTitle}>
          <Text style={styles.headName}>{peerName}</Text>
          {isRandom ? <Text style={styles.headSub}>هم‌صحبتِ تصادفی</Text> : null}
        </View>
      </View>

      {loading ? (
        <Loading />
      ) : (
        <FlatList
          ref={listRef}
          data={data}
          inverted
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const mine = item.sender_id === me?.id;
            return (
              <View style={[styles.bubbleRow, mine ? styles.rowMine : styles.rowTheirs]}>
                <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                  <Text style={[styles.bubbleText, mine ? styles.textMine : styles.textTheirs]}>
                    {item.body}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}

      <View style={[styles.inputRow, { paddingBottom: insets.bottom + 10 }]}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="پیامت را بنویس…"
          placeholderTextColor={colors.ink3}
          style={styles.input}
          textAlign="right"
          multiline
        />
        <Pressable style={[styles.send, !text.trim() && styles.sendOff]} onPress={send} disabled={!text.trim()}>
          <Ionicons name="arrow-up" size={22} color={colors.onGold} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    gap: 8,
  },
  back: { padding: 4 },
  headTitle: { flex: 1 },
  headName: { fontFamily: fonts.bold, fontSize: 18, color: colors.ink },
  headSub: { fontFamily: fonts.regular, fontSize: 12, color: colors.gold, marginTop: 2 },
  list: { paddingHorizontal: 16, paddingVertical: 14 },
  bubbleRow: { marginVertical: 4, flexDirection: 'row' },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  mine: { backgroundColor: colors.gold, borderBottomRightRadius: 4 },
  theirs: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderBottomLeftRadius: 4 },
  bubbleText: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 24 },
  textMine: { color: colors.onGold },
  textTheirs: { color: colors.ink },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 14,
    paddingTop: 10,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    maxHeight: 110,
    minHeight: 46,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 11,
    color: colors.ink,
    fontFamily: fonts.regular,
    fontSize: 15,
  },
  send: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  sendOff: { opacity: 0.4 },
});
