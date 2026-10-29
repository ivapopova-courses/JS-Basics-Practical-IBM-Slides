---
title: 5. Functions, and reading older code
---

# 5. Functions, and reading older code

<div class="lecture-meta">
  <span>Session 5</span><span>practice: <code>05-functions/</code> in the homework repository</span>
  <span><a href="../example-document"><code>doc</code>: the example JSON document</a></span>
</div>

**Today you will learn to:**

- write a function as a declaration, as an expression and as an arrow function,
  and call it;
- pass arguments to parameters, give parameters default values, and return a
  result with `return`;
- know where a variable can be seen (scope), what shadowing is, and why
  `let` / `const` replaced `var`;
- explain hoisting - why some functions can be called before their line, and
  others not;
- know what happens when a function gets an array or an object, and write
  **pure** helpers that do not change the report;
- pass a function to another function (a **callback**) - written as
  `function (x) { ... }` and as `x => ...`;
- write helpers inside other functions, and know what a closure is;
- build a rule from small helpers, in the order the rule engine expects, and
  write our own `versionBelow(a, b)`;
- read an older rule - `var`, nested helpers, `function (x) { return ...; }`
  callbacks, `try / catch` - and modernise it step by step.

Where this fits in the sample check rule - today's rule is built from **small
helper functions**. The number in each comment is the section of this lecture:

```js
// 7, 12. global constants: const, and no function changes them
const MODELS = ["XR-210", "XR-220"];
const MIN_FIRMWARE = "2.14";

// 2, 5, 12. our own helper: compare two versions part by part
function compareVersions(a, b) {
    const pa = String(a).split(".");
    const pb = String(b).split(".");
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const x = parseInt(pa[i], 10) || 0;
        const y = parseInt(pb[i], 10) || 0;
        if (x !== y) return x < y ? -1 : 1;     // 5. return ends the function
    }
    return 0;
}

// 2. one helper built on another
function versionBelow(a, b) {
    return compareVersions(a, b) < 0;
}

// 4. a default value for a parameter
function deviceName(doc, fallback = "unknown device") {
    return doc.inventory?.extended_info?.json?.data?.system?.name
        || doc.status?.device_alias
        || fallback;
}

// 10. an arrow function: one parameter, one expression
const isProblem = enc => enc.state !== "normal" || versionBelow(enc.firmware, MIN_FIRMWARE);

// 9. a function that gets functions (callbacks)
function collect(list, test, describe) {
    const out = [];
    for (const item of list) {
        if (test(item)) out.push(describe(item));
    }
    return out;
}

function rule(doc) {          // 12. the engine calls rule(doc) - keep this line
    if (!MODELS.includes(doc.overview?.model)) return;      // 5. stop early
    const enclosures = doc.inventory?.enclosures;
    if (!Array.isArray(enclosures)) return;

    // 9, 10. two arrow functions as arguments
    const problems = collect(enclosures, isProblem,
        enc => `${enc.id}: ${enc.state}, firmware ${enc.firmware}`);
    if (problems.length === 0) return;

    emit(deviceName(doc), {
        "Model": doc.overview.model,
        "Problems": problems.length,
        "Details": problems.join("; ")
    });
}
```

