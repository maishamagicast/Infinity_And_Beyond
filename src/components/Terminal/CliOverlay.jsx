import { useEffect, useRef, useState } from 'react'
import { parseCommand, getHint } from './Inputparser'

const TONE_CLASS = {
  info: 'text-phosphor',
  success: 'text-phosphor',
  error: 'text-amber',
  dim: 'text-phosphor-dim',
  echo: 'text-dust',
}

function bannerLines(puzzleData, step = 0) {
  return [
    { text: `DSN // ${puzzleData?.name ?? 'Unknown craft'}`, tone: 'success' },
    { text: `${puzzleData?.body ?? puzzleData?.location ?? ''}${puzzleData?.status ? ` — ${puzzleData.status}` : ''}`, tone: 'dim' },
    { text: 'Type "help" for commands. Type "exit" to disconnect.', tone: 'dim' },
    { text: getHint(puzzleData, step), tone: 'dim' },
  ]
}

export default function CliOverlay({ puzzleData, onSolve, onClose }) {
  const [lines, setLines] = useState(() => bannerLines(puzzleData))
  const [value, setValue] = useState('')
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [step, setStep] = useState(0) // current puzzle step; Dev 4's puzzle is an array
  const [solved, setSolved] = useState(false)
  const solvedRef = useRef(false)
  const inputRef = useRef(null)
  const logRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight })
  }, [lines])

  const submit = (e) => {
    e.preventDefault()
    const raw = value
    if (!raw.trim()) return
    setHistory((h) => [...h, raw])
    setHistoryIndex(-1)
    setValue('')

    const result = parseCommand(raw, puzzleData, { step })
    const echo = { text: `> ${raw}`, tone: 'echo' }

    if (result.action === 'clear') {
      setLines(bannerLines(puzzleData, step))
      return
    }
    if (result.action === 'exit') {
      onClose?.()
      return
    }
    if (result.action === 'progress') {
      setLines((prev) => [...prev, echo, ...result.lines])
      setStep(result.nextStep ?? step + 1)
      return
    }
    if (result.action === 'solve') {
      setLines((prev) => [...prev, echo, ...result.lines])
      if (!solvedRef.current) {
        solvedRef.current = true
        setSolved(true)
        onSolve?.()
      }
      return
    }
    setLines((prev) => [...prev, echo, ...result.lines])
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!history.length) return
      const next = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1)
      setHistoryIndex(next)
      setValue(history[next])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex === -1) return
      const next = historyIndex + 1
      if (next >= history.length) { setHistoryIndex(-1); setValue('') }
      else { setHistoryIndex(next); setValue(history[next]) }
    }
  }

  return (
    <div className="flex max-h-[90vh] w-full max-w-2xl flex-col border-2 border-phosphor bg-black p-4 font-term text-2xl text-phosphor shadow-[0_0_40px_rgba(93,255,126,0.25)] sm:p-6">
      <header className="mb-3 flex items-start justify-between gap-3 border-b border-phosphor-dim/40 pb-3">
        <div className="min-w-0">
          <p className="font-pixel text-[10px] leading-relaxed text-phosphor sm:text-xs">
            {puzzleData?.name ?? 'Unknown craft'}
          </p>
          <p className="mt-2 truncate text-lg text-phosphor-dim">
            {puzzleData?.body ?? puzzleData?.location ?? ''}{puzzleData?.status ? ` · ${puzzleData.status}` : ''}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Disconnect terminal"
          className="shrink-0 border-2 border-phosphor px-2 py-1 font-pixel text-[10px] hover:bg-phosphor hover:text-void focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber"
        >
          ✕
        </button>
      </header>

      {solved && (
        <p role="status" className="mb-3 border border-phosphor bg-phosphor/10 px-3 py-2 text-xl text-phosphor">
          ✓ Data recovered — this craft counts toward your mission log.
        </p>
      )}

      <div
        ref={logRef}
        aria-live="polite"
        className="min-h-56 flex-1 overflow-y-auto whitespace-pre-wrap break-words pr-1 leading-snug"
      >
        {lines.map((l, i) => (
          <p key={i} className={TONE_CLASS[l.tone] ?? TONE_CLASS.info}>{l.text}</p>
        ))}
      </div>

      <form onSubmit={submit} className="mt-4 flex items-center gap-2 border-t border-phosphor-dim/40 pt-3">
        <span aria-hidden="true" className="text-phosphor">&gt;</span>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={solved ? 'Data recovered — type exit to disconnect' : 'type a command…'}
          aria-label="Terminal command"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent text-phosphor placeholder:text-phosphor-dim/60 focus:outline-none"
        />
        <button
          type="submit"
          className="shrink-0 border-2 border-phosphor px-3 py-1 font-pixel text-[10px] hover:bg-phosphor hover:text-void focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber"
        >
          Run
        </button>
      </form>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-base text-phosphor-dim">
        <span>↑↓ history · Esc disconnects · try “help”</span>
        <button onClick={onClose} className="underline hover:text-phosphor focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber">
          Disconnect
        </button>
      </div>
    </div>
  )
}
