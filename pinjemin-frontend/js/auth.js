/**
 * PINJEMIN — AUTH UTILITIES
 * Client-side authentication helpers.
 * Manages JWT token storage, login state checks, and logout.
 */

const TOKEN_KEY = 'pinjemin_token';
const USER_KEY  = 'pinjemin_user';

/**
 * Get the stored JWT token.
 * @returns {string|null}
 */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Get the stored user object.
 * @returns {object|null}
 */
export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
}

/**
 * Check if a user is currently logged in.
 * @returns {boolean}
 */
export function isLoggedIn() {
  return !!getToken() && !!getUser();
}

/**
 * Save token and user data after a successful login.
 * @param {string} token
 * @param {object} user
 */
export function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Clear session data (logout).
 */
export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Redirect to login.html if user is not authenticated.
 * Call this at the top of pages that require a login.
 */
export function requireLogin() {
  if (!isLoggedIn()) {
    window.location.replace('login.html');
  }
}

/**
 * Build the Authorization header object for use in fetch calls.
 * @returns {object}
 */
export function getAuthHeader() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Logout: clear session and redirect to login page.
 * @param {string} [redirectPath='login.html']
 */
export function logout(redirectPath = 'login.html') {
  clearSession();
  window.location.replace(redirectPath);
}
