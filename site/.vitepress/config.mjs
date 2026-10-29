import { posix } from 'node:path'
import { defineCourse } from '@sciscend/course-kit/config'
import { withLocales } from '../../i18n/i18n.mjs'
import { releasedUpTo } from './released.mjs'

// the footer (shown only on the home page - VitePress hides it next to the side
// menu): "Created for" and the ProgressBG logo, in place of the course-kit's
// "<course> - SciScend"; the text is translated in i18n/bg/_site.po
const footerMessage = 'Created for'

// all lectures are listed in the side menu; in `npm run build` (the public site)
// only the released ones are links, the others plain text - see released.mjs
const showAll = process.env.TRAINER === '1' || process.argv.includes('dev')
const lectureNo = link => Number(link.match(/(?:^|\/)lectures\/(\d\d)-/)?.[1] || 0)
const isReleased = link => showAll || lectureNo(link) <= releasedUpTo

const lectures = [
  { text: '1. Getting started', link: '/lectures/01-getting-started' },
  { text: '2. Variables, types, operators', link: '/lectures/02-variables-and-types' },
  { text: '3. Conditions and loops', link: '/lectures/03-conditions-and-loops' },
  { text: '4. Arrays and lists of records', link: '/lectures/04-arrays-and-records' },
  { text: '5. Functions, older code', link: '/lectures/05-functions' },
  { text: '6. Objects and data shapes', link: '/lectures/06-objects' },
  { text: '7. Array methods', link: '/lectures/07-array-methods' },
  { text: '8. Strings, regex, dates', link: '/lectures/08-strings-regex-dates' },
  { text: '9. JSON, Node.js, modules', link: '/lectures/09-json-node-modules-errors' },
  { text: '10. Tests, types, Git', link: '/lectures/10-tests-types-git' }
].map(it => (isReleased(it.link) ? it : { text: it.text })) // no link: grey text (theme/sidebar.css)

const course = defineCourse({
  title: 'Practical JavaScript Basics',
  description: 'JavaScript basics for beginners, on real-world JSON data',
  lang: 'en',
  // path relative to the course root (the directory vitepress is run from)
  data: 'data/sample-asset.json',
  // private trainer notes: a folder next to this repo, never published
  trainerDir: '../trainer',
  // the "In this lecture" column from 1152px (VitePress: 1280px), so it shows on a
  // laptop at 100% zoom
  asideMinWidth: 1152,
  nav: [
    { text: 'Agenda', link: '/agenda' },
    { text: 'Lectures', link: lectures.filter(it => it.link).at(-1).link },
    { text: 'Project', link: '/project' }
  ],
  sidebar: [
    {
      text: 'Course',
      items: [
        { text: 'Home', link: '/' },
        { text: 'Agenda', link: '/agenda' },
        { text: 'Calendar', link: '/calendar' },
        { text: 'How to use these pages', link: '/how-to' },
        { text: 'Example JSON document', link: '/example-document' },
        { text: 'Course project', link: '/project' },
        { text: 'Animations', link: '/under-the-hood' }
      ]
    },
    {
      text: 'Lectures',
      items: lectures
    }
  ]
})

course.themeConfig.footer = {
  message: `${footerMessage} <a class="footer-logo" href="https://progressbg.net" target="_blank" rel="noopener">` +
    `<img src="${course.base}images/progressbg-logo.png" alt="ProgressBG"></a>`
}

// unreleased lectures: no page (English and Bulgarian), and every link to them
// (agenda, index, cross-references) is rendered as its plain text
if (!showAll) {
  course.srcExclude = Array.from({ length: 99 - releasedUpTo }, (_, i) => String(releasedUpTo + 1 + i).padStart(2, '0'))
    .flatMap(nn => [`lectures/${nn}-*.md`, `*/lectures/${nn}-*.md`])
  const kitConfig = course.markdown.config
  course.markdown.config = md => {
    kitConfig(md)
    md.core.ruler.push('unreleased_links', state => {
      for (const block of state.tokens) {
        if (block.type !== 'inline' || !block.children) continue
        const out = []
        const drop = [] // per open link: is it dropped?
        for (const t of block.children) {
          if (t.type === 'link_open') {
            const href = t.attrGet('href') || ''
            const target = /^([a-z]+:|\/|#)/i.test(href) ? href : posix.join(posix.dirname(state.env.relativePath || ''), href)
            const hidden = !isReleased(target)
            drop.push(hidden)
            if (hidden) continue
          } else if (t.type === 'link_close' && drop.pop()) continue
          out.push(t)
        }
        block.children = out
      }
    })
  }
}

// withLocales: adds the Bulgarian version (site/bg/, generated from i18n/bg/*.po)
// and the EN / BG button - see i18n/README.md
export default await withLocales(course, { footerMessage })
