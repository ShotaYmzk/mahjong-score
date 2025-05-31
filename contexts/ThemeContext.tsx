import React from 'react';
import { useTheme } from '@heroui/use-theme';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const ThemeContext = React.createContext<ThemeContextType>({
  isDarkMode: false,
  toggleTheme: () => {},
});

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { theme, setTheme } = useTheme();
  const [isDarkMode, setIsDarkMode] = React.useState(theme === 'dark');

  // Check system preference on mount
  React.useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark && theme !== 'dark') {
      setTheme('dark');
      setIsDarkMode(true);
    }
  }, []);

  const toggleTheme = React.useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    setIsDarkMode(newTheme === 'dark');
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
