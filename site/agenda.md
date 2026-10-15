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
| 3 | Comparisons, logic, conditions and loops |
| 4 | Arrays |
| 5 | Functions |
| 6 | Objects and deep property access |
| 7 | Array methods, functional style, built-in objects |
| 8 | JSON, Node.js, modules, errors; project kickoff |
| 9 | Tests and types: `node:test`, JSDoc, TypeScript basics |
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
- `if` / `else`, the ternary operator, `switch`.
- Loops: `for`, `while`, `break`, `continue`.
- **Practice:** the condition of the sample rule; classify a firmware version; cut the version
  out of `firmware_level` with a loop.

### 4. Arrays

- Creating arrays, index, `length`; `push`, `pop`, `slice`, `splice`.
- `indexOf`, `includes` (the model list in the sample rule); `split` and `join`.
- Loops over arrays: `for`, `for...of`; arrays of objects.
- **Practice:** a model allow-list; count matching elements; the highest firmware version.

### 5. Functions

- Declarations, expressions, arrow functions; parameters, defaults, `return`.
- Scope; why rule guidelines ask for `const` globals that are never changed; pure functions.
- The structure of a rule: helper functions first, then `rule(doc)`.
- Functions as values and callbacks.
- **Practice:** our own `versionBelow(a, b)`; the sample rule split into small helpers.

### 6. Objects and deep property access

- Object literals; dot vs bracket notation; keys with spaces (`"Firmware Level"`).
- Nested objects and long paths; a missing branch; `in` and `Object.hasOwn`.
- Optional chaining `?.`; spread and destructuring; references vs copies.
- `Object.keys`, `Object.values`, `Object.entries`, `for...in`.
- **Practice:** `get(doc, "inventory.details.firmware_level", fallback)`; the details
  object for `emit`, with `column_order`.

### 7. Array methods, functional style, built-in objects

- `forEach`, `map`, `filter`, `find`, `some`, `every`, `reduce`, `sort`.
- Chaining methods; when a plain loop is clearer.
- `String` methods (`trim`, `toLowerCase`, `startsWith`, `includes`, `padStart`),
  `Math`, `Date`.
- **Practice:** list the outdated elements; group by type with `reduce`; sort
  devices by firmware version.

### 8. JSON, Node.js, modules, errors; project kickoff

- JSON: `JSON.parse`, `JSON.stringify`; reading sample documents with `fs`.
- Modules: CommonJS (`require` / `module.exports`, as a shared `library.js`) and ES
  modules (`import` / `export`).
- Errors: `try` / `catch`, `throw`; defensive code for missing or odd data.
- Running a rule locally: a fake `emit()` and a sample document.
- **Project kickoff:** choose the product, collect samples, list the helpers, set
  up the repository.

### 9. Tests and types

- Testing with `node:test` and `assert` on sample documents and edge cases.
- Documenting helpers for other users: JSDoc and a README.
- TypeScript basics: annotations, union and literal types, interfaces for the JSON
  schema of a product; `// @ts-check` in plain JS files.
- **Practice:** tests and types for the course library.

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
