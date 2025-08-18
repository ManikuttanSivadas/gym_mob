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

  // --- REFS for outside click ---
  const profileBtnRef = useRef(null);
  const profileDropdownRef = useRef(null);

  useEffect(() => {
    const currentUser = AuthService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      const userWorkouts = AuthService.getUserWorkouts(currentUser.username);
      setWorkouts(userWorkouts);

      const currentWorkoutState = AuthService.getCurrentWorkoutState(
        currentUser.username
      );
      if (currentWorkoutState) {
        setWorkoutName(currentWorkoutState.workoutName || "");
        setWorkoutExercises(currentWorkoutState.workoutExercises || []);
        setActiveExercise(currentWorkoutState.activeExercise || null);
        setCurrentSets(currentWorkoutState.currentSets || []);
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      const workoutState = {
        workoutName,
        workoutExercises,
        activeExercise,
        currentSets,
      };
      AuthService.saveCurrentWorkoutState(user.username, workoutState);
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
    const userWorkouts = AuthService.getUserWorkouts(loggedInUser.username);
    setWorkouts(userWorkouts);

    const currentWorkoutState = AuthService.getCurrentWorkoutState(
      loggedInUser.username
    );
    if (currentWorkoutState) {
      setWorkoutName(currentWorkoutState.workoutName || "");
      setWorkoutExercises(currentWorkoutState.workoutExercises || []);
      setActiveExercise(currentWorkoutState.activeExercise || null);
      setCurrentSets(currentWorkoutState.currentSets || []);
    }
  }

  function handleAddWorkout(workout) {
    const newWorkouts = [workout, ...workouts];
    setWorkouts(newWorkouts);
    AuthService.saveUserWorkouts(user.username, newWorkouts);
    AuthService.clearCurrentWorkoutState(user.username);
  }

  function handleUpdateWorkouts(updatedWorkouts) {
    setWorkouts(updatedWorkouts);
    AuthService.saveUserWorkouts(user.username, updatedWorkouts);
  }

  function handleToggleTheme() {
    setTheme(theme === "light" ? "dark" : "light");
  }

  function handleLogout() {
    if (user) {
      AuthService.clearCurrentWorkoutState(user.username);
    }
    AuthService.logout();
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
                {(user.name || user.username)[0].toUpperCase()}
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
