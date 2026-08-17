// --- Canvas Bulk Builder: panel controller ---

const STORAGE_KEYS = {
  proxyUrl: "cbb_proxyUrl",
  dataNoticeAccepted: "cbb_dataNoticeAccepted"
};

// This public endpoint is organization configuration, not a secret. The Airia
// API key remains only in Apps Script Script Properties.
const DEFAULT_PROXY_URL = "https://script.google.com/a/macros/inghamisd.org/s/AKfycbzeCmjQaCVrQjkKebeEY23byEqYGkAD5-srzL9cJUHxfyvpeK-RBvujy0hGOeyGstUvaQ/exec";

const PLAN_START = "<!--CANVAS_BUILD_PLAN_START-->";
const PLAN_END = "<!--CANVAS_BUILD_PLAN_END-->";

const VALID_ITEM_TYPES = ["page", "assignment", "discussion", "quiz", "subheader"];
const VALID_SUBMISSION_TYPES = [
  "online_text_entry", "online_upload", "online_url", "online_quiz",
  "discussion_topic", "on_paper", "none", "external_tool", "media_recording"
];
const VALID_QUESTION_TYPES = [
  "multiple_choice_question", "true_false_question", "short_answer_question",
  "multiple_answers_question", "matching_question", "essay_question",
  "numerical_question", "fill_in_multiple_blanks_question",
  "multiple_dropdowns_question", "file_upload_question", "text_only_question"
];

// The full output contract travels with every request rather than living only
// in the pipeline's system prompt. A pipeline that is missing or has the wrong
// prompt is otherwise indistinguishable from a broken app, and that ambiguity
// has cost real debugging time. This makes the extension self-describing.
const SCHEMA_CONTRACT = `[OUTPUT CONTRACT — FOLLOW EXACTLY]
You return JSON wrapped in marker comments. No prose outside the markers.
Never return a bare HTML fragment as your top-level answer.

<!--CANVAS_BUILD_PLAN_START-->
{ ...json... }
<!--CANVAS_BUILD_PLAN_END-->

The JSON MUST have a top-level string field named "mode". Do NOT nest the plan
under a key named after the mode. Correct: {"mode":"build_plan","modules":[...]}
Wrong: {"build_plan":{"modules":[...]}}

MODE "build_plan" — creating new Canvas content:
{
  "mode": "build_plan",
  "title": "string",
  "notes": "optional one-line note for the teacher",
  "modules": [
    {
      "name": "Module 1: Foundations",   // or null to create items unattached
      "published": false,
      "items": [
        {"type":"page","title":"...","html":"<div>...</div>","published":false},
        {"type":"assignment","title":"...","html":"<div>...</div>",
         "points_possible":25,"submission_types":["online_upload"],
         "allowed_extensions":["pdf","docx"],"grading_type":"points",
         "due_at":null,"published":false},
        {"type":"discussion","title":"...","html":"<div>...</div>",
         "graded":true,"points_possible":10,"threaded":true,"published":false},
        {"type":"quiz","title":"...","html":"<p>instructions</p>",
         "quiz_type":"assignment","time_limit":30,"allowed_attempts":1,
         "shuffle_answers":true,"published":false,"questions":[...]},
        {"type":"subheader","title":"Week 2","published":false}
      ]
    }
  ]
}

FIELD RULES:
- "modules" is always an array, even for a single module.
- "type" is one of: page, assignment, discussion, quiz, subheader.
- "html" is a Canvas-safe fragment. NO <html>, <head>, <body>, <script>, or
  external stylesheet links. Inline styles only.
- "submission_types" is an array from: online_text_entry, online_upload,
  online_url, on_paper, none, media_recording, external_tool.
- "points_possible" is a NUMBER, never a string.
- "grading_type" is one of: points, percent, pass_fail, letter_grade.
- Dates ("due_at","unlock_at","lock_at") are ISO-8601 strings or null.
  NEVER invent a date. Omit unless the teacher gave a real one.
- A discussion is graded ONLY when "graded": true.

QUIZZES — Canvas CLASSIC quizzes. Each quiz has a "questions" array:
{
  "question_name": "Question 1",
  "question_text": "<p>Which phase follows metaphase?</p>",
  "question_type": "multiple_choice_question",
  "points_possible": 2,
  "answers": [
    {"answer_text":"Anaphase","answer_weight":100},
    {"answer_text":"Prophase","answer_weight":0}
  ]
}
- question_type is one of: multiple_choice_question, true_false_question,
  short_answer_question, multiple_answers_question, matching_question,
  essay_question, numerical_question, file_upload_question, text_only_question.
- answer_weight is exactly 100 (correct) or 0 (incorrect). Nothing else.
- Every type EXCEPT essay_question, file_upload_question, and
  text_only_question REQUIRES a non-empty "answers" array with at least one
  answer weighted 100.
- true_false_question takes exactly two answers: "True" and "False".
- matching_question uses "answer_match_left"/"answer_match_right" per answer.
- question_text is HTML; wrap it in <p>.
- Strip leading question numbers — Canvas numbers questions itself.

TURNING A DOCUMENT INTO A QUIZ:
1. Preserve the teacher's original wording and question order.
2. Infer question_type from shape: lettered options -> multiple_choice;
   "True or False" -> true_false; "Explain"/"Describe" -> essay;
   "select all that apply" -> multiple_answers; short factual prompt with no
   options -> short_answer.
3. Apply an answer key if one exists (inline markers, bold, "Answer:", or a
   key block at the end).
4. If there is NO answer key, still emit every question, weight all answers 0,
   and say so in "notes". NEVER guess a correct answer.

MODE "bulk_html" — one HTML fragment applied to many existing items:
{"mode":"bulk_html","notes":"optional","html":"<div>...</div>"}
Keep it generic; it lands in many items, so do not reference a specific title,
due date, or point value.

MODE "clarify" — only when the request is genuinely unusable:
{"mode":"clarify","questions":["...","..."]}
Prefer building a solid first pass; the teacher reviews everything before
anything is written to Canvas.

MODE "item_rebuild" — a complete replacement for ONE existing Canvas item:
{"mode":"item_rebuild","notes":"optional","html":"<div>...</div>"}
Return a full Canvas-safe HTML fragment for the one target provided. Preserve
verified course-specific facts, links, and requirements from its current HTML;
remove obsolete layout/placeholder content only when the teacher asked for a
redesign. Do not include html, head, body, script, or external stylesheet tags.

CONTENT: Write real instructional content. Never "Lorem ipsum" or
"[insert text here]". Titles are concise and teacher-facing.
[/OUTPUT CONTRACT]`;

const state = {
  course: null,
  source: null,
  chatLastPrompt: "",
  plan: null,
  validation: { errors: [], warnings: [] },
  inventory: null,
  selectedItems: new Set(),
  pendingBulk: null,
  assessmentSource: null,
  assessmentPlan: null,
  busy: false
};

const $ = (id) => document.getElementById(id);

// ============================================================
// utilities
// ============================================================

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function setHidden(el, hidden) {
  if (el) el.classList.toggle("hidden", !!hidden);
}

function stripHtml(html) {
  const div = document.createElement("div");
  div.innerHTML = String(html || "");
  return (div.textContent || "").replace(/\s+/g, " ").trim();
}

// ============================================================
// settings
// ============================================================

function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(Object.values(STORAGE_KEYS), (data) => {
      resolve({
        proxyUrl: data[STORAGE_KEYS.proxyUrl] || DEFAULT_PROXY_URL
      });
    });
  });
}

async function hydrateSettingsForm() {
  const s = await loadSettings();
  $("proxyUrl").value = s.proxyUrl;
}

async function hasDataNoticeConsent() {
  return new Promise((resolve) => {
    chrome.storage.local.get(STORAGE_KEYS.dataNoticeAccepted, (data) => {
      resolve(data[STORAGE_KEYS.dataNoticeAccepted] === true);
    });
  });
}

async function hydrateDataNotice() {
  setHidden($("dataNotice"), await hasDataNoticeConsent());
}

async function requireDataNoticeConsent() {
  if (await hasDataNoticeConsent()) return;
  setHidden($("dataNotice"), false);
  throw new Error("Review and acknowledge the data-use notice before sending material to the AI service.");
}

function acceptDataNotice() {
  chrome.storage.local.set({ [STORAGE_KEYS.dataNoticeAccepted]: true }, () => {
    setHidden($("dataNotice"), true);
  });
}

function saveSettings() {
  const payload = {
    [STORAGE_KEYS.proxyUrl]: $("proxyUrl").value.trim()
  };
  chrome.storage.local.set(payload, () => {
    const el = $("settingsStatus");
    el.textContent = "Settings saved.";
    el.className = "status-card success";
    setHidden(el, false);
    setTimeout(() => setHidden(el, true), 2500);
  });
}

// ============================================================
// Canvas tab bridge
// ============================================================

function getActiveTab() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs?.[0];
      if (!tab?.id) reject(new Error("No active browser tab found."));
      else resolve(tab);
    });
  });
}

