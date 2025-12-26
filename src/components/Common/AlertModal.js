import React, { useState, useEffect } from "react";
import "./AlertModal.css";

function AlertModal({ message, onClose, type = "info", autoClose = true, autoCloseDuration = 3000 }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation to complete
      }, autoCloseDuration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDuration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  if (!isVisible) return null;

  return (
    <div className={`alert-overlay ${type}`}>
      <div className={`alert-modal ${type} ${isVisible ? "show" : ""}`}>
        <div className="alert-content">
          <div className="alert-icon">
            {type === "error" && "⚠"}
            {type === "success" && "✓"}
            {type === "info" && "ℹ"}
            {type === "warning" && "!"}
          </div>
          <div className="alert-message">
            <p>{message}</p>
          </div>
        </div>
        <div className="alert-actions">
          <button className="alert-btn alert-btn-primary" onClick={handleClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

export default AlertModal;
