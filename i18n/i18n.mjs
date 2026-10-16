// Translations of the course site: English Markdown -> gettext .po files -> translated pages.
//
//   site/**/*.md (English, the source)  --update-->  i18n/<lang>/**/*.po  (one file per page)
//   site/**/*.md + i18n/<lang>/*.po     --build--->  site/<lang>/**/*.md  (generated, git-ignored)
//
// The site config calls buildLocale() on every `npm run dev` / `npm run build`, so the
// translated pages always match the current English text and .po files. A segment
// without a translation (new, changed or fuzzy) shows the English text.
// Workflow and commands: i18n/README.md.

import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import { createMarkdownRenderer } from 'vitepress'

const ROOT = process.cwd() // the course root (Slides/), like the kit's config
const SITE = path.join(ROOT, 'site')
const PUBLIC = path.join(SITE, 'public')
const I18N = path.join(ROOT, 'i18n')
const posix = path.posix

// The languages besides English. Labels of the theme itself (not course content) are here.
export const LANGS = {
  bg: {
    label: 'Български',
    lang: 'bg',
    // default titles of boxes written without a title (`::: tip`)
    boxTitles: { tip: 'СЪВЕТ', info: 'ИНФОРМАЦИЯ', warning: 'ВНИМАНИЕ', danger: 'ОПАСНОСТ', details: 'Подробности' },
    partial: [
      '::: warning Преводът не е завършен',
      'Част от тази страница още не е преведена и е показана на английски.',
      ':::'
    ],
    theme: {
      outline: { level: [2, 2], label: 'На тази страница' },
      docFooter: { prev: 'Предишна', next: 'Следваща' },
      darkModeSwitchLabel: 'Тема',
      lightModeSwitchTitle: 'Светла тема',
      darkModeSwitchTitle: 'Тъмна тема',
      sidebarMenuLabel: 'Меню',
      returnToTopLabel: 'Към началото',
      langMenuLabel: 'Език',
      skipToContentLabel: 'Към съдържанието',
      notFound: {
        title: 'СТРАНИЦАТА НЕ Е НАМЕРЕНА',
        quote: 'Тази страница не съществува.',
        linkLabel: 'към началната страница',
        linkText: 'Към началото'
      }
    },
    search: {
      button: { buttonText: 'Търсене', buttonAriaLabel: 'Търсене' },
      modal: {
        displayDetails: 'Покажи подробности',
        resetButtonTitle: 'Изчисти',
        backButtonTitle: 'Затвори',
        noResultsText: 'Няма резултати за',
        footer: { selectText: 'избор', navigateText: 'навигация', closeText: 'затваряне' }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// .po files

function poUnescape(s) {
  return s.replace(/\\(.)/g, (m, c) => ({ n: '\n', t: '\t', r: '\r', '"': '"', '\\': '\\' })[c] ?? c)
}

function poEscape(s) {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\t/g, '\\t').replace(/\r/g, '\\r')
}

function poString(keyword, s) {
  if (!s.includes('\n')) return `${keyword} "${poEscape(s).replace(/\n/g, '\\n')}"`
  const parts = s.split(/(?<=\n)/)
  return [`${keyword} ""`, ...parts.map(p => `"${poEscape(p).replace(/\n/g, '\\n')}"`)].join('\n')
}

export function parsePo(text) {
  const entries = []
  let header = null
  let cur = null
  let field = null
  const finish = () => {
    if (!cur || cur.msgid == null) { cur = null; return }
    if (cur.msgid === '' && !cur.obsolete) header = cur
    else entries.push(cur)
    cur = null
  }
  const start = () => { cur = { comments: [], extracted: [], refs: [], flags: new Set(), previous: null, obsolete: false, msgid: null, msgstr: '' } }
  for (let raw of text.split(/\r?\n/)) {
    let line = raw.trim()
    if (!line) { finish(); field = null; continue }
    let obsolete = false
    if (line.startsWith('#~')) { obsolete = true; line = line.slice(2).trim(); if (!line) continue }
    if (!cur) start()
    if (obsolete) cur.obsolete = true
    if (line.startsWith('#|')) {
      const m = /^#\|\s*msgid\s+"(.*)"$/.exec(line)
      if (m) { cur.previous = poUnescape(m[1]); field = 'previous' } else {
        const c = /^#\|\s*"(.*)"$/.exec(line)
        if (c && field === 'previous') cur.previous += poUnescape(c[1])
      }
      continue
    }
    if (line.startsWith('#.')) { cur.extracted.push(line.slice(2).trim()); continue }
    if (line.startsWith('#:')) { cur.refs.push(...line.slice(2).trim().split(/\s+/).filter(Boolean)); continue }
    if (line.startsWith('#,')) { line.slice(2).split(',').map(f => f.trim()).filter(Boolean).forEach(f => cur.flags.add(f)); continue }
    if (line.startsWith('#')) { cur.comments.push(line.slice(1).replace(/^ /, '')); continue }
    let m = /^(msgctxt|msgid|msgid_plural|msgstr(?:\[0\])?)\s+"(.*)"$/.exec(line)
    if (m) {
      if ((m[1] === 'msgid' || m[1] === 'msgctxt') && cur.msgid != null && cur.msgid_done) { finish(); start(); if (obsolete) cur.obsolete = true }
      field = m[1].startsWith('msgstr') ? 'msgstr' : m[1]
      if (field === 'msgstr') cur.msgid_done = true
      if (field === 'msgid' || field === 'msgstr' || field === 'msgctxt') cur[field] = poUnescape(m[2])
      continue
    }
    m = /^"(.*)"$/.exec(line)
    if (m && field && field !== 'msgid_plural' && field !== 'previous') cur[field] = (cur[field] || '') + poUnescape(m[1])
  }
  finish()
  return { header, entries }
}

export function writePo({ headerFields, headerComments = [], entries }) {
  const out = []
  headerComments.forEach(c => out.push(`# ${c}`.trimEnd()))
  out.push('msgid ""')
  out.push('msgstr ""')
  for (const [k, v] of Object.entries(headerFields)) out.push(`"${poEscape(`${k}: ${v}`)}\\n"`)
  for (const e of entries) {
    out.push('')
    const pre = e.obsolete ? '#~ ' : ''
    e.comments.forEach(c => out.push(`# ${c}`.trimEnd()))
    e.extracted.forEach(c => out.push(`#. ${c}`))
    if (e.refs.length && !e.obsolete) out.push(`#: ${e.refs.join(' ')}`)
    if (e.flags.size) out.push(`#, ${[...e.flags].join(', ')}`)
    if (e.previous != null && !e.obsolete) out.push(poString('msgid', e.previous).split('\n').map(l => `#| ${l}`).join('\n'))
    out.push(poString('msgid', e.msgid).split('\n').map(l => pre + l).join('\n'))
    out.push(poString('msgstr', e.msgstr).split('\n').map(l => pre + l).join('\n'))
  }
  return out.join('\n') + '\n'
}

function headerMap(header) {
  const map = {}
  if (!header) return map
  for (const line of header.msgstr.split('\n')) {
    const i = line.indexOf(':')
    if (i > 0) map[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return map
}

const isFuzzy = e => e.flags.has('fuzzy')
const isDone = e => e.msgstr !== '' && !isFuzzy(e)

// ---------------------------------------------------------------------------
// Segmenting an English page

// VitePress keeps ONE markdown renderer per process, and whoever creates it first sets
// its options. withLocales() runs before the site build, so the renderer must be created
// with the site's own markdown options and base - otherwise the build reuses a renderer
// without them (no runnable `js run` blocks, no trainer notes).
let mdPromise
let mdOptions = {}
let mdBase = '/'
function markdown() {
  const quiet = { info() {}, warn() {}, error: console.error }
  mdPromise ??= createMarkdownRenderer(SITE, mdOptions, mdBase, quiet)
  return mdPromise
}

// Something to translate: at least one English word outside code, links, tags and attributes.
export function hasWords(text) {
  const rest = text
    .replace(/(`+)[\s\S]*?\1/g, ' ')
    .replace(/\]\([^)]*\)/g, ']')
    .replace(/\{[^}]*\}/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
  return /[A-Za-z]{2,}/.test(rest)
}

// Soft line breaks are spaces: a re-wrapped paragraph keeps its translation.
function oneLine(text) {
  return text.replace(/([^\n])\n/g, (m, c, i) => (c === '\\' || text.slice(i - 1, i + 1) === '  ' ? m : c + ' ')).trimEnd()
}

function splitFrontMatter(lines) {
  if (lines[0] !== '---') return 0
  const end = lines.indexOf('---', 1)
  return end > 0 ? end + 1 : 0
}

const FM_KEYS = /^(\s*(?:- )?)(title|description|name|text|tagline|details|alt):(\s*)(.*)$/

function yamlValue(raw) {
  const v = raw.trim()
  if (v.startsWith('"')) { try { return JSON.parse(v) } catch { return v } }
  if (v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1).replace(/''/g, "'")
  return v
}

function yamlString(s) {
  return /^[\s\-?:,[\]{}#&*!|>'"%@`]|: | #|\s$/.test(s) ? JSON.stringify(s) : s
}

function splitRow(line) {
  const m = /^(\s*)(.*?)\s*$/.exec(line)
  let body = m[2]
  if (body.startsWith('|')) body = body.slice(1)
  if (body.endsWith('|') && !body.endsWith('\\|')) body = body.slice(0, -1)
  const cells = []
  let cell = ''
  for (let i = 0; i < body.length; i++) {
    if (body[i] === '\\' && body[i + 1] === '|') { cell += '\\|'; i++; continue }
    if (body[i] === '|') { cells.push(cell.trim()); cell = ''; continue }
    cell += body[i]
  }
  cells.push(cell.trim())
  return { indent: m[1], cells }
}

// `::: trainer` blocks (and everything nested in them) are never translated.
function trainerLines(lines) {
  const skip = new Set()
  let depth = 0
  lines.forEach((line, i) => {
    if (depth === 0 && /^\s*:{3,}\s*trainer\b/.test(line)) depth = 1
    else if (depth > 0 && /^\s*:{3,}\s*\S/.test(line)) depth++
    else if (depth > 0 && /^\s*:{3,}\s*$/.test(line)) { depth--; skip.add(i); return }
    if (depth > 0) skip.add(i)
  })
  return skip
}

/**
 * Parse an English page into units. A unit replaces source lines [start, end) and holds
 * the strings to translate: { start, end, segments: [{ msgid, kind }], render(tr) }
 * where tr(msgid) returns the translation or null. Also returns the fenced code lines.
 */
export async function segmentPage(src) {
  const md = await markdown()
  const lines = src.split('\n')
  const fmEnd = splitFrontMatter(lines)
  const units = []
  const code = new Set()

  // front matter: user-visible strings only
  for (let i = 1; i < fmEnd - 1; i++) {
    const m = FM_KEYS.exec(lines[i])
    if (!m) continue
    const value = yamlValue(m[4])
    if (!value || !hasWords(value)) continue
    units.push({
      start: i, end: i + 1, segments: [{ msgid: value, kind: `front matter: ${m[2]}` }],
      render: tr => [`${m[1]}${m[2]}:${m[3] || ' '}${yamlString(tr(value) ?? value)}`]
    })
  }

  const body = lines.map((l, i) => (i < fmEnd ? '' : l)).join('\n')
  const skip = trainerLines(lines)
  const tokens = md.parse(body, {})

  for (let k = 0; k < tokens.length; k++) {
    const t = tokens[k]
    if (!t.map || skip.has(t.map[0])) continue
    const [s, e] = t.map

    if (t.type === 'fence' || t.type === 'code_block') {
      for (let i = s; i < e; i++) code.add(i)
    } else if (t.type === 'heading_open') {
      const level = +t.tag.slice(1)
      let text = tokens[k + 1].content
      let attrs = `{#${t.attrGet('id')}}`
      const m = /\s*(\{[^}]*\})\s*$/.exec(text)
      if (m) { attrs = m[1]; text = text.slice(0, m.index) }
      if (!hasWords(text)) continue
      const indent = /^\s*/.exec(lines[s])[0]
      units.push({
        start: s, end: e, segments: [{ msgid: text, kind: `heading ${level}` }], level,
        render: tr => [`${indent}${'#'.repeat(level)} ${tr(text) ?? text} ${attrs}`]
      })
    } else if (t.type === 'paragraph_open') {
      const raw = tokens[k + 1].content
      const text = oneLine(raw)
      if (!hasWords(text)) continue
      const rawLines = raw.split('\n')
      const at = lines[s].indexOf(rawLines[0])
      const prefix = at >= 0 ? lines[s].slice(0, at) : ''
      let cont = prefix.replace(/[^>\s]/g, ' ')
      if (rawLines.length > 1) {
        const at2 = lines[s + 1].indexOf(rawLines[1])
        if (at2 >= 0) cont = lines[s + 1].slice(0, at2)
      }
      units.push({
        start: s, end: e, segments: [{ msgid: text, kind: 'paragraph' }],
        render: tr => (tr(text) ?? text).split('\n').map((l, i) => (i ? cont : prefix) + l)
      })
    } else if (/^container_\w+_open$/.test(t.type)) {
      const m = /^(\s*:{3,}\s*)(\S+)\s*(.*?)\s*$/.exec(lines[s])
      if (!m) continue
      const [, pre, kind, title] = m
      const segments = title && hasWords(title) ? [{ msgid: title, kind: 'box title' }] : []
      units.push({
        start: s, end: s + 1, segments, boxKind: kind, boxTitle: title,
        render: (tr, lang) => {
          const t2 = title ? (tr(title) ?? title) : (LANGS[lang].boxTitles[kind] || '')
          return [`${pre}${kind}${t2 ? ' ' + t2 : ''}`]
        }
      })
    } else if (t.type === 'table_open') {
      for (let i = s; i < e; i++) {
        if (i === s + 1) continue // the --- | --- line
        const { indent, cells } = splitRow(lines[i])
        const segments = cells.filter(hasWords).map(c => ({ msgid: c, kind: 'table cell' }))
        if (!segments.length) continue
        units.push({
          start: i, end: i + 1, segments,
          render: tr => [`${indent}| ${cells.map(c => (hasWords(c) ? (tr(c) ?? c) : c)).join(' | ')} |`]
        })
      }
    } else if (t.type === 'html_block') {
      if (/^\s*<(style|script|!--)/i.test(t.content)) continue
      for (let i = s; i < e; i++) {
        const text = lines[i].trim()
        if (!hasWords(text)) continue
        const indent = /^\s*/.exec(lines[i])[0]
        units.push({
          start: i, end: i + 1, segments: [{ msgid: text, kind: 'html' }],
          render: tr => [indent + (tr(text) ?? text)]
        })
      }
    }
  }
  units.sort((a, b) => a.start - b.start)
  return { lines, fmEnd, units, code }
}

// ---------------------------------------------------------------------------
// Pages and their .po files

function walk(dir, skipDirs, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) { if (!skipDirs.has(p) && !ent.name.startsWith('.') && ent.name !== 'node_modules') walk(p, skipDirs, out) } else if (ent.name.endsWith('.md')) out.push(p)
  }
  return out
}

/** English pages, as paths relative to site/ (posix). */
export function englishPages() {
  const skip = new Set([PUBLIC, ...Object.keys(LANGS).map(l => path.join(SITE, l))])
  return walk(SITE, skip).map(p => path.relative(SITE, p).split(path.sep).join('/')).sort()
}

const poPath = (lang, page) => path.join(I18N, lang, page.replace(/\.md$/, '.po'))
const SITE_PO = '_site.po'

function readPo(file) {
  try { return parsePo(fs.readFileSync(file, 'utf8')) } catch { return { header: null, entries: [] } }
}

function writeIfChanged(file, text) {
  try { if (fs.readFileSync(file, 'utf8') === text) return false } catch { /* new file */ }
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, text)
  return true
}

function lookup(po) {
  const map = new Map()
  for (const e of po.entries) if (!e.obsolete && isDone(e)) map.set(e.msgid, e.msgstr)
  return msgid => map.get(msgid) ?? null
}

// ---------------------------------------------------------------------------
// update: English -> .po (like msgmerge: keeps translations, fuzzy for changed text)

function words(s) {
  return s.toLowerCase().match(/[a-z0-9_$]+/g) || []
}

function similarity(a, b) {
  const wa = words(a)
  const wb = words(b)
  if (!wa.length || !wb.length) return 0
  const count = new Map()
  wa.forEach(w => count.set(w, (count.get(w) || 0) + 1))
  let common = 0
  for (const w of wb) { const c = count.get(w); if (c) { common++; count.set(w, c - 1) } }
  return (2 * common) / (wa.length + wb.length)
}

function mergeEntries(segments, oldEntries) {
  const old = new Map()
  for (const e of oldEntries) if (!old.has(e.msgid) || (!old.get(e.msgid).msgstr && e.msgstr)) old.set(e.msgid, e)
  const used = new Set()
  const entries = segments.map(seg => {
    const e = { comments: [], extracted: [seg.kind], refs: seg.refs, flags: new Set(), previous: null, obsolete: false, msgid: seg.msgid, msgstr: '' }
    const o = old.get(seg.msgid)
    if (o) {
      used.add(seg.msgid)
      Object.assign(e, { comments: o.comments, msgstr: o.msgstr, flags: new Set(o.flags), previous: isFuzzy(o) ? o.previous : null })
      e.flags.delete('fuzzy')
      if (isFuzzy(o) && o.msgstr) e.flags.add('fuzzy')
    }
    return e
  })
  // changed text: suggest the closest old translation, marked fuzzy
  const pool = [...old.values()].filter(o => o.msgstr && !used.has(o.msgid))
  for (const e of entries) {
    if (e.msgstr) continue
    let best = null
    let score = 0.6
    for (const o of pool) {
      const sc = similarity(e.msgid, o.msgid)
      if (sc > score) { best = o; score = sc }
    }
    if (best) { e.msgstr = best.msgstr; e.flags.add('fuzzy'); e.previous = best.msgid }
  }
  // translations of removed text stay at the end (#~), as suggestions for later changes
  const obsolete = [...old.values()]
    .filter(o => o.msgstr && !used.has(o.msgid))
    .map(o => ({ ...o, obsolete: true, refs: [], extracted: [], previous: null, flags: new Set() }))
  return [...entries, ...obsolete]
}

function collect(units, page) {
  const byId = new Map()
  for (const u of units) {
    for (const seg of u.segments) {
      const ref = `site/${page}:${u.start + 1}`
      if (byId.has(seg.msgid)) byId.get(seg.msgid).refs.push(ref)
      else byId.set(seg.msgid, { msgid: seg.msgid, kind: seg.kind, refs: [ref] })
    }
  }
  return [...byId.values()]
}

function poHeader(lang, source, oldHeader) {
  const h = headerMap(oldHeader)
  return {
    headerComments: [
      `Translation of ${source} into ${LANGS[lang].label}.`,
      'Edit the msgstr lines only (Poedit or any PO editor). See i18n/README.md.'
    ],
    headerFields: {
      'Project-Id-Version': 'Practical JavaScript Basics',
      'Language-Team': h['Language-Team'] || '',
      'Last-Translator': h['Last-Translator'] || '',
      'PO-Revision-Date': h['PO-Revision-Date'] || '',
      Language: lang,
      'MIME-Version': '1.0',
      'Content-Type': 'text/plain; charset=UTF-8',
      'Content-Transfer-Encoding': '8bit',
      'Plural-Forms': 'nplurals=2; plural=(n != 1);',
      'X-Source-File': source
    }
  }
}

async function siteSegments() {
  process.env.I18N_CLI = '1'
  const config = (await import(pathToFileURL(path.join(SITE, '.vitepress/config.mjs')).href)).default
  const ids = new Map()
  const add = (s, kind) => { if (s && hasWords(s) && !ids.has(s)) ids.set(s, { msgid: s, kind, refs: ['site/.vitepress/config.mjs'] }) }
  add(config.title, 'site title')
  add(config.description, 'site description')
  add(config.footerMessage ?? config.i18nFooterMessage, 'footer')
  const walkItems = (items, kind) => (items || []).forEach(it => { add(it.text, kind); walkItems(it.items, kind) })
  walkItems(config.themeConfig.nav, 'top menu')
  const sb = config.themeConfig.sidebar
  walkItems(Array.isArray(sb) ? sb : Object.values(sb).flat(), 'side menu')
  return [...ids.values()]
}

export async function updateLocale(lang, { quiet = false } = {}) {
  const pages = englishPages()
  const keep = new Set()
  for (const page of pages) {
    const file = poPath(lang, page)
    keep.add(file)
    const { units } = await segmentPage(fs.readFileSync(path.join(SITE, page), 'utf8'))
    const old = readPo(file)
    const entries = mergeEntries(collect(units, page), old.entries)
    if (writeIfChanged(file, writePo({ ...poHeader(lang, `site/${page}`, old.header), entries })) && !quiet) console.log(`updated ${path.relative(ROOT, file)}`)
  }
  const siteFile = path.join(I18N, lang, SITE_PO)
  keep.add(siteFile)
  const old = readPo(siteFile)
  const entries = mergeEntries(await siteSegments(), old.entries)
  if (writeIfChanged(siteFile, writePo({ ...poHeader(lang, 'site/.vitepress/config.mjs', old.header), entries })) && !quiet) console.log(`updated ${path.relative(ROOT, siteFile)}`)
  // .po files of deleted pages
  for (const f of walkPo(path.join(I18N, lang))) if (!keep.has(f)) console.log(`no English page any more: ${path.relative(ROOT, f)} (delete it when no longer needed)`)
}

function walkPo(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) walkPo(p, out)
    else if (ent.name.endsWith('.po')) out.push(p)
  }
  return out
}

