/* =========================================================================
   breathe.  —  app logic (Eames / Maeda remix)
   Frame-accurate breathing engine. No build step, no dependencies.

   Pacing is physiologically load-bearing, so the engine is built for precision:
   a single performance.now() timeline, one requestAnimationFrame loop that
   derives everything (phase, scale, count, progress) from elapsed time, and
   drives the ring scale per frame with an eased curve. No CSS transitions
   (they lag and drift), no chained setTimeouts. Label, audio cue, haptic and
   ring scale all change on the same boundary frame.
   ========================================================================= */

/* ---------- geometric icon marks (Maeda playful, drawn in currentColor) ---- */
const M = (inner) =>
  `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">${inner}</svg>`;

const ICONS = {
  energy: M(`${Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4;
    const x1 = 24 + Math.cos(a) * 8, y1 = 24 + Math.sin(a) * 8;
    const x2 = 24 + Math.cos(a) * 17, y2 = 24 + Math.sin(a) * 17;
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>`;
  }).join("")}<circle cx="24" cy="24" r="3.4" fill="currentColor"/>`),
  creativity: M(`<circle cx="24" cy="24" r="14" stroke="currentColor" stroke-width="2" opacity="0.45"/>${[[18,18],[31,17],[33,27],[22,31],[15,26]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="2.5" fill="currentColor"/>`).join("")}`),
  balance: M(`<circle cx="19" cy="24" r="11" stroke="currentColor" stroke-width="2.2"/><circle cx="29" cy="24" r="11" stroke="currentColor" stroke-width="2.2"/>`),
  // box breathing -> a square
  focus: M(`<rect x="12" y="12" width="24" height="24" rx="3.5" stroke="currentColor" stroke-width="2.4"/><circle cx="24" cy="24" r="2.6" fill="currentColor"/>`),
  // extended exhale -> a releasing wave
  unwind: M(`<path d="M9 22c4-7 8-7 12 0s8 7 12 0" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M11 31c3.3-5 6.7-5 10 0s6.7 5 10 0" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.45"/>`),
  // physiological sigh -> double inhale (two stacked carets)
  reset: M(`<path d="M14 24l10-9 10 9" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 33l10-9 10 9" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.45"/>`),
  // 4-7-8 -> concentric ripple
  calm: M(`<circle cx="24" cy="24" r="17" stroke="currentColor" stroke-width="2" opacity="0.35"/><circle cx="24" cy="24" r="11" stroke="currentColor" stroke-width="2" opacity="0.6"/><circle cx="24" cy="24" r="5" stroke="currentColor" stroke-width="2"/><circle cx="24" cy="24" r="1.6" fill="currentColor"/>`),
  sleep: M(`<path d="M31 31a13 13 0 1 1-1-21 10.5 10.5 0 0 0 1 21z" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>`),
};

const ringsSVG = (stroke = "rgba(255,255,255,0.5)") => `
  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
    ${[92, 70, 48, 26].map((r) => `<circle cx="100" cy="100" r="${r}" fill="none" stroke="${stroke}" stroke-width="1.4"/>`).join("")}
    <circle cx="100" cy="100" r="5" fill="${stroke}"/>
  </svg>`;

