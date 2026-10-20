// While the reader scrolls, the address bar follows: it shows the #id of the section
// on screen, as if its heading had been clicked. So a copied link, a reload and the
// EN / BG button (LangSwitch.vue keeps the #id) all open the same place.
// The current section is found like VitePress' "In this page" outline does it: the
// last heading above the top of the page (under the nav bar); the last one at the
// page bottom; none at the page top.
import { getScrollOffset } from 'vitepress'

const HEADINGS = '.vp-doc :is(h2, h3)[id]'

function currentHash() {
  const headings = [...document.querySelectorAll(HEADINGS)]
  if (!headings.length || window.scrollY < 1) return ''
  const atBottom = Math.abs(window.scrollY + window.innerHeight - document.body.offsetHeight) < 1
  if (atBottom) return '#' + headings[headings.length - 1].id
  let current = ''
  for (const h of headings) {
    if (h.getBoundingClientRect().top > getScrollOffset() + 4) break
    current = '#' + h.id
  }
  return current
}

function update(page, site) {
  // a menu or the search box locks the page (the scroll position is then not the
  // reader's), or Back / a link has changed the URL but not yet the page on screen
  if (document.body.style.overflow === 'hidden') return
  if (decodeURI(location.pathname) !== pagePath(page, site)) return
  const hash = currentHash()
  if (decodeURIComponent(location.hash) === hash) return
  // replaceState, not a new history entry per section; keep history.state, the
  // VitePress router ignores Back/Forward to entries without it
  history.replaceState(history.state, '', location.pathname + location.search + hash)
}

// Scroll to the heading of `hash` the way VitePress does for a #link (LangSwitch.vue
// uses it again once the fonts of the other language have loaded)
export function scrollToHash(hash) {
  let target = null
  try { target = hash && document.getElementById(decodeURIComponent(hash).slice(1)) } catch { }
  if (!target) return
  const padding = parseInt(getComputedStyle(target).paddingTop, 10) || 0
  window.scrollTo(0, window.scrollY + target.getBoundingClientRect().top - getScrollOffset() + padding)
}

// the address of the page on screen, as VitePress computes it (router.js)
function pagePath(page, site) {
  let path = site.base + page.relativePath.replace(/(?:(^|\/)index)?\.md$/, '$1')
  if (!site.cleanUrls && !path.endsWith('/')) path += '.html'
  return path
}

// `data`: useData(), from the theme's setup (index.js)
export function setupScrollHash({ page, site }) {
  // a page opened with a #section (a link, a reload): VitePress measures where the
  // section is before codeFold.js has folded the long blocks above it, and scrolls
  // there in the next frame - too far, as the folding has moved the section up. So
  // scroll to it again after that frame, and once more when the fonts are in (they
  // reflow the text too), unless the reader has scrolled in between.
  const hash = location.hash
  if (hash) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      scrollToHash(hash)
      const y = window.scrollY
      document.fonts.ready.then(() => {
        if (window.scrollY === y && location.hash === hash) scrollToHash(hash)
      })
    }))
  }

  let pending = false
  window.addEventListener('scroll', () => {
    if (pending) return
    pending = true
    requestAnimationFrame(() => {
      pending = false
      update(page.value, site.value)
    })
  }, { passive: true })
}
