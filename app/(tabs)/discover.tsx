import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Discovery, Profile } from '@/api/nodoost';
import { SwipeCard } from '@/components/SwipeCard';
import { EmptyState } from '@/components/EmptyState';
import { Loading } from '@/components/Loading';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import type { Candidate } from '@/types';

export default function Discover() {
  const insets = useSafeAreaInsets();
  const [cards, setCards] = useState<Candidate[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState<{ peer: Candidate; matchId?: number } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await Discovery.list();
      setCards(list);
      setIndex(0);
    } catch {
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (perm.granted) {
          const loc = await Location.getCurrentPositionAsync({});
          await Profile.setLocation(loc.coords.latitude, loc.coords.longitude);
        }
      } catch {}
      load();
    })();
  }, [load]);

  const current = cards[index];

  const decide = useCallback(
    async (action: 'like' | 'pass') => {
      const target = cards[index];
      if (!target) return;
      setIndex((i) => i + 1);
      try {
        const res = await Discovery.swipe(target.id, action);
        if (action === 'like' && res?.match) {
          setMatch({ peer: res.match.peer ?? target, matchId: res.match.match_id });
        }
      } catch {}
    },
    [cards, index]
  );

  if (loading) return <Loading />;

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 8 }]}>
      <View style={styles.head}>
        <Text style={styles.title}>کاوش</Text>
      </View>

      <View style={styles.deck}>
        {current ? (
          <>
            <View style={styles.behind} />
            <SwipeCard key={current.id} candidate={current} onSwipe={decide} />
          </>
        ) : (
          <View style={styles.empty}>
            <EmptyState
              title="فعلاً کسی نمونده"
              hint="کمی بعد دوباره سر بزن تا چهره‌های تازه ببینی."
            />
            <Pressable style={styles.reload} onPress={load}>
              <Text style={styles.reloadText}>بارگذاریِ دوباره</Text>
            </Pressable>
          </View>
        )}
      </View>

      {current ? (
        <View style={styles.actions}>
          <Pressable style={[styles.fab, styles.pass]} onPress={() => decide('pass')}>
            <Ionicons name="close" size={30} color={colors.rose} />
          </Pressable>
          <Pressable style={[styles.fab, styles.like]} onPress={() => decide('like')}>
            <Ionicons name="heart" size={28} color={colors.onGold} />
          </Pressable>
        </View>
      ) : null}

      {match ? (
        <View style={styles.overlay}>
          <Text style={styles.matchKicker}>هر دو همدیگه رو پسندیدید</Text>
          <Text style={styles.matchTitle}>با {match.peer.name} مَچ شدی!</Text>
          <Pressable
            style={styles.matchBtn}
            onPress={() => {
              const id = match.matchId;
              setMatch(null);
              if (id) router.push({ pathname: '/thread/[id]', params: { id: String(id), name: match.peer.name } });
              else router.push('/(tabs)/chat');
            }}
          >
            <Text style={styles.matchBtnText}>شروعِ گفتگو</Text>
          </Pressable>
          <Pressable onPress={() => setMatch(null)}>
            <Text style={styles.matchSkip}>ادامه‌ی کاوش</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 18 },
  head: { paddingVertical: 10, alignItems: 'center' },
  title: { fontFamily: fonts.bold, fontSize: 20, color: colors.gold2 },
  deck: { flex: 1, marginTop: 4, marginBottom: 14 },
  behind: {
    position: 'absolute',
    top: 14,
    left: 10,
    right: 10,
    bottom: -6,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    opacity: 0.5,
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  reload: {
    borderWidth: 1,
    borderColor: colors.goldSoft,
    borderRadius: 12,
    paddingHorizontal: 22,
    paddingVertical: 11,
  },
  reloadText: { fontFamily: fonts.medium, fontSize: 13, color: colors.gold },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 26, paddingBottom: 14 },
  fab: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  pass: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  like: { backgroundColor: colors.gold },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,10,12,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  matchKicker: { fontFamily: fonts.regular, fontSize: 14, color: colors.ink2, marginBottom: 10 },
  matchTitle: { fontFamily: fonts.bold, fontSize: 28, color: colors.gold2, textAlign: 'center', marginBottom: 30 },
  matchBtn: {
    backgroundColor: colors.gold,
    borderRadius: 16,
    paddingHorizontal: 40,
    paddingVertical: 15,
    marginBottom: 16,
  },
  matchBtnText: { fontFamily: fonts.medium, fontSize: 16, color: colors.onGold },
  matchSkip: { fontFamily: fonts.regular, fontSize: 14, color: colors.ink3 },
});
