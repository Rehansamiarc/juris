const fs = require('fs');
const path = require('path');

const p = process.cwd();const out = path.resolve(p, 'jurid-standalone.html');
console.log('target on disk resolved to:', out);

const css = `
html,body{margin:0;padding:0;height:100%;overflow:hidden}
body{background:#f6f2ea;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
input,button{font:inherit}
.tcard,.login-card,.bg{will-change:transform}
.hero,.login,.skip,.tcard{position:fixed}
.tcard{pointer-events:none}
.login{cursor:default}
.input,btn-primary{display:block;width:100%;box-sizing:border-box}
.input{-webkit-appearance:none;appearance:none}
`;

const gavelPath =
  'm14 13-8.5 8.5M3 21h8M14.5 3.5 21 10M12 6l6 6M16.5 2.5l5 5M9.5 9.5l5 5M2.5 16.5l5 5';

const fallbackSvg =
  "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='520'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%231b2a42'/%3E%3Cstop offset='100%25' stop-color='%230c1626'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='520' fill='url(%23g)'/%3E%3Cg fill='none' stroke='%23c99a45' stroke-width='1.2' stroke-opacity='0.55' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M70 120h260M70 160h180M70 200h220M70 240h160M70 280h240M70 320h190M70 360h210'/%3E%3C/g%3E%3Cg fill='%23c99a45' fill-opacity='0.9' font-family='ui-serif, Georgia, serif' font-size='22' text-anchor='middle'%3E%3Ctext x='200' y='410'%3ELAW%3C/text%3E%3Ctext x='200' y='438' font-size='14' fill-opacity='0.75'%3EStudy · Argue · Qualify%3C/text%3E%3C/g%3E%3C/svg%3E";

