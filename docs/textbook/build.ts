/**
 * Builds docs/textbook/index.html from chapters/*.html, style.css and the dashboard's data snapshots.
 * Run: npx --yes tsx docs/textbook/build.ts
 * Chapter files start with <!--ch|NUMBER|TITLE|ONE-LINE DESCRIPTION-->. Tokens: {{fig:name}}, {{v:name}},
 * {{z:ASSET:episodeIndex}}, {{net:ASSET}}, {{gross:ASSET}}, {{ep:index:label|cuts|bps|first|last}}.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import * as L from '../../src/lib/issuance';
import { FIGS, usd } from './figs';

const DIR = __dirname;
const t = L.totals();
const eps = L.episodes();
const res = L.episodeResults();
const gross = L.grossIssuerVolume();
const byAsset = (id: string) => t.find((x) => x.asset.id === id)!;
const fmtDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const signed = (n: number) => `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(2)}`;

const V: Record<string, string> = {
  gross: usd(gross),
  usdcShare: `${Math.round((byAsset('USDC').gross / gross) * 100)}%`,
  cctp: usd(byAsset('USDC').bridged),
  asOf: fmtDate(L.SNAPSHOT.flowsAsOf.slice(0, 10)),
  start: fmtDate(L.SNAPSHOT.flowsStartWeek),
  lastWeek: fmtDate(L.LAST_WEEK),
  events: '2,416',
};
const svbDate = L.NEWS_EVENTS[0].date;
for (const a of ['USDC', 'USDT'] as const) {
  const w = L.eventWindow(a, svbDate);
  V[`svb${a}Before`] = usd(w.before ?? 0);
  V[`svb${a}After`] = usd(w.after ?? 0);
}

function resolve(tok: string): string {
  const [kind, a, b] = tok.split(':');
  if (kind === 'fig') {
    const f = FIGS[a];
    if (!f) throw new Error(`unknown figure ${a}`);
    return f();
  }
  if (kind === 'v') {
    if (!(a in V)) throw new Error(`unknown value ${a}`);
    return V[a];
  }
  if (kind === 'z') {
    const z = L.zDuring(res, a as L.AssetId, Number(b));
    if (z === null) throw new Error(`no z for ${a} ${b}`);
    return signed(z);
  }
  if (kind === 'net') return usd(byAsset(a).net);
  if (kind === 'gross') return usd(byAsset(a).gross);
  if (kind === 'ep') {
    const e = eps[Number(a)];
    const map: Record<string, string> = { label: e.label, cuts: String(e.cuts), bps: String(e.bps), first: fmtDate(e.firstCut), last: fmtDate(e.lastCut) };
    return map[b];
  }
  throw new Error(`bad token ${tok}`);
}

const files = readdirSync(join(DIR, 'chapters')).filter((f) => f.endsWith('.html')).sort();
interface Ch { num: string; title: string; desc: string; html: string; id: string }
const chapters: Ch[] = files.map((f) => {
  const raw = readFileSync(join(DIR, 'chapters', f), 'utf8');
  const m = raw.match(/^<!--ch\|([^|]*)\|([^|]*)\|([^>]*?)-->/);
  if (!m) throw new Error(`${f}: missing <!--ch|num|title|desc--> header`);
  const body = raw.slice(m[0].length).replace(/\{\{([^}]+)\}\}/g, (_, tok: string) => resolve(tok.trim()));
  const id = /^\d+$/.test(m[1]) ? `c${m[1]}` : m[2].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return { num: m[1], title: m[2], desc: m[3], html: body, id };
});

const css = readFileSync(join(DIR, 'style.css'), 'utf8');
const nav = chapters.map((c) => `<a href="#${c.id}"><b>${c.num}</b>${c.title.split(':')[0]}</a>`).join('');
const toc = chapters.map((c) => `<li><a href="#${c.id}"><span class="n">${c.num}</span><span><span class="t">${c.title}</span><span class="d">${c.desc}</span></span></a></li>`).join('');
const body = chapters
  .map((c) => `<section class="chapter" id="${c.id}"><div class="ch-head"><div class="ch-num" aria-hidden="true">${c.num}</div><h2>${c.title}</h2></div>${c.html}</section>`)
  .join('\n');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Stablecoin flows, explained: a textbook</title>
<meta name="description" content="A study guide to the Ondo Nexus stablecoin flows tracker: mints and redemptions, issuers, tokenized Treasury funds, on-chain data, rate cuts and what to say to a finance professor.">
<style>${css}</style>
</head>
<body>
<nav class="nav" aria-label="Chapters"><div class="nav-in"><a class="home" href="#top">Textbook</a>${nav}</div></nav>
<main class="page" id="top">
<header class="cover">
<p class="kicker">A student trynna learn · Ondo Nexus flows tracker</p>
<h1>Stablecoin flows, <em>explained</em></h1>
<p class="lede">What you need to know to defend the tracker: how stablecoins are made and destroyed, who issues them, how to read the chain, how to measure flows without fooling yourself, and what a finance professor will ask.</p>
<p class="who">Written for Rahil before emailing professors Rajan, Adriaens and Wu. Numbers come from the dashboard's own snapshots (data read ${V.asOf}); they are rebuilt from the repository by <code>docs/textbook/build.ts</code>. Study notes, not investment advice.</p>
</header>
<section class="howto" aria-label="How to use this book">
<div><h3>Read in order, once</h3><p>Chapters 1 to 3 are the money. 4 and 5 are the measurement. 6 and 7 are the economics. 8 is your result. 9 is the conversation.</p></div>
<div><h3>Answer before you open</h3><p>Every chapter ends with check-yourself questions. Say the answer aloud, then open it. If you can't, reread that section.</p></div>
<div><h3>Trust the limits</h3><p>Each chapter says what the tracker cannot show. A professor will respect a stated limit more than a bold claim.</p></div>
</section>
<section class="toc" aria-label="Contents"><h2>Contents</h2><ol>${toc}</ol></section>
${body}
<footer class="footer">Built from <code>src/data</code> snapshots on ${V.asOf} with <code>npx tsx docs/textbook/build.ts</code>. Fonts: Anton and IBM Plex Sans, SIL OFL (licenses in <code>fonts/</code>). Print to PDF from the browser; the print stylesheet switches to a light page.</footer>
</main>
</body>
</html>
`;
writeFileSync(join(DIR, 'index.html'), html);
console.log(`textbook: ${chapters.length} chapters, ${(html.length / 1024).toFixed(0)} KB`);
