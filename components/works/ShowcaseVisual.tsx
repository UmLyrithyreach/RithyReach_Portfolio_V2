// The figures of the work showcase. Each draws in hairline ink with the green accent; their entrance
// animations live in globals.css and start when the wrapping .sv-fig gets [data-active].
// Placeholders are hatched boxes that name the file still to come.

import { useId, type CSSProperties } from "react";
import type { ShowcaseVisual as Visual } from "@/lib/works/showcase";
import { CONTRIBUTIONS } from "@/lib/works/contributions";

const d = (i: number) => ({ "--i": i }) as CSSProperties;

export function Placeholder({ file, ratio }: { file: string; ratio?: string }) {
  return (
    <div className="sv-ph" style={ratio ? { aspectRatio: ratio } : undefined}>
      <span className="sv-ph-tag">placeholder</span>
      <span className="sv-ph-file">/image/works/{file}</span>
    </div>
  );
}

function Shot({ src, url, alt }: { src: string; url: string; alt: string }) {
  return (
    <div className="sv-browser">
      <div className="sv-browser-bar">
        <i /><i /><i />
        <span>{url}</span>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element -- static webp, sized by its frame */}
      <img src={src} alt={alt} loading="lazy" decoding="async" />
    </div>
  );
}

/** "Contains 101": the tape is read left to right and the states light in step. */
function Dfa() {
  const states = [
    { id: "q0", x: 90 },
    { id: "q1", x: 240 },
    { id: "q2", x: 390 },
    { id: "q3", x: 540 },
  ];
  const tape = ["1", "1", "0", "1"];
  // Which state each tape symbol lands in, in order.
  const lit = [1, 1, 2, 3];
  const arrow = `sv-arrow-${useId().replace(/:/g, "")}`;
  const end = `url(#${arrow})`;
  return (
    <svg viewBox="0 0 640 400" className="sv-svg" role="img" aria-label="A four-state machine accepting strings that contain 101, reading the input 1101.">
      <g className="sv-tape">
        {tape.map((s, i) => (
          <g key={i} style={d(i)} className="sv-tape-cell">
            <rect x={232 + i * 44} y={44} width={40} height={40} />
            <text x={252 + i * 44} y={70}>{s}</text>
          </g>
        ))}
        <text x={320} y={112} className="sv-cap">input</text>
      </g>
      <g className="sv-edges">
        <path className="sv-draw" pathLength={1} d="M 118 230 L 212 230" markerEnd={end} />
        <path className="sv-draw" pathLength={1} d="M 268 230 L 362 230" markerEnd={end} />
        <path className="sv-draw" pathLength={1} d="M 418 230 L 506 230" markerEnd={end} />
        <path className="sv-draw" pathLength={1} d="M 380 258 C 330 340, 150 340, 100 258" markerEnd={end} />
        <path className="sv-draw" pathLength={1} d="M 76 204 C 60 150, 120 150, 104 204" markerEnd={end} />
        <path className="sv-draw" pathLength={1} d="M 226 204 C 210 150, 270 150, 254 204" markerEnd={end} />
        <path className="sv-draw" pathLength={1} d="M 526 204 C 510 150, 570 150, 554 204" markerEnd={end} />
        <text x={165} y={220}>1</text>
        <text x={315} y={220}>0</text>
        <text x={462} y={220}>1</text>
        <text x={240} y={330}>0</text>
        <text x={90} y={150}>0</text>
        <text x={240} y={150}>1</text>
        <text x={540} y={150}>0,1</text>
        <path d="M 20 230 L 58 230" className="sv-start" markerEnd={end} />
      </g>
      {states.map((s, i) => (
        <g
          key={s.id}
          className="sv-state"
          data-accept={i === 3 || undefined}
          style={{ "--lit": lit.indexOf(i) === -1 ? 0 : lit.indexOf(i) + 1 } as CSSProperties}
        >
          <circle cx={s.x} cy={230} r={28} />
          {i === 3 && <circle cx={s.x} cy={230} r={22} className="sv-accept-ring" />}
          <text x={s.x} y={236}>{s.id}</text>
        </g>
      ))}
      <text x={540} y={300} className="sv-cap sv-accept-label">accepted</text>
      <defs>
        <marker id={arrow} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
        </marker>
      </defs>
    </svg>
  );
}

