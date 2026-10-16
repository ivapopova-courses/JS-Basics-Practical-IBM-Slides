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

| Session | Topic |
|---------|-------|
| 1 | [Getting started](/lectures/01-getting-started): course setup, how a program runs, what a variable is |
| 2 | [Variables, types and operators](/lectures/02-variables-and-types) |
| 3 | [Comparisons, logic, conditions and loops](/lectures/03-conditions-and-loops) |
| 4 | [Arrays and lists of records](/lectures/04-arrays-and-records) |
| 5 | [Functions, and reading older code](/lectures/05-functions) |
| 6 | [Objects: deep paths, dictionaries, different data shapes](/lectures/06-objects) |
| 7 | Array methods: transforming and grouping data; project kickoff |
| 8 | Strings, regular expressions, dates and numbers |
| 9 | JSON, Node.js, modules, errors, tests, JSDoc types |
| 10 | Project review, Git workflow, wrap-up |

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

### 7. Array methods: transforming and grouping data

- `forEach`, `map`, `filter`, `find`, `some`, `every`, `reduce`, `sort` /
  `toSorted`.
- Chaining methods; when a plain loop is clearer.
- Turning a list of records into a nested object (group by resource, then by
  keyword); building an index once instead of searching thousands of records again
  and again (`Object.groupBy`, `Map`).
- The order of the alert columns, from the keys of the details object.
- **Project kickoff:** choose the product, the sample documents, the first helpers,
  set up the repository.
- **Practice:** outdated elements; group records; sort devices by firmware level.

### 8. Strings, regular expressions, dates and numbers

- `String` methods: `trim`, `toLowerCase`, `startsWith`, `endsWith`, `includes`,
  `slice`, `padStart`, `replaceAll`.
- Regular expressions: `test`, `match` and capture groups, `replace` with the `g`
  flag, the `i` flag; reading the patterns in existing rules.
- Versions in many formats (`4.2.1.7-B00`, `42107-C00`, `XR420_117`): normalise
  and compare - one shared helper instead of a copy in every rule.
- Dates: EPOCH seconds and milliseconds; parsing the date formats found in
  reports; `Date`, comparing and subtracting dates.
- `Number`, `parseInt`, `Math` (`max`, `min`, `round`, `floor`).
- **Practice:** clean and compare versions; parse keys like `"31_2.07"`; the age of
  a report from different date formats.

### 9. JSON, Node.js, modules, errors, tests

- JSON: `JSON.parse`, `JSON.stringify`; reading sample documents with `fs`.
- Modules: CommonJS (`require` / `module.exports`, as a shared `library.js`) and ES
  modules (`import` / `export`).
- Errors: `try` / `catch`, `throw`; why a `catch` that only returns hides bugs;
  defensive code for missing or odd data.
- Running a rule locally: a fake `emit()` and the sample documents.
- Testing with `node:test` and `assert` on sample documents and edge cases.
- Documenting helpers for other users: JSDoc, and types for a product's JSON with
  `@typedef` and `// @ts-check` (editor checks and autocomplete, no build step).
- **Practice:** a local runner, tests and JSDoc types for the course library.

### 10. Project review and wrap-up

- Present the library: helpers, rules rewritten with it, tests.
- Code review; the Git workflow with branches and pull requests.
- From one product to the next: a shared core plus a module per product.
- Q&A, next steps and resources.

## Homework

After each session there is a small task on the report JSON. It is reviewed
at the start of the next session (about 15 min).

## Course project

See [Course project](/project).
