<script setup>
// The language row of the phone menu (hamburger), in place of VitePress'
// VPNavScreenTranslations (alias in i18n/i18n.mjs): the same EN / BG buttons as in
// the bar, so the other language opens at the same section (LangSwitch.vue).
import { computed } from 'vue'
import { useData } from 'vitepress'
import LangSwitch from './LangSwitch.vue'

const { site, lang } = useData()
const show = computed(() => Object.keys(site.value.locales || {}).length > 1)
const label = computed(() => (String(lang.value || '').startsWith('bg') ? 'Език' : 'Language'))
</script>

<template>
  <div v-if="show" class="lang-switch-screen">
    <p class="text">{{ label }}</p>
    <LangSwitch screen />
  </div>
</template>

<style scoped>
/* looks like the Appearance row under it (VPNavScreenAppearance); the spacing
   comes from VPNavScreen (class "translations") */
.lang-switch-screen {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 8px;
  padding: 12px 14px 12px 16px;
  background-color: var(--vp-c-bg-soft);
}
.text {
  line-height: 24px;
  font-size: 12px;
  font-weight: 500;
  color: var(--vp-c-text-2);
}
</style>
