import React, { useState } from "react";

export default function ProfileDropdown({ user, onLogout, onClose, isOpen }) {
  const [knowUsOpen, setKnowUsOpen] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      <div className="dropdown-overlay" onClick={onClose} />
      <div className="profile-dropdown">
        {/* Profile Info */}
        <div className="profile-dropdown-header">
          <div className="profile-dropdown-avatar">
            {(user.name || user.username)[0].toUpperCase()}
          </div>
          <div className="profile-dropdown-info">
            <div className="profile-dropdown-name">
              {user.name || user.username}
            </div>
            <div className="profile-dropdown-email">
              {user.email || "No email"}
            </div>
          </div>
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
