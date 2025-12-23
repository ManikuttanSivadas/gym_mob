import React, { useState, useEffect } from "react";
import "../styles/ProfilePage.css";
import AuthService from "./AuthService";

export default function ProfilePage({ user, onBack, onProfileSave }) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    photo: null,
    phone: "",
    phoneExt: "",
    sex: "",
    dob: "",
    age: "",
    height: "",
    weight: "",
  });

  const [originalData, setOriginalData] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = React.useRef(null);

  // Extract username from email if needed
  const extractUsernameFromEmail = (email) => {
    return email ? email.split("@")[0] : "";
  };

  useEffect(() => {
    // Prefill form with user data
    if (user) {
      let username = "Unknown User";
      if (user.name) username = user.name;
      else if (user.username && !user.username.includes("@"))
        username = user.username;
      else if (user.displayName) username = user.displayName;
      else if (user.email) username = extractUsernameFromEmail(user.email);

      setFormData((prev) => ({
        ...prev,
        username: username,
        email: user.email || "",
        phone: user.phone || "",
        phoneExt: user.phoneExt || "",
        sex: user.sex || "",
        dob: user.dob || "",
        age: user.age || "",
        height: user.height || "",
        weight: user.weight || "",
        photo: user.photo || null,
      }));
    }

    // Load saved profile data from Firestore first, then localStorage
    const loadProfile = async () => {
      if (user && user.uid && user.email) {
        try {
          const firestoreProfile = await AuthService.getUserProfile(user.uid, user.email);
          if (firestoreProfile) {
            setFormData((prev) => ({
              ...prev,
              ...firestoreProfile,
            }));
            setOriginalData(firestoreProfile);
            return;
          }
        } catch (e) {
          console.error("Error loading profile from Firestore:", e);
        }
      }

      // Fallback to localStorage if Firestore doesn't have data
      try {
        const userProfileKey = user?.uid ? `profile_${user.uid}` : "userProfile";
        const savedProfile = localStorage.getItem(userProfileKey);
        if (savedProfile) {
          const parsed = JSON.parse(savedProfile);
          setFormData((prev) => ({
            ...prev,
            ...parsed,
          }));
          setOriginalData(parsed);
        }
      } catch (e) {
        console.error("Error loading profile from localStorage:", e);
      }
    };

    loadProfile();
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          photo: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleSave = () => {
    try {
      const profileData = {
        username: formData.username,
        prevUsername: originalData?.username || formData.username,
        photo: formData.photo,
        phone: formData.phone,
        phoneExt: formData.phoneExt,
        sex: formData.sex,
        dob: formData.dob,
        age: formData.age,
        height: formData.height,
        weight: formData.weight,
      };

      // Check if data has changed
      const hasChanged = !originalData || JSON.stringify(originalData) !== JSON.stringify(profileData);

      // Save to localStorage and Firestore only if data has changed
      if (hasChanged && user && user.uid && user.email) {
        const userProfileKey = `profile_${user.uid}`;
        localStorage.setItem(userProfileKey, JSON.stringify(profileData));
        
        // Save to Firestore only if data changed
        AuthService.saveUserProfile(user.uid, user.email, profileData).catch((err) => {
          console.error("Error saving profile to Firestore:", err);
        });
        
        // Update original data after saving
        setOriginalData(profileData);
      }

      // Update current user with new username if username changed
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      if (currentUser.username !== formData.username || currentUser.photo !== formData.photo) {
        const updatedUser = {
          ...currentUser,
          username: formData.username,
          displayName: formData.username,
          prevUsername: currentUser.username,
          photo: formData.photo,
        };
        localStorage.setItem("currentUser", JSON.stringify(updatedUser));

        // Call callback to update user in parent
        if (onProfileSave) {
          onProfileSave(updatedUser);
        }
      }

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (e) {
      console.error("Error saving profile:", e);
    }
  };

  return (
    <div className="profile-page-container">
      <div className="profile-page">
        {/* Header */}
        <div className="profile-page-header">
          <button className="profile-back-btn" onClick={onBack} aria-label="Back">
            ‹ Back
          </button>
          <h1>Profile</h1>
          <div style={{ width: "60px" }} /> {/* Spacer for alignment */}
        </div>

        {/* Form */}
        <form className="profile-form" onSubmit={(e) => e.preventDefault()}>
          {/* Profile Photo */}
          <div className="profile-photo-section">
            <div className="profile-photo-container" onClick={handlePhotoClick}>
              {formData.photo ? (
                <img
                  src={formData.photo}
                  alt="Profile"
                  className="profile-photo-image"
                />
              ) : (
                <div className="profile-photo-placeholder">
                  <svg className="profile-photo-avatar" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <p className="profile-photo-text">Upload Photo</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              style={{ display: "none" }}
            />
          </div>

          {/* Username */}
          <div className="profile-form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="profile-input"
            />
          </div>

          {/* Email (Read-only) */}
          <div className="profile-form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              disabled
              className="profile-input-disabled"
            />
          </div>

          {/* Extension & Phone Row */}
          <div className="profile-form-row">
            <div className="profile-form-group profile-form-group-small">
              <label htmlFor="phoneExt">Extension</label>
              <input
                id="phoneExt"
                type="number"
                name="phoneExt"
                value={formData.phoneExt}
                onChange={handleInputChange}
                maxLength="3"
                placeholder="123"
                className="profile-input"
                min="0"
                max="999"
              />
            </div>
            <div className="profile-form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="e.g., +1234567890"
                className="profile-input"
              />
            </div>
          </div>

          {/* Sex */}
          <div className="profile-form-group">
            <label htmlFor="sex">Sex</label>
            <select
              id="sex"
              name="sex"
              value={formData.sex}
              onChange={handleInputChange}
              className="profile-input"
            >
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Date of Birth */}
          <div className="profile-form-group">
            <label htmlFor="dob">Date of Birth</label>
            <input
              id="dob"
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleInputChange}
              className="profile-input"
            />
          </div>

          {/* Age */}
          <div className="profile-form-group">
            <label htmlFor="age">Age</label>
            <input
              id="age"
              type="number"
              name="age"
              value={formData.age}
              onChange={handleInputChange}
              placeholder="e.g., 25"
              className="profile-input"
            />
          </div>

          {/* Height & Weight Row */}
          <div className="profile-form-row">
            <div className="profile-form-group">
              <label htmlFor="height">Height (cm)</label>
              <input
                id="height"
                type="number"
                name="height"
                value={formData.height}
                onChange={handleInputChange}
                placeholder="e.g., 170"
                className="profile-input"
              />
            </div>
            <div className="profile-form-group">
              <label htmlFor="weight">Weight (kg)</label>
              <input
                id="weight"
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleInputChange}
                placeholder="e.g., 70"
                className="profile-input"
              />
            </div>
          </div>

          {/* Save Button */}
          <button
            type="button"
            className="profile-save-btn"
            onClick={handleSave}
          >
            Save Profile
          </button>

          {/* Success Message */}
          {isSaved && (
            <div className="profile-success-message">
              Profile saved successfully!
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
