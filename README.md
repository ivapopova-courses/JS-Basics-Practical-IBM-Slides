# Practical JavaScript Basics - Slides (course site)

The lectures of the course "Practical JavaScript Basics": 10 sessions of 4 academic hours,
JavaScript on real-world JSON data (an example JSON document and a
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
  edge to reset. Remembered per browser. The "In this lecture" column shows from a
  1152px wide window (`asideMinWidth` in `.vitepress/config.mjs`; VitePress: 1280px).
- **Run / Edit / Reset** under the examples: the code runs in the browser; the
  example JSON document is available as `doc`.

## Layout

```text
site/                          the course site (VitePress)
    index.md                   home page: the 10 sessions
    agenda.md                  course agenda
    calendar.md                the session calendar (Google Calendar, embedded) and its iCal address
    how-to.md, example-document.md, project.md
    lectures/NN-topic.md       one page per lecture
    under-the-hood.md          the animations, by session
    public/animations/         step-by-step animations (self-contained HTML, English)
    public/animations/bg/      the same animations in Bulgarian (EN / BG button in each)
    public/diagrams/           SVG diagrams, English and bg/ - made by tools/make-diagrams.py
    public/extensions.json     the recommended VSCode extensions (same as Homework/.vscode/)
    public/images/             the ProgressBG logo of the footer
    .vitepress/config.mjs      sidebar, nav, footer, the release of lectures (see below)
    .vitepress/released.mjs    the last lecture shown on the public site
    .vitepress/theme/          RunCode.vue + runInspect.js (runnable code, Node-like output),
                               DataFile.vue + jsonPreview.js + dataFiles.js (the viewer of a
                               data file), LangSwitch.vue (the EN / BG button), codeFold,
                               scrollHash, zoomImages (a diagram opens bigger on a click),
                               diagram.css, navbar.css (top bar on a phone), sidebar.css
                               (grey unreleased lectures), footer.css (the logo)
    bg/                        GENERATED Bulgarian pages (git-ignored, see i18n/)
i18n/                          translations: bg/*.po, the generator, translator guide, glossary
data/                          MADE-UP data files: COPIES of Homework/data/ (sample-asset.json,
                               report-*.json, reports/*.json) - change both together
tools/make-diagrams.py         writes site/public/diagrams/ (both languages) - run it after a change
```

Practice files are in the Homework repository; students run
`node 02-variables-and-types/practice/task1-rule-variables.js` from its root.

## Two languages

Every page is also in Bulgarian, under `/bg/`; the **EN / BG** button next to the
theme switch changes the language. English is the source. The translations are
gettext `.po` files in `i18n/bg/` (one per page), filled in by a translator; the
Bulgarian pages are generated from them on every `npm run dev` / `npm run build`.

```bash
npm run i18n:update     # after changing English pages: refresh the .po files
npm run i18n:status     # what is left to translate (and how many words)
npm run i18n:pack       # zip for the translator
npm run i18n:import -- <folder or files>   # the translator's files back
npm run i18n:check      # broken code, links or markup in translations
```

Workflow and details: [`i18n/README.md`](i18n/README.md).

## Writing a lecture

- **Runnable code:** write ` ```js run ` instead of ` ```js `.
- **Data files:** `<DataFile file="sample-asset.json" />` (or `"reports/lab-dev-05.json"`)
  shows `data/<file>` as a button that opens a viewer of the JSON file: a tree, every
  path with its value (with a filter), every list or dictionary of records as a table,
  the file as text (a file that is not valid JSON shows the error of `JSON.parse` at its
  line), and Download. A click on a value shows its path as code reads it
  (`doc.inventory.modules["12_4.20"].status`), with Copy. Read in the browser
  (`theme/jsonPreview.js`); used on `example-document.md`, works in lectures too.
- **Diagrams:** `![Alt text](/diagrams/name.svg){.diagram width=920 height=380}`
  (the size of the SVG: then the page does not jump when the image loads, and a link
  to a section below it lands in the right place); add the drawing and its English
  and Bulgarian texts to `tools/make-diagrams.py` and run it (`python3
  tools/make-diagrams.py`). In dark mode the site inverts them (`theme/diagram.css`).
  A click on a diagram opens it bigger, over the whole page (`theme/zoomImages.js`);
  nothing to add in the page.
- **Callouts:** `::: tip`, `::: warning`, `::: danger`, `::: info`, and
  `::: details Answer` for answers to check-yourself questions.
- **New lecture:** add the page to `lectures` in `.vitepress/config.mjs`, link it from
  `index.md` and `agenda.md`, and put its practice files in `NN-topic/` of the Homework
  repository. This can be done long before the session: the public site shows it only
  once it is released (next section).
- **Before class:** run every practice file and solution with `node`, and click
  through the page in `npm run dev`.
- **Translation:** after the English page is done, `npm run i18n:update`, then send
  the new `.po` file to the translator (`npm run i18n:pack`).

## Releasing a lecture

All lectures can be written in advance. The public site (`npm run build`, run by
GitHub Actions) shows only the lectures up to the number in
`site/.vitepress/released.mjs`. A lecture with a higher number has no page in
either language and is not in the search; the side menu lists it as grey text, and
every link to it (agenda, index, "see lecture N" in other lectures) is shown as
plain text. The "Lectures" menu at the top opens the last released lecture.
`npm run dev` and `TRAINER=1` builds show all lectures.

On the session day (or just before it), `sh trainer/tools/release-session.sh NN`
(in the private trainer repo) raises `releasedUpTo`, builds, commits, releases the
homework of the session and asks before it pushes. By hand:

1. Raise `releasedUpTo` in `site/.vitepress/released.mjs` to the session's number.
2. `npm run build` - check that the new page is in `site/.vitepress/dist/lectures/`.
3. Commit and push; GitHub Pages deploys.

The source of unreleased lectures is still in the repository (and readable on
GitHub); only the site hides it.

## Licence

CC BY-NC-SA 4.0 - see `LICENSE`. Copyright SciScend.

---

Built with Claude Sonnet 5.5 via Claude Code. Published by [SciScend](https://sciscend.com/).
