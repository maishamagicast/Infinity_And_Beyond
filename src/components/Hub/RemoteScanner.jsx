export default function RemoteScanner({ hardware, recovered, onConnect }) {
  return (
    <section aria-labelledby="scanner-title" className="flex min-h-0 flex-col border-2 border-phosphor-dim bg-black/70 p-4">
      <h2 id="scanner-title" className="glow mb-3 font-pixel text-xs text-phosphor">
        Signal scanner
      </h2>
      <ul className="flex-1 space-y-2 overflow-y-auto pr-1 font-term text-xl text-phosphor">
        {hardware.map((hw) => {
          const done = recovered.has(hw.id)
          return (
            <li key={hw.id} className="flex items-center gap-3 border-b border-phosphor-dim/40 pb-2">
              <span
                aria-hidden="true"
                className={`h-3 w-3 shrink-0 ${done ? 'bg-phosphor' : 'bg-amber motion-safe:animate-blink'}`}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate">{hw.name}</span>
                <span className="block truncate text-base text-phosphor-dim">
                  {done ? 'Data recovered' : hw.body ?? hw.location ?? 'Signal faint'}
                </span>
              </span>
              {hw.remote && !done && (
                <button
                  onClick={() => onConnect(hw.id)}
                  className="shrink-0 border-2 border-phosphor px-2 py-1 font-pixel text-[10px] hover:bg-phosphor hover:text-void focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
                >
                  Ping
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}