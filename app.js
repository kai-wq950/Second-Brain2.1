const STORAGE_KEY = "secondbrain-mock-topics-v2";
const MOCK_DATE = "2024-12-01"; // edit this date to change countdown

const els = {
  subjectCards: document.getElementById("subject-cards"),
  weakTopics: document.getElementById("weak-topics"),
  countdown: document.getElementById("countdown"),
  overall: document.getElementById("overall-progress"),
  views: document.querySelectorAll("[data-view]"),
  sectionsRoot: document.getElementById("section-list"),
  subjectPicker: document.getElementById("subject-picker"),
  sessionModal: document.getElementById("session-modal"),
  topicModal: document.getElementById("topic-modal"),
  openLog: document.getElementById("open-log"),
  closeLog: document.getElementById("close-log"),
  sessionForm: document.getElementById("session-form"),
  sessionSubject: document.getElementById("session-subject"),
  sessionSection: document.getElementById("session-section"),
  sessionTopic: document.getElementById("session-topic"),
  sessionOutcome: document.getElementById("session-outcome"),
  topicModalTitle: document.getElementById("topic-modal-title"),
  topicNotes: document.getElementById("topic-notes"),
  topicLinks: document.getElementById("topic-links"),
  saveTopic: document.getElementById("save-topic"),
  closeTopic: document.getElementById("close-topic"),
  themeToggle: document.getElementById("toggle-theme"),
};

const today = () => new Date().toISOString().slice(0, 10);
const makeId = () =>
  (typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`);

const defaultSubjects = [
  {
    id: makeId(),
    name: "Mathematics",
    sections: [
      {
        id: makeId(),
        name: "Core",
        topics: [
          { id: makeId(), name: "Differentiation", mastery: 3, lastReviewed: today(), notes: "Chain rule accuracy", links: [] },
          { id: makeId(), name: "Integration", mastery: 2, lastReviewed: today(), notes: "By parts practice", links: [] },
        ],
      },
      {
        id: makeId(),
        name: "Statistics",
        topics: [
          { id: makeId(), name: "Normal distributions", mastery: 2, lastReviewed: today(), notes: "Tail areas", links: [] },
          { id: makeId(), name: "Regression", mastery: 3, lastReviewed: today(), notes: "Interpret gradients", links: [] },
        ],
      },
    ],
  },
  {
    id: makeId(),
    name: "Physics",
    sections: [
      {
        id: makeId(),
        name: "Mechanics",
        topics: [
          { id: makeId(), name: "Projectiles", mastery: 3, lastReviewed: today(), notes: "Resolve components", links: [] },
          { id: makeId(), name: "Moments", mastery: 4, lastReviewed: today(), notes: "Couples + supports", links: [] },
        ],
      },
      {
        id: makeId(),
        name: "Electricity",
        topics: [
          { id: makeId(), name: "Kirchhoff", mastery: 2, lastReviewed: today(), notes: "Loop sign discipline", links: [] },
          { id: makeId(), name: "Capacitance", mastery: 1, lastReviewed: today(), notes: "Energy steps", links: [] },
        ],
      },
    ],
  },
  {
    id: makeId(),
    name: "Further Maths",
    sections: [
      {
        id: makeId(),
        name: "Matrices",
        topics: [
          { id: makeId(), name: "Row reduction", mastery: 2, lastReviewed: today(), notes: "Pivot order", links: [] },
          { id: makeId(), name: "Eigenvalues", mastery: 2, lastReviewed: today(), notes: "Characteristic poly", links: [] },
        ],
      },
      {
        id: makeId(),
        name: "Complex Numbers",
        topics: [
          { id: makeId(), name: "Arg diagrams", mastery: 3, lastReviewed: today(), notes: "Principal value", links: [] },
          { id: makeId(), name: "De Moivre", mastery: 3, lastReviewed: today(), notes: "nth roots", links: [] },
        ],
      },
    ],
  },
];

let subjects = loadSubjects();
let activeSubjectId = subjects[0]?.id;
let activeTopicPath = null;

function loadSubjects() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (err) {
    console.warn("Could not load subjects", err);
  }
  return JSON.parse(JSON.stringify(defaultSubjects));
}

function persistSubjects() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
}

function average(values) {
  return values.length ? values.reduce((sum, n) => sum + Number(n), 0) / values.length : 0;
}

function daysUntilMock() {
  const ms = new Date(MOCK_DATE) - new Date();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function computeSubjectProgress(subject) {
  const topicMasteries = subject.sections.flatMap((section) => section.topics.map((t) => t.mastery || 0));
  return Math.round((average(topicMasteries) / 5) * 100);
}

function masteryDots(value, onChange) {
  const wrapper = document.createElement("div");
  wrapper.className = "mastery";
  for (let i = 1; i <= 5; i++) {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = `dot ${i <= value ? "dot--filled" : ""}`;
    dot.setAttribute("aria-label", `Set mastery to ${i}`);
    dot.addEventListener("click", (event) => {
      event.stopPropagation();
      onChange(i);
    });
    wrapper.appendChild(dot);
  }
  return wrapper;
}

function renderDashboard() {
  els.countdown.textContent = daysUntilMock();
  const overall = Math.round(
    average(subjects.map((subject) => computeSubjectProgress(subject)))
  );
  els.overall.textContent = `Overall ${overall}%`;

  els.subjectCards.innerHTML = "";
  subjects.forEach((subject) => {
    const card = document.createElement("article");
    card.className = "card subject-card";
    const progress = computeSubjectProgress(subject);
    card.innerHTML = `
      <div class="card__row">
        <h3>${subject.name}</h3>
        <span class="pill">${progress}%</span>
      </div>
      <div class="progress"><span style="width:${progress}%"></span></div>
      <p class="micro__hint">${subject.sections.length} sections · ${subject.sections.reduce(
      (sum, s) => sum + s.topics.length,
      0
    )} topics</p>
    `;
    card.addEventListener("click", () => switchView("subjects", subject.id));
    els.subjectCards.appendChild(card);
  });

  const allTopics = subjects.flatMap((subject) =>
    subject.sections.flatMap((section) =>
      section.topics.map((topic) => ({ subject, section, topic }))
    )
  );
  const weakest = allTopics.sort((a, b) => (a.topic.mastery ?? 0) - (b.topic.mastery ?? 0)).slice(0, 6);
  els.weakTopics.innerHTML = "";
  weakest.forEach(({ subject, section, topic }) => {
    const row = document.createElement("div");
    row.className = "list__item";
    const meta = document.createElement("div");
    meta.className = "list__meta";
    meta.innerHTML = `<p class="micro__label">${subject.name} — ${section.name}</p><h4>${topic.name}</h4>`;
    const right = document.createElement("div");
    right.className = "list__right";
    const dots = masteryDots(topic.mastery || 0, (val) => updateMastery(subject.id, section.id, topic.id, val));
    const last = document.createElement("span");
    last.className = "chip chip--quiet";
    last.textContent = `Last: ${topic.lastReviewed || "–"}`;
    right.append(dots, last);
    row.append(meta, right);
    row.addEventListener("click", () => focusTopic(subject.id, section.id, topic.id));
    els.weakTopics.appendChild(row);
  });
}

function renderSubjectsView() {
  els.subjectPicker.innerHTML = subjects
    .map((s) => `<option value="${s.id}" ${s.id === activeSubjectId ? "selected" : ""}>${s.name}</option>`)
    .join("");

  const activeSubject = subjects.find((s) => s.id === activeSubjectId);
  if (!activeSubject) return;

  els.sectionsRoot.innerHTML = "";
  activeSubject.sections.forEach((section) => {
    const card = document.createElement("article");
    card.className = "card section-card";
    card.innerHTML = `
      <div class="card__row">
        <h3>${section.name}</h3>
        <span class="micro__hint">${section.topics.length} topics</span>
      </div>
    `;

    section.topics.forEach((topic) => {
      const row = document.createElement("div");
      row.className = "topic-row";
      row.dataset.topic = topic.id;
      const left = document.createElement("div");
      left.className = "topic-row__left";
      const name = document.createElement("h4");
      name.textContent = topic.name;
      const last = document.createElement("span");
      last.className = "chip chip--quiet";
      last.textContent = `Last: ${topic.lastReviewed || "–"}`;
      left.append(name, last);

      const right = document.createElement("div");
      right.className = "topic-row__right";
      right.appendChild(
        masteryDots(topic.mastery || 0, (val) => updateMastery(activeSubject.id, section.id, topic.id, val))
      );
      const openDetail = document.createElement("button");
      openDetail.type = "button";
      openDetail.className = "ghost";
      openDetail.textContent = "notes";
      openDetail.addEventListener("click", (e) => {
        e.stopPropagation();
        openTopicDetail(activeSubject.id, section.id, topic.id);
      });
      right.appendChild(openDetail);

      row.append(left, right);
      card.appendChild(row);
    });

    els.sectionsRoot.appendChild(card);
  });
}

function updateMastery(subjectId, sectionId, topicId, value) {
  subjects = subjects.map((subject) => {
    if (subject.id !== subjectId) return subject;
    return {
      ...subject,
      sections: subject.sections.map((section) => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          topics: section.topics.map((topic) =>
            topic.id === topicId
              ? { ...topic, mastery: value, lastReviewed: today() }
              : topic
          ),
        };
      }),
    };
  });
  persistSubjects();
  render();
}

function switchView(view, subjectId) {
  document.querySelectorAll(".view").forEach((el) => el.classList.remove("view--active"));
  document.getElementById(view).classList.add("view--active");
  els.views.forEach((btn) => btn.removeAttribute("aria-current"));
  const btn = document.querySelector(`[data-view="${view}"]`);
  if (btn) btn.setAttribute("aria-current", "true");
  if (subjectId) activeSubjectId = subjectId;
  render();
}

function focusTopic(subjectId, sectionId, topicId) {
  activeSubjectId = subjectId;
  switchView("subjects");
  setTimeout(() => {
    const target = document.querySelector(`[data-topic="${topicId}"]`);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 50);
}

function openModal(modal) {
  modal.setAttribute("aria-hidden", "false");
}
function closeModal(modal) {
  modal.setAttribute("aria-hidden", "true");
}

function openSessionModal() {
  populateSessionSubjects();
  populateSessionSections();
  openModal(els.sessionModal);
}

function populateSessionSubjects() {
  els.sessionSubject.innerHTML = subjects.map((s) => `<option value="${s.id}">${s.name}</option>`).join("");
}

function populateSessionSections() {
  const subject = subjects.find((s) => s.id === els.sessionSubject.value) || subjects[0];
  if (!subject) return;
  els.sessionSection.innerHTML = subject.sections
    .map((section) => `<option value="${section.id}">${section.name}</option>`)
    .join("");
  populateSessionTopics();
}

function populateSessionTopics() {
  const subject = subjects.find((s) => s.id === els.sessionSubject.value) || subjects[0];
  if (!subject) return;
  const section = subject.sections.find((sec) => sec.id === els.sessionSection.value) || subject.sections[0];
  if (!section) return;
  els.sessionTopic.innerHTML = section.topics
    .map((topic) => `<option value="${topic.id}">${topic.name}</option>`)
    .join("");
}

function openTopicDetail(subjectId, sectionId, topicId) {
  activeTopicPath = { subjectId, sectionId, topicId };
  const topic = subjects
    .find((s) => s.id === subjectId)
    ?.sections.find((s) => s.id === sectionId)
    ?.topics.find((t) => t.id === topicId);
  if (!topic) return;
  els.topicModalTitle.textContent = topic.name;
  els.topicNotes.value = topic.notes || "";
  els.topicLinks.value = (topic.links || []).join("\n");
  openModal(els.topicModal);
}

function saveTopicDetail() {
  if (!activeTopicPath) return;
  const { subjectId, sectionId, topicId } = activeTopicPath;
  subjects = subjects.map((subject) => {
    if (subject.id !== subjectId) return subject;
    return {
      ...subject,
      sections: subject.sections.map((section) => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          topics: section.topics.map((topic) =>
            topic.id === topicId
              ? {
                  ...topic,
                  notes: els.topicNotes.value,
                  links: els.topicLinks.value
                    .split(/\n+/)
                    .map((l) => l.trim())
                    .filter(Boolean),
                }
              : topic
          ),
        };
      }),
    };
  });
  persistSubjects();
  closeModal(els.topicModal);
  render();
}

function handleSessionSubmit(event) {
  event.preventDefault();
  const subjectId = els.sessionSubject.value;
  const sectionId = els.sessionSection.value;
  const topicId = els.sessionTopic.value;
  const outcome = els.sessionOutcome.value;

  subjects = subjects.map((subject) => {
    if (subject.id !== subjectId) return subject;
    return {
      ...subject,
      sections: subject.sections.map((section) => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          topics: section.topics.map((topic) => {
            if (topic.id !== topicId) return topic;
            const delta = outcome === "good" ? 1 : outcome === "bad" ? -1 : 0;
            const mastery = Math.max(0, Math.min(5, (topic.mastery || 0) + delta));
            return { ...topic, mastery, lastReviewed: today() };
          }),
        };
      }),
    };
  });

  persistSubjects();
  closeModal(els.sessionModal);
  render();
}

function attachEvents() {
  document.querySelectorAll("[data-view]").forEach((btn) => {
    btn.addEventListener("click", () => switchView(btn.dataset.view));
  });
  els.subjectPicker.addEventListener("change", (e) => {
    activeSubjectId = e.target.value;
    render();
  });
  els.openLog.addEventListener("click", openSessionModal);
  els.closeLog.addEventListener("click", () => closeModal(els.sessionModal));
  els.sessionForm.addEventListener("submit", handleSessionSubmit);
  els.sessionSubject.addEventListener("change", () => {
    populateSessionSections();
  });
  els.sessionSection.addEventListener("change", populateSessionTopics);
  els.closeTopic.addEventListener("click", () => closeModal(els.topicModal));
  els.saveTopic.addEventListener("click", saveTopicDetail);
  document.querySelectorAll(".modal__backdrop").forEach((backdrop) => {
    backdrop.addEventListener("click", (e) => {
      if (e.target.closest("#session-modal")) closeModal(els.sessionModal);
      if (e.target.closest("#topic-modal")) closeModal(els.topicModal);
    });
  });
  els.themeToggle.addEventListener("click", toggleTheme);
}

function toggleTheme() {
  document.documentElement.classList.toggle("theme-dark");
}

function render() {
  renderDashboard();
  renderSubjectsView();
}

attachEvents();
render();
