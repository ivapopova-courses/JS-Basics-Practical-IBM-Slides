---
title: 8. Strings, regex, dates, numbers
---

# 8. Strings, regular expressions, dates and numbers

<div class="lecture-meta">
  <span>Session 8</span><span>practice: <code>08-strings-regex-dates/</code> in the homework repository</span>
  <span><a href="../example-document"><code>doc</code>: the example JSON document</a></span>
</div>

**Today you will learn to:**

- clean and examine text with the `String` methods: `trim`, `toLowerCase`,
  `startsWith`, `includes`, `slice`, `padStart`, `replaceAll` and more;
- know what a primitive wrapper is, and why `"ada".toUpperCase()` works;
- understand how text is stored: characters, Unicode, UTF-8, line endings - and
  what goes wrong with other encodings;
- write and **read** regular expressions: `test`, `match` with capture groups,
  `matchAll`, `replace` with the `g` flag, the `i` flag - like the patterns in
  existing rules;
- normalise versions in many formats (`4.2.1.7-B00`, `42107-C00`,
  `4.2.1.7 (build ...)`) with one shared helper;
- convert, round and format numbers, and use `Math`;
- work with dates: EPOCH seconds and milliseconds, the date formats of real
  reports, time zones, comparing and subtracting dates.

Where this fits in the sample check rule - today's rule cleans the text it reads,
finds the version with a **regular expression**, and calculates with **dates**. The
number in each comment is the section of this lecture:

```js
const MODELS = ["XR-210", "XR-220"];
const RECOMMENDED = "4.2.2";
const MAX_MODULE_AGE_DAYS = 300;

// 8. one helper for all version formats: "4.2.1.7 (build ...)", "v4.2.1.7-B00", "42107-C00"
function normalizeVersion(text) {
    const s = String(text ?? "").trim();
    const dotted = s.match(/\d+(?:\.\d+)+/);                    // 5. digits, then ".digits" once or more
    if (dotted) return dotted[0];
    const packed = s.match(/^(\d)(\d)(\d)(\d\d)-[A-Z]\d\d$/);   // 6. capture groups: "42107-C00"
    if (packed) return packed.slice(1).map(Number).join(".");   //    -> "4.2.1.7"
    return "";
}

// lecture 5
function compareVersions(a, b) {
    const pa = String(a ?? "").split(".").map(x => parseInt(x, 10) || 0);
    const pb = String(b ?? "").split(".").map(x => parseInt(x, 10) || 0);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const x = pa[i] ?? 0, y = pb[i] ?? 0;
        if (x !== y) return x < y ? -1 : 1;
    }
    return 0;
}

// 10. whole days between two dates; 9. Math.floor
function daysBetween(from, to) {
    return Math.floor((to - from) / 86_400_000);                // 1 day = 86,400,000 ms
}

function rule(doc) {          // the engine calls rule(doc) - keep this line
    const model = String(doc.overview?.model ?? "").trim().toUpperCase();   // 2. string methods
    if (!MODELS.includes(model)) return;

    const version = normalizeVersion(doc.inventory?.details?.firmware_level);
    if (version === "" || compareVersions(version, RECOMMENDED) >= 0) return;

    const reported = new Date(Number(doc.status?.epoch) * 1000);  // 10. EPOCH seconds -> ms

    // 6. keys like "12_4.20": the module number and its version, from one pattern
    const oldModules = [];
    for (const [key, m] of Object.entries(doc.inventory?.modules ?? {})) {
        const match = /^(\d+)_(\d+\.\d+)$/.exec(key);
        if (!match) continue;
        const age = daysBetween(new Date(m.installed), reported);   // 10. "2025-11-20" is UTC
        if (age > MAX_MODULE_AGE_DAYS) oldModules.push(`${match[1]} v${match[2]} (${age} days)`);
    }

    emit(doc.status.device_alias, {
        "Model": model,
        "Version": version,
        "Recommended": RECOMMENDED,
        "Report date": reported.toISOString().slice(0, 10),        // 10. "2026-10-12"
        "Old modules": oldModules.join(", ") || "none"
    });
}
```

- Almost every value in a report is a **string** - also the numbers, the dates and
  the versions. Today you learn to take such strings apart safely.
- Regular expressions appear in many existing rules. The goal is not to write
  clever ones, but to **read** them with confidence and to write simple ones.
