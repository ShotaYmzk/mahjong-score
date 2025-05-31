// "use client"; 

// import React from 'react';
// import { useTheme as useNextTheme } from 'next-themes';

// interface ThemeContextType {
//   isDarkMode: boolean;
//   toggleTheme: () => void;
// }

// export const ThemeContext = React.createContext<ThemeContextType>({
//   isDarkMode: false,
//   toggleTheme: () => {},
// });

// interface ThemeProviderProps {
//   children: React.ReactNode;
// }

// export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
//   const { theme, setTheme, systemTheme } = useNextTheme();
//   const [isMounted, setIsMounted] = React.useState(false);

//   React.useEffect(() => {
//     setIsMounted(true);
//   }, []);

//   const currentTheme = theme === "system" ? systemTheme : theme;
//   const isDarkMode = currentTheme === 'dark';

//   const toggleTheme = React.useCallback(() => {
//     setTheme(isDarkMode ? 'light' : 'dark');
//   }, [isDarkMode, setTheme]);

//   if (!isMounted) {
//     return null; 
//   }

//   return (
//     <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
//       {children}
//     </ThemeContext.Provider>
//   );
// };