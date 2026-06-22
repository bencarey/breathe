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
  // alternate nostril -> circle split with two channels
  nadishodhana: M(`<circle cx="24" cy="24" r="15" stroke="currentColor" stroke-width="2"/><path d="M24 9v30" stroke="currentColor" stroke-width="1.6" opacity="0.5"/><circle cx="17" cy="24" r="2.4" fill="currentColor"/><circle cx="31" cy="24" r="2.4" fill="currentColor"/>`),
  // long deep -> expanding swell (concentric arcs)
  longdeep: M(`<path d="M11 30a13 13 0 0 1 26 0" stroke="currentColor" stroke-width="2.2" fill="none"/><path d="M16 32a8 8 0 0 1 16 0" stroke="currentColor" stroke-width="2" fill="none" opacity="0.6"/><path d="M20 34a4 4 0 0 1 8 0" stroke="currentColor" stroke-width="1.8" fill="none" opacity="0.35"/>`),
  // ocean breath -> a wave within a bowl
  ujjayi: M(`<circle cx="24" cy="24" r="15" stroke="currentColor" stroke-width="2"/><path d="M14 25c3.3-5 6.7-5 10 0s6.7 5 10 0" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>`),
  // humming bee -> vibration radiating from a center
  bhramari: M(`<circle cx="24" cy="24" r="3.2" fill="currentColor"/><path d="M31 17a10 10 0 0 1 0 14M17 17a10 10 0 0 0 0 14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M35 13a16 16 0 0 1 0 22M13 13a16 16 0 0 0 0 22" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0.45"/>`),
  // cooling breath -> a droplet
  cooling: M(`<path d="M24 9c6 8 9 12 9 17a9 9 0 0 1-18 0c0-5 3-9 9-17z" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linejoin="round"/>`),
  // breath of fire -> a flame
  breathoffire: M(`<path d="M24 37a8 8 0 0 0 8-8c0-6-5-8.5-5-14-3 2.5-4.5 5-4.5 8-2.2-.3-3-2-3-4.2-2.5 2.3-4 5.2-3.5 9.2a8 8 0 0 0 8 9z" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linejoin="round"/>`),
  // yogic ratio -> ascending bars (1:2:2)
  tripleratio: M(`<rect x="13" y="27" width="5" height="9" rx="1" fill="currentColor"/><rect x="21.5" y="18" width="5" height="18" rx="1" fill="currentColor"/><rect x="30" y="12" width="5" height="24" rx="1" fill="currentColor"/>`),
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
  { id: "energy", name: "Energy", technique: "Energizing breath", group: "energize", icon: "energy", color: "#9a4a38", rhythm: "4 · 2",
    desc: "A longer inhale to lift energy and alertness.",
    guidance: "Breathe in longer than you breathe out to raise alertness. Sit upright, and ease off if you feel light-headed.",
    caveat: "Best seated or lying down. Skip if pregnant or prone to dizziness.",
    phases: [["Inhale", 4], ["Exhale", 2]], unit: "min", options: [1, 2, 3], default: 2 },

  { id: "creativity", name: "Creativity", technique: "Open awareness", group: "center", icon: "creativity", color: "#6e7e86", rhythm: "4 · 2 · 6 · 2",
    desc: "A spacious, even rhythm to open the mind.",
    guidance: "An even, spacious rhythm with gentle pauses. Let the mind wander and make connections.",
    phases: [["Inhale", 4], ["Hold", 2], ["Exhale", 6], ["Hold", 2]], unit: "min", options: [2, 4, 6], default: 4 },

  { id: "balance", name: "Balance", technique: "Coherent breathing", group: "center", icon: "balance", color: "#6e7b5b", rhythm: "5.5 · 5.5",
    desc: "Resonant breathing for calm, steady balance.",
    guidance: "Smooth and even, with no holds. Equal in and out at the body's resonant pace settles the nervous system and lifts heart-rate variability.",
    phases: [["Inhale", 5.5], ["Exhale", 5.5]], unit: "min", options: [2, 5, 10], default: 5 },

  { id: "focus", name: "Focus", technique: "Box breathing", group: "center", icon: "focus", color: "#401e01", rhythm: "4 · 4 · 4 · 4",
    desc: "Equal box breathing to steady attention.",
    guidance: "Equal counts on all four sides of the box. Keep the holds relaxed, never strained.",
    phases: [["Inhale", 4], ["Hold", 4], ["Exhale", 4], ["Hold", 4]], unit: "min", options: [2, 4, 8], default: 4 },

  { id: "unwind", name: "Unwind", technique: "Extended exhale", group: "soothe", icon: "unwind", color: "#5a4632", rhythm: "4 · 6",
    desc: "A longer exhale to gently let go.",
    guidance: "Let the out-breath be longer than the in-breath. Soften the jaw and shoulders as you exhale.",
    phases: [["Inhale", 4], ["Exhale", 6]], unit: "min", options: [2, 5, 10], default: 5 },

  { id: "reset", name: "Reset", technique: "Physiological sigh", group: "soothe", icon: "reset", color: "#5c6e72", rhythm: "In · sip · out",
    desc: "A double inhale and long exhale to reset fast.",
    guidance: "Inhale fully through the nose, then sip in a little more air, then a long, slow exhale through the mouth.",
    phases: [["Inhale", 3, 0.8], ["Top-up", 1.8, 1], ["Exhale", 6.5, 0.42]], unit: "min", options: [1, 3, 5], default: 3 },

  { id: "calm", name: "Calm", technique: "Relaxing breath", group: "rest", icon: "calm", color: "#716050", rhythm: "4 · 7 · 8",
    desc: "Dr. Weil's relaxing breath for stress and sleep.",
    guidance: "Inhale quietly through the nose for four, hold for seven, then exhale through the mouth with a soft whoosh for eight. Four breaths is one round.",
    phases: [["Inhale", 4], ["Hold", 7], ["Exhale", 8]], unit: "breaths", options: [4, 8], default: 4 },

  { id: "sleep", name: "Sleep", technique: "Wind-down", group: "rest", icon: "sleep", color: "#3a2415", rhythm: "4 · 2 · 8",
    desc: "A strong exhale bias to drift toward rest.",
    guidance: "A long, slow exhale carries you toward sleep. Keep everything loose and let go.",
    phases: [["Inhale", 4], ["Hold", 2], ["Exhale", 8]], unit: "min", options: [3, 5, 10], default: 5 },

  /* ---- Kundalini / pranayama (Open-inspired) ---- */
  { id: "breathoffire", name: "Breath of Fire", technique: "Kapalabhati", group: "energize", icon: "breathoffire", color: "#7e3a2b", rhythm: "Rapid · even",
    desc: "A rhythmic pumping breath to build heat and energy.",
    guidance: "Equal, rhythmic breaths through the nose, the belly pumping with each one. A light snap out on the exhale; let the inhale fall in on its own. Steady, not frantic.",
    caveat: "Stop if light-headed. Avoid if pregnant, or with high blood pressure, heart disease, epilepsy, GERD, or recent abdominal surgery.",
    phases: [["Inhale", 1], ["Exhale", 1]], unit: "breaths", options: [30, 60, 120], default: 30 },

  { id: "longdeep", name: "Long Deep", technique: "Long deep breathing", group: "energize", icon: "longdeep", color: "#8a7866", rhythm: "7 · 8",
    desc: "A slow three-part yogic breath — belly, ribs, chest.",
    guidance: "A slow, full wave: let the belly rise, then the ribs widen, then the chest lift. Exhale in reverse, long and smooth, through the nose.",
    phases: [["Inhale", 7], ["Exhale", 8]], unit: "min", options: [3, 5, 11], default: 5 },

  { id: "nadishodhana", name: "Alternate Nostril", technique: "Nadi Shodhana", group: "center", icon: "nadishodhana", color: "#5b7470", rhythm: "4 · 4 · 4 · 4",
    desc: "Alternate-nostril breathing to balance and settle the mind.",
    guidance: "Close the right nostril with the thumb and breathe through the left; then switch and breathe through the right. Follow the prompts — let the hands keep the rhythm.",
    caveat: "Breathe gently, never strain the holds. Skip the holds if pregnant. Sit upright.",
    phases: [["Inhale L", 4], ["Hold", 4], ["Exhale R", 4], ["Inhale R", 4], ["Hold", 4], ["Exhale L", 4]], unit: "min", options: [2, 5, 10], default: 5 },

  { id: "ujjayi", name: "Ocean Breath", technique: "Ujjayi", group: "soothe", icon: "ujjayi", color: "#4e6468", rhythm: "5 · 5",
    desc: "Whispering ocean breath with a gently constricted throat.",
    guidance: "Breathe through the nose with a soft constriction at the back of the throat, like fogging a mirror with your mouth closed. Listen for the quiet ocean sound, even in and out.",
    caveat: "Keep the throat soft, never forced. Ease off if it strains.",
    phases: [["Inhale", 5], ["Exhale", 5]], unit: "min", options: [2, 5, 10], default: 5 },

  { id: "cooling", name: "Cooling Breath", technique: "Sitali", group: "soothe", icon: "cooling", color: "#6e7e86", rhythm: "4 · 4 · 6",
    desc: "Curl the tongue and sip cool air to calm and cool down.",
    guidance: "Curl the tongue into a tube (or purse the lips) and sip cool air in through it. Close the mouth, hold briefly, then exhale slowly through the nose.",
    caveat: "Best in warm conditions. Skip if you feel chilled or congested.",
    phases: [["Inhale", 4], ["Hold", 4], ["Exhale", 6]], unit: "min", options: [2, 4, 6], default: 4 },

  { id: "tripleratio", name: "Yogic Ratio", technique: "Yogic ratio", group: "rest", icon: "tripleratio", color: "#5a4632", rhythm: "4 · 8 · 8",
    desc: "A traditional inhale–hold–exhale ratio for steady calm.",
    guidance: "Inhale for four, hold for eight, exhale for eight — a classic yogic ratio that lengthens the breath without strain.",
    caveat: "Keep the hold relaxed. Shorten or skip the hold if you feel any air-hunger.",
    phases: [["Inhale", 4], ["Hold", 8], ["Exhale", 8]], unit: "min", options: [2, 4, 6], default: 4 },

  { id: "bhramari", name: "Humming Bee", technique: "Bhramari", group: "rest", icon: "bhramari", color: "#7a5d6a", rhythm: "4 · 8",
    desc: "A long humming exhale to quiet an anxious mind.",
    guidance: "Inhale softly through the nose, then hum like a bee on a long, smooth exhale with the mouth closed. Feel the gentle vibration in the head and chest.",
    phases: [["Inhale", 4], ["Exhale", 8]], unit: "breaths", options: [6, 10, 15], default: 10 },
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

