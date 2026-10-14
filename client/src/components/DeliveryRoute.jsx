import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext.jsx";

import Loader from "./Loader.jsx";


const DeliveryRoute = () => {
  const {
    loading,
    isAuthenticated,
    isDeliveryAgent,
  } = useAuth();

  const location =
    useLocation();


  /**
   * ============================================================
   * WAIT FOR AUTHENTICATION CHECK
   * ============================================================
   */
  if (loading) {
    return (
      <Loader
        fullPage
        text="Checking delivery access..."
      />
    );
  }


  /**
   * ============================================================
   * USER NOT LOGGED IN
   * ============================================================
   *
   * Redirect to the normal NovaCart login page.
   */
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from:
            location.pathname,
        }}
      />
    );
  }


  /**
   * ============================================================
   * LOGGED IN BUT NOT DELIVERY AGENT
   * ============================================================
   */
  if (!isDeliveryAgent) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }


  /**
   * ============================================================
   * DELIVERY AGENT ACCESS GRANTED
   * ============================================================
   */
  return <Outlet />;
};


export default DeliveryRoute;