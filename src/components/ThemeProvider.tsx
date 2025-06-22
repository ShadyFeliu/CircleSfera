"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'auto';
type ColorScheme = 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'red';

interface ThemeContextType {
  theme: Theme;
  colorScheme: ColorScheme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  setColorScheme: (color: ColorScheme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('auto');
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>('blue');
  const [isDark, setIsDark] = useState(false);

  // Detectar preferencia del sistema
  useEffect(() => {
    // Verificar si window.matchMedia está disponible (para tests)
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        if (theme === 'auto') {
          setIsDark(mediaQuery.matches);
        }
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  // Cargar tema desde localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedTheme = localStorage.getItem('circlesfera-theme') as Theme;
      const savedColorScheme = localStorage.getItem('circlesfera-color') as ColorScheme;
      
      if (savedTheme) setThemeState(savedTheme);
      if (savedColorScheme) setColorSchemeState(savedColorScheme);
    }
  }, []);

  // Aplicar tema al documento
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      
      // Aplicar tema
      if (theme === 'auto') {
        if (typeof window !== 'undefined' && window.matchMedia) {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
          setIsDark(mediaQuery.matches);
        } else {
          // Fallback para tests
          setIsDark(false);
        }
      } else {
        setIsDark(theme === 'dark');
      }

      // Aplicar clases CSS
      root.classList.remove('light', 'dark');
      root.classList.add(isDark ? 'dark' : 'light');
      
      // Aplicar esquema de color
      root.classList.remove('blue', 'purple', 'green', 'orange', 'pink', 'red');
      root.classList.add(colorScheme);
      
      // Guardar en localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('circlesfera-theme', theme);
        localStorage.setItem('circlesfera-color', colorScheme);
      }
    }
  }, [theme, colorScheme, isDark]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const setColorScheme = (newColor: ColorScheme) => {
    setColorSchemeState(newColor);
  };

  const toggleTheme = () => {
    setThemeState(current => current === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      colorScheme,
      isDark,
      setTheme,
      setColorScheme,
      toggleTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
}; 