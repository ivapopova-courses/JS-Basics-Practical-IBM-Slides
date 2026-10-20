---
title: 7. Array methods
---

# 7. Array methods: transforming, grouping and indexing data

<div class="lecture-meta">
  <span>Session 7</span><span>practice: <code>07-array-methods/</code> in the homework repository</span>
  <span><a href="../example-document"><code>doc</code>: the example JSON document</a></span>
</div>

**Today you will learn to:**

- replace the loops of lecture 4 with array methods: `forEach`, `map`, `filter`,
  `find`, `findIndex`, `some`, `every` and `reduce`;
- write the callbacks of these methods - with the element, the index and the
  array as arguments;
- sort numbers, strings, versions and records with `sort` and `toSorted` - also by
  several keys - without changing the report;
- chain methods (`filter(...).map(...).join(...)`), flatten lists with `flat` and
  `flatMap`, and decide when a plain loop is clearer;
- group a long list of records into a nested object, the way your library helpers
  do;
- build an **index** once (an object or a `Map`) instead of searching thousands of
  records again and again, and find unique values with a `Set`;
- print records as a table with `console.table`;
- read the older callbacks of existing rules: `function (x) { return ...; }`,
  `forEach` with `push`;
- start the course project: the repository, the sample documents and
  `library.js`.

Where this fits in the sample check rule - today's rule answers several questions
about the enclosures, each with **one method**. The number in each comment is the
section of this lecture:

```js
const MODELS = ["XR-210", "XR-220"];
const MIN_FIRMWARE = "2.14";

// lecture 5: compare two versions part by part (3. map)
function compareVersions(a, b) {
    const pa = String(a ?? "").split(".").map(x => parseInt(x, 10) || 0);
    const pb = String(b ?? "").split(".").map(x => parseInt(x, 10) || 0);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const x = pa[i] ?? 0, y = pb[i] ?? 0;
        if (x !== y) return x < y ? -1 : 1;
    }
    return 0;
}

// 9. a helper for the course library: group a list by a key
function groupBy(list, keyOf) {
    const groups = {};
    for (const item of list) {
        const key = keyOf(item);
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
    }
    return groups;
}

function rule(doc) {          // the engine calls rule(doc) - keep this line
    if (!MODELS.includes(doc.overview?.model)) return;
    const enclosures = doc.inventory?.enclosures ?? [];

    // 4. filter: the outdated enclosures; 5. some: is any of them not normal?
    const outdated = enclosures.filter(enc => compareVersions(enc.firmware, MIN_FIRMWARE) < 0);
    const anyNotNormal = enclosures.some(enc => enc.state !== "normal");
    if (outdated.length === 0 && !anyNotNormal) return;

    // 3. map + 6. reduce: the lowest firmware of all enclosures
    const lowest = enclosures
        .map(enc => enc.firmware)
        .reduce((low, fw) => (compareVersions(fw, low) < 0 ? fw : low));

    // 7. sort a copy, lowest firmware first; 8. a chain: sort -> map
    const lines = [...outdated]
        .sort((a, b) => compareVersions(a.firmware, b.firmware) || a.id.localeCompare(b.id))
        .map(enc => `${enc.id} (${enc.firmware})`);

    // 9. group by type, then one text per group
    const byType = groupBy(enclosures, enc => enc.type);
    const types = Object.entries(byType).map(([type, list]) => `${type}: ${list.length}`);

    emit(doc.status.device_alias, {
        "Model": doc.overview.model,
        "Enclosures": types.join(", "),
        "Lowest firmware": lowest,
        "Outdated": lines.join("; "),
        "Not normal": enclosures.filter(enc => enc.state !== "normal").map(enc => enc.id).join(", ")
    });
}
```

- Every question - "which ones?", "is there any?", "what is the lowest?", "in which
  order?", "how many of each kind?" - is one line. The loops are still there, but
  inside the methods.
