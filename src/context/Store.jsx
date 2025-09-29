// src/context/Store.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const LS_KEY = "the36-store-v1";

const AVATARS = [
  "/avatars/boy1.png",
  "/avatars/boy2.png",
  "/avatars/girl1.png",
  "/avatars/girl2.png",
];

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const defaultSettings = {
  scoreMax: 100,
  sessionScore: 10,
};

// local YYYY-MM-DD (brauzer timezone)
export const localDateKey = (d = new Date()) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).toLocaleDateString("en-CA");

// Haftaning boshlanishi (Dushanba) — Date obyektini qaytaradi
export const weekStart = (d = new Date()) => {
  const dd = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = dd.getDay(); // 0 Yakshanba, 1 Dushanba, ...
  const diff = (day === 0 ? -6 : 1 - day); // Dushanbaga qaytish
  dd.setDate(dd.getDate() + diff);
  dd.setHours(0, 0, 0, 0);
  return dd;
};

// Sana ushbu haftada ekanini tekshirish (Dushanba–Yakshanba)
export const isSameWeek = (a, b = new Date()) => {
  const ws = weekStart(b);
  const we = new Date(ws);
  we.setDate(ws.getDate() + 7); // keyingi dushanbagacha
  const da = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  return da >= ws && da < we;
};

/** Asosiy storage shakli */
const initialData = {
  settings: defaultSettings,
  teachers: [],
  groups: [],
  students: [],
  // ✅ Kunlik ma’lumotlar (attendance + note + homework)
  // daily[dateKey][groupId] = { attendance: { [studentId]: boolean }, note: string, homework: string }
  daily: {},
  // ✅ Har kuni qo‘shilgan/ayrilgan ball yig‘ilishi (leaderboard week uchun)
  // dailyScore[dateKey] = { [studentId]: deltaScore }
  dailyScore: {},
};

const StoreCtx = createContext();
export const useStore = () => useContext(StoreCtx);

