import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DsnConsole from './components/Hub/DsnConsole';
import GameContainer from './components/GameContainer';
import CliOverlay from './components/Terminal/CliOverlay';
import rawHardware from './data/hardware.json';
import LobbyAudioController from './lobbyAudioController';
const STORAGE_KEY = 'abnf.recovered.v1';

/**
 * Normalizes hardware data from hardware.json
 * handles surface_targets and dsn_remote_targets
 */
function normalizeHardware(raw) {
  const list = [];

  if (raw?.surface_targets && typeof raw.surface_targets === 'object') {
    for (const [id, target] of Object.entries(raw.surface_targets)) {
      list.push({
        ...target,
        id: target.id || id,
        remote: false,
      });
    }
  }

  if (raw?.dsn_remote_targets && typeof raw.dsn_remote_targets === 'object') {
    for (const [id, target] of Object.entries(raw.dsn_remote_targets)) {
      list.push({
        ...target,
        id: target.id || id,
        remote: true,
      });
    }
  }

  if (list.length === 0) {
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'object' && raw !== null) {
      for (const [id, target] of Object.entries(raw)) {
        if (!id.startsWith('_')) {
          list.push({ ...target, id: target.id || id });
        }
      }
    }
  }

  return list;
}

/**
 * Formats a hardware entry so CliOverlay and Inputparser get
 * consistent fields for both multi-step surface rovers and remote DSN probes.
 */
function formatPuzzleData(target) {
  if (!target) return null;

  const steps = (target.puzzle_steps || target.puzzle || []).map((s) => ({
    step: s.step,
    command: s.command ?? s.accepted_commands?.[0] ?? s.answer ?? s.code,
    aliases: s.aliases ?? (s.accepted_commands?.slice(1) || []),
    hint: s.hint ?? target.diagnostic_hint,
    success: s.output ?? s.success,
  }));

  return {
    ...target,
    error_log: target.primary_error ?? target.error_log ?? target.telemetry_snippet,
    payload: target.science_payload ?? target.payload,
    puzzle:
      steps.length > 0
        ? steps
        : [
            {
              step: 1,
              command: `ping ${target.id}`,
              aliases: ['ping', 'connect', 'diagnostics', 'recover'],
              hint: target.diagnostic_hint || `Try pinging ${target.id}`,
              success: `${target.name} telemetry restored. Science data verified!`,
            },
          ],
  };
}

const loadRecovered = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
};

const saveRecovered = (set) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    // Ignore private browsing storage errors
  }
};

export default function App() {
  const hardware = useMemo(() => normalizeHardware(rawHardware), []);
  const byId = useMemo(() => new Map(hardware.map((h) => [h.id, h])), [hardware]);

  const [view, setView] = useState('hub');
  const [activeId, setActiveId] = useState(null);
  const [recovered, setRecovered] = useState(loadRecovered);

  useEffect(() => {
    saveRecovered(recovered);
  }, [recovered]);

  const openTerminal = useCallback(
    (id) => {
      if (!byId.has(id)) {
        console.warn(`[App] Unknown hardware id "${id}". Check hardware.json.`);
        window.dispatchEvent(new Event('TERMINAL_CLOSED'));
        return;
      }
      setActiveId((current) => current ?? id);
    },
    [byId]
  );

  const closeTerminal = useCallback(() => {
    setActiveId(null);
    window.dispatchEvent(new Event('TERMINAL_CLOSED'));
  }, []);

  useEffect(() => {
    const handleTrigger = (e) => {
      const id = e.detail?.id;
      if (id) {
        openTerminal(id);
      }
    };

    window.addEventListener('TRIGGER_TERMINAL', handleTrigger);
    return () => window.removeEventListener('TRIGGER_TERMINAL', handleTrigger);
  }, [openTerminal]);

  useEffect(() => {
    if (!activeId) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeTerminal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeId, closeTerminal]);

  const handleSolve = useCallback((id) => {
    setRecovered((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    window.dispatchEvent(new CustomEvent('HARDWARE_HACKED', { detail: { id } }));
    window.dispatchEvent(new CustomEvent('HARDWARE_RECOVERED', { detail: { id } }));
  }, []);

  const resetProgress = useCallback(() => {
    setRecovered(new Set());
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const activeHardware = activeId ? byId.get(activeId) : null;
  const activePuzzleData = useMemo(() => formatPuzzleData(activeHardware), [activeHardware]);

  const surfaceTargets = useMemo(() => hardware.filter((h) => !h.remote), [hardware]);
  const surfaceRecoveredCount = useMemo(
    () => surfaceTargets.filter((h) => recovered.has(h.id)).length,
    [surfaceTargets, recovered]
  );

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-void font-tech text-bone">
      <LobbyAudioController />
      {view === 'hub' && (
        <DsnConsole
          hardware={hardware}
          recovered={recovered}
          onLaunch={() => setView('game')}
          onConnect={openTerminal}
          onReset={resetProgress}
        />
      )}

      {view === 'game' && (
        <GameContainer
          paused={Boolean(activeId)}
          onBackToBase={() => setView('hub')}
          recoveredCount={surfaceRecoveredCount}
          totalSurfaceCount={surfaceTargets.length}
        />
      )}

      {activeId && activePuzzleData && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Terminal: ${activePuzzleData.name}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 select-none"
        >
          <CliOverlay
            key={activeId}
            puzzleData={activePuzzleData}
            onSolve={() => handleSolve(activeId)}
            onClose={closeTerminal}
          />
        </div>
      )}
    </div>
  );
}