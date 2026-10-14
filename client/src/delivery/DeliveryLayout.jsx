import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import {
  FaChartLine,
  FaClipboardList,
  FaHistory,
  FaHome,
  FaSignOutAlt,
  FaTruck,
  FaUserCircle,
} from "react-icons/fa";

import {
  useAuth,
} from "../context/AuthContext.jsx";


const DeliveryLayout = () => {
  const navigate =
    useNavigate();

  const {
    user,
    logout,
  } =
    useAuth();


  /**
   * ============================================================
   * LOGOUT
   * ============================================================
   */
  const handleLogout =
    async () => {
      try {
        await logout();
      } finally {
        navigate(
          "/login",
          {
            replace:
              true,
          }
        );
      }
    };


  /**
   * ============================================================
   * DELIVERY NAVIGATION
   * ============================================================
   */
  const navigationItems = [
    {
      label:
        "Dashboard",

      path:
        "/delivery",

      icon:
        FaHome,

      end:
        true,
    },

    {
      label:
        "Assigned Orders",

      path:
        "/delivery/orders",

      icon:
        FaClipboardList,
    },

    {
      label:
        "Active Deliveries",

      path:
        "/delivery/active",

      icon:
        FaTruck,
    },

    {
      label:
        "Delivery History",

      path:
        "/delivery/history",

      icon:
        FaHistory,
    },

    {
      label:
        "Performance",

      path:
        "/delivery/performance",

      icon:
        FaChartLine,
    },

    {
      label:
        "Profile",

      path:
        "/delivery/profile",

      icon:
        FaUserCircle,
    },
  ];


  const employeeId =
    user
      ?.deliveryAgentProfile
      ?.employeeId ||
    "Delivery Agent";


  const isAvailable =
    user
      ?.deliveryAgentProfile
      ?.isAvailable !==
    false;


  return (
    <div className="delivery-app-shell">

      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <aside className="delivery-sidebar">

        {/* BRAND */}

        <div className="delivery-sidebar-brand">

          <div className="delivery-sidebar-logo">
            N
          </div>


          <div>

            <strong>
              NovaCart
            </strong>

            <span>
              Delivery Agent
            </span>

          </div>

        </div>


        {/* AGENT SUMMARY */}

        <div className="delivery-sidebar-agent">

          <div className="delivery-sidebar-avatar">

            {String(
              user?.name ||
                "D"
            )
              .charAt(0)
              .toUpperCase()}

          </div>


          <div>

            <strong>
              {user?.name ||
                "Delivery Agent"}
            </strong>

            <span>
              {employeeId}
            </span>

          </div>

        </div>


        {/* AVAILABILITY */}

        <div
          className={`delivery-sidebar-availability ${
            isAvailable
              ? "available"
              : "unavailable"
          }`}
        >

          <span className="delivery-availability-dot" />

          {isAvailable
            ? "Available"
            : "Unavailable"}

        </div>


        {/* NAVIGATION */}

        <nav className="delivery-sidebar-nav">

          {navigationItems.map(
            ({
              label,
              path,
              icon:
                Icon,
              end,
            }) => (
              <NavLink
                key={
                  path
                }
                to={
                  path
                }
                end={
                  end
                }
                className={({
                  isActive,
                }) =>
                  `delivery-sidebar-link ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
              >

                <Icon />

                <span>
                  {
                    label
                  }
                </span>

              </NavLink>
            )
          )}

        </nav>


        {/* LOGOUT */}

        <div className="delivery-sidebar-footer">

          <button
            type="button"
            className="delivery-sidebar-logout"
            onClick={
              handleLogout
            }
          >

            <FaSignOutAlt />

            <span>
              Logout
            </span>

          </button>

        </div>

      </aside>


      {/* ======================================================
          MAIN AREA
      ====================================================== */}

      <div className="delivery-main-wrapper">

        {/* TOP BAR */}

        <header className="delivery-topbar">

          <div>

            <span className="delivery-topbar-label">
              Delivery Portal
            </span>

            <strong>
              Welcome,{" "}
              {user?.name ||
                "Agent"}
            </strong>

          </div>


          <div className="delivery-topbar-profile">

            <div>

              <strong>
                {user?.name ||
                  "Delivery Agent"}
              </strong>

              <span>
                {employeeId}
              </span>

            </div>


            <div className="delivery-topbar-avatar">

              {String(
                user?.name ||
                  "D"
              )
                .charAt(0)
                .toUpperCase()}

            </div>

          </div>

        </header>


        {/* PAGE CONTENT */}

        <div className="delivery-page-content">

          <Outlet />

        </div>

      </div>

    </div>
  );
};


export default DeliveryLayout;