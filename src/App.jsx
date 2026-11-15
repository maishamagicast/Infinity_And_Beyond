import { useCallback, useEffect, useMemo, useState } from 'react'
import DsnConsole from './components/Hub/DsnConsole'
import GameContainer from './components/GameContainer'
import CliOverlay from './components/Terminal/CliOverlay'
import rawHardware from './data/hardware.json'

function normalize(raw) {
  if (Array.isArray(raw)) return raw
  if (raw?.surface_targets || raw?.dsn_remote_targets) {
    const surface = Object.entries(raw.surface_targets ?? {}).map(([id, v]) => ({
      id,
      remote: false,
      ...v,
    }))
    const remote = Object.entries(raw.dsn_remote_targets ?? {}).map(([id, v]) => ({
      id,
      remote: true,
      ...v,
    }))
    return [...surface, ...remote]
  }
  return Object.entries(raw ?? {})
    .filter(([key]) => !key.startsWith('_'))
    .map(([id, v]) => ({ id, ...v }))
}

const STORAGE_KEY = 'abnf.recovered.v1'
const loadRecovered = () => {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')) } catch { return new Set() }
}
const saveRecovered = (set) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...set])) } catch { /* private mode */ }
}

export default function App() {
  const hardware = useMemo(() => normalize(rawHardware), [])
  const byId = useMemo(() => new Map(hardware.map((h) => [h.id, h])), [hardware])

  const [view, setView] = useState('hub') // 'hub' | 'game'
  const [activeId, setActiveId] = useState(null)
  const [recovered, setRecovered] = useState(loadRecovered)

  useEffect(() => saveRecovered(recovered), [recovered])

  const openTerminal = useCallback(
    (id) => {
      if (!byId.has(id)) {
        console.warn(`[App] TRIGGER_TERMINAL for unknown hardware id "${id}". Check hardware.json.`)
        window.dispatchEvent(new Event('TERMINAL_CLOSED'))
        return
      }
      setActiveId((current) => current ?? id)
    },
    [byId],
  )

  const closeTerminal = useCallback(() => {
    setActiveId(null)
    window.dispatchEvent(new Event('TERMINAL_CLOSED'))
  }, [])

  useEffect(() => {
    const onTrigger = (e) => openTerminal(e.detail?.id)
    window.addEventListener('TRIGGER_TERMINAL', onTrigger)
    return () => window.removeEventListener('TRIGGER_TERMINAL', onTrigger)
  }, [openTerminal])

  useEffect(() => {
    if (!activeId) return
    const onKey = (e) => e.key === 'Escape' && closeTerminal()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeId, closeTerminal])

  const handleSolve = useCallback((id) => {
    setRecovered((prev) => new Set(prev).add(id))
    window.dispatchEvent(new CustomEvent('HARDWARE_RECOVERED', { detail: { id } }))
  }, [])

  const resetProgress = () => setRecovered(new Set())
  const active = activeId ? byId.get(activeId) : null

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-void">
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
        <>
          <GameContainer paused={Boolean(active)} />
          <div className="absolute left-3 top-3 z-40 flex items-center gap-3 bg-black/70 p-2 font-pixel text-[10px] text-phosphor">
            <button
              onClick={() => setView('hub')}
              className="border-2 border-phosphor px-2 py-1 hover:bg-phosphor hover:text-void focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber"
            >
              Back to base
            </button>
            <span>{recovered.size}/{hardware.length} recovered</span>
          </div>
        </>
      )}

      {active && (
        <div role="dialog" aria-modal="true" aria-label={`Terminal: ${active.name}`} className="absolute inset-0 z-50 flex items-center justify-center bg-void/90 p-4">
          <CliOverlay key={active.id} puzzleData={active} onSolve={() => handleSolve(active.id)} onClose={closeTerminal} />
        </div>
      )}
    </div>
  )
}