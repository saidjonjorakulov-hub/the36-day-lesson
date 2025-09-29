// src/ui/FX.js
export function confettiBurst(opts = {}) {
  const {
    count = 28,
    emojis = ["✨","🎉","⭐","🥳","🏆"],
    duration = 1100
  } = opts;

  const root = document.createElement("div");
  root.className = "fx-root";
  document.body.appendChild(root);

  for (let i = 0; i < count; i++) {
    const s = document.createElement("span");
    s.className = "fx-particle";
    s.textContent = emojis[(Math.random() * emojis.length) | 0];

    // random tarqalish
    const dx = (Math.random() * 2 - 1) * 160;       // -160..160px
    const dy = - (60 + Math.random() * 180);        // yuqoriga
    const rot = (Math.random() * 360) | 0;          // 0..360 deg
    const dur = 0.8 + Math.random() * 0.7;          // 0.8..1.5s
    const size = 18 + Math.random() * 10;           // 18..28px

    s.style.setProperty("--dx", dx + "px");
    s.style.setProperty("--dy", dy + "px");
    s.style.setProperty("--rot", rot + "deg");
    s.style.setProperty("--dur", dur + "s");
    s.style.setProperty("--fs", size + "px");

    root.appendChild(s);
  }

  setTimeout(() => {
    root.remove();
  }, duration);
}