- In [section 11](#_11-reading-existing-rules) you run this rule, and read an older
  rule that does the same work with `indexOf` and `substring`.

## 1. Strings: the basics again

A string is a sequence of characters. Lecture 2 showed the three kinds of quotes
and template strings; lecture 4 showed indexes and `split`:

```js run
const level = doc.inventory.details.firmware_level;

console.log(level);                 // 4.2.1.7 (build 412.17.2607151200)
console.log(level.length);          // 33
console.log(level[0], level.at(-1));   // 4 )  - the first and the last character
console.log(typeof level);          // string
```

### Strings cannot be changed

A string is **immutable**: no method changes it. Every method returns a **new**
string, and the original stays as it was:

```js run
let model = "xr-220";
model.toUpperCase();            // the result is thrown away
console.log(model);             // xr-220 - unchanged

model = model.toUpperCase();    // keep the result
console.log(model);             // XR-220

const s = "abc";
s[0] = "X";                     // ignored (an error in strict mode)
console.log(s);                 // abc
```

This is why string methods are always used in an assignment, a condition or a
call: `const clean = raw.trim();`.

## 2. String methods

MDN: [String: instance methods](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String#instance_methods)

The methods you need most often, grouped by what they do:

| Group | Methods |
|---|---|
| Case | `toLowerCase()`, `toUpperCase()` |
| White space | `trim()`, `trimStart()`, `trimEnd()` |
| Search (true / false) | `includes(s)`, `startsWith(s)`, `endsWith(s)` |
| Search (position) | `indexOf(s)`, `lastIndexOf(s)` - `-1` when not found |
| Cut out | `slice(start, end)`, `substring(start, end)`, `at(i)`, `charAt(i)` |
| Change | `replace(a, b)`, `replaceAll(a, b)`, `padStart(n, s)`, `padEnd(n, s)`, `repeat(n)` |
| To an array and back | `split(sep)` (lecture 4), `array.join(sep)` |
| Compare | `localeCompare(other)` (lecture 7), `===` |

### Case and white space

MDN: [String.prototype.toLowerCase()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/toLowerCase), [String.prototype.toUpperCase()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/toUpperCase), [String.prototype.trim()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/trim)

Values typed by people or produced by different tools are not always written the
same way. Normalise first, then compare:

```js run
const raw = "  xr-220 \n";
console.log(JSON.stringify(raw));                   // "  xr-220 \n" - see the spaces
console.log(JSON.stringify(raw.trim()));            // "xr-220"
console.log(raw.trim().toUpperCase() === "XR-220"); // true

console.log(JSON.stringify("  a  ".trimStart()));   // "a  "
console.log(JSON.stringify("  a  ".trimEnd()));     // "  a"
```

`JSON.stringify` is a good way to **see** a string: the quotes show where it starts
and ends, and `\n`, `\t` become visible.

### Searching

MDN: [String.prototype.includes()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/includes), [String.prototype.startsWith()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith), [String.prototype.indexOf()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/indexOf)

```js run
const level = doc.inventory.details.firmware_level;   // "4.2.1.7 (build 412.17.2607151200)"

console.log(level.includes("build"));         // true
console.log(level.startsWith("4.2"));         // true
console.log(level.endsWith(")"));             // true
console.log(level.indexOf(" "));              // 7 - the position of the first space
console.log(level.indexOf("XR"));             // -1 - not found
console.log(level.lastIndexOf("."));          // 21 - the position of the last dot

const model = doc.overview.model;
console.log(model.startsWith("XR-2"));        // true - "a model of the XR-2xx family"
```

`includes`, `startsWith` and `endsWith` (ES2015) replace the older
`indexOf(...) !== -1` and `indexOf(...) === 0` of existing rules:

| Older | Modern |
|---|---|
| `s.indexOf("build") !== -1` | `s.includes("build")` |
| `s.indexOf("XR-2") === 0` | `s.startsWith("XR-2")` |
| `s.indexOf(")") === s.length - 1` | `s.endsWith(")")` |

### Cutting out a part: `slice` and `substring`

MDN: [String.prototype.slice()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/slice), [String.prototype.substring()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/substring)

`slice(start, end)` works like `slice` of arrays (lecture 4): from `start`, up to
but **not including** `end`; negative positions count from the end.

```js run
const level = doc.inventory.details.firmware_level;

const space = level.indexOf(" ");
console.log(level.slice(0, space));           // 4.2.1.7 - up to the first space
console.log(level.slice(space + 1));          // (build 412.17.2607151200) - from after it
console.log(level.slice(-11, -1));            // 2607151200 - counted from the end

const id = "D7F3A9C21E40B815";
console.log(id.slice(-4));                    // B815 - the last four characters
```

Older code uses `substring` and `substr`:

```js run
console.log("abcdef".substring(1, 3));        // bc   - like slice(1, 3)
console.log("abcdef".substring(3, 1));        // bc   - substring swaps start and end
console.log("abcdef".substring(-2));          // abcdef - negative counts as 0
console.log("abcdef".slice(-2));              // ef   - slice counts from the end

console.log("abcdef".substr(1, 2));           // bc   - substr(start, LENGTH) - deprecated
```

Prefer `slice`. `substr` is deprecated: it still works, but do not use it in new
code. `charAt(i)` is the older form of `s[i]`.

### Changing: `replace`, `replaceAll`, `padStart`, `repeat`

MDN: [String.prototype.replace()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace), [String.prototype.replaceAll()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replaceAll), [String.prototype.padStart()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padStart)

```js run
// replace changes only the FIRST match; replaceAll changes all (ES2021)
console.log("CON-01;CON-02".replace(";", ", "));     // CON-01, CON-02
console.log("a-b-c".replace("-", "+"));              // a+b-c
console.log("a-b-c".replaceAll("-", "+"));           // a+b+c

// padStart / padEnd: fill up to a length (ES2017)
console.log("7".padStart(2, "0"));                   // 07
console.log("ENC-1".padEnd(8, ".") + "normal");      // ENC-1...normal

// repeat
console.log("-".repeat(20));
```

`replaceAll` is ES2021 - check that your rule engine supports it. The older way to
replace all matches is `split` + `join` (`"a-b-c".split("-").join("+")`) or a
regular expression with the `g` flag (section 6).

An old example from the dates topic - the current time as `HH:MM:SS`, every part
with two digits:

```js run
function formatTime(date) {
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    const ss = String(date.getSeconds()).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
}
console.log(formatTime(new Date()));          // the time now, e.g. 09:05:03
```

::: tip Strings in a rule: convert first
`doc.overview.model.trim()` throws a `TypeError` when `model` is missing or is a
number. `String(x ?? "")` turns any value into a string first - the sample rule
does this. The existing rules do the same with `String(x || "")`.
:::

## 3. Primitive wrappers (advanced)

A string is a **primitive** (lecture 2) - not an object. How can it have methods?

JavaScript has three built-in objects for primitives: `String`, `Number` and
`Boolean`. You can create such objects yourself - but you should not:

```js run
const str1 = new String("ada");       // an object of type String
const str2 = "ada";                   // a primitive string

console.log(typeof str1);             // object
console.log(typeof str2);             // string
console.log(str1 == str2);            // true  - == converts the object to its value
console.log(str1 === str2);           // false - different types
```

When you use a primitive **like** an object - `"ada".toUpperCase()` - JavaScript
wraps it for a moment in the matching object (*boxing*), calls the method, and
throws the wrapper away:

```js run
console.log("ada".toUpperCase());     // ADA
// works as if you had written:
console.log(new String("ada").toUpperCase());

// but the wrapper is temporary: a property set on a primitive is lost
const str1 = new String("ada");
const str2 = "ada";
str1.id = 1;
str2.id = 1;                          // an error in strict mode; ignored here
console.log(str1.id);                 // 1
console.log(str2.id);                 // undefined
```

**Best practice:** use the primitives, and let JavaScript wrap them when you call a
method. Never `new String(...)`, `new Number(...)` or `new Boolean(...)`:

```js run
const x = 42;                         // a number primitive - good
const y = new Number(42);             // a Number object - needlessly complicated

console.log(x + 10, y + 10);          // 52 52
console.log(x.toPrecision(5), y.toPrecision(5));   // 42.000 42.000
console.log(x == y, x === y);         // true false

console.log(Boolean(new Boolean(false)));   // true - an object is always truthy!
```

`String(x)`, `Number(x)` and `Boolean(x)` **without** `new` are fine: they are
conversions (lecture 2) and return primitives.

## 4. Characters and encodings

MDN: [UTF-16 characters, Unicode code points, and grapheme clusters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String#utf-16_characters_unicode_code_points_and_grapheme_clusters)

### Every character is a number

The computer stores text as numbers. Each character has a number, its **code
point**:

```js run
console.log("A".codePointAt(0));              // 65
console.log("a".codePointAt(0));              // 97 - this is why "a" > "A" (lecture 3)
console.log(String.fromCodePoint(88, 82));    // XR
console.log("\u0041");                   // A - the same character, written by its number (hex 41)
```

- **ASCII** (1963) numbered 128 characters: English letters, digits, punctuation and
  control characters like the new line (10). Enough for English - not for other
  languages.
- **Unicode** numbers the characters of **all** scripts: Latin, Cyrillic, Greek,
  Chinese, symbols, emoji - over 150,000 characters. The first 128 are the same as
  ASCII.

```js run
const name = "\u0418\u0432\u0430";            // Cyrillic letters, written by their numbers
console.log(name);                            // the Cyrillic name "Iva"
console.log(name.length);                     // 3
console.log([...name].map(ch => ch.codePointAt(0)));    // [ 1048, 1074, 1072 ]
```

### UTF-8: characters as bytes in a file

A file stores **bytes** (numbers from 0 to 255). An **encoding** says how the
code points become bytes. Today almost every file and every JSON document uses
**UTF-8**:

- ASCII characters take **1** byte - an English text in UTF-8 is the same as in
  ASCII;
- Cyrillic, Greek and similar letters take **2** bytes;
- most emoji take **4**.

```js run
const bytes = s => new TextEncoder().encode(s).length;    // the UTF-8 bytes of a string

console.log(bytes("A"));                      // 1
console.log(bytes("\u0418"));                 // 2 - a Cyrillic letter
console.log(bytes("\u{1F600}"));              // 4 - an emoji
```

Before UTF-8, every language had its own one-byte encoding - for example
**Windows-1251** for Cyrillic. A file written in one encoding and read in another
shows garbage (*mojibake*). `TextDecoder` reads bytes in a given encoding:

```js run
const raw = new Uint8Array([0xc8, 0xe2, 0xe0]);         // three bytes from an old file

console.log(new TextDecoder("windows-1251").decode(raw));    // the right Cyrillic word
console.log(new TextDecoder("utf-8").decode(raw));           // garbage: not valid UTF-8
```

If a report or an export ever shows such garbage, the question is always: in which
encoding was it written, and in which was it read?

### `length` counts code units, not characters

JavaScript strings use 16-bit **code units** (UTF-16). Most characters take one;
emoji and some rare characters take **two**. `length` counts code units:

```js run
const smile = "\u{1F600}";
console.log(smile.length);            // 2 - one emoji, two code units
console.log([...smile].length);       // 1 - spread splits by code points

// the same letter, written in two ways
const e1 = "\u00e9";                  // e with an accent, one code point
const e2 = "e\u0301";                 // e + a combining accent: two code points
console.log(e1, e2, e1 === e2);                         // they look the same - but false
console.log(e1 === e2.normalize());                     // true after normalize()
```

For report data - ids, versions, states - this rarely matters: they are ASCII.
It matters for names and free text.

### Line endings

A new line is not the same character everywhere:

| System | Line ending | In a string |
|---|---|---|
| Linux, macOS | LF (line feed) | `"\n"` |
| Windows | CR LF (carriage return + line feed) | `"\r\n"` |

A text that comes from Windows, split at `"\n"`, keeps an invisible `"\r"` at the
end of each line - and `"normal\r" === "normal"` is `false`:

```js run
const text = "ENC-01;normal\r\nENC-02;degraded\r\n";

const wrong = text.split("\n");
console.log(JSON.stringify(wrong[0]));                  // "ENC-01;normal\r"

const lines = text.split(/\r?\n/).filter(Boolean);     // \r is optional (section 5)
console.log(lines);                                     // [ 'ENC-01;normal', 'ENC-02;degraded' ]
```

`/\r?\n/` is a regular expression: "an optional `\r`, then `\n`". Section 5 starts
with them.

::: info Byte order mark
Some Windows tools put an invisible character, `"\uFEFF"` (the BOM, *byte order
mark*), at the start of a UTF-8 file. `JSON.parse` fails on it. Lecture 9 reads
files - and removes it: `text.replace(/^\uFEFF/, "")`.
:::

## 5. Regular expressions: patterns for text

MDN: [Regular expressions (guide)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions)

A **regular expression** (regex, *regexp*) describes a **pattern** of text: "four
digits", "a word, then `=`, then digits", "starts with `XR-`, ignoring the case".
With a pattern you can **test** a string, **find** parts of it, or **replace** them.

They appear in many existing rules:

```js
if (/^\d{4}$/.test(typeCode)) { ... }                     // exactly four digits?
var m = String(key).match(/^(\d+)_v?(.+)$/);                 // "347_v2.12" -> "347" and "2.12"
var clean = uid.replace(/[^A-Z0-9]/g, "");                   // remove everything but A-Z, 0-9
if (/^(none|null|unknown)$/i.test(text)) return "";          // one of three words, any case
var match = String(version).match(/[0-9]+(?:\.[0-9]+)*/);    // the first version-like part
```

By the end of this section and the next, you can read every one of these lines.

### Writing a pattern

A pattern is written between two slashes - a **regex literal** - optionally followed
by **flags**:

```js run
const re = /XR-2\d\d/;                // "XR-2" and two digits
console.log(re.test("XR-220"));       // true
console.log(re.test("XR-310"));       // false
console.log(re.test("model XR-210, rack 4"));   // true - the pattern may be anywhere
console.log(typeof re, re);           // object /XR-2\d\d/
```

`re.test(str)` answers `true` or `false`: does the string contain the pattern?

A pattern can also be built from a string with `new RegExp(text, flags)` - when it
is not known in advance. In a string, a backslash must be written twice:

```js run
const prefix = "XR-2";
const re = new RegExp("^" + prefix + "\\d\\d$");     // the same as /^XR-2\d\d$/
console.log(re, re.test("XR-220"));
```

### The building blocks

MDN: [Regular expression syntax cheat sheet](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions/Cheatsheet)

**Characters.** Letters and digits match themselves. These have a special meaning
and must be escaped with `\` to match literally: `. * + ? ^ $ { } ( ) | [ ] \ /`.

```js run
console.log(/4.2/.test("4x2"));       // true  - "." means ANY character
console.log(/4\.2/.test("4x2"));      // false - "\." means a real dot
console.log(/4\.2/.test("4.2.1.7"));  // true
```

**Character classes** - one character out of a set:

| Pattern | Matches one... |
|---|---|
| `[abc]` | `a`, `b` or `c` |
| `[a-z]`, `[A-Z0-9]` | character in a range |
| `[^0-9]` | character that is **not** in the set |
| `\d` | digit - the same as `[0-9]` |
| `\w` | "word" character: `[A-Za-z0-9_]` |
| `\s` | white space: space, tab, new line, `\r` |
| `\D`, `\W`, `\S` | the opposite of `\d`, `\w`, `\s` |
| `.` | any character except a new line |

**Quantifiers** - how many times the thing before them may repeat:

| Pattern | Means |
|---|---|
| `x*` | 0 or more |
| `x+` | 1 or more |
| `x?` | 0 or 1 (optional) |
| `x{4}` | exactly 4 |
| `x{2,4}` | 2 to 4 |
| `x{2,}` | 2 or more |

**Anchors** - positions, not characters:

| Pattern | Means |
|---|---|
| `^` | the start of the string |
| `$` | the end of the string |
| `\b` | a word boundary (between `\w` and not `\w`) |

```js run
console.log(/^\d{4}$/.test("2607"));        // true  - exactly four digits, nothing else
console.log(/^\d{4}$/.test("2607-X25"));    // false - more after the digits
console.log(/\d{4}/.test("2607-X25"));      // true  - four digits somewhere
console.log(/^XR-\d+$/.test("XR-220"));     // true
console.log(/colou?r/.test("color"));       // true  - the "u" is optional
console.log(/\bON\b/.test("POWER ON"));     // true  - ON as a whole word
console.log(/\bON\b/.test("POWERON"));      // false
```

::: tip `^` and `$` - use them for "is it exactly this?"
Without anchors, a pattern matches **anywhere** in the string: `/\d{4}/` is true for
`"x12345y"`. For validation - "is this a four-digit type?" - write `^...$`.
:::

**Alternatives** with `|`, and **groups** with `( )`:

```js run
const isEmpty = /^(none|null|unknown|n\/a)$/i;      // one of four words; i: ignore case
console.log(isEmpty.test("Unknown"));               // true
console.log(isEmpty.test("unknown device"));        // false - ^ and $
console.log(isEmpty.test("N/A"));                   // true
```

### Greedy and lazy

`*` and `+` are **greedy**: they take as much as they can. Add `?` to make them
**lazy** - as little as possible:

```js run
const s = "[ENC-01] [ENC-02]";
console.log(s.match(/\[.*\]/)[0]);       // [ENC-01] [ENC-02] - greedy: up to the LAST ]
console.log(s.match(/\[.*?\]/)[0]);      // [ENC-01]          - lazy: up to the first ]
```

### Try patterns online

Regular expressions are easier to read with a tool:
[regex101.com](https://regex101.com/) (choose the *ECMAScript (JavaScript)*
flavour) explains a pattern part by part and shows the matches as you type. Paste
the patterns of existing rules there.

## 6. Groups, flags and the regex methods

### Capture groups: `match`

MDN: [String.prototype.match()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/match)

`str.match(re)` returns `null` when there is no match, or an **array**: the whole
match at index 0, then the text of every **group** `( )`:

```js run
const level = doc.inventory.details.firmware_level;   // "4.2.1.7 (build 412.17.2607151200)"

const m = level.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+) \(build ([\d.]+)\)$/);
console.log(m[0]);            // the whole match
console.log(m[1], m[2], m[3], m[4]);    // 4 2 1 7
console.log(m[5]);            // 412.17.2607151200
console.log(m.index);         // 0 - where the match starts

console.log("no version here".match(/(\d+)\.(\d+)/));    // null
```

Always check for `null` before you read the groups - `null[1]` is a `TypeError`:

```js run
function majorVersion(text) {
    const m = String(text ?? "").match(/^(\d+)\./);
    return m ? Number(m[1]) : null;         // or: return m?.[1] ...
}
console.log(majorVersion("4.2.1.7"), majorVersion("v4"), majorVersion(undefined));   // 4 null null
```

Destructuring (lecture 6) takes the groups into variables:

```js run
const key = "12_4.20";
const [, number, version] = key.match(/^(\d+)_(\d+\.\d+)$/) ?? [];
console.log(number, version);           // 12 4.20
```

### Named groups (ES2018)

`(?<name>...)` gives a group a name; the match has them in `.groups`:

```js run
const stamp = "2026-10-12-12.56.04.000000";      // a date format from a real export
const m = stamp.match(/^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})-(?<hour>\d{2})\.(?<min>\d{2})/);
console.log(m.groups.year, m.groups.month, m.groups.day);    // 2026 10 12
console.log(`${m.groups.hour}:${m.groups.min}`);             // 12:56
```

`(?:...)` is a group that does **not** capture - only for grouping, as in
`/\d+(?:\.\d+)+/` of the sample rule: "digits, then (a dot and digits) once or more".

### Flags

MDN: [Advanced searching with flags](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions#advanced_searching_with_flags)

| Flag | Meaning |
|---|---|
| `g` | global: find **all** matches, not only the first |
| `i` | ignore case: `/xr/i` matches `XR`, `xr`, `Xr` |
| `m` | multiline: `^` and `$` match at every line, not only at the start and end of the string |
| `s` | "dotAll": `.` also matches a new line (ES2018) |
| `u` | Unicode mode: correct handling of emoji and `\p{...}` classes |

```js run
console.log(/^xr-2/i.test("XR-220"));                       // true - i
console.log("ab12cd345".match(/\d+/));                      // [ '12', index: 2, ... ] - the first match, with details
console.log("ab12cd345".match(/\d+/g));                     // [ '12', '345' ] - g: all matches, no details

