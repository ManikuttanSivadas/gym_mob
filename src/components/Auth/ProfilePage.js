import React, { useState, useEffect, memo } from "react";
import "../styles/ProfilePage.css";
import AuthService from "./AuthService";

export default memo(function ProfilePage({ user, onBack, onProfileSave }) {
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
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = React.useRef(null);

  // Extract username from email if needed
  const extractUsernameFromEmail = (email) => {
    return email ? email.split("@")[0] : "";
  };

  // Calculate age from date of birth
  const calculateAge = (dob) => {
    if (!dob) return "";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // Adjust age if birthday hasn't occurred this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age >= 0 ? age : "";
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
        age: calculateAge(user.dob) || user.age || "",
        height: user.height || "",
        weight: user.weight || "",
        photo: user.photo || null,
      }));
    }

    // Load saved profile data from Firestore first, then localStorage
    const loadProfile = async () => {
      try {
        if (user && user.uid && user.email) {
          try {
            const firestoreProfile = await AuthService.getUserProfile(user.uid, user.email);
            if (firestoreProfile) {
              setFormData((prev) => ({
                ...prev,
                ...firestoreProfile,
                age: calculateAge(firestoreProfile.dob) || firestoreProfile.age || "",
              }));
              setOriginalData(firestoreProfile);
              setIsLoading(false);
              return;
            }
          } catch (e) {
            // silently handle Firestore load errors
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
              age: calculateAge(parsed.dob) || parsed.age || "",
            }));
            setOriginalData(parsed);
          }
        } catch (e) {
          // silently handle localStorage parse errors
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  // Auto-calculate age when DOB changes
  useEffect(() => {
    if (formData.dob) {
      const calculatedAge = calculateAge(formData.dob);
      setFormData((prev) => ({
        ...prev,
        age: calculatedAge,
      }));
    }
  }, [formData.dob]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      };
      
      // Auto-calculate age when DOB changes
      if (name === "dob") {
        updated.age = calculateAge(value);
      }
      
      return updated;
    });
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;

    setIsUploading(true);
    try {
      // Show preview immediately using local preview
      const reader = new FileReader();
      reader.onloadend = async () => {
        const localPreview = reader.result;
        
        // Display preview immediately
        setFormData((prev) => ({
          ...prev,
          photo: localPreview,
        }));

        // Upload to Firebase Storage and Firestore in parallel
        const photoUrl = await AuthService.uploadProfilePhoto(user.uid, file);
        
        if (photoUrl) {
          // Update with actual URL from Storage
          setFormData((prev) => ({
            ...prev,
            photo: photoUrl,
          }));

          // Save to Firestore immediately with URL
          const profileData = {
            username: formData.username,
            prevUsername: formData.username,
            photo: photoUrl,
            phone: formData.phone,
            phoneExt: formData.phoneExt,
            sex: formData.sex,
            dob: formData.dob,
            age: formData.age,
            height: formData.height,
            weight: formData.weight,
          };

          const userProfileKey = `profile_${user.uid}`;
          localStorage.setItem(userProfileKey, JSON.stringify(profileData));
          
          if (user.email) {
            AuthService.saveUserProfile(user.uid, user.email, profileData).catch((err) => {
              // silently handle Firestore save errors
            });
          }

          // Update parent with new photo URL
          const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
          const updatedUser = {
            ...currentUser,
            photo: photoUrl,
          };
          localStorage.setItem("currentUser", JSON.stringify(updatedUser));
          
          if (onProfileSave) {
            onProfileSave(updatedUser);
          }
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      // silently handle photo upload errors
    } finally {
      setIsUploading(false);
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoRemove = async (e) => {
    e.stopPropagation();
    if (user?.uid) {
      await AuthService.deleteProfilePhoto(user.uid);
    }
    setFormData((prev) => ({
      ...prev,
      photo: null,
    }));
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
          // silently handle Firestore save errors
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
      // silently handle save errors
    }
  };

  if (isLoading) {
    return (
      <div className="profile-page-container">
        <div className="profile-page">
          <div className="profile-loading-skeleton">
            <div className="skeleton skeleton-photo"></div>
            
            <div className="skeleton-group">
              <div className="skeleton skeleton-input"></div>
              <div className="skeleton skeleton-label"></div>
            </div>
            
            <div className="skeleton-group">
              <div className="skeleton skeleton-input"></div>
              <div className="skeleton skeleton-label"></div>
            </div>
            
            <div className="skeleton-group">
              <div className="skeleton skeleton-input"></div>
              <div className="skeleton skeleton-label"></div>
            </div>
            
            <div className="skeleton-group">
              <div className="skeleton skeleton-input"></div>
              <div className="skeleton skeleton-label"></div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="skeleton skeleton-input" style={{ flex: 1 }}></div>
              <div className="skeleton skeleton-input" style={{ flex: 1 }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            <div className="profile-photo-container" onClick={handlePhotoClick} style={{ opacity: isUploading ? 0.6 : 1, cursor: isUploading ? 'wait' : 'pointer' }}>
              {formData.photo ? (
                <>
                  <img
                    src={formData.photo}
                    alt="Profile"
                    className="profile-photo-image"
                  />
                  <button
                    type="button"
                    className="profile-photo-remove-btn"
                    onClick={handlePhotoRemove}
                    aria-label="Remove photo"
                    title="Remove photo"
                    disabled={isUploading}
                  >
                    ✕
                  </button>
                </>
              ) : (
                <div className="profile-photo-placeholder">
                  {isUploading ? (
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Uploading...</p>
                    </div>
                  ) : (
                    <>
                      <svg className="profile-photo-avatar" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                      <p className="profile-photo-text">Upload Photo</p>
                    </>
                  )}
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              disabled={isUploading}
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

          {/* Date of Birth & Age Row */}
          <div className="profile-form-row">
            <div className="profile-form-group">
              <label htmlFor="dob">Date of Birth</label>
              <input
                id="dob"
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleInputChange}
                min={new Date(new Date().getFullYear() - 120, new Date().getMonth(), new Date().getDate()).toISOString().split('T')[0]}
                max={new Date(new Date().getFullYear() - 12, new Date().getMonth(), new Date().getDate()).toISOString().split('T')[0]}
                className="profile-input"
              />
              <small style={{ color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Minimum age required: 12 years
              </small>
            </div>

            <div className="profile-form-group">
              <label htmlFor="age">Age</label>
              <input
                id="age"
                type="number"
                name="age"
                value={formData.age}
                disabled
                placeholder="e.g., 25"
                className="profile-input-disabled"
              />
            </div>
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
});
