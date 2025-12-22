import React, { useState, useEffect, useRef } from "react";
import LogWorkoutTab from "./components/LogWorkout/LogWorkoutTab";
import ViewWorkoutsTab from "./components/ViewWorkouts/ViewWorkoutsTab";
import RestTimerTab from "./components/Timer/RestTimerTab";
import AuthPage from "./components/Auth/AuthPage";
import ThemeToggle from "./components/Common/ThemeToggle";
import ProfileDropdown from "./components/Auth/ProfileDropdown";
import AuthService from "./components/Auth/AuthService";
import "./App.css";

function App() {
  const [currentTab, setCurrentTab] = useState(0);
  const [workouts, setWorkouts] = useState([]);
  const [theme, setTheme] = useState("light");
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const [workoutName, setWorkoutName] = useState("");
  const [workoutExercises, setWorkoutExercises] = useState([]);
  const [activeExercise, setActiveExercise] = useState(null);
  const [currentSets, setCurrentSets] = useState([]);

  // helper — derive a stable key/name from user object safely
  function getUsernameKey(u) {
    if (!u) return null;
    return u.username || u.name || u.displayName || u.email || u.uid || null;
  }

  // helper — safe avatar initial
  function getAvatarInitial(u) {
    const src = (u && (u.name || u.username || u.displayName || u.email)) || "";
    return (src && String(src)[0].toUpperCase()) || "?";
  }

  // --- REFS for outside click ---
  const profileBtnRef = useRef(null);
  const profileDropdownRef = useRef(null);

  useEffect(() => {
    const currentUser = AuthService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);

      const key = getUsernameKey(currentUser);
      // guard AuthService calls with a valid key
      if (key && typeof AuthService.getUserWorkouts === "function") {
        const userWorkouts = AuthService.getUserWorkouts(key) || [];
        setWorkouts(userWorkouts);
      }

      if (key && typeof AuthService.getCurrentWorkoutState === "function") {
        const currentWorkoutState = AuthService.getCurrentWorkoutState(key);
        if (currentWorkoutState) {
          setWorkoutName(currentWorkoutState.workoutName || "");
          setWorkoutExercises(currentWorkoutState.workoutExercises || []);
          setActiveExercise(currentWorkoutState.activeExercise || null);
          setCurrentSets(currentWorkoutState.currentSets || []);
        }
      }
    }
    setIsLoading(false);
  }, []);

  // persist current workout state when user changes or workout data changes
  useEffect(() => {
    const key = getUsernameKey(user);
    if (key && typeof AuthService.saveCurrentWorkoutState === "function") {
      const workoutState = { workoutName, workoutExercises, activeExercise, currentSets };
      AuthService.saveCurrentWorkoutState(key, workoutState);
    }
  }, [workoutName, workoutExercises, activeExercise, currentSets, user]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // --- Click outside to close profile dropdown ---
  useEffect(() => {
    if (!showProfileDropdown) return;
    function handleClickOutside(event) {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target) &&
        profileBtnRef.current &&
        !profileBtnRef.current.contains(event.target)
      ) {
        setShowProfileDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfileDropdown]);

  function handleAuthSuccess(loggedInUser) {
    setUser(loggedInUser);
    const key = getUsernameKey(loggedInUser);

    if (key && typeof AuthService.getUserWorkouts === "function") {
      const userWorkouts = AuthService.getUserWorkouts(key) || [];
      setWorkouts(userWorkouts);
    } else {
      setWorkouts([]);
    }

    if (key && typeof AuthService.getCurrentWorkoutState === "function") {
      const currentWorkoutState = AuthService.getCurrentWorkoutState(key);
      if (currentWorkoutState) {
        setWorkoutName(currentWorkoutState.workoutName || "");
        setWorkoutExercises(currentWorkoutState.workoutExercises || []);
        setActiveExercise(currentWorkoutState.activeExercise || null);
        setCurrentSets(currentWorkoutState.currentSets || []);
      }
    }
  }

  // toggle theme (was referenced but not defined)
  function handleToggleTheme() {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  }
  
  function handleAddWorkout(workout) {
    const newWorkouts = [workout, ...workouts];
    setWorkouts(newWorkouts);
    const key = getUsernameKey(user);
    if (key && typeof AuthService.saveUserWorkouts === "function") {
      AuthService.saveUserWorkouts(key, newWorkouts);
    }
    if (key && typeof AuthService.clearCurrentWorkoutState === "function") {
      AuthService.clearCurrentWorkoutState(key);
    }
  }

  function handleUpdateWorkouts(updatedWorkouts) {
    setWorkouts(updatedWorkouts);
    const key = getUsernameKey(user);
    if (key && typeof AuthService.saveUserWorkouts === "function") {
      AuthService.saveUserWorkouts(key, updatedWorkouts);
    }
  }

  function handleLogout() {
    const key = getUsernameKey(user);
    if (key && typeof AuthService.clearCurrentWorkoutState === "function") {
      AuthService.clearCurrentWorkoutState(key);
    }
    if (typeof AuthService.logout === "function") {
      AuthService.logout();
    }
    setUser(null);
    setWorkouts([]);
    setWorkoutName("");
    setWorkoutExercises([]);
    setActiveExercise(null);
    setCurrentSets([]);
    setCurrentTab(0);
    setShowProfileDropdown(false);
  }

  const hasWorkoutInProgress =
    workoutName.trim() || workoutExercises.length > 0 || activeExercise;

  if (isLoading) {
    return (
      <div className="app-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="brand-logo">Strive</div>
          <p style={{ color: "var(--text-muted)", marginTop: "8px" }}>
            Loading your data...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthPage
        onAuthSuccess={handleAuthSuccess}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />
    );
  }

  return (
    <div className="app-container">
      <div className="app-header">
        <div className="brand-logo">Strive</div>
        <div className="app-header-controls">
          <ThemeToggle theme={theme} onToggleTheme={handleToggleTheme} />
          <div
            className="profile-container"
            style={{ position: "relative", overflow: "visible" }}
          >
            <button
              className="profile-btn"
              onClick={() => setShowProfileDropdown((v) => !v)}
              ref={profileBtnRef}
            >
              <div className="profile-btn-avatar">
                {getAvatarInitial(user)}
              </div>
            </button>
            <div ref={profileDropdownRef}>
              <ProfileDropdown
                user={user}
                isOpen={showProfileDropdown}
                onClose={() => setShowProfileDropdown(false)}
                onLogout={handleLogout}
              />
            </div>
          </div>
        </div>
      </div>
      <nav>
        <button
          className={currentTab === 0 ? "active" : ""}
          onClick={() => setCurrentTab(0)}
        >
          Log Workout
          {hasWorkoutInProgress && <span className="nav-indicator">•</span>}
        </button>
        <button
          className={currentTab === 1 ? "active" : ""}
          onClick={() => setCurrentTab(1)}
        >
          History
        </button>
        <button
          className={currentTab === 2 ? "active" : ""}
          onClick={() => setCurrentTab(2)}
        >
          Timer
        </button>
      </nav>

      {hasWorkoutInProgress && currentTab !== 0 && (
        <div className="progress-indicator">
          {workoutName
            ? `"${workoutName}" in progress`
            : "Workout in progress"}{" "}
          • Return to "Log Workout" to continue
        </div>
      )}

      {currentTab === 0 && (
        <LogWorkoutTab
          workoutName={workoutName}
          setWorkoutName={setWorkoutName}
          workoutExercises={workoutExercises}
          setWorkoutExercises={setWorkoutExercises}
          activeExercise={activeExercise}
          setActiveExercise={setActiveExercise}
          currentSets={currentSets}
          setCurrentSets={setCurrentSets}
          onAddWorkout={handleAddWorkout}
        />
      )}
      {currentTab === 1 && (
        <ViewWorkoutsTab
          workouts={workouts}
          onUpdateWorkouts={handleUpdateWorkouts}
        />
      )}
      {currentTab === 2 && <RestTimerTab />}

      <footer>© 2025 Strive</footer>
    </div>
  );
}

export default App;