const report = "ENC-01 normal\nENC-02 degraded";
console.log(report.match(/^ENC-\d+/gm));                    // [ 'ENC-01', 'ENC-02' ] - m: ^ at every line
```

### All matches with their groups: `matchAll` (ES2020)

MDN: [String.prototype.matchAll()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/matchAll)

`match` with `g` gives only the matched texts. `matchAll` gives every match **with**
its groups (the pattern must have the `g` flag):

```js run
const settings = doc.inventory.details.settings;     // "SA=2,SG=1,SN=2"

for (const m of settings.matchAll(/(\w+)=(\w+)/g)) {
    console.log(m[1], "->", m[2]);
}

// into an object, in one line
const parsed = Object.fromEntries([...settings.matchAll(/(\w+)=(\w+)/g)].map(m => [m[1], m[2]]));
console.log(parsed);                                  // { SA: '2', SG: '1', SN: '2' }
```

Older code uses `re.exec(str)` in a `while` loop for the same - it returns one match
per call and moves on, when the pattern has the `g` flag.

### `replace` with a pattern

```js run
// remove every character that is not a capital letter or a digit (from an existing rule)
console.log("lab-dev 01/a".toUpperCase().replace(/[^A-Z0-9]/g, ""));   // LABDEV01A

// without g, only the first match is replaced
console.log("a1b2c3".replace(/\d/, "#"));          // a#b2c3
console.log("a1b2c3".replace(/\d/g, "#"));         // a#b#c#

