import { useState } from "react";

export function useAlert() {
  const [alert, setAlert] = useState(null);

  const showAlert = (message, type = "info", autoCloseDuration = 3000) => {
    setAlert({ message, type, autoCloseDuration });
  };

  const hideAlert = () => {
    setAlert(null);
  };

  const showError = (message) => {
    showAlert(message, "error", 4000);
  };

  const showSuccess = (message) => {
    showAlert(message, "success", 3000);
  };

  const showInfo = (message) => {
    showAlert(message, "info", 3000);
  };

  const showWarning = (message) => {
    showAlert(message, "warning", 4000);
  };

  return {
    alert,
    showAlert,
    hideAlert,
    showError,
    showSuccess,
    showInfo,
    showWarning,
  };
}
