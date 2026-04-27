import { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load theme preference from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme) {
      const isDarkMode = savedTheme === 'dark';
      setIsDark(isDarkMode);
      applyTheme(isDarkMode);
    } else {
      setIsDark(false);
      applyTheme(false);
      localStorage.setItem('theme', 'light');
    }

    setLoading(false);
  }, []);

  const applyTheme = (isDarkMode) => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
  };

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    applyTheme(newIsDark);
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
  };

  const value = {
    isDark,
    toggleTheme,
    loading
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
