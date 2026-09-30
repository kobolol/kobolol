// SVG templates for the sunset-mountains profile. Every exported function returns a complete SVG string.
// Motion uses SMIL (bob, sway, flapping, flames, typing) and CSS keyframes (parallax, clouds, flights),
// both of which keep running when GitHub embeds the SVG through an <img> tag.
import { ICONS } from './icons.mjs';

const SANS = "'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif";
const MONO = "ui-monospace, 'SF Mono', 'Cascadia Code', Consolas, 'DejaVu Sans Mono', monospace";

export const C = {
  text: '#fff6ee',
  muted: '#f6cfdc',
  gold: '#ffd27a',
  orange: '#ff9a5a',
  pink: '#ff7aa8',
  purple: '#a27bff',
  line: '#ffb3c7',
};

const SKY = {
  sunset: ['#1d1340', '#4a2178', '#a13d86', '#ef6a78', '#ffb36b'],
  dusk: ['#150f36', '#34196c', '#7c2f80', '#d2587a', '#f7a06c'],
  night: ['#0b0a24', '#1b1445', '#351d5f', '#5f2a6f', '#94406e'],
};

// Mountain layers from far (hazy, sunlit) to near (dark silhouette).
const RIDGES = [
  { color: '#c07aa6', rim: '#ffd9c2', snow: true },
  { color: '#9a55a0', rim: '#ffc0b8' },
  { color: '#6c3888', rim: '#ff9fb5' },
  { color: '#43226a', rim: '#d27bb0' },
  { color: '#1f1238', rim: '#8a4f9c', trees: true },
];

const ACCENTS = [C.gold, C.pink, C.purple, '#5eead4', '#60a5fa', '#94a3b8'];

