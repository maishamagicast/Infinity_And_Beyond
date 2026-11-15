// Stand-ins so you can run the app before Dev 2 / Dev 4 have pushed.
// App.jsx automatically prefers the real files when they exist.
import { useState } from 'react'

export const mockHardware = [
  { id: 'spirit', name: 'Spirit (MER-A)', body: 'Mars, Gusev Crater', status: 'Offline since 2010', summary: 'Found evidence of past water.' },
  { id: 'opportunity', name: 'Opportunity (MER-B)', body: 'Mars, Meridiani Planum', status: 'Offline since 2018', summary: 'Lasted 14 years on a 90-day mission.' },
  { id: 'apollo-11', name: 'Apollo 11 descent stage', body: 'Moon, Sea of Tranquility', status: 'Resting', summary: 'First crewed landing.' },
  { id: 'voyager-1', name: 'Voyager 1', body: 'Interstellar space', status: 'Still transmitting', remote: true, summary: 'Farthest human-made object.' },
]

export function MockTerminal({ puzzleData, onSolve, onClose }) {
  const [line, setLine] = useState('')
  const [log, setLog] = useState([`${puzzleData.name} // ${puzzleData.body ?? ''}`, 'Type "run diagnostics" to recover data.'])
  const submit = (e) => {
    e.preventDefault()
    const ok = line.trim() === 'run diagnostics'
    setLog((l) => [...l, `> ${line}`, ok ? 'Data recovered.' : 'Unknown command.'])
    if (ok) onSolve?.()
    setLine('')
  }
  return (
    <div className="w-full max-w-2xl border-2 border-phosphor bg-black p-6 font-term text-2xl text-phosphor">
      {log.map((l, i) => <p key={i}>{l}</p>)}
      <form onSubmit={submit} className="mt-4 flex gap-2">
        <span>&gt;</span>
        <input autoFocus value={line} onChange={(e) => setLine(e.target.value)} className="flex-1 bg-transparent outline-none" aria-label="Terminal command" />
      </form>
      <button onClick={onClose} className="mt-4 underline">Disconnect</button>
    </div>
  )
}
