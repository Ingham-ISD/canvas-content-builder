// --- Canvas Bulk Builder: injected execution engine ---
//
// IMPORTANT CONSTRAINT: this entire function is serialized by
// chrome.scripting.executeScript and re-parsed inside the Canvas page.
// It therefore CANNOT reference anything in this file's outer scope.
// Every helper it needs must be declared inside its own body.
//
// It runs in the MAIN world of the user's Canvas tab, so `fetch` carries the
// teacher's session cookies. No API token is stored anywhere.
//
// One call performs ONE atomic operation. The panel orchestrates the sequence
// so it can render a live run log and resume a partial build.

async function canvasEngine(job) {
  const { op, courseId, payload } = job;

  // ---------- CSRF ----------
  function getCsrfToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    if (meta?.getAttribute("content")) return meta.getAttribute("content");
    if (window.ENV?.csrf_token) return window.ENV.csrf_token;
    if (window.ENV?.CSRF_TOKEN) return window.ENV.CSRF_TOKEN;
    // Canvas also drops the token in a cookie on most deployments.
    const cookie = document.cookie
      .split("; ")
      .find((c) => c.startsWith("_csrf_token="));
    if (cookie) {
      try {
        return decodeURIComponent(cookie.split("=")[1]);
      } catch {
        return "";
      }
    }
    return "";
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // ---------- form encoding ----------
  // Arrays of scalars  -> key[]=a&key[]=b            (Canvas' preferred shape)
  // Arrays of objects  -> key[0][field]=...          (needed for quiz answers)
  function encodePairs(params, prefix, value) {
    if (value === undefined || value === null) return;

    if (Array.isArray(value)) {
      const allScalar = value.every(
        (v) => v === null || typeof v !== "object"
      );
      if (allScalar) {
        value.forEach((v) => {
          if (v !== null && v !== undefined) params.append(`${prefix}[]`, String(v));
        });
      } else {
        value.forEach((v, i) => encodePairs(params, `${prefix}[${i}]`, v));
      }
      return;
    }

    if (typeof value === "object") {
      Object.entries(value).forEach(([k, v]) =>
        encodePairs(params, `${prefix}[${k}]`, v)
      );
      return;
    }

    params.append(prefix, String(value));
  }

  function toForm(obj) {
    const params = new URLSearchParams();
    Object.entries(obj || {}).forEach(([k, v]) => encodePairs(params, k, v));
    return params.toString();
  }

  // ---------- request core with rate-limit backoff ----------
  const MAX_RETRIES = 4;

  async function request(method, path, bodyObj) {
    const csrf = getCsrfToken();
    let attempt = 0;

    while (true) {
      const init = {
        method,
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          ...(csrf ? { "X-CSRF-Token": csrf } : {})
        }
      };

      if (bodyObj !== undefined) {
        init.headers["Content-Type"] =
          "application/x-www-form-urlencoded; charset=UTF-8";
        init.body = toForm(bodyObj);
      }

      const response = await fetch(path, init);

      if (response.ok) {
        const text = await response.text();
        // Canvas prefixes some JSON responses with the XSSI guard.
        const cleaned = text.replace(/^while\(1\);\s*/, "");
        return {
          data: cleaned ? JSON.parse(cleaned) : null,
          link: response.headers.get("Link") || ""
        };
      }

      const errText = await response.text();
      const isRateLimit =
        response.status === 403 && /rate limit/i.test(errText);

      if (isRateLimit && attempt < MAX_RETRIES) {
        attempt += 1;
        await sleep(1000 * Math.pow(2, attempt)); // 2s, 4s, 8s, 16s
        continue;
      }

      const err = new Error(
        `${method} ${path} -> ${response.status}: ${errText.slice(0, 400)}`
      );
      err.status = response.status;
      err.rateLimited = isRateLimit;
      throw err;
    }
  }

  const get = (path) => request("GET", path).then((r) => r.data);
  const post = (path, body) => request("POST", path, body).then((r) => r.data);
  const put = (path, body) => request("PUT", path, body).then((r) => r.data);

  // ---------- Link-header pagination ----------
  async function getAll(path) {
    let url = path;
    const out = [];

    while (url) {
      const { data, link } = await request("GET", url);
      if (Array.isArray(data)) out.push(...data);
      else if (data) out.push(data);

      const next = link
        .split(",")
        .map((s) => s.trim())
        .find((s) => /rel="next"/.test(s));

      if (!next) break;
      const match = next.match(/<([^>]+)>/);
      if (!match) break;

      // Keep it same-origin relative so cookies always apply.
      try {
        const parsed = new URL(match[1], window.location.origin);
        if (parsed.origin !== window.location.origin) break;
        url = parsed.pathname + parsed.search;
      } catch {
        break;
      }

      await sleep(120); // be polite to the leaky bucket
    }

    return out;
  }

  const base = `/api/v1/courses/${courseId}`;

  // ---------- operations ----------
  switch (op) {
    case "detect": {
      const path = window.location.pathname || "";
      const match = path.match(/\/courses\/(\d+)/);
      const id = match?.[1] || window.ENV?.COURSE_ID || null;

      return {
        ok: true,
        origin: window.location.origin,
        href: window.location.href,
        courseId: id,
        courseName:
          window.ENV?.COURSE_TITLE ||
          window.ENV?.course?.name ||
          document.querySelector(".ic-app-course-menu__header")?.textContent?.trim() ||
          document.querySelector("h1")?.textContent?.trim() ||
          "",
        // Presence of window.ENV is the reliable Canvas signal — not the hostname.
        // Vanity domains (canvas.district.edu) are extremely common.
        isCanvas: typeof window.ENV === "object" && window.ENV !== null,
        userId: window.ENV?.current_user_id || null,
        canManage: !!(
          window.ENV?.PERMISSIONS?.manage_content ||
          window.ENV?.PERMISSIONS?.manage_course_content_edit ||
          window.ENV?.current_user_is_admin ||
          window.ENV?.current_user_roles?.includes("teacher")
        )
      };
    }

    case "inventory": {
      const [modules, pages, assignments, discussions, quizzes] =
        await Promise.all([
          getAll(`${base}/modules?per_page=100`),
          getAll(`${base}/pages?per_page=100`),
          getAll(`${base}/assignments?per_page=100`),
          getAll(`${base}/discussion_topics?per_page=100`),
          getAll(`${base}/quizzes?per_page=100`)
        ]);

      return {
        modules: modules.map((m) => ({ id: m.id, name: m.name })),
        pages: pages.map((p) => ({
          id: p.page_id,
          url: p.url,
          title: p.title,
          kind: "page"
        })),
        // Canvas surfaces quizzes and graded discussions in /assignments too.
        // Filter to real assignments so the bulk-update list isn't duplicated.
        assignments: assignments
          .filter(
            (a) =>
              !a.quiz_id &&
              !(a.submission_types || []).includes("discussion_topic") &&
              !(a.submission_types || []).includes("online_quiz")
          )
          .map((a) => ({
            id: a.id,
            title: a.name,
            kind: "assignment",
            points: a.points_possible
          })),
        discussions: discussions.map((d) => ({
          id: d.id,
          title: d.title,
          kind: "discussion"
        })),
        quizzes: quizzes.map((q) => ({
          id: q.id,
          title: q.title,
          kind: "quiz",
          points: q.points_possible
        }))
      };
    }

    case "create_module": {
      const rec = await post(`${base}/modules`, {
        module: {
          name: payload.name,
          published: !!payload.published
        }
      });
      return { id: rec.id, name: rec.name };
    }

    case "create_page": {
      const rec = await post(`${base}/pages`, {
        wiki_page: {
          title: payload.title,
          body: payload.html || "",
          published: !!payload.published,
          editing_roles: payload.editing_roles || "teachers"
        }
      });
      return { id: rec.page_id, url: rec.url, title: rec.title, kind: "page" };
    }

    case "create_assignment": {
      const a = {
        name: payload.title,
        description: payload.html || payload.description_html || "",
        published: !!payload.published,
        points_possible:
          payload.points_possible === undefined ? 0 : payload.points_possible,
        grading_type: payload.grading_type || "points",
        submission_types: payload.submission_types?.length
          ? payload.submission_types
          : ["online_text_entry"]
      };

      if (payload.due_at) a.due_at = payload.due_at;
      if (payload.unlock_at) a.unlock_at = payload.unlock_at;
      if (payload.lock_at) a.lock_at = payload.lock_at;
      if (payload.allowed_extensions?.length)
        a.allowed_extensions = payload.allowed_extensions;
      if (payload.assignment_group_id)
        a.assignment_group_id = payload.assignment_group_id;
      if (payload.omit_from_final_grade !== undefined)
        a.omit_from_final_grade = !!payload.omit_from_final_grade;
      if (payload.allowed_attempts !== undefined)
        a.allowed_attempts = payload.allowed_attempts;
      if (payload.peer_reviews !== undefined)
        a.peer_reviews = !!payload.peer_reviews;

      const rec = await post(`${base}/assignments`, { assignment: a });
      return {
        id: rec.id,
        title: rec.name,
        kind: "assignment",
        points: rec.points_possible
      };
    }

    case "create_discussion": {
      const body = {
        title: payload.title,
        message: payload.html || "",
        published: !!payload.published,
        discussion_type: payload.threaded === false ? "side_comment" : "threaded"
      };

      if (payload.require_initial_post !== undefined)
        body.require_initial_post = !!payload.require_initial_post;

      // A discussion becomes graded only when an assignment block is attached.
      if (payload.graded) {
        body.assignment = {
          points_possible:
            payload.points_possible === undefined ? 0 : payload.points_possible,
          grading_type: payload.grading_type || "points"
        };
        if (payload.due_at) body.assignment.due_at = payload.due_at;
      }

      const rec = await post(`${base}/discussion_topics`, body);
      return { id: rec.id, title: rec.title, kind: "discussion" };
    }

    case "create_quiz": {
      // Always created unpublished. Canvas will not reliably accept new
      // questions into an already-published quiz, so publishing is a
      // separate step after all questions land.
      const q = {
        title: payload.title,
        description: payload.html || payload.description_html || "",
        quiz_type: payload.quiz_type || "assignment",
        published: false,
        shuffle_answers: !!payload.shuffle_answers,
        allowed_attempts:
          payload.allowed_attempts === undefined ? 1 : payload.allowed_attempts,
        scoring_policy: payload.scoring_policy || "keep_highest",
        one_question_at_a_time: !!payload.one_question_at_a_time
      };

      if (payload.time_limit) q.time_limit = payload.time_limit;
      if (payload.due_at) q.due_at = payload.due_at;
      if (payload.assignment_group_id)
        q.assignment_group_id = payload.assignment_group_id;
      if (payload.hide_results) q.hide_results = payload.hide_results;

      const rec = await post(`${base}/quizzes`, { quiz: q });
      return { id: rec.id, title: rec.title, kind: "quiz" };
    }

    case "add_quiz_questions": {
      const created = [];
      const failed = [];

      for (let i = 0; i < payload.questions.length; i += 1) {
        const src = payload.questions[i];
        const question = {
          question_name: src.question_name || `Question ${i + 1}`,
          question_text: src.question_text || "",
          question_type: src.question_type || "multiple_choice_question",
          points_possible:
            src.points_possible === undefined ? 1 : src.points_possible,
          position: i + 1
        };

        if (src.correct_comments) question.correct_comments = src.correct_comments;
        if (src.incorrect_comments)
          question.incorrect_comments = src.incorrect_comments;
        if (src.neutral_comments) question.neutral_comments = src.neutral_comments;

        // Essay and file-upload questions carry no answer set.
        const needsAnswers = ![
          "essay_question",
          "file_upload_question",
          "text_only_question"
        ].includes(question.question_type);

        if (needsAnswers && Array.isArray(src.answers)) {
          question.answers = src.answers.map((ans) => {
            const a = {
              answer_text: ans.answer_text ?? "",
              answer_weight: ans.answer_weight ? 100 : 0
            };
            if (ans.answer_comments) a.answer_comments = ans.answer_comments;
            if (ans.answer_match_left) a.answer_match_left = ans.answer_match_left;
            if (ans.answer_match_right)
              a.answer_match_right = ans.answer_match_right;
            return a;
          });
        }

        try {
          const rec = await post(
            `${base}/quizzes/${payload.quizId}/questions`,
            { question }
          );
          created.push({ id: rec.id, name: rec.question_name });
        } catch (e) {
          failed.push({ index: i + 1, name: question.question_name, error: e.message });
        }

        await sleep(90); // pace the leaky bucket on long question sets
      }

      return { created, failed };
    }

    case "finalize_quiz": {
      // Re-saving the quiz forces Canvas to recompute points_possible from the
      // question set. Publishing is applied here if the plan asked for it.
      const body = { quiz: { published: !!payload.published } };
      if (payload.notify_of_update !== undefined)
        body.quiz.notify_of_update = !!payload.notify_of_update;

      const rec = await put(`${base}/quizzes/${payload.quizId}`, body);
      return {
        id: rec.id,
        title: rec.title,
        points: rec.points_possible,
        published: rec.published
      };
    }

    case "attach_module_item": {
      const item = {
        title: payload.title,
        type: payload.itemType, // Page | Assignment | Discussion | Quiz | SubHeader
        published: !!payload.published
      };

      if (payload.itemType === "Page") item.page_url = payload.pageUrl;
      else if (payload.contentId !== undefined) item.content_id = payload.contentId;

      if (payload.indent) item.indent = payload.indent;

      const rec = await post(
        `${base}/modules/${payload.moduleId}/items`,
        { module_item: item }
      );
      return { id: rec.id, title: rec.title };
    }

    case "get_item_html": {
      const { kind, id, url } = payload;
      if (kind === "page") {
        const rec = await get(`${base}/pages/${encodeURIComponent(url || id)}`);
        return { html: rec.body || "", title: rec.title };
      }
      if (kind === "assignment") {
        const rec = await get(`${base}/assignments/${id}`);
        return { html: rec.description || "", title: rec.name };
      }
      if (kind === "discussion") {
        const rec = await get(`${base}/discussion_topics/${id}`);
        return { html: rec.message || "", title: rec.title };
      }
      if (kind === "quiz") {
        const rec = await get(`${base}/quizzes/${id}`);
        return { html: rec.description || "", title: rec.title };
      }
      throw new Error(`Unsupported item kind: ${kind}`);
    }

    case "update_item_html": {
      const { kind, id, url, html } = payload;

      if (kind === "page") {
        const rec = await put(`${base}/pages/${encodeURIComponent(url || id)}`, {
          wiki_page: { body: html }
        });
        return { id: rec.page_id, title: rec.title, kind };
      }
      if (kind === "assignment") {
        const rec = await put(`${base}/assignments/${id}`, {
          assignment: { description: html }
        });
        return { id: rec.id, title: rec.name, kind };
      }
      if (kind === "discussion") {
        const rec = await put(`${base}/discussion_topics/${id}`, {
          message: html
        });
        return { id: rec.id, title: rec.title, kind };
      }
      if (kind === "quiz") {
        const rec = await put(`${base}/quizzes/${id}`, {
          quiz: { description: html }
        });
        return { id: rec.id, title: rec.title, kind };
      }
      throw new Error(`Unsupported item kind: ${kind}`);
    }

    case "update_assignment_settings": {
      const a = {};
      if (payload.points_possible !== undefined)
        a.points_possible = payload.points_possible;
      if (payload.submission_types?.length)
        a.submission_types = payload.submission_types;
      if (payload.grading_type) a.grading_type = payload.grading_type;
      if (payload.due_at !== undefined) a.due_at = payload.due_at;
      if (payload.published !== undefined) a.published = !!payload.published;
      if (payload.allowed_extensions?.length)
        a.allowed_extensions = payload.allowed_extensions;
      if (payload.omit_from_final_grade !== undefined)
        a.omit_from_final_grade = !!payload.omit_from_final_grade;

      const rec = await put(`${base}/assignments/${payload.id}`, {
        assignment: a
      });
      return {
        id: rec.id,
        title: rec.name,
        points: rec.points_possible,
        submission_types: rec.submission_types
      };
    }

    default:
      throw new Error(`Unknown engine op: ${op}`);
  }
}