// $1, $2 ... are the groups in the replacement text
console.log("4.2.1.7".replace(/^(\d+)\.(\d+).*$/, "$1.$2"));      // 4.2 - major.minor

// a function as the replacement: called for every match, with the groups
console.log("SA=2,SG=1".replace(/(\w+)=(\d+)/g, (whole, key, value) => `${key}:${value * 10}`));
// SA:20,SG:10
```

`replaceAll` with a pattern needs the `g` flag - without it, it throws a
`TypeError`.

### `split` with a pattern

```js run
console.log("a, b ,c ,  d".split(/\s*,\s*/));          // [ 'a', 'b', 'c', 'd' ]
console.log("CON-01; CON-02;CON-03".split(/;\s*/));     // [ 'CON-01', 'CON-02', 'CON-03' ]
console.log("4.2.1.7-B00".split(/[.-]/));               // [ '4', '2', '1', '7', 'B00' ]
```

### A trap: `g` and `test` remember where they stopped

MDN: [RegExp.prototype.test()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/test), [RegExp: lastIndex](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/lastIndex)

A pattern with the `g` flag has a `lastIndex`: `test` and `exec` start searching
from there and move it on. The same pattern object, used again on another string,
can then **miss**:

```js run
const DIGITS = /\d+/g;                    // a global constant, with the g flag
console.log(DIGITS.test("abc123"));       // true  - lastIndex is now 6
console.log(DIGITS.test("abc123"));       // false - starts at 6, finds nothing, resets to 0
console.log(DIGITS.test("abc123"));       // true  - again from 0
```

Rule guidelines ask for `const` globals - a `const` regex with `g`, used with
`test` in a helper, gives a different answer every second call. **Do not use the
`g` flag with `test`**; use `g` only with `match`, `matchAll`, `replace` and
`replaceAll`.

## 7. Reading the patterns in existing rules

Read a pattern from left to right, one building block at a time. The patterns from
the start of section 5:

| Pattern | Read it as | Matches |
|---|---|---|
| `/^\d{4}$/` | start, exactly 4 digits, end | `"2607"`, not `"2607X25"` |
| `/^(\d+)_v?(.+)$/` | start, digits (group 1), `_`, an optional `v`, one or more of anything (group 2), end | `"347_v2.12"` -> `"347"`, `"2.12"` |
| `/[^A-Z0-9]/g` | every character that is not A-Z or 0-9 (with `replace`: remove them) | the `-`, `/` and spaces in `"LAB-DEV 01/A"` |
| `/^(none\|null\|unknown)$/i` | the whole string is one of three words, any case | `"Unknown"`, not `"unknown device"` |
| `/[0-9]+(?:\.[0-9]+)*/` | digits, then (a dot and digits) zero or more times | `"2.13.1"` in `"Platform 2.13.1 GA"` |
| `/^\d+\.\d+\.\d+\.\d+/` | start, four groups of digits separated by dots | `"4.2.1.7"` at the start of `"4.2.1.7 (build ...)"` |

```js run
const patterns = [
    [/^\d{4}$/, ["2607", "2607X25"]],
    [/^(\d+)_v?(.+)$/, ["347_v2.12", "12_4.20", "drive_f01"]],
    [/^(none|null|unknown)$/i, ["Unknown", "unknown device", "NULL"]],
    [/[0-9]+(?:\.[0-9]+)*/, ["Platform 2.13.1 GA", "v4", "none"]],
];
for (const [re, samples] of patterns) {
    for (const s of samples) {
        const m = s.match(re);
        console.log(String(re).padEnd(26), JSON.stringify(s).padEnd(20), m ? JSON.stringify([...m]) : "no match");
    }
}
```

::: warning Do not overdo it
A pattern that nobody can read is a bug waiting to happen. For simple questions
use string methods - `startsWith("XR-2")` is clearer than `/^XR-2/`. Use a regex
when the **shape** of the text matters (digits, separators, optional parts), and
add a comment with an example: `// "347_v2.12" -> number 347, version 2.12`.
:::

