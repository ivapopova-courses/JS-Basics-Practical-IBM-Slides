import CourseTheme from '@sciscend/course-kit/theme'
import { setupCodeFold } from './codeFold.js'
import './codeFold.css'

// The course-kit theme, plus folding of long code blocks (see codeFold.js).
export default {
  ...CourseTheme,
  enhanceApp(ctx) {
    CourseTheme.enhanceApp?.(ctx)
    if (typeof window !== 'undefined') setupCodeFold()
  }
}
