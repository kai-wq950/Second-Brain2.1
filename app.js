const subjectList = document.getElementById("subject-list");
const signalsRoot = document.getElementById("signals");
const themeToggle = document.getElementById("toggle-theme");
const shuffleButton = document.getElementById("shuffle");
const summaryChip = document.getElementById("summary-chip");
const metricAvg = document.getElementById("metric-avg");
const metricStable = document.getElementById("metric-stable");
const metricVolatile = document.getElementById("metric-volatile");
const swatches = document.querySelectorAll(".swatch");
const filterSearch = document.getElementById("filter-search");
const filterMin = document.getElementById("filter-min");
const filterTrend = document.getElementById("filter-trend");
const manageToggle = document.getElementById("manage-mode");
const subjectForm = document.getElementById("subject-form");

const makeId = () =>
  (typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`);

const today = () => new Date().toISOString().slice(0, 10);

let editMode = false;

let subjects = [
  {
    id: makeId(),
    name: "Mathematics",
    confidence: 4,
    trend: "rising",
    focus: "calculus timing & error trimming",
    tag: "steady",
    updatedAt: today(),
    topics: [
      {
        id: makeId(),
        title: "Calculus",
        confidence: 4,
        updatedAt: today(),
        subtopics: [
          { id: makeId(), title: "limits", confidence: 4, updatedAt: today() },
          { id: makeId(), title: "integration by parts", confidence: 3, updatedAt: today() },
          { id: makeId(), title: "series", confidence: 3, updatedAt: today() },
        ],
      },
      {
        id: makeId(),
        title: "Probability",
        confidence: 3,
        updatedAt: today(),
        subtopics: [
          { id: makeId(), title: "binomial", confidence: 3, updatedAt: today() },
          { id: makeId(), title: "normal", confidence: 2, updatedAt: today() },
          { id: makeId(), title: "combinatorics drills", confidence: 3, updatedAt: today() },
        ],
      },
    ],
  },
  {
    id: makeId(),
    name: "Further Maths",
    confidence: 3,
    trend: "rising",
    focus: "complex numbers & matrices",
    tag: "building",
    updatedAt: today(),
    topics: [
      {
        id: makeId(),
        title: "Matrices",
        confidence: 3,
        updatedAt: today(),
        subtopics: [
          { id: makeId(), title: "row reduction", confidence: 3, updatedAt: today() },
          { id: makeId(), title: "inverse proofs", confidence: 2, updatedAt: today() },
        ],
      },
      {
        id: makeId(),
        title: "Complex",
        confidence: 3,
        updatedAt: today(),
        subtopics: [
          { id: makeId(), title: "arg diagrams", confidence: 2, updatedAt: today() },
          { id: makeId(), title: "De Moivre", confidence: 3, updatedAt: today() },
        ],
      },
    ],
  },
  {
    id: makeId(),
    name: "Physics",
    confidence: 3,
    trend: "steady",
    focus: "multi-mark reasoning & graphs",
    tag: "hold",
    updatedAt: today(),
    topics: [
      {
        id: makeId(),
        title: "Mechanics",
        confidence: 3,
        updatedAt: today(),
        subtopics: [
          { id: makeId(), title: "projectiles", confidence: 3, updatedAt: today() },
          { id: makeId(), title: "moments", confidence: 3, updatedAt: today() },
          { id: makeId(), title: "power", confidence: 2, updatedAt: today() },
        ],
      },
      {
        id: makeId(),
        title: "Fields",
        confidence: 3,
        updatedAt: today(),
        subtopics: [
          { id: makeId(), title: "electric", confidence: 2, updatedAt: today() },
          { id: makeId(), title: "gravitational", confidence: 3, updatedAt: today() },
        ],
      },
    ],
  },
  {
    id: makeId(),
    name: "Computer Science",
    confidence: 2,
    trend: "volatile",
    focus: "time complexity & trace logic",
    tag: "watch",
    updatedAt: today(),
    topics: [
      {
        id: makeId(),
        title: "Algorithms",
        confidence: 2,
        updatedAt: today(),
        subtopics: [
          { id: makeId(), title: "dfs/bfs", confidence: 2, updatedAt: today() },
          { id: makeId(), title: "sorting", confidence: 2, updatedAt: today() },
          { id: makeId(), title: "complexity", confidence: 2, updatedAt: today() },
        ],
      },
      {
        id: makeId(),
        title: "OOP",
        confidence: 2,
        updatedAt: today(),
        subtopics: [
          { id: makeId(), title: "design patterns", confidence: 2, updatedAt: today() },
          { id: makeId(), title: "encapsulation", confidence: 2, updatedAt: today() },
        ],
      },
    ],
  },
  {
    id: makeId(),
    name: "English",
    confidence: 4,
    trend: "steady",
    focus: "thesis clarity & concise edits",
    tag: "calm",
    updatedAt: today(),
    topics: [
      {
        id: makeId(),
        title: "Analysis",
        confidence: 4,
        updatedAt: today(),
        subtopics: [
          { id: makeId(), title: "theme tracing", confidence: 4, updatedAt: today() },
          { id: makeId(), title: "quote selection", confidence: 4, updatedAt: today() },
        ],
      },
      {
        id: makeId(),
        title: "Practice",
        confidence: 4,
        updatedAt: today(),
        subtopics: [
          { id: makeId(), title: "timed essays", confidence: 4, updatedAt: today() },
          { id: makeId(), title: "structure", confidence: 4, updatedAt: today() },
        ],
      },
    ],
  },
];

const trendCopy = {
  rising: { label: "rising", emoji: "▴", className: "status--up" },
  steady: { label: "steady", emoji: "•", className: "status--steady" },
  volatile: { label: "volatile", emoji: "◦", className: "status--alert" },
};

const tagCopy = {
  steady: "solid",
  building: "warming up",
  hold: "hold line",
  watch: "needs focus",
  calm: "quiet",
};

function dotMeter(value) {
  const dots = Array.from({ length: 5 }, (_, i) => {
    const active = i < value ? "dot dot--on" : "dot";
    return `<span class="${active}"></span>`;
  }).join("");

  return `<div class="meter" aria-label="confidence ${value} of 5">${dots}</div>`;
}

function syncSliderLabel(target) {
  const wrapper = target.closest(".slider");
  const label = wrapper?.querySelector(".slider__value");
  if (label) {
    label.textContent = `${target.value}/5`;
  }
}

function topicList(topics, subjectId) {
  if (!topics?.length) {
    return `<div class="topic topic--empty">No topics yet. Add one below.</div>`;
  }

  return topics
    .map(
      (topic) => `
      <div class="topic" data-subject="${subjectId}" data-topic-id="${topic.id}">
        <div class="topic__header">
          <div>
            <p class="micro__label">topic</p>
            <input class="inline-input topic-title" value="${topic.title}" data-subject="${subjectId}" data-topic-id="${topic.id}" ${editMode ? "" : "readonly"} />
          </div>
          <div class="topic__actions manage-only">
            <button class="ghost icon delete-topic" data-subject="${subjectId}" data-topic-id="${topic.id}" aria-label="Delete topic">✕</button>
          </div>
        </div>
        <div class="topic__meta">
          <div class="control">
            ${dotMeter(topic.confidence)}
            <label class="slider">
              <input type="range" min="1" max="5" step="1" value="${topic.confidence}" class="confidence-slider" data-scope="topic" data-topic-id="${topic.id}" data-subject="${subjectId}" aria-label="${topic.title} confidence" />
              <span class="slider__value">${topic.confidence}/5</span>
            </label>
            <div class="date-control">
              <label class="micro__label">updated</label>
              <input type="date" class="date-input" data-scope="topic" data-topic-id="${topic.id}" data-subject="${subjectId}" value="${topic.updatedAt || today()}" />
            </div>
          </div>
        </div>
        <div class="topic__subs">
          ${
            topic.subtopics.length
              ? topic.subtopics
                  .map(
                    (sub) => `
                    <div class="subtopic" data-subtopic-id="${sub.id}" data-topic-id="${topic.id}" data-subject="${subjectId}">
                      <input class="inline-input subtopic-title" value="${sub.title}" data-subtopic-id="${sub.id}" data-topic-id="${topic.id}" data-subject="${subjectId}" ${editMode ? "" : "readonly"} />
                      <div class="subtopic__controls">
                        <label class="slider slider--mini">
                          <input type="range" min="1" max="5" step="1" value="${sub.confidence}" class="confidence-slider" data-scope="subtopic" data-subtopic-id="${sub.id}" data-topic-id="${topic.id}" data-subject="${subjectId}" aria-label="${sub.title} confidence" />
                          <span class="slider__value">${sub.confidence}/5</span>
                        </label>
                        <input type="date" class="date-input" data-scope="subtopic" data-subtopic-id="${sub.id}" data-topic-id="${topic.id}" data-subject="${subjectId}" value="${sub.updatedAt || today()}" />
                        <button class="ghost icon delete-subtopic manage-only" data-subtopic-id="${sub.id}" data-topic-id="${topic.id}" data-subject="${subjectId}" aria-label="Delete subtopic">✕</button>
                      </div>
                    </div>
                  `
                  )
                  .join("")
              : `<span class="note">add a subtopic below</span>`
          }
        </div>
        <form class="subtopic-form manage-only" data-subject="${subjectId}" data-topic-id="${topic.id}">
          <input type="text" name="subtopic" placeholder="New subtopic" aria-label="Add subtopic" required />
          <label class="slider slider--mini">
            <input type="range" min="1" max="5" step="1" name="confidence" value="3" />
            <span class="slider__value">3/5</span>
          </label>
          <input type="date" name="updatedAt" />
          <button type="submit" class="ghost">add sub</button>
        </form>
      </div>
    `
    )
    .join("");
}

function renderSubjects(list) {
  subjectList.innerHTML = "";

  list.forEach((subject, index) => {
    const trend = trendCopy[subject.trend] || trendCopy.steady;
    const tag = tagCopy[subject.tag] || subject.tag;
    const card = document.createElement("article");
    card.className = "card fade-in";
    card.dataset.subjectId = subject.id;
    card.innerHTML = `
      <div class="card__rail">
        <span class="rail__index">${String(index + 1).padStart(2, "0")}</span>
        <span class="rail__trend ${trend.className}">${trend.emoji} ${trend.label}</span>
        <span class="pill pill--ghost">${subject.topics.length} topic${subject.topics.length === 1 ? "" : "s"}</span>
      </div>
      <div class="card__body">
        <div class="card__header">
          <div>
            <div class="card__title-row">
              <input class="inline-input subject-title" value="${subject.name}" data-subject="${subject.id}" ${editMode ? "" : "readonly"} />
              <div class="card__actions manage-only">
                <button class="ghost icon delete-subject" data-subject="${subject.id}" aria-label="Delete subject">✕</button>
              </div>
            </div>
            <div class="card__meta">
              <span class="pill">${tag}</span>
              <span class="note">focus: <input class="inline-input subject-focus" value="${subject.focus}" data-subject="${subject.id}" ${editMode ? "" : "readonly"} /></span>
            </div>
          </div>
        </div>
        <div class="card__meter">
          ${dotMeter(subject.confidence)}
          <div class="control">
            <label class="slider">
              <input type="range" min="1" max="5" step="1" value="${subject.confidence}" class="confidence-slider" data-scope="subject" data-id="${subject.id}" aria-label="${subject.name} confidence" />
              <span class="slider__value">${subject.confidence}/5</span>
            </label>
            <div class="date-control">
              <label class="micro__label">updated</label>
              <input type="date" class="date-input" data-scope="subject" data-id="${subject.id}" value="${subject.updatedAt || today()}" />
            </div>
          </div>
        </div>
        <div class="card__meta card__meta--spread manage-only">
          <label class="micro__label">trend</label>
          <select class="inline-select subject-trend" data-subject="${subject.id}">
            <option value="steady" ${subject.trend === "steady" ? "selected" : ""}>steady</option>
            <option value="rising" ${subject.trend === "rising" ? "selected" : ""}>rising</option>
            <option value="volatile" ${subject.trend === "volatile" ? "selected" : ""}>volatile</option>
          </select>
          <label class="micro__label">tag</label>
          <select class="inline-select subject-tag" data-subject="${subject.id}">
            <option value="steady" ${subject.tag === "steady" ? "selected" : ""}>solid</option>
            <option value="building" ${subject.tag === "building" ? "selected" : ""}>warming up</option>
            <option value="hold" ${subject.tag === "hold" ? "selected" : ""}>hold line</option>
            <option value="watch" ${subject.tag === "watch" ? "selected" : ""}>needs focus</option>
            <option value="calm" ${subject.tag === "calm" ? "selected" : ""}>quiet</option>
          </select>
        </div>
        <div class="card__topics">
          <p class="micro__label">topics</p>
          <div class="topics">${topicList(subject.topics, subject.id)}</div>
          <form class="topic-form manage-only" data-subject="${subject.id}">
            <input type="text" name="topic" placeholder="New topic" aria-label="Add topic" required />
            <label class="slider">
              <input type="range" min="1" max="5" step="1" name="confidence" value="3" />
              <span class="slider__value">3/5</span>
            </label>
            <input type="text" name="subtopics" placeholder="Subtopics (comma separated)" aria-label="Subtopics" />
            <input type="date" name="updatedAt" />
            <button type="submit" class="primary">add topic</button>
          </form>
        </div>
      </div>
    `;

    subjectList.appendChild(card);
  });

  updateMetrics(list);
}

function updateMetrics(list) {
  if (!list.length) {
    summaryChip.textContent = "no subjects";
    metricAvg.textContent = "0.0";
    metricStable.textContent = "0";
    metricVolatile.textContent = "0";
    renderSignals(list);
    return;
  }

  const average = list.reduce((sum, item) => sum + item.confidence, 0) / list.length;
  const stable = list.filter((item) => item.confidence >= 4).length;
  const volatileCount = list.filter((item) => item.trend === "volatile").length;

  summaryChip.textContent = `avg ${average.toFixed(1)} / 5`;
  metricAvg.textContent = average.toFixed(1);
  metricStable.textContent = stable;
  metricVolatile.textContent = volatileCount;

  renderSignals(list);
}

function renderSignals(list) {
  signalsRoot.innerHTML = "";

  if (!list.length) {
    const empty = document.createElement("div");
    empty.className = "micro";
    empty.innerHTML = `<p class="micro__label">no data</p><p class="micro__value">—</p><p class="micro__detail">adjust filters to see subjects</p>`;
    signalsRoot.appendChild(empty);
    return;
  }

  const highest = [...list].sort((a, b) => b.confidence - a.confidence)[0];
  const lowest = [...list].sort((a, b) => a.confidence - b.confidence)[0];
  const volatile = list.filter((item) => item.trend === "volatile");

  const items = [
    {
      label: "peak",
      value: `${highest.name}`,
      detail: `${highest.confidence}/5 · ${highest.focus}`,
    },
    {
      label: "watch",
      value: `${lowest.name}`,
      detail: `${lowest.confidence}/5 · ${lowest.focus}`,
    },
    {
      label: "volatile",
      value: `${volatile.length || "clear"}`,
      detail: volatile.length ? "needs steady reps" : "no spikes detected",
    },
  ];

  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "micro";
    card.innerHTML = `
      <p class="micro__label">${item.label}</p>
      <p class="micro__value">${item.value}</p>
      <p class="micro__detail">${item.detail}</p>
    `;
    signalsRoot.appendChild(card);
  });
}

function shuffleSubjects() {
  const clone = [...subjects];
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  subjects = clone;
  applyFilters();
}

function toggleTheme() {
  document.body.classList.toggle("dark");
}

function toggleManage() {
  editMode = !editMode;
  document.body.classList.toggle("editing", editMode);
  manageToggle.classList.toggle("primary", editMode);
  manageToggle.textContent = editMode ? "done" : "manage";
  applyFilters();
}

function setAccent(color, target) {
  document.documentElement.style.setProperty("--accent", color);
  document.documentElement.style.setProperty("--accent-soft", `${color}1a`);

  swatches.forEach((swatch) => {
    swatch.classList.toggle("swatch--active", swatch === target);
  });
}

function applyFilters() {
  const search = filterSearch.value.trim().toLowerCase();
  const min = Number(filterMin.value);
  const trend = filterTrend.value;

  const filtered = subjects.filter((subject) => {
    const matchesSearch = subject.name.toLowerCase().includes(search);
    const matchesMin = subject.confidence >= min;
    const matchesTrend = trend === "all" ? true : subject.trend === trend;
    return matchesSearch && matchesMin && matchesTrend;
  });

  renderSubjects(filtered);
}

function updateSubjectField(id, updater) {
  subjects = subjects.map((item) => (item.id === id ? updater(item) : item));
  applyFilters();
}

function updateTopic(subjectId, topicId, updater) {
  updateSubjectField(subjectId, (subject) => ({
    ...subject,
    topics: subject.topics.map((topic) =>
      topic.id === topicId ? updater(topic) : topic
    ),
  }));
}

function updateSubtopic(subjectId, topicId, subtopicId, updater) {
  updateTopic(subjectId, topicId, (topic) => ({
    ...topic,
    subtopics: topic.subtopics.map((sub) =>
      sub.id === subtopicId ? updater(sub) : sub
    ),
  }));
}

function handleConfidenceChange(target) {
  syncSliderLabel(target);
  const scope = target.dataset.scope;
  const value = Number(target.value);
  const container = target.closest(".control, .subtopic__controls") || target.parentElement;
  const dateInput = container?.querySelector(".date-input");
  const updatedAt = dateInput?.value || today();

  if (scope === "subject") {
    const id = target.dataset.id;
    updateSubjectField(id, (item) => ({ ...item, confidence: value, updatedAt }));
  }

  if (scope === "topic") {
    const subjectId = target.dataset.subject;
    const topicId = target.dataset.topicId;
    updateTopic(subjectId, topicId, (topic) => ({ ...topic, confidence: value, updatedAt }));
  }

  if (scope === "subtopic") {
    const subjectId = target.dataset.subject;
    const topicId = target.dataset.topicId;
    const subtopicId = target.dataset.subtopicId;
    updateSubtopic(subjectId, topicId, subtopicId, (sub) => ({ ...sub, confidence: value, updatedAt }));
  }
}

function handleDateChange(target) {
  const scope = target.dataset.scope;
  const updatedAt = target.value || today();

  if (scope === "subject") {
    updateSubjectField(target.dataset.id, (item) => ({ ...item, updatedAt }));
  }
  if (scope === "topic") {
    updateTopic(target.dataset.subject, target.dataset.topicId, (topic) => ({ ...topic, updatedAt }));
  }
  if (scope === "subtopic") {
    updateSubtopic(target.dataset.subject, target.dataset.topicId, target.dataset.subtopicId, (sub) => ({ ...sub, updatedAt }));
  }
}

function handleTopicAdd(form) {
  const subjectId = form.dataset.subject;
  const title = form.topic.value.trim();
  const confidence = Number(form.confidence.value || 3);
  const updatedAt = form.updatedAt.value || today();
  const subtopicsRaw = form.subtopics.value.trim();
  if (!title) return;

  const subtopics = subtopicsRaw
    ? subtopicsRaw.split(",").map((s) => s.trim()).filter(Boolean).map((title) => ({
        id: makeId(),
        title,
        confidence,
        updatedAt,
      }))
    : [];

  updateSubjectField(subjectId, (subject) => ({
    ...subject,
    topics: [
      ...subject.topics,
      {
        id: makeId(),
        title,
        confidence,
        updatedAt,
        subtopics,
      },
    ],
  }));

  form.reset();
}

function handleSubtopicAdd(form) {
  const subjectId = form.dataset.subject;
  const topicId = form.dataset.topicId;
  const subtopic = form.subtopic.value.trim();
  const confidence = Number(form.confidence.value || 3);
  const updatedAt = form.updatedAt.value || today();
  if (!subtopic) return;

  updateTopic(subjectId, topicId, (topic) => ({
    ...topic,
    subtopics: [...topic.subtopics, { id: makeId(), title: subtopic, confidence, updatedAt }],
  }));

  form.reset();
}

function handleSubjectAdd(form) {
  const name = form.name.value.trim();
  if (!name) return;

  const confidence = Number(form.confidence.value || 3);
  const trend = form.trend.value || "steady";
  const focus = form.focus.value.trim() || "new focus";
  const tag = form.tag.value || "steady";
  const updatedAt = form.updatedAt.value || today();

  subjects = [
    ...subjects,
    {
      id: makeId(),
      name,
      confidence,
      trend,
      focus,
      tag,
      updatedAt,
      topics: [],
    },
  ];

  form.reset();
  applyFilters();
}

function handleSubjectDelete(subjectId) {
  subjects = subjects.filter((s) => s.id !== subjectId);
  applyFilters();
}

function handleTopicDelete(subjectId, topicId) {
  updateSubjectField(subjectId, (subject) => ({
    ...subject,
    topics: subject.topics.filter((topic) => topic.id !== topicId),
  }));
}

function handleSubtopicDelete(subjectId, topicId, subtopicId) {
  updateTopic(subjectId, topicId, (topic) => ({
    ...topic,
    subtopics: topic.subtopics.filter((sub) => sub.id !== subtopicId),
  }));
}

function handleTextEdit(target) {
  const value = target.value.trim();

  if (!editMode) return;

  if (target.classList.contains("subject-title")) {
    updateSubjectField(target.dataset.subject, (subject) => ({ ...subject, name: value || "Untitled" }));
  }
  if (target.classList.contains("subject-focus")) {
    updateSubjectField(target.dataset.subject, (subject) => ({ ...subject, focus: value }));
  }
  if (target.classList.contains("topic-title")) {
    updateTopic(target.dataset.subject, target.dataset.topicId, (topic) => ({ ...topic, title: value || "Topic" }));
  }
  if (target.classList.contains("subtopic-title")) {
    updateSubtopic(target.dataset.subject, target.dataset.topicId, target.dataset.subtopicId, (sub) => ({ ...sub, title: value || "Subtopic" }));
  }
}

function handleSelectChange(target) {
  if (!editMode) return;

  if (target.classList.contains("subject-trend")) {
    updateSubjectField(target.dataset.subject, (subject) => ({ ...subject, trend: target.value }));
  }
  if (target.classList.contains("subject-tag")) {
    updateSubjectField(target.dataset.subject, (subject) => ({ ...subject, tag: target.value }));
  }
}

function init() {
  renderSubjects(subjects);
  themeToggle.addEventListener("click", toggleTheme);
  shuffleButton.addEventListener("click", shuffleSubjects);
  manageToggle.addEventListener("click", toggleManage);
  filterSearch.addEventListener("input", applyFilters);
  filterMin.addEventListener("change", applyFilters);
  filterTrend.addEventListener("change", applyFilters);

  subjectForm.addEventListener("submit", (event) => {
    event.preventDefault();
    handleSubjectAdd(event.target);
  });

  subjectForm.addEventListener("input", (event) => {
    if (event.target.type === "range") {
      syncSliderLabel(event.target);
    }
  });

  if (subjectForm.updatedAt) {
    subjectForm.updatedAt.value = today();
  }

  subjectList.addEventListener("input", (event) => {
    if (event.target.matches(".confidence-slider")) {
      handleConfidenceChange(event.target);
    }
    if (event.target.matches(".date-input")) {
      handleDateChange(event.target);
    }
    if (event.target.matches(".inline-input")) {
      handleTextEdit(event.target);
    }
    if (event.target.matches(".inline-select")) {
      handleSelectChange(event.target);
    }
  });

  document.addEventListener("input", (event) => {
    if (event.target.type === "range") {
      syncSliderLabel(event.target);
    }
  });

  subjectList.addEventListener("change", (event) => {
    if (event.target.matches(".inline-select")) {
      handleSelectChange(event.target);
    }
    if (event.target.matches(".date-input")) {
      handleDateChange(event.target);
    }
  });

  subjectList.addEventListener("submit", (event) => {
    event.preventDefault();
    if (event.target.matches(".topic-form")) {
      handleTopicAdd(event.target);
    }
    if (event.target.matches(".subtopic-form")) {
      handleSubtopicAdd(event.target);
    }
  });

  subjectList.addEventListener("click", (event) => {
    const target = event.target;
    if (target.closest(".delete-subject")) {
      handleSubjectDelete(target.closest(".delete-subject").dataset.subject);
    }
    if (target.closest(".delete-topic")) {
      const btn = target.closest(".delete-topic");
      handleTopicDelete(btn.dataset.subject, btn.dataset.topicId);
    }
    if (target.closest(".delete-subtopic")) {
      const btn = target.closest(".delete-subtopic");
      handleSubtopicDelete(btn.dataset.subject, btn.dataset.topicId, btn.dataset.subtopicId);
    }
  });

  swatches.forEach((swatch) => {
    swatch.addEventListener("click", () => setAccent(swatch.dataset.accent, swatch));
  });
  const activeSwatch = document.querySelector(".swatch--active");
  if (activeSwatch) {
    setAccent(activeSwatch.dataset.accent, activeSwatch);
  }
}

init();
