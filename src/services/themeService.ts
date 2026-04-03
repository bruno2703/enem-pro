import {createMMKV} from 'react-native-mmkv';
import {Appearance} from 'react-native';

const storage = createMMKV({id: 'enem-pro'});
const THEME_KEY = 'app_theme';

export type ThemeMode = 'claro' | 'escuro' | 'sistema';

export function getThemeMode(): ThemeMode {
  return (storage.getString(THEME_KEY) as ThemeMode) ?? 'claro';
}

export function setThemeMode(mode: ThemeMode) {
  storage.set(THEME_KEY, mode);
}

export function isDarkMode(mode: ThemeMode): boolean {
  if (mode === 'escuro') return true;
  if (mode === 'claro') return false;
  return Appearance.getColorScheme() === 'dark';
}
