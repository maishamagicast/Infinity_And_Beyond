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

export function getLocation(puzzleData) {
  return puzzleData?.location ?? puzzleData?.body ?? puzzleData?.coordinates ?? 'Unknown'
}

export function getSummary(puzzleData) {
  return (
    puzzleData?.science_payload?.story ??
    puzzleData?.fact ??
    puzzleData?.payload?.fact ??
    puzzleData?.summary ??
    puzzleData?.science_payload?.headline ??
    'No summary yet.'
  )
}

export function getErrorLog(puzzleData) {
  return (
    puzzleData?.primary_error ??
    puzzleData?.telemetry_snippet ??
    puzzleData?.error_log ??
    puzzleData?.telemetry ??
    null
  )
}

export function getPuzzleSteps(puzzleData) {
  const p = puzzleData?.puzzle_steps ?? puzzleData?.puzzle
  if (Array.isArray(p)) {
    return p.map((s) => {
      const accepted = Array.isArray(s.accepted_commands) ? s.accepted_commands : []
      return {
        step: s.step,
        command: accepted[0] ?? s.command ?? s.answer ?? s.code,
        aliases: accepted.length > 0 ? accepted.slice(1) : (s.aliases ?? []),
        hint: s.hint,
        success: s.output ?? s.success,
      }
    })
  }
  if (p && typeof p === 'object') {
    return [{
      step: p.step ?? 1,
      command: p.command ?? p.answer ?? p.code,
      aliases: p.aliases ?? [],
      hint: p.hint,
      success: p.output ?? p.success,
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
    return { main, all: [...new Set([main, ...aliases])], step, total: steps.length }
  }
  return {
    main: DEFAULT_COMMAND,
    all: [DEFAULT_COMMAND, 'diagnostics', 'hack', 'recover'],
    step: null,
    total: 0,
  }
}

/**
 * Builds an ordered list of progressive hints for the active step:
 *   Index 0: Conceptual / diagnostic clue (non-spoiler)
 *   Index 1: Exact command syntax reveal
 */
export function getProgressiveHints(puzzleData, stepIndex = 0) {
  if (Array.isArray(puzzleData?.hints) && puzzleData.hints.length > 0) {
    return puzzleData.hints
  }

  const { main, step, total } = expectedCommands(puzzleData, stepIndex)
  const stepLabel = total > 1 ? `Step ${stepIndex + 1} of ${total}: ` : ''
  const hints = []

  // Tier 1: Conceptual nudge (avoid repeating Step 1's root diagnostic_hint on later steps)
  const hasDistinctStepHint = step?.hint && step.hint !== puzzleData?.diagnostic_hint
  if (hasDistinctStepHint) {
    hints.push(`${stepLabel}${step.hint}`)
  } else if (stepIndex === 0 && puzzleData?.diagnostic_hint) {
    hints.push(`${stepLabel}${puzzleData.diagnostic_hint}`)
  } else if (stepIndex > 0) {
    hints.push(`${stepLabel}Subsystem stabilized. Run "help" to review recovery syntax or reveal the next hint for the exact command.`)
  } else {
    hints.push(`${stepLabel}Establish an X-band carrier link with this spacecraft using a network ping.`)
  }

  // Tier 2: Explicit command reveal
  hints.push(`${stepLabel}Run "${main}" to execute this recovery step.`)

  return hints
}

/**
 * Non-spoiler diagnostic nudge used by terminal commands so exact answers
 * stay gated behind Progressive Hint Disclosure.
 */
export function getHint(puzzleData, stepIndex = 0) {
  return getProgressiveHints(puzzleData, stepIndex)[0]
}

export function getAsciiArt(puzzleData) {
  const id = String(puzzleData?.id ?? '').toLowerCase()
  const arts = {
    rover: [
      '      _______',
      '  ___/       \\___',
      ' |   O       O   |',
      ' |     ROVER     |',
      '  \\___ _______ ___/',
      '      |  |  |  |',
      '     _|  |  |  |_',
    ],
    viking: [
      '       __[===]__',
      '      /  VIKING \\',
      '     |  (o) (o)  |',
      '    /|___________|\\',
      '   /   |       |   \\',
      ' _/_  _|_     _|_  _\\_',
    ],
    probe: [
      '        \\  |  /',
      '         \\ | /',
      '      ____\\|/____',
      '     /     |     \\',
      '    |  DISH  *    |',
      '     \\___  |  ___/',
      '           |',
      '        --- ---',
    ],
  }
  if (id.includes('viking')) return arts.viking
  if (id.includes('voyager') || id.includes('pioneer')) return arts.probe
  return arts.rover
}

export function getHelpLines() {
  return [
    line('Available commands:', 'dim'),
    line('  help               — show this list', 'info'),
    line('  ping [name]        — ping this craft', 'info'),
    line('  status             — show telemetry & mission stats', 'info'),
    line('  scan               — scan for subsystem faults', 'info'),
    line('  decode telemetry   — read archived science logs', 'info'),
    line('  traceroute         — trace signal path to Earth', 'info'),
    line('  hint               — reveal next progressive hint', 'info'),
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
  const delay = puzzleData?.simulated_ping_ms
    ? `${puzzleData.simulated_ping_ms}ms (simulated DSN relay) // Distance: ${puzzleData.distance_km ?? 'Deep Space'}`
    : '12m 04s (one-way Mars light-time)'
  return [
    line(`Pinging ${puzzleData?.name ?? 'craft'} ...`, 'info'),
    line(`Reply: ${delay}`, 'success'),
    ...(puzzleData?.signal_strength ? [line(`Carrier strength: ${puzzleData.signal_strength}`, 'info')] : []),
    line('Run "scan" to inspect subsystem faults, or click "Need a hint?" below.', 'dim'),
  ]
}

function statusLines(puzzleData) {
  const payloadTitle = puzzleData?.science_payload?.headline ?? puzzleData?.payload?.title
  const lines = [
    line(`${puzzleData?.name ?? 'Unknown craft'}`, 'success'),
    line(`Location: ${getLocation(puzzleData)}`, 'info'),
    line(`Status: ${puzzleData?.status ?? 'Unknown'}`, 'info'),
  ]
  if (puzzleData?.active_years) lines.push(line(`Active Years: ${puzzleData.active_years} (${puzzleData.planned_duration ?? ''})`, 'info'))
  if (puzzleData?.distance_km) lines.push(line(`Distance: ${puzzleData.distance_km}`, 'info'))
  if (puzzleData?.signal_strength) lines.push(line(`Signal: ${puzzleData.signal_strength}`, 'info'))
  if (payloadTitle) lines.push(line(`Payload: ${payloadTitle}`, 'info'))
  if (getErrorLog(puzzleData)) lines.push(line(`Diagnostics: ${getErrorLog(puzzleData)}`, 'error'))
  return lines
}

export function parseCommand(rawInput, puzzleData, context = {}) {
  const stepIndex = context.step ?? 0
  const input = normalizeCommand(rawInput)
  if (!input) return { action: 'print', lines: [] }

  const { main, all, step, total } = expectedCommands(puzzleData, stepIndex)

  if (input === 'help' || input === '?' || input === 'commands') {
    return { action: 'print', lines: getHelpLines() }
  }
  if (input === 'clear' || input === 'cls') {
    return { action: 'clear', lines: [] }
  }
  if (input === 'exit' || input === 'quit' || input === 'disconnect' || input === 'close') {
    return { action: 'exit', lines: [line('Disconnecting from DSN…', 'dim')] }
  }
  if (input === 'hint' || input === 'need a hint') {
    return { action: 'hint', lines: [] }
  }
  if (input === 'hello' || input === 'hi' || input === 'hey') {
    return {
      action: 'print',
      lines: [
        line('DSN operator: Hello, cadet. This craft has been quiet for years.', 'info'),
        line('Try "scan" or "status" first, or click "Need a hint?" if you get stuck.', 'dim'),
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
        ...(getErrorLog(puzzleData) ? [line(getErrorLog(puzzleData), 'error')] : []),
        ...(stepIndex === 0 && puzzleData?.diagnostic_hint
          ? [line(`Diagnostic assessment: ${puzzleData.diagnostic_hint}`, 'dim')]
          : [line('Click "Need a hint?" below if you need guidance on the recovery command.', 'dim')]),
      ],
    }
  }
  if (input === 'decode telemetry' || input === 'telemetry' || input === 'decode' || input === 'read telemetry') {
    const payload = puzzleData?.science_payload ?? puzzleData?.payload
    const headline = payload?.headline ?? payload?.title
    return {
      action: 'print',
      lines: [
        line('— Last telemetry —', 'dim'),
        ...(headline ? [line(`Payload: ${headline}`, 'info')] : []),
        line(getSummary(puzzleData), 'info'),
        ...(getErrorLog(puzzleData) ? [line(`Log: ${getErrorLog(puzzleData)}`, 'error')] : []),
        line('Run "scan" for fault diagnostics, or click "Need a hint?" below.', 'dim'),
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

  if (all.includes(input)) {
    const successText =
      step?.success ??
      `${puzzleData?.name ?? 'Craft'} telemetry locked.`
    if (total > 1 && stepIndex < total - 1) {
      return {
        action: 'progress',
        nextStep: stepIndex + 1,
        lines: [
          line(successText, 'success'),
          line(`Step ${stepIndex + 1} of ${total} complete. Ready for next recovery command.`, 'dim'),
        ],
      }
    }
    const payload = puzzleData?.science_payload ?? puzzleData?.payload
    const headline = payload?.headline ?? payload?.title
    return {
      action: 'solve',
      lines: [
        ...getAsciiArt(puzzleData).map((t) => line(t, 'success')),
        line('— DATA RECOVERED —', 'success'),
        line(successText, 'success'),
        ...(headline ? [line(`Discovery: ${headline}`, 'info')] : []),
        line(getSummary(puzzleData), 'info'),
        line('Press Disconnect (or type exit) to return to base.', 'dim'),
      ],
    }
  }

  const close = all.some((cmd) => cmd.includes(input) || input.includes(cmd))
  return {
    action: 'print',
    lines: [
      line(`Unknown command: "${rawInput.trim()}"`, 'error'),
      line(
        close
          ? 'Close — check your command syntax or click "Need a hint?" below.'
          : 'Try "scan", "status", or "help" — or click "Need a hint?" below.',
        'dim'
      ),
    ],
  }
}