async function runEngine(job) {
  const tab = await getActiveTab();

  return new Promise((resolve, reject) => {
    chrome.scripting.executeScript(
      { target: { tabId: tab.id }, world: "MAIN", func: canvasEngine, args: [job] },
      (results) => {
        const err = chrome.runtime.lastError;
        if (err) {
          reject(new Error(`Cannot reach the Canvas page: ${err.message}`));
          return;
        }
        const frame = results?.[0];
        if (!frame) {
          reject(new Error("The Canvas page returned no result."));
          return;
        }
        resolve(frame.result);
      }
    );
  });
}

// Injected async functions reject by throwing inside the page, which surfaces
// as an undefined result. Wrap so failures carry a usable message.
async function engine(job) {
  let result;
  try {
    result = await runEngine(job);
  } catch (e) {
    throw new Error(`[${job.op}] ${e.message}`);
  }
  if (result === undefined || result === null) {
    throw new Error(
      `[${job.op}] The Canvas request failed. Open DevTools on the Canvas tab for the underlying error.`
    );
  }
  return result;
}

// ============================================================
// course detection
// ============================================================

async function detectCourse() {
  const statusEl = $("courseStatus");

  let tab;
  try {
    tab = await getActiveTab();
  } catch {
    statusEl.textContent = "No active tab.";
    statusEl.className = "course-line bad";
    return;
  }

  try {
    new URL(tab.url);
  } catch {
    statusEl.textContent = "Open a Canvas course page.";
    statusEl.className = "course-line bad";
    return;
  }

  // Store distribution is intentionally scoped to the district's
  // Instructure-hosted Canvas instance, not broad all-sites access.
  const known = /instructure\.com$/i.test(new URL(tab.url).hostname);
  if (!known) {
    statusEl.textContent = "Open the district Canvas site.";
    statusEl.className = "course-line bad";
    return;
  }

  try {
    const result = await engine({ op: "detect" });

    if (!result.isCanvas) {
      state.course = null;
      statusEl.textContent = "Not a Canvas page.";
      statusEl.className = "course-line bad";
      return;
    }
    if (!result.courseId) {
      state.course = null;
      statusEl.textContent = "Canvas detected, but no course. Open a course.";
      statusEl.className = "course-line bad";
      return;
    }

    state.course = result;
    statusEl.textContent = `${result.courseName || "Course"} (#${result.courseId})`;
    statusEl.className = "course-line ok";
    statusEl.title = result.href;
  } catch (e) {
    state.course = null;
    statusEl.textContent = e.message;
    statusEl.className = "course-line bad";
  }
}

function requireCourse() {
  if (!state.course?.courseId) {
    throw new Error("Open a Canvas course page, then press the refresh icon.");
  }
  return state.course.courseId;
}

// ============================================================
// agent
// ============================================================

async function callAgent(message) {
  await requireDataNoticeConsent();
  const settings = await loadSettings();
  if (!settings.proxyUrl) {
    throw new Error("Add your organization proxy URL under Settings first.");
  }

  const result = await new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: "proxyRequest", url: settings.proxyUrl, body: { userInput: message, channel: "bulk_builder" } },
      (resp) => resolve(resp)
    );
  });

  if (!result) throw new Error("No response from the background worker.");
  if (result.error) throw new Error(result.error);

  const raw = result.data || "";
  let text = raw;
  try {
    const json = JSON.parse(raw);
    text = json.result ?? json.output ?? json.response ?? json.message ?? json.content ?? raw;
    if (typeof text !== "string") text = JSON.stringify(text);
  } catch {
    // Pipeline returned bare text.
  }

  if (!text.trim()) throw new Error("The agent returned an empty response.");
  return text;
}

// ============================================================
// teacher-facing chat home
// ============================================================

function escapeChatHtml(text) {
  return String(text).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[character]));
}

