// src/pages/Leaderboard.jsx
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../context/Store.jsx";

function pct(score, max) {
  return Math.max(0, Math.min(100, Math.round((Math.max(0, score) / Math.max(1, max)) * 100)));
}

function Podium({ item, place }) {
  if (!item) return null;
  const medal = ["🥇", "🥈", "🥉"][place - 1] || "";
  return (
    <div className={`podium p${place}`}>
      <img src={item.avatar} alt="av" width={64} height={64} />
      <div className="name">{medal} {item.name}</div>
      <div className="score">{item.scoreDisp}</div>
    </div>
  );
}

export default function Leaderboard() {
  const { data, isSameWeek } = useStore();
  const { students, groups, settings, dailyScore } = data;
  const { scoreMax } = settings;

  // UI state
  const [period, setPeriod] = useState("week"); // "week" | "all"
  const [groupId, setGroupId] = useState("");  // "" = all groups
  const [sortBy, setSortBy] = useState("score"); // "score" | "streak" (all-time only)

  // Filter by group
  const studentsInScope = useMemo(() => {
    return groupId ? students.filter(s => s.groupId === groupId) : students.slice();
  }, [students, groupId]);

  // Week totals: sum of this week's dailyScore deltas
  const weekTotals = useMemo(() => {
    const totals = new Map(); // studentId -> sum
    Object.entries(dailyScore || {}).forEach(([dateKey, bucket]) => {
      // dateKey = "YYYY-MM-DD"
      const [y,m,d] = dateKey.split("-").map(Number);
      const dt = new Date(y, m - 1, d);
      if (!isSameWeek(dt)) return;
      Object.entries(bucket || {}).forEach(([sid, delta]) => {
        totals.set(sid, (totals.get(sid) || 0) + (Number(delta) || 0));
      });
    });
    return totals;
  }, [dailyScore, isSameWeek]);

  // Build rows
  const rows = useMemo(() => {
    return studentsInScope.map(s => {
      const allScore = s.score || 0;
      const allPct = pct(allScore, scoreMax);

      const wScore = weekTotals.get(s.id) || 0;
      const wPct = pct(wScore, scoreMax); // shunchaki ko‘rsatish uchun (hafta % nisbiy)

      return {
        id: s.id,
        name: s.name,
        avatar: s.avatar,
        groupId: s.groupId,
        streak: s.streak || 0,
        allScore, allPct,
        wScore, wPct,
      };
    });
  }, [studentsInScope, scoreMax, weekTotals]);

  // Sort
  const sorted = useMemo(() => {
    const base = rows.slice();
    if (period === "week") {
      base.sort((a, b) => b.wScore - a.wScore || b.allScore - a.allScore);
    } else {
      if (sortBy === "streak") {
        base.sort((a, b) => b.streak - a.streak || b.allScore - a.allScore);
      } else {
        base.sort((a, b) => b.allScore - a.allScore || b.streak - a.streak);
      }
    }
    return base;
  }, [rows, period, sortBy]);

  const podium = sorted.slice(0, 3).map((r, i) => ({
    ...r,
    scoreDisp: period === "week"
      ? `+${r.wScore} this week`
      : `${r.allScore} pts`,
  }));

  return (
    <div className="page">
      <h1>Leaderboard</h1>

      {/* Controls */}
      <div className="card" style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
          {/* Period switch */}
          <div className="seg">
            <button className={period==="week" ? "seg-btn active" : "seg-btn"} onClick={()=>setPeriod("week")}>This week</button>
            <button className={period==="all" ? "seg-btn active" : "seg-btn"} onClick={()=>setPeriod("all")}>All time</button>
          </div>

          {/* Group filter */}
          <label style={{ display:"inline-flex", alignItems:"center", gap:6 }}>
            <span className="muted">Group</span>
            <select value={groupId} onChange={(e)=>setGroupId(e.target.value)}>
              <option value="">All groups</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </label>

          {/* Sort (only all-time) */}
          {period === "all" && (
            <label style={{ display:"inline-flex", alignItems:"center", gap:6 }}>
              <span className="muted">Sort</span>
              <select value={sortBy} onChange={(e)=>setSortBy(e.target.value)}>
                <option value="score">Score</option>
                <option value="streak">Streak</option>
              </select>
            </label>
          )}
        </div>

        <div>
          <Link to="/home"><span className="muted">Tip: “This week” holati faqat shu haftadagi ball qo‘shishlariga tayanadi.</span></Link>
        </div>
      </div>

      {/* Podium */}
      <div className="top3" style={{ marginTop: 10 }}>
        <Podium item={podium[0]} place={1} />
        <Podium item={podium[1]} place={2} />
        <Podium item={podium[2]} place={3} />
      </div>

      {/* Table */}
      <div className="table" style={{ marginTop: 12 }}>
        <div className="thead">
          <div>Student</div>
          <div>{period === "week" ? "Week score" : "Score"}</div>
          <div>%</div>
          <div>🔥 Streak</div>
          <div>Parent</div>
        </div>

        {sorted.map((r, i) => {
          const scoreCol = period === "week" ? `+${r.wScore}` : `${r.allScore}`;
          const percentCol = period === "week" ? r.wPct : r.allPct;
          return (
            <div key={r.id} className="trow">
              <div className="cell nameCell">
                <img src={r.avatar} alt="av" width={36} height={36} />
                <span>{i+1}. {r.name}</span>
              </div>
              <div className="cell" style={{ fontVariantNumeric: "tabular-nums" }}>{scoreCol}</div>
              <div className="cell">{percentCol}%</div>
              <div className="cell">🔥 {r.streak}</div>
              <div className="cell">
                <Link to={`/p/${r.id}`} className="link">Parent view →</Link>
              </div>
            </div>
          );
        })}

        {!sorted.length && (
          <div className="trow">
            <div className="cell" style={{ gridColumn: "1 / -1" }}>
              <span className="muted">Hali student yo‘q.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
