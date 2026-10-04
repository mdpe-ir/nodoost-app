import React from 'react';
import { ImageStyle, Platform, StyleProp } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';

/**
 * آیکن‌های برندِ نودوست (PNGِ شفاف، ۳ رنگ).
 * gold → پس‌زمینه‌ی تیره · white → روی عکس · ink → پس‌زمینه‌ی روشن/طلایی
 *
 * چند نام در مجموعه‌ی PNGِ برند وجود ندارند (هدست، منوی همبرگری، شورونِ پایین).
 * به‌جای ساختنِ دارایی تازه، همان‌ها از Ionicons می‌آیند — هم سبکِ خطیِ یکسان
 * دارند و هم با همان API (نام/اندازه/رنگ) صدا زده می‌شوند، پس صفحه‌ها نمی‌فهمند
 * آیکن از کدام منبع آمده.
 */
export type IconName =
  | 'bell'
  | 'calendar'
  | 'check'
  | 'chevron-next'
  | 'chevron-prev'
  | 'backspace'
  | 'clock'
  | 'close'
  | 'diamond-fill'
  | 'edit'
  | 'filter'
  | 'happy'
  | 'headset'
  | 'keypad'
  | 'heart-fill'
  | 'lightning-fill'
  | 'lightning'
  | 'lock'
  | 'log-out'
  | 'map'
  | 'menu'
  | 'mic'
  | 'minus'
  | 'moon'
  | 'more'
  | 'chevron-down'
  | 'next-arrows'
  | 'paperclip'
  | 'phone'
  | 'reply'
  | 'plus'
  | 'trash'
  | 'rewind'
  | 'send-fill'
  | 'shield-check'
  | 'shield'
  | 'fingerprint'
  | 'search'
  | 'copy'
  | 'info'
  | 'pin'
  | 'bell-off'
  | 'star'
  | 'sun'
  | 'tab-chat'
  | 'tab-discover'
  | 'tab-likes'
  | 'tab-profile';

export type IconTint = 'gold' | 'white' | 'ink' | 'ink2' | 'muted' | 'onGold';

/** نام‌هایی که دارایی PNG ندارند و از Ionicons می‌آیند. */
const VECTOR = {
  calendar: 'calendar-outline',
  headset: 'headset-outline',
  happy: 'happy-outline',
  keypad: 'keypad-outline',
  menu: 'menu-outline',
  mic: 'mic',
  minus: 'remove',
  paperclip: 'attach-outline',
  trash: 'trash-outline',
  // کاغذهوایِ پر — روی گرادیانِ طلایی با tint=ink خواناتر از PNGِ برند است.
  'send-fill': 'paper-plane',
  'chevron-down': 'chevron-down',
  // پیکانِ پاسخ هم در پکِ برند نیست؛ مثلِ بقیه‌ی این فهرست از Ionicons می‌آید.
  reply: 'arrow-undo-outline',
  // خروج از اکانت — در پکِ PNGِ برند نیست و Ionicons هم‌سبکِ بقیه‌ی این فهرست است.
  'log-out': 'log-out-outline',
  // پاککنِ کیپدِ قفل — همان دلیلِ بالا.
  backspace: 'backspace-outline',
  // میانبرِ بیومتریکِ قفل — در پکِ PNGِ برند نیست.
  fingerprint: 'finger-print-outline',
  // آیکن‌های کنترلِ گفتگو (اطلاعاتِ مخاطب، منوی پیام، سنجاق، اعلانِ خاموش) در
  // پکِ PNGِ برند نیستند و مثلِ بقیه‌ی همین فهرست از Ionicons می‌آیند.
  search: 'search-outline',
  copy: 'copy-outline',
  info: 'information-circle-outline',
  pin: 'pin-outline',
  'bell-off': 'notifications-off-outline',
} as const satisfies Partial<Record<IconName, React.ComponentProps<typeof Ionicons>['name']>>;

type PngName = Exclude<IconName, keyof typeof VECTOR>;

