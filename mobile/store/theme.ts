import { create } from 'zustand';
import { Colors } from '../constants/theme';

function getThemeByHour(): 'dark' | 'light' {
  const hour = new Date().getHours();
  return hour >= 7 && hour < 19 ? 'light' : 'dark';
}

interface ThemeState {
  mode: 'dark' | 'light';
  colors: typeof Colors.dark;
  update: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: getThemeByHour(),
  colors: getThemeByHour() === 'dark' ? Colors.dark : Colors.light,
  update: () => {
    const mode = getThemeByHour();
    set({ mode, colors: mode === 'dark' ? Colors.dark : Colors.light });
  },
}));