export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash(str) {
  let h = 2166136261;
  for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

const r1 = (n) => Math.round(n * 10) / 10;
let uid = 0;
const id = (p) => `${p}${++uid}`;

const SPLINE2 = 'calcMode="spline" keyTimes="0;.5;1" keySplines=".45 0 .55 1;.45 0 .55 1"';

function sway(deg, cx, cy, dur, delay = 0) {
  return `<animateTransform attributeName="transform" type="rotate" values="${-deg} ${r1(cx)} ${r1(cy)};${deg} ${r1(cx)} ${r1(cy)};${-deg} ${r1(cx)} ${r1(cy)}" dur="${r1(dur)}s" begin="-${r1(delay)}s" repeatCount="indefinite" ${SPLINE2}/>`;
}

function bob(dy, dur, delay = 0) {
  return `<animateTransform attributeName="transform" type="translate" values="0 0;0 ${dy};0 0" dur="${r1(dur)}s" begin="-${r1(delay)}s" repeatCount="indefinite" ${SPLINE2}/>`;
}

function smooth(pts) {
  let d = `M${r1(pts[0][0])} ${r1(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    d += `C${r1(p1[0] + (p2[0] - p0[0]) / 6)} ${r1(p1[1] + (p2[1] - p0[1]) / 6)} ${r1(p2[0] - (p3[0] - p1[0]) / 6)} ${r1(p2[1] - (p3[1] - p1[1]) / 6)} ${r1(p2[0])} ${r1(p2[1])}`;
  }
  return d;
}

// ---------- sky ----------

function stars(w, h, count, rand) {
  let out = '';
  for (let i = 0; i < count; i++) {
    const y = rand() ** 1.8 * h * 0.55;
    const fade = 1 - y / (h * 0.55);
    const r = r1(0.4 + rand() ** 3 * 1.3);
    const x = r1(rand() * w);
    if (rand() < 0.4) {
      const dur = r1(2 + rand() * 4);
      out += `<circle class="tw" cx="${x}" cy="${r1(y)}" r="${r}" fill="#fff" style="animation-duration:${dur}s;animation-delay:-${r1(rand() * dur)}s;--o:${r1(fade)}"/>`;
    } else {
      out += `<circle cx="${x}" cy="${r1(y)}" r="${r}" fill="#fff" opacity="${r1(fade * (0.3 + rand() * 0.6))}"/>`;
    }
  }
  return `<g>${out}</g>`;
}

function sun(x, y, r, { rays = true, sink = 26, dur = 20 } = {}) {
  let beams = '';
  if (rays) {
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const a1 = a - 0.05, a2 = a + 0.05;
      const R = r * 5;
      beams += `<polygon points="0,0 ${r1(Math.cos(a1) * R)},${r1(Math.sin(a1) * R)} ${r1(Math.cos(a2) * R)},${r1(Math.sin(a2) * R)}"/>`;
    }
    beams = `<g fill="url(#beam)" opacity=".5"><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="120s" repeatCount="indefinite"/>${beams}</g>`;
  }
  return `<g transform="translate(${x} ${y})"><g class="sink" style="animation-duration:${dur}s;--s:${sink}px">
<circle r="${r * 3.2}" fill="url(#halo)"/>
${beams}
<circle r="${r * 1.35}" fill="${C.gold}" opacity=".35" filter="url(#glow)"/>
<circle r="${r}" fill="url(#sun)"/>
</g></g>`;
}

function cloud(x, y, s, rand) {
  let puffs = '';
  const n = 4 + Math.floor(rand() * 3);
  for (let i = 0; i < n; i++) {
    const px = (i - n / 2) * 26 + (rand() - 0.5) * 10;
    puffs += `<ellipse cx="${r1(px)}" cy="${r1((rand() - 0.5) * 6)}" rx="${r1(28 + rand() * 20)}" ry="${r1(7 + rand() * 5)}"/>`;
  }
  return `<g transform="translate(${r1(x)} ${r1(y)}) scale(${r1(s * 100) / 100})"><g fill="url(#cloud)">${puffs}</g><g fill="${C.gold}" opacity=".35" transform="translate(0 5)">${puffs}</g></g>`;
}

function clouds(w, count, rand, top, bottom) {
  let out = '';
  for (let i = 0; i < count; i++) {
    const dur = 70 + rand() * 60;
    out += `<g class="cloud" style="animation-duration:${r1(dur)}s;animation-delay:-${r1(rand() * dur)}s">${cloud(0, top + rand() * (bottom - top), 0.6 + rand() * 0.8, rand)}</g>`;
  }
  return `<g opacity=".9">${out}</g>`;
}

const WING_UP = 'M-9 0Q-4.5 -6 0 0Q4.5 -6 9 0';
const WING_DOWN = 'M-9 3Q-4.5 3 0 0Q4.5 3 9 3';

function bird(x, y, s, delay) {
  return `<g transform="translate(${r1(x)} ${r1(y)}) scale(${r1(s * 100) / 100})"><path d="${WING_UP}" stroke="#2a1638" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><animate attributeName="d" values="${WING_UP};${WING_DOWN};${WING_UP}" dur=".7s" begin="-${r1(delay)}s" repeatCount="indefinite"/></path></g>`;
}

function flock(y, rand, { dur = 30, delay = 0, count = 7, scale = 1 } = {}) {
  let birds = '';
  for (let i = 0; i < count; i++) {
    const row = Math.ceil(i / 2);
    const side = i % 2 ? 1 : -1;
    birds += `<g>${bob(3 + rand() * 4, 2 + rand() * 2, rand() * 3)}${bird(-row * 22, i ? side * row * 11 : 0, scale * (0.8 + rand() * 0.3), rand())}</g>`;
  }
  return `<g transform="translate(0 ${y})"><g class="fly" style="animation-duration:${r1(dur)}s;animation-delay:-${r1(delay)}s">${birds}</g></g>`;
}

function shootingStar(x, y, delay) {
  return `<g class="shoot" style="animation-delay:${delay}s"><line x1="${x}" y1="${y}" x2="${x + 70}" y2="${y - 26}" stroke="url(#trail)" stroke-width="1.6" stroke-linecap="round"/></g>`;
}

// ---------- mountains ----------

// Periodic midpoint displacement: heights[i] repeats with period P, so a layer can pan forever.
function ridgeHeights(rand, rough = 0.52, iterations = 5) {
  let h = [rand(), rand(), rand(), rand()];
  let scale = 0.55;
  for (let i = 0; i < iterations; i++) {
    const next = [];
    for (let j = 0; j < h.length; j++) {
      const a = h[j], b = h[(j + 1) % h.length];
      next.push(a, (a + b) / 2 + (rand() - 0.5) * scale);
    }
    h = next;
    scale *= rough;
  }
  const min = Math.min(...h), max = Math.max(...h);
  return h.map((v) => (v - min) / (max - min));
}

function tree(x, y, hgt, color) {
  const w = hgt * 0.5;
  const tri = (top, th, tw) => `M${r1(x)} ${r1(top)}L${r1(x + tw / 2)} ${r1(top + th)}L${r1(x - tw / 2)} ${r1(top + th)}Z`;
  return `<path d="${tri(y - hgt, hgt * 0.45, w * 0.55)}${tri(y - hgt * 0.72, hgt * 0.48, w * 0.8)}${tri(y - hgt * 0.45, hgt * 0.5, w)}" fill="${color}"/><rect x="${r1(x - 1.2)}" y="${r1(y + 0.05 * hgt)}" width="2.4" height="${r1(hgt * 0.12)}" fill="${color}"/>`;
}

function mountainLayer(P, H, rand, { base, amp, color, rim, snow = false, trees = false, dur = 100 }) {
  const heights = ridgeHeights(rand);
  const n = heights.length;
  const step = P / n;
  const ys = heights.map((v) => base - v * amp);
  const pts = [];
  for (let i = 0; i <= n * 2; i++) pts.push([r1(i * step), r1(ys[i % n])]);
  const ridge = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join('');
  const shape = `${ridge}L${2 * P} ${H}L0 ${H}Z`;

  let snowCap = '';
  if (snow) {
    const clip = id('peak');
    const line = base - amp * 0.62;
    const jag = [];
    for (let x = 0; x <= P; x += 14) jag.push(line + (rand() - 0.5) * 14);
    jag[jag.length - 1] = jag[0];
    const edge = [...jag, ...jag.slice(1)].map((y, i) => `L${r1(i * 14)} ${r1(y)}`).join('');
    snowCap = `<clipPath id="${clip}"><path d="${shape}"/></clipPath><path d="M0 0${edge}L${2 * P} 0Z" fill="url(#snow)" clip-path="url(#${clip})"/>`;
  }

  let forest = '';
  if (trees) {
    const count = Math.round(P / 26);
    for (let k = 0; k < count; k++) {
      const x = ((k + rand() * 0.8) * P) / count;
      const i = Math.floor(x / step);
      const y = ys[i % n] + (ys[(i + 1) % n] - ys[i % n]) * (x / step - i) + 3;
      const th = 12 + rand() * 20;
      forest += tree(x, y, th, color) + tree(x + P, y, th, color);
    }
  }

  return `<g class="pan" style="animation-duration:${dur}s">
<path d="${shape}" fill="${color}"/>
${snowCap}
<path d="${ridge}" stroke="${rim}" stroke-opacity=".7" stroke-width="1.6" stroke-linejoin="round"/>
${forest}
</g>`;
}

function mist(w, y, rand, count = 3) {
  let out = '';
  for (let i = 0; i < count; i++) {
    const dur = 16 + rand() * 12;
    out += `<g class="mist" style="animation-duration:${r1(dur)}s;animation-delay:-${r1(rand() * dur)}s"><ellipse cx="${r1(rand() * w)}" cy="${r1(y + (rand() - 0.5) * 10)}" rx="${r1(w * (0.2 + rand() * 0.25))}" ry="${r1(8 + rand() * 8)}" fill="#ffd9e8" opacity=".32" filter="url(#soft)"/></g>`;
  }
  return out;
}

// Stack of mountain layers between `top` (far ridge base) and `bottom` (near ridge base).
function range(w, h, rand, { top, bottom, amps = [110, 90, 75, 55, 40], durs = [260, 180, 120, 80, 50], layers = RIDGES, mists = [1, 2] } = {}) {
  const n = layers.length;
  let out = '';
  layers.forEach((l, i) => {
    const base = top + ((bottom - top) * i) / (n - 1);
    out += mountainLayer(w, h, rand, { ...l, base, amp: amps[i], dur: durs[i] });
    if (mists.includes(i)) out += mist(w, base + 6, rand);
  });
  return out;
}

// ---------- frame ----------

function frame(w, h, body, { sky = 'sunset', seed = 1, starCount = 60, defs = '', css = '', radius = 18, title = '', sparksAt = null } = {}) {
  const rand = rng(seed);
  const s = SKY[sky];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" role="img"${title ? ` aria-label="${esc(title)}"` : ''}>
<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s[0]}"/><stop offset=".3" stop-color="${s[1]}"/><stop offset=".55" stop-color="${s[2]}"/><stop offset=".78" stop-color="${s[3]}"/><stop offset="1" stop-color="${s[4]}"/></linearGradient>
<radialGradient id="sun" cx=".45" cy=".4" r=".7"><stop offset="0" stop-color="#fffbe6"/><stop offset=".45" stop-color="#ffd27a"/><stop offset="1" stop-color="#ff7a5a"/></radialGradient>
<radialGradient id="halo"><stop offset="0" stop-color="#ffb36b" stop-opacity=".75"/><stop offset=".45" stop-color="#ff7a8a" stop-opacity=".25"/><stop offset="1" stop-color="#ff7a8a" stop-opacity="0"/></radialGradient>
<radialGradient id="beam" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="scale(300)"><stop offset="0" stop-color="#fff1c9" stop-opacity=".7"/><stop offset="1" stop-color="#fff1c9" stop-opacity="0"/></radialGradient>
<linearGradient id="cloud" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b3a8f" stop-opacity=".85"/><stop offset="1" stop-color="#ff8f8f" stop-opacity=".9"/></linearGradient>
<linearGradient id="snow" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffe9f0"/><stop offset=".6" stop-color="#ffd0c4"/><stop offset="1" stop-color="#ffb6a6"/></linearGradient>
<linearGradient id="trail" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<linearGradient id="txt" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#ffe2c2"/><stop offset="1" stop-color="${C.gold}"/></linearGradient>
<clipPath id="round"><rect width="${w}" height="${h}" rx="${radius}"/></clipPath>
<filter id="shadow" x="-10%" y="-30%" width="120%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#1a0b2e" flood-opacity=".8"/></filter>
<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10"/></filter>
<filter id="soft" x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="8"/></filter>
${defs}
</defs>
<style>
.sans{font-family:${SANS}}
.mono{font-family:${MONO}}
.tw{animation:tw 4s ease-in-out infinite}
@keyframes tw{0%,100%{opacity:.15}50%{opacity:var(--o,1)}}
.sink{animation:sink 20s ease-in-out infinite alternate}
@keyframes sink{from{transform:translateY(0)}to{transform:translateY(var(--s))}}
.pan{animation:pan 100s linear infinite}
@keyframes pan{to{transform:translateX(-${w}px)}}
.cloud{animation:cloud 90s linear infinite}
@keyframes cloud{from{transform:translateX(-260px)}to{transform:translateX(${w + 260}px)}}
.fly{animation:fly 30s linear infinite}
@keyframes fly{from{transform:translateX(-120px)}to{transform:translateX(${w + 160}px)}}
.mist{animation:mist 20s ease-in-out infinite alternate}
@keyframes mist{from{transform:translateX(-50px)}to{transform:translateX(50px)}}
.shoot{opacity:0;animation:shoot 9s linear infinite}
@keyframes shoot{0%{opacity:0;transform:translate(0,0)}2%{opacity:1}10%{opacity:0;transform:translate(-240px,90px)}100%{opacity:0;transform:translate(-240px,90px)}}
.spark{animation:spark 2.4s ease-out infinite}
@keyframes spark{0%{transform:translate(0,0);opacity:1}100%{transform:translate(var(--dx),-70px);opacity:0}}
${css}
</style>
<g clip-path="url(#round)">
<rect width="${w}" height="${h}" fill="url(#sky)"/>
${stars(w, h, starCount, rand)}
${body}
</g>
<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="${radius}" stroke="${C.line}" stroke-opacity=".45"/>
</svg>
`;
}

// Typewriter that cycles through `lines`, driven by discrete SMIL steps so it works inside <img>.
function typewriter(lines, { x, y, size = 20, cw = 12, color = C.text }) {
  const TYPE = 0.07, DEL = 0.028, HOLD = 1.9, GAP = 0.35;
  const frames = [];
  let t = 0;
  lines.forEach((line, i) => {
    for (let k = 1; k <= line.length; k++) { frames.push({ t, i, k }); t += TYPE; }
    t += HOLD;
    for (let k = line.length - 1; k >= 0; k--) { frames.push({ t, i, k }); t += DEL; }
    t += GAP;
  });
  const dur = r1(t);
  const keyTimes = frames.map((f) => (f.t / t).toFixed(5)).join(';');
  const anim = (attr, values) =>
    `<animate attributeName="${attr}" dur="${dur}s" repeatCount="indefinite" calcMode="discrete" keyTimes="${keyTimes}" values="${values.join(';')}"/>`;

  let clips = '';
  let texts = '';
  lines.forEach((line, i) => {
    clips += `<clipPath id="tw${i}"><rect x="${x}" y="${y - size}" height="${size * 1.6}" width="0">${anim('width', frames.map((f) => (f.i === i ? f.k * cw : 0)))}</rect></clipPath>`;
    texts += `<text class="mono" x="${x}" y="${y}" font-size="${size}" fill="${color}" textLength="${line.length * cw}" lengthAdjust="spacing" clip-path="url(#tw${i})" filter="url(#shadow)">${esc(line)}</text>`;
  });
  const cursor = `<rect class="blink" x="${x}" y="${y - size + 3}" width="${Math.round(cw * 0.75)}" height="${size}" fill="${C.gold}">${anim('x', frames.map((f) => x + f.k * cw))}</rect>`;
  return { defs: clips, body: texts + cursor };
}

// ---------- exported cards ----------

export function banner(p) {
  const W = 1000, H = 360;
  const rand = rng(17);
  const tw = typewriter(p.taglines, { x: 94, y: 222 });
  const body = `
${sun(770, 196, 56)}
${clouds(W, 5, rand, 60, 170)}
${shootingStar(420, 40, 2)}
${flock(118, rand, { dur: 34, delay: 8, count: 7 })}
${range(W, H, rand, { top: 222, bottom: 350 })}
${flock(168, rand, { dur: 26, delay: 20, count: 3, scale: 0.8 })}
<rect width="${W * 0.6}" height="${H}" fill="url(#vignette)"/>
<text class="mono" x="72" y="74" font-size="15" fill="${C.gold}" letter-spacing="1" filter="url(#shadow)">// summit log · ${esc(p.coords)}</text>
<text class="sans" x="68" y="146" font-size="66" font-weight="800" fill="url(#txt)" filter="url(#shadow)">Hi, I'm ${esc(p.name)}</text>
<text class="mono" x="72" y="178" font-size="15" fill="${C.muted}" filter="url(#shadow)">a.k.a. <tspan fill="${C.pink}">@${esc(p.handle)}</tspan></text>
<text class="mono" x="70" y="222" font-size="20" fill="${C.orange}" filter="url(#shadow)">&gt;</text>
${tw.body}
<g transform="translate(72 262)" filter="url(#shadow)">
  <circle cx="5" cy="-5" r="4" fill="${C.gold}"><animate attributeName="opacity" values="1;.2;1" dur="2s" repeatCount="indefinite"/></circle>
  <text class="mono" x="18" y="0" font-size="13" fill="${C.text}">altitude 2,962 m · ${esc(p.location)}</text>
</g>`;
  return frame(W, H, body, {
    sky: 'sunset',
    seed: 17,
    starCount: 90,
    title: `Hi, I'm ${p.name}`,
    defs: `${tw.defs}
<linearGradient id="vignette" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1a0b2e" stop-opacity=".45"/><stop offset="1" stop-color="#1a0b2e" stop-opacity="0"/></linearGradient>`,
    css: `.blink{animation:blink 1s steps(1) infinite}
@keyframes blink{50%{opacity:0}}`,
  });
}

function balloon(t, x, y, delay) {
  const clip = id('env');
  const env = 'M0 -46C30 -46 42 -20 38 2C34 20 16 30 9 40L-9 40C-16 30 -34 20 -38 2C-42 -20 -30 -46 0 -46Z';
  const s = 26;
  return `<g transform="translate(${x} ${y})"><g>${bob(-12, 5, delay)}<g>${sway(2.5, 0, -46, 6, delay)}
<clipPath id="${clip}"><path d="${env}"/></clipPath>
<ellipse cx="0" cy="-4" rx="52" ry="56" fill="${t.color}" opacity=".3" filter="url(#glow)"/>
<path d="M-7 40L-8 58M7 40L8 58" stroke="#3b2340" stroke-width="1.4"/>
<path d="${env}" fill="${t.color}"/>
<g clip-path="url(#${clip})">
  <ellipse cx="-24" cy="-2" rx="10" ry="52" fill="#000" opacity=".14"/>
  <ellipse cx="0" cy="-2" rx="10" ry="52" fill="#fff" opacity=".12"/>
  <ellipse cx="24" cy="-2" rx="10" ry="52" fill="#000" opacity=".14"/>
  <rect x="-40" y="-50" width="80" height="100" fill="url(#lit)"/>
</g>
<path d="${env}" stroke="#fff" stroke-opacity=".35" stroke-width="1.2"/>
<path d="${ICONS[t.icon]}" fill="${t.iconFill ?? '#fff'}" transform="translate(${-s / 2} ${-6 - s / 2}) scale(${r1((s / 24) * 100) / 100})"/>
<ellipse cy="46" rx="4" ry="6" fill="${C.gold}"><animate attributeName="opacity" values=".9;.4;1;.6;.9" dur="1.3s" begin="-${delay}s" repeatCount="indefinite"/></ellipse>
<rect x="-9" y="57" width="18" height="12" rx="2.5" fill="#8b5a2b" stroke="#4e2f14" stroke-width="1.2"/>
<path d="M-9 61H9" stroke="#4e2f14" stroke-width="1"/>
<text class="mono" y="90" text-anchor="middle" font-size="14" font-weight="700" fill="${C.text}" filter="url(#shadow)">${esc(t.label)}</text>
</g></g></g>`;
}

export function stack(p) {
  const W = 1000, H = 460;
  const rand = rng(29);
  const tag = (x, label) => `<g transform="translate(${x} 96)"><rect x="-58" y="-15" width="116" height="24" rx="12" fill="#1a0b2e" fill-opacity=".45" stroke="${C.line}" stroke-opacity=".55"/><text class="mono" y="2" text-anchor="middle" font-size="11" fill="${C.gold}" letter-spacing="2.5">${esc(label.toUpperCase())}</text></g>`;
  const slots = [[170, 196], [300, 256], [430, 196]];
  const inner = p.stack.inner.map((t, i) => balloon(t, slots[i][0], slots[i][1], i * 1.4)).join('');
  const outer = p.stack.outer.map((t, i) => balloon(t, slots[i][0] + 400, slots[i][1], i * 1.4 + 0.7)).join('');
  const body = `
${sun(520, 330, 48, { sink: 22 })}
${clouds(W, 4, rand, 120, 260)}
${range(W, H, rand, { top: 340, bottom: 450, amps: [100, 80, 60, 45, 32] })}
${flock(150, rand, { dur: 38, delay: 12, count: 5, scale: 0.8 })}
<text class="mono" x="36" y="46" font-size="13" fill="${C.gold}" letter-spacing="3" filter="url(#shadow)">TECH ALTITUDE</text>
<text class="mono" x="36" y="66" font-size="12" fill="${C.muted}" filter="url(#shadow)">// what lifts my code</text>
${tag(300, p.stack.innerLabel)}
${tag(700, p.stack.outerLabel)}
${inner}
${outer}`;
  const all = [...p.stack.inner, ...p.stack.outer].map((t) => t.label).join(', ');
  return frame(W, H, body, {
    sky: 'sunset',
    seed: 29,
    starCount: 70,
    title: `Tech stack: ${all}`,
    defs: `<linearGradient id="lit" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1a0b2e" stop-opacity=".35"/><stop offset=".6" stop-color="#1a0b2e" stop-opacity="0"/><stop offset="1" stop-color="#ffd27a" stop-opacity=".35"/></linearGradient>`,
  });
}

function wrap(text, max, lines) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const out = [''];
  for (const w of words) {
    const cur = out[out.length - 1];
    if ((cur + ' ' + w).trim().length <= max) out[out.length - 1] = (cur + ' ' + w).trim();
    else if (out.length < lines) out.push(w);
    else { out[out.length - 1] = cur.slice(0, max - 1).trimEnd() + '…'; return out; }
  }
  return out;
}

