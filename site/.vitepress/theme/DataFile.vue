<script setup>
// The name of a data file, data/<file>, as a button that opens a preview of the
// JSON file in a dialog. In Markdown:
//   <DataFile file="sample-asset.json" />
//   <DataFile file="reports/lab-dev-05.json" />
// Views: Tree (fold and unfold the levels), Paths (every value with its full path,
// with a filter), Tables (every array of records and every dictionary of records as
// a table), Text (the file with line numbers; a file that is not valid JSON shows
// the error of JSON.parse at its line). A click on a value shows its path the way
// code reads it (doc.inventory.modules["12_4.20"].status), with a Copy button.
// The file is read in the browser (jsonPreview.js); the labels are in Bulgarian on
// the /bg/ pages. Same look as the DataFile of Python-Data-Analysts-UniCredit.
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { useData } from 'vitepress'
import { dataFiles } from './dataFiles.js'
import { parseJson, pathStep, leaves, tables, kindOf, isContainer, preview } from './jsonPreview.js'

const props = defineProps({
  file: { type: String, required: true },
  // the name of the whole document in the paths, like the `doc` of a check rule
  name: { type: String, default: 'doc' }
})

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`
const TEXT = {
  en: { preview: 'Preview the file', tree: 'Tree', paths: 'Paths', tables: 'Tables', text: 'Text',
        filter: 'Filter by path or value', download: 'Download', close: 'Close', loading: 'Loading...',
        error: 'The file could not be read', invalid: 'not valid JSON', parseError: 'JSON.parse fails',
        expand: 'Expand all', collapse: 'Collapse', copy: 'Copy', copied: 'Copied',
        pick: 'Click a value to see its path.', path: 'path', value: 'value', type: 'type',
        index: 'index', key: 'key', noMatch: 'No value has this text.', showAll: n => `Show all ${n}`,
        lines: n => plural(n, 'line', 'lines'), values: n => plural(n, 'value', 'values'),
        keys: n => plural(n, 'key', 'keys'), items: n => plural(n, 'item', 'items'),
        rows: n => plural(n, 'row', 'rows'), columns: n => plural(n, 'column', 'columns'),
        matches: (n, total) => `${n} of ${total} have this text`,
        first: n => `the first ${n} are shown`, missing: 'no such key in this record' },
  bg: { preview: 'Преглед на файла', tree: 'Дърво', paths: 'Пътища', tables: 'Таблици', text: 'Текст',
        filter: 'Филтър по път или стойност', download: 'Изтегли', close: 'Затвори', loading: 'Зарежда се...',
        error: 'Файлът не може да се прочете', invalid: 'невалиден JSON', parseError: 'JSON.parse дава грешка',
        expand: 'Разгъни всичко', collapse: 'Сгъни', copy: 'Копирай', copied: 'Копирано',
        pick: 'Щракнете върху стойност, за да видите пътя до нея.', path: 'път', value: 'стойност', type: 'тип',
        index: 'индекс', key: 'ключ', noMatch: 'Няма стойност с този текст.', showAll: n => `Покажи всички ${n}`,
        lines: n => plural(n, 'ред', 'реда'), values: n => plural(n, 'стойност', 'стойности'),
        keys: n => plural(n, 'ключ', 'ключа'), items: n => plural(n, 'елемент', 'елемента'),
        rows: n => plural(n, 'ред', 'реда'), columns: n => plural(n, 'колона', 'колони'),
        matches: (n, total) => `${n} от ${total} съдържат този текст`,
        first: n => `показани са първите ${n}`, missing: 'този запис няма такъв ключ' }
}
const { lang } = useData()
const t = computed(() => (String(lang.value || '').startsWith('bg') ? TEXT.bg : TEXT.en))

const STEP = 500   // rows shown at first: long lists stay fast
const ALL_OPEN = 150   // a document with fewer objects and arrays opens fully
const open = ref(false)
const data = ref(null)      // { text, size, value, error, errorLine }
const loadError = ref('')
const mode = ref('tree')    // 'tree' | 'paths' | 'tables' | 'text'
const tab = ref(0)          // the table
const query = ref('')
const limit = ref(STEP)
const expanded = ref(new Set())
const selected = ref(null)  // { path, value }
const copied = ref(false)
const dialog = ref(null)

const url = computed(() => dataFiles[props.file])
const valid = computed(() => data.value && !data.value.error)
const lines = computed(() => (data.value?.text ?? '').replace(/\r?\n$/, '').split(/\r?\n/))
const size = computed(() => {
  const n = data.value?.size ?? 0
  return n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`
})

