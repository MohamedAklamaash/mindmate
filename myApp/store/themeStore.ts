import { create } from 'zustand';

export type Theme = 'system' | 'light' | 'dark' | 'forest' | 'retro' | 'ocean' | 'blossom';

interface ThemePalette {
  primary: string;
  primaryHover: string;
  primaryText: string;
  secondary: string;
  secondaryHover: string;
  secondaryText: string;
  accent: string;
  accentHover: string;
  accentText: string;
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceHover: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderHover: string;
  success: string;
  warning: string;
  error: string;
  gradient: string;
}

interface ThemeStore {
  selectedTheme: Theme;
  setSelectedTheme: (theme: Theme) => void;
  getThemePalette: (isDarkMode?: boolean) => ThemePalette;
}

const getThemePalette = (theme: Theme, isDarkMode: boolean = false): ThemePalette => {
  switch (theme) {
    case 'forest':
      return isDarkMode ? {
        primary: 'bg-emerald-600',
        primaryHover: 'hover:bg-emerald-700',
        primaryText: 'text-white',
        secondary: 'bg-green-700',
        secondaryHover: 'hover:bg-green-800',
        secondaryText: 'text-white',
        accent: 'bg-lime-500',
        accentHover: 'hover:bg-lime-600',
        accentText: 'text-gray-900',
        background: 'bg-gray-900',
        backgroundSecondary: 'bg-gray-800',
        surface: 'bg-gray-800',
        surfaceHover: 'hover:bg-gray-700',
        text: 'text-emerald-100',
        textSecondary: 'text-emerald-200',
        textMuted: 'text-emerald-300',
        border: 'border-emerald-700',
        borderHover: 'hover:border-emerald-600',
        success: 'text-green-400',
        warning: 'text-yellow-400',
        error: 'text-red-400',
        gradient: 'bg-gradient-to-br from-emerald-900 to-green-900'
      } : {
        primary: 'bg-emerald-600',
        primaryHover: 'hover:bg-emerald-700',
        primaryText: 'text-white',
        secondary: 'bg-green-500',
        secondaryHover: 'hover:bg-green-600',
        secondaryText: 'text-white',
        accent: 'bg-lime-400',
        accentHover: 'hover:bg-lime-500',
        accentText: 'text-gray-900',
        background: 'bg-gradient-to-br from-green-50 to-emerald-50',
        backgroundSecondary: 'bg-green-100',
        surface: 'bg-white/90',
        surfaceHover: 'hover:bg-white',
        text: 'text-green-900',
        textSecondary: 'text-green-700',
        textMuted: 'text-green-600',
        border: 'border-green-200',
        borderHover: 'hover:border-green-300',
        success: 'text-green-600',
        warning: 'text-yellow-600',
        error: 'text-red-600',
        gradient: 'bg-gradient-to-br from-green-100 to-emerald-100'
      };

    case 'ocean':
      return isDarkMode ? {
        primary: 'bg-cyan-600',
        primaryHover: 'hover:bg-cyan-700',
        primaryText: 'text-white',
        secondary: 'bg-blue-600',
        secondaryHover: 'hover:bg-blue-700',
        secondaryText: 'text-white',
        accent: 'bg-teal-400',
        accentHover: 'hover:bg-teal-500',
        accentText: 'text-gray-900',
        background: 'bg-gray-900',
        backgroundSecondary: 'bg-gray-800',
        surface: 'bg-gray-800',
        surfaceHover: 'hover:bg-gray-700',
        text: 'text-cyan-100',
        textSecondary: 'text-cyan-200',
        textMuted: 'text-cyan-300',
        border: 'border-cyan-700',
        borderHover: 'hover:border-cyan-600',
        success: 'text-teal-400',
        warning: 'text-amber-400',
        error: 'text-red-400',
        gradient: 'bg-gradient-to-br from-cyan-900 to-blue-900'
      } : {
        primary: 'bg-cyan-600',
        primaryHover: 'hover:bg-cyan-700',
        primaryText: 'text-white',
        secondary: 'bg-blue-500',
        secondaryHover: 'hover:bg-blue-600',
        secondaryText: 'text-white',
        accent: 'bg-teal-400',
        accentHover: 'hover:bg-teal-500',
        accentText: 'text-gray-900',
        background: 'bg-gradient-to-br from-cyan-50 to-blue-50',
        backgroundSecondary: 'bg-cyan-100',
        surface: 'bg-white/90',
        surfaceHover: 'hover:bg-white',
        text: 'text-cyan-900',
        textSecondary: 'text-cyan-700',
        textMuted: 'text-cyan-600',
        border: 'border-cyan-200',
        borderHover: 'hover:border-cyan-300',
        success: 'text-teal-600',
        warning: 'text-amber-600',
        error: 'text-red-600',
        gradient: 'bg-gradient-to-br from-cyan-100 to-blue-100'
      };

    case 'retro':
      return isDarkMode ? {
        primary: 'bg-orange-600',
        primaryHover: 'hover:bg-orange-700',
        primaryText: 'text-white',
        secondary: 'bg-amber-600',
        secondaryHover: 'hover:bg-amber-700',
        secondaryText: 'text-white',
        accent: 'bg-yellow-500',
        accentHover: 'hover:bg-yellow-600',
        accentText: 'text-gray-900',
        background: 'bg-gray-900',
        backgroundSecondary: 'bg-gray-800',
        surface: 'bg-gray-800',
        surfaceHover: 'hover:bg-gray-700',
        text: 'text-orange-100',
        textSecondary: 'text-orange-200',
        textMuted: 'text-orange-300',
        border: 'border-orange-700',
        borderHover: 'hover:border-orange-600',
        success: 'text-green-400',
        warning: 'text-yellow-400',
        error: 'text-red-400',
        gradient: 'bg-gradient-to-br from-orange-900 to-amber-900'
      } : {
        primary: 'bg-orange-600',
        primaryHover: 'hover:bg-orange-700',
        primaryText: 'text-white',
        secondary: 'bg-amber-500',
        secondaryHover: 'hover:bg-amber-600',
        secondaryText: 'text-white',
        accent: 'bg-yellow-400',
        accentHover: 'hover:bg-yellow-500',
        accentText: 'text-gray-900',
        background: 'bg-gradient-to-br from-orange-50 to-yellow-50',
        backgroundSecondary: 'bg-orange-100',
        surface: 'bg-white/90',
        surfaceHover: 'hover:bg-white',
        text: 'text-orange-900',
        textSecondary: 'text-orange-700',
        textMuted: 'text-orange-600',
        border: 'border-orange-200',
        borderHover: 'hover:border-orange-300',
        success: 'text-green-600',
        warning: 'text-yellow-600',
        error: 'text-red-600',
        gradient: 'bg-gradient-to-br from-orange-100 to-yellow-100'
      };

    case 'blossom':
      return isDarkMode ? {
        primary: 'bg-pink-600',
        primaryHover: 'hover:bg-pink-700',
        primaryText: 'text-white',
        secondary: 'bg-rose-600',
        secondaryHover: 'hover:bg-rose-700',
        secondaryText: 'text-white',
        accent: 'bg-purple-500',
        accentHover: 'hover:bg-purple-600',
        accentText: 'text-white',
        background: 'bg-gray-900',
        backgroundSecondary: 'bg-gray-800',
        surface: 'bg-gray-800',
        surfaceHover: 'hover:bg-gray-700',
        text: 'text-pink-100',
        textSecondary: 'text-pink-200',
        textMuted: 'text-pink-300',
        border: 'border-pink-700',
        borderHover: 'hover:border-pink-600',
        success: 'text-green-400',
        warning: 'text-yellow-400',
        error: 'text-red-400',
        gradient: 'bg-gradient-to-br from-pink-900 to-rose-900'
      } : {
        primary: 'bg-pink-600',
        primaryHover: 'hover:bg-pink-700',
        primaryText: 'text-white',
        secondary: 'bg-rose-500',
        secondaryHover: 'hover:bg-rose-600',
        secondaryText: 'text-white',
        accent: 'bg-purple-400',
        accentHover: 'hover:bg-purple-500',
        accentText: 'text-white',
        background: 'bg-gradient-to-br from-pink-50 to-rose-50',
        backgroundSecondary: 'bg-pink-100',
        surface: 'bg-white/90',
        surfaceHover: 'hover:bg-white',
        text: 'text-pink-900',
        textSecondary: 'text-pink-700',
        textMuted: 'text-pink-600',
        border: 'border-pink-200',
        borderHover: 'hover:border-pink-300',
        success: 'text-green-600',
        warning: 'text-yellow-600',
        error: 'text-red-600',
        gradient: 'bg-gradient-to-br from-pink-100 to-rose-100'
      };

    case 'dark':
      return {
        primary: 'bg-blue-600',
        primaryHover: 'hover:bg-blue-700',
        primaryText: 'text-white',
        secondary: 'bg-gray-700',
        secondaryHover: 'hover:bg-gray-600',
        secondaryText: 'text-white',
        accent: 'bg-purple-600',
        accentHover: 'hover:bg-purple-700',
        accentText: 'text-white',
        background: 'bg-gray-900',
        backgroundSecondary: 'bg-gray-800',
        surface: 'bg-gray-800',
        surfaceHover: 'hover:bg-gray-700',
        text: 'text-white',
        textSecondary: 'text-gray-200',
        textMuted: 'text-gray-400',
        border: 'border-gray-700',
        borderHover: 'hover:border-gray-600',
        success: 'text-green-400',
        warning: 'text-yellow-400',
        error: 'text-red-400',
        gradient: 'bg-gray-900'
      };

    case 'light':
    case 'system':
    default:
      return {
        primary: 'bg-blue-600',
        primaryHover: 'hover:bg-blue-700',
        primaryText: 'text-white',
        secondary: 'bg-gray-500',
        secondaryHover: 'hover:bg-gray-600',
        secondaryText: 'text-white',
        accent: 'bg-purple-600',
        accentHover: 'hover:bg-purple-700',
        accentText: 'text-white',
        background: 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50',
        backgroundSecondary: 'bg-gray-100',
        surface: 'bg-white/80',
        surfaceHover: 'hover:bg-white',
        text: 'text-gray-900',
        textSecondary: 'text-gray-700',
        textMuted: 'text-gray-600',
        border: 'border-gray-200',
        borderHover: 'hover:border-gray-300',
        success: 'text-green-600',
        warning: 'text-yellow-600',
        error: 'text-red-600',
        gradient: 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'
      };
  }
};

