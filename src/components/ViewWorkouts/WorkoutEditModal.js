import React from "react";

function generateId() {
  return Date.now().toString() + Math.random().toString(36).slice(2, 9);
}

function WorkoutEditModal({ 
  isOpen, 
  editingWorkoutData, 
  editWorkoutName,
  setEditWorkoutName,
  setEditingWorkoutData,
  workouts,
  onSave, 
  onCancel
}) {
  if (!isOpen || !editingWorkoutData) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
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
                                    sets: (ex.sets || []).map(s => s.id === set.id ? { ...s, weight: e.target.value === "" ? "" : Number(e.target.value) } : s)
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
                                    sets: (ex.sets || []).map(s => s.id === set.id ? { ...s, reps: e.target.value === "" ? "" : Number(e.target.value) } : s)
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
                                padding: "4px 6px", 
                                background: "transparent", 
                                border: "none", 
                                borderRadius: 4, 
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                              }}
                              title="Delete set"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{color: "rgba(239, 68, 68, 0.8)"}}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                            </button>
                          </div>
                        ))}
                    </div>

                    {/* Add Set Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const newSet = { id: generateId(), weight: "", reps: "" };
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
                          
                          if (remainingExercises.length === 0) {
                            const confirmed = window.confirm(
                              "This is the last exercise in the workout. Deleting it will remove the entire workout. Continue?"
                            );
                            if (!confirmed) return;
                            
                            // This should trigger parent's onUpdateWorkouts
                            onCancel(); // Exit edit mode
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
                    sets: [{ id: generateId(), weight: "", reps: "" }]
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
        <div className="modal-actions workout-edit-actions">
          <button type="button" className="btn-secondary workout-edit-action-btn workout-edit-cancel-btn" onClick={onCancel}>Cancel</button>
          <button type="button" className="btn-success workout-edit-action-btn workout-edit-save-btn" onClick={onSave}>Done</button>
        </div>
      </div>
    </div>
  );
}

export default WorkoutEditModal;
