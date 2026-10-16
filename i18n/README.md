# Translations (Bulgarian version of the site)

The site has an English and a Bulgarian version. The **EN / BG** button next to the
theme switch opens the same page, at the same section, in the other language
(on a phone: in the menu). English is the source; the Bulgarian pages are
generated from it and from the translations in `i18n/bg/`.

```text
site/**/*.md (English)  --npm run i18n:update-->  i18n/bg/**/*.po  (one file per page)
                                                       |  the translator fills in msgstr
site/**/*.md + i18n/bg/*.po  --npm run dev / build-->  site/bg/**/*.md  (generated, git-ignored)
```

- The `.po` files (gettext) are the standard format for translators: Poedit (free)
  and every professional translation tool (memoQ, Trados, Phrase, Crowdin,
  Weblate) open them. Each entry is one piece of text: a heading, a paragraph, a
  list item, a table cell, a box title, a menu item.
- When the English text changes, the translation of the unchanged pieces is kept.
  A changed piece gets its old translation as a suggestion, marked **fuzzy** (needs
  review). New pieces are empty. Text that was removed stays at the end of the file
  (`#~` lines) and is used as a suggestion if similar text comes back.
- Until a piece is translated (or while it is fuzzy), the Bulgarian page shows the
  English text, with a "translation not finished" box under the title.

## Workflow

1. Change or add English pages as usual (`site/...`).
2. `npm run i18n:update` - refreshes `i18n/bg/*.po` from the English text.
3. `npm run i18n:status` - what is translated, fuzzy, missing, and how many English
   words are left (translators charge per word).
4. `npm run i18n:pack` - copies the `.po` files that need work, with
   `TRANSLATOR.md` and `glossary.md`, to `i18n/out/bg-<date>/` and zips it. Send the
   zip. (`npm run i18n:pack -- --all` packs every file, for a full review.)
5. The translator sends the `.po` files back. Import them (files or a folder):

   ```bash
   npm run i18n:import -- ~/Downloads/bg-2026-10-16
   ```

   Import takes only the filled-in translations, matches each file by its
   `X-Source-File` header (the file name does not matter), and then runs `update`.
   If the English changed while the files were out, those translations become
   fuzzy suggestions - nothing is lost.
6. `npm run i18n:check` - finds broken translations: changed code in backticks,
   link targets, HTML tags, `{...}` attributes, bold markers, a `|` in a table cell,
   typographic quotes or dashes. Fix them in the `.po` file.
7. `npm run dev` and look at the page under `/bg/`.
8. Commit the English pages **and** `i18n/bg/`. `site/bg/` is never committed: the
   site config generates it on every `npm run dev` and `npm run build` (also on
   GitHub Actions).

Small fixes you can make yourself: open the `.po` file in Poedit (or any text
editor), change the `msgstr`, and run `npm run i18n:check`. In `npm run dev`, a saved
`.po` file updates the page at once (except `_site.po`: restart the dev server).

## What is translated

| Part | Translated? |
|---|---|
| Headings, paragraphs, lists, tables, box titles (`::: tip Title`), HTML text | yes |
| Front matter: `title`, `description`, and the home page hero and features | yes |
| Menus, site title and description | yes, in `i18n/bg/_site.po` |
| Theme labels ("On this page", "Previous", search, default box titles) | in `LANGS` in `i18n/i18n.mjs` |
| Code blocks (also their comments), text in backticks | no - code stays English |
| `::: trainer` blocks | no |
| The animations | separate Bulgarian copies in `site/public/animations/bg/` |

Details the generator takes care of:

- **Anchors stay English.** Every Bulgarian heading gets the id of the English one
  (`## 10. Loops {#_10-loops}`), so `#section` links, the trainer's links and the
  language button keep the position.
- **Links.** Site links get the `/bg` prefix (`/agenda` -> `/bg/agenda`); links to files
  in `site/public/` (the animations) are adjusted to the deeper folder, and point to
  the Bulgarian copy when one exists (`animations/x.html` -> `animations/bg/x.html`).
- **Untranslated text** shows in English, never as an empty line.

## Not covered (yet)

- Trainer notes (`npm run dev:trainer`) are shown on the English pages only: the
  kit matches the notes by English heading text and by the path `lectures/...`.
- The kit's buttons (Present, Notes, Run, Edit, Reset) stay in English.
- Another language: add it to `LANGS` in `i18n/i18n.mjs` and `site/<lang>/` to
  `.gitignore`, then `npm run i18n:update <lang>`.

## Files

| File | What it is |
|---|---|
| `i18n/i18n.mjs` | the generator: segmenting, `.po` read/write, merge, build, check, the locale config |
| `i18n/cli.mjs` | the commands behind `npm run i18n:*` |
| `i18n/bg/**/*.po` | the Bulgarian translations, one file per English page |
| `i18n/bg/_site.po` | menus, site title and description, footer |
| `i18n/TRANSLATOR.md` | instructions for the translator (goes into every pack) |
| `i18n/glossary.md` | terms: what stays in English, how the rest is translated |
| `site/.vitepress/theme/LangSwitch.vue` | the EN / BG button (replaces VitePress' language menu) |
| `site/.vitepress/config.mjs` | `withLocales(...)` adds the Bulgarian locale |
