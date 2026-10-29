// Reads a JSON data file for the preview of DataFile.vue, in the browser:
//
//   parseJson(text) -> { value, error, errorLine }   error: the message of JSON.parse
//   pathStep(path, key, isIndex) -> 'doc.overview.model', 'doc.modules["12_4.20"]', 'doc.list[2]'
//   leaves(value, root) -> [{ path, kind, value }]   every value that is not an object
//                          or array (and every empty object or array), in file order
//   tables(value, root) -> [{ name, columns, rows: [{ n, path, value, cells }], rowLabel }]
//                          every array of objects (rows: the elements, n: the index)
//                          and every dictionary of objects (rows: the keys)
//   kindOf(value) -> 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null'
//
// A path is written the way the code reads the value: `.key` when the key is a valid
// name, `["key"]` when it is not (a dot, a space, a digit first), `[i]` for an index.

const NAME = /^[A-Za-z_$][\w$]*$/

export function kindOf(v) {
  return v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v
}

export const isContainer = v => v !== null && typeof v === 'object'

export function pathStep(path, key, isIndex) {
  if (isIndex) return `${path}[${key}]`
  return NAME.test(key) ? `${path}.${key}` : `${path}[${JSON.stringify(key)}]`
}

export function parseJson(text) {
  try {
    return { value: JSON.parse(text), error: '', errorLine: 0 }
  } catch (e) {
    return { value: undefined, error: e.message, errorLine: errorLine(e.message, text) }
  }
}

// the line of a JSON.parse error: "(line 5 column 3)" in Chrome and Node, "at line 5
// column 3" in Firefox, "at position 321" in older engines
function errorLine(message, text) {
  const line = message.match(/line (\d+) column \d+/)
  if (line) return Number(line[1])
  const pos = message.match(/position (\d+)/)
  if (pos) return text.slice(0, Number(pos[1])).split('\n').length
  return 0
}

export function leaves(value, root) {
  const out = []
  const walk = (v, path) => {
    if (isContainer(v)) {
      const entries = Array.isArray(v) ? v.map((x, i) => [i, x]) : Object.entries(v)
      if (!entries.length) out.push({ path, kind: kindOf(v), value: v })
      for (const [k, x] of entries) walk(x, pathStep(path, k, Array.isArray(v)))
    } else {
      out.push({ path, kind: kindOf(v), value: v })
    }
  }
  walk(value, root)
  return out
}

const isRecord = v => isContainer(v) && !Array.isArray(v)

export function tables(value, root) {
  const out = []
  const walk = (v, path) => {
    if (!isContainer(v)) return
    const entries = Array.isArray(v) ? v.map((x, i) => [i, x]) : Object.entries(v)
    const asTable = Array.isArray(v) ? entries.length > 0 : entries.length > 1
    if (asTable && entries.every(([, x]) => isRecord(x))) {
      const columns = []
      for (const [, x] of entries) for (const k of Object.keys(x)) if (!columns.includes(k)) columns.push(k)
      out.push({
        name: path,
        columns,
        rowLabel: Array.isArray(v) ? 'index' : 'key',
        rows: entries.map(([k, x]) => ({
          n: k,
          path: pathStep(path, k, Array.isArray(v)),
          value: x,
          cells: columns.map(c => (Object.hasOwn(x, c) ? x[c] : undefined))
        }))
      })
    }
    for (const [k, x] of entries) walk(x, pathStep(path, k, Array.isArray(v)))
  }
  walk(value, root)
  return out
}

// a value as short text: strings in quotes (so "42" and 42 look different), objects
// and arrays as compact JSON, cut at `max` characters
export function preview(v, max = 120) {
  const text = v === undefined ? '' : JSON.stringify(v)
  return text.length > max ? text.slice(0, max - 3) + '...' : text
}