const UI = {
  home: `<svg viewBox="0 0 24 24" fill="none"><path d="M4 11l8-7 8 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 10v9h12v-9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  explore: `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.8"/><path d="M15 9l-2.2 4.8L8 16l2.2-4.8z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" fill="none"/></svg>`,
  history: `<svg viewBox="0 0 24 24" fill="none"><path d="M5 5h11a3 3 0 0 1 3 3v11H8a3 3 0 0 1-3-3z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 9h6M9 13h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" width="22" height="22"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  sound: `<svg viewBox="0 0 24 24" fill="none" width="22" height="22"><path d="M4 9v6h4l5 4V5L8 9z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M16 9a4 4 0 0 1 0 6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  soundOff: `<svg viewBox="0 0 24 24" fill="none" width="22" height="22"><path d="M4 9v6h4l5 4V5L8 9z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M16 10l4 4M20 10l-4 4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  pause: `<svg viewBox="0 0 24 24" fill="none" width="26" height="26"><rect x="7" y="6" width="3.4" height="12" rx="1" fill="currentColor"/><rect x="13.6" y="6" width="3.4" height="12" rx="1" fill="currentColor"/></svg>`,
  play: `<svg viewBox="0 0 24 24" fill="none" width="26" height="26"><path d="M8 6l11 6-11 6z" fill="currentColor"/></svg>`,
  chev: `<svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  check: `<svg viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="30" stroke="rgba(255,255,255,0.9)" stroke-width="2"/><path d="M20 33l8 8 16-18" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

/* ---------- breathing patterns (research-backed; see project memory) --------
   phases: [label, seconds] with optional [, , scaleOverride] for fullness.
   labels: Inhale | Exhale | Hold | Top-up. unit: 'min' (timed) | 'breaths' (cycles).
   See breathe-pattern-spec for sourcing (HeartMath, Weil, Huberman, Breathwrk). */
const PATTERNS = [
  { id: "energy", name: "Energy", technique: "Energizing breath", group: "morning", icon: "energy", color: "#ec5a2e",
    desc: "A longer inhale to lift energy and alertness.",
    guidance: "Breathe in longer than you breathe out to raise alertness. Sit upright, and ease off if you feel light-headed.",
    caveat: "Best seated or lying down. Skip if pregnant or prone to dizziness.",
    phases: [["Inhale", 4], ["Exhale", 2]], unit: "min", options: [1, 2, 3], default: 2 },

  { id: "creativity", name: "Creativity", technique: "Open awareness", group: "morning", icon: "creativity", color: "#2e27e6",
    desc: "A spacious, even rhythm to open the mind.",
    guidance: "An even, spacious rhythm with gentle pauses. Let the mind wander and make connections.",
    phases: [["Inhale", 4], ["Hold", 2], ["Exhale", 6], ["Hold", 2]], unit: "min", options: [2, 4, 6], default: 4 },

  { id: "balance", name: "Balance", technique: "Coherence · 5.5 bpm", group: "anytime", icon: "balance", color: "#1f8e7d",
    desc: "Resonant breathing for calm, steady balance.",
    guidance: "Smooth and even, with no holds. Equal in and out at the body's resonant pace settles the nervous system and lifts heart-rate variability.",
    phases: [["Inhale", 5.5], ["Exhale", 5.5]], unit: "min", options: [2, 5, 10], default: 5 },

  { id: "focus", name: "Focus", technique: "Box breathing · 4-4-4-4", group: "anytime", icon: "focus", color: "#16161a",
    desc: "Equal box breathing to steady attention.",
    guidance: "Equal counts on all four sides of the box. Keep the holds relaxed, never strained.",
    phases: [["Inhale", 4], ["Hold", 4], ["Exhale", 4], ["Hold", 4]], unit: "min", options: [2, 4, 8], default: 4 },

  { id: "unwind", name: "Unwind", technique: "Extended exhale · 4-6", group: "anytime", icon: "unwind", color: "#c2562f",
    desc: "A longer exhale to gently let go.",
    guidance: "Let the out-breath be longer than the in-breath. Soften the jaw and shoulders as you exhale.",
    phases: [["Inhale", 4], ["Exhale", 6]], unit: "min", options: [2, 5, 10], default: 5 },

  { id: "reset", name: "Reset", technique: "Physiological sigh", group: "anytime", icon: "reset", color: "#2f8fb0",
    desc: "A double inhale and long exhale to reset fast.",
    guidance: "Inhale fully through the nose, then sip in a little more air, then a long, slow exhale through the mouth.",
    phases: [["Inhale", 2, 0.8], ["Top-up", 1, 1], ["Exhale", 6, 0.42]], unit: "min", options: [1, 3, 5], default: 3 },

  { id: "calm", name: "Calm", technique: "4-7-8 breath", group: "evening", icon: "calm", color: "#6a4a8c",
    desc: "Dr. Weil's relaxing breath for stress and sleep.",
    guidance: "Inhale quietly through the nose for four, hold for seven, then exhale through the mouth with a soft whoosh for eight. Four breaths is one round.",
    phases: [["Inhale", 4], ["Hold", 7], ["Exhale", 8]], unit: "breaths", options: [4, 8], default: 4 },

  { id: "sleep", name: "Sleep", technique: "Wind-down", group: "evening", icon: "sleep", color: "#2b2e6e",
    desc: "A strong exhale bias to drift toward rest.",
    guidance: "A long, slow exhale carries you toward sleep. Keep everything loose and let go.",
    phases: [["Inhale", 4], ["Hold", 2], ["Exhale", 8]], unit: "min", options: [3, 5, 10], default: 5 },
];
const byId = (id) => PATTERNS.find((p) => p.id === id);

/* ---------- persistent state ---------- */
const store = {
  get sessions() { try { return JSON.parse(localStorage.getItem("breathe.sessions") || "[]"); } catch { return []; } },
  set sessions(v) { localStorage.setItem("breathe.sessions", JSON.stringify(v)); },
  get sound() { return localStorage.getItem("breathe.sound") !== "off"; },
  set sound(v) { localStorage.setItem("breathe.sound", v ? "on" : "off"); },
  log(patternId, durationSec) { const s = this.sessions; s.push({ ts: Date.now(), patternId, durationSec }); this.sessions = s; },
};

/* ---------- derived stats ---------- */
function dayKey(ts) { const d = new Date(ts); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; }
function stats() {
  const s = store.sessions;
  const totalMin = Math.round(s.reduce((a, x) => a + x.durationSec, 0) / 60);
  const days = new Set(s.map((x) => dayKey(x.ts)));
  let streak = 0;
  const d = new Date();
  for (;;) {
    const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (days.has(k)) { streak++; d.setDate(d.getDate() - 1); }
    else if (streak === 0 && dayKey(Date.now()) === k) { d.setDate(d.getDate() - 1); }
    else break;
  }
  return { count: s.length, totalMin, streak, days };
}

/* ---------- audio cues ---------- */
let actx = null;
function tone(freq, dur = 0.5, vol = 0.05) {
  if (!store.sound) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === "suspended") actx.resume();
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = "sine"; o.frequency.value = freq;
    o.connect(g); g.connect(actx.destination);
    const t = actx.currentTime;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.15);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t); o.stop(t + dur + 0.05);
  } catch {}
}
const CUE = {
  Inhale: () => tone(396, 0.6),
  "Top-up": () => tone(528, 0.3, 0.04),
  Exhale: () => tone(264, 0.7),
  Hold: () => tone(330, 0.25, 0.03),
};

