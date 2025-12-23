/**
 * Security utilities for input validation and sanitization
 */

/**
 * Sanitize string input - trim and limit length
 * @param {string} input - The input to sanitize
 * @param {number} maxLength - Maximum allowed length (default: 100)
 * @returns {string} Sanitized input
 */
export const sanitizeString = (input, maxLength = 100) => {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, maxLength);
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} { valid: boolean, errors: string[] }
 */
export const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain an uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain a lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain a number');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Validate workout name
 * @param {string} name - Workout name to validate
 * @returns {boolean} True if valid
 */
export const isValidWorkoutName = (name) => {
  const sanitized = sanitizeString(name, 150);
  return sanitized.length >= 1 && sanitized.length <= 150;
};

/**
 * Validate exercise name
 * @param {string} name - Exercise name to validate
 * @returns {boolean} True if valid
 */
export const isValidExerciseName = (name) => {
  const sanitized = sanitizeString(name, 100);
  return sanitized.length >= 1 && sanitized.length <= 100;
};

/**
 * Validate weight value (in kg)
 * @param {number} weight - Weight to validate
 * @returns {boolean} True if valid
 */
export const isValidWeight = (weight) => {
  const num = parseFloat(weight);
  return !isNaN(num) && num > 0 && num <= 500; // Max 500 kg
};

/**
 * Validate reps count
 * @param {number} reps - Reps to validate
 * @returns {boolean} True if valid
 */
export const isValidReps = (reps) => {
  const num = parseInt(reps, 10);
  return !isNaN(num) && num > 0 && num <= 1000;
};

/**
 * Validate sets array
 * @param {array} sets - Array of sets to validate
 * @returns {boolean} True if valid
 */
export const isValidSets = (sets) => {
  if (!Array.isArray(sets) || sets.length === 0) return false;
  
  return sets.every(set => 
    isValidWeight(set.weight) && isValidReps(set.reps)
  );
};

/**
 * Validate exercises array
 * @param {array} exercises - Array of exercises to validate
 * @returns {boolean} True if valid
 */
export const isValidExercises = (exercises) => {
  if (!Array.isArray(exercises) || exercises.length === 0) return false;
  
  return exercises.every(ex =>
    isValidExerciseName(ex.name) && isValidSets(ex.sets || [])
  );
};

/**
 * Escape HTML special characters to prevent XSS
 * (React does this automatically, but useful for edge cases)
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
export const escapeHTML = (text) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
};

/**
 * Check for common XSS patterns
 * @param {string} input - Input to check
 * @returns {boolean} True if potential XSS detected
 */
export const hasXSSPatterns = (input) => {
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<embed/i,
    /<object/i
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
};

/**
 * Validate complete workout data
 * @param {object} workout - Workout object to validate
 * @returns {object} { valid: boolean, errors: string[] }
 */
export const validateWorkout = (workout) => {
  const errors = [];
  
  if (!workout || typeof workout !== 'object') {
    errors.push('Invalid workout data');
    return { valid: false, errors };
  }
  
  if (!isValidWorkoutName(workout.name)) {
    errors.push('Workout name must be 1-150 characters');
  }
  
  if (!isValidExercises(workout.exercises)) {
    errors.push('Invalid exercises or sets');
  }
  
  if (hasXSSPatterns(workout.name)) {
    errors.push('Workout name contains invalid characters');
  }
  
  if (workout.exercises && workout.exercises.some(ex => hasXSSPatterns(ex.name))) {
    errors.push('Exercise names contain invalid characters');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Rate limiting helper
 * @param {string} key - Unique identifier (e.g., email)
 * @param {number} maxAttempts - Max attempts allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {object} { allowed: boolean, remaining: number }
 */
export const checkRateLimit = (key, maxAttempts = 5, windowMs = 60000) => {
  const now = Date.now();
  const storageKey = `rateLimit_${key}`;
  
  let data = JSON.parse(localStorage.getItem(storageKey) || '{"attempts":0,"resetTime":0}');
  
  // Reset if window has passed
  if (now > data.resetTime) {
    data = { attempts: 1, resetTime: now + windowMs };
  } else {
    data.attempts++;
  }
  
  localStorage.setItem(storageKey, JSON.stringify(data));
  
  return {
    allowed: data.attempts <= maxAttempts,
    remaining: Math.max(0, maxAttempts - data.attempts)
  };
};

/**
 * Clear rate limit for a key
 * @param {string} key - Unique identifier
 */
export const clearRateLimit = (key) => {
  const storageKey = `rateLimit_${key}`;
  localStorage.removeItem(storageKey);
};
