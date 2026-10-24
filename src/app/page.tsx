"use client";

import Link from "next/link";
import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { ArrowDown, ArrowRight, Gavel, Moon, ShieldCheck, Sun } from "lucide-react";
import { enterDemoAction, loginAction, signupAction, type AuthState } from "@/app/actions/auth";
import "./landing.css";

/* -------------------------------------------------------------------------- */
/* Catalogue                                                                  */
/* -------------------------------------------------------------------------- */

const CARDS = [
  { title: "Constitutional Law", src: "/juris/tunnel/constitutional-law.jpg" },
  { title: "Law Library", src: "/juris/tunnel/law-library.jpg" },
  { title: "Contract Law", src: "/juris/tunnel/contract-law.jpg" },
  { title: "Law of Torts", src: "/juris/tunnel/law-of-torts.jpg" },
  { title: "Jurisprudence", src: "/juris/tunnel/jurisprudence.jpg" },
  { title: "Moot Court", src: "/juris/tunnel/moot-court.jpg" },
  { title: "Case Briefs", src: "/juris/tunnel/case-briefs.jpg" },
  { title: "Criminal Law", src: "/juris/tunnel/criminal-law.jpg" },
  { title: "Study Notes", src: "/juris/tunnel/study-notes.jpg" },
];

/* Spiral composition: x/y offsets from the centre of the stage, plus the
   card's resting tilt. Kept as data so the tunnel stays deterministic. */
const CARD_OFFSETS = [
  { x: 189, y: 0 },
  { x: -180, y: 172 },
  { x: 26, y: -311 },
  { x: 132, y: 179 },
  { x: -267, y: -49 },
  { x: 159, y: -106 },
  { x: -63, y: 246 },
  { x: -138, y: -277 },
  { x: 203, y: 77 },
];

const CARD_TILTS = [6, -11, 16, -9, 14, -7, 12, -17, 10];

