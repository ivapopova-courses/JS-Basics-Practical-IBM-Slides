# How to use these pages

## Run the examples

Most code examples have a bar under them:

- **Run** executes the code in your browser and shows what `console.log` prints.
- **Edit** turns the example into an editor. Change the code and press **Run**
  again (or `Ctrl+Enter`).
- **Reset** brings back the original code.

Try it:

```js run
const course = "Practical JavaScript Basics";
console.log("Welcome to", course);
```

In every runnable example, the variable `doc` holds a **sample device report**,
like the `doc` a check rule receives:

```js run
console.log(doc.overview.model);
console.log(doc.inventory.details.firmware_level);
```

::: info The sample document is made up
It is a sample device report. All names and values are invented; the
shape is typical of such documents.
:::

## Practice in VSCode

The practice tasks and the homework are in the **Homework repository**:
https://github.com/ivapopova-courses/JS-Basics-Practical-IBM-Homework

Each lecture has a folder there (`02-variables-and-types/`, ...), with the tasks in
`practice/` and the homework in `homework.js`. New folders are added before each
session.

### Set it up once

Clone the repository, then keep it as `upstream` (new tasks come from there) and add
your own repository as `origin` (your solutions go there):

1. On GitHub, create a new **empty** repository of your own (private is fine) -
   without a README, licence or `.gitignore`.
2. In a terminal:

   ```bash
   git clone https://github.com/ivapopova-courses/JS-Basics-Practical-IBM-Homework.git
   cd JS-Basics-Practical-IBM-Homework
   git remote rename origin upstream
   git remote add origin https://github.com/<your-user>/<your-repo>.git
   git push -u origin main
   ```

3. Open the folder in VSCode.

### Work on a task

Open the terminal (`` Ctrl+` ``) in the repository root and run a task:

```bash
node 02-variables-and-types/practice/task1-rule-variables.js
```

Every task checks your code and prints `OK` or `FAIL` for each check
and ends with a line like `5 of 7 checks passed`.

Save your work in your own repository:

```bash
git add .
git commit -m "Session 2 practice"
git push
```

### Get the new tasks

Before each session, commit your work, then:

```bash
git pull upstream main
```

The new lecture folders appear next to your work. Existing files are not changed,
so there are no conflicts.

## Code from the lessons

The code written during the lessons is in the **Labs repository**:
https://github.com/ivapopova-courses/JS-Basics-Practical-IBM-Labs

Clone it once, and after each lesson run `git pull` in it to get the new code. Do
not write your own code there - use the Homework repository for that.

```bash
git clone https://github.com/ivapopova-courses/JS-Basics-Practical-IBM-Labs.git
cd JS-Basics-Practical-IBM-Labs
git pull          # after each lesson
```

## Animations

Some sections have an **Animation** box with links. Each link opens a
step-by-step animation in a new tab: it shows what JavaScript does under the hood
(memory, the order of calculation, the path through a loop). Use the Right / Left
arrow keys to step forward and back. All animations, by session:
[Animations](/under-the-hood).

## Find things

- The search box (top left, or `Ctrl+K`) searches all lectures.
- The list on the right side of a lecture ("In this lecture") jumps to a section.
- The moon / sun switch at the top changes between dark and light mode.
- The **EN / BG** button next to it opens the same page in English or in Bulgarian.
- The navigation on the left and the "In this lecture" column on the right can
  be made narrower or wider, in any step: drag their inner edge (it turns blue
  under the mouse), or click the edge and use the Left / Right arrow keys
  (16 px a step, with Shift 64 px). At 0 the panel is hidden and a small tab
  stays at the edge of the window - click it to show the panel again.
  Double-click the edge to go back to the default width.
