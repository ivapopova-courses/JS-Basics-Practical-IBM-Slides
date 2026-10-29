# The example JSON document

In every runnable example on this site, the variable `doc` holds this document.
It is like the `doc` a check rule receives: the **report** of one device.

::: info The example JSON document is made up
All names and values in it are invented; only the shape is typical of
the JSON a device sends.
:::

## Where to find it

- In the homework repository: `data/sample-asset.json`. Open it in VSCode to see
  it with colours and to fold the parts you do not need.
- The tasks load it with `require` (explained in session 9):
  `const doc = require("../../data/sample-asset.json");`
- The document grows during the course: a lecture adds a new part when it needs
  one (for example `inventory.modules` in lecture 6). This page always shows the
  current version. After `git pull --no-rebase --no-edit upstream main` your copy is the same.

## The whole document

Open it in the viewer: <DataFile file="sample-asset.json" />

::: tip Explore the data files
A click on a file name opens the file in a viewer. **Tree** shows the levels of
the document: open and close them with the arrows. **Paths** lists every value
with its full path, and the filter finds a key or a value. **Tables** shows every
list of records (and every dictionary of records) as a table. **Text** shows the
file as it is, with line numbers. A click on a value shows the path to it the way
your code reads it - `doc.inventory.modules["12_4.20"].status` - and **Copy**
copies the path. **Download** saves the file.
:::

```json
<!--@include: @/../data/sample-asset.json-->
```

## Print it in an example

`console.log(doc)` prints an object on one line, and shows the deeper levels only
as `[Object]`. To see a part of the document indented, turn it into text with
`JSON.stringify(value, null, 2)` (2 = two spaces per level; more about JSON in
session 9):

```js run
console.log(JSON.stringify(doc.overview, null, 2));
console.log(JSON.stringify(doc.inventory.enclosures[0], null, 2));
```

Change the path and press **Run** to look at another part, or print the whole
document with `JSON.stringify(doc, null, 2)`. `console.dir(doc, { depth: null })`
also shows every level (on one line), and `console.table(doc.inventory.enclosures)`
shows a list of records as a table (session 7).

::: tip Every Run starts with a fresh copy
An example that changes `doc` (adds, changes or deletes a key) changes only its own
copy. The file and the other examples on the page stay the same.
:::

## The other data files of the homework

Some tasks use bigger made-up documents, in the other shapes the real data comes
in. They are in the same folder `data/` of the homework repository:

| File | Shape | Used in |
|---|---|---|
| <DataFile file="report-records.json" /> | a flat list of 79 key/value records `{ group, item, code, label, value }` that must be grouped | sessions 4, 7 and 8 |
| <DataFile file="report-dictionary.json" /> | dictionaries keyed by ids, with dots in the keys; dates and versions in mixed formats | sessions 5 - 8 |
| <DataFile file="report-export.json" /> | the same deep document twice: nested (`_source`) and as a flattened export (`fields`, where every key is a whole path: `"a.b.c": [value]`) | sessions 6 and 8 |
| [reports/](https://github.com/ivapopova-courses/JS-Basics-Practical-IBM-Homework/tree/main/data/reports) | five small reports in the shape of `doc`, for running a rule on a folder: <DataFile file="reports/lab-dev-01.json" /> fine, <DataFile file="reports/lab-dev-02.json" /> with problems, <DataFile file="reports/lab-dev-03.json" /> another model, <DataFile file="reports/lab-dev-04.json" /> with missing parts, and <DataFile file="reports/lab-dev-05.json" /> not valid JSON - on purpose | sessions 9 and 10 |

Each task file says at the top which file it uses and what to look for in it.
