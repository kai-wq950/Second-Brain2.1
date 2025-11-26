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
  filterSearch: document.getElementById("filter-search"),
  filterMin: document.getElementById("filter-min"),
  manageToggle: document.getElementById("toggle-manage"),
  addSubjectForm: document.getElementById("add-subject-form"),
  addSectionForm: document.getElementById("add-section-form"),
  addTopicForm: document.getElementById("add-topic-form"),
  addSubtopicForm: document.getElementById("add-subtopic-form"),
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
          {
            id: makeId(),
            name: "Differentiation",
            mastery: 3,
            lastReviewed: today(),
            notes: "Chain rule accuracy",
            links: [],
            subtopics: [
              { id: makeId(), name: "Product/quotient", mastery: 3, lastReviewed: today(), notes: "", links: [] },
              { id: makeId(), name: "Implicit", mastery: 2, lastReviewed: today(), notes: "watch dy/dx", links: [] },
            ],
          },
          {
            id: makeId(),
            name: "Integration",
            mastery: 2,
            lastReviewed: today(),
            notes: "By parts practice",
            links: [],
            subtopics: [
              { id: makeId(), name: "Substitution", mastery: 2, lastReviewed: today(), notes: "u choice", links: [] },
            ],
          },
        ],
      },
      {
        id: makeId(),
        name: "Statistics",
        topics: [
          { id: makeId(), name: "Normal distributions", mastery: 2, lastReviewed: today(), notes: "Tail areas", links: [], subtopics: [] },
          { id: makeId(), name: "Regression", mastery: 3, lastReviewed: today(), notes: "Interpret gradients", links: [], subtopics: [] },
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
          { id: makeId(), name: "Projectiles", mastery: 3, lastReviewed: today(), notes: "Resolve components", links: [], subtopics: [] },
          { id: makeId(), name: "Moments", mastery: 4, lastReviewed: today(), notes: "Couples + supports", links: [], subtopics: [] },
        ],
      },
      {
        id: makeId(),
        name: "Electricity",
        topics: [
          { id: makeId(), name: "Kirchhoff", mastery: 2, lastReviewed: today(), notes: "Loop sign discipline", links: [], subtopics: [] },
          { id: makeId(), name: "Capacitance", mastery: 1, lastReviewed: today(), notes: "Energy steps", links: [], subtopics: [] },
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
          { id: makeId(), name: "Row reduction", mastery: 2, lastReviewed: today(), notes: "Pivot order", links: [], subtopics: [] },
          { id: makeId(), name: "Eigenvalues", mastery: 2, lastReviewed: today(), notes: "Characteristic poly", links: [], subtopics: [] },
        ],
      },
      {
        id: makeId(),
        name: "Complex Numbers",
        topics: [
          { id: makeId(), name: "Arg diagrams", mastery: 3, lastReviewed: today(), notes: "Principal value", links: [], subtopics: [] },
          { id: makeId(), name: "De Moivre", mastery: 3, lastReviewed: today(), notes: "nth roots", links: [], subtopics: [] },
        ],
      },
    ],
  },
];

let subjects = loadSubjects();
let activeSubjectId = subjects[0]?.id;
let activeTopicPath = null;
let manageMode = false;
let filters = { search: "", min: 0 };

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

function computeTopicMastery(topic) {
  if (topic.subtopics && topic.subtopics.length) {
    return average(topic.subtopics.map((st) => st.mastery || 0));
  }
  return topic.mastery || 0;
}

function computeSectionProgress(section) {
  const topicMasteries = section.topics.map((t) => computeTopicMastery(t));
  return average(topicMasteries);
}

function computeSubjectProgress(subject) {
  const topicMasteries = subject.sections.flatMap((section) => section.topics.map((t) => computeTopicMastery(t)));
  return Math.round((average(topicMasteries) / 5) * 100);
}

