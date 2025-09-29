// src/pages/Setup.jsx
import { useMemo, useState } from "react";
import { useStore } from "../context/Store.jsx";

function BackupBar() {
  const { data, replaceAll, clearAll } = useStore();

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0,19).replace(/[:T]/g,"-");
    a.href = url;
    a.download = `the36-backup-${stamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      replaceAll(json);
      alert("Import OK ✅");
    } catch (err) {
      console.error(err);
      alert("Import xato: JSON formatini tekshiring.");
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div className="card" style={{ display:"flex", gap:10, alignItems:"center", justifyContent:"space-between" }}>
      <div>
        <div style={{ fontWeight:700, marginBottom:4 }}>Backup</div>
        <div className="muted" style={{ fontSize:12 }}>
          Ma’lumotlar: teachers, groups, students (PIN bilan), score, streak, vocab.
        </div>
      </div>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        <button onClick={handleExport}>Export JSON</button>
        <label style={{ display:"inline-flex", alignItems:"center", gap:8 }}>
          <input type="file" accept="application/json" onChange={handleImport} style={{ display:"none" }} id="import-json" />
          <span onClick={() => document.getElementById("import-json").click()} style={{ background:"#0c0f12", border:"1px solid #1f242a", borderRadius:10, padding:"8px 10px", cursor:"pointer" }}>
            Import JSON
          </span>
        </label>
        <button className="danger" onClick={clearAll}>Clear ALL</button>
      </div>
    </div>
  );
}

export default function Setup() {
  const { data, addTeacher, addGroup, addStudent, AVATARS, setParentPin } = useStore();

  // Teacher
  const [teacherName, setTeacherName] = useState("");

  // Group
  const [groupName, setGroupName] = useState("");
  const [level, setLevel] = useState("Beginner");
  const [teacherId, setTeacherId] = useState("");

  // Student
  const [studentName, setStudentName] = useState("");
  const [groupId, setGroupId] = useState("");
  const [avatar, setAvatar] = useState("");

  const teachersSorted = useMemo(
    () => data.teachers.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [data.teachers]
  );
  const groupsSorted = useMemo(
    () => data.groups.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [data.groups]
  );

  const askSetPin = (studentId, currentPin) => {
    const hint = currentPin ? `(hozirgi: ${"*".repeat(currentPin.length)}) ` : "";
    const v = prompt(`PIN (4–6 raqam) ni kiriting yoki bo'sh qoldiring: ${hint}`, "");
    if (v === null) return; // bekor
    const pin = (v || "").trim();
    if (pin === "") {
      setParentPin(studentId, "");
      alert("PIN olib tashlandi.");
      return;
    }
    if (!/^\d{4,6}$/.test(pin)) {
      alert("PIN 4–6 xonali faqat raqam bo‘lishi kerak.");
      return;
    }
    setParentPin(studentId, pin);
    alert("PIN o‘rnatildi ✅");
  };

  return (
    <div className="page">
      <h1>Setup</h1>

      <BackupBar />

      {/* 1) Teacher */}
      <section className="card">
        <h2>1) O‘qituvchi qo‘shish</h2>
        <div className="row">
          <input value={teacherName} onChange={(e) => setTeacherName(e.target.value)} placeholder="Teacher name" />
          <button onClick={() => { if (teacherName.trim()) { addTeacher(teacherName); setTeacherName(""); } }}>Add</button>
        </div>
        <ul className="list" style={{ marginTop: 8 }}>
          {teachersSorted.map((t) => (<li key={t.id}>{t.name}</li>))}
          {!teachersSorted.length && <li className="muted">Hali o‘qituvchi yo‘q</li>}
        </ul>
      </section>

      {/* 2) Group */}
      <section className="card">
        <h2>2) Guruh qo‘shish</h2>
        <div className="row">
          <input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Group name" />
          <select value={level} onChange={(e) => setLevel(e.target.value)}>
            {["Beginner","Elementary","Pre-Intermediate","Intermediate","Upper-Intermediate","IELTS"].map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
            <option value="">Teacher…</option>
            {teachersSorted.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
          </select>
          <button onClick={() => { if (groupName.trim() && teacherId) { addGroup({ name: groupName, level, teacherId }); setGroupName(""); } }}>Add</button>
        </div>
        <ul className="list" style={{ marginTop: 8 }}>
          {groupsSorted.map((g) => {
            const teacher = data.teachers.find((t) => t.id === g.teacherId);
            return <li key={g.id}>{g.name} — <em>{g.level}</em> — <strong>{teacher?.name || "—"}</strong></li>;
          })}
          {!groupsSorted.length && <li className="muted">Hali guruh yo‘q</li>}
        </ul>
      </section>

      {/* 3) Student */}
      <section className="card">
        <h2>3) O‘quvchi qo‘shish</h2>
        <div className="row">
          <input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Student name" />
          <select value={groupId} onChange={(e) => setGroupId(e.target.value)}>
            <option value="">Group…</option>
            {groupsSorted.map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}
          </select>
          <select value={avatar} onChange={(e) => setAvatar(e.target.value)}>
            <option value="">Random avatar</option>
            {AVATARS.map((a) => (<option key={a} value={a}>{a.split("/").pop()}</option>))}
          </select>
          <button onClick={() => { if (studentName.trim() && groupId) { addStudent({ name: studentName, groupId, avatar: avatar || undefined }); setStudentName(""); } }}>Add</button>
        </div>

        <div className="grid" style={{ marginTop: 10 }}>
          {data.students.map((s) => {
            const g = data.groups.find((x) => x.id === s.groupId);
            const hasPin = !!s.parentPin;
            return (
              <div key={s.id} className="miniCard" style={{ display: "flex", gap: 10, alignItems: "center", background: "#0f1317", border: "1px solid #1c2228", borderRadius: 12, padding: 10 }}>
                <img src={s.avatar} alt="av" width={48} height={48} style={{ borderRadius: "50%" }} />
                <div style={{ flex: 1 }}>
                  <div className="title" style={{ fontWeight: 600 }}>{s.name}</div>
                  <div className="muted" style={{ opacity: .7, fontSize: 12 }}>{g?.name || "—"}</div>
                </div>
                <span className="pill" title={hasPin ? "PIN o‘rnatilgan" : "PIN yo‘q"} style={{ background: hasPin ? "#11251a" : "#111820", borderColor: hasPin ? "#224d33" : "#22303a" }}>
                  {hasPin ? "PIN: ••••" : "PIN: —"}
                </span>
                <button onClick={() => askSetPin(s.id, s.parentPin)}>{hasPin ? "Change PIN" : "Set PIN"}</button>
              </div>
            );
          })}
          {!data.students.length && <div className="muted" style={{ padding: 8 }}>Hali o‘quvchi yo‘q</div>}
        </div>
      </section>
    </div>
  );
}
