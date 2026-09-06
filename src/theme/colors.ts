/**
 * @file colors.ts
 * @description PixelForge design system tokens.
 * Aesthetic: deep near-black indigo surfaces (true OLED black stays cheap on the LTPO panel), violet
 * glow accents, warm gold line-art details, glass cards with hairline borders, pill-shaped controls.
 * All primary tokens are 6-digit hex so callers can append a 2-digit alpha (e.g. `${primary}22`).
 */

export const Colors = {
  /** OLED dark theme (default on Pixel). */
  dark: {
    /** True deep OLED background (near-black indigo) */
    background: '#07060E',
    /** Elevated surface (header, nav, sheets) */
    surface: '#0E0B1C',
    /** Secondary surface (inputs, secondary buttons) */
    surfaceVariant: '#171330',
    /** Card fill (glass over the background) */
    card: '#120F24',
    /** Hairline card border */
    cardBorder: '#26203F',
    /** Violet primary (interactive, section labels) */
    primary: '#B794FF',
    /** Filled container behind primary content */
    primaryContainer: '#3B1D7A',
    /** Lighter violet for secondary emphasis */
    secondary: '#D8C4FF',
    /** Warm gold used for line-art and highlights */
    tertiary: '#F2CF8C',
    /** Saturated accent for gradients and active states */
    accent: '#8B5CF6',
    /** Primary text */
    text: '#F5F2FF',
    /** Muted text */
    textMuted: '#9C95B8',
    success: '#7CE3A6',
    warning: '#F7C66A',
    error: '#FF8FA3',
    /** Tensor / AI status cyan */
    tensorGlow: '#7DEBFF',
  },
  /** Light theme (kept for parity; the app ships dark-first). */
  light: {
    background: '#F7F5FF',
    surface: '#FFFFFF',
    surfaceVariant: '#EEEAFB',
    card: '#FFFFFF',
    cardBorder: '#E3DEF5',
    primary: '#6D3BEA',
    primaryContainer: '#E6DBFF',
    secondary: '#5B2FC7',
    tertiary: '#9A6B00',
    accent: '#7C3AED',
    text: '#17132A',
    textMuted: '#645D80',
    success: '#1E8E4E',
    warning: '#B26A00',
    error: '#C62842',
    tensorGlow: '#0891B2',
  },
};

/** Gradient stops (top→bottom or left→right as used). */
export const Gradients = {
  /** Primary action pill */
  primary: ['#7C3AED', '#C084FC'] as const,
  /** Danger action pill */
  danger: ['#E0426A', '#FF8FA3'] as const,
  /** Ambient glow at the top of screens */
  glow: ['rgba(124,58,237,0.55)', 'rgba(124,58,237,0.18)', 'rgba(7,6,14,0)'] as const,
  /** Hero card fill */
  hero: ['rgba(139,92,246,0.28)', 'rgba(139,92,246,0.06)'] as const,
  /** Subtle card sheen */
  card: ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.015)'] as const,
};

export const Radius = { sm: 12, md: 18, lg: 24, xl: 28, pill: 999 } as const;
export const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

/** Type scale (sizes in dp). Weights: 800 display, 700 titles/values, 600 labels, 400 body. */
export const Type = {
  display: { fontSize: 30, fontWeight: '800' as const, letterSpacing: -0.8 },
  title: { fontSize: 22, fontWeight: '800' as const, letterSpacing: -0.5 },
  value: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.8 },
  heading: { fontSize: 16, fontWeight: '700' as const, letterSpacing: -0.2 },
  body: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  label: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 1.2, textTransform: 'uppercase' as const },
  caption: { fontSize: 12, fontWeight: '500' as const, lineHeight: 17 },
  micro: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 0.6 },
};

/** Shape of the active theme color palette. */
export type ThemeColors = typeof Colors.dark;
