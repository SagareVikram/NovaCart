import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import api, {
  clearAuthSession,
  getApiErrorMessage,
  getStoredUser,
  saveAuthSession,
} from "../api/api.js";

const AuthContext =
  createContext(null);

const AuthProvider = ({
  children,
}) => {
  const [
    user,
    setUser,
  ] = useState(
    () => getStoredUser()
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    authError,
    setAuthError,
  ] = useState("");

  /**
   * Store user locally without emitting
   * another auth-change event.
   *
   * saveAuthSession() is reserved for
   * login/register because it also stores
   * the JWT token and broadcasts a change.
   */
  const storeUser =
    useCallback(
      (nextUser) => {
        setUser(nextUser);

        if (nextUser) {
          localStorage.setItem(
            "novacart_user",
            JSON.stringify(
              nextUser
            )
          );
        } else {
          localStorage.removeItem(
            "novacart_user"
          );
        }
      },
      []
    );

  /**
   * Verify the current authenticated user.
   *
   * IMPORTANT:
   * This callback deliberately does NOT
   * depend on "user".
   *
   * That prevents repeated /auth/me requests
   * whenever the user object is refreshed.
   */
  const refreshUser =
    useCallback(
      async ({
        silent = false,
      } = {}) => {
        try {
          if (!silent) {
            setLoading(true);
          }

          const response =
            await api.get(
              "/auth/me"
            );

          const currentUser =
            response.data?.user ||
            null;

          storeUser(
            currentUser
          );

          setAuthError("");

          return {
            success: true,
            user:
              currentUser,
          };
        } catch (error) {
          const status =
            error.response
              ?.status;

          /**
           * 401:
           * token/cookie is invalid or
           * expired.
           *
           * 403:
           * account may have been disabled.
           */
          if (
            status === 401 ||
            status === 403
          ) {
            /**
             * Clear directly here rather
             * than calling clearAuthSession()
             * first.
             *
             * clearAuthSession() emits the
             * custom auth event. Direct
             * clearing avoids creating a
             * refresh-event-refresh loop.
             */
            localStorage.removeItem(
              "novacart_token"
            );

            localStorage.removeItem(
              "novacart_user"
            );

            setUser(null);

            if (
              status === 403
            ) {
              setAuthError(
                getApiErrorMessage(
                  error,
                  "Your account is no longer available."
                )
              );

              /**
               * Logout route is public and
               * safely clears the HTTP-only
               * authentication cookie.
               */
              try {
                await api.post(
                  "/auth/logout"
                );
              } catch {
                // Local session is already
                // cleared, so nothing else
                // is required here.
              }
            } else {
              setAuthError("");
            }

            return {
              success: false,
              user: null,
            };
          }

          /**
           * Keep the locally cached user on
           * temporary network/server errors.
           */
          console.error(
            "Unable to refresh user:",
            error
          );

          return {
            success: false,
            user:
              getStoredUser(),
            message:
              getApiErrorMessage(
                error,
                "Unable to verify your account right now."
              ),
          };
        } finally {
          if (!silent) {
            setLoading(false);
          }
        }
      },
      [storeUser]
    );

  /**
   * Register customer.
   *
   * POST /api/auth/register
   */
  const register =
    useCallback(
      async ({
        name,
        email,
        password,
        phone = "",
      }) => {
        try {
          setAuthError("");

          const response =
            await api.post(
              "/auth/register",
              {
                name,
                email,
                password,
                phone,
              }
            );

          const {
            token,
            user:
              registeredUser,
          } =
            response.data;

          if (
            !registeredUser
          ) {
            throw new Error(
              "Registration completed but user information was not returned."
            );
          }

          saveAuthSession(
            token,
            registeredUser
          );

          setUser(
            registeredUser
          );

          return {
            success: true,

            user:
              registeredUser,

            message:
              response.data
                ?.message ||
              "Registration successful.",
          };
        } catch (error) {
          const message =
            getApiErrorMessage(
              error,
              error.message ||
                "Unable to create your account."
            );

          setAuthError(
            message
          );

          return {
            success: false,
            message,
          };
        }
      },
      []
    );

  /**
   * Login customer/admin.
   *
   * POST /api/auth/login
   */
  const login =
    useCallback(
      async ({
        email,
        password,
      }) => {
        try {
          setAuthError("");

          const response =
            await api.post(
              "/auth/login",
              {
                email,
                password,
              }
            );

          const {
            token,
            user:
              loggedInUser,
          } =
            response.data;

          if (
            !loggedInUser
          ) {
            throw new Error(
              "Login succeeded but user information was not returned."
            );
          }

          saveAuthSession(
            token,
            loggedInUser
          );

          setUser(
            loggedInUser
          );

          return {
            success: true,

            user:
              loggedInUser,

            message:
              response.data
                ?.message ||
              "Login successful.",
          };
        } catch (error) {
          const message =
            getApiErrorMessage(
              error,
              error.message ||
                "Unable to log in."
            );

          setAuthError(
            message
          );

          return {
            success: false,
            message,
          };
        }
      },
      []
    );

  /**
   * Logout.
   *
   * POST /api/auth/logout
   */
  const logout =
    useCallback(
      async () => {
        let message =
          "Logout successful.";

        try {
          const response =
            await api.post(
              "/auth/logout"
            );

          message =
            response.data
              ?.message ||
            message;
        } catch (error) {
          /**
           * The browser session still needs
           * to be cleared even when the
           * backend cannot be reached.
           */
          console.error(
            "Backend logout error:",
            error
          );
        } finally {
          clearAuthSession();
          setUser(null);
          setAuthError("");
        }

        return {
          success: true,
          message,
        };
      },
      []
    );

  /**
   * Merge updated profile data into the
   * authenticated user.
   *
   * Used after profile/address changes.
   */
  const updateCurrentUser =
    useCallback(
      (updatedUser) => {
        if (
          !updatedUser ||
          typeof updatedUser !==
            "object"
        ) {
          return;
        }

        setUser(
          (currentUser) => {
            if (!currentUser) {
              const nextUser = {
                ...updatedUser,
              };

              localStorage.setItem(
                "novacart_user",
                JSON.stringify(
                  nextUser
                )
              );

              return nextUser;
            }

            const nextUser = {
              ...currentUser,
              ...updatedUser,
            };

            localStorage.setItem(
              "novacart_user",
              JSON.stringify(
                nextUser
              )
            );

            return nextUser;
          }
        );
      },
      []
    );

  /**
   * Clear auth message manually.
   */
  const clearAuthError =
    useCallback(() => {
      setAuthError("");
    }, []);

  /**
   * Verify session once when the application
   * first starts.
   */
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  /**
   * Synchronize authentication state when
   * another browser tab changes localStorage.
   *
   * Browser "storage" events fire only in
   * other tabs/windows, not the tab that made
   * the change.
   */
  useEffect(() => {
    const handleStorage =
      (event) => {
        if (
          ![
            "novacart_user",
            "novacart_token",
          ].includes(
            event.key
          )
        ) {
          return;
        }

        setUser(
          getStoredUser()
        );
      };

    window.addEventListener(
      "storage",
      handleStorage
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, []);

  /**
   * api.js broadcasts this event after
   * login/logout/session invalidation.
   *
   * We only synchronize local state here.
   * We do NOT call /auth/me here, preventing
   * event -> request -> event loops.
   */
  useEffect(() => {
    const handleAuthChange =
      () => {
        setUser(
          getStoredUser()
        );
      };

    window.addEventListener(
      "novacart-auth-changed",
      handleAuthChange
    );

    return () => {
      window.removeEventListener(
        "novacart-auth-changed",
        handleAuthChange
      );
    };
  }, []);

  const isAuthenticated =
    Boolean(user);

  const isAdmin =
    Boolean(
      user &&
        user.role ===
          "admin"
    );

  const isCustomer =
    Boolean(
      user &&
        user.role ===
          "user"
    );

  const value =
    useMemo(
      () => ({
        user,

        loading,

        authError,

        isAuthenticated,
        isAdmin,
        isCustomer,

        register,
        login,
        logout,

        refreshUser,
        updateCurrentUser,
        clearAuthError,
      }),
      [
        user,
        loading,
        authError,
        isAuthenticated,
        isAdmin,
        isCustomer,
        register,
        login,
        logout,
        refreshUser,
        updateCurrentUser,
        clearAuthError,
      ]
    );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context =
    useContext(
      AuthContext
    );

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider."
    );
  }

  return context;
};

export {
  AuthContext,
  AuthProvider,
  useAuth,
};