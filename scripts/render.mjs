// SVG templates for the coral-reef profile. Every exported function returns a complete SVG string.
// Motion uses SMIL (sway, bob, typing) and CSS keyframes (swimming, bubbles, light), both of which
// keep running when GitHub embeds the SVG through an <img> tag.
import { ICONS } from './icons.mjs';

const SANS = "'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif";
const MONO = "ui-monospace, 'SF Mono', 'Cascadia Code', Consolas, 'DejaVu Sans Mono', monospace";

export const C = {
  text: '#f2feff',
  muted: '#b4ecf5',
  foam: '#e0fbff',
  coral: '#ff7a59',
  pink: '#ff8fc2',
  yellow: '#ffd166',
  aqua: '#4ee1c1',
  purple: '#b18cff',
  deepText: '#04324d',
  line: '#7fdcef',
};

const WATER = {
  shallow: ['#29c4dd', '#0f93c0', '#0a6897'],
  mid: ['#1a9fc6', '#0b6f9f', '#084a78'],
  deep: ['#0b5f8e', '#063e67', '#03213b'],
};

const ACCENTS = [C.coral, C.yellow, C.aqua, C.purple, '#60a5fa', '#94a3b8'];

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

// ---------- motion helpers ----------

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

// ---------- scenery ----------

function rays(w, h, count, rand) {
  let out = '';
  for (let i = 0; i < count; i++) {
    const x = (i + 0.3 + rand() * 0.4) * (w / count);
    const tw = 20 + rand() * 50;
    const spread = 40 + rand() * 90;
    const skew = -60 + rand() * 40;
    const dur = 7 + rand() * 5;
    out += `<polygon class="ray" points="${r1(x)},0 ${r1(x + tw)},0 ${r1(x + tw + skew + spread)},${h} ${r1(x + skew - spread)},${h}" style="transform-origin:${r1(x + tw / 2)}px 0;animation-duration:${r1(dur)}s;animation-delay:-${r1(rand() * dur)}s"/>`;
  }
  return `<g fill="url(#ray)">${out}</g>`;
}

function surface(w) {
  const len = 120;
  const wave = (y, amp) => {
    let d = `M${-len} 0V${y}`;
    for (let x = -len; x < w + len; x += len) d += `q${len / 4} ${-amp} ${len / 2} 0t${len / 2} 0`;
    return `${d}V0Z`;
  };
  return `<g class="surf" style="animation-duration:6s"><path d="${wave(14, 5)}" fill="#ffffff" opacity=".22"/></g>
<g class="surf" style="animation-duration:9s;animation-direction:reverse"><path d="${wave(9, 4)}" fill="#ffffff" opacity=".25"/></g>`;
}

function caustics(w, y, h, op, clip = '') {
  const layer = (f, cls) => `<g class="${cls}"><rect x="-80" y="${y}" width="${w + 160}" height="${h}" filter="url(#${f})"/></g>`;
  return `<g opacity="${op}"${clip ? ` clip-path="url(#${clip})"` : ''}>${layer('caus1', 'drift1')}${layer('caus2', 'drift2')}</g>`;
}

function plankton(w, h, count, rand) {
  let out = '';
  for (let i = 0; i < count; i++) {
    const dur = 8 + rand() * 10;
    out += `<circle class="pk" cx="${r1(rand() * w)}" cy="${r1(rand() * h)}" r="${r1(0.6 + rand() * 1.4)}" opacity="${r1(0.25 + rand() * 0.5)}" style="animation-duration:${r1(dur)}s;animation-delay:-${r1(rand() * dur)}s"/>`;
  }
  return `<g fill="${C.foam}">${out}</g>`;
}

function bubbles(w, h, count, rand, sources = []) {
  let out = '';
  for (let i = 0; i < count; i++) {
    const src = sources.length && rand() < 0.6 ? sources[Math.floor(rand() * sources.length)] : null;
    const x = src ? src[0] + (rand() - 0.5) * 24 : rand() * w;
    const y = src ? src[1] : h + 10;
    const r = 1.5 + rand() ** 2 * 6;
    const dur = 5 + rand() * 7;
    out += `<g class="rise" style="animation-duration:${r1(dur)}s;animation-delay:-${r1(rand() * dur)}s"><g class="wob" style="animation-duration:${r1(1.6 + rand() * 1.6)}s">
<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}" fill="#ffffff" fill-opacity=".12" stroke="#ffffff" stroke-opacity=".75"/>
<circle cx="${r1(x - r * 0.35)}" cy="${r1(y - r * 0.35)}" r="${r1(r * 0.28)}" fill="#ffffff" opacity=".8"/></g></g>`;
  }
  return `<g>${out}</g>`;
}

function sand(w, h, top, rand) {
  const pts = [];
  for (let x = -20; x <= w + 40; x += 60) pts.push([x, top + (rand() - 0.5) * 12]);
  const ridge = smooth(pts);
  const clip = id('sand');
  let dots = '';
  for (let i = 0; i < w / 6; i++) {
    dots += `<circle cx="${r1(rand() * w)}" cy="${r1(top + 6 + rand() * (h - top))}" r="${r1(0.5 + rand())}" opacity="${r1(0.2 + rand() * 0.4)}"/>`;
  }
  const shape = `${ridge}L${w + 40} ${h}L-20 ${h}Z`;
  return {
    defs: `<clipPath id="${clip}"><path d="${shape}"/></clipPath>`,
    body: `<path d="${shape}" fill="url(#sand)"/>
<path d="${ridge}" stroke="#fff4cf" stroke-opacity=".6" stroke-width="2"/>
<g fill="#9b733c">${dots}</g>
${caustics(w, top - 10, h - top + 20, 0.55, clip)}`,
  };
}

