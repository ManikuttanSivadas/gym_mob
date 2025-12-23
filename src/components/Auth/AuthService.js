import { auth } from "../../firebase";
import { db } from "../../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

const mapError = (e) => {
  // keep message simple for UI
  if (!e || !e.code) return e?.message || "Authentication error";
  switch (e.code) {
    case "auth/email-already-in-use":
      return "Email already in use";
    case "auth/invalid-email":
      return "Invalid email";
    case "auth/weak-password":
      return "Weak password (min 6 chars)";
    case "auth/wrong-password":
      return "Incorrect password";
    case "auth/user-not-found":
      return "No account found for that email";
    default:
      return e.message || e.code;
  }
};

function storageKeyWorkouts(uid) {
  return `workouts_${uid}`;
}
function storageKeyCurrentWorkout(uid) {
  return `currentWorkout_${uid}`;
}
function storageKeyProfile(uid) {
  return `profile_${uid}`;
}

const AuthService = {
  async signup(username, password, email) {
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);

      // try to set firebase displayName (best-effort)
      try {
        if (username && username.trim()) {
          await userCred.user.updateProfile?.({ displayName: username }) // safe call if sdk attaches method
            .catch(() => {}); // ignore update errors
        }
      } catch (e) {
        // no-op
      }

      const user = {
        uid: userCred.user.uid,
        displayName: userCred.user.displayName || username || null,
        username: username || (userCred.user.displayName || null),
        email: userCred.user.email || email || null,
      };

      // persist minimal user for other parts of the app
      try { localStorage.setItem("currentUser", JSON.stringify(user)); } catch (e) {}

      return { success: true, user };
    } catch (e) {
      return { success: false, error: mapError(e) };
    }
  },

  // sign in with email + password
  async login(identifier, password) {
    try {
      const userCred = await signInWithEmailAndPassword(auth, identifier, password);
      const user = {
        uid: userCred.user.uid,
        displayName: userCred.user.displayName || null,
        username: userCred.user.displayName || userCred.user.email || null,
        email: userCred.user.email || null,
      };
      try { localStorage.setItem("currentUser", JSON.stringify(user)); } catch (e) {}
      return { success: true, user };
    } catch (e) {
      return { success: false, error: mapError(e) };
    }
  },

  // sign out / clear persisted user + in-progress state
  async logout() {
    try {
      // attempt firebase sign out if available
      if (auth) {
        try { await signOut(auth); } catch (e) { /* ignore signOut failure */ }
      }
    } catch (e) {
      /* ignore */
    }

    // clear local persisted keys
    try {
      localStorage.removeItem("currentUser");
      localStorage.removeItem("currentWorkout");
      localStorage.removeItem("currentSets");
      // remove any other keys your app uses for session/state
    } catch (e) {
      /* ignore */
    }

    return { success: true };
  },

  getCurrentUser() {
    try {
      const fbUser = auth && auth.currentUser;
      if (fbUser) {
        return {
          uid: fbUser.uid,
          displayName: fbUser.displayName || null,
          username: fbUser.displayName || null,
          email: fbUser.email || null,
        };
      }
    } catch (e) { /* ignore */ }

    try {
      const raw = localStorage.getItem("currentUser");
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }

    return null;
  },

  // --- Firestore-backed workout storage (with localStorage fallback) ---

  // Return workouts immediately from localStorage if present, and trigger background sync from Firestore.
  getUserWorkouts(uid) {
    if (!uid) return [];
    try {
      const raw = localStorage.getItem(storageKeyWorkouts(uid));
      if (raw) {
        // start background sync
        (async () => {
          try {
            if (!db) return;
            const d = await getDoc(doc(db, "users", uid));
            const remote = (d.exists() && d.data().workouts) ? d.data().workouts : null;
            if (remote) localStorage.setItem(storageKeyWorkouts(uid), JSON.stringify(remote));
          } catch (e) { /* ignore background sync errors */ }
        })();
        return JSON.parse(raw);
      }
    } catch (err) { /* ignore */ }

    // no local cached data — trigger background fetch and return empty
    (async () => {
      try {
        if (!db) return;
        const d = await getDoc(doc(db, "users", uid));
        const remote = (d.exists() && d.data().workouts) ? d.data().workouts : [];
        localStorage.setItem(storageKeyWorkouts(uid), JSON.stringify(remote));
      } catch (e) { /* ignore */ }
    })();

    return [];
  },

  // Persist an array of workouts to Firestore (and localStorage)
  async saveUserWorkouts(uid, email, workouts) {
    if (!email) return { success: false, error: "Missing email" };
    try {
      try { localStorage.setItem(storageKeyWorkouts(uid), JSON.stringify(workouts)); } catch (e) {}
      if (db) {
        await setDoc(doc(db, "users", email), { workouts }, { merge: true });
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message || String(e) };
    }
  },

  // current workout state (in-progress)
  getCurrentWorkoutState(uid) {
    if (!uid) return null;
    try {
      const raw = localStorage.getItem(storageKeyCurrentWorkout(uid));
      if (raw) {
        // background sync optional
        (async () => {
          try {
            if (!db) return;
            const d = await getDoc(doc(db, "users", uid));
            const remote = (d.exists() && d.data().currentWorkout) ? d.data().currentWorkout : null;
            if (remote) localStorage.setItem(storageKeyCurrentWorkout(uid), JSON.stringify(remote));
          } catch (e) {}
        })();
        return JSON.parse(raw);
      }
    } catch (e) {}
    (async () => {
      try {
        if (!db) return;
        const d = await getDoc(doc(db, "users", uid));
        const remote = (d.exists() && d.data().currentWorkout) ? d.data().currentWorkout : null;
        if (remote) localStorage.setItem(storageKeyCurrentWorkout(uid), JSON.stringify(remote));
      } catch (e) {}
    })();
    return null;
  },

  async saveCurrentWorkoutState(uid, email, state) {
    if (!email) return { success: false, error: "Missing email" };
    try {
      try { localStorage.setItem(storageKeyCurrentWorkout(uid), JSON.stringify(state)); } catch (e) {}
      if (db) {
        await setDoc(doc(db, "users", email), { currentWorkout: state }, { merge: true });
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message || String(e) };
    }
  },

  async clearCurrentWorkoutState(uid, email) {
    try {
      if (uid) {
        try { localStorage.removeItem(storageKeyCurrentWorkout(uid)); } catch (e) {}
        if (db && email) {
          // clear field by setting to null (merge)
          await setDoc(doc(db, "users", email), { currentWorkout: null }, { merge: true });
        }
      } else {
        // clear generic keys
        try { localStorage.removeItem("currentWorkout"); localStorage.removeItem("currentSets"); } catch (e) {}
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message || String(e) };
    }
  },

  // Save user profile data to Firestore
  async saveUserProfile(uid, email, profileData) {
    if (!email) return { success: false, error: "Missing email" };
    try {
      // Save to localStorage with uid-specific key
      try { localStorage.setItem(storageKeyProfile(uid), JSON.stringify(profileData)); } catch (e) {}
      
      if (db) {
        await setDoc(doc(db, "users", email), { profile: profileData }, { merge: true });
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message || String(e) };
    }
  },

  // Get user profile data from Firestore
  async getUserProfile(uid, email) {
    if (!email) return null;
    try {
      if (db) {
        const d = await getDoc(doc(db, "users", email));
        if (d.exists() && d.data().profile) {
          return d.data().profile;
        }
      }
    } catch (e) { /* ignore */ }
    return null;
  },

  // subscribe to workouts in Firestore; callback receives array of workouts
  subscribeToWorkouts(uid, email, cb) {
    if (!email || !db || typeof cb !== "function") return () => {};
    const userDoc = doc(db, "users", email);
    const unsub = onSnapshot(
      userDoc,
      (snap) => {
        const remote = snap.exists() && snap.data().workouts ? snap.data().workouts : [];
        try { localStorage.setItem(storageKeyWorkouts(uid), JSON.stringify(remote)); } catch (e) {}
        cb(remote);
      },
      (err) => {
        // optional: surface error to console
        console.error("subscribeToWorkouts error:", err);
      }
    );
    return unsub;
  },
};

export default AuthService;
