/**
 * Figures for the textbook. Data figures read the same snapshots as the dashboard; mechanism diagrams use
 * labeled toy numbers. All SVG is inline, native shapes only, and takes its colors from CSS classes.
 */
import { toEventSelector } from 'viem';
import * as L from '../../src/lib/issuance';

let uid = 0;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const usd = (n: number): string => {
  const a = Math.abs(n);
  const sign = n < 0 ? '−' : '';
  if (a >= 1e12) return `${sign}$${(a / 1e12).toFixed(2)} trillion`;
  if (a >= 1e9) return `${sign}$${(a / 1e9).toFixed(a >= 1e11 ? 0 : 1)}B`;
  if (a >= 1e6) return `${sign}$${(a / 1e6).toFixed(a >= 1e8 ? 0 : 1)}M`;
  return `${sign}$${Math.round(a).toLocaleString('en-US')}`;
};
const signed = (n: number, d = 2) => `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(d)}`;

/** Wrap a body in a figure with title, svg and caption. */
function fig(opts: { id: string; title: string; label: string; w: number; h: number; body: string; caption: string; illustration?: boolean }): string {
  const n = ++uid;
  const defs = `<defs><marker id="ar${n}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="currentColor"/></marker></defs>`;
  const body = opts.body.replace(/url\(#ar\)/g, `url(#ar${n})`);
  return `<figure class="figure" id="${opts.id}">
<p class="fig-title">${esc(opts.title)}${opts.illustration ? ' <span class="tag">Illustration</span>' : ''}</p>
<div class="scroll"><svg class="diagram" viewBox="0 0 ${opts.w} ${opts.h}" role="img" aria-label="${esc(opts.label)}">${defs}${body}</svg></div>
<figcaption>${opts.caption}</figcaption>
</figure>`;
}

const T = (x: number, y: number, s: string, cls = '', anchor = 'start') =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}"${cls ? ` class="${cls}"` : ''}>${esc(s)}</text>`;
/** Multi-line text, one tspan per line. */
const TL = (x: number, y: number, lines: string[], cls = '', anchor = 'start', lh = 19) =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}"${cls ? ` class="${cls}"` : ''}>${lines.map((l, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : lh}">${esc(l)}</tspan>`).join('')}</text>`;
const box = (x: number, y: number, w: number, h: number, cls = 'box') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" class="${cls}"/>`;
const arrow = (d: string) => `<path d="${d}" class="arrow" marker-end="url(#ar)"/>`;

const monthMs = 86_400_000;
const ms = (iso: string) => Date.parse(`${iso}T00:00:00Z`);

// ---------------------------------------------------------------------------
// Data figures
// ---------------------------------------------------------------------------

export function figGrossTable(): string {
  const t = L.totals();
  const gross = t.reduce((a, x) => a + x.gross, 0);
  const max = Math.max(...t.map((x) => x.gross));
  const rows = t
    .map((x) => {
      const w = (x.gross / max) * 68;
      const hi = x.asset.id === 'USDC' ? ' hi' : '';
      return `<tr><th scope="row">${x.asset.id}<small>${esc(x.asset.issuer)}</small></th>
<td class="num">${usd(x.mint)}</td><td class="num">${usd(x.redeem)}</td><td class="num">${usd(x.net)}</td>
<td class="bar-cell"><span class="bar${hi}" style="width:${Math.max(w, 0.6).toFixed(1)}%"></span><span class="bar-label">${((x.gross / gross) * 100).toFixed(x.gross / gross < 0.01 ? 2 : 0)}%</span></td></tr>`;
    })
    .join('');
  return `<figure class="figure" id="fig-gross">
<p class="fig-title">USDC is ${Math.round((t.find((x) => x.asset.id === 'USDC')!.gross / gross) * 100)}% of the ${usd(gross)} that was minted and redeemed on Ethereum.</p>
<div class="table-wrap"><table class="data">
<thead><tr><th>Asset</th><th class="num">Minted</th><th class="num">Redeemed</th><th class="num">Net (mint − redeem)</th><th>Share of gross</th></tr></thead>
<tbody>${rows}</tbody></table></div>
<figcaption>Compare the bars: gross volume (mints plus redemptions) as a share of the total. Ethereum event logs only, from ${esc(L.SNAPSHOT.flowsStartWeek)} to the week of ${esc(L.LAST_WEEK)}. USDC net is negative here because USDC also lives on other chains (chapter 5). Source: <code>src/data/issuance.json</code>, snapshot ${esc(L.SNAPSHOT.flowsAsOf.slice(0, 10))}.</figcaption>
</figure>`;
}

