import { auth } from "../../firebase";
import { db } from "../../firebase";
import { storage } from "../../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { sanitizeString, isValidEmail, checkRateLimit, clearRateLimit } from "../../utils/security";

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
      // Input validation
      if (!email || !isValidEmail(email)) {
        return { success: false, error: "Invalid email address" };
      }
      
      if (!username || username.trim().length < 2) {
        return { success: false, error: "Username must be at least 2 characters" };
      }
      
      if (!password || password.length < 8) {
        return { success: false, error: "Password must be at least 8 characters" };
      }
      
      // Rate limiting check
      const rateLimit = checkRateLimit(email, 5, 3600000); // 5 attempts per hour
      if (!rateLimit.allowed) {
        return { success: false, error: "Too many signup attempts. Please try again later." };
      }
      
      // Sanitize inputs
      const sanitizedUsername = sanitizeString(username, 50);
      const sanitizedEmail = email.toLowerCase().trim();
      
      const userCred = await createUserWithEmailAndPassword(auth, sanitizedEmail, password);

      // try to set firebase displayName (best-effort)
      try {
        if (sanitizedUsername) {
          await userCred.user.updateProfile?.({ displayName: sanitizedUsername })
            .catch(() => {}); // ignore update errors
        }
      } catch (e) {
        // no-op
      }

      const user = {
        uid: userCred.user.uid,
        displayName: userCred.user.displayName || sanitizedUsername || null,
        username: sanitizedUsername || (userCred.user.displayName || null),
        email: sanitizedEmail,
      };

      // persist minimal user for other parts of the app
      try { localStorage.setItem("currentUser", JSON.stringify(user)); } catch (e) {}
      
      // Clear rate limit on successful signup
      clearRateLimit(email);

      return { success: true, user };
    } catch (e) {
      return { success: false, error: mapError(e) };
    }
  },

  // sign in with email + password
  async login(identifier, password) {
    try {
      // Input validation
      if (!identifier || !password) {
        return { success: false, error: "Email and password required" };
      }
      
      // Rate limiting check
      const rateLimit = checkRateLimit(identifier, 10, 900000); // 10 attempts per 15 minutes
      if (!rateLimit.allowed) {
        return { success: false, error: "Too many login attempts. Please try again later." };
      }
      
      const sanitizedEmail = identifier.toLowerCase().trim();
      
      const userCred = await signInWithEmailAndPassword(auth, sanitizedEmail, password);
      const user = {
        uid: userCred.user.uid,
        displayName: userCred.user.displayName || null,
        username: userCred.user.displayName || userCred.user.email || null,
        email: userCred.user.email || null,
      };
      try { localStorage.setItem("currentUser", JSON.stringify(user)); } catch (e) {}
      
      // Clear rate limit on successful login
      clearRateLimit(identifier);
      
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

  async sendPasswordReset(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return {
        success: true,
        message: "Password reset email sent",
      };
    } catch (error) {
      const mappedError = mapError(error);
      return {
        success: false,
        error: mappedError,
      };
    }
  },

  // Upload profile photo to Firebase Storage (with compression)
  async uploadProfilePhoto(uid, file) {
    if (!storage || !file) return null;
    try {
      // Compress image before upload
      const compressedBlob = await this.compressImage(file);
      const storageRef = ref(storage, `profile_photos/${uid}`);
      await uploadBytes(storageRef, compressedBlob);
      const photoUrl = await getDownloadURL(storageRef);
      return photoUrl;
    } catch (e) {
      console.error("Error uploading profile photo:", e);
      return null;
    }
  },

  // Compress image to reduce upload time
  async compressImage(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Resize if larger than 800px
          if (width > 800 || height > 800) {
            const ratio = Math.min(800 / width, 800 / height);
            width *= ratio;
            height *= ratio;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob with quality 0.7 (70%)
          canvas.toBlob(
            (blob) => resolve(blob || file),
            'image/jpeg',
            0.7
          );
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  },

  // Delete profile photo from Firebase Storage
  async deleteProfilePhoto(uid) {
    if (!storage) return;
    try {
      const storageRef = ref(storage, `profile_photos/${uid}`);
      await deleteObject(storageRef);
    } catch (e) {
      console.error("Error deleting profile photo:", e);
    }
  },
};

export default AuthService;
