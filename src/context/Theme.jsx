// src/context/Theme.jsx
import { createContext, useContext, useEffect, useState } from "react";

const ThemeCtx = createContext();
const LS_KEY = "the36-theme"; // "day" | "night"

export const useTheme = () => useContext(ThemeCtx);

export default function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const v = localStorage.getItem(LS_KEY);
    return v === "day" || v === "night" ? v : "night";
  });

  useEffect(() => {
    localStorage.setItem(LS_KEY, theme);
    // html va body’da atribut — CSS override uchun qulay
    document.documentElement.setAttribute("data-theme", theme);
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "night" ? "day" : "night"));

  return (
    <ThemeCtx.Provider value={{ theme, setTheme, toggle }}>
      {children}
    </ThemeCtx.Provider>
  );
}