/** رنگِ متناظرِ هر ته‌رنگ — عددها از خودِ فایل‌های PNGِ برند نمونه‌برداری شده‌اند. */
const TINT_COLOR: Record<IconTint, string> = {
  gold: '#DAB877',
  white: '#FFFFFF',
  ink: '#241B15',
  ink2: '#B2A8B0',
  muted: '#8A8194',
  /** آیکن روی گرادیانِ طلایی — قهوه‌ایِ گرم، نه سیاهِ خالص و نه سفید. */
  onGold: '#7A5E3A',
};

// نگاشتِ ایستا — require باید رشته‌ی ثابت باشد تا Metro آن را بسته‌بندی کند
/** پکِ PNGِ برند فقط سه تهرنگ دارد؛ بقیه‌ی تهرنگ‌ها به نزدیک‌ترین پک نگاشته می‌شوند. */
type PngTint = 'gold' | 'white' | 'ink';

const SOURCES: Record<PngTint, Record<PngName, number>> = {
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
    map: require('../../../assets/icons/gold/map.png'),
    moon: require('../../../assets/icons/gold/moon.png'),
    more: require('../../../assets/icons/gold/more.png'),
    'next-arrows': require('../../../assets/icons/gold/next-arrows.png'),
    phone: require('../../../assets/icons/gold/phone.png'),
    plus: require('../../../assets/icons/gold/plus.png'),
    rewind: require('../../../assets/icons/gold/rewind.png'),
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
    map: require('../../../assets/icons/white/map.png'),
    moon: require('../../../assets/icons/white/moon.png'),
    more: require('../../../assets/icons/white/more.png'),
    'next-arrows': require('../../../assets/icons/white/next-arrows.png'),
    phone: require('../../../assets/icons/white/phone.png'),
    plus: require('../../../assets/icons/white/plus.png'),
    rewind: require('../../../assets/icons/white/rewind.png'),
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
    map: require('../../../assets/icons/ink/map.png'),
    moon: require('../../../assets/icons/ink/moon.png'),
    more: require('../../../assets/icons/ink/more.png'),
    'next-arrows': require('../../../assets/icons/ink/next-arrows.png'),
    phone: require('../../../assets/icons/ink/phone.png'),
    plus: require('../../../assets/icons/ink/plus.png'),
    rewind: require('../../../assets/icons/ink/rewind.png'),
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
/**
 * نگاشتِ هر تهرنگ به نزدیک‌ترین پکِ PNG.
 *
 * تلاشِ قبلی مستقیم روی `SOURCES[tint]` می‌انداخت؛ برای `ink2`/`onGold` کلیدِ
 * تهی برمی‌گشت و آیکنِ PNG (مثلِ `check` روی گرادیانِ طلایی) می‌افتاد. پکِ
 * خاکستریِ روشن و پکِ مخصوصِ «روی طلایی» در برند وجود ندارد، پس:
 *   • ink2  → white (روشن‌ترین پک، نزدیک‌ترین به خاکستریِ روشن)
 *   • onGold → ink  (قهوه‌ایِ تیره، همراستا با TINT_COLOR.onGold)
 */
const PNG_TINT: Record<IconTint, PngTint> = {
  gold: 'gold',
  white: 'white',
  ink: 'ink',
  ink2: 'white',
  muted: 'white',
  onGold: 'ink',
};

interface Props {
  name: IconName;
  size?: number;
  tint?: IconTint;
  style?: StyleProp<ImageStyle>;
}

export function Icon({ name, size = 24, tint = 'gold', style }: Props) {
  if (name in VECTOR) {
    return (
      <Ionicons
        name={VECTOR[name as keyof typeof VECTOR]}
        size={size}
        color={TINT_COLOR[tint]}
        style={[
          {
            width: size,
            height: size,
            textAlign: 'center',
            // بدونِ این، روی اندروید گلیفِ فونت با paddingِ اضافه پایین می‌افتد
            // و داخلِ ظرف‌های absolute/وسط‌چین با PNGهای برند هم‌تراز نمی‌شود.
            ...(Platform.OS === 'android'
              ? { includeFontPadding: false, textAlignVertical: 'center' as const }
              : { lineHeight: size }),
          },
          style,
        ]}
      />
    );
  }
  return (
    <Image
      source={SOURCES[PNG_TINT[tint]][name as PngName]}
      style={[{ width: size, height: size }, style]}
      contentFit="contain"
    />
  );
}
