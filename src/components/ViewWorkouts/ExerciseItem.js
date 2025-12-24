import React from "react";

function ExerciseItem({ 
  exercise, 
  isEditingThis, 
  editExerciseName,
  setEditExerciseName,
  editingSets,
  newSetWeight,
  setNewSetWeight,
  newSetReps,
  setNewSetReps,
  onEditExercise,
  onAddSet,
  onRemoveSet,
  onSaveExercise,
  onCancelEdit
}) {
  return (
    <div className="exercise-item history-exercise-item" style={{ marginBottom: 12 }}>
      {isEditingThis ? (
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
                {editingSets.map((s, idx) => (
                  <div key={s.id} className="set-item-edit">
                    <span>Set {idx + 1} • {s.weight} kg × {s.reps} reps</span>
                    <button className="remove-set-btn" onClick={() => onRemoveSet(s.id)}>Remove</button>
                  </div>
                ))}
              </div>
            )}

            <div className="add-set-form">
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
                <span className="weight-suffix">kg</span>
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
                <span className="reps-suffix">reps</span>
              </div>
              <button className="btn-primary" onClick={onAddSet}>Add Set</button>
            </div>
          </div>

          <div className="edit-exercise-actions">
            <button className="btn-success" onClick={onSaveExercise}>Save Changes</button>
            <button className="btn-secondary" onClick={onCancelEdit}>Cancel</button>
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
}

export default ExerciseItem;
