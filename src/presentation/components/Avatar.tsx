import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { mediaUrl } from '@/core/http/mediaUrl';
import { colors, fonts } from '@/core/theme';

interface Props {
  uri?: string;
  name?: string;
  size?: number;
  /** قابِ طلاییِ نازک دورِ آواتار */
  ring?: boolean;
}

export function Avatar({ uri, name, size = 56, ring = false }: Props) {
  const src = mediaUrl(uri);
  const radius = size / 2;
  return (
    <View
      style={[styles.wrap, { width: size, height: size, borderRadius: radius }, ring && styles.ring]}
    >
      {src ? (
        <Image
          source={{ uri: src }}
          style={{ width: size, height: size, borderRadius: radius }}
          contentFit="cover"
          transition={180}
          cachePolicy="memory-disk"
        />
      ) : (
        <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{(name || '؟').charAt(0)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ring: { borderWidth: 1.5, borderColor: colors.goldSoft },
  initial: { fontFamily: fonts.medium, color: colors.gold2 },
});
