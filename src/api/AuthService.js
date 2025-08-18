const AuthService = {
  login(username, password) { /* … */ },
  signup(username, password, email) { /* … */ },
  googleSignup(googleUser) { /* … */ },
  logout() { /* … */ },
  getCurrentUser() { /* … */ },
  getUserWorkouts(username) { /* … */ },
  saveUserWorkouts(username, workouts) { /* … */ },
  getCurrentWorkoutState(username) { /* … */ },
  saveCurrentWorkoutState(username, workoutState) { /* … */ },
  clearCurrentWorkoutState(username) { /* … */ },
};

export default AuthService;