- The rule is the same as in lecture 4. The difference: `rule` is short, and
  each step has a **name**. `versionBelow` is no longer a ready-made helper - we
  write it in [section 12](#_12-the-structure-of-a-rule).
- In [section 13](#_13-reading-existing-rules) you read an older rule written
  in the style of many existing rules, and modernise it.

> "Really understanding functions in JavaScript is the single most important
> weapon you can wield." - J. Resig, B. Bibeault, J. Maras,
> *Secrets of the JavaScript Ninja*, 2nd edition (Manning, 2016)

For rules this is literally true: a rule **is** a function, `rule(doc)`. The
engine calls it once for every report.

## 1. What is a function?

MDN: [Functions (guide)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions)

A **function** is a sequence of actions that does one task, kept together under a
**name**. Think of a recipe: "pancakes" is the name; the steps are written once;
you cook them any time you want. The result can depend on extra **inputs**:
pancakes with milk, or pancakes with water.

In programming, a function is a small program inside the program. You **define**
it once, and **call** it (run it) as many times as you need, with different
inputs.

### Why use functions?

- **No repeated code** (the *DRY* principle - "Don't Repeat Yourself"). Fix a
  bug in one place, not in five copies.
- **Related actions in one place**, with a name that says what they do:
  `versionBelow(level, "4.2")` reads better than ten lines of `split` and loops.
- **Better structure**: a long rule becomes a few short steps.
- **Easier to test**: a small function with clear inputs and one result can be
  checked on its own (session 10).

Here is the problem functions solve. The same version check, copied three times:

```js run
const level = "4.2.1.7";

// copy 1: below 4.2.0.0?
let a = level.split(".");
let below1 = Number(a[0]) < 4 || (Number(a[0]) === 4 && Number(a[1]) < 2);

// copy 2: below 4.3? - copied and changed by hand... with a bug
let b = level.split(".");
let below2 = Number(b[0]) < 4 || (Number(b[0]) === 4 && Number(a[1]) < 3);

// copy 3: below 5.0?
let c = level.split(".");
let below3 = Number(c[0]) < 5;

console.log(below1, below2, below3);    // false true true
```

The answers happen to be right, but copy 2 reads `a[1]` instead of `b[1]` - the
kind of bug copying creates. With a function, the logic is written **once**:

```js run
function versionBelow(a, b) {
    const pa = a.split(".");
    const pb = b.split(".");
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const x = Number(pa[i] ?? 0);
        const y = Number(pb[i] ?? 0);
        if (x !== y) return x < y;
    }
    return false;
}

const level = "4.2.1.7";
console.log(versionBelow(level, "4.2"), versionBelow(level, "4.3"), versionBelow(level, "5.0"));
```

Do not worry about the details yet - by the end of this lecture you can read every
line, and in [section 12](#_12-the-structure-of-a-rule) we make it robust.

### Functions or procedures?

Many languages separate two kinds of sub-programs:

- a **procedure** only does something (prints, sends an alert) and gives no
  result back;
- a **function** gets inputs and **returns** a result, like a function in maths:
  `y = f(x)`. You can use the result inside a bigger expression.

In JavaScript, both are written with `function`. In a rule:

| Kind | Example | Used as |
|---|---|---|
| procedure | `emit(name, details)`, `console.log(...)` | a statement on its own line |
| function | `versionBelow(a, b)`, `deviceName(doc)` | a value: `if (versionBelow(...))`, `const name = deviceName(doc);` |

Good helpers are mostly of the second kind: they **compute and return**, and the
rule decides what to do with the result.

## 2. Defining and calling a function

### Option 1: a function declaration

MDN: [function declaration](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)

```text
function <name>(<parameters>) {
    <body>
}
```

- `<name>` - the name of the function. The same rules as for variable names (see
  [identifiers on MDN](https://developer.mozilla.org/en-US/docs/Glossary/Identifier)).
  Use a **verb** or a question, because a function **does** something:
  `getSerial`, `deviceName`, `isSupported`, `hasFeature`, `versionBelow`.
- `<parameters>` - zero or more names, separated by commas. The round brackets are
  required even when there are no parameters.
- `<body>` - the statements between `{` and `}`.
- No `;` is needed after the closing `}` of a declaration (one does no harm).

```js run
// no parameters
function printLine() {
    console.log("------------------------");
}

// two parameters
function printSum(x, y) {
    console.log(x + y);
}

printLine();
printSum(2, 3);         // 5
printLine();
```

### Calling a function

Defining a function **does not run it**. The body runs only when the function is
**called** (also: *invoked*, *executed*):

```text
<name>(<arguments>);
```

- `<arguments>` - the values passed to the parameters in this call.
- Do not put a space between the name and `(` (it works, but it is easy to misread).
- The round brackets are what makes it a call: `greet` is the function,
  `greet()` **runs** it.

```js run
function greet(userName) {
    console.log(`Hello ${userName}. Nice to see you.`);
}

// only now do the actions in greet run
greet("Ada");
greet("John");

console.log(typeof greet);      // function - the name alone does not call it
```

::: info Animation
**The call stack:** [1. Calling a function](../animations/callStack.html#1){target="_blank"} -
each call gets a new **frame** with its own variables.
:::

`console.log` is a function too - a **built-in** one. You call it with an
argument, like your own functions. And a function can call other functions:

```js run
function square(n) {
    return n * n;
}

function sumOfSquares(a, b) {
    return square(a) + square(b);
}

console.log(sumOfSquares(2, 3));      // 4 + 9 = 13
```

::: info Animation
**The call stack:** [4. Nested calls](../animations/callStack.html#4){target="_blank"} -
the stack grows on every call and shrinks on every return.
:::

On the example JSON document, a helper takes the document as a parameter:

```js run
function getModel(doc) {
    return doc.overview.model;
}

function printModel(doc) {
    console.log("The model is " + getModel(doc));
}

printModel(doc);        // The model is XR-220
```

The parameter is called `doc` here too, but it does not have to be: a parameter is
a new name, valid only inside the function. More in [section 6](#_6-scope-where-a-variable-can-be-seen).

### Option 2: a function expression

MDN: [function expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/function)

A function is also a **value**. You can create it in an expression and store it
in a variable:

```text
const <name> = function (<parameters>) {
    <body>
};
```

The function itself has no name here - it is an **anonymous function**. You reach
it through the variable.

```js run
const greet = function (userName) {
    console.log(`Hello ${userName}`);
};

greet("Ada");
```

Two things happen in the line `const greet = function ...`: the variable `greet`
is declared, and then a function is created and assigned to it - like
`const x = 5;`. That is why a function expression ends with `;`, like any other
assignment.

A function expression **can** have a name of its own, but that name is visible
only **inside** the function (useful for error messages and for a function that
calls itself). Outside, use the variable:

```js run
const a = function b() {
    console.log("I am in b!");
};

a();                    // I am in b!
console.log(typeof b);  // undefined - b is not visible here; b() would be a ReferenceError
```

### A forgotten `;` (advanced)

Leaving out the `;` after a function expression usually does no harm, because
JavaScript inserts it for you at the end of the line (*automatic semicolon
insertion*). But **not** when the next line starts with `(` or `[`. Then
JavaScript joins the two lines. An example:

```js run
let x, y;

let foo = function () {
    console.log("Foo");
}                       // you must have ';' here

[x, y] = [1, 2];

console.log(x, y);      // undefined undefined - not 1 2!
console.log(foo);       // [ 1, 2 ] - and foo is not a function any more
```

JavaScript reads it as `let foo = function () {...}[x, y] = [1, 2];`: it sets a
property on the **function** object, `x` and `y` are never set, and `foo` gets the
array. A call `foo()` after it is `TypeError: foo is not a function`. Put `;` after every
assignment - also after a function expression - and the bug cannot happen.

::: info Animation
**Functions are values:** [7. A forgotten `;` (advanced)](../animations/functionsAsValues.html#7){target="_blank"}
:::

### Which one to use?

Both work. In rules and helper files, the most common choice is:

- **function declarations** for the named helpers at the top level of the file
  (`function versionBelow(a, b) { ... }`) - they read like a list of tools;
- **arrow functions** (section 10) for short functions that are passed to other
  functions.

The rule engine calls `function rule(doc)` - a declaration, and that line must
stay as it is.

## 3. Parameters and arguments

- **Parameters** are the names in the **definition**: `function sum(x, y)`.
- **Arguments** are the values in the **call**: `sum(2, 3)`.

The first argument goes to the first parameter, the second to the second, and so
on - **by position**, not by name:

```js run
function sum(x, y) {
    // here the engine has already done: let x = 2, y = 3;
    console.log(x + y);
}

sum(2, 3);      // 5
```

Parameters are **local variables** of the function. You do not declare them
with `let`: the engine creates them on every call and gives them the values of the
arguments. They exist only while the function runs.

### Too few or too many arguments

JavaScript does **not** check the number of arguments. There is no error:

- a parameter without an argument is `undefined`;
- an argument without a parameter is ignored.

```js run
function sum(x, y) {
    console.log(x, y, x + y);
}

sum(2);         // 2 undefined NaN  - 2 + undefined is NaN
sum(2, 3, 4);   // 2 3 5            - 4 is ignored
```

A **variable** that is not declared at all is still an error:

```js run
function sum(x) {
    console.log(x);         // 2
    console.log(x + y);     // ReferenceError: y is not defined
}

sum(2, 3);
```

::: info Animation
**The call stack:** [2. Arguments](../animations/callStack.html#2){target="_blank"} -
a missing argument, and an extra one that bounces off.
:::

::: warning Mind the order
Arguments are matched by position. `versionBelow("4.2", level)` asks the opposite
question to `versionBelow(level, "4.2")`. Give parameters clear names
(`current`, `minimum`), and check the order when you call a helper.
:::

### Any number of arguments: `arguments` and `...rest`

MDN: [The arguments object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments), [Rest parameters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters)

Sometimes a function should take **any** number of values. In older code you see
the special `arguments` object. It exists in every `function` (but not in an
arrow function) and holds all the arguments of the call:

```js run
// older style
function maxOf() {
    var max = arguments[0];
    for (var i = 1; i < arguments.length; i++) {
        if (arguments[i] > max) max = arguments[i];
    }
    return max;
}

console.log(maxOf(3, 9, 4));        // 9
```

`arguments` looks like an array, but it is not one (`Array.isArray(arguments)`
is `false`). Modern code writes a **rest parameter** `...name` instead. It
collects the remaining arguments into a **real array**:

```js run
function maxOf(...values) {
    let max = values[0];
    for (const v of values) {
        if (v > max) max = v;
    }
    return max;
}

console.log(maxOf(3, 9, 4));        // 9

// a rest parameter goes last; the other parameters work as usual
function logAll(prefix, ...messages) {
    for (const m of messages) console.log(prefix + m);
}
logAll("[CHK-0132] ", "firmware below 4.2", "remote login enabled");
```

`Math.max(3, 9, 4)` is a built-in function of the same kind (session 8).

### Example: the area of a rectangle

A function `rectangleArea(width, height)`, used for the rooms of a flat:

```js run
function rectangleArea(width, height) {
    return width * height;
}

const kitchen = rectangleArea(3, 4);
const bedroom = rectangleArea(4, 4.5);
console.log(kitchen, bedroom, kitchen + bedroom);      // 12 18 30
```

**Check yourself:** what does `rectangleArea(3)` return, and why? What does
`rectangleArea("3", "4")` return?

::: details Answer
`rectangleArea(3)` is `NaN`: `height` is `undefined`, and `3 * undefined` is
`NaN`. `rectangleArea("3", "4")` is `12` - the number `12`: `*` converts both
strings to numbers. (`+` would not: it would join them.)
:::

## 4. Default values of parameters

MDN: [Default parameters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Default_parameters)

A **default value** is the value a parameter gets when **no argument** is
passed for it. Since ES6 (2015) you write it in the parameter list:

```js run
function f(x = 1, y = 2, z = 3) {
    console.log(x, y, z);
}

f(6, 7);        // 6 7 3
f();            // 1 2 3
```

Older code uses `||` instead (lecture 3, `||` as a default):

```js run
function f(x, y, z) {
    x = x || 1;     // no let - x is already a local variable
    y = y || 2;
    z = z || 3;
    console.log(x, y, z);
}

f(6, 7);        // 6 7 3
f(0, "");       // 1 2 3 - 0 and "" are lost!
```

The two forms are **not** the same:

- the default value is used only when the argument is `undefined` (missing);
- `x || 1` replaces **every falsy value**: `0`, `""`, `false`, `null`, `NaN`.

```js run
function withDefault(x = 1) { return x; }
function withOr(x) { return x || 1; }

console.log(withDefault(0), withOr(0));             // 0 1
console.log(withDefault(""), withOr(""));           // "" -> prints nothing, then 1
console.log(withDefault(null), withOr(null));       // null 1
console.log(withDefault(undefined), withOr(undefined));     // 1 1
```

Note `null`: a default value is **not** used for `null`. In reports, a missing
value can come as `null`. When `null` must also get the default, use `??` in the
body: `x = x ?? 1;` (ES2020).

::: warning `let x = x || 1` is an error
A common mistake is to write `let x = x || 1;` inside the function. The
parameter `x` is already declared, so this is
`SyntaxError: Identifier 'x' has already been declared`. Write `x = x || 1;` - or
better, a default value.
:::

::: info Animation
**The call stack:** [5. Default values](../animations/callStack.html#5){target="_blank"} -
`f(0)` and `fOld(0)` side by side.
:::

A default value is calculated on **every call**, and it can use the parameters
before it:

```js run
function deviceName(doc, fallback = "device " + doc.overview.serial_number) {
    return doc.inventory.extended_info?.json?.data?.system?.name ?? fallback;
}

console.log(deviceName(doc));                           // LAB-DEV-01
console.log(deviceName({ overview: { serial_number: "SN0001" }, inventory: {} }));
// device SN0001
```

## 5. `return`: giving back a result

MDN: [return](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/return)

Every function call is an **expression** - like `2 + 2`, it gives a value. That
value is decided by `return`:

```text
return <expression>;
```

- The expression is calculated, and its value replaces the call:
  `const res = sum(2, 3);` becomes `const res = 5;`.
- `return` **ends** the function at once. No statement after it runs.
- A function with no `return` (or with `return;` alone) returns `undefined`.

```js run
function sum(x, y) {
    return x + y;
}

function f() {
    console.log("start");
    return true;
    console.log("end");     // never runs
}

const res = sum(2, 3);
console.log(res);           // 5
console.log(sum(sum(1, 2), 3));     // a call inside a call: 6

const ok = f();             // prints start
console.log(ok);            // true

function noReturn() {
    const x = 5;
}
console.log(noReturn());    // undefined
```

::: info Animation
**The call stack:** [3. `return`](../animations/callStack.html#3){target="_blank"}
:::

### `return` in a loop: stop searching

`return` ends the **function**, also from inside a loop. That makes search
helpers short - no `break`, no extra variable:

```js run
function findEnclosure(list, id) {
    for (const enc of list) {
        if (enc.id === id) return enc;      // found: stop here
    }
    return undefined;                       // the loop ended: not found
}

console.log(findEnclosure(doc.inventory.enclosures, "ENC-03"));
console.log(findEnclosure(doc.inventory.enclosures, "ENC-99"));     // undefined
```

The last line `return undefined;` is optional - the function returns `undefined`
anyway - but it shows the reader that "not found" was thought of.

### Stop early: guard clauses

In lecture 3 the rule stopped early with `if (...) return;`. Helpers use the same
pattern. Check the bad cases first, and return; the main work comes last, without
deep nesting:

```js run
function firmwareVersion(doc) {
    const level = doc.inventory?.details?.firmware_level;
    if (typeof level !== "string") return "";       // no level
    if (level.trim() === "") return "";             // an empty level
    return level.split(" ")[0];                     // "4.2.1.7 (build ...)" -> "4.2.1.7"
}

console.log(firmwareVersion(doc));                  // 4.2.1.7
console.log(firmwareVersion({}));                   // "" - prints an empty line
```

### Return a condition directly

A very common older pattern:

```js run
function isSupported(model) {
    if (model === "XR-210" || model === "XR-220") {
        return true;
    } else {
        return false;
    }
}
console.log(isSupported("XR-220"));
```

The condition **is** already `true` or `false`. Return it:

```js run
function isSupported(model) {
    return model === "XR-210" || model === "XR-220";
}
console.log(isSupported("XR-220"), isSupported("XR-300"));     // true false
```

(Careful with `&&` / `||` on non-boolean values: `return name && name.trim();`
returns a string or `undefined`, not `true` / `false`. That is fine when the
caller uses it as a value; wrap it in `Boolean(...)` when you need a real boolean.)

### `return` and a new line

`return` must have its value **on the same line**. On a new line, JavaScript
inserts a `;` after `return` and the function returns `undefined`:

```js run
function isSupported(model) {
    return
        model === "XR-210" || model === "XR-220";
}
console.log(isSupported("XR-220"));     // undefined!

function isSupportedOk(model) {
    return model === "XR-210" ||
        model === "XR-220";
}
console.log(isSupportedOk("XR-220"));   // true
```

A long expression can continue on the next lines - as long as it **starts** on the
`return` line. The same holds for an object: write `return {` with the brace on
the `return` line.

### Several results: return an array or an object

A function returns **one** value. When you need more, return an object (or an
array) that holds them:

```js run
function splitVersion(version) {
    const parts = version.split(".");
    return {
        major: Number(parts[0]),
        minor: Number(parts[1] ?? 0),
        rest: parts.slice(2).join(".")
    };
}

const v = splitVersion("4.2.1.7");
console.log(v.major, v.minor, v.rest);      // 4 2 1.7
```

(Session 6 shows a short way to unpack it: `const { major, minor } = splitVersion(...)`.)

**Check yourself:** `logEvenElements(arr)` prints the even elements
of an array, and `findMaxEven(arr)` returns the largest even element. Which one
is a procedure and which a function? Write `findMaxEven` - what should it return
for `[1, 3, 5]`?

::: details Answer
`logEvenElements` is a procedure: it prints and returns `undefined`.
`findMaxEven` is a function: it returns a value the caller can use.

```js
function findMaxEven(arr) {
    let max;                    // undefined: nothing found yet
    for (const x of arr) {
        if (x % 2 === 0 && (max === undefined || x > max)) max = x;
    }
    return max;
}
```

For `[1, 3, 5]` it returns `undefined` - "there is no even element". Do not start
with `max = 0`: for `[-4, -2]` the answer is `-2`, not `0`. (Practice task 5.)
:::

## 6. Scope: where a variable can be seen

MDN: [Scope](https://developer.mozilla.org/en-US/docs/Glossary/Scope)

The **scope** of a variable is the part of the code where you can use it. There
are three kinds:

- **global scope** - outside of all functions and blocks;
- **function (local) scope** - the body of a function;
- **block scope** - the code between `{` and `}` of an `if`, a loop or a plain
  block, for `let` and `const` (since ES6).

```js run
// x is declared in the global scope
let x = 5;

function foo() {
    // y is local to foo
    let y = 10;
    console.log(`x in foo: ${x}`);      // x in foo: 5 - a global is seen everywhere
    console.log(`y in foo: ${y}`);      // y in foo: 10
}

foo();
console.log(`x in global: ${x}`);       // x in global: 5
console.log(`y in global: ${y}`);       // ReferenceError: y is not defined
```

Parameters are local too. When the function ends, its local variables are gone;
the next call creates new ones.

::: info Animation
**Variable scope:** [1. Global and local](../animations/scopeChain.html#1){target="_blank"}
:::

### The global scope

A variable declared outside every function is **global**: every function can
read it, and every function can **change** it. In a browser page, all script files
share **one** global scope - a global name in one file can clash with the same
name in another file.

An example: a page loads two libraries, and both
define a global with the same name. The second one wins:

```js run
// ---- lib.js ----
var count = 100;
function libInfo() {
    console.log(`lib count: ${count}`);
}

// ---- app.js (loaded after lib.js, same global scope) ----
var count = 0;          // no error: var allows the same name again
libInfo();              // lib count: 0 - the library now sees app's value
```

Node.js files (and the modules of session 9) each have their **own** scope, so
this clash does not happen there. How the rule engine loads rules and libraries is
not known to us - the safe habit is the same everywhere: **few globals, clear
names, and no function changes a global** (more in section 7).

::: info Animation
**Variable scope:** [6. IIFE (advanced)](../animations/scopeChain.html#6){target="_blank"} -
the same clash, and the old fix (section 11).
:::

### Shadowing

A local variable with the **same name** as an outer one **shadows** (hides) the
outer one inside the function. They are two different variables:

```js run
let firstName = "Ada";

function foo() {
    let firstName = "Turing";       // a NEW local variable
    console.log("foo() firstName:", firstName);     // Turing
}

foo();
console.log("global firstName:", firstName);        // Ada - not changed
```

::: info Animation
**Variable scope:** [3. Shadowing](../animations/scopeChain.html#3){target="_blank"}
:::

Parameters shadow too. In rules this is common and fine: the helper's
parameter `doc` hides nothing important, because the helper works only with
what it gets.

**Check yourself:** before you run it, write down the three lines it prints.

```js run
let x = 1;

let foo = function () {
    let x = 2;

    let bar = function (x) {
        console.log("x in bar =", x);
    };
    bar(99);

    console.log("x in foo =", x);
};

foo();
console.log("x in main =", x);
```

::: details Answer
`x in bar = 99`, `x in foo = 2`, `x in main = 1`. There are three different
variables named `x`: the global one, the local one of `foo`, and the parameter of
`bar`. Each function sees the **nearest** one.
:::

### A bug: no declaration

If you assign to a name that was **never declared** (no `let`, `const` or `var`),
JavaScript does **not** create a local variable. It looks outside, and:

- if an outer variable with that name exists, it is **changed**;
- if none exists, a new **global** is created (in old, "sloppy" mode).

```js run
var firstName = "Ada";

function foo() {
    firstName = "Turing";           // no let: this is the GLOBAL firstName
    leakedName = "Lovelace";        // never declared: a new global!
}

foo();
console.log(firstName);             // Turing - the global was changed
console.log(leakedName);            // Lovelace - it leaked out of foo
```

Both are bugs that are hard to find. **Strict mode** turns the second one into an
error. Put `"use strict";` as the first line of a file (or of a function):

```js run
"use strict";

function foo() {
    leakedName2 = "Lovelace";       // ReferenceError in strict mode
}

foo();
```

The practice files of this course all start with `"use strict";`. Modules and
classes are always strict. Whether the rule engine runs rules in strict mode is
not known - so always declare your variables, and the question does not matter.

::: info Animation
**Variable scope:** [4. No declaration](../animations/scopeChain.html#4){target="_blank"}
:::

### The scope chain

Functions can be written inside other functions. The inner function sees its own
variables, then those of the outer function, then the globals - like looking for
a name in your room, then in the flat, then in the building. This is the **scope
chain**. An outer function can **not** see the variables of an inner one:

```js run
let a = "global";

function outer() {
    let b = "outer";

    function inner() {
        let c = "inner";
        console.log(a, b, c);       // global outer inner
    }

    inner();
    console.log(typeof c);          // undefined - c is not visible here
}

outer();
```

The chain is decided by **where the function is written** in the code, not by
where it is called from (*lexical scope*):

```js run
let firstName = "Ada";

function greet() {
    console.log(`Hello, ${firstName}`);     // the global firstName
}

function caller() {
    let firstName = "Turing";       // greet does not see this one
    greet();
}

caller();       // Hello, Ada
```

::: info Animation
**Variable scope:** [2. The scope chain](../animations/scopeChain.html#2){target="_blank"},
[7. Lexical scope (advanced)](../animations/scopeChain.html#7){target="_blank"}
:::

## 7. `let`, `const` and `var`

MDN: [var](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/var), [let](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let), [const](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const)

Lecture 2 said "use `const` and `let`, not `var`". Here is why. Existing rules
use `var` everywhere, so you need to know what it does.

### Block scope

`let` and `const` are visible only in the **block** where they are declared. `var`
ignores blocks: it belongs to the whole **function** (or is global).

```js run
{
    var x = 2;              // var: visible outside the block
    let y = 4;              // only in this block
    const alpha = 2.34;     // only in this block
}

console.log(`x = ${x}`);                // x = 2
console.log(typeof y, typeof alpha);    // undefined undefined - not visible here
```

A `let` in a block is a **new** variable, even with the same name as an outer one:

```js run
let status = "none";
const userAge = 32;

if (userAge >= 18) {
    // not the outer status: a new variable, visible only in this block
    let status = "Adult";
}

console.log(`status = ${status}`);      // status = none
```

That is the answer to lecture 3's question about `for (var i ...)`: with `var`,
`i` is still there after the loop; with `let`, it is not.

```js run
for (var i = 0; i < 3; i++) { }
console.log("var i after the loop:", i);    // 3

for (let j = 0; j < 3; j++) { }
console.log("let j after the loop:", typeof j);     // undefined
```

::: info Animation
**Variable scope:** [5. Block scope: `let` and `var`](../animations/scopeChain.html#5){target="_blank"}
:::

### Declaring the same name again

With `var`, declaring the same name again in the same scope is allowed - and
silently reuses the variable. With `let` and `const` it is an error, which catches
copy-paste bugs early:

```js run
var level = "4.2";
var level = "3.9";          // no error: the same variable
console.log(level);         // 3.9

let model = "XR-220";
// let model = "XR-210";    // SyntaxError: Identifier 'model' has already been declared
```

### Special features of `const` (advanced)

`const` creates a variable that cannot be **assigned** again:

```js run
const GOLDEN_RATIO = 1.618;
try {
    GOLDEN_RATIO = 2;
} catch (err) {
    console.log(err.name + ": " + err.message);    // TypeError: Assignment to constant variable.
}
```

It must get its value in the declaration: `const GOLDEN_RATIO;` is
`SyntaxError: Missing initializer in const declaration`.

`const` does **not** make the value a real constant. When the value is an array or
an object, you can still change what is **inside** - only the arrow from the name
to the value is fixed (lecture 4, section 4):

```js run
const someArray = [3.14];
someArray[0] = 99;              // not a re-assignment: a change inside the array
console.log(someArray[0]);      // 99

const someObject = { pi: 3.14 };
someObject.pi = 4;              // a change inside the object
console.log(someObject.pi);     // 4

// someArray = 4;               // TypeError: Assignment to constant variable.
// someObject = {};             // TypeError: Assignment to constant variable.
```

::: info Animation
**Variables in memory:** [5. `const`](../animations/variablesInMemory.html#5){target="_blank"}
:::

### Why rule guidelines ask for `const` globals that are never changed

Rule guidelines often say: "global variables must be declared as `const`, and your
functions must not modify them". The reason: the engine can load a rule **once**
and call `rule(doc)` for **many** reports. A global that a rule changes keeps its
value from the previous report:

```js run
let problems = [];              // a global that the rule changes - a bug

function rule(doc) {
    if (doc.state !== "normal") problems.push(doc.id);
    console.log(doc.id + ": " + problems.length + " problem(s)");
}

// the engine calls the rule for three reports, one after the other
rule({ id: "LAB-DEV-01", state: "failed" });    // 1 problem(s)
rule({ id: "LAB-DEV-02", state: "normal" });    // 1 problem(s) - from DEV-01!
rule({ id: "LAB-DEV-03", state: "failed" });    // 2 problem(s) - wrong
```

The fix: keep everything that belongs to one report **local** to `rule` (or to a
helper), and use globals only for fixed settings:

```js run
const BAD_STATES = ["failed", "degraded"];      // fixed, never changed

function rule(doc) {
    const problems = [];                        // new for every report
    if (BAD_STATES.includes(doc.state)) problems.push(doc.id);
    console.log(doc.id + ": " + problems.length + " problem(s)");
}

rule({ id: "LAB-DEV-01", state: "failed" });    // 1
rule({ id: "LAB-DEV-02", state: "normal" });    // 0
rule({ id: "LAB-DEV-03", state: "failed" });    // 1
```

And remember `const` does not freeze an array: `BAD_STATES.push(...)` inside a
function would still be a change. "Never changed" is a rule **you** follow.

### Hoisting (advanced)

MDN: [Hoisting](https://developer.mozilla.org/en-US/docs/Glossary/Hoisting)

Before JavaScript runs the code of a scope, it first goes through it once and
registers all **declarations** in it. You can think of two passes:

1. **creation** - every declaration in the scope is registered;
2. **execution** - the statements run, line by line.

So declarations are known from the **start** of their scope, wherever they are
written. This is called **hoisting** ("lifting up"). What a name holds before its
line depends on how it was declared:

| Declared with | Before its line |
|---|---|
| `var x = 10;` | exists, value `undefined` |
| `function f() {...}` | exists, **the whole function** - you can call it |
| `let` / `const` | exists, but you may not touch it: `ReferenceError` (the *temporal dead zone*, TDZ) |
| `var f = function () {...};` | exists, value `undefined` - calling it is `TypeError: f is not a function` |

```js run
console.log("x:", x);       // x: undefined - the declaration is known, the value not yet
var x = 10;
console.log("x:", x);       // x: 10
```

A function **declaration** is hoisted with its body, so it can be called before its
line:

```js run
console.log(foo());         // I am foo() and I work!

function foo() {
    return "I am foo() and I work!";
}
```

A function **expression** is a value in a variable. Only the variable is hoisted:

```js run
try {
    console.log(foo());     // TypeError: foo is not a function
} catch (err) {
    console.log(err.name + ": " + err.message);
}

var foo = function () {
    return "I am foo() and I work!";
};
```

With `let` or `const` the error is a `ReferenceError` instead: the variable is in
the TDZ until its line has run.

::: info Animation
**Hoisting: the two phases of execution:**
[1. `var` and `undefined`](../animations/hoisting.html#1){target="_blank"},
[2. Function declaration](../animations/hoisting.html#2){target="_blank"},
[3. Function expression](../animations/hoisting.html#3){target="_blank"},
[4. `let` / `const` and the TDZ](../animations/hoisting.html#4){target="_blank"},
[5. Hoisting in a function](../animations/hoisting.html#5){target="_blank"},
[6. `let` in a block (advanced)](../animations/hoisting.html#6){target="_blank"},
[7. TDZ: time, not place (advanced)](../animations/hoisting.html#7){target="_blank"}
:::

What it means for rules:

- Because of hoisting, a rule would work even if its helper **declarations** came
  after `rule` - but the guidelines ask for helpers **before** `rule`. Follow
  them: the file reads top-down, and helpers written as `const f = ...` must come
  first anyway.
- A `var` used before its line gives `undefined` silently. A `let` / `const` gives
  a clear error. One more reason to prefer `let` / `const`.

**Check yourself:** what does this print, and why?

```js run
var level = "global";

function f() {
    console.log(level);
    var level = "local";
    console.log(level);
}

f();
```

::: details Answer
`undefined`, then `local`. Inside `f` there is a local `var level`, hoisted to the
start of `f`. It shadows the global from the **first** line of `f`, while its value
is still `undefined`. The global `"global"` is never seen in `f`.
(The animation [Hoisting - 5](../animations/hoisting.html#5){target="_blank"} shows it step by step.)
:::

## 8. Arrays and objects as arguments; pure functions

What does a function get when you pass it a value - the value itself, or a copy?

- A **primitive** (number, string, boolean, `null`, `undefined`) is **copied** into
  the parameter. Changing the parameter does not change the caller's variable.
- An **array or object** is not copied. The parameter gets a copy of the
  **reference** - an arrow to the **same** array or object. Changes inside it are
  seen by the caller.

```js run
function addOne(n) {
    n = n + 1;          // changes only the local copy
    return n;
}

let count = 5;
const more = addOne(count);
console.log(count, more);       // 5 6 - count is unchanged
```

```js run
function addModel(list, model) {
    list.push(model);   // changes THE array the caller has
}

const models = ["XR-210"];
addModel(models, "XR-220");
console.log(models);            // [ 'XR-210', 'XR-220' ] - changed
```

::: info Animation
**Functions and data:** [1. A copy of the value](../animations/functionsAndData.html#1){target="_blank"},
[2. The same array](../animations/functionsAndData.html#2){target="_blank"}
:::

### Changing it, or replacing it

There is a difference between **changing** the array the parameter points to and
**replacing** the parameter with a new array:

```js run
function clearList(list) {
    list = [];          // the local arrow now points to a NEW array; the caller's is untouched
}

function emptyList(list) {
    list.length = 0;    // changes the caller's array
}

const a = ["x", "y"];
clearList(a);
console.log(a.length);  // 2
emptyList(a);
console.log(a.length);  // 0
```

::: info Animation
**Functions and data:** [3. Change or replace](../animations/functionsAndData.html#3){target="_blank"}
:::

### Do not change the report

`doc` is an object, so a helper that gets `doc` (or a part of it) can change the
report itself - and every check after it sees the changed data:

```js run
function shortFirmware(enc) {
    enc.firmware = enc.firmware.split(".")[0];      // changes the report!
    return enc.firmware;
}

const enc = doc.inventory.enclosures[1];
console.log(enc.firmware);              // 2.10
console.log(shortFirmware(enc));        // 2
console.log(enc.firmware);              // 2 - the report has changed
console.log(doc.inventory.enclosures[1].firmware);  // 2 - also here: the same object
```

A later `versionBelow(enc.firmware, "2.14")` now compares `"2"` - and gives a
wrong answer. The fix: **compute and return**, do not write into the input:

```js run
function majorOf(firmware) {
    return firmware.split(".")[0];      // a new string; the input is not touched
}

const enc = doc.inventory.enclosures[1];
console.log(majorOf(enc.firmware));     // 2
console.log(enc.firmware);              // 2.10 - unchanged
```

::: info Animation
**Functions and data:** [4. Changing the report](../animations/functionsAndData.html#4){target="_blank"}
:::

### Pure functions

A **pure function**:

1. returns a result that depends **only on its arguments** - the same arguments
   always give the same result;
2. has **no side effects** - it changes nothing outside: no global, no argument,
   no printing, no alerts.

`majorOf`, `versionBelow`, `deviceName` are pure. `shortFirmware` is not (it
changes its argument), `addModel` is not, and the first `rule` of section 7 is not
(it changes a global).

Pure helpers are easy to read, to test and to reuse: to understand a call you only
need to look at its arguments. Keep the side effects in **one** place - `rule`
itself calls `emit`. Everything it calls should be pure.

```js run
// not pure: reads a global that can change, and writes into it
var lastModel;
function rememberModel(doc) {
    lastModel = doc.overview.model;
    return lastModel;
}

// pure: everything it needs comes in as an argument, the result goes out with return
function modelOf(doc) {
    return doc.overview?.model ?? "";
}

console.log(rememberModel(doc), modelOf(doc));
```

When a helper must return a changed list, it builds a **new** one:

```js run
function withModel(list, model) {
    if (list.includes(model)) return list.slice();  // a copy, unchanged
    return [...list, model];                        // a new array with one more model
}

const MODELS = ["XR-210", "XR-220"];
const more = withModel(MODELS, "XR-230");
console.log(MODELS, more);      // the original is unchanged
```

::: tip The same arrows as in lecture 4
This is the "references" picture again: two names, one array. The animations
[Arrays in memory - 5](../animations/arraysInMemory.html#5){target="_blank"} and
[Variables in memory - 6](../animations/variablesInMemory.html#6){target="_blank"}
show it without functions; a parameter is just one more name.
:::

## 9. Functions are values; callbacks

In JavaScript a function is a **value**, like a number or an array. You can:

- store it in a variable, an array or an object;
- pass it as an **argument** to another function;
- **return** it from a function.

Because of this, functions are called **first-class citizens** (*first-class
functions*). This is the basis of almost every modern JavaScript library - and of
the array methods in session 7.

```js run
function greet() {
    console.log("Hello!");
}

const hello = greet;            // no (): the function itself, not its result
console.log(typeof greet);      // function
console.log(greet);             // [Function: greet]
hello();                        // Hello! - the same function, another name
```

::: info Animation
**Functions are values:** [1. A function is a value](../animations/functionsAsValues.html#1){target="_blank"}
:::

### Anonymous functions

A function **without a name** is an **anonymous function**. It is used where the
function is needed only as a value: assigned to a variable, put into an array or
an object, passed to another function, or returned.

```js run
// an anonymous function as an element of an array
const foobar = [
    function () { console.log("Foo"); },
    function () { console.log("Bar"); }
];
foobar[0]();        // Foo
foobar[1]();        // Bar

// as a property of an object (a method - session 6)
const obj = {
    foo: function () { console.log("Foo"); },
    bar: function () { console.log("Bar"); }
};
obj.foo();          // Foo
obj.bar();          // Bar
```

What does `foobar[2]()` do? `foobar[2]` is `undefined`, and `undefined()` is
`TypeError: foobar[2] is not a function`. The same error comes from a typo in a
helper name inside an object.

::: info Animation
**Functions are values:** [2. In arrays and objects](../animations/functionsAsValues.html#2){target="_blank"}
:::

A real use: a table of checks, each one a small function. The rule runs them all:

```js run
const checks = [
    function (d) { return d.inventory.details.remote_login_enabled === "yes" ? "remote login enabled" : ""; },
    function (d) { return d.inventory.details.power_saving === "on" ? "power saving on" : ""; },
    function (d) { return d.inventory.details.ntp_ip_address ? "" : "no NTP server"; }
];

const found = [];
for (const check of checks) {
    const message = check(doc);
    if (message !== "") found.push(message);
}
console.log(found);     // [ 'remote login enabled', 'power saving on' ]
```

### Callbacks

MDN: [Callback function](https://developer.mozilla.org/en-US/docs/Glossary/Callback_function)

A function passed as an argument to another function is called a **callback**:
the other function "calls it back" when it needs it.

```js run
function caller(callback) {
    console.log("caller will call the callback:");
    callback();
}

function callback1() {
    console.log("I'm the callback1 function!");
}

function callback2() {
    console.log("I'm the callback2 function!");
}

caller(callback1);
caller(callback2);
```

Note the difference between passing **the function** and passing **its result**:

```js run
function caller(f) {
    console.log("1");
    f();
}

function callback() {
    console.log("2");
}

console.log("Feeding the caller() with the function:");
caller(callback);           // 1 2

console.log("Feeding the caller() with the result of a call:");
caller(callback());         // 2 1 - then TypeError: f is not a function
```

In the second call, `callback()` runs **first** (an argument is calculated
before the call), prints 2 and returns `undefined`. `caller` gets `undefined`, and
`f()` fails. Without `()` - the function; with `()` - its result.

::: info Animation
**Functions are values:** [3. Callbacks](../animations/functionsAsValues.html#3){target="_blank"}
:::

### Why callbacks: one loop, many questions

In lecture 4 you wrote the same loop many times: "count the enclosures that are
not normal", "count the enclosures with old firmware"... Only the **condition**
changed. With a callback, the loop is written once, and the condition comes in as
a function:

```js run
function countIf(list, test) {
    let n = 0;
    for (const item of list) {
        if (test(item)) n++;        // call the callback for every element
    }
    return n;
}

function notNormal(enc) {
    return enc.state !== "normal";
}

function isHdd(enc) {
    return enc.type.startsWith("HDD");
}

const encs = doc.inventory.enclosures;
console.log(countIf(encs, notNormal));      // 1
console.log(countIf(encs, isHdd));          // 2
```

`countIf` does not know **what** it counts - the callback decides. It calls
`test(item)` once per element and uses the returned `true` / `false`.

::: info Animation
**Functions and data:** [5. A callback, call by call](../animations/functionsAndData.html#5){target="_blank"} -
every call of the callback gets its own frame.
:::

Two classic exercises with callbacks. `customMap` builds a
new array with the result of the callback for every element; `customFilter` keeps
only the elements for which the callback returns `true`:

```js run
function customMap(arr, f) {
    const mapped = [];
    for (const element of arr) {
        mapped.push(f(element));
    }
    return mapped;
}

function customFilter(arr, f) {
    const filtered = [];
    for (const element of arr) {
        if (f(element)) filtered.push(element);
    }
    return filtered;
}

function square(x) { return x * x; }
function isPositive(x) { return x > 0; }

console.log(customMap([1, 2, 3, 4], square));             // [ 1, 4, 9, 16 ]
console.log(customFilter([-1, 1, -2, 3, 4], isPositive)); // [ 1, 3, 4 ]
```

JavaScript arrays have these built in: `arr.map(f)` and `arr.filter(f)` - and
`forEach`, `find`, `some`, `every`, `reduce`, `sort`... They all take a callback.
Session 7 is about them; today you only need to **read** them.

### Older callbacks in rules: `function (x) { ... }`

Existing rules pass anonymous functions directly in the call:

```js run
var level = "4.2.1.7-B00";

var parts = level.split(".").map(function (x) {
    return parseInt(x, 10) || 0;
});
console.log(parts);     // [ 4, 2, 1, 7 ]

doc.inventory.enclosures.forEach(function (enc) {
    console.log(enc.id + " " + enc.state);
});
```

Read it inside out:

- `function (x) { return parseInt(x, 10) || 0; }` is an anonymous function: "take
  a part, return it as a number, or 0".
- `.map(...)` calls it for every part of the version, and collects the results in
  a new array.
- `.forEach(...)` calls its function for every enclosure, and collects nothing.

`parseInt("7-B00", 10)` is `7`: `parseInt` reads digits from the start and stops at
the first non-digit. The `|| 0` turns `NaN` (no digits at all) into `0`.

### A function that returns a function

A function can create a function and return it:

```js run
function foo() {
    return function () {
        console.log("I'm the returned function");
    };
}

foo()();            // call foo, then call what it returned

// foo()() is the same as:
const bar = foo();
bar();
```

::: info Animation
**Functions are values:** [4. A function returns a function](../animations/functionsAsValues.html#4){target="_blank"}
:::

A useful example: `compose(f, g)` returns a **new**
function that calls `f`, then `g` on its result:

```js run
function compose(f, g) {
    return function (x) {
        return g(f(x));
    };
}

function double(x) { return x * 2; }
function increment(x) { return x + 1; }

const doubleThenIncrement = compose(double, increment);
console.log(doubleThenIncrement(3));        // 7

// on the report: first the version, then its major part
function firmwareVersion(d) { return d.inventory.details.firmware_level.split(" ")[0]; }
function majorOf(v) { return v.split(".")[0]; }
const firmwareMajor = compose(firmwareVersion, majorOf);
console.log(firmwareMajor(doc));            // 4
```

## 10. Arrow functions

MDN: [Arrow function expressions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions)

ES6 added a shorter way to write a function expression: the **arrow function**
(also called *fat arrow*; in other languages - Python, Java, C# - a *lambda*). It
saves typing `function`, `return` and braces, which makes callbacks much shorter.

```js run
const pi = 3.14;

// a function expression
const circleAreaExp = function (r) {
    return r * r * pi;
};

// the same as an arrow function
const circleAreaArrow = r => r * r * pi;

console.log(circleAreaExp(2), circleAreaArrow(2));      // 12.56 12.56
```

### The syntax, step by step

The full form - parameters in brackets, `=>`, a body in braces:

```text
(param1, param2, ..., paramN) => { statements }
```

```js run
const pi = 3.14;
const circleArea = (r) => { return r * r * pi; };
console.log(`circleArea(2) = ${circleArea(2)}`);
```

**One parameter**: the brackets around it can be left out. With **no** parameters,
or **two or more**, the brackets are required:

```text
singleParam => { statements }
() => { statements }
(a, b) => { statements }
```

**One expression** as the body: the braces **and** `return` can be left out - the
value of the expression is returned:

```text
(param1, param2, ..., paramN) => expression
```

```js run
const pi = 3.14;
const circleArea = r => r * r * pi;
console.log(`circleArea(2) = ${circleArea(2)}`);    // 12.56

const sum = (a, b) => a + b;
const now = () => "2026-10-23";
console.log(sum(2, 3), now());
```

### Braces mean "no automatic return"

These two are **not** the same:

- `x => expression` returns the value of the expression;
- `x => { expression }` is a body with one statement, and **no** `return` -
  it returns `undefined`.

```js run
const pi = 3.14;

// braces, no return: the result is undefined
const circleArea = r => { r * r * pi };
console.log(`circleArea(2) = ${circleArea(2)}`);    // circleArea(2) = undefined
```

This is the most common bug with arrow functions. If you add braces, add `return`.

::: info Animation
**Functions are values:** [5. Arrow functions](../animations/functionsAsValues.html#5){target="_blank"}
:::

### Returning an object

`{` after `=>` always starts a **body**, so an object literal must be put in round
brackets:

```js run
const toRow = enc => ({ "Enclosure": enc.id, "State": enc.state });
console.log(toRow(doc.inventory.enclosures[2]));    // { Enclosure: 'ENC-03', State: 'degraded' }

const broken = enc => { Enclosure: enc.id };        // a body with a label - no error, no result
console.log(broken(doc.inventory.enclosures[2]));   // undefined
```

### Arrow functions as callbacks

This is where arrows shine. The older callback and the modern one, side by side:

```js run
var parts1 = "4.2.1.7".split(".").map(function (x) { return parseInt(x, 10) || 0; });
const parts2 = "4.2.1.7".split(".").map(x => parseInt(x, 10) || 0);
console.log(parts1, parts2);

function countIf(list, test) {
    let n = 0;
    for (const item of list) if (test(item)) n++;
    return n;
}

const encs = doc.inventory.enclosures;
console.log(countIf(encs, enc => enc.state !== "normal"));     // 1
console.log(countIf(encs, enc => enc.firmware === "2.10"));    // 2
```

| Older | Modern |
|---|---|
| `function (x) { return parseInt(x, 10) \|\| 0; }` | `x => parseInt(x, 10) \|\| 0` |
| `function (enc) { return enc.state !== "normal"; }` | `enc => enc.state !== "normal"` |
| `function (a, b) { return a + b; }` | `(a, b) => a + b` |
| `function () { return []; }` | `() => []` |
| `function (enc) { console.log(enc.id); }` | `enc => { console.log(enc.id); }` |

A long callback with several statements stays readable as an arrow with braces
and `return` - or, better, becomes a **named** helper.

### Pitfall: an arrow after `||`

An arrow function cannot stand directly after an operator like `||`. Put it in
brackets:

```js
let cb;
cb = cb || function () {};      // ok
cb = cb || () => {};            // SyntaxError: Malformed arrow function parameter list
cb = cb || (() => {});          // ok
```

### What arrow functions do not have

- **No name of their own** - they are always anonymous. When assigned to a
  variable, they take its name for error messages (`const isHdd = enc => ...`
  shows as `isHdd`).
- **No `arguments`** - use a rest parameter: `(...values) => ...`.
- **No hoisting** - they are expressions in a variable, so define them before use.
- **No `new`** - they cannot be used as constructors.
- **No `this` of their own** - inside an arrow, `this` is the `this` of the code
  around it. This matters for **methods** of objects, which come in session 6:

```js
const device = {
    name: "LAB-DEV-01",
    hello: function () { console.log(this.name); },     // this = device
    helloArrow: () => { console.log(this.name); }       // this = the outer this, not device
};
device.hello();         // LAB-DEV-01
device.helloArrow();    // not LAB-DEV-01 (in Node.js: undefined)
```

The rule of thumb: arrows for **callbacks** and short helpers; `function`
declarations for named helpers and **methods**.

## 11. Functions inside functions; closures

### Helpers inside `rule`

Many existing rules define their helpers **inside** `rule`:

```js run
function rule(doc) {
    function model() {
        return doc.overview.model;      // doc of rule - not a parameter of model
    }

    if (model() === "XR-220") {
        console.log("check " + doc.status.device_alias + ", model " + model());
    }
}

rule(doc);
rule({ overview: { model: "XR-210" }, status: { device_alias: "LAB-DEV-02" } });
```

What happens:

- `model` is a **local** variable of `rule`. A new `model` function is created on
  **every** call of `rule`, and it disappears when `rule` returns.
- `model` uses `doc` without getting it as a parameter: it finds it in `rule`'s
  scope, through the scope chain (section 6).

::: info Animation
**Functions and data:** [6. A helper inside `rule`](../animations/functionsAndData.html#6){target="_blank"}
:::

Is this good or bad? It works. Its costs:

- the helper can be used **only** inside this rule - another rule copies it (the
  same `cmpVer` in every rule);
- it can read and change **any** variable of `rule`, so you must read all of
  `rule` to understand it;
- it cannot be tested alone.

The guidelines ask for helpers **before** `rule`, at the top level. Then they get
everything as **parameters**, and they are easy to move into a shared library
later (session 9 and the course project).

### Closures

MDN: [Closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures)

An inner function keeps access to the variables of the outer function **even
after the outer function has returned**. The function and the variables it
remembers together are called a **closure**:

```js run
function makeCounter() {
    let count = 0;
    return () => ++count;       // uses count of makeCounter
}

const counter = makeCounter();      // makeCounter has finished...
console.log(counter());     // 1    ...but count is still alive
console.log(counter());     // 2
console.log(counter());     // 3

const other = makeCounter();        // a new call: a new count
console.log(other());       // 1
```

::: info Animation
**Functions are values:** [6. Closure (advanced)](../animations/functionsAsValues.html#6){target="_blank"}
:::

A practical closure: a **function factory**. It takes a setting and returns a
ready test with the setting built in:

```js run
function compareVersions(a, b) {
    const pa = String(a).split(".");
    const pb = String(b).split(".");
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const x = parseInt(pa[i], 10) || 0;
        const y = parseInt(pb[i], 10) || 0;
        if (x !== y) return x < y ? -1 : 1;
    }
    return 0;
}

function olderThan(minimum) {
    return version => compareVersions(version, minimum) < 0;    // remembers minimum
}

const firmwareTooOld = olderThan("2.14");
const levelTooOld = olderThan("4.2.1.0");

console.log(firmwareTooOld("2.10"), firmwareTooOld("2.14"));    // true false
console.log(levelTooOld("4.1.9.9"));                            // true

const encs = doc.inventory.enclosures;
const old = [];
for (const enc of encs) {
    if (firmwareTooOld(enc.firmware)) old.push(enc.id);
}
console.log(old);       // [ 'ENC-02', 'ENC-04' ]
```

### IIFE: run a function at once (advanced)

The only way to run an anonymous function that is not stored anywhere is to call it
right where it is written - an **IIFE** (*Immediately Invoked Function
Expression*):

```text
(function () { ... })();
```

```js run
(function () {
    console.log("I am in nowhere, but I exist and work!");
})();

// with an arrow function
(() => console.log("me too"))();
```

The first pair of brackets turns the function into an **expression** (a statement
that starts with `function` would be a declaration, and a declaration needs a
name). The `()` at the end calls it.

Before modules existed, an IIFE was **the** way to keep variables out of the global
scope: everything declared inside is local to the IIFE. Old libraries are written
like this:

```js run
var myLib = (function () {
    var calls = 0;                      // private: not visible outside
    function versionLabel(v) {
        calls++;
        return "v" + v;
    }
    return { versionLabel: versionLabel, callCount: function () { return calls; } };
})();

console.log(myLib.versionLabel("4.2"));     // v4.2
console.log(myLib.callCount());             // 1
console.log(typeof calls);                  // undefined - it did not leak
```

Today, files that are modules (session 9) have their own scope, and the IIFE is
rarely needed. You still meet it in older code.

::: info Animation
**Variable scope:** [6. IIFE (advanced)](../animations/scopeChain.html#6){target="_blank"};
**Functions are values:** [4. A function returns a function](../animations/functionsAsValues.html#4){target="_blank"} (the IIFE at the end)
:::

### A function that calls itself (advanced)

A function can call **itself** - this is **recursion**. It needs a **base case**:
a condition under which it stops. Each call gets its own frame:

```js run
function factorial(n) {
    if (n <= 1) return 1;               // base case
    return n * factorial(n - 1);        // a smaller problem
}
console.log(factorial(3));              // 6
```

Recursion fits nested data of unknown depth - for example, finding a key at any
level of a report (session 6). Without a base case the stack overflows:
`RangeError: Maximum call stack size exceeded`.

::: info Animation
**The call stack:** [6. Recursion (advanced)](../animations/callStack.html#6){target="_blank"},
[7. Stack overflow (advanced)](../animations/callStack.html#7){target="_blank"}
:::

### A shallow copy (advanced)

A pure helper that must return a changed record often copies it first with the
spread syntax `{ ...enc }` (ES2018; more in session 6). The copy is **shallow**:
a nested array is still shared:

```js run
function withPort(enc, port) {
    const copy = { ...enc };    // a new object with the same properties
    copy.ports.push(port);      // but ports is the SAME array!
    return copy;
}

const enc = { id: "ENC-01", ports: ["P1"] };
const enc2 = withPort(enc, "P2");
console.log(enc.ports);         // [ 'P1', 'P2' ] - the original changed too
console.log(enc2 === enc, enc2.ports === enc.ports);    // false true

// pure: copy the nested array too
function withPortPure(e, port) {
    return { ...e, ports: [...e.ports, port] };
}
const enc3 = withPortPure(enc, "P3");
console.log(enc.ports.length, enc3.ports.length);       // 2 3
```

::: info Animation
**Functions and data:** [7. A shallow copy (advanced)](../animations/functionsAndData.html#7){target="_blank"}
:::

## 12. The structure of a rule

A rule file has a fixed shape. Rule guidelines usually say:

- "If additional functions are required, ensure they are **before** function
  `rule`."
- "Global variables (defined outside functions) must be declared as `const`, not
  `var` / `let`, and your functions must not modify them."
- `function rule(doc) {` - "never change this line": the engine looks for it.

So a rule file reads top-down:

```js
/*
 * CHK-0211 - enclosure firmware below the recommended level.
 * Models XR-210 and XR-220 only. Source of the levels: <link>, checked 2026-10-23.
 */

// 1. fixed settings: const, never changed
const MODELS = ["XR-210", "XR-220"];
const MIN_FIRMWARE = "2.14";

// 2. helpers: small, pure, everything comes in as a parameter
function compareVersions(a, b) { /* ... */ }
function versionBelow(a, b) { /* ... */ }
function deviceName(doc, fallback = "unknown device") { /* ... */ }

// 3. the rule: the steps, in order; the only place with side effects (emit)
function rule(doc) {  // never change this line
    /* ... */
}
```

### Our own `versionBelow`

Lecture 3 showed why versions cannot be compared as strings (`"4.10" < "4.2"` is
`true`). Now we write the helper. First, the requirements - what must it handle?

| Case | Example | Expected |
|---|---|---|
| part by part, as numbers | `"4.10"` vs `"4.2"` | 4.10 is **higher** |
| different number of parts | `"4.2"` vs `"4.2.0.0"` | **equal** |
| a suffix on a part | `"4.2.1.7-B00"` vs `"4.2.1.7"` | equal (the suffix is ignored here) |
| a number instead of a string | `2.14` vs `"2.14"` | equal |
| a missing value | `undefined` vs `"1.0"` | treated as `""`, i.e. `0` - lower |

Many rules write one helper that answers "lower, equal or higher?" with `-1`, `0`
or `1` (in existing rules it is often called `cmpVer`). The yes / no questions are
then one line each:

```js run
function compareVersions(a, b) {
    const pa = String(a ?? "").split(".");
    const pb = String(b ?? "").split(".");
    const n = Math.max(pa.length, pb.length);
    for (let i = 0; i < n; i++) {
        const x = parseInt(pa[i], 10) || 0;     // "7-B00" -> 7, undefined -> 0
        const y = parseInt(pb[i], 10) || 0;
        if (x < y) return -1;
        if (x > y) return 1;
    }
    return 0;
}

function versionBelow(current, minimum) {
    return compareVersions(current, minimum) < 0;
}

function versionAtLeast(current, minimum) {
    return compareVersions(current, minimum) >= 0;
}

// test it on the cases of the table
const cases = [
    ["4.10", "4.2"],
    ["4.2", "4.2.0.0"],
    ["4.2.1.7-B00", "4.2.1.7"],
    [2.14, "2.14"],
    [undefined, "1.0"],
    ["4.2.1.7", "4.2.1.10"]
];
for (const [a, b] of cases) {
    console.log(`${a} vs ${b}: ${compareVersions(a, b)}, below: ${versionBelow(a, b)}`);
}
```

(`for (const [a, b] of cases)` takes the two elements of each inner array - a
short form of `const a = pair[0], b = pair[1];`. Session 6 explains it.)

The suffix (`-B00`), versions like `42107-C00` or `XR420_117`, and other formats
come in session 8. With one shared helper, that fix will be made **once** - not in
every rule.

### Helpers that return text

Existing rules often turn a comparison into a status and an action text, with one
small helper each:

```js run
function compareVersions(a, b) {
    const pa = String(a ?? "").split(".");
    const pb = String(b ?? "").split(".");
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const x = parseInt(pa[i], 10) || 0;
        const y = parseInt(pb[i], 10) || 0;
        if (x !== y) return x < y ? -1 : 1;
    }
    return 0;
}

function versionStatus(current, minimum, recommended) {
    if (compareVersions(current, minimum) < 0) return "Below minimum";
    if (compareVersions(current, recommended) < 0) return "Below recommended";
    return "OK";
}

function actionText(status) {
    if (status === "Below minimum") return "Upgrade as soon as possible.";
    if (status === "Below recommended") return "Plan an upgrade.";
    return "No action required.";
}

for (const level of ["4.1.0.3", "4.2.0.9", "4.2.1.7"]) {
    const status = versionStatus(level, "4.2.0.0", "4.2.1.0");
    console.log(level, "|", status, "|", actionText(status));
}
```

Compare this with lecture 3, where the same logic was an `if / else if` chain and
a `switch` inside the rule. Now each question has a name, and each helper can be
checked alone.

### Splitting a long rule into helpers

When a rule gets long, look for the parts that answer **one question** or produce
**one value**, and give each a name:

1. **Find a block that computes a value** - "the name of the device", "the
   firmware version", "the list of problems". It becomes a helper that
   **returns** that value.
2. **Everything it reads becomes a parameter.** If it reads `doc`, pass `doc` (or
   just the part it needs: `doc.inventory.enclosures`).
3. **Name it by what it returns**: `deviceName(doc)`, `firmwareVersion(doc)`,
   `enclosureProblems(list)`; a yes / no question starts with `is` / `has`:
   `isSupported(model)`.
4. **Do not change the input** - return a new value (section 8).
5. **Test it alone** with a few `console.log` lines (or with `check` in the
   practice files), including the odd cases: missing, empty, wrong type.

The rule at the start of this lecture is the result of this process applied to
the rule of lecture 4.

## 13. Reading existing rules

Here is a rule in the style of many existing rules - helpers nested in `rule`,
`var`, callbacks written as `function (x) { ... }`, and a `try / catch` around
everything. Run it first:

```js run
function emit(id, details) {          // fake: prints instead of creating an alert
    console.log("ALERT for " + id + ": " + JSON.stringify(details));
}

function rule(doc) {  // never change this line

    function cmpVer(a, b) {
        a = (a === undefined || a === null) ? "" : String(a);
        b = (b === undefined || b === null) ? "" : String(b);

        var as = a.split(".").map(function (x) { return parseInt(x, 10) || 0; });
        var bs = b.split(".").map(function (x) { return parseInt(x, 10) || 0; });

        var n = Math.max(as.length, bs.length);
        for (var i = 0; i < n; i++) {
            var ai = (i < as.length) ? as[i] : 0;
            var bi = (i < bs.length) ? bs[i] : 0;
            if (ai < bi) return -1;
            if (ai > bi) return 1;
        }
        return 0;
    }

    function getLowestFirmware(list, type) {
        var lowest;
        for (var i = 0; i < list.length; i++) {
            var e = list[i] || {};
            if (e.type !== type) continue;
            if (e.state && e.state !== "normal") continue;
            if (lowest === undefined || cmpVer(e.firmware, lowest) < 0) lowest = e.firmware;
        }
        return lowest;
    }

    try {
        var model = doc.overview.model;
        if (!model || String(model).indexOf("XR-2") !== 0) return;

        var expected = "2.14";
        var lowest = getLowestFirmware(doc.inventory.enclosures, "SSD-24");

        if (lowest !== undefined && cmpVer(lowest, expected) < 0) {
            var output = new Object();
            output["Device"] = doc.inventory.extended_info.json.data.system.name;
            output["Model"] = model;
            output["Level"] = doc.inventory.details.firmware_level;
            output["SSD-24 firmware"] = lowest + " (expected >= " + expected + ")";
            emit(doc.status.device_alias, { "check": "CHK-0211", "details": [output] });
        }
    } catch (err) {
        return;
    }
}

console.log("example JSON document:");
rule(doc);

console.log("a second report:");
rule({
    overview: { model: "XR-220" },
    status: { device_alias: "LAB-DEV-05" },
    inventory: {
        details: { firmware_level: "4.2.1.7" },
        enclosures: [{ id: "ENC-01", type: "SSD-24", firmware: "2.10", state: "normal" }]
    }
});
console.log("(end)");
```

**Check yourself:**

1. Which functions are there, and where can each one be called from?
2. The engine calls this rule for 1000 reports. How many times is `cmpVer`
   created? Can another rule use it?
3. The second report has an SSD-24 enclosure with firmware `2.10` - below `2.14`.
   Why is there **no alert** for `LAB-DEV-05`?
4. In `getLowestFirmware`, what does `list[i] || {}` protect against? And
   `if (e.state && e.state !== "normal") continue;` - which enclosures does it
   skip, and which does it keep?
5. `cmpVer` changes its parameters `a` and `b` (`a = ... String(a)`). Does that
   change anything for the caller? Is `cmpVer` pure?

::: details Answer
1. `rule` (global - the engine calls it), `cmpVer` and `getLowestFirmware` (local
   to `rule` - only `rule` and the functions inside it can call them), and two
   anonymous callbacks passed to `map`.
2. 1000 times - a new `cmpVer` on every call of `rule`. That costs little, but no
   other rule can use it: each rule has its own copy (and its own bugs).
3. The report has no `extended_info`, so
   `doc.inventory.extended_info.json` throws a `TypeError`. The `catch` catches
   it and returns **silently**. A real problem is missed, and nobody sees an
   error. (Session 9 is about errors; the fix here is `?.` and a fallback name.)
4. `list[i] || {}`: an element that is `null` or `undefined` - `e.type` would
   throw. The `state` line skips enclosures whose state is set and is not
   `"normal"`; it **keeps** those without a state (`undefined` is falsy, so the
   `continue` does not run).
5. No: `a` and `b` are strings (primitives), the parameters are local copies.
   `cmpVer` is pure - it only reads its arguments and returns a number.
:::

### Modernising it, step by step

Change one thing at a time, and run the rule after each step - the alerts must
stay the same (except for real bug fixes, which you make on purpose).

**Step 1. Move the helpers out of `rule`.** They already get everything as
parameters, so they can move as they are. Now they are created once, and can be
copied into a shared library.

**Step 2. `var` -> `const` / `let`.** `const` for everything that is not assigned
again; `let` for loop counters and for values that change (`lowest`).

**Step 3. Callbacks -> arrow functions, and simpler checks.**
`function (x) { return parseInt(x, 10) || 0; }` becomes
`x => parseInt(x, 10) || 0`. `(a === undefined || a === null) ? "" : String(a)`
becomes `String(a ?? "")`.

**Step 4. Modern forms for the rest.** `indexOf("XR-2") !== 0` means "does not
start with" - `!model.startsWith("XR-2")` (session 8). `new Object()` plus
`output["..."] = ...` becomes an object literal. The long path gets `?.` and a
fallback, in its own helper.

**Step 5. The catch-all `try / catch`.** Replace it with guard clauses for the data
that can be missing. The `try` hid the missing `extended_info` - now the rule
checks what it needs and **still** reports the device.

The result:

```js run
function emit(id, details) {
    console.log("ALERT for " + id + ": " + JSON.stringify(details));
}

const EXPECTED_FIRMWARE = "2.14";

function compareVersions(a, b) {
    const pa = String(a ?? "").split(".").map(x => parseInt(x, 10) || 0);
    const pb = String(b ?? "").split(".").map(x => parseInt(x, 10) || 0);
    const n = Math.max(pa.length, pb.length);
    for (let i = 0; i < n; i++) {
        const x = pa[i] ?? 0;
        const y = pb[i] ?? 0;
        if (x !== y) return x < y ? -1 : 1;
    }
    return 0;
}

function lowestFirmware(list, type) {
    let lowest;
    for (const e of list) {
        if (!e || e.type !== type) continue;
        if (e.state && e.state !== "normal") continue;
        if (lowest === undefined || compareVersions(e.firmware, lowest) < 0) lowest = e.firmware;
    }
    return lowest;
}

function deviceName(doc) {
    return doc.inventory?.extended_info?.json?.data?.system?.name
        ?? doc.status?.device_alias
        ?? "unknown device";
}

function rule(doc) {  // never change this line
    const model = doc.overview?.model;
    if (typeof model !== "string" || !model.startsWith("XR-2")) return;

    const enclosures = doc.inventory?.enclosures;
    if (!Array.isArray(enclosures)) return;

    const lowest = lowestFirmware(enclosures, "SSD-24");
    if (lowest === undefined || compareVersions(lowest, EXPECTED_FIRMWARE) >= 0) return;

    emit(doc.status?.device_alias, {
        "check": "CHK-0211",
        "details": [{
            "Device": deviceName(doc),
            "Model": model,
            "Level": doc.inventory.details?.firmware_level ?? "",
            "SSD-24 firmware": `${lowest} (expected >= ${EXPECTED_FIRMWARE})`
        }]
    });
}

console.log("example JSON document:");
rule(doc);

console.log("a second report:");
rule({
    overview: { model: "XR-220" },
    status: { device_alias: "LAB-DEV-05" },
    inventory: {
        details: { firmware_level: "4.2.1.7" },
        enclosures: [{ id: "ENC-01", type: "SSD-24", firmware: "2.10", state: "normal" }]
    }
});
console.log("(end)");
```

Now the second report gets its alert, with `LAB-DEV-05` as the device name.

**Check yourself:**

1. In the modern rule, `if (lowest === undefined || compareVersions(...) >= 0) return;`
   replaces `if (lowest !== undefined && cmpVer(...) < 0) { ... }`. Why are they
   the same condition, turned around? (Lecture 3: De Morgan.)
2. Which of the new functions are pure?
3. The modern rule has one global, `EXPECTED_FIRMWARE`. Why is it `const`, and
   why is it outside `rule`?

::: details Answer
1. "Stop if not (A and B)" is "stop if (not A) or (not B)": not
   `lowest !== undefined` is `lowest === undefined`, and not `< 0` is `>= 0`. The
   guard clause stops early, so the alert code is not nested in an `if`.
2. `compareVersions`, `lowestFirmware` and `deviceName` - they only read their
   arguments and return a value. `rule` is not: it calls `emit` (that is its job).
3. It is a fixed setting of the rule - it never changes, so `const`, as the
   guidelines ask. At the top it is easy to find and to update when a new level
   is recommended, without reading the code of `rule`.
:::

## 14. Practice

In your copy of the Homework repository, first get the new tasks:

```bash
git pull --no-rebase --no-edit upstream main
node 05-functions/practice/task1-predict.js
```

Each file is split into parts. A part has its description, then the `your code`
lines - write your code between them - and right after them its checks, which
print `OK` or `FAIL`.

| Task | File | What you do |
|------|------|-------------|
| 1 | `task1-predict.js` | Predict 20 results: scope, shadowing, defaults, `return`, hoisting, arrow functions |
| 2 | `task2-versions.js` | `compareVersions`, `versionBelow` and `versionStatus` - with all the odd cases |
| 3 | `task3-helpers.js` | Small pure helpers: `asList`, `capitalize`, `lastPart`, `deviceName` with a default |
| 4 | `task4-callbacks.js` | `customMap`, `customFilter`, `countIf`, `compose` - and use them with arrow functions on the enclosures |
| 5 | `task5-classic-functions.js` | Classic tasks as functions: area, sums, largest even number, best score, a table |

## Summary

| Topic | Remember |
|-------|----------|
| Function | A named sequence of actions; defined once, called many times; `f` is the function, `f()` calls it |
| Declaration / expression | `function f() {}` (hoisted) / `const f = function () {};` (ends with `;`) |
| Parameters | Local variables, filled **by position**; missing -> `undefined`, extra -> ignored; `...rest` for any number |
| Defaults | `function f(x = 1)` - only for `undefined`; `x = x \|\| 1` also replaces `0`, `""`, `false`, `null` |
| `return` | Ends the function and gives the value; no `return` -> `undefined`; keep the value on the same line |
| Scope | Global, function, block (`let` / `const`); inner functions see outer variables, not the other way |
| `var` | Function-scoped, can be declared again, hoisted as `undefined` - read it, write `let` / `const` |
| Hoisting | Declarations are known from the start of their scope; function declarations can be called early |
| Arguments | Primitives are copied; arrays and objects are shared - do not change `doc` |
| Pure function | Result depends only on the arguments; changes nothing outside |
| Callback | A function passed to a function: `countIf(list, enc => ...)`; `f` not `f()` |
| Arrow function | `x => expr` returns `expr`; with `{ }` you need `return`; `({ ... })` for an object |
| Closure | An inner function keeps the variables of the outer one alive |
| Rule file | Header comment, `const` settings, pure helpers, then `function rule(doc)` |
| Old style | Helpers inside `rule`, `var`, `function (x) { return ...; }`, catch-all `try / catch` - read it, modernise step by step |

## Homework

1. `05-functions/homework.js` (in the homework repository): the best version of a
   module in a report, a function factory for version checks, and an older rule
   split into helpers - with the same alerts.
2. The practice tasks you did not finish in class - recommended, as later tasks
   and the course project reuse them. Every check must print `OK`.
3. Optional: take one of your own rules. List its functions: where is each
   defined, what does it get, what does it return, is it pure? Is there a helper
   that other rules have a copy of? Which one would you move into a shared
   library first?

## Read more

- MDN: [Functions (guide)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions),
  [Arrow function expressions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions),
  [Default parameters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Default_parameters),
  [Rest parameters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters),
  [Closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures),
  [Hoisting](https://developer.mozilla.org/en-US/docs/Glossary/Hoisting),
  [Strict mode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode)
- javascript.info: [Functions](https://javascript.info/function-basics),
  [Function expressions](https://javascript.info/function-expressions),
  [Arrow functions, the basics](https://javascript.info/arrow-functions-basics),
  [Variable scope, closure](https://javascript.info/closure),
  [The old "var"](https://javascript.info/var)
- Eloquent JavaScript (4th edition): [Functions](https://eloquentjavascript.net/03_functions.html),
  [Higher-order functions](https://eloquentjavascript.net/05_higher_order.html)
- W3Schools: [Function definitions](https://www.w3schools.com/js/js_function_definition.asp)
- Videos: [Learn JavaScript ARROW FUNCTIONS in 8 minutes](https://www.youtube.com/watch?v=fRRRkognpOs),
  [How to use Arrow Functions](https://www.youtube.com/watch?v=Oy185MF8pnY)

**Next session:** objects. Deep paths and keys with dots, dictionaries keyed by
ids, the same data as an array in one report and as an object in another - and
your first version of `get(doc, path, fallback)` for the course project.
