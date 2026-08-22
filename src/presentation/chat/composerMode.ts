/** حالتِ دکمه‌ی کنارِ ورودی: میکروفون وقتی پیش‌نویس خالی است، ارسال وقتی متن دارد. */
export type ComposerAction = 'mic' | 'send';

export const composerAction = (draft: string, editing: boolean): ComposerAction =>
  editing || draft.trim() ? 'send' : 'mic';
