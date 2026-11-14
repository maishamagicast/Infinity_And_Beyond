import { useEffect, useRef } from 'react'

// Dev 1 contract: src/game/config.js must export
//   createGame(parentElement: HTMLElement) => Phaser.Game
// Until that file exists, a placeholder with a fake trigger button is shown.
const configModules = import.meta.glob('../game/config.js')

export default function GameContainer({ paused = false }) {
  const mountRef = useRef(null)
  const gameRef = useRef(null)
  const hasGame = Object.keys(configModules).length > 0

  // Create / destroy Phaser. The cleanup keeps React StrictMode (double-mount) from spawning two canvases.
  useEffect(() => {
    if (!hasGame) return
    let cancelled = false
    configModules['../game/config.js']().then((mod) => {
      if (cancelled || !mountRef.current) return
      gameRef.current = mod.createGame(mountRef.current)
    })
    return () => {
      cancelled = true
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [hasGame])

  // While the terminal is open, stop Phaser from stealing keystrokes (WASD, E) and freeze the scene.
  useEffect(() => {
    const game = gameRef.current
    if (!game) return
    const kb = game.input?.keyboard
    if (kb) {
      kb.enabled = !paused
      kb.preventDefault = !paused
    }
    game.scene?.getScenes(true).forEach((s) => (paused ? s.scene.pause() : s.scene.resume()))
  }, [paused])

  if (!hasGame) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-rust-900 font-term text-2xl text-dust">
        <p>Phaser canvas not found (src/game/config.js).</p>
        <button
          className="border-2 border-phosphor px-4 py-2 font-pixel text-xs text-phosphor hover:bg-phosphor hover:text-void focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber"
          onClick={() => window.dispatchEvent(new CustomEvent('TRIGGER_TERMINAL', { detail: { id: 'spirit' } }))}
        >
          Fake the E key on Spirit
        </button>
      </div>
    )
  }
  return <div ref={mountRef} className="h-full w-full" />
}