function farReef(w, base, rand, color = '#0a5a82') {
  const pts = [];
  for (let x = -20; x <= w + 40; x += 45) pts.push([x, base - rand() * 45]);
  let corals = '';
  for (let i = 0; i < 6; i++) {
    corals += branchCoral(rand, rand() * w, base - 10, 50 + rand() * 50, color, color, { flat: true });
  }
  return `<g opacity=".55">${corals}<path d="${smooth(pts)}L${w + 40} ${base + 60}L-20 ${base + 60}Z" fill="${color}"/></g>`;
}

// ---------- reef life ----------

function branchCoral(rand, x, y, size, color, tip, { flat = false } = {}) {
  const segs = [];
  const tips = [];
  const grow = (px, py, ang, len, wid, depth) => {
    const bend = (rand() - 0.5) * 0.6;
    const ex = px + Math.sin(ang) * len, ey = py - Math.cos(ang) * len;
    const cx = px + Math.sin(ang + bend) * len * 0.55, cy = py - Math.cos(ang + bend) * len * 0.55;
    segs.push([`M${r1(px)} ${r1(py)}Q${r1(cx)} ${r1(cy)} ${r1(ex)} ${r1(ey)}`, wid]);
    if (depth === 0) { tips.push([ex, ey, wid]); return; }
    const n = rand() < 0.35 ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const spread = n === 2 ? (i ? 1 : -1) * (0.28 + rand() * 0.3) : (i - 1) * (0.42 + rand() * 0.2);
      grow(ex, ey, ang + spread, len * (0.66 + rand() * 0.14), wid * 0.74, depth - 1);
    }
  };
  grow(x, y, (rand() - 0.5) * 0.25, size * 0.3, Math.max(3, size * 0.1), 3);
  const base = segs.map(([d, wd]) => `<path d="${d}" stroke-width="${r1(wd)}"/>`).join('');
  const shine = flat ? '' : `<g stroke="#ffffff" stroke-opacity=".28" transform="translate(-1 -1)">${segs.map(([d, wd]) => `<path d="${d}" stroke-width="${r1(wd * 0.3)}"/>`).join('')}</g>`;
  const dots = tips.map(([tx, ty, wd]) => `<circle cx="${r1(tx)}" cy="${r1(ty)}" r="${r1(wd * 0.62)}"/>`).join('');
  return `<g>${sway(1.6, x, y, 5 + rand() * 3, rand() * 5)}<g stroke="${color}" stroke-linecap="round" fill="none">${base}</g>${shine}<g fill="${tip}">${dots}</g></g>`;
}

function fanCoral(rand, x, y, size, color) {
  const segs = [];
  const grow = (px, py, ang, len, wid, depth) => {
    const ex = px + Math.sin(ang) * len, ey = py - Math.cos(ang) * len;
    segs.push(`<path d="M${r1(px)} ${r1(py)}L${r1(ex)} ${r1(ey)}" stroke-width="${r1(wid)}"/>`);
    if (!depth) return;
    grow(ex, ey, ang - 0.22 - rand() * 0.15, len * 0.75, wid * 0.7, depth - 1);
    grow(ex, ey, ang + 0.22 + rand() * 0.15, len * 0.75, wid * 0.7, depth - 1);
  };
  for (let i = 0; i < 7; i++) grow(x, y, -0.95 + i * 0.32 + (rand() - 0.5) * 0.1, size * 0.3, 3, 3);
  return `<g>${sway(2.5, x, y, 7 + rand() * 2, rand() * 7)}<g stroke="${color}" stroke-linecap="round" opacity=".92">${segs.join('')}</g></g>`;
}

function brainCoral(rand, x, y, r, color, groove) {
  const clip = id('brain');
  let lines = '';
  for (let k = 0; k < 6; k++) {
    const yy = y - r * 0.7 + k * r * 0.14;
    const pts = [];
    for (let xx = x - r; xx <= x + r + 10; xx += 9) pts.push([xx, yy + (rand() - 0.5) * 7]);
    lines += `<path d="${smooth(pts)}"/>`;
  }
  return `<clipPath id="${clip}"><path d="M${x - r} ${y}A${r} ${r * 0.78} 0 0 1 ${x + r} ${y}Z"/></clipPath>
<path d="M${x - r} ${y}A${r} ${r * 0.78} 0 0 1 ${x + r} ${y}Z" fill="${color}"/>
<g clip-path="url(#${clip})" stroke="${groove}" stroke-width="2.2" stroke-linecap="round">${lines}</g>
<path d="M${x - r * 0.7} ${y - r * 0.45}A${r} ${r * 0.78} 0 0 1 ${x + r * 0.1} ${y - r * 0.76}" stroke="#ffffff" stroke-opacity=".35" stroke-width="3" stroke-linecap="round"/>`;
}

function tubeCoral(rand, x, y, color, rim) {
  let out = '';
  for (let i = 0; i < 5; i++) {
    const h = 18 + rand() * 30;
    const tx = x + (i - 2) * 11 + (rand() - 0.5) * 4;
    out += `<rect x="${r1(tx - 5)}" y="${r1(y - h)}" width="10" height="${r1(h)}" rx="4" fill="${color}"/><ellipse cx="${r1(tx)}" cy="${r1(y - h)}" rx="5" ry="2.4" fill="${rim}"/>`;
  }
  return `<g>${out}</g>`;
}