function renderChatInline(text) {
  return escapeChatHtml(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

function renderChatMarkdown(text) {
  const lines = String(text).replace(/\r\n?/g, "\n").split("\n");
  const html = [];
  let listType = null;
  const closeList = () => {
    if (listType) html.push(`</${listType}>`);
    listType = null;
  };
  const cells = (line) => line.trim().replace(/^\|/, "").replace(/\|$/, "")
    .split("|").map((cell) => renderChatInline(cell.trim()));

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    const unordered = line.match(/^\s*[-*]\s+(.+)$/);
    const ordered = line.match(/^\s*\d+\.\s+(.+)$/);

    if (line.includes("|") && /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(lines[index + 1] || "")) {
      closeList();
      const headers = cells(line);
      const rows = [];
      index += 2;
      while (index < lines.length && lines[index].includes("|")) {
        rows.push(cells(lines[index]));
        index += 1;
      }
      index -= 1;
      html.push("<div class=\"chat-table-wrap\"><table><thead><tr>");
      headers.forEach((cell) => html.push(`<th>${cell}</th>`));
      html.push("</tr></thead><tbody>");
      rows.forEach((row) => {
        html.push("<tr>");
        row.forEach((cell) => html.push(`<td>${cell}</td>`));
        html.push("</tr>");
      });
      html.push("</tbody></table></div>");
      continue;
    }

    if (heading) {
      closeList();
      const level = heading[1].length;
      html.push(`<h${level}>${renderChatInline(heading[2])}</h${level}>`);
    } else if (unordered) {
      if (listType !== "ul") { closeList(); html.push("<ul>"); listType = "ul"; }
      html.push(`<li>${renderChatInline(unordered[1])}</li>`);
    } else if (ordered) {
      if (listType !== "ol") { closeList(); html.push("<ol>"); listType = "ol"; }
      html.push(`<li>${renderChatInline(ordered[1])}</li>`);
    } else if (!line.trim()) {
      closeList();
    } else {
      closeList();
      html.push(`<p>${renderChatInline(line)}</p>`);
    }
  }
  closeList();
  return html.join("");
}

function addChatMessage(role, text) {
  const row = document.createElement("div");
  row.className = `chat-message ${role}`;
  const bubble = document.createElement("div");
  bubble.className = "chat-bubble";
  if (role === "assistant") bubble.innerHTML = renderChatMarkdown(text);
  else bubble.textContent = text;
  row.appendChild(bubble);
  $("chatMessages").appendChild(row);
  $("chatMessages").scrollTop = $("chatMessages").scrollHeight;
  return bubble;
}

function renderChatSource() {
  const status = $("chatSourceStatus");
  const remove = $("chatClearSource");
  if (!state.source) {
    setHidden(status, true);
    setHidden(remove, true);
    return;
  }
  status.textContent = `Attached: ${state.source.name}`;
  status.title = `${state.source.name} — ${state.source.content.length.toLocaleString()} characters`;
  setHidden(status, false);
  setHidden(remove, false);
}

async function sendChat() {
  const prompt = $("chatPrompt").value.trim();
  if (!prompt) return;

  state.chatLastPrompt = prompt;
  $("chatPrompt").value = "";
  setHidden($("chatError"), true);
  addChatMessage("user", prompt);
  const pending = addChatMessage("assistant", "Thinking…");
  $("sendChat").disabled = true;

  try {
    const courseContext = state.course?.courseId
      ? `\n\n[CURRENT CANVAS COURSE]\nName: ${state.course.courseName || "Unknown"}\nCourse ID: ${state.course.courseId}\n[/CURRENT CANVAS COURSE]`
      : "";
    const sourceContext = state.source
      ? `\n\n[UPLOADED SOURCE MATERIAL]\nFilename: ${state.source.name}\n${state.source.content.slice(0, 70000)}\n[/UPLOADED SOURCE MATERIAL]`
      : "";
    const response = await callAgent(
      "[CANVAS CONTENT BUILDER CHAT]\nRespond as the teacher's Canvas course-design partner. Give a helpful, teacher-facing answer. Do not return a machine build-plan JSON unless the teacher explicitly asks to move into the Build tool.\n[/CANVAS CONTENT BUILDER CHAT]\n\n" + prompt + courseContext + sourceContext
    );
    pending.innerHTML = renderChatMarkdown(response);
  } catch (error) {
    pending.parentElement.remove();
    $("chatError").textContent = error.message || String(error);
    setHidden($("chatError"), false);
  } finally {
    $("sendChat").disabled = false;
    $("chatPrompt").focus();
  }
}

function createPlanFromChat() {
  const prompt = $("chatPrompt").value.trim() || state.chatLastPrompt ||
    (state.source
      ? "Create an unpublished Canvas build plan from the attached source material. Preserve its structure and clearly flag anything that requires teacher review."
      : "Create an unpublished Canvas build plan based on our conversation. Clearly flag anything that requires teacher review.");
  $("buildPrompt").value = prompt;
  switchView("build");
  generatePlan();
}

// ============================================================
// Assessment Studio — a single source document can yield many Classic Quizzes.
// ============================================================

const ASSESSMENT_START = "<!--CANVAS_ASSESSMENT_PLAN_START-->";
const ASSESSMENT_END = "<!--CANVAS_ASSESSMENT_PLAN_END-->";

async function callAssessmentAgent(message) {
  await requireDataNoticeConsent();
  const settings = await loadSettings();
  if (!settings.proxyUrl) throw new Error("Add your organization proxy URL under Settings first.");
  const result = await new Promise((resolve) => chrome.runtime.sendMessage(
    { type: "proxyRequest", url: settings.proxyUrl, body: { userInput: message, channel: "assessment" } }, resolve));
  if (!result) throw new Error("No response from the background worker.");
  if (result.error) throw new Error(result.error);
  let text = result.data || "";
  try {
    const json = JSON.parse(text);
    text = json.result ?? json.output ?? json.response ?? json.message ?? json.content ?? text;
    if (typeof text !== "string") text = JSON.stringify(text);
  } catch { /* bare text */ }
  if (!text.trim()) throw new Error("The assessment agent returned an empty response.");
  return text;
}

function buildAssessmentMessage(instructions) {
  const source = state.assessmentSource;
  if (!source) throw new Error("Add a question document first.");
  return [
    "[ASSESSMENT STUDIO OUTPUT CONTRACT]",
    "Return JSON only inside <!--CANVAS_ASSESSMENT_PLAN_START--> and <!--CANVAS_ASSESSMENT_PLAN_END-->.",
    "Required mode: assessment_plan. Classic Quizzes only.",
    "Create one quizzes[] entry for each labeled test, quiz, bay, chapter, or assessment in source order.",
    "Preserve wording, choices, keys, points, source order, and warnings. Never guess keys; unknown choice keys use all 0 weights and a warning.",
    "Each quiz needs title, description_html, published:false, quiz_type:assignment, questions[].",
    "Each question needs question_name, question_text, question_type, points_possible, answers[], source_ref, warnings[].",
    "[/ASSESSMENT STUDIO OUTPUT CONTRACT]", "",
    "[QUESTION SOURCE]", `Filename: ${source.name}`, source.content, "[/QUESTION SOURCE]", "",
    "[TEACHER INSTRUCTIONS]", instructions.trim() || "Separate every labeled assessment into its own unpublished Classic Quiz. Preserve the source exactly.", "[/TEACHER INSTRUCTIONS]"
  ].join("\n");
}

function parseAssessmentPlan(text) {
  const start = text.indexOf(ASSESSMENT_START), end = text.indexOf(ASSESSMENT_END);
  let body = start !== -1 && end > start ? text.slice(start + ASSESSMENT_START.length, end).trim() : "";
  if (!body) {
    const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    body = fence?.[1]?.trim() || text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  }
  let plan;
  try { plan = JSON.parse(body); } catch (e) { throw new Error(`Assessment plan JSON is malformed: ${e.message}`); }
  if (plan?.mode === "clarify") throw new ClarifyRequest(Array.isArray(plan.questions) ? plan.questions : []);
  if (plan?.mode !== "assessment_plan") throw new Error(`Expected assessment_plan but received "${plan?.mode || "none"}". Check the Assessment Studio pipeline prompt.`);
  plan.quizzes = Array.isArray(plan.quizzes) ? plan.quizzes : [];
  plan.warnings = Array.isArray(plan.warnings) ? plan.warnings : [];
  plan.quizzes.forEach((quiz, qi) => {
    quiz.title = String(quiz.title || `Assessment ${qi + 1}`).trim();
    quiz.description_html = String(quiz.description_html || ""); quiz.published = false; quiz.quiz_type = quiz.quiz_type || "assignment";
    quiz.questions = Array.isArray(quiz.questions) ? quiz.questions : []; quiz.warnings = Array.isArray(quiz.warnings) ? quiz.warnings : [];
    quiz.questions.forEach((q, i) => {
      q.question_name = String(q.question_name || `Question ${i + 1}`); q.question_text = String(q.question_text || "");
      q.question_type = String(q.question_type || "multiple_choice_question").toLowerCase().trim(); q.points_possible = Number(q.points_possible ?? 1);
      q.answers = Array.isArray(q.answers) ? q.answers : []; q.warnings = Array.isArray(q.warnings) ? q.warnings : [];
    });
  });
  return plan;
}

function validateAssessmentPlan(plan) {
  const errors = [], warnings = [...plan.warnings]; let questions = 0;
  if (!plan.quizzes.length) errors.push("No quizzes were found in the source document.");
  plan.quizzes.forEach((quiz, qi) => {
    if (!quiz.title) errors.push(`Quiz ${qi + 1}: missing title.`);
    if (!quiz.questions.length) warnings.push(`Quiz "${quiz.title}": no questions found.`);
    quiz.warnings.forEach((w) => warnings.push(`Quiz "${quiz.title}": ${w}`));
    quiz.questions.forEach((q, i) => {
      questions += 1; const where = `Quiz "${quiz.title}" question ${i + 1}`;
      if (!q.question_text || !stripHtml(q.question_text)) errors.push(`${where}: missing question text.`);
      if (!VALID_QUESTION_TYPES.includes(q.question_type)) errors.push(`${where}: unsupported type "${q.question_type}".`);
      if (!Number.isFinite(q.points_possible) || q.points_possible < 0) errors.push(`${where}: invalid points.`);
      if (!["essay_question", "file_upload_question", "text_only_question"].includes(q.question_type) && !q.answers.length) errors.push(`${where}: missing answers.`);
      q.warnings.forEach((w) => warnings.push(`${where}: ${w}`));
    });
  });
  return { errors, warnings, quizzes: plan.quizzes.length, questions };
}

function renderAssessmentPlan(plan, validation) {
  $("assessmentCounts").textContent = `${validation.quizzes} quiz(zes) · ${validation.questions} question(s)`;
  const notices = [...validation.errors.map((x) => `ERROR: ${x}`), ...validation.warnings];
  $("assessmentWarnings").innerHTML = notices.length ? `<div class="validation-list warn">${notices.map((w) => `<div>${escapeHtml(w)}</div>`).join("")}</div>` : `<div class="validation-list ok"><div>Ready for review. No validation warnings.</div></div>`;
  $("assessmentPreview").innerHTML = plan.quizzes.map((quiz, qi) => `<div class="plan-module"><div class="plan-module-head"><strong>${qi + 1}. ${escapeHtml(quiz.title)}</strong><span>${quiz.questions.length} question(s)</span></div><div class="plan-items">${quiz.questions.map((q, i) => `<div class="plan-item"><span class="type-badge type-quiz">Q${i + 1}</span><div><strong>${escapeHtml(q.question_name)}</strong><div class="item-meta">${escapeHtml(q.question_type)} · ${q.points_possible} pt${Number(q.points_possible) === 1 ? "" : "s"}${q.source_ref ? ` · ${escapeHtml(q.source_ref)}` : ""}</div></div></div>`).join("")}</div></div>`).join("");
}

function showAssessmentError(message) { $("assessmentError").textContent = message; setHidden($("assessmentError"), !message); }

async function handleAssessmentFile(file) {
  try {
    const source = await readSourceFile(file); state.assessmentSource = source;
    $("assessmentSourceStatus").textContent = `${source.name} · ${source.content.length.toLocaleString()} characters`;
    $("assessmentSourceStatus").className = "status-card success"; setHidden($("assessmentSourceStatus"), false); setHidden($("clearAssessmentSource"), false); showAssessmentError("");
  } catch (e) { showAssessmentError(e.message); }
}

function clearAssessmentSource() { state.assessmentSource = null; $("assessmentFileInput").value = ""; setHidden($("assessmentSourceStatus"), true); setHidden($("clearAssessmentSource"), true); }

async function generateAssessmentPlan() {
  if (state.busy) return;
  if (!state.assessmentSource) return showAssessmentError("Add a question document first.");
  state.busy = true; $("generateAssessmentPlan").disabled = true; showAssessmentError("");
  try {
    const plan = parseAssessmentPlan(await callAssessmentAgent(buildAssessmentMessage($("assessmentPrompt").value)));
    const validation = validateAssessmentPlan(plan); state.assessmentPlan = plan; renderAssessmentPlan(plan, validation);
    $("runAssessmentBatch").disabled = validation.errors.length > 0; setHidden($("assessmentReview"), false);
  } catch (e) { showAssessmentError(e instanceof ClarifyRequest ? e.questions.join(" ") || e.message : e.message); }
  finally { state.busy = false; $("generateAssessmentPlan").disabled = false; }
}

async function runAssessmentBatch() {
  if (state.busy || !state.assessmentPlan) return;
  let courseId; try { courseId = requireCourse(); } catch (e) { return showAssessmentError(e.message); }
  const validation = validateAssessmentPlan(state.assessmentPlan);
  if (validation.errors.length) return showAssessmentError("Fix assessment validation errors before creating quizzes.");
  state.busy = true; $("runAssessmentBatch").disabled = true; $("generateAssessmentPlan").disabled = true; $("assessmentRunLog").innerHTML = ""; setHidden($("assessmentRunPanel"), false);
  const log = makeLogger($("assessmentRunLog"), $("assessmentProgressBar"), $("assessmentRunStatus"));
  log.setTotal(state.assessmentPlan.quizzes.reduce((n, q) => n + q.questions.length + 2, 0)); log.status("Running", "");
  let quizCount = 0, questionCount = 0; const failures = [];
  try {
    for (const quiz of state.assessmentPlan.quizzes) {
      try {
        const created = await engine({ op: "create_quiz", courseId, payload: quiz }); quizCount += 1; log.write(`+ Quiz "${created.title}" (unpublished)`, "ok"); log.tick();
        const result = await engine({ op: "add_quiz_questions", courseId, payload: { quizId: created.id, questions: quiz.questions } }); questionCount += result.created.length;
        log.write(`  + ${result.created.length}/${quiz.questions.length} question(s) added`, result.failed.length ? "warn" : "ok"); result.failed.forEach((f) => { failures.push(`${quiz.title}, Q${f.index}: ${f.error}`); log.write(`  ! Q${f.index} failed: ${f.error}`, "err"); }); for (let i = 0; i < quiz.questions.length; i += 1) log.tick();
        const final = await engine({ op: "finalize_quiz", courseId, payload: { quizId: created.id, published: false } }); log.write(`  = Finalized: ${final.points ?? 0} pts, unpublished`, "info"); log.tick();
      } catch (e) { failures.push(`${quiz.title}: ${e.message}`); log.write(`! Quiz "${quiz.title}" failed: ${e.message}`, "err"); }
    }
    log.write(`Done. Created ${quizCount} Classic Quiz(zes) with ${questionCount} question(s).`, failures.length ? "warn" : "ok"); log.status(failures.length ? `${failures.length} failed` : "Complete", ""); $("assessmentProgressBar").style.width = "100%"; state.inventory = null;
  } finally { state.busy = false; $("generateAssessmentPlan").disabled = false; $("runAssessmentBatch").disabled = false; }
}

function buildAgentMessage(userPrompt, opts = {}) {
  const chunks = [SCHEMA_CONTRACT, ""];

  if (state.course) {
    chunks.push(
      "[CANVAS CONTEXT]",
      `Course: ${state.course.courseName || "Unknown"}`,
      `Course ID: ${state.course.courseId}`,
      "[/CANVAS CONTEXT]",
      ""
    );
  }

  if (opts.template) {
    chunks.push(
      "[STYLE REFERENCE]",
      "Match the structure, sectioning, and inline-style conventions of this template.",
      "Replace the placeholder copy with real content. Do not copy the placeholder text.",
      opts.template.html,
      "[/STYLE REFERENCE]",
      ""
    );
  }

  if (state.source) {
    chunks.push(
      "[SOURCE MATERIAL]",
      `Filename: ${state.source.name}`,
      state.source.content,
      "[/SOURCE MATERIAL]",
      ""
    );
  }

  if (opts.mode === "bulk_html") {
    chunks.push(
      "[OUTPUT REQUIREMENT]",
      "Return mode `bulk_html` inside the documented marker block.",
      "Return ONE html fragment that will be applied to every selected item.",
      "Do not include <html>, <head>, or <body> tags.",
      "[/OUTPUT REQUIREMENT]",
      "",
      `[SELECTED ITEMS] ${opts.itemSummary} [/SELECTED ITEMS]`,
      ""
    );
  } else if (opts.mode === "item_rebuild") {
    chunks.push(
      "[OUTPUT REQUIREMENT]",
      "Return mode `item_rebuild` inside the documented marker block.",
      "Return one COMPLETE replacement HTML fragment for the one target item.",
      "Preserve verified facts from the supplied current HTML. Do not return <html>, <head>, or <body> tags.",
      "[/OUTPUT REQUIREMENT]",
      "",
      `[REBUILD TARGET] ${opts.itemSummary} [/REBUILD TARGET]`,
      ""
    );
  } else {
    chunks.push(
      "[OUTPUT REQUIREMENT]",
      "Return mode `build_plan` inside the documented marker block.",
      "Supported item types: page, assignment, discussion, quiz, subheader.",
      "Quizzes must be CLASSIC quizzes with a questions array.",
      opts.publish
        ? "The teacher asked for created items to be PUBLISHED. Set published: true."
        : "Default every created item to published: false.",
      "[/OUTPUT REQUIREMENT]",
      ""
    );
  }

  chunks.push(userPrompt.trim());
  return chunks.join("\n");
}

function extractMarkerBlock(text) {
  const s = String(text || "");
  const start = s.indexOf(PLAN_START);
  const end = s.indexOf(PLAN_END);
  if (start !== -1 && end !== -1 && end > start) {
    return s.slice(start + PLAN_START.length, end).trim();
  }

  // Fallback: a fenced json block.
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();

  // Last resort: outermost braces.
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first !== -1 && last > first) return s.slice(first, last + 1).trim();

  throw new Error(
    "The agent did not return a build plan. It replied with prose instead of JSON — " +
    "check that this pipeline uses the Bulk Builder prompt, not the RCE editor prompt."
  );
}

