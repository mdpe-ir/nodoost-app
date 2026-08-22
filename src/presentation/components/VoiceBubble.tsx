import React, { useCallback, useEffect, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useChatMediaUri } from '@/presentation/hooks/useChatMediaUri';
import { faNum } from '@/core/utils/faNum';
import { colors, fonts, fontSizes, spacing } from '@/core/theme';

function formatMs(ms?: number): string {
  if (!ms || ms <= 0) return '0:00';
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${faNum(m)}:${faNum(r).padStart(2, '0')}`;
}

interface Props {
  matchId: number;
  messageId: number;
  durationMs?: number;
  peaks?: number[];
  mine: boolean;
}

export function VoiceBubble({ matchId, messageId, durationMs, peaks, mine }: Props) {
  const { uri, loading } = useChatMediaUri(matchId, messageId, 'voice', 'audio/mp4');
  const player = useAudioPlayer(uri ? { uri } : null);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    if (!uri) return;
    player.replace({ uri });
  }, [uri, player]);

  const toggle = useCallback(() => {
    if (!uri) return;
    if (status.playing) player.pause();
    else player.play();
  }, [uri, status.playing, player]);

  const bars = useMemo(() => {
    const src = peaks?.length ? peaks : Array.from({ length: 28 }, (_, i) => 0.25 + (i % 5) * 0.12);
    return src.slice(0, 32);
  }, [peaks]);

  const elapsed = status.currentTime ? status.currentTime * 1000 : 0;
  const total = durationMs ?? (status.duration ? status.duration * 1000 : 0);
  const label = status.playing ? formatMs(elapsed) : formatMs(total);

  return (
    <Pressable
      onPress={toggle}
      disabled={!uri || loading}
      style={[styles.row, mine ? styles.rowMine : styles.rowTheirs]}
      accessibilityRole="button"
      accessibilityLabel={status.playing ? 'توقفِ پیام صوتی' : 'پخشِ پیام صوتی'}
    >
      <View style={[styles.play, mine ? styles.playMine : styles.playTheirs]}>
        <Ionicons
          name={status.playing ? 'pause' : 'play'}
          size={16}
          color={mine ? colors.ink : colors.gold}
        />
      </View>
      <View style={styles.wave}>
        {bars.map((h, i) => (
          <View
            key={i}
            style={[
              styles.bar,
              {
                height: 6 + h * 18,
                opacity: status.playing && i / bars.length <= elapsed / Math.max(total, 1) ? 1 : 0.55,
              },
              mine ? styles.barMine : styles.barTheirs,
            ]}
          />
        ))}
      </View>
      <Text style={[styles.time, mine ? styles.timeMine : styles.timeTheirs]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 200,
    paddingVertical: 2,
  },
  rowMine: {},
  rowTheirs: {},
  play: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface2,
  },
  playMine: { backgroundColor: 'rgba(42,29,18,0.18)' },
  playTheirs: { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line },
  wave: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 2,
    minHeight: 28,
  },
  bar: { width: 3, borderRadius: 2, backgroundColor: colors.gold },
  barMine: { backgroundColor: 'rgba(42,29,18,0.65)' },
  barTheirs: { backgroundColor: colors.gold },
  time: {
    minWidth: 36,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    textAlign: 'left',
  },
  timeMine: { color: 'rgba(42,29,18,0.75)' },
  timeTheirs: { color: colors.ink2 },
});
