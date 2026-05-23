import React, { createContext, useState, useContext, useEffect } from 'react';

// Create the theme context
const ThemeContext = createContext();

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext);

// Provider component
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('dark'); // 'dark' or 'light'

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    // Check if there's a saved preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);

  // Update localStorage and root element when theme changes
  useEffect(() => {
    localStorage.setItem('theme', theme);
    
    // Apply theme to html element for Tailwind's dark: utilities
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Toggle between dark and light theme
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Set theme explicitly
  const setThemeExplicitly = (newTheme) => {
    if (newTheme === 'dark' || newTheme === 'light') {
      setTheme(newTheme);
    }
  };

  // Helper function to get theme-specific class names
  const getThemedClass = (darkClass, lightClass) => {
    return theme === 'dark' ? darkClass : lightClass;
  };

  // Theme config object with Multi-Color (Lavender & Blue) tokens
  const themeConfig = {
    dark: {
      background: 'bg-[#020617]', // Pure deep midnight background
      text: 'text-slate-100',
      secondaryText: 'text-slate-400',
      gradientBackground: 'bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#312e81]',
      gradient: {
        text: 'text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary'
      },
      card: 'glass-dark rounded-2xl shadow-2xl border border-white/5',
      icon: 'text-brand-primary',
      button: {
        primary: 'btn-premium',
        secondary: 'bg-slate-900 text-slate-200 border border-slate-800 hover:bg-slate-850 rounded-full px-6 py-2.5 transition-all duration-300',
      },
      input: 'bg-[#020617] border border-slate-800 text-slate-100 rounded-xl focus:ring-brand-primary/50 focus:border-brand-primary/50',
      nav: {
        sidebar: 'bg-[#020617] border-r border-slate-800',
        active: 'bg-brand-primary/20 text-brand-primary border-l-4 border-brand-primary shadow-[0_0_20px_rgba(139,92,246,0.2)]',
        inactive: 'text-slate-400 hover:text-white hover:bg-white/5'
      }
    },
    light: {
      background: 'bg-[#f8fafc]',
      text: 'text-slate-900',
      secondaryText: 'text-slate-500',
      gradientBackground: 'bg-white',
      gradient: {
        text: 'text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary'
      },
      card: 'glass-card rounded-2xl shadow-md border border-slate-200',
      icon: 'text-brand-primary',
      button: {
        primary: 'btn-premium',
        secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-full px-6 py-2.5 transition-all duration-300',
      },
      input: 'bg-white border border-slate-200 text-slate-900 rounded-xl focus:ring-brand-primary/50 focus:border-brand-primary/50',
      nav: {
        sidebar: 'bg-white border-r border-slate-200 shadow-sm',
        active: 'bg-brand-primary/10 text-brand-primary border-l-4 border-brand-primary shadow-sm',
        inactive: 'text-slate-500 hover:text-brand-primary hover:bg-brand-primary/5'
      }
    }
  };
  
  const value = {
    theme,
    toggleTheme,
    setTheme: setThemeExplicitly,
    getThemedClass,
    themeConfig,
    isDark: theme === 'dark'
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export default ThemeProvider;