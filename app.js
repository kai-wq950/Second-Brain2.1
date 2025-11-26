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

const makeId = () =>
  (typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`);

let subjects = [
  {
    id: makeId(),
    name: "Mathematics",
    confidence: 4,
    trend: "rising",
    focus: "calculus timing & error trimming",
    tag: "steady",
    topics: [
      { title: "Calculus", subtopics: ["limits", "integration by parts", "series"] },
      { title: "Probability", subtopics: ["binomial", "normal", "combinatorics drills"] },
    ],
  },
  {
    id: makeId(),
    name: "Further Maths",
    confidence: 3,
    trend: "rising",
    focus: "complex numbers & matrices",
    tag: "building",
    topics: [
      { title: "Matrices", subtopics: ["row reduction", "inverse proofs"] },
      { title: "Complex", subtopics: ["arg diagrams", "De Moivre"] },
    ],
  },
  {
    id: makeId(),
    name: "Physics",
    confidence: 3,
    trend: "steady",
    focus: "multi-mark reasoning & graphs",
    tag: "hold",
    topics: [
      { title: "Mechanics", subtopics: ["projectiles", "moments", "power"] },
      { title: "Fields", subtopics: ["electric", "gravitational"] },
    ],
  },
  {
    id: makeId(),
    name: "Computer Science",
    confidence: 2,
    trend: "volatile",
    focus: "time complexity & trace logic",
    tag: "watch",
    topics: [
      { title: "Algorithms", subtopics: ["dfs/bfs", "sorting", "complexity"] },
      { title: "OOP", subtopics: ["design patterns", "encapsulation"] },
    ],
  },
  {
    id: makeId(),
    name: "English",
    confidence: 4,
    trend: "steady",
    focus: "thesis clarity & concise edits",
    tag: "calm",
    topics: [
      { title: "Analysis", subtopics: ["theme tracing", "quote selection"] },
      { title: "Practice", subtopics: ["timed essays", "structure"] },
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

function topicList(topics, subjectId) {
  if (!topics?.length) {
    return `<div class="topic topic--empty">No topics yet. Add one below.</div>`;
  }

  return topics
    .map(
      (topic, topicIndex) => `
      <div class="topic" data-subject="${subjectId}" data-topic-index="${topicIndex}">
        <div class="topic__header">
          <div>
            <p class="micro__label">topic</p>
            <p class="topic__title">${topic.title}</p>
          </div>
          <span class="pill pill--ghost">${topic.subtopics.length} sub</span>
        </div>
        <div class="topic__subs">
          ${
            topic.subtopics.length
              ? topic.subtopics.map((sub) => `<span class="chip chip--ghost">${sub}</span>`).join("")
              : `<span class="note">add a subtopic below</span>`
          }
        </div>
        <form class="subtopic-form" data-subject="${subjectId}" data-topic-index="${topicIndex}">
          <input type="text" name="subtopic" placeholder="New subtopic" aria-label="Add subtopic" required />
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
    card.className = "card";
    card.dataset.subjectId = subject.id;
    card.innerHTML = `
      <div class="card__rail">
        <span class="rail__index">${String(index + 1).padStart(2, "0")}</span>
        <span class="rail__trend ${trend.className}">${trend.emoji} ${trend.label}</span>
        <span class="pill pill--ghost">${subject.topics.length} topic${subject.topics.length === 1 ? "" : "s"}</span>
      </div>
      <div class="card__body">
        <div class="card__title">${subject.name}</div>
        <div class="card__meter">
          ${dotMeter(subject.confidence)}
          <label class="slider">
            <input type="range" min="1" max="5" step="1" value="${subject.confidence}" class="confidence-slider" data-id="${subject.id}" aria-label="${subject.name} confidence" />
            <span class="slider__value">${subject.confidence}/5</span>
          </label>
        </div>
        <div class="card__meta">
          <span class="pill">${tag}</span>
          <span class="note">focus: ${subject.focus}</span>
        </div>
        <div class="card__topics">
          <p class="micro__label">topics</p>
          <div class="topics">${topicList(subject.topics, subject.id)}</div>
          <form class="topic-form" data-subject="${subject.id}">
            <input type="text" name="topic" placeholder="New topic" aria-label="Add topic" required />
            <input type="text" name="subtopics" placeholder="Subtopics (comma separated)" aria-label="Subtopics" />
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

function handleConfidenceChange(id, value) {
  subjects = subjects.map((item) =>
    item.id === id ? { ...item, confidence: Number(value) } : item
  );
  applyFilters();
}

function handleTopicAdd(form) {
  const subjectId = form.dataset.subject;
  const title = form.topic.value.trim();
  const subtopicsRaw = form.subtopics.value.trim();
  if (!title) return;

  const subtopics = subtopicsRaw
    ? subtopicsRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  subjects = subjects.map((subject) => {
    if (subject.id !== subjectId) return subject;
    const nextTopics = [...subject.topics, { title, subtopics }];
    return { ...subject, topics: nextTopics };
  });

  form.reset();
  applyFilters();
}

function handleSubtopicAdd(form) {
  const subjectId = form.dataset.subject;
  const topicIndex = Number(form.dataset.topicIndex);
  const subtopic = form.subtopic.value.trim();
  if (!subtopic) return;

  subjects = subjects.map((subject) => {
    if (subject.id !== subjectId) return subject;
    const topics = subject.topics.map((topic, idx) =>
      idx === topicIndex
        ? { ...topic, subtopics: [...topic.subtopics, subtopic] }
        : topic
    );
    return { ...subject, topics };
  });

  form.reset();
  applyFilters();
}

function init() {
  renderSubjects(subjects);
  themeToggle.addEventListener("click", toggleTheme);
  shuffleButton.addEventListener("click", shuffleSubjects);
  filterSearch.addEventListener("input", applyFilters);
  filterMin.addEventListener("change", applyFilters);
  filterTrend.addEventListener("change", applyFilters);

  subjectList.addEventListener("input", (event) => {
    if (event.target.matches(".confidence-slider")) {
      handleConfidenceChange(event.target.dataset.id, event.target.value);
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

  swatches.forEach((swatch) => {
    swatch.addEventListener("click", () => setAccent(swatch.dataset.accent, swatch));
  });
  const activeSwatch = document.querySelector(".swatch--active");
  if (activeSwatch) {
    setAccent(activeSwatch.dataset.accent, activeSwatch);
  }
}

init();
