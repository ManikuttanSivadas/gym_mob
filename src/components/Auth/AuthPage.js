import React, { useState } from "react";
import AuthService from './AuthService'; 


function ThemeToggle({ theme, onToggleTheme }) {
  return (
    <button className="theme-toggle" onClick={onToggleTheme} title="Toggle theme">
      <span className="theme-icon">{theme === "light" ? "◐" : "○"}</span>
    </button>
  );
}

// AuthService should be imported or provided elsewhere in your application:
// import AuthService from './auth-service';

function AuthPage({ onAuthSuccess, theme, onToggleTheme }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
  });
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  function handleInputChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setMessage("");
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!formData.username || !formData.password) {
      setMessage("Please fill in all required fields");
      setIsError(true);
      return;
    }

    let result;
    if (isLogin) {
      result = AuthService.login(formData.username, formData.password);
    } else {
      if (!formData.email) {
        setMessage("Email is required for signup");
        setIsError(true);
        return;
      }
      result = AuthService.signup(
        formData.username,
        formData.password,
        formData.email
      );
    }

    if (result.success) {
      setMessage(isLogin ? "Login successful!" : "Account created successfully!");
      setIsError(false);
      setTimeout(() => onAuthSuccess(result.user), 1000);
    } else {
      setMessage(result.error);
      setIsError(true);
    }
  }

  function switchMode() {
    setIsLogin(!isLogin);
    setFormData({ username: "", password: "", email: "" });
    setMessage("");
  }

  return (
    <div className="auth-container">
      <div style={{ position: "absolute", top: "20px", right: "20px" }}>
        <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />
      </div>

      <div className="auth-header">
        <h1>Strive</h1>
        <p>
          {isLogin
            ? "Welcome back to your fitness journey"
            : "Start your fitness journey today"}
        </p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="username"
          placeholder="Username"
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

        <button type="submit">
          {isLogin ? "Sign In" : "Create Account"}
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
