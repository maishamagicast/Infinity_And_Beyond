import React, { useState } from 'react';
import FlightScreen   from './FlightScreen';
import LandingScreen  from './LandingScreen';
import TerminalCoach  from './TerminalCoach';
import SurfaceScreen  from './SurfaceScreen';

// Hard-coded Mars destination
const MOCK_DESTINATION = {
  name:   'Mars - Gusev Crater',
  fact:   'Gusev Crater was once a giant lake basin where Spirit found evidence of ancient hot springs.',
  sky:    '#241410',
  ground: '#b5472f',
  stars:  true
};

// Hard-coded puzzle
const MOCK_PUZZLE = {
  id:   'spirit',
  name: 'Spirit rover',
  goal: 'Spirit has been silent since 2010. Send it a ping to see if it still answers.',
  commands: [
    { cmd: 'ping spirit', label: 'Say hello to the rover' }
  ],
  hints: [
    'A ping is like knocking on a door.',
    'Tap the green command above.'
  ]
};

/**
 * TestFlow — complete gameplay flow:
 * 1. Flight: Hyperspace travel to planet
 * 2. Landing: Atmospheric entry & thruster descent
 * 3. Terminal: Field transceiver ping
 * 4. Surface: Walk, hook up rover, tow to mothership
 * 5. Onboard Terminal: Check device status inside the ship (terminal team slot)
 * 6. Fly Away: Mothership launches off the planet into deep space
 */