/* ---------- soundscape: ambient drone + synthesized Tibetan bowls & koshi chimes ----
   All synthesized via Web Audio (no asset files, works offline). Gated by store.sound. */
const Snd = {
  ctx: null, master: null, reverb: null, pad: null,
  scale: [196.0, 233.08, 261.63, 311.13, 349.23, 392.0], // G minor-pentatonic-ish, calm
  ensure() {
    if (this.ctx) return this.ctx;
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    const ctx = new C();
    this.ctx = ctx;
    const master = ctx.createGain(); master.gain.value = 0.45; // ~half volume
    const mute = ctx.createGain(); mute.gain.value = store.sound ? 1 : 0; // hard kill switch for EVERYTHING
    const lim = ctx.createDynamicsCompressor();
    lim.threshold.value = -7; lim.ratio.value = 12; lim.attack.value = 0.004; lim.release.value = 0.25;
    master.connect(mute); mute.connect(lim); lim.connect(ctx.destination);
    this.master = master; this.muteGain = mute;
    // simple convolution reverb (decaying-noise impulse) for space
    const dur = 2.8, len = Math.floor(ctx.sampleRate * dur), ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.4); }
    const conv = ctx.createConvolver(); conv.buffer = ir;
    const rg = ctx.createGain(); rg.gain.value = 0.9; conv.connect(rg); rg.connect(master);
    this.reverb = conv;
    return ctx;
  },
  unlock() { // call inside a user gesture (iOS)
    if (!store.sound) return;
    const ctx = this.ensure(); if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    this.applyMute();
    try { const b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start(0); } catch {}
  },
  applyMute() { // ramp the master kill switch to follow store.sound — silences ALL sound
    if (!this.muteGain || !this.ctx) return;
    const t = this.ctx.currentTime, g = this.muteGain.gain;
    try { g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(store.sound ? 1 : 0, t + 0.08); } catch {}
  },
  // a struck singing bowl: inharmonic partials + beating + long decay
  bowl(freq, dur = 5, gain = 0.16) {
    if (!store.sound) return; const ctx = this.ensure(); if (!ctx) return;
    const t = ctx.currentTime;
    const out = ctx.createGain(); out.gain.value = gain; out.connect(this.master);
    const send = ctx.createGain(); send.gain.value = 0.55; out.connect(send); send.connect(this.reverb);
    const ratios = [1, 2.76, 5.4, 8.93], pg = [1, 0.45, 0.22, 0.1];
    ratios.forEach((r, i) => {
      const voices = i === 0 ? [0, 6] : [0]; // detuned pair on fundamental -> shimmer/beating
      voices.forEach((det) => {
        const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = freq * r; o.detune.value = det;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(pg[i] * (det ? 0.6 : 1), t + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur * (1 - i * 0.12));
        o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.1);
      });
    });
  },
  // koshi-style chime: a gentle cluster of bell tones. mul = octave brightness,
  // atk = onset softness (raise to take the "stark" edge off).
  chime(notes, gain = 0.06, mul = 2, atk = 0.006) {
    if (!store.sound) return; const ctx = this.ensure(); if (!ctx) return;
    const base = ctx.currentTime;
    notes.forEach((f, i) => {
      const t = base + i * 0.1, dur = 2.4;
      [[mul, "triangle", gain], [mul * 2.76, "sine", gain * 0.28]].forEach(([m, type, gn]) => {
        const o = ctx.createOscillator(); o.type = type; o.frequency.value = f * m;
        const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gn, t + atk); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(this.master); g.connect(this.reverb); o.start(t); o.stop(t + dur + 0.05);
      });
    });
  },
  // soft per-breath accent layered under the breath voice (the chimes, kept gentle)
  accent(base) {
    const s = this.scale;
    if (base === "Inhale") this.chime([s[1], s[3]], 0.035, 1.5, 0.03); // lower, quieter, soft onset (no longer stark)
    else if (base === "Exhale") this.bowl(s[0], 5, 0.09);              // warm low bowl
    else if (base === "Top-up") this.chime([s[4]], 0.03, 2, 0.012);
  },
  startAmbient() {
    if (!store.sound) return; const ctx = this.ensure(); if (!ctx || this.pad) return;
    const padGain = ctx.createGain(); padGain.gain.setValueAtTime(0, ctx.currentTime); padGain.gain.linearRampToValueAtTime(0.045, ctx.currentTime + 5);
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 650; lp.Q.value = 0.4;
    padGain.connect(lp); lp.connect(this.master); lp.connect(this.reverb);
    const nodes = [];
    [98.0, 146.83, 196.0].forEach((f, idx) => {
      [-4, 5].forEach((det) => { const o = ctx.createOscillator(); o.type = idx === 0 ? "sine" : "triangle"; o.frequency.value = f; o.detune.value = det; const g = ctx.createGain(); g.gain.value = idx === 0 ? 0.5 : 0.22; o.connect(g); g.connect(padGain); o.start(); nodes.push(o); });
    });
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.05; const lg = ctx.createGain(); lg.gain.value = 160; lfo.connect(lg); lg.connect(lp.frequency); lfo.start(); nodes.push(lfo);
    this.pad = { padGain, nodes };

    // breath voice: looping noise shaped by a sweeping band -> an audible breath
    // that swells on the inhale and falls on the exhale (Open-style guide).
    const src = ctx.createBufferSource(); src.buffer = this._noise(); src.loop = true;
    const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 130; // drop rumble
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 700; bp.Q.value = 0.6; // broad, airy
    const tame = ctx.createBiquadFilter(); tame.type = "lowpass"; tame.frequency.value = 2100; // cut harsh hiss -> breathier
    const bg = ctx.createGain(); bg.gain.value = 0.0001;
    src.connect(hp); hp.connect(bp); bp.connect(tame); tame.connect(bg); bg.connect(this.master);
    const bsend = ctx.createGain(); bsend.gain.value = 0.25; bg.connect(bsend); bsend.connect(this.reverb);
    src.start();
    this.breathV = { src, filter: bp, gain: bg };
  },
  stopAmbient() {
    const t = this.ctx ? this.ctx.currentTime : 0;
    if (this.pad && this.ctx) {
      const { padGain, nodes } = this.pad;
      try { padGain.gain.cancelScheduledValues(t); padGain.gain.setValueAtTime(padGain.gain.value, t); padGain.gain.linearRampToValueAtTime(0, t + 2.5); } catch {}
      nodes.forEach((o) => { try { o.stop(t + 2.6); } catch {} });
      this.pad = null;
    }
    if (this.breathV && this.ctx) {
      const { src, gain } = this.breathV;
      try { gain.gain.cancelScheduledValues(t); gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), t); gain.gain.linearRampToValueAtTime(0.0001, t + 0.6); } catch {}
      try { src.stop(t + 0.7); } catch {}
      this.breathV = null;
    }
  },
  _noise() { // pink noise — softer / airier / more breath-like than white
    if (this._nb) return this._nb;
    const ctx = this.ctx, len = Math.floor(ctx.sampleRate * 2), b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }
    this._nb = b; return b;
  },
  // shape the breath voice over a phase: type = first word of the label, secs = duration
  breath(type, secs) {
    if (!store.sound || !this.ctx || !this.breathV) return;
    const t = this.ctx.currentTime, g = this.breathV.gain.gain, f = this.breathV.filter.frequency;
    const safe = Math.max(0.0001, g.value);
    try { g.cancelScheduledValues(t); f.cancelScheduledValues(t); g.setValueAtTime(safe, t); f.setValueAtTime(f.value, t); } catch {}
    if (type === "Inhale") {                 // swell in, gently brighten (soft)
      g.linearRampToValueAtTime(0.3, t + secs * 0.55);
      g.linearRampToValueAtTime(0.04, t + secs);
      f.setValueAtTime(480, t); f.exponentialRampToValueAtTime(1150, t + secs);
    } else if (type === "Top-up") {          // settle at the top of the inhale, then a gentle sip
      const sipAt = secs * 0.42;
      g.linearRampToValueAtTime(0.05, t + sipAt);                                  // hold quiet at the top
      g.linearRampToValueAtTime(0.34, t + sipAt + Math.min(0.45, secs * 0.32));    // the sip
      g.linearRampToValueAtTime(0.03, t + secs);
      f.setValueAtTime(700, t); f.exponentialRampToValueAtTime(1400, t + secs);
    } else if (type === "Exhale") {          // long sighing release, darken
      g.linearRampToValueAtTime(0.27, t + secs * 0.28);
      g.linearRampToValueAtTime(0.0001, t + secs);
      f.setValueAtTime(900, t); f.exponentialRampToValueAtTime(300, t + secs);
    } else {                                 // Hold: breath suspended
      g.linearRampToValueAtTime(0.0001, t + Math.min(0.6, secs * 0.3));
    }
  },
  complete() { this.bowl(this.scale[2], 6.5, 0.2); setTimeout(() => this.chime([this.scale[2], this.scale[3], this.scale[4], this.scale[5]], 0.08), 450); },
};

