export type ThemeMode = 'light' | 'dark' | 'auto';
export type ThemeFontSize = 'small' | 'medium' | 'large';

export interface AccountProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  themeMode: string | null;
  themeAccent: string | null;
  themeFontFamily: string | null;
  themeFontSize: string | null;
}

export interface UpdateAccountProfileData {
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  themeMode?: ThemeMode | null;
  themeAccent?: string | null;
  themeFontFamily?: string | null;
  themeFontSize?: ThemeFontSize | null;
}
