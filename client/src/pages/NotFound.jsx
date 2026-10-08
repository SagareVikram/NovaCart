import {
  FaArrowLeft,
  FaHome,
  FaSearch,
  FaShoppingBag,
} from "react-icons/fa";

import {
  Link,
  useNavigate,
} from "react-router-dom";

const NotFound = () => {
  const navigate =
    useNavigate();

  return (
    <main className="not-found-page">
      <section className="not-found-section">
        <div className="container">
          <div className="not-found-layout">
            <div className="not-found-visual">
              <div className="not-found-number">
                4
                <span>
                  0
                </span>
                4
              </div>

              <div className="not-found-shopping-icon">
                <FaShoppingBag />
              </div>
            </div>

            <div className="not-found-content">
              <span className="section-eyebrow">
                Page Not Found
              </span>

              <h1>
                Looks Like This Page
                Left the Cart
              </h1>

              <p>
                The page you are trying to
                access does not exist, may have
                been moved, or the link may be
                incorrect.
              </p>

              <div className="not-found-actions">
                <Link
                  to="/"
                  className="primary-button"
                >
                  <FaHome />

                  Go to Home
                </Link>

                <Link
                  to="/products"
                  className="secondary-button"
                >
                  <FaSearch />

                  Browse Products
                </Link>

                <button
                  type="button"
                  className="not-found-back-button"
                  onClick={() =>
                    navigate(-1)
                  }
                >
                  <FaArrowLeft />

                  Go Back
                </button>
              </div>

              <div className="not-found-help">
                <strong>
                  Looking for something?
                </strong>

                <div className="not-found-links">
                  <Link to="/products">
                    Shop
                  </Link>

                  <Link to="/wishlist">
                    Wishlist
                  </Link>

                  <Link to="/cart">
                    Cart
                  </Link>

                  <Link to="/my-orders">
                    My Orders
                  </Link>

                  <Link to="/contact">
                    Contact
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default NotFound;