// every object and array of the document, by path
const containers = computed(() => {
  const out = []
  const walk = (v, path) => {
    if (!isContainer(v)) return
    out.push(path)
    const arr = Array.isArray(v)
    for (const [k, x] of Object.entries(v)) walk(x, pathStep(path, arr ? Number(k) : k, arr))
  }
  if (valid.value) walk(data.value.value, props.name)
  return out
})

// the visible lines of the tree
const treeRows = computed(() => {
  const out = []
  if (!valid.value) return out
  const walk = (v, path, key, isIndex, depth) => {
    const kind = kindOf(v)
    const count = isContainer(v) ? Object.keys(v).length : 0
    const isOpen = count > 0 && expanded.value.has(path)
    out.push({ path, key, isIndex, depth, kind, value: v, count, open: isOpen })
    if (!isOpen) return
    const arr = Array.isArray(v)
    for (const [k, x] of Object.entries(v)) {
      const kk = arr ? Number(k) : k
      walk(x, pathStep(path, kk, arr), kk, arr, depth + 1)
    }
  }
  walk(data.value.value, props.name, null, false, 0)
  return out
})

const allLeaves = computed(() => (valid.value ? leaves(data.value.value, props.name) : []))
const allTables = computed(() => (valid.value ? tables(data.value.value, props.name) : []))
const current = computed(() => allTables.value[tab.value])

const filteredLeaves = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return allLeaves.value
  return allLeaves.value.filter(l => l.path.toLowerCase().includes(q) || preview(l.value, 1e6).toLowerCase().includes(q))
})
const filteredRows = computed(() => {
  const rows = current.value?.rows ?? []
  const q = query.value.trim().toLowerCase()
  if (!q) return rows
  return rows.filter(r => String(r.n).toLowerCase().includes(q) ||
    r.cells.some(v => v !== undefined && preview(v, 1e6).toLowerCase().includes(q)))
})
const filtered = computed(() => (mode.value === 'paths' ? filteredLeaves.value : filteredRows.value))
const total = computed(() => (mode.value === 'paths' ? allLeaves.value.length : current.value?.rows.length ?? 0))
const shownLeaves = computed(() => filteredLeaves.value.slice(0, limit.value))
const shownRows = computed(() => filteredRows.value.slice(0, limit.value))

watch([tab, query, mode], () => { limit.value = STEP })

function expandAll() { expanded.value = new Set(containers.value) }
function collapse() { expanded.value = new Set([props.name]) }
function toggle(path) {
  const next = new Set(expanded.value)
  if (next.has(path)) next.delete(path)
  else next.add(path)
  expanded.value = next
}

function select(path, value) {
  selected.value = { path, value }
  copied.value = false
}

let copiedTimer = 0
async function copy() {
  if (!selected.value) return
  try {
    await navigator.clipboard.writeText(selected.value.path)
    copied.value = true
    clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => { copied.value = false }, 1500)
  } catch { /* no clipboard (http, old browser): the path can still be selected by hand */ }
}

async function show() {
  open.value = true
  await nextTick()
  dialog.value?.showModal()
  document.documentElement.classList.add('data-file-open')
  if (data.value) return
  loadError.value = ''
  try {
    const response = await fetch(url.value)
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
    const bytes = new Uint8Array(await response.arrayBuffer())
    const text = new TextDecoder().decode(bytes)
    data.value = { text, size: bytes.length, ...parseJson(text) }
    if (data.value.error) {
      mode.value = 'text'
    } else {
      if (containers.value.length < ALL_OPEN) expandAll()
      else expanded.value = new Set(containers.value.filter(p => p === props.name || treeDepth(p) <= 1))
    }
  } catch (e) {
    loadError.value = `${t.value.error}: ${e.message || e}`
  }
}

