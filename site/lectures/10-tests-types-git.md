---
title: 10. Tests, types, Git; review
---

# 10. Tests, JSDoc types and code quality; Git workflow; project review

<div class="lecture-meta">
  <span>Session 10</span><span>practice: <code>10-tests-types-git/</code> in the homework repository</span>
  <span><a href="../example-document"><code>doc</code>: the example JSON document</a></span>
</div>

**Today you will learn to:**

- write automated **tests** with `node:test` and `assert` - for helpers, for edge
  cases, and for whole rules on sample reports - and run them with `node --test`;
- document helpers with **JSDoc**, so that other users see what a helper takes and
  returns;
- describe the JSON of a product with `@typedef`, and let `// @ts-check` find typos
  and wrong types while you type - without TypeScript and without a build step;
- check code with a **linter** (ESLint) and format it with a **formatter**
  (Prettier);
- work with Git **branches**: merge them, resolve a conflict, and use **pull
  requests** for code review;
- organise a library for several products: a shared core and a module per product;
- review an existing rule like a reviewer - and present your course project.

Where this fits - the last pieces of the course project: the library documents its
helpers, and a test file checks them and a rule. The number in each comment is the
section of this lecture:

```js
// library.js
// @ts-check                                           7. the editor checks the types

/**
 * The parts of one enclosure in a report.             6. a type for the report
 * @typedef {object} Enclosure
 * @property {string} id
 * @property {string} firmware
 * @property {"normal" | "degraded" | "failed"} state
 */

/**
 * Compare two dotted versions, part by part, as numbers.      5. JSDoc
 * @param {string} a
 * @param {string} b
 * @returns {-1 | 0 | 1} -1 if a is lower, 0 if equal, 1 if higher
 * @example compareVersions("4.10", "4.2")   // 1
 */
function compareVersions(a, b) { /* ... lecture 5 ... */ }

module.exports = { compareVersions };
```

```js
// test/library.test.js - run all tests with: node --test
const { test } = require("node:test");                 // 3. the test runner
const assert = require("node:assert/strict");          // 2. the checks
const { compareVersions } = require("../library.js");

test("compares the parts as numbers, not as text", () => {
    assert.equal(compareVersions("4.10", "4.2"), 1);
    assert.equal(compareVersions("2.9", "2.14"), -1);
});

test("missing parts count as 0", () => {               // 4. an edge case
    assert.equal(compareVersions("4.2", "4.2.0.0"), 0);
});
```

- The practice files of this course have checked your code with `check(...)` since
  lecture 2 - a small test framework. Today you use the real one, and write the
  tests yourself.
- The rest of the session is about working **together** on code: types and comments
  that explain it, tools that keep it clean, and Git branches and pull requests for
  review.

## 1. Why tests?

Until now you checked a helper by running it and reading the output. That works
once. But code changes: a new version format, a fix for one product, a refactoring.
After every change, every old case must still work.

An **automated test** is a small program that calls your code with known input and
**checks** the result. It runs in a second, as often as you want, and says exactly
which case broke.

- **Regression**: a bug that was fixed once must not come back. Every fixed bug gets
  a test.
- **Courage to change**: with tests, you can modernise an old helper (lecture 5) and
  know at once if anything changed.
- **Documentation**: a test shows how a helper is meant to be used -
  `compareVersions("4.2", "4.2.0.0")` is `0`.
- **For rules**: the rule engine cannot run your rule locally - your tests can, on
  every sample report, in a second (lecture 9).

A test, at its simplest:

```js run
function compareVersions(a, b) {
    const pa = String(a ?? "").split(".").map(x => parseInt(x, 10) || 0);
    const pb = String(b ?? "").split(".").map(x => parseInt(x, 10) || 0);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const x = pa[i] ?? 0, y = pb[i] ?? 0;
        if (x !== y) return x < y ? -1 : 1;
    }
    return 0;
}

// a tiny test framework - like check.js of the practice files
let passed = 0, failed = 0;
function test(name, fn) {
    try {
        fn();
        passed++;
        console.log("ok   " + name);
    } catch (err) {
        failed++;
        console.log("FAIL " + name + ": " + err.message);
    }
}
function assertEqual(actual, expected) {
    if (actual !== expected) throw new Error(`expected ${expected}, got ${actual}`);
}

test("4.10 is higher than 4.2", () => assertEqual(compareVersions("4.10", "4.2"), 1));
test("2.9 is lower than 2.14", () => assertEqual(compareVersions("2.9", "2.14"), -1));
test("missing parts count as 0", () => assertEqual(compareVersions("4.2", "4.2.0.0"), 0));
test("a wrong expectation", () => assertEqual(compareVersions("1.0", "1.1"), 1));
console.log(`${passed} passed, ${failed} failed`);
```

A test is a function; a failing check **throws**; the framework catches the error,
counts and reports. Node.js has this built in: `node:test` and `node:assert`.

## 2. `assert`: the checks

The module `node:assert/strict` has functions that throw an `AssertionError` when a
check fails:

| Function | Passes when |
|---|---|
| `assert.equal(actual, expected)` | `actual === expected` (in the strict module) |
| `assert.notEqual(actual, expected)` | `actual !== expected` |
| `assert.deepEqual(actual, expected)` | same structure and values - objects and arrays compared **by content**, key order ignored |
| `assert.ok(value)` | `value` is truthy |
| `assert.match(text, /pattern/)` | the text matches the regular expression |
| `assert.throws(fn, expected)` | `fn()` throws (optionally: this type or message) |
| `assert.rejects(promise)` | the promise rejects (with `await`) |

