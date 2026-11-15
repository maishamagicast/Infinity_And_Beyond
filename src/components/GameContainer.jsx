import { useEffect, useRef } from 'react'

const configModules = import.meta.glob('../game/config.js')

export default function GameContainer({ paused = false }) {
  const mountRef = useRef(null)
  const gameRef = useRef(null)
  const hasGame = Object.keys(configModules).length > 0

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

  useEffect(() => {
    const game = gameRef.current
    if (!game) return
    const kb = game.input?.keyboard
    if (kb) {
      kb.enabled = !paused
      kb.preventDefault = !paused
    }
    game.scene?.getScenes(false).forEach((s) => (paused ? s.scene.pause() : s.scene.resume()))
  }, [paused])

  if (!hasGame) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-rust-900 font-term text-2xl text-dust">
        <p>Phaser canvas not found (src/game/config.js).</p>
        <button
          className="border-2 border-phosphor px-4 py-2 font-pixel text-xs text-phosphor hover:bg-phosphor hover:text-void focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber"
          onClick={() => window.dispatchEvent(new CustomEvent('TRIGGER_TERMINAL', { detail: { id: 'mer_a_spirit' } }))}
        >
          Fake the E key on Spirit
        </button>
      </div>
    )
  }
  return <div ref={mountRef} className="h-full w-full" />
}