import React, { useRef } from 'react';
import { Animated, PanResponder, StyleSheet, Text, View, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { mediaUrl } from '@/core/http/mediaUrl';
import { faNum } from '@/core/utils/faNum';
import { colors, fonts } from '@/core/theme';
import { TierBadge } from './TierBadge';
import type { Candidate } from '@/domain/entities';

const { width } = Dimensions.get('window');
const THRESHOLD = width * 0.26;

interface Props {
  candidate: Candidate;
  onSwipe: (dir: 'like' | 'pass') => void;
}

/**
 * کارتِ سواایپ با Animated + PanResponderِ داخلیِ RN (بدونِ reanimated)
 * تا روی وب/PWA هم بدونِ دردسر کار کند.
 */
export function SwipeCard({ candidate, onSwipe }: Props) {
  const pos = useRef(new Animated.ValueXY()).current;

  const responder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6,
      onPanResponderMove: Animated.event([null, { dx: pos.x, dy: pos.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, g) => {
        if (g.dx > THRESHOLD) {
          Animated.timing(pos, {
            toValue: { x: width * 1.4, y: g.dy },
            duration: 220,
            useNativeDriver: false,
          }).start(() => onSwipe('like'));
        } else if (g.dx < -THRESHOLD) {
          Animated.timing(pos, {
            toValue: { x: -width * 1.4, y: g.dy },
            duration: 220,
            useNativeDriver: false,
          }).start(() => onSwipe('pass'));
        } else {
          Animated.spring(pos, {
            toValue: { x: 0, y: 0 },
            friction: 6,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const rotate = pos.x.interpolate({
    inputRange: [-width, 0, width],
    outputRange: ['-9deg', '0deg', '9deg'],
  });
  const likeOpacity = pos.x.interpolate({
    inputRange: [0, THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const passOpacity = pos.x.interpolate({
    inputRange: [-THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const photo = mediaUrl(candidate.photoUrl);

  return (
    <Animated.View
      {...responder.panHandlers}
      style={[
        styles.card,
        { transform: [{ translateX: pos.x }, { translateY: pos.y }, { rotate }] },
      ]}
    >
      {photo ? (
        <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.noPhoto]}>
          <Text style={styles.noPhotoText}>{(candidate.name || '؟').charAt(0)}</Text>
        </View>
      )}
      <View style={styles.scrim} />

      <Animated.View style={[styles.stamp, styles.likeStamp, { opacity: likeOpacity }]}>
        <Text style={[styles.stampText, { color: colors.gold2 }]}>پسند</Text>
      </Animated.View>
      <Animated.View style={[styles.stamp, styles.passStamp, { opacity: passOpacity }]}>
        <Text style={[styles.stampText, { color: colors.rose }]}>رد</Text>
      </Animated.View>

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>
            {candidate.name}
            {candidate.age ? `، ${faNum(candidate.age)}` : ''}
          </Text>
          {candidate.tier ? <TierBadge tier={candidate.tier} /> : null}
        </View>
        {candidate.distanceM != null ? (
          <Text style={styles.meta}>
            {faNum(Math.max(1, Math.round(candidate.distanceM / 1000)))} کیلومتر دورتر
          </Text>
        ) : null}
        {candidate.bio ? (
          <Text style={styles.bio} numberOfLines={2}>
            {candidate.bio}
          </Text>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  noPhoto: { backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  noPhotoText: { fontFamily: fonts.bold, fontSize: 72, color: colors.goldSoft },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,10,12,0.35)',
  },
  stamp: {
    position: 'absolute',
    top: 28,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 2,
  },
  likeStamp: { left: 22, borderColor: colors.gold2, transform: [{ rotate: '-12deg' }] },
  passStamp: { right: 22, borderColor: colors.rose, transform: [{ rotate: '12deg' }] },
  stampText: { fontFamily: fonts.bold, fontSize: 22 },
  info: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 20 },
  nameRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  name: { fontFamily: fonts.bold, fontSize: 24, color: colors.ink, textAlign: 'right' },
  meta: { fontFamily: fonts.regular, fontSize: 13, color: colors.gold2, marginTop: 4, textAlign: 'right' },
  bio: { fontFamily: fonts.regular, fontSize: 14, color: colors.ink2, marginTop: 6, textAlign: 'right', lineHeight: 21 },
});
