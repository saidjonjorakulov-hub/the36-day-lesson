// src/ui/Navbar.jsx
import { NavLink, Link } from "react-router-dom";
import { useTheme } from "../context/Theme.jsx";

const base = {
  padding: "8px 12px",
  borderRadius: 12,
  textDecoration: "none",
  color: "#eaf1f8",
  fontWeight: 600,
};

export default function Navbar() {
  const { theme, toggle } = useTheme();
  const isNight = theme === "night";

  const link = ({ isActive }) => ({
    ...base,
    color: isActive ? "#38a6ff" : "#eaf1f8",
    background: isActive ? "rgba(56,166,255,.10)" : "transparent",
  });

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 22px",
        borderBottom: "1px solid #1e2230",
        background: "transparent",
      }}
    >
      <Link
        to="/"
        style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit" }}
        aria-label="EVEREST — The 36 Day"
      >
        <img src="/everest-logo.png" alt="EVEREST" style={{ height: 30, width: "auto", objectFit: "contain", display: "block" }} />
      </Link>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <NavLink to="/" style={link}>Home</NavLink>
        <NavLink to="/leaderboard" style={link}>Leaderboard</NavLink>
        <NavLink to="/vocab" style={link}>Vocab</NavLink>
        <NavLink to="/setup" style={link}>Setup</NavLink>
        {/* ✅ Settings NAVBAR oxirida */}
        <NavLink to="/settings" style={link}>Settings</NavLink>

        <button
          onClick={toggle}
          title={isNight ? "Switch to Day" : "Switch to Night"}
          style={{
            background: isNight ? "#122231" : "#0f2a16",
            border: "1px solid " + (isNight ? "#1c2f45" : "#1b3a23"),
            color: isNight ? "#8ab4ff" : "#86f2a8",
            borderRadius: 10,
            padding: "8px 10px",
            fontWeight: 700,
          }}
        >
          {isNight ? "🌙 Night" : "☀️ Day"}
        </button>
      </div>
    </nav>
  );
}



