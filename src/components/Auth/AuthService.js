const AuthService = {
  /* ────────── Account ────────── */
  login(username, password) {
    const users = JSON.parse(localStorage.getItem('gym_users') || '{}');
    const user = users[username];
    if (user && user.password === password) {
      localStorage.setItem('gym_current_user', username);
      return { success: true, user: { username, email: user.email } };
    }
    return { success: false, error: 'Invalid username or password' };
  },

  signup(username, password, email) {
    const users = JSON.parse(localStorage.getItem('gym_users') || '{}');
    if (users[username]) return { success: false, error: 'Username already exists' };
    if (username.length < 3) return { success: false, error: 'Username must be at least 3 characters' };
    if (password.length < 4) return { success: false, error: 'Password must be at least 4 characters' };

    users[username] = { password, email, createdAt: new Date().toISOString(), provider: 'local' };
    localStorage.setItem('gym_users', JSON.stringify(users));
    localStorage.setItem('gym_current_user', username);
    return { success: true, user: { username, email } };
  },

  /* ────────── Google signup helper (optional) ────────── */
//   googleSignup(googleUser) {
//     const users = JSON.parse(localStorage.getItem('gym_users') || '{}');
//     const username = googleUser.email.split('@')[0];
//     if (!users[username]) {
//       users[username] = {
//         email: googleUser.email,
//         name: googleUser.name,
//         picture: googleUser.picture,
//         createdAt: new Date().toISOString(),
//         provider: 'google',
//       };
//       localStorage.setItem('gym_users', JSON.stringify(users));
//     }
//     localStorage.setItem('gym_current_user', username);
//     return { success: true, user: { username, email: googleUser.email, name: googleUser.name } };
//   },

  /* ────────── Logout  - THIS IS THE MISSING FUNCTION ────────── */
  logout() {
    localStorage.removeItem('gym_current_user');
    if (typeof window.google !== 'undefined' && window.google.accounts?.id?.disableAutoSelect) {
      window.google.accounts.id.disableAutoSelect();
    }
  },

  /* ────────── Helpers ────────── */
  getCurrentUser() {
    const username = localStorage.getItem('gym_current_user');
    if (!username) return null;
    const users = JSON.parse(localStorage.getItem('gym_users') || '{}');
    const usr = users[username];
    return usr ? { username, email: usr.email, name: usr.name } : null;
  },

  getUserWorkouts(username) {
    return JSON.parse(localStorage.getItem(`gym_workouts_${username}`) || '[]');
  },
  saveUserWorkouts(username, workouts) {
    localStorage.setItem(`gym_workouts_${username}`, JSON.stringify(workouts));
  },

  getCurrentWorkoutState(username) {
    return JSON.parse(localStorage.getItem(`gym_current_workout_${username}`) || 'null');
  },
  saveCurrentWorkoutState(username, state) {
    if (state && (state.workoutName || state.workoutExercises?.length || state.activeExercise)) {
      localStorage.setItem(`gym_current_workout_${username}`, JSON.stringify(state));
    } else {
      localStorage.removeItem(`gym_current_workout_${username}`);
    }
  },
  clearCurrentWorkoutState(username) {
    localStorage.removeItem(`gym_current_workout_${username}`);
  },
};

export default AuthService;
