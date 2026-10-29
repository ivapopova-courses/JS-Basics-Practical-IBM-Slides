---
title: 9. JSON, Node.js, modules, errors
---

# 9. JSON, Node.js, modules and errors; running rules locally

<div class="lecture-meta">
  <span>Session 9</span><span>practice: <code>09-json-node-modules-errors/</code> in the homework repository</span>
  <span><a href="../example-document"><code>doc</code>: the example JSON document</a></span>
</div>

**Today you will learn to:**

- read and write JSON: the rules of the format, `JSON.parse` and
  `JSON.stringify` - and what JSON cannot hold;
- run JavaScript with Node.js: `process`, files with `fs` and `path`, and the
  methods of the `console` object;
- use npm: `package.json`, scripts, installing a package;
- split code into **modules**: CommonJS (`require` / `module.exports`) and ES
  modules (`import` / `export`) - and turn your `library.js` into a real module;
- handle errors: `try` / `catch` / `finally`, `throw`, the error types and your own
  error classes - and see why a `catch` that only returns hides bugs;
- write code that **waits**: promises, `async` / `await`, and `fetch` - JSON from
  a web API;
- run a rule **locally**, on a folder of sample reports, with a fake `emit`.

Where this fits - today the rule leaves the browser. A small Node.js script runs
one rule on every report in a folder, the way the rule engine does. The number in
each comment is the section of this lecture:

```js
// run-rule.js - run one rule on every sample report of a folder
"use strict";
const fs = require("node:fs");                        // 4. files - a built-in module
const path = require("node:path");
const library = require("./library.js");              // 6. our own module

// 10. load a rule file as it is, with a fake emit and our library
function loadRule(file, emit) {
    const code = fs.readFileSync(file, "utf8");
    const fakeRequire = name => (name === "library.js" ? library : require(name));
    return new Function("require", "emit", code + "\nreturn rule;")(fakeRequire, emit);
}

const [ruleFile, folder = "samples"] = process.argv.slice(2);   // 3. arguments
const alerts = [];
const rule = loadRule(ruleFile, (id, details) => alerts.push({ id, details }));

for (const file of fs.readdirSync(folder).filter(f => f.endsWith(".json"))) {
    let doc;
    try {
        doc = JSON.parse(fs.readFileSync(path.join(folder, file), "utf8"));   // 1, 2. JSON
    } catch (err) {
        console.error(`${file}: not valid JSON - ${err.message}`);         // 7. an error, reported
        continue;
    }
    try {
        rule(doc);
    } catch (err) {
        console.error(`${file}: the rule failed - ${err.name}: ${err.message}`);
    }
}
console.log(JSON.stringify(alerts, null, 2));         // 2. readable JSON
```

```bash
node run-rule.js rules/chk-0211.js samples
```