// Convert Tailwind classes to React Native colors
const tailwindToRN = {
  // Forest theme colors
  'bg-emerald-600': '#059669',
  'bg-green-500': '#10B981',
  'bg-green-700': '#047857',
  'bg-lime-400': '#A3E635',
  'bg-lime-500': '#84CC16',
  'text-emerald-100': '#D1FAE5',
  'text-emerald-200': '#A7F3D0',
  'text-emerald-300': '#6EE7B7',
  'text-green-900': '#14532D',
  'text-green-700': '#15803D',
  'text-green-600': '#16A34A',
  'bg-green-100': '#DCFCE7',
  'bg-green-50': '#F0FDF4',
  'bg-emerald-50': '#ECFDF5',
  'border-green-200': '#BBF7D0',
  'border-green-300': '#86EFAC',
  'border-emerald-700': '#047857',
  'border-emerald-600': '#059669',
  
  // Ocean theme colors
  'bg-cyan-600': '#0891B2',
  'bg-blue-500': '#3B82F6',
  'bg-blue-600': '#2563EB',
  'bg-teal-400': '#2DD4BF',
  'text-cyan-100': '#CFFAFE',
  'text-cyan-200': '#A5F3FC',
  'text-cyan-300': '#67E8F9',
  'text-cyan-900': '#164E63',
  'text-cyan-700': '#0E7490',
  'text-cyan-600': '#0891B2',
  'text-teal-600': '#0D9488',
  'text-amber-600': '#D97706',
  'bg-cyan-100': '#CFFAFE',
  'bg-cyan-50': '#ECFEFF',
  'bg-blue-50': '#EFF6FF',
  'border-cyan-200': '#A5F3FC',
  'border-cyan-300': '#67E8F9',
  'border-cyan-700': '#0E7490',
  'border-cyan-600': '#0891B2',
  
  // Retro theme colors
  'bg-orange-600': '#EA580C',
  'bg-amber-500': '#F59E0B',
  'bg-amber-600': '#D97706',
  'bg-yellow-400': '#FACC15',
  'bg-yellow-500': '#EAB308',
  'text-orange-100': '#FED7AA',
  'text-orange-200': '#FED7AA',
  'text-orange-300': '#FDBA74',
  'text-orange-900': '#7C2D12',
  'text-orange-700': '#C2410C',
  'text-orange-600': '#EA580C',
  'text-yellow-600': '#CA8A04',
  'bg-orange-100': '#FED7AA',
  'bg-orange-50': '#FFF7ED',
  'bg-yellow-50': '#FEFCE8',
  'border-orange-200': '#FED7AA',
  'border-orange-300': '#FDBA74',
  'border-orange-700': '#C2410C',
  'border-orange-600': '#EA580C',
  
  // Blossom theme colors
  'bg-pink-600': '#DB2777',
  'bg-rose-500': '#F43F5E',
  'bg-rose-600': '#E11D48',
  'bg-purple-400': '#C084FC',
  'bg-purple-500': '#A855F7',
  'bg-purple-600': '#9333EA',
  'text-pink-100': '#FCE7F3',
  'text-pink-200': '#FBCFE8',
  'text-pink-300': '#F9A8D4',
  'text-pink-900': '#831843',
  'text-pink-700': '#BE185D',
  'text-pink-600': '#DB2777',
  'bg-pink-100': '#FCE7F3',
  'bg-pink-50': '#FDF2F8',
  'bg-rose-50': '#FFF1F2',
  'border-pink-200': '#FBCFE8',
  'border-pink-300': '#F9A8D4',
  'border-pink-700': '#BE185D',
  'border-pink-600': '#DB2777',
  
  // Dark theme colors
  'bg-gray-700': '#374151',
  'bg-gray-800': '#1F2937',
  'bg-gray-900': '#111827',
  'text-white': '#FFFFFF',
  'text-gray-200': '#E5E7EB',
  'text-gray-400': '#9CA3AF',
  'border-gray-700': '#374151',
  'border-gray-600': '#4B5563',
  
  // Light/System theme colors
  'bg-gray-500': '#6B7280',
  'bg-gray-600': '#4B5563',
  'text-gray-900': '#111827',
  'text-gray-700': '#374151',
  'text-gray-600': '#4B5563',
  'bg-white/90': 'rgba(255, 255, 255, 0.9)',
  'bg-white/80': 'rgba(255, 255, 255, 0.8)',
  'bg-white': '#FFFFFF',
  'bg-gray-100': '#F3F4F6',
  'bg-gray-50': '#F9FAFB',
  'bg-purple-50': '#FAF5FF',
  'border-gray-200': '#E5E7EB',
  'border-gray-300': '#D1D5DB',
  
  // Common colors
  'text-green-400': '#4ADE80',
  'text-yellow-400': '#FACC15',
  'text-red-400': '#F87171',
  'text-red-600': '#DC2626',
};

