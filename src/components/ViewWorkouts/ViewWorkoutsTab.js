import React, { useCallback, useEffect, useMemo, useState, memo } from "react";
import ReactDOM from "react-dom";
import CalendarView from "./CalendarView";

// Helper: generate simple unique id for new sets
function generateId() {
  return Date.now().toString() + Math.random().toString(36).slice(2, 9);
}

/*
  MonthPicker (modal) — multi-select months, no Done button (closes on outside click / Escape).
  Uses app modal classes from App.css.
*/
function MonthPicker({ value = [], onChange, min, max, onClose }) {
  const today = new Date();
  const initialYear = (value && value.length > 0) ? Number(value[0].split("-")[0]) : today.getFullYear();
  const [year, setYear] = useState(initialYear);

  const monthNames = useMemo(
    () => ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    []
  );

  const parseYMIndex = useCallback((ym) => {
    if (!ym) return null;
    const p = ym.split("-");
    if (p.length !== 2) return null;
    const y = Number(p[0]), m = Number(p[1]) - 1;
    if (Number.isNaN(y) || Number.isNaN(m)) return null;
    return y * 12 + m;
  }, []);

  const minIndex = parseYMIndex(min);
  const maxIndex = parseYMIndex(max);
  const minYear = today.getFullYear() - 10; // Allow going back 10 years from now
  const maxYear = today.getFullYear(); // Only current year and past
  const canGoNext = year < maxYear;
  const canGoPrev = year > minYear;

  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose && onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function toYM(y, mIdx) {
    return `${y}-${String(mIdx + 1).padStart(2,"0")}`;
  }

  function isAllowed(y, mIdx) {
    const idx = y * 12 + mIdx;
    if (minIndex !== null && idx < minIndex) return false;
    if (maxIndex !== null && idx > maxIndex) return false;
    return true;
  }

  const selectedSet = useMemo(() => new Set(value || []), [value]);

  function toggleMonth(mIdx) {
    if (!isAllowed(year, mIdx)) return;
    const ym = toYM(year, mIdx);
    const s = new Set(value || []);
    if (s.has(ym)) s.delete(ym); else s.add(ym);
    const arr = Array.from(s).sort((a,b) => (parseYMIndex(a)||0) - (parseYMIndex(b)||0));
    onChange && onChange(arr);
  }

  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={() => onClose && onClose()}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 360 }}>
        <div className="modal-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button className="btn-secondary" onClick={() => canGoPrev && setYear(y => y - 1)} disabled={!canGoPrev} aria-label="Prev year" style={{ opacity: canGoPrev ? 1 : 0.5, cursor: canGoPrev ? "pointer" : "not-allowed" }}>‹</button>
          <strong>{year}</strong>
          <button className="btn-secondary" onClick={() => canGoNext && setYear(y => y + 1)} disabled={!canGoNext} aria-label="Next year" style={{ opacity: canGoNext ? 1 : 0.5, cursor: canGoNext ? "pointer" : "not-allowed" }}>›</button>
        </div>

        <div style={{ padding: "12px 16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {monthNames.map((m, idx) => {
              const allowed = isAllowed(year, idx);
              const ym = toYM(year, idx);
              const selected = selectedSet.has(ym);
              return (
                <button
                  key={m}
                  className={`month-btn ${selected ? "selected" : ""}`}
                  onClick={() => toggleMonth(idx)}
                  disabled={!allowed}
                  style={{
                    padding: 10,
                    borderRadius: 8,
                    background: "transparent",          // keep it simple, no colored pill
                    color: selected ? "var(--text-primary)" : "var(--text-primary)",
                    border: selected ? "1px solid var(--border-light)" : "1px solid transparent",
                    cursor: allowed ? "pointer" : "not-allowed",
                    minHeight: 44,
                    fontWeight: 700
                  }}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>

        {/* No Done button by request - modal closes on outside click or Escape */}
      </div>
    </div>,
    document.body
  );
}

function ViewWorkoutsTab({ workouts = [], onUpdateWorkouts, isLoading = false }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // month filter state (array of "YYYY-MM")
  const [filterMonths, setFilterMonths] = useState([]);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const [expandedWorkouts, setExpandedWorkouts] = useState([]);
  const [editingExercise, setEditingExercise] = useState(null);
  const [editExerciseName, setEditExerciseName] = useState("");
  const [editingSets, setEditingSets] = useState([]);
  const [newSetWeight, setNewSetWeight] = useState("");
  const [newSetReps, setNewSetReps] = useState("");
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [editWorkoutName, setEditWorkoutName] = useState("");
  const [editingWorkoutData, setEditingWorkoutData] = useState(null);

  // calendar view state with localStorage persistence
  const [showCalendarView, setShowCalendarView] = useState(() => {
    const saved = localStorage.getItem('viewWorkouts_showCalendarView');
    return saved ? JSON.parse(saved) : false;
  });
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [expandedCalendarWorkouts, setExpandedCalendarWorkouts] = useState([]);

  // persist showCalendarView to localStorage
  useEffect(() => {
    localStorage.setItem('viewWorkouts_showCalendarView', JSON.stringify(showCalendarView));
  }, [showCalendarView]);

  const isEditingAnyExercise = !!editingExercise;

  function getTodayMonth() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
  }

  // calendar helpers - getWorkoutsByDate and getWorkoutsForDate are still needed for edit modal
  function getWorkoutsByDate() {
    const map = {};
    workouts.forEach(w => {
      const dateStr = w.workoutDate || (w.date || "").split("T")[0];
      if (dateStr) {
        if (!map[dateStr]) map[dateStr] = [];
        map[dateStr].push(w);
      }
    });
    return map;
  }

  function getWorkoutsForDate(date) {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
    const workoutsByDate = getWorkoutsByDate();
    return workoutsByDate[dateStr] || [];
  }

  function getMinFilterMonth() {
    if (!workouts || workouts.length === 0) {
      const oneYearAgo = new Date(); oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      return `${oneYearAgo.getFullYear()}-${String(oneYearAgo.getMonth()+1).padStart(2,"0")}`;
    }
    const oldest = workouts.reduce((oldest, w) => {
      const ds = w.workoutDate || (w.date || "").split("T")[0];
      if (!ds) return oldest;
      const ym = ds.slice(0,7);
      if (!oldest) return ym;
      return ym < oldest ? ym : oldest;
    }, null);
    return oldest || getTodayMonth();
  }

  // filter logic (multiple months) - memoized to prevent re-filtering on every render
  const filteredWorkouts = useMemo(() => {
    return (filterMonths && filterMonths.length > 0)
      ? workouts.filter(w => {
          const d = w.workoutDate || (w.date || "").split("T")[0] || "";
          const ym = d.slice(0,7);
          return filterMonths.includes(ym);
        })
      : workouts;
  }, [workouts, filterMonths]);

  function formatWorkoutDate(workout) {
    const dateStr = workout.workoutDate || (workout.date || "").split("T")[0] || "";
    const date = new Date(dateStr + "T12:00:00");
    if (Number.isNaN(date.getTime())) return "";
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);

    const dOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const tOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

    if (dOnly.getTime() === tOnly.getTime()) return "Today";
    if (dOnly.getTime() === yOnly.getTime()) return "Yesterday";

    return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined });
  }

  function formatFilterMonth(monthStr) {
    if (!monthStr) return "";
    const [y,m] = monthStr.split("-");
    const idx = Number(m) - 1;
    const date = new Date(Number(y), idx, 1);
    const today = new Date();
    const thisMonth = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}`;
    const lastMonthDate = new Date(today.getFullYear(), today.getMonth()-1, 1);
    const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth()+1).padStart(2,"0")}`;
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

  function toggleWorkoutExpand(id) {
    setExpandedWorkouts(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  // editing flows
  function handleEditExercise(workoutId, exercise) {
    setEditingExercise({ workoutId, exerciseId: exercise.id });
    setEditExerciseName(exercise.name || "");
    setEditingSets(Array.isArray(exercise.sets) ? [...exercise.sets] : []);
    setExpandedWorkouts(prev => prev.includes(workoutId) ? prev : [...prev, workoutId]);
  }

  function handleAddSetToEdit() {
    if (newSetWeight === "" || newSetReps === "") { alert("Enter weight and reps."); return; }
    const set = { id: generateId(), weight: Number(newSetWeight), reps: Number(newSetReps) };
    setEditingSets(prev => [...prev, set]);
    setNewSetWeight(""); setNewSetReps("");
  }

  function handleRemoveSetFromEdit(setId) {
    setEditingSets(prev => prev.filter(s => s.id !== setId));
  }

  function handleSaveExerciseChanges() {
    if (!editingExercise) return;
    if (!editExerciseName.trim()) { alert("Enter exercise name."); return; }
    if (editingSets.length === 0) { alert("Add at least one set."); return; }
    const updated = workouts.map(w => {
      if (w.id !== editingExercise.workoutId) return w;
      // If exerciseId is null, we're adding a new exercise
      if (editingExercise.exerciseId === null) {
        const newExercise = { id: generateId(), name: editExerciseName.trim(), sets: [...editingSets] };
        return { ...w, exercises: [...(w.exercises || []), newExercise] };
      }
      // Otherwise, we're editing an existing exercise
      const updatedExercises = (w.exercises || []).map(ex => ex.id === editingExercise.exerciseId ? { ...ex, name: editExerciseName.trim(), sets: [...editingSets] } : ex);
      return { ...w, exercises: updatedExercises };
    });
    onUpdateWorkouts && onUpdateWorkouts(updated);
    handleCancelExerciseEdit();
  }

  function handleCancelExerciseEdit() {
    setEditingExercise(null); setEditExerciseName(""); setEditingSets([]); setNewSetWeight(""); setNewSetReps("");
  }

  function handleEditWorkout(workoutId, workoutName) {
    const workout = workouts.find(w => w.id === workoutId);
    setEditingWorkout(workoutId);
    setEditWorkoutName(workoutName || "");
    setEditingWorkoutData(JSON.parse(JSON.stringify(workout)));
  }

  function handleSaveWorkoutChanges() {
    if (!editingWorkout || !editingWorkoutData) return;
    if (!editWorkoutName.trim()) { alert("Enter workout name."); return; }
    if (!editingWorkoutData.exercises || editingWorkoutData.exercises.length === 0) { 
      alert("Add at least one exercise."); 
      return; 
    }
    // Save the edited workout data with updated name
    const updated = workouts.map(w => w.id === editingWorkout ? { ...editingWorkoutData, name: editWorkoutName.trim() } : w);
    onUpdateWorkouts && onUpdateWorkouts(updated);
    setEditingWorkout(null);
    setEditWorkoutName("");
    setEditingWorkoutData(null);
  }

  function handleCancelWorkoutEdit() {
    setEditingWorkout(null);
    setEditWorkoutName("");
    setEditingWorkoutData(null);
  }

  // delete flows
  function handleConfirmDelete() {
    if (!deleteTarget) return;
    if (deleteTarget.type === "exercise") {
      const updatedWorkouts = workouts
        .map(w => {
          if (w.id !== deleteTarget.workoutId) return w;
          const exercises = (w.exercises || []).filter(e => e.id !== deleteTarget.exerciseId);
          return { ...w, exercises };
        });
      
      // Check if any workout becomes empty
      const workoutsWithEmptyExercises = updatedWorkouts.filter(w => (w.exercises || []).length === 0);
      
      if (workoutsWithEmptyExercises.length > 0) {
        const workoutName = workoutsWithEmptyExercises[0].name || "Unnamed";
        const confirmed = window.confirm(
          `"${workoutName}" has no exercises left. Deleting the last exercise will remove the entire workout. Continue?`
        );
        if (!confirmed) {
          setShowDeleteModal(false);
          setDeleteTarget(null);
          return;
        }
        // Delete the entire workout
        const finalWorkouts = updatedWorkouts.filter(w => (w.exercises || []).length > 0);
        onUpdateWorkouts && onUpdateWorkouts(finalWorkouts);
      } else {
        // Just remove the exercise, workout still has exercises
        onUpdateWorkouts && onUpdateWorkouts(updatedWorkouts);
      }
    } else if (deleteTarget.type === "workout") {
      const updatedWorkouts = workouts.filter(w => w.id !== deleteTarget.workoutId);
      onUpdateWorkouts && onUpdateWorkouts(updatedWorkouts);
    }
    setShowDeleteModal(false); setDeleteTarget(null);
  }

  function handleCancelDelete() { setShowDeleteModal(false); setDeleteTarget(null); }

  // month filter handlers
  function openMonthModal() { if (isEditingAnyExercise) return; setShowMonthPicker(true); }
  function handleMonthsChange(arr) { setFilterMonths(arr || []); }
  function removeMonthChip(ym) { setFilterMonths(prev => prev.filter(m => m !== ym)); }

  function toggleCalendarView() {
    setShowCalendarView(prev => !prev);
    setSelectedDate(null);
  }

  return (
    <div className="tab-section" style={{ padding: 12 }}>
      <div className="history-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Workout History</h2>
        <div className="history-controls" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            className="filter-icon-btn"
            title={showCalendarView ? "List view" : "Calendar view"}
            aria-label={showCalendarView ? "List view" : "Calendar view"}
            onClick={toggleCalendarView}
            style={{ width: 40, height: 40, borderRadius: 10, padding: 6, background: showCalendarView ? "rgba(239, 68, 68, 0.1)" : "transparent", border: "none" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-primary)" }}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </button>
          <button
            className="filter-icon-btn"
            title="Filter by month"
            aria-label="Filter by month"
            onClick={openMonthModal}
            disabled={isEditingAnyExercise || showCalendarView}
            style={{ width: 40, height: 40, borderRadius: 10, padding: 6, background: "transparent", border: "none", opacity: showCalendarView ? 0.5 : 1, cursor: showCalendarView ? "not-allowed" : "pointer" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-primary)" }}>
              <path d="M3 5h18" />
              <path d="M6 12h12" />
              <path d="M10 19h4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div style={{ marginTop: 10, padding: 20, textAlign: "center", color: "var(--text-muted)" }}>
          <div className="loading-spinner" style={{ width: 32, height: 32, margin: "0 auto 8px" }}></div>
          <p>Loading workouts...</p>
        </div>
      )}

      {/* Calendar View Component */}
      {showCalendarView && (
        <CalendarView
          workouts={workouts}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          calendarMonth={calendarMonth}
          setCalendarMonth={setCalendarMonth}
          expandedCalendarWorkouts={expandedCalendarWorkouts}
          setExpandedCalendarWorkouts={setExpandedCalendarWorkouts}
          handleEditWorkout={handleEditWorkout}
        />
      )}

      {/* month chips — simple text chips, no Clear all */}
      <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {filterMonths && filterMonths.length > 0 ? (
          <>
            {filterMonths.map(m => (
              <div key={m} className="month-chip" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 16, background: "transparent", color: "var(--text-primary)", fontWeight: 600, border: "1px solid transparent" }}>
                <span>{formatFilterMonth(m)}</span>
                <button className="chip-remove" onClick={() => removeMonthChip(m)} aria-label={`Remove ${m}`} style={{ background: "transparent", border: "none", padding: 4 }}>✕</button>
              </div>
            ))}
          </>
        ) : (
           !showCalendarView && <div style={{ color: "var(--text-muted)", fontSize: 14 }}>Showing all workouts</div>
        )}
      </div>

      {/* MonthPicker modal */}
      {showMonthPicker && (
        <MonthPicker
          value={filterMonths}
          onChange={handleMonthsChange}
          onClose={() => setShowMonthPicker(false)}
          min={getMinFilterMonth()}
          max={getTodayMonth()}
        />
      )}

      {/* filter summary */}
      {!showCalendarView && filterMonths && filterMonths.length > 0 && (
        <div className={`filter-results-summary ${filteredWorkouts.length === 0 ? "filter-results-empty" : ""}`} style={{ marginTop: 12 }}>
          {filteredWorkouts.length === 0 ? (
            <div>No workouts for selected month(s). <button className="link-btn" onClick={() => setFilterMonths([])}>Show all</button></div>
          ) : (
            <div>Found {filteredWorkouts.length} workout{filteredWorkouts.length !== 1 ? "s" : ""} for selected month{filterMonths.length !== 1 ? "s" : ""}</div>
          )}
        </div>
      )}

      {!showCalendarView && filteredWorkouts.length === 0 && (!filterMonths || filterMonths.length === 0) && (
        <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "28px 0" }}>No workouts logged yet.</p>
      )}

      {!showCalendarView && (
        <ul className="workout-list" style={{ padding: 0, margin: "12px 0 0 0", listStyle: "none" }}>
        {filteredWorkouts.map(workout => {
          const isExpanded = expandedWorkouts.includes(workout.id) || (editingExercise && editingExercise.workoutId === workout.id);
          return (
            <li key={workout.id} className="workout-item" style={{ marginBottom: 12 }}>
              <div className="workout-header" style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 12 }}>
                <div
                  className="workout-name-badge"
                  onClick={() => toggleWorkoutExpand(workout.id)}
                  style={{ cursor: "pointer", textAlign: "left", background: "transparent", padding: 0, borderRadius: 0 }}
                >
                  {/* plain text name — override CSS badge coloring via inline styles */}
                  <div className="workout-name-text" style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>{workout.name || "Workout"}</div>
                  <div className="workout-date-info" style={{ marginTop: 6 }}>
                    <div className="workout-date">{formatWorkoutDate(workout)}</div>
                    <div className="workout-save-time">Saved {formatSaveTime(workout.date)}</div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <button
                    type="button"
                    className="btn-edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditWorkout(workout.id, workout.name);
                    }}
                    title="Edit workout"
                    style={{ width: 40, height: 40, borderRadius: 8, padding: 6, background: "transparent", border: "none", color: "var(--text-primary)" }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-primary)" }}>
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="btn-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget({ type: "workout", workoutId: workout.id });
                      setShowDeleteModal(true);
                    }}
                    title="Delete workout"
                    style={{ width: 40, height: 40, borderRadius: 8, padding: 6, background: "transparent", border: "none", color: "var(--text-primary)" }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: "rgba(239, 68, 68, 0.8)" }}>
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => toggleWorkoutExpand(workout.id)}
                    aria-expanded={isExpanded}
                    title={isExpanded ? "Collapse" : "View"}
                    disabled={isEditingAnyExercise && !(editingExercise && editingExercise.workoutId === workout.id)}
                    style={{ width: 40, height: 40, borderRadius: 8, padding: 6, background: "transparent", border: "none", color: "var(--text-primary)" }}
                  >
                    {isExpanded ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-primary)" }}>
                        <polyline points="18 15 12 9 6 15" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-primary)" }}>
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {!isExpanded ? (
                <div style={{ marginTop: 12, color: "var(--text-muted)", fontSize: 13 }}>{(workout.exercises || []).length} exercises completed</div>
              ) : (
                <>
                  <div style={{ marginTop: 12, marginBottom: 8, color: "var(--text-muted)", fontSize: 13 }}>{(workout.exercises || []).length} exercises completed</div>

                  {(workout.exercises || []).map(exercise => {
                    const isEditingThis = editingExercise && editingExercise.workoutId === workout.id && editingExercise.exerciseId === exercise.id;
                    return (
                      <div key={exercise.id} className="exercise-item history-exercise-item" style={{ marginBottom: 12 }}>
                        {isEditingThis ? (
                          <div className="edit-exercise-container">
                            <h4>Edit Exercise</h4>
                            <div className="edit-exercise-name">
                              <input type="text" value={editExerciseName} onChange={e => setEditExerciseName(e.target.value)} placeholder="Exercise name" className="edit-exercise-name-input" />
                            </div>

                            <div className="edit-sets-section">
                              <h5>Sets</h5>
                              {editingSets.length > 0 && (
                                <div className="current-sets-edit">
                                  {editingSets.map((s, idx) => (
                                    <div key={s.id} className="set-item-edit">
                                      <span>Set {idx + 1} • {s.weight} kg × {s.reps} reps</span>
                                      <button className="remove-set-btn" onClick={() => handleRemoveSetFromEdit(s.id)}>Remove</button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div className="add-set-form">
                                <div className="weight-input-wrapper">
                                  <input type="number" placeholder="Weight" value={newSetWeight} onChange={e => setNewSetWeight(e.target.value)} min={0} step={0.5} className="add-set-input" />
                                  <span className="weight-suffix">kg</span>
                                </div>
                                <div className="reps-input-wrapper">
                                  <input type="number" placeholder="Reps" value={newSetReps} onChange={e => setNewSetReps(e.target.value)} min={1} className="add-set-input" />
                                  <span className="reps-suffix">reps</span>
                                </div>
                                <button className="btn-primary" onClick={handleAddSetToEdit}>Add Set</button>
                              </div>
                            </div>

                            <div className="edit-exercise-actions">
                              <button className="btn-success" onClick={handleSaveExerciseChanges}>Save Changes</button>
                              <button className="btn-secondary" onClick={handleCancelExerciseEdit}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="exercise-header">
                              <h4>{exercise.name}</h4>
                            </div>

                            <ul className="sets-list">
                              {(exercise.sets || []).map((s, i) => <li key={s.id}>Set {i+1} • {s.weight} kg × {s.reps} reps</li>)}
                            </ul>
                          </>
                        )}
                      </div>
                    );
                  })}

                  {editingExercise && editingExercise.workoutId === workout.id && editingExercise.exerciseId === null && (
                    <div className="exercise-item history-exercise-item" style={{ marginBottom: 12 }}>
                      <div className="edit-exercise-container">
                        <h4>Add New Exercise</h4>
                        <div className="edit-exercise-name">
                          <input type="text" value={editExerciseName} onChange={e => setEditExerciseName(e.target.value)} placeholder="Exercise name" className="edit-exercise-name-input" />
                        </div>

                        <div className="edit-sets-section">
                          <h5>Sets</h5>
                          {editingSets.length > 0 && (
                            <div className="current-sets-edit">
                              {editingSets.map((s, idx) => (
                                <div key={s.id} className="set-item-edit">
                                  <span>Set {idx + 1} • {s.weight} kg × {s.reps} reps</span>
                                  <button className="remove-set-btn" onClick={() => handleRemoveSetFromEdit(s.id)}>Remove</button>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="add-set-form">
                            <div className="weight-input-wrapper">
                              <input type="number" placeholder="Weight" value={newSetWeight} onChange={e => setNewSetWeight(e.target.value)} min={0} step={0.5} className="add-set-input" />
                              <span className="weight-suffix">kg</span>
                            </div>
                            <div className="reps-input-wrapper">
                              <input type="number" placeholder="Reps" value={newSetReps} onChange={e => setNewSetReps(e.target.value)} min={1} className="add-set-input" />
                              <span className="reps-suffix">reps</span>
                            </div>
                            <button className="btn-primary" onClick={handleAddSetToEdit}>Add Set</button>
                          </div>
                        </div>

                        <div className="edit-exercise-actions">
                          <button className="btn-success" onClick={handleSaveExerciseChanges}>Save Exercise</button>
                          <button className="btn-secondary" onClick={handleCancelExerciseEdit}>Cancel</button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </li>
          );
        })}
      </ul>
      )}

      {showDeleteModal && (
        <div className="modal-overlay" onClick={handleCancelDelete}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{deleteTarget?.type === "workout" ? "Delete Workout" : "Delete Exercise"}</h3>
              <p>{deleteTarget?.type === "workout"
                ? `Are you sure you want to delete the workout "${deleteTarget?.workoutName}"? This will remove all exercises.`
                : `Are you sure you want to delete "${deleteTarget?.exerciseName}"? This cannot be undone.`}
              </p>
            </div>
            <div className="modal-actions">
              <button className="btn-modal-secondary" onClick={handleCancelDelete}>Cancel</button>
              <button className="btn-modal-primary" onClick={handleConfirmDelete}>{deleteTarget?.type === "workout" ? "Delete Workout" : "Delete Exercise"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal for Calendar View */}
      {showCalendarView && editingExercise && (
        <div className="modal-overlay" onClick={handleCancelExerciseEdit}>
          <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxHeight: "80vh", overflowY: "auto" }}>
            <div className="modal-header">
              <h3>{editingExercise.exerciseId ? "Edit Exercise" : "Add New Exercise"}</h3>
            </div>
            <div style={{ padding: 16 }}>
              {/* Show existing exercises if not editing one */}
              {!editingExercise.exerciseId && getWorkoutsForDate(new Date(selectedDate)).find(w => w.id === editingExercise.workoutId)?.exercises && (
                <div style={{ marginBottom: 16, maxHeight: 300, overflowY: "auto" }}>
                  <h4 style={{ marginBottom: 12, color: "var(--text-primary)" }}>Existing Exercises - Click to Edit</h4>
                  {getWorkoutsForDate(new Date(selectedDate)).find(w => w.id === editingExercise.workoutId)?.exercises?.map(exercise => (
                    <button
                      key={exercise.id}
                      type="button"
                      onClick={() => handleEditExercise(editingExercise.workoutId, exercise)}
                      style={{ 
                        width: "100%",
                        padding: 12, 
                        background: "var(--bg-secondary)", 
                        borderRadius: 8, 
                        marginBottom: 8, 
                        cursor: "pointer",
                        border: "1px solid var(--border-light)",
                        textAlign: "left",
                        transition: "all 0.2s ease"
                      }}
                      onMouseOver={(e) => e.target.style.background = "rgba(239, 68, 68, 0.1)"}
                      onMouseOut={(e) => e.target.style.background = "var(--bg-secondary)"}
                    >
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
                        {exercise.name}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {(exercise.sets || []).length} sets • Click to edit
                      </div>
                    </button>
                  ))}
                  <button 
                    type="button"
                    onClick={() => setEditingExercise({ workoutId: editingExercise.workoutId, exerciseId: null })}
                    style={{
                      width: "100%",
                      padding: 10,
                      background: "var(--primary-color, #3b82f6)",
                      color: "white",
                      border: "none",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontWeight: 600,
                      marginTop: 12
                    }}
                  >
                    + Add New Exercise
                  </button>
                </div>
              )}

              {/* Edit form */}
              <div className="edit-exercise-name" style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>Exercise Name</label>
                <input 
                  type="text" 
                  value={editExerciseName} 
                  onChange={e => setEditExerciseName(e.target.value)} 
                  placeholder="Exercise name" 
                  className="edit-exercise-name-input"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border-light)", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}
                />
              </div>

              <div className="edit-sets-section" style={{ marginBottom: 16 }}>
                <h4 style={{ marginBottom: 12, color: "var(--text-primary)" }}>Sets</h4>
                {editingSets.length > 0 && (
                  <div className="current-sets-edit" style={{ marginBottom: 12 }}>
                    {editingSets.map((s, idx) => (
                      <div key={s.id} className="set-item-edit" style={{ padding: 8, background: "var(--bg-secondary)", borderRadius: 8, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "var(--text-primary)" }}>Set {idx + 1} • {s.weight} kg × {s.reps} reps</span>
                        <button type="button" className="remove-set-btn" onClick={() => handleRemoveSetFromEdit(s.id)} style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", padding: 4 }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="add-set-form" style={{ padding: 12, background: "var(--bg-secondary)", borderRadius: 8, marginBottom: 12 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, alignItems: "center" }}>
                    <div className="weight-input-wrapper">
                      <input 
                        type="number" 
                        placeholder="Weight" 
                        value={newSetWeight} 
                        onChange={e => setNewSetWeight(e.target.value)} 
                        min={0} 
                        step={0.5} 
                        className="add-set-input"
                        style={{ width: "100%", padding: "8px", borderRadius: 6, border: "1px solid var(--border-light)", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}
                      />
                    </div>
                    <div className="reps-input-wrapper">
                      <input 
                        type="number" 
                        placeholder="Reps" 
                        value={newSetReps} 
                        onChange={e => setNewSetReps(e.target.value)} 
                        min={1} 
                        className="add-set-input"
                        style={{ width: "100%", padding: "8px", borderRadius: 6, border: "1px solid var(--border-light)", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}
                      />
                    </div>
                    <button type="button" className="btn-primary" onClick={handleAddSetToEdit} style={{ padding: "8px 12px" }}>Add Set</button>
                  </div>
                </div>
              </div>

              <div className="edit-exercise-actions" style={{ display: "flex", gap: 8 }}>
                <button type="button" className="btn-success" onClick={handleSaveExerciseChanges} style={{ flex: 1, padding: "10px" }}>Save</button>
                <button type="button" className="btn-secondary" onClick={handleCancelExerciseEdit} style={{ flex: 1, padding: "10px" }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Workout Modal - Complete Workout Editor */}
      {editingWorkout && (
        <div className="modal-overlay" onClick={handleCancelWorkoutEdit}>
          <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxHeight: "95vh", overflowY: "auto", maxWidth: "95%", width: "100%", margin: "0 auto", borderRadius: 12, paddingBottom: 16 }}>
            <div className="modal-header">
              <h3>Edit Workout</h3>
            </div>
            <div style={{ padding: "12px 16px" }}>
              {/* Workout Name */}
              <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid var(--border-light)" }}>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600, color: "var(--text-primary)", fontSize: 13 }}>Workout Name</label>
                <input 
                  type="text" 
                  value={editWorkoutName} 
                  onChange={e => setEditWorkoutName(e.target.value)} 
                  placeholder="E.g., Chest Day, Back & Biceps" 
                  style={{ 
                    width: "100%", 
                    padding: "10px", 
                    borderRadius: 6, 
                    border: "1px solid var(--border-light)", 
                    backgroundColor: "var(--bg-primary)", 
                    color: "var(--text-primary)",
                    boxSizing: "border-box",
                    fontSize: 14
                  }}
                />
              </div>

              {/* Exercises Section */}
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ marginBottom: 10, color: "var(--text-primary)", fontSize: 13, fontWeight: 600 }}>Exercises</h4>
                {editingWorkoutData && (editingWorkoutData?.exercises || []).length > 0 ? (
                  <>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {(editingWorkoutData?.exercises || []).map(exercise => (
                      <div key={exercise.id} style={{ padding: 10, background: "var(--bg-secondary)", borderRadius: 8, border: "1px solid var(--border-light)" }}>
                        <div style={{ marginBottom: 8 }}>
                          <label style={{ display: "block", marginBottom: 4, fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>Exercise Name</label>
                          <input 
                            type="text" 
                            value={exercise.name} 
                            onChange={e => {
                              const updated = {
                                ...editingWorkoutData,
                                exercises: (editingWorkoutData?.exercises || []).map(ex => ex.id === exercise.id ? { ...ex, name: e.target.value } : ex)
                              };
                              setEditingWorkoutData(updated);
                            }}
                            placeholder="Exercise name"
                            style={{ 
                              width: "100%", 
                              padding: 8, 
                              borderRadius: 6, 
                              border: "1px solid var(--border-light)", 
                              backgroundColor: "var(--bg-primary)", 
                              color: "var(--text-primary)",
                              boxSizing: "border-box",
                              fontSize: 12
                            }}
                          />
                        </div>

                        {/* Sets for this exercise */}
                        <div style={{ marginBottom: 10 }}>
                          <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>Sets</label>
                          {(exercise.sets || []).map((set, idx) => (
                              <div key={set.id} style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "center", flexWrap: "wrap" }}>
                                <span style={{ fontSize: 11, color: "var(--text-muted)", minWidth: 40 }}>Set {idx + 1}</span>
                                <input 
                                  type="number" 
                                  value={set.weight} 
                                  onChange={e => {
                                    const updated = {
                                      ...editingWorkoutData,
                                      exercises: (editingWorkoutData?.exercises || []).map(ex => ex.id === exercise.id ? {
                                        ...ex,
                                        sets: (ex.sets || []).map(s => s.id === set.id ? { ...s, weight: Number(e.target.value) || 0 } : s)
                                      } : ex)
                                    };
                                    setEditingWorkoutData(updated);
                                  }}
                                  placeholder="Weight"
                                  step="0.5"
                                  min="0"
                                  style={{ 
                                    flex: 1,
                                    minWidth: 60,
                                    padding: 8, 
                                    borderRadius: 4, 
                                    border: "1px solid var(--border-light)", 
                                    backgroundColor: "var(--bg-primary)", 
                                    color: "var(--text-primary)",
                                    fontSize: 12
                                  }}
                                />
                                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>kg</span>
                                <input 
                                  type="number" 
                                  value={set.reps} 
                                  onChange={e => {
                                    const updated = {
                                      ...editingWorkoutData,
                                      exercises: (editingWorkoutData?.exercises || []).map(ex => ex.id === exercise.id ? {
                                        ...ex,
                                        sets: (ex.sets || []).map(s => s.id === set.id ? { ...s, reps: Number(e.target.value) || 0 } : s)
                                      } : ex)
                                    };
                                    setEditingWorkoutData(updated);
                                  }}
                                  placeholder="Reps"
                                  min="1"
                                  style={{ 
                                    flex: 1,
                                    minWidth: 60,
                                    padding: 8, 
                                    borderRadius: 4, 
                                    border: "1px solid var(--border-light)", 
                                    backgroundColor: "var(--bg-primary)", 
                                    color: "var(--text-primary)",
                                    fontSize: 12
                                  }}
                                />
                                <span style={{ fontSize: 11, color: "var(--text-muted)", minWidth: 35 }}>reps</span>
                                <button 
                                  type="button"
                                  onClick={() => {
                                    const updated = {
                                      ...editingWorkoutData,
                                      exercises: (editingWorkoutData?.exercises || []).map(ex => ex.id === exercise.id ? {
                                        ...ex,
                                        sets: (ex.sets || []).filter(s => s.id !== set.id)
                                      } : ex)
                                    };
                                    setEditingWorkoutData(updated);
                                  }}
                                  style={{ 
                                    padding: "6px 8px", 
                                    background: "rgba(239, 68, 68, 0.1)", 
                                    color: "var(--text-primary)", 
                                    border: "1px solid rgba(239, 68, 68, 0.3)", 
                                    borderRadius: 4, 
                                    cursor: "pointer",
                                    fontSize: 11,
                                    fontWeight: 600,
                                    whiteSpace: "nowrap"
                                  }}
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                        </div>

                        {/* Add Set Button */}
                        <button
                          type="button"
                          onClick={() => {
                            const newSet = { id: generateId(), weight: 0, reps: 0 };
                            const updated = {
                              ...editingWorkoutData,
                              exercises: (editingWorkoutData?.exercises || []).map(ex => ex.id === exercise.id ? {
                                ...ex,
                                sets: [...(ex.sets || []), newSet]
                              } : ex)
                            };
                            setEditingWorkoutData(updated);
                          }}
                          style={{
                            width: "100%",
                            padding: "10px",
                            background: "var(--primary-color, #3b82f6)",
                            color: "white",
                            border: "none",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontSize: 13,
                            fontWeight: 600,
                            marginTop: 8,
                            minHeight: 44
                          }}
                        >
                          + Add Set
                        </button>

                        {/* Delete Exercise Button */}
                        <div style={{ display: "flex", gap: 8 }}>
                          <button 
                            type="button"
                            onClick={() => {
                              const remainingExercises = (editingWorkoutData?.exercises || []).filter(ex => ex.id !== exercise.id);
                              
                              // If this is the last exercise, delete the entire workout
                              if (remainingExercises.length === 0) {
                                const confirmed = window.confirm(
                                  "This is the last exercise in the workout. Deleting it will remove the entire workout. Continue?"
                                );
                                if (!confirmed) return;
                                
                                // Delete the entire workout
                                const updatedWorkouts = workouts.filter(w => w.id !== editingWorkoutData.id);
                                onUpdateWorkouts && onUpdateWorkouts(updatedWorkouts);
                                
                                // Exit edit mode
                                setEditingWorkout(null);
                                setEditingWorkoutData(null);
                                return;
                              }
                              
                              const updated = {
                                ...editingWorkoutData,
                                exercises: remainingExercises
                              };
                              setEditingWorkoutData(updated);
                            }}
                            style={{ 
                              flex: 1,
                              padding: "10px", 
                              background: "rgba(239, 68, 68, 0.1)", 
                              color: "var(--text-primary)", 
                              border: "1px solid rgba(239, 68, 68, 0.3)", 
                              borderRadius: 6, 
                              cursor: "pointer",
                              fontSize: 13,
                              fontWeight: 600,
                              minHeight: 44
                            }}
                          >
                            Delete Exercise
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const newExercise = {
                        id: generateId(),
                        name: "",
                        sets: [{ id: generateId(), weight: 0, reps: 0 }]
                      };
                      const updated = {
                        ...editingWorkoutData,
                        exercises: [...(editingWorkoutData?.exercises || []), newExercise]
                      };
                      setEditingWorkoutData(updated);
                    }}
                    style={{
                      width: "100%",
                      padding: "12px",
                      background: "var(--primary-color, #3b82f6)",
                      color: "white",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 600,
                      marginTop: 12,
                      minHeight: 44
                    }}
                    title="Add a new exercise to this workout"
                  >
                    + Add Exercise
                  </button>
                </> 
                ) : (
                  <div style={{ padding: 12, background: "var(--bg-secondary)", borderRadius: 8, color: "var(--text-muted)", fontSize: 12, textAlign: "center" }}>
                    No exercises yet
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="modal-actions" style={{ display: "flex", gap: 8, padding: "12px 16px", borderTop: "1px solid var(--border-light)", position: "sticky", bottom: 0, background: "var(--bg-primary)" }}>
              <button type="button" className="btn-secondary" onClick={handleCancelWorkoutEdit} style={{ flex: 1, padding: "12px 10px", fontSize: 13, fontWeight: 600, minHeight: 44 }}>Cancel</button>
              <button type="button" className="btn-success" onClick={handleSaveWorkoutChanges} style={{ flex: 1, padding: "12px 10px", fontSize: 13, fontWeight: 600, minHeight: 44 }}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(ViewWorkoutsTab);