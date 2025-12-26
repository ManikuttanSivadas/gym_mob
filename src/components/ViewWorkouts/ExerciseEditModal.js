import React, { useState } from "react";
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
  const [editingSetId, setEditingSetId] = useState(null);
  const [editingSetWeight, setEditingSetWeight] = useState("");
  const [editingSetReps, setEditingSetReps] = useState("");

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

  const handleEditSet = (set) => {
    setEditingSetId(set.id);
    setEditingSetWeight(String(set.weight));
    setEditingSetReps(String(set.reps));
  };

  const handleSaveSetEdit = () => {
    const weightNum = Number(editingSetWeight);
    const repsNum = Number(editingSetReps);

    if (editingSetWeight === "" || editingSetReps === "" || isNaN(weightNum) || isNaN(repsNum)) {
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

    setEditingSets(prev =>
      prev.map(s => s.id === editingSetId ? { ...s, weight: weightNum, reps: repsNum } : s)
    );
    setEditingSetId(null);
    setEditingSetWeight("");
    setEditingSetReps("");
  };

  const handleCancelSetEdit = () => {
    setEditingSetId(null);
    setEditingSetWeight("");
    setEditingSetReps("");
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
                onClick={() => {
                  editingExercise.exerciseId = null;
                  setNewSetWeight("");
                  setNewSetReps("");
                }}
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
                  <div key={s.id}>
                    {editingSetId === s.id ? (
                      <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ fontSize: 12, color: "var(--text-muted)", minWidth: 40 }}>Set {idx + 1}</span>
                        <input
                          type="number"
                          value={editingSetWeight}
                          onChange={(e) => setEditingSetWeight(e.target.value)}
                          placeholder="Weight"
                          style={{
                            width: 70,
                            padding: 6,
                            borderRadius: 6,
                            border: "1px solid var(--border-light)",
                            backgroundColor: "var(--bg-primary)",
                            color: "var(--text-primary)",
                            fontSize: 12,
                            boxSizing: "border-box"
                          }}
                        />
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>kg</span>
                        <input
                          type="number"
                          value={editingSetReps}
                          onChange={(e) => setEditingSetReps(e.target.value)}
                          placeholder="Reps"
                          style={{
                            width: 70,
                            padding: 6,
                            borderRadius: 6,
                            border: "1px solid var(--border-light)",
                            backgroundColor: "var(--bg-primary)",
                            color: "var(--text-primary)",
                            fontSize: 12,
                            boxSizing: "border-box"
                          }}
                        />
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>reps</span>
                        <button
                          type="button"
                          onClick={handleSaveSetEdit}
                          style={{
                            padding: "4px 8px",
                            borderRadius: 4,
                            border: "none",
                            background: "var(--btn-success)",
                            color: "white",
                            fontSize: 11,
                            cursor: "pointer"
                          }}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelSetEdit}
                          style={{
                            padding: "4px 8px",
                            borderRadius: 4,
                            border: "none",
                            background: "var(--btn-danger)",
                            color: "white",
                            fontSize: 11,
                            cursor: "pointer"
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="set-item-edit">
                        <span>Set {idx + 1} • {s.weight} kg × {s.reps} reps</span>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            type="button"
                            className="edit-set-btn"
                            onClick={() => handleEditSet(s)}
                            style={{
                              padding: "4px 6px",
                              border: "none",
                              background: "transparent",
                              cursor: "pointer",
                              color: "var(--text-accent)"
                            }}
                            title="Edit set"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                          </button>
                          <button
                            type="button"
                            className="remove-set-btn"
                            onClick={() => handleRemoveSetFromEdit(s.id)}
                            style={{
                              padding: "4px 6px",
                              border: "none",
                              background: "transparent",
                              cursor: "pointer",
                              color: "var(--btn-danger)"
                            }}
                            title="Delete set"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{color: "rgba(239, 68, 68, 0.8)"}}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="add-set-form">
              <div className="add-set-form-grid">
                <div className="weight-input-wrapper">
                  <input 
                    type="text"
                    inputMode="decimal"
                    placeholder="Weight" 
                    value={newSetWeight} 
                    onChange={e => setNewSetWeight(e.target.value)} 
                    className="add-set-input"
                  />
                </div>
                <div className="reps-input-wrapper">
                  <input 
                    type="text"
                    inputMode="numeric"
                    placeholder="Reps" 
                    value={newSetReps} 
                    onChange={e => setNewSetReps(e.target.value)} 
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
