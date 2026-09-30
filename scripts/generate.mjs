// Builds all profile SVGs and updates the auto-generated parts of README.md.
// Runs daily via .github/workflows/profile.yml; locally: `node scripts/generate.mjs`
// (without GITHUB_TOKEN the contribution stats fall back to placeholders).
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import * as R from './render.mjs';

const USER = process.env.USERNAME || 'kobolol';
const TOKEN = process.env.GITHUB_TOKEN;
const ROOT = new URL('../', import.meta.url);
const ASSETS = new URL('assets/', ROOT);
const MAX_MISSIONS = 4;

const PROFILE = {
  name: 'Jonas',
  handle: USER,
  location: 'based in Germany',
  coords: '47.42°N 10.99°E',
  taglines: [
    'apprentice software developer (FIAE)',
    'C# · ASP.NET · .NET on the backend',
    'Svelte & SvelteKit on the frontend',
    'shipping code from Germany',
  ],
  stack: {
    innerLabel: 'backend',
    outerLabel: 'frontend',
    inner: [
      { label: 'C#', icon: 'csharp', color: '#7b3fbf' },
      { label: 'ASP.NET', icon: 'dotnet', color: '#3f6ee8' },
      { label: '.NET', icon: 'dotnet', color: '#512bd4' },
    ],
    outer: [
      { label: 'JavaScript', icon: 'javascript', color: '#f7df1e', iconFill: '#12103a' },
      { label: 'Svelte', icon: 'svelte', color: '#ff3e00' },
      { label: 'SvelteKit', icon: 'svelte', color: '#ff8a4c' },
    ],
  },
};

const headers = {
  Accept: 'application/vnd.github+json',
  'User-Agent': `${USER}-profile-generator`,
  ...(TOKEN && { Authorization: `Bearer ${TOKEN}` }),
};

