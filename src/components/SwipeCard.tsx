import React, { useRef } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  View,
  Dimensions,
  Image,
} from 'react-native';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import { faNum } from '@/lib/faNum';
import { TierBadge } from './TierBadge';
import type { Candidate } from '@/types';

const { width } = Dimensions.get('window');
const THRESHOLD = width * 0.26;

interface Props {
  candidate: Candidate;
  onSwipe: (dir: 'like' | 'pass') => void;
}

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

  const photo = candidate.photos?.[0];

  return (
    <Animated.View
      {...responder.panHandlers}
      style={[
        styles.card,
        { transform: [{ translateX: pos.x }, { translateY: pos.y }, { rotate }] },
      ]}
    >
      {photo ? (
        <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} resizeMode="cover" />
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
            {candidate.age ? '، ' + faNum(candidate.age) : ''}
          </Text>
          {candidate.tier ? <TierBadge tier={candidate.tier} /> : null}
        </View>
        {candidate.distance_m != null ? (
          <Text style={styles.meta}>{faNum(Math.round(candidate.distance_m / 1000))} کیلومتر دورتر</Text>
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
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 24,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
  },
  noPhoto: { backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  noPhotoText: { fontFamily: fonts.bold, fontSize: 80, color: colors.goldSoft },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
    backgroundColor: 'transparent',
  },
  stamp: {
    position: 'absolute',
    top: 28,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 2,
  },
  likeStamp: { right: 24, borderColor: colors.gold2, transform: [{ rotate: '-12deg' }] },
  passStamp: { left: 24, borderColor: colors.rose, transform: [{ rotate: '12deg' }] },
  stampText: { fontFamily: fonts.bold, fontSize: 22 },
  info: { position: 'absolute', left: 20, right: 20, bottom: 24 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  name: { fontFamily: fonts.bold, fontSize: 26, color: '#fff' },
  meta: { fontFamily: fonts.regular, fontSize: 13, color: 'rgba(255,255,255,0.85)', marginBottom: 6 },
  bio: { fontFamily: fonts.regular, fontSize: 14, color: 'rgba(255,255,255,0.9)', lineHeight: 22 },
});