- Your rules stay exactly as they are in the rule engine: `function rule(doc)`,
  `require("library.js")`, `emit(...)`. The script gives them a fake `emit` and your
  library - [section 10](#_10-running-a-rule-locally).
- One broken file or one failing rule does not stop the others, and every problem is
  **printed** - the opposite of a silent `catch (err) { return; }`.

Until now, every example ran in this site or in one practice file. Real work needs
files, modules and tools: today you build them.

## 1. JSON: the format

MDN: [JSON](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON)

**JSON** (*JavaScript Object Notation*) is a text format for data. It was proposed
by Douglas Crockford in the early 2000s and is now the most common format for data
between programs - your reports, configuration files, web APIs. It is
**language-independent**: Python, Java, Go and every other language read and write
it.

Why it won:

- easy to read and write - for people and for programs;
- a minimal syntax: objects, arrays and a few value types;
- it looks like JavaScript: a JSON document is (almost) a JavaScript object literal.

A JSON document with the six types:

```json
{
    "device": "LAB-DEV-01",
    "nodes": 2,
    "used_percent": 69.5,
    "remote_login": true,
    "location": null,
    "features": ["dedup", "compression"],
    "status": { "state": "normal", "epoch": "1791770402" }
}
```

| JSON type | Examples | Notes |
|---|---|---|
| string | `"XR-220"` | **double quotes only**; escapes like `\n`, `\"`, `\u0041` |
| number | `2`, `-3.5`, `1e6` | no `NaN`, no `Infinity`, no leading zeros (`007`), no hex |
| boolean | `true`, `false` | |
| null | `null` | "no value" |
| array | `["a", "b"]` | an ordered list of values |
| object | `{ "key": value }` | keys are **strings in double quotes** |

### JSON is stricter than JavaScript

| Allowed in a JavaScript object literal | In JSON |
|---|---|
| keys without quotes: `{ model: "XR-220" }` | not allowed - `{ "model": "XR-220" }` |
| single quotes: `'XR-220'` | not allowed |
| a trailing comma: `[1, 2, ]` | not allowed |
| comments `//` and `/* */` | not allowed |
| `undefined`, functions, `NaN`, `Infinity` | not allowed |

VSCode checks `.json` files as you type (red underlines), and online validators such
as [JSONLint](https://jsonlint.com/) show the exact position of an error.

::: info JSON and XML
Before JSON, data was often exchanged as XML:
`<features><feature>dedup</feature><feature>compression</feature></features>`.
JSON says the same with less text - `{"features": ["dedup", "compression"]}` - and
maps directly to the objects and arrays of JavaScript.
:::

### `null`: "known to be empty"

`undefined` does not exist in JSON - a key is either there or not. `null` is how a
document says "this key exists, and it has no value" - which is different from a
missing key:

```js run
const reports = [
    { device: "LAB-DEV-01", location: "Rack 4" },     // known location
    { device: "LAB-DEV-02", location: null },         // the field exists: no location set
    { device: "LAB-DEV-03" }                          // the field is not reported at all
];
for (const r of reports) {
    const state = r.location === null ? "not set"
                : r.location === undefined ? "not reported"
                : r.location;
    console.log(r.device, "->", state);
}
```

A rule can treat the two cases differently: "not set" may be a configuration
problem; "not reported" may be an old firmware that does not send the field.

## 2. `JSON.parse` and `JSON.stringify`

MDN: [JSON.parse()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse), [JSON.stringify()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify)

JSON is **text**. To work with it, turn it into JavaScript values - *parse* it. To
send or save data, turn it back into text - *stringify* it.

```js run
// this is NOT an object - it is a string
const jsonText = `{
    "title": "Learn HTML",
    "completed": true,
    "id": 1
}`;
console.log(typeof jsonText);           // string

// parse: text -> JavaScript values
const data = JSON.parse(jsonText);
console.log(typeof data, data.title);   // object Learn HTML

// stringify: JavaScript values -> text
const back = JSON.stringify(data);
console.log(typeof back, back);         // string {"title":"Learn HTML","completed":true,"id":1}
```

The example document `doc` of this site is the result of `JSON.parse` of
`data/sample-asset.json` - and every check rule gets its `doc` the same way.

### Invalid JSON throws

```js run
const broken = '{ "model": "XR-220", }';      // a trailing comma

try {
    JSON.parse(broken);
} catch (err) {
    console.log(err.name);                    // SyntaxError
    console.log(err.message);                 // where the error is
}

// the same for empty text and for text that is not JSON at all
for (const text of ["", "undefined", "{model: 1}", "'x'"]) {
    try {
        JSON.parse(text);
    } catch (err) {
        console.log(JSON.stringify(text).padEnd(14), err.message);
    }
}
```

Data from outside - a file, a web API, a message - can always be broken. Parse it in
a `try` (section 7), and say **which** file or message failed.

### Readable output: indentation

`JSON.stringify(value, replacer, space)`: the third argument indents the text - 2
spaces is the usual choice:

```js run
console.log(JSON.stringify(doc.overview));
console.log(JSON.stringify(doc.overview, null, 2));
console.log(JSON.stringify(doc.inventory.enclosures[0], null, "\t"));
```

### Choosing what goes in: the replacer

The second argument chooses the keys - an **array** of key names, or a **function**
called for every key and value:

```js run
const details = doc.inventory.details;

// an array: only these keys (at every level)
console.log(JSON.stringify(details, ["locale", "power_saving"]));
// {"locale":"en_US","power_saving":"on"}

// a function: change or drop values - return undefined to drop a key
const hidden = JSON.stringify(details, (key, value) =>
    key.startsWith("remote_login") ? undefined : value);
console.log(hidden.includes("remote_login"));     // false

// mask values that should not leave the system
const masked = JSON.stringify(doc.overview, (key, value) =>
    key === "serial_number" ? "***" + value.slice(-2) : value);
console.log(masked);    // {"model":"XR-220","serial_number":"***92","version":"4.2.1.7"}
```

`JSON.parse` has a similar second argument, the *reviver*, called for every key and
value while parsing - for example to turn ISO date strings into `Date` objects:

```js run
const text = '{ "device": "LAB-DEV-01", "checked": "2026-10-12T18:25:23.000Z" }';
const obj = JSON.parse(text, (key, value) =>
    typeof value === "string" && /^\d{4}-\d\d-\d\dT/.test(value) ? new Date(value) : value);
console.log(obj.checked instanceof Date, obj.checked.getUTCHours());   // true 18
```

### What JSON cannot hold

`JSON.stringify` silently drops or changes what JSON cannot represent:

```js run
const value = {
    name: "LAB-DEV-01",
    missing: undefined,                 // dropped
    check: function () {},              // dropped
    ratio: NaN,                         // becomes null
    limit: Infinity,                    // becomes null
    when: new Date("2026-10-12"),       // becomes an ISO string
    ids: new Set(["a", "b"]),           // becomes {}
    list: [1, undefined, () => 1]       // in arrays: null
};
console.log(JSON.stringify(value));

try {
    JSON.stringify({ big: 10n });       // a BigInt (lecture 8)
} catch (err) {
    console.log(err.name + ": " + err.message);
}
```

So a "round trip" - `JSON.parse(JSON.stringify(x))` - is a deep copy only for plain
JSON-like data (lecture 6). For alert details it is fine: they are strings and
numbers anyway.

::: warning Comparing with `JSON.stringify`
`JSON.stringify(a) === JSON.stringify(b)` is a quick way to compare two plain
objects - the practice files use it. But the **order of the keys** matters:
`{"a":1,"b":2}` and `{"b":2,"a":1}` are different texts. Lecture 10 shows
`assert.deepEqual` of `node:assert/strict`, which ignores the key order.
:::

## 3. Node.js

**Node.js** (2009) runs JavaScript **outside** the browser: on your computer, on
servers, in tools. It is built on Chrome's **V8** engine (lecture 1), plus libraries
for files, the network and processes. New versions of V8 bring the new language
features to Node.js quickly; the course uses Node.js 24 (an LTS version).

- Run a file: `node file.js`. Start a console (REPL): `node`, and `.exit` to leave.
- Node.js runs on **one thread**: it does one thing at a time. While it waits for a
  file or the network, it does other work and comes back later (section 8).
- The environment gives Node.js programs objects the browser does not have
  (`process`, `require`, the built-in modules) - and does not give them `document`
  or `window`.

### `process`: the running program

Node.js: [process](https://nodejs.org/api/process.html)

```js
// info.js - run it with: node info.js LAB-DEV-01 --verbose
console.log(process.version);           // v24.x.x - the Node.js version
console.log(process.platform);          // linux, win32 or darwin
console.log(process.cwd());             // the folder you ran it from
console.log(process.argv);              // [ path of node, path of info.js, 'LAB-DEV-01', '--verbose' ]

const [device = "all", ...flags] = process.argv.slice(2);   // your own arguments
console.log(device, flags.includes("--verbose"));           // LAB-DEV-01 true

console.log(process.env.HOME ?? process.env.USERPROFILE);   // environment variables

process.exitCode = 1;                   // the exit code: 0 = OK, anything else = failed
```

`process.exitCode = 1` tells the caller (a script, a CI pipeline) that something
failed. `check.js` of the practice files does exactly this when a check fails.
(`process.exit(1)` stops at once - output that is still being written can be lost.)

### `__dirname`: where the file is

`process.cwd()` is the folder you **ran** the program from; `__dirname` is the folder
of the **file** itself. To read a file next to your script, start from `__dirname` -
then it works from any folder:

```js
const path = require("node:path");
const samples = path.join(__dirname, "samples");     // always next to this script
```

### The `console` object

MDN: [console](https://developer.mozilla.org/en-US/docs/Web/API/console)

`console.log` is one method of the `console` object. The others are just as useful -
they work in Node.js, in the browser and on this site:

```js run
console.log("normal output");
console.info("information - the same as log");
console.warn("a warning");                  // Node.js: written to stderr
console.error("an error");                  // Node.js: written to stderr

console.table(doc.inventory.enclosures, ["id", "state"]);   // lecture 7

console.dir(doc.inventory.extended_info, { depth: null });  // all levels, not [Object]

console.group("Enclosures");                // indent the next lines
for (const enc of doc.inventory.enclosures) console.log(enc.id, enc.state);
console.groupEnd();

console.count("check");                     // check: 1
console.count("check");                     // check: 2

console.time("loop");
for (let i = 0; i < 100_000; i++);
console.timeEnd("loop");                    // loop: 0.123ms

console.assert(doc.overview.model === "XR-220", "unexpected model");   // prints only if false
console.assert(1 === 2, "1 is not 2");      // Assertion failed: 1 is not 2
```

In Node.js, `log` and `info` write to **stdout** (the normal output), `warn` and
`error` to **stderr** (the error output). `node run-rule.js > alerts.json` saves only
stdout in the file - the error messages still appear on the screen.

### Node.js can also be a server

Node.js is best known for web servers - a server is a program that waits for
requests and answers them. A minimal one, with the built-in `http` module:

```js
// server.js - run it, then open http://localhost:3000 in the browser
const http = require("node:http");

const server = http.createServer((request, response) => {
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify({ device: "LAB-DEV-01", state: "normal" }));
});
server.listen(3000, () => console.log("listening on http://localhost:3000"));
```

Frameworks such as Express make bigger servers easier. Servers are outside this
course - but now you know where the JSON of a web
API comes from (section 9).

## 4. Files: `fs` and `path`

Node.js: [File system](https://nodejs.org/api/fs.html), [Path](https://nodejs.org/api/path.html)

Node.js has **built-in modules** - no installation needed. Load them with `require`;
the `node:` prefix says "built in":

```js
// read-report.js
"use strict";
const fs = require("node:fs");
const path = require("node:path");

const file = path.join(__dirname, "data", "sample-asset.json");

const text = fs.readFileSync(file, "utf8");      // the file as a string (UTF-8, lecture 8)
const doc = JSON.parse(text);                    // the string as an object
console.log(doc.overview.model);                 // XR-220

// all JSON files of a folder
const folder = path.join(__dirname, "data", "reports");
for (const name of fs.readdirSync(folder)) {
    if (path.extname(name) !== ".json") continue;        // skip README.txt and others
    console.log(path.basename(name, ".json"));           // lab-dev-01, lab-dev-02, ...
}

// write a result
fs.writeFileSync(path.join(__dirname, "out.json"), JSON.stringify(doc.overview, null, 2));
console.log(fs.existsSync(path.join(__dirname, "out.json")));    // true
```

| Function | Does |
|---|---|
| `fs.readFileSync(file, "utf8")` | reads a text file; **without** `"utf8"` you get bytes (a `Buffer`) |
| `fs.writeFileSync(file, text)` | writes (replaces) a file |
| `fs.readdirSync(folder)` | the names of the files in a folder |
| `fs.existsSync(path)` | is it there? |
| `path.join(a, b, ...)` | joins parts with the right separator (`/` or `\` on Windows) |
| `path.basename(p, ext)`, `path.extname(p)`, `path.dirname(p)` | parts of a path |
| `path.resolve(p)` | an absolute path |

Build paths with `path.join`, not with `+ "/" +` - then the same script works on
Linux, macOS and Windows.

::: tip The byte order mark
Some Windows tools save UTF-8 with a BOM (lecture 8), and `JSON.parse` fails on it.
Remove it after reading:
`const text = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");`
:::

### `require` of a JSON file

`require` can read a JSON file directly - the practice files do this with
`require("../data/sample-asset.json")`:

```js
const doc = require("./data/sample-asset.json");    // read + JSON.parse in one step
```

Convenient, with two catches: `require` reads a file only **once** per program (it
remembers it - section 6), and every `require` of the same file gives the **same**
object - a change by one helper is seen by all. For data that changes, or for many
files, use `fs.readFileSync` + `JSON.parse`.

### Reading without waiting: the callback version

`readFileSync` makes the program **wait** until the file is read (*synchronous*).
`fs.readFile` (without `Sync`) starts reading and calls a function when it is done -
meanwhile the program goes on:

```js
const fs = require("node:fs");

fs.readFile("data/sample-asset.json", "utf8", (err, text) => {
    if (err) {
        console.error("Error reading the file:", err.message);
        return;
    }
    console.log("The model:", JSON.parse(text).overview.model);
});
console.log("This line is printed first.");
```

The callback gets the error first (`null` when there is none) - the classic Node.js
style. Section 8 shows the modern form with `await`. For small scripts like a rule
runner, the `Sync` functions are fine and simpler.

## 5. npm: packages and `package.json`

**npm** (*Node Package Manager*) comes with Node.js. It is two things: the
command-line tool `npm`, and the **registry** at [npmjs.com](https://www.npmjs.com/) -
millions of packages: small helpers, libraries, whole frameworks and tools.

### A project: `package.json`

```bash
mkdir my-library && cd my-library
npm init -y              # creates package.json with default values (-y: yes to all)
```

```json
{
    "name": "my-library",
    "version": "1.0.0",
    "description": "Helpers for the reports of one product",
    "main": "library.js",
    "type": "commonjs",
    "scripts": {
        "test": "node --test",
        "run-rule": "node run-rule.js rules/chk-0211.js samples"
    },
    "devDependencies": {
        "eslint": "^10.0.0"
    }
}
```

`package.json` describes the project: its name and version, the **scripts** you run
often, and the **dependencies** - the packages it needs.

- `npm run run-rule` runs a script; `npm test` (or `npm run test`) runs the tests
  (lecture 10). Scripts are the team's shared commands: nobody has to remember the
  long command lines.
- `"type": "commonjs"` or `"module"` decides how `.js` files are treated (section 6).

### Installing packages

```bash
npm install some-package              # a dependency of the project
npm install --save-dev eslint         # a dev dependency: only for development (lecture 10)
npm install                           # install everything package.json lists (after a clone)
npm update                            # newer versions, within the allowed range
npm uninstall some-package
npm install -g some-tool              # globally: a command for the whole computer
```

- Packages go into the folder **`node_modules/`** - often thousands of files. Never
  commit it: put `node_modules/` into `.gitignore` (lecture 1). Whoever clones the
  repository runs `npm install` and gets the same packages.
- **`package-lock.json`** records the exact version of every installed package.
  Commit it: it makes `npm install` give everybody the same versions.
- `"^10.0.0"` means "10.0.0 or newer, but below 11" - the numbers are *major.minor.patch*
  (semantic versioning): a new major version may break your code.
- **Local or global?** A package your project uses: local (the default). A tool you
  want as a command everywhere: global (`-g`) - or run it without installing with
  **`npx`**: `npx eslint .` runs the local (or a downloaded) eslint.

::: warning Packages and rules
Your rule engine runs your rule and your `library.js` - not npm packages. Use npm for
your **tools**: tests, a linter, scripts. The library itself should need no
packages.
:::

## 6. Modules

A **module** is a file that keeps its own variables private and **exports** what
other files may use. Each module has its own scope (lecture 5): two modules can both
have a `function get` without a clash.

JavaScript has two module systems:

| | CommonJS (CJS) | ES modules (ESM) |
|---|---|---|
| Since | Node.js, 2009 | the language standard, ES2015 |
| Export | `module.exports = { a, b };` | `export function a() {}`, `export default ...` |
| Import | `const lib = require("./lib.js");` | `import { a } from "./lib.js";` |
| Files | `.js` (default in Node.js), `.cjs` | `.mjs`, or `.js` with `"type": "module"` |
| Used by | older Node.js code, many tools, **your rule engine** (`require("library.js")`) | browsers, modern Node.js code |

### CommonJS: `module.exports` and `require`

Node.js: [Modules: CommonJS modules](https://nodejs.org/api/modules.html)

The recipe of lecture 7, explained:

```js
// library.js
"use strict";

const SEPARATOR = ".";                       // private: not exported

function compareVersions(a, b) { /* ... */ }
function versionBelow(current, minimum) {
    return compareVersions(current, minimum) < 0;
}

module.exports = { compareVersions, versionBelow };   // what other files get
```

```js
// try.js
"use strict";
const lib = require("./library.js");         // the object module.exports
console.log(lib.versionBelow("4.10", "4.2")); // false
console.log(lib.SEPARATOR);                  // undefined - private

// destructuring: take only what you need
const { compareVersions } = require("./library.js");
```

- Every file has an object `module.exports` (at first `{}`). `require(file)` returns
  it.
- `require("./library.js")` - a **relative** path (`./`, `../`) is a file of your
  project. `require("node:fs")` is built in; `require("eslint")` is a package from
  `node_modules`.
- `exports.versionBelow = versionBelow;` adds one export - a short form of
  `module.exports.versionBelow = ...`. But `exports = { ... }` does **nothing**:
  it only changes the local variable `exports`. Use `module.exports = { ... }`.
- A module runs **once**. Every later `require` of the same file gets the same,
  cached `module.exports` - which is why `require` of a JSON file always gives the
  same object.

::: info Your rule engine
Rules load the shared helpers with `const library = require("library.js");` - a
CommonJS-style `require`, without `./`. The engine decides where `"library.js"` comes
from. Locally, Node.js would look for a **package** named `library.js` in
`node_modules`; section 10 gives the rule our own file instead.
:::

### ES modules: `export` and `import`

MDN: [JavaScript modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules), [export](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export), [import](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import)

The module system of the language itself:

```js
// library.mjs
// named exports: several per module, imported by their exact names
export const DEFAULT_LEVEL = "4.2.1.7";
export function versionBelow(current, minimum) { /* ... */ }

// a default export: at most one per module, imported under any name
export default function compareVersions(a, b) { /* ... */ }
```

```js
// main.mjs
import compareVersions, { versionBelow, DEFAULT_LEVEL } from "./library.mjs";
import * as lib from "./library.mjs";         // everything, as one object
import fs from "node:fs";                     // built-in modules work too

console.log(versionBelow("4.1", DEFAULT_LEVEL), compareVersions("2.10", "2.9"));
console.log(lib.DEFAULT_LEVEL);
```

- In Node.js, a file is an ES module when its name ends with `.mjs`, or when
  `package.json` has `"type": "module"`.
- `import` paths need the **file extension**: `"./library.mjs"`, not `"./library"`.
- `import` and `export` stand at the top level of the file, not inside `if` or a
  function. ES modules are always in strict mode.
- In an ES module, `await` works at the top level (section 8); `__dirname` is
  `import.meta.dirname` (Node.js 20.11+).
- Node.js 22.12+ can also `require()` an ES module, and an ES module can `import` a
  CommonJS one - so the two systems mix.

**Which one for the course project?** CommonJS - because your rule engine loads the
library with `require`. Your tools and tests may use either.

### Before modules: one global object

Before modules, a library put everything into **one** global object, wrapped in an
IIFE (lecture 5) so that its helpers stayed private:

```js
var library = (function () {
    function compareVersions(a, b) { /* ... */ }
    function versionBelow(a, b) { return compareVersions(a, b) < 0; }
    return { compareVersions: compareVersions, versionBelow: versionBelow };
})();
```

You may still meet this pattern in old code. A module does the same, cleaner: the file
is the private scope, `module.exports` is the returned object.

## 7. Errors

### What is an exception?

An **exception** is an event during the run of a program (a *runtime error*) that
stops its normal flow: reading a key of `undefined`, calling something that is not a
function, invalid JSON. It is different from a **syntax error**, which the engine
finds before anything runs (lecture 1).

Developers say "exception"; JavaScript **throws** `Error` objects:

```js run
try {
    const x = undefined;
    x.state;                          // a key of undefined
} catch (err) {
    console.log(err instanceof Error);    // true
    console.log(err.name);                // TypeError
    console.log(err.message);             // Cannot read properties of undefined (reading 'state')
    console.log(typeof err.stack);        // string - where it happened (file, line, call stack)
}
```

Without a `try`, the error stops the program: Node.js prints the message and the
**stack trace** - the chain of function calls that led to it - and exits with code 1.
Read a stack trace from the top: the first line is where the error happened.

::: info Animation
**The call stack:** [4. Nested calls](../animations/callStack.html#4){target="_blank"},
[7. Stack overflow (advanced)](../animations/callStack.html#7){target="_blank"} -
a stack trace is a picture of this stack at the moment of the error
:::

### The error types

MDN: [Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)

| Type | When | Example |
|---|---|---|
| `TypeError` | a value of the wrong type is used | `undefined.state`, `null.length`, `5()`, assigning to a `const` |
| `ReferenceError` | a name that does not exist | `console.log(firmwareLevle)` (a typo) |
| `SyntaxError` | code or data that cannot be parsed | `JSON.parse("{ x: 1 }")`, `new Function("if (")` |
| `RangeError` | a number outside the allowed range | `new Array(-1)`, `(1).toFixed(101)`, `new Date("x").toISOString()` |
| `URIError` | a broken URI escape | `decodeURIComponent("%")` |
| `EvalError` | (historic, not thrown today) | |

```js run
const attempts = [
    () => undefined.state,
    () => firmwareLevle,
    () => JSON.parse("{ x: 1 }"),
    () => new Array(-1),
    () => decodeURIComponent("%"),
];
for (const attempt of attempts) {
    try {
        attempt();
    } catch (err) {
        console.log(err.name.padEnd(15), err.message);
    }
}
```

In rules, almost every error is a `TypeError` - a missing level of the report - or
a `SyntaxError` from `JSON.parse`.

### `try` / `catch`

MDN: [try...catch](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch)

```text
try {
    statements that may fail
} catch (err) {
    what to do when one of them throws
}
```

When a statement in `try` throws, the rest of `try` is **skipped** and `catch` runs.
Without an error, `catch` is skipped. The program goes on after the whole statement:

```js run
try {
    console.log(x);                     // ReferenceError: x is not defined
    console.log("Continue try block?"); // never runs
} catch (err) {
    console.log("There was an error");
}
console.log("But the program continues to run");
```

`err` exists only **inside** the `catch` block. When you do not need it, leave it out
(*optional catch binding*, ES2019): `catch { ... }`.

```js run
try {
    x + 2;
} catch (err) {
    console.log(`Error: ${err.message}`);
}
console.log(typeof err);                // undefined - err was local to the catch block
```

### `finally`

`finally` runs **always** - after `try`, or after `catch` - error or not. It is the
place for clean-up: closing a file, printing a summary, resetting a value.

```js run
function checkReport(doc) {
    console.log("start", doc.status?.device_alias);
    try {
        return doc.inventory.details.firmware_level;     // may throw
    } catch (err) {
        console.log("failed:", err.message);
        return null;
    } finally {
        console.log("done");                             // also after return
    }
}
console.log(checkReport(doc));
console.log(checkReport({ status: { device_alias: "LAB-DEV-04" }, inventory: {} }));
```

`try` / `finally` without `catch` also exists - the error is **not** caught, but
`finally` still runs before it goes up:

```js run
try {
    try {
        console.log("Try 1");
        console.log(x);                 // a ReferenceError
    } finally {
        console.log("Finally 1");       // runs first
    }
    console.log("never printed");
} catch (err) {
    console.log("caught outside:", err.name);
}
```

### `throw`: raise your own error

MDN: [throw](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/throw)

`throw expression;` stops the function and starts looking for a `catch` - in this
function, then in its caller, then in the caller's caller... The lines after `throw`
do not run:

```js run
function divide(a, b) {
    if (b === 0) {
        throw new Error("Cannot divide by zero");
    }
    return a / b;
}

try {
    console.log(divide(10, 2));     // 5
    console.log(divide(10, 0));     // throws
    console.log("not printed");
} catch (err) {
    console.log(err.message);       // Cannot divide by zero
}
```

On the report - a helper that **needs** a value says so clearly:

```js run
function requireField(doc, path) {
    let cur = doc;
    for (const key of path.split(".")) {
        cur = cur?.[key];
    }
    if (cur === undefined || cur === null || cur === "") {
        throw new Error(`missing field: ${path}`);
    }
    return cur;
}

console.log(requireField(doc, "overview.model"));          // XR-220
try {
    requireField(doc, "overview.site");
} catch (err) {
    console.log(err.message);                              // missing field: overview.site
}
```

You **can** throw any value - `throw "Error 1"` - but then there is no `name`, no
`stack`, and `err.message` is `undefined`. Always throw `Error` objects
(`new Error(...)` or one of the types: `new TypeError(...)`, `new RangeError(...)`).

```js run
try {
    throw "Error 1";
} catch (err) {
    console.log(typeof err, err.message, err.stack);    // string undefined undefined
}
```

### Return an error, or throw it?

Some code returns an `Error` object instead of throwing it, and the caller
checks with `instanceof`:

```js run
function validateAge(age) {
    return (age < 0 || age > 120) ? new Error(`Invalid value for age: ${age}`) : age;
}

const result = validateAge(-5);
if (result instanceof Error) {
    console.log(`Anticipated error: ${result.message}`);
} else {
    console.log(`Valid age: ${result}`);
}
```

It works, but every caller must remember the check - forget it, and `-5` travels on
as an `Error` object. Better rules of thumb:

- **Expected** situations - a missing field in a report, a model that is not ours -
  are normal data: handle them with `if` / guard clauses and return a value (`null`,
  `""`, no alert). No exceptions.
- **Unexpected** situations - a bug, data that breaks the contract of a helper - are
  errors: `throw`, and let the caller (or the engine) see them.

### Handling a specific error

`catch` catches **everything**. To react to one kind of error only, check it - and
throw the others on:

```js run
function parseOrNull(text) {
    try {
        return JSON.parse(text);
    } catch (err) {
        if (err instanceof SyntaxError) return null;   // the one error we expect
        throw err;                                     // anything else: not ours - throw it on
    }
}
console.log(parseOrNull('{"a": 1}'), parseOrNull("{a: 1}"));   // { a: 1 } null
```

You can also check all the types in one `if...else if` chain:

```js run
try {
    console.log(x);
} catch (e) {
    if (e instanceof EvalError) console.log("EvalError");
    else if (e instanceof RangeError) console.log("RangeError");
    else if (e instanceof ReferenceError) console.log("ReferenceError");
    else if (e instanceof SyntaxError) console.log("SyntaxError");
    else if (e instanceof TypeError) console.log("TypeError");
    else if (e instanceof URIError) console.log("URIError");
    else console.log("Error!");
}
// ReferenceError
```

### Your own error classes

A class that **extends** `Error` (lecture 6) gives your errors their own name - and
room for more information:

```js run
class ReportError extends Error {
    constructor(message, field) {
        super(message);              // sets message (and stack)
        this.name = "ReportError";
        this.field = field;          // extra information
    }
}

function firmwareOf(doc) {
    const level = doc.inventory?.details?.firmware_level;
    if (typeof level !== "string") {
        throw new ReportError("no firmware level in the report", "inventory.details.firmware_level");
    }
    return level.split(" ")[0];
}

try {
    firmwareOf({ inventory: {} });
} catch (err) {
    console.log(err.name, "|", err.message, "|", err.field);
    console.log(err instanceof ReportError, err instanceof Error);   // true true
}
```

Before classes, the same was written with a constructor function and its prototype
(the *ES5 way*):

```js run
function DivideByZero(message) {
    this.name = "DivideByZero";
    this.message = message || "Cannot divide by zero";
    this.stack = new Error().stack;
}
DivideByZero.prototype = Object.create(Error.prototype);

try {
    throw new DivideByZero();
} catch (e) {
    console.log(e.name, "-", e.message, "-", e instanceof Error);   // DivideByZero - Cannot divide by zero - true
}
```

When you catch an error and throw a new, clearer one, keep the original as the
**cause** (ES2022):

```js run
function loadReport(text, name) {
    try {
        return JSON.parse(text);
    } catch (err) {
        throw new Error(`report ${name} is not valid JSON`, { cause: err });
    }
}
try {
    loadReport("{ broken", "lab-dev-05.json");
} catch (err) {
    console.log(err.message);           // report lab-dev-05.json is not valid JSON
    console.log(err.cause.name);        // SyntaxError - the original error
}
```

### The catch-all `catch` in rules

Many existing rules wrap everything in one `try`:

```js
function rule(doc) {  // never change this line
    try {
        // ... the whole rule ...
    } catch (err) {
        return;
    }
}
```

It keeps the engine from showing errors - and that is exactly the problem: a missing
level of the report, a typo in a key, a bug in a helper - all end the same way:
**no alert, no message**. Lectures 5 - 8 showed it again and again: a device with a
real problem silently missed.

Better:

1. Use guard clauses and `?.` / `??` for the data that can **legitimately** be
   missing - then there is nothing to catch.
2. If a part can fail (`JSON.parse` of an embedded string, a date in an odd format),
   wrap **only that part** in `try`, and decide what the rule does without it.
3. Let real bugs throw. A rule that fails loudly gets fixed; a rule that fails
   silently misses alerts for years.

Section 11 runs both versions on the same reports.

### Global error handlers and error tracking

A browser page can catch every error that nobody caught with `window.onerror` - the
handler gets `message`, `source`, `lineno`, `colno` and `error`. Node.js
has `process.on("uncaughtException", handler)`. Both are a last resort for logging,
not a way to continue as if nothing happened.

In production, errors and logs are usually sent to a **log management** or **error
tracking** service (older names: Loggly, Rollbar; today often Sentry or the logging
of the platform) - so that someone sees them. Ask what your rule engine does with the
errors of a rule.

## 8. Code that waits: promises, `async` and `await`

::: info Not for rules
Rule engines run a rule from start to end at once - rules do not wait for files or
the network. You need this section for **Node.js tools**: reading many files, `fetch`
(section 9), and tests (lecture 10).
:::

### Synchronous and asynchronous

- **Synchronous**: each task finishes before the next one starts - like waiting in
  the queue at a coffee shop until you have your coffee.
- **Asynchronous**: a task is started, the program goes on, and the result is
  handled **later** - like ordering a coffee and doing other things until it is
  ready.

`setTimeout(f, ms)` runs `f` later - even with `0` ms, only after the current code
has finished:

```js run
console.log("Start");
setTimeout(() => console.log("Hello from the timer"), 0);

let sum = 0;
for (let i = 0; i < 10_000_000; i++) sum += i;     // busy for a moment
console.log("End", sum);
// Start, End ..., and only then: Hello from the timer
```

### The event loop

MDN: [JavaScript execution model](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model)

JavaScript runs on **one thread**, with one **call stack** (lecture 5). Waiting work -
timers, files, network answers - is done outside it; when it is ready, its callback
goes into a **queue**. The **event loop** takes the next callback from the queue
whenever the call stack is **empty**. That is why the timer above runs after
`console.log("End")`: the stack was busy until then.

See it step by step in [JavaScript Visualizer 9000](https://www.jsv9000.app/), and in
the talk "Everything You Need to Know About Node.js Event Loop" (Bert Belder) linked
in Read more.

### From callbacks to promises

MDN: [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise), [Using promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises)

A story in three steps: prepare dinner (2 s), then eat it (0.5 s), then go to bed -
each step after the previous one, with errors handled. With callbacks, every next
step goes **inside** the previous one ("callback hell"):

```js run
function prepareDinner(onDone) {
    console.log("prepareDinner takes 200 ms");
    setTimeout(() => onDone("pizza"), 200);
}
function eatDinner(dinner, onDone) {
    console.log("eatDinner takes 50 ms");
    setTimeout(() => onDone(`Sweet dreams after ${dinner}`), 50);
}

prepareDinner(dinner => {
    eatDinner(dinner, message => {
        console.log(message);                   // ... and one more level for every step
    });
});
console.log("Do something else meanwhile...");
```

A **promise** is an object that stands for a result that comes **later**. It is
*pending* at first, then either *fulfilled* (with a value) or *rejected* (with an
error). You create one with `new Promise((resolve, reject) => ...)`, and use its result
with `.then()`, `.catch()` and `.finally()`:

```js run
function prepareDinner() {
    console.log("prepareDinner takes 200 ms");
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const success = true;
            if (success) resolve("pizza");
            else reject(new Error("Cannot buy dinner!"));
        }, 200);
    });
}
function eatDinner(dinner) {
    console.log("eatDinner takes 50 ms");
    return new Promise(resolve => setTimeout(() => resolve(`Sweet dreams after ${dinner}`), 50));
}

prepareDinner()
    .then(dinner => eatDinner(dinner))      // the next step: a flat chain, no nesting
    .then(message => console.log(message))
    .catch(err => console.log("Error:", err.message))     // one place for all errors
    .finally(() => console.log("evening over"));
console.log("Do something else meanwhile...");
```

### `async` and `await`

MDN: [async function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function), [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)

`async` / `await` (ES2017) write the same chain like normal, synchronous code:

- an **`async` function** always returns a promise;
- inside it, **`await` promise** waits for the promise and gives its value - or
  throws its error, so `try` / `catch` works as usual.

```js run
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function prepareDinner() {
    console.log("preparing...");
    await wait(200);
    return "pizza";                    // the value of the promise
}

async function evening() {
    try {
        const dinner = await prepareDinner();
        console.log(`${dinner} is ready`);
        await wait(50);
        console.log(`Sweet dreams after ${dinner}`);
    } catch (err) {
        console.log("Error:", err.message);
    }
}

await evening();                       // top-level await: on this site and in ES modules
console.log("after the evening");
```

In a CommonJS file, `await` works only inside an `async` function - call it at the end:
`main().catch(err => { console.error(err); process.exitCode = 1; });`.

Reading many files at once - `Promise.all` waits for all promises:

```js
const fs = require("node:fs/promises");          // the promise versions of fs

async function readReports(files) {
    const texts = await Promise.all(files.map(file => fs.readFile(file, "utf8")));
    return texts.map(text => JSON.parse(text));
}
```

## 9. `fetch`: JSON from a web API

MDN: [Window: fetch() method](https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch), [Using the Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)

Web APIs answer requests with JSON. `fetch` (in browsers, and global in Node.js 18+)
sends a request and returns a promise of the **response**.

### HTTP in one minute

- The client sends a **request**: a method (`GET` to read, `POST` to send data), a URL,
  headers, sometimes a body.
- The server sends a **response**: a **status code** (`200` OK, `404` not found, `500`
  server error, ...), headers (`Content-Type: application/json`) and a body - here,
  JSON text.

### The weather, as JSON

[Open-Meteo](https://open-meteo.com/) is a free weather API, without an account. The
current temperature in Sofia:

```js run
const url = "https://api.open-meteo.com/v1/forecast"
          + "?latitude=42.70&longitude=23.32&current=temperature_2m,wind_speed_10m";

const response = await fetch(url);                 // the response arrives: status and headers
console.log(response.status, response.ok);         // 200 true
const data = await response.json();                // the body: JSON text -> object
console.log(data.current);
console.log(`Sofia: ${data.current.temperature_2m} ${data.current_units.temperature_2m}`);
```

- `response.json()` reads the body and **parses** it - despite its name, the result is
  a JavaScript object, not JSON text.
- `fetch` rejects only when there is **no** response (no network, a wrong host). A
  `404` or `500` is a normal response: check `response.ok` (true for `200` - `299`).

```js run
async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`);
    }
    return response.json();
}

try {
    const todo = await fetchJson("https://jsonplaceholder.typicode.com/todos/1");
    console.log(todo.title);
    await fetchJson("https://jsonplaceholder.typicode.com/todos/999999");
} catch (err) {
    console.log("Error:", err.message);       // HTTP 404 for ...
}
```

The same with `.then()`, as older code writes it:

```js run
fetch("https://jsonplaceholder.typicode.com/todos/1")
    .then(response => response.json())
    .then(todo => console.log(todo.title))
    .catch(error => console.log("Error:", error.message));
```

Public APIs that return JSON, good for practice:
[JSONPlaceholder](https://jsonplaceholder.typicode.com/) (fake data for testing),
[Open-Meteo](https://open-meteo.com/en/docs) (weather),
[Open Trivia Database](https://opentdb.com/api_config.php) (quiz questions),
[chucknorris.io](https://api.chucknorris.io/) (jokes), and a long list:
[public-apis on GitHub](https://github.com/public-apis/public-apis).

::: info In the browser: CORS
A page may `fetch` from another site only if that site allows it (with the header
`Access-Control-Allow-Origin`) - the two APIs above do. Node.js has no such limit.
:::

## 10. Running a rule locally

Rules can be tested only in the rule engine's web interface - unless you run them
yourself. With Node.js you can: load a rule **unchanged**, give it a fake `emit` and
your `library.js`, and run it on a folder of sample reports.

### The folder

The homework repository has one ready (`data/reports/`), and a rule with its library
(`09-json-node-modules-errors/rules/`):

```text
data/reports/
|-- lab-dev-01.json     XR-220, all enclosures fine        -> no alert
|-- lab-dev-02.json     XR-210, old firmware, degraded     -> an alert
|-- lab-dev-03.json     XR-300, not our model              -> no alert
|-- lab-dev-04.json     XR-220, an odd report: parts missing, one enclosure as an object
|-- lab-dev-05.json     not valid JSON (a comment, a trailing comma) - on purpose
`-- README.txt          not JSON - the runner must skip it
```

### Loading a rule as it is

A rule file is not a module: it has no `module.exports`, it uses `emit` and
`require("library.js")` that the **engine** provides. So the runner does what an
engine does - it reads the code as text and runs it with the values it needs, using
the `Function` constructor (the Run button of this site works the same way):

```js
function loadRule(file, emit) {
    const code = fs.readFileSync(file, "utf8");
    const fakeRequire = name => (name === "library.js" ? library : require(name));
    // a function whose parameters are require and emit, and whose body is the rule
    // file plus one line that returns the rule function
    return new Function("require", "emit", code + "\nreturn rule;")(fakeRequire, emit);
}
```

The idea, on this site:

```js run
const ruleCode = `
    const MODELS = ["XR-210", "XR-220"];
    function rule(doc) {  // never change this line
        if (!MODELS.includes(doc.overview.model)) return;
        emit(doc.status.device_alias, { "Model": doc.overview.model });
    }
`;

const alerts = [];
const fakeEmit = (id, details) => alerts.push({ id, details });
const rule = new Function("emit", ruleCode + "\nreturn rule;")(fakeEmit);

rule(doc);
rule({ overview: { model: "XR-300" }, status: { device_alias: "LAB-DEV-03" } });
console.log(alerts);        // [ { id: 'D7F3A9C21E40B815', details: { Model: 'XR-220' } } ]
```

### The whole runner

The script at the start of the lecture, run on the sample reports:

```bash
node run-rule.js 09-json-node-modules-errors/rules/chk-0211.js data/reports
```

```text
lab-dev-05.json: not valid JSON - Expected double-quoted property name in JSON at position 321 (line 5 column 3)
[
  {
    "id": "B2D5F8A31C0E4477",
    "details": {
      "check": "CHK-0211",
      "details": [ { "Device": "LAB-DEV-02", "Model": "XR-210", ... } ]
    }
  },
  {
    "id": "D4F7B0C53E2A6699",
    "details": { ... "Device": "unknown", "Problems": "ENC-01: failed, firmware 2.10" ... }
  }
]
```

and on the older rule `chk-0132.js`, which reads `doc.inventory.details` without a
check:

```text
lab-dev-04.json: the rule failed - TypeError: Cannot read properties of undefined (reading 'firmware_level')
lab-dev-05.json: not valid JSON - ...
[ { "id": "B2D5F8A31C0E4477", "details": { "check": "CHK-0132", ... } } ]
```

Now a missing part of a report is a **visible** problem, with the file name and the
exact error - not a silent "no alert". Practice task 5 builds this runner.

::: tip Next: from "look at the output" to tests
The runner shows the alerts; you still have to read them. Lecture 10 turns the same
idea into **tests** that check the alerts automatically: "for lab-dev-02 exactly one
alert, with these problems".
:::

## 11. Reading existing rules

The same rule twice: with a catch-all `try`, and with guard clauses. Both run on the
same five small reports:

```js run
const reports = {
    "ok": { overview: { model: "XR-220" }, status: { device_alias: "D-1" },
            inventory: { details: { firmware_level: "4.1.0.3 (build 410.3)" } } },
    "no details": { overview: { model: "XR-220" }, status: { device_alias: "D-2" }, inventory: {} },
    "no status": { overview: { model: "XR-210" },
                   inventory: { details: { firmware_level: "4.0.9.1" } } },
    "level is a number": { overview: { model: "XR-210" }, status: { device_alias: "D-4" },
                           inventory: { details: { firmware_level: 4.1 } } },
    "not our model": { overview: { model: "XR-300" }, status: { device_alias: "D-5" } },
};

function makeEmit(name) {
    return (id, details) => console.log(`  ${name}: ALERT for ${id}: ${JSON.stringify(details)}`);
}

// the older rule: everything in one try
function oldRule(doc, emit) {
    try {
        var model = doc.overview.model;
        if (model != "XR-210" && model != "XR-220") return;
        var level = doc.inventory.details.firmware_level;
        var version = level.split(" ")[0];
        if (version < "4.2") emit(doc.status.device_alias, { "Version": version });
    } catch (err) {
        return;
    }
}

// the same check, with guard clauses - and no try at all
function newRule(doc, emit) {
    const model = doc.overview?.model;
    if (model !== "XR-210" && model !== "XR-220") return;
    const level = String(doc.inventory?.details?.firmware_level ?? "");
    const version = level.split(" ")[0];
    if (version === "") return;                                     // nothing to check
    const [major, minor] = version.split(".").map(Number);
    if (major < 4 || (major === 4 && minor < 2)) {
        emit(doc.status?.device_alias ?? "unknown device", { "Version": version });
    }
}

for (const [name, report] of Object.entries(reports)) {
    console.log(name + ":");
    oldRule(report, makeEmit("old"));
    try {
        newRule(report, makeEmit("new"));
    } catch (err) {
        console.log(`  new: ERROR ${err.name}: ${err.message}`);
    }
}
```

**Check yourself:**

1. For which reports does the old rule give **no** alert although the new one does?
   What happened inside the old rule each time?
2. "no details": neither rule gives an alert. Is that right? What would you want a
   rule to do with a report that has no firmware level at all?
3. In the new rule there is no `try`. Can it still throw? Find an input that makes it
   throw - and decide whether that error should be caught.
4. The old rule compares `version < "4.2"` as strings. What does it do with a report
   whose firmware level is `"4.10.0.1"`? And the new rule?
5. In which line of the old rule would you put a **narrow** `try`, if any?

::: details Answer
1. "no status": the old rule reads `doc.status.device_alias` inside `emit(...)` - a
   `TypeError`, caught, silently returned; the new rule uses `?.` and reports
   "unknown device". "level is a number": `level.split` is not a function for the
   number `4.1` - a `TypeError`, swallowed; the new rule converts with `String(...)`
   and reports version `4.1`.
2. Both stop: the old one by an error (by luck), the new one on purpose
   (`version === ""`). Whether "no firmware level" should be an alert is a
   decision about the data - maybe a separate check ("report incomplete"). The point:
   the new rule makes the decision **visible** in the code.
3. Yes - for example `newRule(null, ...)`: `null.overview` throws a `TypeError`
   (`doc?.overview` would not). Should it be caught? A rule called with `null`
   means the engine or the runner is broken - an error is the right signal there.
4. `"4.10.0.1" < "4.2"` is `true` as strings (`"1"` < `"2"` at position 2, lecture 3):
   the old rule sends an alert for a device that is **newer** than 4.2. The new rule
   compares the numbers - major 4, minor 10 - and sends none.
5. Nowhere in this rule: everything that can be missing is handled with `?.` and
   `??`. A narrow `try` belongs around something that can really fail with valid
   data - for example `JSON.parse` of a string field that contains embedded JSON.
:::

## 12. Practice

In your copy of the Homework repository, first get the new tasks:

```bash
git pull --no-rebase --no-edit upstream main
node 09-json-node-modules-errors/practice/task1-predict.js
```

Each file is split into parts. A part has its description, then the `your code`
lines - write your code between them - and right after them its checks, which
print `OK` or `FAIL`.

| Task | File | What you do |
|------|------|-------------|
| 1 | `task1-predict.js` | Predict 20 results: `JSON.stringify` and `JSON.parse`, the error types, `try` / `finally` |
| 2 | `task2-json.js` | Parse safely (with the file name in the error), remove a BOM, stringify with fixed keys and indentation, compare without key order, mask values |
| 3 | `task3-library.js` + `task3-module.js` | Turn your helpers into a CommonJS module; `task3-module.js` loads it with `require` and checks it |
| 4 | `task4-errors.js` | Classic tasks (`calculateArea`, `retryOperation`, `checkUserPermission`), a `ReportError` class, `requireField`, the type of an error |
| 5 | `task5-run-rule.js` | The local rule runner: read the reports of a folder, load a rule with a fake `emit`, collect alerts and errors |

## Summary

| Topic | Remember |
|-------|----------|
| JSON | Text; double quotes; no trailing comma, comments, `undefined`, `NaN`; six types; `null` = "known to be empty" |
| `JSON.parse` | Text -> values; throws `SyntaxError` - parse in a `try` and say which file failed; a reviver for dates |
| `JSON.stringify` | Values -> text; `(value, null, 2)` for people; a replacer chooses or masks keys; drops `undefined` and functions |
| Node.js | `node file.js`; `process.argv`, `process.env`, `process.exitCode`; `__dirname` vs `process.cwd()` |
| `console` | `log`, `warn`, `error` (stderr), `table`, `dir` with `{ depth: null }`, `group`, `count`, `time`, `assert` |
| Files | `fs.readFileSync(f, "utf8")`, `writeFileSync`, `readdirSync`; paths with `path.join` |
| npm | `npm init -y`; `package.json` scripts and dependencies; `node_modules/` not in Git; `package-lock.json` in Git; `npx` |
| CommonJS | `module.exports = { ... }`; `require("./file.js")`; runs once, cached; the course library uses it |
| ES modules | `export` / `export default`, `import { a } from "./file.mjs"`; `.mjs` or `"type": "module"` |
| Errors | `Error` objects: `name`, `message`, `stack`, `cause`; `TypeError`, `ReferenceError`, `SyntaxError`, `RangeError` |
| `try` | `catch` for errors you can handle; `finally` always runs; check the type and rethrow the rest |
| `throw` | Throw `Error` objects, never strings; custom classes with `extends Error` |
| Catch-all | `catch (err) { return; }` hides bugs and misses alerts - guard clauses instead |
| Async | Promises: pending -> fulfilled / rejected; `.then` / `.catch`; `async` functions and `await`; `Promise.all` |
| `fetch` | `await fetch(url)`, check `response.ok`, `await response.json()` |
| Local runs | Load the rule unchanged with a fake `emit` and `require`; run it on a folder; print every error |

## Homework

1. `09-json-node-modules-errors/homework.js` (in the homework repository): load all
   reports of a folder with `fs/promises` and `Promise.all`, a `fetchJson` that checks
   the status (tested with a fake `fetch`), and a summary of the runner's alerts and
   errors.
2. The practice tasks you did not finish in class - recommended, as later tasks
   and the course project reuse them. Every check must print `OK`.
3. **Course project:** make `library.js` a clean CommonJS module, add `run-rule.js`
   (practice task 5) to your repository, and run one of your real rules (with an
   anonymised sample) locally. Add `package.json` with a script `"run-rule"`.
4. Optional: find a rule of yours with a catch-all `try`. Which errors could it hide?
   Rewrite it with guard clauses and run both versions on your samples.

## Read more

- MDN: [Working with JSON](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/JSON),
  [JSON.parse()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse),
  [JSON.stringify()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify),
  [Control flow and error handling](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Control_flow_and_error_handling),
  [Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error),
  [JavaScript modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules),
  [Using promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises),
  [async function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function),
  [Using the Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch),
  [console](https://developer.mozilla.org/en-US/docs/Web/API/console)
- Node.js: [Introduction to Node.js](https://nodejs.org/en/learn/getting-started/introduction-to-nodejs),
  [Reading files](https://nodejs.org/en/learn/manipulating-files/reading-files-with-nodejs),
  [Modules: CommonJS](https://nodejs.org/api/modules.html),
  [Modules: ECMAScript modules](https://nodejs.org/api/esm.html),
  [An introduction to the npm package manager](https://nodejs.org/en/learn/getting-started/an-introduction-to-the-npm-package-manager),
  [The Node.js event loop](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick)
- javascript.info: [JSON methods](https://javascript.info/json),
  [Error handling](https://javascript.info/error-handling),
  [Modules](https://javascript.info/modules-intro),
  [Promises, async/await](https://javascript.info/async)
- Tools: [JSONLint](https://jsonlint.com/), [JavaScript Visualizer 9000](https://www.jsv9000.app/)
- Video: [Everything You Need to Know About Node.js Event Loop](https://www.youtube.com/watch?v=PNa9OMajw9w) (Bert Belder)

**Next session:** tests with `node:test`, JSDoc types and `// @ts-check`, a linter,
the Git workflow with branches and pull requests - and the review of your course
project.
