const subjectList = document.getElementById("subject-list");
const signalsRoot = document.getElementById("signals");
const themeToggle = document.getElementById("toggle-theme");
const shuffleButton = document.getElementById("shuffle");
const summaryChip = document.getElementById("summary-chip");
const metricAvg = document.getElementById("metric-avg");
const metricStable = document.getElementById("metric-stable");
const metricVolatile = document.getElementById("metric-volatile");

const subjects = [
  {
    name: "Mathematics",
    confidence: 4,
    trend: "rising",
    focus: "calculus timing & error trimming",
    tag: "steady",
  },
  {
    name: "Further Maths",
    confidence: 3,
    trend: "rising",
    focus: "complex numbers & matrices",
    tag: "building",
  },
  {
    name: "Physics",
    confidence: 3,
    trend: "steady",
    focus: "multi-mark reasoning & graphs",
    tag: "hold",
  },
  {
    name: "Computer Science",
    confidence: 2,
    trend: "volatile",
    focus: "time complexity & trace logic",
    tag: "watch",
  },
  {
    name: "English",
    confidence: 4,
    trend: "steady",
    focus: "thesis clarity & concise edits",
    tag: "calm",
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

function renderSubjects(list) {
  subjectList.innerHTML = "";

  list.forEach((subject, index) => {
    const trend = trendCopy[subject.trend] || trendCopy.steady;
    const tag = tagCopy[subject.tag] || subject.tag;
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <div class="card__rail">
        <span class="rail__index">${String(index + 1).padStart(2, "0")}</span>
        <span class="rail__trend ${trend.className}">${trend.emoji} ${trend.label}</span>
      </div>
      <div class="card__body">
        <div class="card__title">${subject.name}</div>
        <div class="card__meter">
          ${dotMeter(subject.confidence)}
          <span class="meter__value">${subject.confidence} / 5</span>
        </div>
        <div class="card__meta">
          <span class="pill">${tag}</span>
          <span class="note">focus: ${subject.focus}</span>
        </div>
      </div>
    `;

    subjectList.appendChild(card);
  });

  const average = list.reduce((sum, item) => sum + item.confidence, 0) / list.length;
  const stable = list.filter((item) => item.confidence >= 4).length;
  const volatileCount = list.filter((item) => item.trend === "volatile").length;

  summaryChip.textContent = `avg ${average.toFixed(1)} / 5`;
  metricAvg.textContent = average.toFixed(1);
  metricStable.textContent = stable;
  metricVolatile.textContent = volatileCount;
}

function renderSignals(list) {
  signalsRoot.innerHTML = "";

  const highest = [...list].sort((a, b) => b.confidence - a.confidence)[0];
  const lowest = [...list].sort((a, b) => a.confidence - b.confidence)[0];
  const volatile = list.filter((item) => item.trend === "volatile");

  const items = [
    {
      label: "peak", value: `${highest.name}`, detail: `${highest.confidence}/5 · ${highest.focus}`,
    },
    {
      label: "watch", value: `${lowest.name}`, detail: `${lowest.confidence}/5 · ${lowest.focus}`,
    },
    {
      label: "volatile", value: `${volatile.length || "clear"}`, detail: volatile.length ? "needs steady reps" : "no spikes detected",
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
  renderSubjects(clone);
  renderSignals(clone);
}

function toggleTheme() {
  document.body.classList.toggle("dark");
}

function init() {
  renderSubjects(subjects);
  renderSignals(subjects);
  themeToggle.addEventListener("click", toggleTheme);
  shuffleButton.addEventListener("click", shuffleSubjects);
}

init();
