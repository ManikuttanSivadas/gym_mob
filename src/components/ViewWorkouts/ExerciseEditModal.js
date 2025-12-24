import React from "react";

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
  handleEditExercise
}) {
  if (!isOpen) return null;

  const handleAddSetToEdit = () => {
    if (newSetWeight === "" || newSetReps === "") { alert("Enter weight and reps."); return; }
    const set = { id: generateId(), weight: Number(newSetWeight), reps: Number(newSetReps) };
    setEditingSets(prev => [...prev, set]);
    setNewSetWeight(""); setNewSetReps("");
  };

  const handleRemoveSetFromEdit = (setId) => {
    setEditingSets(prev => prev.filter(s => s.id !== setId));
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxHeight: "80vh", overflowY: "auto" }}>
        <div className="modal-header">
          <h3>{editingExercise.exerciseId ? "Edit Exercise" : "Add New Exercise"}</h3>
        </div>
        <div style={{ padding: 16 }}>
          {/* Show existing exercises if not editing one */}
          {!editingExercise.exerciseId && selectedDate && getWorkoutsForDate(new Date(selectedDate)).find(w => w.id === editingExercise.workoutId)?.exercises && (
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
                onClick={() => editingExercise.exerciseId = null}
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
            <button type="button" className="btn-success" onClick={onSave} style={{ flex: 1, padding: "10px" }}>Save</button>
            <button type="button" className="btn-secondary" onClick={onCancel} style={{ flex: 1, padding: "10px" }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExerciseEditModal;