function anemone(rand, x, y, size, color, tip) {
  let out = '';
  for (let i = 0; i < 18; i++) {
    const a = -1.25 + (i / 17) * 2.5 + (rand() - 0.5) * 0.1;
    const len = size * (0.7 + rand() * 0.35);
    const bx = x + a * size * 0.22;
    const ex = bx + Math.sin(a) * len, ey = y - Math.cos(a) * len;
    const cx = bx + Math.sin(a * 0.4) * len * 0.6, cy = y - len * 0.7;
    out += `<g>${sway(9, bx, y, 2.6 + rand() * 1.4, rand() * 3)}<path d="M${r1(bx)} ${y}Q${r1(cx)} ${r1(cy)} ${r1(ex)} ${r1(ey)}" stroke="${color}" stroke-width="6" stroke-linecap="round"/><circle cx="${r1(ex)}" cy="${r1(ey)}" r="3.6" fill="${tip}"/></g>`;
  }
  return `<g>${out}<ellipse cx="${x}" cy="${y + 2}" rx="${r1(size * 0.36)}" ry="8" fill="${color}"/><ellipse cx="${x}" cy="${y + 4}" rx="${r1(size * 0.36)}" ry="5" fill="#000000" opacity=".18"/></g>`;
}

function seaweed(rand, x, y, h, color) {
  const pts = [];
  const steps = 7;
  for (let i = 0; i <= steps; i++) pts.push([x + Math.sin(i * 1.3 + rand() * 6) * 9 * (i / steps), y - (h * i) / steps]);
  return `<g>${sway(6, x, y, 4 + rand() * 2, rand() * 4)}<path d="${smooth(pts)}" stroke="${color}" stroke-width="7" stroke-linecap="round"/><path d="${smooth(pts.map(([px, py]) => [px - 1.5, py]))}" stroke="#ffffff" stroke-opacity=".22" stroke-width="2" stroke-linecap="round"/></g>`;
}

function starfish(x, y, r, color, rot) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i + rot;
    const rr = i % 2 ? r * 0.42 : r;
    pts.push(`${r1(x + Math.sin(a) * rr)},${r1(y - Math.cos(a) * rr * 0.6)}`);
  }
  return `<polygon points="${pts.join(' ')}" fill="${color}" stroke="${color}" stroke-width="5" stroke-linejoin="round"/><circle cx="${x}" cy="${y}" r="${r1(r * 0.18)}" fill="#ffffff" opacity=".4"/>`;
}

// ---------- fish (all face right, centered on 0,0) ----------

const tail = (path, fill, stroke, pivotX) =>
  `<g>${sway(14, pivotX, 0, 0.5)}<path d="${path}" fill="${fill}" stroke="${stroke}" stroke-width="1.5" stroke-linejoin="round"/></g>`;

function clownfish() {
  const clip = id('clown');
  const stripe = (sx) => `<path d="M${sx - 3} -15Q${sx + 3} 0 ${sx - 3} 15L${sx + 4} 15Q${sx + 10} 0 ${sx + 4} -15Z" fill="#ffffff" stroke="#1b1b1b" stroke-width="1.4"/>`;
  return `<clipPath id="${clip}"><ellipse rx="22" ry="12"/></clipPath>
${tail('M-19 0L-32 -11Q-28 0 -32 11Z', '#ff7a1a', '#1b1b1b', -19)}
<path d="M-8 -10Q2 -21 12 -9" fill="#ff7a1a" stroke="#1b1b1b" stroke-width="1.4"/>
<ellipse rx="22" ry="12" fill="#ff7a1a" stroke="#1b1b1b" stroke-width="1.6"/>
<g clip-path="url(#${clip})">${stripe(9)}${stripe(-5)}${stripe(-19)}</g>
<ellipse cx="2" cy="6" rx="6" ry="3" fill="#ff9a4a" stroke="#1b1b1b" stroke-width="1.2" transform="rotate(25 2 6)"/>
<circle cx="15" cy="-3" r="3.2" fill="#ffffff"/><circle cx="15.8" cy="-3" r="1.9" fill="#111111"/>`;
}

function blueTang() {
  return `${tail('M-20 0L-33 -12L-30 0L-33 12Z', '#ffd23f', '#0d2a6b', -20)}
<path d="M-14 -11Q2 -22 16 -8" fill="#1d4ed8" stroke="#0d2a6b" stroke-width="1.4"/>
<ellipse rx="23" ry="14" fill="#2f6bff" stroke="#0d2a6b" stroke-width="1.6"/>
<path d="M-17 -2Q-4 -12 12 -6Q2 -3 -4 3Q-10 6 -17 -2Z" fill="#0b1a3f"/>
<circle cx="16" cy="-3" r="3" fill="#ffffff"/><circle cx="16.8" cy="-3" r="1.8" fill="#111111"/>`;
}

function yellowTang() {
  return `${tail('M-15 0L-26 -9L-24 0L-26 9Z', '#ffcf2e', '#a37a00', -15)}
<path d="M-10 -13Q2 -24 12 -10L12 10Q2 24 -10 13Z" fill="#ffe066" stroke="#a37a00" stroke-width="1.3"/>
<ellipse rx="17" ry="15" fill="#ffd23f" stroke="#a37a00" stroke-width="1.5"/>
<path d="M14 -3L22 0L14 3Z" fill="#ffd23f" stroke="#a37a00" stroke-width="1.2"/>
<circle cx="9" cy="-4" r="2.6" fill="#ffffff"/><circle cx="9.6" cy="-4" r="1.6" fill="#111111"/>`;
}

function minnow() {
  return `${tail('M-7 0L-13 -4L-13 4Z', '#9fe7f5', 'none', -7)}<ellipse rx="9" ry="3.6" fill="#c9f4fb"/><path d="M-6 0H6" stroke="#5fc7de" stroke-width="1"/><circle cx="5" cy="-0.8" r="1" fill="#0b3b52"/>`;
}