/** The manager fans out, each subagent's gates come back GO or REDO, then the work merges. */
function Agents() {
  const kids = [
    { x: 40, role: "explore", model: "fast model", verdict: "go" },
    { x: 240, role: "implement", model: "your pick", verdict: "redo" },
    { x: 440, role: "review", model: "strong model", verdict: "go" },
  ];
  return (
    <svg viewBox="0 0 640 400" className="sv-svg" role="img" aria-label="A manager model fans a task out to explore, implement and review subagents, checks each, and merges the approved work.">
      <g className="sv-node sv-node-main" style={d(0)}>
        <rect x={210} y={24} width={220} height={58} rx={4} />
        <text x={320} y={50}>main model</text>
        <text x={320} y={68} className="sv-cap">manager · re-runs every gate</text>
      </g>
      {kids.map((k, i) => (
        <g key={k.role}>
          <path className="sv-draw" pathLength={1} style={d(i + 1)} d={`M 320 82 C 320 120, ${k.x + 80} 110, ${k.x + 80} 150`} />
          <g className="sv-node" style={d(i + 2)}>
            <rect x={k.x} y={150} width={160} height={58} rx={4} />
            <text x={k.x + 80} y={176}>{k.role}</text>
            <text x={k.x + 80} y={194} className="sv-cap">{k.model}</text>
          </g>
          <path className="sv-draw" pathLength={1} style={d(i + 4)} d={`M ${k.x + 80} 208 L ${k.x + 80} 244`} />
          <g className="sv-verdict" data-verdict={k.verdict} style={d(i + 5)}>
            <rect x={k.x + 44} y={244} width={72} height={26} rx={13} />
            <text x={k.x + 80} y={262}>{k.verdict === "go" ? "GO" : "REDO ↺"}</text>
          </g>
          <path className="sv-draw" pathLength={1} style={d(i + 7)} d={`M ${k.x + 80} 270 C ${k.x + 80} 310, 320 300, 320 330`} />
        </g>
      ))}
      <g className="sv-node sv-node-done" style={d(9)}>
        <rect x={250} y={330} width={140} height={44} rx={4} />
        <text x={320} y={357}>merged ✓</text>
      </g>
    </svg>
  );
}

function Terminal() {
  const lines: { t: string; kind: "cmd" | "out" | "ok" }[] = [
    { t: "$ node scripts/clairvoyance.mjs windows", kind: "cmd" },
    { t: "  1  Google Docs — Untitled document", kind: "out" },
    { t: "  2  Visual Studio Code", kind: "out" },
    { t: "  3  Brave — localhost:3000", kind: "out" },
    { t: '$ node scripts/clairvoyance.mjs shot -w "Google Docs"', kind: "cmd" },
    { t: "  → screenshot of window 1 saved", kind: "ok" },
    { t: '$ node scripts/clairvoyance.mjs click 420 300 -w "Google Docs"', kind: "cmd" },
    { t: "  → click sent to window 1", kind: "ok" },
  ];
  return (
    <div className="sv-term" role="img" aria-label="Terminal: Clairvoyance lists open windows, screenshots Google Docs and clicks inside it.">
      <div className="sv-term-bar"><i /><i /><i /><span>zsh — clairvoyance</span></div>
      <div className="sv-term-body">
        {lines.map((l, i) => (
          <p key={i} className="sv-term-line" data-kind={l.kind} style={d(i)}>{l.t}</p>
        ))}
        <p className="sv-term-line" data-kind="cmd" style={d(lines.length)}>$ <span className="sv-caret" /></p>
      </div>
    </div>
  );
}

function Pipeline({ placeholder }: { placeholder: string }) {
  const agents = ["script", "image", "voice", "vision", "monitor"];
  return (
    <div className="sv-pipe">
      <div className="sv-pipe-row" role="img" aria-label="Pipeline: a prompt passes through script, image, voice, vision and monitor agents and comes out as an episode.">
        <span className="sv-pipe-end">prompt</span>
        {agents.map((a, i) => (
          <span key={a} className="sv-pipe-node" style={d(i)}>
            <b>{String(i + 1).padStart(2, "0")}</b>{a}
          </span>
        ))}
        <span className="sv-pipe-end sv-pipe-out">episode.mp4</span>
        <span className="sv-pipe-line" aria-hidden="true" />
      </div>
      <Placeholder file={placeholder} ratio="16 / 6" />
    </div>
  );
}

function Vault() {
  return (
    <div className="sv-vault" role="img" aria-label="A pasted link is classified into the vault's category tree under design, motion, with tags and a summary.">
      <div className="sv-vault-link">
        <span className="sv-cap">pasted</span>
        <span>awwwards.com/sites/adaline</span>
      </div>
      <ul className="sv-tree">
        <li style={d(0)}>vault
          <ul>
            <li style={d(1)}>dev
              <ul><li style={d(2)}>agents</li><li style={d(3)}>next.js</li></ul>
            </li>
            <li style={d(4)}>design
              <ul>
                <li style={d(5)}>type</li>
                <li style={d(6)}>motion
                  <ul><li style={d(7)} className="sv-tree-new">adaline — scroll-pinned features</li></ul>
                </li>
              </ul>
            </li>
          </ul>
        </li>
      </ul>
      <div className="sv-vault-card">
        <div className="sv-tags"><span>#scroll</span><span>#pinned</span><span>#reference</span></div>
        <p>Pinned feature section; tabs advance as you scroll. Saved under design / motion.</p>
      </div>
    </div>
  );
}

function Phone({ file, tilt }: { file: string; tilt?: number }) {
  return (
    <div className="sv-phone" style={{ "--tilt": `${tilt ?? 0}deg` } as CSSProperties}>
      <span className="sv-phone-notch" aria-hidden="true" />
      <Placeholder file={file} />
    </div>
  );
}

function Ci() {
  const steps = [
    "Check out repository",
    "Set up Node.js 24",
    "Enable Corepack",
    "Install dependencies",
    "Run ESLint",
    "Run tests",
    "Generate code coverage",
    "Upload coverage report",
  ];
  return (
    <div className="sv-panel" role="img" aria-label="GitHub Actions job: eight steps from checkout to coverage upload, all passing.">
      <div className="sv-panel-head">
        <span>CI / quality</span>
        <span className="sv-cap">on: push · pull_request · ubuntu-latest</span>
      </div>
      <ol className="sv-steps">
        {steps.map((s, i) => (
          <li key={s} style={d(i)}><span className="sv-check" aria-hidden="true" />{s}</li>
        ))}
      </ol>
      <p className="sv-panel-foot" style={d(steps.length)}>✓ all checks passed</p>
    </div>
  );
}

function Tests() {
  const tests = [
    "every section renders, exactly one h1",
    "each nav link scrolls to its section",
    "skills list shows all 11 technologies",
    "project cards link to live and code",
    "contact links open in a new tab",
  ];
  return (
    <div className="sv-term" role="img" aria-label="Playwright run: six end-to-end tests of this portfolio, all passed.">
      <div className="sv-term-bar"><i /><i /><i /><span>npx playwright test</span></div>
      <div className="sv-term-body">
        <p className="sv-term-line" data-kind="out" style={d(0)}>Running {tests.length} tests using 1 worker</p>
        {tests.map((t, i) => (
          <p key={t} className="sv-term-line" data-kind="ok" style={d(i + 1)}>  ✓ {t}</p>
        ))}
        <p className="sv-term-line sv-term-sum" data-kind="ok" style={d(tests.length + 1)}>  {tests.length} passed</p>
      </div>
    </div>
  );
}

function Heatmap() {
  const weeks = CONTRIBUTIONS.weeks.split("|");
  const cell = 10;
  const gap = 2;
  const w = weeks.length * (cell + gap);
  return (
    <div className="sv-heat">
      <svg viewBox={`0 0 ${w} ${7 * (cell + gap)}`} className="sv-heat-grid" role="img" aria-label={`GitHub contribution calendar: ${CONTRIBUTIONS.total} contributions from ${CONTRIBUTIONS.from} to ${CONTRIBUTIONS.to}.`}>
        {weeks.map((week, x) =>
          week.split("").map((level, y) => (
            <rect
              key={`${x}-${y}`}
              x={x * (cell + gap)}
              y={y * (cell + gap)}
              width={cell}
              height={cell}
              rx={2}
              data-l={level}
              style={{ "--c": x } as CSSProperties}
            />
          )),
        )}
      </svg>
      <div className="sv-heat-foot">
        <span><b>{CONTRIBUTIONS.total}</b> contributions · {CONTRIBUTIONS.from} – {CONTRIBUTIONS.to}</span>
        <span className="sv-heat-key" aria-hidden="true">
          less
          {["0", "1", "2", "3", "4"].map((l) => (
            <svg key={l} viewBox="0 0 10 10"><rect width="10" height="10" rx="2" data-l={l} /></svg>
          ))}
          more
        </span>
      </div>
    </div>
  );
}

export function ShowcaseVisual({ visual }: { visual: Visual }) {
  switch (visual.kind) {
    case "shot":
      return <Shot {...visual} />;
    case "dfa":
      return <Dfa />;
    case "agents":
      return <Agents />;
    case "terminal":
      return <Terminal />;
    case "pipeline":
      return <Pipeline placeholder={visual.placeholder} />;
    case "vault":
      return <Vault />;
    case "phones":
      return (
        <div className="sv-phones">
          <Phone file={visual.placeholders[0]} tilt={-3} />
          <Phone file={visual.placeholders[1]} tilt={4} />
        </div>
      );
    case "phone-list":
      return (
        <div className="sv-phones sv-phones-list">
          <Phone file={visual.placeholder} tilt={-2} />
          <ul className="sv-repos">
            {visual.repos.map((r, i) => (
              <li key={r} style={d(i)}><span className="sv-cap">repo</span>{r}</li>
            ))}
          </ul>
        </div>
      );
    case "ci":
      return <Ci />;
    case "tests":
      return <Tests />;
    case "heatmap":
      return <Heatmap />;
  }
}