::: info `RegExp.escape` (ES2025)
To build a pattern from text that may contain special characters (a model like
`"XR-2.0"`), `RegExp.escape(text)` escapes them. It is very new - check that your
rule engine supports it; older code escapes with
`text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")`.
:::

## 8. Versions in many formats

Lecture 5 wrote `compareVersions` for dotted versions. Real reports send versions
in many more shapes:

| Format | Example | What it means |
|---|---|---|
| dotted | `4.2.1.7` | four numbers |
| with a build | `4.2.1.7 (build 412.17.2607151200)` | the version is the first word |
| with a suffix | `4.2.1.7-B00`, `4.2.1.7-C00` | a build letter and number after `-` |
| with a prefix | `v4.2.1.7`, `Platform 2.13.1` | text before the numbers |
| packed | `42107-C00` | the digits of 4.2.1.07, without dots |
| product code | `XR420_117` | product + version 4.2.0 + build 117 |
| short | `4.2`, `5.16` | major.minor only |

One shared helper turns them into **one** format, and then `compareVersions` works
for all:

```js run
function normalizeVersion(text) {
    const s = String(text ?? "").trim();
    const dotted = s.match(/\d+(?:\.\d+)+/);                    // the first "digits.digits..." part
    if (dotted) return dotted[0];
    const packed = s.match(/^(\d)(\d)(\d)(\d\d)-[A-Z]\d\d$/);   // "42107-C00"
    if (packed) return packed.slice(1).map(Number).join(".");
    const code = s.match(/^[A-Z]+(\d)(\d)(\d)_\d+$/);           // "XR420_117"
    if (code) return code.slice(1).join(".");
    return "";
}

for (const v of ["4.2.1.7", "4.2.1.7 (build 412.17.2607151200)", "4.2.1.7-B00", "v4.2.1.7",
                 "Platform 2.13.1", "42107-C00", "XR420_117", "4.2", "unknown", "", undefined]) {
    console.log(JSON.stringify(v ?? null).padEnd(38), "->", JSON.stringify(normalizeVersion(v)));
}
```

The suffix (`-B00`) is dropped. When the suffix matters - is `4.2.1.7-C00` newer
than `4.2.1.7-B00`? - compare it as a second step:

```js run
function splitVersion(text) {
    const m = String(text ?? "").trim().match(/^v?(\d+(?:\.\d+)*)(?:-([A-Z])(\d+))?/i);
    return m ? { numbers: m[1], letter: (m[2] ?? "").toUpperCase(), build: Number(m[3] ?? 0) } : null;
}
console.log(splitVersion("4.2.1.7-C00"));     // { numbers: '4.2.1.7', letter: 'C', build: 0 }
console.log(splitVersion("4.2.1.7"));         // { numbers: '4.2.1.7', letter: '', build: 0 }
console.log(splitVersion("n/a"));             // null
```

::: tip One helper, in the library
The existing rules re-implement version parsing again and again - with small
differences, and small bugs. `normalizeVersion` and `compareVersions` belong in
your **library**: write them once, test them on every format your product sends
(lecture 10), and every rule gets the fix.
:::

## 9. Numbers and `Math`

### From text to a number - again

Lecture 2 introduced `Number`, `parseInt` and `parseFloat`. Report data adds a few
more cases:

```js run
console.log(Number("12.5"));          // 12.5
console.log(Number(""));              // 0   - an empty string is 0!
console.log(Number(" "));             // 0
console.log(Number(null));            // 0
console.log(Number(undefined));       // NaN
console.log(Number("1,234"));         // NaN - a thousands separator
console.log(Number("1,234".replaceAll(",", "")));    // 1234

console.log(parseFloat("1,234.5"));   // 1   - stops at the comma
console.log(parseInt("38 C", 10));    // 38  - stops at the space
console.log(parseInt("5A9D", 16));    // 23197 - a hex number (base 16)
```

Check the result before you calculate:

```js run
console.log(isNaN("abc"), Number.isNaN("abc"));       // true false
console.log(Number.isNaN(Number("abc")));             // true - convert, then check
console.log(Number.isInteger(5), Number.isInteger(5.5), Number.isInteger("5"));   // true false false
console.log(Number.isFinite(1 / 0), Number.isFinite(42));                         // false true

function toNumber(text, fallback = null) {
    const s = String(text ?? "").trim();
    if (s === "") return fallback;              // do not let "" become 0
    const n = Number(s);
    return Number.isFinite(n) ? n : fallback;
}
console.log(toNumber("31"), toNumber(""), toNumber("n/a"), toNumber(" 7 "), toNumber(0));   // 31 null null 7 0
```

The global `isNaN` converts its argument first (`isNaN("abc")` is `true`);
`Number.isNaN` does not. Prefer the `Number.` versions.

### Rounding and formatting

MDN: [Number.prototype.toFixed()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toFixed), [Math.round()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/round)

```js run
const percent = 1675.1 / 1863 * 100;
console.log(percent);                         // 89.91411701556629
console.log(Math.round(percent));             // 90
console.log(percent.toFixed(1));              // 89.9 - a STRING with 1 decimal
console.log(Math.round(percent * 10) / 10);   // 89.9 - a number

console.log((1.005).toFixed(2));              // 1.00 - not 1.01! (1.005 is stored as 1.00499...)
console.log(Math.round(2.5), Math.round(-2.5));   // 3 -2 - .5 rounds up, towards +Infinity

// for people: thousands separators, by locale
console.log((68096).toLocaleString("en-US"));                        // 68,096
console.log(new Intl.NumberFormat("de-DE").format(1234567.891));     // 1.234.567,891
console.log(new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 }).format(0.899));   // 89.9%
```

`toFixed` returns a **string** - fine for an alert text, wrong for further
calculation.

### `Math`

MDN: [Math](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math)

`Math` is a built-in object with mathematical functions and constants - you call
them directly, without `new`:

