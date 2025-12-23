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
        {/* Profile Info */}
        <div className="profile-dropdown-header">
          <div className="profile-dropdown-avatar">
            {user && user.photo ? (
              <img src={user.photo} alt="Profile" className="profile-dropdown-avatar-image" />
            ) : (
              initial
            )}
          </div>
          <div className="profile-dropdown-info">
            <div className="profile-dropdown-name">{displayName}</div>
            <div className="profile-dropdown-email">{email}</div>
          </div>
        </div>

        <div className="profile-dropdown-divider" />
        {/* Profile Tab */}
        <div className="profile-dropdown-profile-tab">
          <button
            className="profile-dropdown-item"
            onClick={() => {
              onProfileClick && onProfileClick();
              onClose && onClose();
            }}
          >
            Profile
          </button>
        </div>
        <div className="profile-dropdown-divider" />
        {/* Collapsible Know Us Tab */}
        <div className="profile-dropdown-know-us-tab">
          {/* Header toggles visibility */}
          <button
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
                Strive is a modern fitness app designed to help you log
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