export function StoreProvider({ children }) {
  const [data, setData] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      const parsed = raw ? JSON.parse(raw) : initialData;
      if (!parsed.settings) parsed.settings = { ...defaultSettings };
      if (!parsed.daily) parsed.daily = {};
      if (!parsed.dailyScore) parsed.dailyScore = {};
      return parsed;
    } catch {
      return initialData;
    }
  });

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  }, [data]);

  // ===== SETTINGS =====
  const setScoreMax = (val) => {
    setData(d => ({ ...d, settings: { ...d.settings, scoreMax: Number(val) || defaultSettings.scoreMax } }));
  };
  const setSessionScore = (val) => {
    setData(d => ({ ...d, settings: { ...d.settings, sessionScore: Number(val) || defaultSettings.sessionScore } }));
  };
  const resetSettings = () => setData(d => ({ ...d, settings: { ...defaultSettings } }));

  // ===== CRUD =====
  const addTeacher = (name) => {
    const t = { id: uid(), name: name.trim() };
    setData((d) => ({ ...d, teachers: [...d.teachers, t] }));
    return t.id;
  };

  const addGroup = ({ name, level, teacherId }) => {
    const g = { id: uid(), name: name.trim(), level, teacherId, studentIds: [] };
    setData((d) => ({ ...d, groups: [...d.groups, g] }));
    return g.id;
  };

  const addStudent = ({ name, groupId, avatar }) => {
    const s = {
      id: uid(),
      name: name.trim(),
      groupId,
      avatar: avatar || AVATARS[Math.floor(Math.random() * AVATARS.length)],
      score: 0,
      streak: 0,
      parentPin: "",
      vocab: [],
    };
    setData((d) => {
      const groups = d.groups.map((g) =>
        g.id === groupId ? { ...g, studentIds: [...g.studentIds, s.id] } : g
      );
      return { ...d, groups, students: [...d.students, s] };
    });
    return s.id;
  };

  // ✅ Haftalik uchun kunlik delta’ni log qilamiz
  const logDailyScore = (studentId, delta, dateKey = localDateKey()) => {
    setData((d) => {
      const dailyScore = { ...(d.dailyScore || {}) };
      const bucket = { ...(dailyScore[dateKey] || {}) };
      bucket[studentId] = (bucket[studentId] || 0) + delta;
      dailyScore[dateKey] = bucket;
      return { ...d, dailyScore };
    });
  };

  const incScore = (studentId, delta = 5) => {
    if (!Number.isFinite(delta) || delta === 0) return;
    setData((d) => ({
      ...d,
      students: d.students.map((s) =>
        s.id === studentId ? { ...s, score: Math.max(0, s.score + delta) } : s
      ),
    }));
    // ✅ haftalik yig‘im uchun log
    logDailyScore(studentId, delta);
  };

  const incStreak = (studentId, delta = 1) => {
    setData((d) => ({
      ...d,
      students: d.students.map((s) =>
        s.id === studentId ? { ...s, streak: s.streak + delta } : s
      ),
    }));
  };

  const addVocab = (studentId, { word, meaning }) => {
    setData((d) => ({
      ...d,
      students: d.students.map((s) =>
        s.id === studentId
          ? {
              ...s,
              vocab: [
                ...s.vocab,
                { id: uid(), word: word.trim(), meaning: meaning.trim(), learned: false },
              ],
            }
          : s
      ),
    }));
  };

  const toggleLearned = (studentId, vocabId) => {
    setData((d) => ({
      ...d,
      students: d.students.map((s) =>
        s.id === studentId
          ? {
              ...s,
              vocab: s.vocab.map((v) =>
                v.id === vocabId ? { ...v, learned: !v.learned } : v
              ),
            }
          : s
      ),
    }));
  };

  const setParentPin = (studentId, pin) => {
    setData((d) => ({
      ...d,
      students: d.students.map((s) =>
        s.id === studentId ? { ...s, parentPin: (pin || "").trim() } : s
      ),
    }));
  };

  // ===== Attendance + Note + Homework (kunlik) =====
  const ensureDayGroup = (dateKey, groupId) => {
    return (draft) => {
      const daily = { ...(draft.daily || {}) };
      const day = { ...(daily[dateKey] || {}) };
      const group = { attendance: {}, note: "", homework: "", ...(day[groupId] || {}) };
      day[groupId] = group;
      daily[dateKey] = day;
      return { ...draft, daily };
    };
  };

  const toggleAttendance = (groupId, studentId, dateKey = localDateKey()) => {
    setData((d) => {
      d = ensureDayGroup(dateKey, groupId)(d);
      const group = d.daily[dateKey][groupId];
      const cur = !!group.attendance[studentId];
      group.attendance = { ...group.attendance, [studentId]: !cur };
      return { ...d };
    });
  };

  const setGroupNote = (groupId, text, dateKey = localDateKey()) => {
    setData((d) => {
      d = ensureDayGroup(dateKey, groupId)(d);
      d.daily[dateKey][groupId].note = text;
      return { ...d };
    });
  };

  const setGroupHomework = (groupId, text, dateKey = localDateKey()) => {
    setData((d) => {
      d = ensureDayGroup(dateKey, groupId)(d);
      d.daily[dateKey][groupId].homework = text;
      return { ...d };
    });
  };

  const clearDayGroup = (groupId, dateKey = localDateKey()) => {
    setData((d) => {
      if (!d.daily?.[dateKey]?.[groupId]) return d;
      const day = { ...d.daily[dateKey] };
      delete day[groupId];
      const daily = { ...d.daily, [dateKey]: day };
      return { ...d, daily };
    });
  };

  const clearAll = () => setData(initialData);

  // ===== Backup/Restore =====
  const replaceAll = (next) => {
    if (!next || typeof next !== "object") throw new Error("Invalid data");
    if (!Array.isArray(next.teachers) || !Array.isArray(next.groups) || !Array.isArray(next.students)) {
      throw new Error("Invalid data shape");
    }
    const students = next.students.map(s => ({ parentPin: "", ...s }));
    const settings = next.settings ? {
      scoreMax: Number(next.settings.scoreMax) || defaultSettings.scoreMax,
      sessionScore: Number(next.settings.sessionScore) || defaultSettings.sessionScore,
    } : { ...defaultSettings };
    const daily = next.daily && typeof next.daily === "object" ? next.daily : {};
    const dailyScore = next.dailyScore && typeof next.dailyScore === "object" ? next.dailyScore : {};
    setData({
      settings,
      teachers: next.teachers,
      groups: next.groups,
      students,
      daily,
      dailyScore,
    });
  };

  const value = useMemo(
    () => ({
      data,
      // settings
      setScoreMax,
      setSessionScore,
      resetSettings,
      // crud
      addTeacher,
      addGroup,
      addStudent,
      incScore,
      incStreak,
      addVocab,
      toggleLearned,
      setParentPin,
      // daily (attendance, notes, homework)
      toggleAttendance,
      setGroupNote,
      setGroupHomework,
      clearDayGroup,
      // helpers
      localDateKey,
      weekStart,
      isSameWeek,
      // general
      clearAll,
      replaceAll,
      AVATARS,
    }),
    [data]
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}