// the depth of a path among the containers: the number of steps after the name
function treeDepth(path) {
  return (path.slice(props.name.length).match(/\.[A-Za-z_$][\w$]*|\[[^\]]*\]/g) || []).length
}

function close() {
  dialog.value?.close()
}

function onClose() {
  open.value = false
  document.documentElement.classList.remove('data-file-open')
}

// a click on the dark area around the dialog closes it
function onClick(e) {
  if (e.target === dialog.value) close()
}

onBeforeUnmount(onClose)

const summary = r => (r.kind === 'array' ? `[ ${t.value.items(r.count)} ]` : `{ ${t.value.keys(r.count)} }`)
const keyText = r => (r.key === null ? props.name : r.isIndex ? `[${r.key}]` : JSON.stringify(r.key).slice(1, -1))
const cellClass = v => (v === undefined ? 'missing' : 'k-' + kindOf(v))
const cellText = v => (v === undefined ? '' : typeof v === 'string' ? v : preview(v, 80))
</script>

<template>
  <button type="button" class="data-file" :title="t.preview" @click="show">
    <code>data/{{ file }}</code>
    <svg class="data-file-icon" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M5.5 2.5c-1.5 0-2 .6-2 2v1.6c0 .9-.5 1.4-1.5 1.9 1 .5 1.5 1 1.5 1.9v1.6c0 1.4.5 2 2 2M10.5 2.5c1.5 0 2 .6 2 2v1.6c0 .9.5 1.4 1.5 1.9-1 .5-1.5 1-1.5 1.9v1.6c0 1.4-.5 2-2 2" fill="none" stroke="currentColor" stroke-width="1.3" />
    </svg>
  </button>
  <Teleport to="body">
    <dialog v-if="open" ref="dialog" class="data-file-dialog" :aria-label="'data/' + file" @close="onClose" @click="onClick">
      <div class="df-box">
        <header class="df-head">
          <code class="df-name">data/{{ file }}</code>
          <span v-if="data" class="df-meta">
            <span>{{ t.lines(lines.length) }}</span>
            <span v-if="valid">{{ t.values(allLeaves.length) }}</span>
            <span>{{ size }}</span>
            <span v-if="!valid" class="df-warn">{{ t.invalid }}</span>
          </span>
          <span class="df-actions">
            <a class="df-button" :href="url" :download="file.split('/').pop()">{{ t.download }}</a>
            <button type="button" class="df-close" :title="t.close" :aria-label="t.close" @click="close">
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" stroke-width="1.6" /></svg>
            </button>
          </span>
        </header>

        <div v-if="valid" class="df-bar">
          <span class="df-group" role="group">
            <button type="button" :class="{ on: mode === 'tree' }" :aria-pressed="mode === 'tree'" @click="mode = 'tree'">{{ t.tree }}</button>
            <button type="button" :class="{ on: mode === 'paths' }" :aria-pressed="mode === 'paths'" @click="mode = 'paths'">{{ t.paths }}</button>
            <button v-if="allTables.length" type="button" :class="{ on: mode === 'tables' }" :aria-pressed="mode === 'tables'" @click="mode = 'tables'">{{ t.tables }}</button>
            <button type="button" :class="{ on: mode === 'text' }" :aria-pressed="mode === 'text'" @click="mode = 'text'">{{ t.text }}</button>
          </span>
          <span v-if="mode === 'tree'" class="df-group" role="group">
            <button type="button" @click="expandAll">{{ t.expand }}</button>
            <button type="button" @click="collapse">{{ t.collapse }}</button>
          </span>
          <span v-if="mode === 'tables' && allTables.length > 1" class="df-group df-tabs" role="group">
            <button
              v-for="(tb, i) in allTables"
              :key="tb.name"
              type="button"
              :class="{ on: tab === i }"
              :aria-pressed="tab === i"
              @click="tab = i"
            >{{ tb.name }}</button>
          </span>
        </div>

        <div v-if="valid && (mode === 'paths' || (mode === 'tables' && current))" class="df-bar df-info">
          <span v-if="mode === 'paths'">{{ t.values(allLeaves.length) }}</span>
          <span v-else>{{ t.rows(current.rows.length) }}, {{ t.columns(current.columns.length) }}</span>
          <input v-model="query" type="search" class="df-filter" :placeholder="t.filter" :aria-label="t.filter">
        </div>

        <div class="df-body">
          <p v-if="loadError" class="df-message df-error">{{ loadError }}</p>
          <p v-else-if="!data" class="df-message">{{ t.loading }}</p>

          <template v-else-if="mode === 'text'">
            <p v-if="data.error" class="df-message df-error">{{ t.parseError }}: {{ data.error }}</p>
            <pre class="df-text"><span v-for="(l, i) in lines" :key="i" :data-n="i + 1" :class="{ bad: i + 1 === data.errorLine }">{{ l }}</span></pre>
          </template>

          <div v-else-if="mode === 'tree'" class="df-tree" role="tree">
            <div
              v-for="r in treeRows"
              :key="r.path"
              class="df-node"
              role="treeitem"
              :aria-expanded="r.count ? r.open : null"
              :class="{ sel: selected?.path === r.path }"
              :style="{ paddingLeft: `${r.depth * 18 + 6}px` }"
              :title="r.path"
              @click="select(r.path, r.value)"
            >
              <button v-if="r.count" type="button" class="df-caret" :class="{ open: r.open }" :aria-label="r.open ? t.collapse : t.expand" @click.stop="toggle(r.path)">
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.6" /></svg>
              </button>
              <span v-else class="df-caret-space"></span>
              <span class="df-key" :class="{ idx: r.isIndex, root: r.key === null }">{{ keyText(r) }}</span><span class="df-colon">:</span>
              <span v-if="r.count || isContainer(r.value)" class="df-sum">{{ summary(r) }}</span>
              <span v-else :class="'k-' + r.kind">{{ preview(r.value, 200) }}</span>
            </div>
          </div>

          <template v-else-if="mode === 'paths'">
            <table class="df-table">
              <thead>
                <tr><th>{{ t.path }}</th><th>{{ t.value }}</th><th>{{ t.type }}</th></tr>
              </thead>
              <tbody>
                <tr v-for="l in shownLeaves" :key="l.path" :class="{ sel: selected?.path === l.path }" @click="select(l.path, l.value)">
                  <td class="df-path">{{ l.path }}</td>
                  <td :class="'k-' + l.kind">{{ preview(l.value, 200) }}</td>
                  <td class="df-type">{{ l.kind }}</td>
                </tr>
              </tbody>
            </table>
            <p v-if="!filteredLeaves.length" class="df-message">{{ t.noMatch }}</p>
          </template>

          <template v-else-if="mode === 'tables' && current">
            <table class="df-table">
              <thead>
                <tr>
                  <th class="df-n">{{ t[current.rowLabel] }}</th>
                  <th v-for="c in current.columns" :key="c">{{ c }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in shownRows" :key="r.n">
                  <td class="df-n" :class="{ sel: selected?.path === r.path }" @click="select(r.path, r.value)">{{ r.n }}</td>
                  <td
                    v-for="(v, j) in r.cells"
                    :key="j"
                    :class="[cellClass(v), { sel: selected?.path === pathStep(r.path, current.columns[j], false) }]"
                    :title="v === undefined ? t.missing : null"
                    @click="v !== undefined && select(pathStep(r.path, current.columns[j], false), v)"
                  >{{ cellText(v) }}</td>
                </tr>
              </tbody>
            </table>
            <p v-if="!filteredRows.length" class="df-message">{{ t.noMatch }}</p>
          </template>
        </div>

        <footer v-if="valid && (mode === 'paths' || mode === 'tables') && (query.trim() || filtered.length > limit)" class="df-foot">
          <span v-if="query.trim()">{{ t.matches(filtered.length, total) }}</span>
          <template v-if="filtered.length > limit">
            <span>{{ t.first(limit) }}</span>
            <button type="button" class="df-button" @click="limit = Infinity">{{ t.showAll(filtered.length) }}</button>
          </template>
        </footer>

        <footer v-if="valid && mode !== 'text'" class="df-foot df-selected">
          <template v-if="selected">
            <code class="df-sel-path">{{ selected.path }}</code>
            <button type="button" class="df-button" @click="copy">{{ copied ? t.copied : t.copy }}</button>
            <span v-if="selected.value !== undefined" class="df-sel-value" :class="'k-' + kindOf(selected.value)">{{ preview(selected.value) }}</span>
          </template>
          <span v-else class="df-hint">{{ t.pick }}</span>
        </footer>
      </div>
    </dialog>
  </Teleport>
</template>

<style scoped>
.data-file {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  color: var(--vp-code-link-color);
  cursor: pointer;
  white-space: nowrap;
}
.data-file code {
  color: var(--vp-code-link-color);
  transition: color 0.25s;
}
.data-file:hover code,
.data-file:hover {
  color: var(--vp-code-link-hover-color);
}
.data-file-icon {
  width: 14px;
  height: 14px;
  flex: none;
}

.data-file-dialog {
  width: min(1200px, calc(100vw - 32px));
  height: min(86vh, 900px);
  max-width: none;
  max-height: none;
  padding: 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  box-shadow: var(--vp-shadow-5);
  overflow: hidden;
}
.data-file-dialog::backdrop {
  background: rgba(0, 0, 0, 0.55);
}
.df-box {
  display: flex;
  flex-direction: column;
  height: 100%;
  font-size: 14px;
}
.df-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 16px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--vp-c-divider);
}
.df-name {
  font-family: var(--vp-font-family-mono);
  font-size: 15px;
  font-weight: 600;
}
.df-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 14px;
  color: var(--vp-c-text-2);
  font-size: 13px;
}
.df-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}
.df-button,
.df-group button {
  padding: 2px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  line-height: 22px;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}
