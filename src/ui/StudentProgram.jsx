// src/ui/StudentProgram.jsx
import { useEffect, useMemo, useState } from "react";

const LS_PREFIX = "the-program-student-v1:"; // har student uchun alohida yozuv

const defState = {
  program: "36", // "36" | "30"
  meta: {
    "30": { start: "", done: [] },
    "36": { start: "", done: [] },
  },
};

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const toDayKey = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const todayLocal = () => toDayKey(new Date());
const daysBetween = (iso) => {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  const s = toDayKey(new Date(y, (m || 1) - 1, d || 1));
  const t = todayLocal();
  return Math.floor((t - s) / (1000 * 60 * 60 * 24)); // 0 = start kuni
};

export default function StudentProgram({ studentId }) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_PREFIX + studentId);
      const parsed = raw ? JSON.parse(raw) : defState;
      // merge defaults
      return {
        program: parsed.program === "30" ? "30" : "36",
        meta: {
          "30": { ...defState.meta["30"], ...(parsed.meta?.["30"] || {}) },
          "36": { ...defState.meta["36"], ...(parsed.meta?.["36"] || {}) },
        },
      };
    } catch {
      return defState;
    }
  });

  useEffect(() => {
    localStorage.setItem(LS_PREFIX + studentId, JSON.stringify(state));
  }, [state, studentId]);

  const prog = state.program;
  const N = Number(prog);
  const cur = state.meta[prog];
  const doneSet = useMemo(() => new Set(cur.done || []), [cur]);
  const todayIndex = cur.start ? daysBetween(cur.start) : null;
  const todayNumber = todayIndex == null ? null : clamp(todayIndex + 1, 1, N);
  const doneCount = doneSet.size;

  const setProgram = (p) => setState((s) => ({ ...s, program: p === "30" ? "30" : "36" }));
  const setStart = (iso) =>
    setState((s) => {
      const meta = { ...s.meta };
      meta[prog] = { ...meta[prog], start: (iso || "").trim() };
      return { ...s, meta };
    });
  const resetProg = () =>
    setState((s) => {
      const meta = { ...s.meta };
      meta[prog] = { start: "", done: [] };
      return { ...s, meta };
    });
  const toggleDone = (dNum) =>
    setState((s) => {
      const meta = { ...s.meta };
      const obj = { ...meta[prog] };
      const set = new Set(obj.done || []);
      const d = clamp(Number(dNum) || 0, 1, N);
      if (set.has(d)) set.delete(d);
      else set.add(d);
      obj.done = Array.from(set).sort((a, b) => a - b);
      meta[prog] = obj;
      return { ...s, meta };
    });

  const days = useMemo(() => Array.from({ length: N }, (_, i) => i + 1), [N]);

  return (
    <section className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontWeight: 800, marginBottom: 4 }}>Program calendar — {prog} days</div>
          <div className="muted" style={{ fontSize: 12 }}>Start sanasini belgilang, so‘ng har kuni “done” qilib borasiz.</div>
        </div>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          {/* Program switch (36 / 30) */}
          <div className="seg" role="group" aria-label="Program">
            <button
              className={`seg-btn ${prog === "36" ? "active" : ""}`}
              onClick={() => setProgram("36")}
              title="36 Day Class lessons"
            >36 Day</button>
            <button
              className={`seg-btn ${prog === "30" ? "active" : ""}`}
              onClick={() => setProgram("30")}
              title="30 Day"
            >30 Day</button>
          </div>

          <label className="row" style={{ gap: 6 }}>
            <span className="muted">Start</span>
            <input type="date" value={cur.start || ""} onChange={(e) => setStart(e.target.value)} />
          </label>

          <span className="pill">Done: {doneCount}/{N}</span>
          <button className="danger" onClick={resetProg}>Reset</button>
        </div>
      </div>

      <div className="progCal-grid" style={{ marginTop: 12 }}>
        {days.map((d) => {
          const isDone = doneSet.has(d);
          const isToday = todayNumber != null && d === todayNumber;
          return (
            <button
              key={d}
              className={`progCal-day ${isDone ? "done" : ""} ${isToday ? "today" : ""}`}
              onClick={() => toggleDone(d)}
              title={isToday ? "Bugun" : "Belgilash"}
            >
              <div className="num">Day {d}</div>
              {isToday && <div className="tag">Today</div>}
            </button>
          );
        })}
      </div>

      <div className="progCal-legend" style={{ marginTop: 10 }}>
        <span className="pill" style={{ background: "#0f2a16", borderColor: "#1b3a23", color: "#86f2a8" }}>Done</span>
        <span className="pill" style={{ borderColor: "rgba(56,166,255,.45)" }}>Today</span>
        <span className="muted" style={{ fontSize: 12 }}>— katakka bosib belgilaysiz</span>
      </div>
    </section>
  );
}
