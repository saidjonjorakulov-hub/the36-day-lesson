// src/context/Program.jsx
import { createContext, useContext, useEffect, useState } from "react";

const ProgramCtx = createContext();
const LS_DAY  = "the-program-day";   // "36" | "30"
const LS_META = "the-program-meta";  // { "30": {start:"YYYY-MM-DD", done:number[]}, "36": {...} }

const defaultMeta = {
  "30": { start: "", done: [] },
  "36": { start: "", done: [] },
};

export const useProgram = () => useContext(ProgramCtx);

function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }
function toKey(d){ return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function todayLocal(){ const n = new Date(); return toKey(n); }
function daysBetween(startStr){
  if(!startStr) return null;
  const [y,m,d] = startStr.split("-").map(Number);
  const s = toKey(new Date(y, (m||1)-1, d||1));
  const t = todayLocal();
  const ms = t - s;
  return Math.floor(ms / (1000*60*60*24)); // 0 = start kuni
}

export default function ProgramProvider({ children }) {
  const [programDay, setProgramDay] = useState(()=>{
    const v = localStorage.getItem(LS_DAY);
    return v === "36" || v === "30" ? v : "36";
  });

  const [meta, setMeta] = useState(()=>{
    try{
      const raw = localStorage.getItem(LS_META);
      const parsed = raw ? JSON.parse(raw) : defaultMeta;
      return { "30": { ...defaultMeta["30"], ...(parsed["30"]||{}) },
               "36": { ...defaultMeta["36"], ...(parsed["36"]||{}) } };
    }catch{ return defaultMeta; }
  });

  useEffect(()=>{ localStorage.setItem(LS_DAY, programDay); }, [programDay]);
  useEffect(()=>{ localStorage.setItem(LS_META, JSON.stringify(meta)); }, [meta]);

  const toggleProgram = ()=> setProgramDay(d=> d==="36" ? "30" : "36");

  const setStartDate = (iso) => {
    setMeta(m => {
      const cur = { ...(m[programDay]||defaultMeta[programDay]) };
      cur.start = (iso||"").trim();
      // out-of-range done’larni filtrlash
      const N = Number(programDay);
      cur.done = (cur.done||[]).filter(x => x>=1 && x<=N);
      return { ...m, [programDay]: cur };
    });
  };

  const clearCurrent = () => {
    setMeta(m => ({ ...m, [programDay]: { start: "", done: [] } }));
  };

  const toggleDone = (dayNum) => {
    const N = Number(programDay);
    const d = clamp(Number(dayNum)||0, 1, N);
    setMeta(m => {
      const cur = { ...(m[programDay]||defaultMeta[programDay]) };
      const set = new Set(cur.done||[]);
      if(set.has(d)) set.delete(d); else set.add(d);
      cur.done = Array.from(set).sort((a,b)=>a-b);
      return { ...m, [programDay]: cur };
    });
  };

  const current = meta[programDay] || defaultMeta[programDay];
  const todayIndex = current.start ? daysBetween(current.start) : null; // 0-based
  const value = {
    programDay, toggleProgram,
    meta, current, setStartDate, clearCurrent, toggleDone,
    todayNumber: (todayIndex==null) ? null : (clamp(todayIndex+1, 1, Number(programDay))),
  };

  return <ProgramCtx.Provider value={value}>{children}</ProgramCtx.Provider>;
}
