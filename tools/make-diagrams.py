"""Makes the diagrams of the site: site/public/diagrams/<name>.svg (English)
and site/public/diagrams/bg/<name>.svg (Bulgarian).

    python tools/make-diagrams.py

The texts of both languages are here, next to the layout, so a change of the
layout changes both. The i18n build links the Bulgarian pages to the bg/ copy by
itself (see i18n/README.md). The SVGs have a transparent background and dark text;
in dark mode the site inverts them (img.diagram in theme/diagram.css).
The drawing code is the same as in Python-Data-Analysts-UniCredit/Slides/tools/.
"""
from pathlib import Path
from xml.sax.saxutils import escape

OUT = Path(__file__).resolve().parents[1] / "site" / "public" / "diagrams"

INK = "#1f2328"
MUTED = "#5b616b"
COLORS = {
    "blue": ("#e3edfb", "#3b6fc4"),
    "green": ("#e2f2e0", "#4f8a45"),
    "orange": ("#fdebd3", "#c97a1c"),
    "red": ("#f9dedb", "#c4302b"),
    "gray": ("#f3f1ec", "#8c8578"),
    "violet": ("#ece4f8", "#7b48c4"),
}
SANS = "Segoe UI, Noto Sans, Roboto, Helvetica Neue, Arial, sans-serif"
MONO = "JetBrains Mono, Cascadia Code, Consolas, DejaVu Sans Mono, monospace"


class Svg:
    def __init__(self, width, height, title):
        self.w, self.h, self.title = width, height, title
        self.parts = []

    def rect(self, x, y, w, h, color, dash=False, radius=10):
        fill, stroke = COLORS[color]
        extra = ' stroke-dasharray="6 4"' if dash else ""
        self.parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{radius}" '
                          f'fill="{fill}" stroke="{stroke}" stroke-width="2"{extra}/>')

    def text(self, x, y, s, size=15, weight=400, mono=False, color=INK, anchor="start"):
        family = MONO if mono else SANS
        self.parts.append(f'<text x="{x}" y="{y}" font-family="{family}" font-size="{size}" '
                          f'font-weight="{weight}" fill="{color}" text-anchor="{anchor}" xml:space="preserve">{escape(s)}</text>')

    def lines(self, x, y, items, size=14, gap=21, anchor="start"):
        """items: str (sans) or (str, options) - options: mono, color, weight."""
        for i, item in enumerate(items):
            s, opt = (item, {}) if isinstance(item, str) else item
            self.text(x, y + i * gap, s, size=opt.get("size", size), mono=opt.get("mono", False),
                      color=opt.get("color", INK), weight=opt.get("weight", 400), anchor=anchor)

    def box(self, x, y, w, h, color, title, items=(), dash=False, center=False, title_size=16):
        self.rect(x, y, w, h, color, dash)
        tx = x + w / 2 if center else x + 14
        anchor = "middle" if center else "start"
        self.text(tx, y + 26, title, size=title_size, weight=700, anchor=anchor)
        self.lines(tx, y + 50, items, anchor=anchor)

    def arrow(self, x1, y1, x2, y2, color=MUTED, dash=False, curve=None):
        extra = ' stroke-dasharray="6 4"' if dash else ""
        if curve:
            cx, cy = curve
            d = f"M{x1},{y1} Q{cx},{cy} {x2},{y2}"
        else:
            d = f"M{x1},{y1} L{x2},{y2}"
        self.parts.append(f'<path d="{d}" fill="none" stroke="{color}" stroke-width="2.2" '
                          f'marker-end="url(#head)"{extra}/>')

    def diamond(self, cx, cy, w, h, color, label, mono=True, size=14):
        fill, stroke = COLORS[color]
        pts = f"{cx},{cy - h / 2} {cx + w / 2},{cy} {cx},{cy + h / 2} {cx - w / 2},{cy}"
        self.parts.append(f'<polygon points="{pts}" fill="{fill}" stroke="{stroke}" stroke-width="2"/>')
        self.text(cx, cy + 5, label, size=size, mono=mono, anchor="middle")

    def poly(self, points, color=MUTED, dash=False, head=True):
        """an arrow along the points [(x, y), ...]"""
        extra = ' stroke-dasharray="6 4"' if dash else ""
        marker = ' marker-end="url(#head)"' if head else ""
        d = "M" + " L".join(f"{x},{y}" for x, y in points)
        self.parts.append(f'<path d="{d}" fill="none" stroke="{color}" stroke-width="2.2"{marker}{extra}/>')

    def raw(self, svg):
        self.parts.append(svg)

    def render(self):
        return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.w} {self.h}" '
                f'width="{self.w}" height="{self.h}" role="img">\n'
                f"<title>{escape(self.title)}</title>\n"
                f'<defs><marker id="head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" '
                f'markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" '
                f'fill="{MUTED}"/></marker></defs>\n' + "\n".join(self.parts) + "\n</svg>\n")