/* haptics: navigator.vibrate on Android; hidden <input switch> on iOS 17.4+ */
let hapticEl = null;
function haptic(times = 1) {
  if (!store.sound) return;
  if (navigator.vibrate) { try { navigator.vibrate(times > 1 ? [14, 50, 14, 50, 14].slice(0, times * 2 - 1) : 14); } catch {} return; }
  hapticEl = hapticEl || document.getElementById("haptic");
  if (hapticEl) for (let i = 0; i < times; i++) setTimeout(() => { try { hapticEl.click(); } catch {} }, i * 80);
}

/* ---------- easing ---------- */
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const easeInOutSine = (p) => 0.5 * (1 - Math.cos(Math.PI * p)); // smooth, symmetric breath curve

/* ---------- DOM helpers ---------- */
const app = document.getElementById("app");
const tabbar = document.getElementById("tabbar");
const h = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };

/* ======================= SCREENS ======================= */
let current = "home";

function render(route = current) {
  current = route;
  document.documentElement.style.removeProperty("--c");
  document.body.style.background = "var(--ground)";
  if (route === "home") app.replaceChildren(Home());
  if (route === "explore") app.replaceChildren(Explore());
  if (route === "history") app.replaceChildren(History());
  renderTabs();
  window.scrollTo(0, 0);
}

function renderTabs() {
  tabbar.hidden = false;
  const tab = (id, label, icon) => `<button class="tab" data-route="${id}" aria-current="${current === id}">${icon}<span>${label}</span></button>`;
  tabbar.innerHTML = tab("home", "Today", UI.home) + tab("explore", "Explore", UI.explore) + tab("history", "History", UI.history);
  tabbar.querySelectorAll(".tab").forEach((b) => b.addEventListener("click", () => render(b.dataset.route)));
}

const rhythm = (p) => p.phases.map(([, s]) => (Number.isInteger(s) ? s : s.toFixed(1))).join("-");

