import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Random } from '@/api/nodoost';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/hooks/useSocket';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

const GENDERS = [
  { key: '', label: 'فرقی نداره' },
  { key: 'f', label: 'زن' },
  { key: 'm', label: 'مرد' },
];

export default function RandomChat() {
  const insets = useSafeAreaInsets();
  const { me } = useAuth();
  const [state, setState] = useState<'idle' | 'waiting'>('idle');
  const [gender, setGender] = useState('');
  const canFilter = (me?.tier ?? 1) >= 2;

  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.12, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scale]);

  const goToThread = useCallback((matchId?: number) => {
    setState('idle');
    if (matchId) router.push({ pathname: '/thread/[id]', params: { id: String(matchId), random: '1' } });
    else router.push('/(tabs)/chat');
  }, []);

  // شنودِ رویدادِ مَچ هنگامِ انتظار
  useSocket(state === 'waiting', (ev) => {
    if (ev.type === 'match') {
      const m = ev as { match?: { match_id?: number }; match_id?: number };
      goToThread(m.match?.match_id ?? m.match_id);
    }
  });

  async function connect() {
    setState('waiting');
    try {
      const r = await Random.join(canFilter && gender ? { gender } : {});
      if (r?.status === 'matched' && r.match_id) goToThread(r.match_id);
    } catch {
      setState('idle');
    }
  }

  async function cancel() {
    setState('idle');
    try {
      await Random.leave();
    } catch {}
  }

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
      <Text style={styles.title}>گفتگوی تصادفی</Text>
      <Text style={styles.sub}>یک‌نفر هم‌تراز با تو، همین حالا.</Text>

      <View style={styles.center}>
        <Animated.View style={[styles.orb, { transform: [{ scale }] }]}>
          <View style={styles.orbInner}>
            <Text style={styles.orbText}>{state === 'waiting' ? 'در حالِ پیدا کردن…' : 'آماده‌ای؟'}</Text>
          </View>
        </Animated.View>
      </View>

      {state === 'idle' ? (
        <>
          <Text style={styles.flabel}>ترجیحِ جنسیت</Text>
          <View style={styles.row}>
            {GENDERS.map((g) => {
              const on = gender === g.key;
              const locked = !canFilter && g.key !== '';
              return (
                <Pressable
                  key={g.key || 'any'}
                  onPress={() => (locked ? router.push('/(tabs)/profile') : setGender(g.key))}
                  style={[styles.chip, on && styles.chipOn, locked && styles.chipLocked]}
                >
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>{g.label}</Text>
                  {locked ? <Text style={styles.lock}> 🔒</Text> : null}
                </Pressable>
              );
            })}
          </View>
          {!canFilter ? (
            <Text style={styles.hint}>فیلترِ جنسیت ویژه‌ی اعضای طلایی به بالاست.</Text>
          ) : null}
          <Pressable style={styles.connect} onPress={connect}>
            <Text style={styles.connectText}>وصلم کن</Text>
          </Pressable>
        </>
      ) : (
        <Pressable style={styles.cancel} onPress={cancel}>
          <Text style={styles.cancelText}>لغو</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 26, alignItems: 'center' },
  title: { fontFamily: fonts.bold, fontSize: 22, color: colors.gold2, marginTop: 8 },
  sub: { fontFamily: fonts.regular, fontSize: 14, color: colors.ink2, marginTop: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%' },
  orb: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.goldFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbInner: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  orbText: { fontFamily: fonts.medium, fontSize: 14, color: colors.gold2, textAlign: 'center' },
  flabel: { fontFamily: fonts.medium, fontSize: 13, color: colors.ink2, marginBottom: 12, alignSelf: 'flex-start' },
  row: { flexDirection: 'row', gap: 10, width: '100%' },
  chip: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  chipOn: { borderColor: colors.gold, backgroundColor: colors.goldFaint },
  chipLocked: { opacity: 0.6 },
  chipText: { fontFamily: fonts.medium, fontSize: 14, color: colors.ink2 },
  chipTextOn: { color: colors.gold2 },
  lock: { fontSize: 11 },
  hint: { fontFamily: fonts.regular, fontSize: 12, color: colors.ink3, marginTop: 10 },
  connect: {
    backgroundColor: colors.gold,
    borderRadius: 16,
    height: 56,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },
  connectText: { fontFamily: fonts.bold, fontSize: 17, color: colors.onGold },
  cancel: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    height: 56,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { fontFamily: fonts.medium, fontSize: 16, color: colors.ink2 },
});