# ---------------------------------------------------------------------------
# homework-repos (how-to page): the course repository, your repository, your folder

REPOS = {
    "en": {
        "title": "The three copies of the Homework repository",
        "course": "The course repository (GitHub)",
        "name": "name in Git:",
        "course2": "only the trainer changes it",
        "own": "Your own repository (GitHub)",
        "own2": "private or public; only you change it",
        "pc": "The folder on your computer",
        "pc2": "you write and run the code here, in VSCode",
        "clone": "git clone", "clone2": "once, at the start",
        "pull": "git pull ... upstream main", "pull2": "the new tasks, every session",
        "push": "git push", "push2": "your solutions",
    },
    "bg": {
        "title": "Трите копия на Homework repository",
        "course": "Repository-то на курса (GitHub)",
        "name": "име в Git:",
        "course2": "само преподавателят го променя",
        "own": "Вашето repository (GitHub)",
        "own2": "частно или публично; само вие го променяте",
        "pc": "Папката на вашия компютър",
        "pc2": "тук пишете и пускате кода, във VSCode",
        "clone": "git clone", "clone2": "веднъж, в началото",
        "pull": "git pull ... upstream main", "pull2": "новите задачи, всяко занятие",
        "push": "git push", "push2": "вашите решения",
    },
}


def homework_repos(t):
    s = Svg(920, 380, t["title"])
    s.box(20, 16, 390, 116, "blue", t["course"], [
        ("JS-Basics-Practical-IBM-Homework", {"mono": True, "size": 13}),
        (t["name"] + " upstream", {"mono": False}),
        (t["course2"], {"color": MUTED, "size": 13})])
    s.box(510, 16, 390, 116, "green", t["own"], [
        ("your-user/JS-Basics-Practical-Homework", {"mono": True, "size": 13}),
        (t["name"] + " origin", {"mono": False}),
        (t["own2"], {"color": MUTED, "size": 13})])
    s.box(210, 252, 500, 112, "orange", t["pc"], [
        ("JS_Basics_Course/", {"mono": True, "size": 13}),
        ("    JS-Basics-Practical-IBM-Homework/", {"mono": True, "size": 13}),
        (t["pc2"], {"color": MUTED, "size": 13})])
    s.arrow(110, 134, 270, 250, dash=True)
    s.text(52, 178, t["clone"], size=14, mono=True, weight=700)
    s.text(52, 197, t["clone2"], size=13, color=MUTED)
    s.arrow(250, 134, 360, 250)
    s.text(300, 166, t["pull"], size=14, mono=True, weight=700)
    s.text(300, 185, t["pull2"], size=13, color=MUTED)
    s.arrow(600, 250, 700, 134)
    s.text(668, 196, t["push"], size=14, mono=True, weight=700)
    s.text(668, 215, t["push2"], size=13, color=MUTED)
    return s.render()


# ---------------------------------------------------------------------------
# terminal-prompt (lecture 1, Node.js in the terminal): the parts of the prompt

PROMPT = {
    "en": {
        "title": "The terminal: the prompt and a command",
        "ps": ["PS: PowerShell", "(cmd: no PS)"],
        "folder": ["the current folder:", "the commands work here"],
        "cmd": ["your command;", "Enter runs it"],
        "out": "what the program prints",
        "again": "the prompt again: ready for the next command",
    },
    "bg": {
        "title": "Терминалът: промптът и една команда",
        "ps": ["PS: PowerShell", "(cmd: без PS)"],
        "folder": ["текущата папка:", "командите работят тук"],
        "cmd": ["вашата команда;", "Enter я изпълнява"],
        "out": "това, което програмата отпечатва",
        "again": "промптът отново: готов за следващата команда",
    },
}


