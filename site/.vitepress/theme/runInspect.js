// What the Run button prints: values formatted like Node.js prints them in the
// terminal (one line per console.log), and a `console` object for the examples.
// Used by RunCode.vue; plain JavaScript, so it can also be tested with Node.js.

const MAX_DEPTH = 3          // deeper objects and arrays print as [Object] / [Array]

function quote(s) {
  if (!s.includes("'")) return `'${s}'`
  if (!s.includes('"')) return `"${s}"`
  if (!s.includes('`')) return `\`${s}\``
  return `'${s.replace(/'/g, "\\'")}'`
}

const keyText = k => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : quote(k))

function prefixOf(value) {
  const proto = Object.getPrototypeOf(value)
  if (proto === null) return '[Object: null prototype] '
  const name = proto.constructor && proto.constructor.name
  return name && name !== 'Object' ? name + ' ' : ''
}

export function inspect(value, { nested = false, depth = 0, maxDepth = MAX_DEPTH, seen = [] } = {}) {
  const inner = v => inspect(v, { nested: true, depth: depth + 1, maxDepth, seen: [...seen, value] })
  switch (typeof value) {
    case 'string': return nested ? quote(value) : value
    case 'bigint': return `${value}n`
    case 'number': return Object.is(value, -0) ? '-0' : String(value)
    case 'symbol': return value.toString()
    case 'function': {
      if (/^class\b/.test(Function.prototype.toString.call(value))) return `[class ${value.name || '(anonymous)'}]`
      return value.name ? `[Function: ${value.name}]` : '[Function (anonymous)]'
    }
    case 'undefined': return 'undefined'
    case 'boolean': return String(value)
  }
  if (value === null) return 'null'
  if (seen.includes(value)) return '[Circular]'
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? 'Invalid Date' : value.toISOString()
  if (value instanceof RegExp) return String(value)
  if (value instanceof Error) return `${value.name}: ${value.message}`
  if (typeof Promise !== 'undefined' && value instanceof Promise) return 'Promise { <pending> }'
  if (value instanceof Map) {
    if (depth > maxDepth) return '[Map]'
    if (value.size === 0) return 'Map(0) {}'
    return `Map(${value.size}) { ${[...value].map(([k, v]) => `${inner(k)} => ${inner(v)}`).join(', ')} }`
  }
  if (value instanceof Set) {
    if (depth > maxDepth) return '[Set]'
    if (value.size === 0) return 'Set(0) {}'
    return `Set(${value.size}) { ${[...value].map(inner).join(', ')} }`
  }
  if (Array.isArray(value)) {
    if (depth > maxDepth) return '[Array]'
    if (value.length === 0) return '[]'
    const parts = []
    let holes = 0
    const flush = () => {
      if (holes) parts.push(`<${holes} empty item${holes > 1 ? 's' : ''}>`)
      holes = 0
    }
    for (let i = 0; i < value.length; i++) {
      if (!(i in value)) { holes++; continue }
      flush()
      parts.push(inner(value[i]))
    }
    flush()
    const extra = Object.keys(value).filter(k => !/^\d+$/.test(k))
    for (const k of extra) parts.push(`${keyText(k)}: ${inner(value[k])}`)
    return `[ ${parts.join(', ')} ]`
  }
  const prefix = prefixOf(value)
  if (depth > maxDepth) return prefix ? `[${prefix.trim()}]` : '[Object]'
  const keys = Object.keys(value)
  if (keys.length === 0) return prefix + '{}'
  return `${prefix}{ ${keys.map(k => `${keyText(k)}: ${inner(value[k])}`).join(', ')} }`
}