// ---------------------------------------------------------------------------
// build: English + .po -> site/<lang>/

function isPublicFile(p) {
  const clean = decodeURI(p.replace(/^\//, ''))
  if (!clean || clean.endsWith('/')) return false
  try { return fs.statSync(path.join(PUBLIC, clean)).isFile() } catch { return false }
}

// A file in public/ with a translated copy next to it (animations/x.html ->
// animations/bg/x.html) is linked in that language.
function localizePublic(url, p, resolved, lang) {
  const local = posix.join(posix.dirname(resolved), lang, posix.basename(resolved))
  if (!isPublicFile(local)) return url
  return posix.join(posix.dirname(p), lang, posix.basename(p)) + url.slice(p.length)
}

function fixUrl(url, page, lang) {
  if (/^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(url)) return url
  const p = url.split(/[?#]/)[0]
  if (url.startsWith('/')) {
    return isPublicFile(p) ? localizePublic(url, p, p.slice(1), lang) : `/${lang}${url}`
  }
  const resolved = posix.normalize(posix.join(posix.dirname(page), p))
  return isPublicFile(resolved) ? '../' + localizePublic(url, p, resolved, lang) : url
}

function fixLinks(line, page, lang) {
  return line
    .replace(/(\]\()([^)\s]+)/g, (m, a, url) => a + fixUrl(url, page, lang))
    .replace(/(\b(?:href|src)=")([^"]+)/g, (m, a, url) => a + fixUrl(url, page, lang))
    .replace(/^(\s*\[[^\]]+\]:\s*)(\S+)/, (m, a, url) => a + fixUrl(url, page, lang))
    .replace(/^(\s*(?:- )?link:\s*)(\S+)\s*$/, (m, a, url) => a + fixUrl(url, page, lang))
}

export async function renderPage(lang, page, tr) {
  const { lines, fmEnd, units, code } = await segmentPage(fs.readFileSync(path.join(SITE, page), 'utf8'))
  const all = units.flatMap(u => u.segments)
  const done = all.filter(s => tr(s.msgid) != null).length
  const partial = done < all.length
  const out = lines.map((l, i) => (code.has(i) ? l : fixLinks(l, page, lang)))
  for (const u of [...units].reverse()) {
    // nothing translated: keep the English lines as they are
    const keep = u.segments.length && u.segments.every(s => tr(s.msgid) == null)
    let rendered = keep ? out.slice(u.start, u.end) : u.render(tr, lang).map(l => fixLinks(l, page, lang))
    if (u.level === 1 && partial) rendered = [...rendered, '', ...LANGS[lang].partial]
    out.splice(u.start, u.end - u.start, ...rendered)
  }
  const note = `<!-- Generated from site/${page} and i18n/${lang}/${page.replace(/\.md$/, '.po')} - do not edit, run "npm run i18n:update" and edit the .po file -->`
  out.splice(fmEnd, 0, note)
  return { text: out.join('\n'), total: all.length, done }
}

/** Write site/<lang>/ from the English pages and the .po files. Returns per-page stats. */
export async function buildLocale(lang) {
  const outDir = path.join(SITE, lang)
  const written = new Set()
  const stats = []
  for (const page of englishPages()) {
    const tr = lookup(readPo(poPath(lang, page)))
    const { text, total, done } = await renderPage(lang, page, tr)
    const file = path.join(outDir, page)
    written.add(file)
    writeIfChanged(file, text)
    stats.push({ page, total, done })
  }
  if (fs.existsSync(outDir)) for (const f of walk(outDir, new Set())) if (!written.has(f)) fs.rmSync(f)
  return stats
}

// ---------------------------------------------------------------------------
// site config: locales, translated menus, the language button

function translateItems(items, tr, lang) {
  return (items || []).map(it => ({
    ...it,
    text: it.text && (tr(it.text) ?? it.text),
    link: it.link && it.link.startsWith('/') ? `/${lang}${it.link}` : it.link,
    items: it.items && translateItems(it.items, tr, lang)
  }))
}

/**
 * Adds the translated locales to a defineCourse() config and (re)generates their pages.
 * footerMessage: the plain footer text given to defineCourse (the kit appends a link).
 */
export async function withLocales(config, { footerMessage = '' } = {}) {
  config.footerMessage = footerMessage // read by `update` for the site strings
  if (process.env.I18N_CLI === '1') return config
  mdOptions = config.markdown || {}
  mdBase = config.base || '/'
  config.locales = { root: { label: 'English', lang: config.lang || 'en' } }
  const searchLocales = {}
  for (const [lang, L] of Object.entries(LANGS)) {
    await buildLocale(lang)
    const tr = lookup(readPo(path.join(I18N, lang, SITE_PO)))
    const t = s => (s ? (tr(s) ?? s) : s)
    const sb = config.themeConfig.sidebar
    const footer = config.themeConfig.footer?.message || ''
    config.locales[lang] = {
      label: L.label,
      lang: L.lang,
      link: `/${lang}/`,
      title: t(config.title),
      description: t(config.description),
      themeConfig: {
        ...L.theme,
        nav: translateItems(config.themeConfig.nav, tr, lang),
        sidebar: Array.isArray(sb)
          ? translateItems(sb, tr, lang)
          : Object.fromEntries(Object.entries(sb).map(([k, v]) => [`/${lang}${k}`, translateItems(v, tr, lang)])),
        footer: { ...config.themeConfig.footer, message: footerMessage ? footer.replace(footerMessage, t(footerMessage)) : footer }
      }
    }
    searchLocales[lang] = { translations: L.search }
  }
  config.themeConfig.search = { provider: 'local', options: { ...config.themeConfig.search?.options, locales: searchLocales } }
  // the language button takes the place of VitePress' language menu (next to the theme switch)
  const vite = (config.vite ??= {})
  const resolve = (vite.resolve ??= {})
  const alias = Array.isArray(resolve.alias) ? resolve.alias : Object.entries(resolve.alias || {}).map(([find, replacement]) => ({ find, replacement }))
  alias.push({ find: /^.*\/VPNavBarTranslations\.vue$/, replacement: path.join(SITE, '.vitepress/theme/LangSwitch.vue') })
  resolve.alias = alias
  vite.plugins = [...(vite.plugins || []), devRebuild()]
  return config
}

// dev server: rebuild the translated pages when an English page or a .po file changes
function devRebuild() {
  return {
    name: 'course-i18n',
    configureServer(server) {
      server.watcher.add(I18N)
      const langDirs = Object.keys(LANGS).map(l => path.join(SITE, l) + path.sep)
      let timer
      const onChange = f => {
        const english = f.startsWith(SITE + path.sep) && f.endsWith('.md') && !langDirs.some(d => f.startsWith(d))
        const po = f.startsWith(I18N + path.sep) && f.endsWith('.po')
        if (!english && !po) return
        if (po && path.basename(f) === SITE_PO) console.log('[i18n] menu texts changed: restart the dev server to see them')
        clearTimeout(timer)
        timer = setTimeout(async () => {
          for (const lang of Object.keys(LANGS)) await buildLocale(lang).catch(e => console.error('[i18n]', e))
        }, 100)
      }
      for (const ev of ['change', 'add', 'unlink']) server.watcher.on(ev, onChange)
    }
  }
}

// ---------------------------------------------------------------------------
// check: a translation must keep the code, links, tags and attributes of the English

function pieces(s) {
  const codes = []
  const noCode = s.replace(/(`+)([\s\S]*?)\1/g, (m) => { codes.push(m); return ' ' })
  return {
    code: codes,
    links: [...noCode.matchAll(/\]\(([^)]*)\)/g)].map(m => m[1]),
    attrs: [...noCode.matchAll(/\{[^}]*\}/g)].map(m => m[0]),
    tags: [...noCode.matchAll(/<\/?[a-zA-Z][^>]*>/g)].map(m => m[0]),
    bold: (noCode.match(/\*\*/g) || []).length,
    urls: [...noCode.matchAll(/(?<!\()https?:\/\/[^\s)]+/g)].map(m => m[0]),
    pipes: (noCode.replace(/\\\|/g, '').match(/\|/g) || []).length + codes.join('').replace(/\\\|/g, '').split('|').length - 1
  }
}

const sameList = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort())

export function checkEntry(e) {
  const problems = []
  if (!isDone(e)) return problems
  const a = pieces(e.msgid)
  const b = pieces(e.msgstr)
  if (!sameList(a.code, b.code)) problems.push('code in backticks differs')
  if (!sameList(a.links, b.links)) problems.push('link targets differ')
  if (!sameList(a.attrs, b.attrs)) problems.push('{...} attributes differ')
  if (!sameList(a.tags, b.tags)) problems.push('HTML tags differ')
  if (!sameList(a.urls, b.urls)) problems.push('URLs differ')
  if (a.bold !== b.bold) problems.push('number of ** (bold) differs')
  const kind = e.extracted[0] || ''
  if (kind === 'table cell' && b.pipes !== a.pipes) problems.push('a | in a table cell must be written \\|')
  if (/^(heading|table cell|box title|html|front matter|top menu|side menu)/.test(kind) && e.msgstr.includes('\n')) problems.push('must be one line')
  if (e.msgstr !== e.msgstr.trim()) problems.push('leading or trailing spaces')
  if (/[\u2000-\u206f\u00ab\u00bb]/.test(e.msgstr)) problems.push('typographic punctuation (use ASCII quotes, dashes and dots)')
  return problems
}

// ---------------------------------------------------------------------------
// CLI

function poFiles(lang) {
  return walkPo(path.join(I18N, lang)).sort()
}

function countWords(s) {
  return (s.replace(/(`+)[\s\S]*?\1/g, ' ').replace(/\]\([^)]*\)/g, ']').match(/[A-Za-z][A-Za-z'-]*/g) || []).length
}

function stats(file) {
  const live = readPo(file).entries.filter(e => !e.obsolete)
  const done = live.filter(isDone)
  const fuzzy = live.filter(e => isFuzzy(e) && e.msgstr)
  const todo = live.filter(e => !isDone(e))
  return { total: live.length, done: done.length, fuzzy: fuzzy.length, todo: todo.length, words: todo.reduce((n, e) => n + countWords(e.msgid), 0) }
}

function status(lang) {
  const rows = poFiles(lang).map(f => ({ file: path.relative(path.join(I18N, lang), f), ...stats(f) }))
  const w = Math.max(...rows.map(r => r.file.length), 4)
  console.log(`${'file'.padEnd(w)}  done/total  fuzzy  todo  words to translate`)
  for (const r of rows) console.log(`${r.file.padEnd(w)}  ${`${r.done}/${r.total}`.padStart(10)}  ${String(r.fuzzy).padStart(5)}  ${String(r.todo).padStart(4)}  ${String(r.words).padStart(6)}`)
  const sum = k => rows.reduce((n, r) => n + r[k], 0)
  console.log(`${'all'.padEnd(w)}  ${`${sum('done')}/${sum('total')}`.padStart(10)}  ${String(sum('fuzzy')).padStart(5)}  ${String(sum('todo')).padStart(4)}  ${String(sum('words')).padStart(6)}`)
}

function check(lang) {
  let n = 0
  for (const f of poFiles(lang)) {
    for (const e of readPo(f).entries) {
      if (e.obsolete) continue
      for (const p of checkEntry(e)) {
        n++
        console.log(`${path.relative(ROOT, f)} (${e.refs[0] || ''}): ${p}\n  en: ${e.msgid.slice(0, 160)}\n  ${lang}: ${e.msgstr.slice(0, 160)}`)
      }
    }
  }
  console.log(n ? `${n} problem(s)` : 'no problems')
  return n
}

function pack(lang, all) {
  const date = new Date().toISOString().slice(0, 10)
  const name = `${lang}-${date}`
  const dir = path.join(I18N, 'out', name)
  fs.rmSync(dir, { recursive: true, force: true })
  let n = 0
  for (const f of poFiles(lang)) {
    const s = stats(f)
    if (!all && !s.todo) continue
    const dest = path.join(dir, path.relative(path.join(I18N, lang), f))
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.copyFileSync(f, dest)
    console.log(`${path.relative(I18N, dest)}  (${s.todo} to translate, ${s.words} words)`)
    n++
  }
  if (!n) { console.log('nothing to translate'); return }
  for (const doc of ['TRANSLATOR.md', 'glossary.md']) fs.copyFileSync(path.join(I18N, doc), path.join(dir, doc))
  try {
    execFileSync('zip', ['-qr', `${name}.zip`, name], { cwd: path.dirname(dir) })
    console.log(`\nsend: ${path.relative(ROOT, dir)}.zip`)
  } catch {
    console.log(`\nsend the folder: ${path.relative(ROOT, dir)}`)
  }
}

async function importFiles(lang, inputs) {
  const files = inputs.flatMap(p => (fs.statSync(p).isDirectory() ? walkPo(p) : [p]))
  const targets = new Map(poFiles(lang).map(f => [headerMap(readPo(f).header)['X-Source-File'], f]))
  for (const f of files) {
    const incoming = parsePo(fs.readFileSync(f, 'utf8'))
    const source = headerMap(incoming.header)['X-Source-File']
    const target = targets.get(source) || poFiles(lang).find(p => path.basename(p) === path.basename(f))
    if (!target) { console.log(`skipped ${f}: no matching .po file`); continue }
    const cur = readPo(target)
    const byId = new Map(cur.entries.filter(e => !e.obsolete).map(e => [e.msgid, e]))
    let set = 0
    let old = 0
    for (const e of incoming.entries) {
      if (e.obsolete || !e.msgstr) continue
      const c = byId.get(e.msgid)
      if (c) {
        if (isFuzzy(e) && isDone(c)) continue
        if (c.msgstr === e.msgstr && isFuzzy(c) === isFuzzy(e)) continue
        c.msgstr = e.msgstr
        c.flags = new Set([...e.flags].filter(x => x === 'fuzzy'))
        c.previous = isFuzzy(e) ? e.previous : null
        if (e.comments.length) c.comments = e.comments
        set++
      } else {
        // the English changed while the file was out: keep it as a suggestion
        cur.entries.push({ ...e, obsolete: true })
        old++
      }
    }
    const h = { ...headerMap(cur.header), ...headerMap(incoming.header) }
    const head = poHeader(lang, source || h['X-Source-File'], { msgstr: Object.entries(h).map(([k, v]) => `${k}: ${v}`).join('\n') })
    fs.writeFileSync(target, writePo({ ...head, entries: cur.entries }))
    console.log(`${path.relative(ROOT, target)}: ${set} new or changed translations${old ? `, ${old} for changed English text (fuzzy after update)` : ''}`)
  }
  await updateLocale(lang, { quiet: true })
}

export async function main(argv) {
  const [cmd, ...rest] = argv
  const lang = rest[0] && LANGS[rest[0]] ? rest.shift() : 'bg'
  const flags = new Set(rest.filter(a => a.startsWith('--')))
  const args = rest.filter(a => !a.startsWith('--'))
  if (cmd === 'update') await updateLocale(lang)
  else if (cmd === 'status') status(lang)
  else if (cmd === 'check') process.exitCode = check(lang) ? 1 : 0
  else if (cmd === 'pack') pack(lang, flags.has('--all'))
  else if (cmd === 'import') await importFiles(lang, args)
  else if (cmd === 'build') {
    for (const s of await buildLocale(lang)) console.log(`site/${lang}/${s.page}  ${s.done}/${s.total}`)
  } else {
    console.log('usage: node i18n/cli.mjs <update|status|check|pack [--all]|import <files or folder>|build> [lang]\nsee i18n/README.md')
  }
}
