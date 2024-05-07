import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface ThemeContextProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const useTheme = (): ThemeContextProps => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const fetchStoredTheme = () => {
      try {
        const storedTheme = localStorage.getItem("REEF_THEME_IDENT");
        if (storedTheme) {
          setIsDarkMode(JSON.parse(storedTheme).mode === "dark");
        } else {
          setIsDarkMode(false);
        }
      } catch (error) {
        setIsDarkMode(false);
        console.error("Error fetching stored theme:", error);
      }
    };
    fetchStoredTheme();
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode ? "dark" : "light";
    setIsDarkMode(!isDarkMode);
    localStorage.setItem("REEF_THEME_IDENT", JSON.stringify({ mode: newMode }));
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