function turtle() {
  const flipper = (d, px, py, deg, dur) => `<g>${sway(deg, px, py, dur)}<path d="${d}" fill="#8fae52" stroke="#4f6a24" stroke-width="1.5"/></g>`;
  return `${flipper('M-22 8Q-40 16 -46 26Q-30 24 -18 14Z', -20, 10, 14, 2.4)}
${flipper('M10 10Q16 36 4 52Q-2 34 -2 14Z', 4, 12, 22, 2.4)}
<ellipse cx="38" cy="-3" rx="11" ry="8" fill="#9dbb5e" stroke="#4f6a24" stroke-width="1.5"/>
<circle cx="43" cy="-6" r="2" fill="#1b2a0c"/>
<ellipse rx="34" ry="21" fill="#6d7f2c" stroke="#3f4d15" stroke-width="2"/>
<g stroke="#3f4d15" stroke-width="1.5" fill="#86993a">
  <polygon points="-8,-10 6,-10 12,0 6,10 -8,10 -14,0"/>
  <polygon points="-26,-6 -14,-10 -14,0 -26,6"/>
  <polygon points="14,-10 26,-6 26,6 14,10 12,0"/>
</g>
<ellipse cx="-4" cy="-13" rx="22" ry="5" fill="#ffffff" opacity=".15"/>
${flipper('M4 -8Q20 -34 40 -40Q30 -20 14 -4Z', 8, -6, 24, 2.4)}`;
}

const FISH = { clownfish, blueTang, yellowTang, minnow, turtle };

// A fish crossing the whole frame: dir 1 = left→right, -1 = right→left.
function swimmer(kind, y, { dir = 1, scale = 1, dur = 18, delay = 0, bobY = 6 } = {}) {
  return `<g transform="translate(0 ${y})"><g class="${dir > 0 ? 'swimR' : 'swimL'}" style="animation-duration:${r1(dur)}s;animation-delay:-${r1(delay)}s"><g>${bob(bobY, 2.6 + (delay % 1.5))}<g transform="scale(${dir * scale} ${scale})">${FISH[kind]()}</g></g></g></g>`;
}

function school(y, rand, { dir = -1, dur = 20, delay = 0, count = 12 } = {}) {
  let fish = '';
  for (let i = 0; i < count; i++) {
    const fx = (i % 4) * 22 + (rand() - 0.5) * 10 + Math.floor(i / 4) * 10;
    const fy = Math.floor(i / 4) * 12 + (rand() - 0.5) * 6;
    fish += `<g transform="translate(${r1(fx)} ${r1(fy)})"><g>${bob(4, 1.4 + rand(), rand() * 2)}${minnow()}</g></g>`;
  }
  return `<g transform="translate(0 ${y})"><g class="${dir > 0 ? 'swimR' : 'swimL'}" style="animation-duration:${r1(dur)}s;animation-delay:-${r1(delay)}s"><g transform="scale(${dir} 1)">${fish}</g></g></g>`;
}

// Clownfish that patrols back and forth above its anemone, turning around at each end.
function residentClownfish(x, y, scale = 0.9) {
  return `<g transform="translate(${x} ${y})"><g>
<animateTransform attributeName="transform" type="translate" values="-28 0;28 -8;-28 0" dur="9s" repeatCount="indefinite" ${SPLINE2}/>
<g><animateTransform attributeName="transform" type="scale" values="${scale} ${scale};${-scale} ${scale}" keyTimes="0;.5" dur="9s" repeatCount="indefinite" calcMode="discrete"/>${clownfish()}</g>
</g></g>`;
}

// ---------- frame ----------

function frame(w, h, body, { depth = 'mid', seed = 1, rayCount = 5, bubbleCount = 12, bubbleSources = [], plank = 40, surf = true, causticOp = 0.16, defs = '', css = '', radius = 18, title = '' } = {}) {
  const rand = rng(seed);
  const [w0, w1, w2] = WATER[depth];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" role="img"${title ? ` aria-label="${esc(title)}"` : ''}>
<defs>
<linearGradient id="water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${w0}"/><stop offset=".55" stop-color="${w1}"/><stop offset="1" stop-color="${w2}"/></linearGradient>
<linearGradient id="ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".45"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>
<linearGradient id="sand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6dfa8"/><stop offset=".5" stop-color="#e2bd78"/><stop offset="1" stop-color="#b98c4c"/></linearGradient>
<linearGradient id="txt" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#d7fbff"/><stop offset="1" stop-color="${C.yellow}"/></linearGradient>
<clipPath id="round"><rect width="${w}" height="${h}" rx="${radius}"/></clipPath>
<filter id="caus1" x="-80" y="0" width="${w + 160}" height="${h}" filterUnits="userSpaceOnUse"><feTurbulence type="turbulence" baseFrequency=".011 .028" numOctaves="2" seed="${seed % 97}"/><feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 -9 0 0 0 1.35"/></filter>
<filter id="caus2" x="-80" y="0" width="${w + 160}" height="${h}" filterUnits="userSpaceOnUse"><feTurbulence type="turbulence" baseFrequency=".016 .022" numOctaves="2" seed="${(seed + 31) % 97}"/><feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 -9 0 0 0 1.3"/></filter>
<filter id="shadow" x="-10%" y="-30%" width="120%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#022337" flood-opacity=".75"/></filter>
<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter>
${defs}
</defs>
<style>
.sans{font-family:${SANS}}
.mono{font-family:${MONO}}
.ray{animation:ray 9s ease-in-out infinite alternate}
@keyframes ray{from{transform:rotate(-3deg);opacity:.35}to{transform:rotate(3deg);opacity:.8}}
.surf{animation:surf 6s linear infinite}
@keyframes surf{to{transform:translateX(120px)}}
.drift1{animation:drift 14s ease-in-out infinite alternate}
.drift2{animation:drift 11s ease-in-out infinite alternate-reverse}
@keyframes drift{from{transform:translate(-40px,0)}to{transform:translate(40px,6px)}}
.pk{animation:pk 12s ease-in-out infinite alternate}
@keyframes pk{to{transform:translate(14px,-12px)}}
.rise{animation:rise 8s linear infinite}
@keyframes rise{0%{transform:translateY(0);opacity:0}8%{opacity:1}85%{opacity:1}100%{transform:translateY(-${h + 30}px);opacity:0}}
.wob{animation:wob 2s ease-in-out infinite alternate}
@keyframes wob{from{transform:translateX(-4px)}to{transform:translateX(4px)}}
.swimR{animation:swimR 18s linear infinite}
@keyframes swimR{from{transform:translateX(-140px)}to{transform:translateX(${w + 140}px)}}
.swimL{animation:swimL 18s linear infinite}
@keyframes swimL{from{transform:translateX(${w + 140}px)}to{transform:translateX(-140px)}}
${css}
</style>
<g clip-path="url(#round)">
<rect width="${w}" height="${h}" fill="url(#water)"/>
${rayCount ? rays(w, h, rayCount, rand) : ''}
${causticOp ? caustics(w, 0, h, causticOp) : ''}
${surf ? surface(w) : ''}
${body}
${plankton(w, h, plank, rand)}
${bubbles(w, h, bubbleCount, rand, bubbleSources)}
</g>
<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="${radius}" stroke="${C.line}" stroke-opacity=".5"/>
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
  const cursor = `<rect class="blink" x="${x}" y="${y - size + 3}" width="${Math.round(cw * 0.75)}" height="${size}" fill="${C.yellow}">${anim('x', frames.map((f) => x + f.k * cw))}</rect>`;
  return { defs: clips, body: texts + cursor };
}

