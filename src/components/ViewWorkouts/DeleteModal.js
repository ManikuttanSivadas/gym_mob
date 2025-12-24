import React from "react";

function DeleteModal({ showDeleteModal, deleteTarget, onConfirm, onCancel }) {
  if (!showDeleteModal) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{deleteTarget?.type === "workout" ? "Delete Workout" : "Delete Exercise"}</h3>
          <p>{deleteTarget?.type === "workout"
            ? `Are you sure you want to delete the workout "${deleteTarget?.workoutName}"? This will remove all exercises.`
            : `Are you sure you want to delete "${deleteTarget?.exerciseName}"? This cannot be undone.`}
          </p>
        </div>
        <div className="modal-actions">
          <button className="btn-modal-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn-modal-primary" onClick={onConfirm}>{deleteTarget?.type === "workout" ? "Delete Workout" : "Delete Exercise"}</button>
        </div>
      </div>
    </div>
  );
}

export default DeleteModal;
