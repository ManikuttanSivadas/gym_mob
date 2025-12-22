import React, { useEffect, useMemo, useState } from "react";

// Helper: generate simple unique id for new sets
function generateId() {
  return Date.now().toString() + Math.random().toString(36).slice(2, 9);
}

/*
  Small MonthPicker component (month + year only).
  Props:
    - value: "YYYY-MM" or ""
    - onChange: fn(ym: "YYYY-MM")
    - min: "YYYY-MM"
    - max: "YYYY-MM"
    - onClose: optional fn() — called after a selection
*/
function MonthPicker({ value, onChange, min, max, onClose }) {
  const today = new Date();
  const initial = value || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  const [year, setYear] = useState(Number(initial.split("-")[0]));
  const [selectedMonth, setSelectedMonth] = useState(Number(initial.split("-")[1]) - 1);

  useEffect(() => {
    if (value) {
      const [y, m] = value.split("-");
      setYear(Number(y));
      setSelectedMonth(Number(m) - 1);
    }
  }, [value]);

  const monthNames = useMemo(
    () =>
      [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ],
    []
  );

  function toYM(y, mIndex) {
    return `${y}-${String(mIndex + 1).padStart(2, "0")}`;
  }

  function isAllowed(y, mIndex) {
    const ym = toYM(y, mIndex);
    if (min && ym < min) return false;
    if (max && ym > max) return false;
    return true;
  }

  function handleSelect(y, mIndex) {
    if (!isAllowed(y, mIndex)) return;
    const ym = toYM(y, mIndex);
    setSelectedMonth(mIndex);
    onChange && onChange(ym);
    onClose && onClose();
  }

  return (
    <div
      style={{
        border: "1px solid var(--muted-border, rgba(0,0,0,0.08))",
        background: "var(--card-bg, var(--bg))",
        padding: 12,
        borderRadius: 8,
        boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
        width: 320
      }}
      role="dialog"
      aria-label="Month picker"
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <button
          onClick={() => setYear(y => y - 1)}
          aria-label="Previous year"
          className="btn-secondary"
          style={{ minWidth: 36 }}
        >
          ‹
        </button>
        <div style={{ fontWeight: 600 }}>{year}</div>
        <button
          onClick={() => setYear(y => y + 1)}
          aria-label="Next year"
          className="btn-secondary"
          style={{ minWidth: 36 }}
        >
          ›
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
        {monthNames.map((label, idx) => {
          const allowed = isAllowed(year, idx);
          const isSelected = year === Number((value || "").slice(0, 4)) && idx === Number((value || "").slice(5, 7)) - 1;
          return (
            <button
              key={label}
              onClick={() => handleSelect(year, idx)}
              disabled={!allowed}
              className={`month-btn ${isSelected ? "selected" : ""}`}
              style={{
                padding: "8px 10px",
                borderRadius: 6,
                background: isSelected ? "var(--accent, #2b86f6)" : "transparent",
                color: isSelected ? "white" : "var(--text)",
                border: "1px solid transparent",
                cursor: allowed ? "pointer" : "not-allowed",
                opacity: allowed ? 1 : 0.45,
                textAlign: "center"
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button
          className="btn-secondary"
          onClick={() => {
            onChange && onChange("");
            onClose && onClose();
          }}
        >
          Clear
        </button>
        <button
          className="btn-primary"
          onClick={() => handleSelect(year, selectedMonth)}
        >
          Select
        </button>
      </div>
    </div>
  );
}

function ViewWorkoutsTab({ workouts = [], onUpdateWorkouts }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // MONTH filter state (YYYY-MM)
  const [filterMonth, setFilterMonth] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);

  // show/hide the custom month picker popover
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // track expanded workouts (collapsed by default)
  const [expandedWorkouts, setExpandedWorkouts] = useState([]);

  // exercise edit states
  const [editingExercise, setEditingExercise] = useState(null);
  const [editExerciseName, setEditExerciseName] = useState("");
  const [editingSets, setEditingSets] = useState([]);
  const [newSetWeight, setNewSetWeight] = useState("");
  const [newSetReps, setNewSetReps] = useState("");

  // Helpers for month-picker limits
  function getTodayMonth() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }

  function getMinFilterMonth() {
    if (!workouts || workouts.length === 0) {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      return `${oneYearAgo.getFullYear()}-${String(oneYearAgo.getMonth() + 1).padStart(2, "0")}`;
    }
    const oldestMonth = workouts.reduce((oldest, workout) => {
      const dateStr = workout.workoutDate || (workout.date || "").split("T")[0];
      if (!dateStr) return oldest;
      const ym = dateStr.slice(0, 7);
      if (!oldest) return ym;
      return ym < oldest ? ym : oldest;
    }, null);
    if (oldestMonth) return oldestMonth;
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return `${oneYearAgo.getFullYear()}-${String(oneYearAgo.getMonth() + 1).padStart(2, "0")}`;
  }

  // Filter by month (YYYY-MM)
  const filteredWorkouts = filterMonth
    ? workouts.filter(workout => {
        const dateStr = workout.workoutDate || (workout.date || "").split("T")[0] || "";
        const month = dateStr.slice(0, 7);
        return month === filterMonth;
      })
    : workouts;

  const isEmptyFilterMonth = filterMonth && filteredWorkouts.length === 0;

  // Date formatting for display
  function formatWorkoutDate(workout) {
    const dateStr = workout.workoutDate || (workout.date || "").split("T")[0] || "";
    const date = new Date(dateStr + "T12:00:00");
    if (Number.isNaN(date.getTime())) return "";
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const tOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

    if (dOnly.getTime() === tOnly.getTime()) return "Today";
    if (dOnly.getTime() === yOnly.getTime()) return "Yesterday";

    return date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined
    });
  }

  function formatFilterMonth(monthStr) {
    if (!monthStr) return "";
    const [y, m] = monthStr.split("-");
    if (!y || !m) return monthStr;
    const monthIndex = Number(m) - 1;
    const date = new Date(Number(y), monthIndex, 1);
    const today = new Date();
    const thisMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}`;

    if (monthStr === thisMonth) return "This month";
    if (monthStr === lastMonth) return "Last month";
    return date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
  }

  function formatSaveTime(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  // expand/collapse
  function toggleWorkoutExpand(workoutId) {
    setExpandedWorkouts(prev => {
      if (prev.includes(workoutId)) return prev.filter(id => id !== workoutId);
      return [...prev, workoutId];
    });
  }

  // edit exercise
  function handleEditExercise(workoutId, exercise) {
    setEditingExercise({ workoutId, exerciseId: exercise.id });
    setEditExerciseName(exercise.name || "");
    setEditingSets(Array.isArray(exercise.sets) ? [...exercise.sets] : []);
    // auto-expand workout when editing
    setExpandedWorkouts(prev => (prev.includes(workoutId) ? prev : [...prev, workoutId]));
  }

  function handleAddSetToEdit() {
    if (newSetWeight === "" || newSetReps === "") {
      alert("Enter weight and reps.");
      return;
    }
    const set = { id: generateId(), weight: Number(newSetWeight), reps: Number(newSetReps) };
    setEditingSets(prev => [...prev, set]);
    setNewSetWeight("");
    setNewSetReps("");
  }

  function handleRemoveSetFromEdit(setId) {
    setEditingSets(prev => prev.filter(s => s.id !== setId));
  }

  function handleSaveExerciseChanges() {
    if (!editingExercise) return;
    if (!editExerciseName.trim()) {
      alert("Enter exercise name.");
      return;
    }
    if (editingSets.length === 0) {
      alert("Add at least one set.");
      return;
    }

    const updated = workouts.map(w => {
      if (w.id !== editingExercise.workoutId) return w;
      const updatedExercises = (w.exercises || []).map(ex => {
        if (ex.id !== editingExercise.exerciseId) return ex;
        return { ...ex, name: editExerciseName.trim(), sets: [...editingSets] };
      });
      return { ...w, exercises: updatedExercises };
    });

    onUpdateWorkouts && onUpdateWorkouts(updated);
    handleCancelExerciseEdit();
  }

  function handleCancelExerciseEdit() {
    setEditingExercise(null);
    setEditExerciseName("");
    setEditingSets([]);
    setNewSetWeight("");
    setNewSetReps("");
  }

  // delete flows
  function handleDeleteExercise(workoutId, exerciseId, exerciseName) {
    setDeleteTarget({ type: "exercise", workoutId, exerciseId, exerciseName });
    setShowDeleteModal(true);
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;

    if (deleteTarget.type === "exercise") {
      const updatedWorkouts = workouts
        .map(w => {
          if (w.id !== deleteTarget.workoutId) return w;
          const exercises = (w.exercises || []).filter(e => e.id !== deleteTarget.exerciseId);
          return { ...w, exercises };
        })
        .filter(w => (w.exercises || []).length > 0);
      onUpdateWorkouts && onUpdateWorkouts(updatedWorkouts);
    } else if (deleteTarget.type === "workout") {
      const updatedWorkouts = workouts.filter(w => w.id !== deleteTarget.workoutId);
      onUpdateWorkouts && onUpdateWorkouts(updatedWorkouts);
    }

    setShowDeleteModal(false);
    setDeleteTarget(null);
  }

  function handleCancelDelete() {
    setShowDeleteModal(false);
    setDeleteTarget(null);
  }

  function clearMonthFilter() {
    setFilterMonth("");
  }

  const isEditingAnyExercise = !!editingExercise;

  return (
    <div className="tab-section">
      <div className="history-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Workout History</h2>
        <div className="history-controls">
          <button
            className="btn-secondary"
            onClick={() => {
              setShowDateFilter(v => !v);
              setShowMonthPicker(false);
            }}
            disabled={isEditingAnyExercise}
          >
            Filter by Month
          </button>
        </div>
      </div>

      {/* Filter area */}
      {showDateFilter && (
        <div className="date-filter-section" style={{ marginTop: 12, position: "relative" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ fontSize: 14, color: "var(--text-muted)" }}>Choose month</label>

            {/* Trigger for custom MonthPicker (matches LogWorkoutTab style) */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowMonthPicker(v => !v)}
                className="btn-secondary"
                disabled={isEditingAnyExercise}
                aria-expanded={showMonthPicker}
                style={{ minWidth: 160, textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}
              >
                <span style={{ color: filterMonth ? "var(--text)" : "var(--text-muted)" }}>
                  {filterMonth ? formatFilterMonth(filterMonth) : "Select month"}
                </span>
                <span style={{ opacity: 0.7 }}>▾</span>
              </button>

              {/* Popover month picker */}
              {showMonthPicker && (
                <div style={{ position: "absolute", zIndex: 40, top: "calc(100% + 8px)", left: 0 }}>
                  <MonthPicker
                    value={filterMonth}
                    onChange={ym => {
                      setFilterMonth(ym);
                      setShowMonthPicker(false);
                    }}
                    onClose={() => setShowMonthPicker(false)}
                    min={getMinFilterMonth()}
                    max={getTodayMonth()}
                  />
                </div>
              )}
            </div>

            {filterMonth ? (
              <>
                <div style={{ color: "var(--text-muted)" }}>{formatFilterMonth(filterMonth)}</div>
                <button className="btn-danger" onClick={() => { clearMonthFilter(); setShowMonthPicker(false); }} disabled={isEditingAnyExercise}>Clear</button>
              </>
            ) : (
              <div style={{ color: "var(--text-muted)" }}>No month selected</div>
            )}
          </div>
        </div>
      )}

      {filterMonth && (
        <div style={{ marginTop: 12, color: "var(--text-muted)" }}>
          {filteredWorkouts.length === 0 ? (
            <div>No workouts for {formatFilterMonth(filterMonth)}. <button className="link-btn" onClick={() => { clearMonthFilter(); setShowMonthPicker(false); }}>Show all</button></div>
          ) : (
            <div>Found {filteredWorkouts.length} workout{filteredWorkouts.length !== 1 ? "s" : ""} for {formatFilterMonth(filterMonth)}</div>
          )}
        </div>
      )}

      {filteredWorkouts.length === 0 && !filterMonth && (
        <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "28px 0" }}>
          No workouts logged yet.
        </p>
      )}

      <ul className="workout-list" style={{ padding: 0, margin: "12px 0 0 0", listStyle: "none" }}>
        {filteredWorkouts.map(workout => {
          const isExpanded = expandedWorkouts.includes(workout.id) || (editingExercise && editingExercise.workoutId === workout.id);

          return (
            <li key={workout.id} style={{ marginBottom: 12, borderRadius: 8, padding: 12, background: "var(--card-bg, transparent)" }}>
              {/* header: grid with toggle, centered name, right aligned date */}
              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: 12 }}>
                <div>
                  <button
                    className="btn-secondary"
                    onClick={() => toggleWorkoutExpand(workout.id)}
                    aria-expanded={isExpanded}
                    title={isExpanded ? "Collapse" : "View"}
                    disabled={isEditingAnyExercise && !(editingExercise && editingExercise.workoutId === workout.id)}
                    style={{ minWidth: 84 }}
                  >
                    {isExpanded ? "Collapse" : "View"}
                  </button>
                </div>

                <div
                  onClick={() => toggleWorkoutExpand(workout.id)}
                  title={workout.name || "Workout"}
                  style={{
                    textAlign: "center",
                    fontWeight: 600,
                    color: "var(--text)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    cursor: "pointer"
                  }}
                >
                  {workout.name || "Workout"}
                </div>

                <div style={{ textAlign: "right", color: "var(--text-muted)", fontSize: 13 }}>
                  <div>{formatWorkoutDate(workout)}</div>
                  <div style={{ marginTop: 2 }}>Saved {formatSaveTime(workout.date)}</div>
                </div>
              </div>

              {!isExpanded ? (
                <div style={{ marginTop: 12, color: "var(--text-muted)", fontSize: 13 }}>
                  {(workout.exercises || []).length} exercises completed
                </div>
              ) : (
                <>
                  <div style={{ marginTop: 12, marginBottom: 8, color: "var(--text-muted)", fontSize: 13 }}>
                    {(workout.exercises || []).length} exercises completed
                  </div>

                  {(workout.exercises || []).map(exercise => {
                    const isEditingThis = editingExercise && editingExercise.workoutId === workout.id && editingExercise.exerciseId === exercise.id;
                    return (
                      <div key={exercise.id} style={{ marginBottom: 12 }}>
                        {isEditingThis ? (
                          <div>
                            <div style={{ marginBottom: 8 }}>
                              <input
                                type="text"
                                value={editExerciseName}
                                onChange={e => setEditExerciseName(e.target.value)}
                                placeholder="Exercise name"
                              />
                            </div>

                            <div style={{ marginBottom: 8 }}>
                              <div style={{ marginBottom: 6 }}>Sets</div>
                              {editingSets.map((s, idx) => (
                                <div key={s.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", marginBottom: 6 }}>
                                  <div>Set {idx + 1} • {s.weight} kg × {s.reps} reps</div>
                                  <button className="btn-danger" onClick={() => handleRemoveSetFromEdit(s.id)}>Remove</button>
                                </div>
                              ))}
                              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                                <input type="number" placeholder="Weight (kg)" value={newSetWeight} onChange={e => setNewSetWeight(e.target.value)} min={0} step={0.5} />
                                <input type="number" placeholder="Reps" value={newSetReps} onChange={e => setNewSetReps(e.target.value)} min={1} />
                                <button className="btn-primary" onClick={handleAddSetToEdit}>Add Set</button>
                              </div>
                            </div>

                            <div style={{ display: "flex", gap: 8 }}>
                              <button className="btn-success" onClick={handleSaveExerciseChanges}>Save</button>
                              <button className="btn-secondary" onClick={handleCancelExerciseEdit}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <h4 style={{ margin: 0 }}>{exercise.name}</h4>
                              <div style={{ display: "flex", gap: 8 }}>
                                <button className="btn-edit" onClick={() => handleEditExercise(workout.id, exercise)} disabled={isEditingAnyExercise}>Edit</button>
                                <button className="btn-danger" onClick={() => handleDeleteExercise(workout.id, exercise.id, exercise.name)} disabled={isEditingAnyExercise}>Delete</button>
                              </div>
                            </div>
                            <ul style={{ marginTop: 8 }}>
                              {(exercise.sets || []).map((s, i) => <li key={s.id}>Set {i + 1} • {s.weight} kg × {s.reps} reps</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </li>
          );
        })}
      </ul>

      {showDeleteModal && (
        <div className="modal-overlay" onClick={handleCancelDelete} style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="modal-container" onClick={e => e.stopPropagation()} style={{ background: "var(--card-bg)", padding: 16, borderRadius: 8, width: 420 }}>
            <h3 style={{ marginTop: 0 }}>{deleteTarget?.type === "workout" ? "Delete Workout" : "Delete Exercise"}</h3>
            <p style={{ color: "var(--text-muted)" }}>
              {deleteTarget?.type === "workout"
                ? `Are you sure you want to delete the workout "${deleteTarget?.workoutName}"? This will remove all exercises.`
                : `Are you sure you want to delete "${deleteTarget?.exerciseName}"? This cannot be undone.`}
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
              <button className="btn-modal-secondary" onClick={handleCancelDelete}>Cancel</button>
              <button className="btn-modal-primary" onClick={handleConfirmDelete}>{deleteTarget?.type === "workout" ? "Delete Workout" : "Delete Exercise"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewWorkoutsTab;