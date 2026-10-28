#!/usr/bin/env python3
"""Draw the Rahil Design gross-flow card from docs/img/rahil-card/spec.json (written by scripts/rahil-card.ts).

    uv run --with playwright==1.63.0 --with fonttools --with pillow --with numpy python scripts/rahil_card_render.py OUT_DIR

The card is authored at 360 CSS px and drawn at 3x, so card.png is exactly 1080x1080. It reuses the rahil-design
bundle's own measurement gate (social_bars.MEASURE: text size, overflow, token fonts and glyphs, contrast, effects),
then writes the 360px and 390px feed checks, the design_check lint and feed results, and the pixel palette audit.
The bundle lives at RAHIL_DESIGN_DIR (default /home/rahil/.t3/projects/main/.agents/skills/rahil-design).
Exit 1 if any check fails. This script never records a design-review pass: the review stays pending.
"""
import base64
import hashlib
import html
import json
import os
import subprocess
import sys
from pathlib import Path

BUNDLE = Path(os.environ.get("RAHIL_DESIGN_DIR", "/home/rahil/.t3/projects/main/.agents/skills/rahil-design"))
sys.path.insert(0, str(BUNDLE / "scripts"))
import social_bars as sb  # noqa: E402
from chart_theme import FONTS, T, VERSION  # noqa: E402

SIZE = 360            # CSS px; 3x gives the 1080px export
LABEL_PX = 20         # 20px on a 360 canvas is 18.1px inside the 326px box of a 360 feed (floor 18)
TITLE_PX = 46         # 41.7px displayed there (floor 40)
FEED_WIDTHS = (360, 390)
FEED_MARGIN = 17      # image box = feed width - 2 * 17: 326px at 360, 356px at 390
sb.SIZE, sb.LABEL_PX, sb.TITLE_PX = SIZE, LABEL_PX, TITLE_PX


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def card_html(spec):
    font = lambda n: base64.b64encode((FONTS / n).read_bytes()).decode()
    rows = []
    for row in spec["rows"]:
        cls = "bar hi" if row["highlight"] else "bar"
        rows.append(f'<div class="row"><span class="label">{html.escape(row["label"])}</span>'
                    f'<span class="track"><span class="{cls}" style="width:max(2px, calc((100% - 60px) * {row["share"]:.4f}))">'
                    f'</span><span class="value">{html.escape(row["text"])}</span></span></div>')
    return f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
@font-face{{font-family:'Rahil Display';src:url(data:font/ttf;base64,{font('Anton-Regular.ttf')})}}
@font-face{{font-family:'Rahil Plex';src:url(data:font/ttf;base64,{font('IBMPlexSans-Regular.ttf')})}}
@font-face{{font-family:'Rahil Plex';font-weight:600;src:url(data:font/ttf;base64,{font('IBMPlexSans-SemiBold.ttf')})}}
*{{box-sizing:border-box}}html,body{{margin:0}}
body{{width:{SIZE}px;height:{SIZE}px;background:{T['canvas']};color:{T['ink']};font-family:'Rahil Plex',sans-serif}}
article{{width:{SIZE}px;height:{SIZE}px;padding:19px 20px;display:grid;grid-template-rows:auto minmax(0,1fr) auto;gap:8px}}
h1{{font:{TITLE_PX}px/0.96 'Rahil Display',sans-serif;margin:0;text-transform:uppercase;overflow-wrap:anywhere}}
h1 em{{display:inline-block;font-style:normal;color:{T['accent']}}}
.figure{{background:{T['figure-surface']};color:{T['figure-ink']};border-radius:12px;padding:5px 14px;display:flex;
flex-direction:column;justify-content:center;gap:0;font-size:{LABEL_PX}px;line-height:1.0;font-variant-numeric:tabular-nums}}
.row{{display:grid;grid-template-columns:66px 1fr;align-items:center;gap:10px}}
.label{{text-align:right;white-space:nowrap}}.value{{white-space:nowrap}}
.track{{display:flex;align-items:center;gap:8px}}.bar{{display:block;height:16px;flex:none;background:{T['chart-series-3']}}}
.bar.hi{{background:{T['chart-highlight']};outline:2px solid {T['chart-series-1']};outline-offset:-2px}}
.source{{font-size:{LABEL_PX}px;line-height:1.08;color:{T['secondary']};margin:0}}
</style></head><body><article><h1>{title_html(spec)}</h1>
<div class="figure">{''.join(rows)}</div>
<p class="source">{html.escape(spec['source'])}</p></article></body></html>"""


def title_html(spec):
    """The title with the one highlighted value (USDC's share) in the accent colour."""
    hi = next(r["text"] for r in spec["rows"] if r["highlight"])
    title = html.escape(spec["title"])
    assert hi in spec["title"], "the title must name the highlighted value"
    return title.replace(html.escape(hi), f"<em>{html.escape(hi)}</em>", 1)


def feed_shot(png, width, out):
    """The finished PNG inside a feed-width page: image box = feed width - 34px, as in the 326px floor basis."""
    from playwright.sync_api import sync_playwright
    box = width - 2 * FEED_MARGIN
    page_html = (f"<!doctype html><meta charset=utf-8><style>*{{box-sizing:border-box}}html,body{{margin:0}}"
                 f"body{{width:{width}px;background:{T['border']};padding:{FEED_MARGIN}px}}"
                 f"img{{display:block;width:{box}px;height:{box}px;border-radius:12px}}</style>"
                 f"<img src='{Path(png).resolve().as_uri()}'>")
    tmp = Path(out).with_suffix(".html")
    tmp.write_text(page_html)
    with sync_playwright() as p:
        browser = p.firefox.launch(headless=True, executable_path=str(sb.FIREFOX))
        page = browser.new_page(viewport={"width": width, "height": box + 2 * FEED_MARGIN}, device_scale_factor=3)
        page.goto(tmp.resolve().as_uri())
        page.wait_for_timeout(300)
        page.screenshot(path=str(out))
        browser.close()
    tmp.unlink()
    return box


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    return r.returncode, (r.stdout + r.stderr).strip()


def main():
    out = Path(sys.argv[1])
    spec = json.loads((out / "spec.json").read_text())
    markup = card_html(spec)
    (out / "card.html").write_text(markup)
    m = sb.render(out / "card.html", out / "card.png")
    sizes = [px for _, px in m["sizes"]]
    errors = [f"overflow: {o}" for o in m["overflow"]] + [f"font {f!r} is not a token font" for f in set(m["fonts"])]
    errors += [f"no glyph for {g}; spell it out" for g in sb.missing_glyphs(m["glyphs"])] + sb.face_errors(m["faces"])
    errors += [f"text below {LABEL_PX}px"] * (min(sizes) < LABEL_PX)
    from PIL import Image
    img = Image.open(out / "card.png")
    errors += [f"card.png is {img.size}, not 1080x1080"] * (img.size != (1080, 1080))

    feeds = {}
    for w in FEED_WIDTHS:
        box = feed_shot(out / "card.png", w, out / f"feed-{w}.png")
        k = box / SIZE
        feeds[w] = {"image_box_px": box, "min_label_displayed_px": round(min(sizes) * k, 1),
                    "title_displayed_px": round(max(sizes) * k, 1), "file": f"feed-{w}.png"}

    brief = {"id": spec["id"], "title": spec["title"], "system_version": VERSION, "accents": 1,
             "accent_meaning": "title-value", "encodings": [{"mark": "bar", "baseline": 0, "scale_max": 1}],
             "sizes_checked": [f"{SIZE}x{SIZE}"], "measurement_basis": "canvas", "measured_by": "social_bars/firefox",
             "min_label_px": min(sizes), "point_px": max(sizes), "title_lines": m["title_lines"],
             "overflow": m["overflow"], "source": spec["source"], "alt": spec["alt"], "feed_checks": feeds,
             "artifacts": {n: sha(out / n) for n in ("card.html", "card.png")}}
    (out / "brief.json").write_text(json.dumps(brief, indent=2) + "\n")
    (out / "alt.txt").write_text(spec["alt"] + "\n")

    py = sys.executable
    checks = [("design_check lint", [py, str(BUNDLE / "scripts/design_check.py"), "lint", str(out / "card.html")]),
              ("design_check feed", [py, str(BUNDLE / "scripts/design_check.py"), "feed", str(out / "brief.json")]),
              ("pixel_audit", [py, str(BUNDLE / "scripts/pixel_audit.py"), str(out / "card.png")])]
    report = [f"Rahil Design {VERSION} palette and feed check for card.png",
              f"card.png sha256 {sha(out / 'card.png')}", f"size {img.size[0]}x{img.size[1]}", ""]
    for name, cmd in checks:
        code, text = run(cmd)
        report += [f"$ {name}: exit {code}", text, ""]
        errors += [f"{name} failed"] * bool(code)
    (out / "palette-check.txt").write_text("\n".join(report))
    (out / "brief.json").write_text(json.dumps({**brief, "artifacts": {n: sha(out / n) for n in ("card.html", "card.png", "feed-360.png", "feed-390.png")}}, indent=2) + "\n")
    print(f"{out}/card.png: labels {min(sizes)}px, title {max(sizes)}px, {m['title_lines']} title lines; " + ("; ".join(errors) or "ok"))
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
