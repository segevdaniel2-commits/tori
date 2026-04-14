export const Colors = {
  // Brand
  orange: '#f97316',
  coral: '#f43f5e',
  cyan: '#06b6d4',

  // Dark theme
  dark: {
    bg: '#08080F',
    surface: '#111118',
    card: '#16161F',
    border: 'rgba(255,255,255,0.08)',
    text: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.55)',
    textMuted: 'rgba(255,255,255,0.30)',
  },

  // Light theme
  light: {
    bg: '#F8F8FC',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    border: 'rgba(0,0,0,0.07)',
    text: '#0D0D1A',
    textSecondary: 'rgba(0,0,0,0.50)',
    textMuted: 'rgba(0,0,0,0.30)',
  },

  // Status
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#06b6d4',

  // Appointment status
  confirmed: '#22c55e',
  pending: '#f59e0b',
  cancelled: '#ef4444',
  completed: 'rgba(255,255,255,0.3)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  full: 999,
};

export const Font = {
  light: 'Heebo_300Light',
  regular: 'Heebo_400Regular',
  medium: 'Heebo_500Medium',
  semiBold: 'Heebo_600SemiBold',
  bold: 'Heebo_700Bold',
  extraBold: 'Heebo_800ExtraBold',
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
  orange: {
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
};
