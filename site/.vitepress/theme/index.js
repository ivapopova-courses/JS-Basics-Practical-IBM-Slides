import { onMounted } from 'vue'
import { useData } from 'vitepress'
import CourseTheme from '@sciscend/course-kit/theme'
import RunCode from './RunCode.vue'
import { setupCodeFold } from './codeFold.js'
import { setupScrollHash } from './scrollHash.js'
import './codeFold.css'

// The course-kit theme, plus folding of long code blocks (see codeFold.js), the
// #section of the page on screen in the address bar (scrollHash.js) and our
// own RunCode (top-level await, Node-like output, Bulgarian buttons - see RunCode.vue).
export default {
  ...CourseTheme,
  enhanceApp(ctx) {
    CourseTheme.enhanceApp?.(ctx)
    // replace the kit's RunCode without Vue's "already registered" warning
    delete ctx.app._context.components.RunCode
    ctx.app.component('RunCode', RunCode)
  },
  setup() {
    CourseTheme.setup?.()
    // codeFold changes the page's HTML, so it must start only after Vue has hydrated
    // it; earlier changes made Vue duplicate the runnable blocks of long pages
    onMounted(setupCodeFold)
    const data = useData()  // works only here, in setup
    onMounted(() => setupScrollHash(data))
  }
}
