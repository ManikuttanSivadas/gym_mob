import React, { useCallback, useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";

// Helper: generate simple unique id for new sets
function generateId() {
  return Date.now().toString() + Math.random().toString(36).slice(2, 9);
}

/*
  MonthPicker modal (centered). Mobile-first:
   - Click a month -> if different month sets that month; if same month clears filter
   - No Clear button
   - Click outside or press Escape closes modal
*/
function MonthPicker({ value, onChange, min, max, onClose }) {
  const today = new Date();
  const initial = value || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const [year, setYear] = useState(Number(initial.split("-")[0]));

  const monthNames = useMemo(
    () => ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    []
  );

  const parseYMIndex = useCallback((ym) => {
    if (!ym) return null;
    const p = ym.split("-");
    if (p.length !== 2) return null;
    const y = Number(p[0]);
    const m = Number(p[1]) - 1;
    if (Number.isNaN(y) || Number.isNaN(m)) return null;
    return y * 12 + m;
  }, []);

  const minIndex = parseYMIndex(min);
  const maxIndex = parseYMIndex(max);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose && onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function toYM(y, mIndex) {
    return `${y}-${String(mIndex + 1).padStart(2, "0")}`;
  }

  function isAllowed(y, mIndex) {
    const idx = y * 12 + mIndex;
    if (minIndex !== null && idx < minIndex) return false;
    if (maxIndex !== null && idx > maxIndex) return false;
    return true;
  }

  function handleMonthClick(mIndex) {
    if (!isAllowed(year, mIndex)) return;
    const ym = toYM(year, mIndex);
    if (ym === value) {
      onChange && onChange(""); // toggle off when clicking same month
    } else {
      onChange && onChange(ym);
    }
    onClose && onClose();
  }

  return ReactDOM.createPortal(
    <div
      role="dialog"
      aria-label="Select month"
      onClick={() => onClose && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1200,
        background: "rgba(0,0,0,0.32)",
        padding: 20
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "94%",
          maxWidth: 360,
          borderRadius: 12,
          background: "var(--card-bg, #fff)",
          boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
          padding: 14,
          border: "1px solid rgba(0,0,0,0.06)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <button
            className="btn-ghost"
            onClick={() => setYear((y) => y - 1)}
            aria-label="Previous year"
            style={{ padding: 6, borderRadius: 8 }}
          >
            ‹
          </button>
          <div style={{ fontWeight: 700 }}>{year}</div>
          <button
            className="btn-ghost"
            onClick={() => setYear((y) => y + 1)}
            aria-label="Next year"
            style={{ padding: 6, borderRadius: 8 }}
          >
            ›
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {monthNames.map((label, idx) => {
            const allowed = isAllowed(year, idx);
            const ym = toYM(year, idx);
            const isSelected = value === ym;
            return (
              <button
                key={label}
                onClick={() => handleMonthClick(idx)}
                disabled={!allowed}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  background: isSelected ? "var(--accent, #1e90ff)" : "transparent",
                  color: isSelected ? "#fff" : "var(--text)",
                  border: "1px solid transparent",
                  fontWeight: 700,
                  textAlign: "center",
                  cursor: allowed ? "pointer" : "not-allowed",
                  opacity: allowed ? 1 : 0.45,
                  minHeight: 44
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
        {/* small close action for mobile (optional, still closes) */}
        <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
          <button className="btn-secondary" onClick={() => onClose && onClose()} style={{ padding: "8px 12px", borderRadius: 8 }}>
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function ViewWorkoutsTab({ workouts = [], onUpdateWorkouts }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // MONTH filter state (YYYY-MM)
  const [filterMonth, setFilterMonth] = useState("");
  // show/hide centered MonthPicker modal
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // track expanded workouts (collapsed by default)
  const [expandedWorkouts, setExpandedWorkouts] = useState([]);

  // exercise edit states
  const [editingExercise, setEditingExercise] = useState(null);
  const [editExerciseName, setEditExerciseName] = useState("");
  const [editingSets, setEditingSets] = useState([]);
  const [newSetWeight, setNewSetWeight] = useState("");
  const [newSetReps, setNewSetReps] = useState("");

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
    ? workouts.filter((workout) => {
        const dateStr = workout.workoutDate || (workout.date || "").split("T")[0] || "";
        const month = dateStr.slice(0, 7);
        return month === filterMonth;
      })
    : workouts;

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

  function toggleWorkoutExpand(workoutId) {
    setExpandedWorkouts((prev) => (prev.includes(workoutId) ? prev.filter((id) => id !== workoutId) : [...prev, workoutId]));
  }

  function handleEditExercise(workoutId, exercise) {
    setEditingExercise({ workoutId, exerciseId: exercise.id });
    setEditExerciseName(exercise.name || "");
    setEditingSets(Array.isArray(exercise.sets) ? [...exercise.sets] : []);
    setExpandedWorkouts((prev) => (prev.includes(workoutId) ? prev : [...prev, workoutId]));
  }

  function handleAddSetToEdit() {
    if (newSetWeight === "" || newSetReps === "") {
      alert("Enter weight and reps.");
      return;
    }
    const set = { id: generateId(), weight: Number(newSetWeight), reps: Number(newSetReps) };
    setEditingSets((prev) => [...prev, set]);
    setNewSetWeight("");
    setNewSetReps("");
  }

  function handleRemoveSetFromEdit(setId) {
    setEditingSets((prev) => prev.filter((s) => s.id !== setId));
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
    const updated = workouts.map((w) => {
      if (w.id !== editingExercise.workoutId) return w;
      const updatedExercises = (w.exercises || []).map((ex) => {
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

  function handleDeleteExercise(workoutId, exerciseId, exerciseName) {
    setDeleteTarget({ type: "exercise", workoutId, exerciseId, exerciseName });
    setShowDeleteModal(true);
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    if (deleteTarget.type === "exercise") {
      const updatedWorkouts = workouts
        .map((w) => {
          if (w.id !== deleteTarget.workoutId) return w;
          const exercises = (w.exercises || []).filter((e) => e.id !== deleteTarget.exerciseId);
          return { ...w, exercises };
        })
        .filter((w) => (w.exercises || []).length > 0);
      onUpdateWorkouts && onUpdateWorkouts(updatedWorkouts);
    } else if (deleteTarget.type === "workout") {
      const updatedWorkouts = workouts.filter((w) => w.id !== deleteTarget.workoutId);
      onUpdateWorkouts && onUpdateWorkouts(updatedWorkouts);
    }
    setShowDeleteModal(false);
    setDeleteTarget(null);
  }

  const isEditingAnyExercise = !!editingExercise;

  // open month modal directly (mobile) — user requested direct open on icon click
  function openMonthModal() {
    if (isEditingAnyExercise) return;
    setShowMonthPicker(true);
  }

  return (
    <div className="tab-section" style={{ padding: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Workout History</h2>

        {/* Filter icon on the right side (icon-only button) */}
        <button
          title="Filter by month"
          aria-label="Filter by month"
          onClick={openMonthModal}
          disabled={isEditingAnyExercise}
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: "1px solid transparent",
            padding: 6
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text)" }}>
            <path d="M3 5h18" />
            <path d="M6 12h12" />
            <path d="M10 19h4" />
          </svg>
        </button>
      </div>

      {/* small selected month pill below header (mobile-friendly) */}
      <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
        {filterMonth ? (
          <div style={{ padding: "6px 10px", borderRadius: 16, background: "rgba(30,144,255,0.12)", color: "var(--text)", fontWeight: 600 }}>
            {formatFilterMonth(filterMonth)}
          </div>
        ) : (
          <div style={{ color: "var(--text-muted)", fontSize: 14 }}>Showing all workouts</div>
        )}
      </div>

      {/* MonthPicker centered modal */}
      {showMonthPicker && (
        <MonthPicker
          value={filterMonth}
          onChange={(ym) => setFilterMonth(ym)}
          onClose={() => setShowMonthPicker(false)}
          min={getMinFilterMonth()}
          max={getTodayMonth()}
        />
      )}

      {/* Filtered results header */}
      {filterMonth && (
        <div style={{ marginTop: 12, color: "var(--text-muted)", fontSize: 13 }}>
          {filteredWorkouts.length === 0 ? (
            <div>No workouts for {formatFilterMonth(filterMonth)}. <button className="link-btn" onClick={() => setFilterMonth("")}>Show all</button></div>
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

      <ul style={{ padding: 0, marginTop: 12, listStyle: "none" }}>
        {filteredWorkouts.map((workout) => {
          const isExpanded = expandedWorkouts.includes(workout.id) || (editingExercise && editingExercise.workoutId === workout.id);
          return (
            <li key={workout.id} style={{ marginBottom: 12, borderRadius: 10, padding: 12, background: "var(--card-bg, transparent)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 12, alignItems: "center" }}>
                <div>
                  <button
                    onClick={() => toggleWorkoutExpand(workout.id)}
                    style={{ minWidth: 72 }}
                    disabled={isEditingAnyExercise && !(editingExercise && editingExercise.workoutId === workout.id)}
                  >
                    {isExpanded ? "Collapse" : "View"}
                  </button>
                </div>

                <div onClick={() => toggleWorkoutExpand(workout.id)} style={{ textAlign: "center", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {workout.name || "Workout"}
                </div>

                <div style={{ textAlign: "right", color: "var(--text-muted)", fontSize: 12 }}>
                  <div>{formatWorkoutDate(workout)}</div>
                  <div style={{ marginTop: 4 }}>Saved {formatSaveTime(workout.date)}</div>
                </div>
              </div>

              {isExpanded && (
                <div style={{ marginTop: 12 }}>
                  {(workout.exercises || []).map((exercise) => {
                    const isEditingThis = editingExercise && editingExercise.workoutId === workout.id && editingExercise.exerciseId === exercise.id;
                    return (
                      <div key={exercise.id} style={{ marginBottom: 10 }}>
                        {isEditingThis ? (
                          <div>
                            <input value={editExerciseName} onChange={(e) => setEditExerciseName(e.target.value)} placeholder="Exercise name" style={{ width: "100%", marginBottom: 8 }} />
                            <div>
                              {editingSets.map((s, i) => (
                                <div key={s.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                  <div>Set {i + 1} • {s.weight} kg × {s.reps}</div>
                                  <button onClick={() => handleRemoveSetFromEdit(s.id)}>Remove</button>
                                </div>
                              ))}
                              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                                <input type="number" value={newSetWeight} onChange={(e) => setNewSetWeight(e.target.value)} placeholder="Weight" />
                                <input type="number" value={newSetReps} onChange={(e) => setNewSetReps(e.target.value)} placeholder="Reps" />
                                <button onClick={handleAddSetToEdit}>Add</button>
                              </div>
                            </div>

                            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                              <button onClick={handleSaveExerciseChanges}>Save</button>
                              <button onClick={() => handleCancelExerciseEdit()}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div style={{ fontWeight: 700 }}>{exercise.name}</div>
                              <div style={{ display: "flex", gap: 8 }}>
                                <button onClick={() => handleEditExercise(workout.id, exercise)} disabled={isEditingAnyExercise}>Edit</button>
                                <button onClick={() => handleDeleteExercise(workout.id, exercise.id, exercise.name)} disabled={isEditingAnyExercise}>Delete</button>
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
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {showDeleteModal && (
        <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1300, background: "rgba(0,0,0,0.32)" }} onClick={() => setShowDeleteModal(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "90%", maxWidth: 420, background: "var(--card-bg)", padding: 16, borderRadius: 10 }}>
            <h3 style={{ marginTop: 0 }}>{deleteTarget?.type === "workout" ? "Delete Workout" : "Delete Exercise"}</h3>
            <p style={{ color: "var(--text-muted)" }}>
              {deleteTarget?.type === "workout"
                ? `Are you sure you want to delete the workout "${deleteTarget?.workoutName}"? This will remove all exercises.`
                : `Are you sure you want to delete "${deleteTarget?.exerciseName}"? This cannot be undone.`}
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
              <button onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button onClick={handleConfirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewWorkoutsTab;