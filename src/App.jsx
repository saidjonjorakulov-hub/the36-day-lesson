// src/App.jsx
import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./ui/Navbar.jsx";
import "./App.css";
import { StoreProvider } from "./context/Store.jsx";
import ThemeProvider from "./context/Theme.jsx";
import ProgramProvider from "./context/Program.jsx"; // ✅

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 2200);
    return () => clearTimeout(t);
  }, []);

  return (
    <ProgramProvider>
      <ThemeProvider>
        <StoreProvider>
          <div className="app" style={{ minHeight: "100vh" }}>
            {!ready && (
              <div className="splash" role="dialog" aria-label="Intro animation">
                <img className="splash-headline" src="/the36-text.png" alt="The 36 Day" />
                <img className="splash-num" src="/36-3d.png" alt="36 3D" />
                <svg className="spark" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2 L16 9 L23 12 L16 15 L12 22 L8 15 L1 12 L8 9 Z" fill="#fff" />
                </svg>
              </div>
            )}

            <div className={`content ${ready ? "show" : ""}`}>
              <Navbar />
              <div className="wrap">
                <Outlet />
              </div>
            </div>
          </div>
        </StoreProvider>
      </ThemeProvider>
    </ProgramProvider>
  );
}
