---
title: 3. Comparisons, logic, conditions and loops
---

# 3. Comparisons, logic, conditions and loops

<div class="lecture-meta">
  <span>Session 3</span><span>practice: <code>03-conditions-and-loops/</code> in the homework repository</span>
  <span><a href="../example-document"><code>doc</code>: the example JSON document</a></span>
</div>

**Today you will learn to:**

- compare values with `===`, `!==`, `<`, `>=` ... and avoid the traps of `==`;
- understand why `"4.10" < "4.2"` is `true`, and what that means for versions;
- combine conditions with `&&`, `||` and `!`;
- know which values are *truthy* and *falsy*, and give defaults with `||` and `??`;
- make decisions with `if` / `else`, `switch` and the ternary operator `? :`;
- stop a rule early when data is missing (a *guard clause*);
- repeat work with `for`, `while` and `do...while`, and control loops with
  `break` and `continue`;
- read existing rules written in an older style (`var`, `==`, `== false`).

Where this fits in the sample check rule - after today you can read and write all
of it. Every part uses one of today's topics - the number in the comment is the
section of this lecture:

```js
function rule(doc) {
    // 6. guard clauses: stop early when data is missing
    if (!doc.overview || !doc.inventory) return;

    // 1, 3. ===, &&, ||, ! - "is it one of our two models?"
    const model = doc.overview.model;
    if (model !== "XR-210" && model !== "XR-220") return;

    // 5. defaults: || also replaces an empty name, ?? only a missing value
    const name = doc.inventory.extended_info?.json?.data?.system?.name
                 || doc.status.device_alias;
    const level = doc.inventory.details.firmware_level ?? "";

    // 10. a loop with break: the version is the text before the first space
    let version = "";
    for (const ch of level) {
        if (ch === " ") break;
        version += ch;
    }
    if (version === "") return;

    // 2, 6. versions are compared part by part; the strictest condition first
    let status;
    if (versionBelow(version, "4.2.0.0")) {
        status = "Below minimum";
    } else if (versionBelow(version, "4.2.1.7")) {
        status = "Below recommended";
    } else {
        return;                                   // OK - no alert
    }

    // 7. switch: one value, several fixed answers
    let action;
    switch (status) {
        case "Below minimum":
            action = "Upgrade as soon as possible.";
            break;
        case "Below recommended":
            action = "Plan an upgrade.";
            break;
    }

    // 4, 8. "no" is truthy, so compare; the ternary returns a value
    const login = doc.inventory.details.remote_login_enabled === "yes" ? "on" : "off";

    emit(name, { "Model": model, "Version": version, "Status": status,
                 "Action": action, "Remote login": login });
}
```

- `versionBelow(a, b)` is a ready-made helper for now - we write our own in
  session 5.
- `?.` (optional chaining) is a preview: it stops at a missing level instead of
  throwing an error. More in section 5 and in session 6.

Almost every rule is a chain of decisions like these: "is the data there?", "is
it the right model?", "is the firmware too old?". Getting the conditions exactly
right is the most important skill in rule writing.

## 1. Comparison operators

A comparison asks a question about two values. The answer is **always a boolean**:
`true` or `false`.

| Operator | Meaning | Example | Result |
|----------|---------|---------|--------|
| `===` | strictly equal (same type and value) | `5 === 5` | `true` |
| `!==` | strictly not equal | `5 !== "5"` | `true` |
| `==` | loosely equal (converts types first) | `5 == "5"` | `true` |
| `!=` | loosely not equal | `5 != 3` | `true` |
| `>` | greater than | `10 > 5` | `true` |
| `<` | less than | `3 < 5` | `true` |
| `>=` | greater than or equal | `5 >= 5` | `true` |
| `<=` | less than or equal | `4 <= 5` | `true` |

```js run
console.log(2 == 2);        // true
console.log(2 == "2");      // true  - the string is converted to a number
console.log(2 === "2");     // false - different types, no conversion

// booleans are converted to numbers: true is 1, false is 0
console.log(true == 1);     // true
console.log(false == 0);    // true
console.log(true > false);  // true

const model = doc.overview.model;
console.log(model === "XR-220");    // true
console.log(model !== "XR-210");    // true
```

### `===` vs `==`

MDN: [Strict equality (===)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Strict_equality), [Equality (==)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Equality)

`==` first **converts** the two values to the same type, then compares. The
conversion rules are long and surprising:

```js run
console.log("" == 0);           // true  - "" becomes 0
console.log("0" == false);      // true  - both become 0
console.log("no" == false);     // false - "no" becomes NaN, false becomes 0
console.log(" \n " == 0);       // true  - a string of spaces becomes 0
console.log(null == 0);         // false
console.log(null > 0);          // false
console.log(null >= 0);         // true  - but >= converts null to 0!
```

::: tip Use `===` and `!==`
They never convert. What you see is what is compared. All comparisons in the
course use `===` / `!==`. The one `==` worth knowing is below.
:::

