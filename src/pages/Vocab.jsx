// src/pages/Vocab.jsx
import { useMemo, useState } from "react";
import { useStore } from "../context/Store.jsx";
import { confettiBurst } from "../ui/FX.js"; // avval qo'shgan bo'lsang ishlaydi

/* helpers */
const shuffle = (arr) => arr.slice().sort(() => Math.random() - 0.5);
const sampleN = (arr, n) => shuffle(arr).slice(0, Math.min(n, arr.length));

/* TTS */
function speak(text) {
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {}
}

export default function Vocab() {
  const { data, addVocab, toggleLearned, incScore } = useStore();
  const students = data.students.slice().sort((a,b)=>a.name.localeCompare(b.name));

  const [studentId, setStudentId] = useState(students[0]?.id || "");
  const student = data.students.find(s=>s.id===studentId) || null;
  const group   = student ? data.groups.find(g=>g.id===student.groupId) : null;
  const teacher = group ? data.teachers.find(t=>t.id===group.teacherId) : null;

  const vocabs = useMemo(()=> student ? student.vocab.slice() : [], [student]);
  const learnedCount   = useMemo(()=> vocabs.filter(v=>v.learned).length, [vocabs]);
  const totalCount     = vocabs.length;
  const unlearnedCount = totalCount - learnedCount;
  const pct            = totalCount ? Math.round((learnedCount/totalCount)*100) : 0;

  // Add single
  const [word, setWord] = useState("");
  const [meaning, setMeaning] = useState("");
  const handleAdd = () => {
    if (!studentId || !word.trim() || !meaning.trim()) return;
    addVocab(studentId, { word, meaning });
    setWord(""); setMeaning("");
  };

  // Bulk add
  const [bulk, setBulk] = useState("");
  const addBulk = () => {
    if (!student) return;
    const lines = bulk.split("\n").map(l=>l.trim()).filter(Boolean);
    let added = 0;
    lines.forEach(line=>{
      let w="",m="";
      if (line.includes(" - ")) [w,m] = line.split(" - ");
      else if (line.includes(",")) [w,m] = line.split(",");
      if (w && m) { addVocab(student.id, { word:w.trim(), meaning:m.trim() }); added++; }
    });
    if (added) alert(`${added} ta so‘z qo‘shildi ✅`);
    setBulk("");
  };

  /* === QUIZ state === */
  const [quizOn, setQuizOn] = useState(false);
  const [mode, setMode] = useState("mc");        // "mc" | "typing"
  const [qCount, setQCount] = useState(5);
  const [useOnlyUnlearned, setUseOnlyUnlearned] = useState(true);
  const [deck, setDeck] = useState([]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState(null);
  const [showAns, setShowAns] = useState(false);
  const [correctIds, setCorrectIds] = useState([]);
  const [wrongList, setWrongList] = useState([]);
  const current = deck[idx];

  const canStart = student && vocabs.length >= 3;

  const startQuiz = () => {
    if (!canStart) return;
    const pool = useOnlyUnlearned ? vocabs.filter(v=>!v.learned) : vocabs;
    const base = pool.length >= qCount ? pool : vocabs;
    const chosen = sampleN(base, qCount);
    setDeck(chosen);
    setIdx(0); setScore(0); setPicked(null); setShowAns(false);
    setCorrectIds([]); setWrongList([]); setQuizOn(true);
    confettiBurst?.({ count: 12, emojis: ["✨","⭐"] });
  };

  const options = useMemo(()=>{
    if (!current || !student) return [];
    const others = vocabs.filter(v=>v.id!==current.id);
    const wrongs = sampleN(others, 3);
    return mode==="mc" ? shuffle([current.meaning, ...wrongs.map(w=>w.meaning)]) : [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, mode, studentId, deck]);

  const correctValue = current ? current.meaning : "";
  const winFx = () => confettiBurst?.({ count: 18, emojis: ["✨","🎉","⭐"] });

  const choose = (val) => {
    if (showAns) return;
    setPicked(val);
    const ok = val === correctValue;
    setShowAns(true);
    if (ok) { setScore(s=>s+1); setCorrectIds(ids=> ids.includes(current.id)?ids:[...ids,current.id]); winFx(); }
    else { setWrongList(list=>[...list,{ q: current.word, correct: correctValue, chosen: val }]); }
  };

  // Typing mode
  const [typed, setTyped] = useState("");
  const submitTyped = () => {
    if (!current || showAns) return;
    const ok = typed.trim().toLowerCase() === correctValue.trim().toLowerCase();
    setPicked(typed); setShowAns(true);
    if (ok) { setScore(s=>s+1); setCorrectIds(ids=> ids.includes(current.id)?ids:[...ids,current.id]); winFx(); }
    else { setWrongList(list=>[...list,{ q: current.word, correct: correctValue, chosen: typed }]); }
  };

  const next = () => {
    if (idx+1>=deck.length) { setQuizOn(false); return; }
    setIdx(i=>i+1); setPicked(null); setShowAns(false); setTyped("");
  };

  const markCorrectAsLearned = () => {
    if (!student) return;
    correctIds.forEach(id=>{
      const v = student.vocab.find(x=>x.id===id);
      if (v && !v.learned) toggleLearned(student.id, id);
    });
    alert("To‘g‘ri javob berilgan so‘zlar Learned ✅");
  };

  const reward = () => {
    if (!student) return;
    const delta = score * 2; // har to‘g‘ri = +2 pts
    if (delta>0) {
      incScore(student.id, delta);
      confettiBurst?.({ count: 48, emojis:["🏆","🎉","✨","⭐","🥳"] });
      alert(`Mukofot: +${delta} pts ✅`);
    }
  };

  // CSV
  const exportCSV = () => {
    if (!student) return;
    const rows = [["word","meaning","learned"], ...student.vocab.map(v=>[v.word,v.meaning,v.learned?"1":"0"])];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], {type:"text/csv"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${student.name}-vocab.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const importCSV = async (e) => {
    const file = e.target.files?.[0]; if (!file || !student) return;
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(Boolean);
      lines.slice(1).forEach(line=>{
        const cells = line.split(",").map(s=>s.replace(/^"|"$/g,"").replace(/""/g,'"'));
        const [w,m] = cells;
        if (w && m) addVocab(student.id, { word:w.trim(), meaning:m.trim() });
      });
      alert("Import OK ✅");
    } catch { alert("CSV o‘qishda xatolik"); }
    e.target.value = "";
  };

  /* ===== Flashcards (mini) ===== */
  const [flash, setFlash] = useState([]);
  const [flipped, setFlipped] = useState({});
  const startFlash = () => {
    if (!student || vocabs.length<1) return;
    setFlash(sampleN(vocabs, Math.min(8, vocabs.length)));
    setFlipped({});
  };
  const toggleFlip = (id) => setFlipped(f => ({...f, [id]: !f[id]}));

  return (
    <div className="page">
      <h1>Vocabulary</h1>

      {/* 1) Student + avatar */}
      <section className="card">
        <h2 style={{marginTop:0}}>1) Student</h2>
        <div className="row" style={{ gap:10, alignItems:"center", flexWrap:"wrap" }}>
          <select value={studentId} onChange={(e)=>setStudentId(e.target.value)}>
            <option value="">Student…</option>
            {students.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          {student && (
            <div className="studentCard" style={{flex:1, minWidth:280}}>
              <img key={studentId} src={student.avatar} alt="av" className="studentCard-av" />
              <div className="studentCard-meta">
                <div className="studentCard-name">{student.name}</div>
                <div className="muted" style={{fontSize:12}}>
                  {group?.name || "—"} • {group?.level || "—"} • Teacher: <strong>{teacher?.name || "—"}</strong>
                </div>
                <div className="row" style={{gap:6, marginTop:6, flexWrap:"wrap"}}>
                  <span className="pill">Total {totalCount}</span>
                  <span className="pill">Learned {learnedCount}</span>
                  <span className="pill">Unlearned {unlearnedCount}</span>
                </div>
              </div>
              <div style={{minWidth:160}}>
                <div className="muted" style={{ marginBottom:6 }}>Mastery</div>
                <div className="progress">
                  <div className="bar" style={{ width:`${pct}%` }} />
                  <span className="pct">{pct}%</span>
                </div>
              </div>
            </div>
          )}

          {student && (
            <div className="row" style={{gap:8}}>
              <button onClick={exportCSV}>Export CSV</button>
              <label style={{display:"inline-flex",alignItems:"center",gap:6}}>
                <input type="file" accept=".csv" style={{display:"none"}} onChange={importCSV} id="csvImport"/>
                <span onClick={()=>document.getElementById("csvImport").click()} className="btn-like">Import CSV</span>
              </label>
            </div>
          )}
        </div>
      </section>

      {/* 2) Practice (KO'CHIRILDI) */}
      <section className="card">
        <h2 style={{marginTop:0}}>2) Practice (5–7 savol)</h2>
        <div className="row" style={{ gap:8, flexWrap:"wrap" }}>
          <label className="muted" style={{ display:"inline-flex", alignItems:"center", gap:6 }}>
            Count
            <select value={qCount} onChange={(e)=>setQCount(Number(e.target.value))}>
              {[5,6,7].map(n=><option key={n} value={n}>{n}</option>)}
            </select>
          </label>

          <div className="seg">
            <button className={mode==="mc" ? "seg-btn active":"seg-btn"} onClick={()=>setMode("mc")}>Multiple choice</button>
            <button className={mode==="typing" ? "seg-btn active":"seg-btn"} onClick={()=>setMode("typing")}>Typing</button>
          </div>

          <label className="muted" style={{ display:"inline-flex", alignItems:"center", gap:6 }}>
            <input type="checkbox" checked={useOnlyUnlearned} onChange={(e)=>setUseOnlyUnlearned(e.target.checked)} />
            Only unlearned
          </label>

          <button onClick={startQuiz} disabled={!canStart}>Start quiz</button>
          {!canStart && <span className="muted">Kamida 3 ta so‘z kerak.</span>}
        </div>

        {quizOn && current && (
          <div className="quiz">
            <div className="quiz-top">
              <div className="pill">Q {idx+1}/{deck.length}</div>
              <div className="pill">Score: {score}</div>
            </div>

            <div className="quiz-q">
              <button className="tts" title="Play" onClick={()=>speak(current.word)}>🔊</button>
              {current.word}
            </div>

            {mode==="mc" ? (
              <div className="quiz-grid">
                {options.map((opt, i)=> {
                  const isCorrect = showAns && opt===correctValue;
                  const isWrong   = showAns && picked===opt && opt!==correctValue;
                  return (
                    <button
                      key={i}
                      className={`quiz-opt ${isCorrect ? "ok":""} ${isWrong ? "bad":""}`}
                      onClick={()=>choose(opt)}
                      disabled={showAns}
                    >
                      <span>{opt}</span>
                      <button className="opt-tts" onClick={(e)=>{e.stopPropagation(); speak(opt);}} title="Play">🔊</button>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="typing-wrap">
                <input
                  className="typing-input"
                  placeholder="Type the meaning…"
                  value={typed}
                  onChange={(e)=>setTyped(e.target.value)}
                  onKeyDown={(e)=> e.key==="Enter" ? submitTyped() : null}
                  disabled={showAns}
                />
                <button onClick={submitTyped} disabled={showAns || !typed.trim()}>Check</button>
              </div>
            )}

            <div className="row" style={{ justifyContent:"space-between", marginTop:8 }}>
              <div className="muted">
                {showAns ? (
                  (picked?.toString().trim().toLowerCase() === correctValue.trim().toLowerCase())
                    ? "✅ To‘g‘ri!"
                    : `❌ To‘g‘ri javob: ${correctValue}`
                ) : "Javob bering"}
              </div>
              <div><button onClick={next}>{idx+1>=deck.length ? "Finish" : "Next"}</button></div>
            </div>
          </div>
        )}

        {!quizOn && deck.length>0 && !current && (
          <div className="quiz-res">
            <h3 style={{margin:"6px 0 6px"}}>Natija</h3>
            <div className="pill">Score: {score} / {deck.length}</div>

            {!!wrongList.length && (
              <div style={{marginTop:10}}>
                <div style={{fontWeight:700, marginBottom:6}}>Xatolar</div>
                <ul className="list">
                  {wrongList.map((w,i)=>(
                    <li key={i}>
                      <strong>{w.q}</strong> → <em>{w.correct}</em>
                      <span className="muted"> (siz: {w.chosen})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="row" style={{ gap:8, marginTop:10, flexWrap:"wrap" }}>
              <button onClick={markCorrectAsLearned} disabled={correctIds.length===0}>Correct’larni Learned qilish</button>
              <button onClick={reward} disabled={score===0}>Mukofot berish (+2/har to‘g‘ri)</button>
              <button onClick={()=>{ setDeck([]); setCorrectIds([]); setWrongList([]); }}>Yopish</button>
              <button onClick={startQuiz}>Qayta boshlash</button>
            </div>
          </div>
        )}
      </section>

      {/* 3) Yangi so'z qo'shish (endi uchinchi) */}
      <section className="card">
        <h2 style={{marginTop:0}}>3) Yangi so‘z qo‘shish</h2>
        <div className="row" style={{ gap:8, flexWrap:"wrap" }}>
          <input value={word} onChange={(e)=>setWord(e.target.value)} placeholder="word (EN)" />
          <input value={meaning} onChange={(e)=>setMeaning(e.target.value)} placeholder="meaning (UZ/RU/EN…)" />
          <button disabled={!studentId || !word.trim() || !meaning.trim()} onClick={handleAdd}>Add</button>
        </div>

        <details style={{marginTop:10}}>
          <summary className="muted">Bulk add (har qatorda: <em>word - meaning</em> yoki <em>word,meaning</em>)</summary>
          <div className="row" style={{gap:8, marginTop:8}}>
            <textarea rows={4} value={bulk} onChange={(e)=>setBulk(e.target.value)} placeholder={`apple - olma\nbook - kitob`} style={{flex:1}}/>
            <button onClick={addBulk} disabled={!studentId || !bulk.trim()}>Add list</button>
          </div>
        </details>
      </section>

      {/* 4) Flashcards (to'rtinchi) */}
      <section className="card">
        <h2 style={{marginTop:0}}>4) Flashcards (beta)</h2>
        <div className="row" style={{gap:8, flexWrap:"wrap"}}>
          <button onClick={startFlash} disabled={!student || !vocabs.length}>Shuffle 8</button>
          <span className="muted">Kartani bosing → o‘giriladi. 🔊 bosib o‘qitish mumkin.</span>
        </div>
        <div className="flash-grid" style={{marginTop:10}}>
          {flash.map(v=>(
            <div key={v.id} className={`flip ${flipped[v.id] ? "show":""}`} onClick={()=>toggleFlip(v.id)}>
              <div className="flip-inner">
                <div className="flip-face flip-front">
                  <button className="tts small" title="Play" onClick={(e)=>{e.stopPropagation(); speak(v.word);}}>🔊</button>
                  {v.word}
                </div>
                <div className="flip-face flip-back">
                  <button className="tts small" title="Play" onClick={(e)=>{e.stopPropagation(); speak(v.meaning);}}>🔊</button>
                  {v.meaning}
                </div>
              </div>
            </div>
          ))}
          {!flash.length && <div className="muted">Hali boshlanmadi.</div>}
        </div>
      </section>
    </div>
  );
}

