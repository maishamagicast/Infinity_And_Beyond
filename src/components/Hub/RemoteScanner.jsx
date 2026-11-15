import React, { useState } from 'react';

/**
 * RemoteScanner — Deep Space Network Signal Scanner
 * Lists all target hardware (surface rovers and deep-space probes)
 * with real-time status indicators and terminal connection actions.
 */
export default function RemoteScanner({ hardware = [], recovered = new Set(), onConnect, onViewPayload }) {
  const [filter, setFilter] = useState('all'); // 'all' | 'surface' | 'remote'

  const filteredHardware = hardware.filter((hw) => {
    if (filter === 'surface') return !hw.remote;
    if (filter === 'remote') return hw.remote;
    return true;
  });

  return (
    <section
      aria-labelledby="scanner-title"
      className="flex flex-col h-full bg-black/85 border-2 border-edge rounded-lg p-3 sm:p-4 shadow-xl select-none"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-edge/60 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-phosphor animate-pulse" />
          <h2 id="scanner-title" className="font-pixel text-xs text-phosphor glow">
            DSN SIGNAL SCANNER
          </h2>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 font-pixel text-[9px]">
          <button
            onClick={() => setFilter('all')}
            className={`px-2 py-1 rounded transition-colors cursor-pointer ${
              filter === 'all'
                ? 'bg-phosphor text-void'
                : 'text-dim hover:text-bone bg-panel/60 border border-edge/60'
            }`}
          >
            ALL ({hardware.length})
          </button>
          <button
            onClick={() => setFilter('surface')}
            className={`px-2 py-1 rounded transition-colors cursor-pointer ${
              filter === 'surface'
                ? 'bg-phosphor text-void'
                : 'text-dim hover:text-bone bg-panel/60 border border-edge/60'
            }`}
          >
            SURFACE
          </button>
          <button
            onClick={() => setFilter('remote')}
            className={`px-2 py-1 rounded transition-colors cursor-pointer ${
              filter === 'remote'
                ? 'bg-phosphor text-void'
                : 'text-dim hover:text-bone bg-panel/60 border border-edge/60'
            }`}
          >
            DEEP SPACE
          </button>
        </div>
      </div>

      {/* Hardware Target List */}
      <ul className="flex-1 overflow-y-auto space-y-2 pr-1 font-tech divide-y divide-edge/40">
        {filteredHardware.map((hw) => {
          const isDone = recovered.has(hw.id);
          const location = hw.location || hw.distance_km || 'Mars Surface';
          const status = hw.status || 'UNKNOWN';

          return (
            <li
              key={hw.id}
              className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-white/5 p-2 rounded transition-colors"
            >
              <div className="flex items-start gap-3 min-w-0">
                <span
                  aria-hidden="true"
                  className={`w-3 h-3 rounded-full shrink-0 mt-1 ${
                    isDone
                      ? 'bg-phosphor shadow-[0_0_8px_rgba(93,255,126,0.8)]'
                      : 'bg-amber animate-blink shadow-[0_0_8px_rgba(255,179,71,0.8)]'
                  }`}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-pixel text-[11px] text-bone font-bold truncate">
                      {hw.name}
                    </span>
                    <span
                      className={`font-pixel text-[8px] px-1.5 py-0.5 rounded ${
                        isDone
                          ? 'bg-phosphor/20 text-phosphor border border-phosphor/40'
                          : 'bg-amber/20 text-amber border border-amber/40'
                      }`}
                    >
                      {isDone ? 'DATA RECOVERED' : status}
                    </span>
                  </div>
                  <div className="text-xs text-dim truncate mt-0.5">
                    📍 {location} {hw.agency ? `· ${hw.agency}` : ''}
                  </div>
                  <div className="font-term text-base text-bone/80 truncate">
                    {isDone
                      ? `Payload unlocked: ${hw.science_payload?.headline || 'Science archive verified'}`
                      : hw.primary_error || hw.telemetry_snippet || hw.diagnostic_hint || 'Awaiting telemetry connection'}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center font-pixel text-[9px]">
                {isDone ? (
                  <button
                    onClick={() => onViewPayload?.(hw)}
                    className="border border-phosphor bg-phosphor/10 hover:bg-phosphor hover:text-void text-phosphor px-2.5 py-1.5 rounded cursor-pointer transition-colors"
                  >
                    VIEW ARCHIVE
                  </button>
                ) : (
                  <button
                    onClick={() => onConnect?.(hw.id)}
                    className="border-2 border-amber bg-amber/15 hover:bg-amber hover:text-void text-amber px-2.5 py-1.5 rounded cursor-pointer transition-colors shadow-sm focus:outline-none focus:ring-1 focus:ring-amber"
                  >
                    {hw.remote ? 'UPLINK PING' : 'CONNECT CLI'}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}