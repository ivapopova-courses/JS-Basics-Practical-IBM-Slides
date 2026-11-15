# Translations (Bulgarian version of the site)

The site has an English and a Bulgarian version. English is the source; the
Bulgarian pages (`site/bg/`, git-ignored) are generated on every `npm run dev` and
`npm run build` from the English pages and the translations in `bg/*.po`.

The generator, its commands (`npm run i18n:*`), the EN / BG button, the
instructions for the translator and the common glossary are in the course kit, the
same for every course. **How it all works, and the workflow:**
`node_modules/@sciscend/course-kit/i18n/README.md`
(https://github.com/SciScend/course-kit/blob/main/i18n/README.md).

This folder holds only what belongs to this course:

| File | What it is |
|---|---|
| `bg/**/*.po` | the Bulgarian translations, one file per English page |
| `bg/_site.po` | menus, site title and description, footer |
| `glossary.md` | the terms of this course: what stays in English, how the rest is translated |
| `config.json` | the course name (in the header of the `.po` files), the site address and the readers (for the translator's instructions) |
| `out/` | generated, git-ignored: packs for a translator, todo files |

The commands, in short:

```bash
npm run i18n:update     # after changing English pages: refresh the .po files
npm run i18n:status     # what is translated, fuzzy, missing
npm run i18n:todo -- 03 # the texts still to translate of the pages with "03" in the name, as plain text
npm run i18n:pack       # zip for a translator (the .po files that need work)
npm run i18n:import -- <folder or files>   # a translator's files, or the answers to a todo
npm run i18n:check      # translations that changed code, links, tags, attributes
npm run check           # all checks of the site, these included
```

Of this course:

- The animations have separate Bulgarian copies in `site/public/animations/bg/`, and
  the diagrams in `site/public/diagrams/bg/` (`tools/make-diagrams.py`).
- A machine translation gets `Last-Translator: Claude <model> (machine translation -
  to review)` in the header of its `.po` file
  (`npm run i18n:import -- --translator="..."`).
