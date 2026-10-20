---
title: Agenda
outline: [2, 3]
---

# Agenda

**10 sessions of 4 academic hours**, 40 academic hours in total.

**Goal:** by the end of the course you can read and write check rules over JSON
documents with confidence, and you can build, test and document a small helper
library for the JSON of one product.

Every topic is shown on the kind of data you work with: the JSON report of one
device (`doc`) and a check rule.

## Sessions

|  | Date   | Topic |
|---------|--------|-------|
| 1 | Tue 06.10 | [Getting started](/lectures/01-getting-started): course setup, how a program runs, what a variable is |
| 2 | Wed 14.10 | [Variables, types and operators](/lectures/02-variables-and-types) |
| 3 | Wed 21.10 | [Comparisons, logic, conditions and loops](/lectures/03-conditions-and-loops) |
| 4 | Fri 23.10 | [Arrays and lists of records](/lectures/04-arrays-and-records) |
| 5 | Wed 28.10 | [Functions, and reading older code](/lectures/05-functions) |
| 6 | Fri 30.10 | [Objects: deep paths, dictionaries, different data shapes](/lectures/06-objects) |
| 7 | Wed 04.11 | [Array methods: transforming, grouping and indexing data](/lectures/07-array-methods); project kickoff |
| 8 | Fri 06.11 | [Strings, regular expressions, dates and numbers](/lectures/08-strings-regex-dates) |
| 9 | Wed 11.11 | [JSON, Node.js, modules and errors; running rules locally](/lectures/09-json-node-modules-errors) |
| 10 | Fri 13.11 | [Tests, JSDoc types and code quality; Git workflow; project review](/lectures/10-tests-types-git) |

## Session details

### 1. Getting started

- About the course, resources, environment: VSCode, Node.js, Git, GitHub.
- Introduction to JavaScript; text editor vs IDE.
- How a program runs; program structure; what a variable is.

### 2. Variables, types and operators

- Declaring and defining variables: `let`, `const` (and why not `var`); naming
  rules and conventions.
- Primitive types: number, string, boolean, `null`, `undefined`; `typeof`; `NaN`.
- Strings: quotes, escapes, template strings.
- Comments, assignment, arithmetic, `++` / `--`, operator precedence.
- From string to number and back: the values in the report JSON are strings.
- **Practice:** variables for the data of the sample rule; an alert message with a
  template string; the age of a report from its EPOCH.

### 3. Comparisons, logic, conditions and loops

- Comparison operators; `===` vs `==`; why `"4.10" < "4.2"` is `true`.
- Logical operators `&&`, `||`, `!`; truthy and falsy; `||` and `??` as defaults.
- `if` / `else`, `switch`, the ternary operator; guard clauses (stop early).
- Loops: `for`, `while`, `do...while`, `break`, `continue`.
- Reading the conditions in existing rules (older style).
- **Practice:** predict comparisons; classify a firmware level; the condition of
  the sample rule; versions with loops; `||` vs `??`.

### 4. Arrays and lists of records

- Creating arrays, index, `length`; `push`, `pop`, `slice`, `splice`, `at`.
- `indexOf`, `includes` (the model list in the sample rule); `split` and `join` -
  also for values packed into one string (`"a;b"`, `"key=value,key=value"`).
- Loops over arrays: `for`, `for...of`; `Array.isArray`.
- Arrays of objects: a long list of records (resource, keyword, value) - find,
  count and collect.
- **Practice:** a model allow-list; split a version into numbers; find records in a
  list of thousands.

### 5. Functions, and reading older code

- Declarations, expressions, arrow functions; parameters, defaults, `return`.
- Scope; `var` vs `let` / `const`, hoisting; why rule guidelines ask for `const`
  globals that are never changed; pure functions.
- Functions inside functions, closures; callbacks written as `function (x) {...}`
  and as arrows.
- The structure of a rule: helper functions first, then `rule(doc)`.
- Reading and modernising an older rule, step by step.
- **Practice:** our own `versionBelow(a, b)`; a long rule split into small helpers.

### 6. Objects: deep paths, dictionaries, different data shapes

