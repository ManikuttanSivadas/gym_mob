import React, { useState } from "react";
import AuthService from "./AuthService";

function ForgotPasswordPage({ onBack, theme, onToggleTheme }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    if (!email.trim()) {
      setMessage("Please enter your email address");
      setIsError(true);
      return;
    }

    setLoading(true);
    try {
      const result = await AuthService.sendPasswordReset(email);
      
      if (result && result.success) {
        setMessage("Password reset email sent! Check your inbox.");
        setIsError(false);
        setEmailSent(true);
        setEmail("");
      } else {
        setMessage(result?.error || "Failed to send reset email");
        setIsError(true);
      }
    } catch (err) {
      setMessage("Error sending reset email");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <button
            type="button"
            className="profile-back-btn"
            onClick={onBack}
            style={{ marginLeft: "-8px", padding: "4px 8px" }}
          >
            ‹ Back
          </button>
          <h1 style={{ margin: 0, flex: 1, textAlign: "center" }}>Reset Password</h1>
          <div style={{ width: "40px" }} />
        </div>
        <p>Enter your email to receive a password reset link</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setMessage("");
          }}
          required
          disabled={loading || emailSent}
          autoFocus
        />

        <button type="submit" disabled={loading || emailSent}>
          {loading ? "Sending..." : emailSent ? "Email Sent" : "Send Reset Link"}
        </button>

        {message && (
          <div className={isError ? "error-message" : "success-message"}>
            {message}
          </div>
        )}

        {emailSent && (
          <div className="success-message">
            <p>
              Didn't receive the email? Check your spam folder or{" "}
              <button
                type="button"
                onClick={() => {
                  setEmailSent(false);
                  setEmail("");
                  setMessage("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-success)",
                  cursor: "pointer",
                  fontWeight: "600",
                  textDecoration: "underline",
                }}
              >
                try again
              </button>
            </p>
          </div>
        )}
      </form>

      <div className="auth-switch">
        <button type="button" onClick={onBack}>
          Back to Sign In
        </button>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
