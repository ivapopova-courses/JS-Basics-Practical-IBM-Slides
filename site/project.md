# Final project

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

## Step by step

Every session from 6 on has about 15 minutes for the project. Between the sessions
you do one small step:

| Session | In class | At home, before the next session |
|---------|----------|----------------------------------|
| 6 | What the project is, and what you choose | Choose the product. Prepare two or three anonymised sample documents and two rules that are hard to read |
| 7 | **Kickoff**: your repository, `library.js` and `try.js` running on one sample (lecture 7, section 12) | Put `get`, `compareVersions` and `versionBelow` into the repository. Write down the paths your rules read again and again |
| 8 | The lists in your reports: which shape, and which helper reads it (`groupBy`, `nestRecords`, an index) | Add that helper. Collect the version and date formats of your product |
| 9 | `normalizeVersion` and a date parser for your formats; choose the rule you rewrite | Rewrite the rule with the library. Prepare the presentation |
| 10 | You present (10 - 15 minutes each); we write the first test for your library together | The project ends here. Recommended, on your own: the next steps below |

Anonymised means: no real customer names, serials, addresses or product names in
the repository.

## Deliverables

For the presentation in session 10 - the minimum:

1. A CommonJS module (`library.js`, or `<product>.js`) with your helpers; each one
   has a comment that says what it does, with an example.
2. Two or three anonymised sample documents, and a `try.js` that uses the library
   on them.
3. One existing rule rewritten with the library.

The course project ends with the presentation in session 10.

Recommended next steps, on your own after the course - the topics are taught in
session 10, and a follow-up course could start right here:

4. Tests with `node:test` on the sample documents.
5. JSDoc types (`@typedef`) for the product's JSON, checked with `// @ts-check`.
6. The local runner `run-rule.js`, and a README with examples for other users.
7. One or two more rules rewritten with the library.

## The repository

A suggested layout (the kickoff sets it up, lectures 9 and 10 fill it):

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
