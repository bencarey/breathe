/* =========================================================================
   breathe.  —  app logic (Eames / Maeda remix)
   A small state machine. No build step, no dependencies.
   ========================================================================= */

/* ---------- geometric icon marks (Maeda playful, drawn in currentColor) ---- */
const M = (inner) =>
  `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">${inner}</svg>`;

const ICONS = {
  // energy — radiating burst
  energy: M(`${Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4;
    const x1 = 24 + Math.cos(a) * 8, y1 = 24 + Math.sin(a) * 8;
    const x2 = 24 + Math.cos(a) * 17, y2 = 24 + Math.sin(a) * 17;
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>`;
  }).join("")}<circle cx="24" cy="24" r="3.4" fill="currentColor"/>`),
  // creativity — scattered dots in a ring (palette)
  creativity: M(`<circle cx="24" cy="24" r="14" stroke="currentColor" stroke-width="2" opacity="0.45"/>${[[18,18],[31,17],[33,27],[22,31],[15,26]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="2.5" fill="currentColor"/>`).join("")}`),
  // calm — concentric ripple
  calm: M(`<circle cx="24" cy="24" r="17" stroke="currentColor" stroke-width="2" opacity="0.35"/><circle cx="24" cy="24" r="11" stroke="currentColor" stroke-width="2" opacity="0.6"/><circle cx="24" cy="24" r="5" stroke="currentColor" stroke-width="2"/><circle cx="24" cy="24" r="1.6" fill="currentColor"/>`),
  // focus — target
  focus: M(`<circle cx="24" cy="24" r="15" stroke="currentColor" stroke-width="2.2"/><circle cx="24" cy="24" r="4.5" fill="currentColor"/>`),
  // balance — two overlapping circles (vesica)
  balance: M(`<circle cx="19" cy="24" r="11" stroke="currentColor" stroke-width="2.2"/><circle cx="29" cy="24" r="11" stroke="currentColor" stroke-width="2.2"/>`),
  // ground — circle resting on a baseline
  ground: M(`<circle cx="24" cy="20" r="11" stroke="currentColor" stroke-width="2.2"/><line x1="10" y1="36" x2="38" y2="36" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>`),
  // sleep — crescent
  sleep: M(`<path d="M31 31a13 13 0 1 1-1-21 10.5 10.5 0 0 0 1 21z" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>`),
};

/* big concentric rings for hero / empty states */
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

/* ---------- breathing patterns + identity colors ----------
   colors are saturated, Eames-spirited, echoing the orange / electric-blue /
   black references. phases: [label, seconds]; inhale expands, exhale contracts. */
