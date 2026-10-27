/* assets/js/api.js
 * Central API client for NumbaHub.
 * Exposes: apiFetch, getToken, setToken, clearToken, getUser, setUser, logout, ApiError
 */
(function (global) {
  "use strict";

  const API_URL = "http://localhost:5000/api";
  const TOKEN_KEY = "token";
  const USER_KEY  = "user";

  /* ---------------- token / user storage ---------------- */
  const getToken   = () => localStorage.getItem(TOKEN_KEY);
  const setToken   = (t) => localStorage.setItem(TOKEN_KEY, t);
  const clearToken = () => localStorage.removeItem(TOKEN_KEY);

  const getUser = () => {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || "null"); }
    catch { return null; }
  };
  const setUser = (u) => {
    if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
    else localStorage.removeItem(USER_KEY);
  };

  /* ---------------- path helpers (works from / and /pages/) ---------------- */
  const basePath = () =>
    window.location.pathname.includes("/pages/") ? "../" : "./";

  const loginUrl = () => `${basePath()}pages/login.html`;

  /**
   * Log the user out and send them to the login page.
   * @param {"expired"|undefined} reason
   */
  const logout = (reason) => {
    clearToken();
    setUser(null);
    const url = loginUrl() + (reason ? `?reason=${encodeURIComponent(reason)}` : "");
    window.location.replace(url);
  };

  /* ---------------- error type ---------------- */
  class ApiError extends Error {
    constructor(message, status = 0, code = "ERROR") {
      super(message);
      this.name = "ApiError";
      this.status = status;
      this.code = code;
    }
  }

  /* ---------------- main fetch wrapper ---------------- */
  /**
   * @param {string} endpoint  e.g. "/auth/login"
   * @param {object} [options]
   * @param {boolean} [options.auth=true]  attach bearer token + auto-logout on 401.
   *                                       Set to false for /auth/login and /auth/register.
   */
  async function apiFetch(endpoint, options = {}) {
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
      throw new ApiError(
        "Network error — please check your connection and try again.",
        0,
        "NETWORK_ERROR"
      );
    }

    /* Parse body safely (204 / empty / non-JSON safe) */
    let data = null;
    const raw = await response.text();
    if (raw) {
      try { data = JSON.parse(raw); }
      catch { data = { message: raw }; }
    }

    /* Protected call + 401 → session expired, send to login */
    if (response.status === 401 && auth) {
      logout("expired");
      throw new ApiError(
        "Your session has expired. Please log in again.",
        401,
        "SESSION_EXPIRED"
      );
    }

    /* Any other non-2xx → throw a clean ApiError with backend message */
    if (!response.ok) {
      throw new ApiError(
        data?.message || `Request failed (${response.status}).`,
        response.status,
        data?.code || "REQUEST_FAILED"
      );
    }

    return data;
  }

  /* ---------------- export ---------------- */
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