// console.table: a box like Node.js draws, from an array or an object of rows;
// `only` (optional) is the list of columns to show
function table(data, only) {
  if (data === null || typeof data !== 'object') return inspect(data)
  if (data instanceof Map) {
    return box(['(iteration index)', 'Key', 'Values'],
      [...data].map(([k, v], i) => [String(i), inspect(k, { nested: true }), inspect(v, { nested: true })]))
  }
  const rows = Object.entries(data)
  const columns = []
  let hasValues = false
  for (const [, row] of rows) {
    if (row !== null && typeof row === 'object' && !Array.isArray(row)) {
      for (const k of Object.keys(row)) if (!columns.includes(k)) columns.push(k)
    } else if (Array.isArray(row)) {
      row.forEach((_, i) => { if (!columns.includes(String(i))) columns.push(String(i)) })
    } else hasValues = true
  }
  if (Array.isArray(only)) columns.splice(0, columns.length, ...only.map(String))
  const header = ['(index)', ...columns, ...(hasValues ? ['Values'] : [])]
  const body = rows.map(([index, row]) => {
    const cells = [String(index)]
    const isRecord = row !== null && typeof row === 'object'
    for (const c of columns) cells.push(isRecord && c in row ? inspect(row[c], { nested: true, depth: 1 }) : '')
    if (hasValues) cells.push(isRecord ? '' : inspect(row, { nested: true }))
    return cells
  })
  return box(header, body)
}

function box(header, body) {
  const widths = header.map((h, i) => Math.max(h.length, ...body.map(r => r[i].length)) + 2)
  const line = (l, m, r) => l + widths.map(w => '\u2500'.repeat(w)).join(m) + r
  const row = cells => '\u2502' + cells.map((c, i) => ` ${c.padEnd(widths[i] - 1)}`).join('\u2502') + '\u2502'
  return [
    line('\u250c', '\u252c', '\u2510'), row(header), line('\u251c', '\u253c', '\u2524'),
    ...body.map(row), line('\u2514', '\u2534', '\u2518')
  ].join('\n')
}

// A console for one run: every call adds { kind, text } through write().
export function makeConsole(write) {
  let indent = ''
  const counts = {}
  const timers = {}
  const out = kind => (...args) => {
    const text = args.map(a => inspect(a)).join(' ')
    write({ kind, text: indent ? text.replace(/^/gm, indent) : text })
  }
  const log = out('log')
  return {
    log,
    info: log,
    debug: log,
    warn: out('warn'),
    error: out('error'),
    trace: out('error'),
    dir(value, options = {}) {
      const maxDepth = options && options.depth === null ? Infinity : (options && options.depth) ?? MAX_DEPTH
      write({ kind: 'log', text: indent + inspect(value, { maxDepth }) })
    },
    table(data, only) { write({ kind: 'log', text: table(data, only).replace(/^/gm, indent) }) },
    group(...label) { if (label.length) log(...label); indent += '  ' },
    groupCollapsed(...label) { if (label.length) log(...label); indent += '  ' },
    groupEnd() { indent = indent.slice(2) },
    count(label = 'default') { counts[label] = (counts[label] || 0) + 1; log(`${label}: ${counts[label]}`) },
    countReset(label = 'default') { counts[label] = 0 },
    time(label = 'default') { timers[label] = performance.now() },
    timeEnd(label = 'default') {
      if (!(label in timers)) return
      log(`${label}: ${(performance.now() - timers[label]).toFixed(3)}ms`)
      delete timers[label]
    },
    timeLog(label = 'default', ...rest) {
      if (label in timers) log(`${label}: ${(performance.now() - timers[label]).toFixed(3)}ms`, ...rest)
    },
    assert(condition, ...rest) {
      if (!condition) out('error')(...(rest.length ? ['Assertion failed:', ...rest] : ['Assertion failed']))
    }
  }
}

// Runs the code of an example. `await` works at the top level, as in an ES module.
// Calls write() for every line, also for lines printed later (after await or a timer).
// Returns a promise that settles when the code has finished.
export function runExample(source, doc, write) {
  const AsyncFunction = (async () => {}).constructor
  const fakeConsole = makeConsole(write)
  const fail = err => write({ kind: 'error', text: err instanceof Error ? `${err.name}: ${err.message}` : `Uncaught ${inspect(err, { nested: true })}` })
  let fn
  try {
    fn = new AsyncFunction('console', 'doc', source)
  } catch (err) {
    fail(err)
    return Promise.resolve()
  }
  return fn(fakeConsole, doc).catch(fail)
}
