import React, { useState } from 'react';
import RemoteScanner from './RemoteScanner';

/**
 * MarsObservationWindow — Displays the Base Control Room overlooking the Martian plain
 * and the giant Deep Space Network parabolic radio dish (as shown in WhatsApp Image 2026-11-15 at 13.44.07.jpeg).
 */
function MarsObservationWindow({ onLaunch }) {
  return (
    <div className="relative w-full h-56 sm:h-72 md:h-80 rounded-lg overflow-hidden border-4 border-edge bg-void shadow-2xl group select-none">
      {/* Background Pixel Art Control Room */}
      <img
        src="/control_room.jpeg"
        alt="Base Control Room with DSN radio dish and Martian landscape"
        className="w-full h-full object-cover object-center filter brightness-95 contrast-105"
      />

      {/* Retro CRT Scanlines & Vignette Overlay */}
      <div className="absolute inset-0 crt-scanlines pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

      {/* Top Bar inside Window */}
      <div className="absolute top-2 left-3 right-3 flex items-center justify-between text-[9px] font-pixel text-phosphor pointer-events-none">
        <span className="flex items-center gap-1.5 bg-black/70 px-2 py-1 rounded border border-edge/60">
          <span className="w-2 h-2 rounded-full bg-phosphor animate-pulse" />
          DSN PARABOLIC ARRAY DSS-63 // ONLINE
        </span>
        <span className="bg-black/70 px-2 py-1 rounded border border-edge/60 text-bone">
          AZ: 247.3° · EL: 42.1° · X-BAND
        </span>
      </div>

      {/* Simulated Oscilloscope / Radar HUD in bottom-left */}
      <div className="absolute bottom-3 left-3 hidden sm:flex items-center gap-3 bg-black/80 border border-phosphor-dim/80 px-3 py-1.5 rounded text-phosphor font-term text-base">
        <div className="relative w-7 h-7 rounded-full border border-phosphor flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 border border-phosphor/30 rounded-full" />
          <div className="w-full h-0.5 bg-phosphor/40" />
          <div className="h-full w-0.5 bg-phosphor/40" />
          <div className="absolute inset-0 border-t-2 border-phosphor origin-center animate-radar" />
        </div>
        <div>
          <div className="text-xs text-phosphor glow font-pixel text-[8px]">CARRIER LOCK</div>
          <div className="text-xs text-dim">DELAY: 14m 22s</div>
        </div>
      </div>

      {/* Direct Launch Prompt overlay inside window */}
      <div className="absolute bottom-3 right-3">
        <button
          onClick={onLaunch}
          className="border-2 border-amber bg-black/85 hover:bg-amber hover:text-void text-amber px-4 py-2 font-pixel text-xs rounded transition-all cursor-pointer shadow-[0_0_20px_rgba(255,179,71,0.35)] flex items-center gap-2"
        >
          <span>🚀 LAUNCH SURFACE EVA</span>
        </button>
      </div>
    </div>
  );
}

/**
 * Segmented ProgressBar component
 */
function ProgressBar({ done, total }) {
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
      aria-label="Hardware recovered"
      className="flex gap-1.5 w-full my-2"
    >
      {Array.from({ length: total }, (_, i) => {
        const isFilled = i < done;
        return (
          <div
            key={i}
            className={`h-5 flex-1 border-2 transition-all ${
              isFilled
                ? 'bg-phosphor border-phosphor shadow-[0_0_10px_rgba(93,255,126,0.6)]'
                : 'bg-black/60 border-edge/80'
            }`}
          />
        );
      })}
    </div>
  );
}

/**
 * Payload Modal dialog to view recovered NASA science archives
 */
