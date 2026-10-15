# JS & TS Basics - Slides (course site)

The lectures of the course "JS & TS Basics": 10 sessions of 4 academic hours,
JavaScript and TypeScript on real-world JSON data (a sample device report and a
check rule over it).

Live site: https://ivapopova-courses.github.io/JS-Basics-Practical-IBM-Slides/

The site is built with [VitePress](https://vitepress.dev/): every lecture is one
Markdown page, with a sidebar, search, dark mode, and code examples you can run and
edit on the page.

The course has three public repositories and one private one, cloned side by side
in one course folder:

| Folder | Repository | What it is |
|---|---|---|
| `Slides/` | https://github.com/ivapopova-courses/JS-Basics-Practical-IBM-Slides | this repo - the lectures |
| `Homework/` | https://github.com/ivapopova-courses/JS-Basics-Practical-IBM-Homework | practice tasks and homework |
| `Labs/` | https://github.com/ivapopova-courses/JS-Basics-Practical-IBM-Labs | code written in class |
| `trainer/` | private | trainer notes and solutions |

## Run it

```bash
npm install          # once
npm run dev          # live preview at http://localhost:5173, reloads on save
npm run build        # static site in site/.vitepress/dist (for GitHub Pages)
```

## In class

- **Present** (button in the top bar, or key `P`): bigger text, no side panels -
  for the projector.
- **Notes** (button, key `T`, or `?trainer` in the URL): shows the yellow
  "Trainer notes" boxes, if a page has any. Only with `npm run dev:trainer`, which
  reads the notes from `../trainer` (`trainerDir` in `.vitepress/config.mjs`). The
  public build has none.
- **Panel widths:** drag the inner edge of the left navigation or of the "In this
  lecture" column, to any width from 0 (hidden) to 640 px; or click the edge and
  use the Left / Right arrows (Shift for bigger steps). A hidden panel leaves a
  tab at the window edge - click it to show the panel again. Double-click the
  edge to reset. Remembered per browser.
- **Run / Edit / Reset** under the examples: the code runs in the browser; the
  sample device report is available as `doc`.

## Layout

```text
site/                          the course site (VitePress)
    index.md                   home page: the 10 sessions
    agenda.md                  course agenda
    how-to.md, project.md
    lectures/NN-topic.md       one page per lecture
    .vitepress/config.mjs      sidebar, nav, the "js run" and "::: trainer" extensions
    .vitepress/theme/          RunCode.vue (runnable code), ModeToggles.vue, custom.css
data/sample-asset.json         MADE-UP sample device report (same file as in Homework/data/)
```

Practice files are in the Homework repository; students run
`node 02-variables-and-types/practice/task1-rule-variables.js` from its root.

## Writing a lecture

- **Runnable code:** write ` ```js run ` instead of ` ```js `.
- **Callouts:** `::: tip`, `::: warning`, `::: danger`, `::: info`, and
  `::: details Answer` for answers to check-yourself questions.
- **New lecture:** add the page to `sidebar` in `.vitepress/config.mjs`, link it from
  `index.md` and `agenda.md`, and put its practice files in `NN-topic/` of the Homework repository.
- **Before class:** run every practice file and solution with `node`, and click
  through the page in `npm run dev`.

## Licence

CC BY-NC-SA 4.0 - see `LICENSE`. Copyright SciScend.

---

Built with Claude Sonnet 5.5 via Claude Code. Published by [SciScend](https://sciscend.com/).