// ---------- exported cards ----------

export function banner(p) {
  const W = 1000, H = 360;
  const rand = rng(11);
  const tw = typewriter(p.taglines, { x: 94, y: 222 });
  const floor = sand(W, H, 306, rand);
  const body = `
${farReef(W, 292, rand)}
<rect width="${W * 0.62}" height="${H}" fill="url(#vignette)"/>
${swimmer('turtle', 92, { dir: 1, scale: 0.9, dur: 42, delay: 26, bobY: 10 })}
${school(196, rand, { dir: -1, dur: 24, delay: 4 })}
${swimmer('yellowTang', 150, { dir: -1, scale: 0.9, dur: 30, delay: 12 })}
${swimmer('blueTang', 258, { dir: 1, scale: 1, dur: 17, delay: 3 })}
${floor.body}
${seaweed(rand, 22, 318, 95, '#2fbf71')}
${seaweed(rand, 36, 320, 70, '#1f9d5c')}
${tubeCoral(rand, 150, 324, '#ffb347', '#c46a00')}
${starfish(250, 338, 13, '#ff6b4a', 0.3)}
${brainCoral(rand, 340, 326, 22, '#b18cff', '#7a55d6')}
${branchCoral(rand, 460, 322, 70, '#ff9f43', '#ffd8a8')}
${seaweed(rand, 540, 322, 130, '#2fbf71')}
${brainCoral(rand, 610, 328, 36, '#d9b44a', '#9c7a1c')}
${branchCoral(rand, 705, 324, 130, '#ff6f91', '#ffd1dc')}
${anemone(rand, 815, 322, 58, '#ff8fc2', '#ffe0ef')}
${residentClownfish(815, 248)}
${fanCoral(rand, 905, 322, 120, '#b18cff')}
${tubeCoral(rand, 965, 326, '#4ee1c1', '#138a74')}
${seaweed(rand, 988, 324, 150, '#1f9d5c')}
${starfish(660, 346, 10, '#ffd166', 1.1)}

<text class="mono" x="72" y="74" font-size="15" fill="${C.yellow}" letter-spacing="1" filter="url(#shadow)">// dive log · ${esc(p.coords)}</text>
<text class="sans" x="68" y="146" font-size="66" font-weight="800" fill="url(#txt)" filter="url(#shadow)">Hi, I'm ${esc(p.name)}</text>
<text class="mono" x="72" y="178" font-size="15" fill="${C.muted}" filter="url(#shadow)">a.k.a. <tspan fill="${C.pink}">@${esc(p.handle)}</tspan></text>
<text class="mono" x="70" y="222" font-size="20" fill="${C.coral}" filter="url(#shadow)">&gt;</text>
${tw.body}
<g transform="translate(72 262)" filter="url(#shadow)">
  <circle cx="5" cy="-5" r="4" fill="${C.aqua}"><animate attributeName="opacity" values="1;.2;1" dur="2s" repeatCount="indefinite"/></circle>
  <text class="mono" x="18" y="0" font-size="13" fill="${C.muted}">depth −12 m · ${esc(p.location)}</text>
</g>`;
  return frame(W, H, body, {
    depth: 'shallow',
    seed: 11,
    rayCount: 6,
    bubbleCount: 22,
    bubbleSources: [[815, 300], [705, 300], [460, 300]],
    plank: 60,
    causticOp: 0.2,
    title: `Hi, I'm ${p.name}`,
    defs: `${tw.defs}${floor.defs}
<linearGradient id="vignette" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#03304d" stop-opacity=".5"/><stop offset="1" stop-color="#03304d" stop-opacity="0"/></linearGradient>`,
    css: `.blink{animation:blink 1s steps(1) infinite}
@keyframes blink{50%{opacity:0}}`,
  });
}

