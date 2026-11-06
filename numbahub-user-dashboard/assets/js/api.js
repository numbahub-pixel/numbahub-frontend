/* assets/js/api.js */
(function (global) {
  "use strict";

  // 🟢 AUTO-DETECT: Use local backend if on localhost, otherwise use Render
  const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api" 
    : "https://numbahub-backend.onrender.com/api";

  const TOKEN_KEY = "token";
  const USER_KEY  = "user";
  const ACTIVITY_KEY = "lastActivity";
  
  // 🟢 INACTIVITY TIMEOUT: 10 Minutes
  const INACTIVITY_TIMEOUT = 10 * 60 * 1000; 
  let inactivityTimer;

  // --- Token & User Management ---
  const getToken   = () => localStorage.getItem(TOKEN_KEY);
  
  const setToken   = (t) => {
    localStorage.setItem(TOKEN_KEY, t);
    localStorage.setItem(ACTIVITY_KEY, Date.now().toString());
    startInactivityTimer();
  };
  
  const clearToken = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ACTIVITY_KEY);
  };

  const getUser = () => {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || "null"); }
    catch { return null; }
  };
  
  const setUser = (u) => {
    if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
    else localStorage.removeItem(USER_KEY);
  };

  const basePath = () =>
    window.location.pathname.includes("/pages/") ? "../" : "./";

  const loginUrl = () => `${basePath()}pages/login.html`;

  const logout = (reason) => {
    clearToken();
    setUser(null);
    if (inactivityTimer) clearTimeout(inactivityTimer);
    
    const url = loginUrl() + (reason ? `?reason=${encodeURIComponent(reason)}` : "");
    window.location.replace(url);
  };

  // --- 🟢 INACTIVITY TRACKER LOGIC ---
  const updateActivity = () => {
    if (getToken()) {
      localStorage.setItem(ACTIVITY_KEY, Date.now().toString());
    }
  };

  const startInactivityTimer = () => {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    
    if (getToken()) {
      inactivityTimer = setTimeout(() => {
        alert("Your session has expired due to inactivity. Please log in again.");
        logout("expired");
      }, INACTIVITY_TIMEOUT);
    }
  };

  // Check if the user closed the tab and came back later
  const checkInactivityOnLoad = () => {
    const token = getToken();
    const lastActivity = localStorage.getItem(ACTIVITY_KEY);
    
    if (token && lastActivity) {
      const timePassed = Date.now() - parseInt(lastActivity, 10);
      if (timePassed > INACTIVITY_TIMEOUT) {
        alert("Your session has expired due to inactivity. Please log in again.");
        logout("expired");
        return false;
      }
    }
    return true;
  };

  // Listen for user interactions to keep the session alive
  ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, () => {
      updateActivity();
      startInactivityTimer();
    }, { passive: true });
  });

  // Initialize tracker on page load
  if (getToken()) {
    if (checkInactivityOnLoad()) {
      startInactivityTimer();
    }
  }

  // --- API FETCH WRAPPER ---
  class ApiError extends Error {
    constructor(message, status = 0, code = "ERROR") {
      super(message);
      this.name = "ApiError";
      this.status = status;
      this.code = code;
    }
  }

  async function apiFetch(endpoint, options = {}) {
    // Any API call also counts as activity
    updateActivity();
    startInactivityTimer();

    const { auth = true, ...rest } = options;
    const token = getToken();

    const headers = {
      Accept: "application/json",
      ...(rest.body ? { "Content-Type": "application/json" } : {}),
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...(rest.headers || {}),
    };

    let response;
    try {
      response = await fetch(`${API_URL}${endpoint}`, { ...rest, headers });
    } catch (networkErr) {
      throw new ApiError("Network error — is your backend running?", 0, "NETWORK_ERROR");
    }

    let data = null;
    const raw = await response.text();
    if (raw) {
      try { data = JSON.parse(raw); }
      catch { data = { message: raw }; } // If it returns HTML (like a 404 page), wrap it
    }

    if (response.status === 401 && auth) {
      logout("expired");
      throw new ApiError("Your session has expired. Please log in again.", 401, "SESSION_EXPIRED");
    }

    if (!response.ok) {
      if (response.status === 404 && data?.message?.includes("Cannot")) {
         throw new ApiError("Backend route not found. Restart your server.", 404, "ROUTE_NOT_FOUND");
      }
      throw new ApiError(data?.message || `Request failed (${response.status}).`, response.status, data?.code || "REQUEST_FAILED");
    }

    return data;
  }

  // --- EXPORT TO GLOBAL SCOPE ---
  global.API_URL     = API_URL;
  global.ApiError    = ApiError;
  global.getToken    = getToken;
  global.setToken    = setToken;
  global.clearToken  = clearToken;
  global.getUser     = getUser;
  global.setUser     = setUser;
  global.logout      = logout;
  global.apiFetch    = apiFetch;

})(window);