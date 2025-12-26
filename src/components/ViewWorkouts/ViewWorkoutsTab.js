import React, { useEffect, useMemo, useState, memo } from "react";
import CalendarView from "./CalendarView";
import MonthPickerModal from "./MonthPickerModal";
import FilterControls from "./FilterControls";
import DeleteModal from "./DeleteModal";
import WorkoutListItem from "./WorkoutListItem";
import ExerciseEditModal from "./ExerciseEditModal";
import WorkoutEditModal from "./WorkoutEditModal";
import AlertModal from "../Common/AlertModal";
import { useAlert } from "../../hooks/useAlert";

function generateId() {
  return Date.now().toString() + Math.random().toString(36).slice(2, 9);
}

function ViewWorkoutsTab({ workouts = [], onUpdateWorkouts, isLoading = false }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { alert, showError, hideAlert } = useAlert();

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

  const [showCalendarView, setShowCalendarView] = useState(() => {
    const saved = localStorage.getItem('viewWorkouts_showCalendarView');
    return saved ? JSON.parse(saved) : true;
  });
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [expandedCalendarWorkouts, setExpandedCalendarWorkouts] = useState([]);

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

  function handleSaveExerciseChanges() {
    if (!editingExercise) return;
    if (!editExerciseName.trim()) { showError("Enter exercise name."); return; }
    if (editingSets.length === 0) { showError("Add at least one set."); return; }
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
    if (!editWorkoutName.trim()) { showError("Enter workout name."); return; }
    if (!editingWorkoutData.exercises || editingWorkoutData.exercises.length === 0) { 
      showError("Add at least one exercise."); 
      return; 
    }
    
    // Validate all exercises have names and all sets have weight and reps
    for (let i = 0; i < editingWorkoutData.exercises.length; i++) {
      const exercise = editingWorkoutData.exercises[i];
      
      // Check exercise name
      if (!exercise.name || exercise.name.trim() === "") {
        showError("Empty record: Exercise name is mandatory.");
        return;
      }
      
      // Check if exercise has at least one set
      if (!exercise.sets || exercise.sets.length === 0) {
        showError(`Exercise "${exercise.name}": Please add at least one set.`);
        return;
      }
      
      // Check all sets have valid weight and reps
      for (let j = 0; j < exercise.sets.length; j++) {
        const set = exercise.sets[j];
        
        if (set.weight === "" || set.weight === null || set.weight === undefined || isNaN(Number(set.weight))) {
          showError(`Exercise "${exercise.name}" - Set ${j + 1}: Weight is mandatory.`);
          return;
        }
        
        if (set.reps === "" || set.reps === null || set.reps === undefined || isNaN(Number(set.reps))) {
          showError(`Exercise "${exercise.name}" - Set ${j + 1}: Reps is mandatory.`);
          return;
        }
        
        if (Number(set.weight) < 0 || Number(set.reps) < 0) {
          showError(`Exercise "${exercise.name}" - Set ${j + 1}: Weight and reps must be positive.`);
          return;
        }
        
        if (Number(set.reps) === 0) {
          showError(`Exercise "${exercise.name}" - Set ${j + 1}: Reps must be at least 1.`);
          return;
        }
      }
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
        <FilterControls 
          showCalendarView={showCalendarView}
          onToggleCalendarView={toggleCalendarView}
          onOpenMonthFilter={openMonthModal}
          isEditingAnyExercise={isEditingAnyExercise}
          filterDisabled={showCalendarView}
        />
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
          handleDeleteWorkout={(workoutId, workoutName) => {
            setDeleteTarget({ type: "workout", workoutId, workoutName });
            setShowDeleteModal(true);
          }}
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
        <MonthPickerModal
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
            <WorkoutListItem
              key={workout.id}
              workout={workout}
              isExpanded={isExpanded}
              isEditingAnyExercise={isEditingAnyExercise}
              editingExercise={editingExercise}
              editExerciseName={editExerciseName}
              setEditExerciseName={setEditExerciseName}
              editingSets={editingSets}
              setEditingSets={setEditingSets}
              newSetWeight={newSetWeight}
              setNewSetWeight={setNewSetWeight}
              newSetReps={newSetReps}
              setNewSetReps={setNewSetReps}
              formatWorkoutDate={formatWorkoutDate}
              formatSaveTime={formatSaveTime}
              onToggleExpand={toggleWorkoutExpand}
              onEditExercise={handleEditExercise}
              onEditWorkout={handleEditWorkout}
              onDeleteWorkout={(workoutId, workoutName) => {
                setDeleteTarget({ type: "workout", workoutId, workoutName });
                setShowDeleteModal(true);
              }}
              onAddSet={() => {}}
              onRemoveSet={() => {}}
              onSaveExerciseChanges={handleSaveExerciseChanges}
              onCancelExerciseEdit={handleCancelExerciseEdit}
              handleEditExercise={handleEditExercise}
              onShowError={showError}
            />
          );
        })}
      </ul>
      )}

      {/* Delete Modal */}
      <DeleteModal
        showDeleteModal={showDeleteModal}
        deleteTarget={deleteTarget}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      {/* Exercise Edit Modal for Calendar View */}
      <ExerciseEditModal
        isOpen={showCalendarView && !!editingExercise}
        editingExercise={editingExercise}
        editExerciseName={editExerciseName}
        setEditExerciseName={setEditExerciseName}
        editingSets={editingSets}
        setEditingSets={setEditingSets}
        newSetWeight={newSetWeight}
        setNewSetWeight={setNewSetWeight}
        newSetReps={newSetReps}
        setNewSetReps={setNewSetReps}
        onSave={handleSaveExerciseChanges}
        onCancel={handleCancelExerciseEdit}
        getWorkoutsForDate={getWorkoutsForDate}
        selectedDate={selectedDate}
        handleEditExercise={handleEditExercise}
        onShowError={showError}
      />

      {/* Edit Workout Modal */}
      <WorkoutEditModal
        isOpen={!!editingWorkout}
        editingWorkoutData={editingWorkoutData}
        editWorkoutName={editWorkoutName}
        setEditWorkoutName={setEditWorkoutName}
        setEditingWorkoutData={setEditingWorkoutData}
        workouts={workouts}
        onSave={handleSaveWorkoutChanges}
        onCancel={handleCancelWorkoutEdit}
      />

      {/* Alert Modal */}
      {alert && (
        <AlertModal
          message={alert.message}
          type={alert.type}
          autoCloseDuration={alert.autoCloseDuration}
          onClose={hideAlert}
        />
      )}
    </div>
  );
}

export default memo(ViewWorkoutsTab);