export function figRates(): string {
  const W = 880, H = 320, ml = 58, mr = 150, mt = 34, mb = 40;
  const series = L.fedFundsSeries().filter((p) => p.date >= '2022-12-01');
  const x0 = ms('2023-01-01');
  const x1 = ms(series[series.length - 1].date);
  const X = (iso: string) => ml + ((ms(iso) - x0) / (x1 - x0)) * (W - ml - mr);
  const yMin = 3.5, yMax = 5.5;
  const Y = (v: number) => mt + (1 - (v - yMin) / (yMax - yMin)) * (H - mt - mb);
  // Step path from change points only.
  let path = '';
  let last = NaN;
  for (const p of series) {
    if (p.value !== last) {
      const x = X(p.date < '2023-01-01' ? '2023-01-01' : p.date);
      path += path ? ` H${x.toFixed(1)} V${Y(p.value).toFixed(1)}` : `M${x.toFixed(1)} ${Y(p.value).toFixed(1)}`;
      last = p.value;
    }
  }
  path += ` H${X(series[series.length - 1].date).toFixed(1)}`;
  const eps = L.episodes();
  const bands = eps
    .map((e, i) => {
      const end = new Date(ms(e.lastCut) + L.TAIL_WEEKS * 7 * monthMs).toISOString().slice(0, 10);
      const xa = X(e.firstCut), xb = X(end);
      return `<rect x="${xa.toFixed(1)}" y="${mt}" width="${(xb - xa).toFixed(1)}" height="${H - mt - mb}" class="band"/>` +
        T((xa + xb) / 2, H - mb - 8, `−${e.bps} bp`, 'strong', 'middle') +
        T((xa + xb) / 2, mt - 10, `Episode ${i + 1}`, 'muted', 'middle');
    })
    .join('');
  const yTicks = [4, 4.5, 5, 5.5].map((v) => T(ml - 10, Y(v) + 5, `${v.toFixed(2)}%`, 'muted', 'end')).join('');
  const xTicks = ['2023', '2024', '2025', '2026'].map((y) => T(X(`${y}-01-01`), H - 10, y, 'muted', 'middle')).join('');
  const events = L.NEWS_EVENTS.map((e, i) =>
    `<line x1="${X(e.date).toFixed(1)}" x2="${X(e.date).toFixed(1)}" y1="${mt + 14}" y2="${H - mb}" class="event"/>` +
    (i === 0
      ? TL(X(e.date) + 6, Y(4.15), ['Mar 2023:', 'SVB, USDC depeg'], 'small')
      : TL(X(e.date) - 6, Y(4.15), ['Jul 2025:', 'GENIUS Act signed'], 'small', 'end'))
  ).join('');
  const lastV = series[series.length - 1].value;
  const body = `${bands}
<line x1="${ml}" x2="${ml}" y1="${Y(yMax)}" y2="${Y(yMin)}" class="axis"/>
${yTicks}${xTicks}
<path d="${path}" class="series"/>
${events}
${T(W - mr + 8, Y(lastV) + 5, `${lastV.toFixed(2)}% (hike, Sep 2026)`, 'strong')}
${T(X('2024-03-01'), Y(5.5) - 8, '5.50% peak', 'muted', 'middle')}`;
  return fig({
    id: 'fig-rates',
    title: `The Fed cut in two bursts, ${eps[0].label.replace(' to ', ' to ')} and ${eps[1].label}, with no cuts between them.`,
    label: `Step chart of the Fed target rate upper bound from 2023 to 2026, with two shaded easing episodes of ${eps[0].bps} and ${eps[1].bps} basis points.`,
    w: W, h: H, body,
    caption: `Compare the shaded windows with the flat stretches between them. Each shaded window runs from the first cut to ${L.TAIL_WEEKS} weeks after the last, the window the study measures. The vertical axis starts at 3.5%, not zero, which is fine for a line. Source: FRED DFEDTARU, <code>src/data/rates.json</code>.`,
  });
}

export function figDumbbell(): string {
  const res = L.episodeResults();
  const eps = L.episodes();
  const rows = L.ASSETS;
  const vals = res.flatMap((r) => [r.preZ, r.duringZ]).filter((v): v is number => v !== null);
  const m = Math.ceil((Math.max(...vals.map(Math.abs)) + 0.1) * 2) / 2;
  const W = 880, labelW = 150, gap = 40, pw = (W - labelW - gap - 20) / 2, rowH = 44, top = 56;
  const H = top + rows.length * rowH + 20 + 34;
  const rowY = (i: number) => top + i * rowH + (i >= 3 ? 20 : 0) + 20;
  const panel = (ei: number) => {
    const x0 = labelW + ei * (pw + gap);
    const X = (v: number) => x0 + ((v + m) / (2 * m)) * pw;
    let s = T(x0, 22, eps[ei].label, 'strong') + T(x0, 40, `${eps[ei].cuts} cuts, −${eps[ei].bps} bp`, 'muted');
    s += `<line x1="${X(0)}" x2="${X(0)}" y1="${top - 4}" y2="${rowY(5) + 18}" class="zero"/>`;
    for (let t = -Math.floor(m); t <= Math.floor(m); t++) {
      s += T(X(t), H - 14, t === 0 ? '0' : signed(t, 0), 'muted', 'middle');
    }
    rows.forEach((a, i) => {
      const r = res.find((q) => q.asset === a.id && q.episode.firstCut === eps[ei].firstCut)!;
      const y = rowY(i);
      if (r.preZ === null || r.duringZ === null) {
        s += T(x0 + 6, y + 5, 'no history', 'muted');
        return;
      }
      s += `<line x1="${X(r.preZ)}" x2="${X(r.duringZ)}" y1="${y}" y2="${y}" class="link"/>`;
      s += `<circle cx="${X(r.preZ)}" cy="${y}" r="6" class="dot-pre"/>`;
      s += `<circle cx="${X(r.duringZ)}" cy="${y}" r="8" class="dot-during"><title>${a.id}: ${usd(r.preUsd ?? 0)} per week before, ${usd(r.duringUsd ?? 0)} per week during</title></circle>`;
      const right = r.duringZ >= r.preZ;
      s += T(X(r.duringZ) + (right ? 14 : -14), y + 5, signed(r.duringZ), 'strong', right ? 'start' : 'end');
    });
    return s;
  };
  const labels = rows.map((a, i) => T(0, rowY(i) + 5, a.id, 'strong') + T(62, rowY(i) + 5, a.group === 'payment' ? 'payment' : 'Treasury', 'muted')).join('');
  const body = `${labels}${panel(0)}${panel(1)}`;
  return fig({
    id: 'fig-dumbbell',
    title: `2024: cuts coincided with USDC and USDT issuance above normal and Treasury funds below. 2025: the split blurred.`,
    label: 'Dumbbell chart of mean weekly net issuance before and during two Fed easing episodes, in standard deviations, for six assets.',
    w: W, h: H, body,
    caption: `Open dot: 12 weeks before the first cut. Yellow dot: first cut through ${L.TAIL_WEEKS} weeks after the last. Both panels share one scale, in standard deviations of that asset's own weekly net issuance, so a small fund and a huge stablecoin can sit on one axis (hover a dot for dollars). Two episodes are a description, not a test.`,
  });
}

export function figChains(): string {
  const W = 880, labelW = 80, barW = 790, rowH = 84, top = 8;
  const H = top + 3 * rowH + 6;
  const grays = ['#C6C7BF', '#A9AAA2', '#D9DAD3', '#B4B5AD', '#CFD0C9', '#98998F'];
  let s = '';
  const lists: string[] = [];
  const eth: Record<string, number> = {};
  (['USDT', 'USDC', 'PYUSD'] as const).forEach((a, i) => {
    const { chains, total } = L.chainShares(a, 5);
    const y = top + i * rowH;
    s += T(0, y + 28, a, 'strong') + T(0, y + 48, usd(total), 'muted');
    lists.push(`${a}: ${chains.filter((c) => c.share >= 0.01).map((c) => `${c.chain} ${Math.round(c.share * 100)}%`).join(', ')}`);
    eth[a] = Math.round((chains.find((c) => c.chain === 'Ethereum')?.share ?? 0) * 100);
    let x = labelW;
    chains.forEach((c, k) => {
      const w = c.share * barW;
      const eth = c.chain === 'Ethereum';
      s += `<rect x="${x.toFixed(1)}" y="${y + 6}" width="${w.toFixed(1)}" height="52" class="${eth ? 'seg-hi' : 'seg'}" style="${eth ? '' : `fill:${grays[k % grays.length]}`}"><title>${a} on ${c.chain}: ${usd(c.supplyUsd)}</title></rect>`;
      const fit = Math.floor((w - 12) / 7.4);
      if (c.share >= 0.05 && fit >= 3) {
        const name = c.chain.length <= fit ? c.chain : `${c.chain.slice(0, fit - 1)}…`;
        s += T(x + 7, y + 28, name, 'strong') + T(x + 7, y + 47, `${Math.round(c.share * 100)}%`, 'small');
      }
      x += w;
    });
  });
  const wk = L.chainShares('USDC').week;
  return fig({
    id: 'fig-chains',
    title: `Ethereum holds ${eth.USDT}% of USDT, ${eth.USDC}% of USDC and ${eth.PYUSD}% of PYUSD. The rest sits on other chains.`,
    label: 'Stacked bars of circulating supply share by blockchain for USDT, USDC and PYUSD, with Ethereum highlighted.',
    w: W, h: H, body: s,
    caption: `Compare the yellow segment (Ethereum) across the three bars. Each bar is 100% of that coin's circulating supply in the week of ${wk}. ${lists.join('. ')}. Shares are of supply, not of flows. Source: DefiLlama, <code>src/data/supply-by-chain.json</code>.`,
  });
}

export function figShock(): string {
  const ev = L.NEWS_EVENTS[0];
  const evWeek = new Date(ms(ev.date)); // the lib maps to Monday; mirror it
  const day = evWeek.getUTCDay();
  const monday = new Date(evWeek.getTime() - ((day + 6) % 7) * monthMs).toISOString().slice(0, 10);
  const span = 8;
  const panels = (['USDC', 'USDT'] as const).map((a) => {
    const s = L.netSeries(a);
    const i = s.findIndex((w) => w.week === monday);
    return { a, pts: s.slice(Math.max(0, i - span), i + span + 1).map((w, k, arr) => ({ ...w, k: k - Math.min(span, i) })), i };
  });
  const all = panels.flatMap((p) => p.pts.map((q) => q.net / 1e9));
  const vmax = Math.ceil(Math.max(...all.map(Math.abs)));
  const W = 880, ml = 70, mr = 20, ph = 150, gapP = 56, mt = 36;
  const H = mt + 2 * ph + gapP + 40;
  const n = 2 * span + 1;
  const bw = (W - ml - mr) / n;
  let s = '';
  panels.forEach((p, pi) => {
    const y0 = mt + pi * (ph + gapP);
    const Y = (v: number) => y0 + ph / 2 - (v / vmax) * (ph / 2);
    s += T(ml, y0 - 12, `${p.a}, weekly change in supply`, 'strong');
    s += `<line x1="${ml}" x2="${W - mr}" y1="${Y(0)}" y2="${Y(0)}" class="zero"/>`;
    for (const t of [-vmax, 0, vmax]) s += T(ml - 8, Y(t) + 5, `${t > 0 ? '+' : t < 0 ? '−' : ''}$${Math.abs(t)}B`, 'muted', 'end');
    p.pts.forEach((q, k) => {
      const v = q.net / 1e9;
      const hi = q.week === monday;
      const x = ml + k * bw + bw * 0.15;
      const yv = Y(Math.max(v, 0));
      s += `<rect x="${x.toFixed(1)}" y="${yv.toFixed(1)}" width="${(bw * 0.7).toFixed(1)}" height="${Math.max(Math.abs(Y(v) - Y(0)), 0.5).toFixed(1)}" class="${hi ? 'seg-hi' : 'seg'}" style="${hi ? '' : 'fill:#A9AAA2'}"><title>${q.week}: ${usd(q.net)}</title></rect>`;
      if (hi) s += T(x + bw * 0.35, v < 0 ? Y(v) + 18 : Y(v) - 6, `${signed(v, 1)}B`, 'strong', 'middle');
    });
  });
  const xl = panels[0].pts;
  for (let k = 0; k < xl.length; k += 4) s += T(ml + k * bw + bw / 2, H - 22, xl[k].k === 0 ? 'depeg week' : `${xl[k].k > 0 ? '+' : '−'}${Math.abs(xl[k].k)} wk`, 'muted', 'middle');
  return fig({
    id: 'fig-shock',
    title: 'Around the March 2023 USDC depeg, USDC supply shrank for weeks while USDT supply grew.',
    label: 'Two bar panels of weekly change in circulating supply for USDC and USDT, eight weeks either side of the SVB week, on one scale.',
    w: W, h: H, body: s,
    caption: `Weekly change in circulating supply on all chains, eight weeks either side of the week of ${monday} (yellow). Both panels share one scale. This is the clearest run-like episode in the sample: money left one stablecoin and entered another. Source: DefiLlama via <code>netSeries()</code>.`,
  });
}

