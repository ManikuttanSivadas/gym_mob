import React from 'react';

function SaveConfirmationModal({ isOpen, onClose, onConfirm, workoutName, selectedDate }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>Save “{workoutName}”</h3>
        <p>Save this workout for <strong>{selectedDate}</strong>? Once saved, you cannot edit.</p>
        <button onClick={onClose}>Edit More</button>
        <button onClick={onConfirm}>Save Workout</button>
      </div>
    </div>
  );
}

export default SaveConfirmationModal;
