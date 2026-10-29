// A diagram or a screenshot of a page (img.diagram, img.screenshot) opens bigger,
// over the whole page, on a click (or Enter when it has the focus). A click
// anywhere, Esc or the close button closes it. On a narrow screen (a phone) the
// picture is shown wider than the screen and can be scrolled sideways.
const IMAGES = '.vp-doc img.diagram, .vp-doc img.screenshot'
const TEXTS = {
  en: { open: 'Click to enlarge', close: 'Close' },
  bg: { open: 'Щракнете, за да увеличите', close: 'Затвори' }
}
const MARGIN = 24        // around the picture, in px
const MIN_FIT = 600      // narrower than this when fitted: show it wider and scroll
const NARROW = 920       // ... at this width (or its own, if smaller)

let overlay = null       // the open overlay: { el, img, source }

// the Bulgarian pages are under /bg/; the router changes the address before the page
const texts = () => (/\/bg(\/|$)/.test(location.pathname) ? TEXTS.bg : TEXTS.en)

function scan() {
  for (const img of document.querySelectorAll(IMAGES)) {
    if (img.dataset.zoom) continue
    img.dataset.zoom = '1'
    img.tabIndex = 0
    img.setAttribute('role', 'button')
    img.title = texts().open
  }
}

// the size of the picture in the overlay: as big as the screen allows
function resize() {
  if (!overlay) return
  const { img, source } = overlay
  const w = source.naturalWidth || source.width
  const h = source.naturalHeight || source.height
  const vw = document.documentElement.clientWidth - 2 * MARGIN
  const vh = window.innerHeight - 2 * MARGIN
  let width = Math.min(vw, vh * w / h)
  if (width < MIN_FIT) width = Math.max(width, Math.min(w, NARROW))
  img.style.width = `${Math.round(width)}px`
}

function open(source) {
  const t = texts()
  const el = document.createElement('div')
  el.className = 'zoom-overlay'
  el.setAttribute('role', 'dialog')
  el.setAttribute('aria-modal', 'true')
  el.setAttribute('aria-label', source.alt)
  const img = document.createElement('img')
  img.src = source.currentSrc || source.src
  img.alt = source.alt
  img.className = source.classList.contains('diagram') ? 'diagram' : 'screenshot'
  const close = document.createElement('button')
  close.type = 'button'
  close.className = 'zoom-close'
  close.setAttribute('aria-label', t.close)
  close.title = t.close
  close.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">' +
    '<path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>'
  el.append(img, close)
  el.addEventListener('click', hide)
  document.body.append(el)
  // the page under it does not scroll; scrollHash.js leaves the address alone then
  document.body.style.overflow = 'hidden'
  overlay = { el, img, source }
  resize()
  close.focus()
}

function hide() {
  if (!overlay) return
  const { el, source } = overlay
  overlay = null
  el.remove()
  document.body.style.overflow = ''
  if (source.isConnected) source.focus({ preventScroll: true })
}

export function setupZoomImages() {
  scan()
  new MutationObserver(scan).observe(document.querySelector('#app') || document.body, { childList: true, subtree: true })
  window.addEventListener('click', event => {
    const img = event.target.closest?.(IMAGES)
    if (img && !overlay) open(img)
  })
  // capture: while the overlay is open, no other key handler of the page (the
  // P and T of Present / Notes) gets the keys
  window.addEventListener('keydown', event => {
    if (overlay) {
      event.stopImmediatePropagation()
      if (event.key === 'Escape') hide()
      else if (event.key === 'Tab') event.preventDefault()      // the focus stays on the close button
      else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); hide() }
      return
    }
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches?.(IMAGES)) {
      event.preventDefault()
      open(event.target)
    }
  }, true)
  window.addEventListener('resize', resize)
}