.df-button:hover,
.df-group button:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}
.df-close {
  display: flex;
  padding: 4px;
  border: 0;
  border-radius: 6px;
  background: none;
  color: var(--vp-c-text-2);
  cursor: pointer;
}
.df-close:hover {
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-1);
}
.df-close svg {
  width: 18px;
  height: 18px;
}
.df-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--vp-c-divider);
}
.df-group {
  display: flex;
  flex-wrap: wrap;
}
.df-group button {
  border-radius: 0;
  margin-left: -1px;
}
.df-group button:first-child {
  border-radius: 999px 0 0 999px;
  margin-left: 0;
}
.df-group button:last-child {
  border-radius: 0 999px 999px 0;
}
.df-group button:only-child {
  border-radius: 999px;
}
.df-group button.on {
  position: relative;
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}
.df-tabs button {
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
}
.df-info {
  color: var(--vp-c-text-2);
  font-size: 13px;
}
.df-warn {
  padding: 0 8px;
  border-radius: 4px;
  background: var(--vp-c-warning-soft);
  color: var(--vp-c-warning-1);
}
.df-filter {
  width: 260px;
  max-width: 100%;
  margin-left: auto;
  padding: 3px 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font: inherit;
  font-size: 14px;
}
.df-filter:focus {
  border-color: var(--vp-c-brand-1);
  outline: none;
}
.df-body {
  flex: 1;
  overflow: auto;
  overscroll-behavior: contain;
}
.df-message {
  margin: 0;
  padding: 16px;
  color: var(--vp-c-text-2);
}
.df-error {
  color: var(--vp-c-danger-1);
}

