import React, { useState } from 'react';
import { Image, StyleSheet, Text, View, type ImageStyle, type StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, fonts, gradients } from '@/core/theme';

const LOGO = require('../../../assets/logo/adaptive-icon-foreground.png');

export type ShareCardFormat = 'story' | 'feed' | 'x';
export type ShareCardLook = 'photo' | 'code' | 'portrait';

export const CARD_SIZES: Record<ShareCardFormat, { width: number; height: number }> = {
  story: { width: 1080, height: 1920 },
  feed: { width: 1080, height: 1080 },
  x: { width: 1200, height: 675 },
};

export interface ShareCardViewProps {
  width: number;
  height: number;
  look: ShareCardLook;
  name: string;
  code: string;
  photoUrl?: string;
  /** وقتی عکس (یا فالبکِ مونوگرام) برای ثبتِ PNG آماده است. */
  onReady?: () => void;
}

/**
 * کارتِ برندشده برای خروجیِ PNG — ابعاد واقعی (استوری ۱۰۸۰×۱۹۲۰ و …).
 * مقیاس از ضلعِ کوچک‌تر می‌آید تا فرمتِ افقیِ ایکس متن را نشکند.
 */
export function ShareCardView({
  width,
  height,
  look,
  name,
  code,
  photoUrl,
  onReady,
}: ShareCardViewProps) {
  const s = Math.min(width, height) / 1080;
  const displayName = name.trim() || 'دوستِ نودوست';
  const monogram = displayName.charAt(0) || 'ن';

  if (look === 'photo') {
    return (
      <PhotoHero
        width={width}
        height={height}
        s={s}
        name={displayName}
        code={code}
        monogram={monogram}
        photoUrl={photoUrl}
        onReady={onReady}
      />
    );
  }
  if (look === 'code') {
    return (
      <CodeHero
        width={width}
        height={height}
        s={s}
        name={displayName}
        code={code}
      />
    );
  }
  return (
    <PortraitChip
      width={width}
      height={height}
      s={s}
      code={code}
      monogram={monogram}
      photoUrl={photoUrl}
      onReady={onReady}
    />
  );
}

function PhotoHero({
  width,
  height,
  s,
  name,
  code,
  monogram,
  photoUrl,
  onReady,
}: {
  width: number;
  height: number;
  s: number;
  name: string;
  code: string;
  monogram: string;
  photoUrl?: string;
  onReady?: () => void;
}) {
  return (
    <View collapsable={false} style={[styles.root, { width, height }]}>
      <CardPhoto
        uri={photoUrl}
        style={StyleSheet.absoluteFill}
        onReady={onReady}
        fallback={
          <LinearGradient colors={[colors.surface2, colors.bg]} style={StyleSheet.absoluteFill}>
            <View style={styles.monoCenter}>
              <Monogram letter={monogram} size={width * 0.34} />
            </View>
          </LinearGradient>
        }
      />
      <LinearGradient colors={gradients.cardScrim} style={StyleSheet.absoluteFill} />
      <View style={[styles.photoPad, { padding: 72 * s }]}>
        <Image source={LOGO} style={{ width: 88 * s, height: 88 * s }} resizeMode="contain" />
        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.photoName, { fontSize: 44 * s, lineHeight: 60 * s }]}>{name}</Text>
          <Text
            style={[
              styles.photoCode,
              { fontSize: 96 * s, lineHeight: 120 * s, letterSpacing: 14 * s, marginTop: 16 * s },
            ]}
          >
            {code}
          </Text>
        </View>
      </View>
    </View>
  );
}

function CodeHero({
  width,
  height,
  s,
  name,
  code,
}: {
  width: number;
  height: number;
  s: number;
  name: string;
  code: string;
}) {
  return (
    <View
      collapsable={false}
      style={[styles.root, styles.codeRoot, { width, height, padding: 56 * s }]}
    >
      <View
        style={[
          styles.codeFrame,
          { borderWidth: 4 * s, borderRadius: 28 * s, padding: 48 * s },
        ]}
      >
        <Image
          source={LOGO}
          style={{ width: 96 * s, height: 96 * s }}
          resizeMode="contain"
        />
        <Text style={[styles.codeName, { fontSize: 40 * s, lineHeight: 56 * s, marginTop: 28 * s }]}>
          {name}
        </Text>
        <Text
          style={[
            styles.codeHero,
            { fontSize: 108 * s, lineHeight: 136 * s, letterSpacing: 16 * s, marginTop: 20 * s },
          ]}
        >
          {code}
        </Text>
      </View>
    </View>
  );
}

function PortraitChip({
  width,
  height,
  s,
  code,
  monogram,
  photoUrl,
  onReady,
}: {
  width: number;
  height: number;
  s: number;
  code: string;
  monogram: string;
  photoUrl?: string;
  onReady?: () => void;
}) {
  const landscape = width > height * 1.15;
  const avatar = Math.min(width, height) * (landscape ? 0.42 : 0.24);

  return (
    <View collapsable={false} style={[styles.root, { width, height }]}>
      <LinearGradient colors={[colors.surface2, colors.bg]} style={StyleSheet.absoluteFill} />
      <View
        style={[
          styles.chipInner,
          { padding: 56 * s },
          landscape && styles.chipLandscape,
        ]}
      >
        <CardPhoto
          uri={photoUrl}
          style={{
            width: avatar,
            height: avatar,
            borderRadius: avatar / 2,
            borderWidth: 5 * s,
            borderColor: colors.gold,
          }}
          onReady={onReady}
          fallback={<Monogram letter={monogram} size={avatar} />}
        />
        <View style={[styles.chipCopy, landscape && styles.chipCopyLand]}>
          <Image
            source={LOGO}
            style={{ width: 64 * s, height: 64 * s }}
            resizeMode="contain"
          />
          <Text
            style={[
              styles.chipLine,
              { fontSize: 32 * s, lineHeight: 46 * s, marginTop: 16 * s },
            ]}
          >
            با کدِ دعوتِ من بیا نودوست
          </Text>
          <Text
            style={[
              styles.chipCode,
              { fontSize: 72 * s, lineHeight: 92 * s, letterSpacing: 10 * s, marginTop: 12 * s },
            ]}
          >
            {code}
          </Text>
        </View>
      </View>
    </View>
  );
}

function Monogram({ letter, size }: { letter: string; size: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.gold,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontFamily: fonts.bold,
          fontSize: size * 0.42,
          color: colors.onGold,
          lineHeight: size * 0.5,
        }}
      >
        {letter}
      </Text>
    </View>
  );
}

/**
 * عکس را فقط بعد از onLoad نشان می‌دهیم؛ خطا = فالبکِ مونوگرام، نه تصویرِ شکسته.
 * تعویضِ uri با key کامپوننت را نو می‌کند تا failed نماند.
 */
function CardPhoto({
  uri,
  style,
  fallback,
  onReady,
}: {
  uri?: string;
  style: StyleProp<ImageStyle>;
  fallback: React.ReactNode;
  onReady?: () => void;
}) {
  if (!uri) return <>{fallback}</>;
  return (
    <RemotePhoto
      key={uri}
      uri={uri}
      style={style}
      fallback={fallback}
      onReady={onReady}
    />
  );
}

function RemotePhoto({
  uri,
  style,
  fallback,
  onReady,
}: {
  uri: string;
  style: StyleProp<ImageStyle>;
  fallback: React.ReactNode;
  onReady?: () => void;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return <>{fallback}</>;
  return (
    <Image
      source={{ uri }}
      style={style}
      resizeMode="cover"
      onLoad={onReady}
      onError={() => {
        setFailed(true);
        onReady?.();
      }}
    />
  );
}

const styles = StyleSheet.create({
  root: { overflow: 'hidden', backgroundColor: colors.bg },
  monoCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  photoPad: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  photoName: {
    fontFamily: fonts.bold,
    color: colors.onPhoto,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  photoCode: {
    fontFamily: fonts.bold,
    color: colors.gold2,
    textAlign: 'center',
  },
  codeRoot: {
    backgroundColor: colors.bg,
    justifyContent: 'center',
  },
  codeFrame: {
    flex: 1,
    borderColor: colors.gold,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeName: {
    fontFamily: fonts.bold,
    color: colors.ink,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  codeHero: {
    fontFamily: fonts.bold,
    color: colors.gold2,
    textAlign: 'center',
  },
  chipInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipLandscape: {
    flexDirection: 'row-reverse',
    gap: 48,
  },
  chipCopy: { alignItems: 'center', marginTop: 8 },
  chipCopyLand: { flex: 1, alignItems: 'center', marginTop: 0 },
  chipLine: {
    fontFamily: fonts.medium,
    color: colors.ink2,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  chipCode: {
    fontFamily: fonts.bold,
    color: colors.gold2,
    textAlign: 'center',
  },
});