/* full screen: works on desktop + Android (must be inside a user gesture). iOS
   Safari has no element fullscreen API, but an installed home-screen PWA already
   runs edge-to-edge, so this is a no-op there. */
function enterFullscreen() {
  const el = document.documentElement;
  const req = el.requestFullscreen || el.webkitRequestFullscreen || el.webkitRequestFullScreen;
  if (req) { try { const r = req.call(el); if (r && r.catch) r.catch(() => {}); } catch {} }
}
function exitFullscreen() {
  if (!(document.fullscreenElement || document.webkitFullscreenElement)) return;
  const ex = document.exitFullscreen || document.webkitExitFullscreen;
  if (ex) { try { const r = ex.call(document); if (r && r.catch) r.catch(() => {}); } catch {} }
}

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
let current = "practice";

function render(route = current) {
  current = route;
  document.documentElement.style.removeProperty("--c");
  document.body.style.background = "var(--ground)";
  if (route === "practice") app.replaceChildren(Practice());
  if (route === "journey") app.replaceChildren(Journey());
  renderTabs();
  window.scrollTo(0, 0);
}

function renderTabs() {
  tabbar.hidden = false;
  const tab = (id, label) => `<button class="tab" data-route="${id}" aria-current="${current === id}">${label}</button>`;
  tabbar.innerHTML = tab("practice", "Practice") + tab("journey", "Journey");
  tabbar.querySelectorAll(".tab").forEach((b) => b.addEventListener("click", () => render(b.dataset.route)));
}

