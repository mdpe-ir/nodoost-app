import type { ViewStyle } from 'react-native';

/** گرادیان‌های برند — برای دکمه‌ها، اسکریم و نشان‌ها. */
export const gradients = {
  gold: ['#F4E1B0', '#DAB877', '#C49E55'] as const,
  cardScrim: ['rgba(11,9,16,0)', 'rgba(11,9,16,0.5)', 'rgba(8,6,12,0.96)'] as const,
} as const;

/** سایه‌های یک‌دستِ ارتفاع. */
export const shadow: Record<'soft' | 'card' | 'gold', ViewStyle> = {
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 9,
    elevation: 4,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 22,
    elevation: 12,
  },
  gold: {
    shadowColor: '#DAB877',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 9,
  },
};
