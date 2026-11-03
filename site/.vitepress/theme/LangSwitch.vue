<script setup>
// EN / BG button next to the theme switch. It replaces VitePress' language menu
// (alias in i18n/i18n.mjs) and opens the same page in the other language, at the
// same line. The translated pages are generated: see i18n/README.md.
// On phones it is hidden in the bar and shown in the menu instead: LangSwitchScreen.vue
// (in place of VitePress' VPNavScreenTranslations, whose links drop the #section).
import { computed } from 'vue'
import { useData, useRouter, withBase } from 'vitepress'
import { describePlace, restoreDescribedPlace } from '@sciscend/course-kit/theme/keepPlace.js'
import { scrollToHash } from './scrollHash.js'

defineProps({ screen: Boolean })  // true: in the phone menu (always shown)

const { site, page, localeIndex } = useData()
const router = useRouter()

const langs = computed(() =>
  Object.entries(site.value.locales || {}).map(([key, locale]) => ({
    key,
    short: key === 'root' ? (locale.lang || 'en').slice(0, 2).toUpperCase() : key.toUpperCase(),
    label: locale.label,
    lang: locale.lang,
    prefix: key === 'root' ? '' : `${key}/`
  }))
)

function linkTo(lang) {
  let rel = page.value.relativePath || ''
  const current = langs.value.find(l => l.key === localeIndex.value)
  if (current && current.prefix && rel.startsWith(current.prefix)) rel = rel.slice(current.prefix.length)
  rel = lang.prefix + rel
  return withBase('/' + rel.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, ''))
}

const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve))

// a button, not a link: VitePress handles link clicks itself and would drop the #section
async function go(lang) {
  if (lang.key === localeIndex.value) return
  const hash = window.location.hash
  // the line under the nav bar: the n-th block of its section (keepPlace.js of the
  // course kit). The other page is built from the same Markdown, so it has the same
  // headings and blocks, in the same order - only the text in them differs.
  const place = describePlace()
  await router.go(linkTo(lang) + hash)
  await nextFrame()
  await nextFrame()
  // The first Bulgarian page loads the Cyrillic font only now; the text reflows and
  // moves down. restoreDescribedPlace keeps the place until the fonts are in (and a
  // moment after), unless the reader scrolls. The address bar keeps up: scrollHash.js.
  if (restoreDescribedPlace(place, document.fonts.ready)) return
  // no such block on the other page: the start of the section, as VitePress did
  if (!hash) return
  await document.fonts.ready
  scrollToHash(hash)
}
</script>

<template>
  <div v-if="langs.length > 1" class="lang-switch" :class="{ screen }" role="group" aria-label="Language / Език">
    <button
      v-for="l in langs"
      :key="l.key"
      type="button"
      :lang="l.lang"
      :title="l.label"
      :class="{ on: l.key === localeIndex }"
      :aria-pressed="l.key === localeIndex"
      @click="go(l)"
    >{{ l.short }}</button>
  </div>
</template>

<style scoped>
.lang-switch {
  display: flex;
  align-items: center;
}
.lang-switch button {
  font-size: 12px;
  font-weight: 600;
  line-height: 20px;
  padding: 1px 8px;
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-2);
  transition: color 0.2s, border-color 0.2s, background-color 0.2s;
}
.lang-switch button:first-of-type { border-radius: 999px 0 0 999px; }
.lang-switch button:last-of-type { border-radius: 0 999px 999px 0; margin-left: -1px; }
.lang-switch button:hover { color: var(--vp-c-text-1); }
.lang-switch button.on {
  position: relative;
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}
/* phones: no room in the bar - the language list is in the menu (hamburger) */
@media (max-width: 767px) {
  .lang-switch:not(.screen) { display: none; }
}
.lang-switch.screen button {
  font-size: 13px;
  line-height: 22px;
  padding: 0 12px;
}
</style>
