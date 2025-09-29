// src/pages/ParentView.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useStore } from "../context/Store.jsx";
import StudentProgram from "../ui/StudentProgram.jsx"; // ✅ Yangi kalendar

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

export default function ParentView() {
  const { studentId } = useParams();
  const { data, localDateKey } = useStore();
  const { scoreMax } = data.settings;

  const student = data.students.find((s) => s.id === studentId);
  const group = student ? data.groups.find((g) => g.id === student.groupId) : null;
  const teacher = group ? data.teachers.find((t) => t.id === group.teacherId) : null;

  const [authed, setAuthed] = useState(false);
  const [pinInput, setPinInput] = useState("");

  useEffect(() => {
    if (!student) return;
    if (!student.parentPin) { setAuthed(true); return; }
    const ok = sessionStorage.getItem(`parent_auth_${student.id}`) === "1";
    setAuthed(!!ok);
  }, [student]);

  const handleCheck = (e) => {
    e?.preventDefault?.();
    if (!student) return;
    if ((student.parentPin || "") === "") { setAuthed(true); return; }
    if (pinInput.trim() === student.parentPin) {
      sessionStorage.setItem(`parent_auth_${student.id}`, "1");
      setAuthed(true);
      setPinInput("");
    } else {
      alert("PIN noto‘g‘ri. Qayta urinib ko‘ring.");
    }
  };

  const learned = useMemo(() => student?.vocab.filter(v => v.learned).length ?? 0, [student]);
  const total = student?.vocab.length ?? 0;
  const pct = toPercent(student?.score ?? 0, scoreMax);

  if (!student) {
    return (
      <div className="page">
        <h1>Student not found</h1>
        <div className="card">
          <p className="muted">Link xato yoki maʼlumot o‘chirilgan bo‘lishi mumkin.</p>
          <Link className="link" to="/">← Home</Link>
        </div>
      </div>
    );
  }

  const dateKey = localDateKey();
  const dayGroup = group ? data.daily?.[dateKey]?.[group.id] : null;
  const todayNote = dayGroup?.note || "";
  const todayHomework = dayGroup?.homework || "";

  const shareUrl = `${location.origin}/p/${student.id}`;
  const [qrSize, setQrSize] = useState(200);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(shareUrl)}`;

  const copyLink = async () => { try { await navigator.clipboard.writeText(shareUrl); alert("Link nusxa olindi ✅"); } catch { prompt("Nusxa olish uchun linkni tanlang va Ctrl+C bosing:", shareUrl); } };
  const openQR = () => window.open(qrUrl, "_blank", "noopener,noreferrer");
  const printQR = () => {
    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) return openQR();
    w.document.write(`<html><head><title>QR — ${student.name}</title><style>body{font-family:system-ui;-apple-system,Segoe UI,Roboto,Inter,Arial,sans-serif;padding:20px}.box{text-align:center}.box h1{font-size:20px;margin:0 0 8px}.box p{margin:6px 0 12px;color:#333}img{width:${qrSize}px;height:${qrSize}px}</style></head><body onload="window.print();"><div class="box"><h1>${student.name} — Parent view</h1><p>${shareUrl}</p><img src="${qrUrl}" alt="QR"/></div></body></html>`);
    w.document.close();
  };

  if (!authed) {
    return (
      <div className="page">
        <h1>Parent view</h1>
        <div className="card" style={{ maxWidth: 420 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>{student.name}</div>
          <div className="muted" style={{ marginBottom: 10 }}>Ushbu sahifani ko‘rish uchun PIN kiriting.</div>
          <form className="row" onSubmit={handleCheck} style={{ gap: 8 }}>
            <input type="password" inputMode="numeric" pattern="\d{4,6}" placeholder="PIN (4–6 raqam)" value={pinInput} onChange={(e) => setPinInput(e.target.value)} />
            <button type="submit">Kirish</button>
          </form>
          <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>Eslatma: PIN o‘qituvchi tomonidan Setup sahifasida o‘rnatiladi.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Parent view</h1>

      <section className="card" style={{ display: "grid", gridTemplateColumns: "96px 1fr auto", gap: 16, alignItems: "center" }}>
        <img src={student.avatar} width={96} height={96} alt="avatar" style={{ borderRadius: "50%", border: "3px solid rgba(255,255,255,.12)" }} />
        <div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{student.name}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
            <span className="pill">{group?.name || "—"}</span>
            <span className="pill">{group?.level || "—"}</span>
            <span className="pill pill-muted">Teacher: {teacher?.name || "—"}</span>
          </div>
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", justifyContent:"flex-end" }}>
          <button onClick={copyLink}>Copy link</button>
        </div>
      </section>

      {/* Overall */}
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Overall progress</h2>
        <div className="row" style={{ gap: 16 }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div className="muted" style={{ marginBottom: 6 }}>Score → %</div>
            <Progress value={toPercent(student.score, scoreMax)} />
            <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
              SCORE_MAX = {scoreMax} / Current score = <strong>{student.score}</strong>
            </div>
          </div>
          <div style={{ minWidth: 160 }}>
            <div style={{ fontWeight: 700, fontSize: 18 }}>🔥 Streak</div>
            <div style={{ fontSize: 28 }}>{student.streak}</div>
            <div className="muted">Ketma-ket faol kunlar</div>
          </div>
          <div style={{ minWidth: 180 }}>
            <div style={{ fontWeight: 700, fontSize: 18 }}>📚 Vocabulary</div>
            <div style={{ fontSize: 28 }}>{learned} / {total}</div>
            <div className="muted">O‘rganilgan / jami so‘z</div>
          </div>
        </div>
      </section>

      {/* ✅ Program calendar — endi o'quvchi boshqaradi */}
      <StudentProgram studentId={student.id} />

      {/* Today’s note & homework (read-only) */}
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Today’s note & homework</h2>
        <div className="muted" style={{ marginBottom: 8 }}>{localDateKey()}</div>

        <div className="grid" style={{ gridTemplateColumns: "1fr", gap: 10 }}>
          <div className="panel">
            <div className="panel-title">Note</div>
            {todayNote ? <div className="panel-body">{todayNote}</div> : <div className="muted">Hozircha eslatma kiritilmagan.</div>}
          </div>

          <div className="panel">
            <div className="panel-title">Homework</div>
            {todayHomework ? <div className="panel-body">{todayHomework}</div> : <div className="muted">Bugungi uyga vazifa kiritilmagan.</div>}
          </div>
        </div>
      </section>

      {/* Share via QR */}
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Share via QR</h2>
        <div className="qrRow">
          <div className="qrBox"><img src={qrUrl} width={qrSize} height={qrSize} alt="QR" /></div>
          <div className="qrSide">
            <div className="muted" style={{ marginBottom: 6, wordBreak:"break-all" }}>{shareUrl}</div>
            <div className="row" style={{ gap: 8 }}>
              <button onClick={openQR}>Open QR</button>
              <button onClick={printQR}>Print</button>
            </div>
            <div style={{ marginTop: 10 }}>
              <label style={{ display:"inline-flex", alignItems:"center", gap:8 }}>
                <span className="muted">Size</span>
                <input type="range" min={120} max={480} step={20} value={qrSize} onChange={(e) => setQrSize(Number(e.target.value))} style={{ width: 180 }} />
                <span>{qrSize}px</span>
              </label>
            </div>
          </div>
        </div>
        <div className="muted" style={{ marginTop: 8, fontSize:12 }}>
          Eslatma: QR (api.qrserver.com) internetga bog‘liq. Bu sahifa read-only (kalendar bundan mustasno).
        </div>
      </section>
    </div>
  );
}
