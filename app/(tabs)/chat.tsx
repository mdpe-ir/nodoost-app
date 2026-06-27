import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chat } from '@/api/nodoost';
import { useSocket } from '@/hooks/useSocket';
import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { Loading } from '@/components/Loading';
import { faNum } from '@/lib/faNum';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import type { Conversation } from '@/types';

export default function ChatList() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setItems(await Chat.conversations());
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // به‌روزرسانی با هر پیام/مَچِ تازه
  useSocket(true, (ev) => {
    if (ev.type === 'message' || ev.type === 'match') load();
  });

  if (loading) return <Loading />;

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 8 }]}>
      <View style={styles.head}>
        <Text style={styles.title}>گفتگوها</Text>
      </View>

      {items.length === 0 ? (
        <EmptyState title="هنوز گفتگویی نداری" hint="از کاوش یا گفتگوی تصادفی شروع کن." />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => String(it.match_id)}
          contentContainerStyle={{ paddingBottom: 20 }}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() =>
                router.push({
                  pathname: '/thread/[id]',
                  params: {
                    id: String(item.match_id),
                    name: item.other_name ?? '',
                    random: item.source === 'random' ? '1' : '0',
                  },
                })
              }
            >
              <Avatar name={item.other_name} size={54} />
              <View style={styles.mid}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.other_name || 'کاربر'}
                  </Text>
                  {item.source === 'random' ? (
                    <View style={styles.rbadge}>
                      <Text style={styles.rbadgeText}>تصادفی</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.last} numberOfLines={1}>
                  {item.last_body || 'گفتگو را شروع کن…'}
                </Text>
              </View>
              {item.unread ? (
                <View style={styles.unread}>
                  <Text style={styles.unreadText}>{faNum(item.unread)}</Text>
                </View>
              ) : null}
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 18 },
  head: { paddingVertical: 12 },
  title: { fontFamily: fonts.bold, fontSize: 20, color: colors.gold2 },
  sep: { height: 1, backgroundColor: colors.line, marginVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 14 },
  mid: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontFamily: fonts.medium, fontSize: 16, color: colors.ink, flexShrink: 1 },
  rbadge: { backgroundColor: colors.goldFaint, borderRadius: 50, paddingHorizontal: 8, paddingVertical: 2 },
  rbadgeText: { fontFamily: fonts.medium, fontSize: 10, color: colors.gold2 },
  last: { fontFamily: fonts.regular, fontSize: 13, color: colors.ink3, marginTop: 4 },
  unread: { minWidth: 22, height: 22, borderRadius: 11, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  unreadText: { fontFamily: fonts.bold, fontSize: 11, color: colors.onGold },
});
