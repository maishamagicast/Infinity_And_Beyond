// Dev 2 — The Hacker: Terminal UI & CLI Logic
// InputParser.jsx — pure logic, no React, no JSX. v2, 2026-11-14.
// Updated for Dev 4's REAL hardware.json (found 2026-11-14 11:32):
//
//   {
//     "mer_a_spirit": {
//       "name": "Spirit Rover",
//       "location": "Gusev Crater",
//       "status": "OFFLINE_CRITICAL",
//       "error_log": "MAIN_POWER_BUS_UNREACHABLE",
//       "puzzle": [
//         { "step": 1, "command": "bypass solar",
//           "success": "Solar array bypassed. Emergency poweractive." }
//       ],
//       "payload": {
//         "title": "Carbonate Discovery",
//         "fact": "Proved this area was once a wet, non-acidic environment.",
//         "image": "/assets/payloads/spirit_carbonates.png"
//       }
//     }
//   }
//
// Differences from the mock / v1 assumption:
//   - id is "mer_a_spirit", not "spirit" — GameContainer's fake-E
//     button and Dev 1's Phaser code must dispatch that id.
//   - `puzzle` is an ARRAY of steps, not an object.
//   - fields are `location` (not `body`), `payload.fact` (not
//     `summary`), `error_log` (not `telemetry`).
// This parser accepts BOTH shapes: Dev 4's real one above, and the
// old mock / object-puzzle shape, so it works before and after
// Dev 4 adds more craft / steps.

export const DEFAULT_COMMAND = 'run diagnostics'

