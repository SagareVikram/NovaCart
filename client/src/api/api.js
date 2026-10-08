import axios from "axios";

/**
 * NovaCart API base URL.
 *
 * Local:
 * http://localhost:5000/api
 *
 * Production:
 * Render backend URL from Vercel environment variable.
 */
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

/**
 * Central Axios instance.
 *
 * Every frontend feature will use this:
 * - authentication
 * - users
 * - products
 * - cart
 * - wishlist
 * - orders
 * - admin
 */
const api = axios.create({
  baseURL: API_BASE_URL,

  timeout: 15000,

  withCredentials: true,

  headers: {
    Accept: "application/json",
  },
});

/**
 * Request interceptor.
 *
 * If a JWT token exists in localStorage,
 * automatically send it as:
 *
 * Authorization: Bearer <token>
 *
 * This works together with the HTTP-only
 * cookie support already implemented
 * in the backend.
 */
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem(
        "novacart_token"
      );

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    /**
     * Do not manually force Content-Type
     * when sending FormData.
     *
     * The browser automatically creates
     * the required multipart boundary.
     */
    if (
      config.data instanceof FormData
    ) {
      delete config.headers[
        "Content-Type"
      ];
    } else if (
      !config.headers[
        "Content-Type"
      ]
    ) {
      config.headers[
        "Content-Type"
      ] =
        "application/json";
    }

    return config;
  },
  (error) => {
    return Promise.reject(
      error
    );
  }
);

/**
 * Response interceptor.
 *
 * Handles:
 * - normal API responses
 * - expired/invalid login sessions
 * - network failures
 */
api.interceptors.response.use(
  (response) => {
    return response;
  },

  (error) => {
    const status =
      error.response?.status;

    const requestUrl =
      error.config?.url ||
      "";

    /**
     * Do not automatically clear token
     * when login/register itself returns 401.
     */
    const isAuthRequest =
      requestUrl.includes(
        "/auth/login"
      ) ||
      requestUrl.includes(
        "/auth/register"
      );

    if (
      status === 401 &&
      !isAuthRequest
    ) {
      localStorage.removeItem(
        "novacart_token"
      );

      localStorage.removeItem(
        "novacart_user"
      );

      /**
       * Notify AuthContext or other
       * components that login state changed.
       */
      window.dispatchEvent(
        new Event(
          "novacart-auth-changed"
        )
      );
    }

    return Promise.reject(
      error
    );
  }
);

/**
 * Return a user-friendly message
 * from any Axios/API error.
 *
 * Usage:
 *
 * try {
 *   await api.get("/products");
 * } catch (error) {
 *   setError(getApiErrorMessage(error));
 * }
 */
const getApiErrorMessage = (
  error,
  fallbackMessage =
    "Something went wrong. Please try again."
) => {
  if (
    error.response?.data
      ?.message
  ) {
    return error.response
      .data.message;
  }

  if (
    error.code ===
    "ECONNABORTED"
  ) {
    return "The request took too long. Please try again.";
  }

  if (!error.response) {
    return "Unable to connect to the NovaCart server. Please check your internet connection or try again later.";
  }

  return fallbackMessage;
};

/**
 * Save authentication details.
 *
 * AuthContext will call this after login/register.
 */
const saveAuthSession = (
  token,
  user
) => {
  if (token) {
    localStorage.setItem(
      "novacart_token",
      token
    );
  }

  if (user) {
    localStorage.setItem(
      "novacart_user",
      JSON.stringify(user)
    );
  }

  window.dispatchEvent(
    new Event(
      "novacart-auth-changed"
    )
  );
};

/**
 * Clear authentication information.
 */
const clearAuthSession = () => {
  localStorage.removeItem(
    "novacart_token"
  );

  localStorage.removeItem(
    "novacart_user"
  );

  window.dispatchEvent(
    new Event(
      "novacart-auth-changed"
    )
  );
};

/**
 * Return locally cached user.
 *
 * This is used only for quick initial UI rendering.
 * AuthContext will still verify the user using /auth/me.
 */
const getStoredUser = () => {
  try {
    const storedUser =
      localStorage.getItem(
        "novacart_user"
      );

    if (!storedUser) {
      return null;
    }

    return JSON.parse(
      storedUser
    );
  } catch {
    localStorage.removeItem(
      "novacart_user"
    );

    return null;
  }
};

export {
  API_BASE_URL,
  getApiErrorMessage,
  saveAuthSession,
  clearAuthSession,
  getStoredUser,
};

export default api;