// ---------------------------------------------------------------------------
// Mechanism diagrams (toy numbers are labeled)
// ---------------------------------------------------------------------------

export function figMintLoop(): string {
  const body = `
${box(20, 70, 190, 170)}${TL(115, 100, ['Authorized buyer', '(market maker,', 'exchange, institution)'], 'strong', 'middle')}
${box(345, 70, 190, 170)}${TL(440, 100, ['Issuer', 'Circle, Tether, Paxos,', 'BlackRock, Ondo'], 'strong', 'middle')}
${box(700, 70, 160, 170)}${TL(780, 100, ['Exchange', 'order book'], 'strong', 'middle')}
${T(277, 108, 'MINT', 'muted', 'middle')}
${arrow('M214 122 H340')}${T(277, 117, '$1.00 per token', 'small', 'middle').replace('y="117"', 'y="140"')}
${arrow('M340 152 H214')}${T(277, 170, '1 new token', 'small', 'middle')}
${T(277, 196, 'REDEEM', 'muted', 'middle')}
${arrow('M214 206 H340')}${T(277, 224, '1 token', 'small', 'middle')}
${arrow('M340 232 H214').replace('M340 232', 'M340 236')}${T(277, 253, '$1.00 back', 'small', 'middle').replace('y="253"', 'y="256"')}
${arrow('M115 244 V300 H780 V246')}
${TL(447, 322, ['Holders trade tokens with anyone here. The price can drift to $0.998 or $1.002.'], 'small', 'middle')}
${T(440, 50, 'Primary market: only approved parties, at $1.00', 'strong', 'middle')}
${T(780, 50, 'Secondary market', 'strong', 'middle')}`;
  return fig({
    id: 'fig-mintloop', illustration: true,
    title: 'The issuer creates tokens only against dollars and destroys them only against dollars. Everyone else just trades.',
    label: 'Diagram of the primary market, where an approved buyer mints and redeems with the issuer at $1.00, and the secondary market, where tokens trade on an exchange.',
    w: 880, h: 346, body,
    caption: 'A mint event is a left-to-right dollar arrow on the top row. A redemption is the bottom row. If the exchange price falls to $0.998, an approved buyer can buy there and redeem at $1.00; that trade pulls the price back up. This chapter-1 loop is what the tracker counts.',
  });
}

export function figReserve(): string {
  const bar = (x: number, v: number, label: string, hi: boolean) => {
    const h = v * 28;
    return `<rect x="${x}" y="${230 - h}" width="70" height="${h}" class="${hi ? 'seg-hi' : 'seg'}" style="${hi ? '' : 'fill:#A9AAA2'}"/>${T(x + 35, 222 - h, `$${v.toFixed(2)}`, 'strong', 'middle')}${T(x + 35, 252, label, 'muted', 'middle')}`;
  };
  const body = `
${T(0, 22, 'Issuer balance sheet', 'strong')}
${box(0, 36, 150, 190)}${TL(75, 70, ['ASSETS', 'T-bills and cash', '$100'], 'strong', 'middle', 24)}
${box(170, 36, 150, 190)}${TL(245, 70, ['LIABILITIES', 'Tokens in', 'circulation', '$100'], 'strong', 'middle', 24)}
${T(0, 252, 'Always $100 against $100 (par)', 'muted')}
${arrow('M326 130 H390')}${T(358, 122, 'earns', 'small', 'middle')}
${T(400, 22, 'Yearly interest income on the $100', 'strong')}
<line x1="400" x2="640" y1="230" y2="230" class="zero"/>
${bar(420, 4, 'Rates at 4%', false)}
${bar(540, 3, 'After a 1-point cut', true)}
${TL(680, 120, ['Holders of USDC,', 'USDT or PYUSD', 'receive $0 of it.', 'The issuer keeps it.'], 'small', 'start', 22)}`;
  return fig({
    id: 'fig-reserve', illustration: true,
    title: 'A 1-point rate cut takes a quarter of an issuer’s income away, with the same $100 of tokens outstanding.',
    label: 'Balance sheet of $100 of reserves against $100 of tokens, and a bar chart showing yearly interest income falling from $4.00 to $3.00 after a one point cut.',
    w: 880, h: 270, body,
    caption: 'Toy numbers. Bars start at zero. This is why issuers care about the rate path, and why a cut is not neutral for them even if user demand is unchanged. Real reserves are mostly T-bills and repo; real yields differ by issuer.',
  });
}