// Thrown when the agent asks for clarification instead of producing a plan.
class ClarifyRequest extends Error {
  constructor(questions) {
    super("The agent needs more information.");
    this.questions = questions;
  }
}

function parseAgentJson(text, expectedMode) {
  const jsonText = extractMarkerBlock(text);
  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    throw new Error(`The plan JSON is malformed: ${e.message}`);
  }

  if (parsed?.mode === "clarify") {
    throw new ClarifyRequest(
      Array.isArray(parsed.questions) ? parsed.questions : []
    );
  }

  if (parsed?.mode !== expectedMode) {
    throw new Error(
      `Expected mode "${expectedMode}" but received "${parsed?.mode || "none"}". ` +
      "The pipeline prompt is probably wrong for this app."
    );
  }
  return parsed;
}

// ============================================================
// plan validation
// ============================================================

function normalizePlan(plan, publishDefault) {
  const modules = Array.isArray(plan.modules) ? plan.modules : [];

  modules.forEach((m) => {
    m.items = Array.isArray(m.items) ? m.items : [];
    if (m.published === undefined) m.published = publishDefault;

    m.items.forEach((item) => {
      item.type = String(item.type || "").toLowerCase().trim();
      if (item.published === undefined) item.published = publishDefault;

      if (item.type === "assignment") {
        if (item.points_possible === undefined) item.points_possible = 0;
        if (!Array.isArray(item.submission_types) || !item.submission_types.length) {
          item.submission_types = ["online_text_entry"];
        }
      }
      if (item.type === "quiz") {
        item.questions = Array.isArray(item.questions) ? item.questions : [];
        item.questions.forEach((q) => {
          q.question_type = String(q.question_type || "multiple_choice_question").toLowerCase().trim();
          if (q.points_possible === undefined) q.points_possible = 1;
          if (!Array.isArray(q.answers)) q.answers = [];
        });
      }
    });
  });

  plan.modules = modules;
  return plan;
}

function validatePlan(plan) {
  const errors = [];
  const warnings = [];

  if (!plan.modules.length) errors.push("The plan contains no modules.");

  const inv = state.inventory;
  const existingTitles = new Set();
  if (inv) {
    [...inv.pages, ...inv.assignments, ...inv.discussions, ...inv.quizzes]
      .forEach((i) => existingTitles.add((i.title || "").toLowerCase().trim()));
  }
  const existingModules = new Set(
    (inv?.modules || []).map((m) => (m.name || "").toLowerCase().trim())
  );

  let itemCount = 0;
  let questionCount = 0;
  const seenTitles = new Set();

  plan.modules.forEach((m, mi) => {
    const label = m.name || `Module ${mi + 1}`;

    if (m.name && existingModules.has(m.name.toLowerCase().trim())) {
      warnings.push(`A module named "${m.name}" already exists. A second one will be created.`);
    }

    if (!m.items.length) warnings.push(`"${label}" has no items.`);

    m.items.forEach((item, ii) => {
      itemCount += 1;
      const where = `"${label}" item ${ii + 1}`;

      if (!VALID_ITEM_TYPES.includes(item.type)) {
        errors.push(`${where}: unsupported type "${item.type || "missing"}".`);
        return;
      }
      if (!item.title || !String(item.title).trim()) {
        errors.push(`${where}: missing a title.`);
        return;
      }

      const key = `${item.type}:${item.title.toLowerCase().trim()}`;
      if (seenTitles.has(key)) {
        warnings.push(`Duplicate ${item.type} title inside this plan: "${item.title}".`);
      }
      seenTitles.add(key);

      if (item.type !== "subheader" && existingTitles.has(item.title.toLowerCase().trim())) {
        warnings.push(`"${item.title}" already exists in this course. A duplicate will be created.`);
      }

      if (item.type === "assignment") {
        const pts = Number(item.points_possible);
        if (!Number.isFinite(pts) || pts < 0) {
          errors.push(`${where}: points_possible must be a number of 0 or more.`);
        }
        const bad = item.submission_types.filter((t) => !VALID_SUBMISSION_TYPES.includes(t));
        if (bad.length) errors.push(`${where}: invalid submission type(s) ${bad.join(", ")}.`);
      }

      if (item.type === "quiz") {
        if (!item.questions.length) {
          warnings.push(`${where}: quiz "${item.title}" has no questions.`);
        }
        item.questions.forEach((q, qi) => {
          questionCount += 1;
          const qWhere = `${where} question ${qi + 1}`;

          if (!VALID_QUESTION_TYPES.includes(q.question_type)) {
            errors.push(`${qWhere}: unsupported question_type "${q.question_type}".`);
            return;
          }
          if (!q.question_text || !stripHtml(q.question_text)) {
            errors.push(`${qWhere}: missing question_text.`);
          }

          const needsAnswers = !["essay_question", "file_upload_question", "text_only_question"]
            .includes(q.question_type);

          if (needsAnswers) {
            if (!q.answers.length) {
              errors.push(`${qWhere}: ${q.question_type} requires answers.`);
            } else if (!q.answers.some((a) => a.answer_weight)) {
              warnings.push(`${qWhere}: no answer is marked correct.`);
            }
          }
        });
      }

      if (["page", "assignment", "discussion"].includes(item.type) && !stripHtml(item.html)) {
        warnings.push(`${where}: "${item.title}" has no body content.`);
      }
    });
  });

  if (itemCount > 60) {
    warnings.push(`${itemCount} items is a large build. Canvas rate limits may slow the run.`);
  }

  return { errors, warnings, itemCount, questionCount };
}

