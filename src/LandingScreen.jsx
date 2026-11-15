import React, { useEffect, useRef, useState, useCallback } from 'react';

/**
 * LandingScreen — landing step
 * Props:
 *   destination: { name, fact, sky, ground, stars }
 *   onLanded: function called exactly once after landing completion
 */
export default function LandingScreen({ destination, onLanded }) {
  const [altitude, setAltitude] = useState(100);
  const [speed, setSpeed] = useState(8);
  const [isBraking, setIsBraking] = useState(false);
  const [landedMessage, setLandedMessage] = useState(null);

  const isBrakingRef = useRef(false);
  const landedRef = useRef(false);
  const timerRef = useRef(null);
  const animFrameRef = useRef(null);

  const destinationName = destination?.name || 'the planet';
  const skyColor = destination?.sky || '#1e1613';
  const groundColor = destination?.ground || '#b5472f';
  const showStars = Boolean(destination?.stars);

  // Trigger onLanded exactly once
  const triggerLanded = useCallback(() => {
    if (!landedRef.current) {
      landedRef.current = true;
      if (typeof onLanded === 'function') {
        onLanded();
      }
    }
  }, [onLanded]);

  // Handle braking state toggle
  const setBrakingState = (active) => {
    isBrakingRef.current = active;
    setIsBraking(active);
  };

  // Keyboard handlers for Space and ArrowUp
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.key === ' ' || e.code === 'ArrowUp') {
        e.preventDefault();
        setBrakingState(true);
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space' || e.key === ' ' || e.code === 'ArrowUp') {
        e.preventDefault();
        setBrakingState(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Physics animation loop in requestAnimationFrame
  useEffect(() => {
    let currentAlt = 100;
    let currentSpeed = 8;
    let lastTime = performance.now();
    const landingStartTime = performance.now();
    let hasFinished = false;

    const loop = (now) => {
      if (hasFinished) return;

      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;
      const totalElapsed = (now - landingStartTime) / 1000;

      // Physics: gravity +4/s, braking -18/s
      if (isBrakingRef.current) {
        currentSpeed -= 18 * dt;
      } else {
        currentSpeed += 4 * dt;
      }

      // Speed minimum 1.5
      currentSpeed = Math.max(1.5, currentSpeed);

      // Cannot fail: after 20 seconds force speed to 6
      if (totalElapsed >= 20) {
        currentSpeed = Math.min(currentSpeed, 6);
      }

      currentAlt -= currentSpeed * dt;

      // Check touchdown
      if (currentAlt <= 0) {
        currentAlt = 0;
        hasFinished = true;
        setAltitude(0);
        setSpeed(currentSpeed);

        const msg =
          currentSpeed <= 14
            ? `Perfect landing! Welcome to ${destinationName}.`
            : `Bumpy landing, but the suit held. Welcome to ${destinationName}.`;

        setLandedMessage(msg);

        timerRef.current = setTimeout(() => {
          triggerLanded();
        }, 2200);

        return;
      }

      setAltitude(currentAlt);
      setSpeed(currentSpeed);

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [destinationName, triggerLanded]);

  // Skip landing handler
  const handleSkip = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    triggerLanded();
  };

  const isSpeedTooFast = speed > 14;
  const speedPercentage = Math.min(100, (speed / 40) * 100);
  const targetLinePercentage = (14 / 40) * 100; // 35%

  return (
    <div
      className="relative w-screen h-screen overflow-hidden select-none flex flex-col justify-between font-tech"
      style={{ backgroundColor: skyColor }}
    >
      {/* Background Star Dots if destination.stars */}
      {showStars && (
        <div className="absolute inset-0 pointer-events-none opacity-60">
          {[...Array(40)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-bone rounded-full"
              style={{
                top: `${(i * 17) % 80}%`,
                left: `${(i * 23) % 100}%`,
                width: i % 3 === 0 ? '3px' : '2px',
                height: i % 3 === 0 ? '3px' : '2px'
              }}
            />
          ))}
        </div>
      )}

      {/* Ground Strip (bottom 20%) */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[20%] border-t-4 border-edge"
        style={{ backgroundColor: groundColor }}
      >
        <div className="w-full h-full bg-[radial-gradient(circle_at_center,_rgba(0,0,0,0.2)_1px,_transparent_1px)] [background-size:16px_16px]" />
      </div>

      {/* CRT Scanline Overlay */}
      <div className="absolute inset-0 crt-scanlines pointer-events-none" />

      {/* Top Header / Skip button */}
      <header className="relative z-20 p-4 flex justify-between items-center">
        <div className="bg-panel/90 border border-edge px-3 py-1.5 rounded shadow">
          <span className="font-pixel text-[10px] text-amber uppercase tracking-wider">
            DESCENT RADAR // {destinationName}
          </span>
        </div>

        <button
          type="button"
          onClick={handleSkip}
          className="font-pixel text-[10px] bg-panel hover:bg-edge text-bone border-2 border-edge hover:border-amber px-3 py-2 rounded shadow transition focus:outline-none focus:ring-2 focus:ring-amber cursor-pointer active:translate-y-0.5"
          aria-label="Skip landing"
        >
          Skip landing &gt;&gt;
        </button>
      </header>

      {/* CSS Pixel Lander */}
      <div
        className="absolute left-1/2 -translate-x-1/2 transition-transform duration-75 z-10"
        style={{
          top: `${(100 - altitude) * 0.66}%`
        }}
      >
        <div className="relative flex flex-col items-center">
          {/* Lander Body */}
          <div className="w-14 h-12 bg-bone border-2 border-void rounded-sm shadow-md flex items-center justify-center relative">
            {/* Viewport Window */}
            <div className="w-6 h-4 bg-screen border border-edge rounded-xs flex items-center justify-center">
              <div className="w-2 h-2 bg-phosphor rounded-full" />
            </div>
            {/* Antenna */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-edge">
              <div className="w-2 h-2 -ml-[3px] -mt-1 bg-rust rounded-full" />
            </div>
          </div>

          {/* Lander Legs */}
          <div className="w-20 flex justify-between -mt-1">
            <div className="w-2 h-5 bg-edge -rotate-25 origin-top border-b-2 border-r-2 border-void" />
            <div className="w-2 h-5 bg-edge rotate-25 origin-top border-b-2 border-l-2 border-void" />
          </div>

          {/* Amber Thruster Flame while Braking */}
          {isBraking && (
            <div className="absolute -bottom-8 flex flex-col items-center animate-pulse">
              <div className="w-5 h-7 bg-amber rounded-b-full border border-rust shadow-[0_0_12px_#ffb347]" />
              <div className="w-2 h-3 bg-bone rounded-b-full -mt-5" />
            </div>
          )}
        </div>
      </div>

      {/* Touchdown Banner Announcement */}
      {landedMessage && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 max-w-lg w-[90%] bg-screen/95 border-4 border-phosphor p-6 rounded-lg text-center shadow-2xl animate-bounce">
          <p className="font-pixel text-xs md:text-sm text-phosphor crt-text-phosphor leading-relaxed">
            {landedMessage}
          </p>
        </div>
      )}

      {/* Bottom Controls & Telemetry Dashboard */}
      <footer className="relative z-20 m-4 p-4 md:p-6 bg-panel/95 border-2 border-edge rounded-lg shadow-2xl max-w-2xl mx-auto w-[calc(100%-2rem)] space-y-4">
        {/* Altitude & Speed Numbers */}
        <div className="grid grid-cols-2 gap-4 text-center font-pixel text-xs">
          <div className="bg-void p-2.5 rounded border border-edge">
            <span className="text-dim text-[9px] block mb-1">ALTITUDE</span>
            <span className="text-bone text-sm">{Math.round(altitude)} m</span>
          </div>

          <div className="bg-void p-2.5 rounded border border-edge">
            <span className="text-dim text-[9px] block mb-1">DESCENT SPEED</span>
            <span className={`text-sm ${isSpeedTooFast ? 'text-amber crt-text-amber' : 'text-phosphor'}`}>
              {speed.toFixed(1)} m/s
            </span>
          </div>
        </div>

        {/* Speed Meter (role="meter", max 40) */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center font-pixel text-[9px]">
            <span className="text-dim">SPEED GAUGE</span>
            <span className={isSpeedTooFast ? 'text-amber' : 'text-phosphor'}>
              {speed.toFixed(1)} / 40 m/s
            </span>
          </div>

          <div
            role="meter"
            aria-valuenow={Math.round(speed)}
            aria-valuemin={0}
            aria-valuemax={40}
            aria-label="Lander descent speed"
            className="relative w-full h-5 bg-void border-2 border-edge rounded overflow-hidden"
          >
            {/* Safe marker line at speed 14 */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-bone z-10 shadow"
              style={{ left: `${targetLinePercentage}%` }}
              title="Safe speed marker: 14 m/s"
            />

            {/* Meter fill */}
            <div
              className={`h-full transition-all duration-75 ${
                isSpeedTooFast ? 'bg-amber' : 'bg-phosphor'
              }`}
              style={{ width: `${speedPercentage}%` }}
            />
          </div>
        </div>

        {/* Helper Guidance Text */}
        <div className="text-center space-y-1">
          <p className="font-vt text-lg md:text-xl text-bone">
            {isSpeedTooFast
              ? 'Too fast! Hold the button to slow down.'
              : 'Nice and gentle. Keep the bar before the white line.'}
          </p>
          <p className="font-pixel text-[9px] text-dim">
            Tip: you can also hold the Space bar.
          </p>
        </div>

        {/* Big "Hold to fire thrusters" Button */}
        <button
          type="button"
          onPointerDown={() => setBrakingState(true)}
          onPointerUp={() => setBrakingState(false)}
          onPointerLeave={() => setBrakingState(false)}
          onPointerCancel={() => setBrakingState(false)}
          disabled={altitude <= 0}
          className={`w-full py-4 px-6 rounded-lg font-pixel text-xs md:text-sm tracking-wider uppercase border-3 transition touch-none select-none cursor-pointer focus:outline-none focus:ring-4 focus:ring-amber ${
            isBraking
              ? 'bg-amber text-void border-bone shadow-[0_0_20px_#ffb347] scale-[0.98]'
              : 'bg-rust hover:bg-amber text-bone hover:text-void border-edge hover:border-bone shadow-lg'
          }`}
          aria-label="Hold to fire thrusters"
        >
          {isBraking ? '🔥 THRUSTERS FIRING! 🔥' : 'Hold to fire thrusters'}
        </button>
      </footer>
    </div>
  );
}
