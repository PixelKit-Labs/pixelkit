/**
 * @file colors.ts
 * @description Material 3 Expressive color design system for PixelForge.
 * Includes true OLED pure black tokens (#0B0D11) for battery savings on Pixel LTPO displays,
 * paired with high-contrast dynamic accent tones and Google Tensor signature glow colors.
 */

export const Colors = {
  /**
   * OLED Dark Theme: Recommended default for Pixel devices.
   * Leverages self-emissive OLED pixels to minimize battery drain.
   */
  dark: {
    /** True deep OLED background */
    background: '#0B0D11',
    /** Elevated surface color */
    surface: '#161922',
    /** Secondary surface variant */
    surfaceVariant: '#202431',
    /** Card container fill */
    card: '#1B1F2A',
    /** Card subtle boundary stroke */
    cardBorder: '#2E3547',
    /** Pixel signature dynamic blue */
    primary: '#8AB4F8',
    /** Filled container contrast backing */
    primaryContainer: '#1A3B6E',
    /** Supporting secondary brand tone */
    secondary: '#A8C7FA',
    /** Subtle tertiary atmospheric tone */
    tertiary: '#C2E7FF',
    /** Vivid action accent */
    accent: '#4785FF',
    /** High-contrast primary text (passes WCAG AAA on dark) */
    text: '#E3E2E6',
    /** De-emphasized secondary text */
    textMuted: '#9398A8',
    /** Success green */
    success: '#81C995',
    /** Warning amber */
    warning: '#FDD663',
    /** Error red */
    error: '#F28B82',
    /** Google Tensor TPU neural status cyan glow */
    tensorGlow: '#00E5FF',
  },
  /**
   * Material 3 Light Theme: High-legibility outdoor mode.
   */
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

/**
 * Shape of the active theme color palette.
 */
export type ThemeColors = typeof Colors.dark;