/* the colours of the JSON types */
.k-string { color: var(--vp-c-green-1); }
.k-number { color: var(--vp-c-indigo-1); }
.k-boolean { color: var(--vp-c-purple-1); }
.k-null { color: var(--vp-c-text-3); font-style: italic; }
.k-object, .k-array { color: var(--vp-c-text-2); }

.df-tree {
  padding: 6px 0;
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  line-height: 1.7;
}
.df-node {
  display: flex;
  align-items: baseline;
  gap: 4px;
  padding-right: 16px;
  white-space: pre;
  cursor: pointer;
}
.df-node:hover {
  background: var(--vp-c-default-soft);
}
.df-node.sel,
.df-table tr.sel td,
.df-table td.sel {
  background: var(--vp-c-brand-soft);
}
.df-caret,
.df-caret-space {
  display: inline-flex;
  flex: none;
  align-self: center;
  width: 18px;
  height: 18px;
  padding: 1px;
  border: 0;
  background: none;
  color: var(--vp-c-text-2);
  cursor: pointer;
}
.df-caret svg {
  width: 16px;
  height: 16px;
  transition: transform 0.15s;
}
.df-caret.open svg {
  transform: rotate(90deg);
}
.df-key {
  color: var(--vp-c-text-1);
  font-weight: 600;
}
.df-key.idx {
  color: var(--vp-c-text-2);
  font-weight: 400;
}
.df-key.root {
  color: var(--vp-c-brand-1);
}
.df-colon {
  margin-right: 4px;
  color: var(--vp-c-text-3);
}
.df-sum {
  color: var(--vp-c-text-3);
}

