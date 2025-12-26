import React, { useState, useEffect, memo } from "react";
import AlertModal from "../Common/AlertModal";
import DeleteModal from "../ViewWorkouts/DeleteModal";
import { useAlert } from "../../hooks/useAlert";

// Dummy exercise templates (import from a constants file in real usage)
const exerciseTemplates = [
  { id: "bench-press", name: "Bench Press", category: "Chest" },
  { id: "squat", name: "Squat", category: "Legs" },
  { id: "deadlift", name: "Deadlift", category: "Back" },
  { id: "pull-ups", name: "Pull-ups", category: "Back" },
  { id: "shoulder-press", name: "Shoulder Press", category: "Shoulders" },
  { id: "barbell-row", name: "Barbell Row", category: "Back" },
  { id: "bicep-curls", name: "Bicep Curls", category: "Arms" },
  { id: "tricep-dips", name: "Tricep Dips", category: "Arms" },
  { id: "leg-press", name: "Leg Press", category: "Legs" },
  { id: "lat-pulldown", name: "Lat Pulldown", category: "Back" },
];

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// SaveConfirmationModal and SetInput
function SaveConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  workoutName,
  selectedDate,
}) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Save "{workoutName.charAt(0).toUpperCase() + workoutName.slice(1)}"</h3>
          <p>
            Save this workout for <strong>{selectedDate}</strong>? Once saved,
            you cannot edit this workout. Make sure all exercises and sets are
            correct.
          </p>
        </div>
        <div className="modal-actions">
          <button className="btn-modal-secondary" onClick={onClose}>
            Edit More
          </button>
          <button className="btn-modal-primary" onClick={onConfirm}>
            Save Workout
          </button>
        </div>
      </div>
    </div>
  );
}

function SetEditModal({
  isOpen,
  set,
  weight,
  setWeight,
  reps,
  setReps,
  onSave,
  onCancel,
}) {
  if (!isOpen || !set) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Set</h3>
        </div>
        <div className="modal-content" style={{ padding: "20px" }}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "600" }}>
              Weight (kg)
            </label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              min={0}
              step={0.5}
              placeholder="Weight"
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid var(--border-light)",
                backgroundColor: "var(--bg-input)",
                color: "var(--text-primary)",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "600" }}>
              Reps
            </label>
            <input
              type="number"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              min={1}
              placeholder="Reps"
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid var(--border-light)",
                backgroundColor: "var(--bg-input)",
                color: "var(--text-primary)",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-modal-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-modal-primary" onClick={onSave}>
            Save Set
          </button>
        </div>
      </div>
    </div>
  );
}

