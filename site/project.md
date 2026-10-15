# Course project

**A helper library for the JSON of one product.**

A small library of helper functions that makes writing check rules easier for
other users, mainly by making it simpler and safer to read properties from the
product's JSON. We build it for one product during the course; its structure
should make the next products easy to add.

## How it grows

| Session | What we add |
|---------|-------------|
| 5. Functions | `versionBelow(a, b)` - compare version strings |
| 6. Objects | `get(doc, "a.b.c", fallback)` - safe access to deep paths |
| 7. Array methods | helpers for lists inside the document |
| 8. Kickoff | your own repository, a chosen product, sample documents |
| 9. Tests and types | tests with `node:test`, JSDoc, TypeScript types |
| 10. Review | presentation and code review |

## Deliverables

1. A CommonJS module for the product (`<product>.js`) with documented helpers.
2. Tests with `node:test` on anonymised sample documents.
3. Two or three existing rules rewritten with the library.
4. A README with examples for other users.
5. Optional: TypeScript types for the product's JSON schema.

::: info Choices to make
Which product comes first, and which helpers are needed most. Collect
examples of rules that are hard to write today.
:::