function masteryDots(value, onChange, interactive = true) {
  const wrapper = document.createElement("div");
  wrapper.className = `mastery ${interactive ? "mastery--interactive" : ""}`;
  for (let i = 1; i <= 5; i++) {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = `dot ${i <= value ? "dot--filled" : ""}`;
    dot.setAttribute("aria-label", `Set mastery to ${i}`);
    if (interactive) {
      dot.addEventListener("click", (event) => {
        event.stopPropagation();
        onChange(i);
      });
    } else {
      dot.disabled = true;
    }
    wrapper.appendChild(dot);
  }
  return wrapper;
}

function renderDashboard() {
  els.countdown.textContent = daysUntilMock();
  const overall = Math.round(average(subjects.map((subject) => computeSubjectProgress(subject))));
  els.overall.textContent = `Overall ${overall}%`;

  els.subjectCards.innerHTML = "";
  subjects.forEach((subject) => {
    const card = document.createElement("article");
    card.className = "card subject-card";
    const progress = computeSubjectProgress(subject);
    const topicCount = subject.sections.reduce((sum, s) => sum + s.topics.length, 0);
    card.innerHTML = `
      <div class="card__row">
        <h3>${subject.name}</h3>
        <span class="pill">${progress}%</span>
      </div>
      <div class="progress"><span style="width:${progress}%"></span></div>
      <p class="micro__hint">${subject.sections.length} sections · ${topicCount} topics</p>
    `;
    card.addEventListener("click", () => switchView("subjects", subject.id));
    els.subjectCards.appendChild(card);
  });

  const allTopics = subjects.flatMap((subject) =>
    subject.sections.flatMap((section) =>
      section.topics.flatMap((topic) => {
        const items = [{ subject, section, topic, isSub: false, mastery: computeTopicMastery(topic) }];
        (topic.subtopics || []).forEach((sub) =>
          items.push({ subject, section, topic: sub, parent: topic, isSub: true, mastery: sub.mastery || 0 })
        );
        return items;
      })
    )
  );

  const weakest = allTopics
    .sort((a, b) => (a.mastery || 0) - (b.mastery || 0))
    .slice(0, 6);

  els.weakTopics.innerHTML = "";
  weakest.forEach(({ subject, section, topic, parent, mastery }) => {
    const row = document.createElement("div");
    row.className = "list__item";
    const meta = document.createElement("div");
    meta.className = "topic-row__left";
    const name = document.createElement("h4");
    name.textContent = `${subject.name} · ${parent ? parent.name + " → " : ""}${topic.name}`;
    const last = document.createElement("span");
    last.className = "chip chip--quiet";
    last.textContent = `Last: ${topic.lastReviewed || "–"}`;
    meta.append(name, last);

    const right = document.createElement("div");
    right.className = "topic-row__right";
    right.appendChild(masteryDots(mastery || 0, () => {}, false));
    row.append(meta, right);
    row.addEventListener("click", () => focusTopic(subject.id, section.id, parent ? parent.id : topic.id, parent ? topic.id : null));
    els.weakTopics.appendChild(row);
  });
}

function renderSubjectsView() {
  els.subjectPicker.innerHTML = subjects
    .map((s) => `<option value="${s.id}" ${s.id === activeSubjectId ? "selected" : ""}>${s.name}</option>`)
    .join("");

  const activeSubject = subjects.find((s) => s.id === activeSubjectId);
  if (!activeSubject) return;

  populateManageForms();

  const searchLower = filters.search.trim().toLowerCase();
  const min = Number(filters.min);

  els.sectionsRoot.innerHTML = "";
  activeSubject.sections.forEach((section) => {
    const sectionCard = document.createElement("article");
    sectionCard.className = "card section-card";
    const sectionAvg = computeSectionProgress(section);
    sectionCard.innerHTML = `
      <div class="card__row">
        <div>
          <p class="eyebrow">${section.name}</p>
          <h3>${section.name}</h3>
        </div>
        <span class="chip">${sectionAvg.toFixed(1)}/5</span>
      </div>
    `;

    section.topics
      .filter((topic) => {
        const textMatch = topic.name.toLowerCase().includes(searchLower);
        const meetsMin = computeTopicMastery(topic) >= min;
        return textMatch && meetsMin;
      })
      .forEach((topic) => {
        sectionCard.appendChild(renderTopicRow(activeSubject.id, section.id, topic));
      });

    els.sectionsRoot.appendChild(sectionCard);
  });
}

