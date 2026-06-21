# breathe.

A beautifully simple breathwork PWA. Monochrome, calm, installable to your
iPhone home screen. Inspired by the Stoic and Walden design language.

No build step, no dependencies. Plain HTML + CSS + a single JS module.

A warm Eames / Maeda remix over a calm monochrome core: paper-warm chrome,
playful geometric icon marks, and a session that blooms into each pattern's
identity color with rippling concentric rings (in the spirit of the orange /
electric-blue / black breathing references).

## Features
- Eight research-backed patterns, each with its own identity color:
  - **Energy** — energizing, inhale-biased 4-2 (with a safety note)
  - **Creativity** — open awareness 4-2-6-2
  - **Balance** — coherent / resonant breathing, 5.5 in / 5.5 out (~5.5 bpm)
  - **Focus** — box breathing 4-4-4-4
  - **Unwind** — extended exhale 4-6
  - **Reset** — physiological sigh (double inhale + long exhale)
  - **Calm** — 4-7-8 (Dr. Weil), counted in breaths (4 or 8), not minutes
  - **Sleep** — wind-down 4-2-8
- Pacing is exact: one elapsed-time clock drives the ring scale, the count, and
  the phase together with an easeInOutSine curve, so the motion tracks the
  breath cue with no lag, drift, or snapping. Holds show a gentle shimmer.
- Immersive session that floods to the pattern's color with rippling concentric
  rings pacing inhale / hold / exhale
- Optional soft audio tones + haptics that cue each phase

Timings are sourced from breathwork research (HeartMath resonance, Dr. Weil's
4-7-8, Huberman's physiological sigh, Breathwrk/Calm conventions).
- 1 / 2 / 4 minute durations
- Streaks, total minutes, session history (stored locally on device)
- Works fully offline once installed (service worker)

## Run it locally
From this folder:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173` in your browser.

## Put it on your iPhone (the part you asked for)

iOS lets you "Add to Home Screen" and the app launches full screen, no browser
chrome, with its own icon. There are two ways to get it on the phone:

### Option A — same Wi-Fi, quickest
1. Make sure your Mac and iPhone are on the same Wi-Fi network.
2. Run the server: `python3 -m http.server 4173`
3. Find your Mac's IP: `ipconfig getifaddr en0` (e.g. `192.168.1.42`).
4. On the iPhone, open Safari and go to `http://192.168.1.42:4173`.
5. Tap the Share button, then **Add to Home Screen**.

Note: over plain `http` on the LAN the home-screen app runs full screen, but
true offline caching (the service worker) only activates over HTTPS or
`localhost`. For full offline use, deploy it (Option B).

### Option B — deploy for HTTPS + offline (recommended)
Any static host works. This folder is the entire site.

- **Netlify Drop:** drag this folder onto https://app.netlify.com/drop
- **Vercel:** `npx vercel` from this folder
- **Cloudflare Pages / GitHub Pages:** point them at this folder

Then open the HTTPS URL in Safari on the iPhone and **Add to Home Screen**.
Once installed it works offline and updates itself when you reconnect.

## Project layout
```
index.html        app shell + PWA / iOS meta tags
styles.css        the entire design system (monochrome, house style)
app.js            patterns, breathing engine, audio, all screens
sw.js             service worker (offline caching)
manifest.webmanifest
icons/            generated app icons (concentric rings on black)
scripts/make_icons.py   regenerate the icons
```

## Customising
- **Add a pattern:** add an entry to `PATTERNS` in `app.js` with a `color`.
  Each phase is `["Inhale" | "Hold" | "Exhale", seconds]`. Inhale expands the
  rings, Exhale contracts them, Hold holds. The color drives the card tint,
  the sheet, and the session field.
- **Add its icon:** add a geometric SVG mark to `ICONS` in `app.js` (use the
  `M(...)` helper; draw in `currentColor` so it picks up the pattern color).
- **Colors / type / spacing:** all tokens live at the top of `styles.css`.
- **Regenerate icons:** `python3 scripts/make_icons.py`.
