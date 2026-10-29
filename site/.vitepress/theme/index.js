import { onMounted } from 'vue'
import { useData } from 'vitepress'
import CourseTheme from '@sciscend/course-kit/theme'
import RunCode from './RunCode.vue'
import DataFile from './DataFile.vue'
import { setupCodeFold } from './codeFold.js'
import { setupScrollHash } from './scrollHash.js'
import { setupZoomImages } from './zoomImages.js'
import './codeFold.css'
import './diagram.css'
import './sidebar.css'
import './navbar.css'
import './footer.css'
import './zoomImages.css'

// The course-kit theme, plus folding of long code blocks (see codeFold.js), the
// #section of the page on screen in the address bar (scrollHash.js), our
// own RunCode (top-level await, Node-like output, Bulgarian buttons - see RunCode.vue),
// the preview of a data file (<DataFile file="sample-asset.json" />, DataFile.vue),
// diagrams that open bigger on a click (zoomImages.js), the grey unreleased
// lectures in the side menu (sidebar.css), a top bar that fits a phone and shows the
// whole site title (navbar.css) and the ProgressBG logo in the footer (footer.css).
export default {
  ...CourseTheme,
  enhanceApp(ctx) {
    CourseTheme.enhanceApp?.(ctx)
    // replace the kit's RunCode without Vue's "already registered" warning
    delete ctx.app._context.components.RunCode
    ctx.app.component('RunCode', RunCode)
    ctx.app.component('DataFile', DataFile)
  },
  setup() {
    CourseTheme.setup?.()
    // codeFold changes the page's HTML, so it must start only after Vue has hydrated
    // it; earlier changes made Vue duplicate the runnable blocks of long pages
    onMounted(setupCodeFold)
    onMounted(setupZoomImages)
    const data = useData()  // works only here, in setup
    onMounted(() => setupScrollHash(data))
  }
}
