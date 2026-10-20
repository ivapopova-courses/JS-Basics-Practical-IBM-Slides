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

In every runnable example, the variable `doc` holds the **example JSON document**,
like the `doc` a check rule receives:

```js run
console.log(doc.overview.model);
console.log(doc.inventory.details.firmware_level);
```

::: info The example JSON document is made up
All names and values in it are invented; only the shape is typical of
the JSON a device sends.
:::

The whole document, with a map of its parts and tips on how to print it:
[The example JSON document](./example-document).

## Practice and Homeworks in VSCode {#practice-in-vscode}

The practice tasks and the homework are in the **Homework repository**:
https://github.com/ivapopova-courses/JS-Basics-Practical-IBM-Homework

Each lecture has a folder there (`02-variables-and-types/`, ...), with the tasks in
`practice/` and the homework in `homework.js`. 
### Set it up once

You do this only once, at the start of the course. It takes about 15 minutes.
If you already did it in session 1, go to [step 6](#_6-check-the-result) and check
that everything is right.

**The idea.** A *repository* (or *repo*) is a project folder whose history Git
keeps. In this course you work with three copies of the Homework repository:

```text
  course repository on GitHub             your own repository on GitHub
  (name in Git: upstream)                 (name in Git: origin)
             |                                        ^
             |  git pull upstream main                |  git push
             |  (new tasks)                           |  (your solutions)
             v                                        |
             +------->  the folder on your computer --+
                        (here you write the code)
```

- **`upstream`** is the course repository. Everybody can read it, but only the
  trainer can change it. You only **pull** from it - this is how you get the new
  tasks.
- **`origin`** is your own repository. You **push** your solutions to it, so they
  are saved online and you can open them from any computer.

`upstream` and `origin` are only short names for the two web addresses (Git calls
them *remotes*), so that you do not have to type the full address every time.

#### 1. Check the tools

You need a GitHub account (https://github.com/signup), and Git, Node.js and VSCode
installed (see [lecture 1, section 2](/lectures/01-getting-started#_2-setting-up-the-environment)).
Open VSCode, then **Terminal > New Terminal**, and type:

```bash
git -v       # git version 2.x.x
node -v      # v24.x.x
```

If one of them says *command not found* or *is not recognized*, install that tool,
then close and open VSCode again.

#### 2. Tell Git who you are

Git writes your name and email into every commit (every saved version). Skip this
step if you did it in session 1: `git config user.name` then prints your name.

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

Use the same email as in your GitHub account.

#### 3. Create your own repository on GitHub

1. Sign in to https://github.com.
2. Click **+** (top right), then **New repository**.
3. **Repository name**: for example `JS-Basics-Practical-Homework`.
4. Choose **Private** (only you can see it) or **Public**.
5. Leave everything else as it is: **no** README, **no** `.gitignore`, **no**
   licence. The repository must be **empty** - otherwise step 5 fails.
6. Click **Create repository**.
7. GitHub shows a page with a web address like
   `https://github.com/your-user/JS-Basics-Practical-Homework.git`. Copy it (the copy button
   next to it). You need it in step 4.

#### 4. Download the course repository and connect your own

In VSCode, open the folder where you keep the course (**File > Open Folder**, for
example `JS_Basics_Course`), then open a terminal (**Terminal > New Terminal**).
Type the commands below **one at a time** and press Enter after each.

Download the course repository (this creates the folder
`JS-Basics-Practical-IBM-Homework`):

```bash
git clone https://github.com/ivapopova-courses/JS-Basics-Practical-IBM-Homework.git
```

Go into the new folder - all the next commands must run there:

```bash
cd JS-Basics-Practical-IBM-Homework
```

After a clone, Git names the repository you cloned from `origin`. Rename it to
`upstream`, because it is the course repository, not yours:

```bash
git remote rename origin upstream
```

Add your own repository as `origin`. Paste **your** address from step 3 instead of
the example one:

```bash
git remote add origin https://github.com/your-user/JS-Basics-Practical-Homework.git
```

::: tip Paste in the terminal
In the VSCode terminal, paste with `Ctrl+V` (or right-click). In other terminals on
Linux, use `Ctrl+Shift+V`.
:::

#### 5. Send everything to your repository (the first push)

```bash
git push -u origin main
```

This copies the files to your repository on GitHub. `-u origin main` makes Git
remember the place: from now on a plain `git push` is enough.

The first time, GitHub asks you to sign in:

- **In VSCode or on Windows**, a window opens: choose to sign in with the browser
  and allow the access.
- **If the terminal asks for a Username and a Password**, type your GitHub user
  name, and as the password a **personal access token** - GitHub does not accept
  your normal password here. Create the token on GitHub: your picture (top right)
  **> Settings > Developer settings > Personal access tokens > Tokens (classic) >
  Generate new token (classic)**, tick **repo**, click **Generate token**, and copy
  it. The terminal shows nothing while you paste the token - this is normal, press
  Enter. Keep the token secret, like a password.

#### 6. Check the result

Still in the `JS-Basics-Practical-IBM-Homework` folder:

```bash
git remote -v
```

You should see four lines like these - `origin` with **your** address, `upstream`
with the course address:

```text
origin    https://github.com/your-user/JS-Basics-Practical-Homework.git (fetch)
origin    https://github.com/your-user/JS-Basics-Practical-Homework.git (push)
upstream  https://github.com/ivapopova-courses/JS-Basics-Practical-IBM-Homework.git (fetch)
upstream  https://github.com/ivapopova-courses/JS-Basics-Practical-IBM-Homework.git (push)
```

Also open your repository on GitHub (refresh the page): you should see the lecture
folders there.

#### 7. Open the folder in VSCode

**File > Open Folder** and choose `JS-Basics-Practical-IBM-Homework` (the folder
itself, not the folder above it). Always open this folder when you work on the
tasks: then the terminal starts in the right place.

::: details Something went wrong?
- **`fatal: destination path 'JS-Basics-Practical-IBM-Homework' already exists`** -
  you cloned it before. Run `cd JS-Basics-Practical-IBM-Homework` and continue with
  `git remote -v` (step 6) to see what is still missing.
- **`fatal: not a git repository`** - the terminal is not in the repository
  folder. Run `cd JS-Basics-Practical-IBM-Homework`, or open that folder in VSCode
  (step 7) and open a new terminal.
- **`error: remote origin already exists`** - you already added `origin`. If its
  address is wrong (check with `git remote -v`), fix it:
  `git remote set-url origin https://github.com/your-user/your-repo.git`
- **`error: remote upstream already exists`** or **`No such remote 'origin'`**
  after `git remote rename` - the rename is already done. Continue with the next
  command.
- **`! [rejected] ... (fetch first)`** on push - your GitHub repository is not
  empty (it was created with a README). The easiest fix: delete that repository on
  GitHub (**Settings**, at the bottom: **Delete this repository**), create it again
  without a README (step 3) and run `git push -u origin main` again.
- **`Repository not found`** on push - the address of `origin` has a typo, or you
  signed in with another GitHub account. Check the address with `git remote -v`.
- **`Password authentication is not supported`** - you typed your GitHub password.
  Use a personal access token instead (step 5).
:::

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
