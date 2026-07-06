import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { Animated, PanResponder, StyleSheet, Text, View, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { mediaUrl } from '@/core/http/mediaUrl';
import { faNum } from '@/core/utils/faNum';
import { colors, fonts, fontSizes, lineHeights, radius, shadow, spacing } from '@/core/theme';
import { TierBadge } from './TierBadge';
import { Scrim } from './Scrim';
import { Icon } from './Icon';
import type { Candidate } from '@/domain/entities';

const { width } = Dimensions.get('window');
const THRESHOLD = width * 0.26;

export interface SwipeCardHandle {
  swipe: (dir: 'like' | 'pass') => void;
}

interface Props {
  candidate: Candidate;
  onSwipe: (dir: 'like' | 'pass') => void;
}

/**
 * کارتِ سواایپ با Animated + PanResponderِ داخلیِ RN (بدونِ reanimated)
 * تا روی وب/PWA هم بی‌دردسر کار کند. دکمه‌های پسند/رد هم از طریقِ ref کارت را پرواز می‌دهند.
 * جهتِ ژست عمداً قراردادِ جهانیِ اپ‌های دوست‌یابی است: راست = پسند، چپ = رد.
 */
export const SwipeCard = forwardRef<SwipeCardHandle, Props>(function SwipeCard(
  { candidate, onSwipe },
  ref
) {
  const pos = useRef(new Animated.ValueXY()).current;

  const fling = (dir: 'like' | 'pass') => {
    Animated.timing(pos, {
      toValue: { x: dir === 'like' ? width * 1.4 : -width * 1.4, y: 0 },
      duration: 220,
      useNativeDriver: false,
    }).start(() => onSwipe(dir));
  };

  useImperativeHandle(ref, () => ({ swipe: fling }), []);

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
  const km = candidate.distanceM != null ? Math.max(1, Math.round(candidate.distanceM / 1000)) : null;

  return (
    <Animated.View
      {...responder.panHandlers}
      style={[
        styles.card,
        shadow.card,
        { transform: [{ translateX: pos.x }, { translateY: pos.y }, { rotate }] },
      ]}
    >
      {photo ? (
        <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} contentFit="cover" transition={180} cachePolicy="memory-disk" />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.noPhoto]}>
          <Text style={styles.noPhotoText}>{(candidate.name || '؟').charAt(0)}</Text>
        </View>
      )}
      <Scrim height="58%" />

      {/* تمبرِ پسند (راست) و رد (چپ) — هم‌جهت با حرکتِ فیزیکیِ انگشت */}
      <Animated.View style={[styles.stamp, styles.likeStamp, { opacity: likeOpacity }]}>
        <Text style={[styles.stampText, { color: colors.gold2 }]}>پسند</Text>
      </Animated.View>
      <Animated.View style={[styles.stamp, styles.passStamp, { opacity: passOpacity }]}>
        <Text style={[styles.stampText, { color: colors.rose }]}>رد</Text>
      </Animated.View>

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {candidate.name}
            {candidate.age ? `، ${faNum(candidate.age)}` : ''}
          </Text>
          {candidate.tier ? <TierBadge tier={candidate.tier} /> : null}
        </View>
        {km != null ? (
          <View style={styles.metaRow}>
            <Icon name="map" size={13} tint="white" style={styles.metaIcon} />
            <Text style={styles.meta}>{faNum(km)} کیلومتر دورتر</Text>
          </View>
        ) : null}
        {candidate.bio ? (
          <Text style={styles.bio} numberOfLines={2}>
            {candidate.bio}
          </Text>
        ) : null}
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  noPhoto: { backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  noPhotoText: { fontFamily: fonts.bold, fontSize: 72, color: colors.goldSoft },
  stamp: {
    position: 'absolute',
    top: 28,
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 2,
    backgroundColor: colors.backdrop,
  },
  likeStamp: { right: 22, borderColor: colors.gold2, transform: [{ rotate: '-12deg' }] },
  passStamp: { left: 22, borderColor: colors.rose, transform: [{ rotate: '12deg' }] },
  stampText: { fontFamily: fonts.bold, fontSize: fontSizes.xl },
  info: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.xl - 4 },
  nameRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm + 2 },
  name: {
    flexShrink: 1,
    fontFamily: fonts.bold,
    fontSize: 26,
    lineHeight: 38,
    color: colors.onPhoto,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  metaRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5, marginTop: 2 },
  metaIcon: { opacity: 0.85 },
  meta: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.onPhotoDim,
    textAlign: 'right',
  },
  bio: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm + 1,
    color: colors.onPhotoDim,
    marginTop: spacing.sm,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 22,
  },
});
