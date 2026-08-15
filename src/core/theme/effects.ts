import type { ViewStyle } from 'react-native';

/** گرادیان‌های برند — برای دکمه‌ها، اسکریم و نشان‌ها. */
export const gradients = {
  gold: ['#F4E1B0', '#DAB877', '#C49E55'] as const,
  cardScrim: ['rgba(11,9,16,0)', 'rgba(11,9,16,0.5)', 'rgba(8,6,12,0.96)'] as const,
  /**
   * سطحِ نوردیده. یک رنگِ تخت روی همه‌ی کارت‌ها باعث می‌شود همه‌شان مقوا به
   * نظر برسند. این گرادیانِ عمودیِ بسیار کم‌شیب طوری است که چشم آن را
   * «گرادیان» نمی‌بیند، فقط حس می‌کند نور از بالا می‌آید.
   */
  surface: ['#1B1622', '#141019'] as const,
  /** همان، یک پله بالاتر — برای برگه‌هایی که روی کارت می‌نشینند. */
  surfaceRaised: ['#251E2F', '#191320'] as const,
  /** هاله‌ی طلایی پشتِ لحظه‌های جشن. */
  goldHalo: ['rgba(218,184,119,0.28)', 'rgba(218,184,119,0)'] as const,
  /** اسکریمِ بالای کارت — تا نوارِ عکس و نشان‌ها روی عکسِ روشن هم خوانا بمانند. */
  topScrim: ['rgba(8,6,12,0.72)', 'rgba(8,6,12,0)'] as const,
} as const;

/**
 * سایه‌های یک‌دستِ ارتفاع.
 *
 * هر ارتفاع دو چیز را با هم عوض می‌کند: سایه‌ی زیرِ جسم، و اینکه چقدر از
 * پس‌زمینه جدا دیده می‌شود. برای همین `rim*` در کنارِ اینها استفاده می‌شود.
 */
export const shadow: Record<'soft' | 'card' | 'gold' | 'lifted', ViewStyle> = {
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
  /** کارتی که کاربر همین حالا در دست گرفته — بالاتر از بقیه‌ی دسته. */
  lifted: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.62,
    shadowRadius: 34,
    elevation: 20,
  },
  gold: {
    shadowColor: '#DAB877',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 9,
  },
};

/**
 * لبه‌ی نوردیده — روی هر سطحی که باید حجم داشته باشد.
 * `borderColor` تیره می‌ماند و فقط لبه‌ی بالا روشن است؛ همان کاری که نورِ
 * سقفی با یک جسمِ واقعی می‌کند.
 */
export const rimLight = (border: string, top: string): ViewStyle => ({
  borderWidth: 1,
  borderColor: border,
  borderTopColor: top,
});
