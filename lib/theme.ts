export type Theme = 'light' | 'dark';

export const themeColors = {
  light: {
    background: '#FFFFFF',
    card: '#F7F7F7',
    text: '#1A1A1A',
    accent: '#007BFF',
  },
  dark: {
    background: '#121212',
    card: '#1F1F1F',
    text: '#F5F5F5',
    accent: '#00ADB5',
  },
} as const;

export type ThemeColors = typeof themeColors; 