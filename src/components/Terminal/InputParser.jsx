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

export function getHint(puzzleData, stepIndex = 0) {
  const { main, step, total } = expectedCommands(puzzleData, stepIndex)
  if (step?.hint) return step.hint
  if (stepIndex === 0 && puzzleData?.diagnostic_hint) {
    return `${puzzleData.diagnostic_hint} (Step 1 of ${total}: try "${main}")`
  }
  const prefix = total > 1 ? `Step ${stepIndex + 1} of ${total}: ` : ''
  return `${prefix}Hint: try "${main}"`
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

export function getHelpLines(puzzleData, stepIndex = 0) {
  const { main } = expectedCommands(puzzleData, stepIndex)
  return [
    line('Available commands:', 'dim'),
    line('  help               — show this list', 'info'),
    line('  ping [name]        — ping this craft', 'info'),
    line('  status             — show telemetry & mission stats', 'info'),
    line('  scan               — scan for subsystem faults', 'info'),
    line('  decode telemetry   — read archived science logs', 'info'),
    line('  traceroute         — trace signal path to Earth', 'info'),
    line(`  ${main.padEnd(19)}— execute recovery step`, 'success'),
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
    line(getHint(puzzleData), 'dim'),
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
        ...(getErrorLog(puzzleData) ? [line(getErrorLog(puzzleData), 'error')] : []),
        line(getHint(puzzleData, stepIndex), 'dim'),
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

  if (all.includes(input)) {
    const successText =
      step?.success ??
      `${puzzleData?.name ?? 'Craft'} telemetry locked.`
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
      line(close ? `Close — did you mean "${main}"?` : getHint(puzzleData, stepIndex), 'dim'),
      line('Type "help" to see all commands.', 'dim'),
    ],
  }
}
