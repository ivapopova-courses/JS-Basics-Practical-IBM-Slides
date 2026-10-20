---
title: 6. Objects, deep paths and data shapes
---

# 6. Objects, deep paths and data shapes

<div class="lecture-meta">
  <span>Session 6</span><span>practice: <code>06-objects/</code> in the homework repository</span>
  <span><a href="../example-document"><code>doc</code>: the example JSON document</a></span>
</div>

**Today you will learn to:**

- create objects, and read, add, change and delete their properties - with a dot
  and with square brackets (keys like `"Firmware Version"` or `"12_4.20"`);
- check if a key exists with `in`, `hasOwnProperty` and `Object.hasOwn`;
- walk long paths in nested objects without a `TypeError`: the older `&&` chain,
  `?.` and `??`, and your own `get(doc, path, fallback)`;
- work with objects used as **dictionaries**: `Object.keys`, `Object.values`,
  `Object.entries`, `for...in` - and read the information hidden in the keys;
- recognise the same data in different shapes - a list, a dictionary, a flattened
  export - and convert between them;
- know the difference between a reference, a shallow copy and a deep copy
  (`structuredClone`);
- use spread, rest and destructuring;
- write methods and know what `this` is; create many objects of one kind with a
  factory function, a constructor and a `class`;
- build the details object of an alert, with its columns in a fixed order;
- read the object code of older rules: `new Object()`, `obj["key"] = ...`,
  `for...in` with `hasOwnProperty`, `a && a.b && a.b.c`.

Where this fits in the sample check rule - today's rule reads a **dictionary** of
modules and builds the details of the alert. The number in each comment is the
section of this lecture:

```js
const MODELS = ["XR-210", "XR-220"];

// 5. our own path helper - the first function of the course project
function get(obj, path, fallback) {
    const keys = Array.isArray(path) ? path : path.split(".");
    let cur = obj;
    for (const key of keys) {
        if (cur === undefined || cur === null) return fallback;
        cur = cur[key];                                 // 3. brackets: the key is in a variable
    }
    return cur ?? fallback;
}

// 6. a dictionary: the keys are ids, and each key carries information
function failedModules(modules) {
    const failed = [];
    for (const [key, module] of Object.entries(modules ?? {})) {
        const [number, version] = key.split("_");       // "47_1.07" -> "47", "1.07"
        if (module.status !== "OK") failed.push(`${number} (${version})`);
    }
    return failed;
}

function rule(doc) {          // the engine calls rule(doc) - keep this line
    const { model, serial_number: serial } = doc.overview ?? {};    // 9. destructuring
    if (!MODELS.includes(model)) return;

    const failed = failedModules(doc.inventory?.modules);          // 4. ?.
    if (failed.length === 0) return;

    // 12. the details of the alert: one key per column, in this order
    const details = {
        "Device": get(doc, "inventory.extended_info.json.data.system.name", "unknown"),
        "Model": model,
        "Serial": serial,
        "Firmware": doc.inventory.labels?.["Firmware Version"] ?? "",  // 3. a key with a space
        "Failed modules": failed.join(", ")
    };
    emit(get(doc, ["status", "device_alias"]), {
        details,                                                    // 2. shorthand property
        column_order: Object.keys(details)                          // 6, 12. the keys, in order
    });
}
```

- `get` is the first helper of the **course project**: the practice task 2 makes it
  robust, and your library grows from it in the next sessions.
- The example JSON document now has two new parts: `doc.inventory.modules` (a dictionary
  with keys like `"12_4.20"`) and `doc.inventory.labels` (keys with spaces). In
  [section 13](#_13-reading-existing-rules) you run this rule, and read an older
  rule that does the same work.

Everything in a report is an object: the report itself, every level of it, every
record in a list. Rules spend most of their lines reading objects - safely.

## 1. What is an object?

An **object** groups related data under one name. Each piece of data is a
**property**: a **key** (a name, a string) and a **value** (any type: a number, a
string, an array, another object, a function).

```js run
// one object: the data of one student
const student1 = {
    // properties: key: value
    firstName: "Pesho",
    surName: "Petrov",
    scores: [3, 4, 5],
    address: { town: "Sofia", zip: 1508 },
    // a method: a property whose value is a function (section 10)
    greet: function () {
        console.log(`Hello, I'm ${this.firstName}`);
    }
};

console.log(student1.surName);          // Petrov
console.log(student1.address.town);     // Sofia
student1.greet();                       // Hello, I'm Pesho
```

In classic object-oriented languages (Java, C#, C++) an object always joins data
(**properties**) and the actions on that data (**methods**):
`Object = { properties + methods }`. In JavaScript an object can also be **data
only**. Other languages call such a structure a *dictionary* (Python) or an
*associative array* (PHP, Perl):

```js run
const dictionary = {
    // a collection of key: value pairs: English -> German
    apple: "Apfel",
    banana: "Banane",
    orange: "Orange"
};
console.log(dictionary.banana);     // Banane
```

A JSON report is exactly this: objects of data, with objects and arrays inside.

### Objects and arrays

| | Array | Object |
|---|---|---|
| Values are found by | a number: the **index** | a name: the **key** |
| Written as | `["a", "b"]` | `{ x: "a", y: "b" }` |
| Order | the order of the elements is the data | keys have an order too, but you look them up by name |
| Typical use | a list of things of one kind | the parts of one thing; or a dictionary keyed by ids |

The old slides said "objects are not ordered". Today the language defines the
order of the keys: keys that look like whole numbers (`"2"`, `"10"`) come
**first, sorted**; all other keys follow in the order they were **created**. This
matters for the columns of an alert (section 12):

```js run
const o = { b: 1, "10": 2, a: 3, "2": 4, "12_4.20": 5 };
console.log(Object.keys(o));    // [ '2', '10', 'b', 'a', '12_4.20' ]
```

### An object in memory

Like an array, an object lives in the **heap**. The variable holds a **reference**
to it - an arrow. A property whose value is an object or an array holds another
arrow.

::: info Animation
**Variables in memory:** [6. Objects and references (advanced)](../animations/variablesInMemory.html#6){target="_blank"};
**Objects in memory:** [2. A deep path](../animations/objectsInMemory.html#2){target="_blank"}
:::

## 2. Creating an object

### The object literal - the preferred way

Write the `key: value` pairs in curly braces, separated by commas:

```text
const obj = {
    key1: value1,
    key2: value2,
    ...
};
```

```js run
// an empty object
const obj = {};

// an object with 4 properties
const car1 = {
    brand: "ford",
    year: 2016,
    color: "red",
    doors: 3,           // a trailing comma is allowed (since ES5)
};

