// SVG templates for the space-themed profile. Every function returns a complete SVG string.
import { ICONS } from './icons.mjs';

const SANS = "'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif";
const MONO = "ui-monospace, 'SF Mono', 'Cascadia Code', Consolas, 'DejaVu Sans Mono', monospace";

export const C = {
  bg0: '#060818',
  bg1: '#161140',
  violet: '#a78bfa',
  cyan: '#67e8f9',
  pink: '#f472b6',
  gold: '#fcd34d',
  mint: '#6ee7b7',
  text: '#eef0ff',
  muted: '#8e93cc',
  line: '#2b2e66',
};

const ACCENTS = [C.violet, C.cyan, C.pink, C.gold, C.mint, '#94a3b8'];

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

function stars(w, h, count, seed) {
  const rand = rng(seed);
  const tints = ['#ffffff', '#ffffff', '#ffffff', '#c7d2fe', '#a5f3fc', '#fbcfe8'];
  let out = '';
  for (let i = 0; i < count; i++) {
    const x = r1(rand() * w);
    const y = r1(rand() * h);
    const r = r1(0.4 + rand() ** 3 * 1.4);
    const fill = tints[Math.floor(rand() * tints.length)];
    if (rand() < 0.35) {
      const dur = r1(2 + rand() * 4);
      const delay = r1(rand() * dur);
      out += `<circle class="tw" cx="${x}" cy="${y}" r="${r}" fill="${fill}" style="animation-duration:${dur}s;animation-delay:-${delay}s"/>`;
    } else {
      out += `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" opacity="${r1(0.25 + rand() * 0.55)}"/>`;
    }
  }
  return `<g>${out}</g>`;
}

function frame(w, h, body, { seed = 1, starCount = 80, nebula = [], defs = '', css = '', radius = 18, title = '' } = {}) {
  const blobs = nebula
    .map(([cx, cy, rx, ry, color, op]) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${color}" opacity="${op}" filter="url(#blur)"/>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" role="img"${title ? ` aria-label="${esc(title)}"` : ''}>
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.bg0}"/><stop offset="1" stop-color="${C.bg1}"/></linearGradient>
<linearGradient id="txt" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="${C.violet}"/><stop offset="1" stop-color="${C.cyan}"/></linearGradient>
<clipPath id="round"><rect width="${w}" height="${h}" rx="${radius}"/></clipPath>
<filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="40"/></filter>
<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
${defs}
</defs>
<style>
.sans{font-family:${SANS}}
.mono{font-family:${MONO}}
.tw{animation:tw 4s ease-in-out infinite}
@keyframes tw{0%,100%{opacity:.15}50%{opacity:1}}
${css}
</style>
<g clip-path="url(#round)">
<rect width="${w}" height="${h}" fill="url(#bg)"/>
${blobs}
${stars(w, h, starCount, seed)}
${body}
</g>
<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="${radius}" stroke="${C.line}"/>
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
    texts += `<text class="mono" x="${x}" y="${y}" font-size="${size}" fill="${color}" textLength="${line.length * cw}" lengthAdjust="spacing" clip-path="url(#tw${i})">${esc(line)}</text>`;
  });
  const cursor = `<rect class="blink" x="${x}" y="${y - size + 3}" width="${Math.round(cw * 0.75)}" height="${size}" fill="${C.cyan}">${anim('x', frames.map((f) => x + f.k * cw))}</rect>`;
  return { defs: clips, body: texts + cursor };
}