::: info Animation
**Types, comparisons and logic:** [3. `==` and `===`](../animations/coercionAndLogic.html#3){target="_blank"}
:::

### The one useful `==`: `null` and `undefined`

`null == undefined` is `true`, and `null` / `undefined` are not loosely equal to
anything else. So `value == null` means "`value` is `null` **or** `undefined`":

```js run
let value;                                   // undefined
console.log(value === undefined || value === null);   // true - the long way
console.log(value == null);                           // true - the short way

value = 0;
console.log(value == null);                           // false - 0 is a real value
```

You will see both forms in existing rules, and both are correct. In new code,
choose one form and use it everywhere.

### `NaN` is not equal to anything

```js run
const slots = Number("abc");
console.log(slots);                 // NaN
console.log(slots === NaN);         // false - even NaN !== NaN
console.log(Number.isNaN(slots));   // true  - the right check
```

### Comparing decimals

```js run
console.log(0.1 + 0.2 === 0.3);                 // false (see session 2)
console.log(Math.abs(0.1 + 0.2 - 0.3) < 1e-9);  // true  - "close enough"
// Math.abs(n) is n without its sign: the distance between the two numbers
```

::: info Objects are compared by reference
`{} === {}` and `[] === []` are `false`: two objects are equal only if they are
**the same object**. More in session 6.
:::

::: info Animations
**Numbers in memory:** [4. 0.1 + 0.2](../animations/numbersInMemory.html#4){target="_blank"}, [6. NaN and Infinity](../animations/numbersInMemory.html#6){target="_blank"}
:::

## 2. Comparing strings

Two strings are compared **character by character**, by the character codes
(Unicode). This is called *lexicographic* order - like in a dictionary:

```js run
console.log("b" > "azzzz");     // true - "b" > "a", the rest does not matter
console.log("a" > "A");         // true - lowercase letters have bigger codes
console.log("Z" < "a");         // true - all uppercase letters come first
console.log("1" < "11");        // true - "1" is a prefix of "11"
console.log("2" > "19999");     // true - "2" > "1"
console.log("1199" > "12");     // false - "11" < "12"
console.log("1" == "12");       // false
```

If one string is a prefix of the other, the shorter one is smaller.

### Why `"4.10" < "4.2"` is `true`

Versions are strings. Compared as strings, they give **wrong** answers:

```js run
console.log("4.10" < "4.2");       // true  - "1" < "2" at position 2
console.log("10.1.0" < "9.0.0");   // true  - "1" < "9" at position 0
console.log("4.2.1.7" < "4.2.1.10");   // false - "7" > "1"
```

A version must be compared **part by part, as numbers**: 4 = 4, then 10 > 2. We
write such a helper, `versionBelow(a, b)`, in session 5. Until then the practice
tasks give it to you ready-made.

::: warning Mixed types
When one side is a number, the string is converted to a number:
`"10" > 9` is `true`, but `"10" > "9"` is `false`. And `"abc" < 5` and `"abc" >= 5`
are both `false` (`NaN`). Convert first, then compare.
:::

### Upper and lower case

`===` is case-sensitive. JSON values are not always written the same way, so
compare in one case. `toLowerCase()` gives the same text in lower case (more
string methods in session 8):

```js run
const raised = "Yes";
console.log(raised === "yes");                  // false
console.log(raised.toLowerCase() === "yes");    // true
```

::: tip Natural order (preview)
`"4.10".localeCompare("4.2", undefined, { numeric: true })` gives `1` (bigger),
because it reads digit groups as numbers. Useful for sorting (session 7), but our
version formats vary too much (`4.2.1.7-B00`, `42107-C00`), so for rules we write
our own comparison.
:::

::: info Animation
**Types, comparisons and logic:** [4. Comparing strings](../animations/coercionAndLogic.html#4){target="_blank"}
:::

## 3. Logical operators

MDN: [Logical AND (&&)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Logical_AND), [Logical OR (||)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Logical_OR), [Logical NOT (!)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Logical_NOT)

Logical operators combine conditions:

| Operator | Name | `true` when |
|----------|------|-------------|
| `a && b` | AND | both are true |
| `a \|\| b` | OR | at least one is true |
| `!a` | NOT | `a` is false |

The truth table (T - true, F - false):

| `a` | `b` | `a && b` | `a \|\| b` | `!a` |
|-----|-----|----------|------------|------|
| T | T | T | T | F |
| T | F | F | T | F |
| F | T | F | T | T |
| F | F | F | F | T |

`&&` and `||` take two operands; `!` takes one (it is *unary*).

```js run
console.log(true && false);    // false
console.log(true || false);    // true
console.log(!true);            // false

const userAge = 19;
const userCountry = "BG";
console.log(userAge >= 18 && userCountry === "UK");   // false (true && false)

// the same with the report
const model = doc.overview.model;
const enabled = doc.inventory.details.remote_login_enabled;

console.log(model === "XR-220" && enabled === "yes");          // true
console.log(model === "XR-210" || model === "XR-220");         // true
console.log(!(model === "XR-210" || model === "XR-220"));      // false
```

### Precedence and parentheses

MDN: [Operator precedence](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_precedence)

`!` is applied first, then `&&`, then `||` - like `*` before `+`:

```js run
const a = true, b = false, c = false;
console.log(a || b && c);      // true  - same as a || (b && c)
console.log((a || b) && c);    // false
```

When a condition mixes `&&` and `||`, **always** add parentheses - for the reader,
not only for JavaScript:

```js
if (env === "hw" || (platform === "virtual" && version !== "")) { ... }
```

### Turning a condition around (De Morgan)

To write "**not** (A and B)", flip each part and change `&&` to `||`:

| This | is the same as |
|------|----------------|
| `!(a && b)` | `!a \|\| !b` |
| `!(a \|\| b)` | `!a && !b` |

You need this for guard clauses (section 6): "stop if the model is neither XR-210
nor XR-220" is `if (model !== "XR-210" && model !== "XR-220") return;`.

## 4. Truthy and falsy

MDN: [Truthy](https://developer.mozilla.org/en-US/docs/Glossary/Truthy), [Falsy](https://developer.mozilla.org/en-US/docs/Glossary/Falsy)

`if (...)`, `!`, `&&` and `||` accept **any** value, not only booleans. The value
is then treated as `true` or `false`. These eight values are **falsy**:

| Type | Falsy values |
|------|--------------|
| boolean | `false` |
| number | `0`, `-0`, `NaN` (and `0n`, a bigint) |
| string | `""` (the empty string) |
| - | `undefined`, `null` |

**Everything else is truthy** - including `"0"`, `"false"`, `"no"`, `" "`, `[]`
and `{}`.

```js run
console.log(Boolean(""));        // false
console.log(Boolean("0"));       // true  - a non-empty string
console.log(Boolean("no"));      // true
console.log(Boolean(0));         // false
console.log(Boolean(NaN));       // false
console.log(Boolean({}));        // true
console.log(!!"text");           // true - !! is a short way to write Boolean()
```

::: danger `"no"` is truthy
The report stores yes / no settings as text: `"remote_login_enabled": "yes"`,
`"remote_login_pwd_set": "no"`. `if (doc.inventory.details.remote_login_pwd_set)`
is true for `"no"` too - every non-empty string is truthy. Compare with the
value you mean: `=== "yes"`.
:::

```js run
const enabled = "no";
if (enabled) {
    console.log("this runs - wrong!");
}
if (enabled === "yes") {
    console.log("this does not run - right");
}
```

Truthy checks are good for one question: "is there a value at all?"
`if (doc.overview)` means "the document has an `overview` part".

### Comparing with `true` / `false`

Existing rules often contain lines like `if (present == false)` or
`if (list.includes(x) !== true)` (`includes` on arrays comes in session 4). They
work when the value is a real boolean, but `== false` converts: it also matches
`0`, `""` and even `"0"` - which is truthy!

```js run
console.log(Boolean("0"));       // true  - "0" is truthy
console.log("0" == false);       // true  - but == false matches it
console.log(null == false);      // false - and does NOT match null
console.log(!null);              // true
```

Write it shorter and safer:

| Instead of | Write |
|------------|-------|
| `if (present == false)` | `if (!present)` or `if (present === false)` |
| `if (isAffected == true)` | `if (isAffected)` |
| `if (list.includes(x) !== true)` | `if (!list.includes(x))` |

When you modernise a rule, check what the value can be. `!present` is also true
for `null` and `undefined`, `present == false` is not. Usually `!present` is what
the rule meant ("not there or not set"), but it is a change.

::: info Animation
**Types, comparisons and logic:** [5. Truthy and falsy](../animations/coercionAndLogic.html#5){target="_blank"}
:::

## 5. Short-circuit evaluation and defaults

`&&` and `||` stop as soon as the answer is known - this is called
**short-circuit evaluation**. And they do not return `true` / `false`, but **one of
the two operands**:

| Expression | Returns |
|------------|---------|
| `a \|\| b` | `a` if `a` is truthy, otherwise `b` |
| `a && b` | `a` if `a` is falsy, otherwise `b` |

```js run
console.log("XR-220" || "Unknown");   // XR-220
console.log("" || "Unknown");         // Unknown
console.log(undefined || "Unknown");  // Unknown

console.log("XR-220" && "OK");        // OK
console.log(null && "OK");            // null

let userName;
console.log(userName || "Anonymous"); // Anonymous
```

### `||` for defaults

The sample rule uses `||` for a **fallback**: if the system name is missing or
empty, use the device alias:

```js run
const name = doc.inventory.extended_info?.json?.data?.system?.name
             || doc.status.device_alias;
console.log(name);                   // LAB-DEV-01

const noName = "" || doc.status.device_alias;
console.log(noName);                 // the alias
```

Existing rules use it all the time:

```js
var current = String(version || "");      // never undefined, always a string
var count = parseInt(text, 10) || 0;      // NaN becomes 0
var customer = String(alias || "Unknown");
```

### `&&` as a guard

The right side runs **only** if the left side is truthy. Older rules use it to
check every level of a path before reading the next one:

```js run
const report = { overview: { model: "XR-220" } };

console.log(report.overview && report.overview.model);    // XR-220
console.log(report.status && report.status.device_alias); // undefined - no error

// the modern form (ES2020), more in session 6:
console.log(report.status?.device_alias);                 // undefined
```

### The trap: `||` replaces `0` and `""` too

`||` replaces **every** falsy value. Sometimes `0`, `""` or `false` is a real
answer:

```js run
const failedDrives = 0;
console.log(failedDrives || "Not reported");   // Not reported - wrong!
console.log(failedDrives ?? "Not reported");   // 0 - right
```

### `??` - the nullish coalescing operator (ES2020)

MDN: [Nullish coalescing operator (??)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing)

`a ?? b` returns `b` **only** when `a` is `null` or `undefined`:

| `a` | `a \|\| "x"` | `a ?? "x"` |
|-----|--------------|------------|
| `undefined` | `"x"` | `"x"` |
| `null` | `"x"` | `"x"` |
| `""` | `"x"` | `""` |
| `0` | `"x"` | `0` |
| `false` | `"x"` | `false` |
| `"no"` | `"no"` | `"no"` |

- Use `??` when `0`, `""` or `false` are valid values.
- Use `||` when an empty value should also get the default.

::: warning
`a || b ?? c` is a syntax error. Mixing `??` with `||` or `&&` needs parentheses:
`(a || b) ?? c`.
:::

### Logical assignment (ES2021)

MDN: [Logical OR assignment (||=)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Logical_OR_assignment), [Nullish coalescing assignment (??=)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing_assignment)

```js run
let status;
status ??= "Not reported";     // status = status ?? "Not reported"
console.log(status);

let name = "";
name ||= "Unknown";            // name = name || "Unknown"
console.log(name);
```

::: info ES2021+
Check that your rule engine supports `??=`, `||=` and `&&=` before you use them in a
rule. `??` itself is ES2020, like `?.`.
:::

::: info Animation
**Types, comparisons and logic:** [6. Short-circuit: `&&` and `||`](../animations/coercionAndLogic.html#6){target="_blank"}
:::

## 6. Conditional statements

MDN: [if...else](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/if...else)

### `if`

```js
if (condition) {
    // runs only if condition is truthy
}
```

```js run
const age = 19;
let status = "unknown";
if (age > 18) {
    status = "adult";
}
console.log(status);

const version = doc.overview.version;
if (version === "4.2.1.7") {
    console.log("exactly the recommended level");
}
```

### `if...else`

```js
if (condition) {
    // runs if condition is truthy
} else {
    // runs otherwise
}
```

```js run
const x = 5;
if (x % 2) {                 // 1 is truthy, 0 is falsy
    console.log("Odd");
} else {
    console.log("Even");
}

const enabled = doc.inventory.details.remote_login_enabled;
if (enabled === "yes") {
    console.log("remote login is on");
} else {
    console.log("remote login is off");
}
```

`x % 2` works, but `x % 2 !== 0` says what we mean. Prefer explicit conditions.
(Not `x % 2 === 1`: for negative numbers `-3 % 2` is `-1`.)

### `if...else if...else`

```js
if (condition1) {
    // condition1 is true
} else if (condition2) {
    // condition1 is false, condition2 is true
} else {
    // none of the above
}
```

- It always starts with `if`.
- Then zero or more `else if` blocks.
- `else` comes last. It is optional, but usually a good idea: it catches the case
  you did not think of.
- Only the **first** matching block runs.

**Find the bug** - the code is valid JavaScript, but it gives wrong answers:

```js run
const age = 25;
let status;
if (age > 12) {
    status = "teen";
} else if (age > 18) {
    status = "adult";
} else {
    status = "child";
}
console.log(status);
```

::: details Answer
The order. 25 is `> 12`, so the first block runs and `"adult"` is never reached.
Check the **strictest** condition first: `age > 18`, then `age > 12`.
:::

The same matters for firmware levels. A level below the minimum is also below the
recommended level, so the minimum is checked first:

```js run
// a ready-made helper for today - compares part by part, as numbers.
// You will understand how it works in sessions 4-5.
function versionBelow(a, b) {
    const pa = String(a).split(".").map(Number);
    const pb = String(b).split(".").map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const x = pa[i] || 0;
        const y = pb[i] || 0;
        if (x !== y) return x < y;
    }
    return false;
}

const current = "4.1.9.3";
const minimum = "4.2.0.0";
const recommended = "4.2.1.7";

let status;
if (versionBelow(current, minimum)) {
    status = "Below minimum";
} else if (versionBelow(current, recommended)) {
    status = "Below recommended";
} else {
    status = "OK";
}
console.log(status);
```

Change `current` to `"4.2.0.5"` and `"4.10.0.0"` and run again.

::: info Animation
**Loops step by step:** [1. `if` / `else if`](../animations/loopsStepByStep.html#1){target="_blank"}
:::

### Two conditions, four answers

A common case: two yes / no facts give four messages. Check "both" first:

```js run
const hasTimeServer = doc.inventory.details.ntp_ip_address !== "";
const hasBandwidth = doc.inventory.details.bandwidth !== "";

let message;
if (hasTimeServer && hasBandwidth) {
    message = "time server and bandwidth reported";
} else if (hasTimeServer) {
    message = "time server reported / bandwidth not reported";
} else if (hasBandwidth) {
    message = "bandwidth reported / time server not reported";
} else {
    message = "time server and bandwidth not reported";
}
console.log(message);
```

::: warning A missing key is not `""`
If the report has no `ntp_ip_address` key at all, the value is `undefined`, and
`undefined !== ""` is `true` - the code above says "reported". Think about which
values mean "not reported" (`undefined`, `null`, `""`?) and check all of them.
The homework asks exactly this.
:::

### Blocks and braces

`{ }` groups statements into a **block**. With one statement the braces may be
left out, and you will see that in rules:

```js
if (!doc) return;
if (version === "") return;
```

That is fine for a short `return` on the same line. Everywhere else, write the
braces - adding a second line later without them is a classic bug:

```js
if (isAffected)
    console.log("affected");
    emit(alias, details);      // NOT part of the if - always runs!
```

### Guard clauses: stop early

A rule does nothing for most documents. Instead of nesting `if` inside `if`,
check what is **wrong** first and `return` (stop the rule) right away:

```js
// nested - the real work is deep inside
function rule(doc) {
    if (doc.overview) {
        if (doc.overview.model === "XR-220") {
            if (doc.overview.version !== "") {
                // ... the real work
            }
        }
    }
}

// guard clauses - flat and easy to read
function rule(doc) {
    if (!doc.overview) return;
    if (doc.overview.model !== "XR-220") return;
    if (doc.overview.version === "") return;

    // ... the real work
}
```

`return` ends the function. Functions come in session 5 - for now, read
`return` in a rule as "stop here, no alert".

```js run
function emit(id, details) {          // a fake emit, to see the result here
    console.log("ALERT for " + id + ": " + JSON.stringify(details));
}

function rule(doc) {
    if (!doc || !doc.overview) return;

    const model = doc.overview.model;
    if (model !== "XR-210" && model !== "XR-220") return;

    const enabled = doc.inventory.details.remote_login_enabled;
    if (enabled !== "yes") return;

    emit(doc.status.device_alias, { model: model, check: "remote login enabled" });
}

rule(doc);                          // the example JSON document: an alert
rule({ overview: { model: "XR-100" } });   // other model: nothing
rule({});                           // no overview: nothing, and no error
```

## 7. `switch`

MDN: [switch](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/switch)

`switch` compares **one value** with several fixed values. It is an alternative to
a long `if...else if` chain of `===` checks:

```js run
const fruit = "apple";
switch (fruit) {
    case "apple":
        console.log("Apple is red.");
        break;
    case "banana":
        console.log("Banana is yellow.");
        break;
    default:
        console.log("Unknown fruit.");
}
```

- The value is compared with each `case` using `===` (strict).
- At a match, the code runs **until a `break`**.
- `default` runs when no `case` matches. Write it last.

```js run
const loginType = doc.inventory.details.remote_login_type;
let description;

switch (loginType) {
    case "central":
    case "domain":                   // two cases, one block
        description = "central user accounts";
        break;
    case "local":
        description = "local users only";
        break;
    case "":
    case "none":
        description = "no remote login";
        break;
    default:
        description = "unknown type: " + loginType;
}
console.log(description);
```

::: warning Forgotten `break`
Without `break`, the code "falls through" into the next case:

```js run
const status = "Below minimum";
switch (status) {
    case "Below minimum":
        console.log("Upgrade as soon as possible.");
        // no break!
    case "Below recommended":
        console.log("Plan an upgrade.");
        break;
    default:
        console.log("No action required.");
}
```
:::

::: info `switch` is strict
`switch ("1") { case 1: ... }` does **not** match: `"1" === 1` is false. Convert
the JSON string first: `switch (Number(count))`.
:::

::: info Animation
**Loops step by step:** [7. `switch` without `break` (advanced)](../animations/loopsStepByStep.html#7){target="_blank"}
:::

## 8. The conditional (ternary) operator

MDN: [Conditional (ternary) operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Conditional_operator)

```js
condition ? valueIfTrue : valueIfFalse
```

The only operator with three operands. Unlike `if`, it **returns a value**, so it
can be assigned, passed or put into a template string. These two are the same:

```js run
let x = 42;
let numType = x % 2 === 0 ? "even" : "odd";
console.log(numType);

let numType2;
if (x % 2 === 0) {
    numType2 = "even";
} else {
    numType2 = "odd";
}
console.log(numType2);
```

With the report:

```js run
const env = "hw";
const recommended = env === "hw" ? "4.2.1.7" : "4.1.0.0";
console.log(recommended);

const enabled = doc.inventory.details.remote_login_enabled === "yes";
console.log(`remote login: ${enabled ? "on" : "off"}`);
```

::: tip One ternary is fine, two are too many
`a ? b : c ? d : e` is valid, but hard to read. Use `if...else if` instead.
:::

::: info Animation
**Types, comparisons and logic:** [7. Ternary operator (advanced)](../animations/coercionAndLogic.html#7){target="_blank"}
:::

## 9. Statements and expressions

MDN: [Statements and declarations](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements), [Expressions and operators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators)

JavaScript code is made of two kinds of pieces:

- An **expression produces a value**. It can stand wherever a value is
  expected.
- A **statement does something, but has no value**. Like declarations, `if`,
  `switch`, `return`, and the loops of the next section (`for`, `while`).

```js
let x, y;                 // statement (declaration)
if (x) { x = 0; }         // statement
switch (x) { }            // statement

2 + 3;                    // expression: 5
x = 5;                    // expression: assignment has a value too (5)
x ** 6 - x;               // expression
x = y = 5;                // (y = 5) is an expression, its value 5 goes into x
model === "XR-220";       // expression: true or false
enabled ? "on" : "off";   // expression
```

This is why the ternary works inside a template string and `if` does not:

```js run
const enabled = true;
console.log(`auth: ${enabled ? "on" : "off"}`);     // fine
// console.log(`auth: ${if (enabled) {"on"}}`);     // syntax error
```

::: info Animation
**How an expression is evaluated:** [6. Statement vs expression (advanced)](../animations/expressionEvaluation.html#6){target="_blank"}
:::

## 10. Loops

MDN: [Loops and iteration](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Loops_and_iteration), [for](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for), [while](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/while)

A loop repeats a block of code. In JavaScript for loops we use:
- `for` (most common)
- `while` and `do...while` (rare)
- `for...of` (from ES2015) - for arrays and strings, which will be discussed in [session 4, section 8](./04-arrays-and-records#_8-looping-over-an-array).

### `for`

```js
for (init; condition; update) {
    // repeated while condition is true
}
```

The steps:

1. `init` runs **once**, first. Usually it declares a variable, e.g. `let i = 0`, on which the loop iterates.
2. `condition` is checked: if true, the block runs; if false, the loop ends.
3. `update` runs after the block (usually `i++`).
4. Back to step 2.

```js run
for (let i = 0; i < 5; i++) {
    console.log(`i=${i}`);
}
```

::: info Animation
**Loops step by step:** [2. The `for` loop](../animations/loopsStepByStep.html#2){target="_blank"}
:::

The even numbers from 2 to 10:

```js run
for (let i = 2; i <= 10; i += 2) {
    console.log(`i=${i}`);
}
```

Building names of slots or drives:

```js run
for (let slot = 1; slot <= 4; slot++) {
    console.log(`drive_f01_slot_${slot}`);
}
```

Counting down:

```js run
for (let tries = 5; tries > 0; tries--) {
    console.log(`Try: ${tries}`);
}
```

::: info `var` in old rules
Existing rules often write `for (var i = 0; ...)`. It works the same here, but `i`
still exists after the loop. Write `let` in new code; the difference is explained
in session 5.
:::

### Loops over a string

A string has a **length** and each character has a **position** (index),
starting from 0:

```js run
const version = "4.2.1.7";
console.log(version.length);     // 7
console.log(version[0]);         // 4
console.log(version[1]);         // .
console.log(version[version.length - 1]);   // 7 - the last character

for (let i = 0; i < version.length; i++) {
    console.log(i, version[i]);
}
```

::: info A string is still a primitive
In lecture 2 a string was a primitive - one simple value, not an object.
Yet here it has `.length` and `[0]`, like an object with properties.
JavaScript does this for you behind the scenes; how it works is in
lecture 8 ("Primitive wrappers"). For now: you can **read** characters
by index, but you cannot change them - `version[0] = "5"` does nothing.
:::

Count the parts of a version (dots + 1):

```js run
const version = "11.7.23.0";
let dots = 0;
for (let i = 0; i < version.length; i++) {
    if (version[i] === ".") {
        dots++;
    }
}
console.log(`${dots + 1} parts`);
```

`for...of` (ES2015) gives the characters directly, when you do not need the index:

```js run
let digits = 0;
for (const ch of "4.2.1.7") {
    if (ch >= "0" && ch <= "9") {      // string comparison: is it a digit?
        digits++;
    }
}
console.log(digits);
```

### Drawing a tree: nested loops

A loop inside a loop. `"*".repeat(n)` gives `n` stars:

```js run
// half tree
const treeDeep = 5;
for (let i = 1; i <= treeDeep; i++) {
    console.log("*".repeat(i));
}
```

```js run
// full tree
const crownHeight = 6;
const boleHeight = 2;
const boleWidth = 3;
let spaceCount;

// the crown:
for (let i = 1; i <= crownHeight; i++) {
    spaceCount = crownHeight - i;
    console.log(" ".repeat(spaceCount) + "*".repeat(i * 2 - 1));
}

// the bole:
spaceCount = Math.floor((crownHeight * 2 - 1 - boleWidth) / 2);
for (let i = 1; i <= boleHeight; i++) {
    console.log(" ".repeat(spaceCount) + "*".repeat(boleWidth));
}
```

The same with two real nested loops - each row builds its stars one by one:

```js run
for (let row = 1; row <= 4; row++) {
    let line = "";
    for (let col = 1; col <= row; col++) {
        line += "*";
    }
    console.log(line);
}
```

::: info Animation
**Loops step by step:** [6. Nested loops (advanced)](../animations/loopsStepByStep.html#6){target="_blank"}
:::

### `while`

```js
while (condition) {
    // repeated while condition is true
}
```

The condition is checked **before** each round. Something in the block must change
it, otherwise the loop never ends:

```js run
let userTries = 5;
while (userTries > 0) {
    console.log(`Try: ${userTries}`);
    userTries--;            // without this line the loop is endless!
}
```

This example is better as a `for` (see above): the number of rounds is known.
Use `while` when you do **not** know in advance how many rounds are needed:

```js run
// Math.random() gives a random number from 0 to 1 (Math: session 8).
// The machine "thinks of" a number:
const machineNumber = Math.round(Math.random() * 10);
console.log(`machineNumber: ${machineNumber}`);

// The user "enters" numbers until they guess it:
let userNumber = Math.round(Math.random() * 10);
console.log(`userNumber: ${userNumber}`);
while (userNumber !== machineNumber) {
    userNumber = Math.round(Math.random() * 10);
    console.log(`new userNumber: ${userNumber}`);
}
```

**Check yourself:** could you write the same logic with a `for` loop?

::: details Answer
Yes. The first guess goes into `init`, the new guess into `update`:

```js
for (let n = Math.round(Math.random() * 10);
     n !== machineNumber;
     n = Math.round(Math.random() * 10)) {
    console.log(`new userNumber: ${n}`);
}
```

Every `while` can be written as a `for` with empty `init` and `update`:
`for (; condition; ) { ... }`. Choose the one that reads better - here `while`.
:::

With the report - find all dots with `indexOf`, which returns the position of a
text in a string, or `-1` if it is not there:

```js run
const version = doc.overview.version;
let pos = version.indexOf(".");
let count = 0;

while (pos !== -1) {
    count++;
    console.log(`dot at position ${pos}`);
    pos = version.indexOf(".", pos + 1);   // search again after this dot
}
console.log(`${count} dots`);
```

::: tip `indexOf(...) !== -1` in old rules
`platform.indexOf("virtual") !== -1` means "`platform` contains `virtual`". The
modern form is `platform.includes("virtual")` (ES2015). And
`model.indexOf("XR-") === 0` means "starts with" - today
`model.startsWith("XR-")`.
:::

::: info Animation
**Loops step by step:** [3. `while` and the endless loop](../animations/loopsStepByStep.html#3){target="_blank"}
:::

### `do...while`

Like `while`, but the condition is checked **after** the block - so the block runs
**at least once**:

```js
do {
    // runs once, then again while condition is true
} while (condition);
```

```js run
const machineNumber = Math.round(Math.random() * 10);
console.log(`machineNumber: ${machineNumber}`);

let userNumber;
do {
    userNumber = Math.round(Math.random() * 10);
    console.log(`userNumber: ${userNumber}`);
} while (userNumber !== machineNumber);
```

`do...while` is rare in rules; recognise it when you see it.

::: info Animation
**Loops step by step:** [4. `do...while`](../animations/loopsStepByStep.html#4){target="_blank"}
:::

### `break` and `continue`

- `break` - leave the loop **now**.
- `continue` - skip the rest of **this round**, go to the next one.

Cut the version out of the firmware level - stop at the first space:

```js run
const level = doc.inventory.details.firmware_level;   // "4.2.1.7 (build ...)"
let version = "";

for (let i = 0; i < level.length; i++) {
    if (level[i] === " ") {
        break;                  // the version ends here
    }
    version += level[i];
}
console.log(level);
console.log(version);
```

Keep only digits and dots - skip everything else:

```js run
const text = "v4.2-1.7";
let clean = "";

for (const ch of text) {
    const isDigit = ch >= "0" && ch <= "9";
    if (!isDigit && ch !== ".") {
        continue;               // skip this character
    }
    clean += ch;
}
console.log(clean);             // 4.21.7 - careful, "-" was a separator!
```

The output shows that cleaning data needs care: skipping `-` glued two parts
together. In session 8 we do this properly with regular expressions.

::: warning Endless loops
If the condition never becomes false, the page or the rule hangs. In the browser,
close the tab; in the terminal, press `Ctrl+C`. Before you run a `while`, ask:
what changes the condition?
:::

::: info Animation
**Loops step by step:** [5. `break` and `continue`](../animations/loopsStepByStep.html#5){target="_blank"}
:::

## 11. Reading existing rules

Many existing rules are written in an older style (before ES2015). They use only
what you know from this lecture and lecture 2 - just written differently. Here is
a short rule in that style. `emit` is a fake here: it only prints the alert.

```js run
function emit(id, text) {          // fake: prints instead of creating an alert
    console.log("ALERT for " + id + ": " + text);
}

function rule(doc) {
    if (!doc.overview || !doc.inventory || !doc.inventory.details) return;

    var model = doc.overview.model;
    if (model != "XR-210" && model != "XR-220") return;

    var details = doc.inventory.details;
    var loginOn = details.remote_login_enabled == "yes";
    if (loginOn == false) return;

    var level = details.firmware_level || "";
    var version = "";
    for (var i = 0; i < level.length; i++) {
        if (level[i] == " ") break;
        version = version + level[i];
    }

    var name = doc.status && doc.status.device_alias || "unknown device";
    emit(name, "remote login is on, firmware " + version);
}

rule(doc);
```

The old forms, and what you write today:

| Old style | Means | Today |
|-----------|-------|-------|
| `var x = ...` | a variable | `const` (or `let` if it changes) |
| `a != b`, `a == b` | compare, with type conversion | `!==`, `===` |
| `if (loginOn == false)` | "not on" | `if (!loginOn)` |
| `x \|\| ""` | a default for every falsy value | `x ?? ""` (only for `null` / `undefined`) |
| `a && a.b` | `a.b`, only if `a` exists | `a?.b` |
| `s = s + x` | add to the end | `s += x` |
| `"text " + x` | join strings | `` `text ${x}` `` |

The same rule in the modern style:

```js run
function emit(id, text) {          // fake: prints instead of creating an alert
    console.log(`ALERT for ${id}: ${text}`);
}

function rule(doc) {
    if (!doc.overview || !doc.inventory?.details) return;

    const model = doc.overview.model;
    if (model !== "XR-210" && model !== "XR-220") return;

    const details = doc.inventory.details;
    if (details.remote_login_enabled !== "yes") return;

    const level = details.firmware_level ?? "";
    let version = "";
    for (let i = 0; i < level.length; i++) {
        if (level[i] === " ") break;
        version += level[i];
    }

    const name = doc.status?.device_alias ?? "unknown device";
    emit(name, `remote login is on, firmware ${version}`);
}

rule(doc);
```

**Check yourself:**

1. What is `version` for the example JSON document, and why does the loop stop
   there?
2. `device_alias` is `""` (empty). Which name does each rule use?
3. `remote_login_enabled` is missing. Does either rule create an alert?

::: details Answer
1. `"4.2.1.7"`. The firmware level is `"4.2.1.7 (build ...)"`, and `break` ends
   the loop at the first space.
2. The old rule: `"unknown device"` - `||` replaces every falsy value, also `""`.
   The modern rule: `""` - `??` replaces only `null` and `undefined`. When you
   modernise, decide which one the rule needs (section 5).
3. No. `undefined == "yes"` is `false`, so `loginOn` is `false` and the old rule
   stops. `undefined !== "yes"` is `true`, so the modern rule stops too.
:::

## 12. Practice

In your copy of the Homework repository, first get the new tasks:

```bash
git pull upstream main
node 03-conditions-and-loops/practice/task1-predict.js
```

Each file explains the task at the top. Write your code between the
`your code` lines; the checks at the bottom print `OK` or `FAIL`.

| Task | File | What you do |
|------|------|-------------|
| 1 | `task1-predict.js` | Predict 18 comparisons and logical expressions, then check yourself |
| 2 | `task2-firmware-status.js` | Classify a firmware level (`if...else if`) and choose the action text (`switch`) |
| 3 | `task3-rule-condition.js` | The condition of the sample rule, with guard clauses for missing data |
| 4 | `task4-version-loops.js` | Cut, count and clean versions with loops, `break` and `continue` |
| 5 | `task5-defaults.js` | `\|\|` or `??` - show missing values without losing `0` and `false` |

## Summary

| Topic | Remember |
|-------|----------|
| Comparisons | Always a boolean. Use `===` / `!==`; `== null` only for "null or undefined" |
| Strings | Compared character by character: `"4.10" < "4.2"` is `true`. Compare versions part by part |
| Logic | `&&`, `\|\|`, `!`; parentheses when mixing; `!(a && b)` is `!a \|\| !b` |
| Truthy / falsy | Falsy: `false`, `0`, `NaN`, `""`, `null`, `undefined`. `"no"` and `"0"` are truthy |
| Defaults | `a \|\| b` replaces every falsy value; `a ?? b` only `null` / `undefined` |
| `if` | Strictest condition first; only the first match runs; guard clauses with `return` |
| `switch` | One value, `===`, `break` after each case, `default` last |
| Ternary | `cond ? a : b` returns a value; one level only |
| Loops | `for` when the count is known, `while` when not, `do...while` at least once |
| `break` / `continue` | Leave the loop / skip to the next round |
| Old style | `var`, `==`, `== false`, `a && a.b` - read it, write `const` / `let`, `===`, `!`, `?.` |

## Homework

1. `03-conditions-and-loops/homework.js` (in the homework repository): a status
   text for two settings, and the first position where two versions differ.
2. The practice tasks you did not finish in class - recommended, as later tasks
   and the course project reuse them. Every check must print `OK`.
3. Optional: take one of your own rules and list every condition in it. For each:
   which documents does it let through? Is there a `==`, `|| ""` or `== false` that
   could surprise you?

## Read more

- MDN: [Equality comparisons and sameness](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness),
  [Truthy](https://developer.mozilla.org/en-US/docs/Glossary/Truthy),
  [Falsy](https://developer.mozilla.org/en-US/docs/Glossary/Falsy),
  [Nullish coalescing `??`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing),
  [Loops and iteration](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Loops_and_iteration)
- Eloquent JavaScript (4th edition): [Values, Types, and Operators](https://eloquentjavascript.net/01_values.html),
  [Program Structure](https://eloquentjavascript.net/02_program_structure.html)
- You Don't Know JS Yet: [Equal...ish](https://github.com/getify/You-Dont-Know-JS/blob/2nd-ed/get-started/ch2.md#equalish)

**Next session:** arrays - lists of models, drives and records. The
`model !== "XR-210" && model !== "XR-220"` of today's rule becomes an allow-list:
`!["XR-210", "XR-220"].includes(model)`.