```js
const assert = require("node:assert/strict");

assert.equal(1 + 1, 2);                                 // passes
assert.deepEqual({ a: 1, b: [2] }, { b: [2], a: 1 });   // passes: same content
assert.match("ENC-03: degraded", /degraded/);           // passes
assert.throws(() => JSON.parse("{"), SyntaxError);      // passes: it throws a SyntaxError
assert.throws(() => requireField({}, "a.b"), { message: "missing field: a.b" });

assert.equal("1", 1);              // AssertionError: Expected values to be strictly equal
assert.deepEqual([1, 2], [2, 1]);  // AssertionError: the order of array elements matters
```

- Use **`node:assert/strict`**: there `equal` and `deepEqual` compare strictly
  (`===`, no type conversion). The plain `node:assert` has older, loose versions -
  `assert.equal("1", 1)` passes there.
- `deepEqual` replaces the `JSON.stringify(a) === JSON.stringify(b)` of the practice
  files: it ignores the order of the keys and shows **what** differs.
- Every function takes a last, optional argument: a message for the failure -
  `assert.ok(alerts.length > 0, "expected an alert for lab-dev-02")`.

Why `deepEqual` and not `JSON.stringify`? The same data with the keys in another
order gives two different texts:

```js run
const expected = { id: "ENC-03", state: "degraded" };
const actual = { state: "degraded", id: "ENC-03" };      // built in another order

console.log(JSON.stringify(actual) === JSON.stringify(expected));   // false

// what deepEqual does, in short: compare the keys and then every value
function sameContent(a, b) {
    if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return a === b;
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    const keys = Object.keys(a);
    if (keys.length !== Object.keys(b).length) return false;
    return keys.every(k => sameContent(a[k], b[k]));
}
console.log(sameContent(actual, expected));             // true
console.log(sameContent([1, 2], [2, 1]));               // false - arrays keep their order
```

## 3. `node:test`: the test runner

```js
// test/library.test.js
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { compareVersions, get } = require("../library.js");

describe("compareVersions", () => {                 // a group of tests
    test("compares the parts as numbers", () => {
        assert.equal(compareVersions("4.10", "4.2"), 1);
    });
    test("treats missing parts as 0", () => {
        assert.equal(compareVersions("4.2", "4.2.0.0"), 0);
    });
    test("a wrong expectation", () => {
        assert.equal(compareVersions("2.9", "2.14"), 1);    // fails: it is -1
    });
});

test("get returns the fallback for a missing level", () => {
    assert.equal(get({}, "x.y", "?"), "?");
});
```

Run all tests of the project from its root folder:

```bash
node --test
```

Node.js finds the test files by their names - files in a `test/` folder, and files
named `*.test.js`, `*-test.js`, `*_test.js` - and runs every test. It prints one line
per test (a check mark or a cross), then a summary and the details of every failure
(the symbols are left out here):

```text
tests 4
suites 1
pass 3
fail 1

failing tests:

test at test/library.test.js:12:5
  a wrong expectation
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:

  -1 !== 1
```

When a test fails, `node --test` ends with exit code 1 - a CI pipeline (an automatic
check on every push) sees the failure.

| | |
|---|---|
| `describe("name", () => {...})` | a group of tests, for a structured report (`it` is another name for `test`) |
| `test.skip("name", ...)`, `test.todo("name")` | skipped / planned tests, shown in the summary |
| `before`, `beforeEach`, `after`, `afterEach` | code that runs before / after the tests (load a file once; reset a list) |
| `node --test --watch` | runs the tests again on every save |
| `node --test test/library.test.js` | only one file |
| `node --test --experimental-test-coverage` | also shows which lines the tests never ran |

With `"scripts": { "test": "node --test" }` in `package.json`, the command is
`npm test` - the same in every project.

::: info Older test tools
Many projects use the npm packages Jest, Mocha or Vitest. Their `test` / `describe`
/ `expect` look almost the same. `node:test` (stable since Node.js 20) needs no
installation - enough for a library like yours.
:::

## 4. What to test

### Edge cases

Most bugs hide at the edges. For every helper, think through this list:

| Case | Example for `compareVersions` / `get` |
|---|---|
| the normal case | `"4.2.1.7"` vs `"4.2.1.10"` |
| **missing** input | `undefined`, `null`, a missing level of the report |
| **empty** input | `""`, `[]`, `{}` |
| the **wrong type** | a number `2.14` instead of `"2.14"`, one object instead of a list |
| **odd formats** | `"4.2.1.7-B00"`, `"v4.2"`, `"42107-C00"` |
| **boundaries** | equal values, the first and the last element, `0` |
| values that look empty but are not | `0`, `false`, `"0"` |

- One idea per test, and a name that reads like a sentence:
  `"treats a missing part as 0"`. When it fails, the name says what is broken.
- Small test data **in** the test (a tiny report of three keys) is easier to read
  than a big file. Use the sample reports for the realistic cases.
- When you fix a bug, first write a test that **fails** because of it - then fix the
  code, and watch the test pass.

### Testing a rule

A rule does not return a value - it calls `emit`. Give it a fake `emit` that records
the calls (lecture 9), then check the records. `node:test` has a ready-made recorder,
`mock.fn()`:

