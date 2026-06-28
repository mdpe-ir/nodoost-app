/** نتیجه‌ی تأییدِ کدِ ورود. */
export interface AuthResult {
  accessToken: string;
  refreshToken?: string;
  profileComplete: boolean;
}