def terminal_prompt(t):
    s = Svg(920, 290, t["title"])
    s.rect(10, 80, 900, 160, "gray", radius=8)
    cw, x0 = 9.2, 24        # the width of one character, forced with textLength
    folder = "C:\\Users\\you\\JS_Basics_Course\\playground"
    parts = [("PS ", COLORS["violet"][1], 400), (folder, COLORS["blue"][1], 400),
             ("> ", INK, 400), ("node hello.js", INK, 700)]

    def mono_line(x, y, text, color=INK, weight=400):
        s.raw(f'<text x="{x}" y="{y}" font-family="{MONO}" font-size="15" font-weight="{weight}" fill="{color}" '
              f'textLength="{len(text) * cw:.1f}" lengthAdjust="spacingAndGlyphs" xml:space="preserve">{escape(text)}</text>')

    spans, x = [], x0
    for text, color, weight in parts:
        mono_line(x, 120, text, color, weight)
        spans.append((x, x + len(text) * cw))
        x += len(text) * cw
    mono_line(x0, 148, "Hello from Node.js!", MUTED)
    mono_line(x0, 170, "v24.11.0", MUTED)
    prompt = "PS " + folder + "> "
    mono_line(x0, 212, prompt)
    cursor = x0 + len(prompt) * cw + 2
    s.raw(f'<rect x="{cursor:.1f}" y="198" width="9" height="18" fill="{INK}"/>')
    # brackets over the parts of the first line, and their labels above the terminal
    for (a, b), label, anchor in zip((spans[0], spans[1], spans[3]), (t["ps"], t["folder"], t["cmd"]),
                                     ("start", "middle", "end")):
        a, b = a + 1, (b - 8 if label is t["ps"] else b - 1)
        s.raw(f'<path d="M{a:.1f},104 L{a:.1f},98 L{b:.1f},98 L{b:.1f},104" fill="none" stroke="{MUTED}" '
              f'stroke-width="1.6"/>')
        mid = (a + b) / 2
        s.raw(f'<path d="M{mid:.1f},98 L{mid:.1f},52" fill="none" stroke="{MUTED}" stroke-width="1.6" '
              f'stroke-dasharray="3 3"/>')
        tx = {"start": a, "middle": mid, "end": b}[anchor]
        s.lines(tx, 22, label, size=14, gap=19, anchor=anchor)
    s.raw(f'<path d="M{x0 + 20 * cw + 6:.1f},155 L{x0 + 26 * cw:.1f},155" fill="none" stroke="{MUTED}" '
          f'stroke-width="1.6"/>')
    s.text(x0 + 26 * cw + 8, 160, t["out"], size=14, color=MUTED)
    s.arrow(cursor + 5, 262, cursor + 5, 222)
    s.text(cursor - 6, 278, t["again"], size=14, anchor="end")
    return s.render()


# ---------------------------------------------------------------------------
# vscode-window (lecture 1, the parts of the window): VSCode with the Homework folder.
# The texts are the English menus and files of VSCode, the same in both languages.

VSCODE = {"en": {"title": "VSCode with the Homework folder"},
          "bg": {"title": "VSCode с папката Homework"}}