export default function TestFlow() {
  // 'flight' | 'landing' | 'terminal' | 'surface' | 'onboard_terminal' | 'fly_away' | 'done'
  const [step, setStep] = useState('flight');

  // Terminal log entries
  const [terminalLogs, setTerminalLogs] = useState([
    'NASA / JPL SURFACE TELEMETRY SYSTEM v1.0',
    'Connected to Gusev Crater field transceiver.',
    'Waiting for operator instruction...'
  ]);

  const [pinged, setPinged] = useState(false);

  const handleCommandRun = (cmd) => {
    setTerminalLogs(prev => [
      ...prev,
      `> ${cmd}`,
      'Signal found! Data decoded.',
      'Uplink restored. Step outside to retrieve the rover.'
    ]);
    setPinged(true);
  };

  const handleReset = () => {
    setTerminalLogs([
      'NASA / JPL SURFACE TELEMETRY SYSTEM v1.0',
      'Connected to Gusev Crater field transceiver.',
      'Waiting for operator instruction...'
    ]);
    setPinged(false);
    setStep('flight');
  };

  // ── 1. FLIGHT ──────────────────────────────────────────────────
  if (step === 'flight') {
    return (
      <FlightScreen
        destination={MOCK_DESTINATION}
        onArrive={() => setStep('landing')}
      />
    );
  }

  // ── 2. LANDING ─────────────────────────────────────────────────
  if (step === 'landing') {
    return (
      <LandingScreen
        destination={MOCK_DESTINATION}
        onLanded={() => setStep('terminal')}
      />
    );
  }

  // ── 3. FIELD TRANSCEIVER PING ──────────────────────────────────
  if (step === 'terminal') {
    return (
      <div className="w-screen h-screen bg-void text-bone overflow-y-auto flex flex-col gap-4 p-4 md:p-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between bg-panel p-3 rounded-lg border-2 border-edge">
          <span className="font-pixel text-xs text-phosphor crt-text-phosphor">
            FIELD TELEMETRY // {MOCK_DESTINATION.name.toUpperCase()}
          </span>
          <button
            type="button"
            onClick={handleReset}
            className="font-pixel text-[10px] bg-rust hover:bg-amber text-bone hover:text-void border border-edge px-3 py-1.5 rounded transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber"
          >
            Restart &#x21bb;
          </button>
        </div>

        <div className="min-h-[160px] bg-screen border-2 border-edge rounded-lg p-4 font-vt text-lg md:text-xl text-phosphor crt-screen crt-scanlines overflow-y-auto space-y-1">
          {terminalLogs.map((line, i) => (
            <div
              key={i}
              className={
                line.startsWith('>')
                  ? 'text-amber crt-text-amber font-bold'
                  : line.includes('Signal found') || line.includes('Uplink')
                  ? 'text-phosphor font-bold'
                  : 'text-phosphor/80'
              }
            >
              {line}
            </div>
          ))}
        </div>

        <TerminalCoach puzzleData={MOCK_PUZZLE} onRun={handleCommandRun} />

        {pinged && (
          <div className="bg-panel border-2 border-phosphor rounded-xl p-5 text-center shadow-[0_0_24px_rgba(125,255,154,0.25)] space-y-3">
            <p className="font-pixel text-xs text-phosphor crt-text-phosphor leading-relaxed">
              📡 Ping succeeded — Spirit has responded!
            </p>
            <p className="font-vt text-xl text-bone">
              Step onto the surface, hook up the rover, and tow it back to your mothership.
            </p>
            <button
              type="button"
              onClick={() => setStep('surface')}
              className="font-pixel text-xs bg-phosphor hover:bg-amber text-void border-2 border-bone px-6 py-3 rounded-lg shadow-[0_0_18px_#7dff9a] cursor-pointer transition-colors focus:outline-none focus:ring-4 focus:ring-phosphor uppercase tracking-wider"
            >
              🧑‍🚀 Step outside & Retrieve Rover →
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── 4. SURFACE WALK & ROVER TOW ────────────────────────────────
  if (step === 'surface') {
    return (
      <SurfaceScreen
        destination={MOCK_DESTINATION}
        roverName={MOCK_PUZZLE.name}
        onDone={() => setStep('onboard_terminal')}
      />
    );
  }

  // ── 5. ONBOARD TERMINAL (DEVICE STATUS CHECK IN MOTHERSHIP) ────
  if (step === 'onboard_terminal') {
    return (
      <div className="w-screen h-screen bg-void text-bone relative overflow-hidden flex flex-col justify-between font-tech select-none">
        {/* Mothership Control Room Background */}
        <div className="absolute inset-0 z-0">
          <img
            src="/control_room.jpeg"
            alt="Mothership Control Room"
            className="w-full h-full object-cover object-center brightness-60 filter contrast-110"
          />
          <div className="absolute inset-0 bg-void/70 backdrop-blur-xs" />
          <div className="absolute inset-0 crt-scanlines pointer-events-none" />
        </div>

        {/* Header */}
        <header className="relative z-10 p-4 flex justify-between items-center border-b border-edge/80 bg-panel/90">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-phosphor animate-ping" />
            <span className="font-pixel text-xs text-phosphor crt-text-phosphor">
              MOTHERSHIP CONTROL BRIDGE // ONBOARD TERMINAL
            </span>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="font-pixel text-[10px] bg-edge hover:bg-amber text-bone hover:text-void border border-bone px-3 py-1.5 rounded transition cursor-pointer"
          >
            Restart &#x21bb;
          </button>
        </header>

        {/* Main Content Area */}
        <main className="relative z-10 flex-1 max-w-4xl mx-auto w-full p-4 md:p-6 flex flex-col justify-center space-y-5 overflow-y-auto">
          {/* Status dossier card */}
          <div className="bg-screen/95 border-2 border-phosphor p-6 rounded-xl shadow-[0_0_35px_rgba(125,255,154,0.3)] crt-screen space-y-4">
            <div className="flex items-center justify-between border-b border-edge/60 pb-3">
              <div>
                <span className="font-pixel text-[10px] text-amber uppercase tracking-wider block">
                  DEVICE CARGO TELEMETRY
                </span>
                <h2 className="font-pixel text-sm md:text-base text-phosphor crt-text-phosphor mt-1">
                  {MOCK_PUZZLE.name.toUpperCase()} // STATUS VERIFIED
                </h2>
              </div>
              <span className="font-pixel text-[10px] bg-phosphor/20 text-phosphor border border-phosphor px-2.5 py-1 rounded">
                CARGO BAY 01
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-vt text-lg md:text-xl text-bone">
              <div className="bg-void/80 p-3 rounded border border-edge">
                <span className="text-dim text-sm block">HARDWARE STATE:</span>
                <span className="text-phosphor font-bold">100% ONLINE / SECURED</span>
              </div>
              <div className="bg-void/80 p-3 rounded border border-edge">
                <span className="text-dim text-sm block">BATTERY BUS:</span>
                <span className="text-amber font-bold">TRICKLE CHARGING (NOMINAL)</span>
              </div>
              <div className="bg-void/80 p-3 rounded border border-edge">
                <span className="text-dim text-sm block">DATA EXTRACTION:</span>
                <span className="text-phosphor font-bold">APXS TELEMETRY ARCHIVED</span>
              </div>
              <div className="bg-void/80 p-3 rounded border border-edge">
                <span className="text-dim text-sm block">MOUNT TARGET:</span>
                <span className="text-bone">/mnt/cargo/{MOCK_PUZZLE.id}</span>
              </div>
            </div>

            {/* Terminal Module Integration Placeholder */}
            <div className="p-4 bg-void/90 border border-edge border-dashed rounded-lg text-center space-y-1">
              <span className="font-pixel text-[9px] text-amber">
                [ TERMINAL MODULE INTEGRATION SLOT ]
              </span>
              <p className="font-vt text-base text-dim">
                The terminal team will plug their terminal engine directly into this view.
              </p>
            </div>
          </div>
        </main>

        {/* Footer with Departure Trigger */}
        <footer className="relative z-10 p-4 md:p-6 bg-panel/95 border-t border-edge flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-left font-vt text-lg text-bone">
            Status check complete. All clamps locked. Engines ready for departure.
          </div>
          <button
            type="button"
            onClick={() => setStep('fly_away')}
            className="w-full sm:w-auto font-pixel text-xs md:text-sm bg-gradient-to-r from-amber to-phosphor hover:from-phosphor hover:to-amber text-void border-2 border-bone px-8 py-4 rounded-xl shadow-[0_0_30px_#7dff9a] cursor-pointer transition transform hover:scale-105 uppercase tracking-wider font-bold"
          >
            🚀 Launch Mothership // Fly Away →
          </button>
        </footer>
      </div>
    );
  }

  // ── 6. MOTHERSHIP FLY AWAY (DEPARTING PLANET) ───────────────────
  if (step === 'fly_away') {
    return (
      <div className="w-screen h-screen bg-void text-bone relative overflow-hidden flex flex-col items-center justify-center font-tech select-none">
        {/* Starfield backdrop */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#1e293b_0%,_#0b121e_60%,_#050811_100%)]">
          {[...Array(60)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-bone rounded-full animate-pulse"
              style={{
                top: `${(i * 19) % 100}%`,
                left: `${(i * 31) % 100}%`,
                width: i % 4 === 0 ? '3px' : '1.5px',
                height: i % 4 === 0 ? '3px' : '1.5px',
                animationDuration: `${(i % 3) + 1.5}s`
              }}
            />
          ))}
        </div>

        {/* CRT Scanline */}
        <div className="absolute inset-0 crt-scanlines pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center space-y-6 p-6 max-w-lg">
          {/* Mothership Graphic based on images.jpeg: Navy blue hull, gold trim, ruby canopy */}
          <div className="relative animate-bounce">
            <svg
              width="160"
              height="160"
              viewBox="0 0 160 160"
              className="drop-shadow-[0_0_35px_rgba(245,158,11,0.6)]"
            >
              {/* Twin thruster flames */}
              <ellipse cx="60" cy="140" rx="6" ry="18" fill="#ffb347" className="animate-pulse" />
              <ellipse cx="100" cy="140" rx="6" ry="18" fill="#ffb347" className="animate-pulse" />
              <ellipse cx="60" cy="135" rx="3" ry="10" fill="#fff" />
              <ellipse cx="100" cy="135" rx="3" ry="10" fill="#fff" />

              {/* Left Wing (Swept wing with gold trim) */}
              <polygon points="45,65 15,115 35,120 55,85" fill="#1e293b" stroke="#f59e0b" strokeWidth="3" />
              <circle cx="28" cy="115" r="4" fill="#ef4444" />

              {/* Right Wing (Swept wing with gold trim) */}
              <polygon points="115,65 145,115 125,120 105,85" fill="#1e293b" stroke="#f59e0b" strokeWidth="3" />
              <circle cx="132" cy="115" r="4" fill="#ef4444" />

              {/* Central Fuselage Hull */}
              <polygon points="80,15 110,75 105,125 55,125 50,75" fill="#172554" stroke="#f59e0b" strokeWidth="3.5" />

              {/* Ruby / Red Cockpit Canopy */}
              <ellipse cx="80" cy="65" rx="14" ry="22" fill="#ef4444" stroke="#b91c1c" strokeWidth="2" />
              <ellipse cx="78" cy="58" rx="5" ry="8" fill="rgba(255,255,255,0.6)" />

              {/* Engine Exhaust Nodes */}
              <rect x="54" y="122" width="12" height="6" fill="#334155" />
              <rect x="94" y="122" width="12" height="6" fill="#334155" />
            </svg>
          </div>

          <div className="space-y-2">
            <span className="font-pixel text-[10px] text-amber uppercase tracking-widest block">
              MOTHERSHIP DEPARTING PLANET
            </span>
            <h1 className="font-pixel text-base md:text-lg text-phosphor crt-text-phosphor">
              WARP ENGINES ENGAGED // FLYING AWAY
            </h1>
            <p className="font-vt text-xl text-bone">
              {MOCK_PUZZLE.name} is safely aboard. Accelerating out of {MOCK_DESTINATION.name}.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setStep('done')}
            className="font-pixel text-xs bg-phosphor hover:bg-amber text-void border-2 border-bone px-6 py-3 rounded-lg shadow-lg cursor-pointer transition uppercase"
          >
            Arrive at Deep Space Orbit →
          </button>
        </div>
      </div>
    );
  }

  // ── 7. DONE ────────────────────────────────────────────────────
  return (
    <div className="w-screen h-screen bg-void flex flex-col items-center justify-center gap-6 p-8 text-center font-tech">
      <div className="bg-screen border-4 border-phosphor p-8 rounded-2xl max-w-lg shadow-2xl crt-screen space-y-4">
        <p className="font-pixel text-sm text-phosphor crt-text-phosphor leading-relaxed">
          🏆 EXPEDITION COMPLETE!
        </p>
        <p className="font-vt text-2xl text-bone leading-snug">
          You pinged {MOCK_PUZZLE.name}, explored the surface, towed it back to the mothership, verified its telemetry on the onboard terminal, and flew away into deep space!
        </p>
        <button
          type="button"
          onClick={handleReset}
          className="font-pixel text-xs bg-rust hover:bg-amber text-bone hover:text-void border-2 border-edge px-6 py-3 rounded-lg cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-amber uppercase"
        >
          Replay Journey &#x21bb;
        </button>
      </div>
    </div>
  );
}