const truncate = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

function campfire(x, y, scale = 1) {
  const flame = (d, fill, dur, delay) => `<g><animateTransform attributeName="transform" type="scale" values="1 1;1.12 .88;.92 1.12;1.05 .95;1 1" dur="${dur}s" begin="-${delay}s" repeatCount="indefinite"/><path d="${d}" fill="${fill}"/></g>`;
  let sparks = '';
  for (let i = 0; i < 6; i++) {
    sparks += `<circle class="spark" cx="${(i - 3) * 2}" cy="-14" r="${1 + (i % 2) * 0.6}" fill="${C.gold}" style="--dx:${(i % 3 - 1) * 14}px;animation-delay:-${r1(i * 0.4)}s;animation-duration:${r1(1.8 + (i % 3) * 0.5)}s"/>`;
  }
  return `<g transform="translate(${x} ${y}) scale(${scale})">
<ellipse cy="-6" rx="46" ry="30" fill="#ff9a5a" opacity=".35" filter="url(#glow)"><animate attributeName="opacity" values=".35;.2;.4;.25;.35" dur="1.6s" repeatCount="indefinite"/></ellipse>
${flame('M-11 0C-14 -10 -6 -16 -4 -26C0 -18 4 -20 3 -30C10 -20 14 -10 11 0Z', '#ff5a3c', 0.7, 0)}
${flame('M-7 0C-9 -8 -3 -12 -1 -20C2 -13 5 -14 4 -21C8 -13 9 -7 7 0Z', '#ff9a3c', 0.55, 0.2)}
${flame('M-4 0C-5 -5 -1 -8 0 -13C2 -8 4 -6 4 0Z', '#ffe08a', 0.45, 0.1)}
${sparks}
<rect x="-16" y="-3" width="32" height="6" rx="3" fill="#5a3418" transform="rotate(12)"/>
<rect x="-16" y="-3" width="32" height="6" rx="3" fill="#6d4020" transform="rotate(-12)"/>
</g>`;
}

