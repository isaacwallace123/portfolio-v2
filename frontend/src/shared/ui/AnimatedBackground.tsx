'use client';

import { useEffect, useRef } from 'react';

/**
 * Performant animated background:
 *
 * BLOBS  — radial-gradient divs, NO filter:blur.
 *           Very slow CSS translate-only drift (compositor-only, zero repaint).
 *           Spread across full page height so every section has colour.
 *
 * STARS  — canvas, 35 particles, arc()+fill() only.
 *           Fade to 0 opacity as user scrolls past first viewport.
 *           RAF cancelled entirely when invisible (zero CPU cost below fold).
 */

// ─── Blob data ────────────────────────────────────────────────────────────────
const BLOBS: { s: React.CSSProperties; g: string; a: string }[] = [
  // Hero — violet glowing behind "Tech I Ship With" card
  {
    s: { top: '8%', left: '47%', width: '55vw', height: '55vw' },
    g: 'radial-gradient(circle, hsl(265 75% 65% / 0.45) 0%, transparent 62%)',
    a: 'bd1 50s ease-in-out infinite',
  },
  // Hero — faint blue top-left for depth
  {
    s: { top: '-8%', left: '-4%', width: '42vw', height: '42vw' },
    g: 'radial-gradient(circle, hsl(220 80% 65% / 0.14) 0%, transparent 68%)',
    a: 'bd2 42s ease-in-out infinite',
  },
  // Experience section — cyan left
  {
    s: { top: '28%', left: '-8%', width: '48vw', height: '48vw' },
    g: 'radial-gradient(circle, hsl(198 90% 62% / 0.20) 0%, transparent 68%)',
    a: 'bd3 55s ease-in-out infinite',
  },
  // Skills section — emerald right
  {
    s: { top: '50%', right: '-4%', width: '42vw', height: '42vw' },
    g: 'radial-gradient(circle, hsl(160 70% 55% / 0.18) 0%, transparent 68%)',
    a: 'bd4 44s ease-in-out infinite',
  },
  // Projects section — rose left
  {
    s: { top: '70%', left: '5%', width: '38vw', height: '38vw' },
    g: 'radial-gradient(circle, hsl(342 75% 65% / 0.17) 0%, transparent 68%)',
    a: 'bd5 51s ease-in-out infinite',
  },
  // Contact section — amber right
  {
    s: { top: '88%', right: '-3%', width: '32vw', height: '32vw' },
    g: 'radial-gradient(circle, hsl(38 90% 60% / 0.15) 0%, transparent 68%)',
    a: 'bd6 38s ease-in-out infinite',
  },
];

// ─── Particle types ───────────────────────────────────────────────────────────
const COLS: [number, number, number][] = [
  [255, 255, 255],
  [140, 185, 255],
  [195, 150, 255],
  [110, 225, 255],
  [145, 250, 190],
];

interface P {
  x: number; y: number; sz: number;
  r: number; g: number; b: number;
  vx: number; vy: number;
  base: number; ph: number; sp: number;
}

function mkParticles(w: number, h: number, n = 35): P[] {
  return Array.from({ length: n }, () => {
    const [r, g, b] = COLS[Math.floor(Math.random() * COLS.length)];
    return {
      x: Math.random() * w, y: Math.random() * h,
      sz: Math.random() * 1.4 + 0.4,
      r, g, b,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      base: Math.random() * 0.5 + 0.15,
      ph: Math.random() * Math.PI * 2,
      sp: Math.random() * 0.009 + 0.003,
    };
  });
}

// ─── Component ───────────────────────────────────────────────────────────────
export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0, h = 0, ps: P[] = [];
    let raf: number | null = null;
    let currentOpacity = 1;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      w = window.innerWidth; h = window.innerHeight;
      canvas.width  = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width  = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ps = mkParticles(w, h);
    };
    resize();
    window.addEventListener('resize', resize);

    // arc+fill only — no gradients, no shadow
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of ps) {
        p.ph += p.sp;
        const a = p.base * (0.4 + 0.6 * Math.sin(p.ph));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.sz, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${a})`;
        ctx.fill();
        p.x += p.vx; p.y += p.vy;
        if (p.x < -5)    p.x = w + 5;
        if (p.x > w + 5) p.x = -5;
        if (p.y < -5)    p.y = h + 5;
        if (p.y > h + 5) p.y = -5;
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    // Fade stars over the first viewport, pause RAF when invisible
    const onScroll = () => {
      const next = Math.max(0, 1 - window.scrollY / (window.innerHeight * 0.9));
      if (next === currentOpacity) return;
      currentOpacity = next;
      canvas.style.opacity = String(next);
      if (next === 0 && raf !== null) {
        cancelAnimationFrame(raf);
        raf = null;
      } else if (next > 0 && raf === null) {
        draw();
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      if (raf !== null) cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <>
      {/* Translate-only drift — compositor-only, zero repaint, no blur */}
      <style>{`
        @keyframes bd1 {
          0%,100% { transform: translate(0px, 0px); }
          33%      { transform: translate(-28px, 18px); }
          66%      { transform: translate(22px, -22px); }
        }
        @keyframes bd2 {
          0%,100% { transform: translate(0px, 0px); }
          50%      { transform: translate(32px, 28px); }
        }
        @keyframes bd3 {
          0%,100% { transform: translate(0px, 0px); }
          40%      { transform: translate(-24px, 34px); }
          80%      { transform: translate(28px, -18px); }
        }
        @keyframes bd4 {
          0%,100% { transform: translate(0px, 0px); }
          33%      { transform: translate(28px, -24px); }
          66%      { transform: translate(-18px, 28px); }
        }
        @keyframes bd5 {
          0%,100% { transform: translate(0px, 0px); }
          50%      { transform: translate(-32px, -22px); }
        }
        @keyframes bd6 {
          0%,100% { transform: translate(0px, 0px); }
          45%      { transform: translate(24px, -28px); }
        }
      `}</style>

      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-background" />

        {BLOBS.map((b, i) => (
          <div
            key={i}
            className="absolute rounded-full will-change-transform"
            style={{ ...b.s, background: b.g, animation: b.a }}
          />
        ))}

        <canvas ref={canvasRef} className="absolute inset-0" />
      </div>
    </>
  );
}
