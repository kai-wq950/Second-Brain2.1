const { useState, useEffect, useMemo } = React;

const STORAGE_KEY = "second_brain_state_v2";

const defaultState = {
  theme: "light",
  accent: "aero",
  font: "inter",
  tasks: [
    {
      id: 1,
      title: "Finish physics questions",
      dueDate: todayISO(),
      category: "Study",
      done: false,
    },
    {
      id: 2,
      title: "Guitar practice 20 min",
      dueDate: todayISO(),
      category: "Guitar",
      done: false,
    },
    {
      id: 3,
      title: "Gym session",
      dueDate: tomorrowISO(),
      category: "Fitness",
      done: false,
    },
  ],
  notes: [],
  studySessions: [],
  fitnessLogs: [],
  finances: {
    target: 2000,
    saved: 350,
    transactions: [],
  },
  workShifts: [],
};

function todayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function tomorrowISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw);
    return Object.assign({}, defaultState, parsed);
  } catch (e) {
    console.warn("Failed to load state", e);
    return defaultState;
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("Failed to save state", e);
  }
}

const ACCENTS = {
  aero: "#4f8cff",
  forest: "#10b981",
  ember: "#f97316",
  violet: "#8b5cf6",
};

function AppShell() {
  const [state, setState] = useState(loadState);
  const [page, setPage] = useState("dashboard");
  const [mobilePage, setMobilePage] = useState("dashboard");
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (state.theme === "dark") body.classList.add("theme-dark");
    else body.classList.remove("theme-dark");

    const accent = ACCENTS[state.accent] || ACCENTS.aero;
    root.style.setProperty("--accent", accent);
  }, [state.theme, state.accent]);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const tasksDueToday = useMemo(() => {
    const today = todayISO();
    return state.tasks.filter((t) => t.dueDate === today && !t.done);
  }, [state.tasks]);

  function update(patch) {
    setState((prev) => Object.assign({}, prev, patch));
  }

  function addTask(task) {
    const newTask = Object.assign({ id: Date.now(), done: false }, task);
    update({ tasks: [...state.tasks, newTask] });
  }

  function toggleTask(id) {
    update({
      tasks: state.tasks.map((t) => {
        if (t.id !== id) return t;
        return Object.assign({}, t, { done: !t.done });
      }),
    });
  }

  function addStudySession(session) {
    const newSession = Object.assign({ id: Date.now() }, session);
    update({ studySessions: [...state.studySessions, newSession] });
  }

  function addFitnessLog(log) {
    const newLog = Object.assign({ id: Date.now() }, log);
    update({ fitnessLogs: [...state.fitnessLogs, newLog] });
  }

  function addTransaction(tx) {
    const savedDelta = tx.type === "income" ? tx.amount : -tx.amount;
    const newTx = Object.assign({ id: Date.now() }, tx);
    const newFinances = Object.assign({}, state.finances, {
      saved: Math.max(0, state.finances.saved + savedDelta),
      transactions: [...state.finances.transactions, newTx],
    });
    update({ finances: newFinances });
  }

  function addShift(shift) {
    const newShift = Object.assign({ id: Date.now(), done: false }, shift);
    update({ workShifts: [...state.workShifts, newShift] });
  }

  function toggleShift(id) {
    update({
      workShifts: state.workShifts.map((s) => {
        if (s.id !== id) return s;
        return Object.assign({}, s, { done: !s.done });
      }),
    });
  }

  const activePage = width <= 720 ? mobilePage : page;
  const commonProps = {
    state,
    update,
    addTask,
    toggleTask,
    addStudySession,
    addFitnessLog,
    addTransaction,
    addShift,
    toggleShift,
    tasksDueToday,
  };

  return (
    <div className="app-shell">
      <TopNav
        page={page}
        setPage={setPage}
        update={update}
        theme={state.theme}
      />
      <main>
        {activePage === "dashboard" && <Dashboard {...commonProps} />}
        {activePage === "study" && <Study {...commonProps} />}
        {activePage === "life" && <Life {...commonProps} />}
        {activePage === "work" && <Work {...commonProps} />}
        {activePage === "insights" && <Insights {...commonProps} />}
        {activePage === "settings" && <Settings {...commonProps} />}
      </main>
      <BottomNav page={mobilePage} setPage={setMobilePage} />
    </div>
  );
}