- `groupBy` is a helper for your **course library**; the modern built-in
  `Object.groupBy` does the same ([section 9](#_9-grouping-records)).
- In [section 11](#_11-reading-existing-rules) you run this rule, and read an older
  rule that does the same work - with two hidden bugs.

Lectures 4 and 5 built the parts: loops over arrays, and functions that take a
function (callbacks). Today the two meet: arrays have methods that run your
callback for every element.

## 1. From loops to methods

Lecture 4 asked three questions of a list of records - find, count, collect - with
three loops. Lecture 5 wrote helpers that take a callback: `customFilter`,
`customMap`, `countIf`. Arrays have such helpers **built in**:

```js run
const enclosures = doc.inventory.enclosures;

// lecture 4: a loop that collects
const notNormal = [];
for (const enc of enclosures) {
    if (enc.state !== "normal") notNormal.push(enc.id);
}
console.log(notNormal);                     // [ 'ENC-03' ]

// today: two methods with callbacks
const notNormal2 = enclosures
    .filter(enc => enc.state !== "normal")  // keep the records that pass
    .map(enc => enc.id);                    // one value from each
console.log(notNormal2);                    // [ 'ENC-03' ]
```

The method walks the array; your callback answers **one question about one
element**. You say *what* you want, not *how* to walk.

| Method | The callback answers | Returns | Changes the array? |
|---|---|---|---|
| `forEach` | (does something with the element) | `undefined` | no |
| `map` | "what is the new value for this element?" | a new array, same length | no |
| `filter` | "keep this element?" (`true` / `false`) | a new array with the elements that pass | no |
| `find` / `findIndex` | "is this the one?" | the first match / its index (`undefined` / `-1`) | no |
| `some` / `every` | "does this element pass?" | `true` / `false` | no |
| `reduce` | "what is the result so far, with this element?" | one value | no |
| `sort` | "which of these two comes first?" (a number) | the **same** array, sorted | **yes** |

All of them are old enough for any rule engine (ES5, 2009; `find` and `findIndex`
ES2015) - except a few newer ones, marked in the sections below.

::: info Animations
**Functions are values:** [3. Callbacks](../animations/functionsAsValues.html#3){target="_blank"};
**Functions and data:** [5. A callback, call by call](../animations/functionsAndData.html#5){target="_blank"}
:::

### The arguments of the callback

The method calls your callback with **three** arguments: the element, its index and
the whole array. Most callbacks need only the first one - a function may ignore
the rest (lecture 5):

```js run
const input = ["a", "b", "c"];
input.map((e, i, arr) => {
    console.log(e, i, arr);
});
// a 0 [ 'a', 'b', 'c' ]
// b 1 [ 'a', 'b', 'c' ]
// c 2 [ 'a', 'b', 'c' ]
```

The callback is written as an arrow function or as a classic function expression -
both work the same here. Older rules use the classic form:

```js run
const levels = ["4.2.1.7", "4.1.9.3"];

const majors1 = levels.map(function (v) { return v.split(".")[0]; });   // older style
const majors2 = levels.map(v => v.split(".")[0]);                       // arrow function

console.log(majors1, majors2);      // [ '4', '4' ] [ '4', '4' ]
```

### Look at the data first: `console.table`

Before you write a method chain, look at the records. `console.table` prints a list
of objects as a table - one row per record, one column per key:

```js run
console.table(doc.inventory.enclosures);

// only some columns
console.table(doc.inventory.enclosures, ["id", "state"]);
```

It works in Node.js and in the browser console too. A dictionary (an object of
objects, lecture 6) prints with its keys as the row names:

```js run
console.table(doc.inventory.modules);
```

## 2. `forEach` - do something with every element

`forEach` calls the callback once for each element, in order. It is a `for...of`
loop written as a method:

```text
array.forEach((element, index, array) => {
    // code to run for each element
});
```

```js run
const numbers = [1, 2, 3, 4, 5];

// with a classic function
numbers.forEach(function (number, index) {
    console.log(`Index ${index}: ${number}`);
});

// with an arrow function
numbers.forEach((number, index) => {
    console.log(`Index ${index}: ${number}`);
});
```

`forEach` returns **nothing** (`undefined`). It is for **side effects**: printing,
adding to a total, pushing into another array.

An old task - the total of the sales:

```js run
const sales = [
    { product: "Laptop", amount: 1000 },
    { product: "Phone", amount: 500 },
    { product: "Tablet", amount: 300 }
];

let totalSales = 0;
sales.forEach(sale => totalSales += sale.amount);
console.log(totalSales);        // 1800
```

### What `forEach` cannot do

```js run
const enclosures = doc.inventory.enclosures;

// 1. it returns undefined - not a new array
const result = enclosures.forEach(enc => enc.id);
console.log(result);            // undefined

// 2. there is no break: return only ends THIS call of the callback
enclosures.forEach(enc => {
    if (enc.state !== "normal") return;     // skips this one, goes on with the next
    console.log("normal:", enc.id);
});
```

To stop at the first match, use `find` or `some` (section 5) - or a `for...of`
loop with `break`.

### Changing the elements

Another old task: add `isAdmin` to every user. `forEach` can change the objects
in the array:

```js run
const users = [
    { name: "Maria", role: "user" },
    { name: "Ivan", role: "admin" },
    { name: "Stoyan", role: "user" }
];

users.forEach(user => {
    user.isAdmin = user.role === "admin";       // changes the original objects!
});
console.log(users);
```

This changes the original objects - for the objects of `doc` that is exactly what
a rule must **not** do (lectures 5 and 6). `map` (next section) builds new objects
instead and leaves the input as it was.

::: tip `forEach` + `push` = `map` or `filter`
Older rules often build a new array like this:
`var ids = []; list.forEach(function (e) { ids.push(e.id); });`. That is `map`:
`const ids = list.map(e => e.id);`. And `forEach` with an `if` before the `push`
is `filter`.
:::

## 3. `map` - a new array, one result per element

`map` calls the callback for every element and puts what the callback **returns**
into a new array. The new array has the **same length**; the original does not
change.

```text
newArray = array.map(element => newValue);
```

```js run
const input = ["a", "b", "c", "d"];
const output = input.map(e => e.toUpperCase());

console.log(`input: ${input}`);     // input: a,b,c,d
console.log(`output: ${output}`);   // output: A,B,C,D
```

The same with a classic function - note the `return`:

```js run
const input = ["a", "b", "c", "d"];
const output = input.map(function (e) {
    return e.toUpperCase();
});
console.log(output);                // [ 'A', 'B', 'C', 'D' ]
```

With the index (the second argument):

```js run
const input = ["a", "b", "c"];
const output = input.map((e, i) => e.toUpperCase() + i);
console.log(output);                // [ 'A0', 'B1', 'C2' ]
```

Two old tasks on a list of cities - the names only, and each name changed with a
dictionary (lecture 6):

```js run
const cities = [
    { name: "Sofia", population: 1_236_000 },
    { name: "Plovdiv", population: 343_424 },
    { name: "Burgas", population: 202_766 },
    { name: "Varna", population: 335_177 },
];

const cityNames = cities.map(city => city.name);
console.log(cityNames);             // [ 'Sofia', 'Plovdiv', 'Burgas', 'Varna' ]

// the airport code of each city, from a dictionary
const codes = { Sofia: "SOF", Plovdiv: "PDV", Burgas: "BOJ", Varna: "VAR" };
const cityCodes = cities.map(city => codes[city.name]);
console.log(cityCodes);             // [ 'SOF', 'PDV', 'BOJ', 'VAR' ]
```

### `map` on the report

```js run
const enclosures = doc.inventory.enclosures;

// one value from every record
console.log(enclosures.map(enc => enc.id));
// [ 'ENC-01', 'ENC-02', 'ENC-03', 'ENC-04' ]

// a text from every record
console.log(enclosures.map(enc => `${enc.id}: ${enc.state}`).join(", "));

// lecture 4 promised it: the parts of a version as numbers
console.log("4.2.1.7".split(".").map(Number));      // [ 4, 2, 1, 7 ]

// a new object from every record - the round brackets are needed (lecture 5)
const short = enclosures.map(enc => ({ id: enc.id, ok: enc.state === "normal" }));
console.log(short[2]);              // { id: 'ENC-03', ok: false }
```

The last example is the clean version of the `isAdmin` task: **new** objects with
the extra key, and the input untouched:

```js run
const users = [
    { name: "Maria", role: "user" },
    { name: "Ivan", role: "admin" }
];
const withFlag = users.map(user => ({ ...user, isAdmin: user.role === "admin" }));
console.log(withFlag);
console.log(users[0]);              // { name: 'Maria', role: 'user' } - unchanged
```

A dictionary has no `map`, but `Object.entries` turns it into an array of
`[key, value]` pairs (lecture 6):

```js run
const lines = Object.entries(doc.inventory.modules)
    .map(([key, m]) => `${key}: ${m.status}`);
console.log(lines);     // [ '12_4.20: OK', '12_4.08: OK', '47_1.07: FAILED' ]
```

### Two traps

```js run
// 1. braces without return: every result is undefined (lecture 5)
const wrong = [1, 2, 3].map(x => { x * 2 });
console.log(wrong);                 // [ undefined, undefined, undefined ]

// 2. map passes THREE arguments - parseInt takes the index as its radix!
console.log(["1", "2", "3"].map(parseInt));                 // [ 1, NaN, NaN ]
console.log(["1", "2", "3"].map(s => parseInt(s, 10)));     // [ 1, 2, 3 ]
```

The second trap explains why existing rules write
`.map(function (x) { return parseInt(x, 10) || 0; })` and not `.map(parseInt)`:
`parseInt("2", 1)` and `parseInt("3", 2)` are `NaN` - base 1 does not exist, and
"3" is not a digit in base 2.

## 4. `filter` - the elements that pass

`filter` calls the callback for every element and keeps the element when the
callback returns a **truthy** value. The result is a new array - shorter, or
equally long, or empty.

```text
newArray = array.filter(element => condition);
```

```js run
const input = [0, 1, 2, 3, 4];
const output = input.filter(x => x % 2 === 0);
console.log(`input: ${input}`);     // input: 0,1,2,3,4
console.log(`output: ${output}`);   // output: 0,2,4
```

The old task - the cities with more than 340,000 people:

```js run
const cities = [
    { name: "Sofia", population: 1_236_000 },
    { name: "Plovdiv", population: 343_424 },
    { name: "Burgas", population: 202_766 },
    { name: "Varna", population: 335_177 },
];
const populatedCities = cities.filter(city => city.population > 340_000);
console.log(populatedCities);
// [ { name: 'Sofia', population: 1236000 }, { name: 'Plovdiv', population: 343424 } ]
```

### `filter` on the report

```js run
const enclosures = doc.inventory.enclosures;

// the records that match - whole objects
const hdd = enclosures.filter(enc => enc.type.startsWith("HDD"));
console.log(hdd.map(enc => enc.id));            // [ 'ENC-03', 'ENC-04' ]

// COUNT: the length of the filtered array
console.log(enclosures.filter(enc => enc.firmware === "2.14").length);   // 2

// the failed modules of a dictionary: entries -> filter -> map
const failed = Object.entries(doc.inventory.modules)
    .filter(([, m]) => m.status !== "OK")
    .map(([key]) => key);
console.log(failed);                            // [ '47_1.07' ]
```

`[, m]` skips the first element of the pair - array destructuring with a hole
(lecture 6).

### `filter(Boolean)`: drop the empty values

`Boolean` is a function too: `Boolean(x)` is `true` for truthy values. As a
callback it drops `""`, `undefined`, `null` - and also `0` and `false`:

```js run
const consoles = "CON-01;;CON-02;".split(";");
console.log(consoles);                      // [ 'CON-01', '', 'CON-02', '' ]
console.log(consoles.filter(Boolean));      // [ 'CON-01', 'CON-02' ]

console.log([3, 0, 5, null].filter(Boolean));   // [ 3, 5 ] - the 0 is gone too!
```

::: tip Instead of `splice` in a loop
Lecture 4 showed the bug of `splice` while walking forwards
([Array methods 7](../animations/arrayMethods.html#7){target="_blank"}). `filter`
does not change the array: build a new one with the elements you **keep**:
`const left = list.filter(x => x.state !== "removed");`
:::

## 5. `find`, `findIndex`, `some` and `every`

These methods **stop early**: as soon as the answer is known, the rest of the array
is not visited.

### `find` and `findIndex`

`find` returns the **first element** for which the callback is truthy - or
`undefined` when there is none. `findIndex` returns its **index** - or `-1`.

```js run
const input = [1, 2, 3, 4, 5];
console.log(input.find(x => x > 3));        // 4
console.log(input.findIndex(x => x > 3));   // 3
console.log(input.find(x => x > 10));       // undefined
console.log(input.findIndex(x => x > 10));  // -1

// the old task: the first city with more than 500,000 people
const cities = [
    { name: "Sofia", population: 1_236_000 },
    { name: "Plovdiv", population: 343_424 },
];
console.log(cities.find(city => city.population > 500_000));
// { name: 'Sofia', population: 1236000 }
```

On the report - **check** the result before you use it:

```js run
const enclosures = doc.inventory.enclosures;

const firstBad = enclosures.find(enc => enc.state !== "normal");
console.log(firstBad?.id ?? "all normal");          // ENC-03

const missing = enclosures.find(enc => enc.id === "ENC-99");
console.log(missing);                               // undefined
console.log(missing?.state ?? "no such enclosure"); // no such enclosure
```

`findLast` and `findLastIndex` search from the **end** (ES2023 - check that your
rule engine supports them):

```js run
const enclosures = doc.inventory.enclosures;
console.log(enclosures.findLast(enc => enc.firmware === "2.10").id);   // ENC-04
console.log(enclosures.findLastIndex(enc => enc.type === "SSD-24"));   // 1
```

### `some` and `every`

- `some` - is there **at least one** element that passes? (OR over all elements)
- `every` - do **all** elements pass? (AND over all elements)

```js run
const enclosures = doc.inventory.enclosures;

console.log(enclosures.some(enc => enc.state === "degraded"));     // true
console.log(enclosures.every(enc => enc.state === "normal"));      // false
console.log(enclosures.every(enc => enc.id.startsWith("ENC-")));   // true

// the same as !some(...): "none of them"
console.log(!enclosures.some(enc => enc.state === "failed"));      // true
```

::: warning An empty array
`[].some(...)` is `false` - there is no element that passes. `[].every(...)` is
**`true`** - there is no element that fails. A rule that checks
`enclosures.every(enc => enc.state === "normal")` on a report **without**
enclosures says "all normal". If "no enclosures" is suspicious, check the length
first.
:::

```js run
const none = [];
console.log(none.some(enc => enc.state !== "normal"));     // false
console.log(none.every(enc => enc.state === "normal"));    // true
```

### `includes` or `some`?

`includes` (lecture 4) compares with `===` - for **exact values**. `some` takes a
**condition**:

```js run
const features = doc.inventory.features;    // [ 'dedup', 'compression', 'encryption' ]

console.log(features.includes("encryption"));                  // exact value
console.log(features.some(f => f.startsWith("encr")));         // a condition
console.log(features.some(f => f.toLowerCase() === "DEDUP".toLowerCase()));   // case-insensitive
```

### Finding a value in the record list

The key / value records of lecture 4, with `find`:

```js run
const records = [
    { group: "Global Resources", item: "SYS", code: "BU", label: "Release", value: "10.12.39.0" },
    { group: "Enclosures", item: "ENC-01", code: "FW", label: "Firmware", value: "2.14" },
    { group: "Enclosures", item: "ENC-01", code: "ST", label: "State", value: "normal" },
];

const release = records.find(r => r.item === "SYS" && r.code === "BU")?.value;
console.log(release);       // 10.12.39.0
```

One `find` is fine. A `find` **inside** a loop over thousands of records is the
slow pattern of lecture 4 - [section 10](#_10-indexes-map-and-set) builds an index
instead.

## 6. `reduce` - many values into one

`reduce` walks the array and carries one value from element to element - the
**accumulator**. The callback gets the accumulator so far and the current element,
and returns the **new** accumulator. At the end, `reduce` returns the last
accumulator.

```text
result = array.reduce((accumulator, current) => newAccumulator, initialValue);
```

```js run
const input = [1, 2, 3, 4];
const output = input.reduce((acc, curr) => {
    console.log(acc, curr);
    return acc + curr;
}, 0);
console.log(`output: ${output}`);
// 0 1
// 1 2
// 3 3
// 6 4
// output: 10
```

- **accumulator** - the value returned by the previous call (the first time: the
  initial value);
- **current** - the element being processed;
- **initialValue** - optional: the start value of the accumulator. Without it, the
  accumulator starts with the **first** element, and the callback starts at the
  **second**:

```js run
const input = [1, 2, 3, 4];
const output = input.reduce((acc, curr) => {
    console.log(acc, curr);
    return acc + curr;
});
console.log(`output: ${output}`);
// 1 2
// 3 3
// 6 4
// output: 10
```

This is the accumulator of lecture 4 (`let sum = 0; for (...) sum += x;`) as a
method.

::: info Animation
**Algorithms with arrays:** [3. Sum of the elements](../animations/arrayAlgorithms.html#3){target="_blank"} -
the same idea with a loop
:::

### Always give an initial value

```js run
try {
    [].reduce((acc, curr) => acc + curr);       // empty, no initial value
} catch (err) {
    console.log(err.name + ": " + err.message);
}
console.log([].reduce((acc, curr) => acc + curr, 0));     // 0 - fine
```

Without an initial value, `reduce` on an empty array throws a `TypeError`. A list
from a report can be empty - so give the initial value, unless you have checked
the length first. (The sample rule at the top can skip it: it returned before,
when there were no enclosures.)

### The sum of the even numbers

An old example - with `reduce` only, and with `filter` + `reduce`:

```js run
const input = [1, 2, 3, 4];

// reduce only: works, but harder to read and to write
const output1 = input.reduce((acc, curr) => (curr % 2 === 0 ? acc + curr : acc), 0);

// filter, then reduce: each step does one thing - better
const output2 = input.filter(x => x % 2 === 0).reduce((acc, curr) => acc + curr, 0);

console.log(output1, output2);      // 6 6
```

### `reduce` on the report

```js run
const records = [
    { group: "Pools", item: "POOL-001", code: "CP", label: "Capacity GiB", value: "7168" },
    { group: "Pools", item: "POOL-002", code: "CP", label: "Capacity GiB", value: "10752" },
    { group: "Pools", item: "POOL-005", code: "CP", label: "Capacity GiB", value: "0" },
];

// a sum - the values are strings: convert them (lecture 2)
const totalGiB = records.reduce((sum, r) => sum + Number(r.value), 0);
console.log(totalGiB);              // 17920

// a maximum: keep the bigger one
const biggest = records.reduce((best, r) => (Number(r.value) > Number(best.value) ? r : best));
console.log(biggest.item);          // POOL-002

// a count per value, into an object (more in section 9)
const states = doc.inventory.enclosures.reduce((counts, enc) => {
    counts[enc.state] = (counts[enc.state] ?? 0) + 1;
    return counts;
}, {});
console.log(states);                // { normal: 3, degraded: 1 }
```

::: tip When not to use `reduce`
`reduce` can do almost anything - and that is its problem: a long `reduce` is
hard to read. For a sum, a maximum or a count it is fine. When the callback grows
beyond a few lines, a `for...of` loop or a helper with a name is usually clearer.
`reduceRight` is the same as `reduce`, from the last element to the first.
:::

## 7. Sorting: `sort` and `toSorted`

`sort` puts the elements in order **in place** - it changes the array - and
returns the same array.

### Without a compare function: as strings

```js run
const input = [13, 1, 4, 1, 15, 9];
input.sort();
console.log(input);     // [ 1, 1, 13, 15, 4, 9 ] - sorted as strings!
```

Without a compare function, `sort` turns the elements into **strings** and sorts
them by their character codes - like the string comparison of lecture 3. `"13"`
comes before `"4"`, because `"1"` comes before `"4"`. Strings with capital letters
come before small ones:

```js run
console.log(["b", "a", "C"].sort());                            // [ 'C', 'a', 'b' ]
console.log(["2.10", "2.14", "2.9", "10.1"].sort());            // [ '10.1', '2.10', '2.14', '2.9' ]
```

The versions are in the wrong order too: `"10.1"` first, `"2.9"` last.

### The compare function

`sort(compareFn)` calls `compareFn(a, b)` for pairs of elements. The **sign** of the
number it returns decides the order:

| `compareFn(a, b)` returns | Order |
|---|---|
| a negative number | `a` comes **before** `b` |
| a positive number | `a` comes **after** `b` |
| `0` | `a` and `b` keep their order |

For numbers, `a - b` gives exactly that:

```js run
const input = [13, 1, 4, 1, 15, 9];
input.sort((a, b) => a - b);
console.log(input);                 // [ 1, 1, 4, 9, 13, 15 ] - ascending
input.sort((a, b) => b - a);
console.log(input);                 // [ 15, 13, 9, 4, 1, 1 ] - descending
```

For strings, `localeCompare` returns a negative number, `0` or a positive number:

```js run
const names = ["Maria", "ada", "Ivan"];
console.log([...names].sort());                                 // [ 'Ivan', 'Maria', 'ada' ]
console.log([...names].sort((a, b) => a.localeCompare(b)));     // [ 'ada', 'Ivan', 'Maria' ]
```

For versions, `compareVersions` of lecture 5 **is** a compare function - it
returns `-1`, `0` or `1`:

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

const levels = ["2.10", "2.14", "2.9", "10.1"];
console.log([...levels].sort(compareVersions));                       // [ '2.9', '2.10', '2.14', '10.1' ]
console.log([...levels].sort((a, b) => compareVersions(b, a)));       // highest first
```

### Sorting records

Records are sorted by one of their keys. The old task - the cities by population,
highest first:

```js run
const cities = [
    { name: "Sofia", population: 1_236_000 },
    { name: "Plovdiv", population: 343_424 },
    { name: "Burgas", population: 202_766 },
    { name: "Varna", population: 335_177 },
];
const sortedCities = [...cities].sort((a, b) => b.population - a.population);
console.log(sortedCities.map(c => c.name));     // [ 'Sofia', 'Plovdiv', 'Varna', 'Burgas' ]
```

An old homework writes one compare function for **any** key:

```js run
const todos = [
    { title: "Todo1", priority: "low" },
    { title: "Todo2", priority: "high" },
    { title: "Todo3", priority: "medium" },
    { title: "Todo4", priority: "high" },
];

function sortArrayByKey(arr, key) {
    return [...arr].sort((a, b) => (a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0));
}
console.log(sortArrayByKey(todos, "priority").map(t => t.title + ":" + t.priority));
// [ 'Todo2:high', 'Todo4:high', 'Todo1:low', 'Todo3:medium' ]
```

The priorities are sorted as text: "high" < "low" < "medium". To sort them by
meaning, map each one to a number first: `const rank = { high: 0, medium: 1, low: 2 };`
and compare `rank[a.priority] - rank[b.priority]`.

### Several keys

Sort by the first key; when it is equal (the result is `0`), use the second. `||`
does it in one line: `0` is falsy, so `||` moves on to the next comparison. An old
task - books by `id`, then by title:

```js run
const books = [
    { id: 2, title: "Book A", author: "Charles Dickens" },
    { id: 1, title: "Book B", author: "Jane Austen" },
    { id: 2, title: "Book C", author: "Agatha Christie" },
    { id: 1, title: "Book D", author: "H.G. Wells" },
];
const sortedBooks = [...books].sort((a, b) => a.id - b.id || a.title.localeCompare(b.title));
console.log(sortedBooks.map(b => `${b.id} ${b.title}`));
// [ '1 Book B', '1 Book D', '2 Book A', '2 Book C' ]
```

On the report - enclosures by type, then by firmware (lowest first), then by id:

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

const sorted = [...doc.inventory.enclosures].sort((a, b) =>
    a.type.localeCompare(b.type)
    || compareVersions(a.firmware, b.firmware)
    || a.id.localeCompare(b.id));

console.table(sorted);
```

Since ES2019 `sort` is **stable**: elements that compare as equal keep their
original order.

### `sort` changes the array - sort a copy

```js run
const enclosures = doc.inventory.enclosures;
console.log(enclosures.map(e => e.id).join(" "));       // ENC-01 ENC-02 ENC-03 ENC-04

const byFirmware = [...enclosures].sort((a, b) => a.firmware.localeCompare(b.firmware));
console.log(byFirmware.map(e => e.id).join(" "));       // ENC-02 ENC-04 ENC-01 ENC-03
console.log(enclosures.map(e => e.id).join(" "));       // unchanged

// ES2023: toSorted returns a sorted COPY
const byState = enclosures.toSorted((a, b) => a.state.localeCompare(b.state));
console.log(byState.map(e => e.id).join(" "));          // ENC-03 ENC-01 ENC-02 ENC-04
```

- `[...arr].sort(...)` or `arr.slice().sort(...)` - copy, then sort. Works
  everywhere.
- `arr.toSorted(...)` - the same in one step (ES2023 - check that your rule engine
  supports it). Its brothers: `toReversed()`, `toSpliced()`, `with(index, value)`.
- **Never** `sort` an array of `doc` in place - the rest of the rule (and other
  helpers) would see the report in a different order.

`reverse` reverses the array in place; `toReversed` (ES2023) returns a reversed
copy.

### The boolean compare function - a bug in older code

```js run
const levels = ["2.14", "2.10", "2.12"];

// a compare function that returns true / false
console.log([...levels].sort((a, b) => a > b));         // the order may not change at all!
// the fix: return a number
console.log([...levels].sort((a, b) => (a > b ? 1 : a < b ? -1 : 0)));
```

`a > b` returns `true` or `false`, which become `1` and `0` - never a negative
number. Some engines sorted such arrays by luck; in today's Node.js and Chrome the
array above stays as it is. If you find `sort(function (a, b) { return a > b; })`
in a rule, it is a bug.

## 8. Chaining, `flat` and `flatMap` - and when a loop is clearer

### Chains

`map` and `filter` return arrays - so you can call the next method on the result
right away. Write one method per line:

```js run
const text = doc.inventory.enclosures
    .filter(enc => enc.state === "normal")      // the normal ones
    .map(enc => `${enc.id} (${enc.firmware})`)  // a text for each
    .join("; ");                                // one string
console.log(text);      // ENC-01 (2.14); ENC-02 (2.10); ENC-04 (2.10)
```

Read a chain from top to bottom: each line takes the array of the line above. Two
old homework tasks as chains:

```js run
// TASK 1: the words that start with a given letter
const quote = "A common mistake that people make when trying to design something completely foolproof is to underestimate the ingenuity of complete fools";
const filterWordsStartingWithLetter = (sentence, letter) =>
    sentence.split(" ").filter(word => word.startsWith(letter));
console.log(filterWordsStartingWithLetter(quote, "t"));
// [ 'that', 'trying', 'to', 'to', 'the' ]

// TASK 2: the sum of the squares of the even numbers
const sumOfSquaredEvens = arr =>
    arr.filter(x => x % 2 === 0).map(x => x * x).reduce((sum, x) => sum + x, 0);
console.log(sumOfSquaredEvens([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));     // 220
```

The other old tasks of this kind are in practice task 5.

::: tip Debugging a chain
When a chain gives a wrong result, cut it: put the first two lines into a
variable and print it, then add the next line. Or print inside a callback:
`.map(enc => { console.log(enc); return enc.id; })`.
:::

### `flat` and `flatMap` (ES2019)

`flat` turns an array of arrays into one array. `flatMap` is `map` followed by
`flat` - useful when each element gives **several** values:

```js run
console.log([[1, 2], [3, [4]]].flat());             // [ 1, 2, 3, [ 4 ] ] - one level
console.log([[1, 2], [3, [4]]].flat(Infinity));     // [ 1, 2, 3, 4 ] - all levels

// packed values: every record holds a list "a;b"
const consoles = [
    { item: "SYS", value: "CON-01;CON-02" },
    { item: "BAK", value: "CON-03" },
];
console.log(consoles.map(r => r.value.split(";")));      // [ [ 'CON-01', 'CON-02' ], [ 'CON-03' ] ]
console.log(consoles.flatMap(r => r.value.split(";")));  // [ 'CON-01', 'CON-02', 'CON-03' ]
```

`flatMap` can also **drop** an element: return `[]` for it.

### `Array.from` with a function

`Array.from` (lecture 4) takes a second argument: a `map` callback. With
`{ length: n }` it builds an array of `n` computed elements:

```js run
console.log(Array.from({ length: 3 }, (_, i) => `ENC-0${i + 1}`));   // [ 'ENC-01', 'ENC-02', 'ENC-03' ]
console.log(Array.from("4.2.1.7").filter(ch => ch !== "."));          // [ '4', '2', '1', '7' ]
```

(`_` is a common name for a parameter the function does not use.)

### When a loop is clearer

Methods are short and clear for **one** question at a time. A `for...of` loop is
often better when:

- you need to **stop early** in a way `find` / `some` cannot express, or skip with
  complex conditions;
- you compute **several results in one pass** (a count, a list and a maximum at
  once);
- the array is very large and the chain walks it several times - each method is
  one more pass over all elements (for a few thousand records this rarely
  matters);
- the callback becomes long - a long `reduce` especially.

```js run
// one pass, three results - a loop is natural here
let normal = 0;
const problems = [];
let lowest;
for (const enc of doc.inventory.enclosures) {
    if (enc.state === "normal") normal++;
    else problems.push(enc.id);
    if (lowest === undefined || enc.firmware < lowest) lowest = enc.firmware;
}
console.log(normal, problems, lowest);      // 3 [ 'ENC-03' ] 2.10
```

(`enc.firmware < lowest` compares strings - fine for `"2.10"` and `"2.14"`, but not
for `"2.9"`. In a real rule, use `compareVersions`.)

Choose what your team reads most easily. Both are correct; mixing is fine.

## 9. Grouping records

The record list of lecture 4 has one record per value - 79 records in
`report-records.json`, thousands in a real export:

```js run
const records = [
    { group: "Global Resources", item: "SYS", code: "BU", label: "Release", value: "10.12.39.0" },
    { group: "Enclosures", item: "ENC-01", code: "TY", label: "Type", value: "SSD-24" },
    { group: "Enclosures", item: "ENC-01", code: "FW", label: "Firmware", value: "2.14" },
    { group: "Enclosures", item: "ENC-01", code: "ST", label: "State", value: "normal" },
    { group: "Enclosures", item: "ENC-04", code: "TY", label: "Type", value: "SSD-24" },
    { group: "Enclosures", item: "ENC-04", code: "FW", label: "Firmware", value: "2.10" },
    { group: "Enclosures", item: "ENC-04", code: "ST", label: "State", value: "normal" },
    { group: "Pools", item: "POOL-001", code: "CP", label: "Capacity GiB", value: "7168" },
];
console.table(records);
```

A rule wants to ask "what is the firmware of ENC-04?" or "which enclosures are
there?". **Grouping** turns the flat list into an object: one key per group, and the
records of the group in an array.

### Four ways to write the same grouping

An old advanced task compared several solutions. All four give
`{ "Global Resources": [...], "Enclosures": [...], "Pools": [...] }`:

```js run
const records = [
    { group: "Global Resources", item: "SYS", code: "BU", value: "10.12.39.0" },
    { group: "Enclosures", item: "ENC-01", code: "FW", value: "2.14" },
    { group: "Enclosures", item: "ENC-04", code: "FW", value: "2.10" },
    { group: "Pools", item: "POOL-001", code: "CP", value: "7168" },
];

// 1. a for...of loop (lecture 6)
const byGroup1 = {};
for (const r of records) {
    if (!byGroup1[r.group]) byGroup1[r.group] = [];
    byGroup1[r.group].push(r);
}

// 2. forEach - the same, as a method
const byGroup2 = {};
records.forEach(r => {
    if (!byGroup2[r.group]) byGroup2[r.group] = [];
    byGroup2[r.group].push(r);
});

// 3. reduce: the accumulator is the object of groups
const byGroup3 = records.reduce((acc, r) => {
    if (!acc[r.group]) acc[r.group] = [];
    acc[r.group].push(r);
    return acc;
}, {});

// 4. Object.groupBy (ES2024): built in
const byGroup4 = Object.groupBy(records, r => r.group);

console.log(Object.keys(byGroup1), byGroup1.Enclosures.length);
console.log(Object.keys(byGroup3), byGroup3.Enclosures.length);
console.log(byGroup4);
```

- The **loop** and **`forEach`** versions are the easiest to read.
- **`reduce`** keeps it in one expression - common in modern code.
- **`Object.groupBy`** is the shortest. It is new (ES2024, Node.js 21+): check that
  your rule engine supports it. Its result has no prototype, so Node.js prints it as
  `[Object: null prototype] { ... }` - it works like any other object, it only has
  no inherited keys such as `toString`.

The old task also had a "short" form:
`acc[r.group] = (acc[r.group] || []).concat(r);`. It works, but `concat` builds a
**new** array for every record and copies the old one into it - with thousands of
records that is much slower than `push`.

::: tip `groupBy` in your library
Your rule engine may not have `Object.groupBy`. A small helper - the sample rule at
the top has one - works everywhere: `groupBy(list, keyOf)`, where `keyOf` is a
callback that returns the key of a record. Put it into `library.js` (section 12).
:::

### Two levels: group, then item

For a record list, one level is not enough: you want
`nested["Enclosures"]["ENC-04"]["Firmware"]` - the record list read like the nested
JSON document of lecture 6:

```js run
const records = [
    { group: "Global Resources", item: "SYS", code: "BU", label: "Release", value: "10.12.39.0" },
    { group: "Enclosures", item: "ENC-01", code: "FW", label: "Firmware", value: "2.14" },
    { group: "Enclosures", item: "ENC-01", code: "ST", label: "State", value: "normal" },
    { group: "Enclosures", item: "ENC-04", code: "FW", label: "Firmware", value: "2.10" },
    { group: "Enclosures", item: "ENC-04", code: "ST", label: "State", value: "normal" },
];

function nestRecords(records) {
    const nested = {};
    for (const r of records) {
        if (!nested[r.group]) nested[r.group] = {};
        if (!nested[r.group][r.item]) nested[r.group][r.item] = {};
        nested[r.group][r.item][r.label] = r.value;     // the label becomes a key
    }
    return nested;
}

const nested = nestRecords(records);
console.log(nested);
console.log(nested["Enclosures"]["ENC-04"]["Firmware"]);           // 2.10
console.log(Object.keys(nested["Enclosures"]));                    // [ 'ENC-01', 'ENC-04' ]
console.log(nested["Pools"]?.["POOL-001"]?.["Capacity GiB"] ?? "no data");   // no data
```

Walk the list **once**, and every later question is a direct lookup. The
`get(nested, ["Enclosures", "ENC-04", "Firmware"])` of lecture 6 works on the
result too. This is what library helpers for record exports do: group once, then
read by path.

### Counting per group

With the groups ready, counting is `Object.entries` + `map`:

```js run
const enclosures = doc.inventory.enclosures;
const byState = Object.groupBy(enclosures, enc => enc.state);
const counts = Object.entries(byState).map(([state, list]) => `${state}: ${list.length}`);
console.log(counts.join(", "));         // normal: 3, degraded: 1
```

## 10. Indexes: `Map` and `Set`

### An index: look up instead of searching

"For every enclosure, find its state" - with `find` inside `map`, each lookup walks
the whole list again. An **index** is an object built in one pass, keyed by what
you look up:

```js run
const records = doc.inventory.enclosures.flatMap(enc => [
    { item: enc.id, code: "FW", value: enc.firmware },
    { item: enc.id, code: "ST", value: enc.state },
]);
console.log(records.length);        // 8 records

// slow: a find for every lookup
const slow = ["ENC-03", "ENC-04"].map(id =>
    records.find(r => r.item === id && r.code === "ST")?.value);

// fast: an index, built once - the key is "item|code"
const index = {};
for (const r of records) index[`${r.item}|${r.code}`] = r.value;

const fast = ["ENC-03", "ENC-04"].map(id => index[`${id}|ST`]);
console.log(slow, fast);            // [ 'degraded', 'normal' ] [ 'degraded', 'normal' ]
```

With 9,500 records and 100 lookups, the slow version makes up to 950,000
comparisons; the index makes 9,500 steps once, and then each lookup is immediate.
Try it - the times differ on every computer, the ratio does not:

```js run
// 10,000 made-up records: 2,500 items with 4 codes each
const many = Array.from({ length: 10_000 }, (_, i) => ({
    item: "ITEM-" + Math.floor(i / 4),
    code: ["FW", "ST", "TY", "TP"][i % 4],
    value: String(i)
}));
const ids = Array.from({ length: 1000 }, (_, i) => "ITEM-" + i * 2);

console.time("find in a loop");
const a = ids.map(id => many.find(r => r.item === id && r.code === "ST").value);
console.timeEnd("find in a loop");

console.time("index");
const idx = {};
for (const r of many) idx[r.item + "|" + r.code] = r.value;
const b = ids.map(id => idx[id + "|ST"]);
console.timeEnd("index");

console.log(a.join() === b.join());     // true - the same answers
```

### A trap of objects as indexes

A plain object **inherits** keys like `constructor` and `toString` (lecture 6). If
an id happens to be one of them, the index lies:

```js run
const index = {};
index["ENC-01"] = "normal";
console.log(index["ENC-01"]);           // normal
console.log(index["constructor"]);      // [Function: Object] - not ours!
console.log(Object.hasOwn(index, "constructor"));   // false - the safe check

const safe = Object.create(null);       // an object with no prototype at all
console.log(safe["constructor"]);       // undefined
```

`Object.create(null)` - or a `Map` - avoids it. (`Object.groupBy` returns such an
object.)

### `Map`

A `Map` is a collection of key / value pairs made for lookups:

```js run
const states = new Map();
states.set("ENC-01", "normal");
states.set("ENC-03", "degraded");

console.log(states.get("ENC-03"));      // degraded
console.log(states.get("ENC-99"));      // undefined
console.log(states.has("ENC-01"));      // true
console.log(states.size);               // 2
states.delete("ENC-01");
console.log(states);                    // Map(1) { 'ENC-03' => 'degraded' }

// from [key, value] pairs - for example from map()
const byId = new Map(doc.inventory.enclosures.map(enc => [enc.id, enc]));
console.log(byId.get("ENC-02").firmware);       // 2.10

// walk it: the pairs, in the order they were added
for (const [id, enc] of byId) console.log(id, enc.state);
```

| | Object as an index | `Map` |
|---|---|---|
| Keys | strings (numbers become strings) | any value - also numbers, objects |
| Order | integer-like keys first, then creation order (lecture 6) | always the order of insertion |
| Size | `Object.keys(obj).length` | `map.size` |
| Inherited keys | yes (`constructor`, ...) unless `Object.create(null)` | none |
| JSON | `JSON.stringify` works | prints `{}` - convert with `Object.fromEntries(map)` |

For an index inside a rule, both work. Use `Map` when keys are not plain strings or
when ids could clash with inherited keys; use an object when the result goes into
JSON (an alert, a file).

```js run
const byId = new Map(doc.inventory.enclosures.map(enc => [enc.id, enc.state]));
console.log(JSON.stringify(byId));                      // {} - a Map is not JSON data
console.log(JSON.stringify(Object.fromEntries(byId)));  // {"ENC-01":"normal",...}

// Map.groupBy (ES2024): like Object.groupBy, the result is a Map
const byType = Map.groupBy(doc.inventory.enclosures, enc => enc.type);
console.log(byType.get("HDD-12").map(enc => enc.id));    // [ 'ENC-03', 'ENC-04' ]
```

### `Set`: unique values

A `Set` holds each value **once**:

```js run
const firmware = doc.inventory.enclosures.map(enc => enc.firmware);
console.log(firmware);                  // [ '2.14', '2.10', '2.14', '2.10' ]

const unique = new Set(firmware);
console.log(unique);                    // Set(2) { '2.14', '2.10' }
console.log(unique.size);               // 2 - two different levels
console.log(unique.has("2.10"));        // true

// back to an array
console.log([...unique]);               // [ '2.14', '2.10' ]

// "do all enclosures run the same firmware?"
console.log(new Set(firmware).size === 1);      // false
```

The older way to remove duplicates is
`list.filter((x, i, arr) => arr.indexOf(x) === i)` - "keep the first occurrence".
It walks the array again for every element; `[...new Set(list)]` is shorter and
faster.

`Set` and `Map` are ES2015 - available everywhere. ES2025 added set operations
(`union`, `intersection`, `difference`, ...) - check that your rule engine supports
them before you use them.

## 11. Reading existing rules

First, run the rule from the start of the lecture:

```js run
function emit(id, details) {          // fake: prints instead of creating an alert
    console.log("ALERT for " + id + ": " + JSON.stringify(details));
}

const MODELS = ["XR-210", "XR-220"];
const MIN_FIRMWARE = "2.14";

function compareVersions(a, b) {
    const pa = String(a ?? "").split(".").map(x => parseInt(x, 10) || 0);
    const pb = String(b ?? "").split(".").map(x => parseInt(x, 10) || 0);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const x = pa[i] ?? 0, y = pb[i] ?? 0;
        if (x !== y) return x < y ? -1 : 1;
    }
    return 0;
}

function groupBy(list, keyOf) {
    const groups = {};
    for (const item of list) {
        const key = keyOf(item);
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
    }
    return groups;
}

function rule(doc) {
    if (!MODELS.includes(doc.overview?.model)) return;
    const enclosures = doc.inventory?.enclosures ?? [];

    const outdated = enclosures.filter(enc => compareVersions(enc.firmware, MIN_FIRMWARE) < 0);
    const anyNotNormal = enclosures.some(enc => enc.state !== "normal");
    if (outdated.length === 0 && !anyNotNormal) return;

    const lowest = enclosures
        .map(enc => enc.firmware)
        .reduce((low, fw) => (compareVersions(fw, low) < 0 ? fw : low));

    const lines = [...outdated]
        .sort((a, b) => compareVersions(a.firmware, b.firmware) || a.id.localeCompare(b.id))
        .map(enc => `${enc.id} (${enc.firmware})`);

    const byType = groupBy(enclosures, enc => enc.type);
    const types = Object.entries(byType).map(([type, list]) => `${type}: ${list.length}`);

    emit(doc.status.device_alias, {
        "Model": doc.overview.model,
        "Enclosures": types.join(", "),
        "Lowest firmware": lowest,
        "Outdated": lines.join("; "),
        "Not normal": enclosures.filter(enc => enc.state !== "normal").map(enc => enc.id).join(", ")
    });
}

console.log("example JSON document:");
rule(doc);

console.log("a second report:");
rule({
    overview: { model: "XR-210" },
    status: { device_alias: "LAB-DEV-02" },
    inventory: { enclosures: [
        { id: "ENC-01", type: "SSD-24", firmware: "2.14", state: "normal" },
        { id: "ENC-02", type: "SSD-24", firmware: "2.9", state: "normal" },
        { id: "ENC-03", type: "SSD-24", firmware: "2.12", state: "normal" }
    ] }
});
```

Here is a rule in the older style that does the same work - `var`, `function (x)`
callbacks, `forEach` with `push`, `for...in`, a catch-all `try`:

```js run
function emit(id, details) {
    console.log("ALERT for " + id + ": " + JSON.stringify(details));
}

function rule(doc) {  // never change this line
    try {
        var models = ["XR-210", "XR-220"];
        if (models.indexOf(doc.overview.model) === -1) return;
        var encs = doc.inventory.enclosures;

        var outdated = encs.filter(function (e) { return e.firmware < "2.14"; });
        var notNormal = [];
        encs.forEach(function (e) {
            if (e.state != "normal") notNormal.push(e.id);
        });
        if (outdated.length == 0 && notNormal.length == 0) return;

        var byType = {};
        encs.forEach(function (e) {
            if (!byType.hasOwnProperty(e.type)) byType[e.type] = [];
            byType[e.type].push(e);
        });
        var types = [];
        for (var t in byType) {
            if (byType.hasOwnProperty(t)) types.push(t + ": " + byType[t].length);
        }

        var lines = [];
        outdated.sort(function (a, b) { return a.firmware > b.firmware; })
                .forEach(function (e) { lines.push(e.id + " (" + e.firmware + ")"); });

        var details = new Object();
        details["Model"] = doc.overview.model;
        details["Enclosures"] = types.join(", ");
        details["Outdated"] = lines.join("; ");
        details["Not normal"] = notNormal.join(", ");
        emit(doc.status.device_alias, details);
    } catch (err) {
        return;
    }
}

console.log("example JSON document:");
rule(doc);

console.log("a second report:");
rule({
    overview: { model: "XR-210" },
    status: { device_alias: "LAB-DEV-02" },
    inventory: { enclosures: [
        { id: "ENC-01", type: "SSD-24", firmware: "2.14", state: "normal" },
        { id: "ENC-02", type: "SSD-24", firmware: "2.9", state: "normal" },
        { id: "ENC-03", type: "SSD-24", firmware: "2.12", state: "normal" }
    ] }
});
console.log("(end)");
```

**Check yourself:**

1. Match the parts: which lines of the old rule do the work of `filter`, of the
   `notNormal` list, of `groupBy`, of `Object.entries(...).map(...)`?
2. For the second report the modern rule reports `ENC-02 (2.9); ENC-03 (2.12)`,
   the old rule only `ENC-03 (2.12)`. Which line misses ENC-02, and why? (Lecture 3.)
3. `outdated.sort(function (a, b) { return a.firmware > b.firmware; })` - what is
   wrong with it? Does it change `doc`?
4. The old rule has no "Lowest firmware". Write it with `reduce` and
   `compareVersions`, in one line.
5. A report has `enclosures: []`. What does each rule do? And a report **without**
   `enclosures`?

::: details Answer
1. `encs.filter(function (e) { ... })` is the `filter`; the first `forEach` with
   `push` is `filter` + `map` (the `notNormal` list); the second `forEach` with
   `hasOwnProperty` is `groupBy`; the `for...in` loop with `push` is
   `Object.entries(byType).map(...)`.
2. `encs.filter(function (e) { return e.firmware < "2.14"; })` compares
   **strings**, character by character: `"2.12" < "2.14"` is `true` (`"2"` < `"4"`
   at position 3), but `"2.9" < "2.14"` is `false` (`"9"` > `"1"` at position 2) -
   although version 2.9 is lower than 2.14. The modern rule compares the parts as
   numbers with `compareVersions`. Nothing fails, so nobody notices: one outdated
   enclosure is silently missing from the alert.
3. The callback returns `true` / `false`, never a negative number - the order is
   not reliable (section 7). It does not change `doc`: `filter` made a new array,
   and `sort` changes only that one. `encs.sort(...)` would change `doc`.
4. `const lowest = encs.map(e => e.firmware).reduce((low, fw) => (compareVersions(fw, low) < 0 ? fw : low));` -
   safe here, because the rule already returned when there were no enclosures (or
   give an initial value).
5. `[]`: both return without an alert - nothing is outdated, nothing is not normal.
   Without `enclosures`: the old rule calls `undefined.filter` - a `TypeError`,
   swallowed by the `catch`: no alert and no error. The modern rule uses
   `?? []` and also gives no alert - but on purpose, and a real bug elsewhere would
   still show as an error.
:::

## 12. The course project: kickoff

From today the helpers you write go into **your own repository** - the start of
the course project ([Course project](/project)).

### 1. Choose

- **The product**: one product whose reports you know well.
- **Two or three sample documents**: anonymised reports of that product - no real
  customer names, serials or addresses in the repository.
- **The rules**: two or three existing rules of that product that are hard to read
  or that repeat code. The project rewrites them with the library.

### 2. Set up the repository

Create an empty repository on GitHub (private), clone it, and add the folders:

```text
my-library/
|-- library.js        the helpers
|-- try.js            a small script that uses them
|-- samples/          the anonymised sample documents (*.json)
|-- rules/            rules rewritten with the library (later)
`-- README.md         one line for now: what the library is for
```

### 3. `library.js`: the helpers you already have

Copy in the helpers of lectures 5 - 7 (your own versions from the practice tasks):
`compareVersions`, `versionBelow`, `get`, `groupBy` - and today's index helper. The
last lines **export** them, so that other files can use them:

```js
// library.js - helpers for the reports of <product>
"use strict";

function compareVersions(a, b) { /* lecture 5 */ }
function versionBelow(current, minimum) { /* lecture 5 */ }
function get(obj, path, fallback) { /* lecture 6 */ }
function groupBy(list, keyOf) { /* lecture 7 */ }

module.exports = { compareVersions, versionBelow, get, groupBy };
```

and use them from another file, with `require` - the same way every practice task
loads `check.js`, and the same way your rules load `require("library.js")`:

```js
// try.js - run it with: node try.js
"use strict";
const lib = require("./library.js");
const doc = require("./samples/report-01.json");

console.log(lib.get(doc, "overview.model"));
console.log(lib.versionBelow("4.10", "4.2"));       // false
```

`module.exports` and `require` are explained in lecture 9 - today, use them as a
recipe. Commit and push.

### 4. Plan the first helpers

Look at your rules and your sample documents, and write down:

- the paths you read again and again - each one can become a small helper
  (`firmwareVersion(doc)`, `deviceName(doc)`);
- the shape of the lists in your product's reports - a list of records, a
  dictionary, a flattened export (lecture 6) - and which helper turns it into
  something easy to read (`nestRecords`, `asList`, an index);
- the version formats of your product (lecture 8 normalises them).

Lectures 8 - 10 add version and date parsing, a local rule runner with a fake
`emit`, tests and JSDoc types.

## 13. Practice

In your copy of the Homework repository, first get the new tasks:

```bash
git pull upstream main
node 07-array-methods/practice/task1-predict.js
```

Each file explains the task at the top. Write your code between the `your code`
lines; the checks at the bottom print `OK` or `FAIL`.

| Task | File | What you do |
|------|------|-------------|
| 1 | `task1-predict.js` | Predict 20 results: `map`, `filter`, `find`, `some`, `every`, `reduce`, `sort`, `flat`, `Set` |
| 2 | `task2-enclosures.js` | Questions about the enclosures, one method each: ids, outdated, first not normal, all normal?, lowest firmware, a summary text |
| 3 | `task3-sort.js` | Sort numbers, names, versions and records - by several keys, without changing the input |
| 4 | `task4-group-records.js` | The 79 records of `report-records.json`: group, nest by group and item, an index, unique values, totals |
| 5 | `task5-classic-methods.js` | The old tasks with `map`, `filter`, `reduce`, `find` and `sort`: cities, todos, products, books |

## Summary

| Topic | Remember |
|-------|----------|
| Callbacks | The method calls your function with `(element, index, array)`; arrow or `function` - both work |
| `forEach` | Side effects only; returns `undefined`; no `break` |
| `map` | A new array, same length - one returned value per element; `({ ... })` for objects; not `.map(parseInt)` |
| `filter` | A new array with the elements whose callback is truthy; `.length` counts; `filter(Boolean)` drops empty values |
| `find` / `findIndex` | The first match / its index; `undefined` / `-1` when none - check before use |
| `some` / `every` | At least one / all; stop early; `[].every(...)` is `true` |
| `reduce` | Accumulator from element to element; always give the initial value |
| `sort` | In place; without a compare function sorts as strings; `a - b`, `localeCompare`, `compareVersions`; several keys with `\|\|`; sort a copy (`[...arr]`, `toSorted`) |
| Chains | One method per line; each line takes the array above; cut it to debug |
| `flat` / `flatMap` | Flatten nested lists; `flatMap` for elements that give several values |
| Grouping | One pass into `{ key: [records] }`; loop, `reduce` or `Object.groupBy` (ES2024); two levels for record lists |
| Index | Build once, look up many times; object (watch inherited keys) or `Map` |
| `Set` | Unique values; `new Set(list)`, `size`, `has`, `[...set]` |
| `console.table` | Records as a table - look at the data first |
| Old style | `function (x) { return ...; }`, `forEach` + `push`, string comparisons of versions, boolean compare functions - read it, modernise it |

## Homework

1. Finish the five practice tasks - every check must print `OK`.
2. `07-array-methods/homework.js` (in the homework repository): outdated modules
   from a dictionary, sorted; a pool report from the record list; and an index for
   a whole set of lookups.
3. **Course project:** create your repository (section 12) with `library.js`,
   `try.js` and two or three anonymised sample documents. Put in your `get`,
   `compareVersions`, `versionBelow` and `groupBy`, export them, and run `try.js`.
4. Optional: take one of your rules and find every loop in it. Which could be a
   method? Which should stay a loop?

## Read more

- MDN: [Array methods](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array#instance_methods),
  [map()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map),
  [filter()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter),
  [reduce()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce),
  [sort()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort),
  [find()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find),
  [Object.groupBy()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/groupBy),
  [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map),
  [Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set),
  [console.table()](https://developer.mozilla.org/en-US/docs/Web/API/console/table_static)
- javascript.info: [Array methods](https://javascript.info/array-methods),
  [Map and Set](https://javascript.info/map-set)
- Eloquent JavaScript (4th edition): [Higher-order functions](https://eloquentjavascript.net/05_higher_order.html)
- Exercises: [JavaScript array exercises](https://www.w3resource.com/javascript-exercises/javascript-array-exercises.php) (w3resource)

**Next session:** strings, regular expressions, dates and numbers - clean the
version formats of your products, read the patterns in existing rules, and turn
the many date formats of the reports into dates you can compare.