function renderTopicRow(subjectId, sectionId, topic) {
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
  const topicHasSubs = topic.subtopics && topic.subtopics.length > 0;
  right.appendChild(
    masteryDots(
      computeTopicMastery(topic),
      (val) => {
        if (manageMode && !topicHasSubs) updateTopicMastery(subjectId, sectionId, topic.id, val);
      },
      manageMode && !topicHasSubs
    )
  );
  const openDetail = document.createElement("button");
  openDetail.type = "button";
  openDetail.className = "ghost";
  openDetail.textContent = "notes";
  openDetail.addEventListener("click", (e) => {
    e.stopPropagation();
    openTopicDetail(subjectId, sectionId, topic.id);
  });
  right.appendChild(openDetail);

  if (manageMode) {
    const editName = document.createElement("button");
    editName.className = "ghost";
    editName.textContent = "rename";
    editName.addEventListener("click", (e) => {
      e.stopPropagation();
      const next = prompt("Rename topic", topic.name);
      if (next) renameTopic(subjectId, sectionId, topic.id, next);
    });
    const updateDate = document.createElement("button");
    updateDate.className = "ghost";
    updateDate.textContent = "date";
    updateDate.addEventListener("click", (e) => {
      e.stopPropagation();
      const next = prompt("Set last reviewed (YYYY-MM-DD)", topic.lastReviewed || today());
      if (next) setTopicDate(subjectId, sectionId, topic.id, next);
    });
    const del = document.createElement("button");
    del.className = "ghost ghost--danger";
    del.textContent = "delete";
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      removeTopic(subjectId, sectionId, topic.id);
    });
    right.append(editName, updateDate, del);
  }

  row.append(left, right);

  if (topic.subtopics && topic.subtopics.length) {
    const list = document.createElement("div");
    list.className = "subtopic-list";
    topic.subtopics.forEach((sub) => {
      const subRow = document.createElement("div");
      subRow.className = "subtopic-row";
      subRow.dataset.topic = sub.id;
      const subLeft = document.createElement("div");
      subLeft.className = "topic-row__left";
      const subName = document.createElement("h5");
      subName.textContent = sub.name;
      const subLast = document.createElement("span");
      subLast.className = "chip chip--quiet";
      subLast.textContent = `Last: ${sub.lastReviewed || "–"}`;
      subLeft.append(subName, subLast);

      const subRight = document.createElement("div");
      subRight.className = "topic-row__right";
      subRight.appendChild(
        masteryDots(
          sub.mastery || 0,
          (val) => {
            if (manageMode) updateSubtopicMastery(subjectId, sectionId, topic.id, sub.id, val);
          },
          manageMode
        )
      );
      const subDetail = document.createElement("button");
      subDetail.type = "button";
      subDetail.className = "ghost";
      subDetail.textContent = "notes";
      subDetail.addEventListener("click", (e) => {
        e.stopPropagation();
        openTopicDetail(subjectId, sectionId, topic.id, sub.id);
      });
      subRight.appendChild(subDetail);

      if (manageMode) {
        const rename = document.createElement("button");
        rename.className = "ghost";
        rename.textContent = "rename";
        rename.addEventListener("click", (e) => {
          e.stopPropagation();
          const next = prompt("Rename subtopic", sub.name);
          if (next) renameSubtopic(subjectId, sectionId, topic.id, sub.id, next);
        });
        const dateBtn = document.createElement("button");
        dateBtn.className = "ghost";
        dateBtn.textContent = "date";
        dateBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          const next = prompt("Set last reviewed", sub.lastReviewed || today());
          if (next) setSubtopicDate(subjectId, sectionId, topic.id, sub.id, next);
        });
        const delSub = document.createElement("button");
        delSub.className = "ghost ghost--danger";
        delSub.textContent = "delete";
        delSub.addEventListener("click", (e) => {
          e.stopPropagation();
          removeSubtopic(subjectId, sectionId, topic.id, sub.id);
        });
        subRight.append(rename, dateBtn, delSub);
      }

      subRow.append(subLeft, subRight);
      list.appendChild(subRow);
    });

    if (manageMode) {
      const addSub = document.createElement("button");
      addSub.className = "ghost inline-add";
      addSub.textContent = "add subtopic";
      addSub.addEventListener("click", (e) => {
        e.stopPropagation();
        const name = prompt("Subtopic name");
        if (name) addSubtopic(subjectId, sectionId, topic.id, name);
      });
      list.appendChild(addSub);
    }

    row.appendChild(list);
  } else if (manageMode) {
    const addSub = document.createElement("button");
    addSub.className = "ghost inline-add";
    addSub.textContent = "add subtopic";
    addSub.addEventListener("click", (e) => {
      e.stopPropagation();
      const name = prompt("Subtopic name");
      if (name) addSubtopic(subjectId, sectionId, topic.id, name);
    });
    row.appendChild(addSub);
  }

  return row;
}