function techBubble(t, x, y, r, delay) {
  const s = r * 0.62;
  return `<g transform="translate(${x} ${y})"><g>${bob(-10, 4.2, delay)}
<circle r="${r + 10}" fill="${t.color}" opacity=".35" filter="url(#glow)"/>
<circle r="${r}" fill="url(#bubble)" stroke="#ffffff" stroke-opacity=".7" stroke-width="1.5"/>
<circle r="${r * 0.66}" fill="${t.color}"/>
<path d="${ICONS[t.icon]}" fill="${t.iconFill ?? '#fff'}" transform="translate(${r1(-s / 2)} ${r1(-s / 2)}) scale(${r1((s / 24) * 100) / 100})"/>
<ellipse cx="${r1(-r * 0.4)}" cy="${r1(-r * 0.48)}" rx="${r1(r * 0.28)}" ry="${r1(r * 0.15)}" fill="#ffffff" opacity=".75" transform="rotate(-35 ${r1(-r * 0.4)} ${r1(-r * 0.48)})"/>
<text class="mono" y="${r + 24}" text-anchor="middle" font-size="14" font-weight="700" fill="${C.text}" filter="url(#shadow)">${esc(t.label)}</text>
</g></g>`;
}

export function stack(p) {
  const W = 1000, H = 440;
  const rand = rng(23);
  const floor = sand(W, H, 380, rand);
  const tag = (x, label) => `<g transform="translate(${x} 96)"><rect x="-58" y="-15" width="116" height="24" rx="12" fill="#032c46" fill-opacity=".45" stroke="${C.line}" stroke-opacity=".5"/><text class="mono" y="2" text-anchor="middle" font-size="11" fill="${C.yellow}" letter-spacing="2.5">${esc(label.toUpperCase())}</text></g>`;
  const slots = [[170, 200], [300, 262], [430, 200]];
  const inner = p.stack.inner.map((t, i) => techBubble(t, slots[i][0], slots[i][1], 42, i * 1.3)).join('');
  const outer = p.stack.outer.map((t, i) => techBubble(t, slots[i][0] + 400, slots[i][1], 42, i * 1.3 + 0.6)).join('');
  const body = `
${farReef(W, 372, rand)}
${school(128, rand, { dir: 1, dur: 26, delay: 9 })}
${swimmer('blueTang', 330, { dir: -1, scale: 0.85, dur: 21, delay: 6 })}
${floor.body}
${branchCoral(rand, 58, 392, 100, '#ff9f43', '#ffd8a8')}
${brainCoral(rand, 230, 398, 26, '#b18cff', '#7a55d6')}
${tubeCoral(rand, 390, 398, '#ff6f91', '#b8325a')}
${seaweed(rand, 500, 396, 150, '#2fbf71')}
${seaweed(rand, 514, 398, 110, '#1f9d5c')}
${starfish(620, 414, 12, '#ffd166', 0.6)}
${anemone(rand, 760, 398, 44, '#4ee1c1', '#d4fff6')}
${fanCoral(rand, 940, 396, 100, '#ff6f91')}
<rect width="420" height="110" fill="url(#tvig)"/>
<text class="mono" x="36" y="46" font-size="13" fill="${C.yellow}" letter-spacing="3" filter="url(#shadow)">TECH REEF</text>
<text class="mono" x="36" y="66" font-size="12" fill="${C.muted}" filter="url(#shadow)">// what lives in my code</text>
${tag(300, p.stack.innerLabel)}
${tag(700, p.stack.outerLabel)}
${inner}
${outer}`;
  const all = [...p.stack.inner, ...p.stack.outer].map((t) => t.label).join(', ');
  return frame(W, H, body, {
    depth: 'mid',
    seed: 23,
    bubbleCount: 18,
    bubbleSources: [[760, 380], [58, 380]],
    title: `Tech stack: ${all}`,
    defs: `${floor.defs}
<radialGradient id="tvig" cx="0" cy="0" r="1"><stop offset="0" stop-color="#03304d" stop-opacity=".55"/><stop offset="1" stop-color="#03304d" stop-opacity="0"/></radialGradient>
<radialGradient id="bubble" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#ffffff" stop-opacity=".05"/><stop offset=".8" stop-color="#bff6ff" stop-opacity=".18"/><stop offset="1" stop-color="#ffffff" stop-opacity=".45"/></radialGradient>`,
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

const DECOR = [
  (rand) => `${branchCoral(rand, 425, 160, 95, '#ff6f91', '#ffd1dc')}${seaweed(rand, 470, 162, 90, '#2fbf71')}`,
  (rand) => `${anemone(rand, 420, 160, 42, '#ff8fc2', '#ffe0ef')}${residentClownfish(420, 104, 0.7)}`,
  (rand) => `${fanCoral(rand, 430, 160, 95, '#b18cff')}${tubeCoral(rand, 470, 162, '#ffb347', '#c46a00')}`,
  (rand) => `${brainCoral(rand, 420, 162, 32, '#d9b44a', '#9c7a1c')}${seaweed(rand, 465, 162, 100, '#1f9d5c')}${starfish(380, 164, 9, '#ff6b4a', 0.4)}`,
];

export function missionCard(repo, index) {
  const W = 490, H = 180;
  const h = hash(repo.name);
  const rand = rng(h);
  const color = ACCENTS[h % 4];
  const desc = wrap(repo.description || 'Uncharted waters — no description yet.', 46, 2);
  const lang = repo.language || 'Unknown';
  const floor = sand(W, H, 158, rand);
  const fish = ['clownfish', 'blueTang', 'yellowTang'][h % 3];
  const meta = [
    `<circle cx="34" cy="138" r="5" fill="${color}"/>`,
    `<text x="45" y="142">${esc(lang)}</text>`,
    `<text x="${58 + lang.length * 7.3}" y="142" fill="${C.yellow}">★ ${repo.stars}</text>`,
    `<text x="${92 + lang.length * 7.3 + String(repo.stars).length * 7.3}" y="142" fill="${C.muted}">last dive ${esc(repo.pushed)}</text>`,
  ].join('');
  const body = `
${swimmer(fish, 118, { dir: index % 2 ? -1 : 1, scale: 0.75, dur: 14 + (h % 6), delay: h % 9 })}
${floor.body}
${DECOR[h % DECOR.length](rand)}
<text class="mono" x="464" y="30" text-anchor="end" font-size="10" fill="${C.yellow}" letter-spacing="2" filter="url(#shadow)">DIVE SITE ${String(index + 1).padStart(2, '0')}</text>
<text class="sans" x="28" y="52" font-size="23" font-weight="800" fill="${C.text}" filter="url(#shadow)">${esc(truncate(repo.name, 24))}</text>
${desc.map((l, i) => `<text class="sans" x="28" y="${80 + i * 19}" font-size="13.5" fill="${C.muted}" filter="url(#shadow)">${esc(l)}</text>`).join('')}
<g class="mono" font-size="12" fill="${C.text}" filter="url(#shadow)">${meta}</g>`;
  return frame(W, H, body, {
    depth: 'mid',
    seed: h % 9973,
    rayCount: 3,
    bubbleCount: 8,
    plank: 20,
    radius: 14,
    title: `${repo.name}: ${repo.description || ''}`,
    defs: floor.defs,
  });
}

export function transmission(t) {
  const W = 1000, H = 84;
  const rings = [0, 1, 2]
    .map((i) => `<circle r="4" stroke="${C.aqua}" stroke-width="1.5"><animate attributeName="r" values="4;26" dur="2.4s" begin="${i * 0.8}s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0" dur="2.4s" begin="${i * 0.8}s" repeatCount="indefinite"/></circle>`)
    .join('');
  const body = `
${school(14, rng(5), { dir: 1, dur: 30, delay: 14, count: 4 })}
<g transform="translate(46 42)">${rings}<circle r="5" fill="${C.aqua}"/></g>
<text class="mono" x="88" y="36" font-size="10" fill="${C.yellow}" letter-spacing="2" filter="url(#shadow)">LATEST SIGHTING</text>
<text class="sans" x="88" y="58" font-size="16" fill="${C.text}" filter="url(#shadow)">${esc(truncate(t.text, 70))}</text>
<text class="mono" x="966" y="52" text-anchor="end" font-size="12" fill="${C.muted}" filter="url(#shadow)">${esc(t.date)}</text>`;
  return frame(W, H, body, {
    depth: 'deep',
    seed: 99,
    rayCount: 4,
    bubbleCount: 10,
    plank: 30,
    surf: false,
    causticOp: 0.08,
    radius: 14,
    title: `Latest sighting: ${t.text}`,
  });
}

export function missionLog(s) {
  const W = 1000, H = 300;
  const tiles = s.metrics
    .map((m, i) => {
      const x = 36 + i * 152;
      return `<g transform="translate(${x} 72)">
<rect width="140" height="104" rx="14" fill="#ffffff" fill-opacity=".07" stroke="#ffffff" stroke-opacity=".18"/>
<ellipse cx="34" cy="10" rx="26" ry="4" fill="#ffffff" opacity=".12"/>
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
  if (!s.languages.length) legend = `<text y="48" fill="${C.muted}">no readings yet</text>`;

  let tide;
  const CW = 928, CH = 50, top = 222;
  if (s.weekly.length > 1) {
    const max = Math.max(1, ...s.weekly);
    const pts = s.weekly.map((v, i) => [36 + (i / (s.weekly.length - 1)) * CW, top + CH - (v / max) * CH]);
    const line = smooth(pts);
    tide = `<path d="${line}L${36 + CW} ${top + CH}L36 ${top + CH}Z" fill="url(#tide)"/>
<path d="${line}" stroke="${C.aqua}" stroke-width="2.2" stroke-linejoin="round" pathLength="1" class="draw"/>`;
  } else {
    tide = `<line x1="36" y1="${top + CH}" x2="${36 + CW}" y2="${top + CH}" stroke="${C.aqua}" stroke-opacity=".5" stroke-dasharray="4 6"/>
<text class="mono" x="500" y="${top + CH - 12}" text-anchor="middle" font-size="11" fill="${C.muted}">waiting for the tide…</text>`;
  }

  const body = `
${swimmer('yellowTang', 286, { dir: 1, scale: 0.5, dur: 34, delay: 20, bobY: 3 })}
<text class="mono" x="36" y="46" font-size="13" fill="${C.yellow}" letter-spacing="3" filter="url(#shadow)">DIVE LOG</text>
<text class="mono" x="964" y="46" text-anchor="end" font-size="11" fill="${C.muted}">updated ${esc(s.updated)}</text>
${tiles}
<g class="mono" font-size="12" transform="translate(664 72)">
  <text font-size="10" y="4" fill="${C.muted}" letter-spacing="1.5">AIR MIX · TOP LANGUAGES</text>
  <g transform="translate(0 16)" clip-path="url(#barclip)">${bar}</g>
  ${legend}
</g>
<text class="mono" x="36" y="208" font-size="10" fill="${C.muted}" letter-spacing="1.5">TIDE · WEEKLY CONTRIBUTIONS · LAST 12 MONTHS</text>
${tide}`;
  return frame(W, H, body, {
    depth: 'deep',
    seed: 42,
    rayCount: 4,
    bubbleCount: 14,
    surf: false,
    causticOp: 0.07,
    title: 'GitHub stats',
    defs: `<clipPath id="barclip"><rect width="300" height="10" rx="5"/></clipPath>
<linearGradient id="tide" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.aqua}" stop-opacity=".45"/><stop offset="1" stop-color="${C.aqua}" stop-opacity="0"/></linearGradient>`,
    css: `.draw{stroke-dasharray:1;stroke-dashoffset:1;animation:draw 2.5s ease-out forwards}
@keyframes draw{to{stroke-dashoffset:0}}`,
  });
}

export function discordButton() {
  const rand = rng(3);
  let inner = '';
  for (let i = 0; i < 12; i++) {
    const dur = 2.5 + rand() * 2.5;
    inner += `<circle class="up" cx="${r1(30 + rand() * 290)}" cy="66" r="${r1(1.5 + rand() * 3)}" fill="#ffffff" fill-opacity=".2" stroke="#ffffff" stroke-opacity=".7" style="animation-duration:${r1(dur)}s;animation-delay:-${r1(rand() * dur)}s"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="76" viewBox="0 0 360 76" fill="none" role="img" aria-label="Join my Discord">
<defs>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#06b6d4"/><stop offset="1" stop-color="#4f46e5"/></linearGradient>
<filter id="glow" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="7"/></filter>
<clipPath id="pill"><rect x="14" y="14" width="332" height="48" rx="24"/></clipPath>
</defs>
<style>
.mono{font-family:${MONO}}
.glow{animation:glow 3s ease-in-out infinite}
@keyframes glow{0%,100%{opacity:.35}50%{opacity:.85}}
.up{animation:up 4s linear infinite}
@keyframes up{from{transform:translateY(0);opacity:1}to{transform:translateY(-60px);opacity:0}}
</style>
<rect class="glow" x="14" y="14" width="332" height="48" rx="24" fill="url(#g)" filter="url(#glow)"/>
<rect x="14" y="14" width="332" height="48" rx="24" fill="url(#g)"/>
<g clip-path="url(#pill)">${inner}</g>
<rect x="14.5" y="14.5" width="331" height="47" rx="23.5" stroke="#ffffff" stroke-opacity=".35"/>
<path d="${ICONS.discord}" fill="#fff" transform="translate(40 26)"/>
<text class="mono" x="76" y="43" font-size="14" font-weight="700" fill="#fff" letter-spacing="2">JOIN THE REEF · DISCORD</text>
</svg>
`;
}

function crab() {
  const leg = (side, i) => {
    const sx = side * (12 + i * 5);
    return `<g>${sway(12, sx, 4, 0.35, i * 0.12)}<path d="M${sx} 4L${sx + side * 10} 12L${sx + side * 14} 20" stroke="#c23b24" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  };
  const claw = (side) => `<g>${sway(10, side * 18, -4, 1.2)}
<path d="M${side * 16} -2Q${side * 26} -10 ${side * 28} -18" stroke="#e5533d" stroke-width="5" stroke-linecap="round"/>
<path d="M${side * 22} -20Q${side * 32} -34 ${side * 40} -22Q${side * 34} -22 ${side * 31} -16Q${side * 36} -12 ${side * 33} -8Q${side * 24} -8 ${side * 22} -20Z" fill="#ff6a4d" stroke="#c23b24" stroke-width="1.5"/></g>`;
  return `${[0, 1, 2].map((i) => leg(-1, i) + leg(1, i)).join('')}
${claw(-1)}${claw(1)}
<path d="M-5 -10L-7 -22M5 -10L7 -22" stroke="#c23b24" stroke-width="2.5" stroke-linecap="round"/>
<circle cx="-7" cy="-24" r="4" fill="#ffffff" stroke="#c23b24" stroke-width="1.2"/><circle cx="7" cy="-24" r="4" fill="#ffffff" stroke="#c23b24" stroke-width="1.2"/>
<circle cx="-6.4" cy="-24" r="2" fill="#111111"/><circle cx="7.6" cy="-24" r="2" fill="#111111"/>
<ellipse cy="0" rx="22" ry="14" fill="#ff6a4d" stroke="#c23b24" stroke-width="1.8"/>
<ellipse cx="-6" cy="-5" rx="9" ry="4" fill="#ffffff" opacity=".3"/>
<path d="M-6 4Q0 8 6 4" stroke="#8f2414" stroke-width="1.6" stroke-linecap="round"/>`;
}

export function footer() {
  const W = 1000, H = 150;
  const rand = rng(8);
  const floor = sand(W, H, 104, rand);
  const body = `
${school(22, rand, { dir: -1, dur: 22, delay: 3, count: 8 })}
${floor.body}
${seaweed(rand, 30, 118, 80, '#2fbf71')}
${branchCoral(rand, 110, 118, 70, '#ff9f43', '#ffd8a8')}
${brainCoral(rand, 230, 124, 20, '#b18cff', '#7a55d6')}
${starfish(360, 132, 10, '#ff6b4a', 0.2)}
${tubeCoral(rand, 790, 124, '#4ee1c1', '#138a74')}
${branchCoral(rand, 880, 120, 80, '#ff6f91', '#ffd1dc')}
${seaweed(rand, 970, 120, 90, '#1f9d5c')}
<g transform="translate(460 118)"><g class="walk">${crab()}</g></g>
<text class="mono" x="500" y="82" text-anchor="middle" font-size="11" fill="${C.muted}" letter-spacing="4" filter="url(#shadow)">— END OF DIVE —</text>`;
  return frame(W, H, body, {
    depth: 'shallow',
    seed: 8,
    rayCount: 5,
    bubbleCount: 12,
    radius: 14,
    title: 'End of dive',
    defs: floor.defs,
    css: `.walk{animation:walk 9s ease-in-out infinite alternate}
@keyframes walk{0%,8%{transform:translateX(-60px)}92%,100%{transform:translateX(240px)}}`,
  });
}
