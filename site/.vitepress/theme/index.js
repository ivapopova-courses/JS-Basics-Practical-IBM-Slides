import { onMounted } from 'vue'
import CourseTheme from '@sciscend/course-kit/theme'
import RunCode from './RunCode.vue'
import { setupCodeFold } from './codeFold.js'
import './codeFold.css'

// The course-kit theme, plus folding of long code blocks (see codeFold.js) and our
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
  }
}