function updateTopicMastery(subjectId, sectionId, topicId, value) {
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

function updateSubtopicMastery(subjectId, sectionId, topicId, subId, value) {
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
            return {
              ...topic,
              subtopics: (topic.subtopics || []).map((sub) =>
                sub.id === subId ? { ...sub, mastery: value, lastReviewed: today() } : sub
              ),
            };
          }),
        };
      }),
    };
  });
  persistSubjects();
  render();
}

function renameTopic(subjectId, sectionId, topicId, name) {
  subjects = subjects.map((subject) =>
    subject.id === subjectId
      ? {
          ...subject,
          sections: subject.sections.map((section) =>
            section.id === sectionId
              ? {
                  ...section,
                  topics: section.topics.map((topic) => (topic.id === topicId ? { ...topic, name } : topic)),
                }
              : section
          ),
        }
      : subject
  );
  persistSubjects();
  render();
}

function renameSubtopic(subjectId, sectionId, topicId, subId, name) {
  subjects = subjects.map((subject) =>
    subject.id === subjectId
      ? {
          ...subject,
          sections: subject.sections.map((section) =>
            section.id === sectionId
              ? {
                  ...section,
                  topics: section.topics.map((topic) =>
                    topic.id === topicId
                      ? {
                          ...topic,
                          subtopics: (topic.subtopics || []).map((sub) => (sub.id === subId ? { ...sub, name } : sub)),
                        }
                      : topic
                  ),
                }
              : section
          ),
        }
      : subject
  );
  persistSubjects();
  render();
}

function setTopicDate(subjectId, sectionId, topicId, date) {
  subjects = subjects.map((subject) =>
    subject.id === subjectId
      ? {
          ...subject,
          sections: subject.sections.map((section) =>
            section.id === sectionId
              ? {
                  ...section,
                  topics: section.topics.map((topic) => (topic.id === topicId ? { ...topic, lastReviewed: date } : topic)),
                }
              : section
          ),
        }
      : subject
  );
  persistSubjects();
  render();
}