/* ----- Home ----- */
function Home() {
  const now = new Date();
  const hr = now.getHours();
  const part = hr < 12 ? "morning" : hr < 18 ? "afternoon" : "evening";
  const greet = hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening";
  const featured = part === "morning" ? byId("energy") : part === "evening" ? byId("sleep") : byId("balance");
  const st = stats();
  const dateStr = now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  const unit = (p) => (p.unit === "breaths" ? "breaths" : "min");
  const recSpec = `${featured.technique} · ${featured.default} ${unit(featured)}`;
  const status = st.streak > 0
    ? `${st.streak}-day streak · ${st.totalMin} min total`
    : "A few mindful breaths is all it takes.";

  const rows = PATTERNS.map((p) => `
    <button class="prow2" data-pick="${p.id}" style="--c:${p.color}">
      <span class="prow2__tick"></span>
      <span class="prow2__body">
        <span class="prow2__name">${p.name}</span>
        <span class="prow2__spec">${p.technique}</span>
      </span>
      <span class="prow2__chev">${UI.chev}</span>
    </button>`).join("");

  const el = h(`<main class="screen home">
    <div class="home__head">
      <div class="wordmark home__mark">breathe<span class="dot">.</span></div>
      <div class="home__date">${dateStr}</div>
    </div>

    <div class="greeting">
      <div class="greeting__hi">${greet}.</div>
      <div class="greeting__line">${status}</div>
    </div>

    <button class="recommend" style="--c:${featured.color}">
      <div class="eyebrow">Recommended now</div>
      <div class="recommend__top">
        <div class="recommend__name">${featured.name}</div>
        <div class="recommend__mark">${ICONS[featured.icon]}</div>
      </div>
      <div class="recommend__spec">${recSpec}</div>
      <span class="recommend__btn">Begin</span>
    </button>

    <div class="home__stats">
      <div class="hstat"><div class="hstat__val">${st.streak}</div><div class="hstat__label">Day streak</div></div>
      <div class="hstat"><div class="hstat__val">${st.count}</div><div class="hstat__label">Sessions</div></div>
      <div class="hstat"><div class="hstat__val">${st.totalMin}</div><div class="hstat__label">Minutes</div></div>
    </div>

    <div class="group-label">Practices</div>
    <div class="plist">${rows}</div>
  </main>`);

  el.querySelector(".recommend").addEventListener("click", () => openSheet(featured.id));
  el.querySelectorAll("[data-pick]").forEach((b) => b.addEventListener("click", () => openSheet(b.dataset.pick)));
  return el;
}

function pcard(p) {
  return `<button class="pcard" data-pcard="${p.id}" style="--c:${p.color}">
    <div class="icon-tile">${ICONS[p.icon]}</div>
    <div>
      <div class="pcard__name">${p.name}</div>
      <div class="pcard__meta">${rhythm(p)}</div>
    </div>
  </button>`;
}

/* ----- Explore ----- */
function Explore() {
  const el = h(`<main class="screen">
    <div class="eyebrow">Breathing</div>
    <h1 class="screen__title">Explore</h1>
    <p class="screen__sub">Find the pattern that fits the moment. Each guides your breath at a different, research-backed rhythm.</p>
    <div class="explore-list" style="margin-top: var(--s6)">
      ${PATTERNS.map((p) => `
        <button class="prow" data-pattern="${p.id}" style="--c:${p.color}">
          <div class="icon-tile">${ICONS[p.icon]}</div>
          <div class="prow__body">
            <div class="prow__name">${p.name}</div>
            <div class="prow__desc">${p.desc}</div>
            <div class="prow__pattern">${p.technique}</div>
          </div>
          <div class="prow__chev">${UI.chev}</div>
        </button>`).join("")}
    </div>
  </main>`);
  el.querySelectorAll("[data-pattern]").forEach((b) => b.addEventListener("click", () => openSheet(b.dataset.pattern)));
  return el;
}