| Function | Example | Result |
|---|---|---|
| `Math.round(x)` | `Math.round(4.5)` | `5` - to the nearest whole number |
| `Math.floor(x)` | `Math.floor(4.7)` | `4` - down |
| `Math.ceil(x)` | `Math.ceil(4.1)` | `5` - up |
| `Math.trunc(x)` | `Math.trunc(-4.7)` | `-4` - drop the decimals |
| `Math.abs(x)` | `Math.abs(-3)` | `3` - without the sign |
| `Math.min(...)`, `Math.max(...)` | `Math.max(2, 12, 5)` | `12` |
| `Math.pow(x, y)`, `x ** y` | `2 ** 10` | `1024` |
| `Math.sqrt(x)` | `Math.sqrt(16)` | `4` |
| `Math.random()` | | a number from 0 (included) to 1 (not included) |
| `Math.PI` | | `3.141592653589793` |

```js run
const temps = ["31", "34", "37", "29"].map(Number);
console.log(Math.max(...temps), Math.min(...temps));    // 37 29 - spread (lecture 6)
console.log(Math.max(...[]));                           // -Infinity - an empty list!

// a whole random number from min to max (both included)
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
console.log(randomInt(1, 6));                           // 1 to 6, like a dice

// GiB -> TiB, rounded to 2 decimals
const gib = 68096;
console.log(Math.round(gib / 1024 * 100) / 100, "TiB");    // 66.5 TiB
```

### Big numbers: ids are strings

MDN: [Number.MAX_SAFE_INTEGER](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER)

A `number` holds whole numbers exactly only up to 2<sup>53</sup> - 1
(`Number.MAX_SAFE_INTEGER`, about 9 * 10<sup>15</sup>). A longer id in a JSON file
is **rounded** when it is read as a number:

```js run
console.log(Number.MAX_SAFE_INTEGER);                     // 9007199254740991
console.log(JSON.parse('{"id": 12345678901234567890}').id);   // 12345678901234567000 - changed!
console.log(JSON.parse('{"id": "12345678901234567890"}').id); // the string stays exact

// BigInt (ES2020): whole numbers of any size - add n
console.log(12345678901234567890n + 1n);                  // 12345678901234567891n
```

Treat ids, serials and long codes as **strings** - even when they contain only
digits. Never `Number(...)` them. (Millisecond timestamps like `1791770402000`
are far below the limit - they are safe.)

## 10. Dates

MDN: [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)

A `Date` is one moment in time, stored as the number of **milliseconds** since the
start of 1970 (UTC) - the *EPOCH*. Everything else - year, month, hour, time zone -
is calculated from that number.

```js run
const now = new Date();              // the moment the code runs
console.log(now.getTime());          // milliseconds since 1970-01-01T00:00:00Z
console.log(Date.now());             // the same number, without a Date object
console.log(now.toISOString());      // the same moment as text, in UTC
```

### EPOCH seconds and milliseconds

Reports send timestamps as numbers - or as strings of digits. Some count
**seconds**, some **milliseconds**:

```js run
const seconds = doc.status.epoch;                     // "1791770402" - 10 digits: seconds
const reported = new Date(Number(seconds) * 1000);    // a Date needs milliseconds
console.log(reported.toISOString());                  // 2026-10-12T02:00:02.000Z

const ms = 1791829523000;                             // 13 digits: milliseconds
console.log(new Date(ms).toISOString());              // 2026-10-12T18:25:23.000Z

// a helper that accepts both: a number below 10^12 is in seconds
function fromEpoch(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    return new Date(n < 1e12 ? n * 1000 : n);
}
console.log(fromEpoch("1791770402").toISOString(), fromEpoch(1791829523000).toISOString());
```

### Creating a date

```js run
// from the parts, in UTC - months start at 0!
const d1 = new Date(Date.UTC(2026, 9, 12, 18, 25, 23));    // 9 = October
console.log(d1.toISOString());                             // 2026-10-12T18:25:23.000Z

// from an ISO string
console.log(new Date("2026-10-12T18:25:23Z").toISOString());    // Z = UTC
console.log(new Date("2026-10-12").toISOString());              // a date only: UTC midnight
```

### Reading the parts

The `getUTC...` methods give the parts in UTC; the methods without `UTC` give them
in the **local** time zone of the computer that runs the code:

```js run
const d = new Date(Date.UTC(2026, 9, 12, 18, 25, 23));

console.log(d.getUTCFullYear());      // 2026
console.log(d.getUTCMonth());         // 9  - October (0 = January!)
console.log(d.getUTCDate());          // 12 - the day of the month
console.log(d.getUTCDay());           // 1  - Monday (0 = Sunday)
console.log(d.getUTCHours());         // 18
console.log(d.getHours());            // 21 in Bulgaria (UTC+3 in October) - depends on where it runs
```

`getMonth()` from 0 to 11 and `getDay()` from 0 (Sunday) to 6 are a classic source of
bugs: `getMonth() + 1` for a month number.

### Time zones

The same moment is a different clock time in Sofia, in London and in UTC. Servers
and reports should use **UTC** (`Z` at the end of an ISO string); show local time
only to people:

```js run
const d = new Date("2026-10-12T02:00:02Z");
console.log(d.toISOString());                         // 2026-10-12T02:00:02.000Z - always UTC
console.log(d.toLocaleString("en-GB", { timeZone: "Europe/Sofia" }));   // 12/10/2026, 05:00:02
console.log(d.toLocaleString("en-US", { timeZone: "UTC" }));            // 10/12/2026, 2:00:02 AM
console.log(new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" }).format(d));   // 12 Oct 2026
```

### Parsing the date formats of real reports

