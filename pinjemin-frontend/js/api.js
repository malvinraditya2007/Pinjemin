// Configuration
const BASE_URL = 'http://localhost:3000/v1';

// Prefer the logged-in user's ID from localStorage (set after JWT login).
// Fall back to the seed user for backward-compatible local dev.
function getCurrentUserId() {
  try {
    const user = JSON.parse(localStorage.getItem('pinjemin_user') || 'null');
    return user?.id || 'user-001';
  } catch {
    return 'user-001';
  }
}

function getJwtToken() {
  return localStorage.getItem('pinjemin_token') || null;
}

// Export a stable constant for parts of the app that imported it before
const CURRENT_USER_ID = 'user-001';

/**
 * In-flight request deduplication map.
 * When multiple callers request the same GET endpoint before the first resolves,
 * they all share the same promise — avoiding duplicate network round-trips.
 */
const _inflight = new Map();

/**
 * Core API fetch wrapper that injects the auth header and handles JSON parsing.
 * GET requests are deduplicated so concurrent identical calls share one fetch.
 */
async function fetchAPI(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const method = (options.method || 'GET').toUpperCase();

  // Deduplicate concurrent GET requests
  if (method === 'GET' && _inflight.has(url)) {
    return _inflight.get(url);
  }

  const token = getJwtToken();
  const headers = {
    'Content-Type': 'application/json',
    'x-user-id': getCurrentUserId(), // kept for mock auth backward compat
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const promise = (async () => {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = 'An error occurred';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || errorData.error || response.statusText;
      } catch (e) {
        errorMessage = response.statusText;
      }
      throw new Error(errorMessage);
    }

    // Handle 204 No Content
    if (response.status === 204) return null;

    return response.json();
  })();

  if (method === 'GET') {
    _inflight.set(url, promise);
    // Remove from cache once settled (success or error)
    promise.finally(() => _inflight.delete(url));
  }

  return promise;
}

// API Service Object
const api = {
  // Users
  users: {
    getMe: () => fetchAPI('/users/me'),
    updateMe: (data) => fetchAPI('/users/me', { method: 'PUT', body: JSON.stringify(data) }),
    getById: (id) => fetchAPI(`/users/${id}`),
    getTopLenders: () => fetchAPI('/users/top'),
    getImpact: () => fetchAPI('/users/me/impact'),
  },

  // Items
  items: {
    getAll: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return fetchAPI(`/items${qs ? `?${qs}` : ''}`);
    },
    getById: (id) => fetchAPI(`/items/${id}`),
    create: (data) => fetchAPI('/items', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => fetchAPI(`/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => fetchAPI(`/items/${id}`, { method: 'DELETE' }),
  },

  // Requests
  requests: {
    getSent: () => fetchAPI('/requests/sent'),
    getReceived: () => fetchAPI('/requests/received'),
    create: (data) => fetchAPI('/requests', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id, status, rejectReason = null) => fetchAPI(`/requests/${id}/status`, { 
      method: 'PUT', 
      body: JSON.stringify({ status, rejectReason }) 
    }),
  },

  // Ratings
  ratings: {
    submit: (data) => fetchAPI('/ratings', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Notifications
  notifications: {
    getAll: () => fetchAPI('/notifications'),
    markAllRead: () => fetchAPI('/notifications/read-all', { method: 'PUT' }),
  }
};

export default api;
export { CURRENT_USER_ID };