function PayloadModal({ payloadData, onClose }) {
  if (!payloadData) return null;
  const science = payloadData.science_payload || payloadData.payload || {};

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 select-none"
    >
      <div className="relative max-w-xl w-full bg-panel border-4 border-phosphor rounded-lg p-5 font-tech text-bone shadow-[0_0_50px_rgba(93,255,126,0.3)] space-y-4">
        <div className="flex items-start justify-between border-b border-phosphor-dim pb-3">
          <div>
            <span className="font-pixel text-[9px] text-phosphor uppercase tracking-wider block">
              NASA SCIENCE ARCHIVE RECOVERED // TELEMETRY VERIFIED
            </span>
            <h3 className="font-pixel text-sm text-bone mt-1">{payloadData.name}</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="border-2 border-phosphor px-2 py-1 font-pixel text-xs text-phosphor hover:bg-phosphor hover:text-void cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 font-term text-xl text-bone/90">
          {science.headline && (
            <p className="font-pixel text-xs text-amber leading-snug">
              ★ {science.headline}
            </p>
          )}

          <p className="leading-relaxed">
            {science.story || payloadData.fact || payloadData.summary || 'Historical science telemetry recovered.'}
          </p>

          <div className="bg-black/60 border border-edge p-3 rounded text-base space-y-1 text-dim">
            <div><span className="text-phosphor">LOCATION:</span> {payloadData.location || payloadData.distance_km}</div>
            <div><span className="text-phosphor">AGENCY:</span> {payloadData.agency || 'NASA / JPL'}</div>
            <div><span className="text-phosphor">ACTIVE TIMELINE:</span> {payloadData.active_years || 'Historic Mission'}</div>
            {payloadData.planned_duration && (
              <div><span className="text-phosphor">MISSION DURATION:</span> {payloadData.planned_duration}</div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-edge/60">
          <button
            onClick={onClose}
            className="border-2 border-phosphor bg-phosphor/20 hover:bg-phosphor hover:text-void text-phosphor font-pixel text-xs px-4 py-2 rounded cursor-pointer transition-colors"
          >
            DISMISS ARCHIVE
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * DsnConsole — Dev 3 Static DSN Hub Screen ("Home Base" UI)
 */
export default function DsnConsole({ hardware = [], recovered = new Set(), onLaunch, onConnect, onReset }) {
  const [selectedPayload, setSelectedPayload] = useState(null);

  const total = hardware.length;
  const done = recovered.size;
  const isAllDone = total > 0 && done === total;

  return (
    <main className="relative flex flex-col h-full w-full bg-void text-bone p-3 sm:p-5 overflow-y-auto space-y-4">
      {/* Top Banner Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-edge pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-phosphor animate-ping" />
            <h1 className="font-pixel text-sm sm:text-base text-bone tracking-wide">
              INFINITY &amp; BEYOND // DSN HOME BASE
            </h1>
          </div>
          <p className="font-term text-lg text-dim mt-0.5">
            Deep Space Network Ground Control · Mars Surface Telemetry &amp; Recovery Hub
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col text-right font-term text-sm text-dim">
            <span>NETWORK UPLINK: NOMINAL</span>
            <span className="text-phosphor">CARRIER LOCKED [X-BAND]</span>
          </div>

          {done > 0 && (
            <button
              onClick={onReset}
              className="font-pixel text-[9px] border border-rust hover:bg-rust text-bone px-2.5 py-1.5 rounded transition cursor-pointer"
              title="Reset progress to replay the mission"
            >
              RESET PROGRESS &#x21bb;
            </button>
          )}
        </div>
      </header>

      {/* Observation Window onto Mars Landscape & Dish */}
      <MarsObservationWindow onLaunch={onLaunch} />

      {/* Control Deck Grid: Mission Status & Signal Scanner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">
        {/* Left Column: Mission Log & Surface EVA Launch */}
        <section
          aria-labelledby="mission-log-title"
          className="flex flex-col justify-between bg-black/85 border-2 border-edge rounded-lg p-4 shadow-xl space-y-4"
        >
          <div>
            <div className="flex items-center justify-between border-b border-edge/60 pb-2 mb-3">
              <h2 id="mission-log-title" className="font-pixel text-xs text-phosphor glow">
                MISSION LOG
              </h2>
              <span className="font-pixel text-[9px] text-amber">
                {done} / {total} RESTORED
              </span>
            </div>

            <p className="font-term text-xl text-bone">
              {isAllDone
                ? 'All historical spacecraft archives successfully recovered! Mission complete.'
                : `${done} of ${total} craft recovered. Scan frequencies and venture to the surface to locate silent rovers.`}
            </p>

            <ProgressBar done={done} total={total} />

            <div className="mt-4 p-3 bg-panel/70 border border-edge rounded text-xs font-tech space-y-1.5 text-dim">
              <div className="text-bone font-pixel text-[9px]">SURFACE PROTOCOL:</div>
              <div>1. Click <strong className="text-amber">LAUNCH SURFACE EVA</strong> to deploy to Mars.</div>
              <div>2. Walk using <strong className="text-phosphor">[W][A][S][D] / Arrows</strong>.</div>
              <div>3. Approach abandoned rovers and press <strong className="text-phosphor">[E]</strong> to hack telemetry.</div>
              <div>4. Deep space probes can be pinged directly from the console!</div>
            </div>
          </div>

          {/* Large EVA Launch Button */}
          <div className="pt-2">
            <button
              onClick={onLaunch}
              className="w-full border-2 border-amber bg-amber/15 hover:bg-amber hover:text-void text-amber p-4 font-pixel text-xs leading-relaxed rounded transition-all cursor-pointer shadow-[0_0_20px_rgba(255,179,71,0.25)] flex flex-col items-center gap-1 focus:outline-none focus:ring-2 focus:ring-phosphor"
            >
              <span className="text-sm">🪐 {done > 0 ? 'RETURN TO SURFACE EVA' : 'LAUNCH SURFACE EVA'}</span>
              <span className="font-term text-sm text-bone opacity-80">
                Deploy 2D Canvas Exploration &amp; Rover Intercept
              </span>
            </button>
          </div>
        </section>

        {/* Center & Right Columns: DSN Signal Scanner */}
        <section className="lg:col-span-2 flex flex-col min-h-[320px]">
          <RemoteScanner
            hardware={hardware}
            recovered={recovered}
            onConnect={onConnect}
            onViewPayload={(hw) => setSelectedPayload(hw)}
          />
        </section>
      </div>

      {/* Payload Details Modal */}
      {selectedPayload && (
        <PayloadModal
          payloadData={selectedPayload}
          onClose={() => setSelectedPayload(null)}
        />
      )}
    </main>
  );
}