/* ----- History ----- */
function History() {
  const st = stats();
  const sessions = store.sessions.slice().reverse();
  const counts = {};
  store.sessions.forEach((s) => { const k = dayKey(s.ts); counts[k] = (counts[k] || 0) + 1; });
  const cells = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const c = counts[`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`] || 0;
    cells.push(`<div class="cal__cell" data-on="${c === 0 ? 0 : c === 1 ? 1 : 2}"></div>`);
  }

  const list = sessions.length
    ? sessions.slice(0, 30).map((s) => {
        const p = byId(s.patternId) || { name: "Session", icon: "calm", color: "#6c655a" };
        return `<div class="log-row">
          <div class="icon-tile" style="--c:${p.color}">${ICONS[p.icon] || ""}</div>
          <div class="log-row__body"><div class="log-row__name">${p.name}</div><div class="log-row__when">${relTime(s.ts)}</div></div>
          <div class="log-row__dur">${Math.max(1, Math.round(s.durationSec / 60))} min</div>
        </div>`;
      }).join("")
    : `<div class="empty">${ringsSVG("var(--line)")}<p>No sessions yet.<br/>Your practice will appear here.</p></div>`;

  return h(`<main class="screen">
    <div class="eyebrow">Your practice</div>
    <h1 class="screen__title">History</h1>
    <div class="streak" style="margin-top: var(--s6)">
      <div class="streak__item"><div class="streak__val">${st.streak}</div><div class="streak__label">Day streak</div></div>
      <div class="streak__item"><div class="streak__val">${st.count}</div><div class="streak__label">Sessions</div></div>
      <div class="streak__item"><div class="streak__val">${st.totalMin}</div><div class="streak__label">Minutes</div></div>
    </div>
    <div class="group-label">Last 4 weeks</div>
    <div class="cal">${cells.join("")}</div>
    <div class="group-label">Recent</div>
    ${list}
  </main>`);
}

function relTime(ts) {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const d = new Date(ts), today = new Date();
  const y = new Date(today); y.setDate(y.getDate() - 1);
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (d.toDateString() === today.toDateString()) return `Today, ${time}`;
  if (d.toDateString() === y.toDateString()) return `Yesterday, ${time}`;
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) + `, ${time}`;
}

/* ======================= DURATION SHEET ======================= */
let sheetState = { patternId: null, value: null };

function openSheet(patternId) {
  const p = byId(patternId);
  sheetState = { patternId, value: p.default };
  const unitLabel = (v) => (p.unit === "breaths" ? "breaths" : "min");

  const scrim = h(`<div class="sheet-scrim">
    <div class="sheet" role="dialog" aria-modal="true" style="--c:${p.color}">
      <div class="sheet__grab"></div>
      <div class="sheet__opts">
        <div class="toggle" data-sound>
          <span id="sndlabel">${store.sound ? "Sound & haptics on" : "Sound & haptics off"}</span>
          <span class="switch" role="switch" aria-checked="${store.sound}"></span>
        </div>
      </div>
      <div class="sheet__hero">${ICONS[p.icon]}</div>
      <div class="eyebrow sheet__eyebrow">${p.technique}</div>
      <div class="wordmark sheet__title">${p.name.toLowerCase()}<span class="dot" style="color:${p.color}">.</span></div>
      <p class="sheet__desc">${p.guidance}</p>
      <div class="durations">
        ${p.options.map((v) => `<button class="duration" data-val="${v}" aria-pressed="${v === p.default}">${v}<small>${unitLabel(v)}</small></button>`).join("")}
      </div>
      ${p.caveat ? `<p class="sheet__caveat">${p.caveat}</p>` : ""}
      <button class="sheet__begin">Begin breathing</button>
    </div>
  </div>`);

  document.body.appendChild(scrim);
  requestAnimationFrame(() => scrim.classList.add("open"));
  const close = () => { scrim.classList.remove("open"); setTimeout(() => scrim.remove(), 380); };
  scrim.addEventListener("click", (e) => { if (e.target === scrim) close(); });

  scrim.querySelectorAll(".duration").forEach((b) =>
    b.addEventListener("click", () => {
      sheetState.value = +b.dataset.val;
      scrim.querySelectorAll(".duration").forEach((x) => x.setAttribute("aria-pressed", x === b));
    }));

  scrim.querySelector("[data-sound]").addEventListener("click", () => {
    store.sound = !store.sound;
    scrim.querySelector(".switch").setAttribute("aria-checked", store.sound);
    scrim.querySelector("#sndlabel").textContent = store.sound ? "Sound & haptics on" : "Sound & haptics off";
    if (store.sound) { tone(396, 0.4); haptic(1); }
  });

  scrim.querySelector(".sheet__begin").addEventListener("click", () => {
    if (store.sound) { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); actx.resume?.(); }
    close();
    startSession(sheetState.patternId, sheetState.value);
  });
}

