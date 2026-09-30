import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { MediaTransferPhase } from '@/domain/entities';
import { faNum } from '@/core/utils/faNum';
import { colors, fonts, fontSizes } from '@/core/theme';

interface Props {
  phase?: MediaTransferPhase;
  /** ۰ تا ۱؛ اگر نباشد فقط اسپینر. */
  progress?: number;
  failed?: boolean;
  /** اندازه‌ی کوچک‌تر برای حبابِ ویس. */
  compact?: boolean;
}

function labelOf(phase?: MediaTransferPhase, failed?: boolean): string {
  if (failed) return 'تلاش دوباره';
  if (phase === 'preparing') return 'آماده‌سازی';
  if (phase === 'uploading') return 'آپلود';
  if (phase === 'downloading') return 'دانلود';
  return '';
}

/**
 * پوششِ پیشرفت روی حبابِ رسانه — الگوی تلگرام:
 * دایره‌ی تیره با درصد/اسپینر، و در شکست آیکنِ refresh.
 * تپ دستِ حبابِ والد است؛ این لایه فقط شکل است تا دکمه‌ی تو در تو ساخته نشود.
 */
export function MediaTransferOverlay({
  phase,
  progress,
  failed,
  compact,
}: Props) {
  if (!failed && !phase) return null;

  const size = compact ? 34 : 52;
  const known = typeof progress === 'number' && Number.isFinite(progress);
  const ratio = known ? Math.max(0, Math.min(1, progress)) : 0;
  const pct = known ? Math.round(ratio * 100) : null;
  const showPct = !failed && pct != null && phase !== 'preparing';

  return (
    <View style={compact ? styles.wrapCompact : styles.wrap} pointerEvents="none">
      <View
        style={[styles.disk, { width: size, height: size, borderRadius: size / 2 }]}
        accessibilityRole={failed ? undefined : 'progressbar'}
        accessibilityLabel={labelOf(phase, failed)}
        accessibilityValue={pct != null ? { now: pct, min: 0, max: 100 } : undefined}
      >
        <View
          style={[
            styles.ring,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderColor: showPct ? colors.gold : 'rgba(255,255,255,0.3)',
              opacity: showPct ? 0.4 + ratio * 0.6 : 1,
            },
          ]}
        />
        {failed ? (
          <Ionicons name="refresh" size={compact ? 18 : 22} color="#fff" />
        ) : showPct && pct != null ? (
          <Text style={[styles.pct, compact && styles.pctCompact]}>{faNum(pct)}</Text>
        ) : (
          <ActivityIndicator color="#fff" size="small" />
        )}
      </View>
      {!compact && (failed || phase === 'preparing') ? (
        <Text style={styles.hint}>{labelOf(phase, failed)}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.38)',
    gap: 6,
  },
  /** فقط روی دکمه‌ی پخشِ ویس — بدون پس‌زمینه‌ی تیرهٔ تمام‌حباب. */
  wrapCompact: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disk: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  ring: {
    position: 'absolute',
    borderWidth: 3,
  },
  pct: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.sm,
    color: '#fff',
    textAlign: 'center',
  },
  pctCompact: { fontSize: fontSizes.xs },
  hint: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
});