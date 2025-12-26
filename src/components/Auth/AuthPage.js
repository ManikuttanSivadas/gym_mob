import React, { useState } from "react";
import AuthService from "./AuthService";
import ForgotPasswordPage from "./ForgotPasswordPage";

function AuthPage({ onAuthSuccess, theme, onToggleTheme }) {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [formData, setFormData] = useState({ username: "", password: "", email: "" });
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleInputChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    if (!formData.username || !formData.password) {
      setMessage("Please fill in required fields");
      setIsError(true);
      return;
    }

    setLoading(true);
    try {
      let result;
      if (isLogin) {
        // treat username field as email for now
        result = await AuthService.login(formData.username, formData.password);
      } else {
        if (!formData.email) {
          setMessage("Email is required for signup");
          setIsError(true);
          setLoading(false);
          return;
        }
        result = await AuthService.signup(formData.username, formData.password, formData.email);
      }

      console.log("Auth result:", result); // debug log

      if (result && result.success) {
        setMessage(isLogin ? "Login successful!" : "Account created!");
        setIsError(false);
        // call onAuthSuccess immediately (no timeout)
        if (typeof onAuthSuccess === "function") {
          onAuthSuccess(result.user);
        } else {
          console.warn("onAuthSuccess not provided to AuthPage");
        }
      } else {
        setMessage(result?.error || "Authentication failed");
        setIsError(true);
      }
    } catch (err) {
      console.error("AuthPage.handleSubmit error:", err);
      setMessage("Unexpected error");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setIsLogin(!isLogin);
    setFormData({ username: "", password: "", email: "" });
    setMessage("");
    setShowForgotPassword(false);
  }

  if (showForgotPassword) {
    return (
      <ForgotPasswordPage
        onBack={() => setShowForgotPassword(false)}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-header">
        <h1>upTrace</h1>
        <p>{isLogin ? "Welcome back to your fitness journey" : "Start your fitness journey today"}</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <input
          type={isLogin ? "email" : "text"}
          name="username"
          placeholder={isLogin ? "Email (use email to sign in)" : "Username"}
          value={formData.username}
          onChange={handleInputChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleInputChange}
          required
        />

        {!isLogin && (
          <input
            type="email"
            name="email"
            placeholder="Email address"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
        )}

        {isLogin && (
          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            style={{
              background: "none",
              border: "none",
              color: "var(--primary-color)",
              cursor: "pointer",
              padding: "0.5rem 0",
              marginBottom: "1rem",
              textDecoration: "underline",
              fontSize: "0.9rem",
            }}
          >
            Forgot Password?
          </button>
        )}

        <button type="submit" disabled={loading}>
          {loading ? "Please wait…" : isLogin ? "Sign In" : "Create Account"}
        </button>

        {message && (
          <div className={isError ? "error-message" : "success-message"}>
            {message}
          </div>
        )}
      </form>

      <div className="auth-switch">
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <button type="button" onClick={switchMode}>
          {isLogin ? "Sign Up" : "Sign In"}
        </button>
      </div>
    </div>
  );
}

export default AuthPage;
