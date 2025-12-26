import React, { useState } from "react";

export default function ProfileDropdown({ user, onLogout, onClose, isOpen, onProfileClick }) {
  const [knowUsOpen, setKnowUsOpen] = useState(false);

  // Extract username from email if needed
  const extractUsernameFromEmail = (email) => {
    return email ? email.split("@")[0] : "";
  };

  if (!isOpen) return null;

  // safe display values (prevent reading [0] of undefined)
  const display =
    (user && (user.name || user.username || user.displayName || user.email)) ||
    "";
  const initial = display ? String(display)[0].toUpperCase() : "?";
  
  // Get username, preferring actual username field, fallback to email username part
  let displayName = "Unknown User";
  if (user) {
    if (user.name) displayName = user.name;
    else if (user.username && !user.username.includes("@")) displayName = user.username;
    else if (user.displayName) displayName = user.displayName;
    else if (user.email) displayName = extractUsernameFromEmail(user.email);
  }
  
  const email = (user && user.email) || "No email";

  return (
    <>
      <div className="profile-dropdown-overlay" onClick={onClose} />
      <div className="profile-dropdown">
        {/* Profile Info - Avatar + Name/Email */}
        <button
          type="button"
          onClick={() => {
            onProfileClick && onProfileClick();
            onClose && onClose();
          }}
          style={{
            width: "100%",
            padding: "12px",
            background: "transparent",
            border: "none",
            textAlign: "left",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            color: "var(--text-primary)"
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: "#10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "18px",
              fontWeight: "bold",
              flexShrink: 0
            }}
          >
            {user?.photo ? (
              <img
                src={user.photo}
                alt={displayName}
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  objectFit: "cover"
                }}
              />
            ) : (
              initial
            )}
          </div>

          {/* Name and Email */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "14px", fontWeight: "500", color: "var(--text-primary)" }}>{displayName}</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{email}</div>
          </div>
        </button>

        <div className="profile-dropdown-divider" />
        {/* Collapsible Know Us Tab */}
        <div className="profile-dropdown-know-us-tab">
          {/* Header toggles visibility */}
          <button
            type="button"
            className="profile-dropdown-know-us-header"
            onClick={() => setKnowUsOpen((open) => !open)}
            aria-expanded={knowUsOpen}
          >
            Know Us
            <span className={`arrow-icon ${knowUsOpen ? "open" : ""}`} />
          </button>

          {/* Collapsible content */}
          {knowUsOpen && (
            <div className="profile-dropdown-know-us-content">
              <p>
                upTrace is a modern fitness app designed to help you log
                workouts, track progress, and stay motivated.
              </p>
              <p>
                Founded by Manikuttan Sivadas and team, we are passionate
                about health and technology.
              </p>
              <p>
                Our mission: empower everyone to achieve their fitness goals.
              </p>
            </div>
          )}
        </div>
        <div className="profile-dropdown-divider" />
        {/* Sign Out Button */}
        <div className="profile-dropdown-actions">
          <button
            type="button"
            className="profile-dropdown-item signout-btn"
            onClick={onLogout}
          >
            <span className="signout-text">Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
}