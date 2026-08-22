/** یک گفتگو در فهرستِ چت‌ها. */
export interface Conversation {
  matchId: number;
  otherId: number;
  otherName?: string;
  otherPhotoUrl?: string;
  otherTier?: number;
  lastBody?: string;
  lastAt?: string;
  unread?: number;
  source?: 'swipe' | 'random' | 'direct' | 'avatar' | 'support';
  /** شناسه‌ی شروع‌کننده‌ی گفتگو؛ null یعنی هنوز پیامی رد و بدل نشده. */
  initiatedBy?: number | null;
  /** حسابِ رسمیِ پشتیبانی: بالای فهرست و با نشانِ تأیید. */
  isSupport?: boolean;
  /** نشانِ چهره‌نما (تأییدشده). */
  verified?: boolean;
}

/** پیش‌نمایشِ پیامی که یک پیام پاسخِ آن است. */
export interface MessageReply {
  id: number;
  senderId: number;
  /** خالی وقتی مقصد حذف شده. */
  body: string;
  deleted: boolean;
}

/** نوعِ پیام در گفتگو. */
export type MessageKind = 'text' | 'photo' | 'voice';

export interface MessageMediaMeta {
  durationMs?: number;
  peaks?: number[];
  width?: number;
  height?: number;
  mime?: string;
  bytes?: number;
}

/** یک پیام در گفتگو. */
export interface Message {
  id?: number;
  matchId: number;
  senderId: number;
  kind?: MessageKind;
  body: string;
  mediaMeta?: MessageMediaMeta;
  /** uriِ محلی برای حبابِ خوش‌بینانه قبل از آپلود. */
  localUri?: string;
  pending?: boolean;
  failed?: boolean;
  createdAt?: string;
  /** زمانِ خوانده‌شدن — سرور فقط روی پیام‌های خودم می‌فرستد (هر سطحی). */
  readAt?: string;
  /** زمانِ آخرین ویرایش؛ تهی یعنی ویرایش نشده. */
  editedAt?: string;
  replyTo?: MessageReply;
  /**
   * سنگِ قبر: پیام «برای همه» حذف شده. سرور ردیف را از پاسخ برنمی‌دارد چون
   * ادغامِ پیام‌ها روی یک Map است و هرگز چیزی از آن حذف نمی‌شود — بدونِ این
   * پرچم، متنِ قدیمی تا ری‌لودِ کامل روی صفحه می‌ماند.
   */
  deleted?: boolean;
  deletedByAdmin?: boolean;
}

/** وضعیتِ لحظه‌ایِ طرفِ مقابل در یک گفتگو. */
export interface Presence {
  online: boolean;
  /** دقیقه‌های گذشته از آخرین فعالیت؛ اگر پنهان شده باشد تعریف‌نشده است. */
  lastActiveMin?: number;
  typing: boolean;
  /**
   * طرفِ مقابل (طلایی+) حضورش را خاموش کرده. با «آفلاین» یکی نیست و اپ باید
   * چیزی نشان ندهد، نه اینکه بگوید آفلاین است.
   */
  hidden: boolean;
}
