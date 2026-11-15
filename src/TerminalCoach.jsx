import React, { useState, useEffect } from 'react';

/**
 * TerminalCoach — terminal helper step
 * Props:
 *   puzzleData: { id, name, goal, commands, hints }
 *   onRun: function(cmdString) called when a command chip is tapped
 */
export default function TerminalCoach({ puzzleData, onRun }) {
  // One-time dismissible explainer state
  const [showExplainer, setShowExplainer] = useState(true);
  const [hintIndex, setHintIndex] = useState(0);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem('abandoned-terminal-intro');
      if (dismissed === 'true') {
        setShowExplainer(false);
      }
    } catch {
      // Ignore localStorage errors (e.g. private browsing or disabled storage)
    }
  }, []);

  const dismissExplainer = () => {
    setShowExplainer(false);
    try {
      localStorage.setItem('abandoned-terminal-intro', 'true');
    } catch {
      // Ignore
    }
  };

  const deviceName = puzzleData?.name || 'the device';
  const deviceId = puzzleData?.id || 'device';
  const missionGoal =
    puzzleData?.goal || `Wake up ${deviceName} and see what it learned.`;

  // Normalize commands list: can be strings or { cmd, label }
  const rawCommands = puzzleData?.commands;
  const commandList =
    Array.isArray(rawCommands) && rawCommands.length > 0
      ? rawCommands.map((c) => {
          if (typeof c === 'string') {
            return { cmd: c, label: `Run ${c}` };
          }
          return { cmd: c.cmd || `ping ${deviceId}`, label: c.label || 'Execute instruction' };
        })
      : [{ cmd: `ping ${deviceId}`, label: `Say hello to ${deviceName}` }];

  // Hints array
  const hints = Array.isArray(puzzleData?.hints) ? puzzleData.hints : [];

  const handleNextHint = () => {
    setHintIndex((prev) => prev + 1);
  };

  return (
    <div className="w-full bg-panel border-2 border-edge rounded-lg p-4 md:p-6 shadow-2xl font-tech select-none space-y-5">
      {/* 1. One-time dismissible explainer */}
      {showExplainer && (
        <div className="bg-screen/90 border-2 border-phosphor p-4 rounded-md shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 crt-screen">
          <p className="font-vt text-lg md:text-xl text-bone leading-relaxed">
            A terminal is a text window where you give a machine its orders. You don't have to type: tap a command below and it runs for you.
          </p>
          <button
            type="button"
            onClick={dismissExplainer}
            className="shrink-0 font-pixel text-[10px] bg-edge hover:bg-phosphor text-bone hover:text-void border border-bone px-3 py-1.5 rounded transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-phosphor active:translate-y-0.5"
            aria-label="Dismiss terminal intro explainer"
          >
            Got it [X]
          </button>
        </div>
      )}

      {/* 2. Your Mission Section */}
      <div className="space-y-1">
        <h3 className="font-pixel text-[10px] md:text-xs text-amber uppercase tracking-wider flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-amber rounded-full" />
          YOUR MISSION
        </h3>
        <p className="font-vt text-xl md:text-2xl text-bone leading-snug">
          {missionGoal}
        </p>
      </div>

      {/* 3. Tap a command to run it */}
      <div className="space-y-3">
        <h4 className="font-pixel text-[10px] text-dim uppercase tracking-wider">
          Tap a command to run it:
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {commandList.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                if (typeof onRun === 'function') {
                  onRun(item.cmd);
                }
              }}
              className="text-left bg-screen hover:bg-void border-2 border-edge hover:border-phosphor p-3 rounded-lg shadow transition focus:outline-none focus:ring-2 focus:ring-phosphor group cursor-pointer active:scale-[0.98]"
              aria-label={`Run command ${item.cmd}`}
            >
              {/* Green terminal chip */}
              <div className="font-pixel text-xs md:text-sm text-phosphor crt-text-phosphor tracking-wide group-hover:translate-x-1 transition-transform">
                &gt; {item.cmd}
              </div>
              {/* Plain-English label underneath */}
              <div className="font-vt text-base md:text-lg text-dim mt-1 group-hover:text-bone">
                {item.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Need a hint? Section */}
      <div className="pt-2 border-t border-edge/60 space-y-2">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleNextHint}
            disabled={hintIndex > hints.length}
            className="font-pixel text-[10px] text-amber hover:text-bone underline cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber disabled:opacity-50"
            aria-label="Need a hint?"
          >
            Need a hint? ?
          </button>

          {hintIndex > 0 && hintIndex <= hints.length && (
            <span className="font-pixel text-[9px] text-dim">
              Hint {hintIndex} of {hints.length}
            </span>
          )}
        </div>

        {/* Revealed Hints in Amber */}
        {hintIndex > 0 && (
          <div className="bg-void/80 border border-amber/50 p-3 rounded space-y-1.5 animate-fade-in">
            {hints.slice(0, hintIndex).map((hintText, hIdx) => (
              <p key={hIdx} className="font-vt text-lg text-amber crt-text-amber flex items-start gap-2">
                <span>•</span>
                <span>{hintText}</span>
              </p>
            ))}

            {hintIndex >= hints.length && (
              <p className="font-vt text-lg text-bone italic pt-1 border-t border-edge/40">
                That was the last hint. You can do this!
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