const PATTERNS = [
  { id: "energy", name: "Energy", group: "morning", icon: "energy", color: "#ec5a2e",
    desc: "Boost your energy and alertness through breath.",
    phases: [["Inhale", 2], ["Exhale", 2]] },
  { id: "creativity", name: "Creativity", group: "morning", icon: "creativity", color: "#2e27e6",
    desc: "Open the mind and invite fresh ideas.",
    phases: [["Inhale", 4], ["Hold", 2], ["Exhale", 6], ["Hold", 2]] },
  { id: "calm", name: "Calm", group: "anytime", icon: "calm", color: "#1f8e7d",
    desc: "Reduce stress and anxiety with a long, slow exhale.",
    phases: [["Inhale", 4], ["Hold", 7], ["Exhale", 8]] },
  { id: "focus", name: "Focus", group: "anytime", icon: "focus", color: "#16161a",
    desc: "Box breathing to steady the mind and sharpen attention.",
    phases: [["Inhale", 4], ["Hold", 4], ["Exhale", 4], ["Hold", 4]] },
  { id: "balance", name: "Balance", group: "anytime", icon: "balance", color: "#d9982f",
    desc: "Coherent breathing at the body's natural resonance.",
    phases: [["Inhale", 5.5], ["Exhale", 5.5]] },
  { id: "ground", name: "Ground", group: "anytime", icon: "ground", color: "#b0542f",
    desc: "A quick reset to come back to centre.",
    phases: [["Inhale", 4], ["Hold", 4], ["Exhale", 6]] },
  { id: "sleep", name: "Sleep", group: "evening", icon: "sleep", color: "#2b2e6e",
    desc: "Wind the body down and drift toward rest.",
    phases: [["Inhale", 4], ["Hold", 4], ["Exhale", 8]] },
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
const CUE = { Inhale: () => tone(396, 0.6), Exhale: () => tone(264, 0.7), Hold: () => tone(330, 0.25, 0.03) };

/* haptics: navigator.vibrate on Android; the hidden <input switch> .click()
   trick on iOS Safari 17.4+ (Taptic Engine). Best-effort, gated by the toggle. */
let hapticEl = null;
function haptic(times = 1) {
  if (!store.sound) return;
  if (navigator.vibrate) {                       // Android & others
    try { navigator.vibrate(times > 1 ? [14, 50, 14, 50, 14].slice(0, times * 2 - 1) : 14); } catch {}
    return;
  }
  hapticEl = hapticEl || document.getElementById("haptic"); // iOS Taptic
  if (hapticEl) for (let i = 0; i < times; i++) setTimeout(() => { try { hapticEl.click(); } catch {} }, i * 80);
}

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

/* ----- Home ----- */
function Home() {
  const now = new Date();
  const hr = now.getHours();
  const part = hr < 12 ? "morning" : hr < 18 ? "afternoon" : "evening";
  const greet = hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening";
  const featured = part === "morning" ? byId("energy") : part === "evening" ? byId("sleep") : byId("calm");
  const st = stats();
  const dateStr = now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  const groups = { morning: "Morning", anytime: "Anytime", evening: "Evening" };
  const groupsHTML = Object.entries(groups).map(([key, label]) => {
    const items = PATTERNS.filter((p) => p.group === key && p.id !== featured.id);
    if (!items.length) return "";
    return `<div class="group-label">${label}</div><div class="pgrid">${items.map(pcard).join("")}</div>`;
  }).join("");

  const el = h(`<main class="screen">
    <div class="home__top">
      <div class="wordmark home__mark">breathe<span class="dot">.</span></div>
      <div class="home__date">${dateStr}</div>
    </div>

    <div class="greeting">
      <div class="greeting__hi">${greet}.</div>
      <div class="greeting__line">A few mindful breaths is all it takes. ${st.streak > 0 ? `You're on a <b>${st.streak}-day</b> streak.` : "Start a streak today."}</div>
    </div>

    <div class="streak">
      <div class="streak__item"><div class="streak__val">${st.streak}</div><div class="streak__label">Day streak</div></div>
      <div class="streak__item"><div class="streak__val">${st.count}</div><div class="streak__label">Sessions</div></div>
      <div class="streak__item"><div class="streak__val">${st.totalMin}</div><div class="streak__label">Minutes</div></div>
    </div>

    <button class="hero" style="--c:${featured.color}">
      <div class="hero__rings">${ringsSVG("rgba(255,255,255,0.55)")}</div>
      <div class="eyebrow hero__eyebrow">Recommended now</div>
      <div class="hero__title">${featured.name}</div>
      <div class="hero__desc">${featured.desc}</div>
      <div class="hero__btn">Begin</div>
    </button>

    ${groupsHTML}
  </main>`);

  el.querySelector(".hero").addEventListener("click", () => openSheet(featured.id));
  el.querySelectorAll("[data-pcard]").forEach((b) => b.addEventListener("click", () => openSheet(b.dataset.pcard)));
  return el;
}

function pcard(p) {
  return `<button class="pcard" data-pcard="${p.id}" style="--c:${p.color}">
    <div class="icon-tile">${ICONS[p.icon]}</div>
    <div>
      <div class="pcard__name">${p.name}</div>
      <div class="pcard__meta">${p.phases.map(([, s]) => (Number.isInteger(s) ? s : s.toFixed(1))).join(" · ")}</div>
    </div>
  </button>`;
}

/* ----- Explore ----- */
function Explore() {
  const el = h(`<main class="screen">
    <div class="eyebrow">Breathing</div>
    <h1 class="screen__title">Explore</h1>
    <p class="screen__sub">Find the pattern that fits the moment. Each guides your breath at a different rhythm.</p>
    <div class="explore-list" style="margin-top: var(--s6)">
      ${PATTERNS.map((p) => `
        <button class="prow" data-pattern="${p.id}" style="--c:${p.color}">
          <div class="icon-tile">${ICONS[p.icon]}</div>
          <div class="prow__body">
            <div class="prow__name">${p.name}</div>
            <div class="prow__desc">${p.desc}</div>
            <div class="prow__pattern">${p.phases.map(([l, s]) => `${l} ${Number.isInteger(s) ? s : s.toFixed(1)}s`).join("  ·  ")}</div>
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
          <div class="log-row__dur">${Math.round(s.durationSec / 60)} min</div>
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
let sheetState = { patternId: null, minutes: 2 };

function openSheet(patternId) {
  const p = byId(patternId);
  sheetState = { patternId, minutes: 2 };

  const scrim = h(`<div class="sheet-scrim">
    <div class="sheet" role="dialog" aria-modal="true" style="--c:${p.color}">
      <div class="sheet__grab"></div>
      <div class="sheet__opts">
        <div class="toggle" data-sound>
          <span id="sndlabel">${store.sound ? "Sound on" : "Sound off"}</span>
          <span class="switch" role="switch" aria-checked="${store.sound}"></span>
        </div>
      </div>
      <div class="sheet__hero">${ICONS[p.icon]}</div>
      <div class="eyebrow sheet__eyebrow">Breathing</div>
      <div class="wordmark sheet__title">${p.name.toLowerCase()}<span class="dot" style="color:${p.color}">.</span></div>
      <p class="sheet__desc">${p.desc}</p>
      <div class="durations">
        ${[1, 2, 4].map((m) => `<button class="duration" data-min="${m}" aria-pressed="${m === 2}">${m}<small>min</small></button>`).join("")}
      </div>
      <button class="sheet__begin">Begin breathing</button>
    </div>
  </div>`);

  document.body.appendChild(scrim);
  requestAnimationFrame(() => scrim.classList.add("open"));
  const close = () => { scrim.classList.remove("open"); setTimeout(() => scrim.remove(), 380); };
  scrim.addEventListener("click", (e) => { if (e.target === scrim) close(); });

  scrim.querySelectorAll(".duration").forEach((b) =>
    b.addEventListener("click", () => {
      sheetState.minutes = +b.dataset.min;
      scrim.querySelectorAll(".duration").forEach((x) => x.setAttribute("aria-pressed", x === b));
    }));

  scrim.querySelector("[data-sound]").addEventListener("click", () => {
    store.sound = !store.sound;
    scrim.querySelector(".switch").setAttribute("aria-checked", store.sound);
    scrim.querySelector("#sndlabel").textContent = store.sound ? "Sound on" : "Sound off";
    if (store.sound) { tone(396, 0.4); haptic(1); }
  });

  scrim.querySelector(".sheet__begin").addEventListener("click", () => {
    if (store.sound) { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); actx.resume?.(); }
    close();
    startSession(sheetState.patternId, sheetState.minutes);
  });
}

/* ======================= BREATHING SESSION ======================= */
let session = null;
const RING_COUNT = 6;

function startSession(patternId, minutes) {
  const p = byId(patternId);
  const totalSec = minutes * 60;
  tabbar.hidden = true;
  document.documentElement.style.setProperty("--c", p.color);
  document.body.style.background = p.color;

  // build concentric rings: outer (faint, large) -> inner (bright), then dot.
  const rings = Array.from({ length: RING_COUNT }, (_, i) => {
    const size = 100 - i * (84 / RING_COUNT);           // 100% .. ~16%
    const o = 0.36 + (i / (RING_COUNT - 1)) * 0.4;        // gentle depth, still legible outside
    const d = ((RING_COUNT - 1 - i) * 0.05).toFixed(2);   // inner leads the ripple
    return `<div class="ring" style="width:${size.toFixed(1)}%;height:${size.toFixed(1)}%;--o:${o.toFixed(2)};--d:${d}s"></div>`;
  }).join("") + `<div class="ring dot" style="width:5%;height:5%;--d:0s"></div>`;

  const el = h(`<div class="session" style="--c:${p.color}">
    <div class="session__bar">
      <button class="session__icon-btn" data-close aria-label="End session">${UI.close}</button>
      <div class="session__name">${p.name}</div>
      <button class="session__icon-btn" data-sound aria-label="Toggle sound">${store.sound ? UI.sound : UI.soundOff}</button>
    </div>

    <div class="session__stage">
      <div class="rings">${rings}</div>
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
  const phaseEl = el.querySelector(".session__phase");
  const countEl = el.querySelector(".session__count");
  const progEl = el.querySelector(".session__progress > i");
  const timeEl = el.querySelector(".session__time");
  const pauseBtn = el.querySelector("[data-pause]");
  const ready = el.querySelector(".ready");

  session = { patternId, totalSec, paused: false, finished: false, elapsed: 0, phaseIdx: 0, raf: null, timers: [] };

  const setScale = (scale, dur, ease) => {
    ringEls.forEach((r) => { r.style.setProperty("--phase-dur", dur + "s"); r.style.setProperty("--phase-ease", ease); r.style.setProperty("--breath-scale", scale); });
  };
  const scaleFor = (label) => (label === "Inhale" ? 1 : label === "Exhale" ? 0.42 : null);

  let lastLabel = "";
  function runPhase() {
    if (session.paused || session.finished) return;
    const [label, secs] = p.phases[session.phaseIdx % p.phases.length];
    phaseEl.textContent = label;
    const target = scaleFor(label);
    if (target !== null) setScale(target, secs, "cubic-bezier(0.42,0,0.58,1)");
    if (label !== lastLabel) { CUE[label]?.(); haptic(1); lastLabel = label; }

    let remain = secs;
    countEl.textContent = Math.ceil(remain);
    const tick = setInterval(() => { if (!session.paused) { remain -= 0.1; countEl.textContent = Math.max(0, Math.ceil(remain - 0.001)); } }, 100);
    session.timers.push(tick);
    const to = setTimeout(() => { clearInterval(tick); session.phaseIdx++; runPhase(); }, secs * 1000);
    session.timers.push(to);
  }

  function clock() {
    if (session.finished) return;
    if (!session.paused) {
      session.elapsed += 0.25;
      progEl.style.width = Math.min(100, (session.elapsed / totalSec) * 100) + "%";
      timeEl.textContent = fmt(Math.max(0, Math.ceil(totalSec - session.elapsed)));
      if (session.elapsed >= totalSec) return finishSession(el, p, totalSec);
    }
    session.raf = setTimeout(clock, 250);
  }

  // 3-2-1 ready
  let n = 3;
  const rn = ready.querySelector(".ready__n");
  setScale(0.42, 0.5, "ease");
  const cd = setInterval(() => {
    n--;
    if (n <= 0) { clearInterval(cd); ready.style.display = "none"; runPhase(); clock(); }
    else { rn.textContent = n; rn.style.animation = "none"; void rn.offsetWidth; rn.style.animation = ""; }
  }, 1000);
  session.timers.push(cd);

  el.querySelector("[data-close]").addEventListener("click", () => endSession(el));
  el.querySelector("[data-sound]").addEventListener("click", (e) => { store.sound = !store.sound; e.currentTarget.innerHTML = store.sound ? UI.sound : UI.soundOff; });
  pauseBtn.addEventListener("click", () => {
    session.paused = !session.paused;
    pauseBtn.innerHTML = session.paused ? UI.play : UI.pause;
    if (!session.paused) runPhase();
  });
}

function clearSession() {
  if (!session) return;
  session.finished = true;
  session.timers.forEach((t) => { clearTimeout(t); clearInterval(t); });
  clearTimeout(session.raf);
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
    <div class="complete__line">You completed ${Math.round(totalSec / 60)} minutes of ${p.name.toLowerCase()} breathing.</div>
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
