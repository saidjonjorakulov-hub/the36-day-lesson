// src/pages/Group.jsx
import { useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useStore } from "../context/Store.jsx";

const toPercent = (score, max) => {
  const p = Math.round((Math.max(0, score) / Math.max(1, max)) * 100);
  return Math.max(0, Math.min(100, p));
};

function barStyle(valuePct) {
  if (valuePct < 40) return { background: "linear-gradient(90deg, #2f95ff, #8ab4ff)", boxShadow: "0 0 18px rgba(47,149,255,.35) inset" };
  if (valuePct < 80) return { background: "linear-gradient(90deg, #1ec971, #86f2a8)", boxShadow: "0 0 18px rgba(30,201,113,.35) inset" };
  return { background: "linear-gradient(90deg, #ffd700, #ffe680)", boxShadow: "0 0 18px rgba(255,215,0,.35) inset" };
}

function Progress({ value }) {
  return (
    <div className="progress">
      <div className="bar" style={{ width: `${value}%`, ...barStyle(value) }} />
      <span className="pct">{value}%</span>
    </div>
  );
}

function Medal({ rank }) {
  const map = { 1: ["🥇", "gold"], 2: ["🥈", "silver"], 3: ["🥉", "bronze"] };
  const [emoji, tone] = map[rank] || [];
  if (!emoji) return null;
  return <span className={`medal ${tone}`} title={`Top-${rank}`}>{emoji}</span>;
}