// ============================================================
// plan rendering
// ============================================================

function itemMetaLine(item) {
  const bits = [];
  if (item.type === "assignment") {
    bits.push(`${item.points_possible} pts`);
    bits.push((item.submission_types || []).join(", ").replace(/online_/g, ""));
    if (item.grading_type && item.grading_type !== "points") bits.push(item.grading_type);
    if (item.due_at) bits.push(`due ${item.due_at}`);
  } else if (item.type === "quiz") {
    bits.push(`${item.questions.length} question(s)`);
    const pts = item.questions.reduce((s, q) => s + (Number(q.points_possible) || 0), 0);
    bits.push(`${pts} pts`);
    if (item.time_limit) bits.push(`${item.time_limit} min`);
  } else if (item.type === "discussion") {
    if (item.graded) bits.push(`graded, ${item.points_possible ?? 0} pts`);
    else bits.push("ungraded");
  }
  bits.push(item.published ? "published" : "unpublished");
  return bits.filter(Boolean).join(" &middot; ");
}

function renderPlan() {
  const plan = state.plan;
  const v = state.validation;

  $("planCounts").textContent =
    `${plan.modules.length} module(s), ${v.itemCount} item(s)` +
    (v.questionCount ? `, ${v.questionCount} question(s)` : "");

  if (plan.notes) {
    $("planNotes").textContent = plan.notes;
    setHidden($("planNotes"), false);
  } else {
    setHidden($("planNotes"), true);
  }

  $("planValidation").innerHTML = [
    ...v.errors.map((e) => `<div class="validation-item error">Error: ${escapeHtml(e)}</div>`),
    ...v.warnings.map((w) => `<div class="validation-item warn">Warning: ${escapeHtml(w)}</div>`)
  ].join("");

  $("planPreview").innerHTML = plan.modules.map((m) => {
    const items = m.items.map((item) => `
      <div class="plan-item">
        <span class="type-tag type-${escapeHtml(item.type)}">${escapeHtml(item.type)}</span>
        <div class="plan-item-body">
          <div class="plan-item-title">${escapeHtml(item.title)}</div>
          <div class="plan-item-meta">${itemMetaLine(item)}</div>
        </div>
      </div>`).join("");

    return `
      <article class="module-card">
        <div class="module-head">
          <h3>${escapeHtml(m.name || "(no module — items created standalone)")}</h3>
          <div class="module-meta">${m.published ? "Published" : "Unpublished"} &middot; ${m.items.length} item(s)</div>
        </div>
        ${items || '<div class="plan-item"><span class="muted">No items</span></div>'}
      </article>`;
  }).join("");

  $("runBuild").disabled = v.errors.length > 0;
  $("runBuild").textContent = v.errors.length
    ? `Fix ${v.errors.length} error(s) first`
    : "Create in Canvas";

  setHidden($("planReview"), false);
}

// ============================================================
// run log
// ============================================================

function makeLogger(logEl, barEl, statusEl) {
  const lines = [];
  let total = 0;
  let done = 0;

  return {
    setTotal(n) { total = n; },
    tick() {
      done += 1;
      if (barEl && total) barEl.style.width = `${Math.round((done / total) * 100)}%`;
    },
    write(text, kind = "info") {
      lines.push(text);
      const div = document.createElement("div");
      div.className = `log-line ${kind}`;
      div.textContent = text;
      logEl.appendChild(div);
      logEl.scrollTop = logEl.scrollHeight;
    },
    status(text, cls) {
      if (statusEl) {
        statusEl.textContent = text;
        if (cls) statusEl.className = `pill ${cls}`;
      }
    },
    text() { return lines.join("\n"); }
  };
}

// ============================================================
// build execution
// ============================================================

async function runBuild() {
  if (state.busy) return;

  let courseId;
  try {
    courseId = requireCourse();
  } catch (e) {
    showPlanError(e.message);
    return;
  }

  const plan = state.plan;
  state.busy = true;
  $("runBuild").disabled = true;
  $("generatePlan").disabled = true;

  $("runLog").innerHTML = "";
  setHidden($("runPanel"), false);

  const log = makeLogger($("runLog"), $("progressBar"), $("runStatus"));

  // Count every discrete Canvas call so the progress bar is honest.
  let totalOps = 0;
  plan.modules.forEach((m) => {
    if (m.name) totalOps += 1;
    m.items.forEach((item) => {
      totalOps += 1;
      if (m.name) totalOps += 1;
      if (item.type === "quiz") totalOps += item.questions.length + 1;
    });
  });
  log.setTotal(totalOps);
  log.status("Running", "");

  const created = { modules: 0, pages: 0, assignments: 0, discussions: 0, quizzes: 0, questions: 0 };
  const failures = [];

  try {
    for (const modulePlan of plan.modules) {
      let moduleId = null;

      if (modulePlan.name) {
        try {
          const mod = await engine({
            op: "create_module", courseId,
            payload: { name: modulePlan.name, published: modulePlan.published }
          });
          moduleId = mod.id;
          created.modules += 1;
          log.write(`+ Module "${mod.name}" (#${mod.id})`, "ok");
        } catch (e) {
          log.write(`! Module "${modulePlan.name}" failed: ${e.message}`, "err");
          failures.push(e.message);
          log.tick();
          continue; // its items would have nowhere to attach
        }
        log.tick();
      }

      for (const item of modulePlan.items) {
        try {
          let record = null;
          let attachType = null;

          if (item.type === "page") {
            record = await engine({ op: "create_page", courseId, payload: item });
            created.pages += 1;
            attachType = "Page";
            log.write(`  + Page "${record.title}"`, "ok");

          } else if (item.type === "assignment") {
            record = await engine({ op: "create_assignment", courseId, payload: item });
            created.assignments += 1;
            attachType = "Assignment";
            log.write(`  + Assignment "${record.title}" (${record.points} pts)`, "ok");

          } else if (item.type === "discussion") {
            record = await engine({ op: "create_discussion", courseId, payload: item });
            created.discussions += 1;
            attachType = "Discussion";
            log.write(`  + Discussion "${record.title}"`, "ok");

          } else if (item.type === "quiz") {
            record = await engine({ op: "create_quiz", courseId, payload: item });
            created.quizzes += 1;
            attachType = "Quiz";
            log.write(`  + Quiz "${record.title}" (unpublished)`, "ok");
            log.tick();

            if (item.questions.length) {
              const qResult = await engine({
                op: "add_quiz_questions", courseId,
                payload: { quizId: record.id, questions: item.questions }
              });
              created.questions += qResult.created.length;
              log.write(`    + ${qResult.created.length} question(s) added`, "ok");
              qResult.failed.forEach((f) => {
                log.write(`    ! Q${f.index} "${f.name}" failed: ${f.error}`, "err");
                failures.push(`Question ${f.index}: ${f.error}`);
              });
              for (let i = 0; i < item.questions.length; i += 1) log.tick();
            }

            // Re-save so Canvas recomputes points, and publish if requested.
            const finalized = await engine({
              op: "finalize_quiz", courseId,
              payload: { quizId: record.id, published: !!item.published }
            });
            log.write(
              `    = Quiz finalized: ${finalized.points ?? 0} pts, ` +
              `${finalized.published ? "published" : "unpublished"}`,
              "info"
            );

          } else if (item.type === "subheader") {
            if (moduleId) {
              await engine({
                op: "attach_module_item", courseId,
                payload: {
                  moduleId, itemType: "SubHeader",
                  title: item.title, published: item.published, indent: item.indent
                }
              });
              log.write(`  + Subheader "${item.title}"`, "ok");
            }
            log.tick();
            continue;
          }

          log.tick();

          if (moduleId && record && attachType) {
            await engine({
              op: "attach_module_item", courseId,
              payload: {
                moduleId,
                itemType: attachType,
                title: record.title,
                pageUrl: record.url,
                contentId: record.id,
                published: item.published,
                indent: item.indent
              }
            });
            log.write(`    -> attached to module`, "info");
            log.tick();
          }
        } catch (e) {
          log.write(`  ! ${item.type} "${item.title}" failed: ${e.message}`, "err");
          failures.push(`${item.title}: ${e.message}`);
          log.tick();
        }
      }
    }

    const summary =
      `${created.modules} module(s), ${created.pages} page(s), ` +
      `${created.assignments} assignment(s), ${created.discussions} discussion(s), ` +
      `${created.quizzes} quiz(zes), ${created.questions} question(s)`;

    log.write("", "info");
    log.write(`Done. Created ${summary}.`, failures.length ? "warn" : "ok");

    if (failures.length) {
      log.write(`${failures.length} operation(s) failed — see above.`, "warn");
      log.status(`${failures.length} failed`, "");
    } else {
      log.status("Complete", "");
    }

    $("progressBar").style.width = "100%";
    state.inventory = null; // force a refresh next time Bulk Edit loads
  } catch (e) {
    log.write(`Fatal: ${e.message}`, "err");
    log.status("Failed", "");
  } finally {
    state.busy = false;
    $("generatePlan").disabled = false;
    $("runBuild").disabled = false;
  }
}