export function figEventLog(): string {
  const sel = toEventSelector('Mint(address,address,uint256)');
  const hex = (BigInt(50000) * BigInt(10) ** BigInt(6)).toString(16);
  const body = `
${box(0, 30, 200, 70)}${TL(100, 56, ['Transaction', '0x86d357f7…18c6'], 'strong', 'middle')}
${arrow('M100 104 V134')}${T(112, 124, 'has a receipt', 'small')}
${box(0, 138, 200, 70)}${TL(100, 164, ['Receipt', 'logs: [ … ]'], 'strong', 'middle')}
${arrow('M204 172 H258')}${T(231, 162, 'one log', 'small', 'middle')}
${box(262, 8, 600, 262)}
${T(280, 36, 'One log (a USDC Mint)', 'strong')}
${T(280, 68, 'address', 'muted')}${T(400, 68, '0xA0b8…eB48, the USDC contract that emitted it', '')}
${T(280, 100, 'topics[0]', 'muted')}${TL(400, 100, [`${sel.slice(0, 14)}…, the hash of`, '"Mint(address,address,uint256)"'], '')}
${T(280, 150, 'topics[1]', 'muted')}${T(400, 150, 'minter (indexed): who was allowed to mint', '')}
${T(280, 182, 'topics[2]', 'muted')}${T(400, 182, 'to (indexed): who received the new tokens', '')}
${T(280, 214, 'data', 'muted')}${T(400, 214, `0x…${hex}  =  50,000,000,000`, 'strong')}
${T(400, 242, '÷ 1,000,000 (USDC has 6 decimals)  =  $50,000', 'strong')}`;
  return fig({
    id: 'fig-eventlog',
    title: 'Every mint leaves a log. The first topic says what happened; the data says how much.',
    label: 'Diagram of a transaction receipt containing a log with the contract address, event signature hash, two indexed addresses and an amount that decodes to $50,000.',
    w: 880, h: 280, body,
    caption: 'A real USDC mint from the dashboard’s spot check, decoded by hand. The same shape holds for every asset in the study; only the event name and the amount field change. Indexed arguments live in topics; everything else is packed into data.',
  });
}

export function figCctp(): string {
  const body = `
${T(0, 22, 'Ethereum: the cross-chain minter', 'strong')}${T(560, 22, 'Another chain (Base, Solana, …)', 'strong')}
${box(0, 36, 300, 74)}${TL(150, 62, ['Burns 1,000,000 USDC', 'log: Burn 1,000,000'], 'strong', 'middle')}
${box(560, 36, 300, 74)}${TL(710, 62, ['Mints 1,000,000 USDC', 'not in Ethereum logs'], 'strong', 'middle')}
${arrow('M304 73 H556')}${T(430, 64, 'Circle signs the message', 'small', 'middle')}
${box(0, 150, 300, 74)}${TL(150, 176, ['Mints 1,000,000 USDC', 'log: Mint 1,000,000'], 'strong', 'middle')}
${box(560, 150, 300, 74)}${TL(710, 176, ['Burns 1,000,000 USDC', 'not in Ethereum logs'], 'strong', 'middle')}
${arrow('M556 187 H304')}${T(430, 178, 'Circle signs the message', 'small', 'middle')}
${TL(0, 258, ['Row 1 moves USDC off Ethereum. Row 2 moves it back. Global supply never changes.', 'A naive sum of Ethereum logs would count $2M of activity.'], 'small')}`;
  return fig({
    id: 'fig-cctp',
    title: 'Moving USDC between chains burns it on one chain and mints it on the other. Supply is unchanged.',
    label: 'Diagram of a cross-chain USDC transfer: a burn on Ethereum and a mint on another chain, and the reverse.',
    w: 880, h: 296, body,
    caption: `In the real data this is ${usd(L.totals().find((x) => x.asset.id === 'USDC')!.bridged)} of USDC Ethereum volume. The tracker counts it separately and removes it from issuance (ADR-009).`,
  });
}