function setSubtopicDate(subjectId, sectionId, topicId, subId, date) {
  subjects = subjects.map((subject) =>
    subject.id === subjectId
      ? {
          ...subject,
          sections: subject.sections.map((section) =>
            section.id === sectionId
              ? {
                  ...section,
                  topics: section.topics.map((topic) =>
                    topic.id === topicId
                      ? {
                          ...topic,
                          subtopics: (topic.subtopics || []).map((sub) => (sub.id === subId ? { ...sub, lastReviewed: date } : sub)),
                        }
                      : topic
                  ),
                }
              : section
          ),
        }
      : subject
  );
  persistSubjects();
  render();
}

function removeTopic(subjectId, sectionId, topicId) {
  subjects = subjects.map((subject) =>
    subject.id === subjectId
      ? {
          ...subject,
          sections: subject.sections.map((section) =>
            section.id === sectionId
              ? { ...section, topics: section.topics.filter((topic) => topic.id !== topicId) }
              : section
          ),
        }
      : subject
  );
  persistSubjects();
  render();
}

function removeSubtopic(subjectId, sectionId, topicId, subId) {
  subjects = subjects.map((subject) =>
    subject.id === subjectId
      ? {
          ...subject,
          sections: subject.sections.map((section) =>
            section.id === sectionId
              ? {
                  ...section,
                  topics: section.topics.map((topic) =>
                    topic.id === topicId
                      ? { ...topic, subtopics: (topic.subtopics || []).filter((sub) => sub.id !== subId) }
                      : topic
                  ),
                }
              : section
          ),
        }
      : subject
  );
  persistSubjects();
  render();
}

function addSubject(name) {
  subjects = [
    ...subjects,
    { id: makeId(), name, sections: [] },
  ];
  activeSubjectId = subjects[subjects.length - 1].id;
  persistSubjects();
  render();
}

function addSection(subjectId, name) {
  subjects = subjects.map((subject) =>
    subject.id === subjectId
      ? { ...subject, sections: [...subject.sections, { id: makeId(), name, topics: [] }] }
      : subject
  );
  activeSubjectId = subjectId;
  persistSubjects();
  render();
}

function addTopic(subjectId, sectionId, name) {
  subjects = subjects.map((subject) =>
    subject.id === subjectId
      ? {
          ...subject,
          sections: subject.sections.map((section) =>
            section.id === sectionId
              ? {
                  ...section,
                  topics: [
                    ...section.topics,
                    { id: makeId(), name, mastery: 0, lastReviewed: today(), notes: "", links: [], subtopics: [] },
                  ],
                }
              : section
          ),
        }
      : subject
  );
  activeSubjectId = subjectId;
  persistSubjects();
  render();
}

function addSubtopic(subjectId, sectionId, topicId, name) {
  subjects = subjects.map((subject) =>
    subject.id === subjectId
      ? {
          ...subject,
          sections: subject.sections.map((section) =>
            section.id === sectionId
              ? {
                  ...section,
                  topics: section.topics.map((topic) =>
                    topic.id === topicId
                      ? {
                          ...topic,
                          subtopics: [...(topic.subtopics || []), { id: makeId(), name, mastery: 0, lastReviewed: today(), notes: "", links: [] }],
                        }
                      : topic
                  ),
                }
              : section
          ),
        }
      : subject
  );
  persistSubjects();
  render();
}

