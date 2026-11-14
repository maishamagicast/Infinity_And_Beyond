import RemoteScanner from './RemoteScanner'

// Window onto the Martian surface. Swap the background for a dithered image from public/assets once Dev 4 has one.
function MarsWindow() {
  return (
    <div
      role="img"
      aria-label="View from the base: a large radio dish standing on a rust-colored Martian plain"
      className="relative mx-auto h-full min-h-40 w-full max-w-5xl overflow-hidden rounded-md border-4 border-rust-700 bg-gradient-to-b from-rust-700 via-rust-500 to-rust-300"
    >
      <div className="absolute bottom-0 left-[8%] h-2/3 w-1/2 bg-rust-700" style={{ clipPath: 'polygon(0 100%, 30% 25%, 42% 40%, 58% 8%, 100% 100%)' }} />
      <div className="absolute bottom-0 right-0 h-1/2 w-3/5 bg-rust-900/80" style={{ clipPath: 'polygon(0 100%, 35% 35%, 60% 55%, 85% 20%, 100% 100%)' }} />
      <div className="absolute inset-x-0 bottom-0 h-1/5 bg-rust-900" />
      <svg viewBox="0 0 64 64" shapeRendering="crispEdges" className="absolute bottom-[8%] right-[12%] h-2/3 max-h-64">
        <polygon points="8,20 40,6 54,30 24,48" fill="#cbb79f" />
        <polygon points="14,22 38,12 47,29 25,41" fill="#8c7a68" />
        <rect x="30" y="26" width="3" height="20" fill="#6b5a4a" />
        <rect x="22" y="46" width="22" height="3" fill="#6b5a4a" />
        <rect x="20" y="49" width="3" height="10" fill="#6b5a4a" />
        <rect x="41" y="49" width="3" height="10" fill="#6b5a4a" />
      </svg>
    </div>
  )
}

function ProgressBar({ done, total }) {
  return (
    <div role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label="Hardware recovered" className="flex gap-1">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`h-4 flex-1 border border-phosphor-dim ${i < done ? 'bg-phosphor' : 'bg-transparent'}`} />
      ))}
    </div>
  )
}

export default function DsnConsole({ hardware, recovered, onLaunch, onConnect, onReset }) {
  const total = hardware.length
  const done = recovered.size
  const finished = total > 0 && done === total

  return (
    <main className="relative flex h-full flex-col gap-4 bg-gradient-to-b from-rust-900 to-void p-4 text-dust scanlines">
      <header>
        <h1 className="font-pixel text-sm leading-relaxed text-dust sm:text-lg">Abandoned but not forgotten</h1>
        <p className="font-term text-xl text-dust/70">Deep Space Network, remote operations</p>
      </header>

      <div className="min-h-40 flex-1">
        <MarsWindow />
      </div>

      <div className="mx-auto grid h-64 w-full max-w-5xl grid-cols-1 gap-4 lg:h-72 lg:grid-cols-[1fr_2fr_1fr]">
        <section aria-labelledby="progress-title" className="flex flex-col justify-between border-2 border-phosphor-dim bg-black/70 p-4 text-phosphor">
          <div>
            <h2 id="progress-title" className="glow mb-3 font-pixel text-xs">Mission log</h2>
            <p className="mb-3 font-term text-xl">
              {finished ? 'Every craft has been heard from.' : `${done} of ${total} craft recovered`}
            </p>
            <ProgressBar done={done} total={total} />
          </div>
          {done > 0 && (
            <button onClick={onReset} className="self-start font-term text-base text-phosphor-dim underline hover:text-phosphor focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber">
              Reset progress
            </button>
          )}
        </section>

        <RemoteScanner hardware={hardware} recovered={recovered} onConnect={onConnect} />

        <section className="flex items-center justify-center border-2 border-phosphor-dim bg-black/70 p-4">
          <button
            onClick={onLaunch}
            className="w-full border-2 border-amber bg-amber/10 px-3 py-4 font-pixel text-xs leading-relaxed text-amber hover:bg-amber hover:text-void focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-phosphor"
          >
            {done > 0 ? 'Return to the surface' : 'Go to the surface'}
          </button>
        </section>
      </div>
    </main>
  )
}
