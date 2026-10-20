---
title: 2. Variables, types and operators
---

# 2. Variables, types and operators

<div class="lecture-meta">
  <span>Session 2</span><span>practice: <code>02-variables-and-types/</code> in the homework repository</span>
  <span><a href="../example-document"><code>doc</code>: the example JSON document</a></span>
</div>

**Today you will learn to:**

- declare variables with `let` and `const`, and name them well;
- recognise the primitive types and check a value's type with `typeof`;
- calculate with numbers and build text with strings;
- convert the strings from the report JSON into numbers and booleans.

Where this fits in the sample check rule - today we can write the highlighted lines:

```js{4-8}
function rule(doc) {
    const library = require("library.js");

    let name = String(doc.inventory?.extended_info?.json?.data?.system?.name
                      || doc.status.device_alias);
    let serial = doc.overview.serial_number;
    let model = doc.overview.model;
    let version = doc.overview.version;

    if (["XR-210", "XR-220"].includes(doc.overview.model)
        && !library.version_below(doc.overview.version, "4.2.1.7")) {
        emit(doc.status.device_alias, { /* ... alert details ... */ });
    }
}
```

## 1. Declaring and defining variables

A **variable** is a name for a value in memory. Creating it has two parts:

- **declaring** - telling JavaScript the name: `let serial;`
- **defining** (initialising) - giving it its first value: `serial = "SN4X7Q92";`

Usually we do both at once:

```js run
let serial;                 // declared, but has no value yet
console.log(serial);        // undefined

serial = "SN4X7Q92";        // now defined
console.log(serial);

let model = "XR-220";       // declared and defined at once
console.log(model);
```