console.log(obj, car1);
```

The old slides said "no comma after the last property". That rule is from
before ES5 (2009): a trailing comma is allowed today, and it makes long lists
easier to edit - the same as in arrays.

### When does a key need quotes?

A key is always a string. The quotes may be left out when the key is a valid
name (letters, digits, `_`, `$`, not starting with a digit). Otherwise they are
required:

```js run
const labels = {
    site: "Demo Lab",                   // a plain name: no quotes needed
    "Firmware Version": "4.2.1.7",      // a space
    "CHK-0132": "raised",               // a dash
    "12_4.20": "OK",                    // starts with a digit, has a dot
};
console.log(Object.keys(labels));
```

JSON always writes the quotes: `{ "site": "Demo Lab" }`. In JavaScript code both
forms work; many rules keep the quotes, because they copy keys from the JSON.

### Shorthand properties (ES6)

When a property should get the value of a variable **with the same name**, write
the name once:

```js run
const model = "XR-220";
const version = "4.2.1.7";

const older = { model: model, version: version };   // older style
const modern = { model, version };                  // the same object
console.log(older, modern);
```

### Computed keys (ES6)

A key in square brackets is **calculated**:

```js run
const checkId = "CHK-0211";
const raised = { [checkId]: "yes", ["count_" + 2]: 7 };
console.log(raised);        // { 'CHK-0211': 'yes', count_2: 7 }
```

### `new Object()` (advanced)

Older code creates an empty object with the global `Object`, then adds the
properties one by one:

```js run
var details = new Object();     // the same as {}
details["Model"] = "XR-220";
details["Version"] = "4.2.1.7";
console.log(details);
```

It works, but `{ ... }` is shorter and shows the whole object at once. Do not
mix it up with `new Developer(...)` - a call of a **constructor**
([section 11](#_11-many-objects-of-one-kind)).

## 3. Reading and writing properties

### The dot

When you know the name of the key when you write the code:

```text
object.key
```

```js run
const developer1 = {
    firstName: "Ivan",
    surName: "Ivanov",
    skills: ["HTML", "CSS", "JavaScript"]
};

console.log(developer1.firstName);      // Ivan
console.log(developer1.skills);         // [ 'HTML', 'CSS', 'JavaScript' ]
console.log(developer1.skills[0]);      // HTML

developer1.firstName = "Stoyan";        // change a property
console.log(developer1.firstName);      // Stoyan
```

What you write after the dot is taken **literally** as the name of the key.

### Square brackets

When the key is in a **variable**, is calculated, or is not a valid name:

```text
object[expression]
```

```js run
const prices = {
    apples: 2.50,
    oranges: 3.45,
    bananas: 2.80
};

// the name of the key is in a variable:
const fruitName = "apples";
console.log(prices[fruitName]);     // 2.5

// when you know the name, these two are the same - prefer the dot:
console.log(prices["apples"]);      // 2.5
console.log(prices.apples);         // 2.5

// but these two are NOT the same:
console.log(prices.fruitName);      // undefined - looks for a key named "fruitName"
```

On the report - keys with spaces, dashes and dots need brackets:

```js run
console.log(doc.inventory.labels["Firmware Version"]);     // 4.2.1.7
console.log(doc.alerts["CHK-0132"].raised);   // yes
console.log(doc.inventory.modules["12_4.20"].status);      // OK
// doc.inventory.modules.12_4.20 would be a SyntaxError
```

::: info Animation
**Objects in memory:** [1. Dot or brackets](../animations/objectsInMemory.html#1){target="_blank"}
:::

### A missing key, adding, deleting

- Reading a key that does not exist gives `undefined` - **no error**.
- Writing to a key that does not exist **creates** it.
- `delete obj.key` removes a property.

```js run
const enc = { id: "ENC-01", state: "normal" };

console.log(enc.firmware);      // undefined - no such key
enc.firmware = "2.14";          // a new property
enc.state = "degraded";         // a changed property
delete enc.id;                  // a removed property
console.log(enc);               // { state: 'degraded', firmware: '2.14' }

enc.sate = "failed";            // a typo: no error, a new key "sate"!
console.log(enc);
```

The last line is a common bug: a typo in a key **creates** a property instead of
changing one. `// @ts-check` (session 10) can catch it.

### Does the key exist?

`obj.key === undefined` cannot tell "missing" from "there, with the value
undefined". Three ways to ask "is the key there?":

| Check | Looks at | Note |
|---|---|---|
| `"key" in obj` | the object **and** what it inherits | `"toString" in {}` is `true`! |
| `obj.hasOwnProperty("key")` | only the object's own keys | older rules; fails for objects without a prototype |
| `Object.hasOwn(obj, "key")` | only the object's own keys | the modern form (ES2022 - check that your rule engine supports it) |

```js run
const details = doc.inventory.details;

console.log("bandwidth" in details, details.bandwidth);    // true  - there, but empty: ""
console.log("cpu" in details, details.cpu);                // false undefined
console.log(details.hasOwnProperty("locale"));             // true
console.log(Object.hasOwn(details, "locale"));             // true

console.log("toString" in details);                        // true  - inherited from Object
console.log(Object.hasOwn(details, "toString"));           // false
```

For report data, "is the value usable?" is usually the better question: a key
can be there with `""`, `null` or `"unknown"` in it. Check the value, not only the
key.

## 4. Nested objects and long paths

A report is objects inside objects. A long path is read **one dot at a time**,
from left to right; every dot follows an arrow one level down.

```js run
const name = doc.inventory.extended_info.json.data.system.name;
console.log(name);      // LAB-DEV-01

// the same, step by step
const info = doc.inventory.extended_info;
const system = info.json.data.system;
console.log(system.name);
```

### A missing level

A missing **key** gives `undefined`. One step further - a key of `undefined` - is a
`TypeError`, and the rule stops:

```js run
console.log(doc.status.device_alias);   // D7F3A9C21E40B815
console.log(doc.health);                // undefined - no such key

try {
    console.log(doc.health.state);      // a key of undefined
} catch (err) {
    console.log(err.name + ": " + err.message);
}
```

