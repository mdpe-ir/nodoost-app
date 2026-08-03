import { colors } from '@/core/theme';
import type { IconName } from '@/presentation/components/Icon';
import type { InAppAccent, InAppMessage } from '@/domain/entities';

/**
 * رنگِ لبه/دکمه‌ی هر «حالِ» پیام. طلایی رنگِ برندِ اپ است و بقیه فقط برای
 * تفکیکِ معنایی‌اند (خبر، موفقیت، هشدار، خطر) — پس در همان پالتِ تیره می‌مانند.
 */
const ACCENTS: Record<InAppAccent, string> = {
  gold: colors.gold,
  info: '#7FA8E8',
  success: colors.ok,
  warn: '#E8B44F',
  danger: colors.rose,
};

export const accentColor = (a: InAppAccent): string => ACCENTS[a] ?? colors.gold;

/** رنگِ متنِ روی دکمه‌ی پُر — طلایی روشن است پس متنش تیره می‌شود. */
export const onAccentColor = (a: InAppAccent): string =>
  a === 'gold' ? colors.onGold : colors.ink;

const ICONS: readonly string[] = [
  'bell', 'check', 'chevron-next', 'chevron-prev', 'clock', 'close', 'diamond-fill',
  'edit', 'filter', 'heart-fill', 'lightning-fill', 'lightning', 'lock', 'map',
  'moon', 'more', 'next-arrows', 'phone', 'plus', 'rewind', 'send-fill',
  'shield-check', 'shield', 'star', 'sun', 'tab-chat', 'tab-discover',
  'tab-likes', 'tab-profile',
];

/**
 * آیکنِ پیام. کلیدِ ناشناخته (مثلاً پیامی که با ستِ آیکنِ نسخه‌ی جدیدتر ساخته
 * شده) به `bell` می‌افتد؛ بدونِ این، `require` نامعتبر اپ را می‌ترکاند.
 */
export function messageIcon(m: InAppMessage): IconName {
  return (ICONS.includes(m.icon ?? '') ? m.icon : 'bell') as IconName;
}
