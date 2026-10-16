import { defineCourse } from '@sciscend/course-kit/config'
import { withLocales } from '../../i18n/i18n.mjs'

const footerMessage = 'Practical JavaScript Basics'

// withLocales: adds the Bulgarian version (site/bg/, generated from i18n/bg/*.po)
// and the EN / BG button - see i18n/README.md
export default await withLocales(defineCourse({
  title: 'Practical JavaScript Basics',
  description: 'JavaScript basics for beginners, on real-world JSON data',
  lang: 'en',
  // path relative to the course root (the directory vitepress is run from)
  data: 'data/sample-asset.json',
  // private trainer notes: a folder next to this repo, never published
  trainerDir: '../trainer',
  nav: [
    { text: 'Agenda', link: '/agenda' },
    { text: 'Lectures', link: '/lectures/05-functions' },
    { text: 'Project', link: '/project' }
  ],
  sidebar: [
    {
      text: 'Course',
      items: [
        { text: 'Home', link: '/' },
        { text: 'Agenda', link: '/agenda' },
        { text: 'How to use these pages', link: '/how-to' },
        { text: 'Course project', link: '/project' },
        { text: 'Animations', link: '/under-the-hood' }
      ]
    },
    {
      text: 'Lectures',
      items: [
        { text: '1. Getting started', link: '/lectures/01-getting-started' },
        { text: '2. Variables, types, operators', link: '/lectures/02-variables-and-types' },
        { text: '3. Conditions and loops', link: '/lectures/03-conditions-and-loops' },
        { text: '4. Arrays and lists of records', link: '/lectures/04-arrays-and-records' },
        { text: '5. Functions, older code', link: '/lectures/05-functions' }
      ]
    }
  ],
  footerMessage
}), { footerMessage })