::: info Animation
**Objects in memory:** [2. A deep path](../animations/objectsInMemory.html#2){target="_blank"}
:::

### The older way: the `&&` chain

Older rules check every level with `&&`. It stops at the first falsy value and
returns it (lecture 3):

```js run
var info = doc.inventory.extended_info;
var name = info && info.json && info.json.data && info.json.data.system
           && info.json.data.system.name;
console.log(name);      // LAB-DEV-01

var health = doc.health && doc.health.state;
console.log(health);    // undefined - stopped at doc.health
```

It works, but the path is written again and again, and `&&` also stops at `0`
and `""` - values that can be real data.

### Optional chaining `?.` and `??` (ES2020)

`a?.b` means: "if `a` is `undefined` or `null`, stop here and give `undefined`;
otherwise read `a.b`". It works with brackets and calls too: `a?.[key]`,
`f?.()`.

```js run
console.log(doc.health?.state);                                     // undefined, no error
console.log(doc.inventory?.extended_info?.json?.data?.system?.name); // LAB-DEV-01
console.log(doc.inventory.labels?.["Last Check"]);                   // 12-10-2026 18:25:23
console.log(doc.inventory.modules?.["99_1.00"]?.status);             // undefined

// with a fallback: ?? replaces only undefined and null
const state = doc.health?.state ?? "unknown";
console.log(state);     // unknown
```

::: info Animation
**Objects in memory:** [3. Safe access: `?.` and `??`](../animations/objectsInMemory.html#3){target="_blank"}
:::

::: tip Where to put the `?.`
Put `?.` after each level that **may be missing** in real reports - not
everywhere "just in case". `doc.overview?.model` says "a report can come without
an overview". Too many `?.` hide real bugs: if `overview` must be there, a
`TypeError` is the right signal.
:::

### Arrays inside objects

Paths go through arrays too - with an index:

```js run
console.log(doc.inventory.enclosures[2].state);         // degraded
console.log(doc.inventory.enclosures.at(-1).id);        // ENC-04
console.log(doc.inventory.enclosures[9]?.id);           // undefined - no 10th element
console.log(doc.inventory.features?.[0]);               // dedup
```

## 5. A helper for paths: `get(doc, path, fallback)`

`?.` is written in the code. Sometimes the path comes from **data** - a list of
paths to check, a setting, a column definition. And long paths with `?.` after
every key are hard to read. A helper walks any path:

```js run
function get(obj, path, fallback) {
    let cur = obj;
    for (const key of path) {
        if (cur === undefined || cur === null) return fallback;
        cur = cur[key];             // one level down
    }
    return cur ?? fallback;
}

console.log(get(doc, ["inventory", "extended_info", "json", "data", "system", "name"], "?"));
console.log(get(doc, ["inventory", "modules", "12_4.20", "status"], "?"));   // a key with a dot
console.log(get(doc, ["inventory", "enclosures", 2, "state"], "?"));        // an index
console.log(get(doc, ["health", "state"], "unknown"));                      // a missing level
```

`cur` starts at the top and moves one key down in every round. Before each step
it checks that there is something to step into - so a missing level gives the
fallback, never a `TypeError`.

::: info Animation
**Objects in memory:** [5. A path helper: `get`](../animations/objectsInMemory.html#5){target="_blank"}
:::

### A string path, or an array?

A path as a string is easier to write: `"inventory.details.locale"`. `split(".")`
turns it into an array. But a key that **contains a dot** is then cut in two:

```js run
console.log("inventory.details.locale".split("."));
// [ 'inventory', 'details', 'locale' ]  - fine

console.log("inventory.modules.12_4.20.status".split("."));
// [ 'inventory', 'modules', '12_4', '20', 'status' ]  - the key "12_4.20" is broken
```

So the helper accepts **both**: a string for simple paths, an array when a key has
a dot (the sample rule at the top does this). That is practice task 2 - with all
the edge cases: `0`, `""` and `false` are real values and must not become the
fallback; `null` in the middle of the path; an index into an array.

::: tip `cur == null`
Some helpers write `if (cur == null)`. With `==`, `null` and `undefined` are equal
to each other and to nothing else, so `cur == null` is a short form of
`cur === undefined || cur === null` - the one common use of `==`.
:::

### Recursion (advanced)

Lecture 5 promised a function that finds a key at **any** level. It calls itself
for every inner object - a natural fit for nested data of unknown depth:

```js run
// all paths in obj that end with the key `wanted`
function findKey(obj, wanted, path = []) {
    const found = [];
    for (const [key, value] of Object.entries(obj)) {
        const here = [...path, key];
        if (key === wanted) found.push(here.join("."));
        if (value !== null && typeof value === "object") {
            found.push(...findKey(value, wanted, here));     // one level deeper
        }
    }
    return found;
}

console.log(findKey(doc, "device_alias"));
// [ 'status.device_alias', 'inventory.device_alias', 'inventory.details.device_alias' ]
console.log(findKey(doc, "state"));
```

Useful to explore a new report: "where in this document is the serial?".

## 6. Objects as dictionaries

In many reports the keys of an object are not fixed names like `model` - they are
**ids**: of modules, drives, checks, slots. You do not know them when you write
the rule. Such an object is used as a **dictionary**:

```js run
console.log(doc.inventory.modules);
// { '12_4.20': {...}, '12_4.08': {...}, '47_1.07': {...} }
console.log(doc.alerts);
// { 'CHK-0132': { raised: 'yes' } }
```

To work with a dictionary you need its keys, its values, or both:

| Method | Returns | Example result |
|---|---|---|
| `Object.keys(obj)` | an array of the keys | `[ '12_4.20', '12_4.08', '47_1.07' ]` |
| `Object.values(obj)` | an array of the values | `[ {...}, {...}, {...} ]` |
| `Object.entries(obj)` | an array of `[key, value]` pairs | `[ [ '12_4.20', {...} ], ... ]` |

```js run
const modules = doc.inventory.modules;

console.log(Object.keys(modules));
console.log(Object.keys(modules).length);       // 3 - the number of modules

for (const m of Object.values(modules)) {
    console.log(m.status, m.installed);
}

for (const [key, m] of Object.entries(modules)) {
    console.log(key, "->", m.status);
}
```

`for (const [key, m] of ...)` takes the two parts of each pair into two
variables - *destructuring*, [section 9](#_9-spread-rest-and-destructuring).

::: info Animation
**Objects in memory:** [4. A dictionary](../animations/objectsInMemory.html#4){target="_blank"}
:::

### Information in the key

The key `"12_4.20"` **is** data: module number 12, version 4.20. The values do not
repeat it. Take the key apart with `split`:

```js run
for (const [key, m] of Object.entries(doc.inventory.modules)) {
    const [number, version] = key.split("_");
    console.log(`module ${number}, version ${version}: ${m.status}`);
}
```

Real exports also have keys like `"347_v2.12"` or `"drive_f01_r02"`. Check the
shape before you split: `key.includes("_")`, the number of parts. A regular
expression (session 8) can read such keys more strictly.

### The older loop: `for...in`

Older rules walk the keys with `for...in`:

```js run
var modules = doc.inventory.modules;
for (var key in modules) {
    if (!modules.hasOwnProperty(key)) continue;     // skip inherited keys
    var m = modules[key] || {};
    console.log(key, m.status);
}
```

`for...in` walks the object's **own and inherited** enumerable keys, so older code
always adds the `hasOwnProperty` check. For plain JSON objects there is nothing
inherited, but the check does no harm. The modern form,
`for (const [key, m] of Object.entries(modules))`, takes only the own keys and gives
key and value together. Remember from lecture 4: `for...in` is for objects, not
for arrays.

### Building a dictionary: counting and grouping

An object is the natural place to **count** or **group** things by a key:

```js run
// count the enclosures per state
const counts = {};
for (const enc of doc.inventory.enclosures) {
    counts[enc.state] = (counts[enc.state] ?? 0) + 1;
}
console.log(counts);        // { normal: 3, degraded: 1 }

// group the enclosure ids per type
const byType = {};
for (const enc of doc.inventory.enclosures) {
    if (!byType[enc.type]) byType[enc.type] = [];   // first time: an empty list
    byType[enc.type].push(enc.id);
}
console.log(byType);        // { 'SSD-24': [ 'ENC-01', 'ENC-02' ], 'HDD-12': [ 'ENC-03', 'ENC-04' ] }
```

`counts[enc.state]` uses brackets: the key is in a variable. The first time a state
is seen, `counts[enc.state]` is `undefined`, and `?? 0` starts the count. Grouping
a long list of records once, and then reading the groups by key, is the topic of
session 7 (`Object.groupBy`, `Map`).

### From pairs back to an object (ES2019)

`Object.fromEntries` is the opposite of `Object.entries`: it builds an object from
`[key, value]` pairs. Together they transform a dictionary:

```js run
// the status of every module, keyed by module id
const pairs = Object.entries(doc.inventory.modules).map(([key, m]) => [key, m.status]);
console.log(Object.fromEntries(pairs));
// { '12_4.20': 'OK', '12_4.08': 'OK', '47_1.07': 'FAILED' }
```

(`.map` with an arrow function builds a new array from every pair - session 7.)

## 7. The same data in different shapes

Your reports describe the same kind of thing - a list of modules, of drives, of
disks - in different **shapes**. A helper written for one shape fails on the other
silently. Learn to recognise them:

```js run
// 1. a list of records (an array of objects)
const asList = [
    { id: "12_4.20", status: "OK" },
    { id: "47_1.07", status: "FAILED" }
];

// 2. a dictionary keyed by id (an object of objects)
const asDictionary = {
    "12_4.20": { status: "OK" },
    "47_1.07": { status: "FAILED" }
};

// 3. a flattened export: every leaf is "path.to.key": [values]
const asFields = {
    "modules.id": ["12_4.20", "47_1.07"],
    "modules.status": ["OK", "FAILED"]
};

console.log(asList[1].status, asDictionary["47_1.07"].status, asFields["modules.status"][1]);
// FAILED FAILED FAILED
```

| Shape | Find one item | Walk all items | Note |
|---|---|---|---|
| list of records | a loop with a condition (lecture 4) | `for...of` | the usual JSON array |
| dictionary by id | `obj[id]` - direct | `Object.entries` | the id is the key, not a field |
| flattened fields | the same index in every list | an index `i` over the lists | keys are whole paths with dots; values are always arrays |

### Converting between the shapes

Convert to the shape your helper expects - **once**, at the start:

```js run
const asDictionary = {
    "12_4.20": { status: "OK" },
    "47_1.07": { status: "FAILED" }
};

// dictionary -> list: put the key into the record
const list = [];
for (const [id, m] of Object.entries(asDictionary)) {
    list.push({ id, ...m });            // { id: "12_4.20", status: "OK" }
}
console.log(list);

// list -> dictionary: the id becomes the key
const dict = {};
for (const item of list) {
    dict[item.id] = item;
}
console.log(Object.keys(dict));
```

### A flattened export

Some exports flatten the whole document: every key is the **full path** with
dots, and every value is an **array** - even when there is only one value. Lists of
records are split into one array per field. The homework folder has one,
`data/report-export.json` (the `fields` part):

```js run
// a small part of such an export
const fields = {
    "body.device_event.device_id": ["EDGE-77Q"],
    "body.device_event.software.version": ["3.8.1"],
    "body.payload.node_disks.node_name": ["node-01", "node-02", "node-03"],
    "body.payload.node_disks.percent_used": [21.6, 89.9, 0]
};

// one value: the key is the whole path; take element [0]
console.log(fields["body.device_event.software.version"]?.[0]);     // 3.8.1

// the records are split into parallel arrays - join them back by index
const names = fields["body.payload.node_disks.node_name"] ?? [];
const used = fields["body.payload.node_disks.percent_used"] ?? [];
for (let i = 0; i < names.length; i++) {
    console.log(names[i], used[i] + "%");
}
```

Here `get(fields, "body.device_event.device_id")` would **not** work: the dots are
part of **one** key, not steps between levels. Read it with brackets:
`fields["body.device_event.device_id"]`. Practice task 4 works with this shape.

### One record, or a list - again

The same field can be an object in one report and an array in another (one
enclosure vs many). Normalise first - `asList` from lecture 4 and 5:

```js run
function asList(value) {
    if (Array.isArray(value)) return value;
    if (value === undefined || value === null) return [];
    return [value];
}

console.log(asList({ id: "ENC-09" }).length, asList(doc.inventory.enclosures).length);  // 1 4
```

## 8. References and copies

### Primitives are copied, objects are shared (advanced)

The old slides showed how values are stored:

- **Primitive** values (number, string, boolean, ...) are stored **by value**. Copying
  a variable copies the value; the two variables are independent. Primitives
  cannot be changed - a "change" creates a new value (*immutable*).
- **Objects** (and arrays, functions) are stored **by reference**. The variable holds
  an arrow to the object in the heap; copying the variable copies the arrow. Objects
  **can** be changed (*mutable*).

```js run
// copy by value
let x = 5;
let y = x;          // y gets the value 5
x = 10;
console.log(x, y);  // 10 5 - y keeps its value

// copy by reference
const obj1 = { x: 1 };
const obj2 = obj1;  // obj2 gets the arrow to the SAME object
obj1.x = 2;
console.log(obj1.x, obj2.x);    // 2 2
```

`===` compares objects by reference: `{ x: 1 } === { x: 1 }` is `false` - two
different objects with the same content.

::: info Animations
**Variables in memory:** [2. Copying a value](../animations/variablesInMemory.html#2){target="_blank"},
[6. Objects and references (advanced)](../animations/variablesInMemory.html#6){target="_blank"};
**Functions and data:** [2. The same array](../animations/functionsAndData.html#2){target="_blank"} -
the same for parameters
:::

### Three kinds of "copy"

| Code | What you get | Shared with the original |
|---|---|---|
| `const b = a;` | the same object, a second name | everything |
| `const b = { ...a };` or `Object.assign({}, a)` | a new object, **shallow** copy | the nested objects and arrays |
| `const b = structuredClone(a);` | a new object, **deep** copy | nothing |

```js run
const enc = { id: "ENC-01", ports: ["P1"] };

const same = enc;
const shallow = { ...enc };
const deep = structuredClone(enc);

same.id = "ENC-09";             // changes enc
shallow.ports.push("P2");       // changes enc.ports - the array is shared
deep.ports.push("P3");          // changes only deep

console.log(enc);               // { id: 'ENC-09', ports: [ 'P1', 'P2' ] }
console.log(deep);              // { id: 'ENC-01', ports: [ 'P1', 'P3' ] }
```

::: info Animation
**Objects in memory:** [6. Copies](../animations/objectsInMemory.html#6){target="_blank"};
**Functions and data:** [7. A shallow copy (advanced)](../animations/functionsAndData.html#7){target="_blank"}
:::

::: warning `structuredClone` comes from the environment
`structuredClone` is not part of the JavaScript language itself: browsers and
Node.js 17+ provide it. Check that your rule engine has it. The older trick
`JSON.parse(JSON.stringify(obj))` also makes a deep copy of plain JSON data (it
drops functions and `undefined`, and turns dates into strings).
:::

### Do not change the report

Lecture 5 said: helpers must not change `doc`. With objects this is easy to break
by accident - `details.Model = ...` on an object that came from `doc`, `delete`
on a part of `doc`, `Object.assign(doc.overview, ...)`. Build **new** objects:

```js run
// wrong: changes the report
function withFallbackName(overview) {
    overview.name = overview.name ?? "unknown";
    return overview;
}

// right: a new object, the input is untouched
function withFallbackNamePure(overview) {
    return { ...overview, name: overview.name ?? "unknown" };
}

const before = JSON.stringify(doc.overview);
const result = withFallbackNamePure(doc.overview);
console.log(result.name, JSON.stringify(doc.overview) === before);   // unknown true
```

`Object.freeze(obj)` makes an object read-only (one level deep) - a way to make
sure, in tests, that nothing writes into it.

## 9. Spread, rest and destructuring

ES6 added three short forms with `...` and `[ ]` / `{ }` on the **left** side of an
assignment. You meet them in every modern codebase.

### Spread `...` - pour out the elements

```js run
function foo(a, b, c) {
    console.log(`a=${a}, b=${b}, c=${c}`);
}
const arr = [1, 2, 3];

// in a call: the elements become separate arguments
foo(...arr);                        // a=1, b=2, c=3
console.log(Math.max(...arr));      // 3
// the older way: foo.apply(null, arr)

// in an array literal: a new array
const str = "abc";
console.log([...arr, 9]);           // [ 1, 2, 3, 9 ]
console.log([9, ...arr]);           // [ 9, 1, 2, 3 ]
console.log([...arr, ...str]);      // [ 1, 2, 3, 'a', 'b', 'c' ]

// in an object literal (ES2018): a new object; later keys win
const defaults = { locale: "en_US", power_saving: "off" };
const settings = { ...defaults, power_saving: "on" };
console.log(settings);              // { locale: 'en_US', power_saving: 'on' }
```

Spread never changes the original - unlike `push`, `unshift` and `splice`.

An old example: flip one property and keep the rest:

```js run
const obj = { a: true, b: false };
const inverted = { ...obj, a: !obj.a };
console.log(inverted);      // { a: false, b: false }
```

### Rest `...` - collect the rest

The same three dots on the **receiving** side collect what is left into an array
(or an object). Lecture 5 showed rest parameters:

```js run
function foo(a, b, ...args) {
    console.log(a, b, args);        // 1 2 [ 3, 4, 5 ]
}
foo(1, 2, 3, 4, 5);

// a rest parameter must be the last one:
// function bar(a, ...args, b) {}  -> SyntaxError: Rest parameter must be last formal parameter

// it works in arrow functions, where `arguments` does not exist
const sum = (...numbers) => {
    let total = 0;
    for (const n of numbers) total += n;
    return total;
};
console.log(sum(1, 2, 3, 4));       // 10
```

### Array destructuring

Unpack the elements of an array into variables, by **position**:

```js run
const [a, b] = [1, 2];
console.log(`a = ${a}; b = ${b}`);          // a = 1; b = 2

// more elements than variables: the rest is ignored
const [first, second] = [1, 2, 3, 4, 5];
console.log(first, second);                 // 1 2

// with rest
const [head, ...rest] = [1, 2, 3];
console.log(head, rest);                    // 1 [ 2, 3 ]

// skip an element, give a default
const [major, , patch = "0"] = "4.2".split(".");
console.log(major, patch);                  // 4 0

// swap two variables without a temporary one
let x = 1, y = 2;
[x, y] = [y, x];
console.log(`x = ${x}; y = ${y}`);          // x = 2; y = 1
```

### Object destructuring

Unpack properties into variables, by **name**:

```js run
const { model, version } = doc.overview;
console.log(model, version);                // XR-220 4.2.1.7

// a different variable name, and a default value
const { serial_number: serial, site = "unknown" } = doc.overview;
console.log(serial, site);                  // SN4X7Q92 unknown

// nested
const { inventory: { details: { locale } } } = doc;
console.log(locale);                        // en_US

// rest: everything except some keys - a copy without them
const { device_alias, ...withoutAlias } = doc.status;
console.log(withoutAlias);                  // { epoch: '1791770402' }
```

When the variables already exist, wrap the assignment in round brackets
(otherwise `{` starts a block):

```js run
let p1, p2;
({ p1, p2 } = { p1: 1, p2: 2 });
console.log(p1, p2);        // 1 2
```

::: warning Destructuring a missing object
`const { model } = doc.overview;` throws a `TypeError` when `overview` is missing -
like `doc.overview.model`. Give a fallback object:
`const { model } = doc.overview ?? {};` - the sample rule does this.
:::

### Destructuring in parameters

A function that needs only some fields of a record can take them apart right in
the parameter list:

```js run
const userData = { id: 1, name: "Ada", age: 23 };

// instead of greet(name, age) called as greet(userData.name, userData.age):
function greet({ name, age }) {
    console.log(`Hello ${name}. You are ${age} years old!`);
}
greet(userData);

// on the report: the parameter documents which fields the helper uses
function describeEnclosure({ id, state, firmware = "?" }) {
    return `${id}: ${state}, firmware ${firmware}`;
}
for (const enc of doc.inventory.enclosures) console.log(describeEnclosure(enc));
```

(Destructuring in parameters is also very common in React components.)

## 10. Methods and `this`

A **method** is a property whose value is a function. Inside a method, `this` is
the object the method was called on - the object **before the dot**:

```js run
const student1 = {
    name: "Pesho",
    address: { town: "Sofia", zip: 1508 },
    scores: [3, 4, 5],
    greet: function () {
        console.log(`Hello, I'm ${this.name}. My max score is: ${this.findMaxScore()}`);
    },
    findMaxScore: function () {
        let maxScore = this.scores[0];
        for (const score of this.scores) {
            if (score > maxScore) maxScore = score;
        }
        return maxScore;
    }
};

student1.greet();       // Hello, I'm Pesho. My max score is: 5
```

You could write `student1.name` inside the methods instead of `this.name`, but then
the methods work only for this one object. With `this` they work for any object
they are attached to (section 11).

### The short method syntax (ES6)

```js run
const p1 = {
    name: "Pesho",
    greet() {                           // the same as greet: function () {...}
        console.log(`Hi, I'm ${this.name}`);
    }
};
p1.greet();     // Hi, I'm Pesho
```

### `this` is decided by the call

`this` is not fixed when the method is written. It is the object before the dot
**at the moment of the call**. Take the method out of the object, and `this` is
lost:

```js run
"use strict";
const device = {
    name: "LAB-DEV-01",
    describe() {
        return "Device " + this.name;
    }
};

console.log(device.describe());     // Device LAB-DEV-01

const f = device.describe;          // the function, without the object
try {
    console.log(f());               // no object before the dot: this is undefined
} catch (err) {
    console.log(err.name + ": " + err.message);
}

// passing a method as a callback has the same problem; wrap it in an arrow:
const later = () => device.describe();
console.log(later());               // Device LAB-DEV-01
```

::: info Animation
**Objects in memory:** [7. `this` in a method (advanced)](../animations/objectsInMemory.html#7){target="_blank"}
:::

Arrow functions have **no `this` of their own** (lecture 5): an arrow written as a
method sees the `this` of the code around the object, not the object. Write
methods with the short syntax or `function`, not as arrows.

### Methods in rules

Reports are **data**: JSON has no functions, so `doc` has no methods. Methods
appear in your own code - an object that groups helpers, like a small library:

```js run
const versions = {
    parts(v) {
        return String(v ?? "").split(".").map(x => parseInt(x, 10) || 0);
    },
    compare(a, b) {
        const pa = this.parts(a), pb = this.parts(b);
        for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
            const x = pa[i] ?? 0, y = pb[i] ?? 0;
            if (x !== y) return x < y ? -1 : 1;
        }
        return 0;
    },
    below(a, b) {
        return this.compare(a, b) < 0;
    }
};

console.log(versions.below("2.10", "2.14"), versions.compare("4.10", "4.2"));  // true 1
```

In session 9 the same idea becomes a **module** - a file that exports its helpers.

## 11. Many objects of one kind

Real programs often need many objects with the **same structure** - the same keys
and methods, different values.

### Literals - repeated code

```js run
const developer1 = {
    firstName: "Ivan",
    surName: "Ivanov",
    skills: ["HTML", "CSS", "JavaScript"],
    applyForJob: function () {
        console.log(`Hi, I'm ${this.firstName} ${this.surName}. My strongest skills are ${this.skills.join(", ")}.`);
    }
};

const developer2 = {
    firstName: "Maria",
    surName: "Mineva",
    skills: ["Python", "Machine Learning", "Data Science"],
    applyForJob: function () {
        console.log(`Hi, I'm ${this.firstName} ${this.surName}. My strongest skills are ${this.skills.join(", ")}.`);
    }
};

developer1.applyForJob();
developer2.applyForJob();
```

The keys and the method are written twice - and a typo in one copy gives two
objects with different shapes.

### A factory function

A function that **returns** a new object. Every object it makes has the same shape:

```js run
function developerFactory(firstName, surName, skills) {
    return {
        firstName,
        surName,
        skills,
        applyForJob() {
            console.log(`Hi, I'm ${this.firstName} ${this.surName}. My strongest skills are ${this.skills.join(", ")}.`);
        }
    };
}

const developer1 = developerFactory("Ivan", "Ivanov", ["HTML", "CSS", "JavaScript"]);
const developer2 = developerFactory("Maria", "Mineva", ["Python", "Machine Learning", "Data Science"]);
developer2.applyForJob();
```

Factory functions are the most useful form for rules: a helper that builds the
**details** of an alert, a record for a report, a normalised enclosure - plain data
objects, always with the same keys.

```js run
function problemRecord(enc, reason) {
    return { "Enclosure": enc.id, "Type": enc.type, "Problem": reason };
}

const problems = [];
for (const enc of doc.inventory.enclosures) {
    if (enc.state !== "normal") problems.push(problemRecord(enc, enc.state));
}
console.log(problems);
```

### A constructor function

Before classes, JavaScript made objects of one kind with a **constructor**: a
function called with `new`. `new` creates an empty object, runs the function with
`this` = that object, and returns it. By convention the name starts with a capital
letter:

```js run
function Developer(firstName, surName, skills) {
    this.firstName = firstName;
    this.surName = surName;
    this.skills = skills;
    this.applyForJob = function () {
        console.log(`Hi, I'm ${this.firstName} ${this.surName}.`);
    };
}

const developer1 = new Developer("Ivan", "Ivanov", ["HTML", "CSS", "JavaScript"]);
developer1.applyForJob();
console.log(developer1 instanceof Developer);       // true
```

Forget the `new`, and `this` is not a new object - in strict mode the call fails,
in older code it writes into the global object. Classes (below) refuse to be called
without `new`.

### The class syntax (ES6)

A `class` writes the same thing in the form of other object-oriented languages:

```js run
class Developer {
    constructor(firstName, surName, skills) {
        this.firstName = firstName;
        this.surName = surName;
        this.skills = skills;
    }

    applyForJob() {
        console.log(`Hi, I'm ${this.firstName} ${this.surName}. My strongest skills are ${this.skills.join(", ")}.`);
    }
}

const developer1 = new Developer("Ivan", "Ivanov", ["HTML", "CSS", "JavaScript"]);
const developer2 = new Developer("Maria", "Mineva", ["Python", "Machine Learning", "Data Science"]);
developer1.applyForJob();
developer2.applyForJob();
```

- `constructor` runs automatically on `new`; there is only one per class.
- Methods are written with the short syntax; they are **shared** by all objects of
  the class (stored once, in the class's *prototype*), not copied into each object.
- The code inside a class is always in strict mode.
- A class can also be written as an expression: `const Developer = class { ... };`.

### Static members, fields, getters and setters (advanced)

```js run
class Person {
    static count = 0;           // a static field: belongs to the class (ES2022)
    name = "Anonymous";         // a field with a default value (ES2022)
    age;

    constructor(name, age) {
        if (name !== undefined) this.name = name;
        this.age = age;
        Person.count += 1;
    }

    static created() {          // a static method: Person.created(), not p1.created()
        return `${Person.count} objects were created.`;
    }

    get label() {               // a getter: read like a property, p1.label
        return `${this.name} (${this.age ?? "?"})`;
    }

    set label(text) {           // a setter: runs on p1.label = "..."
        [this.name] = text.split(" (");
    }

    greet() {
        console.log(`I'm ${this.name}, ${this.age} years old.`);
    }
}

const p1 = new Person("Pesho", 23);
const p2 = new Person();
p1.greet();                     // I'm Pesho, 23 years old.
p2.greet();                     // I'm Anonymous, undefined years old.
console.log(Person.created());  // 2 objects were created.
console.log(p1.label);          // Pesho (23)
p1.label = "Peter (30)";
console.log(p1.name);           // Peter
```

Class fields and `static` fields are ES2022 - check that your rule engine supports
them. (Before ES2022, the old slides wrote `Person.count = 0;` after the class.)

### Inheritance: `extends` and `super`

A class can **extend** another one: it gets all its methods and adds or changes
some. `super(...)` calls the parent's constructor (before any use of `this`);
`super.method()` calls the parent's version of a method:

```js run
class Person {
    constructor(name, age) {
        this.name = name;
        this.age = age;
    }
    greet() {
        console.log(`I'm ${this.name}, ${this.age} years old.`);
    }
}

class Developer extends Person {
    constructor(name, age, skills) {
        super(name, age);           // the parent constructor
        this.skills = skills;
    }
    greet() {
        super.greet();              // the parent greet()
        console.log(`My skills are: ${this.skills.join(", ")}`);
    }
}

const dev1 = new Developer("Pesho", 23, ["JS", "React", "Vue"]);
dev1.greet();
console.log(dev1 instanceof Person);    // true
```

::: tip Classes and rules
Rules work on plain JSON data, and a rule is one function - most rules need no
class at all. Factory functions and helpers with parameters are simpler to read and
to test. Classes become useful in a bigger library - for example, one class per
product with the same methods (`model()`, `firmware()`, `enclosures()`), so that
the same rule can run on reports of different shapes (session 10).
:::

## 12. The details object of an alert

`emit(id, details)` creates an alert. The details object becomes a **table** in
the alert: every key is a **column**, every value a cell. So the keys are the
column titles - written for people, often with spaces - and their **order** is the
order of the columns.

```js run
function emit(id, details) {        // fake: prints instead of creating an alert
    console.log("ALERT for " + id + ": " + JSON.stringify(details));
}

const enc = doc.inventory.enclosures[2];
const details = {
    "Device": doc.inventory.extended_info?.json?.data?.system?.name ?? "unknown",
    "Model": doc.overview.model,
    "Enclosure": enc.id,
    "State": enc.state,
    "Action": "Check the enclosure and replace the failed part."
};

emit(doc.status.device_alias, details);
console.log(Object.keys(details));      // the columns, in order
```

### Fixing the order of the columns

The keys keep the order in which they were **created** (section 1). Two traps:

- a key that looks like a whole number (`"1"`, `"2024"`) jumps to the **front**;
- keys added later in an `if` come **last**, wherever you meant them to be.

Some engines take the order as a separate list - many rules send
`column_order: [...]` next to the details. Build it from the keys, or write it out
when the order must not depend on the code:

```js run
function emit(id, payload) {
    console.log("ALERT for " + id + ":\n" + JSON.stringify(payload, null, 2));
}

const COLUMNS = ["Device", "Model", "Version", "Problems"];

const details = {};
details["Problems"] = 2;                    // created in a different order...
details["Device"] = "LAB-DEV-01";
details["Version"] = "4.2.1.7";
details["Model"] = "XR-220";

// ...so put the columns in the fixed order before emit
const ordered = {};
for (const key of COLUMNS) ordered[key] = details[key] ?? "";

emit("LAB-DEV-01", { details: [ordered], column_order: COLUMNS });
```

A missing column becomes `""`, so every alert of a rule has the same columns -
easier to read in a table, and easier to compare between devices.

### An optional column

To add a column only when there is a value, build the object first and add the key
in an `if` - or use spread with a condition:

```js run
function details(enc) {
    return {
        "Enclosure": enc.id,
        "State": enc.state,
        ...(enc.state !== "normal" ? { "Action": "Check the enclosure." } : {})
    };
}
console.log(details(doc.inventory.enclosures[0]));
console.log(details(doc.inventory.enclosures[2]));
```

Spreading `{}` adds nothing. This keeps the object in one expression - but an `if`
is easier to read; choose the one your team reads more easily.

## 13. Reading existing rules

First, run the rule from the start of the lecture:

```js run
function emit(id, payload) {
    console.log("ALERT for " + id + ": " + JSON.stringify(payload));
}

const MODELS = ["XR-210", "XR-220"];

function get(obj, path, fallback) {
    const keys = Array.isArray(path) ? path : path.split(".");
    let cur = obj;
    for (const key of keys) {
        if (cur === undefined || cur === null) return fallback;
        cur = cur[key];
    }
    return cur ?? fallback;
}

function failedModules(modules) {
    const failed = [];
    for (const [key, module] of Object.entries(modules ?? {})) {
        const [number, version] = key.split("_");
        if (module.status !== "OK") failed.push(`${number} (${version})`);
    }
    return failed;
}

function rule(doc) {
    const { model, serial_number: serial } = doc.overview ?? {};
    if (!MODELS.includes(model)) return;

    const failed = failedModules(doc.inventory?.modules);
    if (failed.length === 0) return;

    const details = {
        "Device": get(doc, "inventory.extended_info.json.data.system.name", "unknown"),
        "Model": model,
        "Serial": serial,
        "Firmware": doc.inventory.labels?.["Firmware Version"] ?? "",
        "Failed modules": failed.join(", ")
    };
    emit(get(doc, ["status", "device_alias"]), {
        details,
        column_order: Object.keys(details)
    });
}

console.log("example JSON document:");
rule(doc);

console.log("no modules:");
rule({ overview: { model: "XR-210" }, inventory: {}, status: { device_alias: "LAB-DEV-02" } });
console.log("(end)");
```

Here is the same rule in an older style - `new Object()`, `obj["key"] = ...`,
`for...in` with `hasOwnProperty`, and `&&` chains:

```js run
function emit(id, payload) {
    console.log("ALERT for " + id + ": " + JSON.stringify(payload));
}

function rule(doc) {  // never change this line
    try {
        var overview = doc.overview;
        if (["XR-210", "XR-220"].indexOf(overview.model) == -1) return;

        var modules = doc.inventory.modules;
        var failed = new Array();
        for (var key in modules) {
            if (!modules.hasOwnProperty(key)) continue;
            var parts = key.split("_");
            if (modules[key].status != "OK") {
                failed.push(parts[0] + " (" + parts[1] + ")");
            }
        }
        if (failed.length == 0) return;

        var info = doc.inventory.extended_info;
        var details = new Object();
        details["Device"] = info && info.json && info.json.data && info.json.data.system
                            && info.json.data.system.name || "unknown";
        details["Model"] = overview.model;
        details["Serial"] = overview.serial_number;
        details["Firmware"] = doc.inventory.labels["Firmware Version"];
        details["Failed modules"] = failed.join(", ");

        var columns = new Array();
        for (var k in details) columns.push(k);

        emit(doc.status.device_alias, { "details": details, "column_order": columns });
    } catch (err) {
        return;
    }
}

console.log("example JSON document:");
rule(doc);

console.log("no modules:");
rule({ overview: { model: "XR-210" }, inventory: {}, status: { device_alias: "LAB-DEV-02" } });

console.log("no labels:");
rule({ overview: { model: "XR-210", serial_number: "SN0003" },
       inventory: { modules: { "47_1.07": { status: "FAILED" } } },
       status: { device_alias: "LAB-DEV-03" } });
console.log("(end)");
```

**Check yourself:**

1. Match the parts: which line of the old rule does the work of `failedModules`,
   of `get(...)`, of the destructuring, of `Object.keys(details)`?
2. "no modules": `doc.inventory.modules` is `undefined`. What does `for (var key in
   undefined)` do? Is that why the old rule gives no alert there?
3. "no labels": the old rule gives **no** alert, the modern rule would. Which line
   fails, and why does nobody see an error?
4. `details["Device"] = info && ... && info.json.data.system.name || "unknown"` -
   when does it give `"unknown"`? Is that the same as `?? "unknown"` at the end of
   `get(...)`? Think of a name that is `""`.
5. The old rule builds `columns` with `for...in`. Do `Object.keys(details)` and this
   loop give the same order?

::: details Answer
1. The `for...in` loop with `hasOwnProperty` and `split` is `failedModules`; the
   `info && info.json && ...` chain is `get(doc, "inventory.extended_info...")`;
   `var overview = doc.overview` plus `overview.model` / `overview.serial_number` is
   the destructuring; the `for (var k in details)` loop is `Object.keys(details)`.
2. `for...in` over `undefined` (or `null`) runs zero times - no error. `failed` stays
   empty and the rule returns: no alert, the same as the modern rule. Correct
   here, by luck.
3. `doc.inventory.labels["Firmware Version"]` - `labels` is `undefined`, so reading a
   key of it throws a `TypeError`. The catch-all `catch` returns silently: a failed
   module is never reported. The modern rule uses `labels?.["Firmware Version"] ??
   ""`.
4. When any level is missing - **or** when the name is falsy: `""` gives
   `"unknown"` with `||`. `get` uses `??`, so an empty name stays `""`. Decide which
   one you want: for a display name, `||` (treat `""` as missing) is often right.
5. Yes - both list the own keys in the same order (section 1).
:::

## 14. Practice

In your copy of the Homework repository, first get the new tasks:

```bash
git pull upstream main
node 06-objects/practice/task1-predict.js
```

`data/sample-asset.json` has two new parts (`inventory.modules`,
`inventory.labels`) - the pull brings them too.

| Task | File | What you do |
|------|------|-------------|
| 1 | `task1-predict.js` | Predict 20 results: dot and brackets, missing keys, `in`, `?.`, `??`, references, spread, destructuring |
| 2 | `task2-get.js` | **The course project starts:** `get(obj, path, fallback)` with a string or an array path, and all the edge cases |
| 3 | `task3-dictionaries.js` | The dictionaries of `report-dictionary.json`: keys, values, information in the keys, counting and grouping |
| 4 | `task4-shapes.js` | The flattened export `report-export.json`: read single values, rebuild records from parallel arrays, compare with the nested document |
| 5 | `task5-objects-classic.js` | The old tasks: factory, class, `swap` with destructuring, `createPerson` with shorthand and a method, `combineArrays`, the youngest person |

## Summary

| Topic | Remember |
|-------|----------|
| Object | Properties `key: value`; keys are strings; values of any type; a method is a function value |
| Literal | `{ a: 1, "b c": 2, [expr]: 3, name }` - quotes for keys with spaces, dashes, dots; shorthand; computed keys |
| Access | `obj.key` - written key; `obj[expr]` - calculated key; missing key -> `undefined`; writing creates; `delete` removes |
| Key exists? | `in` (also inherited), `hasOwnProperty` (older), `Object.hasOwn` (ES2022); often better: check the value |
| Long paths | One dot at a time; a key of `undefined` is a `TypeError`; `?.` stops at `undefined` / `null`; `??` gives a fallback |
| `get` | Walks a path from data; array path for keys with dots; fallback instead of errors |
| Dictionary | Keys are ids; `Object.keys` / `values` / `entries`; `for...in` + `hasOwnProperty` in older code; information in the key |
| Shapes | List of records, dictionary by id, flattened `"a.b.c": [values]` - convert once, at the start |
| Order of keys | Integer-like keys first (sorted), then creation order - it is the column order of an alert |
| Copies | `=` shares; `{ ...obj }` copies one level; `structuredClone` copies all levels; do not change `doc` |
| `...` | Spread pours out (calls, arrays, objects); rest collects (parameters, destructuring) |
| Destructuring | `const [a, b] = arr;` by position; `const { x, y: z = 0 } = obj;` by name; also in parameters |
| `this` | The object before the dot at the call; lost when a method is passed on; arrows have none |
| Many objects | Factory function (best for rules), constructor with `new`, `class` with `constructor`, methods, `static`, `extends` / `super` |
| Old style | `new Object()`, `obj["k"] = v`, `for (var k in obj)` + `hasOwnProperty`, `a && a.b && a.b.c` - read it, modernise it |

## Homework

1. `06-objects/homework.js` (in the homework repository): the details object of an
   alert with a fixed column order, settings merged with defaults, and a rule that
   reads the dictionary of drives - without changing the report.
2. The practice tasks you did not finish in class - recommended, as later tasks
   and the course project reuse them. Every check must print `OK`.
3. **Course project:** keep your `get` from practice task 2 in a file of your own
   (for example `library.js`). From the next session on, the library grows.
4. Optional: open one of your real reports and find each of the shapes of section
   7. Which paths do your rules read again and again? Write them down as `get`
   paths.

## Read more

- MDN: [Working with objects](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects),
  [Object.entries()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/entries),
  [Optional chaining (?.)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining),
  [Destructuring](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring),
  [Spread syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax),
  [structuredClone()](https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone),
  [Classes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes)
- MDN exercises: [Test your skills: Object basics](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Test_your_skills/Object_basics)
- javascript.info: [Objects](https://javascript.info/object),
  [Object references and copying](https://javascript.info/object-copy),
  [Object methods, "this"](https://javascript.info/object-methods),
  [Destructuring assignment](https://javascript.info/destructuring-assignment),
  [Classes](https://javascript.info/classes)
- Exercises: [JavaScript Object - Exercises](https://www.w3resource.com/javascript-exercises/javascript-object-exercises.php) (w3resource)
- Video: [Modern JavaScript Tutorial #5 - Objects](https://www.youtube.com/watch?v=X0ipw1k7ygU)

**Next session:** array methods - `map`, `filter`, `find`, `some`, `every`,
`reduce`, `sort` - and grouping thousands of records into a dictionary once,
instead of searching them again and again. The course project starts for real:
choose the product, the sample documents and the first helpers.