export function banner(p) {
  const tw = typewriter(p.taglines, { x: 94, y: 246 });
  const body = `
<g class="shoot" style="animation-delay:1s"><line x1="620" y1="-10" x2="700" y2="-50" stroke="url(#trail)" stroke-width="2" stroke-linecap="round"/></g>
<g class="shoot" style="animation-delay:4.6s"><line x1="980" y1="40" x2="1060" y2="0" stroke="url(#trail)" stroke-width="1.6" stroke-linecap="round"/></g>

<g transform="translate(805 160) rotate(-18)">
  <path d="M-150 0A150 30 0 0 1 150 0" stroke="url(#ring)" stroke-width="7" opacity=".55"/>
  <g><animateMotion dur="14s" repeatCount="indefinite" path="M190 0A190 50 0 1 1 -190 0A190 50 0 1 1 190 0"/><circle r="7" fill="url(#moon)"/></g>
  <g transform="rotate(18)">
    <circle r="112" fill="${C.violet}" opacity=".25" filter="url(#glow)"/>
    <circle r="80" fill="url(#planet)"/>
    <g clip-path="url(#pclip)" opacity=".35">
      <ellipse cx="0" cy="-30" rx="95" ry="9" fill="#c4b5fd"/>
      <ellipse cx="0" cy="-2" rx="95" ry="5" fill="#312e81"/>
      <ellipse cx="0" cy="22" rx="95" ry="12" fill="#a78bfa"/>
      <ellipse cx="0" cy="50" rx="95" ry="6" fill="#312e81"/>
    </g>
    <circle r="80" fill="url(#shadow)"/>
  </g>
  <path d="M-150 0A150 30 0 0 0 150 0" stroke="url(#ring)" stroke-width="7"/>
  <path d="M-128 0A128 24 0 0 0 128 0" stroke="${C.cyan}" stroke-width="1.5" opacity=".5"/>
  <g class="front"><animateMotion dur="14s" repeatCount="indefinite" path="M190 0A190 50 0 1 1 -190 0A190 50 0 1 1 190 0"/><circle r="7" fill="url(#moon)"/></g>
</g>

<text class="mono" x="72" y="86" font-size="15" fill="${C.cyan}" letter-spacing="1">// incoming transmission · ${esc(p.coords)}</text>
<text class="sans" x="68" y="168" font-size="66" font-weight="800" fill="url(#txt)">Hi, I'm ${esc(p.name)}</text>
<text class="mono" x="72" y="200" font-size="15" fill="${C.muted}">a.k.a. <tspan fill="${C.pink}">@${esc(p.handle)}</tspan></text>
<text class="mono" x="70" y="246" font-size="20" fill="${C.pink}">&gt;</text>
${tw.body}
<g transform="translate(72 290)">
  <circle cx="5" cy="-5" r="4" fill="${C.mint}"><animate attributeName="opacity" values="1;.2;1" dur="2s" repeatCount="indefinite"/></circle>
  <text class="mono" x="18" y="0" font-size="13" fill="${C.muted}">signal online · ${esc(p.location)}</text>
</g>`;
  return frame(1000, 330, body, {
    seed: 7,
    starCount: 150,
    title: `Hi, I'm ${p.name}`,
    nebula: [
      [800, 90, 220, 120, C.violet, 0.35],
      [640, 330, 260, 90, C.cyan, 0.18],
      [990, 300, 160, 110, C.pink, 0.2],
      [120, 40, 200, 70, '#4338ca', 0.3],
    ],
    defs: `${tw.defs}
<radialGradient id="planet" cx=".32" cy=".3" r=".85"><stop offset="0" stop-color="#ddd6fe"/><stop offset=".35" stop-color="#8b5cf6"/><stop offset=".8" stop-color="#3b1d8f"/><stop offset="1" stop-color="#1e1250"/></radialGradient>
<radialGradient id="shadow" cx=".25" cy=".25" r="1"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".65"/></radialGradient>
<radialGradient id="moon" cx=".3" cy=".3" r=".9"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="${C.cyan}"/></radialGradient>
<linearGradient id="ring" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${C.cyan}" stop-opacity=".2"/><stop offset=".5" stop-color="#e0e7ff"/><stop offset="1" stop-color="${C.pink}" stop-opacity=".3"/></linearGradient>
<linearGradient id="trail" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<clipPath id="pclip"><circle r="80"/></clipPath>`,
    css: `
.blink{animation:blink 1s steps(1) infinite}
@keyframes blink{50%{opacity:0}}
.shoot{opacity:0;animation:shoot 7s linear infinite}
@keyframes shoot{0%{opacity:0;transform:translate(0,0)}2%{opacity:1}12%{opacity:0;transform:translate(-340px,170px)}100%{opacity:0;transform:translate(-340px,170px)}}
.front{animation:front 14s steps(1) infinite}
@keyframes front{0%{opacity:1}50%{opacity:0}}`,
  });
}

function techPlanet(t, r) {
  const s = r * 1.05;
  return `<circle r="${r + 8}" fill="${t.color}" opacity=".3" filter="url(#glow)"/>
<circle r="${r}" fill="${t.color}"/>
<circle r="${r}" fill="url(#shade)"/>
<path d="${ICONS[t.icon]}" fill="${t.iconFill ?? '#fff'}" transform="translate(${-s / 2} ${-s / 2}) scale(${r1(s / 24 * 100) / 100})"/>
<text class="mono" y="${r + 20}" text-anchor="middle" font-size="13" font-weight="600" fill="${C.text}" stroke="${C.bg0}" stroke-width="4" paint-order="stroke">${esc(t.label)}</text>`;
}

function orbit(items, { rx, ry, dur, r }) {
  const path = `M${rx} 0A${rx} ${ry} 0 1 1 ${-rx} 0A${rx} ${ry} 0 1 1 ${rx} 0`;
  const planets = items
    .map((t, i) => {
      const begin = `-${r1((dur / items.length) * i)}s`;
      const timing = `dur="${dur}s" begin="${begin}" repeatCount="indefinite"`;
      // Front (bottom) of the orbit is bigger and brighter, back (top) smaller: a cheap 3D effect.
      return `<g><animateMotion ${timing} path="${path}"/><g>
<animateTransform attributeName="transform" type="scale" ${timing} values=".82;1;.82;.66;.82" keyTimes="0;.25;.5;.75;1" calcMode="spline" keySplines=".4 0 .6 1;.4 0 .6 1;.4 0 .6 1;.4 0 .6 1"/>
<animate attributeName="opacity" ${timing} values=".9;1;.9;.6;.9" keyTimes="0;.25;.5;.75;1"/>
${techPlanet(t, r)}</g></g>`;
    })
    .join('');
  return `<ellipse rx="${rx}" ry="${ry}" stroke="${C.violet}" stroke-opacity=".35" stroke-dasharray="3 7" class="spin"/>${planets}`;
}

export function stack(p) {
  const body = `
<text class="mono" x="36" y="46" font-size="13" fill="${C.cyan}" letter-spacing="3">TECH ORBIT</text>
<text class="mono" x="36" y="66" font-size="12" fill="${C.muted}">// systems i build with</text>
<g transform="translate(500 245)">
  <circle r="70" fill="${C.gold}" opacity=".35" filter="url(#glow)" class="pulse"/>
  <circle r="40" fill="url(#sun)"/>
  <text class="mono" y="7" text-anchor="middle" font-size="20" font-weight="800" fill="#3b1d0a">&lt;/&gt;</text>
  ${orbit(p.stack.inner, { rx: 235, ry: 80, dur: 26, r: 24 })}
  ${orbit(p.stack.outer, { rx: 420, ry: 150, dur: 42, r: 26 })}
</g>
<g class="mono" font-size="11" fill="${C.muted}">
  <circle cx="42" cy="432" r="4" stroke="${C.violet}"/><text x="54" y="436">inner orbit · ${esc(p.stack.innerLabel)}</text>
  <circle cx="42" cy="452" r="4" stroke="${C.violet}"/><text x="54" y="456">outer orbit · ${esc(p.stack.outerLabel)}</text>
</g>`;
  const all = [...p.stack.inner, ...p.stack.outer].map((t) => t.label).join(', ');
  return frame(1000, 480, body, {
    seed: 21,
    starCount: 110,
    title: `Tech stack: ${all}`,
    nebula: [
      [500, 245, 260, 120, '#4c1d95', 0.35],
      [120, 420, 200, 90, C.cyan, 0.12],
      [900, 60, 200, 90, C.pink, 0.15],
    ],
    defs: `
<radialGradient id="sun" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#fffbeb"/><stop offset=".45" stop-color="${C.gold}"/><stop offset="1" stop-color="#f97316"/></radialGradient>
<radialGradient id="shade" cx=".3" cy=".25" r="1"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></radialGradient>`,
    css: `
.pulse{transform-box:fill-box;transform-origin:center;animation:pulse 4s ease-in-out infinite}
@keyframes pulse{0%,100%{transform:scale(1);opacity:.3}50%{transform:scale(1.15);opacity:.5}}
.spin{animation:dash 30s linear infinite}
@keyframes dash{to{stroke-dashoffset:-200}}`,
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

export function missionCard(repo, index) {
  const h = hash(repo.name);
  const color = ACCENTS[h % 5];
  const desc = wrap(repo.description || 'No description yet — classified mission.', 52, 2);
  const lang = repo.language || 'Unknown';
  const body = `
<g transform="translate(66 78)">
  <circle r="46" fill="${color}" opacity=".22" filter="url(#glow)"/>
  <circle r="30" fill="${color}"/>
  <circle r="30" fill="url(#shade)"/>
  <ellipse rx="44" ry="10" stroke="${color}" stroke-opacity=".6" stroke-width="2" transform="rotate(-20)"/>
  <g><animateMotion dur="${6 + (h % 5)}s" repeatCount="indefinite" path="M44 0A44 16 0 1 1 -44 0A44 16 0 1 1 44 0"/><circle r="3.5" fill="#fff"/></g>
</g>
<text class="mono" x="464" y="32" text-anchor="end" font-size="10" fill="${C.muted}" letter-spacing="2">MISSION ${String(index + 1).padStart(2, '0')}</text>
<text class="sans" x="132" y="56" font-size="22" font-weight="700" fill="${C.text}">${esc(truncate(repo.name, 24))}</text>
${desc.map((l, i) => `<text class="sans" x="132" y="${82 + i * 19}" font-size="13.5" fill="${C.muted}">${esc(l)}</text>`).join('')}
<g class="mono" font-size="12" fill="${C.text}">
  <circle cx="137" cy="133" r="5" fill="${color}"/><text x="148" y="137">${esc(lang)}</text>
  <text x="${156 + lang.length * 7.5}" y="137" fill="${C.gold}">★ ${repo.stars}</text>
  <text x="464" y="137" text-anchor="end" fill="${C.muted}">last contact ${esc(repo.pushed)}</text>
</g>`;
  return frame(490, 160, body, {
    seed: h,
    starCount: 30,
    radius: 14,
    title: `${repo.name}: ${repo.description || ''}`,
    nebula: [[420, 20, 140, 60, color, 0.18]],
    defs: `<radialGradient id="shade" cx=".3" cy=".25" r="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></radialGradient>`,
  });
}

export function transmission(t) {
  const rings = [0, 1, 2]
    .map((i) => `<circle r="4" stroke="${C.pink}" stroke-width="1.5"><animate attributeName="r" values="4;24" dur="2.4s" begin="${i * 0.8}s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0" dur="2.4s" begin="${i * 0.8}s" repeatCount="indefinite"/></circle>`)
    .join('');
  const body = `
<g transform="translate(46 40)">${rings}<circle r="5" fill="${C.pink}"/></g>
<text class="mono" x="86" y="35" font-size="10" fill="${C.pink}" letter-spacing="2">LAST TRANSMISSION</text>
<text class="sans" x="86" y="56" font-size="16" fill="${C.text}">${esc(truncate(t.text, 70))}</text>
<text class="mono" x="966" y="50" text-anchor="end" font-size="12" fill="${C.muted}">${esc(t.date)}</text>`;
  return frame(1000, 80, body, {
    seed: 99,
    starCount: 40,
    radius: 14,
    title: `Last transmission: ${t.text}`,
    nebula: [[60, 40, 120, 50, C.pink, 0.15]],
  });
}

export function missionLog(s) {
  const tiles = s.metrics
    .map((m, i) => {
      const x = 36 + i * 152;
      return `<g transform="translate(${x} 70)">
<rect width="140" height="104" rx="12" fill="#ffffff" fill-opacity=".03" stroke="${C.line}"/>
<text class="sans" x="18" y="52" font-size="34" font-weight="800" fill="url(#txt)">${esc(m.value)}</text>
<text class="mono" x="18" y="80" font-size="10" fill="${C.muted}" letter-spacing="1.5">${esc(m.label.toUpperCase())}</text>
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
  if (!s.languages.length) legend = `<text y="48" fill="${C.muted}">no fuel data yet</text>`;

  let signal;
  const W = 928, H = 44, top = 214;
  if (s.weekly.length > 1) {
    const max = Math.max(1, ...s.weekly);
    const pts = s.weekly.map((v, i) => [r1(36 + (i / (s.weekly.length - 1)) * W), r1(top + H - (v / max) * H)]);
    const line = pts.map(([px, py], i) => `${i ? 'L' : 'M'}${px} ${py}`).join('');
    signal = `<path d="${line}L${36 + W} ${top + H}L36 ${top + H}Z" fill="url(#area)"/>
<path d="${line}" stroke="${C.cyan}" stroke-width="2" stroke-linejoin="round" pathLength="1" class="draw"/>`;
  } else {
    signal = `<line x1="36" y1="${top + H}" x2="${36 + W}" y2="${top + H}" stroke="${C.cyan}" stroke-opacity=".4" stroke-dasharray="4 6"/>
<text class="mono" x="500" y="${top + H - 10}" text-anchor="middle" font-size="11" fill="${C.muted}">awaiting signal…</text>`;
  }

  const body = `
<text class="mono" x="36" y="46" font-size="13" fill="${C.cyan}" letter-spacing="3">MISSION LOG</text>
<text class="mono" x="964" y="46" text-anchor="end" font-size="11" fill="${C.muted}">updated ${esc(s.updated)}</text>
${tiles}
<g class="mono" font-size="12" transform="translate(664 70)">
  <text font-size="10" y="4" fill="${C.muted}" letter-spacing="1.5">FUEL MIX · TOP LANGUAGES</text>
  <g transform="translate(0 16)" clip-path="url(#barclip)">${bar}</g>
  ${legend}
</g>
<text class="mono" x="36" y="204" font-size="10" fill="${C.muted}" letter-spacing="1.5">SIGNAL · WEEKLY CONTRIBUTIONS · LAST 12 MONTHS</text>
${signal}`;
  return frame(1000, 280, body, {
    seed: 42,
    starCount: 70,
    title: 'GitHub stats',
    nebula: [[820, 120, 200, 100, '#4c1d95', 0.3], [200, 260, 220, 60, C.cyan, 0.1]],
    defs: `<clipPath id="barclip"><rect width="300" height="10" rx="5"/></clipPath>
<linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.cyan}" stop-opacity=".35"/><stop offset="1" stop-color="${C.cyan}" stop-opacity="0"/></linearGradient>`,
    css: `.draw{stroke-dasharray:1;stroke-dashoffset:1;animation:draw 2.5s ease-out forwards}
@keyframes draw{to{stroke-dashoffset:0}}`,
  });
}

export function discordButton() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="340" height="72" viewBox="0 0 340 72" fill="none" role="img" aria-label="Join my Discord">
<defs>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5865F2"/><stop offset="1" stop-color="#7c3aed"/></linearGradient>
<filter id="glow" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="6"/></filter>
</defs>
<style>
.mono{font-family:${MONO}}
.glow{animation:glow 3s ease-in-out infinite}
@keyframes glow{0%,100%{opacity:.35}50%{opacity:.8}}
</style>
<rect class="glow" x="14" y="12" width="312" height="48" rx="24" fill="url(#g)" filter="url(#glow)"/>
<rect x="14" y="12" width="312" height="48" rx="24" fill="url(#g)"/>
<rect x="14.5" y="12.5" width="311" height="47" rx="23.5" stroke="#fff" stroke-opacity=".25"/>
<path d="${ICONS.discord}" fill="#fff" transform="translate(40 24) scale(1)"/>
<text class="mono" x="78" y="41" font-size="14" font-weight="700" fill="#fff" letter-spacing="2">OPEN COMMS · DISCORD</text>
</svg>
`;
}

export function footer() {
  const body = `
<g class="fly">
  <line x1="-120" y1="0" x2="-22" y2="0" stroke="url(#exhaust)" stroke-width="4" stroke-linecap="round"/>
  <path d="M-24 -8H6C14 -8 22 -4 26 0C22 4 14 8 6 8H-24Z" fill="#e0e7ff"/>
  <path d="M-18 -8L-26 -18H-12L-4 -8Z M-18 8L-26 18H-12L-4 8Z" fill="${C.pink}"/>
  <circle cx="6" cy="0" r="3.5" fill="${C.cyan}"/>
</g>
<text class="mono" x="500" y="92" text-anchor="middle" font-size="11" fill="${C.muted}" letter-spacing="4">— END OF TRANSMISSION —</text>`;
  return frame(1000, 120, body, {
    seed: 5,
    starCount: 70,
    radius: 14,
    title: 'End of transmission',
    nebula: [[500, 120, 300, 50, '#4c1d95', 0.35]],
    defs: `<linearGradient id="exhaust" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${C.pink}" stop-opacity="0"/><stop offset="1" stop-color="${C.gold}"/></linearGradient>`,
    css: `.fly{animation:fly 9s linear infinite}
@keyframes fly{0%{transform:translate(-40px,58px)}50%{transform:translate(520px,40px)}100%{transform:translate(1160px,58px)}}`,
  });
}
