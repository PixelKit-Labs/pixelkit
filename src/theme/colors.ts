export const Colors = {
  dark: {
    background: '#0B0D11', // Deep OLED black
    surface: '#161922',    // Subtle elevation
    surfaceVariant: '#202431',
    card: '#1B1F2A',
    cardBorder: '#2E3547',
    primary: '#8AB4F8',    // Pixel signature dynamic blue
    primaryContainer: '#1A3B6E',
    secondary: '#A8C7FA',
    tertiary: '#C2E7FF',
    accent: '#4785FF',
    text: '#E3E2E6',
    textMuted: '#9398A8',
    success: '#81C995',
    warning: '#FDD663',
    error: '#F28B82',
    tensorGlow: '#00E5FF',
  },
  light: {
    background: '#F8F9FD',
    surface: '#FFFFFF',
    surfaceVariant: '#EEF0F8',
    card: '#FFFFFF',
    cardBorder: '#E2E4EC',
    primary: '#1A73E8',
    primaryContainer: '#D2E3FC',
    secondary: '#185ABC',
    tertiary: '#004A77',
    accent: '#1967D2',
    text: '#1F1F23',
    textMuted: '#5F6368',
    success: '#188038',
    warning: '#E37400',
    error: '#D93025',
    tensorGlow: '#0097A7',
  }
};

export type ThemeColors = typeof Colors.dark;