/* ----- Practice (recommended + full library, unified) ----- */
function Practice() {
  const now = new Date();
  const hr = now.getHours();
  const greet = hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening";
  const featured = hr < 12 ? byId("energy") : hr >= 18 ? byId("sleep") : byId("balance");
  const st = stats();
  const dateStr = now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const status = st.streak > 0
    ? `You're on a <b>${st.streak}-day</b> streak. Welcome back.`
    : "Come home to yourself. A few mindful breaths is all it takes.";

  const groups = { center: "Center", soothe: "Soothe", rest: "Rest", energize: "Energize" };
  const row = (p) => `<button class="prow" data-pick="${p.id}" style="--c:${p.color}">
      <span class="prow__rail">${ICONS[p.icon]}</span>
      <span class="prow__body">
        <span class="prow__name">${p.name}</span>
        <span class="prow__tech">${p.technique}</span>
        <span class="prow__rhythm">${p.rhythm}</span>
      </span>
      <span class="prow__chev">${UI.chev}</span>
    </button>`;
  const library = Object.entries(groups).map(([k, label]) => {
    const items = PATTERNS.filter((p) => p.group === k);
    return `<div class="section-label"><span class="eyebrow eyebrow--rule">${label}</span></div><div class="plist">${items.map(row).join("")}</div>`;
  }).join("");

  const el = h(`<main class="screen">
    <div class="p-head">
      <img class="p-logo" src="./assets/img/tyl-horizontal-espresso.png" alt="The Yoga Loft" />
      <div class="p-date">${dateStr}</div>
    </div>

    <div class="greeting">
      <div class="greeting__hi">${greet}</div>
      <div class="greeting__line">${status}</div>
    </div>

    <button class="hero" data-pick="${featured.id}">
      <div class="hero__img" style="background-image:url('./assets/img/hero.jpg')"></div>
      <div class="hero__scrim"></div>
      <div class="hero__body">
        <span class="eyebrow eyebrow--rule hero__eyebrow">Recommended</span>
        <div class="hero__name">${featured.name}</div>
        <div class="hero__desc">${featured.desc}</div>
        <span class="hero__btn">Begin breathing</span>
      </div>
    </button>

    ${library}
  </main>`);

  el.querySelectorAll("[data-pick]").forEach((b) => b.addEventListener("click", () => openSheet(b.dataset.pick)));
  return el;
}

