'use client';

import { useEffect, useRef } from 'react';

interface DotState {
  x: number;
  y: number;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smoothstep = (t: number) => t * t * (3 - 2 * t);

export function InteractiveGridBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<DotState[]>([]);
  const mousePositionRef = useRef({ x: -10_000, y: -10_000 });
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
    if (!ctx) return;

    const gridSize = 28;

    const baseRadius = 1.5;
    const maxRadius = 4.0;

    const influenceRadius = 160;

    const initDots = (w: number, h: number) => {
      const pad = gridSize * 2;
      const dots: DotState[] = [];
      for (let x = -pad; x <= w + pad; x += gridSize) {
        for (let y = -pad; y <= h + pad; y += gridSize) {
          dots.push({ x, y });
        }
      }
      return dots;
    };

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      dotsRef.current = initDots(w, h);
    };

    resize();
    window.addEventListener('resize', resize);

    const onMove = (e: MouseEvent) => {
      mousePositionRef.current.x = e.clientX;
      mousePositionRef.current.y = e.clientY;
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    let cachedColors: { border: string; primary: string } | null = null;
    const invalidateColors = () => {
      cachedColors = null;
    };

    const getColors = () => {
      if (!cachedColors) {
        const style = getComputedStyle(document.documentElement);
        cachedColors = {
          border: style.getPropertyValue('--border').trim(),
          primary: style.getPropertyValue('--primary').trim(),
        };
      }
      return cachedColors;
    };

    const root = document.documentElement;
    const mo = new MutationObserver(() => invalidateColors());
    mo.observe(root, { attributes: true, attributeFilter: ['class', 'style'] });

    const mql = window.matchMedia?.('(prefers-color-scheme: dark)');
    const onMql = () => invalidateColors();
    mql?.addEventListener?.('change', onMql);

    const r = influenceRadius;
    const rSq = r * r;

    const draw = () => {
      const { border, primary } = getColors();

      const mx = mousePositionRef.current.x;
      const my = mousePositionRef.current.y;

      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      const isDark = root.classList.contains('dark');

      const idleAlpha = isDark ? 0.35 : 0.50;

      for (const dot of dotsRef.current) {
        const dx = mx - dot.x;
        const dy = my - dot.y;
        const distSq = dx * dx + dy * dy;

        let closeness = 0;
        if (distSq < rSq) {
          const dist = Math.sqrt(distSq);
          closeness = smoothstep(clamp01(1 - dist / r));
        }

        const radius = baseRadius + (maxRadius - baseRadius) * closeness;

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${border})`;
        ctx.globalAlpha = idleAlpha;
        ctx.fill();

        // // Primary overlay (COMMENTED OUT)
        // if (closeness > 0) {
        //   ctx.beginPath();
        //   ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
        //   ctx.fillStyle = `hsl(${primary})`;
        //   ctx.globalAlpha = (isDark ? 0.45 : 0.30) * Math.pow(closeness, 1.8);
        //   ctx.fill();
        // }
      }

      ctx.globalAlpha = 1;
      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);

      mo.disconnect();
      mql?.removeEventListener?.('change', onMql);

      if (animationFrameRef.current !== undefined) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      cachedColors = null;
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-background" />
      <canvas ref={canvasRef} className="absolute inset-0" />
      <div className="absolute left-1/2 top-30 h-130 w-130 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl dark:bg-primary/15" />
    </div>
  );
}