function tent(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
<path d="M-30 0L0 -38L30 0Z" fill="#2c1a4a" stroke="#ff9fb5" stroke-opacity=".4" stroke-width="1.2"/>
<path d="M-9 0L0 -26L9 0Z" fill="${C.gold}" opacity=".85"><animate attributeName="opacity" values=".85;.65;.9;.7;.85" dur="2s" repeatCount="indefinite"/></path>
<path d="M0 -38L0 -44" stroke="#ff9fb5" stroke-width="1.5"/>
</g>`;
}

function cabin(x, y) {
  return `<g transform="translate(${x} ${y})">
<path d="M-24 0V-20L0 -38L24 -20V0Z" fill="#241538"/>
<path d="M-28 -18L0 -42L28 -18" stroke="#ff9fb5" stroke-opacity=".5" stroke-width="2"/>
<rect x="-12" y="-17" width="9" height="9" fill="${C.gold}"><animate attributeName="opacity" values="1;.75;1" dur="3s" repeatCount="indefinite"/></rect>
<rect x="5" y="-14" width="8" height="14" fill="#3a2350"/>
<rect x="12" y="-40" width="5" height="12" fill="#241538"/>
</g>`;
}

function flag(x, y, color) {
  return `<g transform="translate(${x} ${y})"><path d="M0 0V-30" stroke="#fff" stroke-width="2"/><path d="M0 -30Q8 -33 16 -29Q10 -25 16 -21Q8 -24 0 -21Z" fill="${color}"><animate attributeName="d" values="M0 -30Q8 -33 16 -29Q10 -25 16 -21Q8 -24 0 -21Z;M0 -30Q8 -27 16 -30Q12 -25 16 -20Q8 -18 0 -21Z;M0 -30Q8 -33 16 -29Q10 -25 16 -21Q8 -24 0 -21Z" dur="1.4s" repeatCount="indefinite"/></path></g>`;
}

const DECOR = [
  (color) => `${tent(395, 158, 0.9)}${campfire(440, 164, 0.8)}`,
  () => cabin(420, 160),
  (color) => flag(420, 128, color),
  (color) => `${tent(430, 160, 0.8)}${flag(380, 150, color)}`,
];

export function missionCard(repo, index) {
  const W = 490, H = 180;
  const h = hash(repo.name);
  const rand = rng(h);
  const color = ACCENTS[h % 4];
  const desc = wrap(repo.description || 'Unmapped trail — no description yet.', 46, 2);
  const lang = repo.language || 'Unknown';
  const meta = [
    `<circle cx="34" cy="148" r="5" fill="${color}"/>`,
    `<text x="45" y="152">${esc(lang)}</text>`,
    `<text x="${58 + lang.length * 7.3}" y="152" fill="${C.gold}">★ ${repo.stars}</text>`,
    `<text x="${92 + lang.length * 7.3 + String(repo.stars).length * 7.3}" y="152" fill="${C.muted}">last hike ${esc(repo.pushed)}</text>`,
  ].join('');
  const decor = DECOR[h % DECOR.length](color);
  const body = `
${sun(360 + (h % 80), 118, 30, { rays: false, sink: 14, dur: 16 })}
${clouds(W, 2, rand, 30, 90)}
${flock(46 + (h % 30), rand, { dur: 22, delay: h % 17, count: 3, scale: 0.7 })}
${range(W, H, rand, { top: 136, bottom: 174, amps: [34, 28, 22, 16], durs: [200, 140, 90, 60], layers: RIDGES.slice(0, 2).concat(RIDGES.slice(3)), mists: [1] })}
${decor}
<text class="mono" x="464" y="30" text-anchor="end" font-size="10" fill="${C.gold}" letter-spacing="2" filter="url(#shadow)">TRAIL ${String(index + 1).padStart(2, '0')}</text>
<text class="sans" x="28" y="52" font-size="23" font-weight="800" fill="${C.text}" filter="url(#shadow)">${esc(truncate(repo.name, 24))}</text>
${desc.map((l, i) => `<text class="sans" x="28" y="${80 + i * 19}" font-size="13.5" fill="${C.muted}" filter="url(#shadow)">${esc(l)}</text>`).join('')}
<g class="mono" font-size="12" fill="${C.text}" filter="url(#shadow)">${meta}</g>`;
  return frame(W, H, body, {
    sky: index % 2 ? 'dusk' : 'sunset',
    seed: h % 9973,
    starCount: 30,
    radius: 14,
    title: `${repo.name}: ${repo.description || ''}`,
  });
}

export function transmission(t) {
  const W = 1000, H = 84;
  const rand = rng(5);
  const rings = [0, 1, 2]
    .map((i) => `<circle r="4" stroke="${C.gold}" stroke-width="1.5"><animate attributeName="r" values="4;26" dur="2.4s" begin="${i * 0.8}s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0" dur="2.4s" begin="${i * 0.8}s" repeatCount="indefinite"/></circle>`)
    .join('');
  const body = `
${range(W, H, rand, { top: 70, bottom: 84, amps: [34, 24, 16], durs: [200, 120, 70], layers: [RIDGES[1], RIDGES[3], RIDGES[4]], mists: [] })}
${flock(22, rand, { dur: 30, delay: 10, count: 4, scale: 0.6 })}
<g transform="translate(46 40)">${rings}<circle r="5" fill="${C.gold}"/></g>
<text class="mono" x="88" y="34" font-size="10" fill="${C.gold}" letter-spacing="2" filter="url(#shadow)">LATEST ASCENT</text>
<text class="sans" x="88" y="56" font-size="16" fill="${C.text}" filter="url(#shadow)">${esc(truncate(t.text, 70))}</text>
<text class="mono" x="966" y="50" text-anchor="end" font-size="12" fill="${C.text}" filter="url(#shadow)">${esc(t.date)}</text>`;
  return frame(W, H, body, {
    sky: 'dusk',
    seed: 99,
    starCount: 40,
    radius: 14,
    title: `Latest ascent: ${t.text}`,
  });
}

export function missionLog(s) {
  const W = 1000, H = 310;
  const rand = rng(42);
  const tiles = s.metrics
    .map((m, i) => {
      const x = 36 + i * 152;
      return `<g transform="translate(${x} 72)">
<rect width="140" height="104" rx="14" fill="#ffffff" fill-opacity=".07" stroke="#ffffff" stroke-opacity=".18"/>
<text class="sans" x="18" y="54" font-size="34" font-weight="800" fill="url(#txt)" filter="url(#shadow)">${esc(m.value)}</text>
<text class="mono" x="18" y="82" font-size="10" fill="${C.muted}" letter-spacing="1.5">${esc(m.label.toUpperCase())}</text>
</g>`;
    })
    .join('');

  let bar = '';
  let legend = '';
  let x = 0;
  s.languages.forEach((l, i) => {
    const w = (l.share / 100) * 300;
    const color = ACCENTS[i % ACCENTS.length];
    bar += `<rect x="${r1(x)}" width="${r1(w)}" height="10" fill="${color}"/>`;
    x += w;
    legend += `<g transform="translate(0 ${48 + i * 22})"><circle cx="5" cy="-4" r="5" fill="${color}"/><text x="18" y="0" fill="${C.text}">${esc(l.name)}</text><text x="300" y="0" text-anchor="end" fill="${C.muted}">${l.share.toFixed(1)}%</text></g>`;
  });
  if (!s.languages.length) legend = `<text y="48" fill="${C.muted}">no terrain data yet</text>`;

  // Weekly contributions drawn as a mountain ridge: the elevation profile of the year.
  let profile;
  const CW = W, CH = 70, bottom = H;
  if (s.weekly.length > 1) {
    const max = Math.max(1, ...s.weekly);
    const pts = s.weekly.map((v, i) => [(i / (s.weekly.length - 1)) * CW, bottom - 22 - (v / max) * CH]);
    const ridge = pts.map(([px, py], i) => `${i ? 'L' : 'M'}${r1(px)} ${r1(py)}`).join('');
    profile = `<path d="${ridge}L${CW} ${bottom}L0 ${bottom}Z" fill="url(#elev)"/>
<path d="${ridge}" stroke="${C.gold}" stroke-width="2" stroke-linejoin="round" pathLength="1" class="draw"/>`;
  } else {
    profile = `${mountainLayer(W, H, rand, { base: bottom - 20, amp: 40, ...RIDGES[3], dur: 120 })}
<text class="mono" x="500" y="${bottom - 70}" text-anchor="middle" font-size="11" fill="${C.muted}">surveying the terrain…</text>`;
  }

  const body = `
${mountainLayer(W, H, rand, { base: H - 40, amp: 90, ...RIDGES[1], dur: 240 })}
<rect width="${W}" height="${H}" fill="#150f36" opacity=".35"/>
${flock(56, rand, { dur: 40, delay: 25, count: 3, scale: 0.6 })}
<text class="mono" x="36" y="46" font-size="13" fill="${C.gold}" letter-spacing="3" filter="url(#shadow)">SUMMIT LOG</text>
<text class="mono" x="964" y="46" text-anchor="end" font-size="11" fill="${C.muted}">updated ${esc(s.updated)}</text>
${tiles}
<g class="mono" font-size="12" transform="translate(664 72)" filter="url(#shadow)">
  <text font-size="10" y="4" fill="${C.muted}" letter-spacing="1.5">TERRAIN · TOP LANGUAGES</text>
  <g transform="translate(0 16)" clip-path="url(#barclip)">${bar}</g>
  ${legend}
</g>
<text class="mono" x="36" y="206" font-size="10" fill="${C.muted}" letter-spacing="1.5" filter="url(#shadow)">ELEVATION PROFILE · WEEKLY CONTRIBUTIONS · LAST 12 MONTHS</text>
${profile}`;
  return frame(W, H, body, {
    sky: 'night',
    seed: 42,
    starCount: 90,
    title: 'GitHub stats',
    defs: `<clipPath id="barclip"><rect width="300" height="10" rx="5"/></clipPath>
<linearGradient id="elev" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b0579a"/><stop offset="1" stop-color="#2a1646"/></linearGradient>`,
    css: `.draw{stroke-dasharray:1;stroke-dashoffset:1;animation:draw 2.5s ease-out forwards}
@keyframes draw{to{stroke-dashoffset:0}}`,
  });
}