export function figPipeline(): string {
  const body = `
${box(0, 20, 170, 56)}${TL(85, 44, ['Ethereum node', '(Tenderly RPC)'], 'strong', 'middle', 17)}
${arrow('M174 48 H206')}
${box(210, 20, 170, 56)}${TL(295, 44, ['backfill-', 'issuance.mjs'], 'strong', 'middle', 17)}
${arrow('M384 48 H416')}
${box(420, 20, 150, 56)}${TL(495, 44, ['issuance.json', 'weekly rows'], 'strong', 'middle', 17)}
${arrow('M574 48 H606')}
${box(610, 20, 120, 56)}${TL(670, 44, ['issuance.ts', 'maths'], 'strong', 'middle', 17)}
${arrow('M734 48 H766')}
${box(770, 20, 110, 56)}${TL(825, 44, ['/issuance', '/summary'], 'strong', 'middle', 17)}
${T(190, 102, 'eth_getLogs, 100,000 blocks at a time', 'small', 'middle')}
${box(0, 130, 170, 56)}${TL(85, 154, ['DefiLlama', 'and FRED'], 'strong', 'middle', 17)}
${arrow('M174 158 H206')}
${box(210, 130, 170, 56)}${TL(295, 154, ['backfill-', 'context.mjs'], 'strong', 'middle', 17)}
${arrow('M384 158 H416')}
${box(420, 130, 150, 56)}${TL(495, 154, ['supply-by-chain', 'rates .json'], 'strong', 'middle', 17)}
${arrow('M574 158 H606 M570 158 H640 V82')}
${T(190, 212, 'circulating supply by chain, fed funds target', 'small', 'middle')}`;
  return fig({
    id: 'fig-pipeline',
    title: 'Two scripts write dated snapshots; one library does all the arithmetic; two pages draw it.',
    label: 'Pipeline diagram from Ethereum logs, DefiLlama and FRED through two backfill scripts and JSON files into a library and two pages.',
    w: 880, h: 226, body,
    caption: 'Read left to right. Nothing on the pages calls the network at render time; the snapshots are the evidence. That is why the data carry a date and why a rerun is needed before sending anything.',
  });
}

export function figGrossNet(): string {
  const base = 120, sc = 0.7;
  const cell = (x: number, title: string, bars: Array<[string, number, boolean]>, gross: number, net: number) => {
    let s = T(x, 22, title, 'strong');
    s += `<line x1="${x}" x2="${x + 360}" y1="${base}" y2="${base}" class="zero"/>`;
    bars.forEach(([lab, v, hi], i) => {
      const bx = x + 20 + i * 110;
      const h = Math.abs(v) * sc;
      s += `<rect x="${bx}" y="${v >= 0 ? base - h : base}" width="70" height="${h}" class="${hi ? 'seg-hi' : 'seg'}" style="${hi ? '' : 'fill:#A9AAA2'}"/>`;
      s += T(bx + 35, v >= 0 ? base - h - 6 : base + h + 18, `${v > 0 ? '+' : '−'}${Math.abs(v)}`, 'strong', 'middle');
      s += T(bx + 35, 236, lab, 'muted', 'middle');
    });
    s += T(x, 268, `Gross ${gross}   ·   Net ${net >= 0 ? '+' : '−'}${Math.abs(net)}`, 'strong');
    return s;
  };
  const body = cell(0, 'Market maker round trip', [['Mon: mint', 100, false], ['Wed: burn', -100, false]], 200, 0) +
    cell(460, 'Fund investor adds money', [['Mon: mint', 100, true]], 100, 100);
  return fig({
    id: 'fig-grossnet', illustration: true,
    title: 'The same $100 mint counts as $200 of gross activity or $100 of new money, depending on what came back.',
    label: 'Two bar panels in toy dollars: a market maker mints and burns 100 for gross 200 and net 0; an investor mints 100 for gross 100 and net 100.',
    w: 880, h: 284, body,
    caption: 'Toy numbers on one scale. Gross activity measures how busy the plumbing is. Net issuance measures whether the stock of tokens grew. The "$1 trillion" headline is gross; the rate study uses net.',
  });
}

