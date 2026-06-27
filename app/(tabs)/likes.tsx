import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Likes } from '@/api/nodoost';
import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { Loading } from '@/components/Loading';
import { faNum } from '@/lib/faNum';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import type { Candidate } from '@/types';

export default function LikesScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<Candidate[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await Likes.list();
      setCount(d?.count ?? 0);
      setRevealed(!!d?.revealed);
      setResults(d?.results ?? []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Loading />;

  const lockedTiles = Array.from({ length: Math.min(count, 9) || 0 });

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 8 }]}>
      <View style={styles.head}>
        <Text style={styles.title}>پسندها</Text>
        {count > 0 ? <Text style={styles.count}>{faNum(count)} نفر</Text> : null}
      </View>

      {count === 0 ? (
        <EmptyState title="هنوز کسی پسندت نکرده" hint="پروفایلت را کامل کن تا بیشتر دیده شوی." />
      ) : revealed ? (
        <FlatList
          data={results}
          keyExtractor={(it) => String(it.id)}
          numColumns={2}
          columnWrapperStyle={styles.colWrap}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <Pressable
              style={styles.tile}
              onPress={() =>
                router.push({ pathname: '/thread/[id]', params: { id: String(item.id), name: item.name } })
              }
            >
              <Avatar uri={item.photos?.[0]} name={item.name} size={72} />
              <Text style={styles.tileName} numberOfLines={1}>
                {item.name}
                {item.age ? '، ' + faNum(item.age) : ''}
              </Text>
            </Pressable>
          )}
        />
      ) : (
        <View style={styles.lockedWrap}>
          <View style={styles.lockedGrid}>
            {lockedTiles.map((_, i) => (
              <View key={i} style={styles.lockedTile}>
                <Ionicons name="lock-closed" size={22} color={colors.goldSoft} />
              </View>
            ))}
          </View>
          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>{faNum(count)} نفر تو را پسندیده‌اند</Text>
            <Text style={styles.bannerText}>با عضویتِ طلایی، ببین چه کسانی منتظرِ تواند.</Text>
            <Pressable style={styles.upgrade} onPress={() => router.push('/(tabs)/profile')}>
              <Text style={styles.upgradeText}>ارتقای عضویت</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 18 },
  head: { paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: fonts.bold, fontSize: 20, color: colors.gold2 },
  count: { fontFamily: fonts.medium, fontSize: 13, color: colors.ink2 },
  grid: { paddingTop: 6, paddingBottom: 20 },
  colWrap: { gap: 14, marginBottom: 14 },
  tile: { flex: 1, alignItems: 'center', backgroundColor: colors.surface, borderRadius: 16, paddingVertical: 18, borderWidth: 1, borderColor: colors.line },
  tileName: { fontFamily: fonts.medium, fontSize: 13, color: colors.ink, marginTop: 10 },
  lockedWrap: { flex: 1 },
  lockedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 10 },
  lockedTile: {
    width: 96,
    height: 96,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  banner: {
    marginTop: 'auto',
    marginBottom: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
  },
  bannerTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.gold2, textAlign: 'center' },
  bannerText: { fontFamily: fonts.regular, fontSize: 13, color: colors.ink2, textAlign: 'center', marginTop: 8, lineHeight: 22 },
  upgrade: { backgroundColor: colors.gold, borderRadius: 14, paddingHorizontal: 32, paddingVertical: 13, marginTop: 16 },
  upgradeText: { fontFamily: fonts.medium, fontSize: 15, color: colors.onGold },
});
