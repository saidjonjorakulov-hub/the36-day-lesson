// src/ui/ProgramCalendar.jsx
import { useMemo } from "react";
import { useProgram } from "../context/Program.jsx";

export default function ProgramCalendar(){
  const { programDay, current, setStartDate, clearCurrent, toggleDone, todayNumber } = useProgram();
  const N = Number(programDay);
  const days = useMemo(()=> Array.from({length:N}, (_,i)=>i+1), [N]);

  const doneSet = useMemo(()=> new Set(current?.done||[]), [current]);
  const doneCount = doneSet.size;

  return (
    <section className="card" style={{ marginBottom: 16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:10, flexWrap:"wrap" }}>
        <div>
          <div style={{ fontWeight:800, marginBottom:4 }}>Program calendar — {programDay} days</div>
          <div className="muted" style={{ fontSize:12 }}>
            Start sanasini belgilang, so‘ng har kuni bloklarni bosing (<strong>done</strong>).
          </div>
        </div>
        <div className="row" style={{ gap:8, flexWrap:"wrap" }}>
          <label className="row" style={{ gap:6 }}>
            <span className="muted">Start</span>
            <input
              type="date"
              value={current?.start || ""}
              onChange={(e)=> setStartDate(e.target.value)}
            />
          </label>
          <span className="pill">Done: {doneCount}/{N}</span>
          <button className="danger" onClick={clearCurrent}>Reset</button>
        </div>
      </div>

      <div className="progCal-grid" style={{ marginTop:12 }}>
        {days.map(d=>{
          const isDone = doneSet.has(d);
          const isToday = todayNumber!=null && d===todayNumber;
          return (
            <button
              key={d}
              className={`progCal-day ${isDone ? "done":""} ${isToday ? "today":""}`}
              onClick={()=>toggleDone(d)}
              title={isToday ? "Bugun" : "Belgilash"}
            >
              <div className="num">Day {d}</div>
              {isToday && <div className="tag">Today</div>}
            </button>
          );
        })}
      </div>

      <div className="progCal-legend" style={{ marginTop:10 }}>
        <span className="pill" style={{ background:"#0f2a16", borderColor:"#1b3a23", color:"#86f2a8" }}>Done</span>
        <span className="pill" style={{ borderColor:"rgba(56,166,255,.45)" }}>Today</span>
        <span className="muted" style={{ fontSize:12 }}>— kunni belgilash uchun katakka bosing</span>
      </div>
    </section>
  );
}
