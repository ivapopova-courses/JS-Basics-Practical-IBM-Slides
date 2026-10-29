---
title: 4. Arrays and lists of records
---

# 4. Arrays and lists of records

<div class="lecture-meta">
  <span>Session 4</span><span>practice: <code>04-arrays-and-records/</code> in the homework repository</span>
  <span><a href="../example-document"><code>doc</code>: the example JSON document</a></span>
</div>

**Today you will learn to:**

- create an array, read and change its elements by index, and use `length`;
- know why an array is an object, and which bugs come from that;
- add and remove elements with `push`, `pop`, `unshift`, `shift` and `splice`;
  copy a part with `slice`; read from the end with `at`;
- search with `indexOf`, `includes` and `lastIndexOf`, and replace a chain of
  `===` with an allow-list;
- cut a string into an array with `split` and glue an array into a string with
  `join` - for versions and for values packed into one string (`"a;b"`,
  `"key=value,key=value"`);
- loop over an array with `for` and `for...of`, forwards and backwards;
- sum, count, find the largest element and collect elements into new arrays;
- work with arrays of arrays (tables);
- find, count and collect records in a list of objects;
- check that a value really is an array, with `Array.isArray`;
- read the array code in existing rules.

Where this fits in the sample check rule - today's rule checks a **list**: the
enclosures of the device. The number in each comment is the section of this
lecture:

```js
// 6. an allow-list instead of a chain of ===
const MODELS = ["XR-210", "XR-220"];

function rule(doc) {
    if (!doc.overview || !doc.inventory?.details) return;

    const model = doc.overview.model;
    if (!MODELS.includes(model)) return;        // 6. includes

    // 7. split: the version is the first word of the firmware level
    const level = doc.inventory.details.firmware_level ?? "";
    const version = level.split(" ")[0];        // 2, 7. split

    // 10. a list of records: check every enclosure, collect the problems
    const enclosures = doc.inventory.enclosures;
    if (!Array.isArray(enclosures)) return;     // 4. isArray
    const problems = [];                        // 1. empty array
    for (const enc of enclosures) {             // 8. for...of
        if (enc.state !== "normal") {
            problems.push(`${enc.id} is ${enc.state}`);   // 5. push
        }
        if (versionBelow(enc.firmware, "2.14")) {
            problems.push(`${enc.id} has firmware ${enc.firmware}`);
        }
    }
    if (problems.length === 0) return;          // 3. length

    const name = doc.inventory.extended_info?.json?.data?.system?.name
                 || doc.status.device_alias;
    emit(name, {
        "Model": model,
        "Version": version,
        "Problems": problems.length,
        "Details": problems.join("; ")          // 7. join
    });
}
```

- `versionBelow(a, b)` is still the ready-made helper from lecture 3; we write our
  own in session 5.