async function rest(path) {
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (!res.ok) throw new Error(`GET ${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function graphql(query, variables) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) throw new Error(`GraphQL: ${JSON.stringify(json.errors ?? json)}`);
  return json.data;
}

const day = (iso) => iso.slice(0, 10);

async function contributions() {
  if (!TOKEN) return null;
  const data = await graphql(
    `query($login: String!) { user(login: $login) { contributionsCollection { contributionCalendar {
      totalContributions weeks { contributionDays { date contributionCount } } } } } }`,
    { login: USER },
  );
  const cal = data.user.contributionsCollection.contributionCalendar;
  const days = cal.weeks.flatMap((w) => w.contributionDays);

  let longest = 0;
  let run = 0;
  for (const d of days) {
    run = d.contributionCount > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  // A streak is still alive if today simply has no contributions yet.
  let i = days.length - 1;
  if (days[i]?.contributionCount === 0) i--;
  let current = 0;
  while (i >= 0 && days[i].contributionCount > 0) { current++; i--; }

  return {
    total: cal.totalContributions,
    current,
    longest,
    weekly: cal.weeks.map((w) => w.contributionDays.reduce((sum, d) => sum + d.contributionCount, 0)),
  };
}

function describe(e) {
  const repo = e.repo.name.startsWith(`${USER}/`) ? e.repo.name.slice(USER.length + 1) : e.repo.name;
  const p = e.payload;
  switch (e.type) {
    case 'PushEvent': {
      const n = p.size ?? p.commits?.length;
      return n ? `pushed ${n} commit${n === 1 ? '' : 's'} to ${repo}` : `pushed to ${repo}`;
    }
    case 'CreateEvent':
      return p.ref_type === 'repository' ? `launched a new mission: ${repo}` : `created ${p.ref_type} ${p.ref} in ${repo}`;
    case 'PullRequestEvent': return `${p.action} a pull request in ${repo}`;
    case 'IssuesEvent': return `${p.action} an issue in ${repo}`;
    case 'IssueCommentEvent': return `commented on an issue in ${repo}`;
    case 'ReleaseEvent': return `released ${p.release?.tag_name ?? 'a new version'} of ${repo}`;
    case 'WatchEvent': return `starred ${repo}`;
    case 'ForkEvent': return `forked ${repo}`;
    case 'PublicEvent': return `made ${repo} public`;
    default: return `was active in ${repo}`;
  }
}

const stamp = (iso) => `${day(iso)} · ${iso.slice(11, 16)} UTC`;

async function lastTransmission(repos) {
  const events = await rest(`/users/${USER}/events/public?per_page=30`).catch(() => []);
  const e = events.find((ev) => ev.repo.name !== `${USER}/${USER}`);
  if (e) return { text: describe(e), date: stamp(e.created_at) };
  if (repos[0]) return { text: `pushed to ${repos[0].name}`, date: stamp(repos[0].pushed_at) };
  return { text: 'radio silence…', date: '' };
}

async function topLanguages(repos) {
  const bytes = {};
  for (const r of repos) {
    const langs = await rest(`/repos/${r.full_name}/languages`).catch(() => ({}));
    for (const [name, n] of Object.entries(langs)) bytes[name] = (bytes[name] ?? 0) + n;
  }
  const total = Object.values(bytes).reduce((a, b) => a + b, 0);
  if (!total) return [];
  const sorted = Object.entries(bytes).sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, 3).map(([name, n]) => ({ name, share: (n / total) * 100 }));
  const rest_ = sorted.slice(3).reduce((a, [, n]) => a + n, 0);
  if (rest_) top.push({ name: 'Other', share: (rest_ / total) * 100 });
  return top;
}

function replaceBlock(text, name, content) {
  const re = new RegExp(`(<!-- ${name}:START -->)[\\s\\S]*?(<!-- ${name}:END -->)`);
  if (!re.test(text)) throw new Error(`README is missing the ${name} markers`);
  return text.replace(re, `$1\n${content}\n$2`);
}

async function main() {
  await mkdir(ASSETS, { recursive: true });
  const write = (name, svg) => writeFile(new URL(name, ASSETS), svg);

  await write('banner.svg', R.banner(PROFILE));
  await write('stack.svg', R.stack(PROFILE));
  await write('discord.svg', R.discordButton());
  await write('footer.svg', R.footer());

  const [user, allRepos] = await Promise.all([
    rest(`/users/${USER}`),
    rest(`/users/${USER}/repos?per_page=100&sort=pushed`),
  ]);
  const repos = allRepos.filter((r) => !r.fork && !r.archived && r.name.toLowerCase() !== USER.toLowerCase());

  // Card files are named after the repo, not its position: GitHub caches images by URL, so
  // positional names would show stale cards whenever the order of recent repos changes.
  const missions = repos.slice(0, MAX_MISSIONS);
  const missionFile = (r) => `mission-${r.name.toLowerCase().replace(/[^a-z0-9-]+/g, '-')}.svg`;
  const keep = new Set(missions.map(missionFile));
  for (const f of await readdir(ASSETS)) {
    if (f.startsWith('mission-') && f !== 'mission-log.svg' && !keep.has(f)) await rm(new URL(f, ASSETS));
  }
  const cards = [];
  for (const [i, r] of missions.entries()) {
    const file = missionFile(r);
    await write(file, R.missionCard({
      name: r.name,
      description: r.description,
      language: r.language,
      stars: r.stargazers_count,
      pushed: day(r.pushed_at),
    }, i));
    cards.push(`<a href="${r.html_url}"><img src="assets/${file}" width="49%" alt="${R.esc(r.name)}" /></a>`);
  }

  await write('transmission.svg', R.transmission(await lastTransmission(repos)));

  let contrib = null;
  try {
    contrib = await contributions();
  } catch (err) {
    console.warn(`Contribution stats unavailable: ${err.message}`);
  }
  const dash = '—';
  await write('mission-log.svg', R.missionLog({
    updated: day(new Date().toISOString()),
    metrics: [
      { label: 'contributions', value: contrib ? contrib.total.toLocaleString('en-US') : dash },
      { label: 'current streak', value: contrib ? `${contrib.current}d` : dash },
      { label: 'longest streak', value: contrib ? `${contrib.longest}d` : dash },
      { label: 'public repos', value: String(user.public_repos) },
    ],
    languages: await topLanguages(repos),
    weekly: contrib?.weekly ?? [],
  }));

  const readmeUrl = new URL('README.md', ROOT);
  const readme = await readFile(readmeUrl, 'utf8');
  await writeFile(readmeUrl, replaceBlock(readme, 'MISSIONS', cards.join('\n') || '<i>No public missions yet.</i>'));

  console.log(`Generated profile for ${USER}: ${missions.length} missions, contributions ${contrib ? 'live' : 'skipped'}.`);
}

await main();