.df-table {
  border-collapse: separate;
  border-spacing: 0;
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  line-height: 1.5;
}
.df-table th,
.df-table td {
  padding: 3px 12px;
  border-bottom: 1px solid var(--vp-c-divider);
  text-align: left;
  white-space: pre;
}
.df-table td {
  cursor: pointer;
}
.df-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--vp-c-bg-soft);
  font-weight: 600;
}
.df-table td.missing {
  background: var(--vp-c-default-soft);
  cursor: default;
}
.df-table .df-n {
  position: sticky;
  left: 0;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-3);
  text-align: right;
  user-select: none;
}
.df-table th.df-n {
  z-index: 2;
  background: var(--vp-c-bg-soft);
  font-weight: 500;
}
.df-table tbody tr:hover td {
  background-color: var(--vp-c-default-soft);
}
.df-table tbody tr:hover td.df-n {
  background: linear-gradient(var(--vp-c-default-soft), var(--vp-c-default-soft)), var(--vp-c-bg);
}
.df-path {
  color: var(--vp-c-text-1);
}
.df-type {
  color: var(--vp-c-text-3);
}

.df-text {
  margin: 0;
  padding: 8px 16px 8px 0;
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  line-height: 1.6;
  white-space: pre;
}
.df-text > span {
  display: block;
}
.df-text > span::before {
  content: attr(data-n);
  display: inline-block;
  width: 4em;
  margin-right: 16px;
  color: var(--vp-c-text-3);
  text-align: right;
  user-select: none;
}
.df-text > span.bad {
  background: var(--vp-c-danger-soft);
}

.df-foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 16px;
  padding: 8px 16px;
  border-top: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-2);
  font-size: 13px;
}
.df-selected {
  min-height: 44px;
  background: var(--vp-c-bg-soft);
}
.df-sel-path {
  padding: 1px 8px;
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  word-break: break-all;
}
.df-sel-value {
  overflow: hidden;
  font-family: var(--vp-font-family-mono);
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  flex: 1;
}

/* phones: the whole screen */
@media (max-width: 640px) {
  .data-file-dialog {
    width: 100vw;
    height: 100dvh;
    border: 0;
    border-radius: 0;
  }
  .df-filter {
    width: 100%;
    margin-left: 0;
  }
}
</style>

<style>
/* the page behind an open preview does not scroll */
html.data-file-open {
  overflow: hidden;
}
</style>
