import { defineCourse } from '@sciscend/course-kit/config'

export default defineCourse({
  title: 'JS & TS Basics',
  description: 'JavaScript and TypeScript basics for beginners',
  lang: 'en',
  // path relative to the course root (the directory vitepress is run from)
  data: 'data/sample-asset.json',
  // private trainer notes: a folder next to this repo, never published
  trainerDir: '../trainer',
  nav: [
    { text: 'Agenda', link: '/agenda' },
    { text: 'Lectures', link: '/lectures/02-variables-and-types' },
    { text: 'Project', link: '/project' }
  ],
  sidebar: [
    {
      text: 'Course',
      items: [
        { text: 'Home', link: '/' },
        { text: 'Agenda', link: '/agenda' },
        { text: 'How to use these pages', link: '/how-to' },
        { text: 'Course project', link: '/project' }
      ]
    },
    {
      text: 'Lectures',
      items: [
        { text: '1. Getting started', link: '/lectures/01-getting-started' },
        { text: '2. Variables, types, operators', link: '/lectures/02-variables-and-types' }
      ]
    }
  ],
  footerMessage: 'JS & TS Basics'
})
