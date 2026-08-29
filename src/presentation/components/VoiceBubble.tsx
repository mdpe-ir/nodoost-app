import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useChatMediaUri } from '@/presentation/hooks/useChatMediaUri';
import { MediaTransferOverlay } from './MediaTransferOverlay';
import type { MediaTransferPhase } from '@/domain/entities';
import { faDuration } from '@/core/utils/time';
import { colors, fonts, fontSizes, spacing } from '@/core/theme';

interface Props {
  matchId: number;
  messageId?: number;
  localUri?: string;
  pending?: boolean;
  failed?: boolean;
  transferPhase?: MediaTransferPhase;
  transferProgress?: number;
  durationMs?: number;
  peaks?: number[];
  mine: boolean;
  onLongPress?: () => void;
  onRetry?: () => void;
}

export function VoiceBubble({
  matchId,
  messageId,
  localUri,
  pending,
  failed,
  transferPhase,
  transferProgress,
  durationMs,
  peaks,
  mine,
  onLongPress,
  onRetry,
}: Props) {
  const [dlProgress, setDlProgress] = useState<number | undefined>();
  const needsRemote = !!messageId && !localUri;
  const { uri: remoteUri, loading } = useChatMediaUri(
    matchId,
    needsRemote ? messageId : undefined,
    'voice',
    'audio/mp4',
    needsRemote ? setDlProgress : undefined
  );

  const uri = localUri || remoteUri;
  const player = useAudioPlayer(uri ? { uri } : null);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    if (!uri) return;
    player.replace({ uri });
  }, [uri, player]);

  const toggle = useCallback(() => {
    if (!uri || failed || pending) return;
    if (status.playing) player.pause();
    else player.play();
  }, [uri, failed, pending, status.playing, player]);

  const bars = useMemo(() => {
    const src = peaks?.length ? peaks : Array.from({ length: 28 }, (_, i) => 0.25 + (i % 5) * 0.12);
    return src.slice(0, 32);
  }, [peaks]);

  const elapsed = status.currentTime ? status.currentTime * 1000 : 0;
  const total = durationMs ?? (status.duration ? status.duration * 1000 : 0);
  const label = status.playing ? faDuration(elapsed) : faDuration(total);

  const uploading = !!pending && !failed;
  const downloading = needsRemote && loading && !uri;
  const showOverlay = failed || uploading || downloading;

  const overlayPhase: MediaTransferPhase | undefined = failed
    ? undefined
    : uploading
      ? transferPhase ?? 'uploading'
      : downloading
        ? 'downloading'
        : undefined;

  const overlayProgress = uploading
    ? transferProgress
    : downloading
      ? dlProgress
      : undefined;

  return (
    <Pressable
      onPress={failed && onRetry ? onRetry : toggle}
      onLongPress={onLongPress}
      delayLongPress={280}
      disabled={!onLongPress && !uri && !failed}
      style={[styles.row, mine ? styles.rowMine : styles.rowTheirs]}
      accessibilityRole="button"
      accessibilityLabel={
        failed
          ? 'تلاش دوباره‌ی ارسالِ ویس'
          : status.playing
            ? 'توقفِ پیام صوتی'
            : 'پخشِ پیام صوتی'
      }
      accessibilityHint={onLongPress ? 'نگه‌داشتن برای پاسخ یا حذف' : undefined}
    >
      <View style={[styles.play, mine ? styles.playMine : styles.playTheirs]}>
        {showOverlay ? (
          <MediaTransferOverlay
            phase={overlayPhase}
            progress={overlayProgress}
            failed={failed}
            compact
          />
        ) : (
          <Ionicons
            name={status.playing ? 'pause' : 'play'}
            size={16}
            color={mine ? colors.ink : colors.gold}
          />
        )}
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
    overflow: 'hidden',
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