function TopNav({ page, setPage, update, theme }) {
  const links = [
    ["dashboard", "Dashboard"],
    ["study", "Study"],
    ["life", "Life"],
    ["work", "Work"],
    ["insights", "Insights"],
    ["settings", "Settings"],
  ];
  const now = new Date();
  const timeLabel = now.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <header className="app-top-nav">
      <div className="app-logo">
        <div className="app-logo-badge" />
        <span>Second Brain</span>
      </div>
      <nav className="app-nav-links">
        {links.map(([id, label]) => (
          <button
            key={id}
            className={"app-nav-link" + (page === id ? " active" : "")}
            onClick={() => setPage(id)}
          >
            {label}
          </button>
        ))}
      </nav>
      <div className="app-nav-actions">
        <span className="text-muted" style={{ fontSize: "0.8rem" }}>
          {timeLabel}
        </span>
        <button
          className="icon-button"
          onClick={() =>
            update({ theme: theme === "dark" ? "light" : "dark" })
          }
        >
          🌓
        </button>
      </div>
    </header>
  );
}

function BottomNav({ page, setPage }) {
  const links = [
    ["dashboard", "🏠", "Home"],
    ["study", "📚", "Study"],
    ["life", "🌿", "Life"],
    ["work", "💼", "Work"],
    ["settings", "⚙️", "Settings"],
  ];
  return (
    <nav className="app-bottom-nav">
      <div className="bottom-nav-row">
        {links.map(([id, icon, label]) => (
          <button
            key={id}
            className={"bottom-nav-btn" + (page === id ? " active" : "")}
            onClick={() => setPage(id)}
          >
            <div>{icon}</div>
            <span>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

function Dashboard({ state, tasksDueToday, addTask, toggleTask }) {
  const [quickText, setQuickText] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  const now = new Date();
  const h = now.getHours();
  const greeting =
    h < 6
      ? "Late night"
      : h < 12
      ? "Good morning"
      : h < 18
      ? "Good afternoon"
      : "Good evening";
  const dateLabel = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  function handleQuickSave() {
    if (!quickText.trim()) return;
    setPickerOpen(true);
  }

  function handleQuickType(type) {
    const text = quickText.trim();
    if (!text) return;
    if (type === "task") {
      addTask({ title: text, dueDate: todayISO(), category: "Inbox" });
    } else {
      alert("Note saved: " + text);
    }
    setQuickText("");
    setPickerOpen(false);
  }

  const todayStudyMinutes = state.studySessions
    .filter((s) => s.date === todayISO())
    .reduce((sum, s) => sum + s.minutes, 0);
  const todayFitnessMinutes = state.fitnessLogs
    .filter((l) => l.date === todayISO())
    .reduce((sum, l) => sum + l.minutes, 0);

  return (
    <>
      <section className="dashboard-header-row">
        <div className="card">
          <div className="dashboard-greeting">{greeting}, Kai.</div>
          <div className="dashboard-subline text-muted">{dateLabel}</div>
          <div
            className="text-muted"
            style={{ marginTop: "0.4rem", fontSize: "0.8rem" }}
          >
            Keep your streaks alive and move projects 1% forward.
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Weather (placeholder)</div>
          </div>
          <div className="timer-display">18°</div>
          <div className="text-muted">Highcliffe · Partly cloudy</div>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Tasks due today</div>
          </div>
          <ul className="task-list">
            {tasksDueToday.length === 0 && (
              <li className="text-muted">
                Nothing urgent. Pull something from later?
              </li>
            )}
            {tasksDueToday.map((t) => (
              <li key={t.id} className="task-item">
                <div
                  className="task-checkbox"
                  onClick={() => toggleTask(t.id)}
                >
                  {t.done ? "✓" : ""}
                </div>
                <span
                  style={{
                    textDecoration: t.done ? "line-through" : "none",
                    opacity: t.done ? 0.6 : 1,
                  }}
                >
                  {t.title}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <StudyTimerCard />

        <div className="card">
          <div className="card-header">
            <div className="card-title">Daily goals</div>
          </div>
          <GoalRow label="Study" current={todayStudyMinutes} target={120} />
          <GoalRow label="Fitness" current={todayFitnessMinutes} target={40} />
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Spotify (placeholder)</div>
          </div>
          <div className="text-muted">Hook this to Spotify API later.</div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Quick capture</div>
          </div>
          <input
            className="quick-input"
            placeholder="Dump an idea, reminder, or task..."
            value={quickText}
            onChange={(e) => setQuickText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleQuickSave();
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "0.4rem",
              gap: "0.4rem",
            }}
          >
            <button className="btn secondary" onClick={handleQuickSave}>
              Save
            </button>
            {pickerOpen && (
              <div style={{ display: "flex", gap: "0.3rem" }}>
                <button
                  className="btn secondary"
                  onClick={() => handleQuickType("task")}
                >
                  Task
                </button>
                <button
                  className="btn secondary"
                  onClick={() => handleQuickType("note")}
                >
                  Note
                </button>
                <button
                  className="btn secondary"
                  onClick={() => handleQuickType("idea")}
                >
                  Idea
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function StudyTimerCard() {
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const min = String(Math.floor(seconds / 60)).padStart(2, "0");
  const sec = String(seconds % 60).padStart(2, "0");

  function reset() {
    setSeconds(25 * 60);
    setRunning(false);
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">Study timer</div>
      </div>
      <div className="timer-display">
        {min}:{sec}
      </div>
      <div className="text-muted" style={{ marginTop: "0.2rem" }}>
        Pomodoro · 25 min
      </div>
      <div style={{ marginTop: "0.4rem", display: "flex", gap: "0.4rem" }}>
        <button className="btn" onClick={() => setRunning((r) => !r)}>
          {running ? "Pause" : "Start"}
        </button>
        <button className="btn secondary" onClick={reset}>
          Reset
        </button>
      </div>
    </div>
  );
}

function GoalRow({ label, current, target }) {
  const pct = Math.min(100, Math.round((current / target) * 100));
  return (
    <div style={{ marginBottom: "0.4rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "0.8rem",
        }}
      >
        <span>{label}</span>
        <span className="text-muted">
          {current} / {target} min
        </span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: pct + "%" }} />
      </div>
    </div>
  );
}

function Study({ state, addStudySession }) {
  const [subject, setSubject] = useState("Physics");
  const [minutes, setMinutes] = useState("");
  const [tab, setTab] = useState("planner");

  const studyTasks = state.tasks.filter((t) => t.category === "Study");

  const bySubject = {};
  state.studySessions.forEach((s) => {
    bySubject[s.subject] = (bySubject[s.subject] || 0) + s.minutes;
  });

  function logSession() {
    const value = parseInt(minutes, 10);
    if (!value || value <= 0) return;
    addStudySession({ subject, minutes: value, date: todayISO() });
    setMinutes("");
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: "0.7rem",
        }}
      >
        <h2>Study</h2>
        <div style={{ display: "flex", gap: "0.3rem" }}>
          {["planner", "history", "timer", "assignments"].map((id) => (
            <button
              key={id}
              className="btn secondary"
              style={{
                background:
                  tab === id ? "rgba(148,163,184,0.3)" : "transparent",
              }}
              onClick={() => setTab(id)}
            >
              {id[0].toUpperCase() + id.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {tab === "planner" && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Revision planner (simple)</div>
          </div>
          <div className="text-muted">
            Highlighted days will show where you have Study tasks due. Advanced
            scheduling can be added later.
          </div>
        </div>
      )}

      {tab === "history" && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Study history</div>
          </div>
          {Object.keys(bySubject).length === 0 && (
            <div className="text-muted">No sessions logged yet.</div>
          )}
          {Object.entries(bySubject).map(([sub, mins]) => (
            <div key={sub} style={{ marginBottom: "0.4rem" }}>
              <strong>{sub}</strong> – {mins} min
            </div>
          ))}
        </div>
      )}

      {tab === "timer" && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Log a study block</div>
          </div>
          <div className="field-row">
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            >
              <option>Physics</option>
              <option>Maths</option>
              <option>Further Maths</option>
              <option>Computer Science</option>
              <option>Guitar</option>
            </select>
            <input
              type="number"
              placeholder="Minutes"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
            />
            <button className="btn" onClick={logSession}>
              Add
            </button>
          </div>
          <div className="text-muted">
            When you finish a focused session, log it here.
          </div>
        </div>
      )}

      {tab === "assignments" && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Upcoming assignments</div>
          </div>
          {studyTasks.length === 0 && (
            <div className="text-muted">
              Tag tasks as Study to see them here.
            </div>
          )}
          {studyTasks.length > 0 && (
            <table className="table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Due</th>
                </tr>
              </thead>
              <tbody>
                {studyTasks.map((t) => (
                  <tr key={t.id}>
                    <td>{t.title}</td>
                    <td>{t.dueDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

function Life({ state, addFitnessLog, addTransaction }) {
  const [tab, setTab] = useState("finances");

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: "0.7rem",
        }}
      >
        <h2>Life</h2>
        <div style={{ display: "flex", gap: "0.3rem" }}>
          {["finances", "health", "travel"].map((id) => (
            <button
              key={id}
              className="btn secondary"
              style={{
                background:
                  tab === id ? "rgba(148,163,184,0.3)" : "transparent",
              }}
              onClick={() => setTab(id)}
            >
              {id[0].toUpperCase() + id.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {tab === "finances" && (
        <FinancesCard finances={state.finances} addTransaction={addTransaction} />
      )}
      {tab === "health" && (
        <HealthCard fitnessLogs={state.fitnessLogs} addFitnessLog={addFitnessLog} />
      )}
      {tab === "travel" && <TravelCard />}
    </div>
  );
}

function FinancesCard({ finances, addTransaction }) {
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("income");
  const pct = Math.min(
    100,
    Math.round((finances.saved / finances.target) * 100)
  );

  function add() {
    const value = parseFloat(amount);
    if (!value || value <= 0) return;
    addTransaction({
      type,
      amount: value,
      description: type === "income" ? "Top up" : "Spend",
      date: todayISO(),
    });
    setAmount("");
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">Finances</div>
      </div>
      <div style={{ marginBottom: "0.5rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.84rem",
          }}
        >
          <span>Saved</span>
          <span>
            £{finances.saved.toFixed(0)} / £{finances.target.toFixed(0)}
          </span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: pct + "%" }} />
        </div>
      </div>
      <div className="field-row">
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="income">Add</option>
          <option value="expense">Spend</option>
        </select>
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button className="btn" onClick={add}>
          Save
        </button>
      </div>
      <div className="text-muted" style={{ marginTop: "0.3rem" }}>
        Recent:
      </div>
      <ul className="task-list">
        {finances.transactions
          .slice(-3)
          .reverse()
          .map((tx) => (
            <li key={tx.id} className="task-item">
              <span style={{ flex: 1 }}>{tx.description}</span>
              <span className="text-muted">
                {tx.type === "income" ? "+" : "-"}£{tx.amount}
              </span>
            </li>
          ))}
        {finances.transactions.length === 0 && (
          <li className="text-muted">No transactions logged yet.</li>
        )}
      </ul>
    </div>
  );
}

function HealthCard({ fitnessLogs, addFitnessLog }) {
  const [type, setType] = useState("Gym");
  const [minutes, setMinutes] = useState("");

  const todayLogs = fitnessLogs.filter((l) => l.date === todayISO());
  const totalToday = todayLogs.reduce((sum, l) => sum + l.minutes, 0);

  function add() {
    const value = parseInt(minutes, 10);
    if (!value || value <= 0) return;
    addFitnessLog({ type, minutes: value, date: todayISO() });
    setMinutes("");
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">Health & fitness</div>
      </div>
      <div className="field-row">
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option>Gym</option>
          <option>Surf</option>
          <option>Swim</option>
          <option>Run</option>
        </select>
        <input
          type="number"
          placeholder="Minutes"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
        />
        <button className="btn" onClick={add}>
          Add
        </button>
      </div>
      <div className="text-muted" style={{ marginBottom: "0.4rem" }}>
        Today: {totalToday} min
      </div>
      <ul className="task-list">
        {todayLogs.map((l) => (
          <li key={l.id} className="task-item">
            <span style={{ flex: 1 }}>{l.type}</span>
            <span className="text-muted">{l.minutes} min</span>
          </li>
        ))}
        {todayLogs.length === 0 && (
          <li className="text-muted">No activity logged today yet.</li>
        )}
      </ul>
    </div>
  );
}

function TravelCard() {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">Travel & adventure</div>
      </div>
      <div className="text-muted">
        Use this space for surf trip notes, places you want to visit, or
        memories.
      </div>
    </div>
  );
}

function Work({ state, addShift, toggleShift }) {
  const [date, setDate] = useState(todayISO());
  const [start, setStart] = useState("17:00");
  const [end, setEnd] = useState("21:00");

  function add() {
    if (!date || !start || !end) return;
    addShift({ date, start, end });
  }

  const shifts = state.workShifts
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">Work rota</div>
      </div>
      <div className="field-row">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <input
          type="time"
          value={start}
          onChange={(e) => setStart(e.target.value)}
        />
        <input
          type="time"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
        />
        <button className="btn" onClick={add}>
          Add shift
        </button>
      </div>
      <ul className="task-list">
        {shifts.map((s) => (
          <li key={s.id} className="task-item">
            <div
              className="task-checkbox"
              onClick={() => toggleShift(s.id)}
            >
              {s.done ? "✓" : ""}
            </div>
            <span>
              {s.date} · {s.start}–{s.end}
            </span>
          </li>
        ))}
        {shifts.length === 0 && (
          <li className="text-muted">No shifts logged yet.</li>
        )}
      </ul>
    </div>
  );
}

function Insights({ state }) {
  const dates = [];
  const base = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    d.setHours(0, 0, 0, 0);
    dates.push(d.toISOString().slice(0, 10));
  }

  function streakFrom(entries) {
    let streak = 0;
    for (let i = dates.length - 1; i >= 0; i--) {
      const day = dates[i];
      const has = entries.some((e) => e.date === day);
      if (has) streak++;
      else break;
    }
    return streak;
  }

  const studyStreak = streakFrom(state.studySessions);
  const fitnessStreak = streakFrom(state.fitnessLogs);

  const hoursBySubject = {};
  state.studySessions.forEach((s) => {
    hoursBySubject[s.subject] =
      (hoursBySubject[s.subject] || 0) + s.minutes / 60;
  });

  const completedSessions = state.studySessions.length;
  const plannedSessions = 7;
  const focusScore =
    plannedSessions === 0
      ? 0
      : Math.round((completedSessions / plannedSessions) * 100);
  const savingsPct = Math.min(
    100,
    Math.round((state.finances.saved / state.finances.target) * 100)
  );

  return (
    <div>
      <h2>Insights</h2>
      <div className="metric-grid">
        <div className="card">
          <div className="card-title">Study streak</div>
          <div className="timer-display">{studyStreak} days</div>
          <div className="text-muted">
            Consecutive days with at least one study session.
          </div>
        </div>
        <div className="card">
          <div className="card-title">Fitness streak</div>
          <div className="timer-display">{fitnessStreak} days</div>
          <div className="text-muted">
            Any fitness log (gym, surf, swim, run).
          </div>
        </div>
        <div className="card">
          <div className="card-title">Focus score</div>
          <div className="timer-display">{focusScore}%</div>
          <div className="text-muted">
            Sessions logged vs a simple weekly target.
          </div>
        </div>
        <div className="card">
          <div className="card-title">Savings progress</div>
          <div className="timer-display">{savingsPct}%</div>
          <div className="text-muted">
            Towards £{state.finances.target.toFixed(0)} goal.
          </div>
        </div>
      </div>
    </div>
  );
}

function Settings({ state, update }) {
  return (
    <div>
      <h2>Settings</h2>
      <div className="two-column">
        <div className="card">
          <div className="card-title">Theme</div>
          <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.4rem" }}>
            <button
              className="btn secondary"
              style={{
                background:
                  state.theme === "light"
                    ? "rgba(148,163,184,0.3)"
                    : "transparent",
              }}
              onClick={() => update({ theme: "light" })}
            >
              Light
            </button>
            <button
              className="btn secondary"
              style={{
                background:
                  state.theme === "dark"
                    ? "rgba(148,163,184,0.3)"
                    : "transparent",
              }}
              onClick={() => update({ theme: "dark" })}
            >
              Dark
            </button>
          </div>
        </div>
        <div className="card">
          <div className="card-title">Accent</div>
          <div
            style={{
              display: "flex",
              gap: "0.4rem",
              marginTop: "0.4rem",
              flexWrap: "wrap",
            }}
          >
            {Object.keys(ACCENTS).map((key) => (
              <button
                key={key}
                className="btn secondary"
                style={{
                  background:
                    state.accent === key
                      ? "rgba(148,163,184,0.3)"
                      : "transparent",
                }}
                onClick={() => update({ accent: key })}
              >
                {key}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<AppShell />);