function populateManageForms() {
  const subjectOptions = subjects.map((s) => `<option value="${s.id}">${s.name}</option>`).join("");
  if (els.addSectionForm) {
    els.addSectionForm.subject.innerHTML = subjectOptions;
  }
  if (els.addTopicForm) {
    els.addTopicForm.subject.innerHTML = subjectOptions;
    const selectedSubject = subjects.find((s) => s.id === els.addTopicForm.subject.value) || subjects[0];
    els.addTopicForm.section.innerHTML = (selectedSubject?.sections || [])
      .map((sec) => `<option value="${sec.id}">${sec.name}</option>`)
      .join("");
  }
  if (els.addSubtopicForm) {
    els.addSubtopicForm.subject.innerHTML = subjectOptions;
    const s = subjects.find((sbj) => sbj.id === els.addSubtopicForm.subject.value) || subjects[0];
    els.addSubtopicForm.section.innerHTML = (s?.sections || [])
      .map((sec) => `<option value="${sec.id}">${sec.name}</option>`)
      .join("");
    const sec = s?.sections.find((x) => x.id === els.addSubtopicForm.section.value) || s?.sections?.[0];
    els.addSubtopicForm.topic.innerHTML = (sec?.topics || [])
      .map((t) => `<option value="${t.id}">${t.name}</option>`)
      .join("");
  }
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

function focusTopic(subjectId, sectionId, topicId, subId) {
  activeSubjectId = subjectId;
  switchView("subjects");
  setTimeout(() => {
    const target = document.querySelector(`[data-topic="${subId || topicId}"]`);
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

function openTopicDetail(subjectId, sectionId, topicId, subId) {
  activeTopicPath = { subjectId, sectionId, topicId, subId };
  const topic = subjects
    .find((s) => s.id === subjectId)
    ?.sections.find((s) => s.id === sectionId)
    ?.topics.find((t) => t.id === topicId);
  if (!topic) return;
  const node = subId ? (topic.subtopics || []).find((s) => s.id === subId) : topic;
  if (!node) return;
  els.topicModalTitle.textContent = node.name;
  els.topicNotes.value = node.notes || "";
  els.topicLinks.value = (node.links || []).join("\n");
  openModal(els.topicModal);
}

function saveTopicDetail() {
  if (!activeTopicPath) return;
  const { subjectId, sectionId, topicId, subId } = activeTopicPath;
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
            if (subId) {
              return {
                ...topic,
                subtopics: (topic.subtopics || []).map((sub) =>
                  sub.id === subId
                    ? {
                        ...sub,
                        notes: els.topicNotes.value,
                        links: els.topicLinks.value
                          .split(/\n+/)
                          .map((l) => l.trim())
                          .filter(Boolean),
                      }
                    : sub
                ),
              };
            }
            return {
              ...topic,
              notes: els.topicNotes.value,
              links: els.topicLinks.value
                .split(/\n+/)
                .map((l) => l.trim())
                .filter(Boolean),
            };
          }),
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
  els.filterSearch.addEventListener("input", (e) => {
    filters.search = e.target.value;
    renderSubjectsView();
  });
  els.filterMin.addEventListener("change", (e) => {
    filters.min = e.target.value;
    renderSubjectsView();
  });
  els.manageToggle.addEventListener("click", () => {
    manageMode = !manageMode;
    els.manageToggle.setAttribute("aria-pressed", manageMode);
    els.manageToggle.textContent = manageMode ? "exit manage" : "manage";
    renderSubjectsView();
  });
  els.addSubjectForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = e.target.name.value.trim();
    if (name) addSubject(name);
    e.target.reset();
  });
  els.addSectionForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = e.target.name.value.trim();
    const subjectId = e.target.subject.value;
    if (name && subjectId) addSection(subjectId, name);
    e.target.reset();
  });
  els.addTopicForm.subject.addEventListener("change", populateManageForms);
  els.addTopicForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = e.target.name.value.trim();
    const subjectId = e.target.subject.value;
    const sectionId = e.target.section.value;
    if (name && subjectId && sectionId) addTopic(subjectId, sectionId, name);
    e.target.reset();
    populateManageForms();
  });
  els.addSubtopicForm.subject.addEventListener("change", populateManageForms);
  els.addSubtopicForm.section.addEventListener("change", populateManageForms);
  els.addSubtopicForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = e.target.name.value.trim();
    const subjectId = e.target.subject.value;
    const sectionId = e.target.section.value;
    const topicId = e.target.topic.value;
    if (name && subjectId && sectionId && topicId) addSubtopic(subjectId, sectionId, topicId, name);
    e.target.reset();
    populateManageForms();
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