/* ======================= BREATHING SESSION =======================
   One elapsed-time clock drives everything. A single ~33ms loop computes the
   ring scale (eased), the count, the progress and the phase from performance.now
   elapsed time, so scale, count and cue are always derived from the same instant
   (no lag, no drift) and the motion interpolates smoothly rather than snapping.
   Boundary side-effects (label, audio, haptic, hold shimmer) fire when elapsed
   crosses a phase edge. Pause freezes elapsed; on resume it picks up exactly. */
let session = null;
const RING_COUNT = 6;
const TICK_MS = 33; // ~30fps; plenty for slow breath motion, and keeps ticking when throttled

function startSession(patternId, value) {
  const p = byId(patternId);
  tabbar.hidden = true;
  document.documentElement.style.setProperty("--c", p.color);
  document.body.style.background = p.color;

  // resolve each phase's start/end fullness (holds keep the previous level)
  const targetOf = (ph, prev) => (ph[2] != null ? ph[2] : ph[0] === "Inhale" || ph[0] === "Top-up" ? 1 : ph[0] === "Exhale" ? 0.42 : prev);
  const phases = p.phases.map((ph) => ({ label: ph[0], secs: ph[1] }));
  let prev = 0.42;
  phases.forEach((ph, i) => { ph.from = prev; ph.to = targetOf(p.phases[i], prev); prev = ph.to; });
  phases[0].from = phases[phases.length - 1].to; // seamless loop
  const cycleDur = phases.reduce((a, ph) => a + ph.secs, 0);
  const offs = []; { let a = 0; for (const ph of phases) { offs.push(a); a += ph.secs; } }
  const totalSec = p.unit === "breaths" ? value * cycleDur : value * 60;

  // build rings: outer faint+large -> inner bright+small; inner leads the ripple
  const ringMeta = [];
  let ringsHTML = "";
  for (let i = 0; i < RING_COUNT; i++) {
    const size = 100 - i * (84 / RING_COUNT);
    const o = 0.36 + (i / (RING_COUNT - 1)) * 0.4;
    const f = ((RING_COUNT - 1 - i) / (RING_COUNT - 1)) * 0.08; // stagger fraction; all rings still land on the beat
    ringMeta.push(f);
    ringsHTML += `<div class="ring" style="width:${size.toFixed(1)}%;height:${size.toFixed(1)}%;--o:${o.toFixed(2)}"></div>`;
  }
  ringsHTML += `<div class="ring dot" style="width:5%;height:5%"></div>`;
  ringMeta.push(0); // dot moves with the core

  const el = h(`<div class="session" style="--c:${p.color}">
    <div class="session__bar">
      <button class="session__icon-btn" data-close aria-label="End session">${UI.close}</button>
      <div class="session__name">${p.name}</div>
      <button class="session__icon-btn" data-sound aria-label="Toggle sound">${store.sound ? UI.sound : UI.soundOff}</button>
    </div>
    <div class="session__stage">
      <div class="rings">${ringsHTML}</div>
      <div class="session__label">
        <div class="session__phase">Get ready</div>
        <div class="session__count"></div>
      </div>
      <div class="ready"><div><div class="ready__n">3</div><div class="ready__hint">Find a comfortable position</div></div></div>
    </div>
    <div class="session__foot">
      <div class="session__progress"><i></i></div>
      <div class="session__time">${fmt(totalSec)}</div>
      <button class="session__pause" data-pause aria-label="Pause">${UI.pause}</button>
    </div>
  </div>`);
  app.appendChild(el);

  const ringEls = el.querySelectorAll(".ring");
  const ringsBox = el.querySelector(".rings");
  const phaseEl = el.querySelector(".session__phase");
  const countEl = el.querySelector(".session__count");
  const progEl = el.querySelector(".session__progress > i");
  const timeEl = el.querySelector(".session__time");
  const pauseBtn = el.querySelector("[data-pause]");
  const ready = el.querySelector(".ready");

  session = { finished: false, paused: false, t0: 0, pausedAccum: 0, pauseStart: 0, totalSec, tick: 0, cd: 0, lastKey: -1 };

  const elapsed = () => (performance.now() - session.t0 - session.pausedAccum) / 1000;
  const paint = (from, to, p01) => {
    ringEls.forEach((r, i) => {
      const f = ringMeta[i];
      const pi = clamp01((p01 - f) / (1 - f));         // staggered, but every ring reaches `to` at p01 = 1
      const s = from + (to - from) * easeInOutSine(pi);
      r.style.setProperty("--breath-scale", s.toFixed(4));
    });
  };

  function step() {
    if (session.finished || session.paused) return;
    const e = elapsed();
    if (e >= totalSec) return finishSession(el, p, totalSec);
    const t = e % cycleDur;
    let idx = 0; for (let i = 0; i < phases.length; i++) { if (t < offs[i] + phases[i].secs) { idx = i; break; } }
    const ph = phases[idx];
    const into = t - offs[idx];
    const key = Math.floor(e / cycleDur) * 100 + idx;
    if (key !== session.lastKey) {       // crossed into a new phase
      session.lastKey = key;
      phaseEl.textContent = ph.label === "Top-up" ? "Top up" : ph.label;
      ringsBox.classList.toggle("holding", ph.label === "Hold");
      CUE[ph.label]?.();
      haptic(1);
    }
    paint(ph.from, ph.to, ph.secs ? into / ph.secs : 1);
    countEl.textContent = Math.max(1, Math.ceil(ph.secs - into - 0.001));
    progEl.style.width = Math.min(100, (e / totalSec) * 100) + "%";
    timeEl.textContent = fmt(Math.max(0, totalSec - e));
  }

  // 3-2-1 ready: rings sit empty, then start the clock
  paint(0.42, 0.42, 1);
  let n = 3;
  const rn = ready.querySelector(".ready__n");
  session.cd = setInterval(() => {
    n--;
    if (n <= 0) {
      clearInterval(session.cd); session.cd = 0;
      ready.style.display = "none";
      session.t0 = performance.now();
      session.tick = setInterval(step, TICK_MS);
      step();
    } else {
      rn.textContent = n;
      rn.style.animation = "none"; void rn.offsetWidth; rn.style.animation = "";
    }
  }, 1000);

  el.querySelector("[data-close]").addEventListener("click", () => endSession(el));
  el.querySelector("[data-sound]").addEventListener("click", (e) => { store.sound = !store.sound; e.currentTarget.innerHTML = store.sound ? UI.sound : UI.soundOff; });
  pauseBtn.addEventListener("click", () => {
    if (!session || !session.t0) return; // ignore during ready countdown
    session.paused = !session.paused;
    pauseBtn.innerHTML = session.paused ? UI.play : UI.pause;
    if (session.paused) session.pauseStart = performance.now();
    else { session.pausedAccum += performance.now() - session.pauseStart; step(); }
  });
}