export const useThemeStore = create<ThemeStore>((set, get) => ({
  selectedTheme: 'system',
  setSelectedTheme: (theme: Theme) => set({ selectedTheme: theme }),
  getThemePalette: (isDarkMode: boolean = false) => {
    const { selectedTheme } = get();
    return getThemePalette(selectedTheme, isDarkMode);
  },
}));

// Helper function to convert theme palette to React Native colors
export const getThemeColors = (theme: Theme, isDarkMode: boolean = false) => {
  const palette = getThemePalette(theme, isDarkMode);
  
  const convertToRN = (tailwindClass: string): string => {
    return tailwindToRN[tailwindClass as keyof typeof tailwindToRN] || '#000000';
  };

  return {
    primary: convertToRN(palette.primary),
    primaryText: convertToRN(palette.primaryText),
    secondary: convertToRN(palette.secondary),
    secondaryText: convertToRN(palette.secondaryText),
    accent: convertToRN(palette.accent),
    accentText: convertToRN(palette.accentText),
    background: convertToRN(palette.background),
    backgroundSecondary: convertToRN(palette.backgroundSecondary),
    surface: convertToRN(palette.surface),
    text: convertToRN(palette.text),
    textSecondary: convertToRN(palette.textSecondary),
    textMuted: convertToRN(palette.textMuted),
    border: convertToRN(palette.border),
    success: convertToRN(palette.success),
    warning: convertToRN(palette.warning),
    error: convertToRN(palette.error),
  };
};