export function normalizeCommand(input) {
  return String(input ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function line(text, tone = 'info') {
  return { text, tone }
}

// --- Field mapping: real schema first, mock schema as fallback ---
export function getLocation(puzzleData) {
  return puzzleData?.body ?? puzzleData?.location ?? puzzleData?.coordinates ?? 'Unknown'
}
export function getSummary(puzzleData) {
  return (
    puzzleData?.summary ??
    puzzleData?.science_payload?.headline ??
    puzzleData?.science_payload?.story ??
    puzzleData?.fact ??
    puzzleData?.payload?.fact ??
    puzzleData?.payload?.title ??
    'No summary yet.'
  )
}
export function getErrorLog(puzzleData) {
  return (
    puzzleData?.telemetry ??
    puzzleData?.error_log ??
    puzzleData?.primary_error ??
    puzzleData?.telemetry_snippet ??
    null
  )
}

// --- Puzzle steps: array, object, or none ---
export function getPuzzleSteps(puzzleData) {
  const p = puzzleData?.puzzle || puzzleData?.puzzle_steps
  if (Array.isArray(p)) {
    return p.map((s) => ({
      step: s.step,
      command: s.command ?? s.accepted_commands?.[0] ?? s.answer ?? s.code,
      aliases: s.aliases ?? (s.accepted_commands?.slice(1) || []),
      hint: s.hint ?? puzzleData?.diagnostic_hint,
      success: s.success ?? s.output,
    }))
  }
  if (p && typeof p === 'object') {
    return [{
      step: p.step ?? 1,
      command: p.command ?? p.accepted_commands?.[0] ?? p.answer ?? p.code,
      aliases: p.aliases ?? (p.accepted_commands?.slice(1) || []),
      hint: p.hint ?? puzzleData?.diagnostic_hint,
      success: p.success ?? p.output,
    }]
  }
  return []
}

function expectedCommands(puzzleData, stepIndex = 0) {
  const steps = getPuzzleSteps(puzzleData)
  const step = steps[stepIndex]
  if (step?.command) {
    const main = normalizeCommand(step.command)
    const aliases = (step.aliases ?? []).map(normalizeCommand)
    // NOTE: no 'run diagnostics' fallback here on purpose.
    // When Dev 4 sets a real command ("bypass solar"), that IS
    // the answer — accepting the old fallback would cheat it.
    return { main, all: [...new Set([main, ...aliases])], step, total: steps.length }
  }
  return {
    main: DEFAULT_COMMAND,
    all: [DEFAULT_COMMAND, 'diagnostics', 'hack', 'recover'],
    step: null,
    total: 0,
  }
}

export function getHint(puzzleData, stepIndex = 0) {
  const { main, step, total } = expectedCommands(puzzleData, stepIndex)
  if (step?.hint) return step.hint
  const prefix = total > 1 ? `Step ${stepIndex + 1} of ${total}: ` : ''
  return `${prefix}Hint: try "${main}"`
}

export function getAsciiArt(puzzleData) {
  const id = String(puzzleData?.id ?? '').toLowerCase()
  const name = String(puzzleData?.name ?? '').toLowerCase()
  const isSpirit = id.includes('spirit') || id.includes('mer_a') || name.includes('spirit')
  const arts = {
    spirit: [
      '      _______',
      '  ___/       \\___',
      ' |   O       O   |',
      ' |     ROVER     |',
      '  \\___ _______ ___/',
      '      |  |  |  |',
      '     _|  |  |  |_',
    ],
    'voyager-1': [
      '        \\  |  /',
      '         \\ | /',
      '      ____\\|/____',
      '     /    |    \\',
      '    |  DISH  *  |',
      '     \\___ | ___/',
      '         |',
      '      --- | ---',
    ],
    'apollo-11': [
      '         /\\',
      '        /  \\',
      '       |    |',
      '      _|____|_',
      '     / |    | \\',
      '    /  |    |  \\',
      '   |   |    |   |',
    ],
  }
  if (id.includes('voyager')) return arts['voyager-1']
  if (id.includes('apollo')) return arts['apollo-11']
  if (isSpirit) return arts.spirit
  return [
    '      .--.',
    '     |    |',
    '  ___|    |___',
    ' |   SATELLITE  |',
    '  \\__|    |__/',
    '     |    |',
  ]
}

export function getHelpLines(puzzleData, stepIndex = 0) {
  const { main } = expectedCommands(puzzleData, stepIndex)
  return [
    line('Available commands:', 'dim'),
    line('  help               — show this list', 'info'),
    line('  ping [name]        — ping this craft (or another by id)', 'info'),
    line('  status             — show where it is and what it did', 'info'),
    line('  scan               — scan for a signal anomaly', 'info'),
    line('  decode telemetry   — read its last science data', 'info'),
    line('  traceroute         — trace the signal back to Earth', 'info'),
    line(`  ${main.padEnd(19)}— recover its data`, 'success'),
    line('  clear              — clear the screen', 'info'),
    line('  exit               — disconnect and return', 'info'),
  ]
}

function pingLines(puzzleData, arg) {
  const wanted = normalizeCommand(arg)
  const id = String(puzzleData?.id ?? '').toLowerCase()
  const name = String(puzzleData?.name ?? '').toLowerCase()
  if (wanted && wanted !== id && !name.includes(wanted) && wanted !== id.replace(/[^a-z0-9]/g, '')) {
    return [
      line(`No reply from "${arg}".`, 'error'),
      line(`This terminal is locked to ${puzzleData?.name ?? 'this craft'}.`, 'dim'),
      line(`Try: ping ${puzzleData?.id ?? ''}`, 'info'),
    ]
  }
  const delay = id.includes('voyager')
    ? '22h 14m (light-time)'
    : id.includes('apollo')
      ? '1.3s (light-time)'
      : '12m 04s (light-time)'
  return [
    line(`Pinging ${puzzleData?.name ?? 'craft'} ...`, 'info'),
    line(`Reply in ${delay}. Signal faint, but alive in the archive.`, 'success'),
    line(getHint(puzzleData), 'dim'),
  ]
}

function statusLines(puzzleData) {
  const lines = [
    line(`${puzzleData?.name ?? 'Unknown craft'}`, 'success'),
    line(`Location: ${getLocation(puzzleData)}`, 'info'),
    line(`Status: ${puzzleData?.status ?? 'Unknown'}`, 'info'),
    line(`Science: ${getSummary(puzzleData)}`, 'info'),
  ]
  if (puzzleData?.payload?.title) lines.push(line(`Payload: ${puzzleData.payload.title}`, 'info'))
  if (getErrorLog(puzzleData)) lines.push(line(`Error log: ${getErrorLog(puzzleData)}`, 'error'))
  if (puzzleData?.coordinates) lines.push(line(`Last known coordinates: ${puzzleData.coordinates}`, 'info'))
  return lines
}

/**
 * Parse one line of terminal input.
 * context.step is the current puzzle-step index (0-based); CliOverlay
 * keeps it and advances it on a 'progress' result.
 * Returns { action, lines, nextStep? } where action is:
 *   'print'    — append lines, stay in the terminal
 *   'clear'    — clear the screen
 *   'exit'     — CliOverlay should call onClose()
 *   'progress' — one puzzle step solved, more remain; CliOverlay
 *                should move to nextStep and NOT call onSolve() yet
 *   'solve'    — final puzzle step solved; CliOverlay should call
 *                onSolve() once and append lines.
 */
export function parseCommand(rawInput, puzzleData, context = {}) {
  const stepIndex = context.step ?? 0
  const input = normalizeCommand(rawInput)
  if (!input) return { action: 'print', lines: [] }

  const { main, all, step, total } = expectedCommands(puzzleData, stepIndex)

  if (input === 'help' || input === '?' || input === 'commands') {
    return { action: 'print', lines: getHelpLines(puzzleData, stepIndex) }
  }
  if (input === 'clear' || input === 'cls') {
    return { action: 'clear', lines: [] }
  }
  if (input === 'exit' || input === 'quit' || input === 'disconnect' || input === 'close') {
    return { action: 'exit', lines: [line('Disconnecting from DSN…', 'dim')] }
  }
  if (input === 'hello' || input === 'hi' || input === 'hey') {
    return {
      action: 'print',
      lines: [
        line('DSN operator: Hello, cadet. This craft has been quiet for years.', 'info'),
        line(getHint(puzzleData, stepIndex), 'dim'),
      ],
    }
  }
  if (input === 'status' || input === 'info' || input === 'who are you') {
    return { action: 'print', lines: statusLines(puzzleData) }
  }
  if (input === 'scan') {
    return {
      action: 'print',
      lines: [
        line('Scanning… anomaly found in the old data cache.', 'info'),
        line('One file is still readable. It needs a diagnostic run.', 'success'),
        line(getHint(puzzleData, stepIndex), 'dim'),
      ],
    }
  }
  if (input === 'decode telemetry' || input === 'telemetry' || input === 'decode' || input === 'read telemetry') {
    const payload = puzzleData?.payload
    return {
      action: 'print',
      lines: [
        line('— Last telemetry —', 'dim'),
        ...(payload?.title ? [line(`Payload: ${payload.title}`, 'info')] : []),
        line(payload?.fact ?? puzzleData?.summary ?? 'No telemetry on file.', 'info'),
        ...(getErrorLog(puzzleData) ? [line(`Error log: ${getErrorLog(puzzleData)}`, 'error')] : []),
        ...(payload?.image ? [line(`Image: ${payload.image}`, 'dim')] : []),
        ...(puzzleData?.coordinates ? [line(`Coordinates: ${puzzleData.coordinates}`, 'info')] : []),
        line('Telemetry read. The full archive still needs the puzzle command.', 'dim'),
        line(getHint(puzzleData, stepIndex), 'dim'),
      ],
    }
  }
  if (input === 'traceroute' || input.startsWith('traceroute ')) {
    return {
      action: 'print',
      lines: [
        line('traceroute to ' + (puzzleData?.id ?? 'craft'), 'dim'),
        line(' 1  Goldstone DSN, California', 'info'),
        line(' 2  Deep-space relay', 'info'),
        line(` 3  ${getLocation(puzzleData)}  *  *  (${puzzleData?.name ?? 'craft'})`, 'success'),
      ],
    }
  }
  if (input === 'ping' || input.startsWith('ping ')) {
    return { action: 'print', lines: pingLines(puzzleData, input.slice(4).trim()) }
  }

  // The solve command — exact match for the CURRENT step.
  if (all.includes(input)) {
    const successText =
      step?.success ??
      `${puzzleData?.name ?? 'Craft'} data recovered. ${getSummary(puzzleData)}`.trim()
    // More steps remain: progress, don't recover yet.
    if (total > 1 && stepIndex < total - 1) {
      const next = expectedCommands(puzzleData, stepIndex + 1)
      return {
        action: 'progress',
        nextStep: stepIndex + 1,
        lines: [
          line(successText, 'success'),
          line(`Step ${stepIndex + 1} of ${total} complete.`, 'dim'),
          line(`Next: try "${next.main}"`, 'info'),
        ],
      }
    }
    return {
      action: 'solve',
      lines: [
        ...getAsciiArt(puzzleData).map((t) => line(t, 'success')),
        line('— DATA RECOVERED —', 'success'),
        line(successText, 'success'),
        ...(puzzleData?.payload?.title ? [line(`Payload: ${puzzleData.payload.title}`, 'info')] : []),
        ...(puzzleData?.payload?.fact ? [line(puzzleData.payload.fact, 'info')] : []),
        ...(getErrorLog(puzzleData) && !puzzleData?.payload ? [line(getErrorLog(puzzleData), 'info')] : []),
        line('Press Disconnect (or type exit) to return to base.', 'dim'),
      ],
    }
  }

  // Unknown command — never punish, always point forward.
  const close = all.some((cmd) => cmd.includes(input) || input.includes(cmd))
  return {
    action: 'print',
    lines: [
      line(`Unknown command: "${rawInput.trim()}"`, 'error'),
      line(close ? `Close — did you mean "${main}"?` : getHint(puzzleData, stepIndex), 'dim'),
      line('Type "help" to see all commands.', 'dim'),
    ],
  }
}
