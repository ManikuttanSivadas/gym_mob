import React, { useState, useEffect, useRef, useCallback } from "react";
import LogWorkoutTab from "./components/LogWorkout/LogWorkoutTab";
import ViewWorkoutsTab from "./components/ViewWorkouts/ViewWorkoutsTab";
import RestTimerTab from "./components/Timer/RestTimerTab";
import AuthPage from "./components/Auth/AuthPage";
import ProfilePage from "./components/Auth/ProfilePage";
import ThemeToggle from "./components/Common/ThemeToggle";
import ProfileDropdown from "./components/Auth/ProfileDropdown";
import AuthService from "./components/Auth/AuthService";
import "./App.css";

function App() {
  const [currentTab, setCurrentTab] = useState(() => {
    const savedTab = localStorage.getItem("currentTab");
    return savedTab ? parseInt(savedTab, 10) : 0;
  });
  const [workouts, setWorkouts] = useState([]);
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("appTheme");
    return savedTheme || "light";
  });
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [workoutsLoading, setWorkoutsLoading] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showProfilePage, setShowProfilePage] = useState(false);

  const [workoutName, setWorkoutName] = useState("");
  const [workoutExercises, setWorkoutExercises] = useState([]);
  const [activeExercise, setActiveExercise] = useState(null);
  const [currentSets, setCurrentSets] = useState([]);

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

      const uid = currentUser.uid;
      const email = currentUser.email;
      
      // Load profile photo from Firestore
      if (uid && email && typeof AuthService.getUserProfile === "function") {
        AuthService.getUserProfile(uid, email)
          .then((profileData) => {
            if (profileData && profileData.photo) {
              setUser((prev) => ({
                ...prev,
                photo: profileData.photo,
              }));
            }
          })
          .catch((error) => {
            console.error("Error loading profile on login:", error);
          });
      }

      // guard AuthService calls with a valid uid
      if (uid && typeof AuthService.getUserWorkouts === "function") {
        const userWorkouts = AuthService.getUserWorkouts(uid) || [];
        setWorkouts(userWorkouts);
      }

      if (uid && typeof AuthService.getCurrentWorkoutState === "function") {
        const currentWorkoutState = AuthService.getCurrentWorkoutState(uid);
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

  // subscribe to remote workouts when user is present
  useEffect(() => {
    if (!user) return;
    const uid = user.uid;
    const email = user.email;
    if (!uid || !email || typeof AuthService.subscribeToWorkouts !== "function") return;
    setWorkoutsLoading(true);
    const unsub = AuthService.subscribeToWorkouts(uid, email, (workoutsFromDb) => {
      setWorkouts(workoutsFromDb || []);
      setWorkoutsLoading(false);
    });
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, [user]);

  // persist current workout state when user changes or workout data changes
  // Using a debounce effect to prevent excessive Firestore writes
  useEffect(() => {
    const uid = user?.uid;
    const email = user?.email;
    if (!uid || !email || typeof AuthService.saveCurrentWorkoutState !== "function") return;
    
    // Debounce saves with a 500ms delay
    const timer = setTimeout(() => {
      const workoutState = { workoutName, workoutExercises, activeExercise, currentSets };
      AuthService.saveCurrentWorkoutState(uid, email, workoutState).catch(err => 
        console.error("Error saving workout state:", err)
      );
    }, 500);
    
    return () => clearTimeout(timer);
  }, [workoutName, workoutExercises, activeExercise, currentSets, user]);

  // Debounce localStorage writes for theme
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem("appTheme", theme);
      document.documentElement.setAttribute("data-theme", theme);
    }, 100);
    return () => clearTimeout(timer);
  }, [theme]);

  // Debounce localStorage writes for tab
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem("currentTab", currentTab.toString());
    }, 100);
    return () => clearTimeout(timer);
  }, [currentTab]);

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
    const uid = loggedInUser.uid;
    const email = loggedInUser.email;

    // Load profile photo from Firestore
    if (uid && email && typeof AuthService.getUserProfile === "function") {
      AuthService.getUserProfile(uid, email)
        .then((profileData) => {
          if (profileData && profileData.photo) {
            setUser((prev) => ({
              ...prev,
              photo: profileData.photo,
            }));
          }
        })
        .catch((error) => {
          console.error("Error loading profile on login:", error);
        });
    }

    if (uid && typeof AuthService.getUserWorkouts === "function") {
      const userWorkouts = AuthService.getUserWorkouts(uid) || [];
      setWorkouts(userWorkouts);
    } else {
      setWorkouts([]);
    }

    if (uid && typeof AuthService.getCurrentWorkoutState === "function") {
      const currentWorkoutState = AuthService.getCurrentWorkoutState(uid);
      if (currentWorkoutState) {
        setWorkoutName(currentWorkoutState.workoutName || "");
        setWorkoutExercises(currentWorkoutState.workoutExercises || []);
        setActiveExercise(currentWorkoutState.activeExercise || null);
        setCurrentSets(currentWorkoutState.currentSets || []);
      }
    }
  }

  // toggle theme (was referenced but not defined)
  const handleToggleTheme = useCallback(() => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  }, []);
  
  const handleAddWorkout = useCallback((workout) => {
    const newWorkouts = [workout, ...workouts];
    setWorkouts(newWorkouts);
    const uid = user?.uid;
    const email = user?.email;
    if (uid && email && typeof AuthService.saveUserWorkouts === "function") {
      AuthService.saveUserWorkouts(uid, email, newWorkouts);
    }
    if (uid && email && typeof AuthService.clearCurrentWorkoutState === "function") {
      AuthService.clearCurrentWorkoutState(uid, email);
    }
  }, [user, workouts]);

  const handleUpdateWorkouts = useCallback((updatedWorkouts) => {
    setWorkouts(updatedWorkouts);
    const uid = user?.uid;
    const email = user?.email;
    if (uid && email && typeof AuthService.saveUserWorkouts === "function") {
      AuthService.saveUserWorkouts(uid, email, updatedWorkouts);
    }
  }, [user]);

  const handleLogout = useCallback(() => {
    const uid = user?.uid;
    const email = user?.email;
    if (uid && email && typeof AuthService.clearCurrentWorkoutState === "function") {
      AuthService.clearCurrentWorkoutState(uid, email);
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
  }, [user]);

  const hasWorkoutInProgress =
    workoutName.trim() || workoutExercises.length > 0 || activeExercise;

  if (isLoading) {
    return (
      <div className="app-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="brand-logo">upTrace</div>
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

  if (showProfilePage) {
    return (
      <ProfilePage 
        user={user}
        onBack={() => setShowProfilePage(false)}
        onProfileSave={(updatedUser) => {
          setUser(updatedUser);
          setShowProfilePage(false);
        }}
      />
    );
  }

  return (
    <div className="app-container">
      <div className="app-header">
        <div className="brand-logo">upTrace</div>
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
                {user && user.photo ? (
                  <img src={user.photo} alt="Profile" className="profile-btn-avatar-image" />
                ) : (
                  getAvatarInitial(user)
                )}
              </div>
            </button>
            <div ref={profileDropdownRef}>
              <ProfileDropdown
                user={user}
                isOpen={showProfileDropdown}
                onClose={() => setShowProfileDropdown(false)}
                onLogout={handleLogout}
                onProfileClick={() => setShowProfilePage(true)}
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
          isLoading={workoutsLoading}
        />
      )}
      {currentTab === 2 && <RestTimerTab />}

      <footer>© 2025 upTrace</footer>
    </div>
  );
}

export default App;