export default function Group() {
  const { groupId } = useParams();
  const {
    data,
    incScore,
    incStreak,
    toggleAttendance,
    setGroupNote,
    setGroupHomework,
    clearDayGroup,
    localDateKey,
  } = useStore();

  const { scoreMax, sessionScore } = data.settings;
  const group = data.groups.find((g) => g.id === groupId);
  const dateKey = localDateKey();

  const justPulsed = useRef(new Set());
  const students = useMemo(
    () => data.students.filter((s) => s.groupId === groupId),
    [data.students, groupId]
  );
  const sorted = useMemo(() => students.slice().sort((a, b) => b.score - a.score), [students]);

  // Top-3 rank map (studentId -> 1/2/3/undefined)
  const rankMap = useMemo(() => {
    const map = {};
    sorted.slice(0, 3).forEach((s, i) => (map[s.id] = i + 1));
    return map;
  }, [sorted]);

  // Today (attendance, note, homework)
  const dayGroup = data.daily?.[dateKey]?.[groupId] || { attendance: {}, note: "", homework: "" };
  const presentCount = sorted.reduce((acc, s) => acc + (dayGroup.attendance?.[s.id] ? 1 : 0), 0);

  const [noteDraft, setNoteDraft] = useState(dayGroup.note || "");
  const [homeworkDraft, setHomeworkDraft] = useState(dayGroup.homework || "");
  const [panelOpen, setPanelOpen] = useState(false);
  const [filter, setFilter] = useState("all"); // "all" | "present" | "absent"

  if (!group) return <div className="page"><h1>Group not found</h1></div>;

  const doSession = (studentId) => {
    incScore(studentId, +sessionScore);
    incStreak(studentId, +1);
    justPulsed.current.add(studentId);
    setTimeout(() => { justPulsed.current.delete(studentId); }, 400);
  };
  const doSessionAll = () => { sorted.forEach((s) => doSession(s.id)); };

  const setAllPresent = () => {
    sorted.forEach((s) => {
      if (!dayGroup.attendance?.[s.id]) toggleAttendance(groupId, s.id, dateKey);
    });
  };
  const clearToday = () => {
    if (confirm("Bugungi attendance, notes va homework tozalansinmi?")) {
      clearDayGroup(groupId, dateKey);
      setNoteDraft("");
      setHomeworkDraft("");
    }
  };

  const saveNote = (val) => { setNoteDraft(val); setGroupNote(groupId, val, dateKey); };
  const saveHomework = (val) => { setHomeworkDraft(val); setGroupHomework(groupId, val, dateKey); };

  const filtered = useMemo(() => {
    if (filter === "all") return sorted;
    return sorted.filter((s) => {
      const isHere = !!dayGroup.attendance?.[s.id];
      return filter === "present" ? isHere : !isHere;
    });
  }, [sorted, filter, dayGroup]);

  const teacherName = (() => {
    const t = data.teachers.find((t) => t.id === group.teacherId);
    return t?.name || "—";
  })();

  const avgScore = (() => {
    if (!sorted.length) return 0;
    const total = sorted.reduce((a, s) => a + (s.score || 0), 0);
    return Math.round(total / sorted.length);
  })();

  return (
    <div className="page">
      {/* ===== Sticky bar: title + quick actions ===== */}
      <div className="g-sticky">
        <div className="g-title">
          <h1 style={{ margin: 0 }}>
            {group.name} <span className="badge">{group.level}</span>
          </h1>
          <div className="g-chips">
            <span className="pill pill-muted">Teacher: {teacherName}</span>
            <span className="pill">👥 {sorted.length}</span>
            <span className="pill">📊 Avg: {avgScore} / {scoreMax}</span>
            <span className="pill">✅ {presentCount}/{sorted.length} today</span>
          </div>
        </div>

        <div className="g-actions">
          <div className="seg" role="group" aria-label="Filter">
            <button className={`seg-btn ${filter==="all" ? "active":""}`} onClick={()=>setFilter("all")}>All</button>
            <button className={`seg-btn ${filter==="present" ? "active":""}`} onClick={()=>setFilter("present")}>Present</button>
            <button className={`seg-btn ${filter==="absent" ? "active":""}`} onClick={()=>setFilter("absent")}>Absent</button>
          </div>
          <div className="row" style={{ gap:8 }}>
            {sorted.length > 0 && <button className="sessionBtn" onClick={doSessionAll}>✓ Session (All)</button>}
            <button onClick={setAllPresent}>All present</button>
            <button className="danger" onClick={clearToday}>Clear today</button>
          </div>
        </div>
      </div>

      {/* ===== Top-3 (mini podium) ===== */}
      <div className="top3" style={{ marginTop: 6 }}>
        {sorted.slice(0, 3).map((s, i) => (
          <div key={s.id} className={`podium p${i + 1}`}>
            <div className="avatarWrap" style={{ width:64, height:64 }}>
              <img src={s.avatar} alt="av" width={64} height={64} style={{ borderRadius:"50%" }} />
              <Medal rank={i+1} />
            </div>
            <div className="name">{s.name}</div>
            <div className="score">{s.score} pts</div>
          </div>
        ))}
      </div>

      {/* ===== Collapsible: Today (attendance + notes) ===== */}
      <section className="card" style={{ marginTop: 8 }}>
        <div className="row" style={{ justifyContent:"space-between", alignItems:"center", gap:8 }}>
          <div style={{ fontWeight: 800 }}>
            Today — <span className="muted">{dateKey}</span>
          </div>
          <button className="collapseBtn" onClick={()=>setPanelOpen(o=>!o)}>
            {panelOpen ? "▼ Hide" : "► Show"}
          </button>
        </div>

        {panelOpen && (
          <>
            {/* Attendance toggles */}
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 10, marginTop: 8 }}>
              {sorted.map((s) => {
                const isHere = !!dayGroup.attendance?.[s.id];
                return (
                  <div key={s.id} className="miniCard" style={{ display: "flex", alignItems: "center", gap: 10, padding: 10 }}>
                    <div className="avatarWrap" style={{ width:40, height:40 }}>
                      <img src={s.avatar} alt="av" width={40} height={40} style={{ borderRadius: "50%" }} />
                      <Medal rank={rankMap[s.id]} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{s.name}</div>
                      <div className="muted" style={{ fontSize: 12 }}>ID: {s.id.slice(-6)}</div>
                    </div>
                    <button
                      className={isHere ? "presentBtn on" : "presentBtn"}
                      onClick={() => toggleAttendance(groupId, s.id, dateKey)}
                    >
                      {isHere ? "Present" : "Absent"}
                    </button>
                  </div>
                );
              })}
              {!sorted.length && <div className="muted">Hali o‘quvchi yo‘q.</div>}
            </div>

            {/* Notes + Homework */}
            <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <div style={{ fontWeight: 700 }}>Note (today)</div>
                <textarea rows={2} value={noteDraft} onChange={(e)=>saveNote(e.target.value)} placeholder="Bugungi dars bo‘yicha eslatma..." />
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <div style={{ fontWeight: 700 }}>Homework (today)</div>
                <textarea rows={2} value={homeworkDraft} onChange={(e)=>saveHomework(e.target.value)} placeholder="Uyga vazifa..." />
              </label>
            </div>
          </>
        )}
      </section>

      {/* ===== Table (score/streak/actions) ===== */}
      <div className="table" style={{ marginTop: 12 }}>
        <div className="thead">
          <div>Student</div>
          <div>Score</div>
          <div>Progress</div>
          <div>Streak</div>
          <div>Actions</div>
        </div>

        {filtered.map((s) => {
          const pct = toPercent(s.score, scoreMax);
          const pulsing = justPulsed.current.has(s.id);
          return (
            <div key={s.id} className={`trow ${pulsing ? "pulse" : ""}`}>
              <div className="cell nameCell">
                <div className="avatarWrap" style={{ width:36, height:36 }}>
                  <img src={s.avatar} alt="av" width={36} height={36} />
                  <Medal rank={rankMap[s.id]} />
                </div>
                <span>{s.name}</span>
              </div>

              <div className="cell" style={{ fontVariantNumeric: "tabular-nums" }}>{s.score}</div>
              <div className="cell" style={{ minWidth: 200 }}>
                <Progress value={pct} />
              </div>
              <div className="cell">🔥 {s.streak}</div>

              <div className="cell" style={{ gap: 6, flexWrap: "wrap" }}>
                <button onClick={() => incScore(s.id, +5)}>+5</button>
                <button onClick={() => incScore(s.id, -5)}>-5</button>
                <button onClick={() => incStreak(s.id, +1)}>Streak +1</button>
                <button className="sessionBtn" onClick={() => doSession(s.id)}>✓ Session</button>
              </div>
            </div>
          );
        })}

        {!filtered.length && (
          <div className="trow">
            <div className="cell" style={{ gridColumn: "1 / -1" }}>
              <span className="muted">Filtr bo‘yicha talaba topilmadi.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