def vscode_window(t):
    s = Svg(950, 560, t["title"])
    white, side, bar = "#ffffff", "#f7f6f3", "#ebe8e1"
    s.raw('<g transform="translate(30,0)">')      # room on the left for the number 1

    def fill(x, y, w, h, color, stroke=None, radius=0):
        line = f' stroke="{stroke}" stroke-width="1.5"' if stroke else ""
        s.raw(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{radius}" fill="{color}"{line}/>')

    def mark(x, y, n):
        s.raw(f'<circle cx="{x}" cy="{y}" r="12" fill="{COLORS["red"][1]}"/>')
        s.text(x, y + 5, str(n), size=14, weight=700, color="#ffffff", anchor="middle")

    # the window, the title bar with the menus and the command center
    fill(10, 10, 900, 540, white, COLORS["gray"][1], radius=8)
    fill(11, 11, 898, 30, bar, radius=7)
    s.text(24, 31, "File   Edit   Selection   View   Go   Run   Terminal   Help", size=12)
    fill(470, 17, 300, 18, white, COLORS["gray"][1], radius=5)
    s.text(620, 30, "JS-Basics-Practical-IBM-Homework", size=11, color=MUTED, anchor="middle")
    # the activity bar and its icons: Explorer, Search, Source Control, Run, Extensions
    fill(11, 41, 44, 479, bar)
    s.raw(f'<rect x="11" y="44" width="3" height="32" fill="{COLORS["blue"][1]}"/>')
    ink = f'fill="none" stroke="{MUTED}" stroke-width="1.8"'
    s.raw(f'<path d="M24,51 h11 l5,5 v15 h-16 z M29,51 v-3 h11 l5,5 v15 h-5" {ink}/>')
    s.raw(f'<circle cx="31" cy="98" r="6" {ink}/><path d="M35,103 L41,109" {ink}/>')
    s.raw(f'<circle cx="27" cy="134" r="3" {ink}/><circle cx="27" cy="152" r="3" {ink}/>'
          f'<circle cx="39" cy="140" r="3" {ink}/><path d="M27,137 v12 M39,143 q0,6 -12,6" {ink}/>')
    s.raw(f'<path d="M25,174 L39,182 L25,190 z" {ink}/>')
    s.raw(f'<path d="M23,212 h7 v7 h-7 z M23,221 h7 v7 h-7 z M32,221 h7 v7 h-7 z M34,208 h7 v7 h-7 z" {ink}/>')
    # the Explorer
    fill(55, 41, 280, 479, side)
    s.text(70, 62, "EXPLORER", size=11, weight=700, color=MUTED)
    s.text(66, 86, "v JS-BASICS-PRACTICAL-IBM-HOMEWORK", size=10, weight=700)
    tree = [(0, "> .vscode"), (0, "> 02-variables-and-types"), (0, "> 03-conditions-and-loops"),
            (0, "> 04-arrays-and-records"), (0, "v 05-functions"), (1, "v practice"),
            (2, "task1-predict.js"), (2, "task2-versions.js"), (2, "..."), (1, "homework.js"),
            (0, "> data"), (0, "check.js"), (0, "package.json"), (0, "README.md")]
    for i, (level, name) in enumerate(tree):
        y = 110 + i * 22
        if name.startswith("task2"):
            fill(56, y - 15, 278, 21, COLORS["blue"][0])
        s.text(78 + level * 16, y, name, size=12.5)
    # the editor: the tab and the code of one part
    fill(335, 41, 574, 30, side)
    fill(335, 41, 160, 30, white)
    s.raw(f'<rect x="335" y="41" width="160" height="2" fill="{COLORS["blue"][1]}"/>')
    s.text(349, 61, "task2-versions.js", size=12)
    code = [("// == Part 2: versionBelow(current, minimum) ==", MUTED),
            ("// true if current is lower than minimum.", MUTED), ("", INK),
            ("function versionBelow(current, minimum) {", INK),
            ("    // ---- your code: part 2 ----", MUTED),
            ("    return compareVersions(current, minimum) < 0;", INK),
            ("    // ---- end of your code ----", MUTED), ("}", INK), ("", INK),
            ('check("versionBelow", versionBelow("2.9", "2.14"), true);', INK)]
    fill(377, 168, 515, 64, COLORS["orange"][0])
    for i, (line, color) in enumerate(code):
        y = 98 + i * 21
        s.text(370, y, str(46 + i), size=12, mono=True, color=MUTED, anchor="end")
        s.text(385, y, line, size=12, mono=True, color=color)
    # the panel with the terminal
    s.raw(f'<path d="M335,315 H909" stroke="{COLORS["gray"][1]}" stroke-width="1.5"/>')
    s.text(349, 337, "PROBLEMS     OUTPUT     DEBUG CONSOLE", size=11, color=MUTED)
    s.text(605, 337, "TERMINAL", size=11, weight=700)
    s.raw(f'<rect x="605" y="343" width="60" height="2" fill="{COLORS["blue"][1]}"/>')
    s.text(740, 337, "powershell", size=12, color=MUTED)
    s.text(812, 338, "+", size=17, weight=700, color=MUTED)
    s.raw(f'<path d="M828,330 l4,4 l4,-4" {ink}/>')
    s.raw(f'<path d="M850,327 h14 M853,327 v-2 h8 v2 M852,329 l1,12 h8 l1,-12" {ink}/>')
    output = [("PS C:\\Users\\you\\JS_Basics_Course\\JS-Basics-Practical-IBM-Homework>", INK),
              ("  node 05-functions/practice/task2-versions.js", INK),
              ('OK   versionBelow "2.10" "2.14"', COLORS["green"][1]),
              ('FAIL status OK: got "Below recommended", expected "OK"', COLORS["red"][1]),
              ("...", INK), ("16 of 18 checks passed", INK)]
    for i, (line, color) in enumerate(output):
        s.text(349, 368 + i * 20, line, size=11.5, mono=True, color=color)
    # the status bar
    fill(11, 520, 898, 29, COLORS["blue"][0], radius=0)
    s.raw(f'<path d="M11,520 H909" stroke="{COLORS["blue"][1]}" stroke-width="1.5"/>')
    s.text(24, 539, "main", size=12)
    s.text(895, 539, "Ln 51, Col 50    Spaces: 4    UTF-8    LF    JavaScript", size=12, anchor="end")
    # the numbers, explained in the lecture: 1 activity bar, 2 explorer, 3 editor,
    # 4 panel (terminal), 5 status bar
    mark(-14, 143, 1)
    mark(160, 57, 2)
    mark(520, 56, 3)
    mark(703, 333, 4)
    mark(500, 535, 5)
    s.raw('</g>')
    return s.render()


DIAGRAMS = {"homework-repos": (homework_repos, REPOS),
            "terminal-prompt": (terminal_prompt, PROMPT),
            "vscode-window": (vscode_window, VSCODE)}

if __name__ == "__main__":
    for name, (draw, texts) in DIAGRAMS.items():
        for lang, folder in (("en", OUT), ("bg", OUT / "bg")):
            folder.mkdir(parents=True, exist_ok=True)
            (folder / f"{name}.svg").write_text(draw(texts[lang]), encoding="utf-8")
            print("wrote", (folder / f"{name}.svg").relative_to(OUT.parents[2]))