export function discordButton() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="380" height="76" viewBox="0 0 380 76" fill="none" role="img" aria-label="Join my Discord">
<defs>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff9a5a"/><stop offset=".5" stop-color="#ff5f8f"/><stop offset="1" stop-color="#7b4dff"/></linearGradient>
<filter id="glow" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="7"/></filter>
<clipPath id="pill"><rect x="14" y="14" width="352" height="48" rx="24"/></clipPath>
</defs>
<style>
.mono{font-family:${MONO}}
.glow{animation:glow 3s ease-in-out infinite}
@keyframes glow{0%,100%{opacity:.35}50%{opacity:.85}}
.pan{animation:pan 12s linear infinite}
@keyframes pan{to{transform:translateX(-120px)}}
</style>
<rect class="glow" x="14" y="14" width="352" height="48" rx="24" fill="url(#g)" filter="url(#glow)"/>
<rect x="14" y="14" width="352" height="48" rx="24" fill="url(#g)"/>
<g clip-path="url(#pill)" opacity=".28"><g class="pan"><path d="M0 62L30 44L50 52L80 36L110 50L120 46L150 62L180 44L200 52L230 36L260 50L270 46L300 62L330 44L350 52L380 36L410 50L420 46L450 62L480 44L500 52L520 62Z" fill="#2a1046"/></g></g>
<rect x="14.5" y="14.5" width="351" height="47" rx="23.5" stroke="#ffffff" stroke-opacity=".4"/>
<path d="${ICONS.discord}" fill="#fff" transform="translate(40 26)"/>
<text class="mono" x="76" y="43" font-size="14" font-weight="700" fill="#fff" letter-spacing="2">JOIN BASE CAMP · DISCORD</text>
</svg>
`;
}

export function footer() {
  const W = 1000, H = 160;
  const rand = rng(8);
  const body = `
${sun(830, 150, 34, { rays: false, sink: 18, dur: 18 })}
${shootingStar(300, 30, 4)}
${range(W, H, rand, { top: 108, bottom: 158, amps: [60, 48, 38, 28, 20], durs: [260, 180, 120, 80, 50], mists: [2] })}
${tent(440, 150, 1)}
${campfire(505, 154, 1)}
${flock(70, rand, { dur: 30, delay: 5, count: 5, scale: 0.7 })}
<text class="mono" x="500" y="54" text-anchor="middle" font-size="11" fill="${C.text}" letter-spacing="4" filter="url(#shadow)">— SEE YOU AT THE SUMMIT —</text>`;
  return frame(W, H, body, {
    sky: 'dusk',
    seed: 8,
    starCount: 80,
    radius: 14,
    title: 'See you at the summit',
  });
}