```js
// test/chk-0211.test.js
const { test, describe, mock, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { loadRule, readReport } = require("../run-rule.js");   // the runner of lecture 9, as a module

describe("CHK-0211 - enclosures", () => {
    const emit = mock.fn();                                    // records every call
    const rule = loadRule("rules/chk-0211.js", emit);
    beforeEach(() => emit.mock.resetCalls());

    test("a device with old firmware gets one alert with every problem", () => {
        rule(readReport("samples/lab-dev-02.json"));
        assert.equal(emit.mock.callCount(), 1);
        const [id, payload] = emit.mock.calls[0].arguments;
        assert.equal(id, "B2D5F8A31C0E4477");
        assert.match(payload.details[0].Problems, /ENC-03: normal, firmware 2\.9/);
    });

    test("a device that is fine gets no alert", () => {
        rule(readReport("samples/lab-dev-01.json"));
        assert.equal(emit.mock.callCount(), 0);
    });

    test("one enclosure sent as an object is still checked", () => {
        rule(readReport("samples/lab-dev-04.json"));
        assert.equal(emit.mock.callCount(), 1);
    });

    test("a report without inventory does not throw", () => {
        assert.doesNotThrow(() => rule({ overview: { model: "XR-220" }, status: { device_alias: "X" } }));
    });
});
```

The idea of `mock.fn()`, on this site - a function that remembers how it was called:

```js run
function fakeFn() {
    const calls = [];
    const fn = (...args) => { calls.push(args); };
    fn.calls = calls;
    return fn;
}

const MODELS = ["XR-210", "XR-220"];
function rule(doc) {
    if (!MODELS.includes(doc.overview?.model)) return;
    const bad = (doc.inventory?.enclosures ?? []).filter(enc => enc.state !== "normal");
    if (bad.length > 0) emit(doc.status.device_alias, { "Enclosures": bad.map(enc => enc.id).join(", ") });
}

// test 1: the example document has one degraded enclosure
let emit = fakeFn();
rule(doc);
console.log(emit.calls.length === 1 ? "ok" : "FAIL", "one alert for the example document");
console.log(emit.calls[0]);

// test 2: another model - no alert
emit = fakeFn();
rule({ overview: { model: "XR-300" }, inventory: { enclosures: [{ id: "E1", state: "failed" }] } });
console.log(emit.calls.length === 0 ? "ok" : "FAIL", "no alert for XR-300");
```

To make the runner usable in tests, `run-rule.js` exports its functions and runs the
folder only when it is started directly:

```js
// at the end of run-rule.js
module.exports = { loadRule, readReport };
if (require.main === module) main();      // "node run-rule.js ..." - not when required
```

::: tip The bugs of lectures 7 - 9 as tests
Every silent bug of the older rules in this course is a test case: `"2.9"` vs `"2.14"`
compared as text (lecture 7), a model with a space (lecture 8), a missing `status`
swallowed by a catch-all `try` (lecture 9). A test suite with these cases protects all
your rules at once.
:::

## 5. JSDoc: documentation that tools read

A **JSDoc** comment starts with `/**` and stands right before a function (or a
variable, a class). Its `@` tags describe the parameters and the result:

```js
/**
 * Return the value at the end of a path in an object, or a fallback.
 * A string path is split at the dots; use an array when a key contains a dot.
 *
 * @param {object} obj - the object to read, for example a report
 * @param {string | Array<string | number>} path - "a.b.c" or ["a", "b.c", 0]
 * @param {*} [fallback] - returned when a level is missing (optional)
 * @returns {*} the value, or the fallback
 * @example
 * get(doc, "inventory.details.locale")              // "en_US"
 * get(doc, ["inventory", "modules", "12_4.20"])      // the module
 * get(doc, "health.state", "unknown")               // "unknown"
 */
function get(obj, path, fallback) { /* ... */ }
```

| Tag | Says |
|---|---|
| (the first text) | what the function does - one or two sentences |
| `@param {type} name - text` | one parameter: its type and meaning |
| `@param {type} [name]` | an optional parameter; `[name=default]` with its default |
| `@returns {type} text` | the result |
| `@throws {type} text` | when it throws |
| `@example` | a short usage example |
| `@deprecated text` | do not use any more - and what to use instead |

**Why bother?** In VSCode, the comment appears when someone hovers over `get` or
types `get(` - with the parameter names, types and the example. For a shared library
used by colleagues, that is the documentation they actually read. And with
`// @ts-check` (section 7), the types are **checked**.

### The type syntax

JSDoc types use the type syntax of TypeScript:

| Type | Means |
|---|---|
| `string`, `number`, `boolean`, `null`, `undefined` | the primitive types (lecture 2) |
| `string[]` or `Array<string>` | an array of strings |
| `{ id: string, state: string }` | an object with these keys |
| `"normal" \| "degraded"` | one of these values (a **union**) |
| `string \| undefined` | a string, or `undefined` |
| `Record<string, number>` | a dictionary: string keys, number values (lecture 6) |
| `(item: Enclosure) => boolean` | a function: its parameters and its result |
| `*` or `any` | anything - no checks; `unknown` - anything, but check before use |
| `void` | a function that returns nothing |

## 6. Types for the report: `@typedef`

`@typedef` gives a name to the **shape** of an object - the keys and their types.
For a product's JSON, it is a map of the report that the editor understands:

```js
/**
 * One enclosure of a report.
 * @typedef {object} Enclosure
 * @property {string} id - "ENC-01"
 * @property {string} type - "SSD-24", "HDD-12"
 * @property {string} firmware - a dotted version, "2.14"
 * @property {"normal" | "degraded" | "failed"} state
 */

/**
 * The report of one device (the example JSON document).
 * @typedef {object} Report
 * @property {{ device_alias: string, epoch: string }} status
 * @property {{ model: string, serial_number: string, version: string }} overview
 * @property {object} [inventory] - optional: not every report has it
 * @property {Enclosure[]} [inventory.enclosures]
 * @property {Record<string, { status: string, installed: string }>} [inventory.modules] - keys like "12_4.20"
 * @property {Record<string, string>} [inventory.labels] - keys with spaces: "Firmware Version"
 */

/**
 * @param {Report} doc
 * @returns {Enclosure[]} the enclosures that are not "normal"
 */
function badEnclosures(doc) {
    return (doc.inventory?.enclosures ?? []).filter(enc => enc.state !== "normal");
}
```

- `[name]` marks an **optional** property - like `?.` in the code, it says "may be
  missing".
- Write the types for the parts your helpers read - not necessarily every one of
  hundreds of keys. Start with the paths of section 4 of lecture 6 that your rules
  use most.
- The examples after the `-` (`"ENC-01"`, `"12_4.20"`) are worth a lot: the next
  person sees the format without opening a report.

### Types in another file

Keep the typedefs of a product in one file and use them everywhere with `import(...)` -
this works in CommonJS files too, it is only read by the editor:

```js
// types.js holds the typedefs (a file with only comments is fine)

// in rules or helpers:
/** @typedef {import("./types.js").Report} Report */
/** @typedef {import("./types.js").Enclosure} Enclosure */
```

### Generic helpers: `@template`

A helper like `groupBy` works for lists of **any** type. `@template T` is a
placeholder for "the type of the elements" - the editor then knows that grouping
enclosures gives enclosures:

```js
/**
 * Group a list by a key.
 * @template T
 * @param {T[]} list
 * @param {(item: T) => string} keyOf
 * @returns {Record<string, T[]>}
 */
function groupBy(list, keyOf) { /* ... lecture 7 ... */ }
```

### Telling the editor a type: casts

`JSON.parse` returns `any` - the editor cannot know what is in the file. A cast in
parentheses says it:

```js
const doc = /** @type {Report} */ (JSON.parse(text));
```

The cast changes nothing at runtime - if the file has another shape, the code still
fails. Check the important parts (lecture 9) where the data comes in.

TypeScript also has ready **utility types** that work in JSDoc: `Partial<Report>`
(every key optional), `Pick<Enclosure, "id" | "state">` (only these keys),
`Omit<Enclosure, "id">` (all keys but these).

## 7. `// @ts-check`: the editor checks your types

VSCode has the TypeScript checker built in. Put `// @ts-check` on the **first line**
of a JavaScript file, and the editor checks the file while you type - using your
JSDoc types and what it can work out by itself:

```js
// @ts-check
/** @typedef {import("./types.js").Report} Report */

/** @param {Report} doc */
function rule(doc) {
    const model = doc.overview.modle;
    //                         ~~~~~ Property 'modle' does not exist. Did you mean 'model'?

    for (const enc of doc.inventory.enclosures) { }
    //                ~~~~~~~~~~~~~ 'doc.inventory' is possibly 'undefined'.

    if (doc.inventory?.enclosures?.[0]?.state === "ok") { }
    //  ~~~~~~~~~~~~~~ This comparison appears to be unintentional because the types
    //                 '"normal" | "degraded" | "failed"' and '"ok"' have no overlap.

    compareVersions(doc.overview.version, 4.2);
    //                                    ~~~ Argument of type 'number' is not
    //                                        assignable to parameter of type 'string'.
}
```

Each of these is a real bug - and none of them is found by running the rule on a
report where everything is fine. The editor finds them **before** the code runs.

- The checks happen only in the editor - the file stays plain JavaScript, and the
  rule engine runs it as before. Nothing to install, no build step.
- When the checker is wrong (it can be, with very dynamic code), you can say so for
  one line with `// @ts-expect-error` and a reason - better than `// @ts-ignore`,
  because it complains when the error is gone.
- To check **every** file of the project, add a `jsconfig.json` to the root folder:

```json
{
    "compilerOptions": {
        "checkJs": true,
        "module": "nodenext",
        "target": "es2022"
    },
    "exclude": ["node_modules"]
}
```

- The same checks on the command line (for example in a CI pipeline) need the
  TypeScript package: `npx tsc --noEmit -p jsconfig.json` (TypeScript 7 checks JSDoc
  the same way).

### Static and dynamic types

JavaScript is **dynamically** typed (lecture 1): a variable can hold any value, and a
wrong type is noticed only when the code runs - or never. In **statically** typed
languages (Java, C#, Go - and TypeScript), the types are known before the program
runs, and the compiler checks them. The benefits:

- many errors are found **early** - while typing, not in production;
- the editor can **complete** names and show the documentation (IntelliSense);
- the types **document** the code - very useful in a team.

**TypeScript** is JavaScript plus a static type syntax: `.ts` files with types written
in the code (`function add(x: number, y: number): number`), interfaces and generics.
A compiler (`tsc`) checks them and turns the files into plain JavaScript. Rules for
your engine must be plain JavaScript files without a build step - so the course uses
the same type system **through JSDoc comments**. If one day you move to TypeScript,
your typedefs translate almost one to one (`@typedef` becomes `interface` or `type`).

```ts
// the same types in TypeScript (only for comparison - a .ts file)
interface Enclosure {
    id: string;
    firmware: string;
    state: "normal" | "degraded" | "failed";
}
function badEnclosures(list: Enclosure[]): Enclosure[] {
    return list.filter(enc => enc.state !== "normal");
}
```

## 8. A linter and a formatter

### ESLint: suspicious code

A **linter** reads your code - without running it - and reports likely bugs and
breaks of the team's rules: an unused variable, a typo in a global name, `==`
instead of `===`, `var`. **ESLint** is the standard linter for JavaScript.

Install it into the project as a dev dependency (lecture 9), and add a configuration
file:

```bash
npm install --save-dev eslint @eslint/js globals
```

```js
// eslint.config.js - the ESLint settings of the project
const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
    js.configs.recommended,                         // the recommended rules
    {
        files: ["**/*.js"],
        languageOptions: {
            sourceType: "commonjs",
            globals: { ...globals.node, emit: "readonly" }    // emit comes from the rule engine
        },
        rules: {
            eqeqeq: "error",                        // === instead of ==
            "no-var": "error",                      // let / const instead of var
            "prefer-const": "warn",                 // const when nothing changes it
            "no-unused-vars": ["error", { varsIgnorePattern: "^rule$" }]   // rule is called by the engine
        }
    }
];
```

Run it on the whole project:

```bash
npx eslint .
```

For example, on this small older rule:

```js
// rules/old-rule.js
var library = require("library.js");

function rule(doc) {  // never change this line
    let model = doc.overview.model;
    if (model == "XR-220" && library.versionBelow(doc.overview.version, "4.2.2")) {
        const unused = 5;
        emitt(doc.status.device_alias, { "Model": model });
    }
}
```

ESLint prints (shortened a little):

```text
rules/old-rule.js
  1:1   error    Unexpected var, use let or const instead          no-var
  4:9   warning  'model' is never reassigned. Use 'const' instead  prefer-const
  5:15  error    Expected '===' and instead saw '=='               eqeqeq
  6:15  error    'unused' is assigned a value but never used       no-unused-vars
  7:9   error    'emitt' is not defined                            no-undef

5 problems (4 errors, 1 warning)
  1 error and 1 warning potentially fixable with the `--fix` option.
```

The last one is a real bug: a typo in `emit` - the rule would throw on every matching
report (or, with a catch-all `try`, silently never alert).

- `npx eslint . --fix` fixes what can be fixed safely (`var`, `prefer-const`, ...).
- The **ESLint** extension of VSCode shows the problems in the editor as you type;
  with `"editor.codeActionsOnSave": { "source.fixAll.eslint": "explicit" }` in the
  VSCode settings, it fixes them on every save.
- Add `"lint": "eslint ."` to the scripts of `package.json`: `npm run lint`.

### Prettier: the same format for everybody

A **formatter** changes only the **layout** of the code - indentation, spaces, line
breaks, quotes, semicolons - never its meaning. **Prettier** is the most common one.
With a formatter, nobody discusses spaces in a code review any more:

```bash
npm install --save-dev prettier
npx prettier --write .            # format every file
```

Settings go into `.prettierrc.json` (for example `{ "tabWidth": 4, "printWidth": 100 }`);
in VSCode, the Prettier extension plus `"editor.formatOnSave": true` formats on every
save. ESLint and Prettier together: `eslint-config-prettier` turns off the ESLint rules
that only concern the layout.

### Which tool finds what

| Problem | Tests | `@ts-check` | ESLint |
|---|---|---|---|
| wrong result for an input | **yes** | - | - |
| a typo in a key of the report (`modle`) | if a test covers it | **yes** (with typedefs) | - |
| a typo in a variable or function name | if a test covers it | **yes** | **yes** (`no-undef`) |
| a number where a string is expected | sometimes | **yes** | - |
| `==`, `var`, unused variables | - | partly | **yes** |
| a missing level that is not checked | with an odd sample | **yes** (`possibly undefined`) | - |
| inconsistent layout | - | - | Prettier |

The three complement each other. The cheapest start: `// @ts-check` (free, in the
editor) and a few tests for the library.

## 9. The Git workflow

Lecture 1 used Git alone, on one line of history. Working in a team - or on a
change that takes a few days - needs **branches**.

### Branches

A **branch** is a separate line of development: a parallel version of the project.
You try out a new helper or fix a bug on a branch, **without** touching the main line
(`main`). When the work is ready, you **merge** the branch back.

```bash
git switch -c add-version-parser       # create a branch and switch to it
# ... edit, then commit as usual ...
git add library.js
git commit -m "Add normalizeVersion for the packed version format"

git switch main                        # back to the main line - the change is not here
git switch add-version-parser          # and back again
git branch                             # the list of branches; * marks the current one
```

Older tutorials use `git branch <name>` (create) and `git checkout <name>`
(switch), or `git checkout -b <name>` for both - the same as `git switch -c`.

### Merging

```bash
git switch main                        # the branch that should GET the changes
git merge add-version-parser           # bring in the commits of the other branch
git branch -d add-version-parser       # delete the merged branch
```

When `main` has not changed since the branch was created, Git simply moves `main`
forward (a *fast-forward*). When both have new commits, Git creates a **merge commit**
that joins the two lines. `git log --oneline --graph` draws them.

### Merge conflicts

When both branches changed the **same lines** of a file, Git cannot decide which
version is right - a **conflict**:

```text
Auto-merging rules/chk-0211.js
CONFLICT (content): Merge conflict in rules/chk-0211.js
Automatic merge failed; fix conflicts and then commit the result.
```

Git writes both versions into the file, between markers:

```js
<<<<<<< HEAD
const MIN_FIRMWARE = "2.14";
=======
const MIN_FIRMWARE = "2.16";
const MODELS = ["XR-210", "XR-220", "XR-230"];
>>>>>>> add-xr-230
```

- Between `<<<<<<< HEAD` and `=======`: the version of the current branch (`main`).
- Between `=======` and `>>>>>>>`: the version of the branch being merged.

Edit the file into the version you want - here, perhaps, both the new level and the
new model - **remove the three marker lines**, then finish the merge:

```bash
git add rules/chk-0211.js
git commit -m "Merge add-xr-230: new level 2.16 and model XR-230"
```

VSCode shows conflicts with buttons ("Accept Current", "Accept Incoming", "Accept
Both") and a merge editor. `git merge --abort` cancels the merge and restores the
state before it.

**Good habits:**

- Keep branches **small and short-lived** - one feature or one fix.
- Merge `main` into your branch regularly (`git merge main` while on the branch) - small
  conflicts early instead of a big one at the end.
- Delete branches after they are merged.

### Pull requests and code review

On GitHub, a branch is merged through a **pull request** (PR): "please pull my branch
into `main`".

```bash
git push -u origin add-version-parser      # the branch goes to GitHub
```

1. GitHub shows a button **Compare & pull request**. Write what the change does and
   why, and how it was tested.
2. Colleagues **review** it: they read the diff, comment on lines, ask questions or
   request changes. New commits pushed to the branch appear in the PR.
3. When the review is positive (**Approve**), the PR is **merged** - with the button
   on GitHub - and the branch deleted.

A code review is not about style (the formatter does that) - it is about
correctness and clarity. For rules, ask:

- Does the rule handle missing data **without** a catch-all `try`?
- Are versions compared as numbers? Dates parsed without guessing?
- Is `doc` left unchanged?
- Is there a test for the new case - and for the bug that was fixed?
- Would a colleague understand the condition in a year? (Names, comments with
  examples.)

### GitHub Pages

GitHub can also publish a **website** from a repository, for free for public
repositories: **GitHub Pages**. The site you are reading is published this way: every
push to its repository builds the pages and publishes them at
`https://<user>.github.io/<repository>/`. Turn it on in the repository's **Settings >
Pages**: choose a branch (and a folder) with static files, or a GitHub Actions workflow
that builds them. For a library, Pages can host its documentation.

## 10. From one product to the next

Your library starts with one product. Its structure decides how easy the second one
is. A proven layout - a **core** that knows nothing about any product, plus one
**module per product** that knows the paths of that product's reports:

```text
my-library/
|-- core.js            generic helpers: get, asList, groupBy, compareVersions,
|                      normalizeVersion, date parsers - no product paths
|-- products/
|   |-- xr.js          the XR family: where model, firmware, enclosures are
|   `-- tl.js          the TL family: the same questions, other paths
|-- library.js         what rules load: the core + the product modules
|-- types.js           the typedefs, one per product report
|-- test/              tests for the core, and per product with its samples
`-- samples/xr/, samples/tl/
```

Every product module answers the **same questions** with the same function names:

```js
// products/xr.js
const { get, asList, normalizeVersion } = require("../core.js");

module.exports = {
    model: doc => get(doc, "overview.model", ""),
    firmware: doc => normalizeVersion(get(doc, "inventory.details.firmware_level")),
    enclosures: doc => asList(get(doc, "inventory.enclosures")),
};
```

```js
// products/tl.js - a product whose report has another shape (report-dictionary.json)
const { get, normalizeVersion } = require("../core.js");

module.exports = {
    model: doc => get(doc, "device_report.report_data.device.model_type", ""),
    firmware: doc => normalizeVersion(get(doc, "device_report.software.version")),
    enclosures: doc => Object.entries(get(doc, "device_report.configuration.drives", {}))
        .map(([id, d]) => ({ id, firmware: d.fw_code, state: d.state || "normal" })),
};
```

Now one rule can check **both** products - it asks the product module, not the
report. On this site, with the example document and a small report in the other
shape:

```js run
function get(obj, path, fallback) {
    let cur = obj;
    for (const key of path.split(".")) {
        if (cur === undefined || cur === null) return fallback;
        cur = cur[key];
    }
    return cur ?? fallback;
}
const firstVersion = text => String(text ?? "").match(/\d+(?:\.\d+)+/)?.[0] ?? "";
function compareVersions(a, b) {
    const pa = a.split(".").map(Number), pb = b.split(".").map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const x = pa[i] ?? 0, y = pb[i] ?? 0;
        if (x !== y) return x < y ? -1 : 1;
    }
    return 0;
}

// two product modules with the SAME functions
const xr = {
    name: doc => get(doc, "inventory.extended_info.json.data.system.name", "?"),
    firmware: doc => firstVersion(get(doc, "inventory.details.firmware_level")),
};
const tl = {
    name: doc => get(doc, "device_report.device_id", "?"),
    firmware: doc => firstVersion(get(doc, "device_report.software.version")),
};

// one rule for both: it only talks to the product module
function checkFirmware(product, doc, minimum) {
    const firmware = product.firmware(doc);
    if (firmware !== "" && compareVersions(firmware, minimum) < 0) {
        console.log(`${product.name(doc)}: firmware ${firmware} is below ${minimum}`);
    } else {
        console.log(`${product.name(doc)}: OK (${firmware || "no firmware"})`);
    }
}

const tlReport = { device_report: { device_id: "LAB-TL-02", software: { version: "1.11.0.2" } } };
checkFirmware(xr, doc, "4.2.2");
checkFirmware(tl, tlReport, "1.12.0.1");
```

- Lecture 6 showed the same idea with a class per product - the same interface, other
  paths. Plain objects of functions, as here, are simpler and enough.
- A new product = a new module + its samples + its tests. The core and the existing
  rules do not change.
- A **README** with one example per helper, and a version number in `package.json`
  with a short list of changes per version (a *changelog*), help your colleagues to
  trust and update the library.

## 11. Reading existing rules: a code review

Here is an older rule, as it might arrive in a pull request. Run it - it seems to
work:

```js run
function emit(id, details) {
    console.log("ALERT for " + id + ": " + JSON.stringify(details));
}

function rule(doc) {  // never change this line
    try {
        var encs = doc.inventory.enclosures;
        var bad = [];
        for (var i = 0; i < encs.length; i++) {
            if (encs[i].state == "degraded" || encs[i].firmware < "2.14") {
                bad.push(encs[i].id);
            }
        }
        var checked = doc.inventory.labels["Last Check"];
        var days = (Date.now() - new Date(checked)) / 86400000;
        if (bad.length > 0) {
            emit(doc.status.device_alias, { "Enclosures": bad.join(","), "Days since check": Math.round(days) });
        }
    } catch (e) {
        return;
    }
}

rule(doc);
```

**Check yourself:** you are the reviewer.

1. Write the names of five **tests** you would ask for - each one a small report that
   the rule handles wrongly. (Hint: lectures 4, 7, 8 and 9.)
2. What would `// @ts-check` with a `Report` typedef report? And ESLint with the
   configuration of section 8?
3. Write three review comments, as you would on GitHub - each one with the line, the
   problem and a suggestion.
4. "Days since check" - what is wrong with it, even when no test fails today?

::: details Answer
1. For example:
   - `"an enclosure with firmware 2.9 is reported"` - `"2.9" < "2.14"` is `false` as
     text (lecture 7);
   - `"a failed enclosure is reported"` - only `"degraded"` is checked;
   - `"one enclosure sent as an object is checked"` - `encs.length` is `undefined`,
     the loop runs zero times (lecture 4);
   - `"a report without labels still gets the alert"` - `doc.inventory.labels` is
     `undefined`, the `TypeError` is swallowed by the catch-all (lecture 9);
   - `"a report without inventory gives no alert and no error"` - fine today only by
     luck (the catch-all).
2. `@ts-check`: `doc.inventory`, `encs` and `doc.inventory.labels` are "possibly
   undefined" (seven places), and `Date.now() - new Date(checked)`: "The right-hand side
   of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum
   type" - a `Date` is subtracted. ESLint with the configuration of section 8: `no-var`
   five times, `eqeqeq` for the `==`, and `'e' is defined but never used` in the
   `catch`.
3. For example: "`encs[i].firmware < "2.14"` compares text - `"2.9"` is not found.
   Use `compareVersions(encs[i].firmware, "2.14") < 0`." - "`var encs =
   doc.inventory.enclosures`: please use `asList(doc.inventory?.enclosures)`, one
   enclosure can come as an object." - "The catch-all `try` hides the missing `labels` -
   please remove it and use `?.` for the optional parts; there is a test case for it in
   the PR description."
4. Run it: the number is **negative**. `new Date("12-10-2026 18:25:23")` guesses the
   format - in V8 it becomes 10 December, a date in the future (lecture 8); in other
   engines it is Invalid Date, and the days are `NaN`. And `Date.now()` makes the result
   depend on **when** the rule runs - a test cannot check it. Parse the format
   explicitly, and compare with the report's own time (its EPOCH) instead of "now".
:::

## 12. The project review

The last part of the session belongs to your course project ([Course project](/project)).

### What to show (10 - 15 minutes)

1. **The product and the problem**: which reports, which rules were hard to write.
2. **The library**: the helpers, with their JSDoc - hover over one in VSCode.
3. **A rule before and after**: an existing rule rewritten with the library - shorter,
   without the catch-all, with the same alerts on the samples.
4. **The tests**: `npm test` - and one test that would have caught a real bug.
5. **The local runner**: one rule on the folder of samples.
6. **What next**: the second product, the helpers that are still missing.

### How the review works

The code is reviewed as a **pull request**: open a PR from a branch with your last
changes (or from the whole project against an empty branch), and invite the trainer
as a reviewer. The review comments follow the checklist of section 9.

The minimum for the review: the library as a CommonJS module with JSDoc, tests with
`node:test`, and one rewritten rule. Everything else can grow after the course.

### After the course

- Keep your repositories: the Homework repository with all solutions, and the
  project. Pull the Labs repository once more for the class code.
- Next topics, when you need them: TypeScript itself (the
  [handbook](https://www.typescriptlang.org/docs/handbook/intro.html)), more of
  Node.js (streams for very large files), and testing with mocks.
- Practise: small daily exercises on [Exercism](https://exercism.org/tracks/javascript)
  (with mentoring) or [Codewars](https://www.codewars.com/), and keep reading
  [javascript.info](https://javascript.info/) and MDN.
- The best practice of all: improve one real rule a week - with a test.

## 13. Practice

In your copy of the Homework repository, first get the new tasks:

```bash
git pull upstream main
node 10-tests-types-git/practice/task1-predict.js
```

Each file explains the task at the top. Tasks 2 and 4 have two files: in the
`.test.js` file you write tests; the `-check.js` file runs them and prints `OK` or
`FAIL`.

| Task | File | What you do |
|------|------|-------------|
| 1 | `task1-predict.js` | Predict 20 results: which `assert` checks pass and which throw |
| 2 | `task2-library.test.js` | Write tests with `node:test` for four library helpers. `task2-check.js` runs them against the correct library - they must pass - and against five versions with hidden bugs - each must be caught |
| 3 | `task3-ts-check.js` | Open it in VSCode: `// @ts-check` underlines six bugs. Fix them - the checks confirm - and write a `@typedef` for a record of the record list |
| 4 | `task4-rule.test.js` | Write tests for the rule CHK-0211 on the sample reports, with a fake `emit`. `task4-check.js` runs them against the rule and against five broken versions of it |
| 5 | `task5-clean-code.js` | Clean an older helper the way a linter and a reviewer would ask: no `var`, no `==`, no catch-all - with the same results |

## Summary

| Topic | Remember |
|-------|----------|
| Tests | Small programs that check results; run them after every change; every fixed bug gets a test |
| `assert` | `node:assert/strict`: `equal`, `deepEqual` (content, key order ignored), `ok`, `match`, `throws`, `rejects` |
| `node:test` | `test("sentence", fn)`, `describe`, hooks, `mock.fn()`; `node --test` finds `test/` and `*.test.js`; exit code 1 on failure |
| What to test | Normal case, missing, empty, wrong type, odd formats, boundaries, `0` / `false` / `""` |
| Rules | A fake `emit` (or `mock.fn()`), the runner of lecture 9 as a module, the sample reports |
| JSDoc | `/** ... */` before a function: description, `@param {type} name`, `@returns`, `@example`, `@throws` |
| `@typedef` | Names the shape of a report; `[name]` = optional; `import("./types.js").Report`; `@template` for generic helpers |
| `@ts-check` | First line of a file; VSCode checks types, typos, possibly undefined; `jsconfig.json` for the whole project |
| TypeScript | The same types in `.ts` files with a compiler; JSDoc gives the checks without a build step |
| ESLint | Likely bugs and team rules (`no-undef`, `eqeqeq`, `no-var`); `npx eslint . --fix` |
| Prettier | Only the layout; format on save; no style debates in reviews |
| Branches | `git switch -c name`, commit, `git switch main`, `git merge name`, `git branch -d name` |
| Conflicts | Edit between `<<<<<<<`, `=======`, `>>>>>>>`, remove the markers, `git add`, `git commit` |
| Pull requests | Push the branch, open a PR, review, approve, merge, delete the branch |
| Several products | A core without product paths + one module per product with the same functions |

## Homework

1. Finish the five practice tasks - every check must print `OK`.
2. `10-tests-types-git/` (in the homework repository): write `fleetSummary` - a summary
   of a fleet of reports that uses something from every lecture - in
   `homework-fleet.js`, and at least three tests for it in `homework.test.js`. Check
   both with `node 10-tests-types-git/homework.js`.
3. **Course project - for the review:**
   - JSDoc for every exported helper, a `types.js` with the typedefs of your product,
     `// @ts-check` in every file;
   - tests with `node:test` for the library and for one rule (`npm test`);
   - one existing rule rewritten with the library, with the same alerts on the samples;
   - a README with an example per helper;
   - open a pull request and invite the trainer as a reviewer. Use the checklist
     `10-tests-types-git/project-checklist.md`.
4. Optional: add ESLint to the project, run it on two of your existing rules, and
   count what it finds.

## Read more

- Node.js: [Test runner](https://nodejs.org/api/test.html),
  [Assert](https://nodejs.org/api/assert.html),
  [Mocking in tests](https://nodejs.org/en/learn/test-runner/mocking)
- JSDoc and types: [JSDoc Reference (TypeScript handbook)](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html),
  [Type Checking JavaScript Files](https://www.typescriptlang.org/docs/handbook/type-checking-javascript-files.html),
  [JavaScript in VS Code](https://code.visualstudio.com/docs/languages/javascript),
  [jsconfig.json](https://code.visualstudio.com/docs/languages/jsconfig),
  [TypeScript in 5 minutes](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html)
- Tools: [ESLint - Getting started](https://eslint.org/docs/latest/use/getting-started),
  [Prettier](https://prettier.io/docs/),
  [ESLint extension for VS Code](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- Git: [Pro Git - Git Branching](https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell),
  [About pull requests](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests),
  [Resolving a merge conflict on GitHub](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/addressing-merge-conflicts/resolving-a-merge-conflict-on-github),
  [GitHub Pages](https://pages.github.com/)
- javascript.info: [Automated testing with Mocha](https://javascript.info/testing-mocha) (the ideas are the same for `node:test`)
- Videos: [Git Tutorial for Beginners: Command-Line Fundamentals](https://www.youtube.com/watch?v=HVsySz-h9r4),
  [GitHub Tutorial for Beginners](https://www.youtube.com/watch?v=0fKg7e37bQE)

**This was the last session.** Thank you for the questions and the work. Keep the
library growing - one helper, one test, one rule at a time.
