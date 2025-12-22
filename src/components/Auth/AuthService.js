import { auth } from "../../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";

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

  // ensure callers can clear any persisted "current workout" state
  clearCurrentWorkoutState() {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem("currentWorkout");
        localStorage.removeItem("currentSets");
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err?.message || "Failed to clear state" };
    }
  },
};

export default AuthService;