// ============================================================
// build flow wiring
// ============================================================

function showPlanError(message, kind = "error") {
  const el = $("planError");
  el.textContent = message;
  el.className = `status-card ${kind}`;
  setHidden(el, false);
}

function showClarify(questions) {
  const el = $("planError");
  el.className = "status-card warn";
  el.innerHTML =
    "<strong>The agent needs more detail:</strong><ul style=\"margin:6px 0 0 16px;padding:0\">" +
    questions.map((q) => `<li>${escapeHtml(q)}</li>`).join("") +
    "</ul>";
  setHidden(el, false);
}

async function generatePlan() {
  if (state.busy) return;

  const prompt = $("buildPrompt").value.trim();
  if (!prompt) {
    showPlanError("Describe what you want built.");
    return;
  }

  setHidden($("planError"), true);
  setHidden($("planReview"), true);
  setHidden($("runPanel"), true);

  state.busy = true;
  const btn = $("generatePlan");
  btn.disabled = true;
  btn.textContent = "Generating…";

  try {
    requireCourse();

    // Inventory powers the duplicate warnings. Non-fatal if it fails.
    if (!state.inventory) {
      try {
        state.inventory = await engine({ op: "inventory", courseId: state.course.courseId });
      } catch {
        /* duplicate checking is a nicety, not a requirement */
      }
    }

    const templateId = $("styleTemplate").value;
    const template = templateId ? TEMPLATES.find((t) => t.id === templateId) : null;

    const message = buildAgentMessage(prompt, {
      template,
      publish: $("publishOnBuild").checked
    });

    const response = await callAgent(message);
    const plan = normalizePlan(
      parseAgentJson(response, "build_plan"),
      $("publishOnBuild").checked
    );

    state.plan = plan;
    state.validation = validatePlan(plan);
    renderPlan();
  } catch (e) {
    if (e instanceof ClarifyRequest) showClarify(e.questions);
    else showPlanError(e.message);
  } finally {
    state.busy = false;
    btn.disabled = false;
    btn.textContent = "Generate build plan";
  }
}

// ============================================================
// source handling
// ============================================================

async function handleFile(file) {
  const el = $("sourceStatus");
  try {
    const source = await readSourceFile(file);
    state.source = source;
    el.textContent = `${source.name} — ${source.content.length.toLocaleString()} characters`;
    el.className = "status-card success";
    setHidden(el, false);
    setHidden($("clearSource"), false);
    renderChatSource();
  } catch (e) {
    state.source = null;
    el.textContent = e.message;
    el.className = "status-card error";
    setHidden(el, false);
    setHidden($("clearSource"), true);
    renderChatSource();
  }
}

function clearSource() {
  state.source = null;
  $("fileInput").value = "";
  $("chatFileInput").value = "";
  setHidden($("sourceStatus"), true);
  setHidden($("clearSource"), true);
  renderChatSource();
}

// ============================================================
// bulk edit
// ============================================================

function allInventoryItems() {
  if (!state.inventory) return [];
  const inv = state.inventory;
  return [...inv.pages, ...inv.assignments, ...inv.discussions, ...inv.quizzes];
}

function itemKey(item) {
  return `${item.kind}:${item.id}`;
}

function activeKinds() {
  return new Set(
    [...$("kindFilters").querySelectorAll("input:checked")].map((i) => i.value)
  );
}

function visibleItems() {
  const term = $("itemFilter").value.trim().toLowerCase();
  const kinds = activeKinds();
  return allInventoryItems().filter(
    (i) => kinds.has(i.kind) && (!term || (i.title || "").toLowerCase().includes(term))
  );
}

function renderInventory() {
  const items = visibleItems();

  $("itemList").innerHTML = items.length
    ? items.map((i) => {
        const key = itemKey(i);
        const meta = i.kind === "assignment" || i.kind === "quiz"
          ? ` <span class="muted">(${i.points ?? 0} pts)</span>` : "";
        return `
          <label class="item-row">
            <input type="checkbox" data-key="${escapeHtml(key)}" ${state.selectedItems.has(key) ? "checked" : ""} />
            <span class="type-tag type-${escapeHtml(i.kind)}">${escapeHtml(i.kind)}</span>
            <span class="item-row-title">${escapeHtml(i.title)}${meta}</span>
          </label>`;
      }).join("")
    : '<div class="item-row"><span class="muted">Nothing matches this filter.</span></div>';

  $("itemList").querySelectorAll("input[type=checkbox]").forEach((cb) => {
    cb.addEventListener("change", () => {
      if (cb.checked) state.selectedItems.add(cb.dataset.key);
      else state.selectedItems.delete(cb.dataset.key);
      updateSelectionCount();
    });
  });

  updateSelectionCount();
}

function updateSelectionCount() {
  $("selectionCount").textContent = `${state.selectedItems.size} selected`;
}

async function loadInventory() {
  const el = $("inventoryStatus");
  try {
    requireCourse();
    el.textContent = "Loading course content…";
    el.className = "status-card muted";
    setHidden(el, false);

    state.inventory = await engine({ op: "inventory", courseId: state.course.courseId });
    state.selectedItems.clear();

    const total = allInventoryItems().length;
    el.textContent = `${total} item(s) found.`;
    el.className = "status-card success";
    setHidden($("inventoryPanel"), false);
    renderInventory();
  } catch (e) {
    el.textContent = e.message;
    el.className = "status-card error";
    setHidden(el, false);
  }
}

function selectedRecords() {
  return allInventoryItems().filter((i) => state.selectedItems.has(itemKey(i)));
}

function showBulkError(message) {
  const el = $("bulkError");
  el.textContent = message;
  setHidden(el, false);
}