- The example JSON document now has two lists: `doc.inventory.features` (strings) and
  `doc.inventory.enclosures` (objects). In
  [section 11](#_11-reading-existing-rules) you run this rule, and read the same
  rule in the older style.

Real reports are full of lists: drives, nodes, enclosures, pools, and long lists
of key / value records. Rules walk through them, search in them and build new
lists for the alert text.

## 1. What is an array?

The types so far - number, string, boolean, `null`, `undefined` - are
**primitive** (simple) types: one value each. An **array** is a **composite**
type: an **ordered** list of values, kept together under one name.

- The values in an array are its **elements**.
- The position of an element is its **index**. Like in most programming
  languages, counting starts at **0**.
- The **order** of the elements matters: `["a", "b"]` and `["b", "a"]` are
  different arrays.
- An element can be a value of **any** type - also another array or an object.

```js run
// an array of strings
let colors = ["red", "orange", "yellow", "green", "blue"];

// an array with values of different types
let user = ["Ada", 34, true];

// an empty array
let arr = [];

console.log(colors);
console.log(user);
console.log(arr);
```

The elements are written in square brackets `[` `]`, separated by commas. A
comma after the last element (a *trailing comma*) is allowed - it makes long,
one-element-per-line lists easier to edit:

```js run
const MODELS = [
    "XR-210",
    "XR-220",
    "XR-230",       // trailing comma: fine
];
console.log(MODELS.length);     // 3

const features = doc.inventory.features;    // an array from the report
console.log(features);          // [ 'dedup', 'compression', 'encryption' ]
```

In memory, the variable does not hold the elements themselves. It holds a
**reference** - an arrow - to the array, which lives in a separate area of memory
(the *heap*). This matters in [section 4](#_4-an-array-is-an-object-advanced).

::: info Animation
**Arrays in memory:** [1. Indexes](../animations/arraysInMemory.html#1){target="_blank"}
:::

### Creating an array: `[]` and the older `new Array()`

Always create arrays with `[...]`. In older code you also see the `Array`
constructor. It has a trap: with **one number**, it does not create an array with
that number, but an empty array of that **length**:

```js run
const a = new Array("XR-210", "XR-220");   // same as ["XR-210", "XR-220"]
const b = new Array(3);                    // NOT [3]: 3 empty places
const c = Array.of(3);                     // [3] (ES2015)

console.log(a, a.length);
console.log(b.length);                     // 3
console.log(c, c.length);                  // [ 3 ] 1
```

`Array.from` (ES2015) builds an array from something that looks like a list - for
example, a string:

```js run
console.log(Array.from("4.2"));    // [ '4', '.', '2' ]
console.log([..."4.2"]);           // the same with spread (section 5)
```

## 2. Accessing the elements

An element is read or changed with the name of the array, then the index in
square brackets: `arrayName[i]`. `arrayName[i]` is an expression - it always
gives a value: the element.

```js run
// define the array fruits
let fruits = ["apple", "banana", "strawberry"];

// read the first element
console.log("first fruit is:", fruits[0]);

// write the third element
fruits[2] = "orange";

// print the whole array
console.log("fruits =", fruits);    // [ 'apple', 'banana', 'orange' ]
```

With the report:

```js run
const features = doc.inventory.features;
console.log(features[0]);           // dedup
console.log(features[1]);           // compression

const enclosures = doc.inventory.enclosures;
console.log(enclosures[0].id);      // ENC-01 - first the index, then the key
```

An index is a whole number from `0` up. A variable or an expression works too:

```js run
const parts = ["4", "2", "1", "7"];
const i = 2;
console.log(parts[i]);          // 1
console.log(parts[i + 1]);      // 7
```

### Reading an index that does not exist

There is **no error**. You get `undefined`:

```js run
let arr = [2, 4, 6];
console.log(arr[4]);      // undefined
console.log(arr[-1]);     // undefined - -1 does not count from the end here
```

::: warning A silent `undefined`
A wrong index is not an error, so the bug shows up later - for example as
`"undefined"` inside an alert text. When you read an element by index, ask: can
the array be shorter than I think?
:::

### Writing to an index that does not exist

The element is written there, and the places in between become **empty**
(*holes*):

```js run
let arr = [2, 4, 6];
arr[4] = 8;
console.log(arr);           // [ 2, 4, 6, <1 empty item>, 8 ]
console.log(arr.length);    // 5
console.log(arr[3]);        // undefined
```

(`<1 empty item>` is how Node.js and this page show a hole.)

### The last element

MDN: [Array.prototype.at()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/at)

The index of the last element is `length - 1`:

```js run
let arr = [2, 4, 6];
console.log(arr[arr.length - 1]);    // 6
console.log(arr.at(-1));             // 6 - at() counts from the end: -1, -2 ...
console.log(arr.at(0));              // 2 - at(0) is the same as arr[0]
```

::: info ES2022+
`at()` is ES2022 - check that your rule engine supports it. The form
`arr[arr.length - 1]` works everywhere.
:::

::: info Animation
**Arrays in memory:** [1. Indexes](../animations/arraysInMemory.html#1){target="_blank"},
[2. Out of range](../animations/arraysInMemory.html#2){target="_blank"}
:::

## 3. The `length` property

MDN: [Array: length](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/length)

`arrayName.length` is the number of elements. It is **dynamic**: it changes when
the array changes - and **writing** to it changes the array:

```js run
let arr = [2, 4, 6];
console.log(arr.length);     // 3

// make the array longer: the new places are empty
arr.length = 5;
console.log(arr);            // [ 2, 4, 6, <2 empty items> ]

// make it shorter: the elements at the end are deleted
arr.length = 2;
console.log(arr);            // [ 2, 4 ]

// delete all elements
arr.length = 0;
console.log(arr);            // []
```

`length` is always **one more than the last index**. An empty array has
`length` 0.

```js run
const enclosures = doc.inventory.enclosures;
console.log(enclosures.length);                    // 4
console.log(enclosures[enclosures.length - 1].id); // ENC-04
```

### Common bugs

**`=` instead of `===` in an emptiness check:**

```js run
let arr = [2, 4, 6];
if (arr.length = 0) {          // assignment, not comparison!
    console.log("Empty array!");
}
console.log(arr);              // [] - we deleted all elements by mistake
```

`arr.length = 0` is an assignment. It deletes the elements and gives `0`, which
is falsy, so the `if` does not even run. The correct code:

```js run
let arr = [2, 4, 6];
if (arr.length === 0) {
    console.log("Empty array!");
}
console.log(arr);              // [ 2, 4, 6 ]
```

**A typo in `length`:**

```js run
let arr = [2, 4, 6];
if (arr.lenght) {              // lenght, not length
    console.log("Non-empty array");
} else {
    console.log("Empty array");  // this runs!
}
```

`arr.lenght` is not an error: an array has no property `lenght`, so the value is
`undefined` - falsy. The correct check `if (arr.length)` prints
`Non-empty array`. (Why there is no error - section 4 and session 6.) Your editor
helps here: VSCode underlines unknown properties when the file starts with
`// @ts-check` (session 10).

### Empty or not?

| Check | Means |
|-------|-------|
| `arr.length === 0` | the array is empty |
| `arr.length > 0` | it has at least one element |
| `if (arr.length)` | the same, short form (0 is falsy) |
| `if (arr)` | **not** a check for emptiness - `[]` is truthy! |

```js run
const problems = [];
console.log(Boolean(problems));      // true  - an empty array is truthy
console.log(problems.length === 0);  // true  - the right check
```

::: info Animation
**Arrays in memory:** [2. Out of range](../animations/arraysInMemory.html#2){target="_blank"}
(writing to `length`, and the `=` bug)
:::

## 4. An array is an object (advanced)

In JavaScript, arrays are implemented as **objects**:

```js run
let arr = [2, 4, 6];
console.log(typeof arr);              // object
console.log(Array.isArray(arr));      // true  - the right check
console.log(Array.isArray("2,4,6"));  // false
console.log(Array.isArray({}));       // false
```

The indexes are the keys `"0"`, `"1"`, `"2"` of that object. Because of this, a
wrong "index" gives **no error** - it simply becomes an ordinary **property** of
the object, and it is not counted in `length`:

```js run
let arr = [2, 4, 6];
arr[-1] = 0;      // not a valid index - becomes a property named "-1"
arr["a"] = 10;    // not a valid index - becomes a property named "a"

console.log(arr.length);           // 3
console.log(arr["-1"], arr.a);     // 0 10
console.log(arr[1], arr["1"]);     // 4 4 - the index 1 is the key "1"
// Node.js prints arr as [ 2, 4, 6, '-1': 0, a: 10 ]
```

Arrays also come with built-in properties and **methods** (functions attached to
the array) for the common operations: `length`, `push`, `pop`, `slice` and many
more. You do not need to learn them by heart - they are well documented in
[MDN: Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array).
Today you meet the ones rules use most; the rest (`map`, `filter`, `sort`, ...)
come in session 7.

### Is it an array? `Array.isArray`

MDN: [Array.isArray()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray)

JSON data does not always have the shape you expect. A list can be missing, can
be `null`, or can be one object instead of a list with one object. `typeof`
cannot tell an array from an object - `Array.isArray` can:

```js run
console.log(typeof [], typeof {}, typeof null);   // object object object
console.log(Array.isArray(doc.inventory.enclosures));  // true
console.log(Array.isArray(doc.inventory.details));     // false - an object
console.log(Array.isArray(doc.inventory.missing));     // false - undefined
```

### References: two names, one array

A variable holds a **reference** to the array, not the array itself. Copying the
variable copies the reference - both names point to the **same** array:

```js run
const fruits = ["apple", "banana"];
let b = fruits;           // no new array - one more arrow to the same one
b.push("kiwi");
console.log(fruits);      // [ 'apple', 'banana', 'kiwi' ] - fruits changed too!
console.log(b === fruits);            // true  - the same array
console.log([1, 2] === [1, 2]);       // false - two different arrays
```

- `===` compares arrays **by reference**: "is it the same array?", not "are the
  elements the same?".
- `const` protects the **variable** (the arrow), not the array: `fruits.push(...)`
  and `fruits[0] = ...` are allowed, `fruits = [...]` is an error.

```js run
const fruits = ["apple", "banana"];
fruits[0] = "mango";      // allowed - the array changes
console.log(fruits);
// fruits = ["plum"];     // TypeError: Assignment to constant variable.
```

A **copy** is a new array with the same elements: `arr.slice()` or `[...arr]`
(section 5).

```js run
const original = doc.inventory.features;
const copy = [...original];        // a new array
copy.push("snapshots");
console.log(original.length, copy.length);   // 3 4 - the report is not changed
```

::: danger Do not change the report
In a rule, `doc` belongs to the engine. If one part of a rule changes a list of
`doc` (with `push`, `splice`, `sort`, `length = 0` ...), every later line sees
the changed data. Work on a copy, or build a new array.
:::

::: tip Comparing two arrays
To check if two short arrays of strings or numbers have the same elements,
compare their text: `a.join(",") === b.join(",")` (section 7). The homework
checks in this course do the same with `JSON.stringify` (session 9).
:::

::: info Animations
**Arrays in memory:** [3. An array is an object](../animations/arraysInMemory.html#3){target="_blank"},
[5. References](../animations/arraysInMemory.html#5){target="_blank"}
:::

## 5. Adding and removing elements

### At the end and at the start: `push`, `pop`, `unshift`, `shift`

MDN: [Array.prototype.push()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/push), [Array.prototype.pop()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/pop), [Array.prototype.unshift()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/unshift), [Array.prototype.shift()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/shift)

| Method | Does | Returns |
|--------|------|---------|
| `arr.push(x, ...)` | adds at the **end** | the new length |
| `arr.pop()` | removes the **last** element | the removed element |
| `arr.unshift(x, ...)` | adds at the **start** | the new length |
| `arr.shift()` | removes the **first** element | the removed element |

::: tip How to read an MDN reference page
Open the page of `push` above. Every reference page has the same parts:

- **The title.** `Array.prototype.push()` is a method of every array: you call
  it as `arr.push(...)`. A title without `prototype`, like `Array.isArray()`, is
  called on `Array` itself: `Array.isArray(x)`.
- **Syntax.** The ways to call it, one per line. A parameter that appears only
  in some lines can be left out.
- **Parameters.** What each argument means. "Optional" means you may leave it out.
- **Return value.** What the call gives back. For `push`: the new length, not
  the array - the column "Returns" in the table above.
- **Description.** The details. For arrays it says if the method changes the
  array ("a mutating method") or returns a new one - see
  [Which methods change the array?](#which-methods-change-the-array) below.
- **Examples.** Short code you can paste into the editor and run.
- **Browser compatibility.** Since when the feature works. The table has a
  column for Node.js too. For a feature newer than ES2020, check that your rule
  engine supports it.
:::

```js run
let fruits = ["apple", "banana", "strawberry"];

// number of elements
console.log(fruits.length);      // 3

// add an element at the start
fruits.unshift("orange");
console.log(fruits);             // [ 'orange', 'apple', 'banana', 'strawberry' ]

// add an element at the end
fruits.push("lemon");
console.log(fruits);    // [ 'orange', 'apple', 'banana', 'strawberry', 'lemon' ]

// remove the first element
fruits.shift();
console.log(fruits);             // [ 'apple', 'banana', 'strawberry', 'lemon' ]

// remove the last element
fruits.pop();
console.log(fruits);             // [ 'apple', 'banana', 'strawberry' ]
```

The returned values are useful too - an example with the rainbow:

```js run
const rainbow = ["red", "orange", "yellow", "green", "blue", "indigo", "violet"];
// in a template string, the elements are joined with ","
console.log(`rainbow: ${rainbow}`);

const lastElement = rainbow.pop();      // pop returns the removed element
console.log(`last element: ${lastElement}`);

const firstElement = rainbow.shift();   // so does shift
console.log(`first element: ${firstElement}`);

rainbow.push("black", "white");         // push accepts several elements
console.log(`after push: ${rainbow}`);

rainbow.unshift("black", "white");      // so does unshift
console.log(`after unshift: ${rainbow}`);

rainbow.reverse();                      // reverses the array ITSELF
console.log(`after reverse: ${rainbow}`);
```

`push` is the method you will write most: it builds a new list, one element at a
time. This is how a rule collects the lines of an alert:

```js run
const problems = [];
for (const enc of doc.inventory.enclosures) {
    if (enc.state !== "normal") {
        problems.push(enc.id + " is " + enc.state);
    }
}
console.log(problems);              // [ 'ENC-03 is degraded' ]
console.log(problems.length);       // 1
```

::: info Animation
**Arrays in memory:** [4. `push` / `pop` / `unshift` / `shift`](../animations/arraysInMemory.html#4){target="_blank"}
:::

### `slice` - copy a part

MDN: [Array.prototype.slice()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice)

`arr.slice(start, end)` returns a **new** array with the elements from `start` up
to, **but not including**, `end`. The original array does not change.

```js run
const parts = ["4", "2", "1", "7"];
console.log(parts.slice(0, 2));    // [ '4', '2' ]   - indexes 0 and 1
console.log(parts.slice(1, 3));    // [ '2', '1' ]
console.log(parts.slice(2));       // [ '1', '7' ]   - without end: to the end
console.log(parts.slice(-2));      // [ '1', '7' ]   - negative: from the end
console.log(parts.slice());        // [ '4', '2', '1', '7' ] - a copy of all
console.log(parts);                // unchanged
```

`end - start` is the number of elements you get. The first three parts of a
version:

```js run
const version = doc.overview.version;          // "4.2.1.7"
const major = version.split(".").slice(0, 3);  // split: section 7
console.log(major);                            // [ '4', '2', '1' ]
```

### `splice` - remove, insert or replace, in place

MDN: [Array.prototype.splice()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice)

`arr.splice(start, deleteCount, item1, item2, ...)` changes the array **itself**:
from index `start` it removes `deleteCount` elements, and puts the new items in
their place. It returns the removed elements in a new array.

```js run
const models = ["XR-100", "XR-210", "XR-220", "XR-300"];

const removed = models.splice(1, 2);         // remove 2 elements from index 1
console.log(removed);                        // [ 'XR-210', 'XR-220' ]
console.log(models);                         // [ 'XR-100', 'XR-300' ]

models.splice(1, 0, "XR-250");               // remove nothing, insert at index 1
console.log(models);                         // [ 'XR-100', 'XR-250', 'XR-300' ]

models.splice(0, 1, "XR-110", "XR-120");     // replace 1 element with 2
console.log(models);    // [ 'XR-110', 'XR-120', 'XR-250', 'XR-300' ]
```

Remove **one** element when you know its value - find its index first (section 6):

```js run
const MODELS = ["XR-210", "XR-220", "XR-230"];
const pos = MODELS.indexOf("XR-220");
if (pos !== -1) {                 // only if it is there!
    MODELS.splice(pos, 1);
}
console.log(MODELS);              // [ 'XR-210', 'XR-230' ]
```

::: warning `splice(-1, 1)` when the element is not found
Without the `if`, `indexOf` gives `-1`, and `splice(-1, 1)` removes the **last**
element - a negative start counts from the end.
:::

::: tip `slice` copies, `splice` cuts
The names are almost the same, the effect is not. A way to remember: s**p**lice
has an extra letter, and it does extra things - it changes the array.
:::

::: info Animations
**Array methods:** [1. `slice` and `at`](../animations/arrayMethods.html#1){target="_blank"},
[2. `splice`](../animations/arrayMethods.html#2){target="_blank"},
[7. `splice` in a loop (advanced)](../animations/arrayMethods.html#7){target="_blank"}
:::

### Joining arrays: `concat` and spread

MDN: [Array.prototype.concat()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/concat), [Spread syntax (...)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax)

```js run
const ssd = ["ENC-01", "ENC-02"];
const hdd = ["ENC-03", "ENC-04"];

console.log(ssd.concat(hdd));          // [ 'ENC-01', 'ENC-02', 'ENC-03', 'ENC-04' ]
console.log([...ssd, ...hdd]);         // the same with spread (ES2015)
console.log([...ssd, "ENC-09"]);       // spread + one more element
console.log(ssd, hdd);                 // unchanged - both give a new array
```

`...arr` (*spread*) "pours out" the elements of the array into the new `[ ]`.
More about spread in session 6.

### Which methods change the array?

| Change the array (*mutating*) | Return a new array or value |
|-------------------------------|-----------------------------|
| `push`, `pop`, `unshift`, `shift` | `slice`, `concat`, `[...a]` |
| `splice` | `indexOf`, `includes`, `join`, `at` |
| `reverse`, `sort` (session 7) | `toReversed`, `toSorted`, `toSpliced` (ES2023) |
| `arr[i] = x`, `arr.length = n` | |

```js run
const levels = ["4.1", "4.2", "4.3"];
const reversed = levels.toReversed();   // ES2023: a reversed COPY
console.log(reversed);                  // [ '4.3', '4.2', '4.1' ]
console.log(levels);                    // [ '4.1', '4.2', '4.3' ] - unchanged

levels.reverse();                       // reverses levels itself
console.log(levels);                    // [ '4.3', '4.2', '4.1' ]
```

::: info ES2023+
`toReversed()`, `toSorted()`, `toSpliced()` and `with()` are ES2023 - check that
your rule engine supports them. `arr.slice().reverse()` gives a reversed copy
everywhere.
:::

### `delete arr[i]` in old code

`delete arr[i]` does **not** remove the element - it leaves a hole, and `length`
does not change. Use `splice(i, 1)`:

```js run
const a = ["x", "y", "z"];
delete a[1];
console.log(a.length, a[1]);    // 3 undefined - a hole
const b = ["x", "y", "z"];
b.splice(1, 1);
console.log(b.length, b);       // 2 [ 'x', 'z' ]
```

## 6. Searching: `indexOf`, `includes`, `lastIndexOf`

MDN: [Array.prototype.indexOf()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf), [Array.prototype.includes()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes), [Array.prototype.lastIndexOf()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/lastIndexOf)

| Method | Returns |
|--------|---------|
| `arr.indexOf(x)` | the index of the **first** `x`, or `-1` if there is none |
| `arr.lastIndexOf(x)` | the index of the **last** `x`, or `-1` |
| `arr.includes(x)` | `true` or `false` (ES2016) |

All three compare with `===`. A second argument tells where to start:
`arr.indexOf(x, 3)` searches from index 3.

```js run
const states = ["normal", "normal", "degraded", "normal"];
console.log(states.indexOf("normal"));       // 0
console.log(states.lastIndexOf("normal"));   // 3
console.log(states.indexOf("degraded"));     // 2
console.log(states.indexOf("failed"));       // -1 - not found
console.log(states.includes("failed"));      // false
console.log(states.indexOf("normal", 1));    // 1 - search from index 1
```

### Allow-lists

In lecture 3 the rule checked the model with `&&`:
`if (model !== "XR-210" && model !== "XR-220") return;`. With five models this
line becomes hard to read. An **allow-list** keeps the models in an array:

```js run
const MODELS = ["XR-210", "XR-220", "XR-230"];
const model = doc.overview.model;

if (!MODELS.includes(model)) {
    console.log("not our model - stop");
} else {
    console.log(model + " is in the list");
}
```

Adding a model is now a change in **data**, not in logic. A list of models that
must be skipped is a *deny-list* - the same code without the `!`.

The same works for any fixed set of values:

```js run
const BAD_STATES = ["degraded", "failed", "offline"];
const NO_VALUE = [undefined, null, "", "N/A"];

console.log(BAD_STATES.includes(doc.inventory.enclosures[2].state));  // true
console.log(NO_VALUE.includes(doc.inventory.details.bandwidth));  // true - ""
```

### Old style: `indexOf(...) !== -1`

`includes` arrived in ES2016. Older rules write the same with `indexOf`:

| Older rules | Modern |
|-------------|--------|
| `MODELS.indexOf(model) !== -1` | `MODELS.includes(model)` |
| `MODELS.indexOf(model) === -1` | `!MODELS.includes(model)` |
| `MODELS.indexOf(model) >= 0` | `MODELS.includes(model)` |
| `MODELS.indexOf(model) > 0` | **a bug**: misses index 0 |
| `["XR-210"].includes(m) !== true` | `!["XR-210"].includes(m)` |

```js run
const MODELS = ["XR-210", "XR-220"];
console.log(MODELS.indexOf("XR-210") > 0);    // false - but it IS in the list!
console.log(MODELS.includes("XR-210"));       // true
```

`indexOf` and `includes` differ only for `NaN`: `[NaN].indexOf(NaN)` is `-1`,
`[NaN].includes(NaN)` is `true`.

### Searching is exact - normalise first

```js run
const MODELS = ["XR-210", "XR-220"];
const fromReport = " xr-220";

console.log(MODELS.includes(fromReport));                      // false
console.log(MODELS.includes(fromReport.trim().toUpperCase())); // true
```

`trim()` removes the spaces at both ends, `toUpperCase()` makes capital letters
(more in session 8).

::: warning `indexOf` on objects
`indexOf` and `includes` compare with `===`, so for objects they look for **the
same object**, not "an object with the same keys":
`doc.inventory.enclosures.includes({ id: "ENC-01" })` is `false`. To find a
record by one of its keys, use a loop (section 10) - or `find` (session 7).
:::

::: tip Strings have `indexOf` and `includes` too
`"4.2.1.7-B00".includes("-")`, `"XR-220".indexOf("-")` (gives 2),
`"4.2.1.7".at(-1)` and `"4.2.1.7".slice(0, 3)` work on strings the same way. More
in session 8.
:::

::: info Animations
**Array methods:** [3. `indexOf` and `includes`](../animations/arrayMethods.html#3){target="_blank"};
**Algorithms with arrays:** [6. Search with `break` (advanced)](../animations/arrayAlgorithms.html#6){target="_blank"} -
what `indexOf` does inside
:::

## 7. Strings and arrays: `split` and `join`

### `split` - from a string to an array

MDN: [String.prototype.split()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/split)

`str.split(separator)` cuts the string at every separator and returns an array of
the pieces. The separators are dropped. The pieces are always **strings**.

```js run
console.log("4.2.1.7".split("."));          // [ '4', '2', '1', '7' ]
console.log("CON-01;CON-02".split(";"));    // [ 'CON-01', 'CON-02' ]
console.log("XR-220".split("-"));           // [ 'XR', '220' ]
console.log("4.2.1.7".split("-"));          // [ '4.2.1.7' ] - no "-": one piece
console.log("abc".split(""));               // [ 'a', 'b', 'c' ] - characters
```

Three uses you will see in every rule:

```js run
// 1. the first word: the version before " (build ...)"
const level = doc.inventory.details.firmware_level;
console.log(level.split(" ")[0]);               // 4.2.1.7

// 2. the last part of an id: split, then take the last element
const alias = "lab-dev-01";
console.log(alias.split("-").pop());            // 01
console.log(alias.split("-").at(-1));           // 01 (ES2022)

// 3. a list packed into one string
const consoles = doc.inventory.details.consoles.split(";");
console.log(consoles, consoles.length);         // [ 'CON-01', 'CON-02' ] 2
```

### Versions: from strings to numbers

`split` gives strings, and strings are compared character by character - `"10" <
"9"` is `true` (lecture 3). Convert every part with `Number` before you compare:

```js run
const parts = "4.10.0.3".split(".");
console.log(parts);                   // [ '4', '10', '0', '3' ]
console.log(parts[1] < "9");          // true  - wrong, string comparison

const numbers = [];
for (const part of parts) {           // for...of: section 8
    numbers.push(Number(part));
}
console.log(numbers);                 // [ 4, 10, 0, 3 ]
console.log(numbers[1] < 9);          // false - right
```

This is the first step of `versionBelow` - you write the whole function in
session 5. (In session 7 the loop shrinks to `parts.map(Number)`.)

### Packed values: `"key=value,key=value"`

Reports often pack several values into one string. Two splits unpack it: first
the list separator, then the key / value separator:

```js run
const settings = doc.inventory.details.settings;   // "SA=2,SG=1,SN=2"
const pairs = settings.split(",");
console.log(pairs);                     // [ 'SA=2', 'SG=1', 'SN=2' ]

let sg = "";
for (const pair of pairs) {
    const kv = pair.split("=");         // [ 'SG', '1' ] - kv[0] key, kv[1] value
    if (kv[0] === "SG") {
        sg = kv[1];
        break;
    }
}
console.log(sg);                        // 1 - a string!
```

::: warning A value that contains the separator
`"note=a=b".split("=")` gives `[ 'note', 'a', 'b' ]` - the value is cut too. Split
only at the **first** `=` with `indexOf` and the string `slice`:

```js run
const pair = "note=a=b";
const pos = pair.indexOf("=");
console.log(pair.slice(0, pos));     // note
console.log(pair.slice(pos + 1));    // a=b
```

(`split` has a second argument, a limit: `"note=a=b".split("=", 2)` gives
`[ 'note', 'a' ]` - it drops the rest, so it does not help here.)
:::

### The traps of `split`

```js run
console.log("".split(";"));             // [ '' ] - ONE empty string, not []
console.log("".split(";").length);      // 1 - "one console"?!
console.log("CON-01;".split(";"));      // [ 'CON-01', '' ] - empty piece
console.log("CON-01; CON-02".split(";"));   // [ 'CON-01', ' CON-02' ] - a space
```

Check the string **before** you split, and clean the pieces:

```js run
const raw = "CON-01; CON-02;";
const list = [];
if (raw !== "") {
    for (const piece of raw.split(";")) {
        const name = piece.trim();      // remove the spaces
        if (name !== "") {              // skip empty pieces
            list.push(name);
        }
    }
}
console.log(list);                      // [ 'CON-01', 'CON-02' ]
```

### `join` - from an array to a string

MDN: [Array.prototype.join()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/join)

`arr.join(separator)` is the opposite of `split`: it glues the elements into one
string, with the separator between them. Without an argument the separator is
`","`.

```js run
const parts = ["4", "2", "1", "7"];
console.log(parts.join("."));       // 4.2.1.7
console.log(parts.join(""));        // 4217
console.log(parts.join());          // 4,2,1,7
console.log([].join(", "));         // "" - an empty string
console.log(String(parts));         // 4,2,1,7 - the same as join()
```

`join` builds alert texts. Collect the parts with `push`, glue them once at the
end:

```js run
const findingParts = [];
const actionParts = [];

findingParts.push("Firmware 4.1.9.3 is below the minimum 4.2.0.0.");
actionParts.push("Upgrade as soon as possible.");
findingParts.push("The authentication service has no password.");
actionParts.push("Set a password for the service account.");

const details = {
    "Description": findingParts.join(" "),
    "Action": actionParts.join(" ")
};
console.log(details.Description);
console.log(details.Action);
```

This avoids the classic `text = text + ", " + item` loop that leaves a stray `", "`
at the start or the end.

::: info Animations
**Array methods:** [4. `split` and `join`](../animations/arrayMethods.html#4){target="_blank"},
[5. Packed values](../animations/arrayMethods.html#5){target="_blank"}
:::

## 8. Looping over an array

We often need to do the same thing with **every** element. The classic way is a
`for` loop over the indexes, from `0` to `length - 1`:

```js run
let fruits = ["apple", "banana", "strawberry"];

for (let i = 0; i < fruits.length; i++) {
    console.log(`Element ${i}: ${fruits[i]}`);
}
// Element 0: apple
// Element 1: banana
// Element 2: strawberry
```

Write `i < arr.length`, not `i <= arr.length`: the last index is `length - 1`,
and `arr[length]` is `undefined`.

::: info Animation
**Algorithms with arrays:** [1. Traversal with `for`](../animations/arrayAlgorithms.html#1){target="_blank"}
:::

### In reverse order

Start at the last index, go on while `i >= 0`, step with `i--`:

```js run
let fruits = ["apple", "banana", "strawberry"];

for (let i = fruits.length - 1; i >= 0; i--) {
    console.log(`Element ${i}: ${fruits[i]}`);
}
// Element 2: strawberry
// Element 1: banana
// Element 0: apple
```

The newest entry of a history list is often the last one - walk backwards and
`break` at the first match.

::: info Animation
**Algorithms with arrays:** [2. Reverse order](../animations/arrayAlgorithms.html#2){target="_blank"}
:::

### `for...of` - the elements, without the index

MDN: [for...of](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of)

`for...of` (ES2015) gives the elements one by one. Use it when you do not need the
index - this is most of the time:

```js run
for (const feature of doc.inventory.features) {
    console.log(feature);
}

// with the index too: entries() gives [index, element] pairs
for (const [i, feature] of doc.inventory.features.entries()) {
    console.log(i, feature);
}
```

`const` is fine here: every round gets a **new** variable `feature`.
(`[i, feature]` is *destructuring* - more in session 6.)

| Use | When |
|-----|------|
| `for (const x of arr)` | you need only the elements - the default |
| `for (let i = 0; i < arr.length; i++)` | you need the index, a step other than 1, or two arrays with the same index |
| `for (let i = arr.length - 1; i >= 0; i--)` | backwards, or you remove elements while you loop |

::: warning `for...in` is not for arrays
`for (const i in arr)` loops over the **keys**: they are strings (`"0"`, `"1"`, ...),
and extra properties (`arr.a` from section 4) come too. Older rules use it on
arrays - it works for plain arrays, but `i + 1` gives `"01"`, not `1`! Use
`for...in` for objects (session 6), `for...of` or `for` for arrays.

```js run
const arr = ["a", "b"];
for (const i in arr) {
    console.log(i, typeof i, i + 1);    // 0 string 01, then 1 string 11
}
```
:::

`arr.forEach(function (x) { ... })` - another loop you see in rules - takes a
function, so it comes in session 5 and 7.

### Example: every element, its square, the sum

An example with a bug. Run it - which line is wrong?

```js run
const numbers = [1, 2, 3, 4, 5];

console.log("Every element of the array:");
for (let i = 0; i < numbers.length; i++) {
    console.log("\t" + numbers[i]);
}

console.log("Every element, to the power of 2:");
for (let i = 0; i < numbers.length; i++) {
    console.log("\t" + numbers[i] ** 2);
}

console.log("The sum of the elements:");
let sum = 0;
for (let i = 0; i < numbers.length; i++) {
    sum += i;
}
console.log("\t" + sum);       // 10?! 1 + 2 + 3 + 4 + 5 is 15
```

::: details Answer
`sum += i` adds the **index**, not the element: 0 + 1 + 2 + 3 + 4 = 10. It must be
`sum += numbers[i]`. With `for...of` this bug cannot happen:
`for (const n of numbers) { sum += n; }`.
:::

### The accumulator: sum and count

One variable *collects* the result while the loop runs. Give it the right start
value **before** the loop: `0` for a sum or a count, `""` for text, `[]` for a
list.

```js run
// the sum of all numbers from 1 to 10
let sum = 0;
for (let x = 1; x <= 10; x++) {
    sum += x;
}
console.log("sum = " + sum);     // 55

// the same idea on the report: count the enclosures in a state
let normal = 0;
for (const enc of doc.inventory.enclosures) {
    if (enc.state === "normal") {
        normal++;
    }
}
const total = doc.inventory.enclosures.length;
console.log(`${normal} of ${total} enclosures are normal`);
```

**Check yourself:** print the sum of all **positive even** numbers in
`[-2, 3, 7, 8, -1, 4, 2]`. (Expected: 14.)

::: details Answer
```js
const numbers = [-2, 3, 7, 8, -1, 4, 2];
let sum = 0;
for (const n of numbers) {
    if (n > 0 && n % 2 === 0) {
        sum += n;
    }
}
console.log(sum);    // 8 + 4 + 2 = 14
```
:::

The same for a range of numbers, without an array: the sum
from 1 to 100, and the odd numbers below 100 that divide by 11:

```js run
let total = 0;
for (let i = 1; i <= 100; i++) {
    total += i;
}
console.log("sum:", total);       // 5050

const odd11 = [];
for (let i = 1; i < 100; i++) {
    if (i % 2 !== 0 && i % 11 === 0) {
        odd11.push(i);
    }
}
console.log(odd11);               // [ 11, 33, 55, 77, 99 ]
```

::: info Animation
**Algorithms with arrays:** [3. Sum of the elements](../animations/arrayAlgorithms.html#3){target="_blank"}
:::

### Find elements by a condition

The even numbers in an array:

```js run
const numbers = [2, 3, 5, 8, 5];
for (const n of numbers) {
    if (n % 2 === 0) {
        console.log(n);       // 2, 8
    }
}
```

The negative odd numbers:

```js run
const numArray = [-1, -2, -3, -4, -5, 0, 1, 2, 3, 4, 5];
console.log("The negative odd array elements are:");
for (const n of numArray) {
    if (n < 0 && n % 2 !== 0) {
        console.log(n);       // -1, -3, -5
    }
}
```

Two tasks in one loop: the odd numbers, and the odd **positive** numbers:

```js run
const a = [0, 2, 3, 41, 5, 60, 7, 80];
for (const n of a) {
    if (n % 2 !== 0) console.log(n);             // 3, 41, 5, 7
}

const b = [0, 2, -3, 41, -5, -60, 7, 11, -80];
for (const n of b) {
    if (n > 0 && n % 2 !== 0) console.log(n);    // 41, 7, 11
}
```

### Collect into new arrays

Instead of printing, collect the matching elements into a new array with `push`.
The task *separateArrayElementsInNewArrays*: the positive even numbers go into
one array, the negative odd numbers into another (zero is neither positive nor
negative):

```js run
const numbersArr = [1, 6, -3, 5, 2, -8, 0, 4, 3];
const evenNums = [];
const oddNums = [];

for (const n of numbersArr) {
    if (n > 0 && n % 2 === 0) {
        evenNums.push(n);
    } else if (n < 0 && n % 2 !== 0) {
        oddNums.push(n);
    }
}
console.log(`evenNums: ${evenNums}`);    // 6,2,4
console.log(`oddNums: ${oddNums}`);      // -3
```

With the report - the ids of the enclosures that are not on firmware `"2.14"`:

```js run
const outdated = [];
for (const enc of doc.inventory.enclosures) {
    if (enc.firmware !== "2.14") {
        outdated.push(enc.id);
    }
}
console.log(outdated);             // [ 'ENC-02', 'ENC-04' ]
console.log(outdated.join(", "));  // ENC-02, ENC-04
```

::: info Animation
**Algorithms with arrays:** [5. Filtering into new arrays](../animations/arrayAlgorithms.html#5){target="_blank"}
:::

### The largest (and the smallest) element

Take the **first element** as the largest so far, then compare it with every
next one:

```js run
const temps = [31, 34, 37, 29, 38, 30];
let max = temps[0];
let maxIndex = 0;
for (let i = 1; i < temps.length; i++) {
    if (temps[i] > max) {
        max = temps[i];
        maxIndex = i;
    }
}
console.log(`max = ${max}, index = ${maxIndex}`);    // max = 38, index = 4
```

::: warning Do not start with 0
`let max = 0;` looks harmless, but with only negative numbers the result is `0` -
a value that is not in the array. Start from `arr[0]`. And check first that the
array is not empty: `[][0]` is `undefined`.
:::

`Math.max(...temps)` gives the same maximum in one line (spread passes the
elements as separate arguments; `Math` in session 8) - but not the index.

::: info Animation
**Algorithms with arrays:** [4. Largest element](../animations/arrayAlgorithms.html#4){target="_blank"}
:::

### Search with `break`

When you need **one** element, stop at the first match:

```js run
const ids = ["ENC-01", "ENC-02", "ENC-03", "ENC-04"];
let index = -1;                  // -1 = "not found"
for (let i = 0; i < ids.length; i++) {
    if (ids[i] === "ENC-03") {
        index = i;
        break;                   // do not look further
    }
}
console.log(index);              // 2
```

For a plain value this is just `ids.indexOf("ENC-03")`. You write the loop when
the condition is more than `===` - for example, "the first enclosure that is not
normal" (section 10).

### Going round in a circle: `%`

On a web page, a button can change the colour of a box on every click, going round
a list of colours. Without the browser, the idea is the index with `% length`:

```js run
const colors = ["blue", "purple", "red"];
let i = 0;
for (let click = 1; click <= 7; click++) {
    console.log(`click ${click}: ${colors[i]}`);
    i = (i + 1) % colors.length;      // 0, 1, 2, 0, 1, 2, ...
}
```

The same spreads checks over a list of consoles, one after the other
(*round robin*).

## 9. Arrays of arrays (two-dimensional)

JavaScript has no real two-dimensional (or multi-dimensional) arrays. But an
element can be of any type - also an array - so a table is an **array of arrays**:
every element is a row, and every row is an array.

```js run
const matrix = [
    ["a", "b", "c"],
    ["d", "e", "f"],
    ["g", "h", "i"],
];
console.log("matrix:", matrix);
```

### Access: first the row, then the column

```js run
const matrix = [
    ["a", "b", "c"],
    ["d", "e", "f"],
    ["g", "h", "i"],
];
console.log("row 0, col 2:", matrix[0][2]);   // c
console.log("row 1, col 1:", matrix[1][1]);   // e
console.log("row 2, col 0:", matrix[2][0]);   // g
console.log(matrix.length, matrix[0].length); // 3 3 - rows, columns
```

`matrix[1][1]` is read in two steps: `matrix[1]` gives the row `["d", "e", "f"]`,
and `[1]` of that row gives `"e"`.

::: info Animations
**Arrays in memory:** [6. Two-dimensional (advanced)](../animations/arraysInMemory.html#6){target="_blank"},
[7. Shared row (advanced)](../animations/arraysInMemory.html#7){target="_blank"} -
why `[row, row]` is a trap
:::

### Loop over rows and columns

Two nested loops: the outer one over the rows (`i`), the inner one over the
columns of the current row (`j`):

```js run
const matrix = [
    ["a", "b", "c"],
    ["d", "e", "f"],
    ["g", "h", "i"],
];
const rows = matrix.length;
const cols = matrix[0].length;

for (let i = 0; i < rows; i++) {
    console.log("row:", i);
    for (let j = 0; j < cols; j++) {
        console.log("  " + matrix[i][j]);
    }
}
```

With `for...of` the same is shorter - and works when the rows have different
lengths:

```js run
const matrix = [["a", "b", "c"], ["d", "e"], ["f"]];
for (const row of matrix) {
    console.log(row.join(" | "));
}
```

The sum of the main diagonal (`m[0][0] + m[1][1] + m[2][2]`) needs only one loop:

```js run
const m = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
];
let sum = 0;
for (let i = 0; i < m.length; i++) {
    sum += m[i][i];
}
console.log(`sum = ${sum}`);    // 1 + 5 + 9 = 15
```

::: info Animation
**Algorithms with arrays:** [7. Two-dimensional array (advanced)](../animations/arrayAlgorithms.html#7){target="_blank"}
:::

**Check yourself:** `fruitsData` keeps the names in row 0 and the
prices in row 1. Print `apple = 1.2`, `orange = 2`, `cherry = 3.5` with a loop.

```js run
const fruitsData = [
    ["apple", "orange", "cherry"],
    [1.2, 2.0, 3.5],
];

// the long way:
// console.log(fruitsData[0][0] + " = " + fruitsData[1][0]);
// console.log(fruitsData[0][1] + " = " + fruitsData[1][1]);
// console.log(fruitsData[0][2] + " = " + fruitsData[1][2]);

// your loop here:
```

::: details Answer
The name and the price of one fruit are in the same **column** `j`, so loop over
the columns:

```js
for (let j = 0; j < fruitsData[0].length; j++) {
    console.log(fruitsData[0][j] + " = " + fruitsData[1][j]);
}
```

`2.0` is printed as `2`: for JavaScript `2.0` and `2` are the same number.
:::

### A table in the report

Reports sometimes send a table as rows of values, with the column names in a
separate list - the first row of a CSV file, for example:

```js run
const header = ["id", "temperature"];
const rows = [
    ["ENC-01", "31"],
    ["ENC-02", "34"],
    ["ENC-03", "38"],
];
const col = header.indexOf("temperature");   // find the column by its name
for (const row of rows) {
    if (Number(row[col]) > 35) {
        console.log(row[0] + " is too hot: " + row[col] + " C");
    }
}
```

`header.indexOf(...)` instead of a fixed `row[1]`: the code keeps working if the
export adds a column in front.

## 10. Lists of records

A **record** is a group of values about one thing - one enclosure, one drive, one
setting. In JSON a record is an **object** `{ key: value, ... }` (objects in
detail: session 6). A **list of records** is an array of such objects, all with
the same keys:

```js run
const enclosures = doc.inventory.enclosures;
console.log(enclosures.length);        // 4
console.log(enclosures[0]);   // the whole first record: an object
console.log(enclosures[2].state);      // degraded - index first, then the key

for (const enc of enclosures) {
    console.log(enc.id, enc.type, enc.firmware, enc.state);
}
```

### Records as arrays, or as objects?

Older code often keeps a record as an array:

```js run
// [gender, age, first name, last name]
const students = [
    ["male", 24, "Ivan", "Ivanov"],
    ["female", 22, "Maria", "Petrova"],
    ["male", 18, "Georgi", "Georgiev"],
    ["male", 21, "Nikolai", "Nikolov"],
];

// the youngest student: start with the first one, compare with the rest
let youngest = students[0];
for (const student of students) {
    if (student[1] < youngest[1]) {
        youngest = student;
    }
}
console.log(`The youngest: ${youngest[2]} ${youngest[3]}, ${youngest[1]} years old.`);
```

It works, but what is `student[1]`? You must remember that index 1 is the age. An
object says it: `student.age`. That is why JSON reports use objects for records.

**Check yourself:** find the **oldest** student. (Expected: Ivan Ivanov, 24.)

::: details Answer
The same loop with `>` instead of `<`:
`if (student[1] > oldest[1]) { oldest = student; }`, starting with
`let oldest = students[0];`. A common mistake is to start with
`minAge = students[0][1]` and leave `youngestStudent` undefined - if the first
student is the youngest, the program crashes. Starting with the whole first
record avoids this.
:::

A task in the same shape - rulers and the years of their rule. The names
are in mixed case, so a small helper fixes them:

```js run
const rulers = [
    ["asPARuH", 681, 700],
    ["tERveL", 700, 718],
    ["SeVaR", 738, 753],
    ["telERIG", 766, 777],
    ["kaRDAm", 777, 803],
    ["krum", 803, 814],
    ["OmurTAg", 814, 831],
];

// ready-made: first letter upper case, the rest lower case (session 8)
function capitalize(str) {
    return str[0].toUpperCase() + str.slice(1).toLowerCase();
}

// the rulers who ruled more than 15 years
for (const ruler of rulers) {
    const years = ruler[2] - ruler[1];
    if (years > 15) {
        console.log(`${capitalize(ruler[0])} ruled ${years} years.`);
    }
}
```

### Find, count, collect

Three questions you ask a list of records again and again:

```js run
const enclosures = doc.inventory.enclosures;

// FIND: the first record that matches - stop with break
let firstBad;                                  // undefined = not found
for (const enc of enclosures) {
    if (enc.state !== "normal") {
        firstBad = enc;
        break;
    }
}
console.log(firstBad ? firstBad.id : "all normal");    // ENC-03

// COUNT: how many records match
let hddCount = 0;
for (const enc of enclosures) {
    if (enc.type.startsWith("HDD")) {
        hddCount++;
    }
}
console.log(hddCount);                         // 2

// COLLECT: a value from every matching record
const oldFirmware = [];
for (const enc of enclosures) {
    if (enc.firmware !== "2.14") {
        oldFirmware.push(`${enc.id} (${enc.firmware})`);
    }
}
console.log(oldFirmware.join(", "));           // ENC-02 (2.10), ENC-04 (2.10)
```

`startsWith` checks the beginning of a string - session 8. In session 7 these
three loops become `find`, `filter(...).length` and `filter` + `map`.

::: info Animation
**Array methods:** [6. A list of records](../animations/arrayMethods.html#6){target="_blank"}
:::

### A long list of key / value records

Some exports do not send a nested object at all. Every value is one small record,
and the list has thousands of them:

```js run
const records = [
    { group: "Global Resources", item: "SYS", code: "BU", label: "Release", value: "10.12.39.0" },
    { group: "Global Resources", item: "SYS", code: "FN", label: "Family", value: "AR9" },
    { group: "Enclosures", item: "ENC-01", code: "FW", label: "Firmware", value: "2.14" },
    { group: "Enclosures", item: "ENC-01", code: "ST", label: "State", value: "normal" },
    { group: "Enclosures", item: "ENC-02", code: "FW", label: "Firmware", value: "2.10" },
    { group: "Enclosures", item: "ENC-02", code: "ST", label: "State", value: "degraded" },
    { group: "Partitions", item: "P1", code: "SN", label: "Settings", value: "SA=2,SG=2,SN=2" },
];

// one value: the record with item "SYS" and code "BU"
let release;
for (const r of records) {
    if (r.item === "SYS" && r.code === "BU") {
        release = r.value;
        break;
    }
}
console.log(release);                   // 10.12.39.0

// all values of one kind: the firmware of every enclosure
const firmware = [];
for (const r of records) {
    if (r.group === "Enclosures" && r.code === "FW") {
        firmware.push(r.item + "=" + r.value);
    }
}
console.log(firmware);                  // [ 'ENC-01=2.14', 'ENC-02=2.10' ]
```

The homework folder has a whole export in this shape:
`Homework/data/report-records.json` (79 records). The practice tasks use it.

::: warning Thousands of records: do not search inside a loop
To find one value, a loop walks the list - fine once. But "for every enclosure,
find its state" written as a loop **inside** a loop walks the whole list again
for every enclosure: with 9,500 records and 100 enclosures that is almost a
million comparisons. Walk the list **once** and collect what you need. In session
7 we build an *index* (an object or a `Map` keyed by item) once, and then every
lookup is instant.
:::

### One record, or a list?

The same data can come as a list in one report and as a single object in another
(for example, when there is only one enclosure). Normalise it to an array first,
then the rest of the code has one shape to handle:

```js run
function asList(value) {
    if (Array.isArray(value)) return value;           // already a list
    if (value === undefined || value === null) return [];  // nothing
    return [value];                                   // one value -> a list of one
}

console.log(asList(doc.inventory.enclosures).length);       // 4
console.log(asList({ id: "ENC-09", state: "normal" }));     // a list of one
console.log(asList(undefined));                             // []
```

(`function` with `return` is session 5 - read it as "give back this value".)

## 11. Reading existing rules

First, run the rule from the start of the lecture. `emit` is a fake here: it only
prints the alert.

```js run
function emit(id, details) {          // fake: prints instead of creating an alert
    console.log("ALERT for " + id + ": " + JSON.stringify(details));
}

// ready-made helper - we write our own in session 5
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

const MODELS = ["XR-210", "XR-220"];

function rule(doc) {
    if (!doc.overview || !doc.inventory?.details) return;

    const model = doc.overview.model;
    if (!MODELS.includes(model)) return;

    const level = doc.inventory.details.firmware_level ?? "";
    const version = level.split(" ")[0];

    const enclosures = doc.inventory.enclosures;
    if (!Array.isArray(enclosures)) return;
    const problems = [];
    for (const enc of enclosures) {
        if (enc.state !== "normal") {
            problems.push(`${enc.id} is ${enc.state}`);
        }
        if (versionBelow(enc.firmware, "2.14")) {
            problems.push(`${enc.id} has firmware ${enc.firmware}`);
        }
    }
    if (problems.length === 0) return;

    const name = doc.inventory.extended_info?.json?.data?.system?.name
                 || doc.status.device_alias;
    emit(name, {
        "Model": model,
        "Version": version,
        "Problems": problems.length,
        "Details": problems.join("; ")
    });
}

console.log("example JSON document:");
rule(doc);

console.log("all enclosures fine:");
rule({
    overview: { model: "XR-210" },
    inventory: {
        details: { firmware_level: "4.2.1.7 (build 412.17)" },
        enclosures: [{ id: "ENC-01", firmware: "2.14", state: "normal" }]
    },
    status: { device_alias: "LAB-DEV-02" }
});
```

Change the state of `ENC-01` in the second document to `"failed"` and run again.
Then change `enclosures` to one object instead of a list (remove the `[` `]`).
What happens, and why?

Here is **the same rule** in the older style. Read it with ease, and decide what
to modernise:

```js run
function emit(id, details) {
    console.log("ALERT for " + id + ": " + JSON.stringify(details));
}

function versionBelow(a, b) {
    var pa = String(a).split(".");
    var pb = String(b).split(".");
    for (var i = 0; i < Math.max(pa.length, pb.length); i++) {
        var x = parseInt(pa[i], 10) || 0;
        var y = parseInt(pb[i], 10) || 0;
        if (x < y) return true;
        if (x > y) return false;
    }
    return false;
}

var MODELS = new Array("XR-210", "XR-220");

function rule(doc) {  // the engine calls rule(doc) - keep this line as it is
    if (!doc.overview || !doc.inventory || !doc.inventory.details) return;

    var model = doc.overview.model;
    if (MODELS.indexOf(model) == -1) return;

    var level = String(doc.inventory.details.firmware_level || "");
    var version = level.split(" ")[0];

    var enclosures = doc.inventory.enclosures;
    if (!enclosures || !enclosures.length) return;
    var problems = new Array();
    for (var i = 0; i < enclosures.length; i++) {
        var enc = enclosures[i];
        if (enc.state != "normal") {
            problems.push(enc.id + " is " + enc.state);
        }
        if (versionBelow(enc.firmware, "2.14") == true) {
            problems.push(enc.id + " has firmware " + enc.firmware);
        }
    }
    if (problems.length == 0) return;

    var info = doc.inventory.extended_info;
    var name = info && info.json && info.json.data && info.json.data.system
               && info.json.data.system.name || doc.status.device_alias;

    var details = new Object();
    details["Model"] = model;
    details["Version"] = version;
    details["Problems"] = problems.length;
    details["Details"] = problems.join("; ");
    emit(name, details);
}

console.log("example JSON document:");
rule(doc);

console.log("enclosures sent as a string:");
rule({
    overview: { model: "XR-210" },
    inventory: { details: { firmware_level: "4.2.1.7" }, enclosures: "ENC-01" },
    status: { device_alias: "LAB-DEV-03" }
});
```

**Check yourself:**

1. List the differences between the two versions. Which ones change only the
   style, and which could change the result?
2. `new Array("XR-210", "XR-220")` creates the same list as
   `["XR-210", "XR-220"]`. What would `new Array(2)` create? Why is `[...]`
   safer?
3. Run the old rule: the second document sends `enclosures` as a **string**. What
   does the old rule do with it, and what would the modern rule do?
4. `if (!enclosures || !enclosures.length) return;` and
   `if (!Array.isArray(enclosures)) return;` - do they behave the same for `[]`?
   For `undefined`? For one object `{ id: "ENC-01", ... }`?
5. A report has `firmware_level: "4.2.1.7"` - with no `(build ...)` part. What is
   `version` in both rules?

::: details Answer
1. Style only: `var` -> `const` / `let`; `new Array(...)` -> `[...]`;
   `indexOf(model) == -1` -> `!includes(model)` (the same for strings);
   `==` / `!=` -> `===` / `!==`; the `for` with an index -> `for...of`;
   `== true` -> nothing; `+` -> template strings; the `&&` chain -> `?.`;
   `new Object()` + `details["..."]` -> an object literal. Could change the
   result: the guard for `enclosures` (questions 3 and 4) and `String(... || "")`
   vs `?? ""`.
2. An empty array of length 2 (two holes), not `[2]`. `[...]` always means
   "these elements".
3. A string has `length` (6), so the old guard lets it through, and the loop
   walks the **characters**: `enc` is `"E"`, `"N"`, ... `enc.state` and
   `enc.firmware` are `undefined`, so every character gives two "problems"
   (`versionBelow(undefined, "2.14")` is true too: `parseInt` gives `NaN`, and
   `|| 0` makes it 0). Twelve problems like `"undefined is undefined"` - a
   nonsense alert. The modern rule stops: a string is not an array.
4. `[]`: the old rule stops at the guard (`![].length` is true); the modern one
   loops zero times and stops at `problems.length === 0` - the same result.
   `undefined`: both stop. One object: the object has no `length`, so the old rule
   stops; `Array.isArray` is false, so the modern rule stops too - both **miss**
   the enclosure. Fix: `const enclosures = asList(doc.inventory.enclosures);`
   (section 10).
5. `"4.2.1.7"` in both: when there is no space, `split(" ")` gives an array with
   the whole string, and `[0]` is that string.
:::

## 12. Practice

In your copy of the Homework repository, first get the new tasks:

```bash
git pull --no-rebase --no-edit upstream main
node 04-arrays-and-records/practice/task1-predict.js
```

Each file explains the task at the top. Write your code between the `your code`
lines; the checks at the bottom print `OK` or `FAIL`.

| Task | File | What you do |
|------|------|-------------|
| 1 | `task1-predict.js` | Predict 20 results of array operations, then check yourself |
| 2 | `task2-model-list.js` | An allow-list of models: check, add without duplicates, remove |
| 3 | `task3-split-values.js` | `split` and `join`: version parts as numbers, the last part of an id, packed lists and `key=value` strings |
| 4 | `task4-records.js` | A list of 79 key / value records: find a value, count, collect |
| 5 | `task5-classic-loops.js` | Sum, maximum and filtering on plain arrays and on a table |

## Summary

| Topic | Remember |
|-------|----------|
| Array | An ordered list; index from 0; `[...]` to create; any type of element |
| Access | `arr[i]`; a missing index gives `undefined`, no error; last: `arr[arr.length - 1]` or `arr.at(-1)` |
| `length` | Number of elements, one more than the last index; writing to it changes the array; `[]` is truthy - check `length === 0` |
| An object | `typeof` is `"object"`; use `Array.isArray`; `===` compares references; `const` does not freeze the array |
| Add / remove | `push` / `pop` at the end, `unshift` / `shift` at the start, `splice` anywhere - they change the array |
| Copy | `slice(start, end)` (end not included), `[...arr]`, `concat` - new arrays |
| Search | `indexOf` (index or -1), `includes` (true / false), `lastIndexOf`; exact `===` - normalise first |
| Strings | `split(sep)` -> array of strings; `join(sep)` -> string; `"".split(",")` is `[""]` |
| Loops | `for...of` for elements, `for` with `i` for indexes and backwards; not `for...in` |
| Patterns | Accumulator (sum, count), max from `arr[0]`, collect with `push`, search with `break` |
| Tables | `matrix[row][col]`; nested loops |
| Records | An array of objects; find, count, collect in one pass; no search inside a loop |
| Old style | `new Array(...)`, `indexOf(x) !== -1`, `for (var i ...)`, `!arr.length` - read it, write the modern form |

## Homework

1. `04-arrays-and-records/homework.js` (in the homework repository): the names in
   a packed firmware string, alert lines from three lists, the empty pools and a
   packed setting in the records export, and two more loop tasks: even / odd
   numbers, and a bug to fix in a game loop.
2. The practice tasks you did not finish in class - recommended, as later tasks
   and the course project reuse them. Every check must print `OK`.
3. Optional: take one of your own rules and find every array in it. Where does
   each one come from (the report, `split`, the rule itself)? Is there an
   `indexOf(...) !== -1` or a `for...in` over an array you would modernise? Does
   the rule change an array of `doc`?

## Read more

- MDN: [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array),
  [Indexed collections](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Indexed_collections),
  [String.prototype.split()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/split),
  [Array.isArray()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray),
  [for...of](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of)
- javascript.info: [Arrays](https://javascript.info/array),
  [Array methods](https://javascript.info/array-methods) (the first part; the rest
  is session 7)
- Eloquent JavaScript (4th edition): [Data Structures: Objects and Arrays](https://eloquentjavascript.net/04_data.html)

**Next session:** functions. The helpers you used ready-made - `versionBelow`,
`asList`, `capitalize` - you write yourself, and you learn to read the older
`function (x) { ... }` code in existing rules.