- Object literals; dot vs bracket notation; keys with spaces or dots
  (`"Firmware Version"`, `"12_4.20"`).
- Nested objects and long paths; a missing branch; `in` and `Object.hasOwn`;
  optional chaining `?.`.
- Objects used as **dictionaries** (keys are ids): `Object.keys`, `Object.values`,
  `Object.entries`, `for...in`; reading information out of the key.
- The same data as an array in one document and as an object in another;
  flattened exports (`"a.b.c": [value]`).
- Spread and destructuring; references vs copies; `structuredClone`.
- **Practice:** `get(doc, path, fallback)` with the path as a string **or** an
  array; the details object for `emit`, with its columns in a fixed order.

### 7. Array methods: transforming, grouping and indexing data

- `forEach`, `map`, `filter`, `find` / `findIndex` / `findLast`, `some`, `every`,
  `reduce`; `flat` and `flatMap`.
- Sorting: `sort` with a compare function, `toSorted`; numbers, strings, versions,
  several keys.
- Chaining methods; when a plain loop is clearer; `console.table` for records.
- Turning a list of records into a nested object (group by resource, then by
  keyword); building an index once instead of searching thousands of records again
  and again (`Object.groupBy`, `Map`); unique values with `Set`.
- Reading the older forms: `function (x) { ... }` callbacks, `forEach` with `push`.
- **Project kickoff:** choose the product and the sample documents, set up the
  repository, start `library.js` with the first helpers.
- **Practice:** outdated elements; group records; sort devices by firmware level.

### 8. Strings, regular expressions, dates and numbers

- `String` methods: `trim`, `toLowerCase`, `startsWith`, `endsWith`, `includes`,
  `slice`, `padStart`, `replaceAll`, ...; text encoding: Unicode, UTF-8, line
  endings.
- Regular expressions: `test`, `match` and capture groups, `matchAll`, `replace`
  with the `g` flag, the `i` flag; reading the patterns in existing rules.
- Versions in many formats (`4.2.1.7-B00`, `42107-C00`, `XR420_117`): normalise
  and compare - one shared helper instead of a copy in every rule.
- Dates: EPOCH seconds and milliseconds; parsing the date formats found in
  reports; `Date`, time zones, comparing and subtracting dates.
- `Number`, `parseInt`, `toFixed`, `Math` (`max`, `min`, `round`, `floor`, ...).
- **Practice:** clean and compare versions; parse keys like `"31_2.07"`; the age of
  a report from different date formats.

### 9. JSON, Node.js, modules and errors; running rules locally

- JSON: the format, `JSON.parse`, `JSON.stringify`; what JSON cannot hold;
  reading sample documents with `fs`.
- Node.js and npm: `process`, `package.json`, built-in modules, the `console`
  object.
- Modules: CommonJS (`require` / `module.exports`, as a shared `library.js`) and ES
  modules (`import` / `export`).
- Errors: `try` / `catch` / `finally`, `throw`, the error types; why a `catch` that
  only returns hides bugs; defensive code for missing or odd data.
- Code that waits: promises, `async` / `await`, and `fetch` - JSON from a web API.
- Running a rule locally: a fake `emit()` and a folder of sample documents.
- **Practice:** JSON round trips; a module; errors with a clear message; a local
  rule runner.

### 10. Tests, JSDoc types and code quality; Git workflow; project review

- Testing with `node:test` and `assert`: helpers, edge cases, whole rules on
  sample documents.
- Documenting helpers for other users: JSDoc, and types for a product's JSON with
  `@typedef` and `// @ts-check` (editor checks and autocomplete, no build step).
- A linter (ESLint) and a formatter: finding bugs before the code runs.
- The Git workflow: branches, merging, conflicts, pull requests and code review.
- From one product to the next: a shared core plus a module per product.
- **Project review:** present the library - helpers, rules rewritten with it,
  tests; Q&A, next steps and resources.

## Homework

After each session there is a small task on the report JSON. It is reviewed
at the start of the next session (about 15 min).

## Course project

See [Course project](/project).
