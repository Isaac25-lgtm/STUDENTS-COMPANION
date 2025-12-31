import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeContextType {
  darkMode: boolean;
  toggleTheme: () => void;
  theme: ThemeColors;
}

interface ThemeColors {
  bg: string;
  header: string;
  card: string;
  cardHover: string;
  text: string;
  textMuted: string;
  textFaint: string;
  input: string;
  divider: string;
  accent: string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);

  const theme: ThemeColors = {
    bg: darkMode ? 'bg-transparent' : 'bg-transparent',
    header: darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/70 border-slate-200/60',
    card: darkMode ? 'bg-slate-800/70 border-slate-700/50' : 'bg-white/80 border-slate-200/60',
    cardHover: darkMode ? 'hover:border-slate-600' : 'hover:border-slate-300',
    text: darkMode ? 'text-slate-100' : 'text-slate-800',
    textMuted: darkMode ? 'text-slate-400' : 'text-slate-600',
    textFaint: darkMode ? 'text-slate-500' : 'text-slate-400',
    input: darkMode ? 'bg-slate-800 placeholder-slate-500 border-slate-700' : 'bg-white/80 placeholder-slate-400 border-slate-200',
    divider: darkMode ? 'border-slate-700/50' : 'border-slate-100',
    accent: darkMode ? 'text-amber-400' : 'text-amber-600',
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

