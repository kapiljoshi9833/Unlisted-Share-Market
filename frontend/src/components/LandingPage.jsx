import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BRAND } from '../data/mockData';
import {
  ArrowRight,
  Building2,
  BadgeIndianRupee,
  Briefcase,
  Cpu,
  FileText,
  Layers,
  Repeat,
  ShieldCheck,
  UserPlus,
  Search,
  Gavel,
  CheckCircle2,
} from 'lucide-react';

/* ---------------- mock data (replace with real data later) ---------------- */
const COMPANIES = [
  { name: 'NovaTech AI', sector: 'Cloud & AI', price: 250.0, change: 64.2, val: '1,250' },
  { name: 'PaySphere', sector: 'Fintech', price: 412.5, change: 18.4, val: '3,840' },
  { name: 'GreenGrid Energy', sector: 'Clean energy', price: 96.8, change: -2.1, val: '910' },
  { name: 'MedLink Health', sector: 'Healthtech', price: 188.0, change: 7.9, val: '1,420' },
  { name: 'Orbital Logistics', sector: 'Supply chain', price: 540.25, change: 31.6, val: '5,200' },
  { name: 'FinVault', sector: 'Banking tech', price: 73.4, change: -0.8, val: '680' },
  { name: 'AgroSync', sector: 'Agritech', price: 129.9, change: 12.3, val: '1,050' },
  { name: 'Quanta Semi', sector: 'Semiconductors', price: 865.0, change: 42.7, val: '8,700' },
];

const ASSETS = [
  {
    icon: Building2,
    title: 'Unlisted equities',
    text: 'Buy and sell shares of private companies that are preparing for an IPO. Prices come from real bids and asks, not a fixed quote.',
  },
  {
    icon: Briefcase,
    title: 'ESOP desk',
    text: 'Employees can list vested stock options for sale. Investors get access to shares that were never open to the public.',
  },
  {
    icon: FileText,
    title: 'Debentures',
    text: 'Trade company debt instruments with a clear coupon and maturity, and see who holds what on the ledger.',
  },
];

const STEPS = [
  { icon: UserPlus, title: 'Create your account', text: 'Sign up and get a wallet and a holdings ledger in your name.' },
  { icon: Search, title: 'Pick a company', text: 'Browse pre-IPO companies with price, valuation and order book depth.' },
  { icon: Gavel, title: 'Place a bid or an ask', text: 'Set your price and quantity. Your order joins the live order book.' },
  { icon: CheckCircle2, title: 'Get matched and settled', text: 'The engine matches buyers and sellers and settles the trade at once (T+0).' },
];

const FEATURES = [
  { icon: Repeat, title: 'Continuous double auction', text: 'Buy and sell orders are matched by price, then by time, the same way major exchanges do it.' },
  { icon: Layers, title: 'Eight normalized tables', text: 'Users, companies, orders, trades, holdings, wallets, ESOP listings and debentures, linked by keys and constraints.' },
  { icon: ShieldCheck, title: 'Transparent ledger', text: 'Every trade writes to the ledger inside one transaction, so balances and holdings never drift apart.' },
  { icon: Cpu, title: 'Built for price discovery', text: 'Unlisted shares have no public price. Open order books show what buyers and sellers will actually accept.' },
];

const MARQUEE = [...COMPANIES, ...COMPANIES];

/* ---------------- small helpers ---------------- */
function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: seen ? 1 : 0,
        transform: seen ? 'none' : 'translateY(32px)',
        transition: `opacity .8s ease ${delay}ms, transform .8s cubic-bezier(.2,.7,.2,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function Heading({ title, sub }) {
  return (
    <div className="max-w-2xl">
      <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">{title}</h2>
      {sub && <p className="mt-4 text-white/55 leading-relaxed">{sub}</p>}
    </div>
  );
}

const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

/* Rotating 3D network sphere: every dot is a trader, glowing pulses are trades being matched */
function NetworkGlobe({ className = '', dim = 1 }) {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current;
    const ctx = cv.getContext('2d');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0, h = 0, raf, rotY = 0, tiltX = 0.35, tx = 0.35;
    const N = 190;
    const pts = Array.from({ length: N }, (_, i) => {
      const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), a = i * 2.399963;
      return { x: Math.cos(a) * r, y, z: Math.sin(a) * r, flash: 0 };
    });
    const links = [];
    for (let i = 0; i < N; i++)
      for (let j = i + 1; j < N; j++) {
        const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y, pts[i].z - pts[j].z);
        if (d < 0.36) links.push([i, j]);
      }
    const pulses = [];

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(cv);
    const onMove = (e) => { tx = 0.35 + (e.clientY / window.innerHeight - 0.5) * 0.5; };
    window.addEventListener('mousemove', onMove);

    const rot = (p) => {
      const cy = Math.cos(rotY), sy = Math.sin(rotY), cx = Math.cos(tiltX), sx = Math.sin(tiltX);
      const x1 = p.x * cy + p.z * sy, z1 = -p.x * sy + p.z * cy;
      return { x: x1, y: p.y * cx - z1 * sx, z: p.y * sx + z1 * cx };
    };

    const frame = () => {
      ctx.clearRect(0, 0, w, h);
      const R = Math.min(w, h) * 0.38, cx = w / 2, cy = h / 2;
      if (!reduce) rotY += 0.0028;
      tiltX += (tx - tiltX) * 0.04;
      const P = pts.map(rot);
      const proj = (q) => { const k = 1 / (1.9 - q.z * 0.5); return [cx + q.x * R * k * 1.9, cy + q.y * R * k * 1.9, k]; };

      // sphere glow
      const g = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 1.5);
      g.addColorStop(0, `rgba(74,244,163,${0.12 * dim})`); g.addColorStop(1, 'rgba(74,244,163,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

      // links
      ctx.lineWidth = 0.7;
      for (const [i, j] of links) {
        const a = P[i], b = P[j];
        const depth = (a.z + b.z) / 2;
        if (depth < -0.2) continue;
        const [x1, y1] = proj(a), [x2, y2] = proj(b);
        ctx.strokeStyle = `rgba(74,244,163,${(0.08 + depth * 0.22) * dim})`;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      }
      // nodes
      for (let i = 0; i < N; i++) {
        const q = P[i]; const [x, y, k] = proj(q);
        const front = (q.z + 1) / 2;
        const f = pts[i].flash; pts[i].flash = Math.max(0, f - 0.02);
        ctx.fillStyle = `rgba(160,255,215,${(0.2 + front * 0.8) * dim})`;
        ctx.beginPath(); ctx.arc(x, y, (0.8 + front * 1.7 + f * 3) * k * 1.3, 0, 7); ctx.fill();
        if (f > 0.05) {
          ctx.strokeStyle = `rgba(74,244,163,${f * dim})`;
          ctx.beginPath(); ctx.arc(x, y, (4 + (1 - f) * 22) * k, 0, 7); ctx.stroke();
        }
      }
      // trades
      if (!reduce && Math.random() < 0.09 && pulses.length < 14) {
        const [i, j] = links[Math.floor(Math.random() * links.length)];
        pulses.push({ i, j, t: 0, v: 0.012 + Math.random() * 0.012 });
      }
      for (let n = pulses.length - 1; n >= 0; n--) {
        const u = pulses[n]; u.t += u.v;
        if (u.t >= 1) { pts[u.j].flash = 1; pulses.splice(n, 1); continue; }
        const a = P[u.i], b = P[u.j];
        let q = { x: a.x + (b.x - a.x) * u.t, y: a.y + (b.y - a.y) * u.t, z: a.z + (b.z - a.z) * u.t };
        const m = Math.hypot(q.x, q.y, q.z) || 1; q = { x: q.x / m, y: q.y / m, z: q.z / m };
        if (q.z < -0.15) continue;
        const [x, y, k] = proj(q);
        const gg = ctx.createRadialGradient(x, y, 0, x, y, 14 * k);
        gg.addColorStop(0, `rgba(255,255,255,${0.95 * dim})`); gg.addColorStop(0.3, `rgba(74,244,163,${0.7 * dim})`); gg.addColorStop(1, 'rgba(74,244,163,0)');
        ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(x, y, 14 * k, 0, 7); ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    };
    frame();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener('mousemove', onMove); };
  }, [dim]);
  return <canvas ref={ref} className={`w-full h-full ${className}`} />;
}

/* Company chips that orbit the globe */
function OrbitChips() {
  const chips = [
    ['NovaTech AI', '+64.2%', 'top-0 left-1/2 -translate-x-1/2'],
    ['Quanta Semi', '+42.7%', 'right-0 top-1/2 -translate-y-1/2'],
    ['PaySphere', '+18.4%', 'bottom-0 left-1/2 -translate-x-1/2'],
    ['Orbital Logistics', '+31.6%', 'left-0 top-1/2 -translate-y-1/2'],
  ];
  return (
    <div className="absolute inset-[14%] pointer-events-none" style={{ animation: 'vx-spin 50s linear infinite' }}>
      <div className="absolute inset-0 rounded-full border border-dashed border-[#4AF4A3]/25" />
      {chips.map(([n, c, pos]) => (
        <div key={n} className={`absolute ${pos}`}>
          <div className="px-3 py-1.5 rounded-full border border-[#4AF4A3]/40 bg-black/70 backdrop-blur text-[11px] whitespace-nowrap shadow-[0_0_20px_rgba(74,244,163,0.25)]" style={{ animation: 'vx-spin 50s linear infinite reverse' }}>
            <span className="text-white/90 font-medium">{n}</span> <span className="text-[#4AF4A3]">{c}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* Buyers and sellers flowing into the matching engine */
function MatchViz() {
  const buyers = [[40, 60, 'Bid 249.50'], [40, 150, 'Bid 249.75'], [40, 240, 'Bid 250.00']];
  const sellers = [[360, 60, 'Ask 250.00'], [360, 150, 'Ask 250.25'], [360, 240, 'Ask 250.50']];
  const all = [...buyers.map((b) => [...b, 'L']), ...sellers.map((b) => [...b, 'R'])];
  return (
    <svg viewBox="0 0 400 300" className="absolute inset-0 w-full h-full">
      <defs>
        <radialGradient id="vx-m-glow"><stop offset="0" stopColor="#4AF4A3" stopOpacity=".55" /><stop offset="1" stopColor="#4AF4A3" stopOpacity="0" /></radialGradient>
      </defs>
      <circle cx="200" cy="150" r="110" fill="url(#vx-m-glow)" style={{ animation: 'vx-node 3s ease-in-out infinite', transformOrigin: '200px 150px' }} />
      {all.map(([x, y, label, side], i) => {
        const path = `M${x},${y} Q${side === 'L' ? x + 90 : x - 90},${y} 200,150`;
        return (
          <g key={i}>
            <path d={path} stroke="#4AF4A3" strokeOpacity=".25" strokeDasharray="3 4" fill="none" />
            <circle r="3.5" fill="#fff"><animateMotion dur="2.6s" begin={`${i * 0.4}s`} repeatCount="indefinite" path={path} /></circle>
            <circle cx={x} cy={y} r="5" fill={side === 'L' ? '#4AF4A3' : '#FF6B6B'} />
            <text x={x} y={y - 12} fontSize="9" fill="#ffffff99" textAnchor={side === 'L' ? 'start' : 'end'} dx={side === 'L' ? -8 : 8}>{label}</text>
          </g>
        );
      })}
      <g style={{ transformOrigin: '200px 150px', animation: 'vx-spin 14s linear infinite' }}>
        <path d="M200 118 L228 134 V166 L200 182 L172 166 V134 Z" fill="#040706" stroke="#4AF4A3" strokeWidth="1.5" />
      </g>
      <text x="200" y="148" textAnchor="middle" fontSize="10" fontWeight="700" fill="#4AF4A3">MATCH</text>
      <text x="200" y="162" textAnchor="middle" fontSize="9" fill="#fff">₹250.00</text>
    </svg>
  );
}

/* Logo: hexagon + "V" that draws itself, with a rising node */
function Logo() {
  return (
    <div className="flex items-center gap-3 group">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true" className="drop-shadow-[0_0_12px_rgba(74,244,163,0.45)]">
        <defs>
          <linearGradient id="vx-logo-g" x1="4" y1="2" x2="36" y2="38" gradientUnits="userSpaceOnUse">
            <stop stopColor="#7CFFC4" />
            <stop offset="1" stopColor="#1D8F5A" />
          </linearGradient>
        </defs>
        <path d="M20 2 L35 11 V29 L20 38 L5 29 V11 Z" stroke="url(#vx-logo-g)" strokeWidth="1.6" fill="rgba(74,244,163,0.06)" className="transition-transform duration-700 group-hover:rotate-[60deg] origin-center" style={{ transformBox: 'fill-box' }} />
        <path d="M12 14 L20 28 L28 14" stroke="url(#vx-logo-g)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" pathLength="1" style={{ strokeDasharray: 1, animation: 'vx-draw 1.4s ease-out .2s both' }} />
        <circle cx="28" cy="14" r="2.4" fill="#4AF4A3" style={{ animation: 'vx-node 2.4s ease-in-out infinite' }} />
      </svg>
      <div className="leading-none">
        <div className="flex items-baseline text-[17px] font-extrabold tracking-[0.2em]">
          <span>VALENCE</span>
          <span className="ml-1 text-[22px] bg-gradient-to-br from-[#7CFFC4] to-[#1D8F5A] bg-clip-text text-transparent">X</span>
        </div>
        <div className="mt-1 text-[9px] tracking-[0.32em] text-white/40">PRIVATE MARKETS</div>
      </div>
    </div>
  );
}

/* Tagline word that swaps every couple of seconds */
function RotatingWord({ words }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % words.length), 2400);
    return () => clearInterval(id);
  }, [words.length]);
  return (
    <span className="relative inline-block text-[#4AF4A3]">
      <span key={i} className="inline-block" style={{ animation: 'vx-word .7s cubic-bezier(.2,.7,.2,1) both' }}>
        {words[i]}
      </span>
      <span key={'u' + i} className="absolute left-0 -bottom-1 h-[3px] w-full rounded bg-gradient-to-r from-[#4AF4A3] to-transparent origin-left" style={{ animation: 'vx-underline 2.4s ease-out both' }} />
    </span>
  );
}

/* ---------------- page ---------------- */
export default function LandingPage({ onOpenAuth, onExploreAsGuest }) {
  const tape = useMemo(() => [...COMPANIES, ...COMPANIES], []);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  const links = [
    ['about', 'About'],
    ['assets', 'What you can trade'],
    ['how', 'How it works'],
    ['companies', 'Companies'],
  ];

  return (
    <div className="relative min-h-screen bg-[#040706] text-white font-sans selection:bg-[#1D5E3C] overflow-x-hidden">
      <style>{`
        html { scroll-behavior: smooth; }
        @keyframes vx-kenburns { from { transform: scale(1.05);} to { transform: scale(1.2) translate(-1.5%,-1%);} }
        @keyframes vx-marquee { from { transform: translateX(0);} to { transform: translateX(-50%);} }
        @keyframes vx-marquee-rev { from { transform: translateX(-50%);} to { transform: translateX(0);} }
        @keyframes vx-rise { from { opacity:0; transform: translateY(28px); filter: blur(6px);} to { opacity:1; transform:none; filter: blur(0);} }
        @keyframes vx-shine { from { background-position: 200% 0;} to { background-position: -200% 0;} }
        @keyframes vx-ring { 0% { transform: scale(.8); opacity:.7;} 100% { transform: scale(2.2); opacity:0;} }
        @keyframes vx-scroll { 0% { transform: translateY(0); opacity:0;} 30% { opacity:1;} 100% { transform: translateY(14px); opacity:0;} }
        @keyframes vx-drift { 0%,100% { transform: translate(0,0);} 50% { transform: translate(40px,-30px);} }
        @keyframes vx-draw { from { stroke-dashoffset: 1;} to { stroke-dashoffset: 0;} }
        @keyframes vx-node { 0%,100% { opacity:1; transform: scale(1);} 50% { opacity:.4; transform: scale(1.5);} }
        @keyframes vx-word { from { opacity:0; transform: translateY(60%) rotateX(-60deg);} to { opacity:1; transform:none;} }
        @keyframes vx-underline { 0% { transform: scaleX(0);} 25%,100% { transform: scaleX(1);} }
        @keyframes vx-spin { to { transform: rotate(360deg);} }
        .vx-rise { opacity:0; animation: vx-rise .9s cubic-bezier(.2,.7,.2,1) forwards; }
        .vx-shine { background: linear-gradient(100deg,#fff 30%,#4AF4A3 45%,#fff 60%); background-size:200% 100%;
          -webkit-background-clip:text; background-clip:text; color:transparent; animation: vx-shine 6s linear infinite; }
        .vx-pause:hover { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration:.001ms !important; animation-iteration-count:1 !important; transition-duration:.001ms !important; }
        }
      `}</style>

      {/* ===== STICKY HEADER: nav + moving ticker ===== */}
      <div className="fixed top-0 inset-x-0 z-50">
        <header
          className={`h-[68px] px-6 sm:px-12 flex items-center justify-between border-b transition-colors duration-300 backdrop-blur-xl ${
            scrolled ? 'bg-[#040706]/90 border-white/10' : 'bg-[#040706]/40 border-white/[0.06]'
          }`}
        >
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label={`${BRAND.name} home`}>
            <Logo />
          </button>

          <nav className="hidden lg:flex items-center gap-1 text-sm text-white/60">
            {links.map(([id, label]) => (
              <button key={id} onClick={() => go(id)} className="px-4 py-2 rounded-full hover:text-white hover:bg-white/5 transition">
                {label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button onClick={() => onOpenAuth('signin')} className="px-4 py-2 text-sm text-white/70 hover:text-white transition">
              Sign in
            </button>
            <button
              onClick={() => onOpenAuth('signup')}
              className="px-5 py-2 text-sm font-semibold rounded-full bg-[#4AF4A3] text-black hover:bg-white hover:shadow-[0_0_30px_rgba(74,244,163,0.45)] transition duration-300"
            >
              Sign up
            </button>
          </div>
        </header>

        {/* continuous moving ticker */}
        <div className="border-b border-white/[0.06] bg-black/60 backdrop-blur overflow-hidden">
          <div className="vx-pause flex w-max py-2 text-xs" style={{ animation: 'vx-marquee 45s linear infinite' }}>
            {tape.map((t, i) => (
              <div key={i} className="flex items-center gap-2 px-6 border-r border-white/[0.06] tabular-nums">
                <span className="text-white/70 font-medium">{t.name}</span>
                <span className="text-white/90">₹{t.price.toFixed(2)}</span>
                <span className={t.change >= 0 ? 'text-[#4AF4A3]' : 'text-[#FF6B6B]'}>
                  {t.change >= 0 ? '▲' : '▼'} {Math.abs(t.change)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== HERO ===== */}
      <section className="relative min-h-screen flex flex-col justify-center overflow-hidden">
        <div className="absolute -right-[18%] lg:-right-[2%] top-1/2 -translate-y-1/2 w-[900px] h-[900px] max-w-none opacity-60 lg:opacity-100">
          <NetworkGlobe />
          <OrbitChips />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#040706] via-[#040706]/55 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#040706] via-transparent to-[#040706]/60" />
        <div
          className="absolute -right-32 top-1/4 w-[640px] h-[640px] rounded-full bg-[#1D5E3C]/40 blur-[150px]"
          style={{ animation: 'vx-drift 14s ease-in-out infinite' }}
        />

        <div className="relative z-10 max-w-7xl mx-auto w-full px-6 sm:px-12 pt-40 pb-32">
          <div
            className="vx-rise inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#4AF4A3]/30 bg-[#4AF4A3]/10 text-xs text-[#4AF4A3]"
            style={{ animationDelay: '.1s' }}
          >
            <span className="relative flex w-2 h-2">
              <span className="absolute inset-0 rounded-full bg-[#4AF4A3]" style={{ animation: 'vx-ring 1.8s ease-out infinite' }} />
              <span className="relative w-2 h-2 rounded-full bg-[#4AF4A3]" />
            </span>
            Pre-IPO and unlisted securities marketplace
          </div>

          <h1
            className="vx-rise mt-6 max-w-4xl text-5xl sm:text-6xl xl:text-7xl font-extrabold leading-[1.05] tracking-tight"
            style={{ animationDelay: '.25s' }}
          >
            Own a piece of tomorrow's
            <br />
            listed giants, while they are
            <br />
            <RotatingWord words={['private.', 'unlisted.', 'pre-IPO.', 'still early.']} />
          </h1>

          <p className="vx-rise mt-6 max-w-xl text-base sm:text-lg text-white/65 leading-relaxed" style={{ animationDelay: '.45s' }}>
            {BRAND.name} lets investors and employees trade shares, ESOPs and debentures of unlisted companies through an
            open order book with instant settlement.
          </p>

          <div className="vx-rise mt-9 flex flex-wrap items-center gap-3" style={{ animationDelay: '.6s' }}>
            <button
              onClick={() => onOpenAuth('signup')}
              className="group px-7 py-3.5 rounded-full bg-[#4AF4A3] text-black font-semibold text-sm flex items-center gap-2 hover:bg-white hover:shadow-[0_0_40px_rgba(74,244,163,0.45)] transition duration-300"
            >
              Create free account
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => onOpenAuth('signin')}
              className="px-7 py-3.5 rounded-full border border-white/20 text-sm hover:bg-white/10 transition"
            >
              Sign in
            </button>
            <button onClick={onExploreAsGuest} className="px-4 py-3.5 text-sm text-white/60 hover:text-white transition">
              Browse as guest
            </button>
          </div>
        </div>

        {/* company names strip, moving the opposite way */}
        <div className="absolute bottom-0 inset-x-0 z-10 border-t border-white/10 bg-black/50 backdrop-blur">
          <div className="max-w-7xl mx-auto px-6 sm:px-12 pt-3 text-[11px] text-white/40">Pre-IPO companies on the platform</div>
          <div className="overflow-hidden py-3">
            <div className="vx-pause flex w-max items-center gap-10 text-lg font-semibold text-white/70" style={{ animation: 'vx-marquee-rev 50s linear infinite' }}>
              {MARQUEE.map((c, i) => (
                <span key={i} className="flex items-center gap-10 whitespace-nowrap">
                  {c.name}
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4AF4A3]/60" />
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* scroll cue */}
        <button
          onClick={() => go('about')}
          aria-label="Scroll to learn more"
          className="hidden sm:flex absolute bottom-28 left-1/2 -translate-x-1/2 z-10 w-6 h-10 rounded-full border border-white/30 justify-center pt-2"
        >
          <span className="w-1 h-2 rounded-full bg-[#4AF4A3]" style={{ animation: 'vx-scroll 1.8s ease-in-out infinite' }} />
        </button>
      </section>

      {/* ===== ABOUT ===== */}
      <section id="about" className="relative py-28 px-6 sm:px-12 scroll-mt-24">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <Reveal>
            <Heading
              title="What is a pre-IPO market?"
              sub="Before a company lists on the stock exchange, its shares are held privately by founders, employees and early investors. Those shares are hard to buy or sell, and nobody knows their fair price."
            />
            <p className="mt-4 text-white/55 leading-relaxed max-w-2xl">
              {BRAND.name} fixes both problems. Anyone can place a bid or an ask on a company's unlisted shares. When a
              buyer and a seller agree on a price, the trade is matched and recorded on the ledger straight away.
            </p>
            <div className="mt-8 flex gap-3">
              <button onClick={() => onOpenAuth('signup')} className="px-6 py-3 rounded-full bg-white text-black text-sm font-semibold hover:bg-[#4AF4A3] transition">
                Get started
              </button>
              <button onClick={onExploreAsGuest} className="px-6 py-3 rounded-full border border-white/15 text-sm hover:bg-white/5 transition">
                See the market
              </button>
            </div>
          </Reveal>

          <Reveal delay={150}>
            <div className="relative rounded-2xl overflow-hidden border border-white/10 h-[380px] bg-[#070C0A]">
              <MatchViz />
              <div className="absolute inset-0 bg-gradient-to-t from-[#040706] via-[#040706]/30 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 grid grid-cols-3 divide-x divide-white/10 border-t border-white/10 bg-black/50 backdrop-blur">
                {[
                  ['8', 'database tables'],
                  ['T+0', 'settlement'],
                  ['3', 'asset classes'],
                ].map(([n, l]) => (
                  <div key={l} className="p-5">
                    <div className="text-2xl font-semibold text-[#4AF4A3]">{n}</div>
                    <div className="text-xs text-white/50">{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== ASSET CLASSES ===== */}
      <section id="assets" className="relative py-28 px-6 sm:px-12 bg-white/[0.02] border-y border-white/[0.06] scroll-mt-24">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <Heading title="What you can trade" sub="Three kinds of unlisted securities, all in one terminal." />
          </Reveal>
          <div className="mt-12 grid md:grid-cols-3 gap-5">
            {ASSETS.map((a, i) => (
              <Reveal key={a.title} delay={i * 120}>
                <div className="group h-full p-7 rounded-2xl border border-white/10 bg-[#0A0F0D] hover:border-[#4AF4A3]/50 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(29,94,60,0.35)] transition duration-300">
                  <div className="w-12 h-12 rounded-xl bg-[#4AF4A3]/10 text-[#4AF4A3] flex items-center justify-center group-hover:bg-[#4AF4A3] group-hover:text-black transition">
                    <a.icon size={22} />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold">{a.title}</h3>
                  <p className="mt-3 text-sm text-white/55 leading-relaxed">{a.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS (a real sequence) ===== */}
      <section id="how" className="relative py-28 px-6 sm:px-12 scroll-mt-24">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <Heading title="How it works" sub="From sign up to settled trade in four steps." />
          </Reveal>
          <div className="relative mt-14 grid md:grid-cols-4 gap-8">
            <div className="hidden md:block absolute top-6 left-[6%] right-[6%] h-px bg-gradient-to-r from-transparent via-[#4AF4A3]/50 to-transparent" />
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 140}>
                <div className="relative">
                  <div className="relative w-12 h-12 rounded-full bg-[#040706] border border-[#4AF4A3]/60 flex items-center justify-center text-[#4AF4A3] shadow-[0_0_25px_rgba(74,244,163,0.25)]">
                    <s.icon size={20} />
                    <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#4AF4A3] text-black text-[11px] font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="mt-5 font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm text-white/55 leading-relaxed">{s.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== COMPANIES ===== */}
      <section id="companies" className="relative py-28 px-6 sm:px-12 bg-white/[0.02] border-y border-white/[0.06] scroll-mt-24">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <Heading title="Pre-IPO companies" sub="A sample of companies with active order books. Prices are demo values." />
              <button onClick={() => onOpenAuth('signin')} className="text-sm text-[#4AF4A3] hover:underline flex items-center gap-1">
                Sign in to trade <ArrowRight size={14} />
              </button>
            </div>
          </Reveal>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {COMPANIES.map((c, i) => (
              <Reveal key={c.name} delay={(i % 4) * 90}>
                <div className="group p-5 rounded-xl border border-white/10 bg-[#0A0F0D] hover:border-[#4AF4A3]/50 transition">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1D5E3C] to-[#0A0F0D] border border-white/10 flex items-center justify-center font-semibold text-[#4AF4A3]">
                      {c.name[0]}
                    </div>
                    <span className={`text-xs font-medium tabular-nums ${c.change >= 0 ? 'text-[#4AF4A3]' : 'text-[#FF6B6B]'}`}>
                      {c.change >= 0 ? '+' : ''}
                      {c.change}%
                    </span>
                  </div>
                  <div className="mt-4 font-semibold">{c.name}</div>
                  <div className="text-xs text-white/45">{c.sector}</div>
                  <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs tabular-nums">
                    <span className="text-white/50">₹{c.price.toFixed(2)} / share</span>
                    <span className="text-white/40">₹{c.val} Cr</span>
                  </div>
                  <button
                    onClick={() => onOpenAuth('signin')}
                    className="mt-4 w-full py-2 rounded-lg bg-white/5 text-xs font-semibold group-hover:bg-[#4AF4A3] group-hover:text-black transition"
                  >
                    Trade
                  </button>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== UNDER THE HOOD ===== */}
      <section className="relative py-28 px-6 sm:px-12">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <Heading title="Built to be fair and transparent" sub="What runs behind every order you place." />
          </Reveal>
          <div className="mt-12 grid sm:grid-cols-2 gap-5">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 2) * 120}>
                <div className="flex gap-5 p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
                  <div className="shrink-0 w-11 h-11 rounded-lg border border-white/10 bg-white/5 text-[#4AF4A3] flex items-center justify-center">
                    <f.icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{f.title}</h3>
                    <p className="mt-2 text-sm text-white/55 leading-relaxed">{f.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA: sign in / sign up ===== */}
      <section className="relative py-32 px-6 sm:px-12 overflow-hidden border-t border-white/[0.06]">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] max-w-none"><NetworkGlobe dim={0.55} /></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#040706] via-[#040706]/70 to-[#040706]" />
        <Reveal className="relative z-10 max-w-3xl mx-auto text-center">
          <BadgeIndianRupee className="mx-auto text-[#4AF4A3]" size={36} />
          <h2 className="mt-6 text-4xl sm:text-5xl font-semibold tracking-tight">Ready to trade before the listing?</h2>
          <p className="mt-5 text-white/60">Create an account in a minute, or sign in to continue where you left off.</p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => onOpenAuth('signup')}
              className="px-8 py-3.5 rounded-full bg-[#4AF4A3] text-black font-semibold text-sm hover:bg-white hover:shadow-[0_0_40px_rgba(74,244,163,0.45)] transition"
            >
              Sign up
            </button>
            <button onClick={() => onOpenAuth('signin')} className="px-8 py-3.5 rounded-full border border-white/25 text-sm hover:bg-white/10 transition">
              Sign in
            </button>
          </div>
        </Reveal>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-white/[0.06] bg-[#040706] py-5 px-6 sm:px-12 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/40">
        <div>{BRAND.name} · DBMS academic mini-project prototype</div>
        <div className="flex items-center gap-4">
          <span className="text-[#4AF4A3]">● Relational engine active</span>
          <span>Demo data only. No live brokerage.</span>
        </div>
      </footer>
    </div>
  );
}