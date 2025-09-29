// src/pages/Home.jsx
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../context/Store.jsx";

function Chip({ children, tone = "default" }) {
  const style = {
    default: { background: "#111820", border: "1px solid #22303a", color: "#c9d1d9" },
    green:   { background: "#0f2a16", border: "1px solid #1b3a23", color: "#86f2a8" },
    blue:    { background: "#0e2030", border: "1px solid #193447", color: "#8ab4ff" },
    gold:    { background: "#2a2310", border: "1px solid #4d3c1b", color: "#ffd36e" },
    muted:   { background: "#0f1317", border: "1px solid #1c2228", color: "#9aa6b2" },
  }[tone] || {};
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"6px 10px", borderRadius:999, fontWeight:700, fontSize:12, ...style }}>
      {children}
    </span>
  );
}

export default function Home() {
  const { data, localDateKey } = useStore();
  const { groups, students, teachers, settings, daily } = data;
  const dateKey = localDateKey();

  const groupsView = useMemo(() => {
    return groups.map((g) => {
      const tea = teachers.find((t) => t.id === g.teacherId);
      const stus = students.filter((s) => s.groupId === g.id);
      const count = stus.length;

      const totalScore = stus.reduce((acc, s) => acc + (s.score || 0), 0);
      const avgScore = count ? Math.round(totalScore / count) : 0;
      const pct = Math.max(0, Math.min(100, Math.round((avgScore / Math.max(1, settings.scoreMax)) * 100)));

      const sorted = stus.slice().sort((a, b) => b.score - a.score);
      const top = sorted[0] || null;
      const topPct = top ? Math.max(0, Math.min(100, Math.round((top.score / Math.max(1, settings.scoreMax)) * 100))) : 0;

      const dayGroup = daily?.[dateKey]?.[g.id] || { attendance: {} };
      const present = stus.reduce((acc, s) => acc + (dayGroup.attendance?.[s.id] ? 1 : 0), 0);

      return { g, teacherName: tea?.name || "—", count, avgScore, pct, top, topPct, present };
    });
  }, [groups, students, teachers, settings.scoreMax, daily, dateKey]);

  return (
    <div>
      <header style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, marginBottom:18, flexWrap:"wrap" }}>
        <h1 style={{ margin: 0, fontSize: 36, fontWeight: 800 }}>The 36 Day — Groups</h1>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <Link to="/setup"><button>+ Add data</button></Link>
          <Link to="/leaderboard"><button>🏆 Leaderboard</button></Link>
          <Link to="/settings"><button>⚙️ Settings</button></Link>
        </div>
      </header>

      {!groups.length && (
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Hali guruhlar yo‘q</div>
          <div className="muted" style={{ marginBottom: 10 }}>Setup sahifasida o‘qituvchi, guruh va o‘quvchi qo‘shing.</div>
          <Link to="/setup" className="link">→ Setup</Link>
        </div>
      )}

      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        {groupsView.map((it) => (
          <div key={it.g.id} className="card" style={{ display: "grid", gap: 10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:8 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{it.g.name}</div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {it.g.level} • Teacher: <strong>{it.teacherName}</strong>
                </div>
              </div>
              <Link to={`/group/${it.g.id}`}><button>Open</button></Link>
            </div>

            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              <Chip tone="muted">👥 {it.count} students</Chip>
              <Chip tone={it.pct >= 80 ? "gold" : it.pct >= 40 ? "green" : "blue"}>📊 Avg: {it.avgScore} / {settings.scoreMax} ({it.pct}%)</Chip>
              {it.top ? <Chip tone="gold">🏆 {it.top.name}: {it.topPct}%</Chip> : <Chip tone="muted">🏆 Top: —</Chip>}
              <Chip tone="green">✅ {it.present}/{it.count} today</Chip>
            </div>

            {!!it.count && (
              <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginTop:4 }}>
                {students.filter((s)=>s.groupId===it.g.id).slice(0,6).map((s)=>(
                  <img key={s.id} src={s.avatar} width={36} height={36} alt={s.name} title={s.name}
                    style={{ borderRadius:"50%", border:"2px solid rgba(255,255,255,.12)", boxShadow:"0 2px 10px rgba(0,0,0,.35)", background:"#111" }} />
                ))}
                {it.count>6 && <span className="muted" style={{ fontSize:12, alignSelf:"center" }}>+{it.count-6} more</span>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


