# Course project

**A helper library for the JSON of one product.**

A small library of helper functions that makes writing check rules easier for
other users, mainly by making it simpler and safer to read properties from the
product's JSON. We build it for one product during the course; its structure
should make the next products easy to add.

## How it grows

| Session | What we add |
|---------|-------------|
| 5. Functions | `compareVersions(a, b)` and `versionBelow(a, b)` - compare version strings |
| 6. Objects | `get(doc, path, fallback)` - safe access to deep paths; the path as a string or an array (for keys with dots) |
| 7. Array methods | **kickoff**: your own repository, a chosen product, sample documents, `library.js`; helpers that group a list of records and build an index |
| 8. Strings, regex, dates | normalise versions in any format; parse dates and keys with a regular expression |
| 9. JSON, modules, errors | the library as a CommonJS module; a local runner that runs a rule on a folder of sample documents with a fake `emit`; clear errors for bad input |
| 10. Tests, types, review | tests with `node:test`; JSDoc types for the product's JSON; a README; presentation and code review |

## Deliverables

1. A CommonJS module for the product (`<product>.js`, or `library.js`) with
   documented helpers.
2. Tests with `node:test` on anonymised sample documents.
3. Two or three existing rules rewritten with the library.
4. A README with examples for other users.
5. JSDoc types (`@typedef`) for the product's JSON, checked with `// @ts-check`.

The minimum for the review: items 1, 2 and one rewritten rule. Items 3 - 5 can grow
after the course.

## The repository

A suggested layout (lecture 7 sets it up, lectures 9 and 10 fill it):

```text
my-library/
|-- library.js            the helpers (module.exports = { ... })
|-- rules/                rules rewritten with the library
|   `-- chk-0211.js
|-- samples/              anonymised sample documents, one JSON file each
|-- run-rule.js           runs a rule on every sample, with a fake emit (lecture 9)
|-- test/                 tests with node:test (lecture 10)
|   `-- library.test.js
|-- README.md             what the helpers do, with examples
`-- package.json
```

::: info Choices to make
Which product comes first, and which helpers are needed most. Collect
examples of rules that are hard to write today.
:::