const cards = [
  { title: 'Constitutional Law', src: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=70' },
  { title: 'Law Library', src: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=70' },
  { title: 'Contract Law', src: 'https://images.unsplash.com/photo-1557845278-3e4d2a681f7b?auto=format&fit=crop&w=800&q=70' },
  { title: 'Law of Torts', src: 'https://images.unsplash.com/photo-1541364983171-a8ba01e95cfc?auto=format&fit=crop&w=800&q=70' },
  { title: 'Jurisprudence', src: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=800&q=70' },
  { title: 'Moot Court', src: 'https://images.unsplash.com/photo-1589492477815-50785fe5426e?auto=format&fit=crop&w=800&q=70' },
  { title: 'Case Briefs', src: 'https://images.unsplash.com/photo-1434030216411-367b68e51863?auto=format&fit=crop&w=800&q=70' },
  { title: 'Criminal Law', src: 'https://images.unsplash.com/photo-1504630083234-14187a9df0f5?auto=format&fit=crop&w=800&q=70' },
  { title: 'Study Notes', src: 'https://images.unsplash.com/photo-1484480975461-e2ebd9d7bb99?auto=format&fit=crop&w=800&q=70' },
];

const GOLDEN_ANGLE = 137.5;

function polarToCartesian(cx, cy, radius, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

class TunnelCard {
  constructor(card, idx) {
    this.card = card;
    this.idx = idx;
    this.fallback = false;

    this.el = document.createElement('div');
    this.el.className = 'tcard inset-0 z-10 pointer-events-none will-change-transform';
    this.el.style.display = 'flex';
    this.el.style.alignItems = 'center';
    this.el.style.justifyContent = 'center';

    this.frame = document.createElement('div');
    this.frame.className = 'card-frame relative w-[200px] h-[260px] overflow-hidden rounded-2xl shadow-[0_20px_40px_-20px_rgba(0,0,0,0.6)] will-change-transform';

    this.img = document.createElement('img');
    this.img.className = 'absolute inset-0 w-full h-full object-cover';
    this.img.decoding = 'async';
    this.img.loading = 'lazy';
    this.img.alt = card.title;

    this.overlay = document.createElement('div');
    this.overlay.className = 'absolute left-3 right-3 bottom-3 rounded-lg px-3 py-2 backdrop-blur-sm';

    const t = document.createElement('p');
    t.className = 'text-xs font-semibold tracking-wide uppercase';
    t.textContent = card.title;

    this.overlay.appendChild(t);
    this.frame.appendChild(this.img);
    this.frame.appendChild(overlay);
    this.el.appendChild(frame);
  }

  update(scrollProgress, dark) {
    const angle = this.idx * GOLDEN_ANGLE;
    const radius = 170 + this.idx * 78;
    const center = polarToCartesian(0, 0, radius, angle);
    const baseDepth = this.idx / 8;
    const depthScale = 1 - baseDepth * 0.5;
    const fadeIn = Math.max(0, Math.min(1, (scrollProgress - 0.04) / 0.22));
    const fadeOut = Math.max(0, Math.min(1, (scrollProgress - 0.82) / 0.16));
    const opacity = fadeIn * (1 - fadeOut);
    const rotateY = angle * 0.45;

    this.el.style.transform =
      `translate3d(${center.x}px,${center.y}px,${baseDepth * 520}px) rotateY(${rotateY}deg)`;
    this.el.style.perspective = '1200px';
    this.el.style.opacity = String(opacity);

    this.frame.style.borderColor = dark
      ? 'rgba(244,239,229,0.45)'
      : 'rgba(22,32,47,0.22)';
    this.frame.style.borderWidth = '2px';
    this.overlay.style.backgroundColor = dark
      ? 'rgba(16,27,45,0.72)'
      : 'rgba(250,246,238,0.78)';
    this.overlay.querySelector('p').style.color = dark
      ? '#f4ecdc'
      : '#16202f';
    this.img.style.backgroundColor = dark
      ? '#101b2d'
      : '#fffdf9';

    if (!this.fallback) {
      this.img.src = this.card.src;
    }
  }
}

class HeroLayer {
  constructor() {
    this.gavelStruck = false;

    this.el = document.createElement('div');
    this.el.className = 'hero inset-0 z-20 flex items-center justify-center pointer-events-none';

    const wrap = document.createElement('div');
    wrap.className = 'text-center px-5 max-w-lg';

    this.eyebrow = document.createElement('p');
    this.eyebrow.className = 'eyebrow text-[11px] font-semibold uppercase tracking-[0.25em]';
    this.eyebrow.textContent = 'Study · Argue · Qualify';

    const head = document.createElement('h1');
    head.className = 'headline mt-6 text-[clamp(2.6rem,7vw,4.6rem)] leading-[1.02] tracking-[-0.03em] font-semibold';
    head.innerHTML =
      '<span class="block">ENTER THE</span><span class="block text-transparent bg-clip-text bg-gradient-to-r from-[var(--gold)] to-[var(--gold-bright)]">/ CHAMBERS.</span>';

    this.desc = document.createElement('p');
    this.desc.className = 'desc mt-5 text-sm leading-relaxed';
    this.desc.textContent = 'Scroll or swipe to walk through the corridor to your law school.';

    const cue = document.createElement('div');
    cue.className = 'cue mt-7 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider';
    cue.innerHTML =
      '<span class="flex items-center gap-2"><span class="relative h-8 w-8"><span class="absolute inset-0 rounded-full border border-current/30"></span><span class="absolute inset-0 animate-ping rounded-full border border-current/40"></span><span class="absolute inset-0 rounded-full border-2 border-current"></span></span>Scroll to Enter</span>';

    const gavelWrap = document.createElement('div');
    gavelWrap.className = 'gavel-wrap mt-6 mx-auto h-6 w-10 -translate-x-1/2';
    gavelWrap.style.color = 'var(--gold)';
    gavelWrap.style.transform = 'scale(0.2)';
    gavelWrap.style.opacity = '0';
    gavelWrap.style.transition =
      'transform 0.35s cubic-bezier(0.22,1,0.36,1), opacity 0.35s ease';

    this.gavel = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.gavel.setAttribute('viewBox', '0 0 24 24');
    this.gavel.setAttribute('fill', 'none');
    this.gavel.setAttribute('stroke', 'currentColor');
    this.gavel.setAttribute('stroke-width', '1.6');
    this.gavel.setAttribute('stroke-linecap', 'round');
    this.gavel.setAttribute('stroke-linejoin', 'round');
    this.gavel.setAttribute('aria-hidden', 'true');
    this.gavel.innerHTML = gavelPath;

    gavelWrap.appendChild(this.gavel);
    wrap.appendChild(this.eyebrow);
    wrap.appendChild(head);
    wrap.appendChild(this.desc);
    wrap.appendChild(cue);
    wrap.appendChild(gavelWrap);
    this.el.appendChild(wrap);

    this.gavelWrap = gavelWrap;
    this.head = head;
    this.descEl = this.desc;
    this.cue = cue;
  }

  update(scrollProgress, dark) {
    const heroOpacity = Math.max(0, Math.min(1, 1 - Math.pow(scrollProgress, 1.6)));
    this.el.style.opacity = String(heroOpacity);

    this.eyebrow.style.color = dark ? '#d5ae68' : '#a97b2f';
    this.head.style.color = dark ? '#f4ecdc' : '#16202f';
    this.head.style.fontFamily = 'Iowan Old Style, Palatino, Georgia, serif';
    this.descEl.style.color = dark ? '#c3ccda' : '#697386';
    this.cue.style.color = dark ? '#d5ae68' : '#a97b2f';

    this.cue.style.opacity = heroOpacity > 0.2 ? '1' : '0';

    if (scrollProgress < 0.08 && !this.gavelStruck) {
      this.gavelStruck = true;
      requestAnimationFrame(() => {
        this.gavelWrap.style.transform = 'scale(1) rotate(0)';
        this.gavelWrap.style.opacity = '1';
      });
    }
  }
}

class LoginCard {
  constructor(demoFn) {
    this.demoFn = demoFn;

    this.el = document.createElement('div');
    this.el.className = 'login inset-x-0 bottom-8 z-30 w-full max-w-[420px] px-5 pointer-events-auto';
    this.el.style.left = '50%';
    this.el.style.transform = 'translate(-50%,24px)';
    this.el.style.opacity = '0';
    this.el.style.transition =
      'opacity 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.6s cubic-bezier(0.22,1,0.36,1)';

    this.card = document.createElement('div');
    this.card.className = 'login-card relative rounded-2xl border bg-[var(--surface)] p-5 sm:p-6 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.55)]';

    const header = document.createElement('div');
    header.className = 'flex items-center justify-between mb-4';

    const brand = document.createElement('div');
    brand.className = 'flex items-center gap-2 text-xs font-semibold uppercase tracking-wider';
    const dot = document.createElement('span');
    dot.className = 'inline-flex h-2 w-2 rounded-full';
    dot.style.backgroundColor = 'var(--gold)';
    brand.appendChild(dot);
    const brandTxt = document.createElement('span');
    brandTxt.style.color = 'var(--ink)';
    brandTxt.textContent = 'Juris';
    brand.appendChild(brandTxt);
    header.appendChild(brand);

    this.demoBtn = document.createElement('button');
    this.demoBtn.type = 'button';
    this.demoBtn.textContent = 'Enter demo workspace';
    this.demoBtn.className =
      'text-xs font-semibold underline-offset-4 hover:text-[var(--gold-bright)] text-[var(--gold)] underline transition-colors';
    this.demoBtn.addEventListener('click', this.demoFn);
    header.appendChild(this.demoBtn);
    this.card.appendChild(header);

    this.tabsInner = document.createElement('div');
    this.tabsInner.className = 'flex';

    this.signinBtn = document.createElement('button');
    this.signinBtn.type = 'button';
    this.signinBtn.textContent = 'Sign in';
    this.signinBtn.className =
      'relative flex-1 rounded-lg py-2 text-xs font-semibold tracking-wide transition-colors text-[var(--ink)]';
    this.signinBtn.style.backgroundColor = 'var(--surface)';
    this.signinBtn.style.boxShadow = '0 1px 2px rgba(16,28,44,0.04)';

    this.signupBtn = document.createElement('button');
    this.signupBtn.type = 'button';
    this.signupBtn.textContent = 'Create account';
    this.signupBtn.className =
      'relative flex-1 rounded-lg py-2 text-xs font-semibold tracking-wide transition-colors text-[var(--muted)] hover:text-[var(--ink-soft)]';

    this.tabsInner.appendChild(this.signinBtn);
    this.tabsInner.appendChild(this.signupBtn);

    this.body = document.createElement('div');
    this.body.className = 'mt-4';

    const signinForm = document.createElement('div');
    signinForm.innerHTML =
      '<p class="text-xs text-[var(--muted)] mb-3">Already studying with Juris? Sign back in.</p><div class="space-y-3"><div><label class="label">Email</label><input type="email" class="input" placeholder="you@law-school.edu" autocomplete="email"></div><div><label class="label">Password</label><input type="password" class="input" placeholder="••••••••" autocomplete="current-password"></div><button type="button" class="btn btn-primary w-full py-2.5 text-sm">Sign in</button><p class="text-center text-[11px] text-[var(--muted)]">Don’t have an account? <button type="button" class="font-semibold text-[var(--gold)] hover:underline underline-offset-2">Create one free</button></p></div>';

    const signupForm = document.createElement('div');
    signupForm.innerHTML =
      '<p class="text-xs text-[var(--muted)] mb-3">Start a real account and bring your own cases, notes, and briefs.</p><div class="space-y-3"><div><label class="label">Name</label><input type="text" class="input" placeholder="Your name" autocomplete="name"></div><div><label class="label">Email</label><input type="email" class="input" placeholder="you@law-school.edu" autocomplete="email"></div><div><label class="label">Password</label><input type="password" class="input" placeholder="At least 8 characters" autocomplete="new-password"></div><button type="button" class="btn btn-primary w-full py-2.5 text-sm">Create account</button><p class="text-center text-[11px] text-[var(--muted)]">Already have an account? <button type="button" class="font-semibold text-[var(--gold)] hover:underline underline-offset-2">Sign in</button></p></div>';

    this.signinForm = signinForm;
    this.signupForm = signupForm;
    this.body.appendChild(signinForm);

    this.card.appendChild(this.tabsInner);
    this.card.appendChild(this.body);

    const note = document.createElement('div');
    note.className = 'mt-4 flex items-start gap-2.5 rounded-lg border p-3';
    note.style.borderColor = 'rgba(22,32,47,0.1)';
    note.style.backgroundColor = 'var(--surface-2)';
    const mark = document.createElement('span');
    mark.className = 'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold';
    mark.style.backgroundColor = 'var(--gold-soft)';
    mark.style.color = 'var(--gold)';
    mark.textContent = 'i';
    const noteTxt = document.createElement('p');
    noteTxt.className = 'text-[11.5px] leading-relaxed text-[var(--muted)]';
    noteTxt.textContent =
      'The demo workspace uses sample case briefs and notes — not your data. Sign in for your own workspace.';
    note.appendChild(mark);
    note.appendChild(noteTxt);
    this.card.appendChild(note);

    const icon = document.createElement('div');
    icon.className = 'gavel-icon absolute -right-3 top-3 rounded-full border p-1.5 shadow-sm';
    icon.style.backgroundColor = 'var(--surface)';
    icon.style.borderColor = 'rgba(22,32,47,0.1)';
    const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    iconSvg.setAttribute('viewBox', '0 0 24 24');
    iconSvg.setAttribute('fill', 'none');
    iconSvg.setAttribute('stroke', 'currentColor');
    iconSvg.setAttribute('stroke-width', '1.6');
    iconSvg.setAttribute('stroke-linecap', 'round');
    iconSvg.setAttribute('stroke-linejoin', 'round');
    iconSvg.setAttribute('aria-hidden', 'true');
    iconSvg.setAttribute('width', '14');
    iconSvg.setAttribute('height', '14');
    iconSvg.style.color = 'var(--gold)';
    iconSvg.innerHTML = gavelPath;
    icon.appendChild(iconSvg);
    this.card.appendChild(icon);

    this.el.appendChild(this.card);
  }

  bindTabs() {
    this.signinBtn.onclick = () => this.setTab('signin');
    this.signupBtn.onclick = () => this.setTab('signup');
  }

  setTab(name) {
    const isSignin = name === 'signin';
    this.signinBtn.style.cssText = isSignin
      ? 'relative flex-1 rounded-lg py-2 text-xs font-semibold tracking-wide transition-colors text-[var(--ink)];background-color:var(--surface);box-shadow:0 1px 2px rgba(16,28,44,0.04)'
      : 'relative flex-1 rounded-lg py-2 text-xs font-semibold tracking-wide transition-colors text-[var(--muted)] hover:text-[var(--ink-soft)]';
    this.signupBtn.style.cssText = isSignin
      ? 'relative flex-1 rounded-lg py-2 text-xs font-semibold tracking-wide transition-colors text-[var(--muted)] hover:text-[var(--ink-soft)]'
      : 'relative flex-1 rounded-lg py-2 text-xs font-semibold tracking-wide transition-colors text-[var(--ink)];background-color:var(--surface);box-shadow:0 1px 2px rgba(16,28,44,0.04)';

    this.body.style.opacity = '0';
    this.body.style.transform = 'translateY(4px)';
    this.body.style.transition = 'opacity 0.2s ease, transform 0.2s ease';

    requestAnimationFrame(() => {
      this.body.replaceWith(name === 'signin' ? this.signinForm : this.signupForm);
      this.body = name === 'signin' ? this.signinForm : this.signupForm;
      requestAnimationFrame(() => {
        this.body.style.opacity = '1';
        this.body.style.transform = 'translateY(0)';
      });
    });
  }

  show() {
    this.el.style.opacity = '1';
    this.el.style.transform = 'translate(-50%,0)';
  }

  render() {
    document.body.appendChild(this.el);
    this.bindTabs();
  }
}

class SkipControl {
  constructor(skipFn) {
    this.skipFn = skipFn;

    this.el = document.createElement('div');
    this.el.className = 'skip inset-0 top-5 right-5 z-30 pointer-events-auto';
    this.el.style.opacity = '0';
    this.el.style.transform = 'translateX(12px)';
    this.el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';

    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = 'Skip to login';
    b.className =
      'inline-flex items-center gap-1.5 rounded-full border bg-[var(--surface)] px-3 py-1.5 text-[11px] font-semibold tracking-wide shadow-sm transition-colors hover:border-[var(--gold)] text-[var(--ink)]';
    b.style.borderColor = 'rgba(22,32,47,0.2)';
    b.addEventListener('click', skipFn);
    this.el.appendChild(b);

    document.body.appendChild(this.el);
  }

  show() {
    this.el.style.opacity = '1';
    this.el.style.transform = 'translateX(0)';
  }

  hide() {
    this.el.style.opacity = '0';
    this.el.style.transform = 'translateX(12px)';
  }
}

class TunnelBackground {
  constructor(dark) {
    this.dark = dark;
    this.svg = null;

    this.el = document.createElement('div');
    this.el.className = 'bg inset-0 z-0 overflow-hidden';
    this.el.style.position = 'fixed';

    const grad = document.createElement('style');
    grad.textContent = `.bg{background:${dark ? 'radial-gradient(1200px 800px at 50% 50%, rgba(213,174,104,0.08), transparent 70%), #080f1c' : 'radial-gradient(1200px 800px at 50% 50%, rgba(213,174,104,0.10), transparent 70%), #f6f2ea'}}`;
    this.el.appendChild(grad);

    this.svg = buildTunnelSvg(dark);
    this.el.appendChild(this.svg);
    document.body.appendChild(this.el);
  }

  setDark(dark) {
    this.dark = dark;
    if (!this.svg) return;
    this.svg.querySelectorAll('ellipse').forEach((e) => {
      e.setAttribute(
        'stroke',
        dark ? 'rgba(244,239,229,0.08)' : 'rgba(22,32,47,0.10)',
      );
    });
  }

  render() {}
}

function buildTunnelSvg(dark) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 1200 1200');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.position = 'absolute';
  svg.style.inset = '0';
  svg.style.width = '100%';
  svg.style.height = '100%';
  svg.style.perspective = '1400px';
  svg.style.transform = 'scale(1.1)';

  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const rg = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
  rg.setAttribute('id', 'tunnelGlow');
  rg.setAttribute('cx', '50%');
  rg.setAttribute('cy', '50%');
  rg.setAttribute('r', '50%');

  const s1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  s1.setAttribute('offset', '0%');
  s1.setAttribute('stop-color', dark ? '#d5ae68' : '#a97b2f');
  s1.setAttribute('stop-opacity', '0.18');

  const s2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  s2.setAttribute('offset', '60%');
  s2.setAttribute('stop-color', dark ? '#d5ae68' : '#a97b2f');
  s2.setAttribute('stop-opacity', '0.04');

  const s3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  s3.setAttribute('offset', '100%');
  s3.setAttribute('stop-color', dark ? '#d5ae68' : '#a97b2f');
  s3.setAttribute('stop-opacity', '0');

  rg.append(s1, s2, s3);
  defs.appendChild(rg);
  svg.appendChild(defs);

  for (let i = 0; i < 9; i++) {
    const r = 120 + i * 80;
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    el.setAttribute('cx', '600');
    el.setAttribute('cy', '600');
    el.setAttribute('rx', r);
    el.setAttribute('ry', r * 0.62);
    el.setAttribute('fill', 'none');
    el.setAttribute('stroke', dark ? 'rgba(244,239,229,0.08)' : 'rgba(22,32,47,0.10)');
    el.setAttribute('stroke-width', '1.2');
    el.setAttribute('transform', 'rotate(-18 600 600)');
    svg.appendChild(el);
  }

  const spiral = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  spiral.setAttribute('d', 'M 600 600 m -120 0 a 120 74 0 1 1 240 0 a 200 124 0 1 0 -400 0 a 320 198 0 1 1 640 0 a 520 322 0 1 0 -1040 0');
  spiral.setAttribute('fill', 'none');
  spiral.setAttribute('stroke', dark ? 'rgba(213,174,104,0.25)' : 'rgba(169,123,47,0.30)');
  spiral.setAttribute('stroke-width', '1.5');
  spiral.setAttribute('stroke-dasharray', '2 6');
  svg.appendChild(spiral);

  const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  c.setAttribute('cx', '600');
  c.setAttribute('cy', '600');
  c.setAttribute('r', '180');
  c.setAttribute('fill', 'url(#tunnelGlow)');
  svg.appendChild(c);

  return svg;
}

class App {
  constructor() {
    this.root = document.getElementById('root');
    this.cards = cards.map((c, i) => new TunnelCard(c, i));
    this.hero = new HeroLayer();
    this.login = new LoginCard(() => {
      window.location.href = '/home';
    });
    this.skip = new SkipControl(() => this.skipToLogin());
    this.bg = new TunnelBackground(false);

    this.scrollProgress = 0;
    this.heroVisible = true;
    this.displayTheme = 'system';
    this.dark = false;

    this.mounted = false;
    this.ready = false;
    this.loginShown = false;
    this.skipHidden = false;

    this._wheel = null;
    this._touchStart = null;
    this._touchMove = null;
    this._touchEnd = null;
    this._key = null;
    this._themeChangeHandler = null;
    this._entryTimer = null;
  }

  skipToLogin() {
    this.scrollProgress = 0.92;
    this.heroVisible = false;
    this.update();
  }

  update() {
    const dp =
      this.displayTheme === 'dark' ||
      (this.displayTheme === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    this.dark = dp;

    for (const card of this.cards) {
      card.update(this.scrollProgress, dp);
    }
    this.hero.update(this.scrollProgress, dp);

    if (this.scrollProgress > 0.6 && !this.loginShown) {
      this.loginShown = true;
      this.login.show();
    } else if (this.scrollProgress <= 0.6 && this.loginShown) {
      this.loginShown = false;
      if (this.login.el) {
        this.login.el.style.opacity = '0';
        this.login.el.style.transform = 'translate(-50%,24px)';
      }
    }

    if (this.scrollProgress < 0.6 && !this.skipHidden) {
      this.skip.show();
    } else if (this.scrollProgress >= 0.6 && !this.skipHidden) {
      this.skipHidden = true;
      this.skip.hide();
    }

    this.bg.setDark(dp);
  }

  bindEvents() {
    this._wheel = (e) => {
      e.preventDefault();
      this.applyProgress(e.deltaY > 0 ? 0.12 : -0.12);
    };
    this._touchStart = (e) => {
      this._touchStartY = e.touches[0].clientY;
      this._touchStarted = true;
    };
    this._touchStarted = false;
    this._touchMove = (e) => {
      if (!this._touchStarted) return;
      const dy = this._touchStartY - e.touches[0].clientY;
      if (Math.abs(dy) > 8) {
        this.applyProgress(dy > 0 ? 0.08 : -0.08);
        this._touchStartY = e.touches[0].clientY;
      }
    };
    this._touchEnd = () => {
      this._touchStarted = false;
    };

    this._key = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        this.applyProgress(0.12);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        this.applyProgress(-0.12);
      }
    };

    window.addEventListener('wheel', this._wheel, { passive: false });
    this.root.addEventListener('touchstart', this._touchStart, { passive: true });
    this.root.addEventListener('touchmove', this._touchMove, { passive: true });
    this.root.addEventListener('touchend', this._touchEnd);
    window.addEventListener('keydown', this._key);
  }

  unbindEvents() {
    window.removeEventListener('wheel', this._wheel);
    if (this.root) {
      this.root.removeEventListener('touchstart', this._touchStart);
      this.root.removeEventListener('touchmove', this._touchMove);
      this.root.removeEventListener('touchend', this._touchEnd);
    }
    window.removeEventListener('keydown', this._key);
  }

  applyProgress(delta) {
    this.scrollProgress = Math.max(0, Math.min(1, this.scrollProgress + delta));
    if (this.scrollProgress > 0.08) {
      this.heroVisible = false;
    }
    this.update();
  }

  setThemeClass() {
    if (this.displayTheme === 'dark' || this.displayTheme === 'light') {
      document.documentElement.classList.toggle('dark', this.displayTheme === 'dark');
    }
    this.update();
  }

  setDarkFromSystem() {
    this.dark =
      this.displayTheme === 'dark' ||
      (this.displayTheme === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
    this.setThemeClass();
  }

  mount() {
    this.mounted = true;
    this.bindEvents();
    this.setDarkFromSystem();
    this.update();
    this._entryTimer = setTimeout(() => {
      this.ready = true;
      this.update();
    }, 80);
  }

  unmount() {
    this.unbindEvents();
    if (this._themeChangeHandler) {
      window
        .matchMedia('(prefers-color-scheme: dark)')
        .removeEventListener('change', this._themeChangeHandler);
    }
    if (this._entryTimer) clearTimeout(this._entryTimer);
  }

  render() {
    this.root.appendChild(this.bg.el);
    for (const c of this.cards) this.root.appendChild(c.el);
    this.hero.render();
    this.login.render();
    this.skip.render();
  }
}

const appCodeStart = '/* standalone preview app injected below */';
function buildFinalHtml() {
  // Collect the standalone preview application code from this generator file,
  // starting at the application section and ending before the deployment wrapper.
  const code = fs.readFileSync(__filename, 'utf8');
  const appStart = code.indexOf('/* standalone preview application code follows */');
  const deployStart = code.indexOf('const htmlPath = path.resolve(', appStart);
  function sliceAppSource(code, appStart) {
  const deployStartIdx = code.indexOf('const htmlPath = path.resolve(', appStart);
  const endHere = deployStartIdx === -1 ? code.length : deployStartIdx;
  return code.slice(appStart, endHere).trimEnd();
}
  const appSourceSlice = sliceAppSource(code, appStart);
  const appSource = appSourceSlice;
  const appScript = appSourceSlice ? [css.trim(), '/* standalone preview app injected below */', appSourceSlice].join('\n') : css.trim();
  console.log('app source slice length:', appSourceSlice.length);
  console.log('includes app classes:', appSourceSlice.includes('class TunnelCard') && appSourceSlice.includes('class App'));
  const finalHtml = [
    '<!doctype html>',
    '<html lang="en-IN">',
    '<head>',
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width,initial-scale=1" />',
    '<title>Juris — Standalone Preview</title>',
    '<style>' + css + '</style>',
    '</head>',
    '<body>',
    '<noscript>',
    '  <div style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;font-size:14px;background:#f6f2ea;color:#16202f">',
    '    Enable JavaScript to enter the Chambers.',
    '  </div>',
    '</noscript>',
    '<div id="root"></div>',
    '<script>' + appScript + '</script>',
    '</body>',
    '</html>',
  ].join('\n');
  return finalHtml;
}

const encoded = Buffer.from(buildFinalHtml(), 'utf8');
fs.writeFileSync(out, encoded);
const stat = fs.statSync(out);
console.log('wrote', out);
console.log('bytes=', stat.size);

const roundTrip = fs.readFileSync(out);
if (roundTrip.length !== encoded.length || roundTrip.compare(encoded) !== 0) {
  console.error('round-trip mismatch — file on disk does not match generated bytes');
  process.exitCode = 3;
}
console.log('exitCode=', process.exitCode);
