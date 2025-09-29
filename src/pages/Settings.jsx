// src/pages/Settings.jsx
import { useState } from "react";
import { useStore } from "../context/Store.jsx";

export default function Settings() {
  const { data, setScoreMax, setSessionScore, resetSettings } = useStore();
  const [scoreMax, setScoreMaxLocal] = useState(data.settings.scoreMax);
  const [sessionScore, setSessionScoreLocal] = useState(data.settings.sessionScore);

  const apply = () => {
    const sm = Math.max(10, Math.min(1000, Number(scoreMax) || 100));
    const ss = Math.max(1, Math.min(200, Number(sessionScore) || 10));
    setScoreMax(sm);
    setSessionScore(ss);
    alert("Settings saqlandi ✅");
  };

  const reset = () => {
    resetSettings();
    setScoreMaxLocal(100);
    setSessionScoreLocal(10);
  };

  return (
    <div className="page">
      <h1>Settings</h1>

      <section className="card" style={{ maxWidth: 520 }}>
        <div style={{ display:"grid", gap:12 }}>
          <label style={{ display:"grid", gap:6 }}>
            <div style={{ fontWeight:700 }}>SCORE_MAX</div>
            <input
              type="number"
              min={10}
              max={1000}
              value={scoreMax}
              onChange={(e)=>setScoreMaxLocal(e.target.value)}
              placeholder="100"
            />
            <div className="muted" style={{ fontSize:12 }}>
              Progress % hisoblash uchun maksimal ball (masalan 100 → 100 ball = 100%).
            </div>
          </label>

          <label style={{ display:"grid", gap:6 }}>
            <div style={{ fontWeight:700 }}>SESSION_SCORE</div>
            <input
              type="number"
              min={1}
              max={200}
              value={sessionScore}
              onChange={(e)=>setSessionScoreLocal(e.target.value)}
              placeholder="10"
            />
            <div className="muted" style={{ fontSize:12 }}>
              “Session” tugmasi bosilganda qo‘shiladigan ball miqdori.
            </div>
          </label>

          <div className="row" style={{ gap:8 }}>
            <button onClick={apply}>Save</button>
            <button className="danger" onClick={reset}>Reset defaults</button>
          </div>

          <div className="muted" style={{ fontSize:12 }}>
            Eslatma: sozlamalar localStorage’da saqlanadi va barcha sahifalarga darhol qo‘llanadi.
          </div>
        </div>
      </section>
    </div>
  );
}
