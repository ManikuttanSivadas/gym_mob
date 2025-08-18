import React, { useState } from "react";

// Helper function
function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function ViewWorkoutsTab({ workouts = [], onUpdateWorkouts }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [filterDate, setFilterDate] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);

  // Exercise editing states only
  const [editingExercise, setEditingExercise] = useState(null);
  const [editExerciseName, setEditExerciseName] = useState("");
  const [editingSets, setEditingSets] = useState([]);
  const [newSetWeight, setNewSetWeight] = useState("");
  const [newSetReps, setNewSetReps] = useState("");

  function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function getMinFilterDate() {
    if (workouts.length === 0) {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const year = oneYearAgo.getFullYear();
      const month = String(oneYearAgo.getMonth() + 1).padStart(2, "0");
      const day = String(oneYearAgo.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
    const oldestWorkout = workouts.reduce((oldest, workout) => {
      const workoutDate =
        workout.workoutDate || workout.date.split("T")[0];
      return workoutDate <
        (oldest.workoutDate || oldest.date.split("T"))
        ? workout
        : oldest;
    });
    return oldestWorkout.workoutDate || oldestWorkout.date.split("T");
  }

  const filteredWorkouts = filterDate
    ? workouts.filter(workout => {
        const workoutDate = workout.workoutDate || workout.date.split("T");
        return workoutDate === filterDate;
      })
    : workouts;

  const isEmptyFilterDate = filterDate && filteredWorkouts.length === 0;

  function formatWorkoutDate(workout) {
    const dateToUse = workout.workoutDate || workout.date;
    const date = new Date(
      workout.workoutDate ? dateToUse + "T12:00:00" : dateToUse
    );

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const workoutDateOnly = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const todayOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const yesterdayOnly = new Date(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate()
    );

    if (workoutDateOnly.getTime() === todayOnly.getTime()) {
      return "Today";
    } else if (workoutDateOnly.getTime() === yesterdayOnly.getTime()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined
      });
    }
  }

  function formatFilterDate(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr + "T12:00:00");
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const selectedParts = dateStr.split("-");
    const selectedYear = parseInt(selectedParts[0]);
    const selectedMonth = parseInt(selectedParts[1]);
    const selectedDay = parseInt(selectedParts);

    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth() + 1;
    const todayDay = today.getDate();

    const yesterdayYear = yesterday.getFullYear();
    const yesterdayMonth = yesterday.getMonth() + 1;
    const yesterdayDay = yesterday.getDate();

    if (
      selectedYear === todayYear &&
      selectedMonth === todayMonth &&
      selectedDay === todayDay
    ) {
      return "Today";
    } else if (
      selectedYear === yesterdayYear &&
      selectedMonth === yesterdayMonth &&
      selectedDay === yesterdayDay
    ) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: selectedYear !== todayYear ? "numeric" : undefined
      });
    }
  }

  function formatSaveTime(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  // Exercise editing functions
  function handleEditExercise(workoutId, exercise) {
    setEditingExercise({ workoutId, exerciseId: exercise.id });
    setEditExerciseName(exercise.name);
    setEditingSets([...exercise.sets]);
  }

  function handleAddSetToEdit() {
    if (!newSetWeight || !newSetReps) {
      alert("Please enter both weight and reps");
      return;
    }
    const newSet = {
      id: generateId(),
      weight: Number(newSetWeight),
      reps: Number(newSetReps)
    };
    setEditingSets([...editingSets, newSet]);
    setNewSetWeight("");
    setNewSetReps("");
  }

  function handleRemoveSetFromEdit(setId) {
    setEditingSets(editingSets.filter(set => set.id !== setId));
  }

  function handleSaveExerciseChanges() {
    if (!editExerciseName.trim()) {
      alert("Please enter an exercise name");
      return;
    }
    if (editingSets.length === 0) {
      alert("Please add at least one set");
      return;
    }
    const updatedWorkouts = workouts.map(workout => {
      if (workout.id === editingExercise.workoutId) {
        const updatedExercises = workout.exercises.map(exercise => {
          if (exercise.id === editingExercise.exerciseId) {
            return {
              ...exercise,
              name: editExerciseName.trim(),
              sets: [...editingSets]
            };
          }
          return exercise;
        });
        return { ...workout, exercises: updatedExercises };
      }
      return workout;
    });
    onUpdateWorkouts(updatedWorkouts);
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
    setDeleteTarget({
      workoutId,
      exerciseId,
      exerciseName,
      type: "exercise"
    });
    setShowDeleteModal(true);
  }

//   function handleDeleteWorkout(workoutId, workoutName) {
//     setDeleteTarget({
//       workoutId,
//       workoutName,
//       type: "workout"
//     });
//     setShowDeleteModal(true);
//   }

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    if (deleteTarget.type === "exercise") {
      const updatedWorkouts = workouts
        .map(workout => {
          if (workout.id === deleteTarget.workoutId) {
            const updatedExercises = workout.exercises.filter(
              exercise => exercise.id !== deleteTarget.exerciseId
            );
            return {
              ...workout,
              exercises: updatedExercises
            };
          }
          return workout;
        })
        .filter(workout => workout.exercises.length > 0);
      onUpdateWorkouts(updatedWorkouts);
    } else if (deleteTarget.type === "workout") {
      const updatedWorkouts = workouts.filter(
        workout => workout.id !== deleteTarget.workoutId
      );
      onUpdateWorkouts(updatedWorkouts);
    }
    setShowDeleteModal(false);
    setDeleteTarget(null);
  }

  function handleCancelDelete() {
    setShowDeleteModal(false);
    setDeleteTarget(null);
  }

  function clearDateFilter() {
    setFilterDate("");
  }

  const isEditingAnyExercise = !!editingExercise;

  return (
    <div className="tab-section">
      <div className="history-header">
        <h2>Workout History</h2>
        <div className="history-controls">
          <button
            className="btn-secondary filter-toggle-btn"
            onClick={() => setShowDateFilter(!showDateFilter)}
            disabled={isEditingAnyExercise}
          >
            Filter by Date
          </button>
        </div>
      </div>

      {showDateFilter && (
        <div className="date-filter-section">
          <h3>Filter by Date</h3>
          <div className="date-filter-container">
            <div className="date-filter-input-wrapper">
              <input
                type="date"
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                max={getTodayDate()}
                min={getMinFilterDate()}
                className={`date-filter-input ${
                  isEmptyFilterDate ? "date-filter-empty" : ""
                }`}
                title="Select a date to filter workouts"
                disabled={isEditingAnyExercise}
              />
              <div className="date-filter-overlay">
                <span className="date-filter-icon">▦</span>
              </div>
            </div>
            {filterDate && (
              <div
                className={`date-filter-display ${
                  isEmptyFilterDate ? "date-filter-display-empty" : ""
                }`}
              >
                <span className="filter-text">
                  {isEmptyFilterDate
                    ? `No workouts found for ${formatFilterDate(filterDate)}`
                    : `Showing workouts from ${formatFilterDate(filterDate)}`}
                </span>
                <button
                  className="btn-danger clear-filter-btn"
                  onClick={clearDateFilter}
                  disabled={isEditingAnyExercise}
                >
                  Clear
                </button>
              </div>
            )}
            {!filterDate && (
              <div className="date-filter-help">
                <p>
                  Select a date above to filter workouts, or leave empty to show
                  all workouts
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {filterDate && (
        <div
          className={`filter-results-summary ${
            isEmptyFilterDate ? "filter-results-empty" : ""
          }`}
        >
          {filteredWorkouts.length === 0 ? (
            <p>
              No workouts found for {formatFilterDate(filterDate)}.{" "}
              <button
                className="link-btn"
                onClick={clearDateFilter}
                disabled={isEditingAnyExercise}
              >
                Show all workouts
              </button>
            </p>
          ) : (
            <p>
              Found {filteredWorkouts.length} workout
              {filteredWorkouts.length !== 1 ? "s" : ""} for{" "}
              {formatFilterDate(filterDate)}
            </p>
          )}
        </div>
      )}

      {filteredWorkouts.length === 0 && !filterDate && (
        <p
          style={{
            color: "var(--text-muted)",
            textAlign: "center",
            padding: "32px 0"
          }}
        >
          No workouts logged yet. Start by logging your first workout.
        </p>
      )}

      <ul className="workout-list">
        {filteredWorkouts.map(workout => (
          <li key={workout.id} className="workout-item">
            <div className="workout-header">
              <div className="workout-name-badge">
                {workout.name || "Workout"}
              </div>
              <div className="workout-date-info">
                <div className="workout-date">
                  {formatWorkoutDate(workout)}
                </div>
                <div className="workout-save-time">
                  Saved {formatSaveTime(workout.date)}
                </div>
              </div>
            </div>

            <div
              style={{
                marginBottom: "12px",
                color: "var(--text-muted)",
                fontSize: "13px"
              }}
            >
              {workout.exercises.length} exercises completed
            </div>

            {workout.exercises.map(exercise => (
              <div
                key={exercise.id}
                className="exercise-item history-exercise-item"
              >
                {editingExercise &&
                editingExercise.workoutId === workout.id &&
                editingExercise.exerciseId === exercise.id ? (
                  <div className="edit-exercise-container">
                    <h4>Edit Exercise</h4>
                    <div className="edit-exercise-name">
                      <input
                        type="text"
                        value={editExerciseName}
                        onChange={e => setEditExerciseName(e.target.value)}
                        placeholder="Exercise name"
                        className="edit-exercise-name-input"
                      />
                    </div>
                    <div className="edit-sets-section">
                      <h5>Sets</h5>
                      {editingSets.length > 0 && (
                        <div className="current-sets-edit">
                          {editingSets.map((set, idx) => (
                            <div key={set.id} className="set-item-edit">
                              <span>
                                Set {idx + 1} • {set.weight} kg × {set.reps} reps
                              </span>
                              <button
                                className="btn-danger remove-set-btn"
                                onClick={() => handleRemoveSetFromEdit(set.id)}
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="add-set-form">
                        <input
                          type="number"
                          placeholder="Weight (kg)"
                          value={newSetWeight}
                          onChange={e => setNewSetWeight(e.target.value)}
                          min={0}
                          step={0.5}
                          className="add-set-input"
                        />
                        <input
                          type="number"
                          placeholder="Reps"
                          value={newSetReps}
                          onChange={e => setNewSetReps(e.target.value)}
                          min={1}
                          className="add-set-input"
                        />
                        <button
                          className="btn-primary"
                          onClick={handleAddSetToEdit}
                        >
                          Add Set
                        </button>
                      </div>
                    </div>
                    <div className="edit-exercise-actions">
                      <button
                        className="btn-success"
                        onClick={handleSaveExerciseChanges}
                      >
                        Save Changes
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={handleCancelExerciseEdit}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="exercise-header">
                      <h4>{exercise.name}</h4>
                      <button
                        className="btn-edit exercise-edit-btn"
                        onClick={() =>
                          handleEditExercise(workout.id, exercise)
                        }
                        disabled={isEditingAnyExercise}
                        title="Edit exercise"
                      >
                        Edit
                      </button>
                    </div>
                    <ul className="sets-list">
                      {exercise.sets.map((set, idx) => (
                        <li key={set.id}>
                          Set {idx + 1} • {set.weight} kg × {set.reps} reps
                        </li>
                      ))}
                    </ul>
                    <button
                      className="btn-danger exercise-delete-btn"
                      onClick={() =>
                        handleDeleteExercise(workout.id, exercise.id, exercise.name)
                      }
                      title="Delete this exercise"
                      disabled={isEditingAnyExercise}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            ))}
          </li>
        ))}
      </ul>
      {showDeleteModal && (
        <div className="modal-overlay" onClick={handleCancelDelete}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {deleteTarget?.type === "workout" ? "Delete Workout" : "Delete Exercise"}
              </h3>
              <p>
                {deleteTarget?.type === "workout"
                  ? `Are you sure you want to delete the workout "${deleteTarget?.workoutName}"? This will permanently remove all exercises and data from this workout.`
                  : `Are you sure you want to delete "${deleteTarget?.exerciseName}" from this workout? This action cannot be undone.`}
              </p>
            </div>
            <div className="modal-actions">
              <button
                className="btn-modal-secondary"
                onClick={handleCancelDelete}
              >
                Cancel
              </button>
              <button
                className="btn-modal-primary"
                onClick={handleConfirmDelete}
              >
                {deleteTarget?.type === "workout"
                  ? "Delete Workout"
                  : "Delete Exercise"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewWorkoutsTab;