::: info Animations
**Variables in memory:** [1. Declaring and assigning](../animations/variablesInMemory.html#1){target="_blank"}, [2. Copying a value](../animations/variablesInMemory.html#2){target="_blank"}
:::

### `let` and `const`

| Keyword | Can it get a new value? | Use it for |
|---------|-------------------------|-----------|
| `const` | no | values that do not change - most of your variables |
| `let`   | yes | counters, results built step by step |
| `var`   | yes | old code only - do not use it in new code |

```js run
const model = "XR-220";
let checkedSystems = 0;

checkedSystems = checkedSystems + 1;   // fine, it is a let
console.log(checkedSystems);

model = "XR-210";                      // error: model is a const
console.log("this line never runs");
```

::: tip Start with `const`
Write `const` by default. Change it to `let` only when you really need to give
the variable a new value. Good rule guidelines ask the same for global
variables: *"they must be declared as const"*.
:::

::: info Animation
**Variables in memory:** [5. `const`](../animations/variablesInMemory.html#5){target="_blank"}
:::

### Strict mode: no variables by accident

Without `let`, `const` or `var`, JavaScript silently creates a **global**
variable. A typo in a name then creates a new variable instead of an error:

```js run
let firmwareLevel = "4.2.1.7";
firmwarelevel = "4.3.0.0";      // typo: small "l" - a new global variable!
console.log(firmwareLevel);     // still 4.2.1.7
```

Put `"use strict";` as the **first line** of a file (or function), and the same
mistake becomes an error:

```js run
"use strict";
let firmwareLevel = "4.2.1.7";
FirmwareLevel = "4.3.0.0";      // typo: capital "F" - now an error
console.log(firmwareLevel);
```

::: info
Modules and classes are always in strict mode. In the practice files we start with
`"use strict";`.
:::

::: info Animation
**Variable scope:** [4. No declaration and `"use strict"`](../animations/scopeChain.html#4){target="_blank"}
:::

## 2. Naming variables

**Rules** (otherwise: syntax error):

- letters, digits, `_` and `$`; no spaces, no `-`;
- must not start with a digit;
- must not be a reserved word (`let`, `const`, `if`, `function`, `class`, ...);
- names are **case-sensitive**: `model`, `MODEL` and `Model` are three variables.

**Conventions** (good practice):

- `camelCase` for variables: `serialNumber`, `firmwareLevel`, `isAffected`;
- names that say what is inside: `firmwareLevel`, not `x` or `data2`;
- booleans start with `is`, `has`, `can`: `isEnabled`, `hasCert`;
- `UPPER_SNAKE_CASE` for fixed settings: `const MIN_FIRMWARE_LEVEL = "4.2.1.7";`

::: tip JSON keys vs variable names
The keys in the report JSON use `snake_case` (`firmware_level`,
`remote_login_enabled`). That is the data's naming - keep the keys as they are.
Your own variables use `camelCase`: `const firmwareLevel = doc.inventory.details.firmware_level;`
:::

**Check yourself:** which of these names are valid?

`serial_number`, `2ndNode`, `firmware-level`, `$total`, `const`, `isRemote`, `MODEL`

::: details Answer
Valid: `serial_number`, `$total`, `isRemote`, `MODEL`.
Not valid: `2ndNode` (starts with a digit), `firmware-level` (`-` is minus),
`const` (reserved word).
:::

## 3. Primitive types

A value in JavaScript is either a **primitive** (a single simple value) or an
**object** (a structure with properties - like `doc`). The primitive types:

| Type | Examples | In the report data |
|------|----------|----------------------|
| `number` | `42`, `9.1`, `-3`, `1_000_000` | counts, sizes (after conversion) |
| `string` | `"XR-220"`, `'yes'`, `` `text` `` | almost every value |
| `boolean` | `true`, `false` | "yes" / "no" after conversion |
| `undefined` | `undefined` | a key that is not in the document |
| `null` | `null` | "no value", written on purpose |

(Two more, `bigint` and `symbol`, are rarely needed.)

### `typeof`

```js run
console.log(typeof 42);              // number
console.log(typeof "4.2.1.7");       // string
console.log(typeof true);            // boolean
console.log(typeof undefined);       // undefined
console.log(typeof null);            // object  - a famous old bug in JavaScript
console.log(typeof doc);             // object
```

### Numbers

Whole numbers and decimals are the same type, `number`:

```js run
const nodes = 2;
const ratio = 0.75;
const capacityBytes = 2_199_023_255_552;   // "_" only makes it readable

console.log(nodes, ratio, capacityBytes);
console.log(0.1 + 0.2);                    // not exactly 0.3!
console.log(10 / 0);                       // Infinity
```

::: warning Decimals are not exact
`0.1 + 0.2` gives `0.30000000000000004`. Numbers are stored in binary, so most
decimals are approximations. Round results before you show them.
:::

::: info Animations
**Numbers in memory:** [1. Bits and integers](../animations/numbersInMemory.html#1){target="_blank"}, [2. Fractions and 0.1](../animations/numbersInMemory.html#2){target="_blank"}, [4. 0.1 + 0.2](../animations/numbersInMemory.html#4){target="_blank"}, [6. NaN and Infinity](../animations/numbersInMemory.html#6){target="_blank"}
:::

### Strings

Three kinds of quotes:

```js run
const a = "double quotes";
const b = 'single quotes';
const c = `backticks: a template string`;
console.log(a);
console.log(b);
console.log(c);
```

**Escape sequences** - special characters inside a string:

```js run
console.log("Name:\tLAB-DEV-01");         // \t  tab
console.log("line 1\nline 2");            // \n  new line
console.log("the \"Version\" column");    // \"  a quote inside a string
console.log("C:\\checks\\rules");         // \\  a backslash
```

**Template strings** (backticks) can span lines and insert values with `${...}` -
very handy for alert messages:

```js run
const name = "LAB-DEV-01";
const model = "XR-220";
const firmwareLevel = "4.2.1.7";

const message = `System ${name} (${model}) runs firmware level ${firmwareLevel}.`;
console.log(message);
```

### `undefined` and `null`

- `undefined` - "nothing was put here": a declared variable without a value, or a
  key that is **not in the document**.
- `null` - "no value", set on purpose.

```js run
console.log(doc.overview.model);      // the key exists
console.log(doc.overview.nickname);   // no such key: undefined
```

::: tip This is why rules check for missing data
Reading a missing key gives `undefined`. Reading **a key of** `undefined` is an
error - that is what `?.` in the sample rule protects against (session 6).
:::

::: info Animation
**Variables in memory:** [4. Types of values](../animations/variablesInMemory.html#4){target="_blank"}
:::

## 4. Comments

```js
// a one-line comment

/*
   a comment over
   several lines
*/

/**
 * A documentation comment (JSDoc) - describes the code below it.
 * A rule template usually starts with one.
 */
```

Write comments that explain **why**, not what: `// rule guidelines require const globals` is
useful; `// set x to 5` is not.

## 5. Operators

### Assignment

`=` puts the value on the right into the variable on the left. Short forms:

```js run
let alerts = 0;
alerts = alerts + 1;   // 1
alerts += 2;           // same as alerts = alerts + 2   -> 3
alerts -= 1;           // 2
alerts *= 10;          // 20
alerts++;              // add 1 -> 21
alerts--;              // subtract 1 -> 20
console.log(alerts);
```

::: info Animations
**Variables in memory:** [3. `x = x ** 2`](../animations/variablesInMemory.html#3){target="_blank"}

**How an expression is evaluated:** [3. Assignment is an expression](../animations/expressionEvaluation.html#3){target="_blank"}, [4. `i++` and `++i`](../animations/expressionEvaluation.html#4){target="_blank"}
:::

### Arithmetic

| Operator | Meaning | Example | Result |
|----------|---------|---------|--------|
| `+` `-` `*` `/` | as in math | `7 / 2` | `3.5` |
| `%` | remainder | `7 % 2` | `1` |
| `**` | power | `2 ** 10` | `1024` |

A disk-space example - bytes to TiB (1 TiB = 1024<sup>4</sup> bytes):

```js run
const capacityBytes = 2_199_023_255_552;
const usedBytes = 1_517_325_046_333;

const capacityTiB = capacityBytes / 1024 ** 4;
const usedPercent = usedBytes / capacityBytes * 100;

console.log(capacityTiB);                   // 2
console.log(usedPercent);                   // many decimals
console.log(Math.round(usedPercent));       // 69
console.log(usedPercent.toFixed(1));        // 69.0 - a string with 1 decimal
```

### Precedence

As in math: `**` first, then `*` `/` `%`, then `+` `-`. Use parentheses when in doubt:

```js run
console.log(2 + 3 * 4);       // 14
console.log((2 + 3) * 4);     // 20
console.log(100 - 60 / 2);    // 70
```

**Check yourself:** what does `10 + 20 / 10 * 2 ** 2` print?

::: details Answer
`18`: first `2 ** 2 = 4`, then `20 / 10 = 2`, `2 * 4 = 8`, then `10 + 8`.
:::

::: info Animations
**How an expression is evaluated:** [1. Precedence](../animations/expressionEvaluation.html#1){target="_blank"}, [2. Associativity](../animations/expressionEvaluation.html#2){target="_blank"}, [5. Evaluation order (advanced)](../animations/expressionEvaluation.html#5){target="_blank"}
:::

## 6. Strings and numbers together

`+` with a string **joins** (concatenates). The other arithmetic operators
convert strings to numbers:

```js run
console.log("9" + 1);         // 91  - joined
console.log("9" - 1);         // 8   - subtracted
console.log("3" * "4");       // 12
console.log(1 + 2 + "3");     // 33  - left to right: 3, then "3" + "3"
console.log("1" + 2 + 3);     // 123
```

::: warning
`"9" + 1` is `"91"`, not `10`. When the values come from JSON, **convert them
first**, then calculate.
:::

::: info Animation
**Types, comparisons and logic:** [1. The `+` operator](../animations/coercionAndLogic.html#1){target="_blank"}
:::

## 7. Converting values

### The values in the report JSON are strings

```js run
const version = doc.overview.version;
const enabled = doc.inventory.details.remote_login_enabled;
const epoch = doc.status.epoch;

console.log(version, typeof version);
console.log(enabled, typeof enabled);
console.log(epoch, typeof epoch);
```

### String to number

```js run
console.log(Number("42"));            // 42
console.log(Number(" 42 "));          // 42 - spaces around are ignored
console.log(Number(""));              // 0  - careful!
console.log(Number("4.2.1.7"));       // NaN - Not a Number
console.log(parseInt("4.2.1.7"));     // 4   - reads digits until it cannot
console.log(parseFloat("4.2.1.7"));   // 4.2
console.log(parseInt("8 nodes"));     // 8
```

- `Number(x)` - the **whole** string must be a number, otherwise `NaN`.
- `parseInt(x)` / `parseFloat(x)` - read from the start as far as they can.
- `NaN` is a number that means "not a valid number". Check it with
  `Number.isNaN(value)`.

::: danger A version is not a number
`"4.2.1.7"` has four parts. `Number` gives `NaN`, `parseFloat` gives `4.2` - both
lose information. We compare versions part by part in session 5.
:::

::: info Animation
**Types, comparisons and logic:** [2. String to number](../animations/coercionAndLogic.html#2){target="_blank"}
:::

### Number to string

```js run
const nodes = 2;
console.log(String(nodes));           // 2 (a string)
console.log(nodes + "");              // 2 (a string)
console.log(`${nodes}`);              // 2 (a string)
console.log(typeof String(nodes));    // string
```

The sample rule wraps the name in `String(...)`, so the result is always a string,
whatever the JSON contains.

### "yes" / "no" to boolean

Compare with the text you expect - `===` means "is exactly equal to" (more in
session 3):

```js run
const enabledText = doc.inventory.details.remote_login_enabled;   // "yes"
const isEnabled = enabledText === "yes";

console.log(isEnabled);           // true
console.log(typeof isEnabled);    // boolean
```

### From EPOCH to a date

The report EPOCH is the number of **seconds** since 1 January 1970 (UTC), as a
string. JavaScript dates count **milliseconds**:

```js run
const epochSeconds = Number(doc.status.epoch);
const reportDate = new Date(epochSeconds * 1000);

console.log(epochSeconds);
console.log(reportDate.toISOString());
```

## 8. Practice

Open your copy of the [Homework repository](https://github.com/ivapopova-courses/JS-Basics-Practical-IBM-Homework) in VSCode (first time: see [How to use these pages](/how-to#practice-and-homework); before the session: `git pull upstream main`) and run the tasks from the terminal, in the repository root:

```bash
node 02-variables-and-types/practice/task1-rule-variables.js
```

Each file explains the task at the top. Write your code between the
`your code` lines; the checks at the bottom print `OK` or `FAIL`.

| Task | File | What you do |
|------|------|-------------|
| 1 | `task1-rule-variables.js` | Variables for the data of the sample rule and an alert message with a template string |
| 2 | `task2-predict-types.js` | Predict the result of 12 expressions, then check yourself |
| 3 | `task3-capacity.js` | Bytes from the JSON (strings) to TiB and used percent |
| 4 | `task4-report-age.js` | How many days and hours ago a report was sent |

## Summary

| Topic | Remember |
|-------|----------|
| Variables | `const` by default, `let` when the value changes, never `var`; `"use strict";` |
| Names | `camelCase`, meaningful; JSON keys stay as they are |
| Types | `number`, `string`, `boolean`, `undefined`, `null`; check with `typeof` |
| Strings | `"..."`, `'...'`, `` `...${value}...` ``; escapes `\n`, `\t`, `\"` |
| Operators | `+ - * / % **`, `+=`, `++`; precedence like in math |
| `+` with strings | joins: `"9" + 1` is `"91"` |
| Converting | `Number()`, `parseInt()`, `parseFloat()`, `String()`; `NaN`; `=== "yes"` |

## Homework

1. `02-variables-and-types/homework.js` (in the homework repository): a remote login summary from the
   `remote_login_*` values.
2. The practice tasks you did not finish in class - recommended, as later tasks
   and the course project reuse them. Every check must print `OK`.
3. Optional: take a JSON document you know (anonymised) and try the same
   conversions on it.

**Next session:** comparisons, logical operators, conditions and loops - and the
`if` of the sample rule.
