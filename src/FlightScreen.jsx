import React, { useEffect, useRef, useState, useCallback } from 'react';

/**
 * FlightScreen — travel step
 * Props:
 *   destination: { name, fact, sky, ground, stars }
 *   onArrive: function called exactly once upon journey completion
 */
export default function FlightScreen({ destination, onArrive }) {
  const canvasRef = useRef(null);
  const [progressPct, setProgressPct] = useState(0);
  const [statusText, setStatusText] = useState('Engines firing. Hold on tight.');
  const arrivedRef = useRef(false);

  const destinationName = destination?.name || 'Destination';
  const destinationFact = destination?.fact || 'Traveling through deep space.';

  // Safeguard: call onArrive exactly once
  const triggerArrive = useCallback(() => {
    if (!arrivedRef.current) {
      arrivedRef.current = true;
      if (typeof onArrive === 'function') {
        onArrive();
      }
    }
  }, [onArrive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const totalDuration = prefersReducedMotion ? 2500 : 7000;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Initialize exactly 240 stars
    const NUM_STARS = 240;
    const stars = [];
    for (let i = 0; i < NUM_STARS; i++) {
      stars.push({
        x: (Math.random() - 0.5) * width * 1.5,
        y: (Math.random() - 0.5) * height * 1.5,
        z: Math.random() * 1000 + 1,
        prevZ: 1000,
        size: Math.random() * 1.5 + 1,
        color: i % 8 === 0 ? '#ffb347' : i % 6 === 0 ? '#7dff9a' : '#f1dcc0'
      });
    }

    let animationFrameId;
    const startTime = performance.now();

    const render = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / totalDuration);
      setProgressPct(Math.round(progress * 100));

      // Calculate speed and status line
      let speedFactor = 0;
      if (progress < 0.25) {
        // Ramp up
        speedFactor = progress / 0.25;
        setStatusText('Engines firing. Hold on tight.');
      } else if (progress < 0.75) {
        // Cruise
        speedFactor = 1.0;
        setStatusText('Cruising at warp speed.');
      } else {
        // Ramp down
        speedFactor = (1 - progress) / 0.25;
        setStatusText(`Slowing down. ${destinationName} ahead.`);
      }

      // Draw background
      ctx.fillStyle = '#1e1613';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      if (prefersReducedMotion) {
        // Static sky: draw stars as dots without motion or streaks
        for (let i = 0; i < NUM_STARS; i++) {
          const s = stars[i];
          const sx = cx + (s.x / 1000) * (width * 0.45);
          const sy = cy + (s.y / 1000) * (height * 0.45);

          ctx.fillStyle = s.color;
          ctx.beginPath();
          ctx.arc(sx, sy, s.size, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Animated starfield with speed streaks
        const warpSpeed = 4 + speedFactor * 42;
        const streakMultiplier = 1 + speedFactor * 5;

        for (let i = 0; i < NUM_STARS; i++) {
          const s = stars[i];
          s.prevZ = s.z;
          s.z -= warpSpeed;

          // Recycle star when it passes the camera
          if (s.z <= 0) {
            s.z = 1000;
            s.prevZ = 1000;
            s.x = (Math.random() - 0.5) * width * 1.5;
            s.y = (Math.random() - 0.5) * height * 1.5;
          }

          const k = 400 / s.z;
          const px = s.x * k + cx;
          const py = s.y * k + cy;

          // Previous position for streak
          const prevK = 400 / Math.min(1000, s.z + warpSpeed * streakMultiplier);
          const oldPx = s.x * prevK + cx;
          const oldPy = s.y * prevK + cy;

          if (px >= 0 && px <= width && py >= 0 && py <= height) {
            const alpha = Math.min(1, (1000 - s.z) / 400);

            if (speedFactor > 0.1) {
              // Draw streak line
              ctx.strokeStyle = s.color;
              ctx.lineWidth = Math.max(1, s.size * (1 - s.z / 1000) * 1.5);
              ctx.globalAlpha = alpha;
              ctx.beginPath();
              ctx.moveTo(oldPx, oldPy);
              ctx.lineTo(px, py);
              ctx.stroke();
            } else {
              // Draw point dot
              ctx.fillStyle = s.color;
              ctx.globalAlpha = alpha;
              ctx.beginPath();
              ctx.arc(px, py, s.size, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
        ctx.globalAlpha = 1.0;
      }

      // Check for completion
      if (progress >= 1) {
        triggerArrive();
        return;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [destinationName, triggerArrive]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-void select-none flex flex-col justify-between">
      {/* Canvas Starfield */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
        aria-label="Starfield travel animation"
      />

      {/* CRT Scanline Overlay */}
      <div className="absolute inset-0 crt-scanlines pointer-events-none" />

      {/* Top Header / Skip button */}
      <header className="relative z-10 p-4 flex justify-between items-center">
        <div className="bg-panel/90 border border-edge px-3 py-1.5 rounded shadow">
          <span className="font-pixel text-[10px] text-amber uppercase tracking-wider">
            MISSION FLIGHT // {destinationName}
          </span>
        </div>

        <button
          type="button"
          onClick={triggerArrive}
          className="font-pixel text-[10px] bg-panel hover:bg-edge text-bone border-2 border-edge hover:border-amber px-3 py-2 rounded shadow transition focus:outline-none focus:ring-2 focus:ring-amber cursor-pointer active:translate-y-0.5"
          aria-label="Skip the trip"
        >
          Skip the trip &gt;&gt;
        </button>
      </header>

      {/* Bottom Information Panel */}
      <footer className="relative z-10 m-4 p-4 md:p-6 bg-panel/95 border-2 border-edge rounded-lg shadow-2xl max-w-3xl mx-auto w-[calc(100%-2rem)]">
        {/* Status Line */}
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-block w-2.5 h-2.5 bg-phosphor rounded-full animate-ping" />
          <h2 className="font-pixel text-xs md:text-sm text-phosphor tracking-wide crt-text-phosphor">
            {statusText}
          </h2>
        </div>

        {/* Destination Fact */}
        <p className="font-vt text-lg md:text-xl text-bone leading-relaxed mb-4">
          {destinationFact}
        </p>

        {/* Progress Bar (role="progressbar") */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center font-pixel text-[9px] text-dim">
            <span>TRAJECTORY PROGRESS</span>
            <span className="text-amber">{progressPct}%</span>
          </div>

          <div
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Flight progress to destination"
            className="w-full h-4 bg-void border border-edge rounded overflow-hidden p-0.5"
          >
            <div
              className="h-full bg-gradient-to-r from-rust via-amber to-phosphor rounded-sm transition-all duration-100 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </footer>
    </div>
  );
}