async function previewBulk() {
  setHidden($("bulkError"), true);
  setHidden($("bulkRunPanel"), true);

  const op = $("bulkOperation").value;
  const records = selectedRecords();

  if (!records.length) {
    showBulkError("Select at least one item.");
    return;
  }

  try {
    if (op === "assignment_settings") {
      const targets = records.filter((r) => r.kind === "assignment");
      if (!targets.length) {
        showBulkError("Assignment settings only apply to assignments. None are selected.");
        return;
      }

      const settings = {};
      const points = $("setPoints").value.trim();
      if (points !== "") settings.points_possible = Number(points);

      const subs = [...$("submissionTypes").querySelectorAll("input:checked")].map((i) => i.value);
      if (subs.length) settings.submission_types = subs;

      if ($("setGrading").value) settings.grading_type = $("setGrading").value;
      if ($("setPublished").value) settings.published = $("setPublished").value === "true";

      if (!Object.keys(settings).length) {
        showBulkError("Set at least one field to change.");
        return;
      }

      state.pendingBulk = { op, targets, settings };

      const changes = Object.entries(settings)
        .map(([k, v]) => `${k} → ${Array.isArray(v) ? v.join(", ") : v}`)
        .join("<br />");

      $("bulkCounts").textContent = `${targets.length} assignment(s)`;
      $("bulkPreviewBody").innerHTML = `
        <div class="status-card warn">${changes}</div>
        <div class="hint">${targets.map((t) => escapeHtml(t.title)).join(", ")}</div>`;
      setHidden($("bulkPreview"), false);
      return;
    }

    // Full rebuilds receive each item's existing HTML and return one unique
    // replacement per item. Keep the first release deliberately bounded so a
    // large course does not become one oversized, unreviewable agent request.
    if (op === "ai_rebuild") {
      if (records.length > 12) {
        showBulkError("Rebuild up to 12 items at a time so every page can be individually read, redesigned, and reviewed.");
        return;
      }
      const prompt = $("bulkPrompt").value.trim();
      if (!prompt) {
        showBulkError("Describe how these items should be rebuilt.");
        return;
      }

      const templateId = $("bulkTemplate").value;
      const template = templateId ? TEMPLATES.find((item) => item.id === templateId) : null;
      const btn = $("previewBulk");
      btn.disabled = true;
      btn.textContent = "Reading and rebuilding…";
      const htmlByKey = {};
      try {
        for (let index = 0; index < records.length; index += 1) {
          const record = records[index];
          btn.textContent = `Rebuilding ${index + 1} of ${records.length}…`;
          const current = await engine({
            op: "get_item_html", courseId: requireCourse(),
            payload: { kind: record.kind, id: record.id, url: record.url }
          });
          const response = await callAgent(buildAgentMessage(
            `${prompt}\n\n[CURRENT ITEM HTML]\nTitle: ${record.title}\nKind: ${record.kind}\n${current.html}\n[/CURRENT ITEM HTML]`,
            { mode: "item_rebuild", itemSummary: `${record.kind}: ${record.title}`, template }
          ));
          const parsed = parseAgentJson(response, "item_rebuild");
          if (!parsed.html || !stripHtml(parsed.html)) {
            throw new Error(`The agent returned an empty rebuild for "${record.title}".`);
          }
          htmlByKey[itemKey(record)] = parsed.html;
        }
      } finally {
        btn.disabled = false;
        btn.textContent = "Preview change";
      }

      state.pendingBulk = { op: "rebuild", targets: records, htmlByKey, strategy: "replace" };
      $("bulkCounts").textContent = `${records.length} item(s)`;
      $("bulkPreviewBody").innerHTML = `
        <div class="status-card warn">Each selected item will be completely replaced with its own redesigned HTML. Review the samples before applying.</div>
        ${records.map((record) => `<details class="bulk-rebuild-preview"><summary>${escapeHtml(record.kind)}: ${escapeHtml(record.title)}</summary><div class="run-log">${escapeHtml((htmlByKey[itemKey(record)] || "").slice(0, 1200))}${(htmlByKey[itemKey(record)] || "").length > 1200 ? "\n…" : ""}</div></details>`).join("")}`;
      setHidden($("bulkPreview"), false);
      return;
    }

    // Shared HTML operations
    const strategy = $("bulkStrategy").value;
    let html;

    if (op === "manual_html") {
      html = $("manualHtml").value.trim();
      if (!html) {
        showBulkError("Paste the HTML snippet you want inserted.");
        return;
      }
    } else {
      const prompt = $("bulkPrompt").value.trim();
      if (!prompt) {
        showBulkError("Tell the agent what to add or rewrite.");
        return;
      }

      const btn = $("previewBulk");
      btn.disabled = true;
      btn.textContent = "Asking the agent…";
      try {
        const summary = records.map((r) => `${r.kind}: ${r.title}`).join("; ");
        const response = await callAgent(
          buildAgentMessage(prompt, { mode: "bulk_html", itemSummary: summary })
        );
        const parsed = parseAgentJson(response, "bulk_html");
        html = parsed.html;
        if (!html || !stripHtml(html)) {
          showBulkError("The agent returned an empty HTML fragment.");
          return;
        }
      } finally {
        btn.disabled = false;
        btn.textContent = "Preview change";
      }
    }

    state.pendingBulk = { op: "html", targets: records, html, strategy };

    const verb = { prepend: "added to the top of", append: "added to the bottom of", replace: "REPLACING all content in" }[strategy];

    $("bulkCounts").textContent = `${records.length} item(s)`;
    $("bulkPreviewBody").innerHTML = `
      <div class="status-card ${strategy === "replace" ? "error" : "warn"}">
        This will be ${verb} ${records.length} item(s).
        ${strategy === "replace" ? "<br /><strong>Existing content cannot be recovered.</strong>" : ""}
      </div>
      <div class="hint">${records.map((r) => escapeHtml(r.title)).join(", ")}</div>
      <div class="block-label">HTML</div>
      <div class="run-log">${escapeHtml(html.slice(0, 1500))}${html.length > 1500 ? "\n…" : ""}</div>`;
    setHidden($("bulkPreview"), false);
  } catch (e) {
    if (e instanceof ClarifyRequest) {
      showBulkError(
        `The agent needs more detail: ${e.questions.join(" ") || "be more specific."}`
      );
    } else {
      showBulkError(e.message);
    }
  }
}

async function runBulk() {
  if (state.busy || !state.pendingBulk) return;

  const courseId = state.course.courseId;
  const job = state.pendingBulk;

  state.busy = true;
  $("runBulk").disabled = true;
  $("bulkRunLog").innerHTML = "";
  setHidden($("bulkRunPanel"), false);

  const log = makeLogger($("bulkRunLog"), $("bulkProgressBar"), $("bulkRunStatus"));
  log.setTotal(job.targets.length);
  log.status("Running", "");

  let ok = 0;
  let failed = 0;

  for (const target of job.targets) {
    try {
      if (job.op === "assignment_settings") {
        const rec = await engine({
          op: "update_assignment_settings", courseId,
          payload: { id: target.id, ...job.settings }
        });
        log.write(`= ${rec.title}: ${rec.points} pts, ${(rec.submission_types || []).join(", ")}`, "ok");
      } else {
        let html = job.op === "rebuild" ? job.htmlByKey[itemKey(target)] : job.html;

        if (job.strategy !== "replace") {
          const current = await engine({
            op: "get_item_html", courseId,
            payload: { kind: target.kind, id: target.id, url: target.url }
          });
          html = job.strategy === "prepend"
            ? `${job.html}\n${current.html}`
            : `${current.html}\n${job.html}`;
        }

        const rec = await engine({
          op: "update_item_html", courseId,
          payload: { kind: target.kind, id: target.id, url: target.url, html }
        });
        log.write(`= ${rec.kind} "${rec.title}" updated`, "ok");
      }
      ok += 1;
    } catch (e) {
      log.write(`! ${target.kind} "${target.title}" failed: ${e.message}`, "err");
      failed += 1;
    }
    log.tick();
  }

  log.write("", "info");
  log.write(`Done. ${ok} updated, ${failed} failed.`, failed ? "warn" : "ok");
  log.status(failed ? `${failed} failed` : "Complete", "");
  $("bulkProgressBar").style.width = "100%";

  state.busy = false;
  $("runBulk").disabled = false;
  setHidden($("bulkPreview"), true);
  state.pendingBulk = null;
}

function syncBulkOperationUI() {
  const op = $("bulkOperation").value;
  const rebuilding = op === "ai_rebuild";
  setHidden($("opHtml"), op === "assignment_settings");
  setHidden($("opSettings"), op !== "assignment_settings");
  setHidden($("bulkStrategyWrap"), rebuilding);
  setHidden($("bulkTemplateWrap"), !rebuilding);
  setHidden($("aiHtmlWrap"), op !== "ai_html" && !rebuilding);
  setHidden($("manualHtmlWrap"), op !== "manual_html");
  if (rebuilding) {
    $("bulkPromptLabel").textContent = "How should each item be rebuilt?";
    $("bulkPrompt").placeholder = "e.g. Rebuild each page as a student-friendly Wilson lesson page. Preserve verified course content, use the selected template's visual system, and replace outdated layout.";
  } else {
    $("bulkPromptLabel").textContent = "Instruction to the agent";
    $("bulkPrompt").placeholder = "e.g. Add a standardized 'Getting Help' banner with office hours and the tutoring link.";
  }
}

// ============================================================
// templates
// ============================================================

function populateTemplateSelect() {
  const select = $("styleTemplate");
  const byCategory = {};
  TEMPLATES.forEach((t) => {
    (byCategory[t.category] ||= []).push(t);
  });

  Object.entries(byCategory).forEach(([category, list]) => {
    const group = document.createElement("optgroup");
    group.label = category;
    list.forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = t.name;
      group.appendChild(opt);
    });
    select.appendChild(group);
  });
}

function populateBulkTemplateSelect() {
  const select = $("bulkTemplate");
  const byCategory = {};
  TEMPLATES.forEach((template) => {
    (byCategory[template.category] ||= []).push(template);
  });
  Object.entries(byCategory).forEach(([category, templates]) => {
    const group = document.createElement("optgroup");
    group.label = category;
    templates.forEach((template) => {
      const option = document.createElement("option");
      option.value = template.id;
      option.textContent = template.name;
      group.appendChild(option);
    });
    select.appendChild(group);
  });
}

