import React, { useState } from 'react';

function SetInput({ onAddSet, sets, onRemoveSet }) {
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');

  function handleSubmit() {
    onAddSet(weight, reps);
    setWeight('');
    setReps('');
  }

  return (
    <div>
      <input type="number" placeholder="Weight (kg)" value={weight} onChange={e => setWeight(e.target.value)} />
      <input type="number" placeholder="Reps" value={reps} onChange={e => setReps(e.target.value)} />
      <button onClick={handleSubmit}>Add Set</button>
      {sets.length > 0 && (
        <div>
          <h4>Current Sets</h4>
          {sets.map((set, idx) => (
            <div key={set.id}>
              Set {idx+1} • {set.weight} kg × {set.reps} reps
              <button onClick={() => onRemoveSet(set.id)}>Remove</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SetInput;
