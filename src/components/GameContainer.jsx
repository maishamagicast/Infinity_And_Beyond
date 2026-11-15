import React, { useEffect, useRef } from 'react';
import { createGame } from '../game/config';

/**
 * GameContainer — Mounts the Phaser canvas (Dev 1 engine)
 * and overlays the retro astronaut HUD (as shown in WhatsApp Image 2026-11-15 at 13.44.08.jpeg)
 * with life support health bar, oxygen gauge, and back-to-base navigation.
 */
export default function GameContainer({
  paused = false,
  onBackToBase,
  recoveredCount = 0,
  totalSurfaceCount = 3,
}) {
  const gameRef = useRef(null);

  useEffect(() => {
    let game = null;
    try {
      game = createGame('phaser-root');
      gameRef.current = game;
    } catch (err) {
      console.error('Failed to initialize Phaser game instance:', err);
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-screen h-screen bg-[#1a0f0a] flex items-center justify-center overflow-hidden select-none">
      {/* Phaser Canvas Mounting Root */}
      <div
        id="phaser-root"
        className="w-full h-full flex items-center justify-center"
      />

      {/* Top Left: Retro HUD from WhatsApp Image 2026-11-15 at 13.44.08 */}
      <div className="absolute top-4 left-4 z-40 flex flex-col gap-2 pointer-events-none">
        {/* Heart / Life Support Bar */}
        <div className="flex items-center gap-2 bg-black/80 border-2 border-edge px-3 py-1.5 rounded shadow-lg backdrop-blur-xs">
          <span className="text-red-500 font-pixel text-xs animate-pulse">❤️</span>
          <div className="w-28 h-3 bg-red-950/80 border border-red-700 rounded-xs overflow-hidden p-0.5">
            <div className="w-full h-full bg-gradient-to-r from-red-600 via-rose-500 to-rose-400" />
          </div>
          <span className="font-vt text-sm text-bone tracking-widest">LIFE SUPPORT</span>
        </div>

        {/* OX / Oxygen Bar */}
        <div className="flex items-center gap-2 bg-black/80 border-2 border-edge px-3 py-1.5 rounded shadow-lg backdrop-blur-xs">
          <span className="font-pixel text-[10px] text-cyan-400">OX</span>
          <div className="w-28 h-3 bg-cyan-950/80 border border-cyan-700 rounded-xs overflow-hidden p-0.5">
            <div className="w-[96%] h-full bg-gradient-to-r from-cyan-600 via-sky-500 to-cyan-300" />
          </div>
          <span className="font-vt text-sm text-cyan-300 tracking-widest">96%</span>
        </div>
      </div>

      {/* Top Right: Return to Base & Surface Recovery Log */}
      <div className="absolute top-4 right-4 z-40 flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 bg-black/80 border border-phosphor px-3 py-1.5 rounded font-pixel text-[10px] text-phosphor shadow-md">
          <span>SURFACE LOG:</span>
          <span className="text-amber">{recoveredCount} / {totalSurfaceCount}</span>
        </div>

        <button
          onClick={onBackToBase}
          className="border-2 border-phosphor bg-black/85 hover:bg-phosphor hover:text-void text-phosphor px-3 py-2 font-pixel text-xs rounded transition-all cursor-pointer shadow-[0_0_15px_rgba(93,255,126,0.3)] focus:outline-none focus:ring-2 focus:ring-amber"
        >
          ← RETURN TO BASE
        </button>
      </div>

      {/* Bottom Hint Banner */}
      <div className="absolute bottom-3 inset-x-0 z-40 flex justify-center pointer-events-none px-4">
        <div className="bg-black/85 border border-edge/80 px-4 py-1.5 rounded-full font-pixel text-[9px] text-bone/90 tracking-wide shadow-md">
          <span className="text-amber">[W][A][S][D] / ARROWS</span> TO MOVE · WALK UP TO ROVER &amp; PRESS <span className="text-phosphor glow">[E] TO HACK</span>
        </div>
      </div>

      {/* Scanline CRT overlay */}
      <div className="absolute inset-0 crt-scanlines pointer-events-none opacity-30" />
    </div>
  );
}
