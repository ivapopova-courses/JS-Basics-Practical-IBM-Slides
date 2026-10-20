<script setup>
// A code block with "Run", "Edit" and "Reset" buttons - replaces the RunCode of
// course-kit (registered in index.js). Differences to the kit's version:
// - `await` works at the top level, and lines printed later (after `await`, in a
//   timer) still appear;
// - values print like in Node.js: Map, Set, RegExp, class instances, holes in
//   arrays, null-prototype objects; console.table draws a table; console.dir,
//   group, count, time and assert work (see runInspect.js);
// - the buttons are in Bulgarian on the /bg/ pages.
// The example JSON document (defineCourse({ data })) is available as `doc`.
import { ref, computed, nextTick } from 'vue'
import { useData } from 'vitepress'
// 'course-data' is an alias set by defineCourse({ data }); it defaults to an empty object
import sampleAsset from 'course-data'
import { runExample } from './runInspect.js'

const props = defineProps({ code: { type: String, required: true } })

const TEXT = {
  en: { run: 'Run', edit: 'Edit', done: 'Done', reset: 'Reset', running: 'running...', empty: '(no output)',
        runTitle: 'Run (Ctrl+Enter while editing)', hintEdit: 'Ctrl+Enter runs the code', hint: 'Edit the code and run it again' },
  bg: { run: 'Изпълни', edit: 'Промени', done: 'Готово', reset: 'Върни', running: 'изпълнява се...', empty: '(няма изход)',
        runTitle: 'Изпълни (Ctrl+Enter при промяна)', hintEdit: 'Ctrl+Enter изпълнява кода', hint: 'Променете кода и го изпълнете отново' }
}
const { lang } = useData()
const t = computed(() => (String(lang.value || '').startsWith('bg') ? TEXT.bg : TEXT.en))

function decode(b64) {
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
  return new TextDecoder().decode(bytes).replace(/\n$/, '')
}

const original = decode(props.code)
const source = ref(original)
const editing = ref(false)
const ran = ref(false)
const running = ref(false)
const lines = ref([])
const editor = ref(null)
let runId = 0

const changed = computed(() => source.value !== original)
const rows = computed(() => Math.max(3, source.value.split('\n').length + 1))

async function run() {
  const id = ++runId
  lines.value = []
  ran.value = true
  running.value = true
  const doc = JSON.parse(JSON.stringify(sampleAsset))
  // a line printed by an earlier run (a late timer) is dropped
  const write = line => { if (id === runId) lines.value.push(line) }
  await runExample(source.value, doc, write)
  if (id === runId) running.value = false
}

async function toggleEdit() {
  editing.value = !editing.value
  if (editing.value) {
    await nextTick()
    editor.value && editor.value.focus()
  }
}

function reset() {
  runId++
  source.value = original
  lines.value = []
  ran.value = false
  running.value = false
}

function onKeydown(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run() }
  if (e.key === 'Tab') {
    e.preventDefault()
    const el = e.target
    const s = el.selectionStart
    source.value = source.value.slice(0, s) + '    ' + source.value.slice(el.selectionEnd)
    nextTick(() => { el.selectionStart = el.selectionEnd = s + 4 })
  }
}
</script>

<template>
  <div class="run-code" :class="{ editing }">
    <div v-show="!editing && !changed" class="run-code-view"><slot /></div>
    <pre v-show="!editing && changed" class="run-code-plain"><code>{{ source }}</code></pre>
    <textarea
      v-if="editing"
      ref="editor"
      v-model="source"
      class="run-code-editor"
      :rows="rows"
      spellcheck="false"
      @keydown="onKeydown"
    />
    <div class="run-code-bar">
      <button class="run" :title="t.runTitle" @click="run">{{ t.run }}</button>
      <button @click="toggleEdit">{{ editing ? t.done : t.edit }}</button>
      <button v-if="changed || ran" @click="reset">{{ t.reset }}</button>
      <span class="hint">{{ editing ? t.hintEdit : t.hint }}</span>
    </div>
    <div v-if="ran" class="run-code-output">
      <div v-for="(line, i) in lines" :key="i" :class="line.kind">{{ line.text }}</div>
      <div v-if="running" class="empty">{{ t.running }}</div>
      <div v-else-if="lines.length === 0" class="empty">{{ t.empty }}</div>
    </div>
  </div>
</template>

