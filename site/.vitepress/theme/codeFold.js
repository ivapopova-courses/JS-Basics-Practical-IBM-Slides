// Long code blocks start folded: the first FOLDED_LINES lines are shown, with a
// button under the block to show all of it (and to fold it again).
// Works for plain code blocks and for the runnable `js run` blocks (only their
// read-only view; Edit always shows the whole code). A MutationObserver picks up
// the blocks of every page, also after client-side navigation.

const MIN_LINES = 26        // fold blocks with more lines than this...
const FOLDED_LINES = 16     // ...and show this many lines while folded

const TEXT = {
  en: { more: n => `Show all ${n} lines`, less: 'Show less' },
  bg: { more: n => `Покажи всички ${n} реда`, less: 'Покажи по-малко' }
}

function texts() {
  return document.documentElement.lang.startsWith('bg') ? TEXT.bg : TEXT.en
}

function foldBlock(block) {
  if (block.dataset.fold) return
  const lines = block.querySelectorAll('pre code > .line').length
  if (lines <= MIN_LINES) { block.dataset.fold = 'short'; return }
  block.dataset.fold = 'folded'
  block.style.setProperty('--fold-lines', FOLDED_LINES)

  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'code-fold-toggle'
  const t = texts()
  const label = () => (block.dataset.fold === 'folded' ? t.more(lines) : t.less)
  button.textContent = label()
  button.setAttribute('aria-expanded', 'false')
  button.addEventListener('click', () => {
    const fold = block.dataset.fold !== 'folded'
    block.dataset.fold = fold ? 'folded' : 'open'
    button.textContent = label()
    button.setAttribute('aria-expanded', String(!fold))
    // after folding, keep the block in view instead of leaving the reader far below it
    if (fold && block.getBoundingClientRect().top < 0) {
      block.scrollIntoView({ block: 'start', behavior: 'smooth' })
    }
  })
  block.after(button)
}

function scan(root = document) {
  root.querySelectorAll('.vp-doc div[class*="language-"]').forEach(foldBlock)
}

export function setupCodeFold() {
  // called from the theme's onMounted (index.js): changing the server-rendered HTML
  // before Vue has hydrated it would confuse Vue
  scan()
  // fold at once, not after a delay: after client-side navigation (a link, the EN / BG
  // button, Back) VitePress scrolls to the #section or the saved position right
  // after rendering, and blocks folded later would move the page away from there
  new MutationObserver(() => scan()).observe(document.body, { childList: true, subtree: true })
}
