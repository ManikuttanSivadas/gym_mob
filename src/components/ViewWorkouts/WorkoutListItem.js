import React from "react";
import ExerciseItem from "./ExerciseItem";

function generateId() {
  return Date.now().toString() + Math.random().toString(36).slice(2, 9);
}

function WorkoutListItem({ 
  workout, 
  isExpanded, 
  isEditingAnyExercise,
  editingExercise,
  editExerciseName,
  setEditExerciseName,
  editingSets,
  setEditingSets,
  newSetWeight,
  setNewSetWeight,
  newSetReps,
  setNewSetReps,
  formatWorkoutDate,
  formatSaveTime,
  onToggleExpand,
  onEditExercise,
  onEditWorkout,
  onDeleteWorkout,
  onAddSet,
  onRemoveSet,
  onSaveExerciseChanges,
  onCancelExerciseEdit,
  handleEditExercise,
  onShowError = (msg) => alert(msg)
}) {
  const handleAddSetToEdit = () => {
    const weightNum = Number(newSetWeight);
    const repsNum = Number(newSetReps);
    
    if (newSetWeight === "" || newSetReps === "" || isNaN(weightNum) || isNaN(repsNum)) { 
      onShowError("Enter valid weight and reps."); 
      return; 
    }
    if (weightNum < 0 || repsNum < 0) {
      onShowError("Weight and reps must be positive numbers.");
      return;
    }
    if (repsNum === 0) {
      onShowError("Reps must be at least 1.");
      return;
    }
    
    const set = { id: generateId(), weight: weightNum, reps: repsNum };
    setEditingSets(prev => [...prev, set]);
    setNewSetWeight(""); setNewSetReps("");
  };

  const handleRemoveSetFromEdit = (setId) => {
    setEditingSets(prev => prev.filter(s => s.id !== setId));
  };

  return (
    <li className="workout-item" style={{ marginBottom: 12 }}>
      <div className="workout-header" style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 12 }}>
        <div
          className="workout-name-badge"
          onClick={() => onToggleExpand(workout.id)}
          style={{ cursor: "pointer", textAlign: "left", background: "transparent", padding: 0, borderRadius: 0 }}
        >
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
              onEditWorkout(workout.id, workout.name);
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
              onDeleteWorkout(workout.id, workout.name);
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
            onClick={() => onToggleExpand(workout.id)}
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
              <ExerciseItem
                key={exercise.id}
                exercise={exercise}
                isEditingThis={isEditingThis}
                editExerciseName={editExerciseName}
                setEditExerciseName={setEditExerciseName}
                editingSets={editingSets}
                newSetWeight={newSetWeight}
                setNewSetWeight={setNewSetWeight}
                newSetReps={newSetReps}
                setNewSetReps={setNewSetReps}
                onEditExercise={() => onEditExercise(workout.id, exercise)}
                onAddSet={handleAddSetToEdit}
                onRemoveSet={handleRemoveSetFromEdit}
                onSaveExercise={onSaveExerciseChanges}
                onCancelEdit={onCancelExerciseEdit}
              />
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
                  <button className="btn-success" onClick={onSaveExerciseChanges}>Save Exercise</button>
                  <button className="btn-secondary" onClick={onCancelExerciseEdit}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </li>
  );
}

export default WorkoutListItem;