function renderTemplates() {
  const term = $("templateSearch").value.trim().toLowerCase();
  const list = TEMPLATES.filter(
    (t) =>
      !term ||
      t.name.toLowerCase().includes(term) ||
      (t.desc || "").toLowerCase().includes(term) ||
      (t.tags || []).some((tag) => tag.toLowerCase().includes(term))
  );

  const target = $("templateList");
  target.innerHTML = list.length
    ? list.map((t) => `
        <article class="template-card">
          <iframe class="template-preview" data-template-preview="${escapeHtml(t.id)}" sandbox="" title="Preview: ${escapeHtml(t.name)}"></iframe>
          <div class="template-card-body">
            <h3>${escapeHtml(t.name)}</h3>
            <div class="desc">${escapeHtml(t.desc || "")}</div>
            <div class="template-card-footer">
              <span class="cat">${escapeHtml(t.category)}</span>
              <button class="btn btn-primary btn-small" data-use-template="${escapeHtml(t.id)}">Use in Build</button>
            </div>
          </div>
        </article>`).join("")
    : '<div class="status-card muted">No templates match that search.</div>';

  target.querySelectorAll("[data-template-preview]").forEach((frame) => {
    const template = TEMPLATES.find((item) => item.id === frame.dataset.templatePreview);
    if (!template) return;
    frame.srcdoc = `<!doctype html><html><head><base target="_blank"><style>html{background:#fff}body{margin:0;padding:12px;zoom:.52;width:192%;overflow:hidden}</style></head><body>${template.html}</body></html>`;
  });
  target.querySelectorAll("[data-use-template]").forEach((button) => {
    button.addEventListener("click", () => {
      $("styleTemplate").value = button.dataset.useTemplate;
      switchView("build");
      $("buildPrompt").focus();
    });
  });
}

// ============================================================
// diagnostics
// ============================================================

async function testAgent() {
  const el = $("diagnostics");
  setHidden(el, false);
  el.textContent = "Calling the agent pipeline…\n";

  try {
    // Goes through buildAgentMessage so the test exercises the same contract
    // the real requests send. Testing a bare prompt would prove nothing.
    const response = await callAgent(
      buildAgentMessage(
        "Reply with a minimal build_plan containing one module named 'Connection Test' and no items."
      )
    );
    el.textContent += `\nRaw response (first 800 chars):\n${response.slice(0, 800)}\n`;

    try {
      parseAgentJson(response, "build_plan");
      el.textContent += "\nPASS: a valid build_plan was returned.";
    } catch (e) {
      el.textContent += `\nFAIL at parse: ${e.message}`;
      el.textContent +=
        "\n\nThe pipeline is reachable and the schema contract was sent with this " +
        "request, so the model is overriding or ignoring it. Check whether the " +
        "pipeline has its own system prompt (likely the RCE editor's) that conflicts.";
    }
  } catch (e) {
    el.textContent += `\nFAIL at request: ${e.message}`;
  }
}

async function testCanvas() {
  const el = $("diagnostics");
  setHidden(el, false);
  el.textContent = "Testing Canvas access…\n";

  try {
    const detected = await engine({ op: "detect" });
    el.textContent += `\nCanvas page: ${detected.isCanvas ? "yes" : "no"}`;
    el.textContent += `\nOrigin: ${detected.origin}`;
    el.textContent += `\nCourse ID: ${detected.courseId || "none"}`;
    el.textContent += `\nCourse name: ${detected.courseName || "unknown"}`;
    el.textContent += `\nCan manage content: ${detected.canManage ? "yes" : "unknown"}`;

    if (!detected.courseId) {
      el.textContent += "\n\nFAIL: open a course page first.";
      return;
    }

    const inv = await engine({ op: "inventory", courseId: detected.courseId });
    el.textContent +=
      `\n\nPASS: read ${inv.modules.length} module(s), ${inv.pages.length} page(s), ` +
      `${inv.assignments.length} assignment(s), ${inv.discussions.length} discussion(s), ` +
      `${inv.quizzes.length} quiz(zes).`;
    el.textContent += "\nSession authentication and CSRF are working.";
  } catch (e) {
    el.textContent += `\nFAIL: ${e.message}`;
  }
}

// ============================================================
// init
// ============================================================

function switchView(name) {
  document.querySelectorAll(".tab").forEach((t) =>
    t.classList.toggle("active", t.dataset.view === name));
  document.querySelectorAll(".view").forEach((v) =>
    v.classList.toggle("active", v.id === `view-${name}`));
}

function init() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => switchView(tab.dataset.view));
  });

  $("refreshCourse").addEventListener("click", detectCourse);
  $("acceptDataNotice").addEventListener("click", acceptDataNotice);
  $("closeDataNotice").addEventListener("click", () => setHidden($("dataNotice"), true));

  // Chat home
  $("sendChat").addEventListener("click", sendChat);
  $("chatAttachSource").addEventListener("click", () => $("chatFileInput").click());
  $("chatFileInput").addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (file) handleFile(file);
  });
  $("chatClearSource").addEventListener("click", clearSource);
  $("chatCreatePlan").addEventListener("click", createPlanFromChat);
  $("chatPrompt").addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      sendChat();
    }
  });
  document.querySelectorAll(".chat-starter").forEach((button) => {
    button.addEventListener("click", () => {
      $("chatPrompt").value = button.dataset.chatStarter || "";
      $("chatPrompt").focus();
    });
  });

  // Build
  const dropZone = $("dropZone");
  dropZone.addEventListener("click", () => $("fileInput").click());
  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragging");
  });
  dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragging"));
  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragging");
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  });
  $("fileInput").addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  });
  $("clearSource").addEventListener("click", clearSource);

  $("generatePlan").addEventListener("click", generatePlan);
  $("runBuild").addEventListener("click", runBuild);
  $("discardPlan").addEventListener("click", () => {
    state.plan = null;
    setHidden($("planReview"), true);
    setHidden($("runPanel"), true);
  });
  $("copyLog").addEventListener("click", () => {
    navigator.clipboard.writeText($("runLog").textContent || "");
  });

  // Assessment Studio
  const assessmentDropZone = $("assessmentDropZone");
  assessmentDropZone.addEventListener("click", () => $("assessmentFileInput").click());
  assessmentDropZone.addEventListener("dragover", (e) => {
    e.preventDefault(); assessmentDropZone.classList.add("dragging");
  });
  assessmentDropZone.addEventListener("dragleave", () => assessmentDropZone.classList.remove("dragging"));
  assessmentDropZone.addEventListener("drop", (e) => {
    e.preventDefault(); assessmentDropZone.classList.remove("dragging");
    const file = e.dataTransfer?.files?.[0]; if (file) handleAssessmentFile(file);
  });
  $("assessmentFileInput").addEventListener("change", (e) => {
    const file = e.target.files?.[0]; if (file) handleAssessmentFile(file);
  });
  $("clearAssessmentSource").addEventListener("click", clearAssessmentSource);
  $("generateAssessmentPlan").addEventListener("click", generateAssessmentPlan);
  $("runAssessmentBatch").addEventListener("click", runAssessmentBatch);
  $("discardAssessmentPlan").addEventListener("click", () => {
    state.assessmentPlan = null; setHidden($("assessmentReview"), true); setHidden($("assessmentRunPanel"), true);
  });
  $("copyAssessmentLog").addEventListener("click", () => navigator.clipboard.writeText($("assessmentRunLog").textContent || ""));

  // Bulk
  $("loadInventory").addEventListener("click", loadInventory);
  $("itemFilter").addEventListener("input", renderInventory);
  $("kindFilters").addEventListener("change", renderInventory);
  $("selectAll").addEventListener("click", () => {
    visibleItems().forEach((i) => state.selectedItems.add(itemKey(i)));
    renderInventory();
  });
  $("selectNone").addEventListener("click", () => {
    state.selectedItems.clear();
    renderInventory();
  });
  $("bulkOperation").addEventListener("change", syncBulkOperationUI);
  $("previewBulk").addEventListener("click", previewBulk);
  $("runBulk").addEventListener("click", runBulk);
  $("discardBulk").addEventListener("click", () => {
    state.pendingBulk = null;
    setHidden($("bulkPreview"), true);
  });

  // Templates
  $("templateSearch").addEventListener("input", renderTemplates);

  // Settings
  $("saveSettings").addEventListener("click", saveSettings);
  $("reviewDataNotice").addEventListener("click", () => setHidden($("dataNotice"), false));
  $("testAgent").addEventListener("click", testAgent);
  $("testCanvas").addEventListener("click", testCanvas);

  populateTemplateSelect();
  populateBulkTemplateSelect();
  renderTemplates();
  syncBulkOperationUI();
  hydrateSettingsForm();
  hydrateDataNotice();
  renderChatSource();
  detectCourse();

  chrome.tabs.onActivated.addListener(detectCourse);
  chrome.tabs.onUpdated.addListener((tabId, info) => {
    if (info.status === "complete") detectCourse();
  });
}

document.addEventListener("DOMContentLoaded", init);