MDN: [Date time string format](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date#date_time_string_format), [Date.parse()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse)

Only one string format is defined by the language: **ISO 8601** (`2026-10-12`,
`2026-10-12T18:25:23Z`). Everything else is up to the engine - and the formats of
real exports are not ISO:

```js run
// ISO: well defined
console.log(new Date("2025-11-20").toISOString());              // 2025-11-20T00:00:00.000Z - UTC
// ISO date + time WITHOUT Z or offset: LOCAL time (the result depends on the time zone)
console.log(new Date("2025-11-20T10:00:00").toISOString());

// not ISO: the engine guesses - or fails
console.log(String(new Date("12-10-2026 18:25:23")));           // 12 October? V8 reads it as December 10!
console.log(String(new Date("2026-10-12-12.56.04.000000")));    // Invalid Date
```

`"12-10-2026"` - is that 12 October (day-month-year, as in Europe) or 10 December
(month-day-year, as in the USA)? V8 guesses month-day-year; other engines may
refuse the string. **Never** let `new Date(text)` guess a non-ISO format. Read the
parts with a regular expression, and build the date with `Date.UTC`:

```js run
// "12-10-2026 18:25:23" - day-month-year (the "Last Check" label of the example document)
function parseDayMonthYear(text) {
    const m = /^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2}):(\d{2})$/.exec(String(text ?? "").trim());
    if (!m) return null;
    const [, day, month, year, h, min, s] = m.map(Number);
    return new Date(Date.UTC(year, month - 1, day, h, min, s));
}

// "2026-10-12-12.56.04.000000" - year-month-day-hour.minute.second.microseconds
function parseStamp(text) {
    const m = /^(\d{4})-(\d{2})-(\d{2})-(\d{2})\.(\d{2})\.(\d{2})/.exec(String(text ?? "").trim());
    if (!m) return null;
    const [, year, month, day, h, min, s] = m.map(Number);
    return new Date(Date.UTC(year, month - 1, day, h, min, s));
}

console.log(parseDayMonthYear(doc.inventory.labels["Last Check"]).toISOString());   // 2026-10-12T18:25:23.000Z
console.log(parseStamp("2026-10-12-12.56.04.000000").toISOString());                 // 2026-10-12T12:56:04.000Z
console.log(parseDayMonthYear("2026-10-12"));                                        // null - not this format
```

(These helpers assume the times are UTC. If a format is in local time, the report
must say which time zone - ask the people who produce the data.)

### Is it a valid date?

An invalid date does not throw - it is an "Invalid Date" whose time is `NaN`:

```js run
const bad = new Date("not a date");
console.log(String(bad));                       // Invalid Date
console.log(bad.getTime());                     // NaN
console.log(Number.isNaN(bad.getTime()));       // true - the check

function isValidDate(d) {
    return d instanceof Date && !Number.isNaN(d.getTime());
}
console.log(isValidDate(new Date("2025-11-20")), isValidDate(bad), isValidDate(null));   // true false false
```

`bad.toISOString()` **does** throw a `RangeError` - check before you format.

### Comparing and subtracting

Two dates compare with `<` and `>`, and subtracting them gives **milliseconds**:

```js run
const installed = new Date("2025-11-20");
const reported = new Date(Number(doc.status.epoch) * 1000);

console.log(installed < reported);                       // true
const ms = reported - installed;
console.log(ms);                                         // milliseconds
console.log(Math.floor(ms / 86_400_000), "days");        // 326 days (1000 * 60 * 60 * 24 ms in a day)

// equal moments: compare the numbers - two Date objects are never === (lecture 6)
const a = new Date("2026-01-01"), b = new Date("2026-01-01");
console.log(a === b, a.getTime() === b.getTime());       // false true

// add 30 days
const due = new Date(installed.getTime() + 30 * 86_400_000);
console.log(due.toISOString().slice(0, 10));             // 2025-12-20
```

An old example - the age of a person from the date of birth (careful: the birthday
of this year may not have come yet):

```js run
function calcAge(birthDate, today = new Date()) {
    let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
    const hadBirthday = today.getUTCMonth() > birthDate.getUTCMonth()
        || (today.getUTCMonth() === birthDate.getUTCMonth() && today.getUTCDate() >= birthDate.getUTCDate());
    if (!hadBirthday) age--;
    return age;
}
console.log(calcAge(new Date("1990-12-31"), new Date("2026-10-12")));   // 35
console.log(calcAge(new Date("1990-01-15"), new Date("2026-10-12")));   // 36
```

And one more old example - timing code (lecture 7 used `console.time`):

```js run
const start = Date.now();
let total = 0;
for (let i = 0; i < 1_000_000; i++) total += i;
console.log(`took ${Date.now() - start} ms`, total);
```

::: info Temporal - the next date API
`Date` has many problems: months from 0, local time by default, unreliable
parsing. **Temporal** is a new, much better date and time API that is arriving in
JavaScript engines (2025 - 2026). It is not in Node.js 24 yet - for rules, use
`Date` with the care shown here.
:::

## 11. Reading existing rules

First, run the rule from the start of the lecture:

```js run
function emit(id, details) {          // fake: prints instead of creating an alert
    console.log("ALERT for " + id + ": " + JSON.stringify(details));
}

const MODELS = ["XR-210", "XR-220"];
const RECOMMENDED = "4.2.2";
const MAX_MODULE_AGE_DAYS = 300;

function normalizeVersion(text) {
    const s = String(text ?? "").trim();
    const dotted = s.match(/\d+(?:\.\d+)+/);
    if (dotted) return dotted[0];
    const packed = s.match(/^(\d)(\d)(\d)(\d\d)-[A-Z]\d\d$/);
    if (packed) return packed.slice(1).map(Number).join(".");
    return "";
}

function compareVersions(a, b) {
    const pa = String(a ?? "").split(".").map(x => parseInt(x, 10) || 0);
    const pb = String(b ?? "").split(".").map(x => parseInt(x, 10) || 0);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const x = pa[i] ?? 0, y = pb[i] ?? 0;
        if (x !== y) return x < y ? -1 : 1;
    }
    return 0;
}

function daysBetween(from, to) {
    return Math.floor((to - from) / 86_400_000);
}

function rule(doc) {
    const model = String(doc.overview?.model ?? "").trim().toUpperCase();
    if (!MODELS.includes(model)) return;

    const version = normalizeVersion(doc.inventory?.details?.firmware_level);
    if (version === "" || compareVersions(version, RECOMMENDED) >= 0) return;

    const reported = new Date(Number(doc.status?.epoch) * 1000);

    const oldModules = [];
    for (const [key, m] of Object.entries(doc.inventory?.modules ?? {})) {
        const match = /^(\d+)_(\d+\.\d+)$/.exec(key);
        if (!match) continue;
        const age = daysBetween(new Date(m.installed), reported);
        if (age > MAX_MODULE_AGE_DAYS) oldModules.push(`${match[1]} v${match[2]} (${age} days)`);
    }

    emit(doc.status.device_alias, {
        "Model": model,
        "Version": version,
        "Recommended": RECOMMENDED,
        "Report date": reported.toISOString().slice(0, 10),
        "Old modules": oldModules.join(", ") || "none"
    });
}

console.log("example JSON document:");
rule(doc);

console.log("a second report:");
rule({
    overview: { model: " xr-210" },
    status: { device_alias: "LAB-DEV-06", epoch: "1791770402" },
    inventory: {
        details: { firmware_level: "42107-C00" },
        modules: { "31_2.00": { status: "OK", installed: "2026-09-01" } }
    }
});
```

Here is a rule in an older style that does the same work - with `indexOf`,
`substring`, `new Date(text)` and string comparisons:

```js run
function emit(id, details) {
    console.log("ALERT for " + id + ": " + JSON.stringify(details));
}

function rule(doc) {  // never change this line
    try {
        var model = doc.overview.model.toUpperCase();
        if (model != "XR-210" && model != "XR-220") return;

        var level = doc.inventory.details.firmware_level;
        var version = level.indexOf(" ") != -1 ? level.substring(0, level.indexOf(" ")) : level;
        if (version >= "4.2.2") return;

        var reported = new Date(doc.status.epoch * 1000);
        var old = [];
        for (var key in doc.inventory.modules) {
            var m = doc.inventory.modules[key];
            var age = parseInt((reported - new Date(m.installed)) / (1000 * 60 * 60 * 24));
            if (age > 300) old.push(key.replace("_", " v") + " (" + age + " days)");
        }

        var month = reported.getMonth();
        var day = reported.getDate();
        emit(doc.status.device_alias, {
            "Model": model,
            "Version": version,
            "Recommended": "4.2.2",
            "Report date": reported.getFullYear() + "-" + (month < 10 ? "0" + month : month) + "-" + day,
            "Old modules": old.join(", ") || "none"
        });
    } catch (err) {
        return;
    }
}

console.log("example JSON document:");
rule(doc);

console.log("a second report:");
rule({
    overview: { model: " xr-210" },
    status: { device_alias: "LAB-DEV-06", epoch: "1791770402" },
    inventory: {
        details: { firmware_level: "42107-C00" },
        modules: { "31_2.00": { status: "OK", installed: "2026-09-01" } }
    }
});
console.log("(end)");
```

**Check yourself:**

1. The two rules give different "Report date" values for the example document.
   Which is right, and what are the two bugs in the old line?
2. `if (version >= "4.2.2") return;` - when does it give the wrong answer? Give two
   versions that are **newer** than 4.2.2 but still get an alert.
3. The second report gives an alert in the modern rule, none in the old one. Find
   the two reasons. (Look at the model and at the firmware level.)
4. `doc.status.epoch * 1000` works without `Number(...)`. Why? Would
   `doc.status.epoch + 1000` work too?
5. `parseInt((reported - installed) / (1000 * 60 * 60 * 24))` and
   `Math.floor(... / 86_400_000)` - do they give the same result? When could
   `parseInt` of a number surprise you?

::: details Answer
1. The modern `"2026-10-12"` is right. The old line uses `getMonth()` (0-11: October
   is 9, so it writes `09`) without `+ 1`, and the day without `padStart` (a day
   below 10 would be `5`, not `05`). It also uses local time (`getMonth`, `getDate`,
   `getFullYear`) - near midnight, the date depends on where the rule runs. The
   modern rule uses `toISOString()`: UTC, always two digits.
2. Strings are compared character by character (lecture 3). `"4.2.10" >= "4.2.2"` is
   `false` (`"1"` < `"2"` at position 4), and `"10.1.0" >= "4.2.2"` is `false` too
   (`"1"` < `"4"` at position 0) - so both newer versions get an alert. Compare
   versions as numbers, part by part (`compareVersions`).
3. The model `" xr-210"` has a space: the old rule upper-cases but does not `trim`,
   so `" XR-210"` is not in the list - no alert. And `"42107-C00"` has no space:
   the old rule takes the whole string as the version and compares it as text with
   `"4.2.2"` (`"42107-C00" >= "4.2.2"`: `"2"` > `"."`, so `true` - it returns).
   `normalizeVersion` reads it as `4.2.1.7`.
4. `*` converts both sides to numbers (lecture 2), so `"1791770402" * 1000` is a
   number. `+` with a string **joins**: `"1791770402" + 1000` is
   `"17917704021000"` - a wrong date, by a factor of 10,000. Convert first, always.
5. Here yes - both drop the decimals of a positive number. But `parseInt` first
   turns its argument into a **string**: for very small or very large numbers that
   string is `"1e-7"` or `"1e+21"`, and `parseInt` reads only the `1`. Use
   `Math.floor` (or `Math.trunc`) for numbers; `parseInt` is for strings.
:::

## 12. Practice

In your copy of the Homework repository, first get the new tasks:

```bash
git pull upstream main
node 08-strings-regex-dates/practice/task1-predict.js
```

Each file explains the task at the top. Write your code between the `your code`
lines; the checks at the bottom print `OK` or `FAIL`.

| Task | File | What you do |
|------|------|-------------|
| 1 | `task1-predict.js` | Predict 20 results: string methods, `Number`, `Math`, regular expressions, dates |
| 2 | `task2-clean-text.js` | Clean and examine values: trim, case, empty words, ids, lines with `\r\n`, packed values |
| 3 | `task3-regex.js` | Write the patterns: a four-digit type, a module key, a dotted version, settings with `matchAll`, an id cleaned with `replace` |
| 4 | `task4-versions.js` | `normalizeVersion` for every format of the table in section 8, then sort and compare |
| 5 | `task5-dates.js` | EPOCH seconds and milliseconds, three date formats of real exports, days between, the age of a report |

## Summary

| Topic | Remember |
|-------|----------|
| Strings | Immutable - every method returns a new string; `String(x ?? "")` before calling methods |
| Methods | `trim`, `toLowerCase`, `includes` / `startsWith` / `endsWith`, `indexOf`, `slice`, `replace` / `replaceAll`, `padStart`, `split` |
| Older forms | `indexOf(...) !== -1`, `substring`, `substr` (deprecated), `charAt` - read them, write the modern form |
| Wrappers | `"a".toUpperCase()` works by boxing; never `new String` / `new Number` / `new Boolean` |
| Encoding | Characters are code points; UTF-8 in files (1-4 bytes); `length` counts code units; `\r\n` vs `\n` - split with `/\r?\n/` |
| Regex | `/pattern/flags`; `\d \w \s .`, `[...]`, `* + ? {n,m}`, `^ $ \b`, `( )`, `\|`; test it on regex101 |
| Methods with regex | `test` (true / false), `match` (groups or `null`), `matchAll` (all, with groups), `replace` (`$1`, a function), `split` |
| Flags | `g` all, `i` ignore case, `m` multiline; never `g` with `test` |
| Versions | Normalise every format to dotted numbers, then `compareVersions` - one helper in the library |
| Numbers | `Number("")` is 0; `Number.isNaN`, `Number.isFinite`; `toFixed` gives a string; long ids stay strings |
| `Math` | `round`, `floor`, `ceil`, `trunc`, `abs`, `min` / `max(...arr)`, `random` |
| Dates | Milliseconds since 1970 UTC; EPOCH seconds * 1000; months from 0; `toISOString()` for UTC text |
| Parsing dates | Only ISO is reliable; other formats: regex + `Date.UTC`; check `Number.isNaN(d.getTime())` |
| Date math | `b - a` gives ms; 1 day = 86,400,000 ms; compare with `<` or `getTime()` |

## Homework

1. `08-strings-regex-dates/homework.js` (in the homework repository): parse the
   firmware string of the records export, the age of every module of the
   dictionary report, and a report line with formatted numbers and dates.
2. The practice tasks you did not finish in class - recommended, as later tasks
   and the course project reuse them. Every check must print `OK`.
3. **Course project:** add `normalizeVersion` (for the formats of **your**
   product) and a date parser for its timestamp formats to `library.js`. Collect
   real examples of every format in a comment above each helper.
4. Optional: find every regular expression in your rules. Paste each into
   regex101 and write a one-line comment that says what it matches.

## Read more

- MDN: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String),
  [Regular expressions (guide)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions),
  [Regular expression syntax cheat sheet](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions/Cheatsheet),
  [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number),
  [Math](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math),
  [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date),
  [Standard built-in objects](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects)
- javascript.info: [Strings](https://javascript.info/string),
  [Regular expressions](https://javascript.info/regular-expressions),
  [Date and time](https://javascript.info/date),
  [Numbers](https://javascript.info/number),
  [Methods of primitives](https://javascript.info/primitives-methods)
- Tools: [regex101.com](https://regex101.com/) - test and explain patterns
- Encodings: [The Absolute Minimum Every Software Developer Must Know About Unicode](https://tonsky.me/blog/unicode/) (Nikita Prokopov)
- Old reading: [The Secret Life of JavaScript Primitives](https://javascriptweblog.wordpress.com/2010/09/27/the-secret-life-of-javascript-primitives/)

**Next session:** JSON, Node.js, modules and errors - read sample documents from
files, turn your `library.js` into a real module, handle errors without hiding
them, fetch JSON from a web API, and run a rule locally on a folder of reports.