function clearSession() {
  if (!session) return;
  session.finished = true;
  clearInterval(session.tick);
  clearInterval(session.cd);
}
function endSession(el) { clearSession(); el.remove(); session = null; render(current); }

function finishSession(el, p, totalSec) {
  clearSession();
  store.log(p.id, totalSec);
  tone(330, 0.5); setTimeout(() => tone(440, 0.7), 220);
  haptic(3);
  const st = stats();

  const done = h(`<div class="complete">
    <div class="complete__mark">${UI.check}</div>
    <div class="complete__title">Well done.</div>
    <div class="complete__line">You completed ${Math.max(1, Math.round(totalSec / 60))} minutes of ${p.name.toLowerCase()} breathing.</div>
    <div class="complete__stats">
      <div class="complete__stat"><div class="v">${st.streak}</div><div class="l">Day streak</div></div>
      <div class="complete__stat"><div class="v">${st.count}</div><div class="l">Sessions</div></div>
      <div class="complete__stat"><div class="v">${st.totalMin}</div><div class="l">Minutes</div></div>
    </div>
    <button class="complete__btn">Done</button>
  </div>`);

  el.querySelector(".session__stage").replaceChildren(done);
  el.querySelector(".session__foot").style.display = "none";
  el.querySelector(".session__bar").style.opacity = "0";
  done.querySelector(".complete__btn").addEventListener("click", () => { el.remove(); session = null; render("home"); });
}

/* ---------- helpers ---------- */
function fmt(sec) { sec = Math.max(0, Math.round(sec)); return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`; }

/* ---------- boot ---------- */
render("home");
