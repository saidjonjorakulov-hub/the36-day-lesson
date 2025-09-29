// src/store.js

function pickAvatar(gender) {
  const pool =
    gender === "female"
      ? ["girl1.png", "girl2.png"]
      : ["boy1.png", "boy2.png"];
  return pool[Math.floor(Math.random() * pool.length)];
}

export const groups = [
  {
    id: "g1",
    teacher: "Mr. Smith",
    groupName: "IELTS Beginners (A1)",
    students: [
      { id: "s1", name: "Ali", gender: "male"   },
      { id: "s2", name: "Malika", gender: "female" },
    ],
  },
  {
    id: "g2",
    teacher: "Ms. Brown",
    groupName: "IELTS Pre-Intermediate (A2)",
    students: [
      { id: "s3", name: "Sardor", gender: "male"   },
      { id: "s4", name: "Aziza",  gender: "female" },
    ],
  },
];

groups.forEach(g => {
  g.students = g.students.map(s => ({
    ...s,
    avatar: pickAvatar(s.gender), // masalan "boy1.png"
  }));
});

