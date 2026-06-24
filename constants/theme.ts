import { useStore } from '../store/useStore';

export const LightColors = {
  primary: '#E42278',
  primarySoft: '#ED7BAB',
  primaryMuted: '#F5D3DD',
  primaryPale: '#F9F9F9',
  dark: '#0D111A',
  surface: '#FFFFFF',
  border: '#F5D3DD',
  textPrimary: '#0D111A',
  textSecondary: '#6B7280',
  textOnPrimary: '#FFFFFF',
  textDisabled: '#C4C4C4',
  success: '#22A06B',
  warning: '#F59E0B',
  error: '#E53935',
  info: '#2196F3',
};

export const DarkColors = {
  primary: '#DFD0B8',
  primarySoft: '#948979',
  primaryMuted: '#161B2C',
  primaryPale: '#111625',
  dark: '#111625',
  surface: '#1C2237',
  border: '#161B2C',
  textPrimary: '#FDF1F5',
  textSecondary: '#FDF1F5',
  textOnPrimary: '#111625',
  textDisabled: '#555B66',
  success: '#22A06B',
  warning: '#F59E0B',
  error: '#E53935',
  info: '#2196F3',
};

// Static default fallback for backward compatibility
export const Colors = LightColors;

export const useColors = () => {
  try {
    const theme = useStore((state) => state.theme);
    return theme === 'dark' ? DarkColors : LightColors;
  } catch (e) {
    return LightColors;
  }
};

// Typography configuration using DM Sans
export const Typography = {
  h1: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 28,
    lineHeight: 42,
  },
  h2: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 22,
    lineHeight: 33,
  },
  h3: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 18,
    lineHeight: 27,
  },
  h4: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 16,
    lineHeight: 24,
  },
  body: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    lineHeight: 22.5,
  },
  small: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    lineHeight: 19.5,
  },
  tiny: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    lineHeight: 16.5,
  },
};

export const Shadows = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  button: {
    shadowColor: '#E42278',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 4,
  },
};