export function figTransmission(): string {
  const node = (x: number, y: number, w: number, h: number, lines: string[], hi = false) =>
    `${box(x, y, w, h, hi ? 'box hi' : 'box')}${TL(x + w / 2, y + 26, lines, 'strong', 'middle', 19)}`;
  const body = `
${node(0, 110, 170, 60, ['The Fed cuts', 'its target rate'], true)}
${arrow('M174 140 H226')}
${node(230, 110, 190, 60, ['T-bill and money', 'market yields fall'])}
${arrow('M424 128 L498 62')}
${node(502, 28, 378, 60, ['Issuer reserve income falls', '(Circle, Tether, Paxos keep it)'])}
${arrow('M424 140 H498')}
${node(502, 110, 378, 60, ['Cash and stablecoins give up less', 'by paying 0 to holders'])}
${arrow('M690 174 V204')}${T(702, 196, '+?', 'strong')}
${node(502, 208, 378, 46, ['Demand for payment stablecoins may rise'])}
${arrow('M326 174 V286')}${T(338, 236, 'funds pass', 'small')}${T(338, 254, 'the yield on', 'small')}
${node(230, 290, 190, 50, ['Treasury funds', 'yield less'])}
${arrow('M424 316 H498')}
${node(502, 290, 378, 50, ['Demand for Treasury funds may fall'])}
${T(440, 306, '−?', 'strong', 'middle')}`;
  return fig({
    id: 'fig-transmission',
    title: 'A cut might push stablecoin demand up and Treasury-fund demand down. These are guesses to test, not results.',
    label: 'Causal map from a Fed rate cut to lower yields, then to issuer income, stablecoin demand and Treasury fund demand, with question marks on the signs.',
    w: 880, h: 380, body,
    caption: 'Every arrow here is a hypothesis. The tracker can show whether flows moved in these directions around the cuts; it cannot show why. Other things changed in the same weeks (an election, a law, stock-market risk appetite).',
  });
}

export function figWindow(): string {
  const e = L.episodes()[0];
  const wk = 7 * monthMs;
  const start = ms(e.firstCut) - L.PRE_WEEKS * wk;
  const end = ms(e.lastCut) + L.TAIL_WEEKS * wk;
  const W = 880, ml = 20, mr = 20, X = (t: number) => ml + ((t - start) / (end - start)) * (W - ml - mr);
  const f = (iso: string) => X(ms(iso));
  const fmt = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  const cutXs = L.CUTS.filter((c) => c.date >= e.firstCut && c.date <= e.lastCut);
  const body = `
<line x1="${ml}" x2="${W - mr}" y1="110" y2="110" class="zero"/>
<rect x="${X(start)}" y="120" width="${f(e.firstCut) - X(start)}" height="22" class="seg" style="fill:#A9AAA2"/>
${T((X(start) + f(e.firstCut)) / 2, 160, `${L.PRE_WEEKS} weeks before (the baseline)`, 'strong', 'middle')}
<rect x="${f(e.firstCut)}" y="120" width="${X(end) - f(e.firstCut)}" height="22" class="seg-hi"/>
${T((f(e.firstCut) + X(end)) / 2, 160, 'During: first cut to 4 weeks after the last', 'strong', 'middle')}
${cutXs.map((c) => `<line x1="${f(c.date)}" x2="${f(c.date)}" y1="70" y2="110" class="event"/>${T(f(c.date), 62, `${fmt(c.date)}  −${Math.round((c.from - c.to) * 100)} bp`, 'small', 'middle')}`).join('')}
${T(X(start), 100, 'week −12', 'muted')}${T(X(end), 100, `+${L.TAIL_WEEKS} weeks`, 'muted', 'end')}
${TL(W / 2, 214, ['Question: is the average weekly net issuance in the yellow window unusual, compared with the gray window', 'and with every other window of the same length in the sample?'], 'small', 'middle')}`;
  return fig({
    id: 'fig-window', illustration: false,
    title: `One easing episode is a ${L.PRE_WEEKS}-week baseline against a measurement window that starts at the first cut.`,
    label: 'Timeline of the first easing episode showing a twelve week baseline in gray and the during window in yellow, with each cut marked.',
    w: W, h: 240, body,
    caption: `${esc(e.label)} drawn to scale in weeks. The same two windows are built for the second episode and for every asset. Then each asset’s during-mean is converted to standard deviations of its own weekly net issuance so assets can share an axis.`,
  });
}

export const FIGS: Record<string, () => string> = {
  mintloop: figMintLoop,
  reserve: figReserve,
  eventlog: figEventLog,
  cctp: figCctp,
  pipeline: figPipeline,
  grossnet: figGrossNet,
  gross: figGrossTable,
  chains: figChains,
  rates: figRates,
  transmission: figTransmission,
  window: figWindow,
  dumbbell: figDumbbell,
  shock: figShock,
};
