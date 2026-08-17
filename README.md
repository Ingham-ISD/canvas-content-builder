# Canvas Content Builder

A separate Chrome extension from `Canvas Agent Editor`. The editor writes HTML into an
open RCE. This app builds **course structure in bulk** — modules, pages, assignments,
graded discussions, and classic quizzes — and edits existing content across many items
at once.

All Canvas writes run through the teacher's **logged-in browser session**. No API token
is ever stored. Every action is limited to what that teacher can already do in Canvas.

---

## Install (unpacked)

1. Open `chrome://extensions`
2. Turn on **Developer mode** (top right)
3. Click **Load unpacked**
4. Select this folder
5. Pin the extension, open a Canvas course, click the icon to open the side panel

## Organization configuration

The organization-managed proxy is preconfigured for the extension. It keeps the Airia
API key outside the extension and teacher devices. Proxy configuration, agent prompts,
and internal instructional resources are intentionally not included in this public
repository.

The public privacy policy used for the Chrome Web Store is hosted at
<https://ingham-isd.github.io/canvas-content-builder/>.

**Loading a pipeline prompt is optional.** The extension sends its full output contract
(modes, field rules, question types, marker format) with every request, so a bare
pass-through pipeline works. [`AGENT_PROMPT.md`](AGENT_PROMPT.md) is the same contract in
document form — load it into the pipeline if you want it reinforced server-side.

> Still prefer a **separate pipeline from the RCE editor**. The editor's system prompt
> tells the model to return HTML fragments, which actively fights the JSON contract this
> app sends. A pipeline with no system prompt is better than one with the wrong prompt.

## Verify before you rely on it

Settings → **Diagnostics**:

- **Test Canvas access** — confirms course detection, session auth, CSRF, and read access.
  Prints how many modules/pages/assignments/discussions/quizzes it can see.
- **Test agent connection** — calls the pipeline and reports precisely where it fails:
  the HTTP request, the JSON parse, or the mode check. If it says the pipeline is
  reachable but isn't returning `build_plan`, the prompt isn't loaded.

Run both before assuming anything is broken. They separate "agent problem" from
"Canvas problem," which is exactly the ambiguity that made the previous attempt hard
to diagnose.

---

## What it does

### Assessment Studio

Drop one question document that contains one or many labeled tests, chapters, or bay
knowledge checks. The dedicated Assessment Studio pipeline returns an `assessment_plan`
with one unpublished Classic Quiz per labeled assessment. Review all quiz/question counts
and warnings, then create the entire batch with a live run log. It preserves source
wording and flags missing answer keys rather than guessing them.

Assessment Studio currently accepts `.docx`, `.txt`, `.md`, `.html`, `.csv`, `.tsv`,
`.json`, and `.rtf`. PDF and Google Drive-picker intake are deliberately not enabled yet.

It is **Classic Quizzes only**. It does not create New Quizzes or question banks.

### Build tab

1. Optionally drop in source material — `.docx`, `.txt`, `.md`, `.html`, `.csv`
2. Optionally pick a **style reference** template; the agent matches its structure
3. Describe the build
4. Review the generated plan — counts, per-item settings, validation errors and warnings
5. **Create in Canvas** with a live run log

Creates modules, pages, assignments (points, submission types, grading type, due dates,
allowed extensions), graded or ungraded discussions, classic quizzes with questions, and
module subheaders — then attaches everything to its module.

### Bulk Edit tab

1. **Load course content** — paginated inventory of everything in the course
2. Filter by kind or title, then select items
3. Choose an operation:
   - **Add / rewrite HTML with the agent** — describe it; one fragment is applied to all
   - **Insert my own HTML snippet** — paste it directly
   - **Change assignment settings** — points, submission types, grading type, published
4. Placement: **prepend**, **append**, or **replace**
5. Preview the exact change and affected item list, then apply

### Document → classic quiz

Drop a question document on the Build tab and ask for a quiz. The agent infers question
types from the document's shape (lettered options → multiple choice, "True or False" →
true/false, "Explain" → essay, "select all" → multiple answers) and applies an answer key
if the document contains one.

If there's **no answer key**, questions are still created with nothing marked correct,
and the plan notes say so. The agent is instructed never to guess at correct answers.

---

## How it works

`panel.js` orchestrates; `canvas-engine.js` executes. The engine is injected into the
Canvas tab via `chrome.scripting.executeScript` with `world: "MAIN"`, so its `fetch`
calls carry session cookies and the page's CSRF token.

**One injected call per atomic operation.** The panel drives the loop, which is what
makes the live run log and partial-failure reporting possible. A failed item is logged
and the build continues.

The engine handles Link-header pagination and retries rate-limited requests with
exponential backoff (2s → 16s).

### Quiz sequencing

Quizzes are created **unpublished**, questions are added, then the quiz is re-saved to
publish. Canvas will not reliably accept new questions into an already-published quiz,
and re-saving is also what forces it to recompute `points_possible` from the question set.

### Files

| File | Role |
|---|---|
| `manifest.json` | MV3 manifest; side panel, scripting, and Canvas host access |
| `background.js` | Side-panel and extension runtime handling |
| `panel.html` / `panel.css` | Main multi-workspace UI |
| `panel.js` | Orchestration, validation, plan rendering, run logs |
| `canvas-engine.js` | Self-contained injected Canvas API engine |
| `sources.js` | File ingestion, including native DOCX extraction |
| `templates.js` | Template library (shared lineage with the editor app) |

`canvas-engine.js` is serialized and re-parsed inside the Canvas page, so it **cannot
reference anything outside its own function body**. Every helper it needs is declared
inline. Keep it that way.

---

## Vanity Canvas domains

`manifest.json` pre-authorizes `*.instructure.com`. Many districts use a vanity domain
like `canvas.district.edu`. On those, the panel shows a **Grant access** banner; one
click requests permission for that origin at runtime.

Course detection keys off the presence of `window.ENV`, not the hostname, so vanity
domains detect correctly once permission is granted.

---

## Known limits

- **No rollback.** If a build fails partway, created objects stay. The run log is the
  record — copy it. Re-running creates duplicates rather than resuming.
- **Duplicate detection warns, it does not block.** The plan review flags titles that
  already exist in the course; creating them anyway is allowed.
- **New Quizzes is not supported.** Classic quizzes only. New Quizzes content lives
  behind a separate LTI service with a much weaker API.
- **`.doc` and `.pdf` are not supported.** Re-save as `.docx` or paste the text.
- **Rate limits.** Very large builds may hit Canvas' leaky bucket. The engine backs off
  and retries, but a 200-item build will be slow.
- **HTML is not sanitized.** Agent-generated HTML is sent to Canvas as-is. The prompt
  forbids `<script>` and document-level tags, but nothing enforces it yet.

## Verification status

**Static (headless Chromium against the real `panel.html`):** zero JS errors across all
four scripts, template library loads, plan validation produces correct counts, and the
response parser accepts marker-wrapped JSON, routes `clarify` mode, and rejects prose.

**Live agent pipeline:** confirmed returning a correctly-shaped `build_plan` inside the
marker block, driven by the contract the extension sends.

**Live Canvas READ:** confirmed on `inghamisd.instructure.com` — course detection,
session auth, CSRF, and paginated inventory across modules, pages, assignments,
discussions, and quizzes.

**Live Canvas WRITE: still unverified.** No `POST` or `PUT` has run against a real
course. Do a deliberately tiny build first — one module with one page — and confirm it
appears correctly before attempting anything at scale. Quiz creation is the most
intricate path (create unpublished → add questions → finalize) and deserves its own
small test.
