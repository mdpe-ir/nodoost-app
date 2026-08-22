import React from 'react';
import { View, ActivityIndicator, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useChatMediaUri } from '@/presentation/hooks/useChatMediaUri';
import { colors, radius } from '@/core/theme';

interface Props {
  matchId: number;
  messageId: number;
  width?: number;
  height?: number;
  mine: boolean;
  onPress?: () => void;
}

export function PhotoBubble({ matchId, messageId, width, height, mine, onPress }: Props) {
  const { uri, loading, error } = useChatMediaUri(matchId, messageId, 'photo', 'image/webp');
  const aspect =
    width && height && width > 0 && height > 0
      ? { width: Math.min(240, width), height: Math.min(320, Math.round((Math.min(240, width) * height) / width)) }
      : { width: 220, height: 165 };

  return (
    <Pressable
      onPress={onPress}
      disabled={!uri}
      accessibilityRole="image"
      accessibilityLabel="عکس"
    >
      <View style={[styles.frame, mine ? styles.mine : styles.theirs, aspect]}>
        {loading ? <ActivityIndicator color={colors.gold} /> : null}
        {!loading && (error || !uri) ? <View style={styles.placeholder} /> : null}
        {uri ? (
          <Image source={{ uri }} style={[StyleSheet.absoluteFill, styles.img]} contentFit="cover" />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: radius.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mine: { backgroundColor: 'rgba(42,29,18,0.12)' },
  theirs: { backgroundColor: colors.surface2 },
  img: { borderRadius: radius.md },
  placeholder: { ...StyleSheet.absoluteFill, backgroundColor: colors.line },
});
