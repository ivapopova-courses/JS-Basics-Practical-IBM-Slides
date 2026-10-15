import { defineCourse } from '@sciscend/course-kit/config'

export default defineCourse({
  title: 'Practical JavaScript Basics',
  description: 'JavaScript basics for beginners, on real-world JSON data',
  lang: 'en',
  // path relative to the course root (the directory vitepress is run from)
  data: 'data/sample-asset.json',
  // private trainer notes: a folder next to this repo, never published
  trainerDir: '../trainer',
  nav: [
    { text: 'Agenda', link: '/agenda' },
    { text: 'Lectures', link: '/lectures/03-conditions-and-loops' },
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
        { text: '2. Variables, types, operators', link: '/lectures/02-variables-and-types' },
        { text: '3. Conditions and loops', link: '/lectures/03-conditions-and-loops' }
      ]
    }
  ],
  footerMessage: 'Practical JavaScript Basics'
})