/* ----- Journey (history) ----- */
function Journey() {
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
    ? sessions.slice(0, 40).map((s) => {
        const p = byId(s.patternId) || { name: "Session", icon: "calm", color: "#716050" };
        return `<div class="log-row">
          <div class="log-row__mark" style="--c:${p.color}">${ICONS[p.icon] || ""}</div>
          <div class="log-row__body"><div class="log-row__name">${p.name}</div><div class="log-row__when">${relTime(s.ts)}</div></div>
          <div class="log-row__dur">${Math.max(1, Math.round(s.durationSec / 60))} min</div>
        </div>`;
      }).join("")
    : `<div class="empty"><span class="script">your story begins here</span><p>Complete your first breath and it will appear here.</p></div>`;

  return h(`<main class="screen">
    <span class="eyebrow eyebrow--rule">Your practice</span>
    <h1 class="screen__title">Journey</h1>
    <div class="jstats">
      <div class="jstat"><div class="jstat__v">${st.streak}</div><div class="jstat__l">Day streak</div></div>
      <div class="jstat"><div class="jstat__v">${st.count}</div><div class="jstat__l">Sessions</div></div>
      <div class="jstat"><div class="jstat__v">${st.totalMin}</div><div class="jstat__l">Minutes</div></div>
    </div>
    <div class="section-label"><span class="eyebrow eyebrow--rule">Last 4 weeks</span></div>
    <div class="cal">${cells.join("")}</div>
    <div class="section-label"><span class="eyebrow eyebrow--rule">Recent</span></div>
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
      <div class="sheet__mark" style="--c:${p.color}">${ICONS[p.icon]}</div>
      <div class="sheet__eyebrow"><span class="eyebrow">${p.technique}</span></div>
      <div class="sheet__title">${p.name}</div>
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
    if (store.sound) { Snd.unlock(); Snd.chime([Snd.scale[1], Snd.scale[3]], 0.035, 1.5, 0.03); haptic(1); }
    else Snd.applyMute();
  });

  scrim.querySelector(".sheet__begin").addEventListener("click", () => {
    Snd.unlock();           // unlock audio inside the user gesture (iOS)
    enterFullscreen();      // request true full screen inside the gesture
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
  // match by first word so directional labels ("Inhale L", "Exhale R") resolve
  const targetOf = (ph, prev) => {
    if (ph[2] != null) return ph[2];
    const base = ph[0].split(" ")[0];
    return base === "Inhale" || base === "Top-up" ? 1 : base === "Exhale" ? 0.42 : prev;
  };
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
        <div class="count-track"></div>
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
  const trackEl = el.querySelector(".count-track");
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
    const base = ph.label.split(" ")[0];
    const key = Math.floor(e / cycleDur) * 100 + idx;
    if (key !== session.lastKey) {       // crossed into a new phase
      session.lastKey = key;
      phaseEl.textContent = ph.label === "Top-up" ? "Top up" : ph.label;
      ringsBox.classList.toggle("holding", ph.label === "Hold");
      Snd.breath(base, ph.secs);             // audible breath that follows the pace (in, out, sip, sigh)
      if (ph.secs >= 1.8) Snd.accent(base);  // soft chime/bowl on top (skip on very fast paces)
      haptic(1);
      // build the count track for this phase — shows where you are and what's next
      session.trackN = Math.max(1, Math.ceil(ph.secs - 0.001));
      session.lastCount = -1;
      trackEl.innerHTML = Array.from({ length: session.trackN }, (_, i) => `<span class="ct">${session.trackN - i}</span>`).join("");
    }
    // motion — natural turnaround pauses, like true breath: a brief settle at the
    // top of the inhale (end-inspiratory pause) and a slightly longer one at the
    // bottom of the exhale (end-expiratory pause). The breath reaches its target
    // a little early and rests before reversing. Durations/counts are unchanged.
    let p01 = ph.secs ? into / ph.secs : 1;
    if (ph.label === "Top-up") p01 = clamp01((p01 - 0.42) / 0.58);   // sip waits, then rises
    else if (base === "Inhale") p01 = clamp01(p01 / 0.9);            // ~10% rest at the top
    else if (base === "Exhale") p01 = clamp01(p01 / 0.84);           // ~16% rest at the bottom
    paint(ph.from, ph.to, p01);
    // advance the count-track marker
    const cur = Math.max(1, Math.ceil(ph.secs - into - 0.001));
    if (cur !== session.lastCount) {
      session.lastCount = cur;
      const aidx = session.trackN - cur, kids = trackEl.children;
      for (let i = 0; i < kids.length; i++) kids[i].className = "ct" + (i < aidx ? " ct--past" : i === aidx ? " ct--on" : " ct--next");
    }
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
      Snd.startAmbient();
      session.t0 = performance.now();
      session.tick = setInterval(step, TICK_MS);
      step();
    } else {
      rn.textContent = n;
      rn.style.animation = "none"; void rn.offsetWidth; rn.style.animation = "";
    }
  }, 1000);

  el.querySelector("[data-close]").addEventListener("click", () => endSession(el));
  el.querySelector("[data-sound]").addEventListener("click", (e) => {
    store.sound = !store.sound;
    e.currentTarget.innerHTML = store.sound ? UI.sound : UI.soundOff;
    if (store.sound) { Snd.unlock(); Snd.startAmbient(); } // restart the bed/breath if it was started muted
    else Snd.applyMute();                                  // hard-silence everything still ringing
  });
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
function endSession(el) { clearSession(); Snd.stopAmbient(); exitFullscreen(); el.remove(); session = null; render(current); }

function finishSession(el, p, totalSec) {
  clearSession();
  Snd.stopAmbient();
  store.log(p.id, totalSec);
  Snd.complete();
  haptic(3);
  const st = stats();

  const done = h(`<div class="complete">
    <div class="complete__script script">come home to yourself</div>
    <div class="complete__title">${p.name} Complete</div>
    <div class="complete__line">${Math.max(1, Math.round(totalSec / 60))} minutes of ${p.name.toLowerCase()} breathing. Progress, not perfection.</div>
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
  done.querySelector(".complete__btn").addEventListener("click", () => { exitFullscreen(); el.remove(); session = null; render("practice"); });
}

/* ---------- helpers ---------- */
function fmt(sec) { sec = Math.max(0, Math.round(sec)); return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`; }

/* ---------- boot ---------- */
// ask the browser to keep our data (Journey/streaks) from being evicted
try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch {}
render("practice");
