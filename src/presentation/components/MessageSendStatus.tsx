import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Icon } from './Icon';

interface Props {
  pending?: boolean;
  failed?: boolean;
  read?: boolean;
  onRetry?: () => void;
}

/**
 * وضعیتِ ارسالِ پیامِ خودم — ساعت (در حال ارسال)، تیک (رفت/خوانده شد)،
 * یا refresh (تلاش دوباره).
 */
export function MessageSendStatus({ pending, failed, read, onRetry }: Props) {
  if (failed) {
    return (
      <Pressable
        onPress={onRetry}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="تلاش دوباره"
        style={styles.failed}
      >
        <Ionicons name="refresh-circle" size={15} color="#E85D5D" />
      </Pressable>
    );
  }
  if (pending) {
    return (
      <View accessibilityRole="progressbar" accessibilityLabel="در حال ارسال">
        <Ionicons name="time-outline" size={12} color="rgba(42,29,18,0.55)" />
      </View>
    );
  }
  return <Ticks read={!!read} />;
}

function Ticks({ read }: { read: boolean }) {
  return (
    <View
      style={[styles.ticks, read && styles.ticksRead]}
      accessibilityLabel={read ? 'خوانده شد' : 'ارسال شد'}
      accessibilityRole="image"
    >
      <Icon name="check" size={12} tint="ink" style={styles.tick} />
      {read ? <Icon name="check" size={12} tint="ink" style={styles.tickSecond} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  ticks: { alignItems: 'center', width: 12, height: 12 },
  ticksRead: { width: 17 },
  tick: { position: 'absolute', left: 0, top: 0 },
  tickSecond: { position: 'absolute', left: 5, top: 0 },
  failed: { width: 15, height: 15, alignItems: 'center', justifyContent: 'center' },
});