const FALLBACK_IMAGE =
  "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='520'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%23241f16'/%3E%3Cstop offset='100%25' stop-color='%23120f0b'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='520' fill='url(%23g)'/%3E%3Cg fill='none' stroke='%23d4a34c' stroke-width='1.2' stroke-opacity='0.55' stroke-linecap='round'%3E%3Cpath d='M70 120h260M70 160h180M70 200h220M70 240h160M70 280h240M70 320h190M70 360h210'/%3E%3C/g%3E%3Cg fill='%23f0c46e' font-family='Georgia, serif' text-anchor='middle'%3E%3Ctext x='200' y='410' font-size='22'%3ELAW%3C/text%3E%3Ctext x='200' y='438' font-size='14' fill-opacity='0.75'%3EStudy · Argue · Qualify%3C/text%3E%3C/g%3E%3C/svg%3E";

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = clamp((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/* -------------------------------------------------------------------------- */
/* Tunnel card                                                                */
/* -------------------------------------------------------------------------- */

function TunnelCard({
  index,
  progress,
  dim,
  scale,
}: {
  index: number;
  progress: number;
  dim: number;
  scale: number;
}) {
  const card = CARDS[index];
  const offset = CARD_OFFSETS[index];
  const [failed, setFailed] = useState(false);

  const depth = -420 - index * 180 + progress * 700;
  const z = Math.min(280, depth);
  const near = clamp((280 - z) / 220);
  const far = clamp((depth + 1000) / 420);
  const opacity = near * far * dim * 0.86;
  const rotateX = -2 + (280 - z) * 0.0062;

  return (
    <div
      className="landing-card"
      style={{
        transform: `translate3d(${offset.x * scale}px, ${offset.y * scale}px, ${z}px) rotateX(${rotateX}deg) rotateZ(${CARD_TILTS[index]}deg)`,
        opacity,
        zIndex: 9 + index,
      }}
      aria-hidden={opacity < 0.05}
    >
      <div className="landing-card-frame">
        {failed ? (
          <div className="landing-card-fallback">
            <span>LAW</span>
          </div>
        ) : (
          <img
            src={card.src}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
        <div className="landing-card-vignette" aria-hidden="true" />
        <div className="landing-card-caption">
          <span>
            {String(index + 1).padStart(2, "0")} / {String(CARDS.length).padStart(2, "0")}
          </span>
          <strong>{card.title}</strong>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Auth panel                                                                 */
/* -------------------------------------------------------------------------- */

function Feedback({ state }: { state: AuthState }) {
  if (!state.error && !state.info) return null;
  return (
    <p className="landing-feedback" data-tone={state.error ? "error" : "info"} role={state.error ? "alert" : "status"}>
      {state.error ?? state.info}
      {state.resetUrl ? (
        <>
          {" "}
          <Link href={state.resetUrl} className="link-gold">
            Open your reset link
          </Link>
        </>
      ) : null}
    </p>
  );
}

function SignInForm() {
  const [state, action, pending] = useActionState(loginAction, {} as AuthState);

  return (
    <>
      <Feedback state={state} />
      <form action={action} className="landing-form">
        <div className="landing-field">
          <label htmlFor="landing-signin-email">Email address</label>
          <input
            id="landing-signin-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@lawschool.edu"
            required
          />
        </div>
        <div className="landing-field">
          <label htmlFor="landing-signin-password">Password</label>
          <input
            id="landing-signin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            required
          />
        </div>
        <button type="submit" className="landing-submit" disabled={pending}>
          {pending ? "Opening the chambers…" : "Enter the chambers"}
          {pending ? (
            <span
              aria-hidden="true"
              style={{
                width: 13,
                height: 13,
                borderRadius: "50%",
                border: "2px solid currentColor",
                borderTopColor: "transparent",
                animation: "spin 0.7s linear infinite",
              }}
            />
          ) : (
            <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
          )}
        </button>
      </form>
    </>
  );
}

function SignUpForm() {
  const [state, action, pending] = useActionState(signupAction, {} as AuthState);
  const [password, setPassword] = useState("");

  return (
    <>
      <Feedback state={state} />
      <form action={action} className="landing-form">
        <div className="landing-field">
          <label htmlFor="landing-signup-name">Full name</label>
          <input id="landing-signup-name" name="name" autoComplete="name" placeholder="Aarav Mehta" required minLength={2} />
        </div>
        <div className="landing-field">
          <label htmlFor="landing-signup-email">Email address</label>
          <input
            id="landing-signup-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@lawschool.edu"
            required
          />
        </div>
        <div className="landing-field">
          <label htmlFor="landing-signup-password">Create password</label>
          <input
            id="landing-signup-password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="8+ characters, one number"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <input type="hidden" name="confirm" value={password} />
        <button type="submit" className="landing-submit" disabled={pending}>
          {pending ? "Preparing your chambers…" : "Join the chambers"}
          {pending ? (
            <span
              aria-hidden="true"
              style={{
                width: 13,
                height: 13,
                borderRadius: "50%",
                border: "2px solid currentColor",
                borderTopColor: "transparent",
                animation: "spin 0.7s linear infinite",
              }}
            />
          ) : (
            <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
          )}
        </button>
      </form>
    </>
  );
}

function AuthPanel({ opacity }: { opacity: number }) {
  const [tab, setTab] = useState<"signin" | "signup">("signin");

  return (
    <div
      className="landing-overlay"
      data-login-panel="true"
      aria-label="Juris sign in and account creation"
      style={{ opacity }}
    >
      <div className="landing-panel">
        <div className="landing-panel-header">
          <span className="landing-panel-gavel" aria-hidden="true">
            <Gavel size={20} strokeWidth={1.55} />
          </span>
          <div className="landing-panel-heading">
            <p className="landing-overline">JURIS · STUDY PORTAL</p>
            <p className="landing-underline">Enter your chambers.</p>
          </div>
          <ShieldCheck size={17} strokeWidth={1.45} className="landing-seal" aria-hidden="true" />
        </div>

        <div className="landing-panel-body">
          <div className="landing-tabs" role="tablist" aria-label="Choose an account action">
            <button
              type="button"
              role="tab"
              id="landing-tab-signin"
              aria-selected={tab === "signin"}
              aria-controls="landing-tabpanel"
              data-active={tab === "signin"}
              className="landing-tab"
              onClick={() => setTab("signin")}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              id="landing-tab-signup"
              aria-selected={tab === "signup"}
              aria-controls="landing-tabpanel"
              data-active={tab === "signup"}
              className="landing-tab"
              onClick={() => setTab("signup")}
            >
              Create account
            </button>
          </div>

          <div
            className="landing-tab-body"
            id="landing-tabpanel"
            role="tabpanel"
            aria-labelledby={tab === "signin" ? "landing-tab-signin" : "landing-tab-signup"}
            key={tab}
          >
            <div className="landing-intro">
              <p className="landing-kicker">{tab === "signin" ? "THE SESSION IS YOURS" : "A PLACE FOR THE PRACTICE"}</p>
              <h2>{tab === "signin" ? "Welcome back, counsel" : "Join the chambers"}</h2>
              <p>
                {tab === "signin"
                  ? "Return to the work that moves your argument forward."
                  : "Set up a study space made for the long argument."}
              </p>
            </div>

            {tab === "signin" ? <SignInForm /> : <SignUpForm />}
          </div>

          <div className="landing-demo">
            <p className="landing-separator">
              <span>OR EXPLORE THE APP</span>
            </p>
            <form action={enterDemoAction}>
              <button type="submit" className="landing-demo-button">
                <span>Enter demo workspace</span>
                <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
              </button>
            </form>
            <p className="landing-demo-caption">No sign-in required · sample data only</p>
          </div>

          <p className="landing-note">Credentials stay in this workspace on this device.</p>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function LandingPage() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stageScale, setStageScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);

  useEffect(() => setMounted(true), []);

  const isDark = mounted ? resolvedTheme !== "light" : true;

  const apply = useCallback((delta: number) => {
    setProgress((prev) => {
      const next = clamp(prev + delta);
      progressRef.current = next;
      return next;
    });
  }, []);

  /* Stage scaling keeps the spiral on-screen on narrow viewports. */
  useEffect(() => {
    const measure = () => {
      const width = window.innerWidth;
      setStageScale(Math.min(1, Math.max(0.58, width / 1050)));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  /* Wheel: one continuous journey, reversible. */
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const onWheel = (event: WheelEvent) => {
      const panel = (event.target as HTMLElement | null)?.closest?.("[data-login-panel]");
      const step = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;

      // Let the panel scroll its own overflow once the login is fully open.
      if (panel && step > 0 && progressRef.current >= 0.999) return;
      if (step < 0 && panel && (panel as HTMLElement).scrollTop > 0) return;

      event.preventDefault();
      apply(clamp(step * 0.0022, -0.18, 0.18));
    };

    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [apply]);

  /* Touch: swipe up to walk forward, swipe down to step back. */
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    let lastY = 0;

    const onTouchStart = (event: TouchEvent) => {
      lastY = event.touches[0].clientY;
    };
    const onTouchMove = (event: TouchEvent) => {
      const y = event.touches[0].clientY;
      const dy = lastY - y;
      if (Math.abs(dy) > 10) {
        apply(clamp(dy * 0.0022, -0.09, 0.09));
        lastY = y;
      }
    };

    node.addEventListener("touchstart", onTouchStart, { passive: true });
    node.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => {
      node.removeEventListener("touchstart", onTouchStart);
      node.removeEventListener("touchmove", onTouchMove);
    };
  }, [apply]);

  /* Keyboard journey. */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const forward = ["ArrowDown", "PageDown", " ", "Spacebar"];
      const backward = ["ArrowUp", "PageUp"];

      if (forward.includes(event.key)) {
        event.preventDefault();
        apply(0.09);
      } else if (backward.includes(event.key)) {
        event.preventDefault();
        apply(-0.09);
      } else if (event.key === "Home") {
        event.preventDefault();
        apply(-1);
      } else if (event.key === "End") {
        event.preventDefault();
        apply(1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [apply]);

  const heroOpacity = 1 - smoothstep(0.02, 0.34, progress);
  const cueOpacity = 1 - smoothstep(0, 0.1, progress);
  const tunnelDim = 1 - smoothstep(0.44, 0.58, progress);
  const loginOpacity = smoothstep(0.52, 0.64, progress);
  const loginVisible = loginOpacity > 0.02;

  return (
    <main
      ref={containerRef}
      className="landing"
      tabIndex={-1}
      aria-label="Juris law study portal"
    >
      <div className="landing-atmosphere" aria-hidden="true" />
      <div className="landing-horizon" aria-hidden="true" />

      <div className="landing-topbar">
        <div className="landing-brand" aria-label="Juris">
          <span className="landing-mark" aria-hidden="true">
            <span>J</span>
            <i />
          </span>
          <span className="landing-wordmark">Juris</span>
        </div>

        <div className="landing-actions">
          <button
            type="button"
            className="landing-icon-btn"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun size={17} strokeWidth={1.7} /> : <Moon size={17} strokeWidth={1.7} />}
          </button>
          <button type="button" className="landing-skip" onClick={() => apply(1)}>
            Skip to login
            <ArrowDown size={14} strokeWidth={1.9} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="landing-stage" aria-hidden="true">
        {CARDS.map((_, index) => (
          <TunnelCard key={index} index={index} progress={progress} dim={tunnelDim} scale={stageScale} />
        ))}
      </div>

      <section className="landing-hero" style={{ opacity: heroOpacity }} aria-hidden={heroOpacity < 0.05}>
        <span className="landing-orbit" aria-hidden="true">
          <Gavel size={26} strokeWidth={1.5} />
        </span>
        <p className="landing-eyebrow">Study · Argue · Qualify</p>
        <h1 className="landing-title">
          <span>ENTER THE</span>
          <span>CHAMBERS.</span>
        </h1>
        <p className="landing-description">Scroll or swipe to walk through the corridor to your law school.</p>
      </section>

      <div className="landing-cue" style={{ opacity: cueOpacity }} aria-hidden={cueOpacity < 0.05}>
        <span className="landing-cue-line" />
        <span>Scroll to enter</span>
        <ArrowDown size={14} strokeWidth={2} className="landing-cue-arrow" aria-hidden="true" />
      </div>

      {loginVisible ? <AuthPanel opacity={loginOpacity} /> : null}

      <div className="landing-rail" aria-hidden="true">
        <span style={{ transform: `scaleX(${progress})` }} />
      </div>
    </main>
  );
}
