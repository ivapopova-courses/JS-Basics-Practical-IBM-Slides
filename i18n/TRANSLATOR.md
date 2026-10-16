# Instructions for the translator

Thank you for translating the course site "Practical JavaScript Basics" from
English into Bulgarian. The readers are adults who learn JavaScript for their job;
they read English technical documentation every day.

The English site: https://ivapopova-courses.github.io/JS-Basics-Practical-IBM-Slides/
(open it to see the context of a text).

## The files

You get one `.po` file per page of the site (for example
`lectures/03-conditions-and-loops.po`) and `_site.po` with the menus. Open them in
**Poedit** (free, https://poedit.net) or in your translation tool (memoQ, Trados,
Phrase and others read `.po` files).

Each entry is one piece of text:

```po
#. paragraph
#: site/lectures/03-conditions-and-loops.md:233
msgid "Logical operators combine conditions:"
msgstr ""
```

- `msgid` - the English text. **Do not change it.**
- `msgstr` - your translation. Fill in only this.
- `#.` - what kind of text it is: `heading`, `paragraph`, `table cell`, `box title`,
  `menu`, ... A heading, a table cell, a box title and a menu item must stay **one line**.
- `#:` - where it is in the English source (file and line), if you need the context.
- `#, fuzzy` - the English text changed since it was translated. The old
  translation is filled in as a suggestion, and the old English text is shown in the
  `#|` line. Check it, correct it, and remove the fuzzy mark (in Poedit: turn off
  "Needs work"). A fuzzy translation is not used on the site.

Translate only the entries with an empty or fuzzy `msgstr`. If you see a mistake in
an existing translation, you may correct it.

## Keep these exactly as they are

The text is Markdown. These parts must appear in your translation unchanged (you may
move them to a different place in the sentence):

| What | Example | In the translation |
|---|---|---|
| Code in backticks | `` `firmware_level` ``, `` `if` / `else` `` | the same, also in headings and table cells |
| Link target in `( )` | `[next lecture](/lectures/02-variables-and-types)` | `[следващата лекция](/lectures/02-variables-and-types)` - translate only the text in `[ ]` |
| Attributes in `{ }` | `{target="_blank"}` | the same, right after the link |
| HTML tags | `<span>Session 3</span>` | `<span>Занятие 3</span>` |
| Web addresses | `https://github.com/...` | the same |
| Bold and italic markers | `**not**`, `*truthy*` | the same number of `**` and `*` |
| A `\|` in a table cell | `` `\|\|` `` | the same `\|` (a plain `|` breaks the table) |

Run `npm run i18n:check` if you have the project; otherwise the course author runs it
when your files come back.

## Terms and style

- **Technical terms stay in English** where the English word is what the readers
  meet in documentation and code. The list is in `glossary.md` - please follow it,
  so that all pages use the same words.
- Address the reader with the polite plural ("вие"): "Отворете файла", "Пишете
  `const`".
- Short, plain sentences, like the English text.
- **ASCII punctuation only:** straight quotes `"..."` (not the Bulgarian low-high
  quotes or angle quotes), a hyphen with spaces ` - ` as a dash (not an en dash or
  em dash), three dots `...` (not the single ellipsis character).
- Names of course elements in English stay as they are: Run, Edit, Reset, Present,
  OK, FAIL, `your code`, the repository names Homework and Labs.

## Returning the files

Send back the `.po` files you worked on. The file names do not matter, but please
do not delete the header (the first entry with `X-Source-File`).
