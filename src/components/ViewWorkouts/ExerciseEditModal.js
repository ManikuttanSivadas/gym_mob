import React from "react";
import "./styles/ExerciseEditModal.css";

function generateId() {
  return Date.now().toString() + Math.random().toString(36).slice(2, 9);
}

function ExerciseEditModal({ 
  isOpen, 
  editingExercise, 
  editExerciseName, 
  setEditExerciseName,
  editingSets, 
  setEditingSets,
  newSetWeight, 
  setNewSetWeight,
  newSetReps, 
  setNewSetReps,
  onSave, 
  onCancel,
  getWorkoutsForDate,
  selectedDate,
  handleEditExercise,
  onShowError = (msg) => alert(msg)
}) {
  if (!isOpen) return null;

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

  const handleSaveClick = () => {
    // Validate exercise name
    if (!editExerciseName || editExerciseName.trim() === "") {
      onShowError("Exercise name is mandatory.");
      return;
    }
    
    // Validate at least one set exists
    if (editingSets.length === 0) {
      onShowError("Please add at least one set.");
      return;
    }
    
    // Validate all sets have weight and reps
    for (let i = 0; i < editingSets.length; i++) {
      const set = editingSets[i];
      if (!set.weight && set.weight !== 0) {
        onShowError(`Set ${i + 1}: Weight is mandatory.`);
        return;
      }
      if (!set.reps) {
        onShowError(`Set ${i + 1}: Reps is mandatory.`);
        return;
      }
    }
    
    // All validations passed, call save
    onSave();
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editingExercise.exerciseId ? "Edit Exercise" : "Add New Exercise"}</h3>
        </div>
        <div className="exercise-edit-content">
          {/* Show existing exercises if not editing one */}
          {!editingExercise.exerciseId && selectedDate && getWorkoutsForDate(new Date(selectedDate)).find(w => w.id === editingExercise.workoutId)?.exercises && (
            <div className="existing-exercises-section">
              <h4>Existing Exercises - Click to Edit</h4>
              {getWorkoutsForDate(new Date(selectedDate)).find(w => w.id === editingExercise.workoutId)?.exercises?.map(exercise => (
                <button
                  key={exercise.id}
                  type="button"
                  onClick={() => handleEditExercise(editingExercise.workoutId, exercise)}
                  className="existing-exercise-button"
                  onMouseOver={(e) => e.target.style.background = "rgba(239, 68, 68, 0.1)"}
                  onMouseOut={(e) => e.target.style.background = "var(--bg-secondary)"}
                >
                  <div className="existing-exercise-button-name">
                    {exercise.name}
                  </div>
                  <div className="existing-exercise-button-sets">
                    {(exercise.sets || []).length} sets • Click to edit
                  </div>
                </button>
              ))}
              <button 
                type="button"
                onClick={() => editingExercise.exerciseId = null}
                className="add-new-exercise-button"
              >
                + Add New Exercise
              </button>
            </div>
          )}

          {/* Edit form */}
          <div className="edit-exercise-name">
            <label>Exercise Name</label>
            <input 
              type="text" 
              value={editExerciseName} 
              onChange={e => setEditExerciseName(e.target.value)} 
              placeholder="Exercise name" 
              className="edit-exercise-name-input"
            />
          </div>

          <div className="edit-sets-section">
            <h4>Sets</h4>
            {editingSets.length > 0 && (
              <div className="current-sets-edit">
                {editingSets.map((s, idx) => (
                  <div key={s.id} className="set-item-edit">
                    <span>Set {idx + 1} • {s.weight} kg × {s.reps} reps</span>
                    <button type="button" className="remove-set-btn" onClick={() => handleRemoveSetFromEdit(s.id)}>✕</button>
                  </div>
                ))}
              </div>
            )}

            <div className="add-set-form">
              <div className="add-set-form-grid">
                <div className="weight-input-wrapper">
                  <input 
                    type="number" 
                    placeholder="Weight" 
                    value={newSetWeight} 
                    onChange={e => setNewSetWeight(e.target.value)} 
                    min={0} 
                    step={0.5} 
                    className="add-set-input"
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
                  />
                </div>
                <button type="button" className="btn-primary" onClick={handleAddSetToEdit}>Add Set</button>
              </div>
            </div>
          </div>

          <div className="edit-exercise-actions">
            <button type="button" className="btn-success" onClick={handleSaveClick}>Save</button>
            <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExerciseEditModal;
