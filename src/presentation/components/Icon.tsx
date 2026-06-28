import React from 'react';
import { ImageStyle, StyleProp } from 'react-native';
import { Image } from 'expo-image';

/**
 * آیکن‌های برندِ نودوست (PNGِ شفاف، ۳ رنگ).
 * gold → پس‌زمینه‌ی تیره · white → روی عکس · ink → پس‌زمینه‌ی روشن/طلایی
 */
export type IconName =
  | 'bell'
  | 'check'
  | 'chevron-next'
  | 'chevron-prev'
  | 'clock'
  | 'close'
  | 'diamond-fill'
  | 'edit'
  | 'filter'
  | 'heart-fill'
  | 'lightning-fill'
  | 'lightning'
  | 'lock'
  | 'moon'
  | 'more'
  | 'next-arrows'
  | 'phone'
  | 'plus'
  | 'rewind'
  | 'send-fill'
  | 'shield-check'
  | 'shield'
  | 'star'
  | 'sun'
  | 'tab-chat'
  | 'tab-discover'
  | 'tab-likes'
  | 'tab-profile';

export type IconTint = 'gold' | 'white' | 'ink';

// نگاشتِ ایستا — require باید رشته‌ی ثابت باشد تا Metro آن را بسته‌بندی کند
/* eslint-disable @typescript-eslint/no-require-imports */
const SOURCES: Record<IconTint, Record<IconName, number>> = {
  gold: {
    bell: require('../../../assets/icons/gold/bell.png'),
    check: require('../../../assets/icons/gold/check.png'),
    'chevron-next': require('../../../assets/icons/gold/chevron-next.png'),
    'chevron-prev': require('../../../assets/icons/gold/chevron-prev.png'),
    clock: require('../../../assets/icons/gold/clock.png'),
    close: require('../../../assets/icons/gold/close.png'),
    'diamond-fill': require('../../../assets/icons/gold/diamond-fill.png'),
    edit: require('../../../assets/icons/gold/edit.png'),
    filter: require('../../../assets/icons/gold/filter.png'),
    'heart-fill': require('../../../assets/icons/gold/heart-fill.png'),
    'lightning-fill': require('../../../assets/icons/gold/lightning-fill.png'),
    lightning: require('../../../assets/icons/gold/lightning.png'),
    lock: require('../../../assets/icons/gold/lock.png'),
    moon: require('../../../assets/icons/gold/moon.png'),
    more: require('../../../assets/icons/gold/more.png'),
    'next-arrows': require('../../../assets/icons/gold/next-arrows.png'),
    phone: require('../../../assets/icons/gold/phone.png'),
    plus: require('../../../assets/icons/gold/plus.png'),
    rewind: require('../../../assets/icons/gold/rewind.png'),
    'send-fill': require('../../../assets/icons/gold/send-fill.png'),
    'shield-check': require('../../../assets/icons/gold/shield-check.png'),
    shield: require('../../../assets/icons/gold/shield.png'),
    star: require('../../../assets/icons/gold/star.png'),
    sun: require('../../../assets/icons/gold/sun.png'),
    'tab-chat': require('../../../assets/icons/gold/tab-chat.png'),
    'tab-discover': require('../../../assets/icons/gold/tab-discover.png'),
    'tab-likes': require('../../../assets/icons/gold/tab-likes.png'),
    'tab-profile': require('../../../assets/icons/gold/tab-profile.png'),
  },
  white: {
    bell: require('../../../assets/icons/white/bell.png'),
    check: require('../../../assets/icons/white/check.png'),
    'chevron-next': require('../../../assets/icons/white/chevron-next.png'),
    'chevron-prev': require('../../../assets/icons/white/chevron-prev.png'),
    clock: require('../../../assets/icons/white/clock.png'),
    close: require('../../../assets/icons/white/close.png'),
    'diamond-fill': require('../../../assets/icons/white/diamond-fill.png'),
    edit: require('../../../assets/icons/white/edit.png'),
    filter: require('../../../assets/icons/white/filter.png'),
    'heart-fill': require('../../../assets/icons/white/heart-fill.png'),
    'lightning-fill': require('../../../assets/icons/white/lightning-fill.png'),
    lightning: require('../../../assets/icons/white/lightning.png'),
    lock: require('../../../assets/icons/white/lock.png'),
    moon: require('../../../assets/icons/white/moon.png'),
    more: require('../../../assets/icons/white/more.png'),
    'next-arrows': require('../../../assets/icons/white/next-arrows.png'),
    phone: require('../../../assets/icons/white/phone.png'),
    plus: require('../../../assets/icons/white/plus.png'),
    rewind: require('../../../assets/icons/white/rewind.png'),
    'send-fill': require('../../../assets/icons/white/send-fill.png'),
    'shield-check': require('../../../assets/icons/white/shield-check.png'),
    shield: require('../../../assets/icons/white/shield.png'),
    star: require('../../../assets/icons/white/star.png'),
    sun: require('../../../assets/icons/white/sun.png'),
    'tab-chat': require('../../../assets/icons/white/tab-chat.png'),
    'tab-discover': require('../../../assets/icons/white/tab-discover.png'),
    'tab-likes': require('../../../assets/icons/white/tab-likes.png'),
    'tab-profile': require('../../../assets/icons/white/tab-profile.png'),
  },
  ink: {
    bell: require('../../../assets/icons/ink/bell.png'),
    check: require('../../../assets/icons/ink/check.png'),
    'chevron-next': require('../../../assets/icons/ink/chevron-next.png'),
    'chevron-prev': require('../../../assets/icons/ink/chevron-prev.png'),
    clock: require('../../../assets/icons/ink/clock.png'),
    close: require('../../../assets/icons/ink/close.png'),
    'diamond-fill': require('../../../assets/icons/ink/diamond-fill.png'),
    edit: require('../../../assets/icons/ink/edit.png'),
    filter: require('../../../assets/icons/ink/filter.png'),
    'heart-fill': require('../../../assets/icons/ink/heart-fill.png'),
    'lightning-fill': require('../../../assets/icons/ink/lightning-fill.png'),
    lightning: require('../../../assets/icons/ink/lightning.png'),
    lock: require('../../../assets/icons/ink/lock.png'),
    moon: require('../../../assets/icons/ink/moon.png'),
    more: require('../../../assets/icons/ink/more.png'),
    'next-arrows': require('../../../assets/icons/ink/next-arrows.png'),
    phone: require('../../../assets/icons/ink/phone.png'),
    plus: require('../../../assets/icons/ink/plus.png'),
    rewind: require('../../../assets/icons/ink/rewind.png'),
    'send-fill': require('../../../assets/icons/ink/send-fill.png'),
    'shield-check': require('../../../assets/icons/ink/shield-check.png'),
    shield: require('../../../assets/icons/ink/shield.png'),
    star: require('../../../assets/icons/ink/star.png'),
    sun: require('../../../assets/icons/ink/sun.png'),
    'tab-chat': require('../../../assets/icons/ink/tab-chat.png'),
    'tab-discover': require('../../../assets/icons/ink/tab-discover.png'),
    'tab-likes': require('../../../assets/icons/ink/tab-likes.png'),
    'tab-profile': require('../../../assets/icons/ink/tab-profile.png'),
  },
};
/* eslint-enable @typescript-eslint/no-require-imports */

interface Props {
  name: IconName;
  size?: number;
  tint?: IconTint;
  style?: StyleProp<ImageStyle>;
}

export function Icon({ name, size = 24, tint = 'gold', style }: Props) {
  return (
    <Image
      source={SOURCES[tint][name]}
      style={[{ width: size, height: size }, style]}
      contentFit="contain"
    />
  );
}