function SetInput({ onAddSet, sets, onRemoveSet, onEditSet }) {
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  function handleSubmit() {
    onAddSet(weight, reps);
    setWeight("");
    setReps("");
  }
  return (
    <div>
      <div className="set-input-form">
        <div className="weight-input-wrapper">
          <input
            type="number"
            placeholder="Weight"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            min={0}
            step={0.5}
            className="weight-input"
          />
          <span className="weight-suffix">kg</span>
        </div>
        <div className="reps-input-wrapper">
          <input
            type="number"
            placeholder="Reps"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            min={1}
            className="reps-input"
          />
          <span className="reps-suffix">reps</span>
        </div>
        <button className="btn-primary" type="button" onClick={handleSubmit}>
          Add Set
        </button>
      </div>
      {sets.length > 0 && (
        <div className="current-sets">
          <h4>Current Sets</h4>
          {sets.map((set, idx) => (
            <div key={set.id} className="set-item">
              <span>
                Set {idx + 1} • {set.weight} kg × {set.reps} reps
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                {onEditSet && (
                  <button
                    type="button"
                    onClick={() => onEditSet(set, "active")}
                    style={{ 
                      padding: "4px 6px", 
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                    title="Edit set"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{color: "var(--text-accent)"}}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onRemoveSet(set.id)}
                  style={{ 
                    padding: "4px 6px", 
                    fontSize: "16px",
                    border: "none",
                    background: "transparent",
                    color: "var(--btn-danger)",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                  title="Delete set"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LogWorkoutTab({
  workoutName,
  setWorkoutName,
  workoutExercises,
  setWorkoutExercises,
  activeExercise,
  setActiveExercise,
  currentSets,
  setCurrentSets,
  onAddWorkout,
}) {
  const { alert, showError, hideAlert } = useAlert();
  const [currentStep, setCurrentStep] = useState(() => {
    const savedStep = localStorage.getItem("logWorkoutStep");
    return savedStep ? parseInt(savedStep, 10) : 1;
  });
  const [exerciseInput, setExerciseInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [editingSets, setEditingSets] = useState([]);
  const [editingName, setEditingName] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [editingSet, setEditingSet] = useState(null);
  const [editingSetWeight, setEditingSetWeight] = useState("");
  const [editingSetReps, setEditingSetReps] = useState("");
  const [editingSetExerciseId, setEditingSetExerciseId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState(null);

  const [selectedDate, setSelectedDate] = useState(() => {
    const savedDate = localStorage.getItem("logWorkoutSelectedDate");
    if (savedDate) {
      return savedDate;
    }
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

  function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Save current step to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("logWorkoutStep", currentStep.toString());
  }, [currentStep]);

  // Save selected date to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("logWorkoutSelectedDate", selectedDate);
  }, [selectedDate]);

  function getMinDate() {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const year = oneYearAgo.getFullYear();
    const month = String(oneYearAgo.getMonth() + 1).padStart(2, "0");
    const day = String(oneYearAgo.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const filteredExercises = exerciseTemplates.filter(
    (ex) =>
      ex.name.toLowerCase().includes(exerciseInput.toLowerCase()) ||
      ex.category.toLowerCase().includes(exerciseInput.toLowerCase())
  );

  function handleContinueToStep2() {
    if (selectedDate > getTodayDate()) {
      showError("Cannot select a future date. Please select today or a past date.");
      return;
    }
    if (!workoutName.trim()) {
      showError("Please enter a workout name");
      return;
    }
    setCurrentStep(2);
  }

  function handleBackToStep1() {
    setCurrentStep(1);
    setActiveExercise(null);
    setCurrentSets([]);
    setEditingExercise(null);
    setEditingSets([]);
    setEditingName("");
    setExerciseInput("");
    setShowSuggestions(false);
  }

  function handleExerciseInputChange(e) {
    const value = e.target.value;
    setExerciseInput(value);
    setShowSuggestions(value.length > 0 && filteredExercises.length > 0);
  }

  function handleExerciseInputFocus() {
    if (exerciseInput.length > 0 && filteredExercises.length > 0) {
      setShowSuggestions(true);
    }
  }

  function handleExerciseInputBlur() {
    setTimeout(() => setShowSuggestions(false), 200);
  }

  function handleSuggestionClick(exerciseName) {
    setExerciseInput(exerciseName);
    setShowSuggestions(false);
  }

  function handleSelectExercise() {
    const exerciseName = exerciseInput.trim();
    if (!exerciseName) {
      showError("Please enter an exercise name");
      return;
    }
    setActiveExercise({
      id: generateId(),
      name: exerciseName,
      sets: [],
    });
    setCurrentSets([]);
    setExerciseInput("");
    setShowSuggestions(false);
  }

  function handleAddSet(weight, reps) {
    const weightNum = Number(weight);
    const repsNum = Number(reps);
    
    if (weight === "" || reps === "" || isNaN(weightNum) || isNaN(repsNum)) {
      showError("Please enter valid weight and reps");
      return;
    }
    if (weightNum < 0 || repsNum < 0) {
      showError("Weight and reps must be positive numbers");
      return;
    }
    if (repsNum === 0) {
      showError("Reps must be at least 1");
      return;
    }
    
    const newSet = {
      id: generateId(),
      weight: weightNum,
      reps: repsNum,
    };
    if (editingExercise) {
      setEditingSets([...editingSets, newSet]);
    } else {
      setCurrentSets([...currentSets, newSet]);
    }
  }

  function handleRemoveSet(setId) {
    if (editingExercise) {
      setEditingSets(editingSets.filter((set) => set.id !== setId));
    } else {
      setCurrentSets(currentSets.filter((set) => set.id !== setId));
    }
  }

  function handleEditSet(set, exerciseId) {
    setEditingSet(set);
    setEditingSetWeight(set.weight.toString());
    setEditingSetReps(set.reps.toString());
    setEditingSetExerciseId(exerciseId);
  }

  function handleSaveEditSet() {
    const weight = parseFloat(editingSetWeight);
    const reps = parseInt(editingSetReps, 10);

    if (!editingSetWeight || !editingSetReps || isNaN(weight) || isNaN(reps)) {
      showError("Please enter valid weight and reps");
      return;
    }
    if (weight <= 0 || reps <= 0) {
      showError("Weight and reps must be positive numbers");
      return;
    }

    // Update the set in the correct array
    if (editingSetExerciseId === "active") {
      // Currently adding sets
      setCurrentSets(
        currentSets.map((s) =>
          s.id === editingSet.id ? { ...s, weight, reps } : s
        )
      );
    } else if (editingSetExerciseId === "editing") {
      // Editing an exercise
      setEditingSets(
        editingSets.map((s) =>
          s.id === editingSet.id ? { ...s, weight, reps } : s
        )
      );
    } else {
      // Editing from saved exercises
      const updatedExercises = workoutExercises.map((ex) =>
        ex.id === editingSetExerciseId
          ? {
              ...ex,
              sets: ex.sets.map((s) =>
                s.id === editingSet.id ? { ...s, weight, reps } : s
              ),
            }
          : ex
      );
      setWorkoutExercises(updatedExercises);
    }

    setEditingSet(null);
    setEditingSetWeight("");
    setEditingSetReps("");
    setEditingSetExerciseId(null);
  }

  function handleCancelEditSet() {
    setEditingSet(null);
    setEditingSetWeight("");
    setEditingSetReps("");
    setEditingSetExerciseId(null);
  }

  function handleFinishExercise() {
    const sets = editingExercise ? editingSets : currentSets;
    if (sets.length === 0) {
      showError("Please add at least one set");
      return;
    }
    const exerciseWithSets = {
      ...(editingExercise || activeExercise),
      name: editingExercise ? editingName : activeExercise.name,
      sets: [...sets],
    };
    if (editingExercise) {
      setWorkoutExercises(
        workoutExercises.map((ex) =>
          ex.id === editingExercise.id ? exerciseWithSets : ex
        )
      );
      setEditingExercise(null);
      setEditingSets([]);
      setEditingName("");
    } else {
      setWorkoutExercises([...workoutExercises, exerciseWithSets]);
      setActiveExercise(null);
      setCurrentSets([]);
    }
  }

  function handleCancelExercise() {
    if (editingExercise) {
      setEditingExercise(null);
      setEditingSets([]);
      setEditingName("");
    } else {
      setActiveExercise(null);
      setCurrentSets([]);
    }
  }
  function handleRemoveExercise(exerciseId) {
    const exercise = workoutExercises.find(ex => ex.id === exerciseId);
    setExerciseToDelete({ id: exerciseId, name: exercise?.name || 'Exercise' });
    setShowDeleteModal(true);
  }

  function handleConfirmDeleteExercise() {
    if (exerciseToDelete?.id) {
      setWorkoutExercises(workoutExercises.filter((ex) => ex.id !== exerciseToDelete.id));
    }
    setShowDeleteModal(false);
    setExerciseToDelete(null);
  }

  function handleCancelDeleteExercise() {
    setShowDeleteModal(false);
    setExerciseToDelete(null);
  }

  function handleEditExercise(exercise) {
    setEditingExercise(exercise);
    setEditingSets([...exercise.sets]);
    setEditingName(exercise.name);
  }

  function handleSaveWorkout() {
    if (selectedDate > getTodayDate()) {
      alert(
        "Cannot save workout for a future date. Please select today or a past date."
      );
      return;
    }
    if (!workoutName.trim()) {
    
      alert("Please enter a workout name");
      return;
    }
    if (workoutExercises.length === 0) {
      alert("Please add at least one exercise to save workout");
      return;
    }
    setShowSaveModal(true);
  }

  function handleConfirmSave() {
    if (selectedDate > getTodayDate()) {
      alert("Cannot save workout for a future date.");
      setShowSaveModal(false);
      return;
    }
    const workoutDate = new Date(selectedDate + "T23:59:59");
    const newWorkout = {
      id: generateId(),
      name: workoutName.trim(),
      date: workoutDate.toISOString(),
      workoutDate: selectedDate,
      exercises: [...workoutExercises],
    };
    onAddWorkout(newWorkout);
    setWorkoutName("");
    setWorkoutExercises([]);
    setActiveExercise(null);
    setCurrentSets([]);
    setSelectedDate(getTodayDate());
    setCurrentStep(1);
    setShowSaveModal(false);
  }

  function formatSelectedDate(dateStr) {
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
      });
    }
  }

  const currentExercise = editingExercise || activeExercise;
  const currentExerciseSets = editingExercise ? editingSets : currentSets;
  const currentExerciseName = editingExercise
    ? editingName
    : activeExercise?.name || "";

  return (
    <div className="tab-section">
      <div className="workout-step-header">
        <h2>Log Workout</h2>
        <div className="step-indicator">
          <div className={`step-item ${currentStep >= 1 ? "active" : ""}`}>
            <span className="step-number">1</span>
            <span className="step-label">Details</span>
          </div>
          <div className="step-divider"></div>
          <div className={`step-item ${currentStep >= 2 ? "active" : ""}`}>
            <span className="step-number">2</span>
            <span className="step-label">Exercises</span>
          </div>
        </div>
      </div>
      {currentStep === 1 && (
        <div className="step-content">
          <div className="workout-date-section">
            <h3>Workout Date</h3>
            <div className="date-input-container">
              <div className="date-input-wrapper">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={getTodayDate()}
                  min={getMinDate()}
                  className="workout-date-input"
                  title="Select today or a past date"
                  aria-label="Select workout date"
                />
                <div className="date-input-overlay">
                  <span className="date-calendar-icon">▦</span>
                </div>
              </div>
              <div className="date-display">
                <span className="date-text">
                  {formatSelectedDate(selectedDate)}
                </span>
                {selectedDate === getTodayDate() && (
                  <span className="today-badge">Current</span>
                )}
              </div>
              <div className="date-restriction-info">
                <p>
                  Select today or any past date. Future dates are not available.
                </p>
              </div>
            </div>
          </div>
          <div className="workout-name-section">
            <h3>Workout Name</h3>
            <input
              type="text"
              placeholder="Enter workout name (e.g., Push Day, Leg Day, etc.)"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              className="workout-name-input"
            />
          </div>
          <div className="step-actions">
            <button
              className="btn-primary continue-btn"
              onClick={handleContinueToStep2}
              disabled={!workoutName.trim() || selectedDate > getTodayDate()}
            >
              Continue to Exercises
            </button>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="step-content">
          <div className="step-summary">
            <div className="summary-item">
              <span className="summary-label">Date</span>
              <span className="summary-value">
                {formatSelectedDate(selectedDate)}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Workout</span>
              <span className="summary-value">{workoutName.charAt(0).toUpperCase() + workoutName.slice(1)}</span>
            </div>
          </div>
          {!currentExercise && (
            <div className="exercise-selection">
              <h3>Select Exercise</h3>
              <div className="exercise-search-container">
                <input
                  type="text"
                  placeholder="Type exercise name or search suggestions..."
                  value={exerciseInput}
                  onChange={handleExerciseInputChange}
                  onFocus={handleExerciseInputFocus}
                  onBlur={handleExerciseInputBlur}
                  className="exercise-search-input"
                />
                <button
                  className="btn-primary exercise-select-btn"
                  onClick={handleSelectExercise}
                  disabled={!exerciseInput.trim()}
                  type="button"
                >
                  Select
                </button>
                {showSuggestions && filteredExercises.length > 0 && (
                  <div className="exercise-suggestions">
                    {filteredExercises.slice(0, 5).map((ex) => (
                      <div
                        key={ex.id}
                        className="exercise-suggestion-item"
                        onClick={() => handleSuggestionClick(ex.name)}
                      >
                        <span className="exercise-suggestion-name">
                          {ex.name}
                        </span>
                        <span className="exercise-suggestion-category">
                          {ex.category}
                        </span>
                      </div>
                    ))}
                    {filteredExercises.length > 5 && (
                      <div className="exercise-suggestions-more">
                        +{filteredExercises.length - 5} more available
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {currentExercise && (
            <div
              className={
                editingExercise ? "editing-exercise" : "active-exercise"
              }
            >
              <h3>{editingExercise ? "Edit Exercise" : "Add Sets"}</h3>
              {editingExercise && (
                <div style={{ marginBottom: "16px" }}>
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    placeholder="Exercise name"
                    style={{ width: "100%" }}
                  />
                </div>
              )}
              <div
                style={{
                  marginBottom: "16px",
                  color: "var(--text-muted)",
                  fontSize: "14px",
                }}
              >
                {currentExerciseName}
              </div>
              <SetInput
                onAddSet={handleAddSet}
                sets={currentExerciseSets}
                onRemoveSet={handleRemoveSet}
                onEditSet={handleEditSet}
              />
              <div style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
                <button
                  className="btn-success"
                  type="button"
                  onClick={handleFinishExercise}
                >
                  {editingExercise ? "Save Changes" : "Complete Exercise"}
                </button>
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={handleCancelExercise}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {workoutExercises.length > 0 && (
            <div className="workout-exercises">
              <h3>
                {workoutName.charAt(0).toUpperCase() + workoutName.slice(1)} • {workoutExercises.length} exercises
              </h3>
              {workoutExercises.map((exercise) => (
                <div key={exercise.id} className="exercise-item">
                  <h4>
                    {exercise.name}
                    <div className="exercise-actions">
                      <button
                        type="button"
                        onClick={() => handleEditExercise(exercise)}
                        disabled={!!currentExercise}
                        style={{ 
                          padding: "4px 6px", 
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          opacity: !!currentExercise ? 0.5 : 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0
                        }}
                        title="Edit exercise"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{color: "var(--text-accent)"}}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveExercise(exercise.id)}
                        disabled={!!currentExercise}
                        style={{ 
                          padding: "4px 6px", 
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          opacity: !!currentExercise ? 0.5 : 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0
                        }}
                        title="Delete exercise"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{color: "rgba(239, 68, 68, 0.8)"}}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                      </button>
                    </div>
                  </h4>
                  <ul className="sets-list">
                    {exercise.sets.map((set, idx) => (
                      <li
                        key={set.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          transition: "all 0.2s ease",
                          backgroundColor: "transparent",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "var(--bg-tertiary)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <span>Set {idx + 1} • {set.weight} kg × {set.reps} reps</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <div className="workout-final-actions">
                <button
                  className="btn-success save-workout-btn"
                  type="button"
                  onClick={handleSaveWorkout}
                  disabled={!!currentExercise}
                >
                  Save Workout
                </button>
                <button
                  className="btn-secondary back-to-step1-btn"
                  type="button"
                  onClick={handleBackToStep1}
                  disabled={!!currentExercise}
                >
                  Back to Details
                </button>
              </div>
            </div>
          )}

          {workoutExercises.length === 0 && !currentExercise && (
            <div className="step-actions">
              <button
                className="btn-secondary back-to-step1-btn"
                type="button"
                onClick={handleBackToStep1}
              >
                Back to Details
              </button>
            </div>
          )}
        </div>
      )}

      <SaveConfirmationModal
        isOpen={showSaveModal}
        workoutName={workoutName}
        selectedDate={formatSelectedDate(selectedDate)}
        onClose={() => setShowSaveModal(false)}
        onConfirm={handleConfirmSave}
      />

      <SetEditModal
        isOpen={!!editingSet}
        set={editingSet}
        weight={editingSetWeight}
        setWeight={setEditingSetWeight}
        reps={editingSetReps}
        setReps={setEditingSetReps}
        onSave={handleSaveEditSet}
        onCancel={handleCancelEditSet}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        showDeleteModal={showDeleteModal}
        deleteTarget={{ type: "exercise", exerciseName: exerciseToDelete?.name }}
        onConfirm={handleConfirmDeleteExercise}
        onCancel={handleCancelDeleteExercise}
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

export default memo(LogWorkoutTab);
