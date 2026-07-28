import { Link } from "react-router-dom";
import { AppHeader } from "./AppHeader";
import { AppFooter } from "./AppFooter";
import "./LandingPage.css";

/* Contrast maths for the self-audit band.
   Once you confirm the relative path, replace with:
     import { contrastRatio } from "../utils/contrast";
   and delete these two functions. */

function linearise(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function ratio(a: string, b: string): number {
  const toL = (hex: string) => {
    const h = hex.replace("#", "");
    return (
      0.2126 * linearise(parseInt(h.slice(0, 2), 16)) +
      0.7152 * linearise(parseInt(h.slice(2, 4), 16)) +
      0.0722 * linearise(parseInt(h.slice(4, 6), 16))
    );
  };
  const l1 = toL(a);
  const l2 = toL(b);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

const AUDIT_ROWS = [
  { label: "Body text", fg: "#0A0A0A", bg: "#FFFFFF", needs: 4.5 },
  { label: "Secondary text", fg: "#6B6B6B", bg: "#FFFFFF", needs: 4.5 },
  { label: "Verdict green", fg: "#067647", bg: "#FFFFFF", needs: 4.5 },
];

const STEPS = [
  {
    idx: "01",
    title: "Paste your tokens",
    body: "JSON, CSS custom properties, or a bare hex list. Nested or flat.",
    img: "/step-1-input.png",
    alt: "The paste screen with a JSON token set in the input field",
  },
  {
    idx: "02",
    title: "Confirm the roles",
    body: "Text and background are inferred from names and luminance. Correct anything it gets wrong.",
    img: "/step-2-roles.png",
    alt: "The role review table showing tokens tagged as text or background",
  },
  {
    idx: "03",
    title: "Read the results",
    body: "Every failing pair, worst first, with a corrected hex that keeps your hue.",
    img: "/step-3-results.png",
    alt: "The results table showing contrast ratios and verdicts for each pair",
  },
];

export default function LandingPage() {
  return (
    <>
      <header className="bg-card border-b border-border">
        <AppHeader showTryIt />
      </header>

      <main className="lp">
        {/* ------------------------------------------------------ HERO */}
        <section className="lp-band lp-center">
          <p className="lp-label">[ wcag 2.x · design systems ]</p>
          <h1 className="lp-display">
            Test every colour pair in your system <em>at once</em>.
          </h1>
          <p className="lp-lead">
            Not one at a time, after the build. Paste your tokens and see every
            failing pair, with a correction for each. Nothing leaves your browser.
          </p>

          <div className="lp-actions">
            <Link className="lp-btn lp-btn--solid" to="/audit">
              Try it
            </Link>
            <a className="lp-btn lp-btn--line" href="#how">
              See how it works
            </a>
          </div>

          <div className="lp-screen lp-marked">
            <span className="lp-tick lp-tick--bl" />
            <span className="lp-tick lp-tick--br" />
            <div className="lp-screen__bar">
              <span className="lp-screen__dot" />
              <span className="lp-screen__dot" />
              <span className="lp-screen__dot" />
              <span className="lp-screen__url">token-contrast-auditor.app</span>
            </div>
            <video
              className="lp-screen__video"
              src="/demo.mp4"
              autoPlay
              loop
              muted
              playsInline
              aria-label="Demo of the tool auditing a design system token set"
            />
          </div>
        </section>

        {/* --------------------------------------------------- PROBLEM */}
        <section className="lp-band lp-center">
          <p className="lp-label">[ the problem ]</p>
          <h2 className="lp-h2">There is no such thing as an accessible colour.</h2>
          <p className="lp-lead">
            Only accessible pairs. And most systems have hundreds nobody has ever
            checked.
          </p>

          <div className="lp-cells lp-cells--3">
            <div className="lp-cell">
              <span className="lp-stat">40</span>
              <span className="lp-stat__unit">Tokens</span>
              <p className="lp-body">In a typical mid-size design system.</p>
            </div>
            <div className="lp-cell">
              <span className="lp-stat">780</span>
              <span className="lp-stat__unit">Pairs to check</span>
              <p className="lp-body">Once you exclude combinations nobody would ship.</p>
            </div>
            <div className="lp-cell">
              <span className="lp-stat">3s</span>
              <span className="lp-stat__unit">To check them all</span>
              <p className="lp-body">What this tool takes, running in your browser.</p>
            </div>
          </div>
        </section>

        {/* ----------------------------------------------- HOW IT WORKS */}
        <section className="lp-band lp-center" id="how">
          <p className="lp-label">[ how it works ]</p>
          <h2 className="lp-h2">Three steps. About thirty seconds.</h2>
          <p className="lp-lead">No account, no setup, no schema to conform to.</p>

          <div className="lp-cells lp-cells--3">
            {STEPS.map((s) => (
              <div className="lp-cell" key={s.idx}>
                <span className="lp-idx">{s.idx}</span>
                <h3 className="lp-h3">{s.title}</h3>
                <p className="lp-body">{s.body}</p>
                <img className="lp-shot" src={s.img} alt={s.alt} />
              </div>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------ DIFFERENCE */}
        <section className="lp-band lp-center">
          <p className="lp-label">[ the difference ]</p>
          <h2 className="lp-h2">What a two colour checker misses.</h2>
          <p className="lp-lead">
            Most tools answer one question. This one answers all of them at once.
          </p>

          <div className="lp-cells lp-cells--2">
            <div className="lp-cell">
              <h3 className="lp-h3">The whole system, not one pair</h3>
              <p className="lp-body">
                Takes a full token set and tests every valid combination in a
                single pass.
              </p>
            </div>
            <div className="lp-cell">
              <h3 className="lp-h3">Four verdicts, not pass or fail</h3>
              <p className="lp-body">The middle two are where the useful answers live.</p>
              <div className="lp-verdicts">
                <span className="lp-chip lp-chip--pass"><span className="lp-chip__dot" />Pass</span>
                <span className="lp-chip lp-chip--warn"><span className="lp-chip__dot" />Large only</span>
                <span className="lp-chip lp-chip--warn"><span className="lp-chip__dot" />Near miss</span>
                <span className="lp-chip lp-chip--fail"><span className="lp-chip__dot" />Fail</span>
              </div>
            </div>
            <div className="lp-cell">
              <h3 className="lp-h3">Corrections preserve your hue</h3>
              <p className="lp-body">
                Lightness steps in OKLCH until the ratio clears. Not a random
                darker colour.
              </p>
            </div>
            <div className="lp-cell">
              <h3 className="lp-h3">Nothing leaves the browser</h3>
              <p className="lp-body">
                No server, no account, no telemetry. Paste, audit, close the tab.
              </p>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ COMPLIANCE */}
        <section className="lp-band lp-center">
          <p className="lp-label">[ compliance ]</p>
          <h2 className="lp-h2">Built for Canadian accessibility requirements.</h2>
          <p className="lp-lead">Two regimes. Both resolve to WCAG AA in practice.</p>

          <div className="lp-cells lp-cells--2">
            <div className="lp-cell">
              <p className="lp-act">Provincial</p>
              <h3 className="lp-h3">AODA</h3>
              <p className="lp-body">Accessibility for Ontarians with Disabilities Act</p>
              <ul className="lp-list">
                <li>Applies to organisations operating in Ontario</li>
                <li>Public-facing web content must meet WCAG 2.0 Level AA</li>
                <li>Non-compliance carries daily financial penalties</li>
              </ul>
            </div>
            <div className="lp-cell">
              <p className="lp-act">Federal · Bill C-81</p>
              <h3 className="lp-h3">Accessible Canada Act</h3>
              <p className="lp-body">Covering federally regulated sectors</p>
              <ul className="lp-list">
                <li>Includes banks, telecoms, and transport</li>
                <li>Targets a barrier-free Canada by 2040</li>
                <li>Enforced through the Accessibility Commissioner</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ SELF AUDIT */}
        <section className="lp-band lp-band--ink lp-center">
          <p className="lp-label">[ practising what it preaches ]</p>
          <h2 className="lp-h2">This page passes the audit it runs.</h2>
          <p className="lp-lead">
            Computed live from the colours on screen, not written into the markup.
          </p>

          <div className="lp-audit">
            {AUDIT_ROWS.map((row) => {
              const r = ratio(row.fg, row.bg);
              return (
                <div className="lp-audit__item" key={row.label}>
                  <span className="lp-audit__label">{row.label}</span>
                  <span className="lp-audit__fig">
                    {r.toFixed(1)}
                    <span className="lp-audit__unit">:1</span>
                  </span>
                  <span className="lp-audit__needs">
                    {r >= row.needs ? "Passes" : "Fails"} · needs {row.needs}:1
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* ----------------------------------------------------- CLOSE */}
        <section className="lp-band lp-band--tight lp-center">
          <h2 className="lp-h2">Run the check before you design, not after you ship.</h2>
          <div className="lp-actions">
            <Link className="lp-btn lp-btn--solid" to="/audit">
              Try it
            </Link>
          </div>
        </section>
      </main>

      <AppFooter />
    </>
  );
}
