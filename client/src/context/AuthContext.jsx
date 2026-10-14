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
   * ============================================================
   * STORE USER LOCALLY
   * ============================================================
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
   * ============================================================
   * REFRESH CURRENT USER
   * ============================================================
   *
   * GET /api/auth/me
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
           * Invalid/expired login
           * or inactive account.
           */
          if (
            status === 401 ||
            status === 403
          ) {
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

              try {
                await api.post(
                  "/auth/logout"
                );
              } catch {
                // Local authentication state
                // is already cleared.
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
           * Temporary network/server
           * error.
           *
           * Keep cached user information
           * so the interface does not log
           * the user out unnecessarily.
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
   * ============================================================
   * CUSTOMER REGISTRATION
   * ============================================================
   *
   * POST /api/auth/register
   *
   * Public registration always creates
   * normal customer accounts.
   *
   * Delivery agents are created only
   * by the administrator.
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
   * ============================================================
   * LOGIN
   * ============================================================
   *
   * POST /api/auth/login
   *
   * Supported roles:
   *
   * user
   * admin
   * delivery_agent
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

            role:
              loggedInUser.role,

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
   * ============================================================
   * LOGOUT
   * ============================================================
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
   * ============================================================
   * UPDATE CURRENT USER
   * ============================================================
   *
   * Used after:
   *
   * - customer profile changes
   * - saved address changes
   * - delivery agent availability changes
   * - future profile changes
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
          (
            currentUser
          ) => {
            if (
              !currentUser
            ) {
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
   * ============================================================
   * CLEAR AUTH ERROR
   * ============================================================
   */
  const clearAuthError =
    useCallback(
      () => {
        setAuthError("");
      },
      []
    );


  /**
   * ============================================================
   * VERIFY LOGIN ON APP START
   * ============================================================
   */
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);


  /**
   * ============================================================
   * MULTI-TAB AUTH SYNCHRONIZATION
   * ============================================================
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
   * ============================================================
   * CUSTOM NOVACART AUTH EVENT
   * ============================================================
   *
   * api.js dispatches this event after
   * authentication state changes.
   *
   * Do not call /auth/me here because
   * it can cause request/event loops.
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


  /**
   * ============================================================
   * AUTHENTICATION FLAGS
   * ============================================================
   */
  const isAuthenticated =
    Boolean(user);


  /**
   * Administrator account.
   */
  const isAdmin =
    Boolean(
      user &&
        user.role ===
          "admin"
    );


  /**
   * Normal NovaCart customer.
   */
  const isCustomer =
    Boolean(
      user &&
        user.role ===
          "user"
    );


  /**
   * Delivery Agent.
   *
   * NEW ROLE.
   */
  const isDeliveryAgent =
    Boolean(
      user &&
        user.role ===
          "delivery_agent"
    );


  /**
   * ============================================================
   * ROLE HELPERS
   * ============================================================
   */

  const hasRole =
    useCallback(
      (role) => {
        return Boolean(
          user &&
            user.role ===
              role
        );
      },
      [user]
    );


  const hasAnyRole =
    useCallback(
      (
        allowedRoles = []
      ) => {
        if (
          !user ||
          !Array.isArray(
            allowedRoles
          )
        ) {
          return false;
        }

        return allowedRoles.includes(
          user.role
        );
      },
      [user]
    );


  /**
   * ============================================================
   * CONTEXT VALUE
   * ============================================================
   */
  const value =
    useMemo(
      () => ({
        /**
         * Current authenticated user.
         */
        user,

        loading,

        authError,


        /**
         * Authentication state.
         */
        isAuthenticated,


        /**
         * Role flags.
         */
        isAdmin,

        isCustomer,

        isDeliveryAgent,


        /**
         * Generic role helpers.
         */
        hasRole,

        hasAnyRole,


        /**
         * Authentication actions.
         */
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
        isDeliveryAgent,

        hasRole,
        hasAnyRole,

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